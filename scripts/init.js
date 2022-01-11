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

//resize window listener function
var resizeWindow = function()
{
	if(engine.camera)
	{
		engine.camera.aspect = window.innerWidth / window.innerHeight;
		engine.camera.updateProjectionMatrix();
	}
	if(engine.renderer)
	{
		engine.renderer.setSize(window.innerWidth,window.innerHeight);
		engine.renderer.context.canvas.style.width = window.innerWidth+"px";
		engine.renderer.context.canvas.style.height = window.innerHeight+"px";
		engine.renderer.render(engine.scene, engine.camera);
	}
	if(engine.composer)
	{
		engine.composer.setSize(window.innerWidth,window.innerHeight);
	}
	if(engine.extraCanvas)
	{
		engine.extraCanvas.width = window.innerWidth;
		engine.extraCanvas.height = window.innerHeight;
		engine.extraCanvas.ctx = engine.extraCanvas.getContext("2d");
	}
};

var sfC = {getMaxAnisotropy:function(){return 1;}};

window.initRenderer = function()
{
	if(engine.renderer) try
	{
		document.body.removeChild(engine.renderer.domElement);
	}
	catch(e)
	{
		console.error(e);
	}
	
	engine.usingPostProcessing = false;
	
	//set renderer after detecting available renderer
	if(Detector.webgl)
	{
		engine.renderer = new THREE.WebGLRenderer({ 
			antialias: settings.ANTIALIAS && !settings.POSTPROCESSING,
		});
		engine.usingWebgl = true;
		if(settings.POSTPROCESSING)
		{
			if(!THREE.EffectComposer)
			{
				engine.console.print("Loading post-processing composer...\n");
				include("scripts/lib/PostProcessing/EffectComposer.js", initRenderer);
				return;
			}
			if(!THREE.ShaderPass)
			{
				engine.console.print("Loading post-processing shader pass...\n");
				include("scripts/lib/PostProcessing/ShaderPass.js", initRenderer);
				return;
			}
			if(!THREE.RenderPass)
			{
				engine.console.print("Loading post-processing render pass...\n");
				include("scripts/lib/PostProcessing/RenderPass.js", initRenderer);
				return;
			}
			if( settings.POSTPROCESSING_FXAA && !THREE.FXAAShader )
			{
				engine.console.print("Loading FXAA Shader...\n");
				include("scripts/lib/PostProcessing/FXAAShader.js", initRenderer);
				return;
			}
			if( settings.POSTPROCESSING_BLOOM && !THREE.UnrealBloomPass )
			{
				engine.console.print("Loading post-processing bloom pass...\n");
				include("scripts/lib/PostProcessing/UnrealBloomPass.js", initRenderer);
				return;
			}
			
			engine.composer = new THREE.EffectComposer( engine.renderer );
			engine.composer.addRenderPass = function()
			{
				if( engine.composer.passes[0] instanceof THREE.RenderPass )
				{
					engine.composer.passes[0].scene = engine.scene;
					engine.composer.passes[0].camera = engine.camera;
				}
				else
				{
					engine.composer.passes.unshift( new THREE.RenderPass( engine.scene, engine.camera ) )
				}
				
				if(engine.composer.bokeh)
				{
					engine.composer.bokeh.scene = engine.scene;
					engine.composer.bokeh.camera = engine.camera;
				}
				
			};
			if( engine.scene && engine.camera )
			{
				engine.composer.addRenderPass();
			}
			
			if( settings.POSTPROCESSING_BLOOM )
			{
				engine.composer.bloom = new THREE.UnrealBloomPass( { x: window.innerWidth, y: window.innerHeight } );
				engine.composer.addPass( engine.composer.bloom );
				
				engine.composer.bloom.threshold = 0.1;
				engine.composer.bloom.strength = 0.5;
				engine.composer.bloom.radius = 0;
			}
			
			if( settings.POSTPROCESSING_FXAA )
			{
				engine.composer.addPass( new THREE.ShaderPass( THREE.FXAAShader ) );
			}
			
			engine.usingPostProcessing = true;
		}
	}
	else
	{
		confForSoftwareRenderer();
		engine.renderer = new THREE.SoftwareRenderer();
		engine.usingWebgl = false;
		engine.renderer.capabilities = sfC;
	}
	resizeWindow();
	
	document.body.appendChild(engine.renderer.domElement);
};

window.init = function() 
{
	//let's load settings first.
	loadsettingcfgs();
	window.onbeforeunload = saveusercfg;
	engine.scene = new THREE.Scene();
	if(engine.dedicated) return;
	engine.extraCanvas = document.getElementById("extraCanvas");
	initRenderer();
	if(!engine.audio && settings.SOUND_QUALITY > 0) try { initSound(); }
	catch(e) { console.error(e); alert("Sound could not be initialized!"); }
	loadTextures();
	window.addEventListener('touchstart',touchControl);
	window.addEventListener('resize',resizeWindow);
	window.addEventListener("resize",function() { if(engine.composer) initRenderer(); } );
}


function gameLostTab()
{
	if(engine.inputState == 'game') { pauseMenuToggle(); console.log("PAUSED because the tab lost focus"); }
}

function gameLostFocus()
{
	if(engine.inputState == 'game') { engine.players[engine.activePlayer].chatting = true; game.updateScoreBoard() }
}
function gameGainedFocus()
{
	if(engine.inputState == 'game') { engine.players[engine.activePlayer].chatting = false; game.updateScoreBoard() }
}

window.onblur = gameLostFocus;
window.onfocus = gameGainedFocus;

window.onload = function()
{
	if(!engine.scene) init();

	httpGetAsync("layout/menu.xml",function(output){
		engine.menu = xmlify(output); menu('menu:main'); aamenurender();
		if(typeof(_GET["ssl"]) != "undefined")
		{
			chsetting("CONNECT_SSL",_GET["ssl"]);
		}
		if(typeof(_GET["preset"]) != "undefined")
		{
			menu('menu:preset_loaded');menu('menu:preset_loaded');
			menu('menu:loading');
			preset(_GET["preset"]);
		}
		else if(typeof(_GET["connect"]) != "undefined")
		{
			var s = _GET["connect"].split(":");
			settings.CONNECT_HOST = ""+s[0];
			if(s.length > 1) settings.CONNECT_PORT = s[1];
			connectToGame();
		}
	});

	//keyboard input
	window.addEventListener('keydown', keyboardKeyDown );
	window.addEventListener('keyup', keyboardKeyUp );


	(function() {//event listener cross browser support for auto-pause when focus lost
		'use strict';
		
		// Set the name of the "hidden" property and the change event for visibility
		var hidden, visibilityChange; 
		if (typeof document.hidden !== "undefined") {
			hidden = "hidden";
			visibilityChange = "visibilitychange";
		} else if (typeof document.mozHidden !== "undefined") { // Firefox up to v17
			hidden = "mozHidden";
			visibilityChange = "mozvisibilitychange";
		} else if (typeof document.webkitHidden !== "undefined") { // Chrome up to v32, Android up to v4.4, Blackberry up to v10
			hidden = "webkitHidden";
			visibilityChange = "webkitvisibilitychange";
		}

		var handleVisibilityChange = function() { if(document[hidden]) gameLostTab() };

		// Warn if the browser doesn't support addEventListener or the Page Visibility API
		if (typeof document.addEventListener === "undefined" || typeof document[hidden] === "undefined") {
			alert("AUTO-PAUSE UNAVAILABLE");
		} else {
			// Handle page visibility change   
			document.addEventListener(visibilityChange, handleVisibilityChange, false);
		}

	})();



}    
