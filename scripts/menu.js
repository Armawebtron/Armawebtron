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
		chsetting(actsp[1],value,true);
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
	var lastSelected = selectedItem;
	
	switch(direction)
	{
		//change menu position
		case "up":
			selectedItem = menuFindSelectable(selectedItem, -1);
			if(selectedItem < 0) selectedItem = themenu.length-1; //wrap to last item
			hoverSelect(themenu[selectedItem]);
			break;
		case "down":
			selectedItem = menuFindSelectable(selectedItem, +1);
			console.log(selectedItem);
			if(selectedItem >= themenu.length) selectedItem = menuFindSelectable(0, 1); //wrap to first item
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

function menuFindSelectable(selectedItem, it)
{
	var themenu = document.getElementById('menuList').childNodes;
	for(var x=selectedItem+it;x<themenu.length;x+=it)
	{
		if(!themenu[x] || themenu[x].id)
		{
			return x;
		}
	}
	return themenu.length;
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
	if(!item) return;
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

function menuIf(syntax) 
{
	return !!((new Function("return "+(syntax.replace(/not /g,"!").replace(/ and /g,"&&").replace(/ or /g,"||"))))())
}

function parseItem(cmenu,item)
{
	for(var a=item.attributes.length-1;a>=0;--a)
	{
		if(!item.attributes[a].valueReal) item.attributes[a].valueReal = item.attributes[a].value;
		item.attributes[a].value = item.attributes[a].valueReal;
		while(item.attributes[a].value.match(new RegExp("\\$\\((.+)\\)",'g')))
		{
			item.attributes[a].value = item.attributes[a].value.replace(new RegExp("\\$\\(([^\\$()]+)\\)",'g'),
			function(x, x1)
			{
				try
				{
					var s = getVarFromString(x1);
					return s[0][s[1]];
				}
				catch(e)
				{
					console.error(e);
				}
			});
		}
	}
	
	var parent = document.createElement("LI");
	var element = document.createElement("A");
	//var text = document.createTextNode(item.attributes.text.value);
	var text = document.createElement("SPAN");
	text.innerHTML = replaceColors(tStringify(item.attributes.text.value));
	if(item.attributes.title)
	{
		text.title = item.attributes.title.value;
	}
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
				input.call = ((new Function("return "+item.attributes.call.value))());
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
					input.setAttribute("oninput","chsetting(\""+item.attributes.var.value+"\",this.innerText,true)");
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
				case "submenuDynamic":
					parent.setAttribute("id","dynamic:"+cmenu.attributes.id.value+":"+item.attributes.onenter.value);
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
	element.setAttribute("onmousemove","hoverSelect(this.parentNode)");
	element.setAttribute("onclick","menu(this.parentNode.id)");
	if( (""+parent.getAttribute("id")).indexOf("js:") === 0 )
	{
		element.setAttribute("onclick",(""+parent.getAttribute("id")).slice(3));
	}
	element.appendChild(text);
	if(input !== false) element.appendChild(input);
	parent.appendChild(element);
	return parent;
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
		case "dynamic":
			engine.concatch = engine.msgcatch = undefined;
			document.getElementById("inputbuttons").style.display = "none";
			document.getElementById('menu').innerHTML = "<h1>I don't know either</h1>";
			var doc = engine.menu.getElementsByTagName("Menus");
			if(doc.length > 0)
			{
				var dynamic;
				if(action == "dynamic")
				{
					dynamic = "dynamic:"+split[1]+":"+split[2];
				}
				
				var menus = doc[0].getElementsByTagName("Menu");
				for(var x=0;x<menus.length;x++)
				{
					var cmenu = menus[x];
					if(cmenu.attributes.id.value == split[1])
					{
						if(cmenu.attributes.title)
							document.getElementById('menu').innerHTML = "<h1>"+replaceColors(tStringify(cmenu.attributes.title.value))+"</h1>";
						window.test = cmenu;
						//var items = cmenu.getElementsByTagName("Item");
						var list = document.createElement("UL");
						list.setAttribute("id","menuList");
						for(var i=0;i<cmenu.children.length;i++)
						{
							var item = cmenu.children[i];
							switch(item.nodeName)
							{
								case "Item":
									if(!item.attributes.if || menuIf(item.attributes.if.value)) 
									{
										list.appendChild(parseItem(cmenu,item));
									}
									break;
								case "ItemsDynamic":
									var comp = item.attributes.menu.value;
									if( action == "dynamic" ) comp = split[2];
									dynamic = "dynamic:"+split[1]+":"+comp;
									for(var s=0;s<menus.length;++s)
									{
										var csmenu = menus[s];
										if( csmenu.attributes.id.value == comp )
										{
											console.log(comp);
											item.attributes.menu.value = comp;
											
											for(var si=0;si<csmenu.children.length;++si)
											{
												var sitem = csmenu.children[si];
												switch(sitem.nodeName)
												{
													case "Item":
														if( !sitem.attributes.if || menuIf(sitem.attributes.if.value) )
														{
															list.appendChild(parseItem(csmenu,sitem));
														}
														break;
												}
											}
											
											break;
										}
									}
									break;
								case "Foreach":
									var vri = getVarFromString(item.attributes.var.value);
									var t = vri[0][vri[1]];
									for(var y=0;y<t.length;++y)
									{
										for(var z=0;z<item.children.length;++z)
										{
											var node = item.children[z].cloneNode();
											for(var a=node.attributes.length-1;a>=0;--a)
											{
												node.attributes[a].value = node.attributes[a].value.replace(new RegExp("\\$\\("+item.attributes.as.value+"\\)",'g'),y);
											}
											
											if( !node.attributes.if || menuIf(node.attributes.if.value) )
											{
												list.appendChild(parseItem(cmenu,node));
											}
										}
									}
									break;
							}
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
						if(dynamic)
						{
							var themenu = document.getElementById('menuList').childNodes;
							for(var x=0;x<themenu.length;x++)
							{
								if(dynamic == themenu[x].id)
								{
									themenu[x].style.color = "#ff8800";
									if( ract != "reload" && ract != "exitmenu" )
									{
										selectedItem = x;
									}
								}
							}
						}
						if(!selectedItem) selectedItem = menuFindSelectable(selectedItem-1, 1);
						hoverSelect(document.getElementById("menuList").children[selectedItem])
						if(action == "menu") engine.menus.push(cmenu.attributes.id.value);
						return true;
					}
				}
			}
			console.log("Menu called not found.");
			break;
		case "controlAR":
			engine.inputState = act;
			document.getElementById('menuList').getElementsByClassName("menu-active")[0].childNodes[0].childNodes[1].innerHTML = "Press a key...";
			document.getElementById("inputbuttons").style.display = "block";
			break;
		case "var": case "list":
			changeMenuItem(action,1,true,from,"menu")
			break;
		case "js":
			return ((new Function(arg))());
			break;
		case "leave"://return to main menu from pause state
			game.end(); disconnectFromGame();
			engine.menus = []; menu("menu:main");
			document.getElementById('menu').className = "noselect mainbg_"+settings.MENU_RENDER;
			aamenurender(); showMenu();
			document.title = tStringify("@progtitleshort@");
			break;
		case 'quit'://quit game action from any menu
			window.open('','_self',''); window.close(); location.replace('about:blank');
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
		if(engine.network && engine.players[engine.activePlayer]) 
		{
			engine.players[engine.activePlayer].chatting=true;
		}
		else
		{
			game.pause();
		}
		menuSetup(true);
		menu('menu:pause'); showMenu();
	}
	else
	{
		if(engine.network && engine.players[engine.activePlayer]) 
		{
			engine.players[engine.activePlayer].chatting=false;
		}
		game.unpause();
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
