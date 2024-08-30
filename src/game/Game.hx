
package game;


#if !noOpenFL
import openfl.Lib;
#end

import GameCore;
import TMath;

import game.Sensors;
import game.Object;
import game.Player;

#if noOpenFL
class Lib
{
	static public inline function getTimer()
	{
		return Std.int( Date.now().getTime() );
	}
}
#end


enum RoundStates { R_COMMENCING;
	R_WAIT;
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
	public var walls : Array<Wall>;
	
	public var gameTime : Float;
	
	//public var eToSend : Array<Array<Dynamic>>;
	public var eToSend : Array<TGameEvent>;
	
	public var axes : Array<Array<Float>>;
	
	public var ready : Bool;
	public var paused : Bool;
	
	private var lastTime : UInt;
	
	public function new()
	{
		this.roundState = R_COMMENCING;
		
		this.eToSend = [];
		
		this.players = [];
		this.cycles = [];
		this.walls = [];
		
		this.gameTime = 0;
		
		
		this.lastTime = Lib.getTimer();
		
		axes = [[0, -1], [-1, 0], [0, 1], [1, 0]];
		
		addedAIs = false;
		paused = false;
		
		Sensors._game = this;
	}
	
	public function consoleMessage( str : String )
	{
		trace( str );
		eToSend.push( t_con( 0, str ) );
	}
	
	var addedAIs : Bool;
	
	
	var lastCountDown : Int;
	
	public function recvMsg( e : TGameEvent )
	{
		switch(e)
		{
			case m_ready: ready = true;
			
			case m_localPlayer(
				id, vp, spec,
				name, teamname,
				color, cycleColor
			):
			{
				var p : Player = null;
				for( s in players )
				{
					if( s.localID == id )
					{
						p = s;
						break;
					}
				}
				
				if( p == null )
				{
					var p = new Player();
					
					p.localID = id;
					
					p.name = name;
					p.color = color;
					p.cycleColor = cycleColor;
					
					players.push( p );
				}
			}
			
			case m_turn( id, dir, key ):
			{
				var cycle : Cycle = players[0].cycle;
				
				if( cycle != null )
				{
					cycle.doTurn(dir);
				}
			}
			
			case m_pause:
			{
				paused = true;
				
				{
					for( c in cycles )
					{
						eToSend.push( c.state() );
					}
				}
			}
			
			case m_unpause:
			{
				paused = false;
			}
			
			case m_reset:
			{
				if( roundState == R_PLAY )
				{
					nextState();
				}
			}
			
			default:
		}
	}
	
	private function _blastHole( w : Wall,
		startX : Float, startY : Float, 
		wallX : Float, wallY : Float
	) : Wall
	{
		// create new wall of same type before the hole
		var w2 = Type.createInstance(Type.getClass(w),[]);
		w2.x1 = w.x1; w2.y1 = w.y1;
		w2.x2 = startX; w2.y2 = startY;
		w2.dist = w.dist;
		
		
		if( Std.isOfType( w, CycleWall ) )
		{
			var cw = cast( w, CycleWall ), cw2 = cast( w2, CycleWall );
			
			if( cw.owner != null )
			{
				cw.owner.walls.push( cw2 );
				cw2.owner = cw.owner;
			}
		}
		
		// move the original wall's starting point to after the hole
		w.x1 = wallX; w.y1 = wallY;
		w.dist += TMath.pointDistance( startX, startY, w.x1, w.y1 );
		
		eToSend.push( w.state() );
		
		return w2;
	}
	
	public function blastHole( x : Float, y : Float, radius : Float, type : Class<Wall> )
	{
		var dist : Float, dir : Float, xdir : Float, ydir : Float;
		var wallX : Float, wallY : Float;
		var mkHole : Bool, startX : Float = 0, startY : Float = 0;
		var newWalls : Array<Wall> = [];
		var i : UInt = 0;
		for( w in walls )
		{
			if( Std.isOfType( w, type ) )
			{
				i++;
				dist = w.getLength();
				
				dir = Math.atan2( ( w.y2 - w.y1 ), ( w.x2 - w.x1 ) );
				xdir = Math.cos(dir)/100; ydir = Math.sin(dir)/100;
				
				mkHole = false;
				
				wallX = w.x1; wallY = w.y1;
				
				// loop through this wall by 0.01 chunks
				while( dist > 0 )
				{
					wallX += xdir; wallY += ydir;
					dist -= 0.01;
					
					// check if this piece of the wall is in the blast area
					if( TMath.pointDistance( wallX, wallY, x, y ) <= radius )
					{
						if( !mkHole )
						{
							startX = wallX; startY = wallY;
							
							mkHole = true;
						}
					}
					else if( mkHole )
					{
						mkHole = false;
						
						newWalls.push( _blastHole( w, startX, startY, wallX, wallY ) );
					}
				}
				
				if( mkHole )
				{
					mkHole = false;
					
					newWalls.push( _blastHole( w, startX, startY, wallX, wallY ) );
				}
			}
		}
		
		trace(i+" considered");
		
		for( w in newWalls )
		{
			eToSend.push( w.newState() );
			walls.push( w );
		}
		
		trace(newWalls.length+" new walls");
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
		
		eToSend.splice(0, eToSend.length);
		
		
		
		var time = Lib.getTimer();
		
		var delta = time - this.lastTime;
		var timestep : Float = delta / 1000.0;
		
		
		switch( roundState )
		{
			case R_COMMENCING:
			{
				gameTime = -4;
				lastCountDown = 4;
				
				events.push( t_ready );
				ready = false;
				
				nextState();
			}
			
			case R_WAIT:
			{
				if( ready )
				{
					nextState();
				}
			}
			
			case R_LOAD_GRID:
			{
				var numAIs = 0;
				var numHumans = 0;
				
				for( p in players )
				{
					if( p.isAI ) numAIs++;
					else if( !p.spectating ) numHumans++;
				}
				
				while( numAIs < Math.max(0, 4-numHumans) )
				{
					var p = new Player();
					
					p.isAI = true;
					numAIs++;
					
					players.push( p );
				}
				
				while( numAIs > Math.max(0, 4-numHumans) )
				{
					for( p in players )
					{
						if( p.isAI )
						{
							players.remove( p );
						}
					}
				}
				
				var ws = [
					[ -100, -100 ],
					[  100, -100 ],
					[  100,  100 ],
					[ -100,  100 ],
					[ -100, -100 ],
				];
				var dist : Float = 0;
				//for( i in 1..size )
				
				var i : Int = 0;
				while( ++i < ws.length )
				{
					var wall = new Wall();
					
					wall.x1 = ws[i-1][0];
					wall.y1 = ws[i-1][1];
					
					wall.x2 = ws[i][0];
					wall.y2 = ws[i][1];
					
					wall.dist = dist;
					dist += wall.getLength();
					
					walls.push(wall);
					events.push(wall.newState());
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
					case 6: consoleMessage("Stuck inside these four walls...");
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
						var cycle = new Cycle(this);
						
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
						cycle.p = p;
						
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
				if( paused ) timestep = 0;
				
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
				else if( timestep != 0 )
				{
					if( lastCountDown != 0 )
					{
						trace( 0 );
						events.push( t_cen( 0, "0", 1, 1 ) );
						
						lastCountDown = 0;
					}
					
					var count : Int = run( timestep, events );
					
					{
						if( count == 0 )
						{
							nextState();
						}
					}
				}
			}
			
			case R_UNLOAD_OBJECTS:
			{
				var o : BaseObject;
				
				while( (o=walls.pop()) != null || (o=cycles.pop()) != null )
				{
					events.push( o.delState() );
				}
				
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
		var aliveCount : Int = cycles.length;
		
		for( c in cycles )
		{
			c.collision = c.dist.measure( c, c.speed*5 );
		}
		
		for( cycle in cycles )
		{
			if( cycle.alive && cycle.update( timestep ) )
			{
				events.push( cycle.state() );
			}
			else
			{
				--aliveCount;
			}
		}
		
		return aliveCount;
	}
}

