
package network;
import network.Client;

class AARECNetBuf
{
	public var time : Float;
	public var data : Array<UInt>;
	
	public function new()
	{
		time = 0;
		data = [];
	}
}

class AARECNet
{
	public var time : Float;
	public var newTime : Float;
	
	public var file : haxe.io.Input;
	public var loaded : Array<AARECNetBuf>;
	private var lastTime : Float;
	public var curr : UInt;
	
	public function new( f : haxe.io.Input )
	{
		time = 0;
		loaded = [];
		
		file = f;
		
		lastTime = 0;
	}
	
	public function bufferLines( lines : UInt ) : Bool
	{
		for( i in 0...lines )
		{
			var line = file.readUntil("\n".charCodeAt(0));
			
			var split = line.split(" ");
			
			switch(split[0])
			{
				case "T":
				{
					lastTime = Std.parseInt( split[1] ) + ( Std.parseInt( split[2] ) / 1e6 );
				}
				
				case "READ":
				{
					if( split[1] != "-1" )
					{
						var line = file.readUntil("\n".charCodeAt(0));
						var split = line.split(" ");
						
						var b = new AARECNetBuf();
						for( i in 1...(split.length) )
						{
							b.data.push(Std.parseInt(split[i])%255);
						}
						b.time = lastTime;
						loaded.push(b);
					}
				}
			}
			
		}
		
		return true;
	}
	public function bufferData( toDesc : Int )
	{
		var i = loaded.length;
		bufferLines(100);
		
		for( x in i...(loaded.length) )
		{
			// TODO
		}
	}
	
	public function update( newnewTime : Float )
	{
		newTime = newnewTime;
		if( curr >= loaded.length )
		{
			bufferLines(128);
		}
	}
	
	public function recv( s : Client, maxlen : Int )
	{
		var i = 0;
		if( curr < loaded.length && newTime >= time )
		{
			for( x in loaded[curr].data )
			{
				if( maxlen <= i ) break;
				s.buf.set((i++), x);
			}
			time = loaded[curr].time;
			curr++;
		}
		return i;
	}
}
