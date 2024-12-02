
package game;


import GameCore;
import TMath;

import game.Game;

import network.Message;

class NetObject
{
	public var netid : UInt;
	public var ownerid : UInt;
	
	public var init : Bool;
	
	public function readNetInit( msg : Message, from : Int, game : Game ) : Void
	{
		// ugh
		init = true;
		
		netid = msg.getShort();
		ownerid = msg.getShort();
		readNet(msg, from);
		
		init = false;
	}
	
	public function readNet( msg : Message, from : Int )
	{
		if( from == 0 ) readNetFromSvr(msg);
		else readNetFromCli(msg);
	}
	
	public function readNetFromCli( msg : Message ) : Void
	{
	}
	
	public function readNetFromSvr( msg : Message ) : Void
	{
	}
}

class BaseObject extends NetObject
{
	public var id : UInt;
	
	public var time : Float;
	
	public var x : Float; public var y : Float;	
	public var xdir : Float; public var ydir : Float;
	
	public var checkLast : Bool;
	public var lastX : Float; public var lastY : Float;
	public var lastdirX : Float; public var lastdirY : Float;
	
	public function new()
	{
		time = 0;
		
		checkLast = false;
		
		lastX = lastY = 0;
		x = y = 0;
		
		xdir = 0; ydir = 0;
		lastdirX = 0; lastdirY = 0;
	}
	
	public function objType() : GObjType
	{
		return null;
	}
	
	public function newState() : TGameEvent
	{
		trace("???");
		return null;
	}
	
	public function state() : TGameEvent
	{
		trace("???");
		return null;
	}
	
	public function delState() : TGameEvent
	{
		return t_delObj(
			objType(),
			id
		);
		return null;
	}
}

class Wall extends BaseObject
{
	static var ids : UInt = 0;
	
	public var x1 : Float; public var y1 : Float;
	public var x2 : Float; public var y2 : Float;
	
	public var dist : Float;
	
	
	public function new()
	{
		super();
		
		id = ids++;
		
		x1 = y1 = 0;
		x2 = y2 = 0;
		dist = 0;
	}
	
	public function getLength()
	{
		return TMath.pointDistance( x1, y1, x2, y2 );
	}
	
	override public function objType() : GObjType
	{
		return obj_wall;
	}
	
	override public function newState() : TGameEvent
	{
		return t_newWall(
			id, 
			wall_rim, 
			0, 
			x1, y1,
			x2, y2
		);
	}
	
	override public function state() : TGameEvent
	{
		return t_wall(
			id, 
			x1, y1,
			x2, y2
		);
	}
}



