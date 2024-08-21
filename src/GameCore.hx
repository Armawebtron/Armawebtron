
enum TGameEvent
{
	// input
	m_turn( id : UInt, dir : Int );
	m_brake( id : UInt, braking : Bool );
	m_away( id : UInt, away : Bool );
	
	m_chat( id : UInt, message : String );
	m_cmd( id : UInt, command : String );
	
	m_getSetting( setting : String );
	
	
	// output
	t_con( recv : UInt, msg : String );
	t_cen( recv : UInt, msg : String, timeout : Float, speed : Float );
	
	t_newCycle(
		id: UInt, 
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
		x1: Float, y1: Float,
		x2: Float, y2: Float
	);
	
	
	
	s_serverInfo( id : UInt, host : String, port : Int, name : String, players : Int, max: Int );
	s_players( id : UInt, players : Array<String>, gid : Array<String> );
}