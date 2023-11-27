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

var initSound = function()
{

engine.audio = new THREE.AudioListener();
engine.audio.destination = {numberOfOutputs: 1};

engine.audio.bLoader = new BufferLoader(
	engine.audio.context,
	[
		// Cycle run sounds
		"",//0
		"",//1
		"",//2
		"sounds/tr2n_origins/cyclrun.wav",//3
		"sounds/gltron/game_engine.ogg",//4
		"sounds/arma/cyclrun.wav",//5
		
		// Cycle crash sounds
		"",//0
		"",//1
		"",//2
		"sounds/tr2n_origins/expl.ogg",//3
		"sounds/bikecrash.ogg",//5
		"sounds/bikecrash.ogg",//5
		//"sounds/gltron/game_crash.ogg",//4
		//"sounds/arma/expl.ogg",//5
		
		//other sounds:
		"sounds/gltron/game_recognizer.wav",
		"sounds/tr2n_origins/intro.wav",
		"sounds/tr2n_origins/extro.wav",
		"sounds/zone_spawn.ogg",
		"sounds/arma/cycle_turn.wav",
	]
);
engine.audio.bLoader.load();
engine.audio.bLoader.other = 12;


engine.audio.playSound = function(obj)
{
	var buffer;
	switch(typeof(obj.buffer))
	{
		case "object": buffer = obj.buffer; break;
		case "number": buffer = engine.audio.bLoader.bufferList[obj.buffer]; break;
	}
	
	var sound = new ((obj.pos)?THREE.PositionalAudio:THREE.Audio)( engine.audio );
	
	sound.setBuffer( buffer );
	sound.setVolume( (obj.vol===undefined)?1:obj.vol );
	sound.setLoop( !!obj.loop );
	
	if( obj.pitch !== undefined )
		sound.setPlaybackRate( obj.pitch );
	
	if( obj.pos )
	{
		sound.setRefDistance( 10 );
		sound.panner.setPosition(obj.pos.x,obj.pos.y,obj.pos.z);
	}
	
	sound.play();
	
};


//var audioLoader = new THREE.AudioLoader();


engine.audio.toggleSoundType = function()
{
	//STUB
}


engine.audio.mixCycle = function(cycle)
{
	cycle.audio.setPlaybackRate( cycle.speed / settings.CYCLE_SOUND_SPEED );
	
	cycle.audio.panner.setPosition( cycle.position.x, cycle.position.y, cycle.position.z );
}

engine.audio.audioMixing = function()
{
	//STUB
};



engine.audio.changeSoundPanner = function(type)
{
	//STUB
}

engine.audio.changeEngineSound = function(cycle,choice)
{
	//STUB
}

engine.audio.stopCycles = function()
{
	for(var x=0;x<engine.players.length;x++) if(typeof(engine.players[x]) != "undefined")
	{
		engine.players[x].audio.pause();
	}
}

engine.audio.startCycles = function()
{
	engine.audio.context.resume();
	for(var x=0;x<engine.players.length;x++) if(typeof(engine.players[x]) != "undefined" && engine.players[x].alive)
	{
		engine.players[x].audio.play();
	}
}

engine.audio.createCycleRun = function(cycle)
{
	var sound = new THREE.PositionalAudio( engine.audio );
	
	sound.setBuffer( engine.audio.bLoader.bufferList[cycle.engineType] );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
	
	sound.setRefDistance( 10 );
	
	return sound;
}

};


function playSound(buffer, vol, pitch, loop, output, after)
{
	console.warn("DEPRECATED CALL TO playSound");

	var src = engine.audio.context.createBufferSource();
	src.gainNode = engine.audio.context.createGain();

	src.connect(src.gainNode);
	src.gainNode.connect(output);

	src.buffer = buffer;
	src.gainNode.gain.value = vol;
	src.playbackRate.value = pitch;
	src.loop = loop;
	
	if(isNaN(after)) after = 0;
	src.start(engine.audio.context.currentTime+after)

	return src;
}

