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
	hideMenu(); engine.inputState = "";
	try
	{
		var connection = new WebSocket('ws'+(settings.CONNECT_SSL?'s':'')+'://'+host+':'+port);
		connection.onmessage = connectionHandler;
		connection.onerror = function(e)
		{ 
			console.log(e); var msg;
			if(engine.network)
			{
				engine.console.print(msg="An error occurred with the connection."); 
			}
			else
			{
				engine.console.print(msg="Couldn't connect to server. Please ensure that you have the right host and port."); 
			}
			disconnectFromGame();menu("leave");showMenu();
			menu("menu:");
			document.getElementById('menu').innerHTML = "<h1>Connection Error</h1><div style='text-align:left;font-size:11pt'>"+msg+"</div>";
		}
		connection.onclose = function(e)
		{
			console.log(e); var msg;
			if(engine.network)
			{
				engine.console.print(msg="Our connection with the server has been terminated.");
				msg += "  ";
				if(e.reason == "") engine.console.print(msg+="No reason given.\n"); else engine.console.print(msg+="Reason: "+e.reason+"\n");
				disconnectFromGame();menu("leave");showMenu();
				menu("menu:");
				document.getElementById('menu').innerHTML = "<h1>Connection Terminated</h1><div style='text-align:left;font-size:11pt'>"+msg+"</div>";
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
	timestep *= settings.CYCLE_SMOOTH_TIME;
	if(timestep > 1) timestep = 1;
	cycle.lastpos.x = (cycle.position.x += (cycle.newPos.x-cycle.position.x)*timestep);
	cycle.lastpos.y = (cycle.position.y += (cycle.newPos.y-cycle.position.y)*timestep);
	cycle.resetCurrWallSegment();
	if(cycle.position.x == cycle.newPos.x && cycle.position.y == cycle.newPos.y) delete cycle.newPos;
}

function connectionHandler(e)
{
	//console.log(e);
	var msg = JSON.parse(e.data);
	switch(msg.type)
	{
		case "ping": engine.connection.send('{"type":"pong"}'); break;
		case "endRound": if(inround()) endRound(); break;
		case "newRound": if(!inround()) newRound(); break;
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
			engine.totalPauseTime += (msg.gtime||0)-engine.gtime;
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
			engine.gtime = (performance.now()/settings.TIME_FACTOR)-engine.timeStart-engine.totalPauseTime-4000;
			if(msg.gtime > engine.gtime)
			{
				engine.gtime = msg.gtime;
				//console.log("S: ",msg.gtime-engine.gtime);
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
						}
						else //jump straight to the position, we're doing a turn
						{
							cycle.lastpos.x = cycle.position.x = data.position[0]||0; 
							cycle.lastpos.y = cycle.position.y = data.position[1]||0;
							delete cycle.newPos;
							
							if(data.wall) { cycle.walls.map = data.wall; cycle.resetWall(false); }
							cycle.gameTime = Math.max(0,msg.gtime);
						}
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
	}
}

function connectToGame()
{
	if(!engine.connection)
	{
		engine.connection = connectTo(settings.CONNECT_HOST,settings.CONNECT_PORT)
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
