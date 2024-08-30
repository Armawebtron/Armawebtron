
import openfl.geom.*;

import GameView;

class Camera
{
	public var heading : Float;
	public var smoothSpeed : Float;
	
	public var pos : Vector3D;
	public var lookAt : Vector3D;
	
	public var lastTurnDir : Int;
	
	public function new()
	{
		heading = 0;
		smoothSpeed = 20;
		
		lastTurnDir = 0;
		
		pos = new Vector3D();
		lookAt = new Vector3D();
	}
	
	public function idle( timestep : Float )
	{
		heading += timestep*0.2;
		
		var targX = (Math.cos(heading)*-120), 
			targZ = (Math.sin(heading)*-120), 
			targY = 40;
		
		pos.x += (targX - pos.x) * timestep;
		pos.z += (targZ - pos.z) * timestep;
		pos.y += (targY - pos.y) * timestep;
		
		lookAt.x += ((Math.cos(heading)*30) - lookAt.x) * timestep * 0.2;
		lookAt.z += ((Math.sin(heading)*30) - lookAt.z) * timestep * 0.2;
		lookAt.y += (0 - lookAt.y) * timestep;
	}
	
	public function run( timestep : Float, cycle : CycleView, cdir : Float )
	{
		
	}
}

class CustomCamera extends Camera
{
	public var turnSpeed : Float;
	public var turnSpeed180 : Float;
	
	public var rise : Float;
	public var riseFromSpeed : Float;
	
	public var back : Float;
	public var backFromSpeed : Float;
	
	public var pitch : Float;
	public var offset : Float;
	
	public var alreadyRotating : Bool;
	
	public var cdirSmooth : Float;
	
	public function new()
	{
		super();
		
		turnSpeed = 4;
		turnSpeed180 = 4;
		
		rise = 16.5;
		back = 20;
		pitch = -0.67;
		
		riseFromSpeed = 0.4;
		backFromSpeed = 0.5;
		
		alreadyRotating = false;
		
		cdirSmooth = 0;
	}
	
	override public function run( timestep : Float, cycle : CycleView, cdir : Float )
	{
		// first calculate a fast rotation that
		// we'll use later for the slower rotation
		// this is a little silly, but it seems to work well
		
		var diff = ( cdir - cdirSmooth );
		
		while( diff < -Math.PI ) diff += Math.PI+Math.PI;
		while( diff >  Math.PI ) diff -= Math.PI+Math.PI;
		
		var smooth = diff * 100;
		if( smooth > 100 ) smooth = 100;
		if( smooth < -100 ) smooth = -100;
		
		cdirSmooth += smooth * timestep;
		
		diff = ( cdir - cdirSmooth );
		while( diff < -Math.PI ) diff += Math.PI+Math.PI;
		while( diff >  Math.PI ) diff -= Math.PI+Math.PI;
		if( Math.abs(diff) < Math.abs(diff) )
		{
			cdirSmooth = cdir;
		}
		
		
		// now work on the cam rotation
		var test = cdirSmooth - heading;
		
		var mult : Float = 1;
		if( test > Math.PI || test < -Math.PI ) mult = turnSpeed180;
		
		heading += test * turnSpeed * mult * timestep;
		
		// dont bug out camera at really high turn speeds
		var test2 = cdirSmooth - heading;
		while(test2 < -Math.PI) test2 += Math.PI+Math.PI;
		while(test2 >  Math.PI) test2 -= Math.PI+Math.PI;
		if( Math.abs(test) < Math.abs(test2) )
		{
			heading = cdir;
		}
		
		// calculate camera properties
		var adj : Float = ( ( cycle.speed - smoothSpeed ) * timestep );
		smoothSpeed += adj;
		var lrise : Float = rise + ( riseFromSpeed * smoothSpeed );
		var lback : Float = back + ( backFromSpeed * smoothSpeed );
		var loffset : Float = lback * pitch;
		smoothSpeed += adj;
		
		// apply heading
		pos.x = cycle.x + ( Math.cos(heading) * lback );
		pos.z = cycle.z + ( Math.sin(heading) * lback );
		pos.y = cycle.y + lrise;
		
		lookAt.x = cycle.x + ( Math.cos(heading) * loffset );
		lookAt.z = cycle.z + ( Math.sin(heading) * loffset );
		lookAt.y = cycle.y;
	}
}

