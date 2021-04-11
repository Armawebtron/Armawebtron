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

engine = {
	dedicated: false,
	
	paused: false,//
	inputState: '', inputStatePrev: '',
	
	lastRenderTime: 0,//used in rendering loop
	lastGameTime: 0,
	fpsTime: 0,	//render loop
	timeStart: 0,
	timeEnd: 0,//timer vars
	totalPauseTime: 0,
	startOfPause: 0,//used to prevent delta from offsetting due to pause
	framesCount: 0,
	avgTimeStep: 0,
	gtime:-Infinity,
	lastSyncTime:-Infinity,
	lastScoreTime:-Infinity,
	
	cMFadeOutAfter: Infinity,
	
	//net
	network: false,
	activePlayer: 0,

	//game stats	
	fastestPlayer: 0, fastestSpeed: 0,
	deaths: 0,

	//render loop toggles
	//hasplayed: false,//used for playing again, reinitializing the render for another go (after having gone back to menus from it first)
	currrim3clr: 0,

	//info
	usingWebgl: true,//variable to toggle webgl features
	usingPostProcessing: false,//toggle for post processing features
	
	concatch: undefined, msgcatch: undefined,
	
	//fonts
	font: 'Armagetronad',//active font face
	fonts: ['Armagetronad','Flynn','monospace','nicefont','sans-serif','serif'],
	
	textures: {},
	models: {},
	
	//map data
	currrot: 0, //rotation
	loadedMap: "Anonymous/polygon/regular/square-1.0.1.aamap.xml",
	//default:
	mapString: '\<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?\>\n\<!DOCTYPE Resource SYSTEM \"AATeam/map-0.2.8.0_rc4.dtd\"\>\n\<Resource type=\"aamap\" name=\"square\" version=\"1.0.1\" author=\"Anonymous\" category=\"polygon/regular\"\>\n\t\<Map version=\"2\"\>\n\t\t\<!-- The original square map, technically created by z-man.\n\t         Converted to XML by philippeqc.\n\t         License: Public Domain. Do with it what you want.\n        --\>\n\n\t\t\<World\>\n\t\t\t\<Field\>\n\t\t\t\t\<Spawn\tx=\"255\"\ty=\"50\"\txdir=\"0\"\tydir=\"1\"\t/\>\n\t\t\t\t\<Spawn\tx=\"245\"\ty=\"450\"\txdir=\"0\"\tydir=\"-1\"\t/\>\n\t\t\t\t\<Spawn\tx=\"50\"\ty=\"245\"\txdir=\"1\"\tydir=\"0\"\t/\>\n\t\t\t\t\<Spawn\tx=\"450\"\ty=\"255\"\txdir=\"-1\"\tydir=\"0\"\t/\>\n\n\t\t\t\t\<Spawn\tx=\"305\"\ty=\"100\"\txdir=\"0\"\tydir=\"1\"\t/\>\n\t\t\t\t\<Spawn\tx=\"195\"\ty=\"400\"\txdir=\"0\"\tydir=\"-1\"\t/\>\n\t\t\t\t\<Spawn\tx=\"100\"\ty=\"195\"\txdir=\"1\"\tydir=\"0\"\t/\>\n\t\t\t\t\<Spawn\tx=\"400\"\ty=\"305\"\txdir=\"-1\"\tydir=\"0\"\t/\>\n\n\t\t\t\t\<Spawn\tx=\"205\"\ty=\"100\"\txdir=\"0\"\tydir=\"1\"\t/\>\n\t\t\t\t\<Spawn\tx=\"295\"\ty=\"400\"\txdir=\"0\"\tydir=\"-1\"\t/\>\n\t\t\t\t\<Spawn\tx=\"100\"\ty=\"295\"\txdir=\"1\"\tydir=\"0\"\t/\>\n\t\t\t\t\<Spawn\tx=\"400\"\ty=\"205\"\txdir=\"-1\"\tydir=\"0\"\t/\>\n\n\t\t\t\t\<Wall\>\n\t\t\t\t\t\<Point\tx=\"0\"\ty=\"0\"\t/\>\n\t\t\t\t\t\<Point\tx=\"0\"\ty=\"500\"\t/\>\n\t\t\t\t\t\<Point\tx=\"500\"\ty=\"500\"\t/\>\n\t\t\t\t\t\<Point\tx=\"500\"\ty=\"0\"\t/\>\n\t\t\t\t\t\<Point\tx=\"0\"\ty=\"0\"\t/\>\n\t\t\t\t\</Wall\>\n\t\t\t\</Field\>\n\t\t\</World\>\n\t\</Map\>\n\</Resource\>',

	mapXML: false,
	
	//scene vars
	renderer: false,
	scene: false,
	composer: false,//for post processing

	//camera stuff
	camera: false,//needed or any camera
	cameraOrbit: false,//
	view: 'smart',
	views: ['smart','chase','stationary','track','topdown','birdseye','cockpit'],
	cameraEase: 0.08,
	viewTarget: 0,

	menus: [],
	
	//sound
	sound: false,
	useSound: true,
	retroSound: true,
//
	//scene objects (just used for render)
	grid: false,
	walls: false,
	zones: {children:0},
	
	//is running
	gameRunning: false,
	renderRunning: false,
	
	uRound: false, //timeout ID for new round
	
	//FOR PLAYER OBJECTS
	//game stuff
	playersById: [],//array of player objects (info)
	playersByScore: [],
	
	teams: [],//array of team objects
	
	round: 0,
	delayedcommands: {},
};

if(typeof(Proxy) !== "undefined")
{
	engine.players = new Proxy(engine.playersById,{
		apply: function(t,arg,ls)
		{
			return arg[t].apply(this,ls);
		},
		deleteProperty: function(t,id)
		{
			if(!isNaN(id))
			{
				for(var x=engine.playersByScore.length-1;x>=0;--x)
				{
					if(t[id] == engine.playersByScore[x])
					{
						engine.playersByScore.splice(x,1);
					}
				}
			}
			return true;
		},
		set: function(t,id,val)
		{
			if(!isNaN(id))
			{
				for(var x=engine.playersByScore.length-1;x>=0;--x)
				{
					if(t[id] == engine.playersByScore[x])
					{
						engine.playersByScore[x] = val;
						game.updateScoreBoard();
						t[id] = val;
						return true;
					}
				}
				engine.playersByScore.push(val);
			}
			t[id] = val;
			return true;
		},
	});
}
else
{
	//hacky workaround, only for browsers without Proxy support (very few)
	engine.players = engine.playersById;
	engine.players.prevLength = -1;
	setInterval(function()
	{
		if(engine.players.length != engine.players.prevLength)
		{
			engine.players.prevLength = engine.players.length;
			engine.playersByScore.splice(0);
			for(var x=engine.playersById.length-1;x>=0;--x)
			{
				engine.playersByScore.push(engine.playersById[x]);
			}
			game.updateScoreBoard();
		} 
	},1000);
}

settings.engine = engine; //hack to allow menu to change engine config. (Potentially insecure?)

//CONSOLE, HUD
if(typeof(document) !== "undefined")
{
	engine.console = document.getElementById("console");
	engine.console.time = 0;
	engine.console.time_manual = 0;
	engine.console.print = function(str) 
	{ 
		//this.append("  "+str); 
		if(engine.concatch) 
		{
			if(engine.concatch.type == "all") engine.concatch.to.append(str);
			else if(engine.concatch.type == "list") engine.concatch.to.push(str);
			else engine.concatch.to.innerText = str;
		}
		if(settings.TEXT_OUT_MODE == 1)
		{
			this.scrollback.push(str);
		}
		this.innerHTML += "  "+replaceColors(htmlEntities(str));
		//console.log(replaceColors(str));
		this.time = performance.now()+this.scrolltime; 
		if(!inround()||!settings.TEXT_OUT()) console.log("[CON] "+str);
	}
	engine.console.scrollby = 0;
	engine.console.scrolltime = 5000;
	engine.console.scrolltime_manual = 30000;
	engine.console.time_manual -= engine.console.scrolltime_manual;
	engine.console.scroll = function(times=1)
	{
		if(settings.TEXT_OUT_MODE == 1)
		{
			this.scrollby+=times; this.innerHTML = "";
			for(var i=this.scrollby;i<engine.console.scrollback.length;i++)
			{
				this.innerHTML += "  "+replaceColors(htmlEntities(this.scrollback[i]));
			}
		}
		else
		{
			//this.scrollby = parseFloat(window.getComputedStyle(this).getPropertyValue('font-size'))+6;
			//this.scrollby = this.children[0].offsetHeight;
			var orig = parseFloat(this.style.top)/this.scrollby;
			this.scrollby = this.offsetHeight/this.innerText.split("\n").length;
			
			if(this.style.top == '') this.style.top = 0;
			//this.style.top = (parseFloat(this.style.top)-(this.scrollby*times))+"px";
			this.style.top = ((this.scrollby*orig)-(this.scrollby*times))+"px";
		}
	}
	if(settings.TEXT_OUT_MODE == 1)
	{
		engine.console.scrollback = [];
		engine.console.style.top = "-16px";
	}
	engine.console.scroll();
	
	engine.hud = document.getElementById("HUD");
	engine.hud.hide = function(){this.style.opacity=0;};
	engine.hud.show = function(){this.style.opacity=1;};
	engine.hud.basic = document.getElementById("gui_stats");
	engine.hud.game = document.getElementById("game_stats");
	engine.hud.fadein = true;
}
else
{
	engine.console = {style:{}};
	engine.console.print = function(str,netSend=true,doPrint=true) 
	{ 
		if(doPrint) 
		{
			process.stdout.write(removeColors(str));
			if(engine.concatch) 
			{
				if(engine.concatch.type == "all") engine.concatch.to.append(str);
				else if(engine.concatch.type == "list") engine.concatch.to.push(str);
				else engine.concatch.to.innerText = str;
			}
		}
		if(netSend !== false && window.svr) //send over network
		{
			var data = {type:"con",data:str};
			switch(typeof(netSend))
			{
				case "boolean":
					window.svr.send(data);
					break;
				case "object":
					var lookForID = engine.players.indexOf(netSend);
					for(var i=window.svr.clients.length-1;i>=0;--i)
					{
						if(window.svr.clients[i].netid == lookForID)
						{
							window.svr.clients[i].send(data);
						}
					}
					break;
			}
		}
	};
}


/*///team objects:
-name
-array of player IDs (order of shuffle)
-team score


/**/


//which controls are pressed down get added to arrays
var temp_items = Object.keys(settings.controls);
engine.controls = {pressed:[]};
for(var i=0;i<temp_items.length;i++)
{
	engine.controls[temp_items[i]] = []; //array of keycodes that are pressed within a frame, removed when lifted
}


engine.map = { //virtual map data (used for positions, lines and stuff to calculate)
	zones: [],
	spawns: [],
	walls: [],

};
