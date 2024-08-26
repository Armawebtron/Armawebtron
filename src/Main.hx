package;

import openfl.Lib;

import openfl.display.Sprite;
import openfl.events.*;

import openfl.text.TextField;
import openfl.text.TextFormat;
import openfl.text.TextFormatAlign;

import controls.KeyBindControl;

#if( target.threaded )
import sys.thread.Thread;
#end


import Menu;
import GameView;
import GridAnimation;

import GameCore;
import game.Game;

import UserConfig;

enum State
{
	stateMenu;
	stateGame;
	stateQuit;
}

class Main extends Sprite
{
	var threadEnabled : Bool;
	
	var menu : Menu;
	var game : GameView;
	var grid : GridAnimation;
	
	var gameActivated : Bool;
	var keepGame : Bool;
	
	var gamet : Game;
#if( target.threaded )
	var worker : sys.thread.Thread;
	var main : sys.thread.Thread;
#elseif( js )
	var worker : js.html.Worker;
	var maint : js.html.DedicatedWorkerGlobalScope;
#end
	
	var currState : State;
	
	public function new()
	{
		#if( !target.threaded && js )
		if( try js.Browser.document == null catch (e:Dynamic) true ) 
		{
			super();
			initWorker();
		}
		else
		#end
		{
			super();
			initMain();
		}
	}
	
	public var userConfig : UserConfig;
	
	public function initMain()
	{
		threadEnabled = true;
		
		#if( !target.threaded )
			threadEnabled = false;
		#end
		
		#if( !target.threaded && js )
			threadEnabled = true;
		#end
		
		trace("Thread supported? "+threadEnabled);
		
		addEventListener(Event.ENTER_FRAME, render);
		stage.addEventListener(Event.RESIZE, onresize);
		stage.addEventListener(KeyboardEvent.KEY_DOWN, onkeydown);
		
		this.grid = new GridAnimation();
		this.addChild(this.grid);
		
		this.currState = null;
		
		this.menu = new Menu(this);
		this.game = null;
		this.gamet = null;
		//this.worker = null;
		
		this.userConfig = new UserConfig();
		
		#if( !target.threaded && js )
			// workers not working?!
			threadEnabled = false;
		#end
		
		
		trace("Threads enabled? "+threadEnabled);
		
		#if( !target.threaded && js )
		if( threadEnabled )
		{
			var scriptPath : String = js.Syntax.code("(new Error().stack.match(/([^ \\n])*([a-z]*:\\/\\/\\/?)*?[a-z0-9\\/\\\\]*\\.js/ig)[0])");
			if( scriptPath.indexOf("@") != -1 )
			{
				scriptPath = scriptPath.substr(scriptPath.indexOf("@")+1);
			}
			worker = new js.html.Worker(scriptPath);
		}
		#end
		
		gameActivated = false;
		keepGame = false;
		
		this.setState( stateMenu );
	}
	
	#if( !target.threaded && js )
	public function initWorker()
	{
		trace("hello");
		
		maint = untyped self;
		
		gamet = new Game();
		maint.onmessage = msgFromMain;
	}
	
	function msgFromMain( e : js.html.MessageEvent )
	{
		gamet.recvMsg( e.data );
	}
	#end
	
	public function sendSettings()
	{
		for( i=>p in userConfig.players )
		{
			sendMessage(m_localPlayer(
				i+1, // local player id
				true, // has viewport?
				p.specMode,
				p.name, p.teamName,
				p.color, p.colorCycle
			));
		}
		
		sendMessage(m_ready);
	}
	
	public function render(e : Event)
	{
		switch( currState )
		{
			case stateMenu:
			{
				this.grid.render();
				this.menu.render();
				
				if( menu.stateChanging )
				{
					this.grid.fadeOut();
				}
				
				if( keepGame )
				{
					currState = stateGame;
					this.render(e);
					
					if( menu.currMenu == blankMenu || menu.nextMenu == blankMenu )
					{
						if( game.doBlur )
						{
							game.doBlur = false;
							sendMessage( m_unpause );
						}
					}
					
					if( menu.currMenu == blankMenu )
					{
						this.removeChild(this.menu);
						this.removeChild(this.menu.exitMenu);
					}
					else
					{
						currState = stateMenu;
					}
				}
			}
			
			case stateGame:
			{
			#if( target.threaded )
				if( threadEnabled )
				{
					var m = sys.thread.Thread.readMessage(false);
					while( m != null )
					{
						this.game.recvGame(m);
						switch( m[0] )
						{
							case t_ready: sendSettings();
							default:
						}
						m = sys.thread.Thread.readMessage(false);
					}
				}
				else
			#elseif( js )
				if( !threadEnabled )
			#end
				{
					var m = this.gamet.loop();
					if( m != null && m[0] != null )
					{
						switch( m[0] )
						{
							case t_ready: sendSettings();
							default:
						}
						
						this.game.recvGame(m);
					}
				}
				
				this.game.render();
			}
			
			case null:
			default:
		}
	}
	
#if( target.threaded )
	function t_doGame()
	{
		var nextTime = Lib.getTimer() + 0.2;
		while(true)
		{
			var m = sys.thread.Thread.readMessage(false);
			while( m != null )
			{
				gamet.recvMsg( m );
				m = sys.thread.Thread.readMessage(false);
			}
			
			var t = this.gamet.loop();
			
			if( t.length > 0 )
			{
				//sys.thread.Thread.current().sendMessage(t);
				main.sendMessage(t);
			}
			
			var time = Lib.getTimer();
			if ( time < nextTime )
				Sys.sleep( nextTime - time );
			
			nextTime = time + 0.005;
		}
	}
#end
	
	public function setState( state : State )
	{
		switch( currState )
		{
			case stateMenu:
			{
				this.removeChild(this.menu);
				this.removeChild(this.menu.exitMenu);
				if( keepGame )
				{
					keepGame = false;
					this.removeChild(this.game);
					this.game = null;
				}
			}
			
			case stateGame:
			if( !keepGame )
			{
				this.removeChild(this.game);
				this.game = null;
			}
			
			case null:
			default:
		}
		
		switch( state )
		{
			case stateMenu:
			{
				this.addChild(this.menu);
				this.addChild(this.menu.exitMenu);
			}
			
			case stateGame:
			{
				if( !gameActivated && this.gamet == null )
				{
				#if( target.threaded )
					if( threadEnabled )
					{
						this.main = sys.thread.Thread.current();
						var lock = new sys.thread.Lock();
						this.worker = sys.thread.Thread.create(() -> {
							this.gamet = new Game();
							lock.release();
							sys.thread.Thread.runWithEventLoop( t_doGame );
						});
						lock.wait();
					}
					else
				#end
					{
						this.gamet = new Game();
					}
					gameActivated = true;
				}
				
				if( this.game == null )
				{
					this.game = new GameView();
					this.addChild(this.game);
				}
			}
			
			case stateQuit:
			{
			#if( sys )
				Sys.exit(0);
			#else
				throw 'exit'; // HACK!!
			#end
			}
		}
		
		currState = state;
		onresize();
	}
	
	function sendMessage( e : TGameEvent )
	{
		#if( target.threaded || js )
		if( threadEnabled )
		{
			#if( !target.threaded && js )
				worker.postMessage(e);
			#else
				worker.sendMessage(e);
			#end
		}
		else
		#end
		{
			gamet.recvMsg(e);
		}
	}
	
	public function resetGame()
	{
		sendMessage( m_reset );
	}
	
	public function gameMenu()
	{
		game.doBlur = true;
		keepGame = true;
		setState( stateMenu );
		menu.lastMenus.push( blankMenu );
		menu.nextMenu = inGameMenu;
		menu.changeMenu( menu.nextMenu );
		menu.lastMenus.push( menu.nextMenu );
		sendMessage( m_pause );
	}
	
	private function onkeydown( e : KeyboardEvent )
	{
		switch( currState )
		{
			case stateMenu:
			{
				if( KeyBindControl.capture )
				{
					KeyBindControl.keyDown(e);
				}
				else
				switch(e.keyCode)
				{
					case 27: menu.triggerMenuBack();
					//case 38: trace("TODO");
					//case 40: trace("TODO");
				}
			}
			
			case stateGame:
			{
				//trace(e.keyCode);
				
				switch(e.keyCode)
				{
					case 27:
					{
						gameMenu();
					}
				}
				
				var turnLeft = userConfig.players[0].turnLeft.indexOf(e.keyCode);
				var turnRight = userConfig.players[0].turnRight.indexOf(e.keyCode);
				
				if( turnLeft != -1 )
				{
					sendMessage( m_turn(0, -1, turnLeft+1) );
				}
				else if( turnRight != -1 )
				{
					sendMessage( m_turn(0, 1, turnRight+1) );
				}
				
				//;
			}
			
			default:
		}
	}
	
	private function onresize( e : Event = null )
	{
		switch( currState )
		{
			case stateMenu:
			{
				this.grid.onresize();
				this.menu.onresize();
			}
			
			case stateGame:
			{
				this.game.onresize();
			}
			
			default:
		}
	}
}
