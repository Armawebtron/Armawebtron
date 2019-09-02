//FUNC

function gafd(a,b) //! returns angle from xdir, ydir
{
	var c = 180 * Math.atan2(b,a) / Math.PI;
	0 > c && (c += 360);
	360 < c && (c -= 360);
	return c
}

function cdir(theta) //! Gets [xdir, ydir] from angle
{
	var x = Math.cos(theta);
	var y = Math.sin(theta);
	return [x,y];
}

function fileOpen(callback,type="plain/text")
{
	if(window.FileReader)
	{
		var f = document.createElement("input");
		f.type = "file";
		f.onchange = function(e)
		{
			if(e.target.files.length > 0)
			{
				var r = new FileReader();
				r.onload = function(e)
				{
					callback(e.target.result);
				}
				for(var i=0;i<e.target.files.length;i++)
				{
					switch(type)
					{
						case "plain/text":
							r.readAsText(e.target.files[i]);
							break;
						default:
							r.readAsDataURL(e.target.files[i]);
							break;
					}
				}
			}
		}
		f.click();
	}
	else
	{
		alert("FileReader doesn't exist in this browser. Contact nelg.");
		return false;
	}
}

function fileSave(filename,data,type="plain/text") //Based on https://stackoverflow.com/a/30832210
{
	//TODO: get type from filename / data ?
	var file = new Blob([data],{type:type});
	if(window.navigator.msSaveOrOpenBlob) // IE :(
		window.navigator.msSaveOrOpenBlob(file,filename);
	else
	{
		var a = document.createElement("a"), url = URL.createObjectURL(file);
		a.href = url; a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function()
		{
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);  
		},0); 
	}
}

function httpGet(url) //! gets HTTP requests synchroniously. DEPRECATED and wont work in nodejs
{
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET",url,false);
	xmlHttp.send(null);
	return xmlHttp.responseText;
}

function httpGetAsync(url,callback,errcb=false) //! gets HTTP requests asynchronously
{
	if(window.XMLHttpRequest)
	{
		var req = new XMLHttpRequest();
		req.onreadystatechange = function() 
		{ 
			if(req.readyState == 4 && req.status == 200)
				callback(req.responseText);
		}
		if(errcb)
		{
			req.onerror = errcb;
		}
		
		req.open("GET",url,true); 
		req.send(null);
	}
	else if(window.https && url.indexOf("https://") == 0)
	{
		var req = https.get(url,function(res)
		{
			res.data = "";
			res.on('data',function(data)
			{
				res.data += data;
				if(res.statusCode == 200)
					callback(res.data)
			});
		});
		if(errcb) req.on('error',errcb);
	}
	else if(window.http) //no https support
	{
		var req = http.get(url.replace("https://","http://"),function(res)
		{
			res.data = "";
			res.on('data',function(data)
			{
				res.data += data;
				if(res.statusCode == 200)
					callback(res.data)
			});
		});
		if(errcb) req.on('error',errcb);
	}
	else
	{
		throw "No methods to GET file";
	}
}

function xmlify(string) //! Gets XML object from string.
{
	var val;
	if (window.DOMParser) { val = (new DOMParser).parseFromString(string, "text/xml"); } 
	else { val = new ActiveXObject("Microsoft.XMLDOM"); val.async = !1; val.loadXML(string); }
	return val;
}

function getVarFromString(string) //! Find variable parameters from string, used in parsing menus
{
	var splice = string.split(".");
	var variable = settings, var2 = commands;
	for(var y=0;y<splice.length-1;y++)
	{
		try{variable = variable[splice[y]]}catch(e){variable = undefined}
		try{var2 = var2[splice[y]]}catch(e){var2 = undefined}
	}
	return [variable,splice[splice.length-1],var2];
}

function htmlEntities(str) //! Get HTML entities for some characters.
{
	return (""+str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\>/g,"&gt;").replace(/"/g,"&quot;");
}

function colorIsDark(r,g,b)
{
	return (
		(	r < 255*settings.FONT_MIN_R && 
			g < 255*settings.FONT_MIN_G && 
			b < 255*settings.FONT_MIN_B
		)|| r+g+b < 255*settings.FONT_MIN_TOTAL
	);
}

function getDarkBGFromHex(hex)
{
	var c = new THREE.Color(hex);
	if(colorIsDark(c.r,c.g,c.b))
		return "white";
	else 
		return "none";
}

function replaceColors(str)
{
	if(typeof(str) == "undefined") return typeof(str);
	var dark = "class=darktext";
	//Capitals are allowed because the processes here can handle them
	str = str.replace(settings.VERIFY_COLOR_STRICT?/0x([0-9A-Fa-f]{6}|RESETT)(.*?)(?=0x(?:[0-9A-Fa-f]{6}|RESETT)|$)/gm : /0x(.{6})(.*?)(?=0x(?:.{6})|$)/gm, 
		function(x)
		{
			if(x.substr(2,6) == "RESETT")
			{
				return x.substr(8);
			}
			else
			{
				//var darkI1="class=lighttext";
				var darkI1="";
				var r=parseInt(x[2]+x[3],16),g=parseInt(x[4]+x[5],16),b=parseInt(x[6]+x[7],16);
				//NOTE: unless using regex, javascript only replaces the first occurance
				if(isNaN(r)){if(isNaN(parseInt(x[2],16)))x=x.replace(x[2],"0");if(isNaN(parseInt(x[3],16)))x=x.replace(x[3],"0");r=parseInt(x[2]+x[3],16)}
				if(isNaN(g)){if(isNaN(parseInt(x[4],16)))x=x.replace(x[4],"0");if(isNaN(parseInt(x[5],16)))x=x.replace(x[5],"0");g=parseInt(x[4]+x[5],16)}
				if(isNaN(b)){if(isNaN(parseInt(x[6],16)))x=x.replace(x[6],"0");if(isNaN(parseInt(x[7],16)))x=x.replace(x[7],"0");b=parseInt(x[6]+x[7],16)}
				if(colorIsDark(r,g,b))
				{
					if(settings.TEXT_DARK_HIGHLIGHT)
					{
						darkI1 = dark;
					}
					if(settings.TEXT_BRIGHTEN)
					{
						if(r < settings.FONT_MIN_R) r += settings.FONT_MIN_R;
						if(g < settings.FONT_MIN_G) g += settings.FONT_MIN_G;
						if(b < settings.FONT_MIN_B) b += settings.FONT_MIN_B;
						if(colorIsDark(r,g,b))
						{
							r += settings.FONT_MIN_TOTAL/3;
							g += settings.FONT_MIN_TOTAL/3;
							b += settings.FONT_MIN_TOTAL/3;
						}
					}
				}
				return "<span "+darkI1+" style='color:rgb("+r+","+g+","+b+");'>"+x.substr(8)+"</span>";
			}
		});
	return str;
}

function removeColors(str)
{
	return str.replace(settings.VERIFY_COLOR_STRICT?/0x([0-9A-Fa-f]{6}|RESETT)(.*?)(?=0x(?:[0-9A-Fa-f]{6}|RESETT)|$)/gm : /0x(.{6})(.*?)(?=0x(?:.{6})|$)/gm,function(x){return x.substr(8)});
}

String.prototype.filter = function() //! Filter illegal player characters. Heavily based on ArmagetronAd's filtering.
{
	var char, out="", str = this.toString();
	for(var i=0;i<str.length;i++)
	{
		char = str.charCodeAt(i);
		if(char <= 126 && char > 32) //Leave ASCII characters but convert them to lower case
		{
			if(char == 48)
				out += "o"; //map 0 to o because z-man
			else
				out += str[i].toLowerCase();
		}
		//! map umlauts and similar to their base characters
		else if(char >= 0xc0 && char <= 0xc5) out += 'a';
		else if(char >= 0xd1 && char <= 0xd6) out += 'o';
		else if(char >= 0xd9 && char <= 0xdD) out += 'u';
		else if(char == 0xdf) out += 's';
		else if(char >= 0xe0 && char <= 0xe5) out += 'a';
		else if(char >= 0xe8 && char <= 0xeb) out += 'e';
		else if(char >= 0xec && char <= 0xef) out += 'i';
		else if(char >= 0xf0 && char <= 0xf6) out += 'o';
		else if(char >= 0xf9 && char <= 0xfc) out += 'u';
		else if(char >= 0xc0 && char <= 0xc5) out += 'a';
		else switch(char)
		{
			//some of those are a bit questionable, but still better than lots of underscores
			case 161: out += '!'; break;
			case 162: out += 'c'; break;
			case 163: out += 'l'; break;
			case 165: out += 'y'; break;
			case 166: out += '|'; break;
			case 167: out += 's'; break;
			case 168: out += '"'; break;
			case 169: out += 'c'; break;
			case 170: out += 'a'; break;
			case 171: out += '"'; break;
			case 172: out += '!'; break;
			case 174: out += 'r'; break;
			case 176: out += 'o'; break;
			case 177: out += '+'; break;
			case 178: out += '2'; break;
			case 179: out += '3'; break;
			case 182: out += 'p'; break;
			case 183: out += '.'; break;
			case 185: out += '1'; break;
			case 187: out += '"'; break;
			case 198: out += 'a'; break;
			case 199: out += 'c'; break;
			case 208: out += 'd'; break;
			case 209: out += 'n'; break;
			case 215: out += 'x'; break;
			case 216: out += 'o'; break;
			case 221: out += 'y'; break;
			case 222: out += 'p'; break;
			case 231: out += 'c'; break;
			case 241: out += 'n'; break;
			case 247: out += '/'; break;
			case 248: out += 'o'; break;
			case 253: out += 'y'; break;
			case 254: out += 'p'; break;
			case 255: out += 'y'; break;
			
			default: out += "_"; break; //unknown character, mapped to underscore
		}
	}
	return out;
}

function tStringify(str) //! 
{
	str = str.replace(/\$\w*/g,function(i){console.log(i.replace("\$",""));});
	str = str.replace(new RegExp("@progtitle@",'g'),"3DCycles Web");
	str = str.replace(new RegExp("@progtitleshort@",'g'),"3DCycles");
	str = str.replace(new RegExp("@progname@",'g'),"webtron");
	return str;
}

function pi(a=1) {return Math.PI*a} //! Finds multiples of PI.

function setNewFont(input) //! Gets font from user input. Not used anywhere anymore.
{
	input = input.toLowerCase();
	var output = "";
	switch(input) {
		case 'armagetronad':case 'armagetron':case 'arma':case 'tron':
			output = "Armagetronad";
			break;
		case 'flynn':case 'flyn':case 'flyyn':case 'flin':case 'user':case 'legacy':
			output = "Flynn";
			break;
		case 'serif':case 'srif':case 'serf':case 'srf':case 'font':
			output = "serif";
			break;
		case 'sans-serif':case 'sansserif':case 'sans':case 'sanserif':case 'san':
			output = "sans-serif";
			break;
		case 'nicefont':case 'nice':case 'nfont':
			output = "nicefont";
			break;
		case 'monospace':case 'mono':case 'fixedwidth':case 'fixed':
			output = "monospace";
			break;
		default:
			output = "Armagetronad";
	}
	return output;
}

function pointDistance(x1,y1,x2,y2)
{
  var xs = x2 - x1, ys = y2 - y1;
  return Math.sqrt( xs*xs + ys*ys );
}

function getLogicalBox(string) //! Parses map file and returns [x, y, minx, miny, maxx, maxy] or false on failure.
{
	var re = /(x|y)\=.-?(\d*.)?\d+/gi;
	var matches = string.match(re);
	var temp = 0;
	var box = [0,0,Infinity,Infinity,-Infinity,-Infinity];// x, y, minx, miny, maxx, maxy
	
	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			matches[i] = matches[i].replace(/\"|\'/g, '');
			//console.log(matches[i]);

			if (matches[i].indexOf("x") > -1) { //    x=250.25
				matches[i] = matches[i].replace('x=', '');
				temp = parseFloat(matches[i]);
				if (temp > box[4]) { box[4] = temp; }
				if (temp < box[2]) { box[2] = temp; }
			}
			if (matches[i].indexOf("y") > -1) { //    y=-25
				matches[i] = matches[i].replace('y=', '');
				temp = parseFloat(matches[i]);
				if (temp > box[5]) { box[5] = temp; }
				if (temp < box[3]) { box[3] = temp; }
			}
		}
		//get center
		box[0] = ( box[2] + box[4] ) / 2;
		box[1] = ( box[3] + box[5] ) / 2;
		//console.log(box);
		return box;
	}
	else {
		return false;
	}
}

function hasClass(element, cls) {//checks if element has classname, returns true | false
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function relPath(path,rel="/")
{
	//if(rel.indexOf("/") != 0) rel = "/"+rel;
	if(rel.indexOf("/",rel.length-1) == -1) rel += "/";
	
	if(path.indexOf("://") >= 0 || path.indexOf("/") == 0) return path;
	else return rel+path;
}

function inround() //! Tries to determine if we're in a round or not.
{
	return !engine.roundCommencing && engine.gtime >= -4000;
}

function deg2rad(angle)
{
	if(!isFinite(angle)) return angle;
	angle %= 360;
	if(angle < 0) angle += 360;
	var radians = angle * Math.PI / 180;
	return radians;
}
function rad2deg(radians)
{
	if(!isFinite(radians)) return radians;
	var angle = radians * 180 / Math.PI;
	angle %= 360;
	if(angle < 0) angle += 360;
	return angle;
}

function normalizeRad(radians)
{
	var pi2 = Math.PI*2;
	radians = radians%pi2;
	while(radians < 0) radians += pi2;
	return radians;
}


// BEGIN based on code from http://geomalgorithms.com/a07-_distance.html
// Copyright 2001 softSurfer, 2012 Dan Sunday
// This code may be freely used, distributed and modified for any purpose
// providing that this copyright notice is included with it.
// SoftSurfer makes no warranty for this code, and cannot be held
// liable for any real or imagined damage resulting from its use.
// Users of this code must verify correctness for their application.
var dot = function(ux,uy,vx,vy) { return ((ux*vx)+(uy*vy)); };
var SMALL_NUM = 0.00000001; // anything that avoids division overflow
function distanceoflines(x1,y1, x2,y2, x3,y3, x4,y4)
{
	var ux=x2-x1,uy=y2-y1;
	var vx=x4-x3,vy=y4-y3
	var wx=x1-x3,wy=y1-y3;
	//var a = dot(ux,uy,ux,uy), b = dot(ux,uy,vx,vy), c = dot(vx,vy,vx,vy), d = dot(ux,uy,wx,wy), e = dot(vx,vy,wx,wy);
	var a = (ux*ux)+(uy*uy), b = (ux*vx)+(uy*vy), c = (vx*vx)+(vy*vy), d = (ux*wx)+(uy*wy), e = (vx*wx)+(vy*wy); //probably faster
	var D = a*c - b*b;
	var sc,sN,sD = D;
	var tc,tN,tD = D;
	if(D < SMALL_NUM) //lines almost parallel
	{
		sN = 0; //force point p0 on segment s1
		sD = 1; //prevent possible division by zero
		tN = e; tD = c;
	}
	else //get closest points on the infinite lines
	{
		sN = (b*e - c*d); tN = (a*e - b*d);
		if(sN < 0) //sc < 0 => the s=0 edge is visible
		{
			sN = 0; tN = e; tD = c;
		}
		else if(sN > sD) //sc > 1 => the s=1 edge is visible
		{
			sN = sD; tN = e + b; tD = c;
		}
	}
	if(tN < 0) // tc < 0 => the t=0 edge is visible
	{
		tN = 0;
		//recompute sc this edge
		if(d>0) 
		{
			sN = 0;
		}
		else if(d<a) 
		{
			sN = sD;
		}
		else
		{
			sN = -d; sD = a;
		}
	}
	else if(tN > tD) //tc > 1 => the t=1 edge is visible
	{
		tN = tD;
		//recompute sc for this edge
		if((b-d) < 0)
		{
			sN = 0;
		}
		else if((b-d) > a)
		{
			sN = sD;
		}
		else
		{
			sN = (b-d); sD = a;
		}
	}
	//finally, do the division to get sc and tc;
	var sc = (Math.abs(sN) < SMALL_NUM ? 0.0 : sN / sD);
	var tc = (Math.abs(tN) < SMALL_NUM ? 0.0 : tN / tD);
	var dPx = wx + (ux * sc) - (vx * tc);
	var dPy = wy + (uy * sc) - (vy * tc);
	//console.log(dPx,dPy);
	//return Math.sqrt(dot(dPx,dPy,dPx,dPy));
	return Math.hypot(dPx,dPy);
}
// END

function is_in_circle(p1x, p1y, r1, p2x, p2y, r2=0)
{
	return(r1+r2 > Math.sqrt(Math.pow((p1x-p2x),2)+Math.pow((p1y-p2y),2)))
}

function lineIntersect(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y)
{
	var s1_x = p1_x - p0_x, s1_y = p1_y - p0_y, s2_x = p3_x - p2_x, s2_y = p3_y - p2_y;
	var s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y),
		t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);
	return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
}

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
//"encrytion" variables, not sure what they were for:
String.prototype.toEncodedString = function () {
    var ostr = this.toString().replace(/\s+/g, '');
    if (ostr.length < 8) {
        alert("Password must be at least 8 characters long with no spaces.");
        return null;
    };
    var x, nstr = '',
        len = ostr.length;
    for (x = 0; x < len; ++x) {
        nstr += (255 - ostr.charCodeAt(x)).toString(36).toUpperCase().toPaddedString(2, '0');
    };
    return nstr;
};
String.prototype.fromEncodedString = function () {
    var ostr = this.toString();
    var x, nstr = '',
        len = ostr.length;
    for (x = 0; x < len; x += 2) {
        nstr += String.fromCharCode(255 - parseInt(ostr.substr(x, 2), 36));
    };
    return nstr;
};
Number.prototype.toPaddedString = function (len, pad) {
    len = (len) ? Number(len) : 2;
    if (isNaN(len)) {
        alert("Padded String 'length' argument is not numeric.");
        return null;
    };
    var dflt = (isNaN(this.toString())) ? " " : "0";
    pad = (pad) ? pad.toString().substr(0, 1) : dflt;
    var str = this.toString();
    if (dflt == "0") {
        while (str.length < len) str = pad + str;
    }
    else {
        while (str.length < len) str += pad;
    };
    return str;
};
String.prototype.toPaddedString = Number.prototype.toPaddedString;

/**/
var encrypt1 = new Date().getTime();
encrypt1 = ""+encrypt1;//##############...
//var encrypt2 = encrypt1.toEncodedString();
//var str3 = str2.fromEncodedString();
/**/

function getSuperString() {
var superstring = encrypt1.toEncodedString();
superstring = "lightcycle"+superstring;
return superstring;
}
var ss = getSuperString();
