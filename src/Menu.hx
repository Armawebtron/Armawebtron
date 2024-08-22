
import openfl.Lib;
import openfl.events.Event;
import openfl.events.MouseEvent;

import openfl.display.Sprite;

import openfl.Assets;

import openfl.text.TextField;
import openfl.text.TextFormat;
import openfl.text.TextFormatAlign;

import openfl.display.SimpleButton;

import Main;


enum Menus
{
	mainMenu;
	playMenu;
	configMenu;
	inGameMenu;
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
				menu.lastMenus.pop();
				
				var m = null;
				if( menu.lastMenus.length > 0 )
				{
					menu.triggerMenuChange( menu.lastMenus[ menu.lastMenus.length-1 ] );
				}
				else
				{
					menu.triggerMenuChange( null );
				}
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
		
		startY = 160;
	}
	
	
	public var nextMenu : Menus;
	public var lastTime : Float;
	public var menuChanging : Int;
	public var stateChanging : Bool;
	public var setState : State;
	
	public function render()
	{
		var time = Lib.getTimer();
		
		var delta = time - this.lastTime;
		var timestep : Float = delta / 1000.0;
		
		this.lastTime = time;
		
		
		switch( menuChanging )
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
	
	private var haxeuiInit : Bool;
	
	public var startY : UInt;
	
	public function changeMenu(menu : Menus)
	{
		if( currMenu == configMenu )
		{
			
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
				title.text = "Armawebtron v1.0.0-beta9";
				
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
				
				var m = new MenuItem(this, "Internet", y, null);
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
				
				if( !haxeuiInit )
				{
					haxeuiInit = true;
					
					//Toolkit.init();
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
