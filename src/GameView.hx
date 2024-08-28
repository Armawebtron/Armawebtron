
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

import away3d.filters.*;

import away3d.containers.*;

import away3d.library.*;

import openfl.Assets;
import away3d.library.assets.*;


import openfl.text.TextField;
import openfl.text.TextFormat;
import openfl.text.TextFormatAlign;


import GameCore;
import TMath;

import HUD;
import UserConfig;
import Camera;


class VPlayer
{
	public var isAI : Bool;
	public var name : String;
	
	public var cycle : CycleView;
	
	public var spectating : Bool;
	
	public function new()
	{
		name = "";
		isAI = false;
		cycle = null;
		spectating = false;
	}
}

class CycleView extends ObjectContainer3D
{
	private var texture : TextureMaterial;
	private static var model : ByteArray = null;
	private static var test : Bool = false;
	
	public var isAlive : Bool;
	public var speed : Float;
	public var rubber : Float;
	
	public var lastTime : Float;
	public var stopped : Bool;
	
	public function init()
	{
		if( model == null )
		{
			//model = Assets.getBytes("models/arma/untitled.obj");
			model = Assets.getBytes("models/arma/cycle.obj");
			//loaded = true;
		}
		
		Asset3DLibrary.enableParser(OBJParser);
		Asset3DLibrary.addEventListener(Asset3DEvent.ASSET_COMPLETE, this.onLoad);
		if( !test )
		{
			Asset3DLibrary.loadData(model);
			test = true;
		}
	}
	
	public function onLoad( event : Asset3DEvent )
	{
		var asset : IAsset = event.asset;
		
		//trace("onload");
		switch(asset.assetType)
		{
			case Asset3DType.MESH:
			{
				var mesh : Mesh = cast(asset, Mesh);
				this.addChild(mesh.clone());
				//mesh.x = -255;
				//mesh.y = -50;
			}
		}
		
		test = false;
	}
	
	public function new()
	{
		super();
		
		
		this.init();
		
		
		this.isAlive = true;
		this.speed = 0;
		this.rubber = 0;
		this.stopped = true;
	}
}

class WallView extends Mesh
{
	private var geo : PlaneGeometry;
	
	public var x1 : Float; public var y1 : Float;
	public var x2 : Float; public var y2 : Float;
	
	public var sX : Float; public var sY : Float;
	
	public function new()
	{
		geo = new PlaneGeometry(1, 1);
		geo.scaleUV(1, 1);
		geo.doubleSided = true;
		
		var color = new ColorMaterial();
		
		super( geo, color );
		
		sX = 1; sY = 1;
		
		this.rotationX = 90;
		this.setHeight(1);
	}
	
	public function set( ix1 : Float = null, iy1 : Float = null, ix2 : Float = null, iy2 : Float = null )
	{
		if( ix1 != null ) { x1 = ix1; } if( iy1 != null ) { y1 = iy1; }
		if( ix2 != null ) { x2 = ix2; } if( iy2 != null ) { y2 = iy2; }
		
		this.rotationY = Math.atan2(y2-y1,x2-x1) * MathConsts.RADIANS_TO_DEGREES;
		this.geo.width = TMath.pointDistance(x1, y1, x2, y2);
		
		this.x = (x2+x1)/2;
		this.z = (y2+y1)/2;
		
		updateUV();
	}
	
	public function updateUV()
	{
		this.geo.scaleUV(this.geo.width/sX, this.geo.height/sY);
	}
	
	public function setHeight( iHeight : Float = null )
	{
		if( iHeight != null ) this.geo.height = iHeight;
		this.y = this.geo.height/2;
		
		updateUV();
	}
}


class GameView extends Sprite
{
	static var maxGridDist : Float = 100;
	
	private var view : View3D;
	private var views : Array<View3D>;
	
	private var lookAt : Vector3D;
	
	private var user : UserConfig;
	
	private var gridImg : BitmapTexture;
	private var gridMat : TextureMaterial;
	private var gridGeo : PlaneGeometry;
	private var grid    : Mesh;
	
	private var lastTime : UInt;
	
	public static var splitScreen : UInt = 0;
	
	//private var cycle : CycleView;
	
	var players: Map<UInt,VPlayer>;
	var cycles : Map<UInt,CycleView>;
	var walls  : Map<UInt,WallView>;
	
	var heading : Float;
	var smoothSpeed : Float;
	
	
	var centerMsg : String; var centerMsgTime : Float;
	var cenSpd : Float;
	var cenSpr : TextField;
	
	var fpsDisp : away3d.debug.AwayFPS;
	
	var hud : HUD;
	
	public function new( u : UserConfig )
	{
		super();
		
		players = [];
		cycles = [];
		walls = [];
		
		user = u;
		
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
				
				case t_newCycle(id, owner, x, y, xdir, ydir):
				{
					var cycle = new CycleView();
					cycle.rotationX = 90;
					view.scene.addChild(cycle);
					
					cycles[id] = cycle;
					
					cycle.x = x;
					cycle.z = y;
					cycle.rotationY = ( ( Math.atan2(-ydir, xdir) * MathConsts.RADIANS_TO_DEGREES ) ) + 90;
					
					// TEMPORARY HACK
					if( players[0] == null || players[0].cycle == null )
					{
						if( players[0] == null )
						{
							players[0] = new VPlayer();
						}
						players[0].cycle = cycle;
					}
					cycle.lastTime = Lib.getTimer();
				}
				
				case t_cycle(id, alive, x, y, xdir, ydir, stopped, speed, rubber):
				{
					var cycle = cycles[id];
					
					//trace(e);
					
					var newDir = ( Math.atan2(-ydir, xdir) * MathConsts.RADIANS_TO_DEGREES ) + 90;
					
					cycle.x = x;
					cycle.z = y;
					if( cycle.rotationY != newDir )
					{
						cycle.rotationY = newDir;
					}
					
					if( cycle.isAlive != alive )
					{
						if( !alive )
						{
							view.scene.removeChild(cycle);
							cycle.isAlive = false;
						}
					}
					cycle.lastTime = Lib.getTimer();
					cycle.speed = speed;
					cycle.rubber = rubber;
					cycle.stopped = stopped;
				}
				
				case t_newWall(id, type, owner, x1, y1, x2, y2):
				{
					var wall = new WallView();
					wall.set(x1, y1, x2, y2);
					
					switch(type)
					{
						case wall_rim:
						{
							wall.setHeight(4);
							/*
							cast(wall.material,ColorMaterial).color = 0xaaaaaa;
							*/
							
							//var img = new BitmapTexture(Assets.getBitmapData("assets/rim_wall_arma2.png"), true);
							var img = new BitmapTexture(Assets.getBitmapData("assets/rim_wall_test.png"), true);
							wall.material = new TextureMaterial(img);
							wall.material.repeat = true;
							wall.material.mipmap = true;
							
							//wall.sX = 100; wall.sY = -50;
							wall.sX = 50; wall.sY = -25;
							//wall.sX = 384; wall.sY = -32;
							
							//cast(wall.material,ColorMaterial).color = 0xBDCEFA;
						}
						case wall_cycle:
						{
							/*var img = new BitmapTexture(Assets.getBitmapData("assets/cycle_trail_0.png"), true);
							wall.material = new TextureMaterial(img);
							wall.material.repeat = true;
							wall.material.mipmap = true;
							cast(wall.material,TextureMaterial).alpha = 0.99;
							wall.sY = -0.74;
							*/
							cast(wall.material,ColorMaterial).color = 0xaaaaaa;
							cast(wall.material,ColorMaterial).alpha = 0.8;
							
							wall.setHeight(0.75);
						}
					}
					
					walls[id] = wall;
					view.scene.addChild(wall);
					wall.updateUV();
				}
				
				case t_wall(id, x1, y1, x2, y2):
				{
					var wall = walls[id];
					wall.set(x1, y1, x2, y2);
				}
				
				case t_delObj(type, id):
				{
					switch(type)
					{
						case obj_cycle:
						{
							var cycle = cycles[id];
							if( cycle.isAlive )
							{
								view.scene.removeChild(cycle);
							}
							
							// TEMPORARY HACK
							if( players[0].cycle == cycle )
							{
								players[0].cycle = null;
							}
						}
						
						case obj_wall:
						{
							var wall = walls[id];
							view.scene.removeChild(wall);
						}
					}
				}
				
				
				default:
			}
		}
	}
	
	public var doBlur : Bool;
	private var blurLevel : Float;
	
	public function initScene()
	{
		this.view = new View3D();
		this.addChild(view);
		
		this.views = [];
		this.views.push(view);
		
		if( splitScreen != 0 )
		{
			var v = new View3D(view.scene);
			this.views.push(v);
			this.addChild(v);
		}
		
		this.addChild(fpsDisp=(new away3d.debug.AwayFPS(view, 700, 10, 0xffffff, 1)));
		
		
		view.camera.x = 20;
		view.camera.z = 5;
		view.camera.y = 10;
		//view.camera.lookAt(new Vector3D(0, -500, 2000));
		//view.camera.lookAt(new Vector3D(250, 50, 0));
		view.camera.lookAt(new Vector3D(0, 0, 0));
		
		heading = 0;
		smoothSpeed = 20;
		
		view.camera.lens.near = 0.01;
		
		this.gridImg = new BitmapTexture(Assets.getBitmapData("assets/floor.png"), true);
		
		this.gridMat = new TextureMaterial(this.gridImg);
		this.gridMat.repeat = true;
		this.gridMat.mipmap = true;
		if( user.global.anisotropy >= 12 )
			gridMat.anisotropy = Anisotropy.ANISOTROPIC16X;
		else if( user.global.anisotropy >= 6 )
			gridMat.anisotropy = Anisotropy.ANISOTROPIC8X;
		else if( user.global.anisotropy >= 3 )
			gridMat.anisotropy = Anisotropy.ANISOTROPIC4X;
		else if( user.global.anisotropy >= 2 )
			gridMat.anisotropy = Anisotropy.ANISOTROPIC2X;
		else if( user.global.anisotropy >= 0 )
			gridMat.anisotropy = Anisotropy.NONE;
		
		this.gridGeo = new PlaneGeometry(1500, 1500);
		this.gridGeo.scaleUV(1500, 1500);
		
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
		
		doBlur = false;
		blurLevel = 0;
		
		hud = new HUD();
		addChild( hud );
		hud.alpha = 0;
		
		
		this.lastTime = Lib.getTimer();
	}
	
	var blurFilter : BlurFilter3D;
	
	public function render()
	{
		if( splitScreen != 0 )
		{
			for( i=>v in views )
			{
				view = v;
				this.renderView(i);
			}
		}
		else this.renderView(0);
	}
	
	public function renderView( id : Int )
	{
		var time = Lib.getTimer();
		
		var delta = time - this.lastTime;
		var timestep : Float = delta / 1000.0;
		
		
		//cycle.rotationX += timestep * 4;
		//cycle.rotationY += timestep * 32;
		
		var cycle : CycleView = null;
		if( players[id] != null && players[id].cycle != null )
		{
			cycle = players[id].cycle;
		}
		
		var cam : Camera = null;
		if( user.players[id] != null )
		{
			cam = user.players[id].cam;
			
			if(
				( cycle == null || !cycle.isAlive ) && user.players[id].viewTarget >= 0 &&
				players[user.players[id].viewTarget] != null && players[user.players[id].viewTarget].cycle != null
			)
			{
				cycle = players[user.players[id].viewTarget].cycle;
			}
			else user.players[id].viewTarget = -1;
		}
		
		if( cam != null )
		{
			if( cycle != null && cycle.isAlive )
			{
			// get current cycle direction, with evil corrections
			var cdir : Float = MathConsts.DEGREES_TO_RADIANS * ( cycle.rotationY + 90 );
			cdir = Math.atan2( -Math.sin(cdir), Math.cos(cdir) );
			
			// update cycle position if necessary
			if( !cycle.stopped )
			{
				var ts = ( time - cycle.lastTime ) / 1000;
				cycle.x -= ts * cycle.speed * Math.cos(cdir);
				cycle.z -= ts * cycle.speed * Math.sin(cdir);
				cycle.lastTime = time;
			}
			
			cam.run( timestep, cycle, cdir );
			
			// update hud
			hud.setMeters( cycle.rubber, cycle.speed, 0, false );
			hud.alpha += timestep;
			
			if( hud.alpha > 1 ) hud.alpha = 1;
			}
			else
			{
				cam.idle( timestep );
				
				hud.alpha -= timestep;
				if( hud.alpha < 0 ) hud.alpha = 0;
			}
			
			view.camera.x = cam.pos.x;
			view.camera.z = cam.pos.z;
			view.camera.y = cam.pos.y;
			
			view.camera.lookAt(lookAt=cam.lookAt);
		}
		else if( lookAt == null )
		{
			lookAt = new Vector3D();
		}
		
		
		// move grid with camera so it looks infinite
		
		while( lookAt.x > ( grid.x + maxGridDist ) )
		{
			grid.x += maxGridDist;
		}
		while( lookAt.x < ( grid.x - maxGridDist ) )
		{
			grid.x -= maxGridDist;
		}
		
		while( lookAt.z > ( grid.z + maxGridDist ) )
		{
			grid.z += maxGridDist;
		}
		while( lookAt.z < ( grid.z - maxGridDist ) )
		{
			grid.z -= maxGridDist;
		}
		
		
		// fade out center message
		centerMsgTime -= timestep;
		if( cenSpr.alpha > 0 && ( centerMsgTime - cenSpd ) < 0 )
		{
			//trace( ( cenSpd - centerMsgTime ));
			//cenSpr.alpha = ( cenSpd - centerMsgTime );
			cenSpr.alpha -= timestep * cenSpd;
			
			if( cenSpr.alpha <= 0 )
			{
				cenSpr.alpha = 0;
				cenSpr.text = "";
			}
		}
		
		
		// blur effect
		if( doBlur && blurLevel < 24 )
		{
			blurLevel += timestep*50;
			
			if( blurLevel >= 24 )
			{
				blurLevel = 24;
			}
			
			if( blurFilter == null )
				blurFilter = new BlurFilter3D(Std.int(blurLevel), Std.int(blurLevel))
			else
				blurFilter.blurX = blurFilter.blurY = Std.int(blurLevel);
			
			view.filters3d = [blurFilter];
		}
		else if( !doBlur && blurLevel != 0 )
		{
			blurLevel -= timestep*50;
			
			if( blurLevel <= 0 )
			{
				blurLevel = 0;
				
				view.filters3d = [];
			}
			else
			{
				blurFilter.blurX = blurFilter.blurY = Std.int(blurLevel);
				view.filters3d = [blurFilter];
			}
		}
		
		
		this.lastTime = time;
		
		view.render();
	}
	
	public function onresize()
	{
		if( splitScreen == 0 )
		{
			view.width = stage.stageWidth;
			view.height = stage.stageHeight;
		}
		else
		{
			views[0].width = stage.stageWidth / 2;
			views[0].height = stage.stageHeight;
			
			if( views[1] != null )
			{
				views[1].width = stage.stageWidth / 2;
				views[1].height = stage.stageHeight;
				views[1].x = stage.stageWidth / 2;
			}
		}
		
		fpsDisp.x = stage.stageWidth-100;
		
		cenSpr.width = stage.stageWidth;
		cenSpr.y = stage.stageHeight*0.7;
		
		hud.onresize();
	}
}
