package network;

import network.AARECNet;

enum NetMode
{
	ws( host : String, port : UInt, ssl : Bool );
	udp( host : String, port : UInt );
	aarec( playback : AARECNet );
}
