/*
 * Armawebtron - A lightcycle game.
 * Copyright (C) 2019-2022 Glen Harpring
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */


const dgram = require("dgram");
const nMessage = require("./arma/nMessage.js");
const { nMessageProto } = require("./arma/nMessage.js");


const _arma_CLIENTS = 64;
const _arma_MAXIDS = 65535;

const arma_versions = Float64Array.of(
	0.20,  // 0
	0.20,  // 1
	0.25,  // 2
	0.26,  // 3
	0.27,  // 4
	0.28,  // 5
	0.28,  // 6
	0.28,  // 7
	0.28,  // 8
	0.28,  // 9
	0.28,  // 10
	0.28,  // 11
	0.281, // 12
	0.282, // 13
	0.283, // 14
	0.283, // 15
	0.283, // 16
	0.29,  // 17
	0.29,  // 18
	0.29,  // 19
	0.31,  // 20
	// protobuf after
	0.32,  // 21
	0.40,  // 22
);


const _arma_ack = 1;


const _arma_getServerInfo = 53;

const _arma_serverInfo = 51;

const _arma_getServerInfoSmall = 52;

const _arma_serverInfoSmall = 50;


const _arma_wantObjs = 25;

const _arma_objSync = 24;

const _arma_objDestroy = 22;

const _arma_obj = {
	timer    : 210,
	game     : 310,
	player   : 201,
	player_ai: 330,
	team     : 220,
	team_ai  : 331,
	cycle    : 320,
	zone     : 340,
	zoneCirc : 350,
	zonePoly : 360,
};


const _arma_sync = 28;

const _arma_syncAck = 27;


const _arma_gameStateSync = 311;

const _arma_gameState = {
	created     : 0,
	transfer    : 7,
	create_grid : 10,
	create_obj  : 20,
	transfer_obj: 30,
	camera      : 35,
	sync1       : 40,
	sync2       : 41,
	sync3       : 42,
	playing     : 50,
	delete_obj  : 60,
	delete_grid : 70,
	max_state   : 80,
};


const _arma_requestID = 21;

const _arma_haveID = 20;


const _arma_login1 = 11;

const _arma_login2 = 6;

const _arma_loginAccept = 5;

const _arma_loginDeny = 3;

const _arma_logout = 7;



const _arma_config = 60;


const _arma_newPlayer = 201;

const _arma_removePlayer = 202;

const _arma_wantTeamChange = 23;


const _arma_cycleEvent = 321;

const _arma_chat = 200;


const _arma_consoleMessage = 8;

const _arma_chatMessage = 203;

const _arma_centerMessage = 9;

const _arma_fullscreenMessage = 312;


const _arma_3dc = 1001;



class ArmaNetBase
{
	constructor()
	{
		//this.usedIDs = {};
		this.usedIDs = new Array(_arma_MAXIDS);
		this.gameState = 0;
	}
	
	hasType(t) //! find first message of type t
	{
		for(var i=_arma_CLIENTS;i<_arma_MAXIDS;++i)
		{
			if( this.usedIDs[i] && this.usedIDs[i].type == t )
			{
				return i;
			}
		}
		return false;
	}
	/*
	hasObj(obj) //! find first instance of object
	{
		for(var i in this.usedIDs)
		{
			if( this.usedIDs[i].obj == obj )
			{
				return i;
			}
		}
		return false;
	}
	*/
	hasObj(obj) //! find first instance of object
	{
		for(var i=_arma_CLIENTS;i<_arma_MAXIDS;++i)
		{
			if( this.usedIDs[i] && this.usedIDs[i].obj == obj )
			{
				return i;
			}
		}
		return false;
	}
	useObj(obj) //! assign an object to an id
	{
		for(var i=_arma_CLIENTS;i<_arma_MAXIDS;++i)
		{
			if( !this.usedIDs[i] )
			{
				this.usedIDs[i] = {type:null, obj:obj};
				return i;
			}
		}
		return false;
	}
	
	recvObj(obj, msg, full=false)
	{
		switch(obj.type)
		{
			case _arma_obj.player:
			case _arma_obj.player_ai:
				
				//obj.msg = msg;
				
				if(full)
				{
					if(!obj.obj)
					{
						obj.obj = {};
					}
				}
				
				var r = msg.getShort(), g = msg.getShort(), b = msg.getShort();
				
				obj.obj.pingCharity = msg.getShort();
				obj.obj.name = msg.getString();
				
				obj.obj.cycleColor = cycleColor(r,g,b);
				obj.obj.tailColor = color(r,g,b);
				
				obj.obj.ping = Math.round(msg.getFloat()*1000);
				
				var flags = msg.getShort();
				obj.obj.chatting = Boolean(flags&1);
				obj.obj.spectating = Boolean(flags&2);
				
				var score = Math.round(msg.getFloat()*1000);
				if(obj.obj.score != score) 
				{
					if(obj.obj.setScore) obj.obj.setScore(score);
					else obj.obj.score = score;
				}
				
				msg.getBool();  //newdisc
				
				if(full)
				{
					if(!(obj.obj instanceof Player))
					{
						//this.usedIDs.indexOf(obj)
						obj.obj = new Player(obj.obj);
						if(obj.ownerid == this.netid)
						{
							engine.activePlayer = this.netid;
							engine.players[obj.ownerid] = obj.obj;
						}
						else
						{
							let i = 0;
							for(;i<=engine.playersById.length;++i)
							{
								if( i != this.netid && !engine.playersById[i] )
								{
									break;
								}
							}
							console.debug("Assign player ID "+i);
							engine.players[i] = obj.obj;
						}
					}
				}
				
				break;
			
			case _arma_obj.cycle:
				//var ownerID = msg.getShort();
				var ownerID = obj.ownerid;
				//var o = this.usedIDs[ownerID];
				
				var r,g,b;
				
				if(full)
				{
					obj.playerid = msg.getShort();
					msg.getShort();
					
					if(obj.ownerid == this.netid) this.cycleID = this.usedIDs.indexOf(obj);
					
					// gCycle colors are transmitted as floats for some reason
					r = msg.getFloat()*15; g = msg.getFloat()*15; b = msg.getFloat()*15;
				}
				
				var o;
				for(let i=0;i<_arma_MAXIDS;++i)
				{
					if( this.usedIDs[i] && this.usedIDs[i].ownerid == ownerID )
					{
						//console.log(this.usedIDs[i].type);
						if( this.usedIDs[i].type == _arma_obj.player || this.usedIDs[i].type == _arma_obj.player_ai )
						{
							o = this.usedIDs[i];
						}
					}
				}
				
				if(!o)
				{
					engine.console.print("Got cycle belonging to nonexistant owner ID "+ownerID+"\n");
					console.error("Got cycle belonging to nonexistant owner ID", ownerID);
					break;
				}
				
				obj.owner = o.obj;
				obj.obj = o.obj.model;
				
				var cycle = obj.owner;
				
				if(r !== undefined)
				{
					cycle.cycleColor = cycleColor(r,g,b);
					cycle.tailColor = color(r,g,b);
				}
				
				cycle.gtime = msg.getFloat()*1e3;
				
				// direction
				var xdir = msg.getFloat();
				var ydir = msg.getFloat();
				
				var oldDir = cycle.rotation.z, newDir = Math.atan2(ydir, xdir);
				
				// position
				if(!cycle.newPos) cycle.newPos = new THREE.Vector2(cycle.position.x,cycle.position.y);
				cycle.newPos.x = msg.getFloat();
				cycle.newPos.y = msg.getFloat();
				cycle.newPos.real = cycle.newPos.clone();
				
				// speed
				cycle.speed = msg.getFloat();
				
				// alive
				var alive = msg.getBool();
				if( alive != cycle.alive )
				{
					if(cycle.alive) cycle.killAt(cycle.newPos.x, cycle.newPos.y, 0);
					else cycle.spawn({ x: cycle.newPos.x, y: cycle.newPos.y, z: 0 }, cycle.gtime);
					delete cycle.newPos;
					cycle.turns = -1;
				}
				
				var newDist = msg.getFloat();
				var lastWallID = msg.getShort();
				var turnCount = msg.getShort();
				
				cycle.braking = msg.getBool();
				
				// last turn position
				var lastTurnX = msg.getFloat();
				var lastTurnY = msg.getFloat();
				
				
				if( turnCount > cycle.turns )
				{
					cycle.lastpos.x = cycle.position.x = lastTurnX;
					cycle.lastpos.y = cycle.position.y = lastTurnY;
					
					cycle.rotation.z = newDir;
					cycle.afterTurn(0);
					
					cycle.turns = turnCount;
					
					cycle.lastTurnTime = cycle.gtime;
				}
				else
				{
					if(!cycle.lastTurnPos) cycle.lastTurnPos = new THREE.Vector2();
					cycle.lastTurnPos.x = lastTurnX;
					cycle.lastTurnPos.y = lastTurnY;
				}
				
				
				
				// rubber usage
				cycle.rubber = (msg.getShort()/65535) * settings.CYCLE_RUBBER;
				
				msg.bufpos += 2; // eat unknown short
				
				// brake usage
				cycle.brakes = 1-(msg.getShort()/65535);
				
				msg.bufpos += 2; // eat unknown short
				
				break;
			
			
			case _arma_obj.timer:
				engine.syncGameTime = msg.getFloat()*1e3;
				engine.timemult = msg.getFloat();
				break;
			
			case _arma_obj.game:
				if(full)
				{
					if(!engine.playGame) game.play();
					game.pause();
				}
				
				var gameState = msg.getShort();
				
				if(gameState != this.gameState)
				{
					this.gameState = gameState;
					
					switch(gameState)
					{
						case _arma_gameState.delete_grid:
							if( inround()) game.endRound();
							break;
						
						case _arma_gameState.camera:
							if(!inround()) game.newRound();
							game.pause();
							break;
						
						case _arma_gameState.playing:
							game.unpause();
							break;
					}
				}
				
				if(this.send)
				{
					this.send((new nMessage(_arma_gameStateSync)).pushShort(this.gameState));
				}
				
				break;
		}
	}
	
	mkNetObj(obj, msg)
	{
		switch(obj.type)
		{
			case _arma_obj.player:
			case _arma_obj.player_ai:
				
				// color
				var c = guessColor( colorStr(obj.obj.cycleColor), colorStr(obj.obj.tailColor) );
				msg.pushShort(c[0]).pushShort(c[1]).pushShort(c[2]);
				
				// pingCharity
				msg.pushShort(0);
				
				// name
				msg.pushStr(obj.obj.name);
				
				// ping
				msg.pushFloat(obj.obj.ping/1e3);
				
				// flag
				var flag = 0;
				if(obj.obj.spectating) flag ^= 2;
				msg.pushShort(flag);
				
				// score
				msg.pushInt(obj.obj.score);
				
				// newdisc??
				msg.pushBool(false);
				
				// team
				// FIXME
				msg.pushShort(0).pushShort(0).pushInt(3).pushBool(true);
				
				break;
		}
	}
}

class ConnectionArma extends ArmaNetBase
{
	constructor(host,port=4534,)
	{
		super();
		
		this.port = port;
		
		this.eventCallback = {};
		
		this.conMsgBuf = "";
		
		this.msgID = 1;
		this.msgsOut = {};
		this.msgsIn = {};
		
		this.msgsToAck = [];
		
		this.onAck = {};
		
		this.isGameServer = true;
		
		
		
		if(typeof(host) === "object")
		{
			this.connection = host;
		}
		else
		{
			this.connection = dgram.createSocket("udp4");
			this.host = host;
			
			this.r = {address: host, port: port};
			
			var that = this;
			
			this.connection.on("message",function(rmsg,r)
			{
				//this.r = r;
				//console.log(r);
				
				var n = nMessage.AutoFrom(rmsg);
				
				if( r.size > (n.len*2) )
				{
					// hmm, so the server sends us multiple messages
					// as part of the same UDP packet?
					
					var offset = 0;
					var sizeRemaining = r.size;
					
					do
					{
						if(n.descriptor != 0)
						{
							that.handler(n);
						}
						offset += 6+(n.len*2);
						sizeRemaining -= 6+(n.len*2);
						//console.log(offset, sizeRemaining);
						
						n = nMessage.AutoFrom(rmsg.slice(offset));
					}
					while( sizeRemaining >= 6 );
				}
				else
				{
					that.handler(n);
				}
			});
			
			//
			
			//this.send(new nMessage( _arma_getServerInfo, 0 ));
		}
	}
	
	close()
	{
		if(this.elunload) document.removeEventListener("beforeunload", this.elunload);
		if(this.netid)
		{
			this.send(new nMessage( _arma_logout, 0, 0 ), 3);
		}
		var that = this;
		setTimeout(function(){that.connection.close()}, 100);
		return;
	}
	
	on(type, func)
	{
		if(!this.eventCallback[type])
		{
			this.eventCallback[type] = [];
		}
		this.eventCallback[type].push(func);
	}
	
	getInfo()
	{
		var r = this.r;
		this.r = {port: this.port, address: this.host};
		this.send(new nMessage( _arma_getServerInfo, 0 ));
		this.r = r;
	}
	connect()
	{
		var msg = new nMessage( _arma_login2, 0 );
		
		msg.pushShort(0x14); // rate
		msg.pushShort(0); // bigbrother, technically a string
		
		// version min/max
		// 20 is highest non-protobuf
		msg.pushInt(0).pushInt(settings.ARMA_PROTOBUF?23:20);
		
		this.send(msg);
		
		if( typeof(document) !== "undefined" )
		{
			var that = this;
			this.elunload = function() { that.close(); }
			document.addEventListener("beforeunload", this.elunload);
		}
	}
	
	send(data,times=1)
	{
		if(data instanceof nMessage)
		{
			var msg = data;
			
			//console.debug("outgoing", msg.descriptor, this.r.address, this.r.port);
			
			if(msg.id === false)
			{
				msg = new nMessage(msg.get());
				msg.id = (this.msgID++);
				if(this.msgID & 65536) this.msgID %= 65535;
				msg.time = performance.now();
			}
			
			if(msg.id && !this.msgsOut[msg.id])
			{
				this.msgsOut[msg.id] = msg;
				
				var that = this;
				setTimeout(function(){ if( that.msgsOut[msg.id] && that.netid !== -1 ) { that.send(msg); } }, 500);
			}
			
			var smsg = msg.get();
			smsg[smsg.length-1] = this.netid;
			
			times |= 0; // convert to int
			if(times < 0) times = 0;
			while(times--)
			{
				this.connection.send(smsg, this.r.port, this.r.address);
			}
			
			return msg;
		}
		else if(data.constructor == Object)
		{
			switch(data.type)
			{
				case "scoredata":
					//this.senddata(0);
					break;
				
				default:
				{
					console.log(data);
					
					this.send((new nMessage(_arma_3dc)).pushStr(JSON.stringify(data)));
				}
			}
		}
		else
		{
			console.log(data);
		}
	}
	
	handler(msg)
	{
		if(msg.id > 0)
		{
			//console.log("id",msg.id);
			
			//this.send((new nMessage( _arma_ack, 0, 2 )).pushShort( msg.id ));
			
			this.msgsToAck.push(msg.id);
			
			if(this.msgsToAck.length == 1)
			{
				var that = this;
				setTimeout(function()
				{
					if(that.msgsToAck.length == 0) return;
					console.log("Send acks");
					var idmsg = new nMessage( _arma_ack, 0 ); //, 2*that.msgsToAck.length
					for(var i of that.msgsToAck) { idmsg.pushShort( i ); }
					that.send(idmsg);
					that.msgsToAck.splice(0);
				},0);
			}
			
			if( this.msgsIn[msg.id] && (this.msgsIn[msg.id].time+9999) < performance.now() )
			{
				this.msgsIn[msg.id].time = performance.now();
				return;
			}
			
			this.msgsIn[msg.id] = {time: performance.now()};
		}
		
		//console.log(msg.descriptor);
		
		if(this.customHandler && this.customHandler(msg)) return;
		switch(msg.descriptor)
		{
			case _arma_ack:
			{
				var id;
				while(!msg.end())
				{
					id = msg.getShort();
					
					if(this.msgsOut[id])
					{
						this.pings += performance.now()-this.msgsOut[id].time; ++this.pingc;
						
						delete this.msgsOut[id];
					}
					
					if(this.onAck[id])
					{
						var that = this;
						setTimeout(function(){ let _=that.onAck[id]; delete that.onAck[id]; _(); }, 0);
					}
				}
				break;
			}
			
			
			case _arma_serverInfo:
			{
				var port = msg.getInt();
				var host = msg.getStr();
				
				var name = msg.getStr();
				
				//console.log(name);
				
				var numPlayers = msg.getInt();
				
				this.versMin = msg.getInt();
				this.versMax = msg.getInt();
				
				var version = msg.getStr();
				
				var maxPlayers = msg.getInt();
				
				var players = msg.getStr().split("\n");
				if(!players[players.length-1]) --players.length;
				
				var description = msg.getStr();
				var url = msg.getStr();
				
				var playerGIDs = msg.getStr().split("\n");
				for(var i=playerGIDs.length-1;i>=0;--i)
				{
					if(!playerGIDs[i]) delete playerGIDs[i];
				}
				
				let settings = {};
				
				var flags = msg.getInt();
				settings.authRequired = Boolean(flags&0x1);
				settings.defaultMap = !(flags&0x2);
				settings.teamPlay = Boolean(flags&0x4);
				
				settings.minPlayTimeTotal = msg.getInt();
				settings.minPlayTimeOnline = msg.getInt();
				settings.minPlayTimeTeam = msg.getInt();
				
				settings.cycleDelay = msg.getFloat(); // raw CYCLE_DELAY setting (or .05 if doublebinding is disabled)
				settings.accel = msg.getFloat(); // accel/speed
				
				// characteristic rubber number: rubber/(base speed*cycle_delay)
				// the number of times you can hump a wall without suiciding
				settings.rubberHump = msg.getFloat();
				
				// maximum ratio of time spent sitting on walls to total time
				settings.rubberHitRatio = msg.getFloat();
				
				// wall length in seconds relative to max speed
				settings.wallLengthTime = msg.getFloat();
				
				
				if( this.eventCallback["info"] )
				{
					this.eventCallback["info"].forEach(function(f)
					{
						f({
							host: host,
							port: port,
							
							name: name,
							description: description,
							url: url,
							
							numPlayers: numPlayers,
							maxPlayers: maxPlayers,
							
							players: players,
							gids: playerGIDs,
							
							version: version,
							
							settings: settings,
						});
					});
				}
				
				
				break;
			}
			
			case _arma_loginAccept:
			{
				if( this.netid )
				{
					engine.console.print("Login accept recieved from server, but we're already connected...\n");
				}
				else
				{
					var that = this;
					setTimeout(function(){that.send({ type: "version", data: 0.8 })}, 100);
					if(this.isGameServer)
					{
						setTimeout(function(){that.send(new nMessage( _arma_wantObjs ))}, 500);
						setTimeout(function(){that.send(new nMessage( _arma_requestID ))}, 1000);
					}
					
					setTimeout(function()
					{
						if( that.eventCallback["connect"] )
						{
							that.eventCallback["connect"].forEach(function(f)
							{
								f({
									netid: that.netid,
									version: that.verMax,
								});
							});
						}
					},1);
				}
				
				this.netid = msg.getShort();
				
				this.versMin = msg.getInt();
				this.versMax = msg.getInt();
				
				break;
			}
			
			case _arma_loginDeny:
			{
				var reason = msg.getStr();
				
				if( this.eventCallback["close"] )
				{
					this.eventCallback["close"].forEach(function(f)
					{
						f({
							reason: reason,
						});
					});
				}
				
				break;
			}
			
			
			case _arma_config:
			{
				var setting = msg.getStr();
				var type, value;
				
				switch(setting)
				{
					case "CYCLE_WALLS_LENGTH": setting = "WALLS_LENGTH"; break;
					case "CYCLE_WALLS_STAY_UP_DELAY": setting = "WALLS_STAY_UP_DELAY"; break;
					case "ARENA_AXES": type = "int"; break;
					
					case "REAL_ARENA_SIZE_FACTOR":
						setting = "SIZE_FACTOR";
						type = " "; //bogus type so our value isn't overwritten
						value = Math.log(msg.getFloat(), 2)*2;
						console.log(setting);
						console.log(value);
						break;
				}
				
				if(!type)
				{
					if(!conf[setting])
					{
						console.error("Got message for unknown setting.",setting);
						break;
					}
					type = conf[setting].type;
				}
				
				switch(type)
				{
					case "number":
						value = msg.getFloat();
						break;
					case "int":
						value = msg.getInt();
						break;
					case "string":
						value = msg.getStr();
						break;
					case "boolean":
						value = msg.getBool();
						break;
				}
				
				netcfg(setting,""+value);
				
				break;
			}
			
			case _arma_chatMessage: 
				var playerID = msg.getShort();
				engine.console.print(msg.getStr()+"\n");
				break;
			case _arma_consoleMessage:
			{
				this.conMsgBuf += msg.getStr();
				//let bufpos = 0;
				
				//this.conMsgBuf.split("\n");
				for(var i=0;i<(this.conMsgBuf.length-1);++i)
				{
					//bufpos += this.conMsgBuf[i].length;
					if(this.conMsgBuf[i] == '\n')
					{
						engine.console.print(this.conMsgBuf.slice(0, this.conMsgBuf.indexOf('\n'))+"\n");
						this.conMsgBuf = this.conMsgBuf.slice(i+1);
						i = 0;
					}
				}
				
				break;
			}
			
			case _arma_centerMessage:
			{
				let c = msg.getStr();
				let time = 5000;
				if(!msg.end()) time = msg.getInt();
				
				centerMessage(c, time);
				break;
			}
			
			case _arma_3dc:
			{
				let err;
				let m = msg.getStr();
				
				{
					this.customHandler = this.tdcCustomHandler;
					this.version = this.tdcVersion;
				}
				
				try
				{
					Connection3dc.prototype.handler.apply(this, [m]);
				}
				catch(e) { err=e; } //lol
				
				{
					this.tdcCustomHandler = this.customHandler;
					this.tdcVersion = this.version;
				}
				
				if(err) throw err;
				
				break;
			}
			
			case _arma_haveID:
			{
				var newid = msg.getShort();
				if(msg instanceof nMessageProto) newid = msg.getInt();
				
				if(!this.playerSynced)
				{
					this.sendPlayer(settings.player, newid);
					break;
				}
				
				break;
			}
			
			case _arma_objSync:
			{
				var objid = msg.getShort();
				
				if(this.usedIDs[objid])
				{
					this.recvObj(this.usedIDs[objid], msg);
				}
				else
				{
					engine.console.print("Ignoring sync for unrecieved network object "+objid+"\n");
					console.warn("Got ID for invalid object.");
				}
				
				break;
			}
			
			default:
			if( Object.values(_arma_obj).indexOf(msg.descriptor) !== -1 )
			{
				console.debug("Got remote object");
				
				var objid = msg.getShort();
				var owner = msg.getShort();
				
				this.usedIDs[objid] = {type: msg.descriptor, ownerid: owner};
				
				this.recvObj(this.usedIDs[objid], msg, true);
				
				break;
			}
		}
	}
	
	sendPlayer(player,objid)
	{
		console.log("Send player");
		
		if(!player) player = settings.player;
		if(!objid) objid = this.hasObj(player);
		
		var pSync = !this.playerSynced;
		if(!pSync) return;
		
		var msg = new nMessage( pSync?_arma_obj.player:_arma_objSync );
		
		if(pSync)
		{
			msg.pushShort(objid);
			msg.pushShort(this.netid);
			
			this.usedIDs[objid] = {type: _arma_obj.player, ownerid: this.netid};
		}
		
		this.mkNetObj({type:_arma_obj.player, obj: player}, msg);
		
		this.send(msg);
		
		if(pSync)
		{
			// slight hack: read back our own message
			// and use it as the basis for our network player
			msg.bufpos = 4;
			this.recvObj(this.usedIDs[objid], msg, true);
		}
		
		this.playerSynced = true;
		this.playerID = objid;
	}
	
	sendTurn(dir=undefined,cycle=engine.players[engine.activePlayer])
	{
		var msg = new nMessage( _arma_cycleEvent );
		
		msg.pushFloat(cycle.position.x).pushFloat(cycle.position.y);
		
		var ang = (dir === undefined)?cycle.rotation.z:(cycle.rotation.z - (pi(2)/settings.ARENA_AXES)*dir);
		msg.pushFloat(Math.cos(ang)).pushFloat(Math.sin(ang));
		
		msg.pushFloat(cycle.dist);
		
		var flags = 0;
		if ( cycle.braking )
			flags |= 0x01;
		if ( cycle.chatting )
			flags |= 0x02;
		
		msg.pushShort(flags);
		
		msg.pushShort(this.cycleID);
		
		msg.pushFloat(cycle.gtime/1e3);
		msg.pushShort(cycle.turns);
		
		this.send(msg);
		
		cycle.handleNetTurn = settings.DEBUG_NETWORK_TURN_WAIT;
	}
	syncTurn(cycle=engine.players[engine.activePlayer])
	{
		this.sendTurn(undefined, cycle);
	}
	
	sendChat(msg, cycle=engine.players[engine.activePlayer])
	{
		if( cycle == engine.players[engine.activePlayer] && this.playerSynced )
		{
			this.send((new nMessage(_arma_chat)).pushShort(this.playerID).pushStr(msg));
		}
	}
	
	syncPlayData()
	{
		
	}
	
}

class ServerArma extends ArmaNetBase
{
	constructor(host,port=4534)
	{
		super();
		
		engine.console.print("Binding socket to :"+port+"...\n");
		
		this.server = dgram.createSocket("udp4");
		this.server.bind(port);
		
		//this.host = host;
		this.port = port;
		
		this.clients = [];
		
		this.infoPoll = {};
		
		this.sync(game);
		this.sync(engine);
		
		var that = this;
		this.server.on("message",function(rmsg,r)
		{
			console.debug("incoming",r.address,r.port);
			var n = nMessage.AutoFrom(rmsg);
			
			for(var i=that.clients.length-1;i>=0;--i)
			{
				if(
					that.clients[i] && 
					that.clients[i].r.address == r.address &&
					that.clients[i].r.port == r.port
				)
				{
					if( r.size > (n.len*2) )
					{
						// interpret multiple messages part of the same packet
						
						var offset = 0;
						var sizeRemaining = r.size;
						
						do
						{
							if(n.descriptor != 0)
							{
								that.clients[i].handler(n);
							}
							offset += 6+(n.len*2);
							sizeRemaining -= 6+(n.len*2);
							
							n = nMessage.AutoFrom(rmsg.slice(offset));
						}
						while( sizeRemaining >= 6 );
					}
					else
					{
						that.clients[i].handler(n);
					}
					
					return;
				}
			}
			switch(n.descriptor)
			{
				case _arma_getServerInfo:
				{
					var msg = new nMessage( _arma_serverInfo, 0 );
					
					// host / port
					msg.pushInt(that.port).pushStr("");
					// name
					msg.pushStr(settings.SERVER_NAME);
					
					// players
					var p = 0, l = "";
					for(var i=engine.players.length-1;i>=0;--i)
					{
						if( engine.players[i] && !engine.players[i].AI )
						{
							++p;
							l += engine.players[i].getColoredName()+"\n";
						}
					}
					msg.pushInt(p);
					
					// version min/max
					msg.pushInt(5).pushInt(20);
					msg.pushStr("3dc-beta8");
					
					// max players
					msg.pushInt(settings.MAX_CLIENTS);
					
					// players
					msg.pushStr(l);
					
					// options
					msg.pushStr("");
					
					// url
					msg.pushStr("");
					
					if( !that.infoPoll[r.address] || (performance.now()-that.infoPoll[r.address]) > 1e5 )
					{
						engine.console.print("Got server info request from arma://"+r.address+":"+r.port+".\n", false);
						//setTimeout(function(){delete that.infoPoll[r.address];},10000);
					}
					that.infoPoll[r.address] = performance.now();
					
					that.server.send( msg.get(), r.port, r.address );
					break;
				}
				
				case _arma_getServerInfoSmall:
				{
					var msg = new nMessage( _arma_serverInfoSmall, 0 );
					msg.pushInt(that.port).pushStr("");
					setTimeout(function(){that.server.send( msg.get(), r.port, r.address )},250);
					break;
				}
				
				case _arma_login1:
				case _arma_login2:
				{
					var c = new ServerClientArma(that,that.server,r);
					
					console.log("Connection login from arma://"+r.address+":"+r.port);
					
					var acceptLogin = true, reason;
					
					c.rate = n.getShort();
					c.bigBrother = n.getBool();
					if(c.bigBrother) c.bigBrother = n.getString();
					
					if(!n.end())
					{
						n.getInt(); //version min
						c.versionID = n.getInt();
					}
					
					c.version = arma_versions[c.versionID]||0.4;
					
					/*
					if(!n.end())
					{
						n.getString(); //auths supported
					}
					*/
					
					if(that.clients.length >= _arma_CLIENTS)
					{
						acceptLogin = false;
						reason = "The server can't handle any more connections: all available client IDs are used.";
					}
					
					if(engine.players.length >= settings.MAX_CLIENTS)
					{
						acceptLogin = false;
						reason = "The server is full, sorry.";
					}
					
					if(acceptLogin)
					{
						var id = c.assignNetId();
						
						var msg = new nMessage( _arma_loginAccept, 0 );
						msg.pushShort(id); //client id
						msg.pushInt(5).pushInt(20); //version min/max
						c.send(msg, 3);
						
						setTimeout(function() { c.sendSettings() }, 100);
						
						that.clients.push(c);
						//console.log("Connection login accepted, ID",id," VersionID",c.versionID);
					}
					else
					{
						/*
						var msg = new nMessage( _arma_loginAccept, 0 );
						msg.pushShort(0); //client id
						msg.pushInt(5).pushInt(20); //version min/max
						c.send(msg, 2);
						*/
						
						var msg = new nMessage( _arma_loginDeny, 0 );
						if(reason) msg.pushStr(reason);
						//msg.pushShort(0);
						c.send(msg, 3);
						
						console.log("Connection login denied:",JSON.stringify(reason));
					}
					
					break;
				}
				
				
			}
		});
	}
	close()
	{
		
	}
	send(data) //broadcast data
	{
		for(var i=this.clients.length-1;i>=0;--i)
		{
			this.clients[i].send(data);
		}
	}
	sync(obj,send=true,ack=true)
	{
		switch(true)
		{
			case (obj == game):
			{
				var id = this.hasObj(obj);
				if(!id) id = this.useObj(obj);
				
				var o = this.usedIDs[id];
				o.type = _arma_obj.game;
				
				break;
			}
			
			case (obj == engine): // used as timer
			{
				var id = this.hasObj(obj);
				if(!id) id = this.useObj(obj);
				
				var o = this.usedIDs[id];
				o.type = _arma_obj.timer;
				
				break;
			}
			
			case (obj instanceof Player):
			{
				var id = this.hasObj(obj);
				if(!id) id = this.useObj(obj);
				
				var o = this.usedIDs[id];
				o.type = obj.AI?_arma_obj.player_ai:_arma_obj.player;
				break;
			}
			
			case (obj instanceof Zone):
			{
				
				break;
			}
			
			case (obj instanceof THREE.Object3D):
			if(obj.owner instanceof Player)
			{
				if(obj.owner.model === obj)
				{
					if(obj.owner.alive)
					{
						var id = this.hasObj(obj);
						if(!id) id = this.useObj(obj);
						
						var o = this.usedIDs[id];
						o.type = _arma_obj.cycle;
						
						//o.ownerid = this.hasObj(obj.owner);
						o.ownerid = engine.players.indexOf(obj.owner);
					}
					
					break;
				}
				if(obj.owner.walls === obj)
				{
					
				}
			}
			// falls through
			
			default:
				console.error("no matching object type to sync");
				return;
		}
		
		if(send)
		{
			for(var i=this.clients.length-1;i>=0;--i)
			{
				this.clients[i].sync(obj, ack);
			}
		}
	}
	syncCycle(cycle, walls=false)
	{
		//if(walls) this.sync(cycle.walls);
		this.sync(cycle.model);
	}
	syncDeath(cycle)
	{
		this.syncCycle(cycle, true);
	}
}

class ServerClientArma
{
	constructor(svr,conn,r)
	{
		this.server = svr;
		this.connection = conn;
		this.r = r;
		
		this.msgID = 1;
		this.msgsOut = {};
		this.msgsIn = {};
		
		this.pings=this.pingc=0;
		
		this.onAck = {};
		
		this.syncedObjs = [];
		
		this.netid = false;
		this.versionID = 0;
		this.version = 0;
		
		this.rate = 0;
		
		this.gameState = _arma_gameState.camera;
		this.gameStateC = 0;
		this.gameWait = -1;
	}
	
	close(reason="")
	{
		if(this.closeNoRecurse) return;
		
		this.send(new nMessage( _arma_loginDeny, 0 ).pushStr(reason), 3);
		
		this.closeNoRecurse = true;
		this.onClose();
		delete this.closeNoRecurse;
	}
	
	send(data,times=1)
	{
		if(data instanceof nMessage)
		{
			var msg = data;
			
			//console.debug("outgoing", msg.descriptor, this.r.address, this.r.port);
			
			if(msg.id === false)
			{
				msg = new nMessage(msg.get());
				msg.id = (this.msgID++);
				if(this.msgID & 65536) this.msgID %= 65535;
				msg.time = performance.now();
			}
			
			if(msg.id && !this.msgsOut[msg.id])
			{
				this.msgsOut[msg.id] = msg;
				
				var that = this;
				setTimeout(function(){ if( that.msgsOut[msg.id] && that.netid !== -1 ) { that.send(msg); } }, 500);
			}
			
			times |= 0; // convert to int
			if(times < 0) times = 0;
			while(times--)
			{
				this.connection.send(msg.get(), this.r.port, this.r.address);
			}
			
			return msg;
		}
		else if(data.constructor == Object)
		{
			switch(data.type)
			{
				case "con":
					this.send(new nMessage( _arma_consoleMessage ).pushStr( data.data ));
					break;
				
				case "cen":
					this.send(new nMessage( _arma_centerMessage ).pushStr( data.data.msg ).pushFloat(data.data.time/1e3));
					
					// since Armagetron lacks support for specifying the
					// amount of time a center message should appear for
					this.lastCen = data;
					if( data.data.time > 5000)
					{
						//console.log("time");
						var that = this; setTimeout(function(){ if(that.lastCen === data) { that.lastCen.data.time -= 1000; that.send( that.lastCen ); } }, 1000);
					}
					break;
				
				case "setting":
				{
					const t = {
						"ARENA_AXES": nMessage.prototype.pushInt,
						"SIZE_FACTOR": function(val)
						{
							//FIXME: we really should only change this between rounds
							this.bufpos = nMessage._BEGIN;
							this.pushStr("REAL_ARENA_SIZE_FACTOR").pushFloat(Math.pow(2,val/2));
						},
						"WALLS_LENGTH": function(val)
						{
							this.bufpos = nMessage._BEGIN;
							this.pushStr("CYCLE_WALLS_LENGTH").pushFloat(val);
						},
						"WALLS_STAY_UP_DELAY": function(val)
						{
							this.bufpos = nMessage._BEGIN;
							this.pushStr("CYCLE_WALLS_STAY_UP_DELAY").pushFloat(val);
						},
					};
					
					var msg = new nMessage( _arma_config ).pushStr( data.setting );
					
					if(t[data.setting])
					{
						t[data.setting].apply(msg, [data.data]);
					}
					else
					{
						switch(typeof(data.data))
						{
							case "number":
								msg.pushFloat(data.data);
								break;
							case "string":
								msg.pushStr(data.data);
								break;
							case "boolean":
								msg.pushBool(data.data);
								break;
						}
					}
					
					this.send(msg);
					break;
				}
				
				case "endRound":
					var n = 0;
					for(var i=_arma_CLIENTS;i<_arma_MAXIDS;++i)
					{
						if( this.server.usedIDs[i] && this.server.usedIDs[i].obj )
						{
							switch(this.server.usedIDs[i].type)
							{
								case _arma_obj.cycle:
								case _arma_obj.zone:
								case _arma_obj.zoneCirc:
								case _arma_obj.zonePoly:
									this.onDestroyObj( this.server.usedIDs[i].obj );
									delete this.server.usedIDs[i];
									++n;
									break;
							}
						}
					}
					console.debug(n,"objects destroyed.");
					
					this.gameState = this.server.gameState = 60;
					this.nextGameState();
					this.sync(game);
					break;
				
				case "syncdata":
					this.server.gameState = 7;
					this.nextGameState();
					this.sync(game);
					break;
				
				case "newRound":
					this.server.gameState = 50;
					this.nextGameState();
					this.sync(game);
					break;
				
				case "scoredata":
					this.senddata(0);
					break;
				
				case "del":
					console.log("des", data.data);
					this.onDestroyObj( engine.players[data.data] );
					break;
				
				default:
				{
					console.log(data);
					this.send((new nMessage(_arma_3dc)).pushStr(JSON.stringify(data)));
				}
			}
		}
		else
		{
			console.log(data);
		}
	}

	sync(obj, ack=true)
	{
		var id = this.server.hasObj(obj);
		if(id)
		{
			var o = this.server.usedIDs[id];
			
			// don't sync object if the client doesn't know to accept it
			// otherwise, client will crash while entering server
			switch(o.type)
			{
				case _arma_obj.cycle:
				case _arma_obj.zone:
				case _arma_obj.zoneCirc:
				case _arma_obj.zonePoly:
					if( this.gameStateC > _arma_gameState.delete_grid ) return;
					if( this.gameStateC < _arma_gameState.create_grid ) return;
			}
			
			var msg,m;
			if( this.syncedObjs.indexOf(obj) === -1 )
			{
				msg = new nMessage( o.type );
				this.syncedObjs.push(obj);
				m=true;
			}
			else
			{
				msg = new nMessage( _arma_objSync );
				//if(!ack) msg.id = 0; //FIXME
			}
			
			// object id
			msg.pushShort(id);
			
			// owner
			if(m) msg.pushShort(o.ownerid);
			
			
			switch(o.type)
			{
				case _arma_obj.game:
					//console.log("gamestate",this.gameState);
					msg.pushShort(this.gameState);
					break;
				
				case _arma_obj.timer:
					// time, speed
					msg.pushFloat(engine.gtime/1e3).pushFloat(engine.timemult||0);
					
					break;
				
				case _arma_obj.player:
				case _arma_obj.player_ai:
					//console.log(removeColors(obj.name), id);
					
					/*
					// color
					var c = guessColor( colorStr(obj.cycleColor), colorStr(obj.tailColor) );
					msg.pushShort(c[0]).pushShort(c[1]).pushShort(c[2]);
					
					// pingCharity
					msg.pushShort(0);
					
					// name
					msg.pushStr(obj.name);
					
					// ping
					msg.pushFloat(obj.ping/1e3);
					
					// flag
					msg.pushShort(0);
					
					// score
					msg.pushInt(obj.score);
					
					// newdisc??
					msg.pushBool(false);
					
					// team
					// FIXME
					msg.pushShort(0).pushShort(0).pushInt(3).pushBool(true);
					*/
					
					this.server.mkNetObj(o, msg);
					
					break;
				
				case _arma_obj.cycle:
				{
					var p = obj.owner;
				
					if(m)
					{
						// player ID
						msg.pushShort(this.server.hasObj(p));
						
						// don't know
						msg.pushShort(0)
						
						// color, for some reason as floats this time?
						var c = guessColor( colorStr(p.cycleColor), colorStr(p.tailColor) );
						msg.pushFloat(c[0]/15).pushFloat(c[1]/15).pushFloat(c[2]/15);
					}
					
					// time
					msg.pushFloat(p.gameTime/1e3);
					//console.log("t",p.gameTime/1e3);
					
					// direction
					msg.pushFloat(p.dir.front[0]).pushFloat(p.dir.front[1]);
					
					// position
					msg.pushFloat(p.position.x).pushFloat(p.position.y);
					
					// speed
					msg.pushFloat(p.speed);
					
					// alive
					msg.pushBool(p.alive);
					
					//console.log("alive",p.alive);
					
					// distance
					msg.pushFloat(p.dist);
					
					// last wall id?
					msg.pushShort(0);
					
					// turns
					msg.pushShort(p.turns);
					
					// braking
					msg.pushBool(p.braking);
					
					// last turn position
					if(!p.lastTurnPos) p.lastTurnPos = p.position.clone();
					msg.pushFloat(p.lastTurnPos.x).pushFloat(p.lastTurnPos.y);
					
					// rubber used
					// which for some reason is not a float
					// but a integer representation of the percentage
					msg.pushShort((65535*(p.rubber/settings.CYCLE_RUBBER))|0);
					
					// dunno
					msg.pushShort(65535)
					
					// brakes level 
					msg.pushShort(((p.brakes*65535)|0))
					
					// dunno
					msg.pushShort(65535)
					
					
					// FIXME: more unknown stuff
					msg.pushShort(0).pushShort(0);
					//msg.pushShort(0);
					
					if(!p.alive)
					{
						if(m) return;
						var that = this; setTimeout(function(){that.onDestroyObj(obj)},100);
					}
					
					break;
				}
			}
			
			return this.send(msg);
		}
	}
	syncCycle(cycle, walls=false)
	{
		//if(walls) this.sync(cycle.walls);
		this.sync(cycle.model);
	}
	
	onDestroyObj(obj)
	{
		var id = this.syncedObjs.indexOf(obj);
		if(id !== -1)
		{
			this.syncedObjs.splice(id,1);
		}
		id = this.server.hasObj( obj );
		if(id)
		{
			var msg = new nMessage( _arma_objDestroy );
			switch(this.server.usedIDs[id].type)
			{
				case _arma_obj.player:
				case _arma_obj.player_ai:
					this.send( new nMessage( _arma_removePlayer ).pushShort( id ) );
					break;
			}
			//console.log("d",id);
			msg.pushShort( id );
			this.send(msg);
			
			// clear the object now, so it doesn't get erronously synced
			this.server.usedIDs[id].obj = null;
			
			// wait a little bit so we aren't immediately giving a new object the same id
			// just in case the client hasn't received it yet
			setTimeout(function(){delete this.server.usedIDs[id]}, 1000+(10000*Math.random()));
		}
	}
	
	doNetSync(c_sync,sync_sn_netObjects=true,timeout=1)
	{
		var msg = new nMessage( _arma_syncAck, 0, 2 );
		msg.pushFloat(timeout).pushBool(sync_sn_netObjects).pushShort(c_sync);
		this.send(msg);
	}

	nextGameState()
	{
		//console.debug("gs",this.gameStateC);
		switch(this.gameStateC)
		{
			case _arma_gameState.delete_obj:
				this.gameState = _arma_gameState.delete_grid;
				break;
			
			case _arma_gameState.delete_grid:
				//if(this.server.gameState == _arma_gameState.playing)
				{
					this.gameState = _arma_gameState.create_grid;
				}
				break;
			
			case _arma_gameState.created:
			case _arma_gameState.create_grid:
				this.gameState = _arma_gameState.create_obj;
				break;
			
			case _arma_gameState.create_obj:
				this.gameState = _arma_gameState.transfer_obj;
				break;
			
			case _arma_gameState.transfer_obj:
				this.gameState = _arma_gameState.camera;
				break;
			
			case _arma_gameState.camera:
				this.gameState = _arma_gameState.sync1;
				break;
			
			case _arma_gameState.sync1:
				if(this.server.gameState == _arma_gameState.playing)
				{
					this.gameState = _arma_gameState.playing;
				}
				break;
			
			case _arma_gameState.playing:
				if(this.server.gameState == _arma_gameState.delete_obj)
				{
					this.gameState = _arma_gameState.delete_obj;
				}
				break;
			
		}
		switch(this.gameStateC)
		{
			case _arma_gameState.delete_obj:
			case _arma_gameState.created:
				var that = this;
				setTimeout(function()
				{
					that.gameStateC = that.gameState|0;
					//console.log("GSGS");
					that.nextGameState();
					that.sync(game);
				},50);
				break;
		}
	}

	handler(msg)
	{
		if(msg.id > 0)
		{
			this.send((new nMessage( _arma_ack, 0, 2 )).pushShort( msg.id ));
			
			if( this.msgsIn[msg.id] && (this.msgsIn[msg.id].time+9999) < performance.now() )
			{
				return;
			}
			
			this.msgsIn[msg.id] = {time: performance.now()};
		}
		
		//console.log(msg.descriptor);
		
		switch(msg.descriptor)
		{
			case _arma_ack:
			{
				var id;
				while(!msg.end())
				{
					id = msg.getShort();
					
					if(this.msgsOut[id])
					{
						this.pings += performance.now()-this.msgsOut[id].time; ++this.pingc;
						
						delete this.msgsOut[id];
					}
					
					if(this.onAck[id])
					{
						var that = this;
						setTimeout(function(){ let _=that.onAck[id]; delete that.onAck[id]; _(); }, 0);
					}
				}
				break;
			}
			
			case _arma_wantObjs:
			{
				console.debug("wantObjs");
				for(var i=0;i<_arma_MAXIDS;++i)
				{
					if( this.server.usedIDs[i] && this.server.usedIDs[i].obj )
					{
						this.sync(this.server.usedIDs[i].obj);
					}
				}
				
				break;
			}
			
			case _arma_sync:
			{
				var timeout = msg.getFloat();
				var sync_sn_netObjects = msg.getBool();
				var c_sync = msg.getShort();
				
				console.debug("sync",timeout,sync_sn_netObjects,c_sync);
				
				if(sync_sn_netObjects)
				{
					for(var i=0;i<_arma_MAXIDS;++i)
					{
						if( this.server.usedIDs[i] && this.server.usedIDs[i].obj )
						{
							this.sync(this.server.usedIDs[i].obj);
						}
					}
				}
				
				this.send((new nMessage( _arma_syncAck, 0, 2 )).pushShort( c_sync ));
				break;
			}
			
			case _arma_requestID:
				
				var n = new nMessage( _arma_haveID );
				
				//FIXME: actually implement handling the request of multiple IDs at once
				
				var idsNeeded = 1;
				//msg.getShort();
				for(var i=_arma_CLIENTS;i<_arma_MAXIDS;++i)
				{
					if( !this.server.usedIDs[i] )
					{
						this.server.usedIDs[i] = {to:this,type:null};
						n.pushShort(i);
						n.pushShort(1);
						if( (--idsNeeded) <= 0 )
						{
							break;
						}
					}
				}
				
				this.send(n);
				
				break;
			
			case _arma_gameStateSync:
				this.gameStateC = msg.getShort();
				this.nextGameState();
				
				if(this.gameState != this.gameStateC)
				{
					this.sync(game);
				}
				break;
			
			case _arma_newPlayer:
				if(!settings.players[this.netid])
				{
					engine.network = false; // ???
					
					var id = msg.getShort();
					var owner = msg.getShort();
					
					var r = msg.getShort(), g = msg.getShort(), b = msg.getShort();
					
					settings.players[this.netid] = {};
					settings.players[this.netid].pingCharity = msg.getShort();
					settings.players[this.netid].name = msg.getString();
					
					//settings.players[this.netid].spectating = true;
					settings.players[this.netid].cycleColor = cycleColor(r,g,b);
					settings.players[this.netid].tailColor = color(r,g,b);
					// why did I call it a tail again?
					
					msg.bufpos += 4;   //ignore ping
					var flags = msg.getShort();
					msg.bufpos += 4; //ignore score
					msg.getBool();  //newdisc
					
					console.log("f",flags);
					settings.players[this.netid].spectating = Boolean(flags&2);
					//settings.players[this.netid].spectating = false;
					
					// tell the game to update players, to add our player
					this.noSendData = true;
					game.processPlayers(false);
					this.noSendData = false;
					
					//game.processPlayers(!inround());
					
					engine.players[this.netid].ping = Math.round(this.pings/this.pingc);
					console.log("ping",engine.players[this.netid].ping);
					
					if( this.server.usedIDs[id] && this.server.usedIDs[id].to == this )
					{
						/*
						var old = this.server.hasObj(engine.players[this.netid]);
						if(old != id)
						{
							// Well, we now have a player that is not owned by the correct ID
							// delete it
							this.server.send(new nMessage( _arma_objDestroy ).pushShort( old ));
							delete this.server.usedIDs[old];
							
							// Remove our player from synced objects for all clients that isn't ours
							// the client already knows about our own object
							for(var i=this.server.clients.length-1;i>=0;--i) if(this.server.clients[i] != this)
							{
								this.server.clients[i].syncedObjs.splice(this.server.clients[i].syncedObjs.indexOf(engine.players[this.netid]), 1);
							}
						}
						*/
						
						// the client already knows about our own object
						this.syncedObjs.push(engine.players[this.netid]);
						
						this.server.usedIDs[id].obj = engine.players[this.netid];
						
						this.server.sync( engine.players[this.netid] );
					}
					
					this.senddata(0); //send playerdata
					if(engine.round == 0 && !inround()) game.doNewRound();
					this.senddata(1); //now start gamedata loop
				}
				else
				{
					//this.close("You are allowed to have only one player per client.");
				}
				break;
			
			case _arma_wantTeamChange:
				var id = msg.getShort();
				if(settings.players[this.netid])
				{
					switch(msg.getShort())
					{
						case 1: // create new team / join any
							settings.players[this.netid].spectating = false;
							game.processPlayers(!inround());
							break;
					}
				}
				break;
			
			case _arma_cycleEvent:
				
				//console.log("Cycle Event!");
				
				if(engine.players[this.netid])
				{
					var cycle = engine.players[this.netid];
					
					var posx = msg.getFloat(), posy = msg.getFloat();
					var xdir = msg.getFloat(), ydir = msg.getFloat();
					var dist = msg.getFloat();
					var flags = msg.getShort(), id = msg.getShort();
					var time = msg.getFloat()*1e3;
					var turns = msg.getShort();
					
					var d = normalizeRad(Math.atan2(ydir,xdir)-engine.players[this.netid].rotation.z);
					
					console.log(cycle.dist-dist, cycle.position.x-posx, cycle.position.y-posy, cycle.gameTime-time);
					
					// FIXME: should not just trust the client
					cycle.position.x = posx;
					cycle.position.y = posy;
					//cycle.lastpos.x = posx; cycle.lastpos.y = posy;
					cycle.gameTime = time;
					cycle.dir.front = cdir( engine.players[this.netid].rotation.z = Math.atan2(ydir,xdir) );
					cycle.speed *= settings.CYCLE_TURN_SPEED_FACTOR;
					
					cycle.dist = dist;
					
					cycle.afterTurn(d<Math.PI?-1:1);
					
					//engine.players[this.netid].handleTurn(d<Math.PI?-1:1);
					
					//engine.players[this.netid].turn(d<Math.PI?-1:1);
					
					//this.syncOurCycleNow();
					
					this.server.syncCycle( cycle, false );
					if(cycle.speed > 1) cycle.update(0.01/cycle.speed);
					this.server.syncCycle( cycle, true );
				}
				break;
			
			case _arma_objSync:
				var id = msg.getShort();
				if( this.server.usedIDs[id] && this.server.usedIDs[id].to == this )
				{
					switch(this.server.usedIDs[id].type)
					{
						case _arma_obj.player:
							if(settings.players[this.netid])
							{
								var r = msg.getShort(), g = msg.getShort(), b = msg.getShort();
								
								settings.players[this.netid].pingCharity = msg.getShort();
								settings.players[this.netid].name = msg.getString();
								settings.players[this.netid].cycleColor = cycleColor(r,g,b);
								settings.players[this.netid].tailColor = color(r,g,b);
								
								msg.bufpos += 4; // ignore ping again
								var flags = msg.getShort();
								msg.bufpos += 4; // ignore score again
								
								if(engine.players[this.netid])
								{
									var changed = false;
									var newChatting = Boolean(flags&1), newSpec = Boolean(flags&2);
									if(newChatting != engine.players[this.netid].chatting)
									{
										engine.players[this.netid].chatting = newChatting;
										changed = true;
									}
									if(newSpec != settings.players[this.netid].spectating)
									{
										settings.players[this.netid].spectating = newSpec;
									}
									if(changed) game.updateScoreBoard();
								}
							}
							break;
					}
				}
				else
				{
					console.warn("Ignoring sync for",id);
				}
				break;
			
			case _arma_chat:
				var pid = msg.getShort();
				if(engine.players[this.netid])
				{
					handleChat(engine.players[this.netid],msg.getStr())
				}
				break;
			
			case _arma_logout:
				this.onClose();
				break;
			
			default:
				console.log("Unhandled message",msg.descriptor);
				break;
		}
	}
	
	onLeave()
	{
		var cycle = engine.players[this.netid];
		if(cycle)
		{
			game.playerLeave(cycle);
		}
	}
	
	onClose()
	{
		clearInterval(this.gtimeid);
		clearTimeout(this.timeoutID);
		clearInterval(this.pendAckTimer);
		
		var id = this.server.clients.indexOf(this);
		for(var i=_arma_CLIENTS;i<_arma_MAXIDS;++i)
		{
			if( this.server.usedIDs[i] )
			{
				var u = this.server.usedIDs[i];
				if( u.to == this && !u.type )
				{
					delete this.server.usedIDs[i];
				}
			}
		}
		if(id < 0)
		{
			console.warn("Tried to close a connection that does not have a used ID.");
			return;
		}
		this.onLeave();
		this.server.clients.splice(id,1);
		engine.console.print("User "+this.netid+" disconnected: "+this.r.address+"\n",false);
		
		this.close("Your client disconnected regularly.");
		
		if( window.svr.clients.length == 0 && global.serverSleep )
		{
			global.serverSleep();
		}
		this.netid = -1;
	}
	
	assignNetId()
	{
		var netid = false;
		var len=Math.max(settings.players.length,engine.players.length);
		for(var x=1;x<len;x++) 
		{
			if( settings.players[x] === undefined && !engine.players[x] )
			{
				netid = x;
				break;
			}
		}
		if(netid === false) netid = x;
		this.netid = netid;
		engine.console.print("User "+this.netid+" established: "+this.r.address+" with Armagetron version "+this.version+"\n",false);
		
		
		settings.players[x] = "";
		
		
		var that = this;
		this.gtimeid = setInterval(function()
		{
			//if(inround())
			{
				that.sync(engine);
				if( engine.gtime < 0 || !(engine.asendtm < 0) )
				{
					setTimeout(function(){that.sync(engine)},250);
					setTimeout(function(){that.sync(engine)},500);
					setTimeout(function(){that.sync(engine)},750);
				}
			}
			
		},1000);
		
		this.pendAckTimer = setInterval(function()
		{
			var acksNeeded = Object.keys(that.msgsOut);
			if(acksNeeded.length > 500)
			{
				console.log("Acks needed",acksNeeded.length);
				engine.console.print("User "+that.netid+" timed out.\n",that.netid);
				setTimeout(function(){that.close("You timed out.")},250);
			}
			if(engine.players[that.netid])
			{
				engine.players[that.netid].ping = Math.round(that.pings/that.pingc);
				that.pings = engine.players[that.netid].ping;
				that.pingc = 1;
				game.updateScoreBoard();
			}
		},10000);
		
		
		return netid;
	}
	
	sendSettings()
	{
		this.send({type:"setting", setting:"CYCLE_EXPLOSION_RADIUS", data:0});
		
		for(var i=0;i<sets.length;i++)
		{
			var val = settings[sets[i]];
			if(val == Infinity) val = Number.MAX_VALUE;
			this.send({type:"setting", setting:sets[i], data:val});
		}
	}
	
	senddata(type=1)
	{
		switch(type)
		{
			case 0:
				if(this.noSendData) return;
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
				{
					this.server.sync(engine.players[x], false);
					this.sync(engine.players[x]);
				}
				break;
			case 1:
				if( engine.timemult > 10 ) break;
				game.run(true);
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
				{
					if(engine.players[x].alive)
					{
						this.server.sync(engine.players[x].model,false);
						
						// send to client but don't require ack
						this.sync(engine.players[x].model, false);
					}
				}
				
				clearTimeout(this.timeoutID);
				var self = this;
				if(engine.gtime > 0)
					this.timeoutID = setTimeout(function(){self.senddata()},settings.CYCLE_SYNC_INTERVAL*1000);
				else
					this.timeoutID = setTimeout(function(){self.senddata()},2000);
				break;
			case 2:
				
				break;
		}
	}
	
	syncOurCycleNow()
	{
		var cycle = engine.players[this.netid];
		if(cycle)
		{
			this.server.sync(cycle, false);
			this.sync(cycle);
		}
	}
}



if(typeof(module) !== "undefined")
{
	module.exports = {
		ConnectionArma:ConnectionArma,
		ServerArma:ServerArma,
	};
}
