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

function connectionFailure(e)
{
	console.log(e); var msg;
	disconnectFromGame();menu("leave");showMenu();
	menu("menu:connectfail");
	if(engine.network)
	{
		engine.console.print(msg="An error occurred with the connection."); 
	}
	else
	{
		engine.console.print(msg="Couldn't connect to server. Please ensure your selected configuration settings are correct. "); 
	}
}

function connectionAborted(e)
{
	console.log(e); var msg;
	if(engine.network)
	{
		disconnectFromGame();menu("leave");showMenu();
		menu("menu:connectterm");
		engine.console.print(msg="Our connection with the server has been terminated.");
		msg += "  ";
		if(e.reason == "") engine.console.print(msg+="No reason given.\n"); else engine.console.print(msg+="Reason: "+e.reason+"\n");
	}
}

function connectToGame()
{
	if(!engine.network)
	{
		engine.playGame = false; engine.inputState = "game";
		try
		{
			switch(settings.CONNECT_TYPE)
			{
				case "3dc":
					engine.network = new Connection3dc(settings.CONNECT_HOST,settings.CONNECT_PORT,settings.CONNECT_SSL);
					engine.network.connection.onerror = connectionFailure;
					engine.network.connection.onclose = connectionAborted;
					break;
				case "arma":
					if(window.ConnectionArma)
					{
						if(settings.CONNECT_SSL)
						{
							setTimeout(function(){engine.console.print("Note: SSL is not supported by this protocol.\n")},0);
						}
						
						engine.network = new ConnectionArma(settings.CONNECT_HOST,settings.CONNECT_PORT);
						engine.network.on("error", connectionFailure);
						engine.network.on("close", connectionAborted);
						
						engine.network.connect();
					}
					else throw("Armagetron/Retrocycles is not directly supported! You can either connect through the bridge, or run the Electron client.");
					break;
				default: 
					throw "Unknown connection type specified!";
					break;
			}
			document.getElementById("progtitle").innerHTML = tStringify("@progtitleshort@ &bull; Connecting to "+settings.CONNECT_HOST+":"+settings.CONNECT_PORT);
			menu("menu:connect");
		}
		catch(e)
		{
			engine.console.print(e+"\n");
			console.error(e);
			disconnectFromGame();menu("leave");showMenu();
			menu("menu:");
			document.getElementById('menu').innerHTML = "<h1>An error occurred</h1><div style='text-align:left;font-size:11pt'>"+e+"</div>";
		}
	}
}

function disconnectFromGame()
{
	if(engine.network) engine.network.close();
	engine.connection = engine.network = false;
	engine.viewTarget = engine.activePlayer = 0;
	
	for(var i=netChanged.length-1;i>=0;--i)
	{
		chsetting(netChanged[i][0],netChanged[i][1],true);
	}
	netChanged = [];
}

function getNetTime()
{
	if(isNaN(this.diff)) this.diff = 0;
	return Date.now()-this.diff;
}
getNetTime.diff = 0;

function doNetSlide(cycle,timestep=1)
{
	if(isNaN(cycle.position.x) || isNaN(cycle.position.y))
	{
		cycle.position.x = cycle.newPos.x;
		cycle.position.y = cycle.newPos.y;
		delete cycle.newPos;
	}
	else
	{
		timestep *= settings.CYCLE_SMOOTH_TIME;
		if(timestep > 1) timestep = 1;
		cycle.lastpos.x = (cycle.position.x += (cycle.newPos.x-cycle.position.x)*timestep);
		cycle.lastpos.y = (cycle.position.y += (cycle.newPos.y-cycle.position.y)*timestep);
		if(cycle.haswall)
			cycle.walls.map[cycle.walls.map.length-1] = [cycle.position.x,cycle.position.y];
		cycle.resetCurrWallSegment();
		if(cycle.position.x == cycle.newPos.x && cycle.position.y == cycle.newPos.y) delete cycle.newPos;
	}
}
