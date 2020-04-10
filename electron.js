const {app,BrowserWindow} = require("electron");

let window; //global reference is needed for garbage collection

function createWindow()
{
	window = new BrowserWindow({icon:"favicon.ico",backgroundColor:"#000",show:false});
	
	window.loadFile("index.html");
	window.once("ready-to-show",window.show);
	window.on("closed",function(){window=null});
	window.autoHideMenuBar = true;
	window.setMenuBarVisibility(false);
}

app.on("ready",createWindow);
app.on("window-all-closed",app.quit);
app.on('activate',function(){if(!window) createWindow()});
