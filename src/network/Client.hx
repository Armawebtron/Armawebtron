package network;

import sys.net.*;

#if !noOpenFL
import openfl.Lib;
#end


import network.Message;
import network.objects.*;
import network.core.Base;
import network.NetMode;
import network.AARECNet;

import game.Object;
import game.Game;
import game.Player;
import GameCore;


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
	public var msgsOut : Map<UInt, Message>;
	
	public var done : Bool;
	
	public var inRate : UInt;
	public var usePB : Bool;
	
	public var eatObjErr : Bool;
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
		
		eatObjErr = false;
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
			
			case aarec( playback ):
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
			msgsOut[n.id] = n;
			n.time = Lib.getTimer();
		}
		
		var smsg = n.get();
		
		//trace( smsg.length );
		smsg.set( smsg.length-1, clientID );
		
	#if(!js)
		
		switch( connection )
		{
			case udp( hostStr, port ):
			{
				
				for( x in 0...times )
				{
					socket.output.write( smsg );
				}
				socket.output.flush();
			}
			
			default:
		}
		
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
		switch( connection )
		{
			case udp(h,p):
			{
				var len = try socket.input.readBytes( buf, 0, 16384 ) catch(e) 0;
				return recv_buf(len);
			}
			
			case ws(h,p,s):
			{
			}
			
			case aarec( playback ):
			{
				var len = playback.recv(this, 16384);
				return recv_buf(len);
			}
		}
		
	#else
	#end
		
		return false;
	}
	
	private function recv_buf( len : Int )
	{
		//var len = socket.input.readBytes( buf, 0, 6 );
		
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
				var id : UInt;
				while(!msg.end())
				{
					id = msg.getShort();
					
					if( this.msgsOut[id] != null )
					{
						// TODO: calculate ping
						
						this.msgsOut[id] = null;
					}
				}
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
			
			case Descriptor.loginDeny:
			{
				var reason = msg.getStr();
				
				done = true;
			}
			
			case Descriptor.config:
			{
				if( game != null )
				{
					game.readConfig( msg );
				}
			}
			
			case Descriptor.chatMessage:
			{
				if( game != null )
				{
					game.consoleMessage(msg.getStr());
				}
			}
			
			case Descriptor.consoleMessage:
			{
				if( game != null )
				{
					game.consoleMessage(msg.getStr());
				}
			}
			
			case Descriptor.centerMessage:
			{
				var str = msg.getStr();
				var timeout = 5000;
				if( !msg.end() ) timeout = msg.getInt();
				
				if( game != null )
				{
					game.eToSend.push( t_cen( 0, str, timeout/1000.0, 1 ) );
				}
			}
			
			case Descriptor.objSync:
			{
				var objid = msg.getShort();
				var obj : NetObject = netObjs[objid];
				
				if( obj != null )
				{
					obj.readNet( msg, 0 );
				}
				else if( !this.eatObjErr )
				{
					if( game != null )
					{
						game.consoleMessage("Ignoring sync for unrecieved network object "+objid);
					}
					trace("Ignoring sync for unrecieved network object "+objid);
				}
			}
			
			default:
			{
				for( type in Descriptor.obj.keys() )
				{
					if( Descriptor.obj[type] == msg.descriptor )
					{
						trace(type);
						var obj : NetObject = null;
						switch( type )
						{
							case "game": if( game != null ) obj = game;
							case "timer": if( game != null ) obj = new NetTimer( game );
							case "player": obj = new Player();
							case "player_ai":
							{
								obj = new Player();
								//obj.isAI = true;
							}
							case "cycle": if( game != null ) obj = new Cycle( game );
							//case "cycleWall": obj = new CycleWall();
						}
						
						if( obj == null )
						{
							break;
							// this shouldn't be needed
							obj = new BaseObject();
						}
						
						if( obj != null )
						{
							obj.readNetInit( msg, 0, game );
							netObjs[obj.netid] = obj;
						}
					}
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
		var msg = new Message( Descriptor.wantObjs );
		this.send( msg );
	}
	
	public function customHandler( msg : Message )
	{
		return false;
	}
}

