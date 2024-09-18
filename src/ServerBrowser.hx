
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

import openfl.events.*;
import feathers.events.*;


import Main;
import Color;
import network.*;

class BServer
{
	public var m : Main;
	
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
	
	public function new( n : Main )
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
		
		m = n;
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
	
	public function poll()
	{
	#if( target.threaded )
		sys.thread.Thread.create(() -> {
			// let's hope this is good enough...
			try
			{
				var f = new FetchClient( udp(host, port), null, this );
				f.socket.setBlocking(true);
				f.m = m;
				f.getInfo();
				f.recv();
			}
			catch(e)
			{
				online = false;
			}
		});
	#else
		try
		{
			var f = new FetchClient( udp(host, port), null, this );
			f.m = m;
			f.getInfo();
			m.netMult.push(f);
		}
		catch(e)
		{
			online = false;
		}
	#end
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
					b = new BServer(m);
					b.host = host;
					b.port = port;
					list.add( b );
				}
				
				if( b != null )
				{
					if( host != "" )
					{
						b.poll();
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

class UserGridViewColumn extends GridViewColumn
{
	public function new()
	{
		super( "Users", (data) -> data.getClients() );
		this.defaultSortOrder = DESCENDING;
		this.sortCompareFunction = _sortCompareFunction;
	}
	
	private function _sortCompareFunction( aa : Dynamic, bb : Dynamic ) : Int
	{
		var a : BServer = cast(aa, BServer);
		var b : BServer = cast(bb, BServer);
		
		if( !b.online ) return 1;
		if( !a.online ) return -1;
		
		return ( a.players == b.players ) ? 0 : ( ( a.players > b.players ) ? 1 : -1 );
	}
}

class ServerBrowser extends Sprite
{
	static public var m : Main;
	
	var view : GridView;
	var actions : LayoutGroup;
	var buttons : ButtonBar;
	
	var loading : ActivityIndicator;
	var loadingAct : Bool;
	
	public var nextMasterFetch : UInt;
	public var nextSort : UInt;
	
	public var fetch : FetchClient;
	
	
	
	public function new()
	{
		super();
		
		view = new GridView();
		addChild(view);
		
		var b = new BServer(m);
		b.host = "127.0.0.1"; b.port = 4534;
		view.dataProvider = new ArrayCollection([
			b,
		]);
		
		view.columns = new ArrayCollection([
			new GridViewColumn("Server Name", (data) -> data.getName(), 400),
			new GridViewColumn("Type", (data) -> data.getType()),
			new GridViewColumn("Ping", (data) -> data.getPing()),
			new UserGridViewColumn(),
		]);
		view.sortableColumns = true;
		view.sortedColumn = view.columns.get(3);
		view.sortOrder = DESCENDING;
		
		var bg = new Shape();
		bg.graphics.beginFill(0xFFFFFF, 0.75);
		bg.graphics.drawRect(0, 0, 100, 100);
		bg.graphics.endFill();
		view.backgroundSkin = bg;
		
		
		actions = new LayoutGroup();
		
		buttons = new ButtonBar();
		this.addChild(actions);
		
		buttons.dataProvider = new ArrayCollection([
			{ text: "Host Server", call: hostServer },
			{ text: "Refresh", call: refresh },
			{ text: "Info", call: info },
			{ text: "Connect", call: connect },
		]);
		buttons.itemToText = (item:Dynamic) -> {
			return item.text;
		};
		buttons.addEventListener(ButtonBarEvent.ITEM_TRIGGER, function(e)
		{
			for( x in buttons.dataProvider )
			{
				if( x.text == e.state.text )
				{
					x.call();
					break;
				}
			}
		});
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
		loadingAct = true;
		
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
			
			nextMasterFetch = time + 512000;
		}
		else
		{
			for( x in view.dataProvider )
			{
				x.poll();
			}
		}
	}
	
	public function refresh()
	{
		autoRefresh();
	}
	
	public function run()
	{
		var time = Lib.getTimer();
		
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
		
		if( time > nextSort )
		{
			view.dataProvider.updateAll();
			nextSort = time + 3072;
		}
	}
	
	
	public function hostServer()
	{
		Alert.show( "This feature isn't implemented yet!", "Error", ["Dismiss"] );
	}
	
	public function info()
	{
		if( view.selectedIndex == -1 ) return;
		
		var sel = view.dataProvider.get(view.selectedIndex);
		
		var name = sel.getName();
		
		var fav = "Add to Favorites";
		var buttons = [fav, "Close"];
		Alert.show("",
			name,
			buttons,
			function(state:ButtonBarItemState)
			{
				switch( state.text )
				{
					case fav:
					{
						
					}
				}
			}
		);
	}
	
	public function connect()
	{
		if( view.selectedIndex == -1 ) return;
		
		var sel = view.dataProvider.get(view.selectedIndex);
		
		m.setState( stateGame );
		m.connectToGame( sel.host, sel.port );
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
		
		buttons.x = actions.width - buttons.width;
		
		view.height -= 26;
		
		loading.x = w - loading.width;
	}
}
