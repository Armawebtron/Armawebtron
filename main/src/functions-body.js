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

if(typeof(global) === "undefined")
	global = window;

global.getPlayer = function(name)
{
	name = removeColors(name).filter();
	var matches = [];
	for(var i=engine.players.length-1;i>=0;--i) if(engine.players[i])
	{
		if(engine.players[i].getBoringName().filter() == name)
		{
			return engine.players[i];
		}
		else if(engine.players[i].getBoringName().filter().indexOf(name) > -1)
		{
			matches.push(i);
		}
	}
	if(matches.length > 1)
	{
		engine.console.print("Too many matches for "+name+". Try something more exact to narrow down the search.\n");
	}
	else if(matches.length < 1)
	{
		engine.console.print("No matches for "+name+". Try a different name.\n");
	}
	else
	{
		return engine.players[matches[0]];
	}
};

(function(){"use strict";
const players = engine.playersById;
var retToLastSafe = function(cycle,w1x,w1y,w2x,w2y)
{
	var dist = distanceoflines(cycle.position.x,cycle.position.y,cycle.position.x,cycle.position.y,w1x,w1y,w2x,w2y);
	console.warn(cycle.name+" phased through a wall "+dist+"m.\n");
	//if(dist == 0) return;
	dist -= settings.CYCLE_RUBBER_MINDISTANCE;
	cycle.position.x -= cycle.lastdir.front[0]*dist; cycle.position.y -= cycle.lastdir.front[1]*dist;
	if(lineIntersect(cycle.position.x,cycle.position.y,cycle.lastpos.x,cycle.lastpos.y,w1x,w1y,w2x,w2y))
	{
		//cycle.position.x += cycle.lastdir.front[0]*(dist*2); cycle.position.y += cycle.lastdir.front[1]*(dist*2);
		//if(lineIntersect(cycle.position.x,cycle.position.y,cycle.lastpos.x,cycle.lastpos.y,w1x,w1y,w2x,w2y))
		{
			var dist = distanceoflines(cycle.lastpos.x,cycle.lastpos.y,cycle.lastpos.x,cycle.lastpos.y,w1x,w1y,w2x,w2y);
			dist -= settings.CYCLE_RUBBER_MINDISTANCE;
			cycle.position.x = cycle.lastpos.x+
				(cycle.lastdir.front[0]*dist)/*+
				(cycle.lastsensor.left*cycle.lastdir.left[0])+
				(cycle.lastsensor.right*cycle.lastdir.right[0])*/; 
			cycle.position.y = cycle.lastpos.y+
				(cycle.lastdir.front[1]*dist)/*+
				(cycle.lastsensor.left*cycle.lastdir.left[1])+
				(cycle.lastsensor.right*cycle.lastdir.right[1])*/; 
			/*while(lineIntersect(cycle.position.x,cycle.position.y,cycle.lastpos.x,cycle.lastpos.y,w1x,w1y,w2x,w2y))
			{
				cycle.position.x -= (1/1000)*cycle.lastdir.front[0];
				cycle.position.y -= (1/1000)*cycle.lastdir.front[1];
			}
			cycle.collidetime = 0; cycle.lastspeed = 0;*/
			if(lineIntersect(cycle.position.x,cycle.position.y,cycle.lastpos.x,cycle.lastpos.y,w1x,w1y,w2x,w2y))
			{
				if(engine.network)
				{
					//request new cycle trails
				}
				else
				{
					game.killBlame(cycle);
					engine.console.print(cycle.name+" phased through a wall and has been terminated.\n");
				}
			}
			else
			{
				cycle.rubber += cycle.speed;
				cycle.sensor.front = settings.CYCLE_RUBBER_MINDISTANCE;
			}
		}
	}
	else
	{
		cycle.rubber += cycle.speed;
		cycle.sensor.front = settings.CYCLE_RUBBER_MINDISTANCE;
	}
	if(engine.haswall) recalcCurrWall(cycle);
}
global.getCycleSensors = function(full=false)
{
	var oneline = "";
	var range = settings.CYCLE_SENSORS_RANGE;
	var lrot, rrot, ldrot, rdrot;
	for(var x=players.length-1;x>=0;--x) if(players[x] !== undefined)
	{
		//if(full)
		{
			players[x].sensor.left = players[x].sensor.right = 
				players[x].sensor.leftTurn = players[x].sensor.rightTurn = 
				players[x].sensor.front = 
				players[x].sensor.rear = Infinity;
			players[x].sensor.nearestobj =
				players[x].sensor.lnearestobj = false;
				players[x].sensor.rnearestobj = false;
		}
		players[x].sensor.bottom = 0;
		players[x].sensor.frontWallHeight = Infinity;
		players[x].sensor.objleft = 
			players[x].sensor.objright = 
			players[x].sensor.objfront = 
			players[x].sensor.objrear = false;
		players[x].sensor.nearcycle = false;
		players[x].dir.front = cdir(players[x].rotation.z);
		players[x].dir.left = cdir(lrot=(players[x].rotation.z+(Math.PI/2)));
		players[x].dir.right = cdir(rrot=(players[x].rotation.z-(Math.PI/2)));
		players[x].dir.leftTurn = cdir(ldrot=(players[x].rotation.z+(Math.PI/(settings.ARENA_AXES*0.5))));
		players[x].dir.rightTurn = cdir(rdrot=(players[x].rotation.z-(Math.PI/(settings.ARENA_AXES*0.5))));
		players[x].dir.lDiff = (lrot != ldrot);
		players[x].dir.rDiff = (rrot != rdrot);
	}
	for(var x=engine.zones.children.length-1;x>=0;--x)
	{
		engine.zones.children[x].walldist = Infinity;
		engine.zones.children[x].wall = [0,0,0,0];
	}
	var campos = engine.camera.position, ppos;
	if(!engine.dedicated) ppos = players[engine.viewTarget]?players[engine.viewTarget].position:(new THREE.Vector3());
	var lookThroughWall = false;
	var ldir, rdir, ltdir, rtdir;
	for(var y=engine.map.walls.length-1;y>=0;--y)
	{
		//console.log("ohi");
		for(var i=engine.map.walls[y].length-1;i>=0;--i)
		{
			var w1x = engine.map.walls[y][i][0], w1y = engine.map.walls[y][i][1], p=engine.map.walls[y][i+1];
			
			if(p !== undefined)
			{
				var w2x = p[0], w2y = p[1]/*,w2z = p[2]*/;
				
				for(var x=players.length-1;x>=0;--x) if(players[x] !== undefined && players[x].alive)
				{
					var cycle = players[x];
					var posx = cycle.position.x, posy = cycle.position.y, posz = cycle.position.z;
					if(cycle.newPos && lineIntersect(posx,posy,cycle.newPos.x,cycle.newPos.y,w1x,w1y,w2x,w2y))
					{
						posx = cycle.position.x = cycle.newPos.x; posy = cycle.position.y = cycle.newPos.y;
						var dir = players[x].lastdir.front;
						players[x].lastpos.x = players[x].newPos.real.x-players[x].dir.front[0];
						players[x].lastpos.y = players[x].newPos.real.y-players[x].dir.front[1];
						delete cycle.newPos;
						//return getCycleSensors(full);
						//centerMessage("tried to phase through rim - newpos");
					}
					if(lineIntersect(posx,posy,cycle.lastpos.x,cycle.lastpos.y,w1x,w1y,w2x,w2y))
					{
						retToLastSafe(cycle,w1x,w1y,w2x,w2y);
					}
					else
					{
						dir = players[x].dir.front,
						ldir = players[x].dir.left,
						rdir = players[x].dir.right
						ltdir = players[x].dir.leftTurn,
						rtdir = players[x].dir.rightTurn;
						var rg = /*cycle.sensor.front==Infinity?*/(cycle.speed*range);//:cycle.sensor.front;
						//var output = pointLineDistance(w1x,w1y,w2x,w2y,posx,posy);
						//var testx = (w2x-w1x)*dir[0], testy = (w2y-w1y)*dir[1], tpx = posx*(-dir[0]), tpy = posy*(-dir[1]);
						//if(cycle == players[engine.viewTarget]) oneline += ""+(w2x-w1x)+"\t\t\t\t\t\t\t"+posx+"\t\t\t\t\t\t\t"+(w2x-w1x)+"\t\t\t\t\t\t\t"+posy+";\n";
						//if(((w2x+w1x)/2) >= posy*dir[0] && ((w2y+w1y)/2) >= posx*dir[1])
						//if(isinfront(w1x,w1y,w2x,w2y,posx,posy,dir))
						//coord = [w1x,w1y,w2x,w2y];
						if(lineIntersect(posx,posy,posx+(dir[0]*rg),posy+(dir[1]*rg),w1x,w1y,w2x,w2y))
						{
							//var ff = distanceoflines(posx,posy,posx+(dir[0]/6),posy+(dir[1]/6),w1x,w1y,w2x,w2y);
							var ff = distanceoflines(posx,posy,posx,posy,w1x,w1y,w2x,w2y);
							/*forward = Math.min(forward,ff);
							if(ff == forward) type = "rim";//*/
							if(ff < cycle.sensor.front) { cycle.sensor.front=ff; cycle.sensor.nearestobj = "rim";}
						}
						else if(lineIntersect(posx,posy,posx+(ldir[0]*rg),posy+(ldir[1]*rg),w1x,w1y,w2x,w2y))
						{
							var ll = distanceoflines(posx,posy,posx,posy,w1x,w1y,w2x,w2y);
							if(ll < cycle.sensor.left) { cycle.sensor.left=ll; cycle.sensor.lnearestobj = "rim";}
						}
						else if(lineIntersect(posx,posy,posx+(rdir[0]*rg),posy+(rdir[1]*rg),w1x,w1y,w2x,w2y))
						{
							var rr = distanceoflines(posx,posy,posx,posy,w1x,w1y,w2x,w2y);
							if(rr < cycle.sensor.right) { cycle.sensor.right=rr; cycle.sensor.rnearestobj = "rim";}
						}
						if(lineIntersect(posx,posy,posx+(ltdir[0]*rg),posy+(ltdir[1]*rg),w1x,w1y,w2x,w2y))
						{
							var ll = distanceoflines(posx,posy,posx,posy,w1x,w1y,w2x,w2y);
							if(ll < cycle.sensor.leftTurn) { cycle.sensor.leftTurn=ll; }
						}
						else if(lineIntersect(posx,posy,posx+(rtdir[0]*rg),posy+(rtdir[1]*rg),w1x,w1y,w2x,w2y))
						{
							var rr = distanceoflines(posx,posy,posx,posy,w1x,w1y,w2x,w2y);
							if(rr < cycle.sensor.rightTurn) { cycle.sensor.rightTurn=rr;}
						}
						/*
						if(((w2x+w1x)/2) >= posy*ldir[0] && ((w2y+w1y)/2) >= posx*ldir[1])
						{
							var ll = distanceoflines(posx,posy,posx+(ldir[0]),posy+(ldir[1]),w1x,w1y,w2x,w2y);
							left = Math.min(left,ll);
						}
						if(((w2x+w1x)/2) >= posy*rdir[0] && ((w2y+w1y)/2) >= posx*rdir[1])
						{
							var rr = distanceoflines(posx,posy,posx+(rdir[0]),posy+(rdir[1]),w1x,w1y,w2x,w2y);
							right = Math.min(right,rr);
						}
						*/
					}
				}
				for(var x=engine.zones.children.length-1;x>=0;--x)
				{
					var zone = engine.zones.children[x];
					var posx = zone.position.x, posy = zone.position.y;
					var walldist = distanceoflines(posx,posy,posx,posy,w1x,w1y,w2x,w2y)-zone.cfg.radius;
					if(walldist < zone.walldist)
					{
						zone.walldist = walldist;
						zone.wall[0]=w1x;zone.wall[1]=w1y;zone.wall[2]=w2x;zone.wall[3]=w2y;
					}
				}
				if(!engine.dedicated)
				{
					var test = (engine.walls.children[y]&&engine.walls.children[y].geometry.vertices[engine.walls.children[y].geometry.vertices.length-1].z) > campos.z && lineIntersect(campos.x,campos.y,ppos.x,ppos.y,w1x,w1y,w2x,w2y);
					if( !(lookThroughWall && !test) )
					{
						var newDist = test?(distanceoflines(campos.x,campos.y,campos.x,campos.y,w1x,w1y,w2x,w2y)+6):settings.CAMERA_NEAR_RENDER;
						lookThroughWall = test;
						if( newDist != engine.camera.near && newDist >= settings.CAMERA_NEAR_RENDER )
						{
							engine.camera.near = newDist;
							engine.camera.updateProjectionMatrix();
						}
					}
				}
			}
		}
	}
	var pLen = players.length-1;
	var wCycle, cycle;
	var walls, len;
	for(var a=pLen;a>=0;--a) if(players[a] !== undefined)
	{
		wCycle = players[a];
		walls = wCycle.walls.map;
		len = walls.length;
		for(var i=len-1;i>=0;--i)
		{
			var p1 = walls[i];
			//var w1x = p1[0],w1y = p1[1],w1z = p1[2];
			if(walls[i+1] !== undefined)
			{
				var p2 = walls[i+1];
				//var w2x = p2[0],w2y = p2[1],w2z = p2[2];
				
				for(var x=pLen;x>=0;--x) if(players[x] && players[x].alive)
				{
					if(wCycle !== players[x] || i <= len-(settings.ARENA_AXES))
					{
						if((p1[2]||0) <= players[x].position.z && (p1[2]||0)+2 >= players[x].position.z)
						{
						
							if(players[x].newPos && lineIntersect(players[x].position.x,players[x].position.y,players[x].newPos.x,players[x].newPos.y,p1[0],p1[1],p2[0],p2[1]))
							{
								players[x].position.x = players[x].newPos.x;
								players[x].position.y = players[x].newPos.y;
								var dir = cdir(players[x].rotation.z);
								players[x].lastpos.x = players[x].newPos.real.x-players[x].dir.front[0];
								players[x].lastpos.y = players[x].newPos.real.y-players[x].dir.front[1];
								delete players[x].newPos;
								//return getCycleSensors(full);
								retToLastSafe(players[x],p1[0],p1[1],p2[0],p2[1]);
								//centerMessage("tried to phase through wall - newpos");
							}
							if(lineIntersect(players[x].position.x,players[x].position.y,players[x].lastpos.x,players[x].lastpos.y,p1[0],p1[1],p2[0],p2[1]))
							{
								retToLastSafe(players[x],p1[0],p1[1],p2[0],p2[1]);
							}
							else
							{
								dir = players[x].dir.front;
								ldir = players[x].dir.left;
								rdir = players[x].dir.right;
								ltdir = players[x].dir.leftTurn;
								rtdir = players[x].dir.rightTurn;
								//var rg = players[x].sensor.front==Infinity?(players[x].speed*range):players[x].sensor.front;
								//if(players[x].sensor.front==Infinity)
									var rg=players[x].speed*range;//else var rg=players[x].sensor.front;
								//if(!(players[x].position.x == p2[0] && players[x].position.y == p2[1]))
								{
									if(lineIntersect(players[x].position.x,players[x].position.y,players[x].position.x+(dir[0]*rg),players[x].position.y+(dir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var ff=distanceoflines(players[x].position.x,players[x].position.y,players[x].position.x,players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										/*forward = Math.min(forward,ff);
										if(ff == forward) type = players[x];//*/
										if(ff < players[x].sensor.front)
										{ 
											players[x].sensor.front=ff;
											players[x].sensor.nearestobj = wCycle;
											if(wCycle != players[x]) 
											{
												players[x].sensor.lastnonselfobj = wCycle;
											}
										}
									}
									else if(lineIntersect(players[x].position.x,players[x].position.y,players[x].position.x+(ldir[0]*rg),players[x].position.y+(ldir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var ll = distanceoflines(players[x].position.x,players[x].position.y,players[x].position.x,players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(ll < players[x].sensor.left)
										{ 
											players[x].sensor.left=ll;
											players[x].sensor.lnearestobj = wCycle;
												players[x].sensor.objleft = wCycle;
										}
										if( !players[x].dir.lDiff && ll < players[x].sensor.leftTurn )
										{
											if(ll < players[x].sensor.leftTurn) { players[x].sensor.leftTurn=ll;}
										}
									}
									else if(lineIntersect(players[x].position.x,players[x].position.y,players[x].position.x+(rdir[0]*rg),players[x].position.y+(rdir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var rr = distanceoflines(players[x].position.x,players[x].position.y,players[x].position.x,players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(rr < players[x].sensor.right) 
										{ 
											players[x].sensor.right=rr;
											players[x].sensor.rnearestobj = 
												players[x].sensor.objright = wCycle;
										}
										if( !players[x].dir.rDiff && ll < players[x].sensor.leftTurn )
										{
											if(rr < players[x].sensor.rightTurn) { players[x].sensor.rightTurn=rr;}
										}
									}
									else if(lineIntersect(players[x].position.x,players[x].position.y,players[x].position.x+(-dir[0]*rg),players[x].position.y+(-dir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var bb=distanceoflines(players[x].position.x,players[x].position.y,players[x].position.x,players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(bb < players[x].sensor.rear) 
										{ 
											players[x].sensor.rear=bb; 
											players[x].sensor.objrear = wCycle;
										}
									}
									if(players[x].dir.lDiff && lineIntersect(players[x].position.x,players[x].position.y,players[x].position.x+(ltdir[0]*rg),players[x].position.y+(ltdir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var ll = distanceoflines(players[x].position.x,players[x].position.y,players[x].position.x,players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(ll < players[x].sensor.leftTurn) { players[x].sensor.leftTurn=ll;}
									}
									else if(players[x].dir.rDiff && lineIntersect(players[x].position.x,players[x].position.y,players[x].position.x+(rtdir[0]*rg),players[x].position.y+(rtdir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var rr = distanceoflines(players[x].position.x,players[x].position.y,players[x].position.x,players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(rr < players[x].sensor.rightTurn) { players[x].sensor.rightTurn=rr;}
									}
								}
							}
						}
					}
				}
			}
		}
	}//*/
	/*for(var x=engine.map.zones.length-1;x>=0;--x)
	{
		var zone = engine.map.zones[x];
		for(var y=players.length-1;y>=0;--y) if(players[y] !== undefined)
		{
			var ff = Math.sqrt(((zone[1]-p2x)**2)+((zone[2]-p2y)**2))-zone[3];
			if(ff < cycle.sensor.front) { cycle.sensor.front=ff; cycle.sensor.nearestobj = "zone"; }
		}
	}*/
	//console.log(forward);
	if(oneline != "") console.log(oneline);
	for(var x=players.length-1;x>=0;--x) if((cycle=players[x]) !== undefined && cycle.lastpos)
	{
		cycle.lastpos.x = cycle.position.x;
		cycle.lastpos.y = cycle.position.y;
		cycle.lastpos.z = cycle.position.z;
		players[x].lastdir = {
			front:players[x].dir.front,
			left:players[x].dir.left,
			right:players[x].dir.right
		};
		players[x].lastsensor = {
			front:players[x].sensor.front,
			left:players[x].sensor.left,
			right:players[x].sensor.right
		};
		cycle.intersectTest = [];
	}
}
})();

global.maxSpeed = function()
{
	if(settings.CYCLE_SPEED_DECAY_ABOVE > 0 )
		var max_cs = settings.CYCLE_SPEED / settings.CYCLE_SPEED_DECAY_ABOVE;
	else
		var max_cs =  settings.CYCLE_SPEED * 100;
	var max_fastest = engine.fastestSpeed; //
	return Math.max(max_cs,max_fastest);
}

global.handleChat = function(cycle,output)
{
	var split = output.split(" ");
	if(split[0] == "/console" && !engine.dedicated)
	{
		split.shift();
		loadcfg(split.join(" "));
	}
	else if(split[0][0] == "/" && !engine.network)
	{
		switch(split[0])
		{
			case "/admin":
				split.shift();
				var ln = split.join(" ");
				engine.console.print('Remote admin command from '+cycle.getBoringName()+'0x7f7fff: '+ln+'\n');
				var text = []; engine.concatch = {to:text,type:"list"};
				loadcfg(ln);
				engine.concatch = undefined;
				for(var i=0;i<text.length;++i)
				{
					engine.console.print('0xff7f7fRA:0xRESETT '+text[i]+'\n',cycle);
				}
				break;
			case "/players":
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
				{
					engine.console.print(x+": "+engine.players[x].getColoredName()+"\n",cycle);
				}
				break;
			case "/me":
				cycle.doChat(output);
				break;
			default:
				
				break;
		}
	}
	else
	{
		cycle.doChat(output);
	}
}


if(typeof(document) == "undefined")
{
	global.centerMessage = function(msg,time=5000)
	{
		console.log(msg);
		if(window.svr)
		{
			if(time == Infinity) time = Number.MAX_VALUE;
			window.svr.send({type:"cen",data:{msg:msg,time:time}});
		}
	}
}
else
{
	global.centerMessage = function(msg,time=5000)
	{
		var cm = document.getElementById("centerMessage");
		cm.innerHTML = replaceColors(htmlEntities(msg)).replace(/\n/g,"<br/>").replace(/\\n/g,"<br/>");
		cm.style.opacity = 1;
		cm.style.display = "block";
		var lines = cm.innerText.split("\n");
		var fontSize = 64;
		for(var i=lines.length-1;i>=0;--i)
		{
			var tmpSize = (64*(document.body.clientWidth/(lines[i].length*64)));
			if(fontSize > tmpSize) fontSize = tmpSize;
		}
		cm.style.fontSize = fontSize+"px";
		engine.cMFadeOutAfter = performance.now()+time;
	}
}

class GameCamera extends THREE.PerspectiveCamera
{
	constructor()
	{
		var aspectRatio = (window.innerWidth / window.innerHeight);
		super( settings.CAMERA_FOV, aspectRatio, settings.CAMERA_NEAR_RENDER, settings.CAMERA_FAR_RENDER );
		this.up = new THREE.Vector3(0,0,1); //Z is up, X and Y is l+r and b+f
		//this.position.set(247, 247, 3);
		this.userViewDir = false;
	}
	
	adjViewDir(adj, ta=1)
	{
		if(engine.camera.userViewDir)
		{
			var t = engine.camera.userViewDir.times|0;
			engine.camera.userViewDir = cdir(crad(engine.camera.userViewDir)+adj)
			engine.camera.userViewDir.times = t+ta;
		}
		else
		{
			engine.camera.userViewDir = cdir(engine.players[engine.viewTarget].rotation.z+adj);
			engine.camera.userViewDir.times = ta;
		}
	}
	
	resetViewDir()
	{
		if(engine.camera.userViewDir)
		{
			engine.camera.userViewDir.times = 0;
			engine.camera.userViewDir = false;
		}
	}
}
global.GameCamera = GameCamera;

global.toLadderLog = function(event,params)
{
	if(settings["LADDERLOG_WRITE_"+event])
	{
		
	}
}
