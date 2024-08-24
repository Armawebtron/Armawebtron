
enum GWallType
{
	wall_rim;
	wall_cycle;
}

enum GObjType
{
	obj_cycle;
	obj_wall;
}

enum TGameEvent
{
	m_pause;
	m_unpause;
	
	// input
	m_turn( id : UInt, dir : Int, key : UInt );
	m_brake( id : UInt, braking : Bool );
	m_away( id : UInt, away : Bool );
	
	m_chat( id : UInt, message : String );
	m_cmd( id : UInt, command : String );
	
	m_getSetting( setting : String );
	
	
	// output
	t_con( recv : UInt, msg : String );
	t_cen( recv : UInt, msg : String, timeout : Float, speed : Float );
	
	t_player(
		id: UInt,
		exists: Bool,
		name: String,
		isAI: Bool,
		cycleColor: UInt, wallColor: UInt,
		score: Int, ping: Int,
		team: UInt
	);
	
	t_newCycle(
		id: UInt, owner: UInt,
		x: Float, y: Float,
		xdir: Float, ydir: Float
	);
	t_cycle(
		id: UInt, alive: Bool,
		x: Float, y: Float, 
		xdir: Float, ydir: Float,
		speed: Float, rubber: Float
	);
	
	t_newWall(
		id: UInt,
		type: GWallType, owner: UInt,
		x1: Float, y1: Float,
		x2: Float, y2: Float
	);
	
	t_wall(
		id: UInt,
		x1: Float, y1: Float,
		x2: Float, y2: Float
	);
	
	t_delObj(
		type: GObjType,
		id: UInt
	);
	
	
	
	s_serverInfo( id : UInt, host : String, port : Int, name : String, players : Int, max: Int );
	s_players( id : UInt, players : Array<String>, gid : Array<String> );
}