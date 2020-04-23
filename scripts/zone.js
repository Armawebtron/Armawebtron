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

var flagColors = [ 0x55AAFF, 0xFFFF55, 0xFF5555, 0x55FF55, 0xFF55FF, 0x55FFFF, 0xFFFFFF, 0x888888];
class Zone
{
	spawn()
	{
		engine.zones.add(this.mesh);
		return this;
	}
	destroy()
	{
		engine.zones.remove(this.mesh);
		return this;
	}
	constructor(prop)
	{
		this.timesEntered = 0; this.netObject = false;
		
		this.type = prop.type||"null";
		this.rotationSpeed = isNaN(prop.rot)?settings.ZONE_SPIN_SPEED:prop.rot;
		this.value = prop.value||0;
		this.expansion = prop.expansion||0;
		this.radius = prop.radius||0;
		this.xdir = prop.xdir||0; this.ydir = prop.ydir||0;
		this.bounce = !!prop.bounce;
		this.team = false;
		var zoneHeight = prop.height||settings.ZONE_HEIGHT; 
		if (settings.ZONE_SEGMENTS < 1) { settings.ZONE_SEGMENTS = 11; }
		
		var zoneSegments = (Math.floor(this.radius/10)*10)+1;
		if (zoneSegments < 11) { zoneSegments = 11; }
		var zoneColor = 0xFFFFFF;
		if(prop.color || prop.color === 0)
		{
			zoneColor = prop.color;
		}
		else
		{
			switch(this.type)
			{
				case "death": zoneColor = 0xFF0000; break;
				case "soccerball": zoneColor = 0xFF8888; break;
				case "soccergoal": zoneColor = 0xBB6666; break;
				case "rubber": zoneColor = 0xFFB033; break; 
				case "rubberadjust": zoneColor = 0xFF8800; break;
				case "oneway": zoneColor = 0xFFFF00; break;
				case "win": zoneColor = 0x00FF00; break;
				case "target": zoneColor = 0x00DD00; break;
				case "teleport": zoneColor = 0x00AA00; break;
				case "speed": zoneColor = 0x00FF88; break;
				case "acceleration": zoneColor = 0x00BB66; break;
				case "blast": zoneColor = 0x0088FF; break;
				case "fortress": case "flag":
					var lastDist = Infinity;
					var closestSpawn = 0;
					for(var w=0;w<engine.map.spawns.length;w++)
					{
						var checkx = engine.map.spawns[w][0];
						var checky = engine.map.spawns[w][1];
						var disValue = pointDistance( checkx, checky, prop.x, prop.y );
						if (disValue < 0) { disValue = -disValue; }
						if (disValue < lastDist) { lastDist = disValue; closestSpawn = w; }
					}
					if (closestSpawn > 7) { zoneColor = 0x4488FF; }
					else { zoneColor = (this.type=="fortress"?teamColor:teamColor)(closestSpawn); }
					this.team = closestSpawn;
					break;
				case "object": zoneColor = 0xBB0066; break;
				case "checkpoint": zoneColor = 0xFF0088; break;
				case "koh": zoneColor = 0xDDDDDD; break;
				case "wall": case "ball": zoneColor = 0xFFFFFF; break;
				case "switch": zoneColor = 0x999999; break; 
			}
		}
		
		var color = typeof(zoneColor)=="object"?zoneColor:new THREE.Color(zoneColor), geo = new THREE.Geometry();
		
		switch(prop.shape)
		{
			case "polygon":
				var min = [Infinity,Infinity],
					max = [-Infinity,-Infinity];
				for(var i=0;i<prop.points.length;i++)
				{
					var point = prop.points[i];
					//point[0] += (1*prop.x)||0; point[1] += (1*prop.y)||0;
					geo.vertices[i] = new THREE.Vector3(point[0],point[1],0);
					geo.vertices[prop.points.length+i] = new THREE.Vector3(point[0],point[1],zoneHeight);
					
					for(var z=1;z>=0;z--)
					{
						if(point[z] < min[z]) min[z] = point[z];
						if(point[z] > max[z]) max[z] = point[z];
						console.log(point[z]);
					}
					
				}
				for(var i=0,halfvert=(geo.vertices.length/2)-1;i<halfvert;i++)
				{
					var p1x = geo.vertices[i].x, p1y = geo.vertices[i].y;
					var p2x = geo.vertices[i+1].x, p2y = geo.vertices[i+1].y;      

					var dist = Math.sqrt( (p2x-=p1x)*p2x + (p2y-=p1y)*p2y );
					var normal = new THREE.Vector3( (p2y - p1y), -(p2x - p1x), 0 );
					
					geo.faces.push( 
						new THREE.Face3( (i), (i+1), (i+(geo.vertices.length/2)), normal ), //a,b,c
						new THREE.Face3( (i+(geo.vertices.length/2)+1), (i+(geo.vertices.length/2)), (i+1), normal ) //d,c,b 
					);
				}
				
				//prop.x = (max[0]-min[0])/2; prop.y = (max[1]-min[1])/2; 
				//this.radius = (max[0]<max[1]?max[0]:max[1])-(min[0]>min[1]?min[0]:min[1]); 
				this.shape = "polygon";
				break;
			default: //circle
				var zoneSegCoords = [];//get the coordinates for each segment vertex
				var zoneSegMidpoints = [];//get midpoints for each segment
				var trueSegments = [];
				for (var i = 0; i < settings.ZONE_SEGMENTS; i++)
				{
					var zpx = Math.cos(2 * Math.PI * i / settings.ZONE_SEGMENTS);
					var zpy = Math.sin(2 * Math.PI * i / settings.ZONE_SEGMENTS);   
					zoneSegCoords.push({x:zpx, y:zpy});

					if (i > 0 && i != settings.ZONE_SEGMENTS-1) {//all segments starting from the second
						zoneSegMidpoints[i] = { x:((zoneSegCoords[i-1].x+zoneSegCoords[i].x)/2), y:((zoneSegCoords[i-1].y+zoneSegCoords[i].y)/2) };
					}
					else if (i == settings.ZONE_SEGMENTS-1) {//last segment + first
						zoneSegMidpoints[i] = { x:((zoneSegCoords[i-1].x+zoneSegCoords[i].x)/2), y:((zoneSegCoords[i-1].y+zoneSegCoords[i].y)/2) };
						zoneSegMidpoints[0] = { x:((zoneSegCoords[0].x+zoneSegCoords[i].x)/2), y:((zoneSegCoords[0].y+zoneSegCoords[i].y)/2) };
					}
				}
				//with midpoints, determine segments
				for (var s = 0; s < settings.ZONE_SEGMENTS; s++)
				{
					//var segmentFullLength = pointDistance( zoneSegCoords[s].x, zoneSegCoords[s].y, zoneSegCoords[s+1].x, zoneSegCoords[s+1].y );
					//var adjustedSegLength = segmentFullLength * settings.ZONE_SEG_LENGTH;
					if (s == 0) {
						var np1x = (zoneSegMidpoints[0].x + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[zoneSegCoords.length-1].x - zoneSegMidpoints[0].x) ) );
						var np1y = (zoneSegMidpoints[0].y + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[zoneSegCoords.length-1].y - zoneSegMidpoints[0].y) ) );
						var np2x = (zoneSegMidpoints[0].x + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[s].x - zoneSegMidpoints[0].x) ) );
						var np2y = (zoneSegMidpoints[0].y + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[s].y - zoneSegMidpoints[0].y) ) );
					}
					else {
						var np1x = (zoneSegMidpoints[s].x + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[s-1].x - zoneSegMidpoints[s].x) ) );
						var np1y = (zoneSegMidpoints[s].y + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[s-1].y - zoneSegMidpoints[s].y) ) );
						var np2x = (zoneSegMidpoints[s].x + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[s].x - zoneSegMidpoints[s].x) ) );
						var np2y = (zoneSegMidpoints[s].y + (settings.ZONE_SEG_LENGTH * ( zoneSegCoords[s].y - zoneSegMidpoints[s].y) ) );
					}
					
					
					trueSegments[s] = { x1:np1x, y1:np1y, x2:np2x, y2:np2y };
				}
				//have segment coordinates, now build it
				for (var n = 0; n < trueSegments.length; n++) {
					geo.vertices.push( new THREE.Vector3( (trueSegments[n].x1), (trueSegments[n].y1), 0) );
					geo.vertices.push( new THREE.Vector3( (trueSegments[n].x2), (trueSegments[n].y2), 0) );
				}
				for (var n = 0; n < trueSegments.length; n++) {
					geo.vertices.push( new THREE.Vector3( (trueSegments[n].x1), (trueSegments[n].y1), settings.ZONE_HEIGHT) );
					geo.vertices.push( new THREE.Vector3( (trueSegments[n].x2), (trueSegments[n].y2), settings.ZONE_HEIGHT) );
				}
				for (var i = 0; i < (geo.vertices.length/2)-1; i+=2) {
					geo.faces.push( 
						new THREE.Face3( (i), (i+1), (i+(geo.vertices.length/2)) ), //a,b,c
						new THREE.Face3( (i+(geo.vertices.length/2)+1), (i+(geo.vertices.length/2)), (i+1) ) //d,c,b 
					);
				}
				this.shape = "circle";
				break;
		}
		//var alpha = Math.max(color.r,color.g,color.b);
		//color.r /= alpha; color.g /= alpha; color.b /= alpha;
		if(!this.mat)
			this.mat = new THREE.MeshBasicMaterial( { color: color, transparent: settings.ALPHA_BLEND, opacity: settings.ZONE_ALPHA/**alpha*/, side: THREE.DoubleSide } );
		if(!this.mesh)
		{
			this.mesh = new THREE.Mesh(geo,this.mat);
			this.mesh.cfg = this;
		}
		this.mesh.position.set(prop.x||0,prop.y||0,prop.z||0);
		this.mesh.scale.set(this.radius||1,this.radius||1,1);
	}
	netSync()
	{
		if(window.svr)
		{
			var zone = {
				id: engine.zones.children.indexOf(this.mesh),
				x: this.mesh.position.x, y:this.mesh.position.y, z:this.mesh.position.z,
				type:this.type, rotationSpeed:this.rot, value: this.value,
				expansion:this.expansion, radius: this.radius,
				xdir: this.xdir, ydir: this.ydir, bounce: this.bounce,
				team: this.team, color: this.mesh.material.color.getHex(),
				shape: this.shape,
			};
			if(this.shape == "polygon")
			{
				zone.points = [];
				for(var i=geo.faces.length-2;i>=0;i-=2)
				{
					var geo = this.mesh.geometry.clone(); geo.applyMatrix(this.mesh.matrix);
					zone.points.push(geo.vertices[geo.faces[i].b].x,geo.vertices[geo.faces[i].b].y);
				}
			}
			var data = JSON.stringify({type:"zone",data:[zone],gtime:engine.gtime});
			window.svr.clients.forEach(function(ws){ws.send(data)});
		}
		return this;
	}
	distance(position)
	{
		switch(this.shape)
		{
			case "circle":
				return pointDistance(this.mesh.position.x,this.mesh.position.y,position.x,position.y);
				break;
			case "polygon":
				var min = Infinity, x, tmp, coords = this.mesh.geometry.vertices;
				for(var i=(coords.length/2)-1;i>=0;x=(--i)-1)
				{
					if(coords[x] !== undefined)
					{
						tmp = distanceoflines(
							coords[i].x,coords[i].y, coords[x].x,coords[x].y,
							position.x,position.y, position.x,position.y
						);
						if(min > tmp) { min = tmp; }
					}
				}
				return min;
				break;
		}
		return Infinity;
	}
	onEnter(cycle,time)
	{
		switch(this.type)
		{
			case "wall":
				cycle.position.x -= cycle.dir.front[0]*(engine.gtime-time);
				cycle.position.y -= cycle.dir.front[1]*(engine.gtime-time);
				break;
			case "death":
				cycle.kill();
				engine.console.print(cycle.getColoredName()+"0xRESETT exploded on a deathzone.\n");
				break;
			case "win":
				if(engine.winner == undefined && engine.declareRoundWinner == undefined)
				{
					//engine.console.print(cycle.getColoredName()+"0xRESETT ");
					this.expansion = -1;
					engine.declareRoundWinner = cycle.name;
				}
				break;
			case "target":
				loadcfg(settings.DEFAULT_TARGET_COMMAND.replace(/\\n/g,"\n"));
				cycle.addScore(settings.TARGET_INITIAL_SCORE);
				break;
		}
	}
	onInside(cycle,time,timestep)
	{
		switch(this.type)
		{
			case "rubber":
				cycle.rubber += timestep*this.value;
				if(cycle.rubber >= settings.CYCLE_RUBBER)
				{
					cycle.kill();
					engine.console.print(cycle.getColoredName()+"0xRESETT exploded on a rubberzone.\n");
				}
				break;
			case "fortress":
				if(engine.gtime > 0)
				{
					this.rotationSpeed += timestep*settings.FORTRESS_CONQUEST_RATE;
					if(this.rotationSpeed > settings.ZONE_SPIN_SPEED*16)
					{
						engine.console.print(cycle.getColoredName()+"0xRESETT conquered a fortress zone.\n");
						this.type = "null"; this.expansion = -10;
						engine.declareRoundWinner = cycle.name;
					}
				}
				break;
			case "ball": case "soccerball":
				var mindirx=0,mindiry=0,mindist=Infinity,apc=0;
				for(var i=359;i>0;i--) 
				{
					var xdir = Math.cos(Math.PI*2*(i/360)), ydir=Math.sin(Math.PI*2*(i/360));
					var xpos = xdir*this.radius+this.mesh.position.x, ypos=ydir*this.radius+this.mesh.position.y;
					var dist = pointDistance(xpos,ypos,cycle.position.x,cycle.position.y);
					if(dist < mindist)
					{
						/*if(mindist == Infinity)mindist = dist; else mindist += dist;
						mindirx -= xdir; mindiry -= ydir;
						apc++;*/
						mindist=dist;mindirx=xdir;mindiry=ydir;apc=1;
					}
				}
				//mindist /= apc; mindirx /= apc; mindiry /= apc;
				if(mindist != Infinity)
				{
					this.xdir = -mindirx*cycle.speed; this.ydir = -mindiry*cycle.speed;
					if(!this.bounce) this.bounce = true;
					this.lastHitCycle = cycle;
					this.netSync();
				}
				break;
			case "speed":
				cycle.speed = this.value||0;
				break;
			case "acceleration":
				accel = (this.value||0); cycle.accel += accel;
				cycle.speed += cycle.speed*accel;
				break;
		}
	}
	onLeave(cycle,time)
	{
		
	}
	onOutside(cycle,time)
	{
		
	}
}

if(typeof(module) != "undefined") module.exports = Zone;
