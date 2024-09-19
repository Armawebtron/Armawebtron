package;

import openfl.Lib;

import openfl.display.*;
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

import network.*;

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
	
	var gameAdded : Bool;
	
	var gamet : Game;
#if( target.threaded )
	var worker : sys.thread.Thread;
	var main : sys.thread.Thread;
#elseif( js )
	var worker : js.html.Worker;
#end
	
	public var netMult : Array<Client>;
	
	var currState : State;
	
	public function new()
	{
		{
			super();
			initMain();
		}
	}
	
	public var userConfig : UserConfig;
	
	public var chFullscreen : Bool;
	public var fullscreen : Bool;
	public var disableThread : Bool;
	
	public var keyDown : Map<UInt, Bool>;
	
	public function onExit()
	{
		userConfig.save(this);
		for( n in netMult )
		{
			if( n.clientID != 0 )
			{
				n.disconnect();
			}
		}
	}
	
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
		stage.addEventListener(KeyboardEvent.KEY_UP, onkeyup);
		
		this.grid = new GridAnimation();
		this.addChild(this.grid);
		
		this.currState = null;
		
		this.menu = new Menu(this);
		this.game = null;
		this.gamet = null;
		//this.worker = null;
		
		chFullscreen = false;
		fullscreen = false;
		disableThread = false;
		
		this.userConfig = new UserConfig();
		userConfig.load(this);
		
		openfl.Lib.current.stage.application.onExit.add(function(code)
		{
			this.onExit();
		});
		#if( js )
			js.Browser.window.onbeforeunload = ( (e) -> { this.onExit(); return null; } );
		#end
		
		if( disableThread )
		{
			threadEnabled = false;
		}
		
		#if( !target.threaded && js )
			// workers not working?!
			//threadEnabled = false;
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
			worker = new js.html.Worker("worker.js");
			worker.onmessage = msgFromWorker;
		}
		#end
		
		gameActivated = false;
		keepGame = false;
		
		netMult = [];
		
		keyDown = [];
		
		this.setState( stateMenu );
	}
	
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
		if( netMult.length > 0 )
		{
			for( n in netMult )
			{
				n.run();
				if( n.done )
				{
					netMult.remove(n);
				}
			}
		}
		
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
				
				if( !gameAdded )
				{
					this.removeChild(this.game);
					this.addChild(this.game);
					gameAdded = true;
				}
				
				this.game.render();
			}
			
			case null:
			default:
		}
		
		if( chFullscreen )
		{
			chFullscreen = false;
			if( fullscreen )
				Lib.current.stage.displayState = StageDisplayState.FULL_SCREEN_INTERACTIVE;
			else
				Lib.current.stage.displayState = StageDisplayState.NORMAL;
		}
	}
#if( !target.threaded && js )
	function msgFromWorker( e : js.html.MessageEvent )
	{
		var m : Array<TGameEvent> = haxe.Json.parse( e.data );
		
		switch( m[0] )
		{
			case t_ready: sendSettings();
			default:
		}
		
		this.game.recvGame(m);
	}
#end
	
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
			
			nextTime = time + 0.002;
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
				else
				{
					this.removeChild(this.grid);
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
						#if( haxe_ver >= 4.2 )
							sys.thread.Thread.runWithEventLoop( t_doGame );
						#else
							t_doGame();
						#end
						});
						lock.wait();
					}
					else
				#elseif( js )
					if( threadEnabled )
					{
						sendMessage( m_unpause );
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
					this.game = new GameView( userConfig );
					this.addChild(this.game);
				}
				gameAdded = false;
			}
			
			case stateQuit:
			{
				userConfig.save(this);
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
				worker.postMessage( haxe.Json.stringify( e ) );
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
	
	public function connectToGame( host : String, port : UInt, name : String = "" )
	{
		if( name == "" ) name = host+":"+port;
		
		sendMessage( m_connect(host, port) );
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
		if( !KeyBindControl.capture )
		{
			if( userConfig.global.toggleFS.indexOf(e.keyCode) != -1 )
			{
				chFullscreen = true;
				fullscreen = !fullscreen;
			}
		}
		
		switch( currState )
		{
			case stateMenu:
			{
				if( keepGame && !game.doBlur )
				{
					currState = stateGame;
					onkeydown( e );
					currState = stateMenu;
					return;
				}
				
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
					if( keyDown[e.keyCode] ) return;
					keyDown[e.keyCode] = true;
					
					sendMessage( m_turn(0, -1, turnLeft+1) );
					userConfig.players[0].cam.lastTurnDir = -1;
				}
				else if( turnRight != -1 )
				{
					if( keyDown[e.keyCode] ) return;
					keyDown[e.keyCode] = true;
					
					sendMessage( m_turn(0, 1, turnRight+1) );
					userConfig.players[0].cam.lastTurnDir = 1;
				}
				else if( userConfig.players[0].brake.indexOf(e.keyCode) != -1 )
				{
					sendMessage( m_brake(0, true) );
				}
				else if( userConfig.players[0].toggleBrake.indexOf(e.keyCode) != -1 )
				{
					if( keyDown[e.keyCode] ) return;
					keyDown[e.keyCode] = true;
					
					sendMessage( m_brakeToggle(0) );
				}
				else if( userConfig.players[0].glanceBack.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceBack = true;
				}
				else if( userConfig.players[0].glanceFwd.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceFwd = true;
				}
				else if( userConfig.players[0].glanceLeft.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceLeft = true;
				}
				else if( userConfig.players[0].glanceRight.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceRight = true;
				}
				
				//;
			}
			
			default:
		}
	}
	
	private function onkeyup( e : KeyboardEvent )
	{
		switch( currState )
		{
			case stateGame:
			{
				if( userConfig.players[0].glanceBack.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceBack = false;
				}
				else if( userConfig.players[0].glanceFwd.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceFwd = false;
				}
				else if( userConfig.players[0].glanceLeft.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceLeft = false;
				}
				else if( userConfig.players[0].glanceRight.indexOf(e.keyCode) != -1 )
				{
					userConfig.players[0].cam.glanceRight = false;
				}
				else if( userConfig.players[0].brake.indexOf(e.keyCode) != -1 )
				{
					sendMessage( m_brake(0, false) );
				}
			}
			
			default:
		}
		
		if( keyDown[e.keyCode] ) keyDown[e.keyCode] = false;
	}
	
	private function onresize( e : Event = null )
	{
		switch( currState )
		{
			case stateMenu:
			{
				this.menu.onresize();
				
				if( keepGame ) this.game.onresize();
				else this.grid.onresize();
			}
			
			case stateGame:
			{
				this.game.onresize();
			}
			
			default:
		}
	}
}
