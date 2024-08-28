
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
		
		players.push(p);
		
		global = new GlobalConfig();
		global.toggleFS.push(122);
	}
	
	static function getPrefsFile()
	{
		var prefsFile : File = File.applicationStorageDirectory;
		return prefsFile.resolvePath("preferences.xml");
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
	
	public function load( main : Main )
	{
		var prefsFile = getPrefsFile();
		
		if( prefsFile.exists )
		{
			var f : FileStream = new FileStream();
			f.open(prefsFile, FileMode.READ);
			
			var x = Xml.parse(f.readUTFBytes(f.bytesAvailable));
			
			var g = xmlGet(x, "GlobalConfig");
			var p = xmlGet(x, "PlayerConfig");
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
					main.stage.frameRate = haxe.Json.parse(f);
				}
			}
			
			f.close();
		}
	}
	
	function savePlayer( xp : Xml, p : PlayerConfig )
	{
		var e = xmlGet(xp, "Name");
		e.set("value", p.name);
		
		var e = xmlGet(xp, "Teamname");
		e.set("value", p.teamName);
		
		var e = xmlGet(xp, "Color");
		e.set("cycle", StringTools.hex(p.colorCycle));
		e.set("wall", StringTools.hex(p.color));
		
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
		
		if( prefsFile.exists )
		{
			var f : FileStream = new FileStream();
			f.open(prefsFile, FileMode.READ);
			
			x = Xml.parse(f.readUTFBytes(f.bytesAvailable));
			
			f.close();
		}
		else
		{
			x = Xml.createElement("UserConfig");
			
			isNew = true;
		}
		
		var f : FileStream = new FileStream();
		f.open(prefsFile, FileMode.WRITE);
		
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
		
		if( isNew )
			f.writeUTFBytes(Printer.print(x, true));
		else
			f.writeUTFBytes(x.toString());
		
		f.close();
	}
	
	
}
