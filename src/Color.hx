class Color
{
	static public var verifyColors : Bool = true;
	
	static public function getColorRegex() : EReg
	{
		if( verifyColors )
		{
			return ~/0x([0-9A-Fa-f]{6}|RESETT)(.*?)(?=0x(?:[0-9A-Fa-f]{6}|RESETT)|$)/gm;
		}
		else
		{
			return ~/0x(.{6})(.*?)(?=0x(?:.{6})|$)/gm;
		}
	}
	
	static public function removeColors( x : String )
	{
		return getColorRegex().replace( x, "$2" );
	}
}
