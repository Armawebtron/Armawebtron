
class nMessage
{
	end() { return ( this.bufpos >= this.len*2 ); }
	
	constructor(descriptor,id=false,alloc=false)
	{
		this.len = 0;
		
		this.id = id;
		this.bufpos = 0;
		this.clientID = 0;
		
		switch(typeof(descriptor))
		{
			case "number":
				this.buf = (alloc!==false)?(new Uint8Array(alloc)):(new Array());
				this.descriptor = descriptor;
				break;
			
			case "object":
				this.buf = descriptor;
				this.getHeader();
				break;
			default:
				this.buf = Buffer.from(descriptor);
				this.getHeader();
				break;
		}
	}
	
	Expandable() { this.buf = Array.from(this.buf); return this;}
	Nonexpandable() { this.buf = Uint8Array.from(this.buf); return this;}
	Alloc(alloc)
	{
		var buf = this.buf;
		this.buf = new Uint8Array(alloc);
		this.buf.set(buf, 0);
		
		return this;
	}
	
	pushChar(c)
	{
		this.buf[this.bufpos++] = c;
		
		return this;
	}
	pushShort(s)
	{
		return this.pushChar(s>>8&0xff).pushChar(s&0xff);
	}
	pushBool(bool)
	{ 
		return this.pushShort(Boolean(bool));
	}
	pushInt(int)
	{
		var a = int&0xffff;
		return this.pushShort(a).pushShort(int-a>>16);
	}
	pushFloat(f)
	{
		const MANT = 26;
		const EXP = (32-MANT);
		const MS = (MANT-1);
		
		var y = f;
	
		var negative = 0;
		if( y < 0 )
		{
			y = -y;
			negative = 1;
		}
		
		var exp = 0;
		while ( Math.abs(y) >= 64 && exp < (1<<EXP)-6 )
		{
			exp += 6;
			y /= 64;
		}
		while ( Math.abs(y) >= 1 && exp < (1<<EXP)-1 )
		{
			++exp;
			y /= 2;
		}
		
		var mant = Math.floor(y*(1<<MS));
		// now x=mant*2^exp * (1/ (1<<MANT))

		// cutoffs:
		if( mant > ((1<<MS))-1 )
		{
			mant = (1<<MS)-1;
		}

		if( exp > (1<<EXP)-1 )
		{
			$exp = (1<<EXP)-1;
			if( mant > 0 )
			{
				mant = (1<<MS)-1;
			}
		}

		// put them together:
		this.pushInt( mant & ((1<<MS)-1) | (negative << MS) | (exp << MANT) );
		
		return this;
	}
	pushString(str) { return this.pushStr(str); };
	pushStr(str)
	{
		if(typeof(str) != "string") str += '';
		//if(str.length == 0) str = " ";
		if(str.length == 0)
		{
			//FIXME
			this.pushShort(0).pushShort(0);
			this.bufpos -= 2;
			return this;
		}
		var len = str.length+1;
		this.pushShort(len);
		//if(str.length == 0) str = String.fromCharCode(0);
		//if(str.length == 0) len = 0;
		var i,c1,c2;
		for(i=0;i+1<len;i+=2)
		{
			c1 = str.charCodeAt(i)|0;
			c2 = str.charCodeAt(i+1)|0;
			if(c1 > 127) { c2 += 255; c2 %= 256; }
			this.pushShort((c2<<8)|c1);
			//this.pushChar(c2).pushChar(c1);
		}
		if(i < len) this.pushShort(0);
		
		return this;
	}
	get()
	{
		this.len = Math.ceil((this.buf.length)/2);
		//if(this.len%2 == 0) ++this.len;

		var n = new nMessage(0,0,(this.len*2)+8);
		n.pushShort(this.descriptor);
		n.pushShort(this.id).pushShort(this.len);
		n.buf.set(this.buf, 6);
		return Buffer.from(n.buf);
	}
	
	getHeader()
	{
		this.descriptor = this.getShort();
		this.id = this.getShort();
		this.len = this.getShort();
		console.debug("desc:",this.descriptor," id:",this.id," len:",this.len);
		
		this.buf = Buffer.from(this.buf.slice(this.bufpos, this.bufpos+(this.len*2)));
		this.bufpos = 0;
	}
	getChar()
	{
		return this.buf[this.bufpos++];
	}
	getShort()
	{
		var a = this.getChar(), b = this.getChar();
		return (a<<8)|b;
	}
	getInt()
	{
		var a = this.getShort(), b = this.getShort();
		return (b<<16)|a;
	}
	getFloat()
	{
		var trans = this.getInt();
		var mant = trans & (1 << 25) - 1;
		var negative = trans & 1 << 25;
		var exp = trans - mant - negative >> 26;
		var x = mant / (1 << 25);
		if (negative) x = -x;
		while( exp >= 6 )
		{
			exp -= 6;
			x *= 64.0;
		}
		while( exp > 0 )
		{
			--exp;
			x *= 2.0;
		}
		return x;
	}
	getBool()
	{
		return this.getShort()!=0;
	}
	getStr() { return this.getString(); }
	getString()
	{
		var len = Math.ceil(this.getShort()/2);
		var c1,c2,str="";
		for(var i=len-1;i>=0;--i)
		{
			c2 = this.getChar(); c1 = this.getChar();
			if(c1) 
			{
				str += String.fromCharCode(c1);
				if(c2) 
					str += String.fromCharCode(c2);
			}
		}
		return str;
	}
}
nMessage._BEGIN = 0;

// basic validity checks
{
	var t = new nMessage(0,0);
	let s = t.bufpos;
	
	t.pushStr("hello");
	t.bufpos = s;
	console.assert("hello" == t.getStr(), "Strings do not match...");
	
	t.bufpos = s;
	t.pushInt(65521);
	t.bufpos = s;
	console.assert(65521 == t.getInt(), "Integers do not match...");
	
	t.bufpos = s;
	t.pushInt(-20000000);
	t.bufpos = s;
	console.assert(-20000000 == t.getInt(), "Negative integers do not match...");
	
	t.bufpos = s;
	t.pushFloat(6.25);
	t.bufpos = s;
	console.assert(6.25 == t.getFloat(), "Floats do not match...");
	
	t.bufpos = s;
	t.pushFloat(-1);
	var t2 = new nMessage(t.get());
	console.assert(-1 == t2.getFloat(), "Negative floats do not match...");
	
	delete s;
	delete t2;
	delete t;
}

module.exports = nMessage;
