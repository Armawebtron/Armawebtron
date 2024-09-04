
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
import ServerBrowser;


enum Menus
{
	mainMenu;
	playMenu;
	configMenu;
	inGameMenu;
	netMenu;
	blankMenu;
}

enum MenuAction
{
	actChangeMenu( menu : Menus );
	actExitMenu;
	actSetState( state : State );
	actResetGame;
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
			
			case actResetGame:
			{
				menu.main.resetGame();
				menu.triggerMenuBack();
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
		
		this.layout = new FormLayout();
		
		addChild(new Label("Turn Left:"));
		addChild(new KeyBindControl(user().players[0].turnLeft));
		
		addChild(new Label("Turn Right:"));
		addChild(new KeyBindControl(user().players[0].turnRight));
		
		addChild(new Label("Brake:"));
		addChild(new KeyBindControl(user().players[0].brake));
		
		addChild(new Label("Toggle Brake:"));
		addChild(new KeyBindControl(user().players[0].toggleBrake));
		
		/*
		addChild(new Label("Jump:"));
		addChild(new KeyBindControl(user().players[0].jump));
		*/
		
		
		addChild(new Label("Glance Forward:"));
		addChild(new KeyBindControl(user().players[0].glanceFwd));
		
		addChild(new Label("Glance Back:"));
		addChild(new KeyBindControl(user().players[0].glanceBack));
		
		addChild(new Label("Glance Left:"));
		addChild(new KeyBindControl(user().players[0].glanceLeft));
		
		addChild(new Label("Glance Right:"));
		addChild(new KeyBindControl(user().players[0].glanceRight));
		
		
	}
}

class CfgPlayer extends CfgCommon
{
	public function new()
	{
		super();
		
		
		var item = new FormItem();
		item.text = "Name:";
		var name = new TextInput();
		item.content = name;
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
		addChild(item);
		
		
		var item = new FormItem();
		item.text = "Teamname:";
		var teamname = new TextInput();
		item.content = teamname;
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
		addChild(item);
		
		
		var item = new FormItem();
		item.text = "Spectator:";
		var specMode = new ToggleSwitch();
		item.content = specMode;
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
		addChild(item);
		
		
		var item = new FormItem();
		item.text = "Wall Color:";
		var tcolorlabel = new Label();
		var color = new PopUpSwatchColorPicker();
		item.content = color;
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
		addChild(item);
		
		
		var item = new FormItem();
		item.text = "Cycle Color:";
		var cycleColor = new PopUpSwatchColorPicker();
		item.content = cycleColor;
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
		addChild(item);
		
		
		
		
		
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

class CfgCam extends CfgCommon
{
	public function new()
	{
		super();
		
		addChild(new Label("Camera Rise:"));
		addChild(new Label("Camera Back:"));
		
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
			TabItem.withClass("Camera", CfgCam),
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
		
		if( svrMenu != null )
		{
			svrMenu.run();
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
				
				var m = new MenuItem(this, "Reset Round", y, actResetGame);
				y += 50;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Change Teams", y, null);
				y += 50;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Configure", y, actChangeMenu(configMenu));
				y += 50;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Leave Grid", y, actSetState( stateMenu ));
				y += 50;
				menuItems.push(m);
				addChild(m);
				
				var m = new MenuItem(this, "Return to Grid", y, actExitMenu);
				y += 50;
				menuItems.push(m);
				addChild(m);
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
				
				ServerBrowser.m = main;
				
				addChild(svrMenu);
				svrMenu.onresize(stage.stageWidth, stage.stageHeight);
				
				if( currMenu != menu )
				{
					svrMenu.activate();
				}
			}
			
			case blankMenu:
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
