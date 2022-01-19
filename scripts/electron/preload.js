
const ipc = require("electron").ipcRenderer;

const { ConnectionArma } = require("../network/arma_net.js");
const nMessage = require("../network/arma/nMessage.js");

window.nMessage = nMessage;
window.ConnectionArma = ConnectionArma;


window.electronFullscreen = function(f)
{
	if(typeof(f) !== "boolean") f = null;
	return ipc.sendSync("fullscreen", f);
};

window.electronSize = function(x, y)
{
	if(typeof(x) !== "number") f = null;
	if(typeof(y) !== "number") f = null;
	return ipc.sendSync("size", [x, y]);
}
