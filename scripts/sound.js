/*
 * 3DCycles - A lightcycle game.
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

var ctx = new AudioContext();
var bufferLoader = new BufferLoader(
	ctx,
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
bufferLoader.load();
bufferLoader.other = 12;



var playSound = function(buffer, vol, pitch, loop, output)
{

	var src = ctx.createBufferSource();
	src.gainNode = ctx.createGain();

	src.connect(src.gainNode);
	src.gainNode.connect(output);

	src.buffer = buffer;
	src.gainNode.gain.value = vol;
	src.playbackRate.value = pitch;
	src.loop = loop;
	
	src.start(ctx.currentTime);

	return src;
};



function toggleSoundType() //safely changes the sound panners in settings, and players (not used anywhere)
{
	if (engine.retroSound == true) { engine.retroSound = false; } else { engine.retroSound = true; } 
	var p = "HRTF";
	if (!engine.retroSound) { p = "equalpower" }
	//assume a change
	for(var x=0;x<engine.players.length;x++) //for each player object
	{
		engine.players[x].audio.panner.panningModel = p;//change panning model
	}
}

var mixCycle = function(cycle)
{
	if(cycle.engineSound !== undefined)
	{
		cycle.engineSound.playbackRate.value = cycle.speed / settings.CYCLE_SOUND_SPEED;
	}

	if(!Number.isFinite(cycle.position.x) || !Number.isFinite(cycle.position.y)) return false;
	
	if(cycle.audio)
	{
		cycle.audio.panner.setPosition(cycle.position.x, cycle.position.y, cycle.position.z);
	}
}

var audioMixing = function()
{
	try
	{
		var m = engine.camera.matrix;
		var mx = m.elements[12], my = m.elements[13], mz = m.elements[14];
		m.elements[12] = m.elements[13] = m.elements[14] = 0;

		var vec = new THREE.Vector3(0,1,0);
		vec.applyMatrix4(m);
		vec.normalize();
		var up = new THREE.Vector3(0,0,1);
		up.applyMatrix4(m);
		up.normalize();

		ctx.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);
		ctx.listener.setPosition(engine.camera.position.x, engine.camera.position.y, engine.camera.position.z);

		m.elements[12] = mx; m.elements[13] = my; m.elements[14] = mz;
	}
	catch(e)
	{
		console.warn(e);
		if(e.message.search("finite") > 0) engine.camera.position.set(engine.logicalBox.center.x*engine.REAL_ARENA_SIZE_FACTOR,engine.logicalBox.center.y*engine.REAL_ARENA_SIZE_FACTOR,0);
		return false;
	}
};

function changeSoundPanner(type)
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

function changeEngineSound(cycle,choice)
{
	cycle.engineType = choice;
	cycle.engineSound.stop();
	cycle.engineSound = playSound(bufferLoader.bufferList[choice], 0.5, 1, true, cycle.audio);
}

function audioStop()
{
	if(!ctx) return;
	for(var x=0;x<engine.players.length;x++) if(typeof(engine.players[x]) != "undefined")
	{
		engine.players[x].audio.panner.disconnect();//turns off audio
	}
}

function audioStart()
{
	if(!ctx) return;
	for(var x=0;x<engine.players.length;x++) if(typeof(engine.players[x]) != "undefined" && engine.players[x].alive)
	{
		engine.players[x].audio.panner.connect(ctx.destination);//turns on audio
	}
}
