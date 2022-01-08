//FUNC

if(typeof(global) === "undefined")
	global = window;

global.dechex = function(h) { return (h|0).toString(16); } //! number to hexadecimal
global.hexdec = function(d) { return parseInt(d,16); } //! hexadecimal to number
global.strlen = function(s) { return (""+s).length ; } //! Length of string or anything converted to string

global.gafd = function(a,b) //! returns angle from xdir, ydir
{
	var c = 180 * Math.atan2(b,a) / Math.PI;
	0 > c && (c += 360);
	360 < c && (c -= 360);
	return c
}

global.cdir = function(theta) //! Gets [xdir, ydir] from angle
{
	var x = Math.cos(theta);
	var y = Math.sin(theta);
	return [x,y];
}

global.fileOpen = function(callback,type="plain/text")
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

global.fileSave = function(filename,data,type="plain/text") //Based on https://stackoverflow.com/a/30832210
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

global.httpGet = function(url) //! gets HTTP requests synchroniously. DEPRECATED and wont work in nodejs
{
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET",url,false);
	xmlHttp.send(null);
	return xmlHttp.responseText;
}

global.httpGetAsync = function(url,callback,errcb=false) //! gets HTTP requests asynchronously
{
	if(window.XMLHttpRequest)
	{
		var req = new XMLHttpRequest();
		req.onreadystatechange = function() 
		{ 
			if(req.readyState == 4)
				if(req.status == 200)
					callback(req.responseText);
				else if(errcb)
				{
					req.onerror = null; errcb();
				}
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
			});
			res.on('end',function()
			{
				if(res.statusCode == 200)
					callback(res.data)
				else if(errcb)
					errcb();
			});
		});
		if(errcb) req.on('error',errcb);
	}
	else if(window.http) //no https support
	{
		if( url.indexOf("https://") == 0 ) url = url.replace("https://","http://");
		var req = http.get(url,function(res)
		{
			res.data = "";
			res.on('data',function(data)
			{
				res.data += data;
			});
			res.on('end',function()
			{
				if(res.statusCode == 200)
					callback(res.data)
				else if(errcb)
					errcb();
			});
		});
		if(errcb) req.on('error',errcb);
	}
	else
	{
		throw "No methods to GET file";
	}
}

global.xmlify = function(string) //! Gets XML object from string.
{
	var val;
	if (window.DOMParser) { val = (new DOMParser).parseFromString(string, "text/xml"); } 
	else { val = new ActiveXObject("Microsoft.XMLDOM"); val.async = !1; val.loadXML(string); }
	return val;
}

global.getVarFromString = function(string) //! Find variable parameters from string, used in parsing menus
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

global.htmlEntities = function(str) //! Get HTML entities for some characters.
{
	return (""+str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\>/g,"&gt;").replace(/"/g,"&quot;");
}

global.htmlEntitiesNative = function(str) //! Get HTML entities for some characters with the browser's text processing
{
	if(document.createElement) return htmlEntities(str);
	var s=document.createElement("SPAN");
	s.innerText = str;
	return s.innerHTML;
}

global.color = function(r,g,b,h0="#")
{
	if( r > 15 || r < 0 ) r = 15;
	if( g > 15 || g < 0 ) g = 15;
	if( b > 15 || b < 0 ) b = 15;
	var h1 = dechex(r*17); if(h1.length == 1) h1 += h1;
	var h2 = dechex(g*17); if(h2.length == 1) h2 += h2;
	var h3 = dechex(b*17); if(h3.length == 1) h3 += h3;
	return h0+h1+h2+h3;
};

global.cycleColor = function(r,g,b)
{
	if(r < 0) r += 65536;
	if(g < 0) g += 65536;
	if(b < 0) b += 65536;
	r = 1+((r-1)%15);
	g = 1+((g-1)%15);
	b = 1+((b-1)%15);
	return color(r,g,b);
}

global.colorIsDark = function(r,g,b)
{
	return (
		(	r < 255*settings.FONT_MIN_R && 
			g < 255*settings.FONT_MIN_G && 
			b < 255*settings.FONT_MIN_B
		)|| r+g+b < 255*settings.FONT_MIN_TOTAL
	);
}

global.getDarkBGFromHex = function(hex)
{
	var c = new THREE.Color(hex);
	if(colorIsDark(c.r,c.g,c.b))
		return "white";
	else 
		return "none";
}

global.replaceColors = function(str,stripCodes=true) //! Get HTML for Armagetron color codes
{
	if(typeof(str) == "undefined") return typeof(str);
	var dark = "class=darktext";
	//Capitals are allowed because the processes here can handle them
	str = str.replace(settings.VERIFY_COLOR_STRICT?/0x([0-9A-Fa-f]{6}|RESETT)(.*?)(?=0x(?:[0-9A-Fa-f]{6}|RESETT)|$)/gm : /0x(.{6})(.*?)(?=0x(?:.{6})|$)/gm, 
		function(x)
		{
			if(x.substr(2,6) == "RESETT")
			{
				return x.substr(stripCodes?8:0);
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
				return "<span "+darkI1+" style='color:rgb("+r+","+g+","+b+");'>"+x.substr(stripCodes?8:0)+"</span>";
			}
		});
	return str;
}

global.removeColors = function(str)
{
	return str.replace(settings.VERIFY_COLOR_STRICT?/0x([0-9A-Fa-f]{6}|RESETT)(.*?)(?=0x(?:[0-9A-Fa-f]{6}|RESETT)|$)/gm : /0x(.{6})(.*?)(?=0x(?:.{6})|$)/gm,function(x){return x.substr(8)});
}

global.guessColor = function($hexCycle,$hexTrail) //! will hopefully find the best result matching both colors...
{
	// ported from php where I originally wrote it, hense the $ everywhere.
	
	if(global.guessColor.cached[$hexCycle+$hexTrail])
		return global.guessColor.cached[$hexCycle+$hexTrail];
	
	
	var $cycle_r = hexdec($hexCycle.substr(1,2))/17;
	var $cycle_g = hexdec($hexCycle.substr(3,2))/17;
	var $cycle_b = hexdec($hexCycle.substr(5,2))/17;
	
	if($hexCycle == $hexTrail)
	{
		return [$cycle_r,$cycle_g,$cycle_b];
	}
	
	$trail_r = hexdec($hexTrail.substr(1,2))/17;
	$trail_g = hexdec($hexTrail.substr(3,2))/17;
	$trail_b = hexdec($hexTrail.substr(5,2))/17;
	
	var $bestcolor = [0,0,0];
	//var $errorCycle = Infinity;
	//var $errorTrail = Infinity;
	var $besterror = Infinity;
	
	var $r=0,$g=0,$b=0;
	while(true)
	{
		++$r;
		if($r > 31) { ++$g; $r = 0; }
		if($g > 31) { ++$b; $g = 0; }
		if($b > 31) { break; }
		
		
		var $trail_test_r = Math.min($r,15);
		var $trail_test_g = Math.min($g,15);
		var $trail_test_b = Math.min($b,15);
		
		var $cycle_test_r = 1+(($r-1)%15);
		var $cycle_test_g = 1+(($g-1)%15);
		var $cycle_test_b = 1+(($b-1)%15);
		
		$error = /*Math.pow*/( 
			(
				// check standard error
				Math.pow(($trail_r-$trail_test_r),2) +
				Math.pow(($trail_g-$trail_test_g),2) +
				Math.pow(($trail_b-$trail_test_b),2)
				
				+
				Math.pow(($cycle_r-$cycle_test_r),2) +
				Math.pow(($cycle_g-$cycle_test_g),2) +
				Math.pow(($cycle_b-$cycle_test_b),2) 
				
				/*
				// and emphasize difference between cycle and trail colors
				+
				Math.pow(($trail_test_r-$cycle_test_r),2) +
				Math.pow(($trail_test_g-$cycle_test_g),2) +
				Math.pow(($trail_test_b-$cycle_test_b),2)
				*/
			)//, 1/6
		);
		
		if($besterror > $error && color($r,$g,$b) != cycleColor($r,$g,$b))
		{
			$bestcolor[0] = $r;
			$bestcolor[1] = $g;
			$bestcolor[2] = $b;
			$besterror = $error;
		}
	}
	
	global.guessColor.cached[$hexCycle+$hexTrail] = $bestcolor;
	return $bestcolor;
}
global.guessColor.cached = {};

global.colorStr = function(c,b="#")
{
	switch(typeof(c))
	{
		case "string":
			return c.replace("#",b);
		case "object":
			return b+c.getHexString();
		case "number":
			var color = c.toString(16);
			color = ("0".repeat(6-color.length))+color;
			return b+color+this.name;
		default:
			console.warn("Can't get color");
			return b+"ffffff";
	}
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

global.tStringify = function(str) //! 
{
	str = str.replace(/\$\w*/g,function(i){console.log(i.replace("\$",""));});
	str = str.replace(new RegExp("@progtitle@",'g'),"Armawebtron");
	str = str.replace(new RegExp("@progtitleshort@",'g'),"Armawebtron");
	str = str.replace(new RegExp("@progname@",'g'),"webtron");
	str = str.replace(new RegExp("@version@",'g'),"1.0.0-beta8");
	if(str.indexOf("@netversion@") >= 0)
	{
		var netvers;
		var cli = new Connection3dc({
			send:function(data)
			{
				var msg;
				try
				{
					msg = JSON.parse(data);
				}
				catch(e)
				{
					msg = {type:data.charCodeAt(0)};
					tdcConstructData(msg,data);
					console.log(msg);
				}
				netvers = msg.data;
			},
		});
		cli.handler({data:JSON.stringify({type:"version"})});
		str = str.replace(new RegExp("@netversion@",'g'),netvers);
	}
	return str;
}

global.pi = function(a=1) {return Math.PI*a} //! Finds multiples of PI.

global.setNewFont = function(input) //! Gets font from user input. Not used anywhere anymore.
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

global.pointDistance = function(x1,y1,x2,y2)
{
  var xs = x2 - x1, ys = y2 - y1;
  return Math.sqrt( xs*xs + ys*ys );
}

global.getLogicalBox = function(string) //! Parses map file and returns [x, y, minx, miny, maxx, maxy] or false on failure.
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

global.hasClass = function(element, cls) {//checks if element has classname, returns true | false
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

global.relPath = function(path,rel="/")
{
	//if(rel.indexOf("/") != 0) rel = "/"+rel;
	if(rel.indexOf("/",rel.length-1) == -1) rel += "/";
	
	if(path.indexOf("://") >= 0 || path.indexOf("/") == 0) return path;
	else return rel+path;
}

global.inround = function() //! Tries to determine if we're in a round or not.
{
	return !engine.roundCommencing && engine.gtime >= -4000;
}

global.deg2rad = function(angle)
{
	if(!isFinite(angle)) return angle;
	angle %= 360;
	if(angle < 0) angle += 360;
	var radians = angle * Math.PI / 180;
	return radians;
}
global.rad2deg = function(radians)
{
	if(!isFinite(radians)) return radians;
	var angle = radians * 180 / Math.PI;
	angle %= 360;
	if(angle < 0) angle += 360;
	return angle;
}

global.normalizeRad = function(radians)
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
global.SMALL_NUM = 0.00000001; // anything that avoids division overflow
global.distanceoflines = function(x1,y1, x2,y2, x3,y3, x4,y4)
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

global.is_in_circle = function(p1x, p1y, r1, p2x, p2y, r2=0)
{
	return(r1+r2 > Math.sqrt(Math.pow((p1x-p2x),2)+Math.pow((p1y-p2y),2)))
}

global.lineIntersect = function(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y)
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

global.getSuperString = function() {
var superstring = encrypt1.toEncodedString();
superstring = "lightcycle"+superstring;
return superstring;
}
var ss = getSuperString();
