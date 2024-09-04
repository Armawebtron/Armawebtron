package network;

enum NetMode
{
	ws( host : String, port : UInt, ssl : Bool );
	udp( host : String, port : UInt );
}
