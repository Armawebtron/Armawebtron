
import GameCore;
import game.Game;

class WebWorker
{
	var maint : js.html.DedicatedWorkerGlobalScope;
	var gamet : Game;
	
	var running : Bool;
	
	public static function __init__()
	{
		new WebWorker();
	}
	
	public function new()
	{
		trace("hello");
		
		maint = untyped self;
		
		gamet = new Game();
		maint.onmessage = msgFromMain;
		
		running = false;
	}
	
	public function start()
	{
		trace("START");
		maint.setInterval(this.run, 5);
		running = true;
	}
	
	public function run()
	{
		var t = this.gamet.loop();
		
		if( t.length > 0 )
		{
			maint.postMessage( haxe.Json.stringify( t ) );
		}
	}
	
	function msgFromMain( e : js.html.MessageEvent )
	{
		var m : TGameEvent = haxe.Json.parse( e.data );
		
		if( !running ) this.start();
		gamet.recvMsg( m );
	}
}
