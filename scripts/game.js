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

(function(game){

game.doNewRound = function()
{
	if(engine.uRound !== false) { clearTimeout(engine.uRound); engine.uRound = false; }
	if(engine.roundCommencing) return;
	game.endRound();
	setTimeout(game.newRound,engine.dedicated?300:0); //give clients an opportunity to sync their data
}

game.endRound = function()
{
	if(window.svr) 
	{
		window.svr.send({"type":"endRound"});
		window.svr.send({"type":"syncdata","gtime":-4000});
	}
	
	engine.roundCommencing = true;
	//engine.hud.hide();
	if(engine.hud) engine.hud.game.style.opacity = 0;
	engine.console.print("Clearing grid...\n",false);
	if(engine.renderer) engine.renderer.clear();
	if(engine.audio) 
	{
		engine.audio.stopCycles();
		if(settings.SOUNDS_EXTRO)
			engine.audio.playSound({buffer:engine.audio.bLoader.other+2,vol:0.5});
	}
	if(!engine.network)
	{
		//if(settings.ROUND_CENTER_MESSAGE != "")
		{
			centerMessage(settings.ROUND_CENTER_MESSAGE);
		}
	}
	engine.gtime = -4000;
	for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
	{
		engine.players[x].alive = false;
	}
	while(engine.scene.children.length > 0)
	{ 
		engine.scene.remove(engine.scene.children[0]); 
	}
	//if(!engine.network) engine.players.splice(0);
}

game.end = function()
{
	game.endRound();
	engine.players.splice(0);
	engine.round = 0;
}

game.play = function()
{
	engine.playGame = true;
	if(!engine.scene)
	{
		init();
	}
	else
	{
		engine.paused = false;
		if(engine.hud) engine.hud.show();
	}
	hideMenu(); game.newRound();
	engine.inputState = 'game'; //change input state to accept game controls
	if(engine.network)
	{
		document.getElementById("progtitle").innerHTML = tStringify("@progtitleshort@ &bull; Playing online");
	}
	else
	{
		document.getElementById("progtitle").innerHTML = tStringify("@progtitleshort@ &bull; Playing locally");
	}
}

function revertMap()
{
	if(engine.dedicated)
	{
		engine.console.print("Unable to load map file. Reverting...\n",true);
		chsetting("MAP_FILE",engine.loadedMap);
		game.loadRound();
	}
	else
	{
		var mapfile = settings.RESOURCE_REPOSITORY_CACHE+(settings.MAP_FILE.replace(/\(.+\)/,""));
		engine.console.print("Downloading map from "+mapfile+"...\n",false);
		httpGetAsync(mapfile,game.loadRound,function()
		{
			engine.console.print("Unable to load map file. Ignoring for now...\n",false);
			game.loadRound();
		});
	}
}

game.newRound = function()
{
	if(engine.newRound) return;
	engine.newRound = true;
	engine.roundCommencing = true;
	/////////////LIGHTS
	var light1 = new THREE.AmbientLight( 0x666666 ); // soft white light
	engine.scene.add( light1 );
	
	var light = new THREE.DirectionalLight( 0xffffff, 1 ); 
	light.castShadow = true;
	light.position.set( 4, 1, 0 ); 
	engine.scene.add( light );
	
	var light2 = new THREE.DirectionalLight( 0xffffff, 1 ); 
	light2.castShadow = true;
	light2.position.set( -4, -1, 0 ); 
	engine.scene.add( light2 );
	//////////end of lights
	
	var aspectRatio = (window.innerWidth / window.innerHeight);
	engine.camera = new THREE.PerspectiveCamera( settings.CAMERA_FOV, aspectRatio, settings.CAMERA_NEAR_RENDER, settings.CAMERA_FAR_RENDER );
	engine.camera.userViewDir = false;
	engine.camera.up = new THREE.Vector3(0,0,1); //Z is up, X and Y is l+r and b+f
	//engine.camera.position.set(247, 247, 3);
	
	engine.viewTarget = engine.activePlayer;
	
	//engine.cameraOrbit = new THREE.OrbitControls(engine.camera);
	//engine.cameraOrbit.maxDistance = 400;
	
	//BELOW THIS LINE DEPENDS ON GAME TYPE
	
	//MAP
	var maps = settings.MAP_ROTATION.split(";");
	if(settings.ROTATION_TYPE > 0)
	{
		switch(settings.ROTATION_TYPE)
		{
			case 1:
				engine.currrot += 1;
				break;
			case 2: // when matches are implemented
				if(engine.rounds == 0) engine.currrot += 1;
				break;
		}
		if(engine.currrot > maps.length) engine.currrot = 0;
		settings.MAP_FILE = maps[engine.currrot];
	}
	if(settings.MAP_FILE != "" && settings.MAP_FILE != engine.loadedMap)
	{
		var mapfile = settings.RESOURCE_REPOSITORY_SERVER+(settings.MAP_FILE.replace(/\(.+\)/,""));
		engine.console.print("Downloading map from "+mapfile+"...\n",false);
		httpGetAsync(mapfile,game.loadRound,revertMap);
	}
	else
	{
		game.loadRound();
	}
}
game.teamColor = function(id)
{
	id += 1;
	if(settings["TEAM_NAME_"+id])
	{
		return new THREE.Color(settings["TEAM_RED_"+id]/15,settings["TEAM_GREEN_"+id]/15,settings["TEAM_BLUE_"+id]/15);
	}
	return new THREE.Color();
}
function createAIsettings()
{
	var AI_NUM = 1;
	for(var z=engine.players.length-1;z>=0;--z) if(engine.players[z] && engine.players[z].AI) {AI_NUM++;}
	var cycleColor = [0x000000,0xff0000,0x00ff00,0x0000ff][Math.round(Math.random()*3)];
	var tailColor = [0x0000ff,0xff0000,0xffff00,0x00ff00][Math.round(Math.random()*3)];
	var colorcode;
	if(settings.ALLOW_TEAM_NAME_COLOR)
	{
		colorcode = cycleColor.toString(16);
		colorcode = ("0".repeat(6-colorcode.length))+colorcode;
	}
	else
	{
		cycleColor = tailColor = game.teamColor(1);
		colorcode = cycleColor.getHexString();
	}
	var cycleinfo = { ai:true,
	cycleColor:cycleColor, tailColor:tailColor,
	/*engineType: 5,*/ engineType:(settings.players[0])?settings.players[0].engineType:5, spectating:false,
	name: settings.AI_DUAL_COLOR_NAME?'AI0x'+colorcode+'#'+AI_NUM:'AI#'+AI_NUM 
	};
	return cycleinfo;
}
function calculateSpawn(x)
{
	var spawnslength = engine.map.spawns.length;
	if(!engine.map.spawns[x])
	{
		var mult = Math.floor((x/spawnslength));
		var currspawn = x-(spawnslength*mult);
		var alt = (mult/2 != Math.floor(mult/2));
		console.log(mult);
		if(alt) mult = -Math.ceil(mult/2)
		else mult = mult/2
		console.log(mult,currspawn);
		var spawns = JSON.parse(JSON.stringify(engine.map.spawns[Math.min(currspawn,(spawnslength-1))]||[]));
		spawns[0] -= mult*settings.SPAWN_WINGMEN_SIDE;
		spawns[1] -= Math.abs(mult)*settings.SPAWN_WINGMEN_BACK;
	}
	else
	{
		var spawns = engine.map.spawns[x];
	}
	return spawns;
}
function processPlayer(x,cfg)
{
	cfg.name = cfg.name.replace(/\n/g," ");
	if(removeColors(cfg.name).length > 15) 
	{
		var str = ""+cfg.name;
		cfg.name = "";
		var len = 0;
		console.log(str,str.length);
		for(var i=0;len<15&&i<str.length;++i)
		{
			if(str[i] == "0" && str[i+1] == "x")
			{
				var color = str.slice(i,i+8);
				if(removeColors(color) != color)
				{
					cfg.name += color;
					i += 7;
					continue;
				}
			}
			cfg.name += str[i];
			++len;
		}
		if(removeColors(cfg.name).length > 15) 
		{
			// in case there's a bug in here somewhere
			cfg.name = removeColors(cfg.name).slice(0,15);
		}
	}
	if(engine.players[x])
	{
		var cycle = engine.players[x];
		cycle.engineType = (typeof(cfg)=="undefined")?5:cfg.engineType;
		//if(x == engine.activePlayer && !engine.dedicated)
		{
			var cycleColor = cfg.cycleColor,tailColor = cfg.tailColor;
			if(!settings.ALLOW_TEAM_NAME_COLOR) { cycleColor = tailColor = game.teamColor(engine.teams.indexOf(engine.players[x].team)); }
			if(cycle.forcedName)
			{
				if(cycle.forcedName != cycle.name)
				{
					var out = cycle.getColoredName()+"0x7fff7f was renamed to ";
					cycle.cycleColor = cycleColor;
					cycle.tailColor = tailColor;
					cycle.name = cycle.forcedName;
					engine.console.print(out+cycle.getColoredName()+"\n");
				}
				else
				{
					var msg = cycle.getBoringName()+" wanted to change their name to "+removeColors(cfg.name)+" but was disallowed by admin.\n";
					engine.console.print(msg);
				}
			}
			else if(cycle.name != cfg.name)
			{
				var out = cycle.getColoredName()+"0x7fff7f renamed to ";
				cycle.cycleColor = cycleColor;
				cycle.tailColor = tailColor;
				cycle.name = cfg.name;
				engine.console.print(out+cycle.getColoredName()+"\n");
			}
			else
			{
				cycle.cycleColor = cycleColor;
				cycle.tailColor = tailColor;
			}
			if(cycle.spectating != cfg.spectating)
			{
				cycle.spectating = cfg.spectating;
				if(cycle.spectating)
				{
					engine.console.print(cycle.getColoredName()+"0xff7f7f left to spectator mode.\n");
				}
				else
				{
					engine.console.print(cycle.getColoredName()+"0x7fff7f entered from spectator mode.\n");
				}
			}
		}
	}
	else
	{
		engine.players[x] = (new Player(cfg));
		var cycle = engine.players[x];
		if(cycle.spectating)
		{
			engine.console.print(cycle.getColoredName()+"0xff7f7f entered as spectator.\n");
		}
		else
		{
			engine.console.print(cycle.getColoredName()+"0x7fff7f entered the game.\n");
		}
	}
	if(cycle.spectating)
	{
		cycle.team = null;
	}
	else if(!cycle.team)
	{
		if(engine.teams.length < settings.TEAMS_MAX)
		{
			engine.teams.push(cycle.team = new Team({name:cfg.name}));
		}
		else
		{
			var minPCount = 0, minPlayers = Infinity, minTeam;
			for(var x=engine.teams.length-1;x>=0;--x) if(engine.teams[x])
			{
				if(engine.teams[x].members.length == minPlayers)
				{
					minPCount++;
					if(minTeam.push)
					{
						minTeam.push(x);
					}
					else
					{
						minTeam = [minTeam,x];
					}
				}
				else if(engine.teams[x].members.length < minPlayers)
				{
					minPlayers = engine.teams[x].members.length;
					minTeam = x; minPCount = 1;
				}
			}
			if(minPCount != 1)
			{
				minTeam = Math.floor(Math.random()*minTeam.length);
			}
			cycle.team = engine.teams[minTeam];
		}
		cycle.team.members.push(cycle);
	}
}
game.processPlayers = function(removeAIs=true)
{
	var numAIs = 0, numPlay = 0, numSpec = 0, numWantPlay = 0;
	for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
	{
		if(engine.players[x].AI) numAIs++;
		if(engine.players[x].spectating) numSpec++; else numPlay++;
		//if(engine.players[x].spectating && !settings.players[x].spectating) numWantPlay++;
	}
	var numHuman = numPlay-numAIs;
	if(removeAIs)
	{
		for(var x=settings.TEAMS_MAX;x<engine.teams.length;++x) if(engine.teams[x])
		{
			for(var i=engine.teams[x].members.length-1;i>=0;--i)
			{
				engine.console.print(engine.teams[x].members[i].getColoredName()+"0xff7f7f left to spectator mode.\n");
				engine.teams[x].members[i].spectating = true;
			}
		}
		engine.teams.splice(settings.TEAMS_MAX);
	}
	for(var x=settings.players.length-1;x>=0;--x) if(settings.players[x])
	{
		if(engine.players[x] && engine.players[x].AI)
		{
			engine.players[engine.players.length-1] = engine.players[x];
			engine.players[x] = undefined;
		}
		if(!engine.players[x])
		{
			numPlay++; numHuman++;
		}
		processPlayer(x,settings.players[x]);
	}
	if(removeAIs)
	{
		console.log(numHuman);
		var shouldAIs = Math.max(0,(settings.MIN_PLAYERS-numHuman));
		if(!settings.AI_TEAM)
		{
			shouldAIs += (numHuman <= settings.SP_HUMANS_COUNT)?settings.SP_NUM_AIS:settings.NUM_AIS;
		}
				
		if(shouldAIs > numAIs)
		{
			var AIsToAdd = (shouldAIs-numAIs);
			console.log(numAIs+" AIs in the game, adding "+AIsToAdd+".");
			for(var x=AIsToAdd;x>0;--x)
			{
				var cycleinfo = createAIsettings();
				processPlayer(engine.players.length,cycleinfo);
			}
			numAIs += AIsToAdd; 
		}
		else if(numAIs != 0)
		{
			var AIsToDealWith = (numAIs-shouldAIs);
			console.log(numAIs+" AIs in the game, removing "+AIsToDealWith+".");
			if(AIsToDealWith != 0)
			{
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
				{
					if(engine.players[x].AI)
					{
						engine.console.print(engine.players[x].getColoredName()+"0xff7f7f left the game.\n");
						engine.players.splice(x,1);
						AIsToDealWith--;
						if(window.svr)
						{
							window.svr.send({type:"leave",data:x});
						}
					}
					if(AIsToDealWith == 0) break;
				}
			}
		}
		
		var teamsByScore = [];
		//clean up teams / remove ghost teams
		for(var x=engine.teams.length-1;x>=0;--x) if(engine.teams[x])
		{
			for(var i=engine.teams[x].members.length-1;i>=0;--i)
			{
				if(engine.players.indexOf(engine.teams[x].members[i]) == -1)
				{
					engine.teams[x].members.splice(i,1);
				}
			}
			if(engine.teams[x].members.length == 0)
			{
				engine.teams.splice(x,1);
			}
			else
			{
				teamsByScore.push(engine.teams[x]);
			}
		}
		
		//and finally spawn everyone, sorted by score
		teamsByScore.sort(function(a,b){return b.score-a.score});
		for(var x=teamsByScore.length-1;x>=0;--x)
		{
			var pos = calculateSpawn(x);
			engine.teams[x].x = pos[0]; engine.teams[x].y = pos[1]; engine.teams[x].z = pos[2];
			engine.teams[x].dir = deg2rad(pos[3]);
			
			engine.teams[x].spawn(false,false);
		}
		if(!engine.dedicated && !engine.players[engine.activePlayer].alive) game.changeViewTarget(1);
	}
	
	if(window.svr) 
	{
		window.svr.clients.forEach(function(ws){ws.senddata(2);ws.senddata(0)});
	}
}//*/

game.loadRound = function(dlmap)
{
	if(typeof(dlmap) !== "undefined")
	{
		engine.mapString = dlmap;
		engine.loadedMap = settings.MAP_FILE;
	}
	
	engine.mapXML = xmlify(engine.mapString);

	engine.console.print("Preparing grid...\n",false);
	
	if(window.svr) window.svr.send({"type":"newRound"});
	
	//virtual map data (used for positions, lines and stuff to calculate)
	engine.map = {zones:[],spawns:[],walls:[]};
	engine.expl = []; engine.deaths = 0;
	engine.winzone = false;
	
	//GRID
	buildGrid();//buildObjects.js
	engine.scene.add(engine.grid);
	
	//WALLS
	buildWalls();//buildObjects
	engine.scene.add(engine.walls);
	
	//ZONES
	buildZones();
	engine.scene.add(engine.zones);
	
	if(engine.audio && settings.SOUNDS_INTRO)
		engine.audio.playSound({buffer:engine.audio.bLoader.other+1,vol:0.5});
	
	if(settings.ROUND_CONSOLE_MESSAGE != "")
	{
		engine.console.print(settings.ROUND_CONSOLE_MESSAGE+"\n");
	}
	loadcfg(settings.ROUND_COMMAND.replace(/\\n/g,"\n"));
	
	//GAME
	engine.gtime = -4000;
	
	//PLAYERS
	//CYCLE
	if(!engine.network)
	{
		game.processPlayers();game.processPlayers();
		if(engine.round == 0)
		{
			engine.console.print("Resetting scores...\n");
			for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
			{
				engine.players[x].score = 0;
			}
		}
		engine.round++;
		engine.console.print("Go (round "+engine.round+" of "+settings.LIMIT_ROUNDS+")!\n");
	}

	if(!engine.camera)
	{
		var aspectRatio = (window.innerWidth / window.innerHeight);
		engine.camera = new THREE.PerspectiveCamera( settings.CAMERA_FOV, aspectRatio, settings.CAMERA_NEAR_RENDER, settings.CAMERA_FAR_RENDER );
		engine.camera.up = new THREE.Vector3(0,0,1); //Z is up, X and Y is l+r and b+f
	}
	engine.camera.position.set(engine.logicalBox.center.x*engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.center.y*engine.REAL_ARENA_SIZE_FACTOR,3);
	try{engine.camera.lookAt( new THREE.Vector3(engine.players[engine.viewTarget].position.x,engine.players[engine.viewTarget].position.y,engine.player[engine.viewTarget].position.z) );}
	catch(e){engine.camera.lookAt( new THREE.Vector3(engine.logicalBox.center.x*engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.center.y*engine.REAL_ARENA_SIZE_FACTOR,0) );}
	
	game.updateScoreBoard();
	
	engine.lastGameTime = engine.lastRenderTime = engine.fpsTime = engine.timeStart = performance.now();
	engine.totalPauseTime = 0;
	engine.fastestPlayer = engine.fastestSpeed = 0;
	engine.timemult = 1;
	engine.asendtm = 0;
	engine.winner = undefined;
	engine.roundCommencing = false;
	engine.newRound = false;
	
	game.start();

}//end of init main

game.run = function(oneoff=false)
{
	if(!engine.roundCommencing && !engine.paused) 
	{
		if(engine.network) engine.network.syncPlayData();
		if(!oneoff && settings.GAME_LOOP != 1) {setTimeout(game.run,1000/settings.DEDICATED_FPS); engine.gameRunning = true;}
		//time handlers and delta
		var timenow = performance.now()/settings.TIME_FACTOR;
		var rDelta = (timenow-engine.lastGameTime);
		if(rDelta > settings.TIMESTEP_MAX*1000 && engine.gtime > 0)
		{
			var more = true;
			rDelta = settings.TIMESTEP_MAX*1000;
			//engine.timeStart += rDelta;
		} else var more = false;
		var delta = rDelta*engine.timemult;
		var timestep = delta/1000;
		engine.totalPauseTime += (timenow-engine.lastGameTime)-delta;
		engine.lastGameTime += rDelta;
		engine.avgTimeStep += rDelta/1000; engine.avgTimeStep /= 2;
		if(!engine.network && !engine.dedicated) engine.players[0].ping = parseInt(engine.avgTimeStep*1000)
		//if(!engine.network && timestep > engine.avgTimeStep*10 && rDelta == delta) {engine.totalPauseTime += timestep; console.log("Compensated skip of "+delta+"ms."); timestep = engine.avgTimeStep;}
		engine.timemult += (engine.asendtm*timestep);
		if(engine.timemult > 100) engine.timemult = 100;
		//var timeElapsed = timenow-engine.timeStart-engine.totalPauseTime-4000;
		//skipping ahead at the beginning of the round is silly
		//engine.gtime = timeElapsed;
		var timeElapsed = (engine.gtime += delta);
		
		if(!engine.thread_collisiondetect && (settings.GAME_LOOP != 0.5 || !oneoff)) getCycleSensors();
		
		var pldata = {};
		for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
		{
			var cycle = engine.players[x];
			if(cycle.alive)
			{
				if(cycle.newPos) doNetSlide(cycle,timestep);
				if(timeElapsed > 0)
				{
					if(x == engine.activePlayer)
					{
						if(settings.HACK_TURN_LEFT_WHEN_POSSIBLE > 0)
						{
							if(cycle.sensor.left > settings.HACK_TURN_SENSOR_DIST) 
							{
								cycle.turn(-1);
								settings.HACK_TURN_LEFT_WHEN_POSSIBLE--;
							}
						}
						if(settings.HACK_TURN_RIGHT_WHEN_POSSIBLE > 0)
						{
							if(cycle.sensor.right > settings.HACK_TURN_SENSOR_DIST) 
							{
								cycle.turn(1);
								settings.HACK_TURN_RIGHT_WHEN_POSSIBLE--;
							}
						}
					}
					//bot turning
					if(cycle.AI)
					{
						cycle.AI.think(timestep);
					}
					else if(x==engine.activePlayer && (cycle.chatting || settings.CHATBOT_ALWAYS_ACTIVE))
					{
						if(timenow > cycle.lastTurnTime+(settings.CYCLE_DELAY*1000) && cycle.sensor.front < Math.min(5,cycle.sensor.left,cycle.sensor.right))
						{
							if(cycle.sensor.right < cycle.sensor.left) cycle.turn(-1);
							else if(cycle.sensor.right > cycle.sensor.left) cycle.turn(1);
							else cycle.turn([-1,1][Math.round(Math.random()*1)]);
						}
					}
					//do turning
					//if(cycle.turnQueue.length > 0)
					{
						//if(cycle.turnQueue.length > 0 && x == 0)console.log(JSON.parse(JSON.stringify(cycle.turnQueue)));
						if(cycle.turnQueue.length > settings.CYCLE_TURN_MEMORY) cycle.turnQueue.splice(0,cycle.turnQueue.length-settings.CYCLE_TURN_MEMORY);
						var shouldTime = cycle.lastTurnTime+(settings.CYCLE_DELAY*1000);
						if(cycle.turnQueue.length > 0 && timeElapsed >= shouldTime/*-delta*/)
						{
							//allow the cycle to turn when it should (???)
							//var diff = (shouldTime-timeElapsed)/1000;
							//cycle.update(diff);
							if(settings.CYCLE_MIDAIR_TURN || cycle.position.z-cycle.sensor.bottom == cycle.model.rotation.y)
							{
								var dir = cycle.turnQueue[0],dirmult;
								var olddir = cdir(cycle.rotation.z);
								if(engine.network && settings.DEBUG_NETWORK_TURN_WAIT)
								{
									/*var rot = normalizeRad(cycle.rotation.z - (pi(2)/settings.ARENA_AXES)*dir);
									engine.connection.send(JSON.stringify({
										type:"turn",data:rad2deg(rot),gtime:cycle.gameTime
									}));*/
									engine.network.sendTurn(dir,cycle);
									cycle.lastTurnTime = Infinity;
									cycle.turnQueue.splice(0,1); continue;
								}
								cycle.handleTurn(dir);
								if(engine.network) engine.network.syncTurn(cycle);
								if(window.svr) //force a player sync
								{
									window.svr.syncCycle(cycle, false);
									if(cycle.speed > 1) cycle.update(0.01/cycle.speed);
									window.svr.syncCycle(cycle, true);
								}
							}
							cycle.turnQueue.splice(0,1);
						cycle.lastTurnTime = timeElapsed;
						}
					}
					cycle.update();
				}
				if(cycle.rubber > settings.CYCLE_RUBBER+0.0001)
					cycle.rubber = settings.CYCLE_RUBBER+0.0001;
				else if(cycle.rubber > 0)
				{
					cycle.rubber -= (timestep/settings.CYCLE_RUBBER_TIME)*cycle.rubber;
					if(cycle.sentRubber) cycle.sentRubber = false;
				}
				else
					cycle.rubber = 0;
				//if(timeElapsed/1000 > -3 && cycle.alive)
			}
			else if(cycle.walls.map.length != 0 && timenow-cycle.dedtime >= settings.WALLS_STAY_UP_DELAY*1000)
			{
				cycle.walls.map = [];
				console.log("DELETE WALLS id "+x);
				
			}
			else if(settings.RESPAWN_TIME >= 0 && !cycle.alive && timenow-cycle.dedtime > settings.RESPAWN_TIME*1000)
			{
				cycle.spawn({x:cycle.position.x||0,y:cycle.position.y||0,z:cycle.position.z||0,dir:cycle.rotation.z||0});
			}
		}
		if(timeElapsed > -3000 && timeElapsed < 1000)
		{
			//timer
			var time=-timeElapsed/1000,gTime = Math.ceil(time);
			if(gTime < 0) gTime = 0;
			if(typeof(engine.timer)=="undefined" || engine.timer != gTime)
			{
				engine.timer = gTime;
				if(engine.hud) engine.hud.fadein = true;
				if(engine.dedicated) console.log(gTime);
				else centerMessage(gTime,(gTime-time));
				//engine.console.print(gTime+"\n");
			}
		}
		else if(!engine.network && typeof(engine.winner) == "undefined")
		{
			game.checkForWinner();
		}
		
		if(!engine.network)
		{
			if(!engine.winzone && settings.WIN_ZONE_MIN_ROUND_TIME+engine.deaths*(settings.WIN_ZONE_MIN_LAST_DEATH) < timeElapsed/1000)
			{
				var zone = {expansion:settings.WIN_ZONE_EXPANSION};
				if(settings.WIN_ZONE_DEATHS)
				{
					engine.console.print("Death zone activated. Avoid it!\n");
					zone.type = "death";
				}
				else
				{
					engine.console.print("Win zone activated. Enter it to win the round.\n");
					zone.type = "win";
				}
				zone.radius = Math.min(SMALL_NUM,settings.WIN_ZONE_INITIAL_SIZE)*engine.REAL_ARENA_SIZE_FACTOR;
				zone.x = engine.REAL_ARENA_SIZE_FACTOR*(engine.logicalBox.center.x+(settings.WIN_ZONE_RANDOMNESS*(Math.random()-0.5)*2)*engine.logicalBox.center.x);
				zone.y = engine.REAL_ARENA_SIZE_FACTOR*(engine.logicalBox.center.y+(settings.WIN_ZONE_RANDOMNESS*(Math.random()-0.5)*2)*engine.logicalBox.center.y);
				new Zone(zone).spawn();
				console.log("ZONE SPAWNED: "+zone.type);
				engine.winzone = true;
			}
		}
		
		
		for(var x=engine.zones.children.length-1;x>=0;--x)
		{
			var zone = engine.zones.children[x].cfg;
			//zones expand
			if(zone.radius > 0)
			{
				engine.zones.children[x].scale.x = engine.zones.children[x].scale.y = (zone.radius += zone.expansion*timestep*engine.REAL_ARENA_SIZE_FACTOR);
			}
			else if(zone.radius < 0) engine.zones.children[x].scale.x = engine.zones.children[x].scale.y = zone.radius = 0;
			
			if(zone.type == "ball" || zone.type == "soccerball")
			{
				for(var z=engine.zones.children.length-1;z>=0;--z)
				{
					var z2n = engine.zones.children[z].cfg;
					if(
						(
							(zone.type == "ball" && z2n.type == "fortress") ||
							(zone.type == "soccerball" && z2n.type == "soccergoal")
						) && 
						is_in_circle(z2n.mesh.position.x,z2n.mesh.position.y,z2n.radius,zone.mesh.position.x,zone.mesh.position.y,zone.radius))
					{
						if(!engine.network && engine.winner == undefined)
						{
							if(zone.lastHitCycle)
							{
								if(engine.teams.indexOf(zone.lastHitCycle.team) == z2n.team)
								{
									engine.console.print(zone.lastHitCycle.getColoredName()+"0xRESETT scored in their own goal and lost a point. Boo!\n");
									zone.lastHitCycle.addScore(-1);
								}
								else
								{
									engine.console.print(zone.lastHitCycle.getColoredName()+"0xRESETT scored a goal for 1 point.\n");
									zone.lastHitCycle.addScore(1);
								}
							}
							engine.winner = false; game.reqNewRound();
						}
						else
						{
							zone.xdir *= 1-timestep; zone.ydir *= 1-timestep;
							if(!engine.dedicated) centerMessage("Goal!");
						}
					}
				}
				if(settings.BALL_SPEED_DECAY)
				{
					var dir = cdir(Math.atan2(zone.ydir,zone.xdir));
					var speed = Math.sqrt((zone.xdir*zone.xdir)+(zone.ydir*zone.ydir));
					var decay = settings.BALL_SPEED_DECAY*delta;
					if(decay > speed) decay = speed;
					speed -= decay;
					zone.xdir = dir[0]*speed; zone.ydir = dir[1]*speed;
				}
			}
			else if(zone.type == "flagHeld")
			{
				zone.mesh.position.x = zone.heldBy.position.x;
				zone.mesh.position.y = zone.heldBy.position.y;
				var h=[];
				for(var z=engine.zones.children.length-1;z>=0;--z)
				{
					if(zone.type == "flagHeld") { h.push(zone.team); }
				}
				for(var z=engine.zones.children.length-1;z>=0;--z)
				{
					var z2n = engine.zones.children[z].cfg;
					if(
						(zone.type == "flagHeld" && z2n.type == "fortress") && 
						is_in_circle(z2n.mesh.position.x,z2n.mesh.position.y,z2n.radius,zone.heldBy.position.x,zone.heldBy.position.y,zone.radius))
					{
						if(engine.teams.indexOf(zone.heldBy.team) == z2n.team)
						{
							if(h.length > 1 && h.indexOf(z2n.team) > -1)
							{
								if(!zone.homeMSG)
								{
									engine.console.print(zone.heldBy.getColoredName()+"0xRESETT took the enemy flag home, but their team flag must be returned to their base. Get them!\n");
									zone.homeMSG = true;
								}
							}
							else
							{
								engine.console.print(zone.heldBy.getColoredName()+"0xRESETT took the flag to their base for 1 point!\n");
								zone.heldBy.addScore(1);
								zone.heldBy.hasFlag = null;
								zone.type = "flag";
								zone.mesh.position.x = zone.px;
								zone.mesh.position.y = zone.py;
								zone.homeMSG = false;
								zone.netSync();
							}
						}
					}
				}
			}
			
			//zone effect
			var inzone = false;
			for(var y=engine.players.length-1;y>=0;--y) if(engine.players[y] && engine.players[y].alive)
			{
				var cycle = engine.players[y];
				
				//dont handle zones we don't need to
				if(!zone.netObject/* || zone.type.indexOf("ball") >= 0*/)
				{
					//var lastdist = zone.distance(cycle.lastpos);
					//var dist = zone.distance(cycle.position);
					var lastdist = pointDistance(zone.mesh.position.x,zone.mesh.position.y,cycle.lastpos.x,cycle.lastpos.y)-zone.radius;
					var dist = pointDistance(zone.mesh.position.x,zone.mesh.position.y,cycle.position.x,cycle.position.y)-zone.radius;
					var inZone = (dist <= 0), wasInZone = (lastdist <= 0);
					if(inZone)
					{
						var timediff = cycle.speed*dist;
						var hitTime = timeElapsed-timediff;
						if(!wasInZone) zone.onEnter(cycle,hitTime,timestep);
						if(cycle.alive) zone.onInside(cycle,engine.gtime,timestep);
					}
					else if(wasInZone) //left zone
					{
						zone.onLeave(cycle,engine.gtime,timestep); //TODO: figure out "precise" left time
					}
					else
					{
						zone.onOutside(cycle,engine.gtime,timestep);
					}
				}
				if(zone.type == "fortress") //fortress recover rate
				{
					zone.rotationSpeed += (settings.ZONE_SPIN_SPEED-zone.rotationSpeed)*timestep*settings.FORTRESS_CONQUEST_DECAY_RATE;
				}
			}
			if(typeof(zone.xdir)+typeof(zone.ydir) !== "undefinedundefined")
			{
				if(zone.bounce && zone.mesh.walldist <= timestep)
				{
					var dir = cdir(Math.atan2(zone.ydir,zone.xdir));
					//zone.mesh.position.x -= dir[0]*zone.mesh.walldist; zone.mesh.position.y -= dir[1]*zone.mesh.walldist;
					var mindist=Infinity,apc=false;
					//var px = zone.mesh.position.x+(zone.mesh.walldist*zone.xdir), py = zone.mesh.position.y+(zone.mesh.walldist*zone.ydir);
					var px = zone.mesh.position.x+zone.radius*dir[0], py = zone.mesh.position.y+zone.radius*dir[1];
					//lineIntersect(posx,posy,posx+(dir[0]*rg),posy+(dir[1]*rg),w1x,w1y,w2x,w2y)
					for(var i=4;i>0;--i) 
					{
						var xdir = Math.sin(Math.PI*2*(i/4)), ydir=Math.cos(Math.PI*2*(i/4));
						if(lineIntersect(zone.mesh.position.x,zone.mesh.position.y,zone.mesh.position.x+xdir*(zone.radius+zone.mesh.walldist),zone.mesh.position.y+ydir*(zone.radius+zone.mesh.walldist),zone.mesh.wall[0],zone.mesh.wall[1],zone.mesh.wall[2],zone.mesh.wall[3]))
						{
							//console.log(i);
							switch(i)
							{
								case 1: zone.xdir = -Math.abs(zone.xdir); break;
								case 2: zone.ydir = Math.abs(zone.ydir); break;
								case 3: zone.xdir = Math.abs(zone.xdir); break;
								case 4: zone.ydir = -Math.abs(zone.ydir); break;
							}
							apc = true;
						}
					}
					//console.log(apc);
					//*/zone.xdir *= -1; zone.ydir *= -1;
					//if(!apc) {console.log("?"); zone.xdir *= -1; zone.ydir *= -1;}
					var dir = cdir(Math.atan2(zone.ydir,zone.xdir));
					//zone.mesh.position.x -= dir[0]*zone.mesh.walldist; zone.mesh.position.y -= dir[1]*zone.mesh.walldist;
					zone.mesh.position.x += dir[0]; zone.mesh.position.y += dir[1]; 
					zone.mesh.position.x += zone.xdir*(timestep); zone.mesh.position.y += zone.ydir*(timestep);
					
					if(settings.BALL_SPEED_HIT_DECAY)
					{
						var speed = Math.sqrt((zone.xdir*zone.xdir)+(zone.ydir*zone.ydir));
						var decay = settings.BALL_SPEED_HIT_DECAY*delta;
						if(decay > speed) decay = speed;
						speed -= decay;
						zone.xdir = dir[0]*speed; zone.ydir = dir[1]*speed;
					}
					
					zone.netSync();
				}
				else
				{
					zone.mesh.position.x += zone.xdir*timestep; zone.mesh.position.y += zone.ydir*timestep;
				}
			}
		}
		var dc = Object.keys(engine.delayedcommands);
		for(var x=dc.length-1;x>=0;x--)
		{
			var cmd = engine.delayedcommands[dc[x]];
			loadcfg(cmd[0]);
			if(dc[x] >= engine.gtime)
			{
				if(cmd[1] > 0)
				{
					engine.delayedcommands[dc[x]+cmd[1]] = cmd;
				}
				delete engine.delayedcommands[dc[x]];
			}
		}
		//if(more) game();
	}
	else
	{
		engine.gameRunning = false;
	}
}

game.killBlame = function(cycle,escape=false)
{
	if(escape || (cycle.sensor.nearestobj == "rim" && !cycle.sensor.lastnonselfobj))
	{
		if(escape || (
			cycle.position.x-cycle.minDistance.front > engine.logicalBox.max.x ||
			cycle.position.y-cycle.minDistance.front > engine.logicalBox.max.y ||
			cycle.position.x+cycle.minDistance.front < engine.logicalBox.min.x ||
			cycle.position.y+cycle.minDistance.front < engine.logicalBox.min.y
		))
		{
			engine.console.print(cycle.getColoredName()+"0xRESETT tried to escape the game grid.\n");
		}
		else
		{
			engine.console.print(cycle.getColoredName()+"0xRESETT committed suicide.\n");
		}
	}
	else
	{
		var objtoaccuse = typeof(cycle.sensor.lastnonselfobj)=="undefined"?cycle.sensor.nearestobj:cycle.sensor.lastnonselfobj;
		if(objtoaccuse == cycle)
		{
			engine.console.print(cycle.getColoredName()+"0xRESETT committed suicide.\n");
		}
		else if(typeof(objtoaccuse) == "object")
		{
			engine.console.print(objtoaccuse.getColoredName()+"0xRESETT core dumped "+cycle.getColoredName()+"0xRESETT for 1 point.\n");
			objtoaccuse.addScore(1);
		}
		else
		{
			engine.console.print(cycle.getColoredName()+"0xRESETT died.\n");
		}
	}
	cycle.kill();
}

game.start = function()
{
	if(!engine.gameRunning) game.run();
	if(!engine.renderRunning) render();
}

game.pause = function()
{
	engine.paused = true;//cuts off the loop
	engine.startOfPause = performance.now();
	if(engine.audio) engine.audio.stopCycles();
}

game.unpause = function()
{
	for(var ctrl in engine.controls)
	{
		engine.controls[ctrl] = [];
	}
	//renderLoop = true;//replaces cutoff
	if(engine.paused)
	{
		engine.paused = false;
		if(engine.audio) engine.audio.startCycles();
		engine.lastGameTime = engine.lastRenderTime = engine.fpsTime = performance.now();//resets delta so we don't pretend the game should have been playing the entire time we were paused
		var endOfPause = performance.now();
		engine.totalPauseTime += (endOfPause - engine.startOfPause);
		game.start();//starts the loop again
	}
}

game.changeViewTarget = function(a=1,forcechange=false) 
{
	if(a != 0 && !engine.dedicated)
	{
		if(!forcechange && engine.players[engine.activePlayer].alive) return;
		var first = true; //force the loop to get started
		var itcount = 0;
		/*if(alive > 0) */while(first || !engine.players[engine.viewTarget] || !engine.players[engine.viewTarget].alive)
		{
			first = false;
			engine.viewTarget+=a;
			if(engine.viewTarget >= engine.players.length) engine.viewTarget = 0;
			if(engine.viewTarget < 0) engine.viewTarget = engine.players.length+engine.viewTarget;
			itcount++;
			if(itcount > engine.players.length) break;
			//console.log(engine.viewTarget);
		}
	}
	if(engine.audio)
	{
		for(var x=0;x>engine.players.length;x++)
		{
			if(x == engine.viewTarget && engine.view == "cockpit")
				engine.players[x].audio.gain.setTargetAtTime(0.2, engine.audio.currentTime, 0.02);
			else
				engine.players[x].audio.gain.setTargetAtTime(6, engine.audio.currentTime, 1);
		}
	}
	
	var numHumans = 0;
	for(var x=engine.players.length-1;x>=0;--x)
	{
		if( engine.players[x] && !engine.players[x].AI && !engine.players[x].spectating )
			++numHumans;
	}
	if(!engine.network && numHumans > 0 && typeof(engine.winner) == "undefined")
	{
		switch(settings.FINISH_TYPE)
		{
			case 2:
				engine.asendtm = 0.2;
				centerMessage("Time Warp!",Infinity);
				if(engine.hud) engine.hud.fadein = false;
				break;
			case 3:
				centerMessage("Please wait...",Infinity);
				setTimeout(function()
				{
					engine.timemult = 100;
					while(typeof(engine.winner) == "undefined") { game(true) }
					engine.timemult = 1;
				},100);
				break;
		}
		
	}
	
	if(engine.dedicated) return;
	engine.console.print("Watching "+engine.players[engine.viewTarget].name+"...\n");
}

game.checkForWinner = function()
{
	var alivecount = aliveaicount = 0;
	var numPlay = 0;
	var numHumanPlay = 0;
	var alive = [], theplayer = false;
	var declareRoundWinner = typeof(engine.declareRoundWinner) != "undefined";
	for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
	{
		if(!engine.players[x].spectating)
		{
			numPlay++;
			if(!engine.players[x].AI) 
				numHumanPlay++;
		}
		if(engine.players[x].alive) 
		{
			alivecount++;
			if(engine.players[x].AI)
				aliveaicount++;
			alive.push(engine.players[x]);
		}
		if(declareRoundWinner && engine.players[x].name == engine.declareRoundWinner)
		{
			engine.winner = engine.players[x];
			engine.declareRoundWinner = undefined;
		}
	}
	if(
		(declareRoundWinner) ||
		(settings.GAME_TYPE == 1 && numHumanPlay > 0 && numPlay > 1 && (alivecount <= 1 || (settings.FINISH_TYPE == 1 && aliveaicount == alivecount))) || 
		(/*settings.GAME_TYPE == 0 && */(alivecount <= 0))
	)
	{
		if(!declareRoundWinner)
		{
			engine.winner = (typeof(alive[0]) == "undefined")?{name:undefined}:alive[0];
		}
		if(settings.RIM_WALL_COLOR_MODE == 2)
		{
			if(engine.winner && settings.RIM_WALL_COLOR_MODE == 2)
			{
				var color = new THREE.Color(engine.winner.cycleColor);
				settings.RIM_WALL_RED = color.r;
				settings.RIM_WALL_GREEN = color.g;
				settings.RIM_WALL_BLUE = color.b;
			}
		}
		if(engine.asendtm > 0) {engine.asendtm = 0; engine.timemult = 1; centerMessage("Time Warp!",0);}
		setTimeout(function(){centerMessage("Winner: "+engine.winner.name)},1000);
		if(!window.svr || window.svr.clients.size != 0) game.reqNewRound();
	}
}

game.reqNewRound = function()
{
	if(typeof(engine.winner) == "undefined") engine.winner = null;
	var endin = 4000;
	if(engine.round >= settings.LIMIT_ROUNDS)
	{
		var highscore = -Infinity, highplayer;
		for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
		{
			var cycle = engine.players[x];
			if(cycle.score > highscore)
			{
				highplayer = cycle;
				highscore = cycle.score;
			}
			else if(cycle.score == highscore)
			{
				highplayer = null;
			}
		}
		if(highplayer != null)
		{
			setTimeout(function(){centerMessage("Match Winner: "+highplayer.name);engine.console.print("Match Winner: "+highplayer.name+" with "+highscore+" points.\n")},4000);
		}
		engine.round = 0;
		endin += 4000;
	}
	if(!settings.ROUND_WAIT) engine.uRound = setTimeout(game.doNewRound,endin);
}

game.updateScoreBoard = function()
{
	if(window.svr)
	{
		var tmp = [];
		for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
		{
			tmp.push({netid:x,score:engine.players[x].score,ping:engine.players[x].ping,chatting:engine.players[x].chatting});
		}
		window.svr.send({type:"scoredata",data:tmp});
	}
	if(engine.network) engine.network.syncPlayData();
	if(engine.dedicated || scoreboard.style.display == "none") return;
	var scoreBoard = document.getElementById("scoreboard").children[0];
	var playersSB = scoreBoard.children[1];
	var tmp = "";
	for(var x=0;x<engine.playersByScore.length;++x) if(typeof(engine.playersByScore[x]) != "undefined")
	{
		var cycle = engine.playersByScore[x];
		tmp += "<tr class=\"player\">\
		<td>"+
			(cycle.hasFlag?replaceColors((engine.teams[cycle.hasFlag.team]==engine.players[engine.activePlayer].team?"0xff7fff":"0xff7f00")+"F"):'&nbsp;')+
			(cycle.chatting?"*":"&nbsp;")+
			replaceColors(htmlEntitiesNative(cycle.getColoredName()).replace(/ /g,"&nbsp;"))+
		"</td><td>"+
			replaceColors(cycle.alive?"0x00ff00Yes":"0xff0000No")+
		"</td><td style='text-align:right'>"+
			cycle.score+
		"</td><td style='text-align:right'>"+
			cycle.ping+
		"</td><td>"+
			(cycle.team?(replaceColors(htmlEntitiesNative((((settings.ALLOW_TEAM_NAME_COLOR?(cycle.getColoredName().slice(0,8)):("0x"+(game.teamColor(engine.teams.indexOf(cycle.team)).getHexString()))))+cycle.team.name)).replace(/ /g,"&nbsp;"))):"")+
		"</td><tr>";
	}
	playersSB.innerHTML = tmp;
}

}(typeof(exports) === 'undefined' ? this.game = {} : exports));
