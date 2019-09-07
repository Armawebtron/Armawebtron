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

//resize window listener function
var resizeWindow = function()
{
	if(engine.renderer)
	{
		engine.renderer.setSize(window.innerWidth,window.innerHeight);
		engine.renderer.render(engine.scene, engine.camera);
	}
	if(engine.camera)
	{
		engine.camera.aspect = window.innerWidth / window.innerHeight;
		engine.camera.updateProjectionMatrix();
	}
};

function init() 
{
	//set renderer after detecting available renderer
	if (Detector.webgl) { engine.renderer = new THREE.WebGLRenderer({ antialias: true });}
	else { engine.renderer = new THREE.SoftwareRenderer(); engine.usingWebgl = false; }
	engine.renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(engine.renderer.domElement);
	engine.scene = new THREE.Scene();
	loadTextures();
	window.addEventListener('touchstart',touchControl);
	window.addEventListener('resize',resizeWindow);
}


function gameLostTab()
{
	if(engine.inputState == 'game') { pauseMenuToggle(); console.log("PAUSED because the tab lost focus"); }
}

function gameLostFocus()
{
	if(engine.inputState == 'game') { engine.players[engine.activePlayer].chatting = true; updateScoreBoard() }
}
function gameGainedFocus()
{
	if(engine.inputState == 'game') { engine.players[engine.activePlayer].chatting = false; updateScoreBoard() }
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
