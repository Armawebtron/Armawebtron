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

function doNewRound()
{
	if(engine.uRound !== false) { clearTimeout(engine.uRound); engine.uRound = false; }
	endRound();
	setTimeout(newRound,engine.dedicated?300:0); //give clients an opportunity to sync their data
}

function endRound()
{
	if(window.svr) 
	{
		window.svr.clients.forEach(function(ws){ws.send('{"type":"endRound"}')});
		window.svr.clients.forEach(function(ws){ws.send('{"type":"syncdata","gtime":-4000}')});
	}
	
	if(ctx)
	{
		audioStop(); 
		if(settings.SOUNDS_EXTRO) playSound(bufferLoader.bufferList[bufferLoader.other+2],0.5,1,false,ctx.destination);
	}
	engine.roundCommencing = true;
	//engine.hud.hide();
	if(engine.hud) engine.hud.game.style.opacity = 0;
	engine.console.print("Deleting objects...\n",false);
	if(!engine.network)
	{
		if(settings.ROUND_CENTER_MESSAGE != "")
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
	//if(!engine.network) engine.players = [];
}

function endGame()
{
	endRound();
	engine.players = [];
	engine.round = 0;
}

function playGame()
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
	hideMenu(); newRound();
	engine.inputState = 'game'; //change input state to accept game controls
}

function newRound()
{
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
		var mapfile = settings.RESOURCE_REPOSITORY_SERVER+settings.MAP_FILE;
		engine.console.print("Downloading map from "+mapfile+"...\n",false);
		httpGetAsync(mapfile,loadRound);
		//loadRound(httpGet(mapfile));
	}
	else
	{
		loadRound();
	}
}
function teamColor(id)
{
	id += 1;
	if(settings["TEAM_NAME_"+id])
	{
		return new THREE.Color(settings["TEAM_RED_"+id]/15,settings["TEAM_GREEN_"+id]/15,settings["TEAM_BLUE_"+id]/15);
	}
	return new THREE.Color();
}
function ensurePlayersSane(removeAIs=true)
{
	var minplayers = Math.max(settings.TEAMS_MIN,settings.MIN_PLAYERS,settings.NUM_AIS+settings.players.length);
	if(removeAIs) for(var x=minplayers;x<engine.players.length-1;x++)
	{
		if(engine.players[x].AI)
		{
			engine.console.print(engine.players[x].getColoredName()+"0xff7f7f left the game.\n");
			engine.players.splice(x,1);
		}
	}
	var spawnslength = engine.map.spawns.length;
	for(var x=engine.activePlayer;x<minplayers;x++)
	{
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
		if(engine.players[x])
		{
			
			var cycle = engine.players[x];
			cycle.engineType = (typeof(settings.players[x])=="undefined")?5:settings.players[x].engineType;
			if(x == engine.activePlayer && !engine.dedicated)
			{
				var cycleColor = settings.players[x].cycleColor,tailColor = settings.players[x].tailColor;
				if(!settings.ALLOW_TEAM_NAME_COLOR) { cycleColor = tailColor = teamColor(0); }
				if(cycle.name != settings.players[x].name)
				{
					var out = cycle.getColoredName()+"0x7fff7f renamed to ";
					cycle.cycleColor = cycleColor;
					cycle.tailColor = tailColor;
					cycle.name = settings.players[x].name;
					engine.console.print(out+cycle.getColoredName()+"\n");
				}
				else
				{
					cycle.cycleColor = cycleColor;
					cycle.tailColor = tailColor;
				}
				if(cycle.spectating != settings.players[x].spectating)
				{
					cycle.spectating = settings.players[x].spectating;
					if(cycle.spectating)
					{
						engine.console.print(cycle.getColoredName()+"0xff7f7f entered spectator mode.\n");
					}
					else
					{
						engine.console.print(cycle.getColoredName()+"0x7fff7f entered the game.\n");
					}
				}
			}
			else
			{
				if(!settings.ALLOW_TEAM_NAME_COLOR) { cycleColor = tailColor = teamColor(1); }
			}
		}
		else
		{
			//if(x == engine.activePlayer)
			if(settings.players[x])
			{
				var cycleColor = settings.players[x].cycleColor,tailColor = settings.players[x].tailColor;
				if(!settings.ALLOW_TEAM_NAME_COLOR) { cycleColor = tailColor = teamColor(0); }
				var cycleinfo = { x:spawns[0], y:spawns[1], z:spawns[2], dir:deg2rad(spawns[3]), ai:false,
					cycleColor:cycleColor, tailColor:tailColor,
					engineType:settings.players[x].engineType, spectating:settings.players[x].spectating,
					name:settings.players[x].name 
				};
			}
			else
			{
				var cycleColor = [0x000000,0xff0000,0x00ff00,0x0000ff][Math.round(Math.random()*3)];
				var tailColor = [0x0000ff,0xff0000,0xffff00,0x00ff00][Math.round(Math.random()*3)];
				if(!settings.ALLOW_TEAM_NAME_COLOR) { cycleColor = tailColor = teamColor(1); }
				var cycleinfo = { x:spawns[0], y:spawns[1], z:spawns[2], dir:deg2rad(spawns[3]), ai:true,
				cycleColor:cycleColor, tailColor:tailColor,
				/*engineType: 5,*/ engineType:(settings.players[0])?settings.players[0].engineType:5, spectating:false,
				name: 'AI#'+x 
				};
			}
			engine.players.push(new Player(cycleinfo));
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
		var deg = (360/settings.ARENA_AXES);
		if(cycle.spectating) 
		{
			console.log("Spectating");
			minplayers++;
		}
		else if(removeAIs)
		{
			cycle.spawn({x:spawns[0],y:spawns[1],z:spawns[2],dir:deg2rad(settings.STRICT_AXES_SPAWN?(Math.round(spawns[3]/deg)*deg):spawns[3])},false,false);
		}
	}
	if(engine.players[engine.activePlayer].spectating) changeViewTarget(1);
	
	if(window.svr) window.svr.clients.forEach(function(ws){ws.senddata(0)});
}
function loadRound(dlmap)
{
	if(typeof(dlmap) != "undefined")
	{
		engine.mapString = dlmap;
		engine.loadedMap = settings.MAP_FILE;
	}
	
	engine.mapXML = xmlify(engine.mapString);

	engine.console.print("Creating objects...\n",false);
	
	if(window.svr) window.svr.clients.forEach(function(ws){ws.send('{"type":"newRound"}')});
	
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
	
	if(settings.SOUNDS_INTRO)
		playSound(bufferLoader.bufferList[bufferLoader.other+1],0.5,1,false,ctx.destination);
	
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
		ensurePlayersSane();
		if(engine.round == 0)
		{
			engine.console.print("Resetting scores...\n");
			for(var x=engine.players.length-1;x>=0;--x)
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
	
	updateScoreBoard();
	
	engine.lastGameTime = engine.lastRenderTime = engine.fpsTime = engine.timeStart = performance.now();
	engine.totalPauseTime = 0;
	engine.fastestPlayer = engine.fastestSpeed = 0;
	engine.timemult = 1;
	engine.asendtm = 0;
	engine.winner = undefined;
	engine.roundCommencing = false;
	
	getGoing();

}//end of init main

function game(oneoff=false)
{
	if(!engine.roundCommencing && !engine.paused) 
	{
		if(engine.network)
		{
			var cycle = engine.players[engine.activePlayer],data={};
			if(cycle.braking != cycle.brakingPrev) {data.braking=cycle.braking; cycle.brakingPrev=cycle.braking}
			if(cycle.boosting != cycle.boostingPrev) {data.boosting=cycle.boosting; cycle.boostingPrev=cycle.boosting}
			
			engine.connection.send(JSON.stringify({type:"playdata",data:data}));
		}
		if(!oneoff && settings.GAME_LOOP != 1) {setTimeout(game,1000/settings.DEDICATED_FPS); engine.gameRunning = true;}
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
								cycle.dir.front = (dirmult = cdir(cycle.rotation.z -= (pi(2)/settings.ARENA_AXES)*dir));
								//cycle.rotation.z = cycle.rotation.z%(Math.PI*2);
								//if(cycle.rotation.z < 0) cycle.rotation.z += Math.PI*2;
								cycle.rotation.z = normalizeRad(cycle.rotation.z);
								cycle.speed *= settings.CYCLE_TURN_SPEED_FACTOR;
								cycle.rotation.x = Math.cos(cycle.rotation.z)*0.4*dir; //tilts the cycle
								cycle.rotation.y = Math.sin(cycle.rotation.z)*0.4*dir;
								//if(settings.GRAB_SENSORS_ON_TURN)
								{
									getCycleSensors(true);
								}
								cycle.collidetime = timeElapsed+(((cycle.sensor.front)/cycle.speed)*1000);
								var mult = (1-settings.CYCLE_RUBBER_MINADJUST);
								cycle.minDistance.front = Math.max(0,Math.min(cycle.sensor.front*mult,settings.CYCLE_RUBBER_MINDISTANCE));
								cycle.lastpos = cycle.position.clone(); //redundant, should be handled by getCycleSensors
								if(cycle.haswall) cycle.newWallSegment();
								if(engine.network)
								{
									engine.connection.send(JSON.stringify({type:"turn",data:rad2deg(cycle.rotation.z),gtime:engine.gtime}));
								}
								if(window.svr) //force a player sync
								{
									var data = JSON.stringify({type:"griddata",data:[{
										position:[cycle.position.x,cycle.position.y,cycle.position.z],
										direction:rad2deg(cycle.rotation.z), 
										speed:cycle.speed, rubber:cycle.rubber,
										alive:cycle.alive,
										netid:x, wall:cycle.walls.map,
									}],gtime:engine.gtime});
									window.svr.clients.forEach(function(ws){ws.send(data)});
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
					cycle.rubber -= (timestep/settings.CYCLE_RUBBER_TIME)*cycle.rubber;
				else
					cycle.rubber = 0;
				//if(timeElapsed/1000 > -3 && cycle.alive)
			}
			else if(cycle.walls.map.length != 0 && timenow-cycle.dedtime >= settings.WALLS_STAY_UP_DELAY*1000)
			{
				cycle.walls.map = [];
				console.log("DELETE WALLS id "+x);
				
			}
			else if(settings.RESPAWN_TIME >= 0 && cycle.dedtime > settings.RESPAWN_TIME*1000)
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
			checkForWinner();
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
			
			//zone effect
			var inzone = false;
			for(var y=engine.players.length-1;y>=0;--y) if(engine.players[y] && engine.players[y].alive)
			{
				var cycle = engine.players[y];
				if(zone.type == "ball" || zone.type == "soccerball")
				{
					for(var z=engine.zones.children.length-1;z>=0;--z)
					{
						var z2n = engine.map.zones[z];
						if(
							(
								(zone.type == "ball" && z2n[0] == "fortress") ||
								(zone.type == "soccerball" && z2n[0] == "soccergoal")
							) && 
							is_in_circle(z2n[1],z2n[2],z2n[3],zone.x,zone.y,zone.radius))
						{
							if(!engine.network && engine.winner == undefined)
							{
								centerMessage("0x00ff00Goal!");
								startNewRound();
							}
							else
							{
								zone.xdir *= 1-timestep; zone.ydir *= 1-timestep;
							}
						}
					}
				}
				//dont handle zones we don't need to
				if(!zone.netObject || zone.type.indexOf("ball") >= 0)
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
				if(zone.bounce && zone.walldist <= timestep)
				{
					var mindirx,mindiry,mindist=Infinity,apc=0;
					var px = zone.x+(zone.walldist*zone.xdir), py = zone.y+(zone.walldist*zone.ydir);
					for(var i=359;i>0;i--) 
					{
						var xdir = Math.sin(Math.PI*2*(i/360)), ydir=Math.cos(Math.PI*2*(i/360));
						var xpos = xdir*zone.radius+zone.x, ypos=ydir*zone.radius+zone.y;
						var dist = pointDistance(xpos,ypos,px,py);
						if(dist < mindist)
						{
							//mindist += dist; mindirx += xdir; mindiry += ydir;
							//apc++;
							mindist=dist;mindirx=xdir;mindiry=ydir;apc=1;
						}
					}
					//mindist /= apc; mindirx /= apc; mindiry /= apc;
					var speed = Math.sqrt((zone.xdir*zone.xdir)+(zone.ydir*zone.ydir));
					if(mindist != Infinity)
					{
						var angle = Math.atan2(mindiry,mindirx);
						//var angle = Math.atan2(mindiry,mindirx)*2;
						//var angle = Math.atan2(mindiry,mindirx)+(Math.PI/2);
						//var angle = Math.PI-Math.atan2(mindiry,mindirx);
						var dir = cdir(angle);
						zone.xdir = dir[0]*speed; zone.ydir = dir[1]*speed;
						
						zone.x -= dir[0]*realzone.walldist; zone.y -= dir[1]*realzone.walldist;
						zone.x += dir[0]*speed*timestep; zone.y += dir[1]*speed*timestep;
						console.log(zone);
					}
					else
					{
						zone.xdir *= -1; zone.ydir *= -1;
					}
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

function doDeath(cycle,escape=false)
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
			objtoaccuse.score += 1;
		}
		else
		{
			engine.console.print(cycle.getColoredName()+"0xRESETT died.\n");
		}
	}
	cycle.kill();
}

function simulatePlayer(cycle,timestep)
{
	console.warn("Deprecated call to simulatePlayer");
	cycle.update(timestep);
}

function getGoing()
{
	if(!engine.gameRunning) game();
	if(!engine.renderRunning) render();
}

function pauseRender()
{
	engine.paused = true;//cuts off the loop
	engine.startOfPause = performance.now();
	audioStop();
}

function unpauseRender()
{
	for(var ctrl in engine.controls)
	{
		engine.controls[ctrl] = [];
	}
	//renderLoop = true;//replaces cutoff
	if(engine.paused)
	{
		engine.paused = false;
		audioStart();
		engine.lastGameTime = engine.lastRenderTime = engine.fpsTime = performance.now();//resets delta so we don't pretend the game should have been playing the entire time we were paused
		var endOfPause = performance.now();
		engine.totalPauseTime += (endOfPause - engine.startOfPause);
		getGoing();//starts the loop again
	}
}

function changeViewTarget(a=1,forcechange=false) 
{
	if(a != 0)
	{
		if(!forcechange && engine.players[engine.activePlayer].alive) return;
		var first = true; //force the loop to get started
		var itcount = 0;
		/*if(alive > 0) */while(first || !engine.players[engine.viewTarget].alive)
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
	if(engine.view == 'cockpit')
	{
		for(var x=0;x>engine.players.length;x++)
		{
			if(x == engine.viewTarget)
				engine.players[x].audio.gain.setTargetAtTime(0.2, ctx.currentTime, 0.02);
			else
				engine.players[x].audio.gain.setTargetAtTime(6, ctx.currentTime, 1);
		}
	}
	if(!engine.network && !engine.players[engine.activePlayer].spectating && typeof(engine.winner) == "undefined")
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
	
	engine.console.print("Watching "+engine.players[engine.viewTarget].name+"...\n");
}

function checkForWinner()
{
	var alivecount = aliveaicount = 0;
	var alive = [], theplayer = false;
	var declareRoundWinner = typeof(engine.declareRoundWinner) != "undefined";
	for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
	{
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
		(settings.GAME_TYPE == 1 && settings.TEAMS_MIN > 1 && (alivecount <= 1 || (settings.FINISH_TYPE == 1 && aliveaicount == alivecount))) || 
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
		startNewRound();
	}//*/
	/*if(aliveaicount == alivecount)
	{
		engine.console.print("Vroom!");
		engine.timemult = 2;
		engine.asendtm = 1.1;
	}//*/
}

function startNewRound()
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
	if(!settings.ROUND_WAIT) engine.uRound = setTimeout(doNewRound,endin);
}

function updateScoreBoard()
{
	if(window.svr)
	{
		var tmp = [];
		for(var x=engine.players.length-1;x>=0;--x)
		{
			tmp.push({netid:x,score:engine.players[x].score,ping:engine.players[x].ping,chatting:engine.players[x].chatting});
		}
		var data = JSON.stringify({type:"scoredata",data:tmp});
		window.svr.clients.forEach(function(ws){ws.send(data);});
	}
	if(engine.network)
	{
		engine.connection.send(JSON.stringify({type:"playdata",data:{chatting:engine.players[engine.activePlayer].chatting}}));
	}
	if(engine.dedicated || scoreboard.style.display == "none") return;
	var scoreBoard = document.getElementById("scoreboard").children[0];
	var playersSB = scoreBoard.children[1];
	playersSB.innerHTML = "";
	for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
	{
		var cycle = engine.players[x];
		playersSB.innerHTML += "<tr class=\"player\"><td>"+(cycle.chatting?"*":"&nbsp;")+replaceColors(cycle.getColoredName())+"</td><td>"+replaceColors(cycle.alive?"0x00ff00Yes":"0xff0000No")+"</td><td>"+cycle.score+"</td><td>"+cycle.ping+"</td><tr>";
	}
}
/*function updateScoreBoard()
{
	var scoreboard = "";
	for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
	{
		var cycle = engine.players[x];
		scoreboard += (cycle.chatting?"*":" ")+removeColors(cycle.name)+" "+cycle.alive?"Yes":"No"+" "+cycle.score+" "+cycle.ping+" ";
	}
}*/

