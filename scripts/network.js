/*
 * 3DCycles - A lightcycle game.
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

function connectTo(host,port)
{
	engine.playGame = false; engine.inputState = "game";
	try
	{
		var connection = new WebSocket('ws'+(settings.CONNECT_SSL?'s':'')+'://'+host+':'+port);
		connection.onmessage = connectionHandler;
		connection.onerror = function(e)
		{ 
			console.log(e); var msg;
			disconnectFromGame();menu("leave");showMenu();
			menu("menu:connectfail");
			if(engine.network)
			{
				engine.console.print(msg="An error occurred with the connection."); 
			}
			else
			{
				engine.console.print(msg="Couldn't connect to server. Please ensure that you have the right host and port."); 
			}
		}
		connection.onclose = function(e)
		{
			console.log(e); var msg;
			if(engine.network)
			{
				disconnectFromGame();menu("leave");showMenu();
				menu("menu:connectterm");
				engine.console.print(msg="Our connection with the server has been terminated.");
				msg += "  ";
				if(e.reason == "") engine.console.print(msg+="No reason given.\n"); else engine.console.print(msg+="Reason: "+e.reason+"\n");
			}
		}
		return connection;
	}
	catch(e)
	{
		engine.console.print(e+"\n");
		disconnectFromGame();menu("leave");showMenu();
		menu("menu:");
		document.getElementById('menu').innerHTML = "<h1>An error occurred</h1><div style='text-align:left;font-size:11pt'>"+e+"</div>";
	}
}

function doNetSlide(cycle,timestep=1)
{
	if(isNaN(cycle.position.x) || isNaN(cycle.position.y))
	{
		cycle.position.x = cycle.newPos.x;
		cycle.position.y = cycle.newPos.y;
		delete cycle.newPos;
	}
	else
	{
		timestep *= settings.CYCLE_SMOOTH_TIME;
		if(timestep > 1) timestep = 1;
		cycle.lastpos.x = (cycle.position.x += (cycle.newPos.x-cycle.position.x)*timestep);
		cycle.lastpos.y = (cycle.position.y += (cycle.newPos.y-cycle.position.y)*timestep);
		cycle.resetCurrWallSegment();
		if(cycle.position.x == cycle.newPos.x && cycle.position.y == cycle.newPos.y) delete cycle.newPos;
	}
}

function connectionHandler(e)
{
	//console.log(e);
	var msg = JSON.parse(e.data);
	switch(msg.type)
	{
		case "ping": engine.connection.send((JSON.stringify({type:"pong"}))); break;
		case "timeSync": 
			if(msg.data)
			{
				engine.gtime = msg.data;
				engine.connection.send(JSON.stringify({type:"timeSync",data:engine.gtime}));
			}
			engine.connection.timeSync = false;
			break;
		case "version": 
			engine.connection.send(JSON.stringify({type:"version",data:0.7}));
		break;
		case "endRound": if(inround()) endRound(); break;
		case "newRound": 
			if(!engine.playGame) playGame();
			else if(!inround()) newRound();
		break;
		case "setting":
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
			engine.connection.send(JSON.stringify({type:"player",data:settings.player}));
			if(typeof(msg.netid) != "undefined")
			{
				engine.activePlayer = msg.netid||0; //we got id
				engine.network = true;
				
				if(!engine.scene) init();
				//endRound();
			}
			//engine.totalPauseTime += (msg.gtime||0)-engine.gtime;
			if(msg.gtime !== undefined) engine.gtime = msg.gtime;
			break;
		case "leave":
			if(engine.players[msg.data])
			{
				if(msg.data == engine.activePlayer)
				{
					console.warn("Player being deleted is ours.");
				}
				if(msg.data == engine.viewTarget)
				{
					changeViewTarget(1);
				}
				if(engine.players[msg.data].alive) engine.players[msg.data].kill();
				engine.players.splice(msg.data,1);
				updateScoreBoard();
			}
			else
			{
				console.warn("Left player doesn't seem to exist.");
			}
			break;
		case "playerdata":
			console.log(msg.data);
			for(var i=msg.data.length;i--;) if(typeof(msg.data[i]) != "undefined")
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
					
					engine.players[data.netid].spawn(cycleinfo,false);
					
					audioMixing(engine.players[data.netid]);
				}
				else
				{
					engine.players[data.netid].name = data.name;
					engine.players[data.netid].cycleColor = data.cycleColor;
					engine.players[data.netid].tailColor = data.tailColor;
				}
			}
			break;
		case "griddata":
			if(!engine.playGame) playGame();
			//console.log(msg.data);
			//engine.gtime = (performance.now()/settings.TIME_FACTOR)-engine.timeStart-engine.totalPauseTime-4000;
			if(msg.gtime > engine.gtime)
			{
				//engine.gtime = msg.gtime;
				//console.log("S: ",msg.gtime-engine.gtime);
				if(!engine.connection.timeSync) 
				{
					engine.connection.timeSync = true;
					engine.connection.send(JSON.stringify({type:"timeSync",data:engine.gtime}));
				}
			}
			var delta = engine.gtime-(msg.gtime);
			var timestep = delta/1000;
			//var delta = timestep*1000;
			for(var i=msg.data.length;i--;) 
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
					
					cycle.speed = data.speed; cycle.rubber = data.rubber;
					
					if(cycle.alive)
					{
						var olddir = cycle.rotation.z, newdir = deg2rad(data.direction||0);
						
						if(!data.wall && normalizeRad(olddir) == normalizeRad(newdir) && isFinite(data.position[0]) && isFinite(data.position[1])) //slide to position
						{
							if(!cycle.newPos) cycle.newPos = new THREE.Vector2(cycle.position.x,cycle.position.y);
							cycle.newPos.x = data.position[0]; cycle.newPos.y = data.position[1];
							
							if(!cycle.handleNetTurn) 
							{
								doNetSlide(cycle,Infinity);
								cycle.handleNetTurn = true;
							}
						}
						else if(cycle.handleNetTurn) //jump straight to the position, we're doing a turn
						{ //also, don't handle updates until our last turn has been sent by the server
							cycle.lastpos.x = cycle.position.x = data.position[0]||0; 
							cycle.lastpos.y = cycle.position.y = data.position[1]||0;
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
							
						cycle.lastpos.z = cycle.position.z = data.position[2]||0;
						
						
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
			updateScoreBoard(); //console.log(timestep);
			break;
		case "scoredata":
			for(var i=msg.data.length;i--;) 
				if(typeof(msg.data[i]) != "undefined")
				{
					var data = msg.data[i];
					var cycle = engine.players[data.netid];
					cycle.chatting = data.chatting||false;
					cycle.ping = data.ping||0;
					cycle.score = data.score||0;
					engine.lastPingTime = performance.now();
				}
			updateScoreBoard();
			break;
		case "team":
			engine.teams.splice(0);
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
					if(zone.type == "flagHeld") myZone.cfg.heldBy = engine.players[zone.heldBy];
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

function connectToGame()
{
	if(!engine.connection)
	{
		engine.connection = connectTo(settings.CONNECT_HOST,settings.CONNECT_PORT)
		document.getElementById("progtitle").innerHTML = tStringify("@progtitleshort@ &bull; Connecting to "+settings.CONNECT_HOST+":"+settings.CONNECT_PORT);
		menu("menu:connect");
	}
}

function disconnectFromGame()
{
	if(engine.connection && engine.connection.close) engine.connection.close();
	engine.connection = engine.network = false;
	engine.viewTarget = engine.activePlayer = 0;
	
	for(var i=netChanged.length-1;i>=0;--i)
	{
		chsetting(netChanged[i][0],netChanged[i][1],true);
	}
	netChanged = [];
}
