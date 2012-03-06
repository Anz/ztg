// singleton instance
var Editor;

// instance singleton
/*document.observe("dom:loaded", function() {
  Editor = new EditorClass();
});*/

function editor_start() {
	Editor = new EditorClass();
	Editor.resume();
}

var EditorClass = Class.create({
	initialize: function() {
		this.map = new Map();	  
		this.map.load('data/map.json');
		
		this.canvas = $('canvas');
		
		this.camera = {'x': 0, 'y': 0,'zoom': 1};

		this.mouse = {"x":0,"y":0};
		this.keys = new Hash();

		this.Modes = {EDIT:0,MOVE:1,ADD:2};
		this.mode = this.Modes.EDIT;		
	},
	resume: function() {
		// register event handlers
		var obj = this;
		
		this.canvas.onmousemove = function(event) {
			obj.mouse = obj.getViewPosition(event);
		};
		/*this.canvas.onclick = this.onClick;
		this.canvas.oncontextmenu = this.onRightClick
		window.onmousewheel = this.onMouseWheel;
		document.addEventListener('DOMMouseScroll', this.onMouseWheel, false);	
		document.onkeydown = function (e) { keys.set(e.keyCode.toString(), true); };
		document.onkeyup = function (e) { keys.unset(e.keyCode.toString()); };*/
		
		Render.backgroundColor = {"r":0.3,"g":0.3,"b":0.3,"a":1};
		this.mode = this.Modes.EDIT;
		
		this.id = setInterval(function() { obj.main(); }, 1000/60);
	},
	main: function() {
		// start game
		if (this.keys.get('17') && this.keys.get('32')) {		
			clearInterval(id);
		
			this.canvas.onmousemove = null;
			this.canvas.onclick = null;
			this.canvas.oncontextmenu = null
			window.onmousewheel = null;
			document.removeEventListener('DOMMouseScroll', onMouseWheel, false);	
			document.onkeydown = null;
			document.onkeyup = null;
			
			var game = map.clone();
			this.keys = new Hash();
			new Game(game).start();
			return;
		}
		
		// calculate physics
		if (this.mode != this.Modes.MOVE)
			this.map.world.Step(1000/60, 8, 3);

		// load models
		if (!this.models && this.map.models.keys().length > 0) {
			this.models = new Map();
			var obj = this;
			this.map.models.keys().each(function(key, i) {
				var model = obj.map.models.get(key);
							
				var frame_per_line = 3;
				var framesize = 128;
				var framespace = framesize + 30;
				
			
				var x = (i % frame_per_line) - Math.floor(frame_per_line / 2);
				var y = Math.floor(i / frame_per_line);
				
				var entity = new Entity(obj.models.world, model, x * framespace / camera.zoom + camera.x, -y * framespace / camera.zoom + camera.y, 0);
				
				var sizeFactor = Math.min(1, Math.min(framesize / entity.model.texture.width, framesize / entity.model.texture.height)) / obj.camera.zoom;
				entity.width = entity.model.texture.width*sizeFactor;
				entity.height = entity.model.texture.height*sizeFactor;
				entity.layer = 3;
				entity.color = { "r":1,"g":1,"b":1,"a":1};
				
				obj.models.entities.push(entity);
			});
		}

		// camera moving
		if (this.keys.get('87')) this.camera.y += 20 / this.camera.zoom;
		if (this.keys.get('65')) this.camera.x -= 20 / this.camera.zoom;
		if (this.keys.get('83')) this.camera.y -= 20 / this.camera.zoom;
		if (this.keys.get('68')) this.camera.x += 20 / this.camera.zoom;
		
		// reset camera
		if (this.keys.get('226')) {
			this.mouse.x = 0;
			this.mouse.y = 0;
			this.camera.x = 0;
			this.camera.y = 0;
			this.camera.zoom = 1;
		}
		
		// change into adding mode
		if (this.keys.get('32')) {
			this.mode = Modes.ADD;
		}
		
		// change into moving mode
		if (keys.get('89')) {
			var count = 0;
			this.map.entities.each(function(entity) {
				if (!entity.selection)
					return;
				entity.oldPosition = entity.body.GetPosition();
				count++;
			});
			if (count > 0)
				mode = Modes.MOVE;
		}
		
		// delete selection
		if (keys.get('46')) {
			this.map.entities.each(function(entity) {
				if (!entity.selection)
					return;
				entity.destroy();
				map.entities = map.entities.without(entity);
			});
		}
		
		// moving selection along the cursor
		if (this.mode == this.Modes.MOVE) {
			var target = this.getSpacePosition(this.mouse);
			
			var center = {"x":0,"y":0};
			var count = 0;
			map.entities.each(function(entity) {
				if (!entity.selection)
					return;
				var position = entity.body.GetPosition();
				center.x += position.x;
				center.y += position.y;
				count++;
			});
			if (count > 0) {
				center.x /= count;
				center.y /= count;
				
				
				map.entities.each(function(entity) {
					if (!entity.selection)
						return;
					var position = entity.body.GetPosition();
					position.x += pixelInMeter(target.x) - center.x;
					position.y += pixelInMeter(target.y) - center.y;
					entity.body.SetPosition(position);
				});
			} else {
				mode = Modes.EDIT;
			}
		}
		
		// clear screen
		Render.clear();
		
		for (var x = ((this.canvas.width/2+this.camera.x) % 10* this.camera.zoom)-this.canvas.width/2; x <= this.canvas.width/2; x += 10 * this.camera.zoom) {
			Render.drawLine(x, -this.canvas.height/2, x, this.canvas.height/2, {"r":0.5,"g":0.5,"b":0.5,"a":1});
		}
		for (var y = ((this.canvas.height/2+this.camera.y) % (10* this.camera.zoom))-this.canvas.height/2; y <= this.canvas.height/2; y += 10 * this.camera.zoom) {
			Render.drawLine(-this.canvas.width/2, y, this.canvas.width/2, y, {"r":0.5,"g":0.5,"b":0.5,"a":1});
		}
		for (var x = ((this.canvas.width/2+this.camera.x) % (100* this.camera.zoom))-this.canvas.width/2; x <= this.canvas.width/2; x += 100 * this.camera.zoom) {
			Render.drawLine(x, -this.canvas.height/2, x, this.canvas.height/2, {"r":0.6,"g":0.6,"b":0.6,"a":1});
		}
		for (var y = ((this.canvas.height/2+this.camera.y) % (100* this.camera.zoom))-this.canvas.height/2; y <= this.canvas.height/2; y += 100 * this.camera.zoom) {
			Render.drawLine(-this.canvas.width/2, y, this.canvas.width/2, y, {"r":0.6,"g":0.6,"b":0.6,"a":1});
		}
		Render.drawLine(-this.camera.x*this.camera.zoom, -this.canvas.height/2, -this.camera.x*this.camera.zoom, this.canvas.height/2, {"r":1,"g":1,"b":0,"a":1});
		Render.drawLine(-this.canvas.width/2, -this.camera.y*this.camera.zoom, this.canvas.width/2, -this.camera.y*this.camera.zoom, {"r":1,"g":1,"b":0,"a":1});
		
		// draw entities
		this.map.entities.sort(function (a, b) {	return a.layer - b.layer; });
		var camera = this.camera;
		this.map.entities.each(function(entity) {
			var position = entity.body.GetPosition();
			var angle = entity.body.GetAngle();
			if (!entity.width) entity.width = entity.model.texture.width;
			if (!entity.height) entity.height = entity.model.texture.height;
			if (!entity.width || !entity.height) return;
			Render.drawRect((meterInPixel(position.x)-camera.x)*camera.zoom, (meterInPixel(position.y)-camera.y)*camera.zoom, angle, entity.width*camera.zoom, entity.height*camera.zoom, entity.color, entity.model.texture);
		});
		
		// draw selection
		this.map.entities.each(function(entity) {
			if (!entity.selection) 
				return;
			var position = entity.body.GetPosition();
			var angle = entity.body.GetAngle();
			Render.drawFrame((meterInPixel(position.x)-camera.x)*camera.zoom, (meterInPixel(position.y)-camera.y)*camera.zoom, angle,  entity.width*camera.zoom, entity.width*camera.zoom, {"r":1,"g":1,"b":0,"a":1});
		});
		
		if (this.mode == this.Modes.ADD) {
			models.entities.each(function(entity) {
				var position = entity.body.GetPosition();
				Render.draw(entity.model.mesh, 1, entity.color, entity.model.texture, meterInPixel(position.x), meterInPixel(position.y), entity.layer, 0, entity.width, entity.height);
			});
		}
	},
	onClick: function(event) {
		var mouse = getSpacePosition(getViewPosition(event));

		switch (mode) {
			case Modes.EDIT: {
				var target;
				map.entities.each(function(entity) {
					if (entity.selection)
						return;
					var position = entity.body.GetPosition();
					if (Math.abs(meterInPixel(position.x) - mouse.x) <= entity.width/2 &&
						Math.abs(meterInPixel(position.y) - mouse.y) <= entity.height/2 &&
						(!target || entity.layer >= target.layer)) {
						target = entity;
					}
				});
				
				if (!keys.get('17'))
					clearSelection();
				
				if (target) {
					var position = target.body.GetPosition();
					target.selection = true;
					target.oldx = position.x;
					target.oldy = position.y;
				}
				break;
			}
		
			case Modes.MOVE: {
				map.world.ClearForces();
				map.entities.each(function(entity) {
					delete entity.selection;
					delete entity.oldx;
					delete entity.oldy;
					entity.body.SetAwake(true);
				});
				mode = Modes.EDIT;
				break;
			}
			case Modes.ADD: {
				clearSelection();
				models.entities.each(function(entity) {
					var position = entity.body.GetPosition();
					if (Math.abs(meterInPixel(position.x) - mouse.x) < entity.width/2 && 
						Math.abs(meterInPixel(position.y) - mouse.y) < entity.height/2) {					
						var clone = new Entity(map.world, entity.model, pixelInMeter(mouse.x), pixelInMeter(mouse.y), 1);
						clone.width = clone.model.texture.width;
						clone.height = clone.model.texture.height;
						clone.selection = true;
						map.entities.push(clone);
						mode = Modes.MOVE;
						throw $break;
					}
				});
				break;
			}
		}
		return false;
	},
	onRightClick: function(event) {
		// dropping selection and change back to edit
		map.entities.each(function(entity) {
			if (!entity.selection)
				return;
			if (entity.oldPosition) {
				entity.body.SetPosition(entity.oldPosition);
				delete entity.oldPosition;
			} else {
				entity.destroy();
				map.entities = map.entities.without(entity);
			}
		});
		mode = Modes.EDIT;
		return false;
	},
	onMouseWheel: function(event) {
		var delta = event.wheelDelta ? -event.wheelDelta/200 : event.detail/10;

		switch (mode) {
			case Modes.EDIT:
			case Modes.MOVE: {
				camera.zoom = Math.min(4, Math.max(ZOOM_MAX, camera.zoom-delta));
				break;
			}
			case Modes.ADD: {
				models.entities.each(function(entity) {
					var position = entity.body.GetPosition();
					position.y += pixelInMeter(delta * 100);
					entity.body.SetPosition(position);
				});
				break;
			}
		}
	},
	clearSelection: function () {
		map.entities.each(function(entity) {
			delete entity.selection;
			delete entity.oldx;
			delete entity.oldy;
		});
	},
	getViewPosition: function(e) {
		return {
			"x": e.clientX - this.canvas.offsetLeft - this.canvas.width/2,
			"y": this.canvas.height/2 - e.clientY + this.canvas.offsetTop,
		};
	},
	getSpacePosition: function(point) {
		return {
			"x": this.point.x / camera.zoom + this.camera.x,
			"y": this.point.y / camera.zoom + this.camera.y 
		};
	}
});