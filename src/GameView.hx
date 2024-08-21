
import openfl.Lib;

import openfl.display.Sprite;

import away3d.core.*;

import openfl.events.*;
import away3d.events.*;

import away3d.containers.View3D;
import openfl.geom.Vector3D;

import openfl.utils.*;
import away3d.utils.*;
import away3d.entities.*;

import away3d.core.math.*;

import away3d.loaders.*;
import away3d.loaders.misc.*;
import away3d.loaders.parsers.*;

import away3d.materials.*;
import away3d.primitives.*;
import away3d.textures.*;

import away3d.containers.*;

import away3d.library.*;

import openfl.Assets;
import away3d.library.assets.*;


import openfl.text.TextField;
import openfl.text.TextFormat;
import openfl.text.TextFormatAlign;


import GameCore;


class CycleView extends ObjectContainer3D
{
	private var texture : TextureMaterial;
	
	public function init()
	{
		//static var loaded : Bool = false;
		//static 
		var model : ByteArray;
		
		//if( !loaded )
		{
			//model = Assets.getBytes("models/arma/untitled.obj");
			model = Assets.getBytes("models/arma/cycle.obj");
			//loaded = true;
		}
		
		Asset3DLibrary.enableParser(OBJParser);
		Asset3DLibrary.addEventListener(Asset3DEvent.ASSET_COMPLETE, this.onLoad);
		Asset3DLibrary.loadData(model);
	}
	
	public function onLoad( event : Asset3DEvent )
	{
		var asset : IAsset = event.asset;
		
		trace("onload");
		switch(asset.assetType)
		{
			case Asset3DType.MESH:
			{
				var mesh : Mesh = cast(asset, Mesh);
				this.addChild(mesh);
				//mesh.x = -255;
				//mesh.y = -50;
			}
		}
	}
	
	public function new()
	{
		super();
		
		
		this.init();
		
		
	}
}


class GameView extends Sprite
{
	private var view : View3D;
	
	private var gridImg : BitmapTexture;
	private var gridMat : TextureMaterial;
	private var gridGeo : PlaneGeometry;
	private var grid    : Mesh;
	
	private var lastTime : UInt;
	
	//private var cycle : CycleView;
	
	var cycles : Map<UInt,CycleView>;
	
	var heading : Float;
	
	
	var centerMsg : String; var centerMsgTime : Float;
	var cenSpd : Float;
	var cenSpr : TextField;
	
	public function new()
	{
		super();
		
		cycles = [];
		
		initScene();
	}
	
	//public function recvGame( events : Array<Array<Dynamic>> )
	public function recvGame( events : Array<TGameEvent> )
	{
		for( e in events )
		{
			//var s : String = e[0];
			//switch( s )
			switch( e )
			{
				case t_con(recv, msg):
				{
					
				}
				case t_cen(recv, msg, timeout, speed):
				{
					if( recv == 0 )
					{
						cenSpr.alpha = 1;
						cenSpr.text = msg;
						cenSpd = speed;
					}
				}
				
				case t_newCycle(id, x, y, xdir, ydir):
				{
					var cycle = new CycleView();
					cycle.rotationX = 90;
					view.scene.addChild(cycle);
					
					cycles[id] = cycle;
					
					cycle.x = x;
					cycle.z = y;
					cycle.rotationY = ( ( Math.atan2(ydir, xdir) * MathConsts.RADIANS_TO_DEGREES ) ) - 90;
				}
				
				case t_cycle(id, alive, x, y, xdir, ydir, speed, rubber):
				{
					var cycle = cycles[id];
					
					//trace(e);
					
					var newDir = ( Math.atan2(ydir, xdir) * MathConsts.RADIANS_TO_DEGREES ) - 90;
					
					cycle.x = x;
					cycle.z = y;
					if( cycle.rotationY != newDir )
					{
						cycle.rotationY = newDir;
					}
				}
				
				
				
				default:
			}
		}
	}
	
	public function initScene()
	{
		this.view = new View3D();
		this.addChild(view);
		
		this.addChild(new away3d.debug.AwayFPS(view, 700, 10, 0xffffff, 1));
		
		
		view.camera.x = 20;
		view.camera.z = 5;
		view.camera.y = 10;
		//view.camera.lookAt(new Vector3D(0, -500, 2000));
		//view.camera.lookAt(new Vector3D(250, 50, 0));
		view.camera.lookAt(new Vector3D(0, 0, 0));
		
		heading = 0;
		
		view.camera.lens.near = 0.01;
		
		this.gridImg = new BitmapTexture(Assets.getBitmapData("assets/floor.png"), true);
		
		this.gridMat = new TextureMaterial(this.gridImg);
		this.gridMat.repeat = true;
		this.gridMat.mipmap = true;
		this.gridMat.anisotropy = Anisotropy.ANISOTROPIC16X;
		
		this.gridGeo = new PlaneGeometry(10000, 10000);
		this.gridGeo.scaleUV(10000, 10000);
		
		this.grid = new Mesh( gridGeo, gridMat );
		view.scene.addChild(grid);
		
		/*
		cycle = new CycleView();
		view.scene.addChild(cycle);
		cycle.x = 1;
		cycle.z = 1;
		cycle.y = 1;
		cycle.rotationX = 90;
		*/
		
		var titleFormat:TextFormat = new TextFormat(Assets.getFont("fonts/OxygenMono-Regular.ttf").fontName, 40, 0xbbbbbb, true);
		titleFormat.align = TextFormatAlign.CENTER;
		
		cenSpr = new TextField();
		addChild(cenSpr);
		
		cenSpr.width = 800;
		cenSpr.y = 420;
		cenSpr.defaultTextFormat = titleFormat;
		//cenSpr.selectable = false;
		
		cenSpr.alpha = 0;
		
		centerMsgTime = 0; cenSpd = 0;
		
		
		this.lastTime = Lib.getTimer();
	}
	
	public function render()
	{
		var time = Lib.getTimer();
		
		var delta = time - this.lastTime;
		var timestep : Float = delta / 1000.0;
		
		
		//cycle.rotationX += timestep * 4;
		//cycle.rotationY += timestep * 32;
		
		var cycle = cycles[0];
		if( cycle != null )
		{
			//view.camera.x = cycle.x-20;
			//view.camera.z = cycle.z-5;
			
			var cdir : Float = MathConsts.DEGREES_TO_RADIANS * ( cycle.rotationY + 90 );
			cdir = Math.atan2( Math.sin(cdir), Math.cos(cdir) );
			
			var test = cdir - heading;
			while( test < -Math.PI ) test += Math.PI+Math.PI;
			while( test >  Math.PI ) test -= Math.PI+Math.PI;
			
			heading += test * 4 * timestep;
			
			view.camera.x = cycle.x - ( Math.cos(heading) * 3 );
			view.camera.z = cycle.y - ( Math.sin(heading) * 3 );
			view.camera.y = 15;
			
			view.camera.lookAt(new Vector3D(
				cycle.x+(Math.cos(heading)*20), 0, 
				cycle.z+(Math.sin(heading)*20)
			));
		}
		
		centerMsgTime -= timestep;
		if( cenSpr.alpha > 0 && ( centerMsgTime - cenSpd ) < 0 )
		{
			//cenSpr.alpha = ( cenSpd - centerMsgTime );
			cenSpr.alpha -= timestep * cenSpd;
			
			if( cenSpr.alpha <= 0 )
			{
				cenSpr.alpha = 0;
				cenSpr.text = "";
			}
		}
		
		
		this.lastTime = time;
		
		view.render();
	}
}
