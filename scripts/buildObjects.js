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


//TODO: neaten up this file, make it so the map isn't parsed a bunch of times
//TODO: use an object for the cycles?
//lots of Durf code around these parts...

//NOTE: these functions depend on the presence of mapSTRING and/or mapXML
//RETURNS: scene mesh/object to add into global object

function loadTextures()
{
	engine.textures.floor = new new THREE.TextureLoader().load(relPath(settings.FLOOR_TEXTURE,"images"));
	engine.textures.rim_wall = new new THREE.TextureLoader().load(relPath(settings.RIM_WALL_TEXTURE,"images"));
	//engine.textures.cycle_wall = new new THREE.TextureLoader().load('images/textures/dir_wall.png');
	engine.textures.cycle_body = new THREE.TextureLoader().load(relPath(settings.CYCLE_TEXTURES[0],"images"));
	engine.textures.cycle_wheel = new THREE.TextureLoader().load(relPath(settings.CYCLE_TEXTURES[1],"images"))
	engine.textures.cycle_shadow = new THREE.TextureLoader().load('images/textures/shadow.png')
}

//GRID
function buildGrid()
{
	//floor texture stuff
	engine.grid = new THREE.Object3D();//initialize global object

	var sizeFactorHandle = settings.SIZE_FACTOR / 2;
	engine.REAL_ARENA_SIZE_FACTOR = Math.pow(2, sizeFactorHandle);

	var logicalBox = getLogicalBox(engine.mapString);// x, y, minx, miny, maxx, maxy
	engine.logicalBox = {
		center: { x:logicalBox[0], y: logicalBox[1]},
		min: { x:logicalBox[2], y: logicalBox[3]},
		max: { x:logicalBox[4], y: logicalBox[5]}
	};
	var logicalHeight = ((logicalBox[5]-logicalBox[3]) * engine.REAL_ARENA_SIZE_FACTOR)/* + 10*/;//+10 for outer edge
	var logicalWidth = ((logicalBox[4]-logicalBox[2]) * engine.REAL_ARENA_SIZE_FACTOR)/* + 10*/;
	
	var grid_object;
	if(!engine.dedicated && settings.FLOOR_DETAIL > 0)
	{
		if(settings.FLOOR_DETAIL == 1)
		{
			var minX = engine.logicalBox.min.x*engine.REAL_ARENA_SIZE_FACTOR, minY = engine.logicalBox.min.y*engine.REAL_ARENA_SIZE_FACTOR;
			var maxX = engine.logicalBox.max.x*engine.REAL_ARENA_SIZE_FACTOR, maxY = engine.logicalBox.max.y*engine.REAL_ARENA_SIZE_FACTOR;
			var geometry = new THREE.Geometry();
			for(var y=minY;y<maxY;y+=settings.GRID_SIZE)
			{
				geometry.vertices.push(new THREE.Vector3(minX,y,0));
				geometry.vertices.push(new THREE.Vector3(maxX,y,0));
				geometry.vertices.push(new THREE.Vector3(minX,y,0));
			}
			for(var x=minX;x<maxX;x+=settings.GRID_SIZE)
			{
				geometry.vertices.push(new THREE.Vector3(x,minY,0));
				geometry.vertices.push(new THREE.Vector3(x,maxY,0));
				geometry.vertices.push(new THREE.Vector3(x,minY,0));
			}
			var color = new THREE.Color(settings.FLOOR_RED,settings.FLOOR_GREEN,settings.FLOOR_BLUE);
			grid_object = new THREE.Line(geometry,new THREE.LineBasicMaterial({color:color,transparent:false}));
		}
		else
		{
			var floorTexture = engine.textures.floor;
			floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
			floorTexture.repeat.set(logicalWidth,logicalHeight);	//floorTexture.repeat.set( 500, 500 );

			var centerOffset_x = (logicalBox[2] * engine.REAL_ARENA_SIZE_FACTOR);//offset from bottom left corner
			var centerOffset_x2 = Math.round((centerOffset_x % 1)*100000000)/100000000;
			floorTexture.offset.x = centerOffset_x2;  
			
			var centerOffset_y = (logicalBox[3] * engine.REAL_ARENA_SIZE_FACTOR);//-5;//not needed since we only take %1 offset
			var centerOffset_y2 = Math.round((centerOffset_y % 1)*100000000)/100000000;
			
			floorTexture.offset.y = centerOffset_y2; 


			if(settings.FLOOR_DETAIL > 2)
			{
				var maxAnisotropy = engine.renderer.capabilities.getMaxAnisotropy();
				floorTexture.anisotropy = maxAnisotropy;
			}
			
			var color = new THREE.Color(settings.FLOOR_RED,settings.FLOOR_GREEN,settings.FLOOR_BLUE);
			var floorMaterial = new THREE.MeshBasicMaterial( { color:color, map: floorTexture,/* transparent: settings.ALPHA_BLEND /*, side: THREE.DoubleSide*/} );

			
			floorMaterial.needsUpdate = true;//is this needed?
			var floorGeometry = new THREE.PlaneBufferGeometry(logicalWidth*settings.GRID_SIZE,logicalHeight*settings.GRID_SIZE,1,1);
			floorGeometry.dynamic = true;//is this needed?
			grid_object = new THREE.Mesh(floorGeometry, floorMaterial);
			grid_object.position.x = logicalBox[0] * engine.REAL_ARENA_SIZE_FACTOR;
			grid_object.position.y = logicalBox[1] * engine.REAL_ARENA_SIZE_FACTOR;
			//grid_object.scale.set(settings.GRID_SIZE,settings.GRID_SIZE,1);
			//console.log("gridx: "+grid_object.position.x+"  gridy: "+grid_object.position.y);
			grid_object.geometry.dynamic = true;//is this needed?
			
			if(settings.FLOOR_MIRROR)
			{
				engine.grid.mirror = grid_object.clone();
				engine.grid.mirror.position.z -= 1/100;
				engine.grid.reflection = new THREE.CubeCamera(0.01,100000,128);
				engine.scene.add(engine.grid.reflection);
				floorMaterial.envMap = engine.grid.reflection.renderTarget;
				engine.grid.reflection.position.copy(grid_object.position);
				//engine.grid.reflection.position.z = -250;
			}
		}
		grid_object.position.z = -2/100;//move down 2/100 units for render glitch
	}
	
//	return grid_object;
	if(grid_object) engine.grid.add(grid_object);//add to global object
	

	//SPAWNS add to map data
	var allSpawns = engine.mapXML.getElementsByTagName("Spawn");
	for (s = 0; s < allSpawns.length; s++)
	{ 
		var sXpos = (allSpawns[s].getAttribute("x") * engine.REAL_ARENA_SIZE_FACTOR);
		var sYpos = (allSpawns[s].getAttribute("y") * engine.REAL_ARENA_SIZE_FACTOR);
		var sZpos = (allSpawns[s].getAttribute("z") * 1);
		if(isNaN(sZpos)) sZpos = 0;
		if ( allSpawns[s].hasAttribute("angle") ) { var sAng = allSpawns[s].getAttribute("angle"); }
		else { var sAng = gafd( parseFloat(allSpawns[s].getAttribute("xdir")), parseFloat(allSpawns[s].getAttribute("ydir")) ); }
		var spawn_data = [sXpos, sYpos, sZpos, sAng];
		engine.map.spawns.push( spawn_data );
	}

}//end of grid



///////////////////////////////
//WALLS
function buildWalls() {//builds all walls in map and returns object to add to scene
engine.walls = new THREE.Object3D();
	var allWalls = engine.mapXML.getElementsByTagName("Wall");
	for (var r = 0; r < allWalls.length; r++) {
		var wall_points = new Array();
		if(settings.HIGH_RIM)
			var wall_height = settings.HIGH_RIM_HEIGHT;
		else
			var wall_height = settings.LOW_RIM_HEIGHT; //4
		if (allWalls[r].hasAttribute("height")) { wall_height = allWalls[r].getAttribute("height")*1; }
		var allWallPoints = allWalls[r].getElementsByTagName("Point");
		for (var q = 0; q < allWallPoints.length; q++)
		{
			wall_points.push(
				[
					allWallPoints[q].getAttribute("x") * engine.REAL_ARENA_SIZE_FACTOR, 
					allWallPoints[q].getAttribute("y") * engine.REAL_ARENA_SIZE_FACTOR,
					0, //wall_bottom
					wall_height
				]
			);
		}
		wall_object = buildWall(wall_points, wall_height);
		//wall_object.receiveShadow = true;
		//wall_object.castShadow = true;
		engine.walls.add(wall_object);//add complete object to global walls
		
		engine.map.walls.push(wall_points);//add to map data
	}

}

//this is for buildWalls - builds a single wall out of many
var totalWallsLength = 0;//used to line textures like arma does
function buildWall(pointArray, height) {//builds a single <Wall> tag
	if(!settings.RIM_WALL_REPEAT_TOP && height > settings.RIM_WALL_STRETCH_Y) height = settings.RIM_WALL_STRETCH_Y;
	var geo = new THREE.Geometry();
	for (var n = 0; n < pointArray.length; n++) {
		var thisPoint = pointArray[n];
		geo.vertices.push( new THREE.Vector3( (thisPoint[0]), (thisPoint[1]), 0) );
	}
	for (var m = 0; m < pointArray.length; m++) {
		var thisPoint = pointArray[m];
		geo.vertices.push( new THREE.Vector3( (thisPoint[0]), (thisPoint[1]), height) );
	}
	var totalLength = 0;
	for (var i = 0; i < (geo.vertices.length/2)-1; i++) {

		var p1x = geo.vertices[i].x; var p1y = geo.vertices[i].y;
      var p2x = geo.vertices[i+1].x; var p2y = geo.vertices[i+1].y;      

		var dist = Math.sqrt( (p2x-=p1x)*p2x + (p2y-=p1y)*p2y );
		totalLength += dist;
		totalWallsLength += dist;
//		console.log(totalLength);
//      var slope = ( (py2 - py1) / (px2 - px1) );
//      var invslope = -( (px2 - px1) / (py2 - py1) );
		var normal = new THREE.Vector3( (p2y - p1y), -(p2x - p1x), 0 );
// c       d
// a       b
		geo.faces.push( 
			new THREE.Face3( (i), (i+1), (i+(geo.vertices.length/2)), normal ), //a,b,c
			new THREE.Face3( (i+(geo.vertices.length/2)+1), (i+(geo.vertices.length/2)), (i+1), normal ) //d,c,b 
		);
		geo.faceVertexUvs[0].push(
		[new THREE.Vector2((totalWallsLength-dist),0),new THREE.Vector2((totalWallsLength),0),new THREE.Vector2((totalWallsLength-dist),1)], //a,b,c
		[new THREE.Vector2((totalWallsLength),1),new THREE.Vector2((totalWallsLength-dist),1),new THREE.Vector2((totalWallsLength),0)] //d,c,b
		);
		
	}
	
	if(!engine.dedicated)
	{
		geo.uvsNeedUpdate = true;
		geo.buffersNeedUpdate = true; //apparently isn't needed for desired effect
		geo.computeFaceNormals();//for lighting
		geo.computeVertexNormals();//for lighting?

		if(settings.RIM_WALL_TEXTURE != "") 
		{
			var wallTexture = engine.textures.rim_wall;
			wallTexture.wrapS = THREE.RepeatWrapping;
			if(settings.RIM_WALL_WRAP_Y) wallTexture.wrapT = THREE.RepeatWrapping;
			wallTexture.repeat.set(1/settings.RIM_WALL_STRETCH_X,height/settings.RIM_WALL_STRETCH_Y);	//totalLength, height
		}

		if(engine.usingWebgl) 
		{
			var maxAnisotropy = engine.renderer.getMaxAnisotropy();
			wallTexture.anisotropy = maxAnisotropy;
		}
		
		var wallIsTooLow = height<settings.RIM_WALL_LOWEST_HEIGHT;
		
		var wallmat = new (settings.RIM_WALL_DEPTH?THREE.MeshLambertMaterial:THREE.MeshBasicMaterial)({ 
			map: wallIsTooLow?null:(wallTexture==""?null:wallTexture),
			transparent:settings.ALPHA_BLEND,opacity:settings.RIM_WALL_ALPHA,
			color: wallIsTooLow?
				new THREE.Color(settings.RIM_WALL_BELOW_HEIGHT_COLOR_R,settings.RIM_WALL_BELOW_HEIGHT_COLOR_G,settings.RIM_WALL_BELOW_HEIGHT_COLOR_B)
				:
				new THREE.Color(settings.RIM_WALL_RED,settings.RIM_WALL_GREEN,settings.RIM_WALL_BLUE),
			side: THREE.DoubleSide, flatShading: true 
		});

	//	var wallmat = new THREE.MeshLambertMaterial({ color: 0x404040, side: THREE.DoubleSide, shading: THREE.FlatShading});    
	//use this material for better fps - textures OFF

		var thewall = new THREE.Mesh( geo, wallmat );
		return thewall;
	}
}


/////////////////////////////
//ZONES
function buildZones()
{
	engine.zones = new THREE.Object3D();
	var mapsZones = engine.mapXML.getElementsByTagName("Zone");
	console.log("NUM ZONES = "+mapsZones.length);
	for (var p = 0; p < mapsZones.length; p++)
	{
		var zone = {};
		if(mapsZones[p].hasAttribute("effect")) { zone.type = mapsZones[p].getAttribute("effect"); }
		var point = mapsZones[p].getElementsByTagName("Point");
		zone.x = (point[0].getAttribute("x") * engine.REAL_ARENA_SIZE_FACTOR);
		zone.y = (point[0].getAttribute("y") * engine.REAL_ARENA_SIZE_FACTOR);
		var shape = mapsZones[p].getElementsByTagName("ShapeCircle");
		if(shape.length == 0)
		{
			var shape = mapsZones[p].getElementsByTagName("ShapePolygon");
			if(shape.length > 0)
			{
				zone.shape = "polygon"; zone.points = [];
				for(var i=1;i<point.length;i++)
				{
					zone.points.push([point[i].attributes.x.value*1,point[i].attributes.y.value*1]);
				}
			}
			else
			{
				console.error("Invalid or no zone shape specified");
			}
		}
		
		if(shape.length > 0)
		{
			if(shape[0].attributes.radius)
			{
				zone.radius = (shape[0].getAttribute("radius") * engine.REAL_ARENA_SIZE_FACTOR);
			}
			else
			{
				zone.radius = engine.REAL_ARENA_SIZE_FACTOR;
			}
			zone.expansion = shape[0].getAttribute("growth")*1;
			
			if(shape[0].attributes.rotation)
			{
				var s = shape[0].attributes.rotation.value.split(";");
				zone.rot = s[1];
			}
			
			var colorelement = mapsZones[p].getElementsByTagName("Color")[0];
			if(colorelement)
			{
				if(colorelement.attributes.hexCode) // +ap compatibility
				{
					zone.color = 1*(colorelement.getAttribute("hexCode"));
				}
				else if(colorelement.attributes.r || colorelement.attributes.g || colorelement.attributes.b) // +ap compatibility
				{
					zone.color = new THREE.Color(colorelement.getAttribute("r")/15,colorelement.getAttribute("g")/15,colorelement.getAttribute("b")/15);
				}
				else if(colorelement.attributes.red || colorelement.attributes.green || colorelement.attributes.blue) //0.4 compatibility
				{
					var r=colorelement.getAttribute("red"),g=colorelement.getAttribute("green"),b=colorelement.getAttribute("blue");
					var a = colorelement.attributes.alpha?colorelement.getAttribute("alpha"):1;
					zone.color = new THREE.Color(r,g,b);
					
				}
			}
			
			var delay = mapsZones[p].attributes.delay?mapsZones[p].getAttribute("delay"):0;
			
			switch(zone.type)
			{
				case "rubber":
					zone.value = mapsZones[p].getAttribute("rubberVal");
					break;
				case "speed": case "acceleration":
					zone.value = mapsZones[p].getAttribute("speed");
					break;
			}
			
			/*zone_object = createZone(zonesType,zonesXpos,zonesYpos,zonesRadius,color);
			var zone_data = [zonesType, zonesXpos, zonesYpos, zonesRadius, zonesExpansion, value,0,0,false];
			engine.map.zones.push(zone_data);
			console.log("ZONE ADDED: "+zonesType);
			engine.zones.add(zone_object);*/
			new Zone(zone).spawn();
		}
		else
		{
			console.log("Zone skipped");
		}
	}
	//for (var z = 0; z < engine.a_zone.length; z++) { all_zones.add( a_zone[z] ); }

}

var zSpawn = function() 
{ 
	engine.zones.add(this);
	engine.map.zones.push([this.type,this.x,this.y,this.radius,this.expansion,this.value,this.xdir,this.ydir,this.bounce]); //DEPRECATED
};

function llll(zone)
{
	
}




/////////////////////////////
//CYCLE (TODO:split into cycle model chooser file)

var cycleModel = function(colorCode) {//builds a single cycle
	var model = new THREE.Object3D();

	if(!engine.dedicated)
	{
		var geo_body = new THREE.Geometry();
		var geo_front = new THREE.Geometry();
		var geo_back = new THREE.Geometry();
		/*____________armagetron cycle______________*/
		geo_body.vertices.push( 
			new THREE.Vector3(  0.787148,	 0.394117,	0.964472),
			new THREE.Vector3(  1.982280,	 0.145382,	1.00079),
			new THREE.Vector3(  1.685360,	 0.169418,	1.21508),
			new THREE.Vector3(  1.179990,	 0.197158,	1.43881),
			new THREE.Vector3(  0.586153,	 0.197158,	1.54688),
			new THREE.Vector3( -0.340365,	 0.164937,	1.54215),
			new THREE.Vector3( -0.476320,	 0.145253,	1.44595),
			new THREE.Vector3( -0.508108,	 0.135410,	1.30398),
			new THREE.Vector3(  0.531900,	 0.197158,	0.234183),
			new THREE.Vector3(  1.482190,	 0.197158,	0.232375),
			new THREE.Vector3(  2.049060,	 0.141480,	0.847465),
			new THREE.Vector3(  1.982280,	-0.143510,	1.00079),
			new THREE.Vector3(  1.685360,	-0.171200,	1.21508),
			new THREE.Vector3(  1.179990,	-0.199500,	1.43881),
			new THREE.Vector3(  0.586153,	-0.199500,	1.54688),
			new THREE.Vector3( -0.340450,	-0.168183,	1.54215),
			new THREE.Vector3( -0.476405,	-0.138655,	1.44595),
			new THREE.Vector3( -0.508192,	-0.128813,	1.30398),
			new THREE.Vector3(  0.531900,	-0.199500,	0.234183),
			new THREE.Vector3(  1.482190,	-0.199500,	0.232375),
			new THREE.Vector3(  2.046890,	-0.134012,	0.847465),
			new THREE.Vector3(  0.785515,	-0.393152,	0.964472) 
		);

	//minx = -0.508192
	//maxx =  2.049060
	//miny = -0.393152
	//maxy =  0.394117
	//minz =  0.232375
	//maxz =  1.54688

	//0 , 0  -  1 , 1
	//-0.508192 , 0.232375
	//2.049060 , 1.54688


	//x & z
	var bodyrangex = (-0.508192 - 2.049060) * -1; 	//range = (lowest - highest) * -1
	var bodyoffsetx = 0 - -0.508192;						//offset = 0 - lowest
	var bodyrangez = (0.232375 - 1.54688) * -1;
	var bodyoffsetz = 0 - 0.232375;

		geo_body.faces.push( 
			new THREE.Face3( 0, 2, 1 ),
			new THREE.Face3( 0, 3, 2 ),
			new THREE.Face3( 0, 4, 3 ),
			new THREE.Face3( 0, 5, 4 ),
			new THREE.Face3( 0, 6, 5 ),
			new THREE.Face3( 0, 7, 6 ),
			new THREE.Face3( 0, 8, 7 ),
			new THREE.Face3( 0, 9, 8 ),
			new THREE.Face3( 0, 10, 9 ),
			new THREE.Face3( 0, 1, 10 ),
			new THREE.Face3( 1, 12, 11 ),
			new THREE.Face3( 1, 2, 12 ),
			new THREE.Face3( 2, 13, 12 ),
			new THREE.Face3( 2, 3, 13 ),
			new THREE.Face3( 3, 14, 13 ),
			new THREE.Face3( 3, 4, 14 ),
			new THREE.Face3( 4, 15, 14 ),
			new THREE.Face3( 4, 5, 15 ),
			new THREE.Face3( 5, 16, 15 ),
			new THREE.Face3( 5, 6, 16 ),
			new THREE.Face3( 6, 17, 16 ),
			new THREE.Face3( 6, 7, 17 ),
			new THREE.Face3( 7, 18, 17 ),
			new THREE.Face3( 7, 8, 18 ),
			new THREE.Face3( 8, 19, 18 ),
			new THREE.Face3( 8, 9, 19 ),
			new THREE.Face3( 9, 20, 19 ),
			new THREE.Face3( 9, 10, 20 ),
			new THREE.Face3( 10, 11, 20 ),
			new THREE.Face3( 10, 1, 11 ),
			new THREE.Face3( 21, 11, 12 ),
			new THREE.Face3( 21, 12, 13 ),
			new THREE.Face3( 21, 13, 14 ),
			new THREE.Face3( 21, 14, 15 ),
			new THREE.Face3( 21, 15, 16 ),
			new THREE.Face3( 21, 16, 17 ),
			new THREE.Face3( 21, 17, 18 ),
			new THREE.Face3( 21, 18, 19 ),
			new THREE.Face3( 21, 19, 20 ),
			new THREE.Face3( 21, 20, 11 )
		);

		geo_body.faceVertexUvs[0].push(
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[2].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[2].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[1].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[1].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[3].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[3].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[2].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[2].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[4].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[4].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[3].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[3].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[5].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[5].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[4].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[4].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[6].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[6].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[5].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[5].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[7].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[7].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[6].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[6].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[8].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[8].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[7].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[7].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[9].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[9].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[8].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[8].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[10].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[10].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[9].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[9].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[0].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[0].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[1].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[1].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[10].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[10].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[1].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[1].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[12].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[12].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[11].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[11].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[1].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[1].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[2].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[2].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[12].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[12].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[2].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[2].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[13].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[13].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[12].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[12].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[2].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[2].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[3].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[3].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[13].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[13].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[3].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[3].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[14].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[14].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[13].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[13].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[3].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[3].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[4].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[4].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[14].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[14].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[4].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[4].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[15].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[15].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[14].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[14].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[4].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[4].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[5].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[5].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[15].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[15].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[5].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[5].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[16].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[16].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[15].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[15].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[5].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[5].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[6].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[6].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[16].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[16].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[6].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[6].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[17].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[17].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[16].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[16].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[6].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[6].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[7].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[7].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[17].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[17].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[7].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[7].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[18].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[18].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[17].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[17].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[7].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[7].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[8].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[8].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[18].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[18].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[8].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[8].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[19].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[19].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[18].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[18].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[8].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[8].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[9].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[9].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[19].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[19].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[9].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[9].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[20].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[20].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[19].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[19].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[9].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[9].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[10].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[10].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[20].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[20].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[10].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[10].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[11].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[11].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[20].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[20].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[10].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[10].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[1].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[1].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[11].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[11].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[11].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[11].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[12].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[12].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[12].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[12].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[13].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[13].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[13].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[13].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[14].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[14].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[14].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[14].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[15].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[15].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[15].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[15].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[16].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[16].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[16].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[16].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[17].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[17].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[17].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[17].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[18].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[18].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[18].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[18].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[19].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[19].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[19].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[19].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[20].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[20].z + bodyoffsetz) / bodyrangez))
			],
			[
				new THREE.Vector2( ((geo_body.vertices[21].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[21].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[20].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[20].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo_body.vertices[11].x + bodyoffsetx) / bodyrangex ), ((geo_body.vertices[11].z + bodyoffsetz) / bodyrangez))
			]
		);

		geo_front.vertices.push( 
			new THREE.Vector3( -0.439773,	 0.00019,	 0				),
			new THREE.Vector3( -0.355783,	 0.00019,	 0.258492	),
			new THREE.Vector3( -0.135898,	 0.00019,	 0.418248	),
			new THREE.Vector3(  0.135898,	 0.00019,	 0.418248	),
			new THREE.Vector3(  0.355783,	 0.00019,	 0.258492	),
			new THREE.Vector3(  0.439770,	 0.00019,	 0				),
			new THREE.Vector3(  0.355783,	 0.00019,	-0.25849		),
			new THREE.Vector3(  0.135898,	 0.00019,	-0.418248	),
			new THREE.Vector3( -0.135898,	 0.00019,	-0.418248	),
			new THREE.Vector3( -0.355783,	 0.00019,	-0.25849		),
			new THREE.Vector3( -0.336475,	 0.29717,	 0				),
			new THREE.Vector3( -0.272215,	 0.29717,	 0.197775	),
			new THREE.Vector3( -0.103978,	 0.29717,	 0.320007	),
			new THREE.Vector3(  0.103975,	 0.29717,	 0.320007	),
			new THREE.Vector3(  0.272213,	 0.29717,	 0.197775	),
			new THREE.Vector3(  0.336475,	 0.29717,	 0				),
			new THREE.Vector3(  0.272213,	 0.29717,	-0.197775	),
			new THREE.Vector3(  0.103975,	 0.29717,	-0.320005	),
			new THREE.Vector3( -0.103978,	 0.29717,	-0.320005	),
			new THREE.Vector3( -0.272215,	 0.29717,	-0.197775	),
			new THREE.Vector3(  0.000000,	 0.29717,	 0				),
			new THREE.Vector3( -0.336475,	-0.29679,	 0				),
			new THREE.Vector3( -0.272215,	-0.29679,	 0.197775	),
			new THREE.Vector3( -0.103978,	-0.29679,	 0.320007	),
			new THREE.Vector3(  0.103975,	-0.29679,	 0.320007	),
			new THREE.Vector3(  0.272213,	-0.29679,	 0.197775	),
			new THREE.Vector3(  0.336475,	-0.29679,	 0				),
			new THREE.Vector3(  0.272213,	-0.29679,	-0.197775	),
			new THREE.Vector3(  0.103975,	-0.29679,	-0.320005	),
			new THREE.Vector3( -0.103978,	-0.29679,	-0.320005	),
			new THREE.Vector3( -0.272215,	-0.29679,	-0.197775	),
			new THREE.Vector3(  0.000000,	-0.29679,	 0				)
		);

	//x & z
	var frontrangex = (-0.439773 - 0.439770) * -1; 	//range = (lowest - highest) * -1
	var frontoffsetx = 0 - -0.439773;						//offset = 0 - lowest
	var frontrangez = (-0.418248 - 0.418248) * -1;
	var frontoffsetz = 0 - -0.418248;


		geo_front.faces.push( 
			new THREE.Face3( 	 0,	11,	10	),
			new THREE.Face3( 	 0,	 1,	11	),
			new THREE.Face3( 	 1,	12,	11	),
			new THREE.Face3( 	 1,	 2,	12	),
			new THREE.Face3( 	 2,	13,	12	),
			new THREE.Face3( 	 2,	 3,	13	),
			new THREE.Face3( 	 3,	14,	13	),
			new THREE.Face3( 	 3,	 4,	14	),
			new THREE.Face3( 	 4,	15,	14	),
			new THREE.Face3( 	 4,	 5,	15	),
			new THREE.Face3( 	 5,	16,	15	),
			new THREE.Face3( 	 5,	 6,	16	),
			new THREE.Face3( 	 6,	17,	16	),
			new THREE.Face3( 	 6,	 7,	17	),
			new THREE.Face3( 	 7,	18,	17	),
			new THREE.Face3( 	 7,	 8,	18	),
			new THREE.Face3( 	 8,	19,	18	),
			new THREE.Face3( 	 8,	 9,	19	),
			new THREE.Face3( 	 9,	10,	19	),
			new THREE.Face3( 	 9,	 0,	10	),
			new THREE.Face3( 	20,	10,	11	),
			new THREE.Face3( 	20,	11,	12	),
			new THREE.Face3( 	20,	12,	13	),
			new THREE.Face3( 	20,	13,	14	),
			new THREE.Face3( 	20,	14,	15	),
			new THREE.Face3( 	20,	15,	16	),
			new THREE.Face3( 	20,	16,	17	),
			new THREE.Face3( 	20,	17,	18	),
			new THREE.Face3( 	20,	18,	19	),
			new THREE.Face3( 	20,	19,	10	),
			new THREE.Face3( 	21,	22,	0	),
			new THREE.Face3( 	22,	 1,	0	),
			new THREE.Face3( 	22,	23,	1	),
			new THREE.Face3( 	23,	 2,	1	),
			new THREE.Face3( 	23,	24,	2	),
			new THREE.Face3( 	24,	 3,	2	),
			new THREE.Face3( 	24,	25,	3	),
			new THREE.Face3( 	25,	 4,	3	),
			new THREE.Face3( 	25,	26,	4	),
			new THREE.Face3( 	26,	 5,	4	),
			new THREE.Face3( 	26,	27,	5	),
			new THREE.Face3( 	27,	 6,	5	),
			new THREE.Face3( 	27,	28,	6	),
			new THREE.Face3( 	28,	 7,	6	),
			new THREE.Face3( 	28,	29,	7	),
			new THREE.Face3( 	29,	 8,	7	),
			new THREE.Face3( 	29,	30,	8	),
			new THREE.Face3( 	30,	 9,	8	),
			new THREE.Face3( 	30,	21,	9	),
			new THREE.Face3( 	21,	 0,	9	),
			new THREE.Face3( 	22,	21,	31	),
			new THREE.Face3( 	23,	22,	31	),
			new THREE.Face3( 	24,	23,	31	),
			new THREE.Face3( 	25,	24,	31	),
			new THREE.Face3( 	26,	25,	31	),
			new THREE.Face3( 	27,	26,	31	),
			new THREE.Face3( 	28,	27,	31	),
			new THREE.Face3( 	29,	28,	31	),
			new THREE.Face3( 	30,	29,	31	),
			new THREE.Face3( 	21,	30,	31	)
		);
		
		geo_front.faceVertexUvs[0].push(
			[
				new THREE.Vector2( ((geo_front.vertices[0].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[0].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[11].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[11].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[10].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[10].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[0].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[0].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[1].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[1].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[11].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[11].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[1].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[1].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[12].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[12].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[11].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[11].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[1].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[1].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[2].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[2].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[12].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[12].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[2].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[2].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[13].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[13].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[12].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[12].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[2].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[2].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[3].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[3].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[13].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[13].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[3].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[3].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[14].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[14].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[13].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[13].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[3].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[3].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[4].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[4].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[14].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[14].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[4].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[4].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[15].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[15].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[14].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[14].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[4].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[4].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[5].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[5].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[15].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[15].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[5].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[5].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[16].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[16].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[15].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[15].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[5].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[5].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[6].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[6].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[16].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[16].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[6].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[6].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[17].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[17].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[16].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[16].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[6].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[6].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[7].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[7].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[17].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[17].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[7].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[7].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[18].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[18].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[17].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[17].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[7].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[7].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[8].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[8].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[18].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[18].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[8].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[8].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[19].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[19].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[18].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[18].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[8].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[8].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[9].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[9].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[19].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[19].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[9].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[9].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[10].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[10].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[19].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[19].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[9].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[9].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[0].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[0].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[10].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[10].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[10].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[10].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[11].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[11].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[11].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[11].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[12].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[12].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[12].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[12].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[13].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[13].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[13].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[13].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[14].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[14].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[14].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[14].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[15].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[15].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[15].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[15].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[16].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[16].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[16].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[16].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[17].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[17].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[17].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[17].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[18].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[18].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[18].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[18].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[19].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[19].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[20].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[20].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[19].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[19].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[10].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[10].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[21].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[21].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[22].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[22].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[0].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[0].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[22].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[22].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[1].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[1].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[0].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[0].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[22].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[22].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[23].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[23].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[1].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[1].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[23].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[23].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[2].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[2].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[1].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[1].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[23].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[23].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[24].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[24].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[2].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[2].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[24].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[24].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[3].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[3].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[2].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[2].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[24].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[24].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[25].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[25].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[3].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[3].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[25].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[25].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[4].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[4].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[3].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[3].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[25].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[25].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[26].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[26].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[4].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[4].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[26].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[26].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[5].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[5].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[4].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[4].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[26].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[26].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[27].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[27].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[5].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[5].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[27].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[27].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[6].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[6].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[5].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[5].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[27].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[27].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[28].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[28].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[6].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[6].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[28].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[28].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[7].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[7].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[6].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[6].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[28].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[28].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[29].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[29].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[7].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[7].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[29].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[29].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[8].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[8].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[7].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[7].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[29].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[29].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[30].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[30].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[8].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[8].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[30].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[30].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[9].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[9].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[8].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[8].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[30].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[30].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[21].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[21].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[9].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[9].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[21].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[21].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[0].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[0].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[9].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[9].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[22].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[22].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[21].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[21].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[23].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[23].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[22].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[22].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[24].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[24].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[23].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[23].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[25].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[25].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[24].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[24].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[26].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[26].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[25].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[25].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[27].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[27].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[26].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[26].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[28].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[28].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[27].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[27].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[29].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[29].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[28].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[28].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[30].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[30].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[29].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[29].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			],
			[
				new THREE.Vector2( ((geo_front.vertices[21].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[21].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[30].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[30].z + frontoffsetz) / frontrangez)),
				new THREE.Vector2( ((geo_front.vertices[31].x + frontoffsetx) / frontrangex ), ((geo_front.vertices[31].z + frontoffsetz) / frontrangez))
			]
		);

		geo_back.vertices.push( 
			new THREE.Vector3( 	0.0004475,		0.00019,		0.0002975	),
			new THREE.Vector3(  -0.7435,			0.00019,		0.0002975	),
			new THREE.Vector3(  -0.601417,		0.00019,		0.43758	),
			new THREE.Vector3(  -0.229445,		0.00019,		0.707835	),
			new THREE.Vector3( 	0.230340,		0.00019,		0.707835	),
			new THREE.Vector3( 	0.602315,		0.00019,		0.43758	),
			new THREE.Vector3( 	0.744397,		0.00019,		0.0002975	),
			new THREE.Vector3( 	0.602315,		0.00019,		-0.436985	),
			new THREE.Vector3( 	0.23034,			0.00019,		-0.70724	),
			new THREE.Vector3(  -0.229445,		0.00019,		-0.70724	),
			new THREE.Vector3(  -0.601417,		0.00019,		-0.436985	),
			new THREE.Vector3(  -0.568755,		0.29717,		0.0002975	),
			new THREE.Vector3(  -0.460047,		0.29717,		0.334868	),
			new THREE.Vector3(  -0.175445,		0.29717,		0.541643	),
			new THREE.Vector3( 	0.176342,		0.29717,		0.541643	),
			new THREE.Vector3( 	0.460945,		0.29717,		0.334868	),
			new THREE.Vector3( 	0.569653,		0.29717,		0.0002975	),
			new THREE.Vector3( 	0.460945,		0.29717,		-0.334273	),
			new THREE.Vector3( 	0.176342,		0.29717,		-0.541047	),
			new THREE.Vector3(  -0.175445,		0.29717,		-0.541047	),
			new THREE.Vector3(  -0.460047,		0.29717,		-0.334273	),
			new THREE.Vector3( 	0.0004475,		0.29717,		0.0002975	),
			new THREE.Vector3(  -0.568755,		-0.29679,		0.0002975	),
			new THREE.Vector3(  -0.460047,		-0.29679,		0.334868	),
			new THREE.Vector3(  -0.175445,		-0.29679,		0.541643	),
			new THREE.Vector3( 	0.176342,		-0.29679,		0.541643	),
			new THREE.Vector3( 	0.460945,		-0.29679,		0.334868	),
			new THREE.Vector3( 	0.569653,		-0.29679,		0.0002975	),
			new THREE.Vector3( 	0.460945,		-0.29679,		-0.334273	),
			new THREE.Vector3( 	0.176342,		-0.29679,		-0.541047	),
			new THREE.Vector3(  -0.175445,		-0.29679,		-0.541047	),
			new THREE.Vector3(  -0.460047,		-0.29679,		-0.334273	),
			new THREE.Vector3( 	0.0004475,		-0.29679,		0.0002975	)
		);

	//x & z
	var backrangex = (-0.7435 - 0.744397) * -1; 	//range = (lowest - highest) * -1
	var backoffsetx = 0 - -0.7435;						//offset = 0 - lowest
	var backrangez = (-0.70724 - 0.707835) * -1;
	var backoffsetz = 0 - -0.70724;

		geo_back.faces.push( 
			new THREE.Face3( 	  0,		 2,		 1	),
			new THREE.Face3( 	  0,		 3,		 2	),
			new THREE.Face3( 	  0,		 4,		 3	),
			new THREE.Face3( 	  0,		 5,		 4	),
			new THREE.Face3( 	  0,		 6,		 5	),
			new THREE.Face3( 	  0,		 7,		 6	),
			new THREE.Face3( 	  0,		 8,		 7	),
			new THREE.Face3( 	  0,		 9,		 8	),
			new THREE.Face3( 	  0,		10,		 9	),
			new THREE.Face3( 	  0,		 1,		10	),
			new THREE.Face3( 	  1,		12,		11	),
			new THREE.Face3( 	  1,		 2,		12	),
			new THREE.Face3( 	  2,		13,		12	),
			new THREE.Face3( 	  2,		 3,		13	),
			new THREE.Face3( 	  3,		14,		13	),
			new THREE.Face3( 	  3,		 4,		14	),
			new THREE.Face3( 	  4,		15,		14	),
			new THREE.Face3( 	  4,		 5,		15	),
			new THREE.Face3( 	  5,		16,		15	),
			new THREE.Face3( 	  5,		 6,		16	),
			new THREE.Face3( 	  6,		17,		16	),
			new THREE.Face3( 	  6,		 7,		17	),
			new THREE.Face3( 	  7,		18,		17	),
			new THREE.Face3( 	  7,		 8,		18	),
			new THREE.Face3( 	  8,		19,		18	),
			new THREE.Face3( 	  8,		 9,		19	),
			new THREE.Face3( 	  9,		20,		19	),
			new THREE.Face3( 	  9,		10,		20	),
			new THREE.Face3( 	 10,		11,		20	),
			new THREE.Face3( 	 10,		 1,		11	),
			new THREE.Face3( 	 21,		11,		12	),
			new THREE.Face3( 	 21,		12,		13	),
			new THREE.Face3( 	 21,		13,		14	),
			new THREE.Face3( 	 21,		14,		15	),
			new THREE.Face3( 	 21,		15,		16	),
			new THREE.Face3( 	 21,		16,		17	),
			new THREE.Face3( 	 21,		17,		18	),
			new THREE.Face3( 	 21,		18,		19	),
			new THREE.Face3( 	 21,		19,		20	),
			new THREE.Face3( 	 21,		20,		11	),
			new THREE.Face3( 	  1,		 2,		 0	),
			new THREE.Face3( 	  2,		 3,		 0	),
			new THREE.Face3( 	  3,		 4,		 0	),
			new THREE.Face3( 	  4,		 5,		 0	),		
			new THREE.Face3( 	  5,		 6,		 0	),
			new THREE.Face3( 	  6,		 7,		 0	),
			new THREE.Face3( 	  7,		 8,		 0	),
			new THREE.Face3( 	  8,		 9,		 0	),
			new THREE.Face3( 	  9,		10,		 0	),
			new THREE.Face3( 	 10,		 1,		 0	),
			new THREE.Face3( 	 22,		23,		 1	),
			new THREE.Face3( 	 23,		 2,		 1	),
			new THREE.Face3( 	 23,		24,		 2	),
			new THREE.Face3( 	 24,		 3,		 2	),
			new THREE.Face3( 	 24,		25,		 3	),
			new THREE.Face3( 	 25,		 4,		 3	),
			new THREE.Face3( 	 25,		26,		 4	),
			new THREE.Face3( 	 26,		 5,		 4	),
			new THREE.Face3( 	 26,		27,	 	 5	),
			new THREE.Face3( 	 27,		 6, 		 5	),
			new THREE.Face3( 	 27,		28,		 6	),
			new THREE.Face3( 	 28,		 7,		 6	),
			new THREE.Face3( 	 28,		29,		 7	),
			new THREE.Face3( 	 29,		 8,		 7	),
			new THREE.Face3( 	 29,		30,		 8	),
			new THREE.Face3( 	 30,		 9,		 8	),
			new THREE.Face3( 	 30,		31,		 9	),
			new THREE.Face3( 	 31,		10,		 9	),
			new THREE.Face3( 	 31,		22,		10	),
			new THREE.Face3( 	 22,		 1,		10	),
			new THREE.Face3( 	 23,		22,		32	),
			new THREE.Face3( 	 24,		23,		32	),
			new THREE.Face3( 	 25,		24,		32	),
			new THREE.Face3( 	 26,		25,		32	),
			new THREE.Face3( 	 27,		26,		32	),
			new THREE.Face3( 	 28,		27,		32	),
			new THREE.Face3( 	 29,		28,		32	),
			new THREE.Face3( 	 30,		29,		32	),
			new THREE.Face3( 	 31,		30,		32	),
			new THREE.Face3( 	 22,		31,		32	)
		);

		geo_back.faceVertexUvs[0].push(
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[12].x + backoffsetx) / backrangex ), 		((geo_back.vertices[12].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[11].x + backoffsetx) / backrangex ), 		((geo_back.vertices[11].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[12].x + backoffsetx) / backrangex ), 		((geo_back.vertices[12].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[13].x + backoffsetx) / backrangex ), 		((geo_back.vertices[13].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[12].x + backoffsetx) / backrangex ), 		((geo_back.vertices[12].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[13].x + backoffsetx) / backrangex ), 		((geo_back.vertices[13].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[14].x + backoffsetx) / backrangex ), 		((geo_back.vertices[14].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[13].x + backoffsetx) / backrangex ), 		((geo_back.vertices[13].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[14].x + backoffsetx) / backrangex ), 		((geo_back.vertices[14].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[15].x + backoffsetx) / backrangex ), 		((geo_back.vertices[15].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[14].x + backoffsetx) / backrangex ), 		((geo_back.vertices[14].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[15].x + backoffsetx) / backrangex ), 		((geo_back.vertices[15].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[16].x + backoffsetx) / backrangex ), 		((geo_back.vertices[16].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[15].x + backoffsetx) / backrangex ), 		((geo_back.vertices[15].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[16].x + backoffsetx) / backrangex ), 		((geo_back.vertices[16].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[17].x + backoffsetx) / backrangex ), 		((geo_back.vertices[17].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[16].x + backoffsetx) / backrangex ), 		((geo_back.vertices[16].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[17].x + backoffsetx) / backrangex ), 		((geo_back.vertices[17].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[18].x + backoffsetx) / backrangex ), 		((geo_back.vertices[18].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[17].x + backoffsetx) / backrangex ), 		((geo_back.vertices[17].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[18].x + backoffsetx) / backrangex ), 		((geo_back.vertices[18].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[19].x + backoffsetx) / backrangex ), 		((geo_back.vertices[19].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[18].x + backoffsetx) / backrangex ), 		((geo_back.vertices[18].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[19].x + backoffsetx) / backrangex ), 		((geo_back.vertices[19].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[20].x + backoffsetx) / backrangex ), 		((geo_back.vertices[20].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[19].x + backoffsetx) / backrangex ), 		((geo_back.vertices[19].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[20].x + backoffsetx) / backrangex ), 		((geo_back.vertices[20].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[11].x + backoffsetx) / backrangex ), 		((geo_back.vertices[11].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[20].x + backoffsetx) / backrangex ), 		((geo_back.vertices[20].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[11].x + backoffsetx) / backrangex ), 		((geo_back.vertices[11].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[11].x + backoffsetx) / backrangex ), 		((geo_back.vertices[11].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[12].x + backoffsetx) / backrangex ), 		((geo_back.vertices[12].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[12].x + backoffsetx) / backrangex ), 		((geo_back.vertices[12].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[13].x + backoffsetx) / backrangex ), 		((geo_back.vertices[13].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[13].x + backoffsetx) / backrangex ), 		((geo_back.vertices[13].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[14].x + backoffsetx) / backrangex ), 		((geo_back.vertices[14].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[14].x + backoffsetx) / backrangex ), 		((geo_back.vertices[14].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[15].x + backoffsetx) / backrangex ), 		((geo_back.vertices[15].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[15].x + backoffsetx) / backrangex ), 		((geo_back.vertices[15].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[16].x + backoffsetx) / backrangex ), 		((geo_back.vertices[16].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[16].x + backoffsetx) / backrangex ), 		((geo_back.vertices[16].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[17].x + backoffsetx) / backrangex ), 		((geo_back.vertices[17].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[17].x + backoffsetx) / backrangex ), 		((geo_back.vertices[17].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[18].x + backoffsetx) / backrangex ), 		((geo_back.vertices[18].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[18].x + backoffsetx) / backrangex ), 		((geo_back.vertices[18].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[19].x + backoffsetx) / backrangex ), 		((geo_back.vertices[19].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[19].x + backoffsetx) / backrangex ), 		((geo_back.vertices[19].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[20].x + backoffsetx) / backrangex ), 		((geo_back.vertices[20].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[21].x + backoffsetx) / backrangex ), 		((geo_back.vertices[21].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[20].x + backoffsetx) / backrangex ), 		((geo_back.vertices[20].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[11].x + backoffsetx) / backrangex ), 		((geo_back.vertices[11].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[0].x + backoffsetx) / backrangex ), 		((geo_back.vertices[0].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[22].x + backoffsetx) / backrangex ), 		((geo_back.vertices[22].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[23].x + backoffsetx) / backrangex ), 		((geo_back.vertices[23].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[23].x + backoffsetx) / backrangex ), 		((geo_back.vertices[23].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[23].x + backoffsetx) / backrangex ), 		((geo_back.vertices[23].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[24].x + backoffsetx) / backrangex ), 		((geo_back.vertices[24].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[24].x + backoffsetx) / backrangex ), 		((geo_back.vertices[24].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[2].x + backoffsetx) / backrangex ), 		((geo_back.vertices[2].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[24].x + backoffsetx) / backrangex ), 		((geo_back.vertices[24].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[25].x + backoffsetx) / backrangex ), 		((geo_back.vertices[25].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[25].x + backoffsetx) / backrangex ), 		((geo_back.vertices[25].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[3].x + backoffsetx) / backrangex ), 		((geo_back.vertices[3].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[25].x + backoffsetx) / backrangex ), 		((geo_back.vertices[25].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[26].x + backoffsetx) / backrangex ), 		((geo_back.vertices[26].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[26].x + backoffsetx) / backrangex ), 		((geo_back.vertices[26].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[4].x + backoffsetx) / backrangex ), 		((geo_back.vertices[4].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[26].x + backoffsetx) / backrangex ), 		((geo_back.vertices[26].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[27].x + backoffsetx) / backrangex ), 		((geo_back.vertices[27].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[27].x + backoffsetx) / backrangex ), 		((geo_back.vertices[27].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[5].x + backoffsetx) / backrangex ), 		((geo_back.vertices[5].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[27].x + backoffsetx) / backrangex ), 		((geo_back.vertices[27].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[28].x + backoffsetx) / backrangex ), 		((geo_back.vertices[28].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[28].x + backoffsetx) / backrangex ), 		((geo_back.vertices[28].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[6].x + backoffsetx) / backrangex ), 		((geo_back.vertices[6].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[28].x + backoffsetx) / backrangex ), 		((geo_back.vertices[28].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[29].x + backoffsetx) / backrangex ), 		((geo_back.vertices[29].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[29].x + backoffsetx) / backrangex ), 		((geo_back.vertices[29].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[7].x + backoffsetx) / backrangex ), 		((geo_back.vertices[7].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[29].x + backoffsetx) / backrangex ), 		((geo_back.vertices[29].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[30].x + backoffsetx) / backrangex ), 		((geo_back.vertices[30].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[30].x + backoffsetx) / backrangex ), 		((geo_back.vertices[30].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[8].x + backoffsetx) / backrangex ), 		((geo_back.vertices[8].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[30].x + backoffsetx) / backrangex ), 		((geo_back.vertices[30].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[31].x + backoffsetx) / backrangex ), 		((geo_back.vertices[31].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[31].x + backoffsetx) / backrangex ), 		((geo_back.vertices[31].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[9].x + backoffsetx) / backrangex ), 		((geo_back.vertices[9].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[31].x + backoffsetx) / backrangex ), 		((geo_back.vertices[31].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[22].x + backoffsetx) / backrangex ), 		((geo_back.vertices[22].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[22].x + backoffsetx) / backrangex ), 		((geo_back.vertices[22].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[1].x + backoffsetx) / backrangex ), 		((geo_back.vertices[1].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[10].x + backoffsetx) / backrangex ), 		((geo_back.vertices[10].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[23].x + backoffsetx) / backrangex ), 		((geo_back.vertices[23].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[22].x + backoffsetx) / backrangex ), 		((geo_back.vertices[22].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[24].x + backoffsetx) / backrangex ), 		((geo_back.vertices[24].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[23].x + backoffsetx) / backrangex ), 		((geo_back.vertices[23].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[25].x + backoffsetx) / backrangex ), 		((geo_back.vertices[25].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[24].x + backoffsetx) / backrangex ), 		((geo_back.vertices[24].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[26].x + backoffsetx) / backrangex ), 		((geo_back.vertices[26].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[25].x + backoffsetx) / backrangex ), 		((geo_back.vertices[25].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[27].x + backoffsetx) / backrangex ), 		((geo_back.vertices[27].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[26].x + backoffsetx) / backrangex ), 		((geo_back.vertices[26].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[28].x + backoffsetx) / backrangex ), 		((geo_back.vertices[28].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[27].x + backoffsetx) / backrangex ), 		((geo_back.vertices[27].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[29].x + backoffsetx) / backrangex ), 		((geo_back.vertices[29].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[28].x + backoffsetx) / backrangex ), 		((geo_back.vertices[28].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[30].x + backoffsetx) / backrangex ), 		((geo_back.vertices[30].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[29].x + backoffsetx) / backrangex ), 		((geo_back.vertices[29].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[31].x + backoffsetx) / backrangex ), 		((geo_back.vertices[31].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[30].x + backoffsetx) / backrangex ), 		((geo_back.vertices[30].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			],
			[
				new THREE.Vector2( ((geo_back.vertices[22].x + backoffsetx) / backrangex ), 		((geo_back.vertices[22].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[31].x + backoffsetx) / backrangex ), 		((geo_back.vertices[31].z + backoffsetz) / backrangez)),
				new THREE.Vector2( ((geo_back.vertices[32].x + backoffsetx) / backrangex ), 		((geo_back.vertices[32].z + backoffsetz) / backrangez))
			]
		);

		/*____________armagetron cycle______________*/


		geo_body.computeFaceNormals();//for lighting
		geo_front.computeFaceNormals();//for lighting
		geo_back.computeFaceNormals();//for lighting


	//UV MAPS NEEDED OR ERRORS for mapping
	//materials
	var bodyMaterial = [
			new THREE.MeshBasicMaterial( { 
				color: colorCode, 
	//			shading: THREE.FlatShading
			}),
			new THREE.MeshBasicMaterial( { 
				map: engine.textures.cycle_body,
				transparent: settings.ALPHA_BLEND, 
				opacity: 1.0,
			})];

			
	var wheelMaterial = [
			new THREE.MeshBasicMaterial( { //MeshLambertMaterial
				color: colorCode, 
	//			shading: THREE.FlatShading
			}),
			new THREE.MeshBasicMaterial( { 
				map: engine.textures.cycle_wheel,
				transparent: settings.ALPHA_BLEND, 
				opacity: 1.0,
			})];




	//	var cycleBody = new THREE.Mesh( geo_body, bodyMaterial );
		var cycleBody = new THREE.SceneUtils.createMultiMaterialObject( geo_body, bodyMaterial );
		
	//	var cycleFront = new THREE.Mesh( geo_front, wheelMaterial );
	//	var cycleBack = new THREE.Mesh( geo_back, wheelMaterial );
		var cycleFront = new THREE.SceneUtils.createMultiMaterialObject( geo_front, wheelMaterial );
		var cycleBack = new THREE.SceneUtils.createMultiMaterialObject( geo_back, wheelMaterial );


		cycleFront.position.x = 1.9;//push front wheel to front
		cycleFront.position.z = 0.418248;//raise front wheel
		cycleBack.position.z += 0.70724;//raise back wheel
		
		cycleBody.position.x -= 1.5;//move back 1.5
		cycleFront.position.x -= 1.5;
		cycleBack.position.x -= 1.5;
		model.add(cycleBody);
		model.add(cycleFront);
		model.add(cycleBack);
	}
	
		model.scale.set(0.5,0.5,0.5);//half size
		model.rotaon = {
			front: 133.55356,
			back: 78.947758
		};
	return model;
};


function newChatArrow()
{
	var mat = new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide, color: new THREE.Color("yellow"),
		});
	
	var geo = new THREE.Geometry();
	geo.vertices.push(new THREE.Vector3(0,0,0));
	geo.vertices.push(new THREE.Vector3(-1,-1,2));
	geo.vertices.push(new THREE.Vector3(-1, 1,2));
	geo.vertices.push(new THREE.Vector3( 1, 1,2));
	geo.vertices.push(new THREE.Vector3( 1,-1,2));
	geo.vertices.push(new THREE.Vector3(-1,-1,2));
	
	for(var i=1;i<geo.vertices.length-1;i++)
	{
		geo.faces.push(new THREE.Face3(i,i+1,0));
	}
	
	return new THREE.Mesh(geo,mat);
}


/*—–––––––––––cycle constructor—–––––––––––*/
var createLightcycle = function(cfg) //DEPRECATED
{
	return new Cycle(cfg);
}



/*_*/

/*—––––––––––––wall–constructor—–––––––––––*/	

function newWall(tailColor,x,y,z=0)
{
	var xy = 0.001;
	
	//var wallTextureProportion;
	var textureBlending = true;
	if(!engine.dedicated)
	{
		/*var texture = engine.textures.cycle_wall;
		texture.wrapS = THREE.RepeatWrapping;
		texture.repeat.set(xy,1);*/
		/*if (texture.image)
		{
			wallTextureProportion = (texture.image.width / texture.image.height) * xy; // *4 is actual size
		}//*/

		var wallMaterial = new THREE.MeshLambertMaterial({
			side: THREE.DoubleSide,
			color: tailColor,
			//map: texture,
			//blending: textureBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
			transparent: settings.ALPHA_BLEND, opacity: 0.6
		});
	}
	
	//var wallGeometry = new THREE.PlaneBufferGeometry( 1, 4 );
	
	/*var m = new THREE.Matrix4();
		m.makeRotationX(pi(0.5));
		m.makeTranslation( 0.5, 2, 0 );
		wallGeometry.applyMatrix( m );*/
	
	var geo = new THREE.Geometry();
	geo.vertices.push(new THREE.Vector3(0,0,0));
	geo.vertices.push(new THREE.Vector3(xy,xy,0));
	geo.vertices.push(new THREE.Vector3(xy,xy,1));
	geo.vertices.push(new THREE.Vector3(0,0,1));
	geo.vertices.push(new THREE.Vector3(0,0,0));
	geo.vertices.push(new THREE.Vector3(xy,xy,0));
	
	geo.faces = [new THREE.Face3(0,1,2),new THREE.Face3(1,2,3),new THREE.Face3(2,3,4),new THREE.Face3(3,4,5)];
	
	geo.computeFaceNormals();
    geo.computeVertexNormals();
	
	var wall1 = new THREE.Mesh(geo,wallMaterial);

	// hacky solution to make wall visible from straight on
	var geo = new THREE.Geometry();
	geo.vertices.push(new THREE.Vector3(0,0,1));
	geo.vertices.push(new THREE.Vector3(xy,xy,1));
	var wall2 = new THREE.Line(geo,wallMaterial);
	
	var wall = new THREE.Group();
	wall.add(wall1); wall.add(wall2);
	
	wall.position.set(x,y,z);
	wall.size = xy;
	wall.scale.set(1,1,0.75);
	
	return wall;
}

var createWall = function(cycle,x,y)
{

	var group = new THREE.Group();

	var wall = newWall(cycle.tailColor,x,y);

	group.add(wall); // === .children[0]
	//group.add(line); // === .children[1]
	
	group.netLength = 0;
	group.map = [[x,y],[x,y]];

	return group;
};

/*–––––––––––––––––––––––––––––––––––––––––*/

function lineExplosion(pos,color1=0xffffff,color2=color1)
{
	if(typeof(pos) != "object") pos = {x:0,y:0,z:0};
	else if(typeof(pos.x) == "undefined") pos.x = 0;
	else if(typeof(pos.y) == "undefined") pos.y = 0;
	else if(typeof(pos.z) == "undefined") pos.z = 0;
	if(!settings.EXPLOSIONS) return false;
	
	var group = new THREE.Group();
	
	var expvec = [
		//new THREE.Vector3(0,0,1),
		new THREE.Vector3(0,1,1),
		new THREE.Vector3(0,-1,1),
		new THREE.Vector3(1,0,1),
		new THREE.Vector3(-1,0,1),
		new THREE.Vector3(1,1,1),
		new THREE.Vector3(-1,1,1),
		new THREE.Vector3(1,-1,1),
		new THREE.Vector3(-1,-1,1),
	];
	
	var fak=7;
	
	for(var j=40-expvec.length;j--;)
	{
		expvec.push(new THREE.Vector3(
			fak*((Math.random())-.5),
			fak*((Math.random())-.5),
			1
		));
	}
	for(var j=40-expvec.length;j--;)
	{
		expvec.push(new THREE.Vector3(
			fak*((Math.random())-.5),
			fak*((Math.random())-.5),
			-1
		));
	}
	
	var mat = [
		new THREE.LineBasicMaterial({color:color1,transparent:settings.ALPHA_BLEND,opacity:1}),
		new THREE.LineBasicMaterial({color:color2,transparent:settings.ALPHA_BLEND,opacity:1})
	];
	for(var z=expvec.length;z--;)
	{
		var geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(0,0,0));
		geometry.vertices.push(expvec[z]);
		var line = new THREE.Line(geometry,mat[Math.round(Math.random())]);
		line.position.set(pos.x,pos.y,pos.z); line.scale.set(0,0,0);
		group.add(line);
	}
	engine.expl.push(group);
	engine.scene.add(group);
}
function zmanCircleExplosion(pos,color1=0xffffff,color2=color1)
{
	
}

spawnExplosion = lineExplosion;
//spawnExplosion = zmanCircleExplosion;
