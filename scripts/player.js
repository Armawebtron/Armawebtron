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

//if(typeof(THREE) == "undefined") var THREE = require('./lib/Three.js');

class Player extends THREE.Object3D
{
	softReset() //! Resets the cycle state to default variables
	{
		this.speed = 0;
		this.lastSpeed = this.speed;
		this.rubber = 0;
		this.brakes = 1;
		this.braking = false;
		this.boosting = false;
		this.boost = 0;
		this.dedtime = 0;
		this.alive = false;
		this.collidetime = Infinity;
		this.sensor = {left:Infinity,right:Infinity,front:Infinity};
		this.dir = {front:[0,0],left:[0,0],right:[0,0]};
		this.minDistance = {front:settings.CYCLE_RUBBER_MINDISTANCE};
		this.turnQueue = [];
		this.lastTurnTime = 0;
		this.gameTime = 0;
		this.handleNetTurn = true;
	}
	hardReset() //! Same as soft reset but resets all varaibles
	{
		this.softReset();
		this.score = 0;
		this.ping = 0;
	}
	getColoredName() //! Name with colors...
	{
		switch(typeof(this.tailColor))
		{
			case "string":
				return this.tailColor.replace("#","0x")+this.name;
			case "object":
				return "0x"+this.tailColor.getHexString()+this.name;
			case "number":
				var color = this.tailColor.toString(16);
				color = ("0".repeat(6-color.length))+color;
				return "0x"+color+this.name;
			default:
				console.warn("Can't get color");
				return "0xRESETT"+this.name;
		}
	}
	getBoringName() //! Name without colors...
	{
		return removeColors(cycle.name);
	}
	newWallSegment() //should be called on turns
	{
		var adj = 0.7, wmap = this.walls.map, dirmult = this.dir.front;
		wmap[wmap.length-1] = [this.position.x,this.position.y,this.position.z];
		wmap[wmap.length] = [this.position.x,this.position.y,this.position.z]; 
		this.resetCurrWallSegment(false,1);
		var wall = newWall(this.tailColor,this.position.x,this.position.y,this.position.z);
		var adjx = (dirmult[0]*adj), adjy = (dirmult[1]*adj);
		wall.scale.x -= adjx/wall.size; wall.scale.y -= adjy/wall.size;
		this.walls.add(wall);
	}
	/*recalcCurrWallLength(tocurrpos=false)
	{
		var adj = 0.7, dirmult = this.dir.front, wall = this.walls.children[this.walls.children.length-1];
		var adjx = (dirmult[0]*adj), adjy = (dirmult[1]*adj);
		wall.scale.x += adjx/wall.size; wall.scale.y += adjy/wall.size;
		this.resetCurrWallSegment(tocurrpos,0,true);
		wall.scale.x -= adjx/wall.size; wall.scale.y -= adjy/wall.size;
	}*/
	resetCurrWallSegment(tocurrpos=false,offset=0,breakWallLength=false) //! Redoes the current 3D wall segment to the actual wall segment.
	{
		var wmap = this.walls.map;
		var oldwall = this.walls.children[this.walls.children.length-1];
		
		if(breakWallLength)
		{
			var sizex = oldwall.scale.x*oldwall.size,sizey = oldwall.scale.y*oldwall.size;
			this.walls.netLength -= Math.sqrt((sizex*sizex)+(sizey*sizey));
		}
		
		if(typeof(wmap[wmap.length-3]) == "undefined")
		{
			console.warn("Wall was undefined when trying to calculate wall size");
			//console.log();
			return;
		}
		if(tocurrpos)
		{
			wmap[wmap.length-2] = [this.position.x,this.position.y,this.position.z];
		}
		var a = 2+offset, b=1+offset;
		oldwall.position.set(wmap[wmap.length-a][0],wmap[wmap.length-a][1],wmap[wmap.length-3][2]||0);
		oldwall.scale.x = (wmap[wmap.length-b][0]-wmap[wmap.length-a][0])/oldwall.size||1;
		oldwall.scale.y = (wmap[wmap.length-b][1]-wmap[wmap.length-a][1])/oldwall.size||1;
		
		if(breakWallLength)
		{
			var sizex = oldwall.scale.x*oldwall.size,sizey = oldwall.scale.y*oldwall.size;
			this.walls.netLength += Math.sqrt((sizex*sizex)+(sizey*sizey));
		}
		else
		{
			this.calcWallLength();
		}
	}
	calcWallLength(cycle) //! sets the actual wall length
	{
		var wmap = this.walls.map;
		this.walls.netLength = 0;
		for(var x=wmap.length;x>=0;x--)
		{
			if(wmap[x+1] !== undefined)
			{
				var p1=wmap[x],p2=wmap[x+1];
				this.walls.netLength += pointDistance(p1[0],p1[1],p2[0],p2[1]);
			}
		}
		return this.walls.netLength;
	}
	resetWall(cycle,full=true) //! Completely redoes the 3D wall according to the actual wall
	{
		if(full === true)
		{
			for(var x=0,len=this.walls.children.length;x<len;x++)
			{
				this.walls.remove(this.walls.children[x]);
			}
		}
		var wmap = this.walls.map, wallmod;
		for(var x=1,len=wmap.length;x<len;x++)
		{
			if(full === true)
			{
				this.walls.add(wallmod = newWall(this.tailColor,wmap[x][0],wmap[x][1],wmap[x][2]));
			}
			else
			{
				wallmod = this.walls.children[x-1];
				wallmod.position.set(wmap[x][0],wmap[x][1],wmap[x][2]||0);
			}
			wallmod.scale.x = (wmap[x-1][0]-wmap[x][0])/wallmod.size;
			wallmod.scale.y = (wmap[x-1][1]-wmap[x][1])/wallmod.size;
		}
		if(full !== true)
		{
			for(;x<this.walls.length;x++)
			{
				this.walls.remove(this.walls.children[x]);
			}
		}
		
		this.calcWallLength();
	}
	turn(dir)
	{
        if(dir != -1 && dir != 1) return false;
		this.turnQueue.push(dir);
	}
	turnAbs(dirX,dirY)
	{
		var ang = Math.atan2(this.position.y+dirY,this.position.x+dirX);
		centerMessage(ang,500);
		if(ang > Math.PI)
		{
			return this.turn(1);
		}
		else if(ang != 0)
		{
			return this.turn(-1);
		}
	}
	spawn(cfg,respawn=true,update=true)
	{
		//configure cycle
		this.softReset();
		
		this.position.set(cfg.x,cfg.y,cfg.z);
		this.lastpos = this.position.clone();
		this.rotation.set(0,0,cfg.dir);
		this.lastdir = {front:0};
		this.alive = true;
		this.speed = settings.CYCLE_START_SPEED;
		this.gameTime = this.spawntime = Math.max(0,engine.gtime);
		this.haswall = !(respawn||settings.CYCLE_FIRST_SPAWN_PROTECTION);
		
		//walls
		if(this.haswall)
		{
			this.walls = createWall(this,cfg.x,cfg.y,cfg.z);
			engine.scene.add(this.walls);
		}
		
		if(this.audio) this.audio.panner.connect(ctx.destination);
		
		engine.scene.add(this);
		if(update) updateScoreBoard();
		
		if(this == engine.players[engine.activePlayer]) engine.viewTarget = engine.activePlayer;
	}
	kill()
	{
		this.resetCurrWallSegment();
		this.alive = false; this.dedtime = performance.now();
		engine.scene.remove(this);
		if(this == engine.players[engine.viewTarget] && !engine.dedicated)
			setTimeout(function(){if(!engine.players[engine.viewTarget].alive)changeViewTarget()},3000);
		if(this.audio)
		{
			this.audio.panner.disconnect();
			playSound(bufferLoader.bufferList[this.engineType+6],0.5,1,false,ctx.destination);
			spawnExplosion(this.position,this.cycleColor,this.tailColor);
		}
		updateScoreBoard();
		
		if(engine.dedicated) 
		{
			var alive = 0, aliveAI = 0;
			for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
			{
				if(engine.players[x].alive)
				{
					alive++;
					if(engine.players[x].AI) aliveAI++;
				}
			}
			if(alive==aliveAI) changeViewTarget(0); //this will handle the finish type stuff
		}
	}
	killAt(position,y=false,z=false)
	{
		if(y !== false) var x = position;
		else var x=position.x,y=position.y,z=position.z;
		this.position.set(x,y,z===false?this.position.z:z);
		this.kill();
	}
	killIn(timestep)
	{
		this.update(timestep);
		this.kill();
	}
	doChat(msg)
	{
		if(engine.network)
		{
			engine.connection.send(JSON.stringify({type:"chat",data:msg}));
		}
		else
		{
			engine.console.print(this.getColoredName()+"0xffff7f: "+msg+"\n");
			if(engine.dedicated) {}
		}
	}
	update(timestep=false) //! Simulates game movement on cycles
	{
		if(timestep === false) { timestep = (engine.gtime-this.gameTime)/1000; }
		this.gameTime += timestep*1000;
		//var timeElapsed = engine.gtime;
		var timeElapsed = this.gameTime;
		//movement
		var acceleration = 0;
		if(this.braking)
		{
			if(this.brakes > 0)
			{
				acceleration -= settings.CYCLE_BRAKE;
				this.brakes -= timestep*settings.CYCLE_BRAKE_DEPLETE;
			}
		}
		else if(this.brakes < 1)
		{
			this.brakes += timestep*settings.CYCLE_BRAKE_REFILL;
		}
		if(this.brakes > 1) this.brakes = 1;
		else if(this.brakes < 0) this.brakes = 0;
		if(this.boosting)
			acceleration += settings.CYCLE_BOOST;
		if(this.speed < settings.CYCLE_SPEED)
		{
			acceleration += (settings.CYCLE_SPEED-this.speed)*settings.CYCLE_SPEED_DECAY_BELOW;
		}
		else if(this.speed > settings.CYCLE_SPEED)
		{
			acceleration += (settings.CYCLE_SPEED-this.speed)*settings.CYCLE_SPEED_DECAY_ABOVE;
		}
		if(this.sensor.left < settings.CYCLE_WALL_NEAR || this.sensor.right < settings.CYCLE_WALL_NEAR)
		{
			var wallAccel = settings.CYCLE_ACCEL;
			if(wallAccel != 0) //don't bother if there's no accel
			{
				var accelMult = [(settings.CYCLE_WALL_NEAR-this.sensor.left)/settings.CYCLE_WALL_NEAR,(settings.CYCLE_WALL_NEAR-this.sensor.right)/settings.CYCLE_WALL_NEAR];
				var accelTargets = [this.sensor.lnearestobj,this.sensor.rnearestobj];
				for(var z=2;z--;)
				{
					if(accelMult[z] > 0)
					{
						if(accelTargets[z] == "rim")
						{
							wallAccel *= settings.CYCLE_ACCEL_RIM;
						}
						else if(typeof(accelTargets[z]) == "object")
						{
							if(accelTargets[z] == this)
							{
								wallAccel *= settings.CYCLE_ACCEL_SELF;
							}
							else
							{
								wallAccel *= settings.CYCLE_ACCEL_ENEMY;
							}
						}
						else
						{
							throw "Accel target is unknown.";
						}
						wallAccel *= accelMult[z];
					}
				}
				//console.log(wallAccel);
				acceleration += wallAccel;
			}
		}
		this.speed += acceleration*timestep;
		if(this.speed < settings.CYCLE_SPEED*settings.CYCLE_SPEED_MIN)
		{
			this.speed = settings.CYCLE_SPEED*settings.CYCLE_SPEED_MIN;
		}
		if(settings.CYCLE_SPEED_MAX != 0 && this.speed > settings.CYCLE_SPEED*settings.CYCLE_SPEED_MIN)
		{
			this.speed = settings.CYCLE_SPEED*settings.CYCLE_SPEED_MAX;
		}
		this.accel = acceleration;
		if(this.speed < 0) this.speed = 0;
		
		//wheel spin per player
		if(!engine.dedicated)
		{
			this.model.children[1].rotation.y += (deg2rad(this.model.rotaon.front * this.speed) * timestep);//0.5x wheel size
			this.model.children[2].rotation.y += (deg2rad(this.model.rotaon.back * this.speed) * timestep);
		}
		
		//collision test
		var dir = cdir(this.rotation.z);
		var posx = this.position.x, posy = this.position.y;
		var escape = false;
		if(posx+settings.ARENA_BOUNDARY > engine.logicalBox.max.x*engine.REAL_ARENA_SIZE_FACTOR)
		{
			escape = true;
			this.position.x = (engine.logicalBox.max.x*engine.REAL_ARENA_SIZE_FACTOR)-settings.ARENA_BOUNDARY;
		}
		if(posy+settings.ARENA_BOUNDARY > engine.logicalBox.max.y*engine.REAL_ARENA_SIZE_FACTOR)
		{
			escape = true;
			this.position.y = (engine.logicalBox.max.y*engine.REAL_ARENA_SIZE_FACTOR)-settings.ARENA_BOUNDARY;
		}
		if(posx-settings.ARENA_BOUNDARY < engine.logicalBox.min.x*engine.REAL_ARENA_SIZE_FACTOR)
		{
			escape = true;
			this.position.x = (engine.logicalBox.min.x*engine.REAL_ARENA_SIZE_FACTOR)+settings.ARENA_BOUNDARY;
		}
		if(posy-settings.ARENA_BOUNDARY < engine.logicalBox.min.y*engine.REAL_ARENA_SIZE_FACTOR)
		{
			escape = true;
			this.position.y = (engine.logicalBox.min.y*engine.REAL_ARENA_SIZE_FACTOR)+settings.ARENA_BOUNDARY;
		}
		/*var collided = false;
		for(var y=0; y<engine.map.walls.length;y++)
		{
			for(var i=0;i<engine.map.walls[y].length;i++)
			{
				var p = engine.map.walls[y][i].split(",");
				var w1x = p[0],w1y = p[1];
				
				if(engine.map.walls[y][i+1] !== undefined)
				{
					var p = engine.map.walls[y][i+1].split(",");
					var w2x = p[0],w2y = p[1];
					
					if(lineIntersect(posx,posy,posx+(dir[0]/4),posy+(dir[1]/4),w1x,w1y,w2x,w2y))
					{
						//console.log("Hitting wall");
						collided = true;
					}
				}
			}
		}*/
		var collided = (this.sensor.front <= this.minDistance.front); //potential replacement for above code
		//var collided = false;
		/*if(collided || (escape && settings.ARENA_BOUNDARY_KILLS))
		{
			this.collidetime = Infinity; //we've collided, no need to check

		}
		else*/
		{
			
			//var newx = dir[0]*this.speed*timestep, newy = dir[1]*this.speed*timestep;
			var dist = this.speed*timestep, radj = dist;
			if(dist < 0) dist = 0;
			if(this.collidetime <= timeElapsed)
			{
				//this.rubber += timestep*(this.lastSpeed);
				collided = true; 
				var adjdist = (((timeElapsed-this.collidetime)/1000)*this.lastSpeed);
				radj = timestep;
				//radj = adjdist;
				radj *= this.lastSpeed;
				dist -= adjdist;
				//console.warn(x+" should have collided: "+(this.collidetime-timeElapsed)+"ms\n");
			}
			//if((dir[0]==0?0:(newx/dir[0]))+(dir[1]==0?0:(newx/dir[1])) >= this.sensor.front)
			if(dist >= this.sensor.front-(this.minDistance.front))
			//if(this.speed*timestep >= this.sensor.front)
			{
				dist = (this.sensor.front-(this.minDistance.front));
				//if(x == engine.viewTarget) console.warn(dist+" "+this.sensor.front+"\n");
				collided = true;
			}
			if(dist > this.sensor.front-(this.minDistance.front)) //shouldn't happen
			{
				dist = this.minDistance.front;
			}
			if(collided || (escape && settings.ARENA_BOUNDARY_KILLS))
			{
				if(this.rubber >= settings.CYCLE_RUBBER)
				{
					if(!engine.network)
					{
						doDeath(this,escape);
					}
				}
				else if(
					(settings.CYCLE_RUBBER_DEPLETE_RIM && this.sensor.nearestobj == "rim") ||
					(settings.CYCLE_RUBBER_DEPLETE_SELF && this.sensor.nearestobj == this) ||
					(settings.CYCLE_RUBBER_DEPLETE_ENEMY && this.sensor.nearestobj != this && typeof(this.sensor.nearestobj) == "object")
				)
				{
					this.rubber += radj;
				}
			}
			var move2d = Math.cos(this.model.rotation.y), movez = -this.model.rotation.y;
			var dist2d = dist*move2d;
			var newx = dist2d*dir[0], newy = dist2d*dir[1], newz = dist*movez;
			
			this.position.x += newx;
			this.position.y += newy;
			this.position.z += newz;
			if(this.position.z-this.sensor.bottom < this.model.rotation.y)
			{
				this.model.rotation.y = this.position.z;
				if(this.model.rotation.y < 0)
				{
					this.model.rotation.y = 0;
					this.position.z = this.sensor.bottom;
				}
			}
			if(this.position.z > this.sensor.bottom)
			{
				this.model.rotation.y += timestep*(1-this.model.rotation.y);
			}
			//if(typeof(this.walls.children) != "undefined")
			if(this.haswall)
			{
				var wallmod = this.walls.children[this.walls.children.length-1];
				var wallmap = this.walls.map[this.walls.map.length-1];
			
				wallmap[0]+=(newx); wallmap[1]+=(newy);
				
				wallmod.scale.x += newx/wallmod.size;
				wallmod.scale.y += newy/wallmod.size;
				
				this.walls.netLength += dist;
				
				this.sensor.front -= dist; //assume distance until we have new real results.
				//this.sensor.front = 
				
				var lendiff = this.walls.netLength - settings.WALLS_LENGTH;
				while(settings.WALLS_LENGTH > 0 && lendiff > 0)
				{
					var map = this.walls.map;
					var xdir = (map[1][0]-map[0][0]), ydir = (map[1][1]-map[0][1]);
					var len = Math.sqrt((xdir*xdir)+(ydir*ydir));
					if(len > 1) { xdir /= len; ydir /= len; }
					
					
					if(isNaN(xdir)) xdir = SMALL_NUM; if(isNaN(ydir)) ydir = SMALL_NUM; 
					//console.log(lendiff,xdir,ydir);
					if(xdir == 0 && ydir == 0 && this.walls.map.length > 2)
					{
						//this.walls.children.shift();
						this.walls.remove(this.walls.children[0]);
						this.walls.map.shift();
					}
					else
					{
						this.walls.children[0].scale.x -= xdir/wallmod.size;
						this.walls.children[0].position.x += xdir;
						this.walls.children[0].scale.y -= ydir/wallmod.size;
						this.walls.children[0].position.y += ydir;
						this.walls.map[0][0] += xdir;
						this.walls.map[0][1] += ydir;
						this.walls.netLength -= Math.sqrt((xdir*xdir)+(ydir*ydir));
					}
					
					lendiff = this.walls.netLength - settings.WALLS_LENGTH;
				}//*/
				if(this.position.z > 0) this.newWallSegment();
			}
			else if(engine.gtime > this.spawntime+(settings.CYCLE_WALL_TIME*1000))
			{
				this.walls = createWall(this,this.position.x,this.position.y,this.position.z);
				engine.scene.add(this.walls);
				this.haswall = true;
			}
			
			this.collidetime = timeElapsed+(((this.sensor.front-this.minDistance.front)/this.speed)*1000);
			this.lastSpeed = this.speed;
		}
		if(this.speed > engine.fastestSpeed)
		{
			engine.fastestPlayer = this; engine.fastestSpeed = this.speed;
		}
	}
	constructor(cfg)
	{
		super();
		
		//var dir = cdir(cfg.dir);
		
		//this.cfg = cfg;//carry over the cfg???

		//choose model
		this.model = cycleModel(cfg.cycleColor);
		this.add(this.model);
		//this.shadow = cycleShadow();
		//this.add(this.shadow);
		this.chatarrow = newChatArrow();
		this.chatarrow.position.z = 1.20;
		this.chatarrow.position.x -= 0.5;
		this.chatarrow.scale.set(0.25,0.25,0.25);
		this.add(this.chatarrow);
		
		
		this.cycleColor = cfg.cycleColor;
		this.tailColor = cfg.tailColor;

		/*this.walls = {};
		//this.walls.children = [];

		this.walls.netLength = 0;
		this.walls.map = [];
		this.walls.scale = this.walls.position = new THREE.Vector3();*/
		
		this.walls = createWall(this,0,0,0); //walls are still called upon when spectating

		this.hardReset();

		this.chatting = cfg.chatting||false; this.spectating = cfg.spectating||false;
		if(cfg.ai||settings.DEBUG_EVERYONE_IS_AI)
		{
			this.AI = new AI(this);
		}
		else
		{
			this.AI = false;
		}

	//	this.playerID = cfg.playerID;

		this.name = cfg.name;
		
		
		//audio creation
		this.engineType = cfg.engineType;
		if(ctx)
		{
			this.audio = ctx.createGain();
			this.audio.gain.value = 0.01;
			this.audio.panner = ctx.createPanner();
			if(engine.retroSound)
				this.audio.panner.panningModel = "HRTF";
			else
				this.audio.panner.panningModel = "equalpower";
			this.audio.connect(this.audio.panner);
			this.audio.panner.connect(ctx.destination);

			//audio initialization
			this.engineSound = playSound(bufferLoader.bufferList[this.engineType], 0.5, 0, true, this.audio);
			this.audio.gain.setTargetAtTime(6, ctx.currentTime, 1.0);
		}
	}
	
};

if(typeof(module) != "undefined") module.exports = Player;
