package network;

import sys.net.*;


import network.Message;
import network.objects.*;
import network.core.Base;
import network.NetMode;

import game.Game;


class Client extends NetBase
{
	public var connection : NetMode;
#if( !js )
	public var socket : Socket;
	public var host : Host;
#else
#end
	
	public var clientID : UInt;
	public var buf : haxe.io.Bytes;
	
	public var msgsToAck : Array<UInt>;
	public var msgsIn : Map<UInt, Float>;
	public var msgsOut : Map<UInt, Float>;
	
	public var done : Bool;
	
	public var inRate : UInt;
	public var usePB : Bool;
	
	public var challenge : Bool;
	
	public var game : Game;
	
	public function new( c : NetMode, g : Game = null )
	{
		super();
		
		clientID = 0;
		
		msgsToAck = [];
		msgsIn = [];
		msgsOut = [];
		
		game = g;
		
		challenge = false;
		
		// some defaults
		inRate = 512;
		usePB = false;
		
		connection = c;
		buf = haxe.io.Bytes.alloc(16384);
		
		switch( connection )
		{
			case udp( hostStr, port ):
			{
			#if( !js )
				host = new Host( hostStr );
				
				socket = new UdpSocket();
				socket.connect( host, port );
				socket.setBlocking(false);
			#end
			}
			
			case ws( host, port, ssl ):
			{
				
			}
		}
	}
	
	public function getInfo()
	{
		this.send(new Message( Descriptor.getServerInfo, 0 ));
	}
	
	public function connect()
	{
		var msg = new Message( Descriptor.login2, 0 );
		
		msg.pushShort(inRate); // rate
		msg.pushShort(0); // bigbrother, technically a string
		
		// version min/max
		// 20 is highest non-protobuf
		msg.pushInt(0).pushInt(usePB?23:20);
		
		this.send(msg);
	}
	
	public function disconnect()
	{
		if( this.clientID != 0 )
		{
			this.send(new Message( Descriptor.logout, 0, 0 ), 3);
		}
		done = true;
	}
	
	public function send( n : Message, times : UInt = 1 )
	{
		if( n.id != 0 )
		{
			//msgsOut[n.id] = 
		}
		
		var smsg = n.get();
		
		//trace( smsg.length );
		smsg.set( smsg.length-1, clientID );
		
	#if(!js)
		
		for( x in 0...times )
		{
			socket.output.write( smsg );
		}
		socket.output.flush();
	#end
	
		//msgsOut[n.id] = 
	}
	
	public function run()
	{
		var r = recv();
		if( r ) sendAcks();
	}
	
	public function recv()
	{
	#if(!js)
		//var len = socket.input.readBytes( buf, 0, 6 );
		var len = try socket.input.readBytes( buf, 0, 16384 ) catch(e) 0;
		//trace(socket.input.readByte());
		if( len > 0 )
		{
			//trace(len);
			
			var m = Message.autoFrom(buf);
			if( m == null ) return false;
			
			//m.alloc( m.len * 2 + 16 );
			//trace( m.len, m.descriptor, m.id );
			
			//var len = socket.input.readBytes( m.buf, 6, m.len * 2 );
			//trace(socket.input.readByte());
			
			if( len > (m.len*2) )
			{
				// interpret multiple messages caught by the same hook
				
				var offset = 0;
				var sizeRemaining = len;
				
				do
				{
					if( m.descriptor != 0 )
					{
						this.handler(m);
					}
					offset += 6+(m.len*2);
					sizeRemaining -= 6+(m.len*2);
					
					m = Message.autoFrom(buf, offset);
					if( m == null ) break;
				}
				while( sizeRemaining >= 6 );
			}
			else
			{
				this.handler(m);
			}
			
			return true;
		}
	#else
	#end
		
		return false;
	}
	
	public function sendAcks()
	{
		var idmsg = new Message( Descriptor.ack, 0 ); //, 2*that.msgsToAck.length
		for( i in this.msgsToAck ) { idmsg.pushShort( i ); }
		this.send(idmsg);
		this.msgsToAck.splice( 0, this.msgsToAck.length );
		
		if( challenge ) { challenge = false; this.connect(); }
	}
	
	public function handler( msg : Message )
	{
		//trace( e.buf.length, e.descriptor, e.id );
		if( msg.id > 0 )
		{
			msgsToAck.push(msg.id);
			//msgsIn[msg.id] = 
		}
		
		if( customHandler( msg ) ) return;
		
		switch( msg.descriptor )
		{
			case Descriptor.ack:
			{
				
			}
			
			case Descriptor.serverInfo:
			{
				var port = msg.getInt();
				var host = msg.getStr();
				
				var name = msg.getStr();
				
				var numPlayers = msg.getInt();
				
				var versMin = msg.getInt();
				var versMax = msg.getInt();
				
				var version = msg.getStr();
				
				var maxPlayers = msg.getInt();
				
				var players = msg.getStr().split("\n");
				//if(!players[players.length-1]) --players.length;
				
				var description = msg.getStr();
				var url = msg.getStr();
				
				var playerGIDs = msg.getStr().split("\n");
				
				onServerInfo( name, host, port, version, numPlayers, maxPlayers, description, url, players, playerGIDs );
			}
			
			case Descriptor.loginAccept:
			{
				if( clientID != 0 )
				{
					trace("Login accept recieved from server, but we're already connected...");
				}
				else
				{
					this.clientID = msg.getShort();
					
					msg.getInt(); msg.getInt();
					
					onConnect();
				}
			}
		}
	}
	
	// ah, yes, the ideal number of parameters
	public function onServerInfo( 
		name: String, 
		host: String, port: UInt, 
		version: String,
		numPlayers: UInt, maxPlayers: Int, 
		description: String, url: String,
		players: Array<String>, playerGIDs: Array<String> )
	{
		// override this with something that extends this class
	}
	
	public function onConnect()
	{
		
	}
	
	public function customHandler( msg : Message )
	{
		return false;
	}
}

