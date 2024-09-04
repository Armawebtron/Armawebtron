
import openfl.Lib;

import openfl.display.Sprite;
import openfl.display.Shape;

import feathers.controls.*;
import feathers.controls.navigators.*;
import thirdparty.controls.*;
import controls.*;

import feathers.data.*;
import feathers.layout.*;
import feathers.skins.activity.*;


import Main;
import Color;
import network.*;

class BServer
{
	public var host : String;
	public var hostByServer : String;
	public var port : UInt;
	
	public var name : String;
	public var ping : Int;
	public var players : Int;
	public var maxPlayers : Int;
	
	public var description : String;
	public var url : String;
	public var version : String;
	
	public var playersList : Array<String>;
	public var gidList : Array<String>;
	
	public var waiting : Bool;
	public var online : Bool;
	
	public var type : String;
	
	public function new()
	{
		name = "";
		
		host = "";
		port = 0;
		hostByServer = "";
		
		version = "";
		
		ping = 0;
		
		playersList = [];
		gidList = [];
		
		waiting = true;
		online = false;
	}
	
	public function getName() : String
	{
		if( name.length > 0 )
		{
			return Color.removeColors(name);
		}
		
		return host+":"+port;
	}
	
	public function getType() : String
	{
		return "";
	}
	
	public function getPing() : String
	{
		return Std.string(ping);
	}
	
	public function getClients() : String
	{
		if( !online ) return "offline";
		return players+" / "+maxPlayers;
	}
}

class FetchClient extends Client
{
	public var m : Main;
	public var list : IFlatCollection<Dynamic>;
	public var target : BServer;
	public function new( c : NetMode, l : IFlatCollection<Dynamic>, t : BServer = null )
	{
		super( c );
		list = l;
		target = t;
		
		inRate = 4;
	}
	
	override public function onConnect()
	{
		// request hosts/ports
		var msg = new Message(52);
		send(msg);
	}
	
	override public function customHandler( msg : Message )
	{
		switch(msg.descriptor)
		{
			case 50:
			{
				trace( target != null );
				if( target != null ) return false;
				
				var port = msg.getInt();
				var host = msg.getStr();
				
				var add = true;
				var b : BServer = null;
				for( x in list )
				{
					if( x.host == host && x.port == port )
					{
						add = false;
						b = x;
						break;
					}
				}
				
				if( add )
				{
					b = new BServer();
					b.host = host;
					b.port = port;
					list.add( b );
				}
				
				if( b != null )
				{
					if( host != "" )
					{
						try
						{
							var f = new FetchClient( udp(host, port), this.list, b );
							f.m = m;
							f.getInfo();
							m.netMult.push(f);
						}
						catch(e)
						{
							
						}
					}
				}
				
				return true;
			}
			
			case 3:
			{
				this.clientID = 0;
				done = true;
				return false;
			}
		}
		return false;
	}
	
	override public function onServerInfo( 
		name: String, 
		host: String, port: UInt, 
		version: String,
		numPlayers: UInt, maxPlayers: Int, 
		description: String, url: String,
		players: Array<String>, playerGIDs: Array<String> )
	{
		if( target != null )
		{
			target.hostByServer = host;
			target.name = name;
			target.version = version;
			target.players = numPlayers;
			target.maxPlayers = maxPlayers;
			target.description = description;
			target.url = url;
			target.playersList = players;
			target.gidList = playerGIDs;
			
			target.online = true;
		}
	}
}

class ServerBrowser extends Sprite
{
	static public var m : Main;
	
	var view : GridView;
	var actions : LayoutGroup;
	var loading : ActivityIndicator;
	var loadingAct : Bool;
	
	public var nextMasterFetch : UInt;
	
	public var fetch : FetchClient;
	
	
	
	public function new()
	{
		super();
		
		view = new GridView();
		addChild(view);
		
		view.dataProvider = new ArrayCollection([
			new BServer(),
		]);
		
		view.columns = new ArrayCollection([
			new GridViewColumn("Server Name", (data) -> data.getName(), 400),
			new GridViewColumn("Type", (data) -> data.getType()),
			new GridViewColumn("Ping", (data) -> data.getPing()),
			new GridViewColumn("Users", (data) -> data.getClients())
		]);
		
		var bg = new Shape();
		bg.graphics.beginFill(0xFFFFFF, 0.75);
		bg.graphics.drawRect(0, 0, 100, 100);
		bg.graphics.endFill();
		view.backgroundSkin = bg;
		
		
		actions = new LayoutGroup();
		
		var buttons = new ButtonBar();
		this.addChild(actions);
		
		buttons.dataProvider = new ArrayCollection([
			{ text: "Host Server" },
			{ text: "Refresh" },
			{ text: "Info" },
			{ text: "Connect" }
		]);
		buttons.itemToText = (item:Dynamic) -> {
			return item.text;
		};
		actions.addChild(buttons);
		
		loading = new ActivityIndicator();
		var skin = new DotsActivitySkin();
		skin.dotColor = 0xffffff;
		loading.activitySkin = skin;
		loadingAct = true;
		
		nextMasterFetch = 0;
	}
	
	public function activate()
	{
		//Alert.show( "This feature doesn't work!", "Error", ["Dismiss"] );
		autoRefresh();
	}
	
	public function autoRefresh()
	{
		addChild(loading);
		
		var time = Lib.getTimer();
		
		if( time > nextMasterFetch )
		{
			trace("Fetching servers");
			
			var f = new FetchClient( udp("master"+(1+Std.random(3))+".armagetronad.net", 4533), view.dataProvider );
			//var f = new FetchClient( udp("127.0.0.1", 4534), view.dataProvider );
			
			m.netMult.push(f);
			f.m = m;
			f.connect();
			
			fetch = f;
			
			nextMasterFetch = time + 512;
		}
	}
	
	public function run()
	{
		if( fetch != null )
		{
			if( fetch.done && loadingAct )
			{
				removeChild(loading);
				loadingAct = false;
			}
			else if( !fetch.done && !loadingAct )
			{
				addChild(loading);
				loadingAct = true;
			}
		}
	}
	
	public function onresize( w : UInt, h : UInt )
	{
		view.y = 120;
		view.height = h - 140;
		
		view.x = 20;
		view.width = w - 40;
		
		var nW = view.width/1.8;
		
		if( nW < 280 )
		{
			nW = 280;
		}
		
		view.columns.get(0).width = nW;
		
		actions.x = 20;
		actions.width = w - 40;
		
		actions.y = 120 + view.height - 20;
		
		view.height -= 26;
		
		loading.x = w - loading.width;
	}
}
