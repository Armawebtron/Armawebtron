
import feathers.skins.*;

import openfl.display.*;
import feathers.controls.supportClasses.*;
import feathers.controls.*;
import feathers.controls.navigators.*;
import thirdparty.controls.*;
import controls.*;


enum HUDFrom
{
	fromTopLeft;
	fromTopRight;
	fromTopCenter;
	fromBtmLeft;
	fromBtmRight;
	fromBtmCenter;
	fromCenter;
}

enum HUDUnits
{
	pixels( x : Int, y : Int );
	percentage( x : Float, y : Float );
}

abstract class HUDElement
{
	public var pos : HUDUnits;
	public var posFrom : HUDFrom;
	
	public var size : HUDUnits;
	
	public var bgSkin : BaseGraphicsPathSkin;
	public var fgSkin : BaseGraphicsPathSkin;
	
	public function new( p : HUDUnits, f : HUDFrom, s : HUDUnits )
	{
		pos = p;
		posFrom = f;
		size = s;
	}
	
	abstract public function setValue( val : Float ) : Void;
	
	abstract public function setMinimum( val : Float ) : Void;
	
	abstract public function setMaximum( val : Float ) : Void;
	
	abstract public function onresize( w : Int, h : Int ) : Void;
	
	function resizeCore( w : Int, h : Int ) : Array<Float>
	{
		var ew : Float = 0, eh : Float = 0;
		switch( size )
		{
			case pixels(x, y): ew = x; eh = y;
			case percentage(x, y): ew = x*w; eh = y*h;
		}
		
		var pX : Int = 0, pY : Int = 0;
		switch( pos )
		{
			case pixels(x, y): pX = x; pY = y;
			case percentage(x, y): pX = Std.int(x * w); pY = Std.int(y * h);
		}
		
		var ex : Float = 0, ey : Float = 0;
		
		var cenX = ew/2;
		var cenY = eh/2;
		
		switch( posFrom )
		{
			case fromTopLeft:     ex = pX; ey = pY;
			case fromTopRight:    ex = w - pX; ey = pY - eh;
			case fromTopCenter:   ex = (w/2)+pX-cenX; ey = pY;
			case fromBtmLeft:     ex = pX; ey = h - pY - eh;
			case fromBtmRight:    ex = w - pX - ew; ey = h - pY - eh;
			case fromBtmCenter:   ex = (w/2)+pX-cenX; ey = h - pY - eh;
			case fromCenter:      ex = (w/2)+pX-cenX; ey = (h/2)+pY-cenY;
		}
		
		return [ew, eh, ex, ey];
	}
}

class BarGauge extends HUDElement
{
	public var e : BaseProgressBar;
	
	public function new( t : Sprite, p : HUDUnits, f : HUDFrom, s : HUDUnits )
	{
		bgSkin = new RectangleSkin();
		fgSkin = new RectangleSkin();
		
		bgSkin.fill = SolidColor(0x222222);
		bgSkin.alpha = 0.7;
		fgSkin.fill = SolidColor(0xcccccc);
		
		e = new HProgressBar();
		
		e.backgroundSkin = bgSkin;
		e.fillSkin = fgSkin;
		
		super( p, f, s );
		
		if( t != null ) t.addChild( this.e );
	}
	
	public function setValue( val : Float )
	{
		e.value = val;
		
		if( val > e.maximum ) val = e.maximum;
		
		var color : UInt = (
			( Std.int( 0xff0000 * (     ( val / e.maximum ) ) ) & 0xff0000 ) +
			( Std.int( 0x00ff00 * ( 1 - ( val / e.maximum ) ) ) & 0x00ff00 )
		);
		
		fgSkin.fill = SolidColor(color);
	}
	
	public inline function setMinimum( val : Float )
	{
		e.minimum = val;
	}
	
	public inline function setMaximum( val : Float )
	{
		e.maximum = val;
	}
	
	public function onresize( w : Int, h : Int )
	{
		var r = resizeCore( w, h );
		e.width = r[0]; e.height = r[1];
		e.x = r[2]; e.y = r[3];
	}
	
}

class NeedleGauge extends HUDElement
{
	public var e : Shape;
	var width : Float; var height : Float;
	
	var value : Float;
	var min : Float;
	var max : Float;
	
	public function new( t : Sprite, p : HUDUnits, f : HUDFrom, s : HUDUnits )
	{
		e = new Shape();
		
		min = 0;
		max = 1;
		value = 0;
		
		super( p, f, s );
		
		if( t != null ) t.addChild( this.e );
	}
	
	function draw()
	{
		var p : Float = value / max;
		var l : Float = 4.712389 - p * Math.PI;
		var c : Float = 73 - Math.round( p * 10 );
		
		e.graphics.clear();
		
		e.graphics.lineStyle( 1.5, 0x8888ff );
		
		var startX = width/2;
		var lineLen = height;
		
		
		e.graphics.moveTo(startX, height);
		e.graphics.lineTo(startX+(Math.sin(l)*lineLen), height+(Math.cos(l)*lineLen) );
	}
	
	public function setValue( val : Float )
	{
		value = val;
		
		if( val > max ) val = max;
		
		draw();
	}
	
	public inline function setMinimum( val : Float )
	{
		min = val;
	}
	
	public inline function setMaximum( val : Float )
	{
		max = val;
	}
	
	public function onresize( w : Int, h : Int )
	{
		var r = resizeCore( w, h );
		width = r[0]; height = r[1];
		e.x = r[2]; e.y = r[3];
		
		draw();
	}
}


class HUD extends Sprite
{
	var rubber : Array<HUDElement>;
	var speed  : Array<HUDElement>;
	var brake  : Array<HUDElement>;
	
	var lastRubber : Float;
	var lastSpeed : Float;
	var lastBrake : Float;
	
	public function new()
	{
		super();
		
		
		rubber = [];
		speed = [];
		brake = [];
		
		lastBrake = 0;
		lastSpeed = 0;
		lastRubber = 0;
		
		
		init();
		
	}
	
	public function init()
	{
		var b = new BarGauge( this, pixels( 0, 12 ), fromBtmCenter, percentage( 0.5, 4/300 ) );
		rubber.push( b );
		
		var b = new NeedleGauge( this, pixels( Std.int(96/2)+4, 12 ), fromBtmRight, pixels( 96, 96 ) );
		brake.push( b );
		
		setMax( 5, 100 );
	}
	
	public function setMeters(
		pRubber : Float,
		pSpeed : Float,
		pBrake : Float,
		pBraking : Bool
	)
	{
		if( lastRubber != pRubber )
		{
			for( e in this.rubber ) { e.setValue( pRubber ); }
			lastRubber = pRubber;
		}
		if( lastSpeed != pSpeed )
		{
			for( e in this.speed  ) { e.setValue( pSpeed ); }
			lastSpeed = pSpeed;
		}
		if( lastBrake != pBrake )
		{
			for( e in this.brake  ) { e.setValue( pBrake ); }
			lastBrake = pBrake;
		}
	}
	
	public function setMax( pRubber : Float, pSpeed : Float )
	{
		for( e in this.rubber ) { e.setMaximum( pRubber ); }
		for( e in this.speed  ) { e.setMaximum( pSpeed ); }
	}
	
	public function onresize()
	{
		var w = stage.stageWidth;
		var h = stage.stageHeight;
		
		for( e in rubber ) { e.onresize( w, h ); }
		for( e in speed  ) { e.onresize( w, h ); }
		for( e in brake  ) { e.onresize( w, h ); }
	}
}

