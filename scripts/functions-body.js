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



function getPlayer(name)
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
}

function retToLastSafe(cycle,w1x,w1y,w2x,w2y)
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
					doDeath(cycle);
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
function getCycleSensors(full=false)
{
	var oneline = "";
	var range = settings.CYCLE_SENSORS_RANGE;
	for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x] !== undefined)
	{
		//if(full)
		{
			engine.players[x].sensor.left = engine.players[x].sensor.right = 
				engine.players[x].sensor.leftTurn = engine.players[x].sensor.rightTurn = 
				engine.players[x].sensor.front = 
				engine.players[x].sensor.rear = Infinity;
			engine.players[x].sensor.nearestobj =
				engine.players[x].sensor.lnearestobj = false;
				engine.players[x].sensor.rnearestobj = false;
		}
		engine.players[x].sensor.bottom = 0;
		engine.players[x].sensor.frontWallHeight = Infinity;
		engine.players[x].sensor.objleft = 
			engine.players[x].sensor.objright = 
			engine.players[x].sensor.objfront = 
			engine.players[x].sensor.objrear = false;
		engine.players[x].sensor.nearcycle = false;
		engine.players[x].dir.front = cdir(engine.players[x].rotation.z);
		engine.players[x].dir.left = cdir(engine.players[x].rotation.z+(Math.PI/2));
		engine.players[x].dir.right = cdir(engine.players[x].rotation.z-(Math.PI/2));
		engine.players[x].dir.leftTurn = cdir(engine.players[x].rotation.z+(Math.PI/(settings.ARENA_AXES*0.5)));
		engine.players[x].dir.rightTurn = cdir(engine.players[x].rotation.z-(Math.PI/(settings.ARENA_AXES*0.5)));
	}
	for(var x=engine.zones.children.length-1;x>=0;--x)
	{
		engine.zones.children[x].walldist = Infinity;
		engine.zones.children[x].wall = [0,0,0,0];
	}
	if(!engine.dedicated) var campos = engine.camera.position, ppos = engine.players[engine.viewTarget].position;
	for(var y=engine.map.walls.length-1;y>=0;--y)
	{
		//console.log("ohi");
		var lookThroughWall = false;
		for(var i=engine.map.walls[y].length-1;i>=0;--i)
		{
			var w1x = engine.map.walls[y][i][0], w1y = engine.map.walls[y][i][1], p=engine.map.walls[y][i+1];
			
			if(p !== undefined)
			{
				var w2x = p[0], w2y = p[1]/*,w2z = p[2]*/;
				
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x] !== undefined && engine.players[x].alive)
				{
					var cycle = engine.players[x];
					var posx = cycle.position.x, posy = cycle.position.y, posz = cycle.position.z;
					if(lineIntersect(posx,posy,cycle.lastpos.x,cycle.lastpos.y,w1x,w1y,w2x,w2y))
					{
						retToLastSafe(cycle,w1x,w1y,w2x,w2y);
					}
					else
					{
						var dir = engine.players[x].dir.front,
							ldir = engine.players[x].dir.left,
							rdir = engine.players[x].dir.right
							ltdir = engine.players[x].dir.leftTurn,
							rtdir = engine.players[x].dir.rightTurn;
						var rg = /*cycle.sensor.front==Infinity?*/(cycle.speed*range);//:cycle.sensor.front;
						//var output = pointLineDistance(w1x,w1y,w2x,w2y,posx,posy);
						//var testx = (w2x-w1x)*dir[0], testy = (w2y-w1y)*dir[1], tpx = posx*(-dir[0]), tpy = posy*(-dir[1]);
						//if(cycle == engine.players[engine.viewTarget]) oneline += ""+(w2x-w1x)+"\t\t\t\t\t\t\t"+posx+"\t\t\t\t\t\t\t"+(w2x-w1x)+"\t\t\t\t\t\t\t"+posy+";\n";
						//if(((w2x+w1x)/2) >= posy*dir[0] && ((w2y+w1y)/2) >= posx*dir[1])
						//if(isinfront(w1x,w1y,w2x,w2y,posx,posy,dir))
						coord = [w1x,w1y,w2x,w2y];
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
				if(!engine.dedicated && !lookThroughWall) lookThroughWall = (engine.walls.children[y]&&engine.walls.children[y].geometry.vertices[engine.walls.children[y].geometry.vertices.length-1].z) > campos.z && lineIntersect(campos.x,campos.y,ppos.x,ppos.y,w1x,w1y,w2x,w2y);
			}
		}
		if(!engine.dedicated && engine.walls.children[y]) engine.walls.children[y].visible = !lookThroughWall;
	}
	for(var a=engine.players.length-1;a>=0;--a) if(engine.players[a] !== undefined)
	{
		var walls = engine.players[a].walls.map;
		var len = walls.length;
		for(var i=len-1;i>=0;--i)
		{
			var p1 = walls[i];
			//var w1x = p1[0],w1y = p1[1],w1z = p1[2];
			if(walls[i+1] !== undefined)
			{
				var p2 = walls[i+1];
				//var w2x = p2[0],w2y = p2[1],w2z = p2[2];
				
				for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x] !== undefined && engine.players[x].alive)
				{
					//var cycle = engine.players[x];
					
					//var isplayer = (engine.players[a] == engine.players[x]);
					if(engine.players[a] != engine.players[x] || i <= len-(settings.ARENA_AXES))
					{
						//var posx = engine.players[x].position.x, posy = engine.players[x].position.y, posz = engine.players[x].position.z;
						if(p1[2]||0 <= engine.players[x].position.z && (p1[2]||0)+1 >= engine.players[x].position.z)
						{
							if(lineIntersect(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].lastpos.x,engine.players[x].lastpos.y,p1[0],p1[1],p2[0],p2[1]))
							{
								retToLastSafe(engine.players[x],p1[0],p1[1],p2[0],p2[1]);
							}
							else
							{
								var dir = engine.players[x].dir.front,
									ldir = engine.players[x].dir.left,
									rdir = engine.players[x].dir.right,
									ltdir = engine.players[x].dir.leftTurn,
									rtdir = engine.players[x].dir.rightTurn;
								//var rg = engine.players[x].sensor.front==Infinity?(engine.players[x].speed*range):engine.players[x].sensor.front;
								//if(engine.players[x].sensor.front==Infinity)
									var rg=engine.players[x].speed*range;//else var rg=engine.players[x].sensor.front;
								//if(!(engine.players[x].position.x == p2[0] && engine.players[x].position.y == p2[1]))
								{
									if(lineIntersect(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x+(dir[0]*rg),engine.players[x].position.y+(dir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var ff=distanceoflines(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x,engine.players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										/*forward = Math.min(forward,ff);
										if(ff == forward) type = engine.players[x];//*/
										if(ff < engine.players[x].sensor.front)
										{ 
											engine.players[x].sensor.front=ff;
											engine.players[x].sensor.nearestobj = engine.players[a];
											if(engine.players[a] != engine.players[x]) 
											{
												engine.players[x].sensor.lastnonselfobj = engine.players[a];
											}
										}
									}
									else if(lineIntersect(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x+(ldir[0]*rg),engine.players[x].position.y+(ldir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var ll = distanceoflines(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x,engine.players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(ll < engine.players[x].sensor.left)
										{ 
											engine.players[x].sensor.left=ll;
											engine.players[x].sensor.lnearestobj = engine.players[a];
												engine.players[x].sensor.objleft = engine.players[a];
										}
									}
									else if(lineIntersect(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x+(rdir[0]*rg),engine.players[x].position.y+(rdir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var rr = distanceoflines(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x,engine.players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(rr < engine.players[x].sensor.right) 
										{ 
											engine.players[x].sensor.right=rr;
											engine.players[x].sensor.rnearestobj = 
												engine.players[x].sensor.objright = engine.players[a];
										}
									}
									else if(lineIntersect(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x+(-dir[0]*rg),engine.players[x].position.y+(-dir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var bb=distanceoflines(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x,engine.players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(bb < engine.players[x].sensor.rear) 
										{ 
											engine.players[x].sensor.rear=bb; 
											engine.players[x].sensor.objrear = engine.players[a];
										}
									}
									if(lineIntersect(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x+(ltdir[0]*rg),engine.players[x].position.y+(ltdir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var ll = distanceoflines(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x,engine.players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(ll < engine.players[x].sensor.leftTurn) { engine.players[x].sensor.leftTurn=ll;}
									}
									else if(lineIntersect(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x+(rtdir[0]*rg),engine.players[x].position.y+(rtdir[1]*rg),p1[0],p1[1],p2[0],p2[1]))
									{
										var rr = distanceoflines(engine.players[x].position.x,engine.players[x].position.y,engine.players[x].position.x,engine.players[x].position.y,p1[0],p1[1],p2[0],p2[1]);
										if(rr < engine.players[x].sensor.rightTurn) { engine.players[x].sensor.rightTurn=rr;}
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
		for(var y=engine.players.length-1;y>=0;--y) if(engine.players[y] !== undefined)
		{
			var ff = Math.sqrt(((zone[1]-p2x)**2)+((zone[2]-p2y)**2))-zone[3];
			if(ff < cycle.sensor.front) { cycle.sensor.front=ff; cycle.sensor.nearestobj = "zone"; }
		}
	}*/
	//console.log(forward);
	if(oneline != "") console.log(oneline);
	for(var x=engine.players.length-1;x>=0;--x) if((cycle=engine.players[x]) !== undefined && cycle.lastpos)
	{
		cycle.lastpos.x = cycle.position.x;
		cycle.lastpos.y = cycle.position.y;
		cycle.lastpos.z = cycle.position.z;
		engine.players[x].lastdir = {
			front:engine.players[x].dir.front,
			left:engine.players[x].dir.left,
			right:engine.players[x].dir.right
		};
		engine.players[x].lastsensor = {
			front:engine.players[x].sensor.front,
			left:engine.players[x].sensor.left,
			right:engine.players[x].sensor.right
		};
		cycle.intersectTest = [];
	}
}

function maxSpeed()
{
	if(settings.CYCLE_SPEED_DECAY_ABOVE > 0 )
		var max_cs = settings.CYCLE_SPEED / settings.CYCLE_SPEED_DECAY_ABOVE;
	else
		var max_cs =  settings.CYCLE_SPEED * 100;
	var max_fastest = engine.fastestSpeed; //
	return Math.max(max_cs,max_fastest);
}

function handleChat(cycle,output)
{
	var split = output.split(" ");
	/*if(split[0][0] == "/")
	{
		switch(split[0])
		{
			case "/console": case "/admin":
				if(!engine.dedicated || split[0] != "/console")
				{
					split.shift();
					loadcfg(split.join(" "));
					break;
				}
			default:
				if(engine.network) 
				{
					
				}
				else
				{
					engine.console.print('Unknown chat command "'+split[0]+'".\n');
				}
				break;
		}
	}*/
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
	function centerMessage(msg,time=5000)
	{
		console.log(msg);
		if(window.svr)
		{
			if(time == Infinity) time = Number.MAX_VALUE;
			var data = JSON.stringify({type:"cen",data:{msg:msg,time:time}});
			window.svr.clients.forEach(function(ws){ws.send(data);});
		}
	}
}
else
{
	function centerMessage(msg,time=5000)
	{
		var cm = document.getElementById("centerMessage");
		cm.innerHTML = replaceColors(htmlEntities(msg));
		cm.style.opacity = 1;
		cm.style.display = "block";
		engine.cMFadeOutAfter = performance.now()+time;
	}
}

function toLadderLog(event,params)
{
	if(settings["LADDERLOG_WRITE_"+event])
	{
		
	}
}
