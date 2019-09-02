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

//change setting via keyboard (menuselect left or right)
function changeMenuItem(name,add,wrap=false,from=false,ref=false)
{
	var actmenu = document.getElementsByClassName("menu-active")[0];
	var actsp = name.split(":");
	//console.log(actsp);
	if(actsp[0] == "list")
	{
		var elem = actmenu.children[0].children[1];
		var keys = Object.keys(elem.options);
		var elempos = -1;
		for(i=0;i<keys.length;i++)
		{
			if(elem.options[keys[i]] == elem.innerText)
			{
				elempos = i; break;
			}
		}
		elempos += add;
		if(elempos >= keys.length) if(wrap) elempos = 0; else elempos = keys.length-1;
		if(elempos < 0) if(wrap) elempos = key.length-1; else elempos = 0;
		elem.innerHTML = replaceColors(elem.options[keys[elempos]]);
		elem.call(keys[elempos]);
	}
	else if(actsp[2] == "num")
	{
		var elem = actmenu.children[0].children[1];
		var value = parseFloat(elem.innerText);
		if(from != "key:enter") value += add*actmenu.add;
		if(value > actmenu.max) if(wrap) value = actmenu.min; else value = actmenu.max;
		if(value < actmenu.min) if(wrap) value = actmenu.max; else value = actmenu.min;
		elem.innerText = value;
		chsetting(actsp[1],value);
	}
}

//MENU SELECT 
//keyboard
function menuSelect(direction)
{
	//detect menu 
	//if (from != 'menu-about') {//if its a screen that has a menu with options
	var themenu = document.getElementById('menuList').childNodes;

	//detect menu position
	var selectedItem = -1;
	for(var x=0;x<themenu.length;x++)
	{
		if(hasClass(themenu[x],'menu-active')) selectedItem = x; //find which one is selected
	}
	
	switch(direction)
	{
		//change menu position
		case "up":
			selectedItem--;
			if(selectedItem < 0) selectedItem = themenu.length-1; //wrap to last item
			hoverSelect(themenu[selectedItem]);
			break;
		case "down":
			selectedItem++;
			if(selectedItem >= themenu.length) selectedItem = 0; //wrap to first item
			hoverSelect(themenu[selectedItem]);
			break;
		case "esc":
			//Exit Menu should be the last item, so convenient hack
			selectedItem = themenu.length-1;
			//[[FALLTHROUGH]]
		case "enter":
			document.activeElement.blur();//remove focus from any clicked menu items
			menu(themenu[selectedItem].id,"key:"+direction);
			break;
		//adjust setting - used to change a setting from current value, up or down some, whatever it is
		case "left":
			changeMenuItem(themenu[selectedItem].id,-1,false,"key:"+direction);
			break;
		case "right":
			changeMenuItem(themenu[selectedItem].id,1,false,"key:"+direction);
			break;
	}
}

function menuFindPrevSelectable()
{
	var themenu = document.getElementById('menuList').childNodes;
	var selectedItem = -1;
	for(var x=themenu.length-1;x>=0;x--)
	{
		if(selectedItem >= 0 && themenu[x].href)
		{
			return x;
		}
		if(hasClass(themenu[x],'menu-active')) selectedItem = x; //find which one is selected
	}
	return themenu.length-1;
}

function menuFindNextSelectable()
{
	var themenu = document.getElementById('menuList').childNodes;
	var selectedItem = -1;
	for(var x=0;x<themenu.length;x++)
	{
		if(selectedItem >= 0 && themenu[x].href)
		{
			return x;
		}
		if(hasClass(themenu[x],'menu-active')) selectedItem = x; //find which one is selected
	}
	return 0;
}

function hoverSelect(item) 
{ 
	var themenu = document.getElementById('menuList').childNodes;
	for(var x=0;x<themenu.length;x++)
	{
		if(hasClass(themenu[x],'menu-active')) themenu[x].className = '';
	}
	if(item.attributes.id) var stuff = item.attributes.id.value.split(":"); else var stuff = [];
	if(stuff[0] != "text")
		item.className = 'menu-active';
	if(stuff[0] == "var")
	{
		var txtarea = item.childNodes[0].childNodes[1];
		txtarea.focus();
		//txtarea.innerText = txtarea.innerText;
	}
	else
	{
		item.childNodes[0].focus(); //to detract focus off input boxes
	}
}

////////////////////////////////////////
//MENU - changes menus, performs basic actions when menu switching (pause), optional active menu element
function menu(act,from=false)
{
	var selectedItem = 0, ract=act;
	if(act == "exitmenu")
	{
		var exitmenu = "menu:"+engine.menus[engine.menus.length-1];
		act = "menu:"+engine.menus[engine.menus.length-2];
		engine.menus.splice(engine.menus.length-2,2);
	}
	else if(act == "reload")
	{
		act = engine.inputState;
		engine.menus.splice(engine.menus.length-1,1);
		var themenu = document.getElementById('menuList').childNodes;
		//detect menu position
		var selectedItem = -1;
		for(var x=0;x<themenu.length;x++)
		{
			if(hasClass(themenu[x],'menu-active')) selectedItem = x; //find which one is selected
		}
	}
	var s = act.split(":");
	var action = s.shift(); //set action to first argument while removing it
	var arg = s.join(":"); //and rejoin them
	
	var split = act.split(":"); //other method
	switch(action)
	{
		case "menu":
			engine.concatch = engine.msgcatch = undefined;
			document.getElementById('menu').innerHTML = "<h1>I don't know either</h1>";
			var doc = engine.menu.getElementsByTagName("Menus");
			if(doc.length > 0)
			{
				var menus = doc[0].getElementsByTagName("Menu");
				for(var x=0;x<menus.length;x++)
				{
					var cmenu = menus[x];
					if(cmenu.attributes.id.value == split[1])
					{
						if(cmenu.attributes.title)
							document.getElementById('menu').innerHTML = "<h1>"+replaceColors(tStringify(cmenu.attributes.title.value))+"</h1>";
						var items = cmenu.getElementsByTagName("Item");
						var list = document.createElement("UL");
						list.setAttribute("id","menuList");
						for(var i=0;i<items.length;i++)
						{
							var item = items[i];
							var parent = document.createElement("LI");
							var element = document.createElement("A");
							//var text = document.createTextNode(item.attributes.text.value);
							var text = document.createElement("SPAN");
							text.innerHTML = replaceColors(tStringify(item.attributes.text.value));
							if(item.attributes.style)
							{
								parent.setAttribute("style",item.attributes.style.value);
							}
							if(item.attributes.var || item.attributes.call)
							{
								//text.appendData(": ");
								text.append(": ");
								if(item.attributes.type && item.attributes.type.value == "list")
								{
									parent.setAttribute("id",item.attributes.type.value);
									var input = document.createElement("SPAN");
									input.options = [];
									if(item.attributes.call)
									{
										input.call = eval(item.attributes.call.value);
									}
									else
									{
										input.call = mkSettingCallback(item.attributes.var.value,true);
									}
									if(item.attributes.from)
									{
										var si = getVarFromString(item.attributes.from.value);
										var subitems = si[0][si[1]];
										for(var z=0;z<subitems.length;z++)
										{
											var option = subitems[z];
											input.options[option] = option;
										}
									}
									else
									{
										var subitems = item.getElementsByTagName("Option");
										for(var z=0;z<subitems.length;z++)
										{
											var option = subitems[z];
											input.options[option.attributes.value.value] = tStringify(option.attributes.text.value);
										}
									}
									input.innerHTML = replaceColors(input.options[input.call()])
								}
								else if(item.attributes.type.value == "keys")
								{
									var input = document.createElement("SPAN");
									var one = settings.controls[item.attributes.var.value];
									if(!one)
									{
										var vri = getVarFromString(item.attributes.var.value);
										one = vri[0][vri[1]];
									}
									var out = "";
									console.log(one.length);
									for(var z=0;z<one.length;z++)
									{
										if(z != 0) out += ", ";
										out += keycodeList[one[z]];
									}
									if(out == "") out = "Unbound";
									input.appendChild(document.createTextNode(out));
									parent.setAttribute("id","controlAR:"+item.attributes.var.value);
								}
								else 
								{
									parent.setAttribute("id","var:"+item.attributes.var.value+":"+item.attributes.type.value);
									var input = document.createElement("SPAN");
									input.setAttribute("contenteditable",true);
									var vri = getVarFromString(item.attributes.var.value);
									input.appendChild(document.createTextNode(vri[0][vri[1]]));
									//input.setAttribute("oninput","settings."+item.attributes.var.value+" = this.innerText");
									switch(item.attributes.type.value)
									{
										case "num":
											if(item.attributes.range)
											{
												var spl = item.attributes.range.value.split(",");
												var min = parseFloat(spl[0]), max = parseFloat(spl[1]);
											}
											else
											{
												var min = -Infinity, max = Infinity;
											}
											if(item.attributes.add) add = item.attributes.add.value;
											else add = 1;
											parent.min = min; parent.max = max; parent.add = add;
											break;
										case "color":
											//input.style.color=input.innerText;
											input.oninput = function()
											{
												this.style.color=this.innerText;
												//this.style.background=getDarkBGFromHex(this.style.innerText);
											}
											input.setAttribute("onblur","this.innerText = chsetting(\""+item.attributes.var.value+"\",'#'+(new THREE.Color(this.innerText.toLowerCase()).getHexString()),true);this.oninput()");
											input.className += " darktext";
											input.oninput();
											break;
										default:
											input.setAttribute("oninput","chsetting(\""+item.attributes.var.value+"\",this.innerText,true)");
											break;
									}
								}
								element.setAttribute("href","javascript:void(0);");
							}
							else
							{
								var input = false;
								if(item.attributes.from)
								{
									var fromsplit = item.attributes.from.value.split(":");
									var obj = {to:text,type:fromsplit[1]?fromsplit[1]:"all"};
									switch(fromsplit[0])
									{
										case "con": engine.concatch = obj; break;
										case "msg": engine.msgcatch = obj; break;
									}
								}
								if(item.attributes.type.value != "text")
								{
									switch(item.attributes.type.value)
									{
										case "submenu":
											parent.setAttribute("id","menu:"+item.attributes.onenter.value);
											break;
										case "js":
											parent.setAttribute("id","js:"+item.attributes.onenter.value);
											break;
										case "exitmenu":
											if(cmenu.attributes.exitmenu)
											{
												parent.setAttribute("id","js:"+cmenu.attributes.exitmenu.value);
											}
											else
											{
												//parent.setAttribute("id",engine.inputState);
												parent.setAttribute("id","exitmenu");
											}
											break;
										default:
											parent.setAttribute("id",item.attributes.type.value);
											break;
									}
									element.setAttribute("href","javascript:void(0);");
								}
							}
							element.setAttribute("onmouseover","hoverSelect(this.parentNode)");
							element.setAttribute("onclick","menu(this.parentNode.id)");
							element.appendChild(text);
							if(input !== false) element.appendChild(input);
							parent.appendChild(element);
							list.appendChild(parent);
						}
						engine.inputState = "menu:"+cmenu.attributes.id.value;
						document.getElementById('menu').appendChild(list);
						if(ract == "exitmenu") //select the menu we just left
						{
							var themenu = document.getElementById('menuList').childNodes;
							for(var x=0;x<themenu.length;x++)
							{
								if(exitmenu == themenu[x].id) selectedItem = x;
							}
						}
						hoverSelect(document.getElementById("menuList").children[selectedItem])
						engine.menus.push(cmenu.attributes.id.value);
						return true;
					}
				}
			}
			console.log("Menu called not found.");
			break;
		case "controlAR":
			engine.inputState = act;
			document.getElementById('menuList').getElementsByClassName("menu-active")[0].childNodes[0].childNodes[1].innerHTML = "Press a key...";
			break;
		case "var": case "list":
			changeMenuItem(action,1,true,from,"menu")
			break;
		case "js":
			return eval(arg);
			break;
		case "leave"://return to main menu from pause state
			endGame(); disconnectFromGame();
			engine.menus = []; menu("menu:main");
			document.getElementById('menu').className = "noselect mainbg_"+settings.MENU_RENDER;
			aamenurender(); showMenu();
			break;
		case 'quit'://quit game action from any menu
			window.open('','_self',''); window.close(); location.replace('quit.html');
			break;
		case 'unpause'://return to game from pause menu
			document.getElementById('menu').style.display = 'none';
			if(engine.paused) { unpauseRender(); } 
			engine.inputState = 'game';
			break;
		default:
			console.log("What's this? "+action);
			return false;
	}
}

function pauseMenuToggle()
{
	if(engine.inputState == "game")
	{
		if(engine.network) 
		{
			engine.players[engine.activePlayer].chatting=true;
		}
		else
		{
			pauseRender();
		}
		menuSetup(true);
		menu('menu:pause'); showMenu();
	}
	else
	{
		if(engine.network) 
		{
			engine.players[engine.activePlayer].chatting=false;
		}
		unpauseRender();
		hideMenu(); engine.inputState = 'game';
	}
}

function menuSetup(game=false)
{
	if(game) //ingame menu
	{
		document.getElementById('menu').className = "noselect pausebg"; 
		document.getElementById('menu').style.backgroundColor = "";
	}
	else
	{
		aamenurender(); //let render selection handle it
	}
}

function hideMenu()
{
	document.getElementById('menu').style.display = 'none'; //hide menu
}

function showMenu()
{
	document.getElementById('menu').style.display = 'block'; //show menu
}
