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

conf = {}; settings = {};

game_settings_default = {};
sets = [];

class Setting
{
	constructor(conf)
	{
		switch(typeof(conf))
		{
			case "object": 
				Object.defineProperty(this, "name", {value: conf.name});
				this.val = conf.val;
				this.callback = conf.callback;
				this.type = conf.type;
				this.min = conf.min; this.max = conf.max;
				break;
		}
		
		if(this.val === undefined)
		{
			if(!this.type) throw("Setting without a value or type.");
			this.set("");
		}
		if(!this.type) this.type = typeof(this.val);
		switch(this.type)
		{
			case "bool": this.type = "boolean"; break;
			case "str": this.type = "string"; break;
		}
	}
	set(val)
	{
		switch(this.type)
		{
			case "function":
				this.val(val);
				break;
			case "int":
				/*if(window.BigInt)
					this.setDirect(BigInt(val));
				else*/
					this.setDirect(parseInt(val));
				break;
			case "boolean":
				this.setDirect(Boolean(val));
				break;
			case "float":case "number":
				this.setDirect(parseFloat(val));
				break;
			case "string":
				this.setDirect(""+val);
				break;
			default:
				console.log(this.type);
				
				break;
		}
		return this.get();
	}
	setDirect(val)
	{ 
		if(this.min !== undefined && val < this.min)
		{
			val = this.min;
		}
		if(this.max !== undefined && val > this.max)
		{
			val = this.max;
		}
		
		this.val = val;
		
		if(this.callback) this.callback();
	}
	valueOf()
	{
		if(this.type == "function")
		{
			return this.val();
		}
		return this.val;
	}
	toJSON() { return this.valueOf().toJSON?this.valueOf().toJSON():null; }
	toString() { return this.valueOf()+""; }
	toLocaleString() { return this.valueOf().toLocaleString(); }
	equals(v)
	{
		return(this.valueOf() == v.valueOf());
	}
	
	
	makeGameSetting()
	{
		game_settings_default[this.name] = this.val;
		sets.push(this.name);

		return this;
	}
	addSetting()
	{
		if(settings[this.name] !== undefined)
		{
			// hmm
			settings[this.name] = this.val;
		}
		else
		{
			conf[this.name] = this;
			
			var that = this;
			Object.defineProperty(settings, this.name, {
				get: function()  { return that.valueOf(); },
				set: function(n) { return that.set(n); },
				enumerable: true,
			});
		}

		return this;
	}
	
}
Setting.new = function(s) { return ((new Setting(s)).addSetting()); };
Setting.prototype.get = Setting.prototype.valueOf;

Setting.addMulti = function() {};

global.Setting = Setting;



	Setting.new({ name: "VERIFY_COLOR_STRICT", val: false });
	
	Setting.new({ name: "TEXT_BRIGHTEN", val: false });
	Setting.new({ name: "TEXT_DARK_HIGHLIGHT", val: true });
	Setting.new({ name: "FONT_MIN_R", val: 0.5 });
	Setting.new({ name: "FONT_MIN_G", val: 0.5 });
	Setting.new({ name: "FONT_MIN_B", val: 0.5 });
	Setting.new({ name: "FONT_MIN_TOTAL", val: 0.7 });
	
	Setting.new({ name: "CHAT_LAYER", val: 0.5 });
	
	Setting.new({ name: "TEXT_OUT", val: function(params=undefined){if(params !== undefined) engine.console.style.display=params?"block":"none"; return engine.console.style.display!="none";} });
	Setting.new({ name: "TEXT_OUT_MODE", val: 1 });


	Setting.new({ name: "FULLSCREEN", val: function(params=undefined)
	{
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
	}});

	// Camera
	Setting.new({ name: "CAMERA_FOV", val: 60, callback: function() {if(engine.camera){engine.camera.fov=settings.CAMERA_FOV;engine.camera.updateProjectionMatrix()}} });
	Setting.new({ name: "CAMERA_NEAR_RENDER", val: 0.04, callback: function() {if(engine.camera){engine.camera.near=settings.CAMERA_NEAR_RENDER;engine.camera.updateProjectionMatrix()}} });
	Setting.new({ name: "CAMERA_FAR_RENDER", val: 2000, callback: function() {if(engine.camera){engine.camera.far=settings.CAMERA_FAR_RENDER;engine.camera.updateProjectionMatrix()}} });

	// settings for camera types
	Setting.new({ name: "CAMERA_CUSTOM_BACK", val: 6 });
	Setting.new({ name: "CAMERA_CUSTOM_BACK_FROMSPEED", val: 0.5 });
	Setting.new({ name: "CAMERA_CUSTOM_RISE", val: 4 });
	Setting.new({ name: "CAMERA_CUSTOM_RISE_FROMSPEED", val: 0.4 });
	Setting.new({ name: "CAMERA_CUSTOM_TURN_SPEED", val: 4 });
	Setting.new({ name: "CAMERA_CUSTOM_OFFSET", val: 3 });
	Setting.new({ name: "CAMERA_CUSTOM_OFFSET_FROMSPEED", val: 0.1 });

	// graphical quality and settings
	Setting.new({ name: "ANTIALIAS", val: true, callback: function() { initRenderer(); } });
	
	Setting.new({ name: "GRID_SIZE", val: 1 });
	/*Setting.new({ name: "FLOOR_RED", val: 0.75 });
	Setting.new({ name: "FLOOR_GREEN", val: 0.75 });
	Setting.new({ name: "FLOOR_BLUE", val: 0.98 });*/
	Setting.new({ name: "FLOOR_RED", val: 0.03, callback: updategrid });
	Setting.new({ name: "FLOOR_GREEN", val: 0.266, callback: updategrid });
	Setting.new({ name: "FLOOR_BLUE", val: 0.8, callback: updategrid });
	Setting.new({ name: "FLOOR_TEXTURE", val: "textures/floor.png" });
	/*Setting.new({ name: "GRID_SIZE", val: 2 });
	Setting.new({ name: "FLOOR_RED", val: 1 });
	Setting.new({ name: "FLOOR_GREEN", val: 1 });
	Setting.new({ name: "FLOOR_BLUE", val: 1 });
	Setting.new({ name: "FLOOR_TEXTURE", val: "textures/moviepack_t_r_u_e/floor.png" });*/
	/*Setting.new({ name: "GRID_SIZE", val: 1 });
	Setting.new({ name: "FLOOR_RED", val: 0.01 });
	Setting.new({ name: "FLOOR_GREEN", val: 0.14 });
	Setting.new({ name: "FLOOR_BLUE", val: 0.35 });
	Setting.new({ name: "FLOOR_TEXTURE", val: "textures/aaold/floor.png" });*/
	
	Setting.new({ name: "FLOOR_MIRROR", val: false });
	Setting.new({ name: "FLOOR_MIRROR_INT", val: 1 });
	
	Setting.new({ name: "FLOOR_DETAIL", val: 3 }); // 0=off, 1=line, 2=good, 3=best
	
	Setting.new({ name: "CYCLE_TEXTURES", val: ["textures/cycle_body.png","textures/cycle_wheel.png"] });
	
	Setting.new({ name: "EXPLOSIONS", val: true });
	Setting.new({ name: "HIGH_RIM", val: true });
	Setting.new({ name: "HIGH_RIM_HEIGHT", val: 50 });
	Setting.new({ name: "LOW_RIM_HEIGHT", val: 4 });
	
	Setting.new({ name: "RIM_WALL_RED", val: 0 });
	Setting.new({ name: "RIM_WALL_GREEN", val: 0 }); // 0.533
	Setting.new({ name: "RIM_WALL_BLUE", val: 0 }); // 1
	Setting.new({ name: "RIM_WALL_ALPHA", val: 0.9 });
	Setting.new({ name: "RIM_WALL_COLOR_MODE", val: 3 });
	Setting.new({ name: "RIM_WALL_STRETCH_X", val: 50 });
	Setting.new({ name: "RIM_WALL_STRETCH_Y", val: 13.5 });
	Setting.new({ name: "RIM_WALL_WRAP_Y", val: false });
	Setting.new({ name: "RIM_WALL_REPEAT_TOP", val: false });
	Setting.new({ name: "RIM_WALL_TEXTURE", val: "textures/futurerim.png" });
	Setting.new({ name: "RIM_WALL_DEPTH", val: true });
	Setting.new({ name: "RIM_WALL_LOWEST_HEIGHT", val: 0 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_R", val: 0 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_G", val: 0 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_B", val: 0 });
	
	/*Setting.new({ name: "RIM_WALL_RED", val: 1 });
	Setting.new({ name: "RIM_WALL_GREEN", val: 1 });
	Setting.new({ name: "RIM_WALL_BLUE", val: 1 });
	Setting.new({ name: "RIM_WALL_ALPHA", val: 1 });
	Setting.new({ name: "RIM_WALL_COLOR_MODE", val: 0 });
	//Setting.new({ name: "RIM_WALL_STRETCH_X", val: 300 });
	//Setting.new({ name: "RIM_WALL_STRETCH_Y", val: 50 });
	Setting.new({ name: "RIM_WALL_STRETCH_X", val: 128 });
	Setting.new({ name: "RIM_WALL_STRETCH_Y", val: 32 });
	Setting.new({ name: "LOW_RIM_HEIGHT", val: 32 });
	Setting.new({ name: "RIM_WALL_WRAP_Y", val: false });
	Setting.new({ name: "RIM_WALL_TEXTURE", val: "textures/moviepack_eddkeefe/rim_wall.png" });
	Setting.new({ name: "RIM_WALL_LOWEST_HEIGHT", val: 32 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_R", val: 166/255 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_G", val: 45/255 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_B", val: 237/255 });//*/
	
	Setting.new({ name: "RIM_WALL_RED", val: 1 });
	Setting.new({ name: "RIM_WALL_GREEN", val: 1 });
	Setting.new({ name: "RIM_WALL_BLUE", val: 1 });
	Setting.new({ name: "RIM_WALL_ALPHA", val: 1 });
	Setting.new({ name: "RIM_WALL_COLOR_MODE", val: 0 });
	//Setting.new({ name: "RIM_WALL_STRETCH_X", val: 300 });
	//Setting.new({ name: "RIM_WALL_STRETCH_Y", val: 50 });
	Setting.new({ name: "RIM_WALL_STRETCH_X", val: 1536 });
	Setting.new({ name: "RIM_WALL_STRETCH_Y", val: 32 });
	Setting.new({ name: "HIGH_RIM_HEIGHT", val: 32 });
	Setting.new({ name: "RIM_WALL_WRAP_Y", val: false });
	Setting.new({ name: "RIM_WALL_TEXTURE", val: "textures/moviepack_t_r_u_e/movie-rim-wall.png" });
	Setting.new({ name: "RIM_WALL_DEPTH", val: true });
	Setting.new({ name: "RIM_WALL_LOWEST_HEIGHT", val: 32 });
	/*Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_R", val: 188/255 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_G", val: 206/255 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_B", val: 250/255 });//*/
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_R", val: 0.5 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_G", val: 0.5 });
	Setting.new({ name: "RIM_WALL_BELOW_HEIGHT_COLOR_B", val: 0.7 });
	
	Setting.new({ name: "COLOR_MODE_3_COLORS", val: "1,0,0;1,1,0;0,1,0;0,1,1;0,0,1;1,0,1" });
	Setting.new({ name: "COLOR_MODE_3_SPEED", val: 0.2 });
	
	Setting.new({ name: "ALPHA_BLEND", val: true });
	
	Setting.new({ name: "MENU_RENDER", val: "img" });
	
	Setting.new({ name: "REDRAW_MODE", val: 0 });
	Setting.new({ name: "TARGET_FPS", val: 1 });
	Setting.new({ name: "MAX_TARGET_FPS", val: 1000 });
	Setting.new({ name: "DEDICATED_FPS", val: 40 });

	Setting.new({ name: "GRAB_SENSORS_ON_TURN", val: true });
	Setting.new({ name: "CYCLE_SENSORS_RANGE", val: 100 });
	Setting.new({ name: "GAME_LOOP", val: 0.5 });
	Setting.new({ name: "TIME_FACTOR", val: 1 });
	
	Setting.new({ name: "HUD_MAP", val: true, callback: function()
	{
		document.getElementById("canvas").style.display = settings.HUD_MAP?"block":"none";
	}});
	
	Setting.new({ name: "ADMIN_KILL_MESSAGE", val: true });
	
	//SOUNDS
	Setting.new({ name: "SOUND_QUALITY", val: 3, type: "int", 
		min: 0, max: 3,
		callback: function()
		{
			if(!engine.audio && settings.SOUND_QUALITY > 0)
			{
				try { initSound(); }
				catch(e)
				{
					console.error(e);
					engine.console.print("An error occurred while enabling sound. If your browser supports it, this may be a bug.\n",false);
				}
			}
			if(engine.audio && settings.SOUND_QUALITY == 0)
			{
				engine.audio.stopCycles();
				
				return;
			}
			var p;
			switch(settings.SOUND_QUALITY)
			{
				case 1: p="HRTF"; engine.retroSound = true; break;
				case 2: p="HRTF"; engine.retroSound = true; break;
				case 3: p="equalpower"; engine.retroSound = false; break;
			}
			for(var x=engine.players.length-1;x>=0;--x) if(engine.players[x])
			{
				if(engine.players[x].audio)
				{
					engine.players[x].audio.panner.panningMode = p;
				}
			}
			
		},
	});
	
	Setting.new({ name: "SOUNDS_INTRO", val: false });
	Setting.new({ name: "SOUNDS_EXTRO", val: false });
	Setting.new({ name: "SOUNDS_COUNTDOWN", val: true });
	Setting.new({ name: "SOUNDS_GO", val: false });
	Setting.new({ name: "SOUNDS_ZONES", val: false });
	
	Setting.new({ name: "MUSIC", val: 0 });
	
	//ZONES
	Setting.new({ name: "ZONE_HEIGHT", val: 5 });
	Setting.new({ name: "ZONE_SEGMENTS", val: 11 });//arma render only
	Setting.new({ name: "ZONE_SEG_LENGTH", val: 0.5 });//arma render only
	Setting.new({ name: "ZONE_ALPHA", val: 0.7 });
	Setting.new({ name: "ZONE_ALPHA_TOGGLE", val: false });
	Setting.new({ name: "ZONE_SPIN_SPEED", val: 0.05 });
	Setting.new({ name: "ZONE_RENDER_TYPE", val: 'arma' });//cylinder or arma

	//player (for armagetron nabs) //can't have people changing these on a server
	Setting.new({ name: "PLAYER_1", val: function(val)
		{ 
			if(engine.dedicated) return "Player 1";
			if(typeof(val) != "undefined")
			{
				settings.players[0].name=val;
			} 
			return settings.players[0].name;
		} 
	});
	Setting.new({ name: "COLOR_R_1", val: function(r=undefined) { if(engine.dedicated) return 13; return plnumcolors({r:r}).r } });
	Setting.new({ name: "COLOR_G_1", val: function(g=undefined) { if(engine.dedicated) return 13; return plnumcolors({g:g}).g } });
	Setting.new({ name: "COLOR_B_1", val: function(b=undefined) { if(engine.dedicated) return 0; return plnumcolors({b:b}).b } });

	Setting.new({ name: "BUTTONS_SHOWN", val: 2 });
	
	Setting.new({ name: "CFG_VERSION", val: 0 });
	
	Setting.new({ name: "PLAYER_DEL_HIST_PERROUND", val: true }); //what was this?
	
	Setting.new({ name: "TIMESTEP_MAX", val: 0.2 });
	
	//debug
	Setting.new({ name: "DEBUG_EVERYONE_IS_AI", val: false });
	Setting.new({ name: "HACK_TURN_LEFT_WHEN_POSSIBLE", val: 0 });
	Setting.new({ name: "HACK_TURN_RIGHT_WHEN_POSSIBLE", val: 0 });
	Setting.new({ name: "HACK_TURN_SENSOR_DIST", val: 5 });
	Setting.new({ name: "MULTITHREADED", val: false });

	//NETWORK
	Setting.new({ name: "CONNECT_PORT", val: 5331 });
	Setting.new({ name: "CONNECT_HOST", val: "armagetron.kevinh.us" });
	Setting.new({ name: "CONNECT_SSL", val: true });
	Setting.new({ name: "CONNECT_TYPE", val: "3dc" });
	
	Setting.new({ name: "CYCLE_SMOOTH_TIME", val: 0.3 });
	Setting.new({ name: "CYCLE_SYNC_INTERVAL", val: 0.1 });
	Setting.new({ name: "DEBUG_NETWORK_TURN_WAIT", val: true });
	
	Setting.new({ name: "SERVER_PORT", val: 5331 });
	Setting.new({ name: "SERVER_NAME", val: "Unnamed Server" });
	Setting.new({ name: "SERVER_DNS", val: "" });
	Setting.new({ name: "SERVER_SSL_ENABLED", val: false });
	Setting.new({ name: "SERVER_SSL_KEY", val: "" });
	Setting.new({ name: "SERVER_SSL_CERT", val: "" });
	Setting.new({ name: "MAX_CLIENTS", val: 32 });



	Setting.new({ name: "AI_FORCE_BRAKE", val: false }).makeGameSetting();
	Setting.new({ name: "AI_TEAM", val: false }).makeGameSetting();
	Setting.new({ name: "AI_DUAL_COLOR_NAME", val: false }).makeGameSetting();
	Setting.new({ name: "CHATBOT_ALWAYS_ACTIVE", val: false }).makeGameSetting();
	//CYCLE
	Setting.new({ name: "CYCLE_ACCEL", val: 10 }).makeGameSetting();
	Setting.new({ name: "CYCLE_ACCEL_ENEMY", val: 1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_ACCEL_OFFSET", val: 2 }).makeGameSetting();
	Setting.new({ name: "CYCLE_ACCEL_RIM", val: 0 }).makeGameSetting();
	Setting.new({ name: "CYCLE_ACCEL_SELF", val: 1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_ACCEL_SLINGSHOT", val: 1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_ACCEL_TEAM", val: 1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_ACCEL_TUNNEL", val: 1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_WALL_NEAR", val: 6 }).makeGameSetting();

	Setting.new({ name: "CYCLE_BRAKE", val: 30 }).makeGameSetting();
	Setting.new({ name: "CYCLE_BRAKE_DEPLETE", val: 1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_BRAKE_REFILL", val: 0.1 }).makeGameSetting();
	
	Setting.new({ name: "CYCLE_BOOST", val: 0 }).makeGameSetting();
	
	Setting.new({ name: "CYCLE_JUMP", val: 0.5 }).makeGameSetting();
	Setting.new({ name: "CYCLE_JUMP", val: 0 }).makeGameSetting();
	Setting.new({ name: "CYCLE_MIDAIR_JUMP", val: false }).makeGameSetting();
	Setting.new({ name: "CYCLE_MIDAIR_TURN", val: false }).makeGameSetting();
	Setting.new({ name: "CYCLE_WALL_RAMP_ENABLE", val: true }).makeGameSetting();

	Setting.new({ name: "CYCLE_DELAY", val: 0.02 }).makeGameSetting();

	Setting.new({ name: "CYCLE_RUBBER", val: 5 }).makeGameSetting();
	Setting.new({ name: "CYCLE_RUBBER_TIME", val: 10 }).makeGameSetting();
	//Setting.new({ name: "CYCLE_RUBBER_TIMEBASED", val: 0 }).makeGameSetting();
	Setting.new({ name: "CYCLE_RUBBER_MINDISTANCE", val: 0.03 }).makeGameSetting();
	Setting.new({ name: "CYCLE_RUBBER_MINADJUST", val: 0.05 }).makeGameSetting();
	Setting.new({ name: "CYCLE_RUBBER_DEPLETE_RIM", val: true }).makeGameSetting();
	Setting.new({ name: "CYCLE_RUBBER_DEPLETE_SELF", val: true }).makeGameSetting();
	Setting.new({ name: "CYCLE_RUBBER_DEPLETE_ENEMY", val: true }).makeGameSetting();

	Setting.new({ name: "CYCLE_SOUND_SPEED", val: 30 }).makeGameSetting();

	Setting.new({ name: "CYCLE_SPEED", val: 20 }).makeGameSetting();
	Setting.new({ name: "CYCLE_SPEED_DECAY_ABOVE", val: 0.1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_SPEED_DECAY_BELOW", val: 5 }).makeGameSetting();

	Setting.new({ name: "CYCLE_SPEED_MAX", val: 0 }).makeGameSetting();
	Setting.new({ name: "CYCLE_SPEED_MIN", val: 0.25 }).makeGameSetting();

	Setting.new({ name: "CYCLE_START_SPEED", val: 20 }).makeGameSetting();

	Setting.new({ name: "CYCLE_TURN_MEMORY", val: 3 }).makeGameSetting();
	
	Setting.new({ name: "CYCLE_TURN_SPEED_FACTOR", val: 0.95 }).makeGameSetting();

	Setting.new({ name: "WALLS_LENGTH", val: 600 }).makeGameSetting();
	//settings["WALLS_LENGTH"].set(30);
	
	Setting.new({ name: "RESPAWN_TIME", val: -1 }).makeGameSetting();
	Setting.new({ name: "CYCLE_FIRST_SPAWN_PROTECTION", val: false }).makeGameSetting();
	Setting.new({ name: "CYCLE_WALL_TIME", val: 5 }).makeGameSetting();
	Setting.new({ name: "CYCLE_INVULNERABILITY_TIME", val: -1 }).makeGameSetting();

	Setting.new({ name: "WALLS_STAY_UP_DELAY", val: 1 }).makeGameSetting();
	
	Setting.new({ name: "SP_HUMANS_COUNT", val: 1 }).makeGameSetting();
	//TEAMS
	Setting.new({ name: "TEAMS_MAX_PLAYERS", val: 1 }).makeGameSetting();
	Setting.new({ name: "TEAMS_MIN_PLAYERS", val: 1 }).makeGameSetting();
	Setting.new({ name: "TEAMS_MAX", val: 16 }).makeGameSetting();
	Setting.new({ name: "TEAMS_MIN", val: 2 }).makeGameSetting(); //4
	Setting.new({ name: "TEAM_ALLOW_SHUFFLE_UP", val: 0 }).makeGameSetting();
	Setting.new({ name: "ALLOW_TEAM_NAME_PLAYER", val: true }).makeGameSetting();
	Setting.new({ name: "ALLOW_TEAM_NAME_COLOR", val: true }).makeGameSetting();
	Setting.new({ name: "MIN_PLAYERS", val: 1 }).makeGameSetting();
	Setting.new({ name: "NUM_AIS", val: 0 }).makeGameSetting();
	Setting.new({ name: "SP_NUM_AIS", val: 3 }).makeGameSetting();
	
	Setting.new({ name: "TEAM_NAME_1", val: "Team Blue" }).makeGameSetting();    //name of team 1
	Setting.new({ name: "TEAM_RED_1", val: 4 }).makeGameSetting();    //red portion of team 1's color
	Setting.new({ name: "TEAM_GREEN_1", val: 8 }).makeGameSetting();    //green portion of team 1's color
	Setting.new({ name: "TEAM_BLUE_1", val: 15 }).makeGameSetting();    //blue portion of team 1's color
	
	Setting.new({ name: "TEAM_NAME_2", val: "Team Gold" }).makeGameSetting();    //name of team 2
	Setting.new({ name: "TEAM_RED_2", val: 15 }).makeGameSetting();    //red portion of team 2's color
	Setting.new({ name: "TEAM_GREEN_2", val: 15 }).makeGameSetting();    //green portion of team 2's color
	Setting.new({ name: "TEAM_BLUE_2", val: 4 }).makeGameSetting();    //blue portion of team 2's color
	
	Setting.new({ name: "TEAM_NAME_3", val: "Team Red" }).makeGameSetting();    //name of team 3
	Setting.new({ name: "TEAM_RED_3", val: 15 }).makeGameSetting();    //red portion of team 3's color
	Setting.new({ name: "TEAM_GREEN_3", val: 4 }).makeGameSetting();    //green portion of team 3's color
	Setting.new({ name: "TEAM_BLUE_3", val: 4 }).makeGameSetting();    //blue portion of team 3's color
	
	Setting.new({ name: "TEAM_NAME_4", val: "Team Green" }).makeGameSetting();    //name of team 4
	Setting.new({ name: "TEAM_RED_4", val: 4 }).makeGameSetting();    //red portion of team 4's color
	Setting.new({ name: "TEAM_GREEN_4", val: 15 }).makeGameSetting();    //green portion of team 4's color
	Setting.new({ name: "TEAM_BLUE_4", val: 4 }).makeGameSetting();    //blue portion of team 4's color
	
	Setting.new({ name: "TEAM_NAME_5", val: "Team Violet" }).makeGameSetting();    //name of team 5
	Setting.new({ name: "TEAM_RED_5", val: 15 }).makeGameSetting();   //red portion of team 5's color
	Setting.new({ name: "TEAM_GREEN_5", val: 4 }).makeGameSetting();    //green portion of team 5's color
	Setting.new({ name: "TEAM_BLUE_5", val: 15 }).makeGameSetting();    //blue portion of team 5's color
	
	Setting.new({ name: "TEAM_NAME_6", val: "Team Cyan" }).makeGameSetting();    //name of team 6
	Setting.new({ name: "TEAM_RED_6", val: 4 }).makeGameSetting();    //red portion of team 6's color
	Setting.new({ name: "TEAM_GREEN_6", val: 15 }).makeGameSetting();    //green portion of team 6's color
	Setting.new({ name: "TEAM_BLUE_6", val: 15 }).makeGameSetting();    //blue portion of team 6's color
	
	Setting.new({ name: "TEAM_NAME_7", val: "Team White" }).makeGameSetting();    //name of team 7
	Setting.new({ name: "TEAM_RED_7", val: 15 }).makeGameSetting();    //red portion of team 7's color
	Setting.new({ name: "TEAM_GREEN_7", val: 15 }).makeGameSetting();    //green portion of team 7's color
	Setting.new({ name: "TEAM_BLUE_7", val: 15 }).makeGameSetting();    //blue portion of team 7's color
	
	Setting.new({ name: "TEAM_NAME_8", val: "Team Black" }).makeGameSetting();    //name of team 8
	Setting.new({ name: "TEAM_RED_8", val: 0 }).makeGameSetting();    //red portion of team 8's color
	Setting.new({ name: "TEAM_GREEN_8", val: 0 }).makeGameSetting();    //green portion of team 8's color
	Setting.new({ name: "TEAM_BLUE_8", val: 0 }).makeGameSetting();    //blue portion of team 8's color
	
	//MAP
	Setting.new({ name: "ARENA_AXES", val: 4, max: 65535 }).makeGameSetting();
	Setting.new({ name: "STRICT_AXES_SPAWN", val: true }).makeGameSetting();
	Setting.new({ name: "RESOURCE_REPOSITORY_CACHE", val: './cache/resource/' }).makeGameSetting();
	Setting.new({ name: "MAP_FILE", val: 'Anonymous/polygon/regular/square-1.0.1.aamap.xml' }).makeGameSetting();
	Setting.new({ name: "MAP_ROTATION", val: "" }).makeGameSetting();
	Setting.new({ name: "ROTATION_TYPE", val: 0 }).makeGameSetting(); //1:round, 2:match
	Setting.new({ name: "RESOURCE_REPOSITORY_SERVER", val: 'https://www.armanelgtron.tk/armagetronad/resource/' }).makeGameSetting();
	//Setting.new({ name: "RESOURCE_REPOSITORY_BACKUP", val: 'http://resource.armagetronad.net/resource/' }).makeGameSetting();
	Setting.new({ name: "SIZE_FACTOR", val: -3 }).makeGameSetting();
	Setting.new({ name: "ARENA_BOUNDARY", val: -10 }).makeGameSetting();
	Setting.new({ name: "ARENA_BOUNDARY_KILLS", val: true }).makeGameSetting();
	
	Setting.new({ name: "ZONE_ALPHA_SERVER", val: 1 }).makeGameSetting();
	
	//GAME PLAY
	Setting.new({ name: "GAME_TYPE", val: 1 }).makeGameSetting();
	Setting.new({ name: "FINISH_TYPE", val: 2 }).makeGameSetting();
	Setting.new({ name: "LIMIT_ROUNDS", val: 10 }).makeGameSetting();
	Setting.new({ name: "LIMIT_TIME", val: 30 }).makeGameSetting();
	Setting.new({ name: "LIMIT_SCORE", val: 100 }).makeGameSetting();
	
	Setting.new({ name: "ROUND_WAIT", val: false }).makeGameSetting();
	
	//SHOOTING
	Setting.new({ name: "SHOT_THRESH", val: 2 }).makeGameSetting();
	
	//WIN ZONE
	Setting.new({ name: "WIN_ZONE_DEATHS", val: false }).makeGameSetting();
	Setting.new({ name: "WIN_ZONE_EXPANSION", val: 1 }).makeGameSetting();
	Setting.new({ name: "WIN_ZONE_INITIAL_SIZE", val: 5 }).makeGameSetting();
	Setting.new({ name: "WIN_ZONE_RANDOMNESS", val: 0.8 }).makeGameSetting();
	Setting.new({ name: "WIN_ZONE_MIN_LAST_DEATH", val: 30 }).makeGameSetting();
	Setting.new({ name: "WIN_ZONE_MIN_ROUND_TIME", val: Infinity }).makeGameSetting(); //60
	
	//FORTRESS
	Setting.new({ name: "FORTRESS_CONQUEST_RATE", val: 0.5 }).makeGameSetting();
	Setting.new({ name: "FORTRESS_CONQUEST_DECAY_RATE", val: 0.1 }).makeGameSetting();
	Setting.new({ name: "BASE_RESPAWN", val: false }).makeGameSetting();
	
	//SPAWN
	Setting.new({ name: "SPAWN_WINGMEN_SIDE", val: 2.75362 }).makeGameSetting();
	Setting.new({ name: "SPAWN_WINGMEN_BACK", val: 2.202896 }).makeGameSetting();
	
	//ROUNDLY
	Setting.new({ name: "ROUND_COMMAND", val: "" }).makeGameSetting();
	Setting.new({ name: "ROUND_CONSOLE_MESSAGE", val: "" }).makeGameSetting();
	Setting.new({ name: "ROUND_CENTER_MESSAGE", val: "" }).makeGameSetting();
	
	//TARGET
	Setting.new({ name: "DEFAULT_TARGET_COMMAND", val: "" }).makeGameSetting();
	//Setting.new({ name: "TARGET_DECLARE_WINNER", val: true }).makeGameSetting(); 
	//Setting.new({ name: "TARGET_LIFETIME", val: -1 }).makeGameSetting();
	Setting.new({ name: "TARGET_INITIAL_SCORE", val: 10 }).makeGameSetting();
	//Setting.new({ name: "TARGET_SCORE_DEPLETE", val: 2 }).makeGameSetting();
	//Setting.new({ name: "TARGET_SURVIVE_TIME", val: 10 }).makeGameSetting();
	
	//BALL
	Setting.new({ name: "BALL_SPEED_DECAY", val: 0 }).makeGameSetting();
	Setting.new({ name: "BALL_SPEED_HIT_DECAY", val: 0 }).makeGameSetting();

//*/


function confForSoftwareRenderer()
{
	//choose better defaults for the software renderer
	settings.HIGH_RIM = false;
	settings.LOW_RIM_HEIGHT = 4;
	settings.RIM_WALL_TEXTURE = "";
	settings.RIM_WALL_DEPTH = false;
	settings.ALPHA_BLEND = false;
	settings.FLOOR_DETAIL = 2;
}



//possible admin commands (methods)
commands = {
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
		if( name == "instantchats" ) { settings[name] = cfg; return; }
		for(var i=0;i<sets.length;i++)
		{
			if( sets[i].indexOf("instant") == 0 || typeof(settings[name][sets[i]]) != "undefined" )
				settings[name][sets[i]] = cfg[sets[i]];
		}
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

settings.instantchats = [];

function newInstantChat(chat="",keys=null)
{
	var x = settings.instantchats.length;
	settings.controls["instant_chat_"+x] = keys?keys:[];
	settings.instantchats[x] = chat;
}
function removeInstantChat(x)
{
	settings.controls["instant_chat_"+x].splice(0);
	delete settings.controls["instant_chat_"+x];
	delete settings.instantchats[x];
}

newInstantChat("Well done!",[49]);
newInstantChat("Thank you!",[50]);
newInstantChat("Good match!",[51]);
newInstantChat("LOL!",[115,52]);

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
		teamName: '',
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
	"player","controls", "instantchats",
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
		txt += "INSTANT_CHAT_STRING_1_"+(i+1)+" "+settings.instantchats[i]+"\n";
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

window.chsetting = chsetting;
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
		var to;
		
		if(typeof(value) != "undefined" && value != "")
		{
			switch(typeof(event[0][event[1]]))
			{
				case "number":
					to = parseFloat(value);
					if(isNaN(to))
						to = 0;
					break;
				case "bigint":
					try { to = BigInt(value); }
					catch(e)
					{
						try { to = BigInt(parseInt(value)); }
						catch(e)
						{
							to = BigInt(0);
						}
					}
				case "string":
					to = ""+value;
					break;
				case "boolean":
					var int = parseInt(value);
					if(isNaN(int))
						to = value[0]!="f"&&value[0]!="n";
					else
						to = Boolean(int);
					break;
				case "object":
					silent = true;
					from = JSON.stringify(settings[uservars[i]]);
					to = JSON.parse(value);
					break;
				default:
					engine.console.print("Unknown/unimplemented setting type "+typeof(event[0][event[1]])+".\n",false);
					//return false;
			}
			if(isfunction) event[0][event[1]](to);
			else event[0][event[1]] = to;
			to = event[0][event[1]];
			
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
