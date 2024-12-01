
import openfl.Assets;

import openfl.display.*;
import openfl.text.*;


class ConsoleOut extends Sprite
{
	private var lines : Array<Array<TextField>>;
	
	public var start : UInt;
	
	public var format : TextFormat;
	
	public function new()
	{
		super();
		
		lines = [];
		
		start = 0;
		
		format = new TextFormat(Assets.getFont("fonts/OxygenMono-Regular.ttf").fontName, 15, 0xbbbbbb, true);
	}
	
	public function print(msg)
	{
		var f = new TextField();
		
		f.text = (new EReg("0x([0-9A-Fa-f]{6}|RESETT)", "gm")).replace(msg,"");
		f.defaultTextFormat = format;
		
		lines.push([f]);
		this.addChild(f);
		
		this.update();
		
		if( ( lines.length - start ) > 3 )
		{
			start += 1;
		}
	}
	
	public function update()
	{
		var y : UInt = start * -16;
		for( l in lines )
		{
			for( f in l )
			{
				f.y = y;
				f.width = stage.stageWidth;
			}
			y += 16;
		}
	}
}
