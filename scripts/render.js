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

var draw2dmap = true;

function render()
{
	if(!engine.roundCommencing && !engine.paused)
	{
		engine.renderRunning = true;
		if(settings.GAME_LOOP > 0) game.run(true); //update game right before render
		if(settings.REDRAW_MODE == 0) requestAnimationFrame(render); 
		else setTimeout(render,1000/settings.TARGET_FPS);
		draw(); //actual 3d draw
		if(settings.HUD_MAP && draw2dmap && engine.hud.style.opacity > 0)
		{
			draw2dmap = false;
			if(settings.REDRAW_MODE == 0)
				setTimeout(draw2d_canvas,0);
			else
				requestAnimationFrame(draw2d_canvas); 
		}
	}
	else
	{
		engine.renderRunning = false;
		if(engine.paused)
		{
			//var lines = engine.console.innerText.split("\n");
			//if(lines[(parseFloat(0+engine.console.style.top)/engine.console.scrollby].length > 0) 
		}
	}
}

function draw()
{
	//time handlers and delta
	var timenow = performance.now();
	var delta = (timenow - engine.lastRenderTime);
	var frametime = delta/1000;//time step
	engine.lastRenderTime = timenow;
	var fpsDelta = (timenow - engine.fpsTime);
	settings.TARGET_FPS = (1000/delta)*2;
	if(settings.TARGET_FPS < 10) settings.TARGET_FPS = 10;
	if(settings.MAX_TARGET_FPS < settings.TARGET_FPS) settings.TARGET_FPS = settings.MAX_TARGET_FPS;
	//if(fpsDelta > 999) //update fps gui once every second
	if(fpsDelta >= 500) // experimental quicker FPS updating...
	{
		//var fpsValue = fpsDelta/delta;
		/*var fpsValue = 1000/delta;*/
		var fpsValue = engine.framesCount*(1000/fpsDelta);
		//settings.TARGET_FPS = fpsValue*2;
		engine.framesCount = 0;
		engine.fpsTime = timenow;
		/*document.getElementById("fps").innerHTML = "FPS: " + fpsValue;*/
		updateHUD("current_framerate",fpsValue);
	}
	//updateHUD("current_framerate_now",1000/delta);
	updateHUD("current_frametime",delta);
	var timeElapsed = (timenow - engine.timeStart)-engine.totalPauseTime-4000;
	
	if(engine.extraCanvas) engine.extraCanvas.ctx.clearRect(0, 0, engine.extraCanvas.width, engine.extraCanvas.height);
	
	if(engine.zones && engine.gtime > 0) for(var x=engine.zones.children.length-1;x>=0;--x)
	{
		//zones spin
		switch(settings.ZONE_RENDER_TYPE)
		{
			case "cylinder":
				engine.zones.children[x].rotation.y += ((engine.zones.children[x].cfg.rotationSpeed * pi(2)) * frametime);
				break;
			default:
				engine.zones.children[x].rotation.z += ((engine.zones.children[x].cfg.rotationSpeed * pi(2)) * frametime);
				break;
		}
	}
	
	var soundEnabled = ( engine.audio && engine.audio.destination.numberOfOutputs > 0 );
	for(var x=engine.players.length-1;x>=0;x--) if(engine.players[x] !== undefined)
	{ //cycle un-tilting
		var cycle=engine.players[x];
		var xdir=Math.cos(cycle.rotation.z),ydir=Math.sin(cycle.rotation.z);
		var xd = Math.abs(xdir), yd = Math.abs(ydir);
		var sens = 0;
		if(cycle.sensor.left < 1) sens -= 0.02/cycle.sensor.left;
		if(cycle.sensor.right < 1) sens += 0.02/cycle.sensor.right;
		if(sens > 1) sens = 1;
		if(sens < -1) sens = -1;
		
		cycle.rotation.x -= xd*(((cycle.rotation.x)*frametime*4)+(sens*frametime*xdir));
		cycle.rotation.y -= yd*(((cycle.rotation.y)*frametime*4)+(sens*frametime*ydir));
		
		if(cycle.chatting != cycle.chatarrow.visible) cycle.chatarrow.visible = cycle.chatting;
		if(cycle.chatting)
		{
			cycle.chatarrow.rotation.z += frametime;
		}
		
		//wheel spin per player
		if(engine.gtime > 0)
		{
			cycle.model.children[1].rotation.y += (deg2rad(cycle.model.rotaon.front * cycle.speed) * frametime);//0.5x wheel size
			cycle.model.children[2].rotation.y += (deg2rad(cycle.model.rotaon.back * cycle.speed) * frametime);
		}
		//sound
		if( soundEnabled )
		{
			engine.audio.mixCycle(cycle);
		}
	}
	
	if(settings.WALLS_STAY_UP_DELAY >= 0)
	{
		for(var x=engine.players.length;x>=0;x--) if(engine.players[x] !== undefined)
		{
			if(!engine.players[x].alive && timenow-engine.players[x].dedtime >= settings.WALLS_STAY_UP_DELAY*1000)
			{
				if(engine.players[x].walls.scale.z > 0)
				{
					engine.players[x].walls.scale.z -= frametime*2;
				}
				else
				{
					engine.scene.remove(engine.players[x].walls);
				}
			}
		}
	}
	
	for(var x=engine.expl.length-1;x>=0;x--)
	{
	switch(engine.expl[x].explType)
	{
	case 0:
		if(engine.expl[x].children[0].material.opacity <= 0)
		{
			engine.scene.remove(engine.expl[x]);
			engine.expl.splice(x,1);
		}
		else for(var y=engine.expl[x].children.length-1;y>=0;y--)
		{
			engine.expl[x].children[y].scale.x = engine.expl[x].children[y].scale.y = engine.expl[x].children[y].scale.z += frametime*10;
			//engine.expl[x].children[y].position.z += frametime;
			if(engine.expl[x].children[y].scale.z > 10)
			{
				engine.expl[x].children[y].material.opacity -= frametime/25;
				if(engine.expl[x].children[y].material.opacity < 0.5 && engine.expl[x].children[y].material.opacity > 0)
				{
					var s = Math.round(1/engine.expl[x].children[y].material.opacity);
					engine.expl[x].visible = engine.framesCount%s;
				}
			}
		}
		break;
	
	case 1:
		if(engine.expl[x].material.opacity <= 0)
		{
			engine.scene.remove(engine.expl[x]);
			engine.expl.splice(x,1);
		}
		else
		{
			engine.expl[x].material.opacity -= frametime;
			
			engine.expl[x].scale.x += frametime*8;
			engine.expl[x].scale.y += frametime*8;
			
			engine.expl[x].rotation.x = engine.camera.rotation.x;
			engine.expl[x].rotation.y = engine.camera.rotation.z;
			engine.expl[x].rotation.z = engine.camera.rotation.y;
		}
		break;
	
	case 2:
		var updated = 0;
		for(var y=engine.expl[x].geometry.vertices.length-1;y>=0;--y)
		{
			var particle = engine.expl[x].geometry.vertices[y];
			particle.x += particle.xdir*frametime;
			particle.y += particle.ydir*frametime;
			particle.z += particle.zdir*frametime;
			
			particle.xdir -= particle.xdir*0.20*frametime;
			particle.ydir -= particle.ydir*0.20*frametime;
			particle.zdir -= frametime*50;
			
			if(particle.z <= 0)
			{
				if(Math.abs(particle.zdir) > 18)
				{
					particle.zdir *= -0.85;
					++updated;
				}
				else
				{
					particle.xdir = 0;
					particle.ydir = 0;
					particle.zdir = 0;
					particle.z = -1000;
				}
			}
			else
			{
				++updated;
			}
		}
		
		if(updated > 0)
		{
			engine.expl[x].geometry.verticesNeedUpdate = true;
		}
		else
		{
			engine.scene.remove(engine.expl[x]);
			engine.expl.splice(x, 1);
		}
		
		break;
	}
	}
	
	if(settings.RIM_WALL_COLOR_MODE == 3)
	{
		var color = engine.walls.children[0].material.color;
		var p = settings.COLOR_MODE_3_COLORS.split(";");
		var c = p[engine.currrim3clr].split(",");
		//var c = {r:parse[0],g:parse[1],b:parse[2]};
		var sum = color.r+color.g+color.b;
		var keys = Object.keys(color);
		for(var x=keys.length-1;x>=0;--x)
		{
			if(c[x] < color[keys[x]])
			{
				color[keys[x]] -= frametime*settings.COLOR_MODE_3_SPEED;
			}
			else if(c[x] > color[keys[x]])
			{
				color[keys[x]] += frametime*settings.COLOR_MODE_3_SPEED;
			}
			if(color[keys[x]] > 1)
				color[keys[x]] = 1;
			if(color[keys[x]] < 0)
				color[keys[x]] = 0;
		}
		//console.log(color,c);
		if(color.r == c[0] && color.g == c[1] && color.b == c[2])
		{
			engine.currrim3clr += 1;
			if(engine.currrim3clr >= p.length)
				engine.currrim3clr = 0;
		}
		for(var x=engine.walls.children.length-1;x>=0;--x)
		{
			engine.walls.children[x].material.color = color;
		}
	}

	if(timenow > engine.cMFadeOutAfter)
	{
		var cm = document.getElementById("centerMessage")
		cm.style.opacity -= frametime;
		if(cm.style.opacity <= 0)
		{
			cm.style.opacity = 0;
			cm.style.display = "none";
			engine.cMFadeOutAfter = Infinity;
		}
	}
	
	if(engine.hud.fadein && engine.hud.game.style.opacity < 1)
	{
		engine.hud.game.style.opacity = (engine.hud.game.style.opacity*1)+(frametime*0.25); //workaround for opacity being a string
		if(engine.hud.game.style.opacity > 1) engine.hud.game.style.opacity = 1;
	}
	else if(!engine.hud.fadein && engine.hud.game.style.opacity > 0)
	{
		engine.hud.game.style.opacity -= frametime*0.25;
		if(engine.hud.game.style.opacity < 0) engine.hud.game.style.opacity = 0;
	}
	
	//update HUD (needs to be done for cycle being viewed)
	var cycle = engine.players[engine.viewTarget];
	
	if( cycle && engine.framesCount%2 == 0 )
	{
	updateHUD("player_rubber",cycle.rubber,0,settings.CYCLE_RUBBER);
	var maxspeed = maxSpeed();
	updateHUD("player_speed",cycle.speed,0,maxspeed);
	updateHUD("player_brake",cycle.brakes,0,1);
	updateHUD("max_speed",maxspeed);
	updateHUD("player_acceleration",cycle.accel);
	updateHUD("dist_to_impact_front",cycle.sensor.front);
	updateHUD("time_to_impact_front",cycle.sensor.front/cycle.speed);
	updateHUD("dist_to_impact_left",cycle.sensor.left);
	updateHUD("time_to_impact_left",cycle.sensor.left/cycle.speed);
	updateHUD("dist_to_impact_right",cycle.sensor.right);
	updateHUD("time_to_impact_right",cycle.sensor.right/cycle.speed);
	updateHUD("current_name",cycle.name);
	updateHUD("current_pos_x",cycle.position.x,engine.logicalBox.min.x*engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.max.x*engine.REAL_ARENA_SIZE_FACTOR);
	updateHUD("current_pos_y",cycle.position.y,engine.logicalBox.min.y*engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.max.y*engine.REAL_ARENA_SIZE_FACTOR);
	updateHUD("current_pos_x_adj",cycle.position.x/engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.min.x,engine.logicalBox.max.x);
	updateHUD("current_pos_y_adj",cycle.position.y/engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.min.y,engine.logicalBox.max.y);
	var dir = cdir(cycle.rotation.z);
	updateHUD("current_angle_x",dir[0]);
	updateHUD("current_angle_y",dir[1]);
	
	updateHUD("current_time",Math.round(timeElapsed)/1000);
	}
	
	if( engine.framesCount%5 == 0 )
	{
	//settings test
	var setnames = Object.keys(conf);
	for(var i=setnames.length;i--;)
	{
		var setting = setnames[i];
		updateHUD(setting.toLowerCase(),conf[setting].get());
	}
	
	}
	
	//actual drawing
	
	/*if(engine.players[engine.viewTarget].alive)*/ 
	if(cycle)
	{
		cameraView(cycle, frametime*engine.timemult);
	}
	else if(!render.chViewTarget)
	{
		render.chViewTarget = setTimeout(function(){game.changeViewTarget(1, true);render.chViewTarget=null},1000);
	}
	
	//renderer switch for post processing
	if( engine.usingPostProcessing )
	{
		engine.composer.render();//new render? for post processing
	}
	else
	{
		engine.renderer.render(engine.scene, engine.camera);
	}
	engine.framesCount++;
	
	if(engine.audio) engine.audio.audioMixing();
	
	if( engine.extraCanvas )
	{
		var hW = engine.extraCanvas.width/2;
		var hH = engine.extraCanvas.height/2;
		
		var xdir, ydir;
		
		for(var x=engine.players.length;x>=0;--x) if(engine.players[x])
		{
			if(x == engine.activePlayer) continue;
			
			var cycle = engine.players[x];
			if(!cycle.alive) continue;
			
			var pos = cycle.position.clone();
			
			// so the tilting doesn't affect the name position
			xdir = cycle.rotation.x; ydir = cycle.rotation.y;
			cycle.rotation.x = cycle.rotation.y = 0;
			
			var screenPos = new THREE.Matrix4();
			screenPos.multiplyMatrices( engine.camera.projectionMatrix, engine.camera.matrixWorldInverse );
			pos.applyMatrix4( screenPos );
			
			// store the rotation
			cycle.rotation.x = xdir; cycle.rotation.y = ydir;
			
			if( pos.x > -1 && pos.x < 1 && pos.y > -1 && pos.y < 1 )
			{
				if( !cycle.textVisible )
				{
					cycle.textVisible = ( performance.now() / 1000);
				}
			}
			else
			{
				cycle.textVisible = false;
			}
			
			if( cycle.textVisible && ( settings.FADEOUT_NAME_DELAY < 0 || ( cycle.textVisible + settings.FADEOUT_NAME_DELAY ) > ( performance.now() / 1000) ) )
			{
				var alpha = 1;
				if( settings.FADEOUT_NAME_DELAY > 0 )
					alpha = ( cycle.textVisible + settings.FADEOUT_NAME_DELAY - 1 ) - ( performance.now() / 1000);
				if( alpha > 1 ) alpha = 1;
				if( alpha < 0 ) alpha = 0;
				
				// nothing to draw...
				if( alpha == 0 ) continue;
				
				engine.extraCanvas.ctx.font = "16px Armagetronad";
				engine.extraCanvas.ctx.textAlign = "center";
				
				engine.extraCanvas.ctx.renderColorText(
					cycle.getColoredName(), 
					(hW*((1.03*pos.x)+1)), ((hH*(-(0.975*pos.y)+1))-28),
					1, 1, 1, alpha
				);
			}
		}
	}
}

function updateHUD(celement,thevalue,min=false,max=false)
{
	if( updateHUD.failed[celement] && updateHUD.failed[celement] > performance.now() )
	{
		return false;
	}
	
	var elements;
	if( updateHUD.lookupTable[celement] && updateHUD.lookupTable[celement][1] > performance.now() )
	{
		elements = updateHUD.lookupTable[celement][0];
	}
	if(!elements)
	{
		elements = document.getElementsByName(celement);
		if( elements.length == 0 )
		{
			updateHUD.failed[celement] = performance.now()+(25000*Math.random());
		}
		else
		{
			updateHUD.lookupTable[celement] = [elements, performance.now()+(50000*Math.random())];
		}
	}
	for(var i=elements.length-1;i>=0;--i)
	{
		var value = thevalue;
		var element = elements[i];
		if(min && element.attributes.min) element.setAttribute("min",min);
		if(max && element.attributes.max) element.setAttribute("max",max);
		if(element.attributes.precision) 
		{
			var prec = Math.pow(10,element.attributes.precision.value); 
			value = Math.round(value*prec)/prec;
			if(isNaN(value)) value = 0;
		}
		if(element.attributes.toprecision) 
		{
			var prec = 1*element.attributes.toprecision.value;
			if(!element.attributes.dontlimit)
			{
				value = parseFloat(value).toPrecision(prec-1+((""+Math.round(thevalue)).length));
			}
			else
			{
				value = value.toPrecision(prec);
			}
		}
		//if(element.attributes.precision) element.attributes.precision.value==0?value=Math.round(value):value.toPrecision(element.attributes.precision.value);
		//if(value)
		{
			if(element.tagName == "PROGRESS") 
			{
				element.setAttribute("value",value);
				//console.log(value);
			}
			else if(element.className == "progress") 
			{
				element.style.width = (Math.min(1,value/max)*100)+"%";
			}
			else if(!element.attributes.ignoretext)
			{
				element.innerHTML = ""+value;
			}
			if(element.attributes.bgcolorgrad)
			{
				var grad = element.attributes.bgcolorgrad.value;
				var p = grad.split(";");
				var c1 = p[0].split(",");
				var c2 = p[1].split(",");
				var color = {r:c1[0]*1,g:c1[1]*1,b:c1[2]*1},key=['r','g','b'];
				var progval = (value/max)*15;
				for(var x=0;x<3;x++)
				{
					if(c1[x] < c2[x])
					{
						color[key[x]] += progval;
					}
					else if(c1[x] > c2[x])
					{
						color[key[x]] -= progval;
					}
				}
				element.style.backgroundColor = "rgb("+(color.r*255)+","+(color.g*255)+","+(color.b*255)+")";
			}
		}
	}
}
updateHUD.lookupTable = {};
updateHUD.failed = {};

function draw2d_canvas() //TODO: have an svg output option
{
	var timeStart = performance.now();
	var canvas = document.getElementById("canvas");
	if(!canvas) return;
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0,0,canvas.width,canvas.height);
	var xsize = engine.logicalBox.max.x-engine.logicalBox.min.x, ysize = engine.logicalBox.max.y-engine.logicalBox.min.y;
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetWidth*(ysize/xsize);
	ctx.scale(
		canvas.width/(xsize*engine.REAL_ARENA_SIZE_FACTOR),
		canvas.height/(ysize*engine.REAL_ARENA_SIZE_FACTOR)
	);
	var ax = engine.logicalBox.min.x * engine.REAL_ARENA_SIZE_FACTOR, 
		ay = engine.logicalBox.min.y * engine.REAL_ARENA_SIZE_FACTOR;
	ctx.lineWidth = ((xsize*engine.REAL_ARENA_SIZE_FACTOR)/canvas.width);
	//ctx.lineWidth = canvas.width-canvas.height-2;
	//ctx.lineWidth = (canvas.offsetWidth-canvas.width)*engine.REAL_ARENA_SIZE_FACTOR;
	ctx.strokeStyle = "white";
	for(var i=engine.map.walls.length-1;i>=0;i--)
	{
		ctx.beginPath();
		var spl = engine.map.walls[i][engine.map.walls[i].length-1];
		ctx.moveTo(1*spl[0]-ax,1*spl[1]-ay);
		for(var z=engine.map.walls[i].length-1;z>=0;z--)
		{
			var spl = engine.map.walls[i][z];
			ctx.lineTo(1*spl[0]-ax,1*spl[1]-ay);
			//console.log(spl[0],spl[1]);
		}
		ctx.stroke();
	}
	for(var x=engine.players.length-1;x>=0;x--) if(engine.players[x] !== undefined)
	{
		var color = engine.players[x].walls.children[0].children[0].material.color;
		ctx.strokeStyle = "rgb("+(color.r*255)+","+(color.g*255)+","+(color.b*255)+")";
		ctx.beginPath();
		if(engine.players[x].walls.map.length > 0)
		{
			var walls = engine.players[x].walls.map;
			ctx.moveTo(walls[walls.length-1][0]-ax,walls[walls.length-1][1]-ay);
			for(var i=walls.length-1;i>=0;i--)
			{
				if( walls[i][2] < -1 ) continue;
				ctx.lineTo(walls[i][0]-ax,walls[i][1]-ay);
			}
		}
		ctx.stroke();
		if(engine.players[x].alive)
		{
			var color = new THREE.Color(engine.players[x].cycleColor);
			ctx.fillStyle = "rgb("+(color.r*255)+","+(color.g*255)+","+(color.b*255)+")";
			ctx.beginPath();
			ctx.arc(engine.players[x].position.x-ax,engine.players[x].position.y-ay, ctx.lineWidth, 0,Math.PI*2);
			ctx.fill();
		}
	}
	
	var lw = ctx.lineWidth;
	ctx.lineWidth = lw*settings.ZONE_ALPHA*settings.ZONE_ALPHA_SERVER;
	for(var x=engine.zones.children.length-1;x>=0;--x)
	{
		var zone = engine.zones.children[x];
		var color = zone.material.color;
		ctx.strokeStyle = "rgb("+(color.r*255)+","+(color.g*255)+","+(color.b*255)+")";
		var geo = zone.geometry.clone(); geo.applyMatrix(zone.matrix); //apply rotation, scale, and position
		
		ctx.beginPath();
		var pX = zone.position.x-ax, pY = zone.position.y-ay;
		for(var i=geo.faces.length-2;i>=0;i-=2)
		{
			ctx.moveTo(geo.vertices[geo.faces[i].b].x-ax,geo.vertices[geo.faces[i].b].y-ay);
			ctx.lineTo(geo.vertices[geo.faces[i].a].x-ax,geo.vertices[geo.faces[i].a].y-ay);
		}
		ctx.stroke();
	}
	
	lw *= 0.7;
	for(var x=engine.expl.length-1;x>=0;x--)
	{
	switch(engine.expl[x].explType)
	{
	case 0:
		ctx.lineWidth = lw*engine.expl[x].children[0].material.opacity;
		if(ctx.lineWidth > 0)
		{
			var scale = (engine.expl[x].children[0].scale.x+engine.expl[x].children[0].scale.y)/2;
			var cx = engine.expl[x].children[0].position.x, cy = engine.expl[x].children[0].position.y;
			for(var y=engine.expl[x].children.length;y--;)
			{
				var color = engine.expl[x].children[y].material.color;
				ctx.strokeStyle = "rgb("+(color.r*255)+","+(color.g*255)+","+(color.b*255)+")";
				ctx.beginPath();
				ctx.moveTo(cx-ax,cy-ay);
				ctx.lineTo(
					(cx+engine.expl[x].children[y].geometry.vertices[1].x*scale)-ax,
					(cy+engine.expl[x].children[y].geometry.vertices[1].y*scale)-ay
				);
				ctx.stroke();
			}
		}
		break
	
	case 2:
		var color = engine.expl[x].material.color;
		ctx.fillStyle = "rgba("+(color.r*255)+","+(color.g*255)+","+(color.b*255)+", 0.25)";
		for(var y=engine.expl[x].geometry.vertices.length-1;y>=0;--y)
		{
			if(engine.expl[x].geometry.vertices[y].z < 0) continue;
			/*
			ctx.beginPath();
			ctx.arc(engine.expl[x].geometry.vertices[y].x-ax,engine.expl[x].geometry.vertices[y].y-ay, (engine.expl[x].geometry.vertices[y].z*ctx.lineWidth)/10, 0,Math.PI*2);
			ctx.fill();
			*/
			
			var z = ((engine.expl[x].geometry.vertices[y].z*ctx.lineWidth)/10)*2;
			ctx.fillRect(engine.expl[x].geometry.vertices[y].x-ax,engine.expl[x].geometry.vertices[y].y-ay,z,z);
		}
		break;
	}
	}
	var impact = performance.now() - timeStart;
	if(impact > 1)
		setTimeout(function(){draw2dmap = true;}, impact*5);
	else
		draw2dmap = true;
}


function consoleInfo()
{
	var lines, lnnum, currln;
	
	switch(settings.TEXT_OUT_MODE)
	{
		case 0:
			lines = engine.console.innerText.split("\n");
			lnnum = (-(parseFloat(engine.console.style.top)/engine.console.scrollby));
			currln = lines[lnnum-1];
			break;
		
		case 1:
			lines = engine.console.scrollback
			lnnum = engine.console.scrollby;
			currln = lines[lnnum];
			break;
		
	}
	
	return [lines, lnnum, currln];
}

function consoleScroll()
{
	var lines, lnnum, currln;
	[ lines, lnnum, currln ] = consoleInfo();
	
	if(!currln && lnnum != lines.length)
	{
		if(lnnum < 0) var scrby = 1;
		if(lnnum > lines.length) var scrby = -1;
		engine.console.scroll(scrby);
		console.log("scroll",scrby);
	}
	else
	{
		engine.console.time = performance.now();
		if(typeof(currln) != "undefined" && currln.length > 0) 
			engine.console.scroll();
		console.log("scroll");
	}
}

function consoleAutoScroll()
{
	var lines, lnnum; [ lines, lnnum ] = consoleInfo();
	
	if(
		Math.round(engine.console.time/engine.console.scrolltime) < Math.round(performance.now()/engine.console.scrolltime)
		|| 
		(performance.now() > engine.console.time_manual+engine.console.scrolltime_manual && lines.length-lnnum > 10)
	)
	{
		consoleScroll();
		setTimeout(consoleAutoScroll,10);
	}
}

window.addEventListener("load", function()
{
	setInterval(consoleAutoScroll, 2500);
});


var cameraCustom = function(cycle, timestep, backOffset, riseOffset, lookOffset, turnSpeed)
{
	if(engine.camera.testrot === undefined) engine.camera.testrot = cycle.rotation.z;
	engine.camera.testrot = normalizeRad(engine.camera.testrot);
	
	var test = cycle.rotation.z - engine.camera.testrot;
	while(test < -Math.PI) test += Math.PI+Math.PI;
	while(test > Math.PI) test -= Math.PI+Math.PI;
	
	engine.camera.testrot += test*turnSpeed*timestep;
	
	engine.camera.position.set(
		cycle.position.x-Math.cos(engine.camera.testrot)*backOffset,
		cycle.position.y-Math.sin(engine.camera.testrot)*backOffset,
		riseOffset
	);
	
	engine.camera.lookAt(
		cycle.position.x+Math.cos(engine.camera.testrot)*lookOffset,
		cycle.position.y+Math.sin(engine.camera.testrot)*lookOffset,
		cycle.position.z
	);
}

//camera view function (handles all views for view target)
var cameraView = function(cycle, timestep) {
	var relativeCameraOffset, cameraOffset;
	var cameraEase = engine.cameraEase;
	
	if(engine.camera.userViewDir !== false) // HACK: camera rotation
	{
		var realRot = cycle.rotation.z;
		cycle.rotation.z = Math.atan2(engine.camera.userViewDir[1],engine.camera.userViewDir[0]);
		cycle.updateWorldMatrix();
		cycle.rotation.z = realRot;
	}

	switch(engine.view)
	{
		case 'smart':
			if(engine.camera.userViewDir === false)
			{
				//relativeCameraOffset = new THREE.Vector3(-5,0,5+cycle.speed);
				relativeCameraOffset = new THREE.Vector3(-5,0,(5+cycle.speed*0.006));
				cameraOffset = relativeCameraOffset.applyMatrix4(cycle.matrixWorld);
				engine.camera.position.x += (cameraOffset.x - engine.camera.position.x) * (engine.cameraEase/3) * timestep*60;
				engine.camera.position.y += (cameraOffset.y - engine.camera.position.y) * (engine.cameraEase/3) * timestep*60;
				engine.camera.position.z += (cameraOffset.z - engine.camera.position.z) * (engine.cameraEase/5) * timestep*60;
				engine.camera.lookAt(cycle.position);
				break;
			}
			else
			{
				relativeCameraOffset = new THREE.Vector3((-10-(cycle.speed*0.006)),0,(5+cycle.speed*0.006));
				cameraEase = 0.3;
				// [[FALLTHROUGH]]
			}
		case 'chase':
			if(!relativeCameraOffset) relativeCameraOffset = new THREE.Vector3((-10-(cycle.speed*0.006)),0,(15+cycle.speed*0.006));
			cameraOffset = relativeCameraOffset.applyMatrix4(cycle.matrixWorld);
			engine.camera.position.x += (cameraOffset.x - engine.camera.position.x) * cameraEase * timestep*60;
			engine.camera.position.y += (cameraOffset.y - engine.camera.position.y) * cameraEase * timestep*60;
			engine.camera.position.z += (cameraOffset.z - engine.camera.position.z) * cameraEase * timestep*60;
			engine.camera.lookAt(cycle.position);
			break;
		case 'custom':
			
			var realRot;
			if(engine.camera.userViewDir !== false) // HACK: camera rotation
			{
				realRot = cycle.rotation.z;
				engine.camera.testrot = cycle.rotation.z = Math.atan2(engine.camera.userViewDir[1],engine.camera.userViewDir[0]);
			}
			
			cameraCustom(cycle, timestep, 
				settings.CAMERA_CUSTOM_BACK+cycle.speed*settings.CAMERA_CUSTOM_BACK_FROMSPEED,
				settings.CAMERA_CUSTOM_RISE+cycle.speed*settings.CAMERA_CUSTOM_RISE_FROMSPEED,
				settings.CAMERA_CUSTOM_OFFSET+cycle.speed*settings.CAMERA_CUSTOM_OFFSET_FROMSPEED,
				settings.CAMERA_CUSTOM_TURN_SPEED,
			0);
			
			if(engine.camera.userViewDir !== false)
			{
				engine.camera.testrot = cycle.rotation.z = realRot;
			}
			
			break;
		case 'stationary':
			break;
		case 'track':
			engine.camera.lookAt(cycle.position);
			break;
		case 'topdown':
			engine.camera.position.set(cycle.position.x, (cycle.position.y-0.01), (10+cycle.speed*timestep));
			engine.camera.lookAt(cycle.position);
			break;
		case 'birdseye':
			relativeCameraOffset = new THREE.Vector3(-0.1, 0, 10+(cycle.speed*timestep));
			cameraOffset = relativeCameraOffset.applyMatrix4(cycle.matrixWorld);
			engine.camera.position.x += (cameraOffset.x - engine.camera.position.x) * engine.cameraEase * timestep*60;
			engine.camera.position.y += (cameraOffset.y - engine.camera.position.y) * engine.cameraEase * timestep*60;
			engine.camera.position.z += (cameraOffset.z - engine.camera.position.z) * engine.cameraEase * timestep*60;
//			engine.camera.position.set(cycle.position.x, cycle.position.y, (10+cycle.speed));
//			engine.camera.rotation.z = cycle.rotation.z;
	 		engine.camera.lookAt(cycle.position);
			break;
		case 'cockpit':
			/**/// cockpit
			//if(cycle.speed > 2)
			{
				relativeCameraOffset = new THREE.Vector3(-2+(2.5*cycle.speed),0,0.5);
			}
			/*else
			{
				relativeCameraOffset = new THREE.Vector3(0.01,0,0.5);
			}*/
			cameraOffset = relativeCameraOffset.applyMatrix4(cycle.matrixWorld);
			engine.camera.position.set(cycle.position.x,cycle.position.y,cycle.position.z+0.5);
			//engine.camera.rotation.set(cycle.rotation.x,cycle.rotation.y,0);
//			engine.camera.position.x += (cameraOffset.x - engine.camera.position.x) * 0.5;
//			engine.camera.position.y += (cameraOffset.y - engine.camera.position.y) * 0.5;
//			engine.camera.position.z = 2;
		 	engine.camera.lookAt(cameraOffset);
			//engine.camera.rotation.z = cycle.rotation.x+cycle.rotation.y;

//		 	cycle.audio.gain.setTargetAtTime(0.2, engine.audio.currentTime, 0.02);
			//cycle.textLabel.style.visibility = 'hidden';
			//cycle.model.visible = false;

			/*/
			if (cycle.walls.children[cycle.walls.children.length-2]) {
				cycle.walls.children[cycle.walls.children.length-1].visible = false;
				cycle.walls.children[cycle.walls.children.length-2].visible = true;
			}
			/**/
			break;
	}
};
