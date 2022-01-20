/*
 * Armawebtron - A lightcycle game.
 * Copyright (C) 2019-2020 Glen Harpring
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

function getServers()
{
	if(this == window) return getServers.apply(getServers, arguments);
	if(!this.doCheck)
	{
		// on new getServers()
		Object.assign(this, getServers);
		this.cache = [];
		this.masters = JSON.parse(JSON.stringify(getServers.masters));
		this.call = getServers;
	}
	else
	{
		this.doCheck();
		
		this.armaMaster();
	}
}

getServers.masters = {
	"tdc": [
		["localhost", 5330, false],
	],
	"arma": [
		["master1.armagetronad.org", 4533],
		["master2.armagetronad.org", 4533],
		["master3.armagetronad.org", 4533],
		["master4.armagetronad.org", 4533],
	],
};

getServers.connectionLimit = 10;

getServers.tdcMaster = function(oncomplete)
{
	if(this.tdcMaster.con)
	{
		this.tdcMaster.con.close();
		this.tdcMaster.con = null;
	}
	
	var master = this.masters.tdc.random();
	
	if(!master)
	{
		throw new Error("Falsey Armawebtron (3dc) master server");
	}
	
	engine.console.print("Connecting to Armawebtron (3dc) master server...\n");
	
	var con = (this.tdcMaster.con = new Connection3dc(master[0],master[1],master[2]));
	this.tdcMaster.con.isGameServer = false;
	var that = this;
	this.tdcMaster.con.customHandler = function(msg)
	{
		switch(msg.type)
		{
			case "server":
				console.log(msg);
				//for(var i=that.cache.length-1;i>=0;--i)
				{
					that.cache.push({
						host: msg.data[0],
						port: (msg.data[1])|0,
						ssl: Boolean(msg.data[2]),
						type: msg.data[2]||"3dc",
					});
					that.doCheck();
				}
				return true;
		}
		return false;
	};
	
	this.tdcMaster.con.onclose = function()
	{
		if( con === this.tdcMaster.con )
		{
			that.tdcMaster.con = null;
		}
	};
	
	this.tdcMaster.con.onopen = function()
	{
		this.tdcMaster.con.send({type: "servers"});
	};
};
getServers.tdcMaster.con = null;

getServers.armaMaster = function(oncomplete)
{
	if(this.armaMaster.con) return;
	
	if( !window.ConnectionArma || !window.nMessage )
	{
		engine.console.print("Unable to connect to Armagetron (arma) master server, unsupported or disabled by client...\n");
		return;
	}
	
	//engine.console.print("Connecting to Armagetron (arma) master server...\n");
	
	var master = this.masters.arma.random();
	if(!master)
	{
		engine.console.print("Unable to connect to Armagetron (arma) master server, none available.\n");
		throw new Error("Falsey Armagetron (arma) master server");
	}
	
	engine.console.print("Connecting to Armagetron (arma) master server "+((this.masters.arma.indexOf(master))+1)+"...\n");
	
	var con = (this.armaMaster.con = new ConnectionArma(master[0],master[1]));
	this.armaMaster.con.isGameServer = false;
	
	var that = this;
	
	this.armaMaster.con.on("connect", function()
	{
		engine.console.print("Success, fetching servers from Armagetron (arma) master server...\n");
		console.log(con);
		con.customHandler = function(msg)
		{
			switch(msg.descriptor)
			{
				case 50:
					var port = msg.getInt();
					var host = msg.getStr();
					
					that.cache.push({
						host: host,
						port: port,
						type: "arma",
					});
					that.doCheck();
					
					return true;
				
				case 3:
					that.armaMaster.con = null;
					return false;
			}
			return true;
		};
		
		// request hosts/ports
		var msg = new nMessage(52);
		con.send(msg);
	});
	
	this.armaMaster.con.connect();
	
	
};
getServers.armaMaster.con = null;

getServers.cache = [];
//getServers.master = null;
getServers.connections = 0;
getServers.idToFetch = 0;
getServers.fetchAnother = function()
{
	var id = this.idToFetch++;
	if(!this.cache[id])
	{
		console.log("Ran out of servers to fetch!");
		--this.idToFetch;
		return;
	}
	
	var con;
	switch(this.cache[id].type)
	{
		case "3dc":
			con = new Connection3dc(this.cache[id].host, this.cache[id].port, this.cache[id].ssl);
			con.isGameServer = false; //well, I mean, we're not trying to connect to it as a game server, just get info
			
			con.customHandler = function(msg)
			{
				switch(msg.type)
				{
					case "timeSync": case "time": case "reqtime": return true;
					case "info":
						getServers.onGetInfo(msg.data);
						con.close();
						return true;
				}
				return false;
			};
			
			con.onopen = function()
			{
				con.write({type:"info"});
			};
			
			getServers.connections++;
			
			con.onclose = function()
			{
				getServers.connections--;
				setTimeout(function(){getServers.doCheck()},0);
			};
			break;
		
		case "arma":
			if(typeof(ConnectionArma) === "undefined")
			{
				console.warn("Requested to get info for Armagetron server, but that won't work without ConnectionArma!")
				break;
			}
			
			con = new ConnectionArma(this.cache[id].host, this.cache[id].port);
			con.isGameServer = false;
			
			con.infoStartTime = performance.now();
			con.getInfo();
			
			getServers.connections++;
			
			con.pingBrowserTimeout = setTimeout(function()
			{
				getServers.connections--;
				getServers.doCheck();
			}, 10000)
			
			con.on("info", function(info)
			{
				info.ping = Math.round(performance.now() - con.infoStartTime);
				getServers.onGetInfo(id, info);
				
				clearTimeout(con.pingBrowserTimeout);
				con.close();
				
				getServers.connections--;
				setTimeout(function(){getServers.doCheck()},0);
			});
			
			break;
	}
	
};
getServers.doCheck = function()
{
	if(this.connections >= this.connectionLimit) return;
	this.fetchAnother();
};
getServers.doChecks = function(times)
{
	while((--times) > 0)
	{
		getServers.doCheck();
	}
}


getServers.onGetInfo = function(id, info)
{
	var server = getServers.cache[id];
	
	if(!server)
	{
		engine.console.print("Got info for invalid server\n");
		console.error(id, info);
	}
	
	for(var k in info)
	{
		switch(k)
		{
			case "host": server["host_by_server"] = info[k]; break;
			case "port": server["port_by_server"] = info[k]; break;
			
			case "ssl":  server[ "ssl_by_server"] = info[k]; break;
			case "type": server["type_by_server"] = info[k]; break;
			
			default:
				server[k] = info[k];
				break;
		}
	}
	
	var browserTable = document.getElementById("serverBrowserTable");
	var name = "server_"+server["host"]+":"+server["port"];
	var svr = document.getElementsByName(name)[0];
	var svr_name, svr_type, svr_ping, svr_usrs;
	if(!svr)
	{
		svr = document.createElement("tr");
		
		svr.onmouseover = function()
		{
			var a = Array.from(browserTable.children[0].children)
			a.forEach(function(e){e.className = "";document.onkeydown=null;});
			this.className = "fakemenu-active";
			
			var id = a.indexOf(this);
			
			document.onkeydown = function(e)
			{
				if(e.key == "ArrowDown")
				{
					stopPropagation(e);
					var it = browserTable.children[0].children[id+1];
					if(it && it.onmouseover)
					{
						it.onmouseover();
					}
					else
					{
						
						document.onkeydown = serverBrowserInput;
					}
				}
				else if(e.key == "ArrowUp")
				{
					stopPropagation(e);
					var it = browserTable.children[0].children[id-1];
					if(it && it.onmouseover)
					{
						it.onmouseover();
					}
					else
					{
						browserTable.children[0].children[browserTable.children[0].children.length-1].onmouseover();
					}
				}
				else if(e.key == "Enter")
				{
					svr.onclick();
				}
				else
				{
					serverBrowserInput(e);
				}
			};
		};
		svr.onclick = function()
		{
			serverBrowserExit();
			
			settings.CONNECT_HOST = server.host;
			settings.CONNECT_PORT = server.port;
			settings.CONNECT_SSL  = server.ssl ;
			settings.CONNECT_TYPE = server.type;
			
			connectToGame();
		};
		
		svr_name = document.createElement("td");
		svr.append(svr_name);
		svr_type = document.createElement("td");
		svr.append(svr_type);
		svr_ping = document.createElement("td");
		svr.append(svr_ping);
		svr_usrs = document.createElement("td");
		svr.append(svr_usrs);
		
		svr.setAttribute("name", name);
		
		browserTable.children[0].append(svr);
		
		var n = document.getElementsByName("server_null")[0];
		if(n)
		{
			browserTable.children[0].removeChild(n);
			svr.onmouseover();
		}
		
		document.getElementById("serverBrowser").style.position = "relative";
	}
	else
	{
		svr_name = svr.children[0];
		svr_type = svr.children[1];
		svr_ping = svr.children[2];
		svr_usrs = svr.children[3];
	}
	
	svr_name.innerHTML = replaceColors(htmlEntities(server.name));
	svr_type.innerText = "null";
	svr_ping.innerText = server.ping;
	svr_usrs.innerText = server.numPlayers+"/"+server.maxPlayers;
	
	if(!serverBrowserSort.timeout)
	{
		serverBrowserSort.timeout = setTimeout(serverBrowserSort, 1000);
	}
};

function serverBrowser()
{
	hideMenu();
	engine.console.print("Activate server browser\n");
	document.getElementById("serverBrowser").style.display = "block";
	document.getElementById("serverBrowser").className = document.getElementById("menu").className;
	document.getElementById("serverBrowser").style.backgroundColor = document.getElementById("menu").style.backgroundColor;
	
	engine.inputStatePrev = engine.inputState;
	engine.inputState = "";
	
	document.onkeydown = serverBrowserInput;
	var bExitButton = document.getElementsByClassName("bExitButton")[0];
	if(bExitButton)
	{
		bExitButton.onmouseover = function() { this.className = "bExitButton fakemenu-active"; }
		bExitButton.onmouseout = function() { this.className = "bExitButton"; }
	}
	
	getServers.idToFetch = 0;
	setTimeout(getServers,0);
	serverBrowserSort();
	getServers.autoPing = setInterval(function(){getServers.idToFetch = 0; getServers.doChecks(4)}, 45*1000);
}

function serverBrowserExit()
{
	document.onkeydown = null;
	document.getElementById("serverBrowser").style.display = "none";
	engine.inputState = engine.inputStatePrev;
	showMenu();
	getServers.idToFetch = 65521;
	
	clearTimeout(serverBrowserSort.timeout);
	clearInterval(getServers.autoPing);
}

serverBrowserSort.sortBy = 65521;
serverBrowserSort.rev = false;
serverBrowserSort.By = function(sortBy, rev)
{
	var sby = function(by,rev) 
	{ return(function()
		{
			serverBrowserSort.By(by, rev);
			serverBrowserSort(null, null, undefined, 250);
		}) 
	};
	
	var browser_name = document.getElementById("browser_name");
	browser_name.onclick = (sortBy==0&&(!rev))?sby(0, true):sby(0);
	browser_name = browser_name.children[0];
	var browser_type = document.getElementById("browser_type");
	browser_type.onclick = (sortBy==1&&(!rev))?sby(1, true):sby(1);
	browser_type = browser_type.children[0];
	var browser_ping = document.getElementById("browser_ping");
	browser_ping.onclick = (sortBy==2&&(rev))?sby(2):sby(2, true);
	browser_ping = browser_ping.children[0];
	var browser_usrs = document.getElementById("browser_usrs");
	browser_usrs.onclick = (sortBy==3&&(!rev))?sby(3, true):sby(3);
	browser_usrs = browser_usrs.children[0];
	
	var upd = String.fromCharCode(160)+String.fromCharCode(8593+((!rev)*2));
	
	browser_name.innerText = (sortBy==0)?upd:"";
	browser_type.innerText = (sortBy==1)?upd:"";
	browser_ping.innerText = (sortBy==2)?upd:"";
	browser_usrs.innerText = (sortBy==3)?upd:"";
	
	serverBrowserSort.sortBy = sortBy;
	serverBrowserSort.rev = !!rev;
}
function serverBrowserSort(timeout,sortBy,rev,maxsynctime=25)
{
	if( timeout == serverBrowserSort.timeout )
	{
		serverBrowserSort.timeout = null;
	}
	
	if( typeof(sortBy) !== "number" )
	{
		sortBy = serverBrowserSort.sortBy;
		if( sortBy < 0 ) serverBrowserSort.By(sortBy=0);
		if( sortBy > 3 ) serverBrowserSort.By(sortBy=3);
		if(rev === undefined)
		{
			rev = serverBrowserSort.rev;
		}
	}
	
	var browserTable = document.getElementById("serverBrowserTable");
	var servers;
	
	var comp, comp1, comp2;
	
	var sorting = true;
	var maxtime = performance.now()+maxsynctime;
	while( sorting && performance.now() < maxtime )
	{
		servers = browserTable.children[0].children;
		var l = (servers.length-1);
		
		sorting = false;
		for(var i=1;i<l;++i)
		{
			comp1 = servers[i  ].children[sortBy].innerText;
			comp2 = servers[i+1].children[sortBy].innerText;
			if(rev) { comp = comp2; comp2 = comp1; comp1 = comp; }
			
			switch(sortBy)
			{
				case 2: comp = ( parseInt(comp1) < parseInt(comp2) ); break;
				case 3: comp = ( parseInt(comp1) < parseInt(comp2) ); break;
				default: comp = ( comp1.toLowerCase() < comp2.toLowerCase() ); break;
			}
			
			if( comp )
			{
				browserTable.children[0].insertBefore(servers[i+1], servers[i])
				sorting = true;
				break;
			}
		}
	}
	if(sorting)
	{
		clearTimeout(serverBrowserSort.timeout);
		serverBrowserSort.timeout = setTimeout(function(t){serverBrowserSort(t, sortBy, rev, maxsynctime)}, 0);
	}
}

function serverBrowserInput(e)
{
	if(e.key == "Escape")
	{
		serverBrowserExit();
	}
	else if(e.key == "ArrowDown")
	{
		stopPropagation(e);
		var browserTable = document.getElementById("serverBrowserTable");
		for(var i=0;i<browserTable.children[0].children.length;++i)
		{
			if(browserTable.children[0].children[i].onmouseover)
			{
				browserTable.children[0].children[i].onmouseover();
				break;
			}
		}
		
	}
}
