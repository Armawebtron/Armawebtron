
class PlayerConfig
{
	public var name : String;
	public var teamName : String;
	
	public var turnLeft : Array<UInt>;
	public var turnRight : Array<UInt>;
	
	public function new()
	{
		name = "";
		teamName = "";
		
		turnLeft = [];
		turnRight = [];
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
