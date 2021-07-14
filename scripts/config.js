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

/*class Setting
{
	constructor(conf)
	{
		switch(typeof(conf))
		{
			case "object": this = conf; break;
		}
		
	}
	push()
	{
		settings_work[this.name] = this;
		settings[this.name] = this.val;
	}
}

//new Setting({name:"VERIFY_COLOR_STRICT",val:false}).push();

var settings_work = {};*/

settings = {
	VERIFY_COLOR_STRICT: false,
	TEXT_BRIGHTEN: false,
	TEXT_DARK_HIGHLIGHT: true,
	FONT_MIN_R: 0.5, FONT_MIN_G: 0.5, FONT_MIN_B: 0.5,
	FONT_MIN_TOTAL: 0.7,
	CHAT_LAYER: 0.5,
	TEXT_OUT: function(params=undefined){if(params !== undefined) engine.console.style.display=params?"block":"none"; return engine.console.style.display!="none";},
	TEXT_OUT_MODE: 1,
	
	FULLSCREEN: function(params=undefined){
		if(params !== undefined) 
		{ 
			var bd = document.body;
			if(params)
			{
				if(bd.requestFullscreen) bd.requestFullscreen();
				else if(bd.webkitRequestFullscreen) bd.webkitRequestFullscreen();
				else if(bd.mozRequestFullScreen) bd.mozRequestFullScreen();
				else if(bd.msRequestFullscreen) bd.msRequestFullscreen();
				else alert("Can't go into fullscreen. Please alert nelg with information on what browser you're using.")
			}
			else
			{
				if(bd.exitFullscreen) bd.exitFullscreen();
				else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
				else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
				//else if(document.msCancelFullscreen) bd.msCancelFullscreen();
				else alert("Can't exit fullscreen. Please alert nelg with information on what browser you're using")
			}
		}
		return Boolean(window.fullScreen || document.mozFullScreen || document.msFullScreen || document.webkitIsFullScreen || window.outerHeight - window.innerHeight <= 1);
	},
	
	//CAMERA
	CAMERA_FOV: 60,
	CAMERA_NEAR_RENDER: 0.04,
	CAMERA_FAR_RENDER: 2000,
	
	// settings for camera types
	"CAMERA_CUSTOM_BACK": 6,
	"CAMERA_CUSTOM_BACK_FROMSPEED": 0.5,
	"CAMERA_CUSTOM_RISE": 4,
	"CAMERA_CUSTOM_RISE_FROMSPEED": 0.4,
	"CAMERA_CUSTOM_TURN_SPEED": 4,
	"CAMERA_CUSTOM_OFFSET": 3,
	"CAMERA_CUSTOM_OFFSET_FROMSPEED": 0.1,
	
	//GAME
	GRID_SIZE: 1,
	/*FLOOR_RED: 0.75,
	FLOOR_GREEN: 0.75,
	FLOOR_BLUE: 0.98,*/
	FLOOR_RED: 0.03,
	FLOOR_GREEN: 0.266,
	FLOOR_BLUE: 0.8,
	FLOOR_TEXTURE: "textures/floor.png",
	/*GRID_SIZE: 2,
	FLOOR_RED: 1,
	FLOOR_GREEN: 1,
	FLOOR_BLUE: 1,
	FLOOR_TEXTURE: "textures/moviepack_t_r_u_e/floor.png",*/
	/*GRID_SIZE: 1,
	FLOOR_RED: 0.01,
	FLOOR_GREEN: 0.14,
	FLOOR_BLUE: 0.35,
	FLOOR_TEXTURE: "textures/aaold/floor.png",*/
	
	FLOOR_MIRROR: false,
	FLOOR_MIRROR_INT: 1,
	
	FLOOR_DETAIL: 3, //0=off, 1=line, 2=good, 3=best
	
	CYCLE_TEXTURES: ["textures/cycle_body.png","textures/cycle_wheel.png"],
	
	EXPLOSIONS: true,
	HIGH_RIM: true,
	HIGH_RIM_HEIGHT: 50,
	LOW_RIM_HEIGHT: 4,
	
	RIM_WALL_RED: 0,
	RIM_WALL_GREEN: 0, // 0.533
	RIM_WALL_BLUE: 0, // 1
	RIM_WALL_ALPHA: 0.9,
	RIM_WALL_COLOR_MODE: 3,
	RIM_WALL_STRETCH_X: 50,
	RIM_WALL_STRETCH_Y: 13.5,
	RIM_WALL_WRAP_Y: false,
	RIM_WALL_REPEAT_TOP: false,
	RIM_WALL_TEXTURE: "textures/futurerim.png",
	RIM_WALL_DEPTH: true,
	RIM_WALL_LOWEST_HEIGHT: 0,
	RIM_WALL_BELOW_HEIGHT_COLOR_R: 0,
	RIM_WALL_BELOW_HEIGHT_COLOR_G: 0,
	RIM_WALL_BELOW_HEIGHT_COLOR_B: 0,
	
	/*RIM_WALL_RED: 1,
	RIM_WALL_GREEN: 1,
	RIM_WALL_BLUE: 1,
	RIM_WALL_ALPHA: 1,
	RIM_WALL_COLOR_MODE: 0,
	//RIM_WALL_STRETCH_X: 300,
	//RIM_WALL_STRETCH_Y: 50,
	RIM_WALL_STRETCH_X: 128,
	RIM_WALL_STRETCH_Y: 32,
	LOW_RIM_HEIGHT: 32,
	RIM_WALL_WRAP_Y: false,
	RIM_WALL_TEXTURE: "textures/moviepack_eddkeefe/rim_wall.png",
	RIM_WALL_LOWEST_HEIGHT: 32,
	RIM_WALL_BELOW_HEIGHT_COLOR_R: 166/255,
	RIM_WALL_BELOW_HEIGHT_COLOR_G: 45/255,
	RIM_WALL_BELOW_HEIGHT_COLOR_B: 237/255,//*/
	
	RIM_WALL_RED: 1,
	RIM_WALL_GREEN: 1,
	RIM_WALL_BLUE: 1,
	RIM_WALL_ALPHA: 1,
	RIM_WALL_COLOR_MODE: 0,
	//RIM_WALL_STRETCH_X: 300,
	//RIM_WALL_STRETCH_Y: 50,
	RIM_WALL_STRETCH_X: 1536,
	RIM_WALL_STRETCH_Y: 32,
	HIGH_RIM_HEIGHT: 32,
	RIM_WALL_WRAP_Y: false,
	RIM_WALL_TEXTURE: "textures/moviepack_t_r_u_e/movie-rim-wall.png",
	RIM_WALL_DEPTH: true,
	RIM_WALL_LOWEST_HEIGHT: 32,
	/*RIM_WALL_BELOW_HEIGHT_COLOR_R: 188/255,
	RIM_WALL_BELOW_HEIGHT_COLOR_G: 206/255,
	RIM_WALL_BELOW_HEIGHT_COLOR_B: 250/255,//*/
	RIM_WALL_BELOW_HEIGHT_COLOR_R: 0.5,
	RIM_WALL_BELOW_HEIGHT_COLOR_G: 0.5,
	RIM_WALL_BELOW_HEIGHT_COLOR_B: 0.7,
	
	COLOR_MODE_3_COLORS: "1,0,0;1,1,0;0,1,0;0,1,1;0,0,1;1,0,1",
	COLOR_MODE_3_SPEED: 0.2,
	
	ALPHA_BLEND: true,
	
	MENU_RENDER: "img",
	
	REDRAW_MODE: 0,
	TARGET_FPS: 1,
	MAX_TARGET_FPS: 1000,
	//DEDICATED_FPS: Infinity,
	DEDICATED_FPS: 40,
	GRAB_SENSORS_ON_TURN: true,
	CYCLE_SENSORS_RANGE: 100,
	GAME_LOOP: 0.5,
	TIME_FACTOR: 1,
	
	HUD_MAP: true,
	
	ADMIN_KILL_MESSAGE: true,
	
	//SOUNDS
	SOUND_QUALITY: 3,
	
	SOUNDS_INTRO: false,
	SOUNDS_EXTRO: false,
	SOUNDS_COUNTDOWN: true,
	SOUNDS_GO: false,
	SOUNDS_ZONES: false,
	
	MUSIC: 0,
	
	//ZONES
	ZONE_HEIGHT: 5,
	ZONE_SEGMENTS: 11,//arma render only
	ZONE_SEG_LENGTH: 0.5,//arma render only
	ZONE_ALPHA: 0.7,
	ZONE_SPIN_SPEED: 0.05,
	ZONE_RENDER_TYPE: 'arma',//cylinder or arma
	
	//player (for armagetron nabs) //can't have people changing these on a server
	PLAYER_1: function(val) { if(engine.dedicated) return (settings.PLAYER_1 = "Player 1");  if(typeof(val) != "undefined") {settings.players[0].name=val;} return settings.players[0].name; },
	COLOR_R_1: function(r=undefined) { if(engine.dedicated) return (settings.COLOR_R_1=13); return plnumcolors({r:r}).r },
	COLOR_G_1: function(g=undefined) { if(engine.dedicated) return (settings.COLOR_G_1=13); return plnumcolors({g:g}).g },
	COLOR_B_1: function(b=undefined) { if(engine.dedicated) return (settings.COLOR_B_1=0); return plnumcolors({b:b}).b },
	
	CFG_VERSION: 0,
	
	PLAYER_DEL_HIST_PERROUND: true, //what was this?
	
	TIMESTEP_MAX: 0.2,
	
	//debug
	DEBUG_EVERYONE_IS_AI: false,
	HACK_TURN_LEFT_WHEN_POSSIBLE: 0,
	HACK_TURN_RIGHT_WHEN_POSSIBLE: 0,
	HACK_TURN_SENSOR_DIST: 5,

	//NETWORK
	CONNECT_PORT: 5331,
	CONNECT_HOST: "armagetron.kevinh.us",
	CONNECT_SSL: true,
	CONNECT_TYPE: "3dc",
	
	CYCLE_SMOOTH_TIME: 0.3,
	CYCLE_SYNC_INTERVAL: 0.1,
	DEBUG_NETWORK_TURN_WAIT: true,
	
	SERVER_PORT: 5331,
	SERVER_NAME: "Unnamed Server",
	SERVER_DNS: "",
	SERVER_SSL_ENABLED: false,
	SERVER_SSL_KEY: "",
	SERVER_SSL_CERT: "",
};

if(!Detector.webgl)
{
	//choose better defaults for the software renderer
	settings.HIGH_RIM = false;
	settings.LOW_RIM_HEIGHT = 4;
	settings.RIM_WALL_TEXTURE = "";
	settings.RIM_WALL_DEPTH = false;
	settings.ALPHA_BLEND = false;
	settings.FLOOR_DETAIL = 2;
}

game_settings_default = {
	AI_FORCE_BRAKE: false,
	AI_TEAM: false,
	AI_DUAL_COLOR_NAME: false,
	CHATBOT_ALWAYS_ACTIVE: false,
	//CYCLE
	CYCLE_ACCEL: 10,
	CYCLE_ACCEL_ENEMY: 1,
	CYCLE_ACCEL_OFFSET: 2,
	CYCLE_ACCEL_RIM: 0,
	CYCLE_ACCEL_SELF: 1,
	CYCLE_ACCEL_SLINGSHOT: 1,
	CYCLE_ACCEL_TEAM: 1,
	CYCLE_ACCEL_TUNNEL: 1,
	CYCLE_WALL_NEAR: 6,

	CYCLE_BRAKE: 30,
	CYCLE_BRAKE_DEPLETE: 1,
	CYCLE_BRAKE_REFILL: 0.1,
	
	CYCLE_BOOST: 0,
	
	CYCLE_JUMP: 0.5,
	CYCLE_JUMP: 0,
	CYCLE_MIDAIR_JUMP: false,
	CYCLE_MIDAIR_TURN: false,
	CYCLE_WALL_RAMP_ENABLE: true,

	CYCLE_DELAY: 0.02,

	CYCLE_RUBBER: 5,
	CYCLE_RUBBER_TIME: 10,
	//CYCLE_RUBBER_TIMEBASED: 0,
	CYCLE_RUBBER_MINDISTANCE: 0.03,
	CYCLE_RUBBER_MINADJUST: 0.05,
	CYCLE_RUBBER_DEPLETE_RIM: true,
	CYCLE_RUBBER_DEPLETE_SELF: true,
	CYCLE_RUBBER_DEPLETE_ENEMY: true,

	CYCLE_SOUND_SPEED: 30,

	CYCLE_SPEED: 20,
	CYCLE_SPEED_DECAY_ABOVE: 0.1,
	CYCLE_SPEED_DECAY_BELOW: 5,

	CYCLE_SPEED_MAX: 0,
	CYCLE_SPEED_MIN: 0.25,

	CYCLE_START_SPEED: 20,

	CYCLE_TURN_MEMORY: 3,
	
	CYCLE_TURN_SPEED_FACTOR: 0.95,

	WALLS_LENGTH: 600,
	//WALLS_LENGTH: 30,
	
	RESPAWN_TIME: -1,
	CYCLE_FIRST_SPAWN_PROTECTION: false,
	CYCLE_WALL_TIME: 5,
	CYCLE_INVULNERABILITY_TIME: -1,

	WALLS_STAY_UP_DELAY: 1,
	
	SP_HUMANS_COUNT: 1,
	//TEAMS
	TEAMS_MAX_PLAYERS: 1,
	TEAMS_MIN_PLAYERS: 1,
	TEAMS_MAX: 16,
	//TEAMS_MIN: 4,
	TEAMS_MIN: 2,
	TEAM_ALLOW_SHUFFLE_UP: 0,
	ALLOW_TEAM_NAME_PLAYER: true,
	ALLOW_TEAM_NAME_COLOR: true,
	MIN_PLAYERS: 1,
	NUM_AIS: 0,
	SP_NUM_AIS: 3,
	
	TEAM_NAME_1: "Team Blue",    //name of team 1
	TEAM_RED_1: 4,    //red portion of team 1's color
	TEAM_GREEN_1: 8,    //green portion of team 1's color
	TEAM_BLUE_1: 15,    //blue portion of team 1's color
	
	TEAM_NAME_2: "Team Gold",    //name of team 2
	TEAM_RED_2: 15,    //red portion of team 2's color
	TEAM_GREEN_2: 15,    //green portion of team 2's color
	TEAM_BLUE_2: 4,    //blue portion of team 2's color
	
	TEAM_NAME_3: "Team Red",    //name of team 3
	TEAM_RED_3: 15,    //red portion of team 3's color
	TEAM_GREEN_3: 4,    //green portion of team 3's color
	TEAM_BLUE_3: 4,    //blue portion of team 3's color
	
	TEAM_NAME_4: "Team Green",    //name of team 4
	TEAM_RED_4: 4,    //red portion of team 4's color
	TEAM_GREEN_4: 15,    //green portion of team 4's color
	TEAM_BLUE_4: 4,    //blue portion of team 4's color
	
	TEAM_NAME_5: "Team Violet",    //name of team 5
	TEAM_RED_5: 15,   //red portion of team 5's color
	TEAM_GREEN_5: 4,    //green portion of team 5's color
	TEAM_BLUE_5: 15,    //blue portion of team 5's color
	
	TEAM_NAME_6: "Team Cyan",    //name of team 6
	TEAM_RED_6: 4,    //red portion of team 6's color
	TEAM_GREEN_6: 15,    //green portion of team 6's color
	TEAM_BLUE_6: 15,    //blue portion of team 6's color
	
	TEAM_NAME_7: "Team White",    //name of team 7
	TEAM_RED_7: 15,    //red portion of team 7's color
	TEAM_GREEN_7: 15,    //green portion of team 7's color
	TEAM_BLUE_7: 15,    //blue portion of team 7's color
	
	TEAM_NAME_8: "Team Black",    //name of team 8
	TEAM_RED_8: 0,    //red portion of team 8's color
	TEAM_GREEN_8: 0,    //green portion of team 8's color
	TEAM_BLUE_8: 0,    //blue portion of team 8's color
	
	//MAP
	ARENA_AXES: 4,
	STRICT_AXES_SPAWN: true,
	RESOURCE_REPOSITORY_CACHE: './cache/resource/',
	MAP_FILE: 'Anonymous/polygon/regular/square-1.0.1.aamap.xml',
	MAP_ROTATION: "",
	ROTATION_TYPE: 0, //1:round, 2:match
	RESOURCE_REPOSITORY_SERVER: 'https://www.armanelgtron.tk/armagetronad/resource/',
	//RESOURCE_REPOSITORY_BACKUP: 'http://resource.armagetronad.net/resource/',
	SIZE_FACTOR: -3,
	ARENA_BOUNDARY: -10,
	ARENA_BOUNDARY_KILLS: true,
	
	ZONE_ALPHA_SERVER: 1,
	
	//GAME PLAY
	GAME_TYPE: 1,
	FINISH_TYPE: 2,
	LIMIT_ROUNDS: 10,
	LIMIT_TIME: 30,
	LIMIT_SCORE: 100,
	
	ROUND_WAIT: false,
	
	//SHOOTING
	SHOT_THRESH: 2,
	
	//WIN ZONE
	WIN_ZONE_DEATHS: false,
	WIN_ZONE_EXPANSION: 1,
	WIN_ZONE_INITIAL_SIZE: 5,
	WIN_ZONE_RANDOMNESS: 0.8,
	WIN_ZONE_MIN_LAST_DEATH: 30,
	WIN_ZONE_MIN_ROUND_TIME: Infinity, //60
	
	//FORTRESS
	FORTRESS_CONQUEST_RATE: 0.5,
	FORTRESS_CONQUEST_DECAY_RATE: 0.1,
	BASE_RESPAWN: false,
	
	//SPAWN
	SPAWN_WINGMEN_SIDE: 2.75362,
	SPAWN_WINGMEN_BACK: 2.202896,
	
	//ROUNDLY
	ROUND_COMMAND: "",
	ROUND_CONSOLE_MESSAGE: "",
	ROUND_CENTER_MESSAGE: "",
	
	//TARGET
	DEFAULT_TARGET_COMMAND: "",
	//TARGET_DECLARE_WINNER: true, 
	//TARGET_LIFETIME: -1,
	TARGET_INITIAL_SCORE: 10,
	//TARGET_SCORE_DEPLETE: 2,
	//TARGET_SURVIVE_TIME: 10,
	
	//BALL
	BALL_SPEED_DECAY: 0,
	BALL_SPEED_HIT_DECAY: 0,
};

sets = Object.keys(game_settings_default);
for(var i=0;i<sets.length;i++)
{
	settings[sets[i]] = game_settings_default[sets[i]];
}

//possible admin commands (methods)
var commands = {
	TOGGLE: function(params)
	{
		var split = params.split(" ");
		if(split.length == 0)
		{
			engine.console.print("Usage: TOGGLE command <arguments to toggle between, seperated by a space>");
			engine.console.print("If no additional arguments, toggles boolean commands between true and false.")
			return false;
		}
		var cmd = split[0].toUpperCase();
		if(split.length > 1)
		{
			var curr = chsetting(cmd,undefined,true), s = 0;
			for(var i=0;i<split.length;i++)
			{
				if(curr = split[i]) s = i+1;
			}
			chsetting(cmd,split[s]);
		}
		else
		{
			chsetting(cmd,!chsetting(cmd,undefined,true));
		}
	},
	CMD_VAL_ADD: function(params)
	{
		var split = params.split(" ");
		split[0] = split[0].toUpperCase();
		var from = chsetting(split[0],"",true);
		var to = null;
		switch(typeof(from))
		{
			case "number":
				to = from+(split[1]*1);
				break;
			case "string":
				to = from+split[1];
				break;
		}
		chsetting(split[0],to);
	},
	CMD_PASS_FUNC: function(params)
	{
		params=params.replace(/rand\((\d+),(\d+)\)/g,function(arg,v1,v2)
		{
			console.log(arg,v1,v2);
			return Math.round((Math.random()*(v2-v1))+v1);
		});
		loadcfg(params);
	},
	DELAY_COMMAND: function(params)
	{
		var interval=0,delay=0,cmd="";
		var s = params.split(" ");
		if(s[0][0] == "r") //assume repeat
		{
			interval = 1*(s.slice(0,1)[0].substr(1));
		}
		if(s[0][0] == "+")
		{
			delay = engine.gtime+(1*(s.slice(0,1)[0].substr(1)));
		}
		else
		{
			delay = 1*s.slice(0,1);
		}
		cmd = s.join(" ");
		engine.delayedcommands[delay] = [cmd,interval];
		engine.console.print("Delay command: \""+cmd+"\" at "+delay+"s, interval "+interval+"s.");
	},
	DELAY_COMMAND_CLEAR: function(params)
	{
		engine.delayedcommands = {};
		engine.console.print("Cleared all delayed commands.");
	},
	MERGE_OBJ: function(params)
	{
		var pos = params.indexOf(" ");
		var name = params.substr(0,pos), cfg = JSON.parse(params.substr(pos+1));
		var sets = Object.keys(cfg);
		for(var i=0;i<sets.length;i++)
		{
			if(typeof(settings[name][sets[i]]) != "undefined") settings[name][sets[i]] = cfg[sets[i]];
		}
	},
	FLOOR_RED: updategrid, FLOOR_GREEN: updategrid, FLOOR_BLUE: updategrid, GRID_SIZE: updategrid,
	CAMERA_FOV: function() {if(engine.camera){engine.camera.fov=settings.CAMERA_FOV;engine.camera.updateProjectionMatrix()}},
	CAMERA_NEAR_RENDER: function() {if(engine.camera){engine.camera.near=settings.CAMERA_NEAR_RENDER;engine.camera.updateProjectionMatrix()}},
	CAMERA_FAR_RENDER: function() {if(engine.camera){engine.camera.far=settings.CAMERA_FAR_RENDER;engine.camera.updateProjectionMatrix()}},
	SOUND_QUALITY: function()
	{
		settings.SOUND_QUALITY = parseInt(settings.SOUND_QUALITY);
		if(settings.SOUND_QUALITY > 3) settings.SOUND_QUALITY = 3;
		if(!engine.audio && settings.SOUND_QUALITY > 0)
		{
			try { initSound(); }
			catch(e)
			{
				console.error(e);
				engine.console.print("An error occurred while enabling sound. If your browser supports it, this may be a bug.\n",false);
			}
		}
		if(settings.SOUND_QUALITY < 0) settings.SOUND_QUALITY = 0;
		if(engine.audio && settings.SOUND_QUALITY == 0)
		{
			engine.audio.stopCycles();
			
			return;
		}
		switch(settings.SOUND_QUALITY)
		{
			case 1: p="HRTF"; engine.retroSound = true; break;
			case 2: p="HRTF"; engine.retroSound = true; break;
			case 3: p="equalpower"; engine.retroSound = false; break;
		}
		for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
		{
			engine.players[x].audio.panner.panningMode = p;
		}
		
	},
	HUD_MAP: function()
	{
		document.getElementById("canvas").style.display = settings.HUD_MAP?"block":"none";
	},
	START_NEW_MATCH: function()
	{
		engine.round = 0;
		engine.console.print("Resetting scores and starting new match after this round.");
		centerMessage("New Match");
	},
	CONSOLE_MESSAGE: function(param) { engine.console.print(param+"\n") },
	CENTER_MESSAGE: function(param) { centerMessage(param) },
	RENAME: function(params)
	{
		var s = params.split(" ");
		var p = getPlayer(s[0]);
		if(p)
		{
			p.forcedName = s[1];
			engine.console.print(p.getColoredName()+"0xRESETT will be renamed to "+p.forcedName+"0xRESETT.\n")
		}
	},
	ALLOW_RENAME_PLAYER: function(param)
	{ 
		var p = getPlayer(param);
		p.forceName = null;
		engine.console.print(p.getColoredName()+"0x7fff7f is allowed to rename.\n")
	},
	DISALLOW_RENAME_PLAYER: function(param)
	{ 
		var p = getPlayer(param);
		p.forceName = p.name;
		engine.console.print(p.getColoredName()+"0xff7f7f is not allowed to rename.\n")
	},
	SET_CYCLE_SPEED: function(params)
	{
		var s = params.split(" ");
		var p = getPlayer(s[0]);
		if(p) p.speed = s[1]*1;
	},
	SET_CYCLE_RUBBER: function(params)
	{
		var s = params.split(" ");
		var p = getPlayer(s[0]);
		if(p) p.rubber = s[1]*1;
	},
	SET_CYCLE_BRAKING: function(params)
	{
		var s = params.split(" ");
		var p = getPlayer(s[0]);
		if(p) p.braking = Boolean(1*s[1]);
	},
	SET_CYCLE_BRAKE: function(params)
	{
		var s = params.split(" ");
		var p = getPlayer(s[0]);
		if(p) p.brakes = s[2]*1;
	},
	RESPAWN: function(params)
	{
		var s = params.split(" ")
		var p = getPlayer(s[0]);
		if(p)
		{
			var cfg = {x:0,y:0,z:0,dir:0};
			if(s.length > 2)
			{
				cfg.x = s[1]*engine.REAL_ARENA_SIZE_FACTOR; cfg.y = s[2]*engine.REAL_ARENA_SIZE_FACTOR;
				if(s.length > 4)
				{
					cfg.dir = Math.atan2(s[4],s[3]);
					if(settings.STRICT_AXES_SPAWN)
					{
						var deg = (pi(2)/settings.ARENA_AXES);
						cfg.dir = Math.round(cfg.dir/deg)*deg;
					}
				}
			}
			p.spawn(cfg);
		}
	},
	KILL: function(params)
	{
		var p = getPlayer(params);
		if(p)
		{
			p.kill();
			if(settings.ADMIN_KILL_MESSAGE) 
				engine.console.print(p.getColoredName()+"0xRESETT has been smitten by an administrator.\n");
		}
	},
	KILL_ALL: function()
	{
		for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
		{
			engine.players[x].kill();
		}
	},
	RESPAWN_ALL: function()
	{
		for(var x=engine.players.length-1;x>=0;--x) if(typeof(engine.players[x]) != "undefined")
		{
			var cycle = engine.players[x];
			cycle.spawn({x:cycle.position.x||0,y:cycle.position.y||0,z:cycle.position.z||0,dir:cycle.rotation.z||0});
		}
	},
	INCLUDE: function(params,silent=false,callback=undefined)
	{
		var file = params.replace(/\(.+\)/g,"");
		var s = localStorage.getItem(file);
		if(s == null && !engine.dedicated)
		{
			var incfile = settings.RESOURCE_REPOSITORY_CACHE+"../config/"+params;
			engine.console.print("Loading CFG from "+incfile+"...\n");
			httpGetAsync(incfile,function(txt){loadcfg(txt,silent);if(callback != undefined)callback();});
		}
		else
		{
			loadcfg(s,silent); if(callback != undefined)callback();
		}
	},
	SINCLUDE: function(params) { commands.INCLUDE(params,true) },
	RINCLUDE: function(params,callback=undefined)
	{
		var file = params.replace(/\(.+\)/g,"");
		var incfile = settings.RESOURCE_REPOSITORY_SERVER+params;
		engine.console.print("Downloading CFG from "+incfile+"...\n");
		httpGetAsync(incfile,function(txt){loadcfg(txt);if(callback != undefined)callback();});
	},
	SPAWN_ZONE: function(params)
	{
		if(params == "")
		{
			engine.console.print("Usage:\nSPAWN_ZONE <win|death|ball|target|blast|object|koh> <x> <y> <size> <growth> <xdir> <ydir> <interactive> <r> <g> <b>\nSPAWN_ZONE <acceleration|speed> <speed> <x> <y> <size> <growth> <xdir> <ydir> <interactive> <r> <g> <b>\nSPAWN_ZONE <rubber|rubberadjust> <x> <y> <size> <growth> <xdir> <ydir> <rubber> <interactive> <r> <g> <b>\nSPAWN_ZONE <fortress|flag> <x> <y> <size> <growth> <xdir> <ydir> <interactive> <r> <g> <b>\n\nInstead of <x> <y> one can write: L <x1> <y1> <x2> <y2> [...] Z\nInstead of <size> one can write: P <scale> <x1> <y1> <x2> <y2> [...] Z");
		}
		else
		{
			var zone = {}, args = params.split(" ");
			if(args[0] == "n")
			{
				zone.name = args.slice(0,2)[1];
			}
			zone.type = args[0];
			if(zone.type == "acceleration" || zone.type == "speed")
			{
				zone.value = args.slice(1,2)[0];
			}
			if(args[1] === "L")
			{
				for(var i=2;args[i]=="Z"||i>args.length;i+=2)
				{
					if(i == 2)
					{
						zone.x = args[i]  *engine.REAL_ARENA_SIZE_FACTOR;
						zone.y = args[i+1]*engine.REAL_ARENA_SIZE_FACTOR;
					}
				}
				args.slice(2,i);
			}
			else
			{
				zone.x = args[1]*engine.REAL_ARENA_SIZE_FACTOR;
				zone.y = args[2]*engine.REAL_ARENA_SIZE_FACTOR;
			}
			if(args[3] === "P")
			{
				engine.console.print("WARNING: ShapePolygon may not currently work. Use at your own risk.\n",false);
				for(var i=3;args[i]=="Z"||i>args.length;i+=2)
				{
					
				}
				args.slice(3,i);
			}
			else
			{
				zone.radius = args[3]*engine.REAL_ARENA_SIZE_FACTOR;
			}
			zone.expansion = args[4]*1;
			zone.xdir = args[5]*1; zone.ydir = args[6]*1;
			zone.bounce = Boolean(parseInt+(args[7]))&&args[7]!="false";
			if(args[7] != undefined)
			{
				zone.color = new THREE.Color(args[7]/15,args[8]/15,args[9]/15);
			}
			new Zone(zone).spawn().netSync();
			//console.log("new Zone: "+zone);
		}
	},
	SPAWN_WALL: function(params)
	{
		if(params == "")
		{
			engine.console.print("Usage:\nSPAWN_WALL <height> <x1> <y1> <x2> <y2> [...]\n");
		}
		else
		{
			var params = params.split(" "), height = params.slice(0,1)[0]*1, points = [];
			for(var q=0;q<params.length;q+=2)
			{
				points.push(
					[
						params[q]*engine.REAL_ARENA_SIZE_FACTOR,
						params[q+1]*engine.REAL_ARENA_SIZE_FACTOR,
						0, height
					]
				);
			}
			engine.walls.add(buildWall(points,height));
			engine.map.walls.push(points);
		}
	},
	SET_ZONE_POSITION: function(params)
	{
		var args = params.split(" ");
		for(var x=engine.zones.children.length-1;x>=0;x--)
		{
			if(x == args[0])
			{
				engine.zones.children[x].position.x = args[1]*engine.REAL_ARENA_SIZE_FACTOR;
				engine.zones.children[x].position.y = args[2]*engine.REAL_ARENA_SIZE_FACTOR;
				engine.zones.children[x].cfg.netSync();
				return true;
			}
		}
		engine.console.print("Invalid zone ID\n");
	},
	SET_AI_PATH: function(params)
	{
		var args = params.split(" ");
		if(args[0] == "*")
		{
			
		}
		else
		{
			var cycle = getPlayer(args.shift());
			if(cycle)
			{
				for(var x=0,len=args.length;x<0;x+=2)
				{
					cycle.push([args[x],args[x+1]]);
				}
			}
			else
			{
				engine.console.print("Usage: <AI Player name> <x1> <y1> <x2> <y2> ...");
			}
		}
	},
	CLEAR_AI_POSITION: function(params)
	{
		
	},
	LIST_ZONES: function(params="")
	{
		var found = 0;
		for(var x=0,len=engine.zones.children.length;x<len;x++)
		{
			var outputstr = "ID "+x+": ";
			if(params == "" || outputstr.indexOf(params))
			{
				var zone = engine.zones[x];
				engine.console.print(outputstr+zone.cfg.type+" zone @ "+zone.position.x/engine.REAL_ARENA_SIZE_FACTOR+","+zone.position.y/engine.REAL_ARENA_SIZE_FACTOR+".\n");
				found++;
			}
		}
		engine.console.print("Listed "+found+"/"+len+" zones.\n");
	},
};
function updategrid() { if(!window.engine || !engine.scene) return; engine.scene.remove(engine.grid); buildGrid(); engine.scene.add(engine.grid); }

function armaColor(cycl,tail)
{
	if(tail > 0.25) return 31-(tail*15);
	else return cycl*15;
}

function plnumcolors(o)
{
	var r,g,b;
	if(typeof(o) == "object")
	{
		r=o.r; g=o.g; b=o.b;
	}
	var retr = typeof(r) != "undefined",retb=typeof(g) != "undefined",retg=typeof(b) != "undefined";
	var cycl=new THREE.Color(settings.players[0].cycleColor),
		tail=new THREE.Color(settings.players[0].tailColor);
	if(retr||retb||retg)
	{
		if(!retr) r=armaColor(cycl.r,tail.r);
		if(!retg) g=armaColor(cycl.g,tail.g);
		if(!retb) b=armaColor(cycl.r,tail.r);
		
		var c_red=r&15,c_grn=g&15,c_blue=b&15;
		var t_red=Math.max(15,r),t_grn=Math.max(15,g),t_blue=Math.max(15,b);
		settings.players[0].cycleColor = "#"+(new THREE.Color(c_red,c_grn,c_blue)).getHexString();
		settings.players[0].tailColor = "#"+(new THREE.Color(t_red,t_grn,t_blue)).getHexString();
	}
	return {r:armaColor(cycl.r,tail.r),g:armaColor(cycl.g,tail.g),b:armaColor(cycl.b,tail.b)};
}

function preset(name)
{
	var leave = (function()
	{
		console.log(engine.menus[engine.menus.length-2]);
		if(engine.menus[engine.menus.length-3] == "game")
		{
			//menu('exitmenu');
			game.play();
		}
		else for(var x=2;x--;) menu('exitmenu'); 
		if(settings.TEXT_OUT_MODE == 1)
		{
			var lines = engine.console.scrollback,lnnum = engine.console.scrollby;
		}
		else
		{
			var lines = engine.console.innerText.split("\n"),lnnum = (-(parseFloat(engine.console.style.top)/engine.console.scrollby));
		}
		engine.console.scroll(lines.length-lnnum-6); 
	});
	if(name != "default")
	{
		var tmp_settings = JSON.parse(JSON.stringify(game_settings_default));
		tmp_settings.CYCLE_SPEED = 20;
		tmp_settings.CYCLE_SPEED_DECAY_ABOVE = 0.1;
		tmp_settings.CYCLE_SPEED_DECAY_BELOW = 5;
		tmp_settings.CYCLE_BRAKE = 30;
		tmp_settings.CYCLE_RUBBER = 1;
		tmp_settings.WALLS_LENGTH = -1;
		tmp_settings.CYCLE_JUMP = 0;
	}
	switch(name)
	{
		case "default":
			applysettings(game_settings_default);
			break;
		case "zonetest":
			chsetting("MAP_FILE","nelg/test/zonetest-0.1.aamap.xml");
			chsetting("SIZE_FACTOR",6);
			setTimeout(function(){leave();},0);
			break;
		
		case "classic":
			applysettings(tmp_settings);
			setTimeout(function(){leave();},0);
			break;
		case "jump":
			applysettings(tmp_settings);
			chsetting("CYCLE_JUMP",0.6);
			setTimeout(function(){leave();},0);
			break;
		case "fort":
			applysettings(tmp_settings);
			commands.RINCLUDE("vov/configs/fortress.cfg",leave);
			break;
		case "styball":
			applysettings(tmp_settings);
			commands.INCLUDE("styball.cfg",false,leave);
			break;
		case "df":
			applysettings(tmp_settings);
			var rsrc = settings.RESOURCE_REPOSITORY_SERVER;
			commands.RINCLUDE("CFGs/df.cfg",function(){leave();chsetting("RESOURCE_REPOSITORY_SERVER",rsrc)});
			break;
		case "hr":
			applysettings(tmp_settings);
			commands.INCLUDE("tilthr_old.cfg",false,leave);
			break;
		case "ft":
			applysettings(tmp_settings);
			commands.RINCLUDE("vov/configs/fasttrack.cfg",function(){leave();loadcfg("SP_NUM_AIS 4\nALLOW_TEAM_NAME_COLOR 1")});
			break;
		case "racing":
			applysettings(tmp_settings);
			settings.CYCLE_JUMP = 0;
			settings.ARENA_AXES = 16;
			commands.INCLUDE("AoT/AdvancedRacing.cfg",false,leave);
			break;
		case "snake":
			applysettings(tmp_settings);
			settings.CYCLE_JUMP = 0;
			commands.INCLUDE("nelg/snake.cfg",false,leave);
			break;
		case "ctf":
			applysettings(tmp_settings);
			commands.RINCLUDE("vov/configs/ctf.cfg",function(){leave();loadcfg("SP_NUM_AIS 1\nALLOW_TEAM_NAME_COLOR 0")});
			break;
	}
	commands.KILL_ALL();
	return "";
}

function aamenurender(value)
{
	if(typeof(value) != "undefined") settings.MENU_RENDER = ""+value;
	var specificState = engine.inputState.split(':');
	if(specificState[0] == "menu") document.getElementById('menu').className = "noselect mainbg_"+settings.MENU_RENDER;
	document.getElementById('menu').style.backgroundColor = "rgb("+settings.FLOOR_RED*255+","+settings.FLOOR_GREEN*255+","+settings.FLOOR_BLUE*255+")";
	return settings.MENU_RENDER;
}

function aamenurender_nocallonreq(value) { if(value==undefined) return settings.MENU_RENDER; else aamenurender(value); }

var cmds = Object.keys(settings).concat(Object.keys(commands)).sort();

settings.controls = { //defaults declared
		left: [65,68,70,83],//a s d f
		right: [74,75,76,186],//j k l ;
		north:[], south:[], east:[], west:[],
		jump: [73],
		brake: [32],//space bar
		togglebrake: [86],//v
		boost: [],//up arrow or w
		toggleboost: [69],//v
		chat: [84],//t
		console: [192],//~
		camera: [67],//c
		look_left: [], look_right: [],
		look_forward: [], look_back: [],
		pause: [13],//enter
//		fullscreen: [122],//f11
		esc: [27],
		score: [9],
		scroll_up: [33],
		scroll_down: [34],
		scroll_end: [35],
//add glancing late

};

settings.instantchats = [
	{
		input: [49],
		text: "Well done!",
	},
	{
		input: [50],
		text: "Thank you!",
	},
	{
		input: [51],
		text: "Good match!",
	},
	{
		input: [115,52],
		text: "LOL!",
	},
]

function init_key(x=false) // ?
{
	switch(x)
	{
		case 0:
			
			break;
		case 1:
			
			break;
	}
	return 1*x;
}

settings.players = [];
settings.player = settings.players[0] = {
		name: 'Player 1',
		cycleColor: '#dddd00',
		tailColor: '#dddd00',
		engineType: 5,
		spectating: false,
};

function applysettings(array1)
{
	var sets = Object.keys(array1);
	for(i=0;i<sets.length;i++)
	{
		chsetting(sets[i],array1[i]);
	}
}

window.loadcfg = function(str,silent=false,dontforcecase=false)
{
	if(str == null) return false;
	var lines = str.split("\n");
	for(var i=0;i<lines.length;i++)
	{
		split = lines[i].replace(/\t/,"    ").trimLeft().split(" ");
		var cmd = "";
		if(!dontforcecase || (cmd != "FLOOR_RED" && cmd != "FLOOR_GREEN" && cmd != "FLOOR_BLUE" && cmd != "MENU_RENDER")) //HACK for user.cfg
		{
			cmd = split.shift();
		}
		chsetting(dontforcecase?cmd:cmd.toUpperCase(),split.join(" ").trimLeft(),silent);
	}
}

function importSets()
{
	fileOpen(loadcfg);
}

var _aacompatvars = ["PLAYER_1","COLOR_R_1","COLOR_G_1","COLOR_B_1"];

var uservars = [
	"CFG_VERSION",
//	"GRID_SIZE","FLOOR_RED","FLOOR_GREEN","FLOOR_BLUE",
	"SOUND_QUALITY",
	"EXPLOSIONS","HIGH_RIM","FLOOR_DETAIL",
	/*"MENU_RENDER",*/"REDRAW_MODE","MAX_TARGET_FPS",//"GAME_LOOP",
	"ZONE_HEIGHT","ZONE_SEGMENTS","ZONE_SEG_LENGTH","ZONE_ALPHA","ZONE_SPIN_SPEED","ZONE_RENDER_TYPE",
	"player","controls"
];

function exportUsrSets()
{
	var txt = "# Warning: Do NOT replace user.cfg with this file. This file doesn't directly replace their user.cfg and I claim no reponsibility for lost settings and/or broken clients.\n\n# Armagetron Compatibility\n";
	for(var i=0;i<_aacompatvars.length;i++)
	{
		txt += _aacompatvars[i]+" "+chsetting(_aacompatvars[i],undefined,true)+"\n";
	}
	for(var i=0;i<settings.instantchats.length;i++)
	{
		txt += "INSTANT_CHAT_STRING_1_"+(i+1)+" "+settings.instantchats[i].text+"\n";
	}
	txt += "\n# Native Armawebtron user.cfg settings. Most, but not all, also work with Armagetron.\n";
	for(var i=0;i<uservars.length;i++)
	{
		if(typeof(settings[uservars[i]]) == "object")
		{
			txt += "MERGE_OBJ "+uservars[i]+" "+JSON.stringify(settings[uservars[i]]);
		}
		else
		{
			txt += uservars[i]+" ";
			if(typeof(settings[uservars[i]]) == "boolean")
				txt += settings[uservars[i]]?1:0;
			else
				txt += settings[uservars[i]];
		}
		txt += "\n";
	}
	fileSave("user_3dcexport.cfg",txt);
}

/*function netcfg(setting,value)
{
	setting = setting.toUpperCase();
	for(var i=uservars.length;i--;)
	{
		if(uservars[i] == setting) return false;
	}
	return chsetting(setting,value,false," on net order");
}*/

var netChanged = [];

function netcfg(setting,value)
{
	setting = setting.toUpperCase();
	if(setting.indexOf("ROUND_") == 0 || setting.indexOf("RESOURCE_REPOSITORY_") == 0) return;
	for(var i=sets.length-1;i>=0;--i)
	{
		if(sets[i] == setting)
		{
			var settingFound = false;
			for(var i=netChanged.length-1;i>=0;--i)
			{
				if(netChanged[i][0] == setting) settingFound = true;
			}
			if(!settingFound) netChanged.push([setting,chsetting(setting,undefined,true)]);
			
			return "0xff7f7f"+chsetting(setting,value,false," on server order","0x808080");
		}
	}
	return false;
}

window.saveusercfg = function()
{
	var usercfg = "";
	for(var i=0;i<uservars.length;i++)
	{
		if(typeof(settings[uservars[i]]) == "object")
		{
			usercfg += "MERGE_OBJ "+uservars[i]+" "+JSON.stringify(settings[uservars[i]]);
		}
		else
		{
			usercfg += uservars[i]+" ";
			if(typeof(settings[uservars[i]]) == "boolean")
				usercfg += settings[uservars[i]]?1:0;
			else
				usercfg += settings[uservars[i]];
		}
		usercfg += "\n";
	}
	localStorage.setItem("user.cfg",usercfg);
}

function chsetting(setting,value,silent=false,txt="",pretxt="")
{
	if(setting[0] == "#" || setting == "") return;
	if(engine.network && txt == "" && typeof(value) != "undefined" && value != "")
	{
		for(var i=netChanged.length-1;i>=0;--i)
		{
			if(netChanged[i][0] == setting) return;
		}
	}
	var exec = false, ret = undefined;
	var event = getVarFromString(setting);
	if(typeof(event[0][event[1]]) != "undefined")
	{
		var from = event[0][event[1]];
		var isfunction = (typeof(from) == "function");
		if(isfunction) from = event[0][event[1]]();
		
		if(typeof(value) != "undefined" && value != "")
		{
			switch(typeof(from))
			{
				case "number":
					var to = parseFloat(value);
					if(isNaN(to))
						to = 0;
					break;
				case "string":
					var to = ""+value;
					break;
				case "boolean":
					var int = parseInt(value);
					if(isNaN(int))
						var to = value[0]!="f"&&value[0]!="n";
					else
						var to = Boolean(int);
					break;
				case "object":
					silent = true;
					from = JSON.stringify(settings[uservars[i]]);
					var to = JSON.parse(value);
					break;
				default:
					engine.console.print("Unknown/unimplemented setting type "+typeof(event[0][event[1]])+".\n",false);
					//return false;
			}
			if(isfunction) event[0][event[1]](to);
			else event[0][event[1]] = to;
			
			if(from != to)
			{
				if(!silent) engine.console.print(pretxt+event[1]+" changed from "+from+" to "+to+txt+".\n");
				if(window.svr && typeof(game_settings_default[event[1]]) !== "undefined")
				{
					if(to == Infinity) to = Number.MAX_VALUE;
					window.svr.send({type:"setting",setting:event[1],data:to});
				}
			}
			ret = to;
		}
		else
		{
			if(!silent) engine.console.print(event[1]+" is currently set to "+from+"\n",false);
			ret = from;
		}
		var exec = true;
	}
	if(event[2] && typeof(event[2][event[1]]) == "function")
	{
		event[2][event[1]](value);
		var exec = true;
	}
	if(exec) return ret==undefined?exec:ret;
	if(!silent)
	{
		engine.console.print("Unknown command "+event[1]+"\n",false);
		if(inround())
		{
			var len = 0, print="";
			for(i=0;i<cmds.length;i++)
			{
				if(cmds[i].search(setting) > -1)
				{
					if(len != 0) print += ", ";
					len++; print += cmds[i];
				}
			}
			if(len > 0) engine.console.print("Perhaps you meant: "+print+"\n",false);
		}
	}
	return exec;
}

function mkSettingCallback(setting,stringify=false)
{
	if(stringify)
		return function(set){return ""+chsetting(setting,set,true)}
	else
		return function(set){return chsetting(setting,set,true)}
}

function getargs()
{
	var s = window.location.hash.replace("#","").split("&");
	_GET = {};
	for(var i=0,len=s.length;i<len;i++)
	{
		var e = s[i].split("=");
		_GET[e[0]] = e[1];
	}
}
if(typeof(_GET) == "undefined")
{
	getargs();
}

window.loadsettingcfgs = function()
{
	loadcfg(localStorage.getItem("user.cfg"),true,true);
	if(settings.CFG_VERSION < 0.8) { if(Detector.webgl) {settings.HIGH_RIM = true;} settings.CFG_VERSION = 0.8;}
	loadcfg(localStorage.getItem("server_info.cfg"),true);
	loadcfg(localStorage.getItem("settings_custom.cfg"),true);
	loadcfg(localStorage.getItem("autoexec.cfg"),true);
}
