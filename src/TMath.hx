class TMath
{
// BEGIN based on code from http://geomalgorithms.com/a07-_distance.html
// Copyright 2001 softSurfer, 2012 Dan Sunday
// This code may be freely used, distributed and modified for any purpose
// providing that this copyright notice is included with it.
// SoftSurfer makes no warranty for this code, and cannot be held
// liable for any real or imagined damage resulting from its use.
// Users of this code must verify correctness for their application.
	public static function distanceOfLines(
		x1:Float, y1:Float, 
		x2:Float, y2:Float, 
		x3:Float, y3:Float, 
		x4:Float, y4:Float
	):Float
	{
		var SMALL_NUM:Float = 0.00000001; // anything that avoids division overflow
		var ux = x2 - x1, uy = y2 - y1;
		var vx = x4 - x3, vy = y4 - y3;
		var wx = x1 - x3, wy = y1 - y3;
		var a = (ux * ux) + (uy * uy), b = (ux * vx) + (uy * vy), c = (vx * vx) + (vy * vy), d = (ux * wx) + (uy * wy), e = (vx * wx) + (vy * wy);
		var D = a * c - b * b;
		var sc : Float, sN : Float, sD = D;
		var tc : Float, tN : Float, tD = D;
		
		if (D < SMALL_NUM) { // lines almost parallel
			sN = 0; // force point p0 on segment s1
			sD = 1; // prevent possible division by zero
			tN = e;
			tD = c;
		} else { // get closest points on the infinite lines
			sN = (b * e - c * d);
			tN = (a * e - b * d);
			
			if (sN < 0) {
				sN = 0;
				tN = e;
				tD = c;
			} else if (sN > sD) {
				sN = sD;
				tN = e + b;
				tD = c;
			}
		}
		
		if (tN < 0) {
			tN = 0;
			
			if (d > 0) {
				sN = 0;
			} else if (d < a) {
				sN = sD;
			} else {
				sN = -d;
				sD = a;
			}
		} else if (tN > tD) {
			tN = tD;
			
			if ((b - d) < 0) {
				sN = 0;
			} else if ((b - d) > a) {
				sN = sD;
			} else {
				sN = b - d;
				sD = a;
			}
		}
		
		var sc = (Math.abs(sN) < SMALL_NUM ? 0.0 : sN / sD);
		var tc = (Math.abs(tN) < SMALL_NUM ? 0.0 : tN / tD);
		var dPx = wx + (ux * sc) - (vx * tc);
		var dPy = wy + (uy * sc) - (vy * tc);
		
		return Math.sqrt(dPx * dPx + dPy * dPy);
	}
// END

	public static function lineIntersect(
		p0_x:Float, p0_y:Float,
		p1_x:Float, p1_y:Float,
		p2_x:Float, p2_y:Float,
		p3_x:Float, p3_y:Float
	):Bool
	{
		var s1_x = p1_x - p0_x, s1_y = p1_y - p0_y, s2_x = p3_x - p2_x, s2_y = p3_y - p2_y;
		var d = ( s1_x * s2_y - s2_x * s1_y );
		var s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / d;
		if( s < 0 || s > 1 ) return false;
		var t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / d;
		return ( t >= 0 && t <= 1 );
	}
	public static function lineIntersectRange(
		p0_x:Float, p0_y:Float,
		s1_x:Float, s1_y:Float,
		p2_x:Float, p2_y:Float,
		p3_x:Float, p3_y:Float
	):Bool
	{
		var s2_x = p3_x - p2_x, s2_y = p3_y - p2_y;
		var d = ( s1_x * s2_y - s2_x * s1_y );
		var s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / d;
		if( s < 0 || s > 1 ) return false;
		var t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / d;
		return ( t >= 0 && t <= 1 );
	}

	public static function pointDistance(
		x1:Float, y1:Float,
		x2:Float, y2:Float
	):Float {
		var xs = x2 - x1, ys = y2 - y1;
		return Math.sqrt(xs * xs + ys * ys);
	}
}
