
import feathers.skins.*;

import openfl.display.*;
import feathers.controls.*;
import feathers.controls.navigators.*;
import thirdparty.controls.*;
import controls.*;

class HUD extends Sprite
{
	var rubberBar : HProgressBar;
	var rubberSkin : RectangleSkin;
	
	public function new()
	{
		super();
		
		rubberBar = new HProgressBar();
		rubberBar.minimum = 0.0;
		rubberBar.maximum = 5.0;
		rubberBar.value = 0.0;
		addChild(rubberBar);
		
		rubberBar.x = 20; rubberBar.y = 580;
		rubberBar.width = 150;
		rubberBar.height = 8;
		
		var skin = new RectangleSkin();
		skin.fill = SolidColor(0x222222);
		rubberBar.backgroundSkin = skin;
		
		rubberSkin = new RectangleSkin();
		rubberSkin.fill = SolidColor(0xcccccc);
		rubberBar.fillSkin = rubberSkin;
	}
	
	public function setMeters(
		rubber : Float,
		speed : Float,
		brake : Float,
		braking : Bool
	)
	{
		rubberBar.value = Math.min( rubberBar.maximum, rubber );
		
		var color : UInt = (
			( Std.int( 0xff0000 * (     ( rubberBar.value / rubberBar.maximum ) ) ) & 0xff0000 ) +
			( Std.int( 0x00ff00 * ( 1 - ( rubberBar.value / rubberBar.maximum ) ) ) & 0x00ff00 )
		);
		
		rubberSkin.fill = SolidColor(color);
	}
	
	public function setMax( rubber : Float, speed : Float )
	{
		rubberBar.maximum = rubber;
	}
	
	public function onresize()
	{
		var w = stage.stageWidth;
		var h = stage.stageHeight;
		
		rubberBar.y = h - 20;
	}
}

