const { app, BrowserWindow } = require("electron");
const ipcMain = require("electron").ipcMain;
const path = require("path");

let window; //global reference is needed for garbage collection

function createWindow()
{
	var args = "";
	for(var i=3;i<process.argv.length;++i)
	{
		switch(process.argv[i])
		{
			case "-h": case "--help":
				process.stdout.write("Usage: <cmd> [args]\n\n\
-h, --help                   : print this help message \n\
-v, --version                : print version information \n\
\n\
--connect <server>[:<port>]  : connect directly to SERVER, skipping all menus. default PORT=5331 \n\
--[no-]ssl                   : whether or not to enable SSL/TLS when connecting \n\
\n");
				app.quit();
				break;
			case "-v": case "--version":
				process.stdout.write("This is ");
				require("./scripts/functions-head.js");
				process.stdout.write(tStringify("@progtitle@ @version@.\n"));
				app.quit();
				break;
			case "--connect":
				args += "connect="+(process.argv[++i]).replace(/\&/g,"%26").replace(/\%/g,"%25")+"&";
				break;
			case "--ssl": args += "ssl=true&"; break;
			case "--no-ssl": args += "ssl=false&"; break;
			case "--type": args += "type="+encodeURIComponent(process.argv[++i])+"&"; break;
			
			default:
				process.stdout.write("Invalid argument \""+process.argv[i]+"\". See <cmd> --help\n");
		}
	}
	
	window = new BrowserWindow({icon:"favicon.ico",backgroundColor:"#000",show:true,
		webPreferences: {
			preload: path.join(app.getAppPath(),"main","src","electron","preload.js"),
			//contextIsolation: true,
			nodeIntegration: false,
		}
	});
	
	window.loadFile("main/index.html",{hash:args});
	window.once("ready-to-show",window.show);
	window.on("closed",function(){window=null});
	window.autoHideMenuBar = true;
	window.setMenuBarVisibility(false);
	
	ipcMain.on("fullscreen", function(e, arg)
	{
		if(arg !== null)
		{
			window.setFullScreen(Boolean(arg));
		}
		e.returnValue = window.isFullScreen();
	});
	
	ipcMain.on("size", function(e, arg)
	{
		if(arg[0] !== null && arg[1] !== null)
		{
			window.setSize(arg[0], arg[1]);
		}
		e.returnValue = window.getSize();
	});
	
}

ipcMain.on("consoleMessage", function(e, arg)
{
	console.log(arg);
});

app.on("ready",createWindow);
app.on("window-all-closed",app.quit);
app.on('activate',function(){if(!window) createWindow()});
