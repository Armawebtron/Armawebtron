
package game;


import GameCore;

import game.Object;
import game.Sensors;
import game.Game;

class Player
{
	static var ids : UInt = 0;
	public var id : UInt;
	
	public var localID : UInt;
	
	public var isAI : Bool;
	public var name : String;
	
	public var color : UInt;
	public var cycleColor : UInt;
	
	public var spectating : Bool;
	
	public var cycle : Cycle;
	
	public function new()
	{
		id = ids++;
		
		isAI = false;
		name = "";
		
		localID = 0;
		
		spectating = false;
	}
	
	public function state() : TGameEvent
	{
		return t_player(
			id,
			true,
			name,
			isAI,
			cycleColor, color,
			0, 0,
			0
		);
	}
	
	public function delState() : TGameEvent
	{
		return t_player(
			id,
			false,
			name,
			isAI,
			cycleColor, color,
			0, 0,
			0
		);
	}
}


class CycleWall extends Wall
{
	public var owner : Cycle;
	
	override public function newState() : TGameEvent
	{
		var pid : Int = 0; if( owner != null ) { pid = owner.id; }
		return t_newWall(
			id, 
			wall_cycle, 
			pid, 
			x1, y1,
			x2, y2
		);
	}
}


class Cycle extends BaseObject
{
	static var ids : UInt = 0;
	
	public var p : Player;
	
	public var collision : Bool;
	public var dist : Sensors;
	public var minDist : Sensors;
	public var collideTime : Float;
	
	public var lastSpeed : Float;
	
	public var dir : UInt;
	public var axes : Array<Array<Float>>;
	
	public var alive : Bool;
	
	public var speed : Float;
	public var speedTarget : Float;
	public var cycleSpeedDecayBelow : Float;
	public var cycleSpeedDecayAbove : Float;
	public var cycleDelay : Float;
	static public var rubberMinDist : Float = 0.03;
	static public var rubberMinAdj : Float = 0.05;
	
	public var wallAccel : CycleAccel;
	
	public var rubber : Float;
	public var rubberMax : Float;
	
	public var rubberTime : Float;
	
	public var maxWallLen : Float;
	
	public var explRadius : Float;
	public var explSpeedMult : Float;
	
	
	public var brake : Float;
	public var braking : Bool;
	
	public var walls : Array<CycleWall>;
	public var wallLen : Float;
	
	public var totalDist : Float;
	
	public var lastTurnTime : Float;
	
	public var game : Game;
	
	public function new( g : Game )
	{
		super();
		
		id = ids++;
		game = g;
		
		speedTarget = 30;
		cycleSpeedDecayBelow = 5.;
		cycleSpeedDecayAbove = 0.1;
		
		cycleDelay = 0.1;
		
		rubberMax = 5;
		rubberTime = 10;
		
		explRadius = 2;
		explSpeedMult = 0;
		
		maxWallLen = 400;
		
		
		alive = true;
		
		rubber = 0;
		speed = 20;
		
		xdir = 0;
		ydir = 1;
		
		dir = 0;
		turnQueue = [];
		
		walls = [];
		wallLen = 0;
		
		wallAccel = new CycleAccel(this);
		
		totalDist = 0;
		
		lastTurnTime = 0;
		
		collision = false;
		dist = new Sensors( g );
		minDist = new Sensors( g ); minDist.f = rubberMinDist;
		collideTime = 5; lastSpeed = speed;
		
		checkLast = true;
		
		p = null;
	}
	
	public function mkNewWall()
	{
		var w = new CycleWall();
		
		w.owner = this;
		
		w.x1 = this.x; w.y1 = this.y;
		w.x2 = this.x; w.y2 = this.y;
		
		w.dist = totalDist;
		
		this.walls.push(w);
		game.walls.push(w);
		game.eToSend.push(w.newState());
	}
	
	public function turnReady( dir )
	{
		this.dir = (this.dir+dir)%axes.length;
		
		this.xdir = axes[this.dir][0];
		this.ydir = axes[this.dir][1];
		
		this.speed *= 0.95;
		
		mkNewWall();
		
		
		switch( dir )
		{
			case -1: collideTime = time + ( dist.l / this.speed );
			case  1: collideTime = time + ( dist.r / this.speed );
		}
		
		var mult = ( 1 - rubberMinAdj );
		minDist.f = Math.max(0,Math.min(dist.f*mult,rubberMinDist));
		
		lastTurnTime = time;
	}
	
	var turnQueue : Array<Bool>;
	public function doTurn( dir )
	{
		if( time >= ( lastTurnTime + cycleDelay ) )
		{
			turnReady( dir );
		}
		else switch( dir )
		{
			case -1: turnQueue.push(false);
			case  1: turnQueue.push(true);
		}
	}
	
	public function updateTo( t : Float ) : Bool
	{
		if( t > time )
		{
			return update( t - time );
		}
		return false;
	}
	
	public function update( timestep : Float ) : Bool
	{
		if( turnQueue.length != 0 )
		{
			var next = ( lastTurnTime + cycleDelay );
			if( time < next && ( time + timestep ) >= next )
			{
				var ret = false;
				
				// update to when the turn should be
				var ts = ( lastTurnTime + cycleDelay ) - time;
				ret = update_only( ts );
				
				timestep -= ts;
				
				// lol..
				dist.measure( this, speed * 5 );
				
				// actually do the turn
				var dir = turnQueue.shift();
				if( dir ) this.turnReady(  1 );
				else      this.turnReady( -1 );
				
				// don't bother if nothing would change here
				if( timestep == 0 ) return ret;
				
				// have to calculate sensors for the next update to work
				dist.measure( this, speed * 5 );
				
				// recursive, we gotta make all turns accurate!
				return update( timestep );
			}
		}
		
		return update_only( timestep );
	}
	public function update_only( timestep : Float ) : Bool
	{
		time += timestep;
		
		var accel : Float = 0;
		
		if( this.speed < speedTarget )
		{
			accel += ( speedTarget - this.speed ) * cycleSpeedDecayBelow;
		}
		else if( this.speed > speedTarget )
		{
			accel += ( speedTarget - this.speed ) * cycleSpeedDecayAbove;
		}
		
		if( this.braking )
		{
			accel -= 10;
		}
		
		accel += wallAccel.calc();
		
		this.speed += accel * timestep;
		
		
		var move : Float = ( ( speed + lastSpeed ) / 2 ) * timestep;
		var radj : Float = move;
		
		if( time >= collideTime )
		{
			collision = true;
			
			var adjdist = ( time - this.collideTime ) * this.lastSpeed;
			radj = timestep;
			//radj = adjdist;
			radj *= this.lastSpeed;
			move -= adjdist;
		}
		
		if( collision )
		{
			rubber += radj;
			
			if( rubber > rubberMax )
			{
				alive = false;
				//game.eToSend.push(delState());
			}
			
			move *= dist.f;
			if( dist.f < this.minDist.f )
			{
				this.minDist.f = Math.max(0,dist.f);
			}
		}
		
		
		{
			lastX = x; lastY = y;
			lastdirX = xdir; lastdirY = ydir;
			
			this.x += move * xdir;
			this.y += move * ydir;
			
			totalDist += move;
		}
		
		if( rubber > 0 )
		{
			rubber -= ( timestep / rubberTime ) * rubber;
		}
		else if( rubber != 0 )
		{
			rubber = 0;
		}
		
		if( walls.length > 0 )
		{
			var wall = walls[walls.length-1];
			wall.x2 = x; wall.y2 = y;
			wallLen += move;
			
			game.eToSend.push(wall.state());
		}
		else
		{
			mkNewWall();
			//this.x += this.xdir;
			//this.y += this.ydir;
		}
		
		if( !alive )
		{
			game.blastHole( x, y, explRadius + ( explSpeedMult * speed ), CycleWall );
		}
		else
		{
			wallShrink();
		}
		
		collideTime = time + ( ( dist.f - minDist.f ) / this.speed );
		lastSpeed = speed;
		
		if( p != null && p.isAI )
		{
			if( time > 1 && lastTurnTime+cycleDelay < time && dist.f < 5 )
			{
				if( dist.l > dist.r )
				{
					turnReady( -1 );
				}
				else
				{
					turnReady(  1 );
				}
			}
		}
		
		return true;
	}
	
	public function wallShrink()
	{
		var diff = wallLen - maxWallLen;
		
		var minD : Float = Math.POSITIVE_INFINITY;
		var w : CycleWall = null;
		
		if( diff > 0 )
		{
			for( w2 in walls )
			{
				if( w2.dist < minD )
				{
					minD = w2.dist;
					w = w2;
				}
			}
			
			if( w != null )
			{
				var len = w.getLength();
				if( diff >= len )
				{
					this.walls.remove(w);
					game.walls.remove(w);
					
					wallLen -= len;
					
					game.eToSend.push( w.delState() );
				}
				else
				{
					var dir = Math.atan2( ( w.y2 - w.y1 ), ( w.x2 - w.x1 ) );
					var xdir = Math.cos(dir), ydir = Math.sin(dir);
					
					w.x1 += xdir * diff;
					w.y1 += ydir * diff;
					
					wallLen -= diff;
					
					game.eToSend.push( w.state() );
				}
			}
		}
	}
	override public function objType() : GObjType
	{
		return obj_cycle;
	}
	
	override public function newState() : TGameEvent
	{
		var pid : Int = 0; if( p != null ) { pid = p.id; }
		return t_newCycle(
			id, pid,
			x, y,
			xdir, ydir
		);
	}
	
	override public function state() : TGameEvent
	{
		return t_cycle(
			id, alive,
			x, y, 
			xdir, ydir,
			collision || game.paused || time < 0,
			speed, rubber
		);
	}
}

class CycleAccel
{
	public var target : Cycle;
	
	static public var _accelBase : Float = 20;
	public var accelBase : Float;
	
	static public var _rimMult : Float = 0;
	public var rimMult : Float;
	
	static public var _selfMult : Float = 1;
	public var selfMult : Float;
	
	static public var _teamMult : Float = 1;
	public var teamMult : Float;
	
	static public var _enemyMult : Float = 1;
	public var enemyMult : Float;
	
	static public var _offset : Float = 2;
	public var offset : Float;
	
	static public var _wallNear : Float = 6;
	public var wallNear : Float;
	
	public function new( t )
	{
		target = t;
		
		accelBase = _accelBase;
		rimMult = _rimMult;
		selfMult = _selfMult;
		teamMult = _teamMult;
		enemyMult = _enemyMult;
		offset = _offset;
		wallNear = _wallNear;
	}
	
	public function against( dist : Float, w : Wall ) : Float
	{
		if( wallNear < dist ) return 0;
		
		var wallAccel : Float = accelBase;
		
		var c : CycleWall = try cast(w,CycleWall) catch(e) null;
		
		if( c == null )
			wallAccel *= rimMult;
		else if( c.owner == target )
			wallAccel *= selfMult;
		else
			wallAccel *= enemyMult;
		
		return wallAccel * (
			( 1 / ( dist + offset ) ) -
			( 1 / ( wallNear + offset ) )
		);
	}
	
	public function calc() : Float
	{
		var finalAccel : Float = 0;
		
		if( accelBase != 0 && target.dist.l < wallNear || target.dist.r < wallNear )
		{
			finalAccel += against( target.dist.l, target.dist.lWall );
			finalAccel += against( target.dist.r, target.dist.rWall );
		}
		
		return finalAccel;
	}
}

