
import openfl.Lib;
import openfl.events.Event;
import openfl.events.MouseEvent;

import openfl.display.Sprite;

import openfl.Assets;

import openfl.text.TextField;
import openfl.text.TextFormat;
import openfl.text.TextFormatAlign;

import openfl.display.SimpleButton;
import openfl.display.Shape;
import feathers.controls.*;
import feathers.controls.navigators.*;
import thirdparty.controls.*;
import controls.*;

import feathers.data.*;
import feathers.layout.*;

import Main;


enum Menus
{
	mainMenu;
	playMenu;
	configMenu;
	inGameMenu;
	netMenu;
}

enum MenuAction
{
	actChangeMenu( menu : Menus );
	actExitMenu;
	actSetState( state : State );
}

class MenuItem extends SimpleButton
{
	private var sprite : Sprite;
	public var textField : TextField;
	
	private var menuAction : MenuAction;
	
	private var menu : Menu;
	
	static public var defaultWidth : UInt;
	
	public function new( master : Menu, txt : String, y : UInt, action : MenuAction, width : Int=-1 )
	{
		this.sprite = new Sprite();
		
		this.menu = master;
		
		
		var m = new TextField();
		
		if( width == -1 ) width = defaultWidth;
		
		if( width != 0 )
		{
			m.width = width;
		}
		m.defaultTextFormat = master.menuItem;
		m.selectable = false;
		m.text = txt;
		
		this.textField = m;
		sprite.addChild(m);
		
		super(sprite, sprite, sprite, sprite);
		
		
		this.y = y;
		//this.height = 30;
		
		this.menuAction = action;
		
		this.addEventListener(MouseEvent.CLICK, onClick);
	}
	
	public function onClick( e : Event )
	{
		if( menu.menuChanging > 1 ) return;
		
		switch( menuAction )
		{
			case actChangeMenu( m ):
			{
				menu.triggerMenuChange( m );
				menu.lastMenus.push( m );
			}
			
			case actExitMenu:
			{
				menu.triggerMenuBack();
			}
			
			case actSetState( s ):
			{
				//menu.main.setState( s );
				menu.triggerStateChange( s );
			}
			
			case null:
			{
				
			}
		}
	}
}

class CfgCommon extends ScrollContainer
{
	static public var m : Main;
	
	public inline function main() { return m; }
	public inline function user() { return main().userConfig; }
	
	public function new()
	{
		super();
		
		var bg = new Shape();
		bg.graphics.beginFill(0xFFFFFF, 0.75);
		bg.graphics.drawRect(0, 0, 100, 100);
		bg.graphics.endFill();
		backgroundSkin = bg;
		
		this.layout = new TiledRowsLayout();
	}
}

class CfgKB extends CfgCommon
{
	public function new()
	{
		super();
		
		addChild(new Label("Turn Left:"));
		addChild(new KeyBindControl(user().players[0].turnLeft));
		
		addChild(new Label("Turn Right:"));
		addChild(new KeyBindControl(user().players[0].turnRight));
		
		addChild(new Label("Brake:"));
		addChild(new KeyBindControl(user().players[0].brake));
		
		addChild(new Label("Toggle Brake:"));
		addChild(new KeyBindControl(user().players[0].toggleBrake));
		
		addChild(new Label("Jump:"));
		addChild(new KeyBindControl(user().players[0].brake));
		
		
	}
}

class CfgPlayer extends CfgCommon
{
	public function new()
	{
		super();
		
		var namelabel = new Label();
		namelabel.text = "Name:";
		addChild(namelabel);
		var name = new TextInput();
		if( user().players[0] != null )
		{
			name.text = user().players[0].name;
		}
		name.addEventListener(Event.CHANGE, function( e : Event )
		{
			if( user().players[0] != null )
			{
				user().players[0].name = name.text;
			}
		});
		addChild(name);
		
		
		var tnamelabel = new Label();
		tnamelabel.text = "Teamname:";
		addChild(tnamelabel);
		var teamname = new TextInput();
		if( user().players[0] != null )
		{
			teamname.text = user().players[0].teamName;
		}
		teamname.addEventListener(Event.CHANGE, function( e : Event )
		{
			if( user().players[0] != null )
			{
				user().players[0].teamName = teamname.text;
			}
		});
		addChild(teamname);
		
		
		var tspeclabel = new Label();
		tspeclabel.text = "Spectator:";
		addChild(tspeclabel);
		var specMode = new ToggleSwitch();
		specMode.selected = false;
		if( user().players[0] != null )
		{
			specMode.selected = user().players[0].specMode;
		}
		specMode.addEventListener(Event.CHANGE, function( e : Event )
		{
			if( user().players[0] != null )
			{
				user().players[0].specMode = specMode.selected;
			}
		});
		addChild(specMode);
		
		
		var tcolorlabel = new Label();
		tcolorlabel.text = "Wall Color:";
		addChild(tcolorlabel);
		var color = new PopUpSwatchColorPicker();
		if( user().players[0] != null )
		{
			color.selectedColor = user().players[0].color;
		}
		color.addEventListener(Event.CHANGE, function( e : Event )
		{
			if( user().players[0] != null )
			{
				user().players[0].color = color.selectedColor;
			}
		});
		addChild(color);
		
		
		var tcolorlabel = new Label();
		tcolorlabel.text = "Cycle Color:";
		addChild(tcolorlabel);
		var cycleColor = new PopUpSwatchColorPicker();
		if( user().players[0] != null )
		{
			cycleColor.selectedColor = user().players[0].colorCycle;
		}
		cycleColor.addEventListener(Event.CHANGE, function( e : Event )
		{
			if( user().players[0] != null )
			{
				user().players[0].colorCycle = cycleColor.selectedColor;
			}
		});
		addChild(cycleColor);
		
		
		
		
		
	}
}

class CfgGfx extends CfgCommon
{
	public function new()
	{
		super();
		
		var fpslabel = new Label();
		fpslabel.text = "FPS Target:";
		addChild(fpslabel);
		//var rate = 
	}
}

class ConfigMenu extends Sprite
{
	var navigator : TabNavigator;
	var bg : Shape;
	
	public function new()
	{
		super();
		
		navigator = new TabNavigator();
		addChild(navigator);
		navigator.dataProvider = new ArrayCollection([
			TabItem.withClass("Player", CfgPlayer),
			TabItem.withClass("KeyBinds", CfgKB),
			TabItem.withClass("Graphics", CfgGfx),
		]);
		
		navigator.tabBarFactory = () ->
		{
			var t = new TabBar();
			var bg = new Shape();
			t.backgroundSkin = bg;
			return t;
		};
		
		//onresize();
	}
	
	public function onresize()
	{
		navigator.y = 120;
		navigator.x = 30;
		
		navigator.width = MenuItem.defaultWidth - 60;
		navigator.height = 430;
	}
}


class ServerBrowser extends Sprite
{
	var view : GridView;
	var actions : LayoutGroup;
	//var actions : ButtonBar;
	
	public function new()
	{
		super();
		
		view = new GridView();
		addChild(view);
		
		view.dataProvider = new ArrayCollection([
			{ name: "- The Grid | discord #pickup | SBT | DC - ", type: "sumo", ping: "0", users: "0/12" }
		]);
		
		view.columns = new ArrayCollection([
			new GridViewColumn("Server Name", (data) -> data.name, 400),
			new GridViewColumn("Type", (data) -> data.type),
			new GridViewColumn("Ping", (data) -> data.ping),
			new GridViewColumn("Users", (data) -> data.users)
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
	}
	
	public function activate()
	{
		Alert.show( "This feature doesn't work!", "Error", ["Dismiss"] );
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
	}
}


class Menu extends Sprite
{
	private var title : TextField;
	private var menuItems : Array<MenuItem>;
	public var exitMenu : MenuItem;
	
	public var menuItem : TextFormat;
	
	public var currMenu : Menus;
	public var lastMenus : Array<Menus>;
	
	public var main : Main;
	
	
	public function new( ma : Main )
	{
		this.main = ma;
		
		super();
		
		var titleFormat:TextFormat = new TextFormat(Assets.getFont("fonts/Lato-Light.ttf").fontName, 40, 0xbbbbbb, true);
		titleFormat.align = TextFormatAlign.CENTER;
		
		title = new TextField();
		addChild(title);
		
		this.alpha = 0;
		
		
		title.width = 800;
		title.y = 40;
		title.defaultTextFormat = titleFormat;
		title.selectable = false;
		
		
		this.lastTime = Lib.getTimer();
		
		menuItem = new TextFormat(Assets.getFont("fonts/Oxygen-Regular.ttf").fontName, 30, 0xbbbbbb, true);
		menuItem.align = TextFormatAlign.CENTER;
		
		
		menuItems = [];
		
		/*
		var m = new TextField();
		
		m.width = 800;
		m.y = 160;
		m.defaultTextFormat = menuItem;
		m.selectable = false;
		m.text = "Play Game";
		*/
		
		
		this.triggerMenuChange(mainMenu);
		this.lastMenus = [ mainMenu ];
		
		this.exitMenu = new MenuItem(this, "<-", 20, actExitMenu, 0);
		this.exitMenu.x = 10;
		this.exitMenu.alpha = 0;
		//addChild(exitMenu);
		
		this.haxeuiInit = false;
		//Toolkit.init();
		
		startY = 160;
	}
	
	
	public var nextMenu : Menus;
	public var lastTime : Float;
	public var menuChanging : Int;
	public var stateChanging : Bool;
	public var setState : State;
	public var extraFrame : Bool;
	
	public function render()
	{
		var time = Lib.getTimer();
		
		var delta = time - this.lastTime;
		var timestep : Float = delta / 1000.0;
		
		this.lastTime = time;
		
		
		if( extraFrame )
		{
			extraFrame = false;
		}
		else switch( menuChanging )
		{
			case 2:
			{
				if( this.alpha > 0 )
				{
					this.alpha -= timestep*3;
					//this.x -= timestep/2;
					//this.title.x -= timestep/4;
					
					if( lastMenus.length <= 1 )
					{
						exitMenu.alpha -= timestep*3;
					}
					else
					{
						exitMenu.x = 0;
						exitMenu.alpha += timestep*3;
					}
					
					if( stateChanging )
					{
						this.alpha -= timestep*0.15;
					}
				}
				else
				{
					this.alpha = 0;
					changeMenu( nextMenu );
					extraFrame = true;
					menuChanging -= 1;
					this.x = -12;
					title.x = -6;
					//this.exitMenu.x = 12;
					
					if( stateChanging )
					{
						main.setState( setState );
					}
				}
			}
			
			case 1:
			{
				if( this.alpha < 1 )
				{
					this.alpha += timestep*2;
					this.x += timestep*24;
					this.title.x += timestep*12;
					//this.exitMenu.x -= timestep*24;
					
					if( lastMenus.length <= 1 )
					{
						exitMenu.alpha -= timestep*3;
					}
					else
					{
						exitMenu.x = 0;
						exitMenu.alpha += timestep*3;
					}
				}
				else
				{
					this.alpha = 1;
					this.x = 0;
					this.title.x = 0;
					//this.exitMenu.x = 0;
					menuChanging -= 1;
					onresize();
					
					if( lastMenus.length > 1 )
					{
						exitMenu.alpha = 1;
						exitMenu.x = 0;
					}
					else
					{
						exitMenu.alpha = 0;
						exitMenu.x = -100;
					}
				}
			}
			
			case 0:
			{
				
			}
		}
		
		
	}
	
	public function triggerMenuChange( menu : Menus )
	{
		this.nextMenu = menu;
		this.stateChanging = false;
		this.menuChanging = 2;
	}
	
	public function triggerStateChange( state : State )
	{
		this.setState = state;
		this.stateChanging = true;
		this.menuChanging = 2;
	}
	
	public function triggerMenuBack()
	{
		this.lastMenus.pop();
		
		var m = null;
		if( this.lastMenus.length > 0 )
		{
			this.triggerMenuChange( this.lastMenus[ this.lastMenus.length-1 ] );
		}
		else
		{
			this.triggerMenuChange( null );
		}
	}
	
	private var haxeuiInit : Bool;
	private var cfgMenu : ConfigMenu;
	private var svrMenu : ServerBrowser;
	
	public var startY : UInt;
	
	public function initUI()
	{
		if( !haxeuiInit )
		{
			haxeuiInit = true;
			cfgMenu = new ConfigMenu();
			svrMenu = new ServerBrowser();
		}
	}
	
	public function changeMenu(menu : Menus)
	{
		if( currMenu != null ) switch( currMenu )
		{
			case configMenu:
			{
				removeChild(cfgMenu);
			}
			
			case netMenu:
			{
				removeChild(svrMenu);
			}
			
			default:
		}
		
		while( true )
		{
			var m = menuItems.pop();
			if( m != null )
			{
				removeChild(m);
			}
			else
			{
				break;
			}
		}
		
		var y = startY;
		
		switch( menu )
		{
			case mainMenu:
			{
				/*
				title.text = "Armawebtron v1.0.0-beta9";
				*/
				title.text = "Armawebtron-next pre-alpha";
				
				var m = new MenuItem(this, "Play Game", y, actChangeMenu(playMenu));
				y += 60;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Configure", y, actChangeMenu(configMenu));
				y += 60;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Quit", y, actSetState( stateQuit ));
				y += 60;
				menuItems.push(m);
				addChild(m);
			}
			
			case playMenu:
			{
				title.text = "Play Ball";
				
				var m = new MenuItem(this, "Locally", y, actSetState( stateGame ));
				y += 60;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Internet", y, actChangeMenu( netMenu ));
				y += 60;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Exit Menu", y, actExitMenu);
				y += 60;
				menuItems.push(m);
				addChild(m);
			}
			
			case inGameMenu:
			{
				title.text = "Paused";
			}
			
			case configMenu:
			{
				title.text = "Configuration";
				
				initUI();
				
				addChild(cfgMenu);
				cfgMenu.onresize();
				CfgCommon.m = main;
			}
			
			case netMenu:
			{
				title.text = "Internet Game";
				
				initUI();
				
				addChild(svrMenu);
				svrMenu.onresize(stage.stageWidth, stage.stageHeight);
				
				if( currMenu != menu )
				{
					svrMenu.activate();
				}
			}
		}
		
		currMenu = menu;
		
		exitMenu.x = 0;
	}
	
	public function onresize()
	{
		MenuItem.defaultWidth = stage.stageWidth;
		title.width = stage.stageWidth;
		
		title.y = stage.stageHeight/15;
		startY = Std.int(stage.stageHeight/3.75);
		
		if( this.currMenu != null )
		{
			changeMenu(this.currMenu);
		}
	}
}
