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

//if(typeof(THREE) == "undefined") var THREE = require('./lib/Three.js');

class Player extends THREE.Object3D
{
	setScore(x)
	{
		this.score = (x*1)||0;
		engine.playersByScore.sort(function(a,b){return b.score-a.score});
		if(engine.playersByScore.indexOf(this) > -1) game.updateScoreBoard();
	}
	addScore(x)
	{
		this.setScore(this.score+((x*1)||0));
	}
	softReset() //! Resets the cycle state to default variables
	{
		this.speed = 0;
		this.lastSpeed = this.speed;
		this.rubber = 0;
		this.sentRubber = false;
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
		this.turns = 0;
		this.turnsSynced = 0;
		this.turnQueue = [];
		this.dist = 0;
		this.lastTurnPos = null;
		this.lastTurnTime = 0;
		this.gameTime = 0;
		this.handleNetTurn = true;
		this.actions = [];
	}
	hardReset() //! Same as soft reset but resets all varaibles
	{
		this.softReset();
		this.setScore(0);
		this.ping = 0;
	}
	getColoredName() //! Name with colors...
	{
		return colorStr(this.tailColor,"0x")+this.name;
	}
	getBoringName() //! Name without colors...
	{
		return removeColors(this.name);
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
		if(this.walls.children.length == 0) return;
		var wmap = this.walls.map;
		var oldwall = this.walls.children[this.walls.children.length-1];
		
		if(breakWallLength)
		{
			var sizex = oldwall.scale.x*oldwall.size,sizey = oldwall.scale.y*oldwall.size;
			this.walls.netLength -= Math.sqrt((sizex*sizex)+(sizey*sizey));
		}
		
		if(typeof(wmap[wmap.length-3]) == "undefined")
		{
			//console.warn("Wall was undefined when trying to calculate wall size");
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
	resetWall(full=true) //! Completely redoes the 3D wall according to the actual wall
	{
		if(full === true)
		{
			this.walls.remove.apply(this.walls, this.walls.children.slice(0));
		}
		var wmap = this.walls.map, wallmod;
		for(var x=1,len=wmap.length;x<len;x++)
		{
			if(full === true || !this.walls.children[x-1])
			{
				this.walls.add(wallmod = newWall(this.tailColor,wmap[x-1][0],wmap[x-1][1],wmap[x-1][2]));
			}
			else
			{
				wallmod = this.walls.children[x-1];
				wallmod.position.set(wmap[x-1][0],wmap[x-1][1],wmap[x-1][2]||0);
				wallmod.scale.set(1,1,0.75);
			}
			wallmod.scale.x += ((wmap[x][0]-wmap[x-1][0]))/wallmod.size;
			wallmod.scale.y += ((wmap[x][1]-wmap[x-1][1]))/wallmod.size;
		}
		if(full !== true)
		{
			this.walls.remove.apply(this.walls, this.walls.children.slice(x));
		}
		
		this.calcWallLength();
	}
	wallBlastHole(x, y, z, radius) //! blast a hole in the cycle walls
	{
		var wallX, wallY, wallX2, wallY2, dir, xdir, ydir, dist, mkHole, add;
		
		{
			// forward loop this time, since the wall array will be growing as walls are split...
			for(var i=0;i<this.walls.map.length;++i)
			{
				wallX = this.walls.map[i][0];
				wallY = this.walls.map[i][1];
				
				if( this.walls.map[i+1] && (this.walls.map[i+1][2]||0) >= 0 )
				{
					wallX2 = this.walls.map[i+1][0];
					wallY2 = this.walls.map[i+1][1];
					
					dist = pointDistance( wallX, wallY, wallX2, wallY2 );
					
					dir = Math.atan2( wallY2-wallY, wallX2-wallX );
					xdir = Math.cos(dir)/100; ydir = Math.sin(dir)/100;
					
					add = 0;
					
					// now we loop through the part of this wall
					while(dist > 0)
					{
						wallX += xdir;
						wallY += ydir;
						dist -= 0.01;
						
						// check if this piece of the wall is in the blast area
						if( is_in_circle( x, y, radius, wallX, wallY, 0.01 ) )
						{
							if(!mkHole)
							{
								// this is where the hole should start
								
								mkHole = [ wallX, wallY, -Infinity ];
							}
						}
						else if(mkHole)
						{
							// alright, now we know where a hole should begin and end
							// time to actually blast one.
							
							this.walls.map.splice( i+1, 0, mkHole, [wallX, wallY, this.walls.map[i+1][2]] );
							i += 2;
							
							mkHole = null;
						}
					}
					
					if(mkHole)
					{
						this.walls.map.splice( i+1, 0, mkHole, [wallX, wallY, this.walls.map[i+1][2]] );
						i += 2;
						
						mkHole = [ wallX2, wallY2, -Infinity ];
						
					}
					
				}
			}
		}
		
		// update the 3d view to reflect the new walls
		this.resetWall();
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
	jump()
	{
		if(settings.CYCLE_MIDAIR_JUMP || this.position.z == 0)
			this.model.rotation.y = -settings.CYCLE_JUMP;
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
		
		if( this.audio ) this.audio.play();
		
		engine.scene.add(this);
		if(update) game.updateScoreBoard();
		
		if(this == engine.players[engine.activePlayer]) engine.viewTarget = engine.activePlayer;
	}
	kill()
	{
		this.resetCurrWallSegment();
		this.alive = false; this.dedtime = performance.now();
		engine.scene.remove(this);
		if(this == engine.players[engine.viewTarget] && !engine.dedicated)
			setTimeout(function(){if(!engine.players[engine.viewTarget].alive)game.changeViewTarget()},3000);
		
		if( this.audio ) this.audio.stop();
		if( engine.audio && !engine.roundCommencing ) try
		{
			engine.audio.playSound({buffer:this.engineType+6,vol:Math.log(60/pointDistance(this.position.x,this.position.y,engine.camera.position.x,engine.camera.position.y))*0.4 });
		}
		catch(e) { console.error(e); }
		spawnExplosion(this.position,this.cycleColor,this.tailColor);
		if(settings.EXPLOSION_RADIUS > 0)
		{
			game.blastHole(this.position, settings.EXPLOSION_RADIUS);
		}
		game.updateScoreBoard();
		
		if(this.hasFlag)
		{
			engine.console.print(this.getColoredName()+"0xRESETT dropped the flag they were holding.\n");
			this.hasFlag.type = "flag";
			this.hasFlag = null;
		}
		
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
			if(alive==aliveAI) game.changeViewTarget(0); //this will handle the finish type stuff
		}
		
		if(window.svr) window.svr.syncDeath(this);
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
			engine.network.sendChat(msg,this);
		}
		else
		{
			engine.console.print(this.getColoredName()+"0xffff7f: "+msg+"\n");
			if(engine.dedicated) {}
		}
	}
	handleTurn(dir)
	{
		var dirmult;
		this.dir.front = (dirmult = cdir(this.rotation.z -= (pi(2)/settings.ARENA_AXES)*dir));
		//this.rotation.z = this.rotation.z%(Math.PI*2);
		//if(this.rotation.z < 0) this.rotation.z += Math.PI*2;
		this.speed *= settings.CYCLE_TURN_SPEED_FACTOR;
		this.afterTurn(dir);
	}
	afterTurn(dir)
	{
		this.rotation.z = normalizeRad(this.rotation.z);
		
		//tilt the cycle
		this.rotation.x = Math.cos(this.rotation.z)*0.4*dir;
		this.rotation.y = Math.sin(this.rotation.z)*0.4*dir;
		//if(settings.GRAB_SENSORS_ON_TURN)
		{
			getCycleSensors(true);
		}
		this.collidetime = engine.gtime+(((this.sensor.front)/this.speed)*1000);
		var mult = (1-settings.CYCLE_RUBBER_MINADJUST);
		this.minDistance.front = Math.max(0,Math.min(this.sensor.front*mult,settings.CYCLE_RUBBER_MINDISTANCE));
		this.lastpos = this.position.clone(); //redundant, should be handled by getCycleSensors
		if(this.haswall) this.newWallSegment();
		
		this.turns++;
		this.lastTurnDir = dir;
		this.lastTurnPos = this.position.clone();
		
		if( engine.audio && !engine.roundCommencing ) try
		{
			engine.audio.playSound({
				buffer:engine.audio.bLoader.other+4,
				vol:1,
				pos: this.position, 
			});
		}
		catch(e) { console.error(e); }
	}
	update(timestep=false) //! Simulates game movement on cycles
	{
		if(timestep === false) { timestep = (engine.gtime-this.gameTime)/1000; if(timestep < 0) return; }
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
			var finalAccel = 0;
			if(wallAccel != 0) //don't bother if there's no accel
			{
				var wallDist = [this.sensor.left,this.sensor.right];
				var accelTargets = [this.sensor.lnearestobj,this.sensor.rnearestobj];
				for(var z=2;z--;)
				{
					if( settings.CYCLE_WALL_NEAR >= wallDist[z] )
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
						finalAccel += wallAccel * (
							( 1 / ( wallDist[z] + settings.CYCLE_ACCEL_OFFSET ) ) -
							( 1 / ( settings.CYCLE_WALL_NEAR + settings.CYCLE_ACCEL_OFFSET ) )
						);
					}
				}
				acceleration += finalAccel;
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
		
		this.lastMoved = true;
		
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
			if(this.collidetime <= timeElapsed+timestep)
			{
				//this.rubber += timestep*(this.lastSpeed);
				collided = true; 
				var adjdist = (((timeElapsed-this.collidetime)/1000)*this.lastSpeed);
				radj = timestep;
				//radj = adjdist;
				radj *= this.lastSpeed;
				dist -= adjdist;
				//console.warn(x+" should have collided: "+(this.collidetime-timeElapsed)+"ms\n");
				this.lastMoved = false;
			}
			//if((dir[0]==0?0:(newx/dir[0]))+(dir[1]==0?0:(newx/dir[1])) >= this.sensor.front)
			if(dist >= this.sensor.front-(this.minDistance.front))
			//if(this.speed*timestep >= this.sensor.front)
			{
				dist = (this.sensor.front-(this.minDistance.front));
				//if(x == engine.viewTarget) console.warn(dist+" "+this.sensor.front+"\n");
				collided = true;
				this.lastMoved = false;
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
						game.killBlame(this,escape);
					}
				}
				else if(
					(settings.CYCLE_RUBBER_DEPLETE_RIM && this.sensor.nearestobj == "rim") ||
					(settings.CYCLE_RUBBER_DEPLETE_SELF && this.sensor.nearestobj == this) ||
					(settings.CYCLE_RUBBER_DEPLETE_ENEMY && this.sensor.nearestobj != this && typeof(this.sensor.nearestobj) == "object")
				)
				{
					this.rubber += radj;
					
					if(window.svr && !this.sendRubber)
					{
						var id = engine.players.indexOf(this);
						for(var i=window.svr.clients.length-1;i>=0;--i)
						{
							if(window.svr.clients[i].netid == id)
							{
								window.svr.clients[i].syncOurCycleNow();
							}
						}
						this.sentRubber = true;
					}
				}
			}
			var move2d = Math.cos(this.model.rotation.y), movez = -this.model.rotation.y;
			var dist2d = dist*move2d;
			var newx = dist2d*dir[0], newy = dist2d*dir[1], newz = dist*movez;
			
			this.position.x += newx;
			this.position.y += newy;
			this.position.z += newz;
			if(this.newPos && settings.CYCLE_SMOOTH_TIME > 0)
			{
				this.newPos.x += newx-(this.newPos.x-this.position.x);
				this.newPos.y += newy-(this.newPos.y-this.position.y);
			}
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
			if(this.haswall && this.walls.children.length > 0 && this.walls.map.length > 0)
			{
				var wallmod = this.walls.children[this.walls.children.length-1];
				var wallmap = this.walls.map[this.walls.map.length-1];
			
				wallmap[0]+=(newx); wallmap[1]+=(newy);
				
				wallmod.scale.x += newx/wallmod.size;
				wallmod.scale.y += newy/wallmod.size;
				
				this.walls.netLength += dist;
				this.dist += dist;
				
				this.sensor.front -= dist; //assume distance until we have new real results.
				//this.sensor.front = 
				
				var targetWLTime = performance.now()+50;
				var lendiff = this.walls.netLength - settings.WALLS_LENGTH;
				while(settings.WALLS_LENGTH > 0 && lendiff > 0)
				{
					if( performance.now() > targetWLTime ) break;
					
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
					else if(this.walls.children[0] && this.walls.map[0])
					{
						this.walls.children[0].scale.x -= xdir/wallmod.size;
						this.walls.children[0].position.x += xdir;
						this.walls.children[0].scale.y -= ydir/wallmod.size;
						this.walls.children[0].position.y += ydir;
						this.walls.map[0][0] += xdir;
						this.walls.map[0][1] += ydir;
						this.walls.netLength -= Math.sqrt((xdir*xdir)+(ydir*ydir));
					} else { break; }
					
					lendiff = this.walls.netLength - settings.WALLS_LENGTH;
				}//*/
				if(this.position.z > 0) this.newWallSegment();
			}
			else if(this.gameTime > this.spawntime+(settings.CYCLE_WALL_TIME*1000))
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
		this.model.owner = this;
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
		
		this.team = cfg.team;
		
		this.hardReset();
		
		//audio creation
		this.engineType = cfg.engineType;
		if(engine.audio)
		{
			this.audio = engine.audio.createCycleRun(this);
		}
	}
	
};

if(typeof(module) != "undefined") module.exports = Player;
