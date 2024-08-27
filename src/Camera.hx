
import openfl.geom.*;

import GameView;

class Camera
{
	public var heading : Float;
	public var smoothSpeed : Float;
	
	public var pos : Vector3D;
	public var lookAt : Vector3D;
	
	public function new()
	{
		heading = 0;
		smoothSpeed = 20;
		
		pos = new Vector3D();
		lookAt = new Vector3D();
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
	}
	
	override public function run( timestep : Float, cycle : CycleView, cdir : Float )
	{
		var test = cdir - heading;
		while( test < -Math.PI ) test += Math.PI+Math.PI;
		while( test >  Math.PI ) test -= Math.PI+Math.PI;
		
		var mult : Float = 1;
		if( test > Math.PI*0.8 || test < -Math.PI*0.8 ) mult = turnSpeed180;
		
		heading += test * turnSpeed * mult * timestep;
		
		// dont bug out camera at really high turn speeds
		var test2 = cdir - heading;
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

