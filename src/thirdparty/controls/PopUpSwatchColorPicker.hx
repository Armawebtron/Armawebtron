package thirdparty.controls;

// from https://community.haxe.org/t/solved-is-there-any-ui-libs-that-contain-color-picker-component/3501/3

import feathers.controls.Button;
import feathers.controls.ListView;
import feathers.controls.Callout;
import feathers.core.FeathersControl;
import feathers.data.ArrayCollection;
import feathers.data.ListViewItemState;
import feathers.events.FeathersEvent;
import feathers.events.ListViewEvent;
import feathers.layout.TiledRowsLayout;
import feathers.skins.RectangleSkin;
import feathers.utils.DisplayObjectRecycler;

import openfl.events.Event;
import openfl.events.MouseEvent;

class SwatchColorPicker extends FeathersControl {
	public function new() {
		super();
	}

	private var _listView:ListView;
	private var _colorsCollection:ArrayCollection<Dynamic>;

	public var selectedColor(default, set):UInt = 0x000000;

	private function set_selectedColor(value:UInt):UInt {
		if (this.selectedColor == value) {
			return this.selectedColor;
		}
		this.selectedColor = value;
		this.setInvalid(DATA);
		FeathersEvent.dispatch(this, Event.CHANGE);
		return this.selectedColor;
	}

	private var _ignoreColorChanges = false;

	override private function initialize():Void {
		super.initialize();

		this._colorsCollection = new ArrayCollection([
			{color: 0x000000}, {color: 0x303030}, {color: 0x585858}, {color: 0x808080}, {color: 0xa0a0a0},
			{color: 0xc3c3c3}, {color: 0xdcdcdc}, {color: 0xffffff}, {color: 0x400000}, {color: 0x800000},
			{color: 0xc00000}, {color: 0xff0000}, {color: 0xffc0c0}, {color: 0x004000}, {color: 0x008000},
			{color: 0x00c000}, {color: 0x00ff00}, {color: 0xc0ffc0}, {color: 0x000080}, {color: 0x0000c0},
			{color: 0x0000ff}, {color: 0xc0c0ff}, {color: 0x404000}, {color: 0x808000}, {color: 0xc0c000},
			{color: 0xffff00}, {color: 0xffffc0}, {color: 0x004040}, {color: 0x008080}, {color: 0x00c0c0},
			{color: 0x00ffff}, {color: 0xc0ffff}, {color: 0x800080}, {color: 0xc000c0}, {color: 0xff00ff},
			{color: 0xffc0ff}, {color: 0xc05800}, {color: 0xff8000}, {color: 0xffa858}, {color: 0xffdca8},
			{color: 0x884411}, {color: 0xFF6600},
		]);

		this._listView = new ListView();
		this._listView.selectable = false;
		this._listView.dataProvider = this._colorsCollection;
		this._listView.itemRendererRecycler = DisplayObjectRecycler.withFunction(() -> {
			var itemRenderer = new Button();
			itemRenderer.backgroundSkin = new RectangleSkin();
			itemRenderer.width = 20.0;
			itemRenderer.height = 20.0;
			return itemRenderer;
		}, (itemRenderer:Button, state:ListViewItemState) -> {
			var backgroundSkin = cast(itemRenderer.backgroundSkin, RectangleSkin);
			backgroundSkin.fill = SolidColor(state.data.color);
		});
		this._listView.addEventListener(ListViewEvent.ITEM_TRIGGER, itemTriggerHandler);
		var listViewLayout = new TiledRowsLayout();
		listViewLayout.requestedColumnCount = 6;
		listViewLayout.setPadding(4.0);
		listViewLayout.setGap(4.0);
		this._listView.layout = listViewLayout;
		this.addChild(this._listView);
	}

	override private function update():Void {
		var dataInvalid = this.isInvalid(DATA);

		if (dataInvalid) {
			var oldIgnoreColorChanges = this._ignoreColorChanges;
			this._ignoreColorChanges = true;
			this._listView.selectedItem = this._colorsCollection.findIndex((item, index, collection) -> {
				return item.color == this.selectedColor;
			});
			this._ignoreColorChanges = oldIgnoreColorChanges;
		}

		this._listView.validateNow();
		this.saveMeasurements(this._listView.width, this._listView.height, this._listView.minWidth, this._listView.minHeight);

		this._listView.x = 0.0;
		this._listView.y = 0.0;
		this._listView.width = this.actualWidth;
		this._listView.height = this.actualHeight;
	}

	private function itemTriggerHandler(event:ListViewEvent):Void {
		this.selectedColor = event.state.data.color;
	}
}

class PopUpSwatchColorPicker extends FeathersControl {
	public function new() {
		super();
		this.addEventListener(MouseEvent.CLICK, clickHandler);
	}

	private var _backgroundSkin:RectangleSkin;
	private var _callout:Callout;

	public var selectedColor(default, set):UInt = 0x000000;

	private function set_selectedColor(value:UInt):UInt {
		if (this.selectedColor == value) {
			return this.selectedColor;
		}
		this.selectedColor = value;
		this.setInvalid(DATA);
		FeathersEvent.dispatch(this, Event.CHANGE);
		return this.selectedColor;
	}

	override private function initialize():Void {
		super.initialize();

		this._backgroundSkin = new RectangleSkin(SolidColor(this.selectedColor), SolidColor(1.0, 0x000000));
		this.addChild(this._backgroundSkin);
	}

	override private function update():Void {
		var dataInvalid = this.isInvalid(DATA);

		if (dataInvalid) {
			this._backgroundSkin.fill = SolidColor(this.selectedColor);
		}

		this.saveMeasurements(20.0, 20.0, 20.0, 20.0);

		this._backgroundSkin.x = 0.0;
		this._backgroundSkin.y = 0.0;
		this._backgroundSkin.width = this.actualWidth;
		this._backgroundSkin.height = this.actualHeight;
	}

	private function clickHandler(event:MouseEvent):Void {
		if (this._callout != null) {
			return;
		}

		var swatches = new SwatchColorPicker();
		swatches.selectedColor = this.selectedColor;
		swatches.addEventListener(Event.CHANGE, swatchChangeHandler);
		this._callout = Callout.show(swatches, this);
		this._callout.addEventListener(Event.CLOSE, calloutCloseHandler);
	}

	private function swatchChangeHandler(event:Event):Void {
		var swatches = cast(event.currentTarget, SwatchColorPicker);
		this.selectedColor = swatches.selectedColor;
		this._callout.close();
	}

	private function calloutCloseHandler(event:Event):Void {
		this._callout = null;
	}
}
