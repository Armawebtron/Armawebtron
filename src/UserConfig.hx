
class PlayerConfig
{
	public var name : String;
	public var teamName : String;
	
	public var color : UInt;
	public var colorCycle : UInt;
	
	public var turnLeft : Array<UInt>;
	public var turnRight : Array<UInt>;
	
	public var brake : Array<UInt>;
	public var toggleBrake : Array<UInt>;
	
	public var jump : Array<UInt>;
	
	public var specMode : Bool;
	
	public function new()
	{
		name = "";
		teamName = "";
		
		color = 0xcccccc;
		colorCycle = 0xffffff;
		
		turnLeft = [];
		turnRight = [];
		
		brake = [];
		toggleBrake = [];
		
		jump = [];
		
		specMode = false;
	}
}

class UserConfig
{
	public var players : Array<PlayerConfig>;
	
	public function new()
	{
		players = [];
		
		var p = new PlayerConfig();
		
		p.name = "Mobile 1";
		
		p.turnLeft.push(37);
		p.turnRight.push(39);
		
		players.push(p);
	}
}
