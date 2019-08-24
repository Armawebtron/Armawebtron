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

if(typeof(THREE) == "undefined") var THREE = require('./lib/Three.js');

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
		this.type = prop.type;
		this.rotationSpeed = prop.rot||settings.ZONE_SPIN_SPEED;
		this.value = prop.value||0;
		this.expansion = prop.expansion||0;
		this.radius = prop.radius||0;
		this.xdir = prop.xdir||0; this.ydir = prop.ydir||0;
		this.bounce = !!prop.bounce;
		var zoneHeight = prop.height||settings.ZONE_HEIGHT; 
		if (settings.ZONE_SEGMENTS < 1) { settings.ZONE_SEGMENTS = 11; }
		
		var zoneSegments = (Math.floor(this.radius/10)*10)+1;
		if (zoneSegments < 11) { zoneSegments = 11; }
		if(!prop.color && prop.color !== 0)
		{
			var zoneColor = 0xFFFFFF;
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
				case "sumo": zoneColor = 0xFFFFFF; /*zoneHeight = 1;*/ break;
				case "koh": zoneColor = 0xDDDDDD; break;
				case "wall": case "ball": zoneColor = 0xFFFFFF; break;
				case "switch": zoneColor = 0x999999; break; 
			}
		}
		else zoneColor = prop.color;
		
		var color = typeof(zoneColor)=="object"?zoneColor:new THREE.Color(zoneColor);
		
		switch("circle")
		{
			case "circle":
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
				var geo = new THREE.Geometry();
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
				break;
			case "polygon":
				for (var n = 0; n < pointArray.length; n++) {
					var thisPoint = pointArray[n].split(",");
					geo.vertices.push( new THREE.Vector3( (thisPoint[0]), (thisPoint[1]), 0) );
				}
				for (var m = 0; m < pointArray.length; m++) {
					var thisPoint = pointArray[m].split(",");
					geo.vertices.push( new THREE.Vector3( (thisPoint[0]), (thisPoint[1]), height) );
				}
				break;
		}
		//var alpha = Math.max(color.r,color.g,color.b);
		//color.r /= alpha; color.g /= alpha; color.b /= alpha;
		this.mat = new THREE.MeshBasicMaterial( { color: color, transparent: settings.ALPHA_BLEND, opacity: settings.ZONE_ALPHA/**alpha*/, side: THREE.DoubleSide } );
		this.mesh = new THREE.Mesh(geo,this.mat);
		this.mesh.position.set(prop.x||0,prop.y||0,prop.z||0);
		this.mesh.scale.set(this.radius,this.radius,1);
		this.mesh.cfg = this;
	}
}

if(typeof(module) != "undefined") module.exports = Zone;
