
import openfl.Lib;

import openfl.display.Sprite;

import away3d.containers.View3D;
import openfl.geom.Vector3D;

import away3d.utils.Cast;
import away3d.entities.Mesh;

import away3d.materials.TextureMaterial;
import away3d.primitives.PlaneGeometry;
import away3d.textures.BitmapTexture;
import away3d.textures.Anisotropy;

import away3d.filters.*;

import openfl.Assets;


class GridAnimation extends Sprite
{
	private var view : View3D;
	
	private var gridImg : BitmapTexture;
	private var gridMat : TextureMaterial;
	private var gridGeo : PlaneGeometry;
	private var grid    : Mesh;
	
	private var lastTime : UInt;
	
	
	private var fo : Bool;
	private var blurLevel : Float;
	
	
	public function new()
	{
		super();
		
		fadingOut = false;
		
		initScene();
	}
	
	public function initScene()
	{
		this.view = new View3D();
		this.addChild(view);
		
		view.camera.z = 0;
		view.camera.y = 50;
		view.camera.lookAt(new Vector3D(0, -500, 2000));
		
		
		this.gridImg = new BitmapTexture(Assets.getBitmapData("assets/floor.png"), true);
		
		this.gridMat = new TextureMaterial(this.gridImg);
		this.gridMat.repeat = true;
		this.gridMat.mipmap = true;
		this.gridMat.anisotropy = Anisotropy.ANISOTROPIC16X;
		
		this.gridGeo = new PlaneGeometry(20000, 20000);
		this.gridGeo.scaleUV(600, 600);
		
		this.grid = new Mesh( gridGeo, gridMat );
		view.scene.addChild(grid);
		
		this.lastTime = Lib.getTimer();
		
		this.gridMat.alpha = 0;
		
		fo = true; blurLevel = 0;
	}
	
	private var fadingOut : Bool;
	public function fadeOut()
	{
		fadingOut = true;
	}
	public function fadeIn()
	{
		fadingOut = false;
	}
	
	public function render()
	{
		var time = Lib.getTimer();
		
		var delta = time - this.lastTime;
		var timestep : Float = delta / 1000.0;
		
		view.camera.z += timestep * 25;
		//view.camera.z += timestep * 1000;
		
		if( view.camera.z > 1000 )
		{
			view.camera.z -= 1000;
		}
		
		if( fadingOut )
		{
			this.gridMat.alpha -= timestep*3;
		}
		else if( this.gridMat.alpha != 1 )
		{
			if( this.gridMat.alpha < 1 )
			{
				this.gridMat.alpha += timestep*2;
			}
			else this.gridMat.alpha = 1;
		}
		
		if( fo )
		{
			/*
			blurLevel += timestep*120;
			
			if( blurLevel >= 24 )
			*/
			{
				fo = false;
				blurLevel = 24;
			}
			
			view.filters3d = [new BlurFilter3D(Std.int(blurLevel), Std.int(blurLevel))];
		}
		
		this.lastTime = time;
		
		view.render();
	}
	
	public function onresize()
	{
		view.width = stage.stageWidth;
		view.height = stage.stageHeight;
	}
}
