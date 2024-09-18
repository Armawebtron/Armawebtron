package network.core;

import network.NetMode;
import game.Object;

class Descriptor
{
	static public inline var ack = 1;
	
	static public inline var getServerInfo = 53;
	static public inline var serverInfo = 51;
	static public inline var getServerInfoSmall = 52;
	static public inline var serverInfoSmall = 50;


	static public inline var wantObjs = 25;
	static public inline var objSync = 24;
	static public inline var objDestroy = 22;

	static public var obj : Map<String, UInt> = [
		"timer"     => 210,
		"game"      => 310,
		"player"    => 201,
		"player_ai" => 330,
		"team"      => 220,
		"team_ai"   => 331,
		"cycle"     => 320,
		"cycleWall" => 300,
		"zone"      => 340,
		"zoneCirc"  => 350,
		"zonePoly"  => 360,
	];

	static public inline var sync = 28;
	static public inline var syncAck = 27;


	static public inline var gameStateSync = 311;


	static public inline var requestID = 21;
	static public inline var haveID = 20;


	static public inline var login1 = 11;
	static public inline var login2 = 6;
	static public inline var loginAccept = 5;
	static public inline var loginDeny = 3;
	static public inline var logout = 7;



	static public inline var config = 60;


	static public inline var newPlayer = 201;
	static public inline var removePlayer = 202;
	static public inline var wantTeamChange = 23;


	static public inline var cycleEvent = 321;
	static public inline var chat = 200;


	static public inline var consoleMessage = 8;
	static public inline var chatMessage = 203;
	static public inline var centerMessage = 9;
	static public inline var fullscreenMessage = 312;
}


class NetBase
{
	public var netObjs : Map<UInt, NetObject>;
	
	public function new()
	{
		netObjs = [];
	}
}

