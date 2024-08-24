
package game;


import GameCore;
import TMath;

import game.Object;
import game.Game;

class Sensors
{
	public static var _game : Game;
	public var game : Game;
	
	public var f : Float;
	public var l : Float;
	public var r : Float;
	
	public function new( g : Game = null )
	{
		f = 9999;
		l = 9999;
		r = 9999;
		
		if( g != null )
			game = g
		else
			game = _game;
	}
	
	public function measure(c : BaseObject, range : Float)
	{
		var t = Math.atan2(c.ydir, c.xdir) - ( Math.PI / 2 );
		var lxdir = Math.cos(t), lydir = Math.sin(t);
		
		
		var collision = false;
		
		f = l = r = range;
		
		for( wall in game.walls )
		{
			if( c.checkLast )
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
					collision = true;
				}
				
				if( this.f > ff )
					this.f = ff;
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
				
				if( this.l > ff )
				{
					this.l = ff;
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
				
				if( this.r > ff )
				{
					this.r = ff;
					//type_r[k] = 1 + (i == k);
				}
			}
		}
		
		return collision;
	}
}
