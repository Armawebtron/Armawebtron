
package controls;


import feathers.controls.*;
import feathers.events.*;
import openfl.events.*;
import feathers.data.*;

import Main;

class KeyBindControl extends Button {
	static public var capture : Bool = false;
	static private var cap : KeyBindControl = null;
	
	public var keyBinds : Array<UInt>;
	
	private var modal : Alert;
	private var lastKey : UInt;

	public function new( b : Array<UInt> ) {
		super();
		
		keyBinds = b;
		this.updateName();
		
		addEventListener(TriggerEvent.TRIGGER, (event) -> {
			cap = this;
			capture = true;
			
			modal = Alert.show("Press a key now...",
				this.text,
				["Clear All", "Ok", "Cancel"],
				(state:ButtonBarItemState) -> {
					
					switch( state.text )
					{
						case "Clear All":
						{
							while( keyBinds.pop() != null ) {}
						}
						
						case "Ok":
						{
							var add = true;
							for( k in keyBinds )
							{
								if( k == lastKey )
								{
									add = false;
								}
							}
							if( add )
							{
								keyBinds.push(lastKey);
							}
							else
							{
								keyBinds.remove(lastKey);
							}
						}
						
						case "Cancel":
						{
							// do nothing...
						}
					}
					
					modal = null;
					capture = false;
					
					updateName();
				}
			);
		});
	}
	
	public function updateName()
	{
		var list : String = "";
		
		for( k in keyBinds )
		{
			if( list.length != 0 ) list += ", ";
			list += "<"+getKeyName(k)+">";
		}
		
		if( list.length != 0 )
		{
			this.text = list;
		}
		else
		{
			this.text = "Empty";
		}
	}
	
	static public function getKeyName( keyCode : UInt ) : String
	{
		switch( keyCode )
		{
			case 8: return 'Backspace';
			case 13: return 'Enter';
			case 16: return 'Shift';
			case 20: return 'Capslock';
			case 17: return 'Ctrl'; case 18: return 'Alt';
			case 19: return 'Pause/Break'; case 27: return 'Escape'; case 93: return 'Menu';
			case 9: return 'Tab'; case 32: return 'Spacebar';
			case 33: return 'Page Up';case 34: return 'Page Down';
			case 36: return 'Home'; case 35: return 'End';
			case 37: return 'Left Arrow'; case 39: return 'Right Arrow';
			case 38: return 'Up Arrow'; case 40: return 'Down Arrow';
			case 45: return 'Insert'; case 46: return 'Delete';
			case 48: return '0'; case 49: return '1'; case 50: return '2'; case 51: return '3'; case 52: return '4'; case 53: return '5'; case 4: return '6'; case 55: return '7'; case 56: return '8'; case 57: return '9';
			case 65: return 'A'; case 66: return 'B'; case 67: return 'C'; case 68: return 'D'; case 69: return 'E'; case 70: return 'F'; case 71: return 'G'; case 72: return 'H'; case 73: return 'I'; case 74: return 'J'; case 75: return 'K'; case 76: return 'L'; case 77: return 'M'; case 78: return 'N'; case 79: return 'O'; case 80: return 'P'; case 81: return 'Q'; case 82: return 'R'; case 83: return 'S'; case 84: return 'T'; case 85: return 'U'; case 86: return 'V'; case 87: return 'W'; case 88: return 'X'; case 89: return 'Y'; case 90: return 'Z';
			case 91: return 'Left Meta'; case 92: return 'Right Meta';
			case 111: return 'NUM /'; case 106: return 'NUM *'; case 109: return 'NUM -'; case 107: return 'NUM +'; case 110: return 'NUM .';
			case 96: return 'NUM 0'; case 97: return 'NUM 1'; case 98: return 'NUM 2'; case 99: return 'NUM 3'; case 100: return 'NUM 4'; case 101: return 'NUM 5'; case 102: return 'NUM 6'; case 103: return 'NUM 7'; case 104: return 'NUM 8'; case 105: return 'NUM 9';
			case 112: return 'F1'; case 113: return 'F2'; case 114: return 'F3'; case 115: return 'F4'; case 116: return 'F5'; case 117: return 'F6'; case 118: return 'F7'; case 119: return 'F8'; case 120: return 'F9'; case 121: return 'F10'; case 122: return 'F11'; case 123: return 'F12';
			case 144: return 'Num Lock'; case 145: return 'Scroll Lock';
			case 186: return ';';
			case 187: return '=';
			case 188: return ';';
			case 189: return '-';
			case 190: return '.';
			case 191: return '/';
			case 192: return '`';
			case 219: return '['; case 221: return ']';
			case 220: return '\\';
			case 222: return '\'';
		}
		
		return "unknown("+keyCode+")";
	}
	
	static public function keyDown( e : KeyboardEvent )
	{
		cap.lastKey = e.keyCode;
		if( cap.modal != null )
		{
			var binds = "Add <";
			for( k in cap.keyBinds )
			{
				if( k == cap.lastKey )
				{
					binds = "Delete <";
				}
			}
			cap.modal.text = binds+getKeyName( cap.lastKey )+">";
		}
	}
}
