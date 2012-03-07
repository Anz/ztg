// singleton instance
var Input;

// instance singleton
document.observe("dom:loaded", function() {
  Input = new InputClass($('canvas'));
});

var InputClass = Class.create({
	initialize: function(canvas) {
		this.canvas = canvas;
		this.keyDown = new Hash();
		this.keyClick = new Hash();
		this.mouse = {
			"leftDown":false,
			"rightDown":false,
			"leftClick":false,
			"rightClick":false,
			"wheel":0,
			"position":{"x":0,"y":0},
			"move":{"x":0,"y":0}
		};
		
		
		var keyDown = this.keyDown;
		var keyClick = this.keyClick;
		var mouse = this.mouse;
		
		// register event handlers
		canvas.onmousemove = function(e) {
			mouse.position.x = e.clientX - canvas.offsetLeft;
			mouse.position.y = canvas.offsetTop - e.clientY;
		};
		canvas.onmousedown = function(e) {
			switch (e.button) {
				case 0: mouse.leftClick = true;
				case 2: mouse.rightClick = true;
			}
		};
		
		/*canvas.onmouseup = function(e) { 
			switch (e.button) {
				case 0: mouse.leftClick = false;
				case 2: mouse.rightClick = true;
			}
		};*/
		
		canvas.oncontextmenu = function(e) { 
			return false;
		};
		
		window.onmousewheel = function(e) {
			mouse.wheel = e.wheelDelta ? -e.wheelDelta/200 : e.detail/10;
		};
		
		document.addEventListener('DOMMouseScroll', function(e) { 
			mouse.wheel = e.wheelDelta ? -e.wheelDelta/200 : e.detail/10;
		}, false);
		
		document.onkeydown = function(e) {
			keyDown.set(e.keyCode.toString(), true);
		};
		
		document.onkeyup = function(e) {
			keyDown.unset(e.keyCode.toString());
		};
	},
	readMouseWheel: function() {
		var wheel = this.mouse.wheel;
		this.mouse.wheel = 0;
		return wheel;
	},
	readRightClick: function() {
		var rightClick = this.mouse.rightClick;
		this.mouse.rightClick = false;
		return rightClick;
	}
});