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

function stopPropagation(e)
{
    e = e || event;/* get IE event ( not passed ) */
    e.stopPropagation? e.stopPropagation() : e.cancelBubble = true;
    e.returnValue = false;
}

//EVENT INPUTS

var keyboardKeyDown = function(e)
{
	e = e || event;//safety (against what?)
		
	//get state here, like: playing, menu, chatting, etc.

	//refer to engine.inputState: menu | menu2 | game | chat | pause

	//for each input state, either switch(keyCode) {}, or send keycode to appropriate function
	var keyCode = getKeyCode(e);
	var specificState = engine.inputState.split(':');
	if(specificState[0] != "input" && settings.controls.console.indexOf(keyCode) > -1) //console key works everywhere except other inputs
	{
		var input = document.getElementById("input");
		input.style.display = "block";
		engine.inputStatePrev = engine.inputState;
		engine.inputState = "input:console";
		if(engine.players[engine.activePlayer]) engine.players[engine.activePlayer].chatting = true;
		game.updateScoreBoard();
		input.children[0].innerText = "Con:";
		input.children[1].focus();
		stopPropagation(e);
	}
	else if(specificState[0] == 'menu'/* || engine.paused*/) //any menu, not game
	{
		var actmenu = document.getElementsByClassName("menu-active")[0];
		if(!actmenu)
		{
			if(engine.menus.length == 1) menu("menu:"+engine.menus[engine.menus.length-1]);
			else if(engine.menus.length > 1) menu("exitmenu");
			else menu("menu:main");
			return;
		}
		if(actmenu.attributes.id)
			actid = actmenu.attributes.id.value;
		else
			actid = "";
		var actsp = actid.split(":");
		/*if(actsp[0] != "var" && (actsp[2] != "str" || actsp[2] == "color"))
			stopPropagation(e);*/
		//console.log(actid.split(":"));
		switch(keyCode)
		{
			case 13: //enter
				//menuSelect('enter',"key");
				break;
			case 27: //esc
				stopPropagation(e);
				menuSelect('esc',"key");
				break;
			case 37: //left
				menuSelect('left',"key");
				break;
			case 38: //up
				menuSelect('up',"key");
				break;
			case 39: //right
				menuSelect('right',"key");
				break;
			case 40: //down
				menuSelect('down',"key");
				break;
		}
	}
	else if(specificState[0] == 'input')
	{
		switch(keyCode)
		{
			case 9: //tab
				var input = document.getElementById("input");
				var textbox = input.children[1];
				var output = textbox.value;
				var split = output.split(" ");
				if(specificState[1] == "console")
				{
					
				}
				else switch(split[0])
				{
					case "/console":
						split[split.length-1]
						break;
					default:
						var p = getPlayer(split[split.length-1]);
						if(p)
						{
							//textbox.value += p.getColoredName();
							split[split.length-1] = p.getColoredName()+"0xffff7f";
							if(split.length == 1) split[split.length-1] += ", ";
							else split[split.length-1] += " ";
							textbox.value = split.join(" ");
						}
						else
						{
							engine.console.print("Matches:\n");
							for(var i=engine.players.length;i--;)
							{
								if(engine.players[i].name.toLowerCase().indexOf(name.toLowerCase()) > -1)
								{
									engine.console.print(engine.players[i].name+"\n");
								}
							}
						}
						break;
				}
				stopPropagation(e);
				break;
			case 27: case 13: //escape or return
				var input = document.getElementById("input");
				var textbox = input.children[1];
				var output = textbox.value; textbox.value = "";
				input.style.display = "none";
				if(engine.players[engine.activePlayer]) engine.players[engine.activePlayer].chatting = false;
				engine.inputState = engine.inputStatePrev; 
				game.updateScoreBoard();
				if(keyCode == 13) //return
				{
					switch(specificState[1])
					{
						case "chat":
							handleChat(engine.players[engine.activePlayer]||(new Player({})),output);
							break;
						case "console":
							engine.console.print("0x7f7fff> "+output+"\n");
							loadcfg(output);
							break;
					}
					//engine.inputState = engine.inputStatePrev;
				}
				break;
		}
	}
	else if(engine.inputState == 'game') //game settings.controls
	{
		gameControl(keyCode);//send keycode to control function
		//if(engine.inputState.split(':')[0] == "input" || keyCode == 9)
			stopPropagation(e);
	}
	else //parse input state (typically settings to add/remove controls)
	{
		if(specificState[0] == 'controlAR')
		{
			stopPropagation(e);
			if(!e.forceHACK && e.keyCode == 27)
			{
				engine.inputState = "menu:"+engine.menus[engine.menus.length-1]; menu("reload");
				return;
			}
			var temp_items = Object.keys(settings.controls);
			var temp_item = temp_items.indexOf(specificState[1]) || 0;
			
			if(settings.controls[specificState[1]].indexOf(keyCode) > -1) //control is there already
			{
				settings.controls[specificState[1]].splice(settings.controls[specificState[1]].indexOf(keyCode), 1); //remove
			}
			else
			{
				for(var i=0;i<temp_items.length;i++)
				{
					control = temp_items[i];
					//check existing controls and clear other instances of the new control
					if(control != specificState[1]) 
					{
						if(settings.controls[control].indexOf(keyCode) > -1)
						{
							settings.controls[control].splice(settings.controls[control].indexOf(keyCode),1); //remove control found
						}
					}
				}
				settings.controls[specificState[1]].push(keyCode); //add control to chosen option
				settings.controls[specificState[1]].sort(function(a,b){return a-b});//sort listing in order
			}
			
			engine.inputState = "menu:"+engine.menus[engine.menus.length-1]; menu("reload");
			
			//menu('menu-controls_'+temp_item);
			
		}
	}
}

var keyboardKeyUp = function(e)
{
	if(engine.inputState == 'game')//game settings.controls
	{
		gameControlUp(getKeyCode(e));
	}
	
	var specificState = engine.inputState.split(':');
	if(specificState[0] == "input")
	{
		var input = document.getElementById("input");
		var textbox = input.children[1];
		var output = textbox.value;
		
		// save history
		var history = engine.inputHistory[specificState[1]];
		history[1*history.pos] = output;
		
		// output preview
		(input.getElementsByClassName("input_preview")[0]).innerHTML = "Preview: "+replaceColors(output);
	}
}
//GAME

function touchControl(e)
{
	if(!document.oncontextmenu) 
		document.oncontextmenu = function(){return false}
	if(engine.inputState == 'game')
	{
		//console.log(e);
		var sepX = document.body.offsetWidth/3, sepY = document.body.offsetHeight/2;
		if(engine.players[engine.activePlayer] && engine.gtime > 0)
		{
			/*engine.console.print(e.touches.length+" touches");
			for(var x=e.touches.length-1;x>=0;x--)*/
			var x = 0; //other touch appears to get sent in another message anyway
			{
				//var dir = (e.touches[x].clientX < half)?-1:1;
				if(e.touches[x].clientX > sepX*2)
				{
					var dir = 1;
				}
				else if(e.touches[x].clientX > sepX)
				{
					if(e.touches[x].clientY < sepY)
					{
						engine.players[engine.activePlayer].boosting = !engine.players[engine.activePlayer].boosting;
					}
					else
					{
						engine.players[engine.activePlayer].braking = !engine.players[engine.activePlayer].braking;
					}
					return;
				}
				else
				{
					var dir = -1;
				}
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].turn(dir);
				else if(engine.players[engine.activePlayer].dedtime+1000 > performance.now())
					game.changeViewTarget(dir);
			}
		}
	}
}

//game settings.controls - keydown
function gameControl(keycode)
{
	if(engine.controls.pressed.indexOf(keycode) == -1)
	{
		if(engine.players[engine.activePlayer] && engine.gtime > 0)
		{
			if(settings.controls.left.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].turn(-1);
				else if(engine.players[engine.activePlayer].dedtime+1000 < performance.now())
					game.changeViewTarget(-1);
				engine.controls.pressed.push(keycode);
			}
			if(settings.controls.right.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].turn(1);
				else if(engine.players[engine.activePlayer].dedtime+1000 < performance.now())
					game.changeViewTarget(1);
				engine.controls.pressed.push(keycode);
			}
			if(settings.controls.north.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].turnAbs(0,1);
			}
			if(settings.controls.south.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].turnAbs(0,-1);
			}
			if(settings.controls.east.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].turnAbs(1,0);
			}
			if(settings.controls.west.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].turnAbs(-1,0);
			}
			if(settings.controls.togglebrake.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].braking = !engine.players[engine.activePlayer].braking;
				engine.controls.pressed.push(keycode);
			}
			if(settings.controls.brake.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].braking = true;
				engine.controls.pressed.push(keycode);
			}
			if(settings.controls.boost.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
				{
					if(settings.CYCLE_BOOST == 0 && settings.CYCLE_BRAKE < 0)
						engine.players[engine.activePlayer].braking = true;
					else
						engine.players[engine.activePlayer].boosting = true;
				}
				engine.controls.pressed.push(keycode);
			}
			if(settings.controls.jump.indexOf(keycode) > -1)
			{
				if(engine.players[engine.activePlayer].alive)
					engine.players[engine.activePlayer].jump();
				engine.controls.pressed.push(keycode);
			}
		}
		if(settings.controls.look_left.indexOf(keycode) > -1)
		{
			engine.camera.userViewDir = engine.players[engine.viewTarget].left;
			engine.controls.pressed.push(keycode);
		}
		if(settings.controls.look_right.indexOf(keycode) > -1)
		{
			engine.camera.userViewDir = engine.players[engine.viewTarget].right;
			engine.controls.pressed.push(keycode);
		}
		if(settings.controls.look_forward.indexOf(keycode) > -1)
		{
			engine.camera.userViewDir = cdir(engine.players[engine.viewTarget].rotation.z);
			engine.controls.pressed.push(keycode);
		}
		if(settings.controls.look_back.indexOf(keycode) > -1)
		{
			engine.camera.userViewDir = cdir(engine.players[engine.viewTarget].rotation.z-Math.PI);
			engine.controls.pressed.push(keycode);
		}
	}
	if(settings.controls.chat.indexOf(keycode) > -1)
	{
		var input = document.getElementById("input");
		input.style.display = "block";
		engine.inputStatePrev = engine.inputState;
		engine.inputState = "input:chat";
		if(engine.players[engine.activePlayer]) engine.players[engine.activePlayer].chatting = true;
		game.updateScoreBoard();
		input.children[0].innerText = "Say:";
		input.children[1].focus();
	}
	if ( settings.controls.camera.indexOf(keycode) > -1 ) {
	//do camera change
		if ( engine.controls.pressed.indexOf(keycode) == -1 ) { //if not pressed, CHANGE
			if (engine.views.indexOf(engine.view) == (engine.views.length-1) ) { //if is last view in list, go back to first [0]
				engine.view = engine.views[0];
			}
			else {//change UP in list
				engine.view = engine.views[((engine.views.indexOf(engine.view)) + 1)];
			}
		engine.controls.pressed.push(keycode);//add only if not added already to pressed keys
		}
		if(engine.audio)
		{
			if(engine.view == 'cockpit')
				engine.players[engine.viewTarget].audio.gain.setTargetAtTime(0.2, engine.audio.currentTime, 0.02);
			else
				engine.players[engine.viewTarget].audio.gain.setTargetAtTime(6, engine.audio.currentTime, 1);
		}
		console.log('CHANGE_CAMERA to '+engine.view);

	}
	if(settings.controls.score.indexOf(keycode) > -1)
	{
		var scoreboard = document.getElementById("scoreboard");
		scoreboard.style.display = scoreboard.style.display=="none"?"block":"none";
		game.updateScoreBoard();
	}
	if(settings.controls.esc.indexOf(keycode) > -1)
	{
		//do in game menu
		if( !engine.paused || engine.network )
			pauseMenuToggle();
	}
	if(settings.controls.scroll_up.indexOf(keycode) > -1)
	{
		engine.console.scroll(-10);
		engine.console.time_manual = performance.now();
	}
	if(settings.controls.scroll_down.indexOf(keycode) > -1)
	{
		engine.console.scroll(10);
		engine.console.time_manual = performance.now();
	}
	if(settings.controls.scroll_end.indexOf(keycode) > -1)
	{
		if(settings.TEXT_OUT_MODE == 1)
		{
			var lines = engine.console.scrollback
			var lnnum = engine.console.scrollby;
			var currln = lines[lnnum];
		}
		else
		{
			var lines = engine.console.innerText.split("\n");
			var lnnum = (-(parseFloat(engine.console.style.top)/engine.console.scrollby));
			var currln = lines[lnnum-1];
		}
		engine.console.time_manual = 0;
		engine.console.scroll(lines.length-lnnum-1);
	}
	if(settings.controls.pause.indexOf(keycode) > -1)
	{
		console.log('PAUSE');//do pause
	}
	for(var x=settings.instantchats.length-1;x>=0;--x)
	{
		if(settings.controls["instant_chat_"+x].indexOf(keycode) >= 0)
		{
			handleChat(engine.players[engine.activePlayer], settings.instantchats[x]);
		}
	}
}


//keyup
function gameControlUp(keycode)
{
	if(engine.controls.pressed.indexOf(keycode) > -1)
	{
		var temp = engine.controls.pressed.indexOf(keycode);
		if ( temp > -1 ) //if is pressed
			engine.controls.pressed.splice(temp, 1);
	}
	if(settings.controls.brake.indexOf(keycode) > -1)
	{
		engine.players[engine.activePlayer].braking = false;
	}
	if(settings.controls.boost.indexOf(keycode) > -1 )
	{
		if(settings.CYCLE_BOOST == 0 && settings.CYCLE_BRAKE < 0)
			engine.players[engine.activePlayer].braking = false;
		engine.players[engine.activePlayer].boosting = false;
	}
	if(
		settings.controls.look_left.indexOf(keycode) > -1 || 
		settings.controls.look_right.indexOf(keycode) > -1 ||
		settings.controls.look_forward.indexOf(keycode) > -1 ||
		settings.controls.look_back.indexOf(keycode) > -1
	)
	{
		engine.camera.userViewDir = false;
	}
}


function getKeyCode(e)
{
	if(e.keyCode == 16 && e.code == "ShiftRight")
	{
		// HACK: distinguish between left and right shift
		return -16;
	}
	
	if(keyCodeRemap[e.keyCode]) return keyCodeRemap[e.keyCode];
	
	return e.keyCode;
}

var keyCodeRemap = { 59:186, 61:187 }; //some browsers used alternate keycodes for ; and =

var keycodeList = {
	8: 'Backspace',
	13: 'Enter',
	16: 'Left Shift', "-16": "Right Shift",
	20: 'Capslock',
	17: 'Ctrl', 18: 'Alt',
	19: 'Pause/Break', 27: 'Escape', 93: 'Menu',
	9: 'Tab', 32: 'Spacebar',
	33: 'Page Up',34: 'Page Down',
	36: 'Home', 35: 'End',
	37: 'Left Arrow', 39: 'Right Arrow',
	38: 'Up Arrow', 40: 'Down Arrow',
	45: 'Insert', 46: 'Delete',
	48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 4: '6', 55: '7', 56: '8', 57: '9',
	65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z',
	91: 'Left Meta', 92: 'Right Meta',
	111: 'NUM /', 106: 'NUM *', 109: 'NUM -', 107: 'NUM +', 110: 'NUM .',
	96: 'NUM 0', 97: 'NUM 1', 98: 'NUM 2', 99: 'NUM 3', 100: 'NUM 4', 101: 'NUM 5', 102: 'NUM 6', 103: 'NUM 7', 104: 'NUM 8', 105: 'NUM 9',
	112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
	144: 'Num Lock', 145: 'Scroll Lock',
	186: ';',
	187: '=',
	188: ',',
	189: '-',
	190: '.',
	191: '/',
	192: '`',
	219: '[', 221: ']',
	220: '\\',
	222: '\'',
};
