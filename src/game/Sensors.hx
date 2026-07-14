
package game;


import GameCore;
import TMath;

import game.Object;
import game.Game;
import game.Player;

class Sensors
{
	public static var _game : Game;
	public var game : Game;
	
	public var f : Float;
	public var l : Float;
	public var r : Float;
	
	public var lWall : Wall;
	public var rWall : Wall;
	
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
		var cycle : Cycle = null;
		try { cycle = cast(c,Cycle); } catch(e) {}
		
		var t = Math.atan2(c.ydir, c.xdir) + ( Math.PI / 2 );
		var lxdir = Math.cos(t), lydir = Math.sin(t);
		
		
		var collision = false;
		
		f = l = r = range;
		
		for( wall in game.walls )
		{
			if( cycle != null && ( cycle.walls[cycle.walls.length-1] == wall || cycle.walls[cycle.walls.length-2] == wall ) ) continue;
			
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
						c.x, c.y,
						c.x, c.y,
						wall.x1, wall.y1,
						wall.x2, wall.y2
					);
					
					if( cycle != null )
					{
						dist -= cycle.minDist.f;
						if( dist < 0 ) dist = 0;
					}
					
					c.x -= (c.lastdirX*dist);
					c.y -= (c.lastdirY*dist);
					
					//if( i != k || c.currWall != j+1 )
					//	c.collision = 1;
					
					if( TMath.lineIntersect(
						c.lastX, c.lastY,
						c.x, c.y,
						wall.x1, wall.y1,
						wall.x2, wall.y2
					) )
					{
						//c.x = c.lastX;
						//c.y = c.lastY;
						
						dist = TMath.distanceOfLines(
							c.lastX, c.lastY,
							c.x, c.y,
							wall.x1, wall.y1,
							wall.x2, wall.y2
						);
						if( cycle != null )
						{
							dist -= cycle.minDist.f;
							if( dist < 0 ) dist = 0;
						}
						
						c.x = c.lastX+
							(c.lastdirX*dist);
						c.y = c.lastY+
							(c.lastdirY*dist);
						
						
						if( cycle != null && TMath.lineIntersect(
						c.lastX, c.lastY,
						c.x, c.y,
						wall.x1, wall.y1,
						wall.x2, wall.y2
						) )
						{
							cycle.alive = false;
						}
					}
					
					collision = true;
					
					// hmm, arguably we should try all cycles / walls again
					//i = MAX_CYCLES;
					//break;
					return this.measure(c, range);
					
					// but that doesn't actually seem to help much
				}
			}
			
			if( TMath.lineIntersectRange(
				c.x, c.y,
				c.xdir * range, c.ydir * range,
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
				
				if( ff < 0.01 )
				{
					collision = true;
				}
				
				if( this.f > ff )
					this.f = ff;
			}
			
			if( TMath.lineIntersectRange(
				c.x, c.y,
				lxdir * range, lydir * range,
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
					lWall = wall;
				}
			}
			
			if( TMath.lineIntersectRange(
				c.x, c.y,
				lxdir * range, lydir * range,
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
					rWall = wall;
				}
			}
		}
		
		return collision;
	}
}
