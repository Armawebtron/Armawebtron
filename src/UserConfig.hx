
import openfl.filesystem.*;
import haxe.xml.*;

import Camera;

class PlayerConfig
{
	public var name : String;
	public var teamName : String;
	
	public var color : UInt;
	public var colorCycle : UInt;
	
	public var turnLeft : Array<UInt>;
	public var turnRight : Array<UInt>;
	
	public var brake : Array<UInt>;
	public var toggleBrake : Array<UInt>;
	
	public var jump : Array<UInt>;
	
	public var specMode : Bool;
	
	public var cam : Camera;
	public var viewTarget : Int;
	
	public function new()
	{
		name = "";
		teamName = "";
		
		color = 0xcccccc;
		colorCycle = 0xffffff;
		
		turnLeft = [];
		turnRight = [];
		
		brake = [];
		toggleBrake = [];
		
		jump = [];
		
		cam = new CustomCamera();
		
		specMode = false;
	}
	
	public var saved : Bool;
}

class GlobalConfig
{
	public var toggleFS : Array<UInt>;
	
	public function new()
	{
		toggleFS = [];
	}
}

class UserConfig
{
	public var players : Array<PlayerConfig>;
	public var global : GlobalConfig;
	
	public function new()
	{
		players = [];
		
		var p = new PlayerConfig();
		
		p.name = "Mobile 1";
		
		p.turnLeft.push(37);
		p.turnRight.push(39);
		
		p.turnLeft.push(90);
		p.turnRight.push(88);
		
		players.push(p);
		
		global = new GlobalConfig();
		global.toggleFS.push(122);
	}
	
	static inline function appDir()
	{
	#if( !js )
		return File.applicationStorageDirectory;
	#else
		return "Armawebtron2";
	#end
	}
	
	static function getPrefsFile()
	{
	#if( !js )
		return appDir().resolvePath("preferences.xml");
	#else
		return appDir()+"/preferences.xml";
	#end
	}
	
	static public function xmlGet( x : Xml, tag : String )
	{
		var s = x.elementsNamed(tag);
		
		var e : Xml;
		if( !s.hasNext() )
		{
			e = Xml.createElement(tag);
			x.addChild(e);
		}
		else
		{
			e = s.next();
		}
		
		return e;
	}
	
	static public function parseColor( c : String ) : UInt
	{
		if( c.indexOf("0x") == 0 )
		{
			return Std.parseInt(c);
		}
		else if( c.indexOf("#") == 0 )
		{
			return Std.parseInt("0x"+c.substr(1));
		}
		else
		{
			return Std.parseInt("0x"+c);
		}
	}
	
	public function load( main : Main )
	{
		var prefsFile = getPrefsFile();
		
	#if( js )
		var f = js.Browser.getLocalStorage().getItem(prefsFile);
		if( f != null )
	#else
		if( prefsFile.exists )
	#end
		{
		#if( !js )
			var f : FileStream = new FileStream();
			f.open(prefsFile, FileMode.READ);
			
			var x = Xml.parse(f.readUTFBytes(f.bytesAvailable));
			
			f.close();
		#else
			var x = Xml.parse(f);
		#end
			
			
			var g = xmlGet(x, "GlobalConfig");
			var pConf = xmlGet(x, "PlayerConfig");
			var t = xmlGet(x, "GameConfig");
			
			{
				var e = xmlGet(g, "Screen");
				var f = e.get("fullscreen");
				if( f != null )
				{
					main.fullscreen = haxe.Json.parse(f);
					main.chFullscreen = true;
				}
				
				var f = e.get("frameRate");
				if( f != null )
				{
					main.stage.frameRate = Std.parseFloat(f);
				}
			}
			
			var xplayers = pConf.elementsNamed("Player");
			for( xp in xplayers )
			{
				var id = Std.parseInt(xp.get("id"));
				
				if( id > 100 ) continue;
				
				if( id >= players.length )
				{
					var p = new PlayerConfig();
					players.push(p);
				}
				
				var p = players[id];
				
				var e = xmlGet(xp, "Name");
				p.name = e.get("value");
				if( p.name == null ) p.name = "";
				
				var e = xmlGet(xp, "TeamName");
				p.teamName = e.get("value");
				if( p.teamName == null ) p.name = "";
				
				var e = xmlGet(xp, "Color");
				p.colorCycle = parseColor(e.get("cycle"));
				p.color = parseColor(e.get("wall"));
				
				var d = xmlGet(xp, "KeyBinds");
				var e = xmlGet(d, "cycle");
				
				var k = e.get("left");
				if( k != null )
				{
					p.turnLeft.splice(0, p.turnLeft.length);
					var i : Array<Int> = haxe.Json.parse(k);
					trace(haxe.Json.parse(k));
					for( b in i ) { p.turnLeft.push( b ); }
				}
				
				var k = e.get("right");
				if( k != null )
				{
					p.turnRight.splice(0, p.turnRight.length);
					var i : Array<Int> = haxe.Json.parse(k);
					for( b in i ) { p.turnRight.push( b ); }
				}
				
				var k = e.get("brake");
				if( k != null )
				{
					p.brake.splice(0, p.brake.length);
					var i : Array<Int> = haxe.Json.parse(k);
					for( b in i ) { p.brake.push( b ); }
				}
				
				var k = e.get("toggleBrake");
				if( k != null )
				{
					p.toggleBrake.splice(0, p.toggleBrake.length);
					var i : Array<Int> = haxe.Json.parse(k);
					for( b in i ) { p.toggleBrake.push( b ); }
				}
			}
		}
	}
	
	function savePlayer( xp : Xml, p : PlayerConfig )
	{
		var e = xmlGet(xp, "Name");
		e.set("value", p.name);
		
		var e = xmlGet(xp, "TeamName");
		e.set("value", p.teamName);
		
		var e = xmlGet(xp, "Color");
		e.set("cycle", "#"+StringTools.hex(p.colorCycle,6));
		e.set("wall", "#"+StringTools.hex(p.color,6));
		
		var k = xmlGet(xp, "KeyBinds");
		var e = xmlGet(k, "cycle");
		e.set("left", haxe.Json.stringify(p.turnLeft));
		e.set("right", haxe.Json.stringify(p.turnRight));
		e.set("brake", haxe.Json.stringify(p.brake));
		e.set("toggleBrake", haxe.Json.stringify(p.toggleBrake));
	}
	
	public function save( main : Main )
	{
		trace("saving prefs...");
		
		var prefsFile = getPrefsFile();
		
		var x : Xml = null;
		var isNew : Bool = false;
		
		#if( js )
		var f = js.Browser.getLocalStorage().getItem(prefsFile);
		if( f != null )
		{
			x = Xml.parse( f );
		}
		#else
		if( prefsFile.exists )
		{
			var f : FileStream = new FileStream();
			f.open(prefsFile, FileMode.READ);
			
			x = Xml.parse(f.readUTFBytes(f.bytesAvailable));
			
			f.close();
		}
		#end
		else
		{
			x = Xml.createElement("UserConfig");
			
			isNew = true;
		}
		
		#if( !js )
		var f : FileStream = new FileStream();
		f.open(prefsFile, FileMode.WRITE);
		#end
		
		var g = xmlGet(x, "GlobalConfig");
		var pConf = xmlGet(x, "PlayerConfig");
		var t = xmlGet(x, "GameConfig");
		
		{
			var e = xmlGet(g, "Screen");
			
			if( !main.fullscreen )
			{
				e.set( "windowSize", main.stage.stageWidth+"x"+main.stage.stageHeight );
			}
			e.set( "fullscreen", ""+main.fullscreen );
			if( main.fullscreen )
			{
				e.set( "resolution", main.stage.stageWidth+"x"+main.stage.stageHeight );
			}
			
			e.set( "frameRate", ""+main.stage.frameRate );
		}
		
		{
			for( p in players )
			{
				p.saved = false;
			}
			
			var xplayers = pConf.elementsNamed("Player");
			for( xp in xplayers )
			{
				var id = xp.get("id");
				if( players[Std.parseInt(id)] != null )
				{
					var p = players[Std.parseInt(id)];
					
					savePlayer( xp, p );
					
					p.saved = true;
				}
			}
			
			for( id=>p in players )
			{
				if( !p.saved )
				{
					var xp = Xml.createElement("Player");
					
					xp.set("id", ""+id);
					savePlayer( xp, p );
					
					pConf.addChild( xp );
				}
			}
		}
		
		#if( !js )
		if( isNew )
			f.writeUTFBytes(Printer.print(x, true));
		else
			f.writeUTFBytes(x.toString());
		
		f.close();
		#else
			js.Browser.getLocalStorage().setItem(prefsFile,(isNew)?(Printer.print(x, true)):(x.toString()));
		#end
	}
	
	
}
