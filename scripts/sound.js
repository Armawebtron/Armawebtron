/*
 * Armawebtron - A lightcycle game.
 * Copyright (C) 2019 Glen Harpring
 * This file was mostly written by Durf.
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

var initSound = function(){
engine.audio = new AudioContext();
engine.audio.bLoader = new BufferLoader(
	engine.audio,
	[
		"",//0
		"",//1
		"",//2
		"sounds/tr2n_origins/cyclrun.wav",//3
		"sounds/gltron/game_engine.ogg",//4
		"sounds/arma/cyclrun.wav",//5
		"",//0
		"",//1
		"",//2
		"sounds/tr2n_origins/expl.ogg",//3
		"sounds/tr2n_origins/expl.ogg",//3
		"sounds/tr2n_origins/expl.ogg",//3
		//"sounds/gltron/game_crash.ogg",//4
		//"sounds/arma/expl.ogg",//5
		//other sounds:
		"sounds/gltron/game_recognizer.wav",
		"sounds/tr2n_origins/intro.wav",
		"sounds/tr2n_origins/extro.wav",
		"sounds/zone_spawn.ogg",
	]
);
engine.audio.bLoader.load();
engine.audio.bLoader.other = 12;



engine.audio.playSound = function(obj)
{
	var buffer, vol, pitch, loop, after;
	var output = engine.audio.destination;
	switch(typeof(obj.buffer))
	{
		case "object": buffer = obj.buffer; break;
		case "number": buffer = engine.audio.bLoader.bufferList[obj.buffer]; break;
	}
	vol = (obj.vol===undefined)?1:obj.vol;
	pitch = (obj.pitch===undefined)?1:obj.pitch;
	loop = !!obj.loop;
	after = obj.after;
	return playSound(buffer, vol, pitch, loop, output, after);
};



engine.audio.toggleSoundType = function() //safely changes the sound panners in settings, and players (not used anywhere)
{
	if (engine.retroSound == true) { engine.retroSound = false; } else { engine.retroSound = true; } 
	var p = "HRTF";
	if (!engine.retroSound) { p = "equalpower" }
	//assume a change
	for(var x=0;x<engine.players.length;x++) if(engine.players[x])
	{
		engine.players[x].audio.panner.panningModel = p;//change panning model
	}
}

engine.audio.posMult = 0.2;
engine.audio.mixCycle = function(cycle)
{
	if(cycle.engineSound !== undefined)
	{
		cycle.engineSound.playbackRate.value = cycle.speed / settings.CYCLE_SOUND_SPEED;
	}

	if(!Number.isFinite(cycle.position.x) || !Number.isFinite(cycle.position.y)) return false;
	
	if(cycle.audio)
	{
		cycle.audio.panner.setPosition(cycle.position.x*engine.audio.posMult, cycle.position.y*engine.audio.posMult, cycle.position.z*engine.audio.posMult*2);
	}
}

engine.audio.audioMixing = function()
{
	try
	{
		var m = engine.camera.matrix;
		var mx = m.elements[12], my = m.elements[13], mz = m.elements[14];
		m.elements[12] = m.elements[13] = m.elements[14] = 0;

		var vec = new THREE.Vector3(0,1,0);
		//vec.applyMatrix4(m);
		//vec.normalize();
		var up = new THREE.Vector3(0,0,1);
		up.applyMatrix4(m);
		up.normalize();

		engine.audio.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);
		engine.audio.listener.setPosition(engine.camera.position.x*engine.audio.posMult, engine.camera.position.y*engine.audio.posMult, engine.camera.position.z*engine.audio.posMult);

		m.elements[12] = mx; m.elements[13] = my; m.elements[14] = mz;
	}
	catch(e)
	{
		console.warn(e);
		if(e.message.search("finite") > 0) engine.camera.position.set(engine.logicalBox.center.x*engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.center.y*engine.REAL_ARENA_SIZE_FACTOR,0);
		return false;
	}
};

engine.audio.changeSoundPanner = function(type)
{
	switch(type)
	{
		case "EQ": case "HQ": case "equalpower":
			cycle.audio.panner.panningModel = "equalpower";
		break;
		case "HRTF": case "LQ":
			cycle.audio.panner.panningModel = "HRTF";
		break;
		default:
			cycle.audio.panner.panningModel = "equalpower";
		break;
	}
}

engine.audio.changeEngineSound = function(cycle,choice)
{
	cycle.engineType = choice;
	cycle.engineSound.stop();
	cycle.engineSound = playSound(bufferLoader.bufferList[choice], 0.5, 1, true, cycle.audio);
}

engine.audio.stopCycles = function()
{
	for(var x=0;x<engine.players.length;x++) if(typeof(engine.players[x]) != "undefined")
	{
		engine.players[x].audio.panner.disconnect();//turns off audio
	}
}

engine.audio.startCycles = function()
{
	for(var x=0;x<engine.players.length;x++) if(typeof(engine.players[x]) != "undefined" && engine.players[x].alive)
	{
		engine.players[x].audio.panner.connect(engine.audio.destination);//turns on audio
	}
}
};



function playSound(buffer, vol, pitch, loop, output, after)
{

	var src = engine.audio.createBufferSource();
	src.gainNode = engine.audio.createGain();

	src.connect(src.gainNode);
	src.gainNode.connect(output);

	src.buffer = buffer;
	src.gainNode.gain.value = vol;
	src.playbackRate.value = pitch;
	src.loop = loop;
	
	if(isNaN(after)) after = 0;
	src.start(engine.audio.currentTime+after)

	return src;
}

