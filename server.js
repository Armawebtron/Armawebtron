#!/usr/bin/node
global.window = global;
_GET = {};
datadir = process.env.HOME+"/.local/share/3dcycles-dedicated/";
cfgdir = process.env.HOME+"/.config/3dcycles-dedicated/";
srcdir = "./scripts/";
var color = false;
ignoreErrors = true; //ignore errors like browsers do? Can potentially leave the game in an undefined state
debugMessages = false; //spit out debug messages?
for(var i=2;i<process.argv.length;i++)
{
	switch(process.argv[i])
	{
		case "--help": case "-h":
			process.stdout.write("Usage: <cmd> [args]\n\n\
-h, --help                   : print this help message \n\
-v, --version                : print version information \n\
\n\
--userdatadir <Directory>    : read customized game data from this directory \n\
--configdir <Directory>      : read game configuration (.cfg-files) from this directory \n\
\n");
			process.exit();
		case "--version": case "-v":
			process.stdout.write("Armawebtron Server beta8\n");
			process.exit();
		case "--userdatadir":
			datadir = process.argv[++i];
			break;
		case "--configdir":
			cfgdir = process.argv[++i];
			break;
		case "--color": color = true; break;
		case "--no-color": color = false; break;
		
		default:
			process.stdout.write("Invalid argument. See <cmd> --help\n");
			process.exit();
	}
	
}
fs = require('fs');
try{fs.accessSync(datadir+"/var/");}catch(e){fs.mkdirSync(datadir+"/var/",{recursive:true});}
try{fs.accessSync(cfgdir);}catch(e){fs.mkdirSync(cfgdir,{recursive:true});}

var path = require("path");

var readline = require("readline");

http = require("http");
try{https = require("https")} catch(e) { console.warn("WARNING: Unable to load HTTPS module: \""+(e.message)+"\" SSL will be disabled."); }

WebSocket = require("ws");
//global.DOMParser = require('xmldom').DOMParser;
global.DOMParser = new (require("jsdom").JSDOM)().window.DOMParser;
global.THREE = require('./scripts//lib/Three.js'); //webgl framework (still neccessary)

global.Detector = {webgl:true};
global.localStorage = {
	getItem:function(file)
	{
		var fileDir;
		if(file.startsWith("included/"))
			fileDir = srcdir+"../cache/config/"+(file.replace("included/",""));
		else
			fileDir = cfgdir+"/"+file;
		fileDir = path.normalize(fileDir);
		if(!fileDir.startsWith(srcdir+"../cache/config/") && !fileDir.startsWith(cfgdir))
		{
			engine.console.print("SECURITY: Attempted access to outside path forbidden.\n",false);
		}
		try
		{
			return fs.readFileSync(fileDir).toString();
		}
		catch(err)
		{
			return null;
		}
	},
	setItem:function(file)
	{
		process.stderr.write("setItem: stud");
	}
}; 
/*var performance = {
	timeOrigin:new Date().getTime(),
	now:function(){return (new Date().getTime())-this.timeOrigin},
};*/
performance = {now:function(){return process.uptime()*1000}};
global.xmllint = require('./scripts//lib/xmllint.js'); //XML verification
require('./scripts//functions-head.js');
function mixCycle(){} //empty function for sound
ctx = false; // no sound
require('./scripts//config.js'); settings.FINISH_TYPE = 1;
settings.CYCLE_SYNC_INTERVAL = 0.5;
require('./scripts//engine.js'); 
engine.dedicated = true;
engine.console.color = color;
delete settings.players[0]; //delete client player
//engine.scene = new THREE.Scene(); // don't run init()
require('./scripts//functions-body.js');
require('./scripts//init.js');
global.AI = require('./scripts//ai.js');
global.Player = require('./scripts//player.js');
console.log(Player);
global.Team = require('./scripts//team.js');
global.Zone = require('./scripts//zone.js');
eval(''+fs.readFileSync('./scripts//buildObjects.js'));
global.game = require('./scripts//game.js');
global.render = function(){};

roundEndForce = function() //HACK to keep the round from spawning again
{
	if(settings.players.length == 0)
	{
		if(inround())
		{
			game.endRound(); engine.round = 0;
		}
		setTimeout(roundEndForce,2000);
	}
}

global.serverSleep = function()
{
	settings.players.splice(0);
	engine.players.splice(0);
	roundEndForce();
	engine.console.print("Nobody online, sleeping...\n");
	
	//process.exit(); //FIXME: stuff isn't reset properly otherwise
};

if(!engine.scene) init();

const { Connection3dc, Server3dc } = require('./scripts//network/3dc_net.js');
const { ConnectionArma, ServerArma } = require('./scripts//network/arma_net.js');

//window.svr = new Server3dc(null,settings.SERVER_PORT,settings.SERVER_SSL_ENABLED);
//window.svr = new ServerArma(null, 4534);

window.svrs = [
	new Server3dc(null,settings.SERVER_PORT,settings.SERVER_SSL_ENABLED),
	new ServerArma(null, 4534),
];
window.svr = new Proxy({}, {
	get: function(target, name, r)
	{
		switch(name)
		{
			case "clients":
				var a = [];
				for(var i=window.svrs.length-1;i>=0;--i)
				{
					a.push(...window.svrs[i].clients);
				}
				return a;
			
			default:
				// totally not a weird hack at all
				return(function()
				{
					for(let i=window.svrs.length-1;i>=0;--i)
					{
						window.svrs[i][name].apply( window.svrs[i], arguments );
					}
				});
		}
	}
});

engine.console.print("Informing master of our existance... (test)\n",false);
var mc = new WebSocket('ws://localhost:5330');
mc.on("open",function()
{
	mc.send(JSON.stringify({type:"server",data:settings.SERVER_PORT}));
});
mc.on("message",function(data)
{
	engine.console.print(data+"\n",false);
	mc.close();
});
mc.on("error",function()
{
	engine.console.print("Couldn't connect to master.\n",false);
});

const stdin = readline.createInterface(
{
	input:process.stdin, output:process.stdout, terminal:false,
});
stdin.on("line",function(event)
{
	loadcfg(event);
});


if(!debugMessages) console.debug = function(){};

process.on("uncaughtException",function(e)
{
	if(ignoreErrors)
	{
		engine.console.print("An uncaught error has occurred and has been logged to STDERR.\n",false);
		console.error(e);
	}
	else
	{
		
		throw e;
	}
});

//endRound();newRound();
//getGoing();
