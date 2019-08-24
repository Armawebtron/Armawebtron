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

class AI
{
	
	think(timestep)
	{
		var shouldTurn = this.cycle.sensor.front < Math.min(5,Math.max(this.cycle.sensor.leftTurn,this.cycle.sensor.rightTurn)),
			dangerouslyNearWall = this.cycle.sensor.front <= settings.CYCLE_RUBBER_MINDISTANCE+1,
			usingRubber = this.cycle.rubber > this.lastRubber;
		
		if(engine.gtime > this.cycle.lastTurnTime+(settings.CYCLE_DELAY*1000))
		{
			switch(this.state)
			{
				case 0:
					if(shouldTurn) return this.basicDecision();
					break;
				case 2: //practically state 0 but theoretically better!
					var nearestPlayer = false, nearestPlayerDist = Infinity;
					for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
					{
						if(engine.players[x] != this.cycle)
						{
							var dist = pointDistance(engine.players[x].position.x,engine.players[x].position.y,
													this.cycle.position.x,this.cycle.position.y);
							if(dist > nearestPlayerDist)
							{
								nearestPlayerDist = dist; nearestPlayer = engine.players[x];
							}
						}
					}
					this.nearestPlayer = nearestPlayer;
					if(shouldTurn) 
					{
						return this.basicDecision();
					}
					else if(nearestPlayer)
					{
						if(nearestPlayer == this.cycle.sensors.objrear && (nearestPlayer != this.cycle.sensors.objleft && nearestPlayer != this.cycle.sensors.objright))
						{
							this.cycle.turn(this.getRelDirToPoint(nearestPlayer.position.x,nearestPlayer.position.y)); //turn in front of the player
						}
						else if(nearestPlayer.sensors.objfront == nearestPlayer) //we're in front of our nearest cycle
						{
							this.cycle.turn(this.getRelDirToPoint(nearestPlayer.position.x,nearestPlayer.position.y)); //turn back to the player
						}
						return;
					}
					break;
				case 1:
					if(this.target === false) this.target = engine.players[Math.round(Math.random()*engine.players.length)];
					if(this.target == this || typeof(this.target) == "undefined" || !this.target.alive)
					{
						this.target = false;
					}
					else
					{
						this.huntDownTarget();
					}
					if(usingRubber) this.basicDecision();
					break;
				case 3:
					
					break;
				default:
					console.error("Invalid state "+this.state+"!");
					this.state = 0;
					break;
			}
		}
		if(this.destPoints.length > 0 && engine.gtime > this.cycle.lastTurnTime+(settings.CYCLE_DELAY*1000))
		{
			var pt = this.destPoints[0];
			this.cycle.turn(this.getRelDirToPoint(pt[0],pt[1]));
		}
		this.cycle.braking = settings.AI_FORCE_BRAKE||(settings.CYCLE_BRAKE > 0 && dangerouslyNearWall && usingRubber);
		this.lastRubber = this.cycle.rubber;
	}
	basicDecision()
	{
		if(this.cycle.sensor.rightTurn < this.cycle.sensor.leftTurn)
			//if(this.cycle.sensor.left > this.cycle.sensor.front) 
				this.cycle.turn(-1);
		else if(this.cycle.sensor.rightTurn > this.cycle.sensor.leftTurn)
			//if(this.cycle.sensor.right > this.cycle.sensor.front) 
				this.cycle.turn(1);
		else
			this.cycle.turn([-1,1][Math.round(Math.random()*1)]);
	}
	huntDownTarget()
	{
		var nearX = this.target.position.x, nearY = this.target.position.y,
			nearDist = pointDistance(this.target.position.x,this.target.position.y,
									 this.cycle.position.x,this.cycle.position.y);
		var playerDist = nearDist;
		for(var i=this.target.walls.length;i>=0;--i)
		{
			var wall = this.target.walls[i];
			var dist = pointDistance(wall[0],wall[1],
									 this.cycle.position.x,this.cycle.position.y);
			if(dist < nearDist)
			{
				nearDist = dist; nearX = wall[0]; nearY = wall[1];
			}
			
		}
	}
	getRelDirToPoint(x,y)
	{
		//var dist = pointDistance(x,y,this.cycle.position.x,this.cycle.position.y);
		var dir = [(this.cycle.position.x-pt[0]),(this.cycle.position.y-pt[1])];
		var ang = Math.atan2(dir[1],dir[0]);
		//if(Math.round((this.cycle.rotation.z)/8) != Math.round(ang/8)) //point is not in front
		{
			var angdiff = normalizeRad(this.cycle.rotation.z-ang);
			if(angdiff < Math.PI)
			{
				return -1;
			}
			else if(angdiff > Math.PI)
			{
				return 1;
			}
			//centerMessage(angdiff);
		}
	}
	constructor(cycle)
	{
		this.cycle = cycle; this.lastRubber = 0;
		this.state = 2; //theoretical states: 0: survive, 1: trace, 2: closecombat, 3: pathfind
		this.target = false;
		this.targetX = NaN; this.targetY = NaN;
		this.destPoints = [];
	}
}

if(typeof(module) != "undefined") module.exports = AI;
