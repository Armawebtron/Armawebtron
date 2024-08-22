
import openfl.Lib;

import Player;
import GameCore;

import TMath;

enum RoundStates { R_COMMENCING;
	R_LOAD_GRID; R_LOAD_OBJECTS;
	R_LOAD_CAMERA;
	
	R_PLAY;
	
	R_UNLOAD_OBJECTS;
	
	// keep last
	R_END;
}

class Game
{
	public var roundState : RoundStates;
	
	function nextState()
	{
		var e = Type.allEnums(RoundStates);
		roundState = e[e.indexOf(roundState)+1];
		
		trace(roundState);
	}
	
	public var players : Array<Player>;
	public var cycles : Array<Cycle>;
	
	public var gameTime : Float;
	
	//public var eToSend : Array<Array<Dynamic>>;
	public var eToSend : Array<TGameEvent>;
	
	public var axes : Array<Array<Float>>;
	
	private var lastTime : UInt;
	
	public function new()
	{
		this.roundState = R_COMMENCING;
		
		this.eToSend = [];
		
		this.players = [];
		this.cycles = [];
		
		this.gameTime = 0;
		
		this.lastTime = Lib.getTimer();
		
		axes = [[0, -1], [-1, 0], [0, 1], [1, 0]];
		
		addedAIs = false;
	}
	
	public function consoleMessage( str : String )
	{
		trace( str );
	}
	
	var addedAIs : Bool;
	
	
	var lastCountDown : Int;
	
	public function recvMsg( e : TGameEvent )
	{
		switch(e)
		{
			case m_turn( id, dir, key ):
			{
				var cycle : Cycle = players[0].cycle;
				
				trace(dir);
				
				if( cycle != null )
				{
					cycle.doTurn(dir);
				}
			}
			
			default:
		}
	}
	
	//public function loop() : Array<Array<Dynamic>>
	public function loop() : Array<TGameEvent>
	{
		//var events : Array<Array<Dynamic>> = [];
		var events : Array<TGameEvent> = [];
		
		for( e in eToSend )
		{
			events.push( e );
		}
		
		
		
		var time = Lib.getTimer();
		
		var delta = time - this.lastTime;
		var timestep : Float = delta / 1000.0;
		
		
		switch( roundState )
		{
			case R_COMMENCING:
			{
				gameTime = -4;
				lastCountDown = 4;
				
				nextState();
			}
			
			case R_LOAD_GRID:
			{
				if( !addedAIs )
				{
					for(i in 0...4)
					{
						var p = new Player();
						
						p.isAI = true;
						
						players.push( p );
					}
					
					addedAIs = true;
				}
				
				nextState();
			}
			
			case R_LOAD_OBJECTS:
			{
				//fade_out(64);
				switch(Std.int(time%10))
				{
					case 0: consoleMessage("Another round, another crash.");
					case 1: consoleMessage("The MCP isn't gonna win this time.");
					case 2: consoleMessage("We got this!");
					case 3: consoleMessage("Hack the grid!");
					case 4: consoleMessage("There's so much more memory to fill.");
					case 5: consoleMessage("I wonder what's beyond the void...");
					case 6: consoleMessage("What's stopping us from escaping the grid anyway?");
					case 7: consoleMessage("Let's corrupt all the enemy cycles' cores!");
					case 8: consoleMessage("Dump some cores!");
					case 9: consoleMessage("Cause a page fault!");
					default:
						consoleMessage("");
				}
				
				var i : UInt = 0;
				for(p in players)
				{
					if( !p.spectating )
					{
						var cycle = new Cycle();
						
						cycle.xdir = Math.cos(i*(Math.PI/2));
						cycle.ydir = Math.sin(i*(Math.PI/2));
						
						for(i=>a in axes)
						{
							if(
								Math.round(a[0]) == Math.round(cycle.xdir) &&
								Math.round(a[1]) == Math.round(cycle.ydir)
							)
							{
								cycle.dir = i;
							}
						}
						
						var s : Float;
						if( ((i%8)>3) )
							s = -4;
						else
							s = 4;
						
						cycle.x = ( cycle.xdir * ( -70 - ( Std.int(i/4) * 4 ) ) ) + ( cycle.ydir * ( ( Std.int(i/8) * s ) - 2 ) );
						cycle.y = ( cycle.ydir * ( -70 - ( Std.int(i/4) * 4 ) ) ) + ( cycle.xdir * ( ( Std.int(i/8) * s ) - 2 ) );
						
						this.cycles.push(cycle);
						cycle.axes = axes;
						
						events.push( cycle.newState() );
						
						p.cycle = cycle;
						
						++i;
					}
				}
				
				nextState();
			}
			
			case R_LOAD_CAMERA:
			{
				
				nextState();
			}
			
			case R_PLAY:
			{
				gameTime += timestep;
				
				if( gameTime < 0 )
				{
					var countDown : Int = Math.ceil(-gameTime);
					if( lastCountDown != countDown )
					{
						trace( countDown );
						events.push( t_cen( 0, Std.string( countDown ), 1, 1 ) );
						
						lastCountDown = countDown;
						
					}
				}
				else
				{
					if( lastCountDown != 0 )
					{
						trace( 0 );
						events.push( t_cen( 0, "0", 1, 1 ) );
						
						lastCountDown = 0;
					}
					
					run( timestep, events );
				}
			}
			
			case R_UNLOAD_OBJECTS:
			{
				
				nextState();
			}
			
			case R_END:
			{
				roundState = R_COMMENCING;
			}
		}
		
		lastTime = time;
		
		return events;
	}
	
	public function run( timestep : Float, events : Array<TGameEvent> )
	{
		for( c in cycles )
		{
			var lxdir : Float, lydir : Float;
			if( ( c.dir & 1 ) != 0 )
			{
				lxdir = c.ydir;
				lydir = c.xdir;
			}
			else
			{
				lxdir = -c.ydir;
				lydir = -c.xdir;
			}
			
			var range : Float = c.speed * 5;
			
			
			for( c2 in cycles )
			{
				for( wall in c.walls )
				{
					if( TMath.lineIntersect(
						c.lastX, c.lastY,
						c.x, c.y,
						wall.x1, wall.y1,
						wall.x2, wall.y2
					) )
					{
						var dist = TMath.distanceOfLines(
							c.lastX, c.lastY,
							c.lastX, c.lastY,
							wall.x1, wall.y1,
							wall.x2, wall.y2
						) - 0.03;
						
						c.x = c.lastX+
							(c.xdir*dist);
						c.y = c.lastY+
							(c.ydir*dist);
						
						//if( i != k || c.currWall != j+1 )
						//	c.collision = 1;
						
						if( TMath.lineIntersect(
							c.lastX, c.lastY,
							c.x, c.y,
							wall.x1, wall.y1,
							wall.x2, wall.y2
						) )
						{
							c.x = c.lastX;
							c.y = c.lastY;
						}
						
						// hmm, arguably we should try all cycles / walls again
						//i = MAX_CYCLES;
						//break;
						
						// but that doesn't actually seem to help much
					}
					
					if( TMath.lineIntersect(
						c.x, c.y,
						( c.x + c.xdir * range ), ( c.y + c.ydir * range ),
						wall.x1, wall.y1,
						wall.x2, wall.y2
					) )
					{
						var ff = TMath.distanceOfLines(
							c.x, c.y,
							c.x, c.y,
							wall.x1, wall.y1,
							wall.x2, wall.y2
						);
						
						if( ff < 0.03 )
						{
							c.collision = true;
						}
						
						if( c.dist.f > ff )
							c.dist.f = ff;
					}
					
					if( TMath.lineIntersect(
						c.x, c.y,
						( c.x + lxdir * range ), ( c.y + lydir * range ),
						wall.x1, wall.y1,
						wall.x2, wall.y2
					) )
					{
						var ff = TMath.distanceOfLines(
							c.x, c.y,
							c.x, c.y,
							wall.x1, wall.y1,
							wall.x2, wall.y2
						);
						
						if( c.dist.l > ff )
						{
							c.dist.l = ff;
							//type_l[k] = 1 + (i == k);
						}
					}
					
					if( TMath.lineIntersect(
						c.x, c.y,
						( c.x - lxdir * range ), ( c.y - lydir * range ),
						wall.x1, wall.y1,
						wall.x2, wall.y2
					) )
					{
						var ff = TMath.distanceOfLines(
							c.x, c.y,
							c.x, c.y,
							wall.x1, wall.y1,
							wall.x2, wall.y2
						);
						
						if( c.dist.r > ff )
						{
							c.dist.r = ff;
							//type_r[k] = 1 + (i == k);
						}
					}
				}
			}
		}
		
		
		for( cycle in cycles )
		{
			if( cycle.update( timestep ) )
			{
				events.push( cycle.state() );
			}
		}
	}
}

