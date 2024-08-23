
import GameCore;
import TMath;

class BaseObject
{
	public var time : Float;
	
	public var x : Float; public var y : Float;	
	public var xdir : Float; public var ydir : Float;
	
	public var checkLast : Bool;
	public var lastX : Float; public var lastY : Float;
	
	public function new()
	{
		time = 0;
		
		checkLast = false;
		
		lastX = lastY = 0;
		x = y = 0;
		
		xdir = 0; ydir = 0;
	}
}

class Wall
{
	static var ids : UInt = 0;
	public var id : UInt;
	
	public var x1 : Float; public var y1 : Float;
	public var x2 : Float; public var y2 : Float;
	
	public var dist : Float;
	
	
	public function new()
	{
		id = ids++;
		
		x1 = y1 = 0;
		x2 = y2 = 0;
		dist = 0;
	}
	
	public function getLength()
	{
		return TMath.pointDistance( x1, y1, x2, y2 );
	}
	
	public function newState() : TGameEvent
	{
		return t_newWall(
			id, 
			wall_rim, 
			0, 
			x1, y1,
			x2, y2
		);
	}
	
	public function state() : TGameEvent
	{
		return t_wall(
			id, 
			x1, y1,
			x2, y2
		);
	}
}



