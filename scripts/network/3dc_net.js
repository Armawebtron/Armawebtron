/*
 * Armawebtron - A lightcycle game.
 * Copyright (C) 2019 Glen Harpring
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

// NOTE: "descriptor" 123 is for pure JSON object data! (before netversion 0.8.0)

tdc_Aliases = {};
tdc_NetOrder = {};
tdc_Version = {};

const _3dc_loginDenial = 3;
//tdc_Aliases["loginDenial"] = _3dc_loginDenial;
tdc_Version[_3dc_loginDenial] = 0.80;
tdc_NetOrder[_3dc_loginDenial] = [
	String.fromCharCode(0),
	"msg:str",
	"addr:str",
	"port:intc",
	"type:str"
];

const _3dc_config = 60;
tdc_Aliases["setting"] = _3dc_config;
tdc_Version[_3dc_config] = 0.80;
tdc_NetOrder[_3dc_config] = [
	String.fromCharCode(0),
	"setting:str",
	"data:str" //the supporting functions will detect the real type
];


// on second thought, this form of the version will never be transmitted
const _3dc_version = 10;
tdc_Aliases["version"] = _3dc_version;
tdc_Version[_3dc_version] = 0.80;
tdc_NetOrder[_3dc_version] = [
	String.fromCharCode(0),
	"data:auto"
];

const _3dc_newPlayer = 201;
tdc_Aliases["playerdata"] = _3dc_newPlayer;
tdc_Version[_3dc_newPlayer] = 0.80;
tdc_NetOrder[_3dc_newPlayer] = [
	String.fromCharCode(0),
	"netid:intc",
	["data",
		"name:str",
		"cycleColor:color",
		"tailColor:color",
		null,//"engineType" // still haven't entirely decided what this will actually mean
		"team:auto", //thought: send teamName from client, team ID from server
		"ai:bool",
	]
];

const _3dc_removePlayer = 202;
tdc_Aliases["del"] = _3dc_removePlayer;
tdc_Version[_3dc_removePlayer] = 0.80;
tdc_NetOrder[_3dc_removePlayer] = [
	String.fromCharCode(0),
	"data:intc"
];

const _3dc_splicePlayer = 203;
tdc_Aliases["leave"] = _3dc_splicePlayer;
tdc_Version[_3dc_splicePlayer] = 0.80;
tdc_NetOrder[_3dc_splicePlayer] = [
	String.fromCharCode(0),
	"data:intc"
];

const _3dc_newTeam = 220;
tdc_Aliases["team"] = _3dc_newTeam;
tdc_Version[_3dc_newTeam] = 0.80;
tdc_NetOrder[_3dc_newTeam] = [
	String.fromCharCode(0),
	["data",
		"id:intc",
		"name:str",
		"x:float",
		"y:float",
		"z:float",
		"dir:float" //NOTE: for legacy reasons, this is transmitted in degrees instead of radians
	]
];

const _3dc_deleteTeam = 221;
tdc_Version[_3dc_deleteTeam] = 0.80;
tdc_NetOrder[_3dc_deleteTeam] = [
	null,
	"data:intc"
];

const _3dc_spliceTeam = 222;
tdc_Version[_3dc_spliceTeam] = 0.80;
tdc_NetOrder[_3dc_spliceTeam] = [
	null,
	"data:intc"
];

const _3dc_roundEvent = 320;
tdc_Version[_3dc_roundEvent] = 0.80;
tdc_NetOrder[_3dc_roundEvent] = [
	null,
	"type:int?0=endRound&1=newRound"
];

function tdcDeconstructData(data,con) //! prepares network data to be sent
{
	if(data.JSON)
	{
		// JSON forced flag? well, we don't want to actually send the flag
		var json = data.JSON;
		delete data.JSON;
		var newdata = JSON.stringify(data);
		data.JSON = json;
		return newdata;
	}
	var buf = "", desc=123;
	switch(typeof(data.type))
	{
		case "string":
			if(tdc_Aliases[data.type])
			{
				desc = tdc_Aliases[data.type];
				buf += String.fromCharCode(tdc_Aliases[data.type]);
			}
			break;
		case "number":
			desc = data.type;
			buf += String.fromCharCode(desc);
			break;
	}
	if(con && con.version < tdc_Version[desc])
	{
		return JSON.stringify(data);
	}
	if(!buf || buf.length == 0)
	{
		return JSON.stringify(data);
	}
	function tdcDD_Recursive(obj,data,layers=0,sep=undefined)
	{
		console.log(obj,data);
		for(var i=0;i<obj.length;++i)
		{
			console.log(obj,data,i);
			if(i == 0)
			{
				if(layers == 0)
				{
					sep = obj[i];
				}
				else
				{
					//++i;
				}
			}
			else 
			{
				switch(typeof(obj[i]))
				{
					case "string":
						//var split = data[i].split(":");
						var split = obj[i].split(":");
						//console.log(split,where);
						var value = data[split[0]];
						
						if(split[1].indexOf("?") >= 0)
						{
							var sp = (split[1]).slice((split[1]).indexOf("?")).split("&");
							for(var z=sp.length-1;z>=0;--z)
							{
								var expl = (sp[z]).split("=");
								if(expl[1] == sp[0])
								{
									value = expl[0];
									break;
								}
							}
						}
						switch(split[1])
						{
							case "bool":
								value = (value)?1:0;
								//falls through
							case "intc":
								var num = parseInt(value)%65534;
								while(num < 0) num += 65534;
								num++;
								buf += String.fromCharCode(num);
								break;
							case "str": case "auto":
								value += "";
								for(var z=value.length-1;z>=0;--z)
								{
									if(value[z] === sep)
										return false; //bah, forget it
								}
								buf += value;
								break;
							case "color":
								value = (new THREE.Color(value)).toJSON();
								//falls through
							case "int":
								buf += ""+parseInt(value);
								break;
							case "float":
								buf += ""+parseFloat(value);
								break;
							/*
							default:
								//buf += obj[i][data];
								buf += ""+value;
							*/
						}
						break;
					case "object":
						if(obj[i] === null) break;
						var ret = tdcDD_Recursive(obj[i],data[obj[i][0]],layers+1,sep);
						if(ret === false) return false;
						break;
				}
				if(sep !== null)buf += sep;
			}
		}
		return true;
	}
	//tdcDD_Recursive(data);
	if(!tdcDD_Recursive(tdc_NetOrder[desc],data))
	{
		return JSON.stringify(data);
	}
	return buf;
}

function tdcConstructData(msg,data) //! converts transmitted data back into an object
{
	var desc = data.charCodeAt(0), data = data.slice(1);
	msg.type = desc; msg.data = "";
	
	var pos = 0;
	var dataspl = [];
	
	function tdcCD_Recursive(obj,data,layers=0,sep=undefined)
	{
		var ret = true;
		for(var i=0;i>obj.length;++i)
		{
			if(i == 0)
			{
				if(layers == 0)
				{
					sep = obj[i];
					dataspl = obj.split(sep);
				}
				else
				{
					//msg.data = msg.data[obj[i]];
				}
			}
			else 
			{
				switch(typeof(obj[i]))
				{
					case "string":
						var split = obj[i].split(":");
						var value = dataspl[pos];
						switch(split[1])
						{
							case "bool":
							case "intc":
								value = value.charCodeAt();
								value--;
								if(split[1] == "bool") value = (value==1);
								break;
							case "str":
								// already set
								break;
							case "auto":
								var num = parseFloat(value);
								if(!isNaN(num))
								{
									value = num;
								}
								// otherwise, string
								break;
							case "color":
								value = new THREE.Color(value);
								//falls through
							case "int":
								value = parseInt(value);
								break;
							case "float":
								value = parseFloat(value);
								break;
						}
						data[split[0]] = value;
						//buf += obj[i][split[0]]
						break;
					case "object":
						if(obj[i] === null) break;
						data[obj[i][0]] = {};
						var ret2 = tdcCD_Recursive(obj[i],data[obj[i][0]],layers+1,sep);
						ret = ret2&&ret;
						break;
				}
				++pos;
				//buf += sep;
			}
		}
		return ret;
	}
	return tdcCD_Recursive(data,msg);
}

class Connection3dc
{
	customHandler(){return 0};
	constructor(host,port=5331,ssl=true)
	{
		if(typeof(host) === "object")
		{
			this.connection = host;
		}
		else
		{
			this.connection = new WebSocket('ws'+(ssl?'s':'')+'://'+host+':'+port);
			var self = this;
			this.connection.onmessage = function(e){self.handler(e)};
			/*this.sentTime = */this.referenceTime = Date.now();
			//this.timeSyncTimes = 5;
		}
		this.timeSyncTimes = 1;
		this.timeSyncLatency = [];
		this.isGameServer = true;
		if(this.customHandler() === 0) this.customHandler = null;
		
		// the version as returned by the server...
		this.strVers = "0.2"; this.version = 0.2;
	}
	close() {return this.connection.close()}
	send(obj)
	{
		this.connection.send(tdcDeconstructData(obj,this));
	}
	sendTurn(dir=undefined,cycle=engine.players[engine.activePlayer])
	{
		if(dir === undefined)
			var rot = cycle.rotation.z;
		else
			var rot = normalizeRad(cycle.rotation.z - (pi(2)/settings.ARENA_AXES)*dir);
		this.send({type:"turn",data:rad2deg(rot),gtime:cycle.gameTime});
	}
	sendTurn_hack(cycle=engine.players[engine.activePlayer])
	{
		this.connection.send(JSON.stringify({
			type:"turn",data:rad2deg(cycle.rotation.z),gtime:cycle.gameTime,
			position:[cycle.position.x,cycle.position.y,cycle.position.z],
			speed:cycle.speed, rubber:cycle.rubber, brakes:cycle.brakes
		}));
	}
	
	sendChat(msg,cycle=engine.players[engine.activePlayer])
	{
		this.send({type:"chat",data:msg});
	}
	
	syncPlayData(cycle = engine.players[engine.activePlayer])
	{
		var data={},len=0;
		
		if(cycle.chatting != cycle.chattingPrev) {data.chatting=cycle.chatting; cycle.chattingPrev=cycle.chatting; ++len;} 
		if(cycle.alive)
		{
			if(cycle.braking != cycle.brakingPrev) {data.braking=cycle.braking; cycle.brakingPrev=cycle.braking; ++len;}
			if(cycle.boosting != cycle.boostingPrev) {data.boosting=cycle.boosting; cycle.boostingPrev=cycle.boosting; ++len;}
		}
		
		if(len > 0)
		{
			this.send({type:"playdata",data:data});
		}
	}
	
	sendTime()
	{
		engine.console.print("Syncing with server"+(('.').repeat(Math.max(0,this.timeSyncLatency.length-1)))+"\n");
		this.send({type:"time",data:(this.sentTime=getNetTime())});
	}
	
	handler(e)
	{
		var msg = {};
		if(e.data.charCodeAt(0) == 123) //is fully json data
		{
			msg = JSON.parse(e.data);
		}
		else
		{
			if(!tdcConstructData(msg,e.data))
			{
				engine.console.print("WARNING: Invalid data recieved from server.\n");
				msg.data = e.data.slice(1);
			}
			console.log(msg);
		}
		 
		if(this.customHandler && this.customHandler(msg)) return;
		switch(msg.type) //actual handling
		{
			case "ping": this.send({type:"pong"}); break;
			case "timeSync": //old test
				if(msg.data)
				{
					engine.gtime = msg.data;
					this.send({type:"timeSync",data:engine.gtime});
				}
				this.connection.timeSync = false;
				break;//*/
			//new test
			case "reqtime": this.sendTime(); break;
			case "time":
				if(this.timeSyncLatency.length == 0)
				{
					this.sentTime -= (getNetTime.diff += (getNetTime()-msg.data));
				}
				this.timeSyncLatency.push(
					((getNetTime()-this.sentTime)/2)
				);
				if(this.timeSyncLatency.length < this.timeSyncTimes)
				{
					var self = this;
					setTimeout(function(){self.sendTime()},1000);
				}
				else
				{
					this.timeSyncLatency.sort();
					var m = this.timeSyncLatency[(this.timeSyncLatency.length-1)/2];
					var d = 0;
					for(var i=this.timeSyncLatency.length-1;i>=0;--i)
					{
						d += this.timeSyncLatency[i]*this.timeSyncLatency[i];
					}
					d = Math.sqrt(d/this.timeSyncLatency.length);
					var a = 0,ia = 0;
					for(var i=this.timeSyncLatency.length-1;i>=0;--i)
					{
						if(this.timeSyncLatency[i] > m-d && this.timeSyncLatency[i] < m+d)
						{
							a += this.timeSyncLatency[i];
							ia++;
						}
					}
					a /= ia;
					
					console.log(this.timeSyncLatency,m,d,a);
					getNetTime.diff = (msg.data-Date.now())+a;
					
					this.send({type:"rdy"});
				}
				break;
				
			//
			case "version": 
				this.send({type:"version",data:0.8});
				if(msg.data && msg.data.length > 0)
				{
					var split = (""+msg.data).split(".");
					if(typeof(msg.data) == "string")
					{
						this.strVers = msg.data;
						this.version = split[0]+".";
						
						this.version = parseFloat(this.version);
					}
					else
					{
						
					}
					this.version = msg.data;
				}
				break;
			
			case _3dc_loginDenial:
				connectionAborted({reason:msg.data});
				break;
		}
		if(!this.isGameServer) return;
		switch(msg.type)
		{
			case "endRound": if(inround()) game.endRound(); break;
			case "newRound": 
				if(game.loading) break;
				if(!engine.playGame) game.play();
				else if(!inround()) game.newRound();
				break;
			case _3dc_config: case "setting":
				console.log(e);
				netcfg(msg.setting,""+msg.data);
				break;
			case "con":
				engine.console.print(msg.data);
				break;
			case "cen":
				centerMessage(msg.data.msg,msg.data.time);
				break;
			case "syncdata":
				console.log(msg.gtime);
				this.send({type:"player",data:settings.player});
				if(typeof(msg.netid) != "undefined")
				{
					engine.activePlayer = msg.netid||0; //we got id
					
					if(!engine.scene) init();
					//endRound();
				}
				//engine.totalPauseTime += (msg.gtime||0)-engine.gtime;
				if(msg.rTime !== undefined) 
				{
					this.referenceTime = msg.rTime;
					engine.gtime = getNetTime()-this.referenceTime-4000;
					console.log(engine.gtime);
				}
				else if(msg.gtime !== undefined) engine.gtime = msg.gtime;
				break;
			case "del": case _3dc_removePlayer:
			case "leave": case _3dc_splicePlayer:
				if(engine.players[msg.data])
				{
					if(msg.data == engine.activePlayer)
					{
						console.warn("Player being deleted is ours.");
					}
					if(msg.data == engine.viewTarget)
					{
						game.changeViewTarget(1);
					}
					if(engine.players[msg.data].alive) engine.players[msg.data].kill();
					if(msg.type == "del" || msg.type == _3dc_removePlayer)
						delete engine.players[msg.data];
					else
						engine.players.splice(msg.data,1);
					game.updateScoreBoard();
				}
				else
				{
					console.warn("Left player doesn't seem to exist.");
				}
				break;
			case "playerdata":
				console.log(msg.data);
				for(var i=msg.data.length-1;i>=0;--i) if(typeof(msg.data[i]) != "undefined")
				{
					var data = msg.data[i];
					if(!engine.players[data.netid])
					{
						var cycleinfo;
						data.ai = false; // AIs should be exclusively handled by the server. Maybe a different solution in the future?
						engine.players[data.netid] = new Player(cycleinfo={ 
							x:data.x||0, y:data.y||0, z:data.z||0, dir:data.dir||0, ai:data.ai||false,
							name:data.name||"1",
							cycleColor:data.cycleColor, tailColor:data.tailColor,
							engineType:data.engineType||settings.player.engineType,
							team: engine.teams[data.team]||new Team({name:(data.alive?data.name:"")}),
						});
						console.log(data);
						
						if(data.alive) engine.players[data.netid].spawn(cycleinfo,false);
						else if(data.netid == engine.activePlayer) game.changeViewTarget();
						
						audioMixing(engine.players[data.netid]);
					}
					else
					{
						engine.players[data.netid].name = data.name;
						engine.players[data.netid].cycleColor = data.cycleColor;
						engine.players[data.netid].tailColor = data.tailColor;
						if(data.alive) engine.players[data.netid].spawn({x:data.x||0, y:data.y||0, z:data.z||0, dir:data.dir||0},false);
						else if(data.netid == engine.activePlayer) game.changeViewTarget();
					}
				}
				break;
			case "griddata":
				if(!engine.playGame) game.play();
				//console.log(msg.data);
				//engine.gtime = (performance.now()/settings.TIME_FACTOR)-engine.timeStart-engine.totalPauseTime-4000;
				/*if(msg.gtime > engine.gtime)
				{
					//engine.gtime = msg.gtime;
					//console.log("S: ",msg.gtime-engine.gtime);
					if(!this.connection.timeSync) 
					{
						this.connection.timeSync = true;
						this.send({type:"timeSync",data:engine.gtime});
					}
				}*/
				var delta = engine.gtime-(msg.gtime);
				var timestep = delta/1000;
				//var delta = timestep*1000;
				for(var i=msg.data.length-1;i>=0;--i)
					if(typeof(msg.data[i]) != "undefined")
					{
						var data = msg.data[i];
						var cycle = engine.players[data.netid];
						if(cycle.alive != data.alive)
						{
							if(cycle.alive == true) cycle.killAt(data.position[0],data.position[1],data.position[2]);
							else cycle.spawn({x:data.position[0],y:data.position[1],z:data.position[2]},(!!data.spawntime));
							delete cycle.newPos;
						}
						
						//if(cycle.lastTurnTime > msg.gtime) continue;
						
						if(data.speed !== undefined) cycle.speed = 1*data.speed;
						if(data.rubber !== undefined) cycle.rubber = 1*data.rubber;
						if(data.braking !== undefined) cycle.braking = !!data.braking;
						if(data.brakes !== undefined) cycle.brakes = 1*data.brakes;
						
						if(cycle.alive)
						{
							var olddir = cycle.rotation.z, newdir = deg2rad(data.direction||0);
							
							if(!data.wall && normalizeRad(olddir) == normalizeRad(newdir) && isFinite(data.position[0]) && isFinite(data.position[1])) //slide to position
							{
								if(!cycle.newPos) cycle.newPos = new THREE.Vector2(cycle.position.x,cycle.position.y);
								cycle.newPos.x = 1*data.position[0]; cycle.newPos.y = 1*data.position[1];
								cycle.gameTime = Math.max(0,msg.gtime);
								
								if(!cycle.handleNetTurn) 
								{
									doNetSlide(cycle,Infinity);
									cycle.handleNetTurn = true;
								}
							}
							else if(cycle.handleNetTurn) //jump straight to the position, we're doing a turn
							{ //also, don't handle updates until our last turn has been sent by the server
								cycle.lastpos.x = cycle.position.x = 1*data.position[0]||0; 
								cycle.lastpos.y = cycle.position.y = 1*data.position[1]||0;
								delete cycle.newPos;
								
								cycle.gameTime = Math.max(0,msg.gtime);
								
								if(settings.DEBUG_NETWORK_TURN_WAIT) cycle.lastTurnTime = 0;
								
								//HACK to avoid cycle sticking to wall on a turn
								{
									var fakeTS = 0.01/cycle.speed;
									var move2d = Math.cos(cycle.model.rotation.y)*(cycle.speed*fakeTS), dir = cdir(cycle.rotation.z);
									cycle.lastpos.x = (cycle.position.x += move2d*dir[0]);
									cycle.lastpos.y = (cycle.position.y += move2d*dir[1]);
									cycle.gameTime += fakeTS;
								}
							}
							if(data.wall) { cycle.walls.map = data.wall; cycle.resetWall(false); }
								
							cycle.lastpos.z = cycle.position.z = 1*data.position[2]||0;
							
							
							if(cycle.haswall)
							{
								if(rad2deg(olddir) == rad2deg(newdir))
								{
									cycle.walls.map[cycle.walls.map.length-1] = [cycle.position.x,cycle.position.y];
								}
								else
								{
									cycle.rotation.z = newdir;
									var wallmod = cycle.walls.children[cycle.walls.children.length-1];
									cycle.newWallSegment();
								}
							}
							else
							{
								cycle.rotation.z = newdir;
							}
						}
						//if(isFinite(timestep)) cycle.update(timestep);
					}
				if(!engine.lastPingTime) engine.players[engine.activePlayer].ping = parseInt(delta);
				game.updateScoreBoard(); //console.log(timestep);
				break;
			case "scoredata":
				for(var i=msg.data.length-1;i>=0;--i) 
				{
					if(typeof(msg.data[i]) != "undefined")
					{
						var data = msg.data[i];
						var cycle = engine.players[data.netid];
						cycle.chatting = data.chatting||false;
						cycle.ping = data.ping||0;
						cycle.score = data.score||0;
						engine.lastPingTime = performance.now();
					}
				}
				engine.playersByScore.sort(function(a,b){return b.score-a.score});
				game.updateScoreBoard();
				break;
			case "team":
				engine.teams.splice(0);
				//[[FALLTHROUGH]]
			case _3dc_newTeam:
				for(var i=msg.data.length-1;i>=0;--i) if(msg.data[i])
				{
					engine.teams[msg.data[i].id] = new Team(msg.data[i]);
				}
				break;
			case "zone":
				for(var i=msg.data.length-1;i>=0;--i) if(msg.data[i])
				{
					var zone = msg.data[i];
					if(zone.destroyed)
					{
						if(engine.zones[zone.id])
						{
							engine.zones[zone.id].destroy();
						}
					}
					else if(engine.zones.children[zone.id])
					{
						var myZone = engine.zones.children[zone.id];
						if(zone.type!==undefined) {myZone.cfg.type = zone.type;}
						if(zone.x!==undefined) {myZone.position.x = zone.x; myZone.position.y = zone.y; myZone.position.z = zone.z;}
						if(zone.xdir!==undefined) {myZone.cfg.xdir = zone.xdir; myZone.cfg.ydir = zone.ydir;}
						if(zone.bounce!== undefined)myZone.cfg.bounce = zone.bounce;
						if(zone.type == "flagHeld")
						{
							myZone.cfg.heldBy = engine.players[zone.heldBy];
							myZone.cfg.heldBy.hasFlag = myZone.cfg;
						}
						else if(myZone.cfg.heldBy)
							myZone.cfg.heldBy.hasFlag = null;
						myZone.cfg.netObject = true;
					}
					else
					{
						try
						{
							var s = new Zone(zone).spawn();
							
							//we don't need to process the zone ourselves (as that will all be handled by the server), however we should still know the type for our chatbot.
							s.netObject = true;
						}
						catch(e)
						{
							engine.console.print("0xff7f7fAn error occurred when syncing zones. You may be missing some important elements of the game.\n");
							console.error(e);
						}
					}
				}
				break;
		}
	}
}

class Server3dc
{
	constructor(host,port=5331,ssl=true)
	{
		engine.console.print("Binding socket to :"+port+"...\n");
		
		if(!https && ssl)
		{
			console.warn("WARNING: SSL specified but cannot be enabled.");
		}
		
		if(https && ssl)
		{
			this.core = https.createServer({
				cert: fs.readFileSync(settings.SERVER_SSL_CERT),
				key: fs.readFileSync(settings.SERVER_SSL_KEY),
			});
			this.server = new WebSocket.Server(this.core);
			this.core.listen(port);
		}
		else
			this.server = new WebSocket.Server({port:port});
		
		this.clients = [];
		
		var self = this;
		this.server.on("connection",function(ws,r){self.onConnection(ws,r);});
	}
	close()
	{
		
	}
	onConnection(ws,r)
	{
		this.clients.push(new ServerClient3dc(this,ws,r));
	}
	send(data) //broadcast data
	{
		for(var i=this.clients.length-1;i>=0;--i)
		{
			this.clients[i].send(data);
		}
	}
}

class ServerClient3dc
{
	constructor(svr,ws,r)
	{
		this.server = svr;
		this.connection = ws;
		this.r = r; // change this
		
		var self = this;
		this.connection.on("message",function(e){self.handler(e);});
		this.connection.on("pong",function(e){self.onPong(e);});
		this.connection.on("close",function(e){self.onClose(e);});
		
		this.netid = false;
		this.version = 0.3;
		
		this.lastPingTime = -Infinity;
		
		engine.console.print("Communication with "+r.connection.remoteAddress+"...\n",false);
		this.send({type:"version",data:0.8});
		this.send({type:"ping"});
	}
	close()
	{
		this.connection.terminate();
	}
	send(data)
	{
		this.connection.send(tdcDeconstructData(data,this));
	}
	handler(edata)
	{
		var msg = {};
		if(edata.charCodeAt(0) == 123) //is fully json data
		{
			try
			{
				msg = JSON.parse(edata);
			}
			catch(e)
			{
				engine.console.print("WARNING: Invalid data recieved from client.\n",this.netid);
			}
		}
		else
		{ 
			if(!tdcConstructData(msg,edata))
			{
				engine.console.print("WARNING: Invalid data recieved from client.\n",this.netid);
				msg.data = edata.slice(1);
			}
		}
		
		switch(msg.type)
		{
			case "version": this.version = parseFloat(msg.data); break;
			case "time":
				this.send({type:"time",data:Date.now()});
				break;
			case "timeSync":
				//console.warn("TIMESYNC 0",engine.gtime,msg.data+ws.delayEst);
				if(/*ws.lastTimeSync+1000 < performance.now() && */ws.timeSync === false && (isNaN(msg.data) || Math.abs(engine.gtime-(msg.data+ws.delayEst)) > 5))
				{
					ws.timeSync = performance.now();
					//ws.timeSyncDiff = (engine.gtime-(msg.data-ws.delayEst))/2;
					this.send({type:"ping"});
					//console.warn("TIMESYNC 1",ws.timeSyncDiff);
				}
				else if(version < 0.8)
				{
					this.send({type:"timeSync"});
					//console.warn("TIMESYNC -");
				}
				break;
			case "pong":
				if(this.netid === false)
				{
					if(this.version >= 0.8)
					{
						//this.send({type:"time",data:(new Date()).getTime()});
						var self = this;
						setTimeout(function(){self.send({type:"reqtime"})},100);
						//this.theTime = (new Date()).getTime(); //???
					}
					else this.assignNetId();
				}
				else if(this.timeSync !== false)
				{
					//console.warn("TIMESYNC 2");
					this.delayEst = (performance.now()-ws.timeSync)/2;
					//console.log(ws.delayEst);
					this.timeSync = false;
					this.send({type:"timeSync",data:engine.gtime+ws.timeSyncDiff+ws.delayEst});
					//console.warn("TIMESYNC 3");
					this.lastTimeSync = performance.now();
				}
				break;
			
			case "rdy": this.assignNetId(); break;
			
			case "player":
				if(this.netid === false) break;
				/*if(typeof(engine.players[this.netid]) == "undefined")
				{
					settings.players[this.netid] = {};
				}*/
				engine.network = false;
				if(typeof(msg.data) !== "object") break;
				settings.players[this.netid] = msg.data;
				game.processPlayers(!inround());
				engine.players[this.netid].ping = parseInt(this.realPing);
				this.senddata(0); //send playerdata
				if(engine.round == 0 && !inround()) game.doNewRound();
				this.senddata(1); //now start gamedata loop
				break;
			case "turn": //
				if(this.netid === false) break;
				/*var d = parseInt(msg.data)*(360/settings.ARENA_AXES);
				for(var i=Math.abs(d);i>=0;--i)
				{
					engine.players[this.netid].turn(d<0?-1:1);
				}*/
				if(engine.players[this.netid].alive)
				{
					/*if(msg.gtime && msg.gtime < engine.players[this.netid].gameTime)
					{
						engine.players[this.netid].update((msg.gtime-engine.players[this.netid].gameTime)/1000);
					}*/
					
					/*if(msg.gtime && msg.speed && msg.position && !isNaN(msg.rubber) && !isNaN(msg.brakes))
					{
						//don't use this, it easily allows cheating
						//perhaps if a fudge factor can be introduced
						console.warn("turnhack");
						engine.players[this.netid].gameTime = msg.gtime;
						engine.players[this.netid].speed = msg.speed;
						engine.players[this.netid].position.x = msg.position[0];
						engine.players[this.netid].position.y = msg.position[1];
						engine.players[this.netid].position.z = msg.position[2];
						engine.players[this.netid].rubber = msg.rubber;
						engine.players[this.netid].brakes = msg.brakes;
					}*/
					
					if(msg.gtime > engine.gtime && this.version < 0.8)
					{
						this.send({type:"timeSync",data:engine.gtime+ws.timeSyncDiff+ws.delayEst});
					}
					
					var d = normalizeRad(deg2rad(msg.data)-engine.players[this.netid].rotation.z);
					engine.players[this.netid].turn(d<Math.PI?-1:1);
					game.run(true);
				}
				break;
			case "chat":
				//engine.console.print(engine.players[this.netid].getColoredName()+"0xffff7f: "+msg.data+"\n");
				handleChat(engine.players[this.netid],msg.data);
				break;
			case "playdata":
				if(msg.data.chatting !== undefined) engine.players[this.netid].chatting = !!msg.data.chatting;
				if(msg.data.braking !== undefined) engine.players[this.netid].braking = !!msg.data.braking;
				if(msg.data.boosting !== undefined) engine.players[this.netid].boosting = !!msg.data.boosting;
				break;
		}
	}
	onPong()
	{
		if(this.lastPingTime != -Infinity)
		{
			this.realPing = performance.now()-this.lastPingTime;
			if(engine.players[this.netid]) engine.players[this.netid].ping = parseInt(this.realPing);
			this.lastPingTime = -Infinity;
			game.updateScoreBoard();
			this.delayEst = this.realPing/2;
		}
	}
	onLeave()
	{
		var cycle = engine.players[this.netid];
		if(cycle)
		{
			//TODO: handle leaving in game.js instead
			if(cycle.spectator)
				engine.console.print("0xff7f7fSpectator "+cycle.getColoredName()+"0xff7f7f left.\n");
			else
				engine.console.print(cycle.getColoredName()+"0xff7f7f left the game.\n");
			
			if(this.netid+1 == engine.players.length)
			{
				engine.players.splice(this.netid,1);
				settings.players.splice(this.netid,1);
			}
			else
			{
				//engine.players[this.netid] = undefined;
				delete engine.players[this.netid];
				//settings.players[this.netid] = undefined;
				delete settings.players[this.netid];
			}
			
			if(this.version >= 0.73)
				this.server.send({type:"delete",data:this.netid});
			else
				this.server.send({type:"leave",data:this.netid});
		}
	}
	onClose()
	{
		var id;
		for(var i=this.server.clients.length-1;i>=0;--i)
		{
			if(this.server.clients[i] == this)
			{
				id = i;
				break;
			}
		}
		this.onLeave();
		this.server.clients.splice(id,1);
		engine.console.print("User "+this.netid+" disconnected: "+this.r.connection.remoteAddress+"\n",false);
		
		if(this.server.clients.length == 0)
		{
			settings.players.splice(0);
			roundEndForce();
			engine.console.print("Nobody online, sleeping...\n");
		}
		this.netid = -1;
	}
	assignNetId()
	{
		var netid = false;
		for(var x=1;x<settings.players.length;x++) if(!settings.players[x])
		{
			netid = x;
			break;
		}
		if(netid === false) netid = x;
		this.netid = netid;
		engine.console.print("User "+this.netid+" established: "+this.r.connection.remoteAddress+" with version "+this.version+"\n",false);
		
		for(var i=0;i<sets.length;i++)
		{
			var val = settings[sets[i]];
			if(val == Infinity) val = Number.MAX_VALUE;
			this.send({type:"setting",setting:sets[i],data:val});
		}
		this.send({type:"syncdata",netid:netid,rTime:Date.now(),gtime:isFinite(engine.gtime)?engine.gtime:-4000});
		
		this.doPing();
		return netid;
	}
	doPing()
	{
		if(this.lastPingTime != -Infinity)
		{
			//engine.console.print("User "+this.netid+" timed out.\n",false);
			engine.console.print("User "+this.netid+" timed out.\n",this.netid);
			this.send({type:_3dc_loginDenial,msg:"You timed out."});
			var self = this;
			setTimeout(function(){self.connection.terminate()},250);
			return;
		}
		
		//this.send({type:"ping"});
		this.connection.ping();
		this.lastPingTime = performance.now();
		
		var self = this;
		setTimeout(function(){self.doPing()},30000);
	}
	senddata(type=1)
	{
		var data = [],cd,cycle;
		switch(type)
		{
			case 0:
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
				{
					cycle = engine.players[x];
					data.push(cd = {
						x:cycle.position.x,y:cycle.position.y,z:cycle.position.z,dir:cycle.rotation.z,
						speed:cycle.speed, rubber:cycle.rubber,
						alive:cycle.alive, spawntime:cycle.spawntime,
						name: cycle.name, ai: !!cycle.AI,
						cycleColor:cycle.cycleColor, tailColor:cycle.tailColor,
						engineType:cycle.engineType,
						netid:x, team:engine.teams.indexOf(cycle.team),
					});
				}
				break;
			case 1:
				game.run(true);
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
				{
					cycle = engine.players[x];
					data.push(cd = {
						position:[cycle.position.x,cycle.position.y,cycle.position.z],direction:rad2deg(cycle.rotation.z), 
						speed:cycle.speed, rubber:cycle.rubber,
						alive:cycle.alive, spawntime:cycle.spawntime,
						netid:x,
					});
				}
				break;
		}
		switch(type)
		{
			case 0:
				this.send({type:"playerdata",data:data,gtime:engine.gtime});
				break;
			case 1:
				this.send({type:"griddata",data:data,gtime:engine.gtime,req:false});
				clearTimeout(this.timeoutID);
				var self = this;
				if(engine.gtime > 0)
					this.timeoutID = setTimeout(function(){self.senddata()},settings.CYCLE_SYNC_INTERVAL*1000);
				else
					this.timeoutID = setTimeout(function(){self.senddata()},2000);
				break;
		}
	}
}

// clients will litter the entire thing into the global scope, but not servers
if(typeof(module) !== "undefined")
{
	module.exports = {
		Connection3dc:Connection3dc,
		Server3dc:Server3dc,
	};
}
