package;

import openfl.Lib;

import openfl.display.Sprite;
import openfl.events.Event;

import openfl.text.TextField;
import openfl.text.TextFormat;
import openfl.text.TextFormatAlign;

import sys.thread.Thread;
//import hx.concurrent.thread.Thread;


import Menu;
import GameView;
import GridAnimation;

import Game;

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
	
	var gamet : Game;
	var worker : sys.thread.Thread;
	var main : sys.thread.Thread;
	
	var currState : State;
	
	public function new()
	{
		threadEnabled = true;
		
		super();
		
		addEventListener(Event.ENTER_FRAME, render);
		
		this.grid = new GridAnimation();
		this.addChild(this.grid);
		
		this.currState = null;
		
		this.menu = new Menu(this);
		this.game = null;
		this.gamet = null;
		//this.worker = null;
		
		this.setState( stateMenu );
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
			}
			
			case stateGame:
			{
				if( threadEnabled )
				{
					var m = sys.thread.Thread.readMessage(false);
					while( m != null )
					{
						this.game.recvGame(m);
						m = sys.thread.Thread.readMessage(false);
					}
				}
				else
				{
					this.game.recvGame(this.gamet.loop());
				}
				
				this.game.render();
			}
			
			case null:
			default:
		}
	}
	
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
	
	public function setState( state : State )
	{
		switch( currState )
		{
			case stateMenu:
			{
				this.removeChild(this.menu);
				this.removeChild(this.menu.exitMenu);
			}
			
			case stateGame:
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
				if( this.gamet == null )
				{
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
					{
						this.gamet = new Game();
					}
				}
				
				if( this.game == null )
				{
					this.game = new GameView();
					this.addChild(this.game);
				}
			}
			
			case stateQuit:
			{
				Sys.exit(0);
			}
		}
		
		currState = state;
	}
}
