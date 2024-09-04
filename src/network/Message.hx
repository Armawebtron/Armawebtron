package network;

class Message
{
	public function end()
	{
		return ( this.bufpos >= this.len*2 );
	}
	
	public var len : UInt;
	public var id : UInt;
	
	public var descriptor : UInt;
	
	public var buf : haxe.io.Bytes;
	public var bufpos : UInt;
	
	public var header : UInt;
	
	public function new(desc : Dynamic, i : UInt = null, alloc : Int = 0 )
	{
		len = 0;
		id = i;
		
		bufpos = 0;
		header = 0;
		
		switch( Type.typeof( desc ) )
		{
			case TInt:
			{
				if( alloc != 0 )
				{
					// malloc and initalize
					this.buf = haxe.io.Bytes.alloc( alloc );
					this.buf.fill( 0, alloc, 0 );
				}
				else
				{
					this.buf = haxe.io.Bytes.alloc( 128 );
					this.buf.fill( 0, 128, 0 );
				}
				this.descriptor = desc;
			}
			case TClass(haxe.io.Bytes):
			{
				this.buf = desc;
				this.getHeader();
			}
			default:
			{
				this.buf = haxe.io.Bytes.ofData(desc);
				this.getHeader();
			}
		}
	}
	
	public function alloc(alloc : UInt) : Message
	{
		var oldBuf : haxe.io.Bytes = buf;
		buf = haxe.io.Bytes.alloc( alloc );
		//buf.set(oldBuf, 0);
		
		buf.blit( 0, oldBuf, 0, Std.int( Math.min( oldBuf.length, buf.length ) ) );
		
		if( alloc > oldBuf.length )
		{
			this.buf.fill( oldBuf.length, alloc - oldBuf.length, 0 );
		}
		return this;
	}
	
	public function pushChar( c : UInt )
	{
		if( this.bufpos > this.buf.length )
		{
			this.alloc( this.buf.length * 2 );
		}
		
		this.buf.set(this.bufpos++, c);
		
		return this;
	}
	
	public function pushShort( s : UInt )
	{
		return this.pushChar(s>>8&0xff).pushChar(s&0xff);
	}
	
	public function pushBool( bool : Bool )
	{
		return this.pushShort( bool ? 1 : 0 );
	}
	
	public function pushInt( int : Int )
	{
		var a = int&0xffff;
		return this.pushShort(a).pushShort(int-a>>16);
	}
	
	static inline var MANT = 26;
	static inline var EXP = (32-MANT);
	static inline var MS = (MANT-1);
	public function pushFloat( f : Float )
	{
		var y : Float = Math.abs( f );
		var neg = ( f < 0 ) ? 1 : 0 ;
		var exp : Int = 0;
		
		while( y >= 64 && exp < (1<<EXP)-6 )
		{
			exp += 6;
			y /= 64;
		}
		
		while( y >= 1 && exp < (1<<EXP)-1 )
		{
			exp++;
			y /= 2;
		}
		
		var mant : Int = Std.int(Math.round( y * (1<<MS) ));
		
		// clamp values
		mant = Std.int(Math.min( mant, (1<<MS)-1 ));
		exp = Std.int(Math.min( exp, (1<<EXP)-1 ));
		
		// put them together:
		this.pushInt( mant & ((1<<MS)-1) | (neg << MS) | (exp << MANT) );
		
		return this;
	}
	
	public inline function pushString( str : String ) { return this.pushStr(str); }
	
	public function pushStr( str : String )
	{
		var r : Int;
		
		var len = str.length;
		
		if( len == 0 )
		{
			//FIXME
			pushShort(0).pushShort(0);
			this.bufpos -= 2;
			return this;
		}
		
		++len;
		this.pushShort(len);
		
		var i : Int = 0, c1 : Int, c2 : Int;
		while( (i+1) < len )
		{
			c1 = str.charCodeAt(i)|0;
			c2 = ( i+2 != len ) ? str.charCodeAt(i+1)|0 : 0;
			
			if(c1 > 127) { c2 += 255; c2 %= 256; }
			
			this.pushShort((c2<<8)|c1);
			
			i += 2;
		}
		if(i < len) this.pushShort(0);
		
		return this;
	}
	
	
	public function get()
	{
		this.len = Math.ceil(this.bufpos/2);
		
		var n = new Message(0,0,(this.len*2)+8-this.header);
		n.pushShort(this.descriptor);
		n.pushShort(this.id).pushShort(this.len);
		//n.buf.fill( bufpos - header - 2, 2, 0 );
		n.buf.blit( 6, this.buf, this.header, this.bufpos-this.header );
		
		return n.buf;
	}
	
	public function getHeader()
	{
		this.descriptor = this.getShort();
		this.id = this.getShort();
		this.len = this.getShort();
		header = bufpos;
	}
	
	public function getChar()
	{
		if( this.bufpos > this.buf.length ) return 0;
		return this.buf.get(this.bufpos++);
	}
	
	public function getShort() : UInt
	{
		var a = this.getChar();
		var b = this.getChar();
		
		return (a<<8)|b;
	}
	
	public function getInt() : Int
	{
		var a = this.getShort();
		var b = this.getShort();
		
	#if( python )
		return python.Syntax.code( "(((b<<16)|a)%2147483648)-2147483648" );
	#else
		return (b<<16)|a;
	#end
	}
	
	public function getFloat() : Float
	{
		var trans = this.getInt();
		
		var mant = trans & (1 << 25) - 1;
		var negative = trans & 1 << 25;
		var exp = trans - mant - negative >> 26;
		var x : Float = mant / (1 << 25);
		
		if( negative != 0 ) x = -x;
		
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
	
	public inline function getBool() : Bool
	{
		return ( this.getShort() != 0 );
	}
	
	public inline function getStr() { return this.getString(); }
	
	public function getString()
	{
		var len = Math.ceil(this.getShort()/2);
		
		var c1, c2;
		var str = "";
		
		for( i in 0...len )
		{
			c2 = this.getChar(); c1 = this.getChar();
			if( c1 != 0 ) 
			{
				str += String.fromCharCode(c1);
				if( c2 != 0 ) 
				{
					if( c1 > 0x7f )
					{
						// needed to deal with characters causing
						// the next character to be the wrong char
						c2 = (c2+1)%0x100;
					}
					str += String.fromCharCode(c2);
				}
			}
		}
		return str;
	}
	
	
	static public function autoFrom( buf : Dynamic, offset : UInt = 0 )
	{
		var desc = ((buf.length-offset)>=2)?(((buf.get(offset))<<8)|(buf.get(offset+1))):0;
		
		if( buf.length >= 4 )
		{
			var newSize = 6+((((buf.get(offset+4))<<8)|(buf.get(offset+5)))*2);
			if( newSize > buf.length )
			{
				trace("Packet is claimed to be larger than read buffer!", newSize);
				return null;
			}
			var buf2 = haxe.io.Bytes.alloc( newSize );
			buf2.blit( 0, buf, offset, Std.int( Math.min( buf.length, buf2.length ) ) );
			buf = buf2;
		}
		
		var n : Message = null;
		//if( desc&(1<<15) )
		//else
			n = new Message(buf);
		
		return n;
	}
}
