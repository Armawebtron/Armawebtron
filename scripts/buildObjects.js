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
	
	engine.textures.particle = new THREE.TextureLoader().load("images/textures/particle.png");
	engine.textures.circleExpl = new THREE.TextureLoader().load("images/textures/explosion.png");
}

//GRID
window.buildGrid = function()
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
			
			if(settings.FLOOR_MIRROR)
			{
				engine.grid.mirror = new THREE.Reflector( (new THREE.PlaneGeometry( logicalWidth, logicalHeight )), {
					clipBias: 0.003,
					textureWidth: window.innerWidth,
					textureHeight: window.innerHeight,
					color: 0x777777
				} );
				
				engine.grid.mirror.position.set(
					engine.logicalBox.center.x * engine.REAL_ARENA_SIZE_FACTOR, 
					engine.logicalBox.center.y * engine.REAL_ARENA_SIZE_FACTOR, 
					-0.025
				);
				
				floorMaterial.transparent = true;
				floorMaterial.opacity = 1-settings.FLOOR_MIRROR_INT;
				
				engine.grid.add(engine.grid.mirror);
			}
			
			
			floorMaterial.needsUpdate = true;//is this needed?
			var floorGeometry = new THREE.PlaneBufferGeometry(logicalWidth*settings.GRID_SIZE,logicalHeight*settings.GRID_SIZE,1,1);
			floorGeometry.dynamic = true;//is this needed?
			grid_object = new THREE.Mesh(floorGeometry, floorMaterial);
			grid_object.position.x = logicalBox[0] * engine.REAL_ARENA_SIZE_FACTOR;
			grid_object.position.y = logicalBox[1] * engine.REAL_ARENA_SIZE_FACTOR;
			//grid_object.scale.set(settings.GRID_SIZE,settings.GRID_SIZE,1);
			//console.log("gridx: "+grid_object.position.x+"  gridy: "+grid_object.position.y);
			grid_object.geometry.dynamic = true;//is this needed?
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
		if(settings.STRICT_AXES_SPAWN)
		{
			var deg = (360/settings.ARENA_AXES);
			sAng = Math.round(sAng/deg)*deg;
		}
		var spawn_data = [sXpos, sYpos, sZpos, sAng];
		engine.map.spawns.push( spawn_data );
	}

}//end of grid



///////////////////////////////
//WALLS
window.buildWalls = function() {//builds all walls in map and returns object to add to scene
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
			var maxAnisotropy = engine.renderer.capabilities.getMaxAnisotropy();
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
window.buildZones = function()
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

/*—–––––––––––cycle model—–––––––––––*/
modelByName = function(model)
{
	switch(model)
	{
		case 5: return "arma"; break;
	}
};

getModel = function(model,immediate)
{
	if(engine.dedicated) return;
	
	var name = modelByName(model);
	
	//if(immediate)
	{
		try
		{
			engine.models[name] = {};
			var dir = "./models/"+name;
			engine.models[name].body = (""+httpGet(dir+"/cycle_body.MDL")).split("\n");
			engine.models[name].front = (""+httpGet(dir+"/cycle_front.MDL")).split("\n");
			engine.models[name].rear = (""+httpGet(dir+"/cycle_rear.MDL")).split("\n");
		}
		catch(e)
		{
			console.error(e);
			engine.models[name] = false;
		}
	}
};

parseModel = function(txtmdl)
{
	var geo = new THREE.Geometry();
	
	var min_x = Infinity, max_x = -Infinity, min_y = Infinity, max_y = -Infinity, min_z = Infinity, max_z = -Infinity;
	
	var bodyrangex, bodyoffsetx, bodyrangez, bodyoffsetz;
	
	var txt = "";
	for(var i=0;i<txtmdl.length;++i)
	{
		if(txtmdl[i] == "") continue;
		txt = txtmdl[i].split("\t");
		if(txt[0][0] == 'v')
		{
			var vec = (geo.vertices[txt[0].slice(2)-1] = new THREE.Vector3(1*(txt[1]),1*(txt[2]),1*(txt[3])));
			
			if(vec.x < min_x) min_x = vec.x;
			if(vec.x > max_x) max_x = vec.x;
			
			if(vec.y < min_y) min_y = vec.y;
			if(vec.y > max_y) max_y = vec.y;
			
			if(vec.z < min_z) min_z = vec.z;
			if(vec.z > max_z) max_z = vec.z;
		}
	}
	for(var i=0;i<txtmdl.length;++i)
	{
		if(txtmdl[i] == "") continue;
		txt = txtmdl[i].split("\t");
		if(txt[0][0] == 'f')
		{
			if(bodyrangex === undefined)
			{
				bodyrangex = (min_x - max_x) * -1; 	//range = (lowest - highest) * -1
				bodyoffsetx = 0 - min_x;						//offset = 0 - lowest
				bodyrangez = (min_z - max_z) * -1;
				bodyoffsetz = 0 - min_z;
			}
			
			geo.faces.push(new THREE.Face3(txt[1]-1, txt[2]-1, txt[3]-1));
			//console.log(txt);
			geo.faceVertexUvs[0].push([
				new THREE.Vector2( ((geo.vertices[txt[1]-1].x + bodyoffsetx) / bodyrangex ), ((geo.vertices[txt[1]-1].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo.vertices[txt[2]-1].x + bodyoffsetx) / bodyrangex ), ((geo.vertices[txt[2]-1].z + bodyoffsetz) / bodyrangez)),
				new THREE.Vector2( ((geo.vertices[txt[3]-1].x + bodyoffsetx) / bodyrangex ), ((geo.vertices[txt[3]-1].z + bodyoffsetz) / bodyrangez)),
			]);
		}
	}
	
	return geo;
};

function mFailSafe(model)
{
	model.add(new THREE.Mesh(new THREE.Geometry()));
	model.add(new THREE.Mesh(new THREE.Geometry()));
	model.add(new THREE.Mesh(new THREE.Geometry()));
	model.rotaon = {front: 0, back: 0};
	return model;
}

cycleModel = function(colorCode,modelType=5)
{
	var model = new THREE.Object3D();
	
	if(engine.dedicated) return model;
	
	var name = modelByName(modelType);
	
	if(!engine.models[name])
	{
		getModel(modelType,true);
	}
	
	var txtmdl = engine.models[name];
	if(!txtmdl) return mFailSafe(model);
	
	try
	{
		var geo_body = parseModel(txtmdl.body);
		var geo_front = parseModel(txtmdl.front);
		var geo_back = parseModel(txtmdl.rear);
	}
	catch(e)
	{
		console.error(e);
		return mFailSafe(model);
	}
	
	
	
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
	var cycleBack = new THREE.SceneUtils.createMultiMaterialObject( geo_back, wheelMaterial )
	
	// FIXME: where did Durf get these values from?
	cycleFront.position.x = 1.9;//push front wheel to front
	cycleFront.position.z = 0.418248;//raise front wheel
	cycleBack.position.z += 0.70724;//raise back wheel
	
	cycleBody.position.x -= 1.5;//move back 1.5
	cycleFront.position.x -= 1.5;
	cycleBack.position.x -= 1.5;
	model.add(cycleBody);
	model.add(cycleFront);
	model.add(cycleBack);

	model.scale.set(0.5,0.5,0.5);//half size
	model.rotaon = {
		front: 133.55356,
		back: 78.947758
	};
	return model;
};

//function newChatArrow()
newChatArrow = function()
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

window.newWall = function(tailColor,x,y,z=0)
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

createWall = function(cycle,x,y)
{

	var group = new THREE.Group();

	var wall = newWall(cycle.tailColor,x,y);

	group.add(wall); // === .children[0]
	//group.add(line); // === .children[1]
	
	group.netLength = 0;
	group.map = [[x,y],[x,y]];

	group.owner = cycle;

	return group;
};

/*–––––––––––––––––––––––––––––––––––––––––*/

class cycleWall
{
	constructor()
	{
		this.geo = new THREE.Geometry();
		this.geo.vertices.push(new THREE.Vector3(0,0,0));
		this.geo.faces = [new THREE.Face3(0,1,2)];
	}
}

/*–––––––––––––––––––––––––––––––––––––––––*/

function lineExplosion(pos,color1=0xffffff,color2=color1)
{
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
	group.explType = 0;
	engine.expl.push(group);
	engine.scene.add(group);
}
function zmanCircleExplosion(pos,color1=0xffffff,color2=color1)
{
	var texture = new THREE.MeshBasicMaterial({
		color: 0xFFFFFF,
		map: engine.textures.circleExpl,
		transparent: settings.ALPHA_BLEND,
		opacity: 1,
	});
	
	var obj = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), texture );
	obj.position.set(pos.x, pos.y, pos.z);
	
	obj.explType = 1;
	engine.expl.push(obj);
	engine.scene.add(obj);
}
function particleExplosion(pos,color1=0xffffff,color2=color1)
{
	var useImage = (settings.ALPHA_BLEND && engine.textures.particle.image);
	
	var color = new THREE.Color(color1);
	color.r += 0.1;
	color.g += 0.1;
	color.b += 0.1;
	
	var matSettings = {
		color: color,
		size: useImage?0.4:0.15,
		map: useImage?engine.textures.particle:undefined,
		transparent: settings.ALPHA_BLEND,
		blending: THREE.AdditiveBlending,
		opacity: 1,
		depthWrite: false,
	};
	
	var particleCount = 1000/2;
	
	for(var i=2;i>0;--i)
	{
		//particleCount = 1000+Math.ceil(5000*Math.random());
		
		var particles = new THREE.Geometry();
		var pMaterial = new THREE.PointsMaterial(matSettings);
		
		for(var p=particleCount-1;p>=0;--p)
		{
			var particle = new THREE.Vector3(pos.x, pos.y, pos.z);
			//particle.xdir = Math.random()*40-20;
			//particle.ydir = Math.random()*40-20;
			particle.zdir = Math.random()*33;
			var rad = Math.random()*pi(2);
			particle.xdir = Math.cos(rad)*(Math.random()*40);
			particle.ydir = Math.sin(rad)*(Math.random()*40);
			//particle.zdir = 160/pointDistance(0, 0, particle.xdir, particle.ydir);
			particles.vertices.push(particle);
		}
		
		particleSystem = new THREE.Points(particles, pMaterial);
		
		particles.computeBoundingSphere();
		particles.boundingSphere.radius = 160;
		
		particleSystem.explType = 2;
		
		engine.expl.push(particleSystem);
		engine.scene.add(particleSystem);
		
		if(i == 2)
		{
			matSettings.color = new THREE.Color(color2);
			color.r += 0.1;
			color.g += 0.1;
			color.b += 0.1;
		}
	}
}

window.spawnExplosion = function(pos,color1=0xffffff,color2=color1)
{
	if(!settings.EXPLOSIONS) return false;
	if(engine.dedicated) return false;
	
	if(typeof(pos) != "object") pos = {x:0,y:0,z:0};
	else if(typeof(pos.x) == "undefined") pos.x = 0;
	else if(typeof(pos.y) == "undefined") pos.y = 0;
	else if(typeof(pos.z) == "undefined") pos.z = 0;
	
	switch(settings.EXPLOSION_TYPE)
	{
		case 0: lineExplosion(pos, color1, color2); break;
		case 1: zmanCircleExplosion(pos, color1, color2); break;
		case 2: particleExplosion(pos, color1, color2); break;
	}
};
