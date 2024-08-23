
package game;


import GameCore;

import game.Object;
import game.Sensors;
import game.Game;

class Player
{
	static var ids : UInt = 0;
	public var id : UInt;
	
	public var isAI : Bool;
	public var name : String;
	
	public var spectating : Bool;
	
	public var cycle : Cycle;
	
	public function new()
	{
		id = ids++;
		
		isAI = false;
		name = "";
		
		spectating = false;
	}
	
	public function state() : TGameEvent
	{
		return t_player(
			id,
			true,
			name,
			isAI
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
	public var id : UInt;
	
	public var p : Player;
	
	public var collision : Bool;
	public var dist : Sensors;
	
	public var dir : UInt;
	public var axes : Array<Array<Float>>;
	
	public var alive : Bool;
	
	public var speed : Float;
	public var speedTarget : Float;
	public var cycleSpeedDecayBelow : Float;
	public var cycleSpeedDecayAbove : Float;
	
	public var rubber : Float;
	public var rubberMax : Float;
	
	public var brake : Float;
	public var braking : Bool;
	
	public var walls : Array<CycleWall>;
	
	public var game : Game;
	
	public function new( g : Game )
	{
		super();
		
		id = ids++;
		game = g;
		
		speedTarget = 30;
		cycleSpeedDecayBelow = 5.;
		cycleSpeedDecayAbove = 0.1;
		
		rubberMax = 5;
		
		alive = true;
		
		rubber = 0;
		speed = 20;
		
		xdir = 0;
		ydir = 1;
		dir = 0;
		
		walls = [];
		
		collision = false;
		dist = new Sensors();
		
		checkLast = true;
		
		p = null;
	}
	
	public function mkNewWall()
	{
		var w = new CycleWall();
		
		w.owner = this;
		
		w.x1 = this.x; w.y1 = this.y;
		w.x2 = this.x; w.y2 = this.y;
		
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
		
		
		this.lastX = this.x + this.xdir * 0.0001;
		this.lastY = this.y + this.ydir * 0.0001;
	}
	
	public function doTurn( dir )
	{
		turnReady( dir );
	}
	
	public function update( timestep : Float ) : Bool
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
		
		this.speed += accel * timestep;
		
		
		if( collision )
		{
			
		}
		else
		{
			lastX = x; lastY = y;
			
			this.x += timestep * speed * xdir;
			this.y += timestep * speed * ydir;
		}
		
		if( rubber > 0 )
		{
			rubber -= timestep * rubber;
		}
		else if( rubber != 0 )
		{
			rubber = 0;
		}
		
		if( walls.length > 0 )
		{
			var wall = walls[walls.length-1];
			wall.x2 = x; wall.y2 = y;
			
			game.eToSend.push(wall.state());
		}
		else
		{
			mkNewWall();
			this.x += this.xdir;
			this.y += this.ydir;
		}
		
		if( p != null && p.isAI )
		{
			if( time > 1 )
			{
				if( dist.l > dist.r )
				{
					
				}
				else
				{
					
				}
			}
		}
		
		return true;
	}
	
	/*
	public function newState() : Array<Dynamic>
	{
		return [
			"newCycle",
			id,
			x, y,
			xdir, ydir,
		];
	}
	
	public function state() : Array<Dynamic>
	{
		return [
			"cycle",
			id,
			alive,
			x, y,
			xdir, ydir,
			speed, rubber,
		];
	}*/
	
	public function newState() : TGameEvent
	{
		return t_newCycle(
			id, 
			x, y,
			xdir, ydir
		);
	}
	
	public function state() : TGameEvent
	{
		return t_cycle(
			id, alive,
			x, y, 
			xdir, ydir,
			speed, rubber
		);
	}
}

