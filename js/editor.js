// singleton instance
var Editor;

// instance singleton
/*document.observe("dom:loaded", function() {
  Editor = new EditorClass();
  Editor.resume();
});*/

var requestAnimationFrame = typeof(mozRequestAnimationFrame) != 'undefined' ? mozRequestAnimationFrame : webkitRequestAnimationFrame;

var EditorClass = Class.create({
	initialize: function() {
		this.map = loadMap('data/ztg1');	
		
		this.red = {"r":1,"g":0,"b":0,"a":0.3};
		this.green = {"r":0,"g":1,"b":0,"a":0.3};
		this.yellow = {"r":1,"g":1,"b":0,"a":1};
		this.lightgrey = {"r":0.6,"g":0.6,"b":0.6,"a":1};
		this.grey = {"r":0.5,"g":0.5,"b":0.5,"a":1};
		this.darkgrey = {"r":0.3,"g":0.3,"b":0.3,"a":1};
		this.white = {"r":1,"g":1,"b":1,"a":1};
		
		/*var map = this.map;
		var parent = $('models');
		this.map.models.keys().each(function(key) {
			var model = map.models.get(key);
			var image = document.createElement("img");
			image.src = "img/" + model.image;
			var div = document.createElement("div");
			div.setAttribute('class', 'model');
			div.setAttribute('onclick', 'Editor.addEntity("'+model.name+'")');
			div.appendChild(image);
			parent.appendChild(div);
		});*/
		
		this.canvas = $('canvas');
		
		this.camera = {'x': 0, 'y': 0,'zoom': 1};

		this.mouse = {"x":0,"y":0};
		
		this.selection = [];

		this.Modes = {EDIT:0,MOVE:1};
		this.mode = this.Modes.EDIT;
		
		this.showPhysicalBody = false;
		this.scriptActive = true;
		
		this.time = new Date().getTime();
	},
	resume: function() {
		var obj = this;
		
		this.canvas.onmousemove = function(event) {
			obj.mouse = obj.getViewPosition(event);
		};
		this.canvas.onclick = onClick;
		
		Render.backgroundColor = this.darkgrey;
		
		this.gameLoop = true;
		
		//this.intervalId = setInterval(function() { obj.main(); }, 1000/30);
		requestAnimationFrame (function() { obj.main(); });
	},
	main: function() {	
		var obj = this;
		requestAnimationFrame (function() { obj.main(); });
		
		var current = new Date().getTime();
		if (current - this.time < 1000/60) {
			return;
		}
	
		// calculate physics
		this.map.world.Step(1/30, 8, 3);
			
		// drop selection
		if (Input.readRightClick()) {
			this.selection.length = 0;
		}

		// camera moving
		if (!this.scriptActive) {
			if (Input.keyDown.get('87')) this.camera.y += 20 / this.camera.zoom;
			if (Input.keyDown.get('65')) this.camera.x -= 20 / this.camera.zoom;
			if (Input.keyDown.get('83')) this.camera.y -= 20 / this.camera.zoom;
			if (Input.keyDown.get('68')) this.camera.x += 20 / this.camera.zoom;
		}
		
		// camera zoom
		this.camera.zoom = Math.min(10, Math.max(0.05, this.camera.zoom-Input.readMouseWheel()*this.camera.zoom));
		
		// clear screen
		Render.clear();
		
		/*for (var x = ((this.canvas.width/2+this.camera.x) % 10* this.camera.zoom)-this.canvas.width/2; x <= this.canvas.width/2; x += 10 * this.camera.zoom) {
			Render.drawLine(x, -this.canvas.height/2, x, this.canvas.height/2, this.grey);
		}
		for (var y = ((this.canvas.height/2+this.camera.y) % (10* this.camera.zoom))-this.canvas.height/2; y <= this.canvas.height/2; y += 10 * this.camera.zoom) {
			Render.drawLine(-this.canvas.width/2, y, this.canvas.width/2, y, this.grey);
		}
		for (var x = ((this.canvas.width/2+this.camera.x) % (100* this.camera.zoom))-this.canvas.width/2; x <= this.canvas.width/2; x += 100 * this.camera.zoom) {
			Render.drawLine(x, -this.canvas.height/2, x, this.canvas.height/2, this.lightgrey);
		}
		for (var y = ((this.canvas.height/2+this.camera.y) % (100* this.camera.zoom))-this.canvas.height/2; y <= this.canvas.height/2; y += 100 * this.camera.zoom) {
			Render.drawLine(-this.canvas.width/2, y, this.canvas.width/2, y, this.lightgrey);
		}*/
		Render.drawLine(-this.camera.x*this.camera.zoom, -this.canvas.height/2, -this.camera.x*this.camera.zoom, this.canvas.height/2, this.yellow);
		Render.drawLine(-this.canvas.width/2, -this.camera.y*this.camera.zoom, this.canvas.width/2, -this.camera.y*this.camera.zoom, this.yellow);
		
		// draw entities
		this.map.entities.sort(function (a, b){ return a.layer - b.layer; });
		var map = this.map;
		var camera = this.camera;
		var world = this.map.world;
		var scriptActive = this.scriptActive;
		
		this.map.entities.each(function(entity) {		
			var position = entity.body.GetPosition();
			var angle = entity.body.GetAngle();
			
			var frames = 1.0/entity.frames;
			var animations = 1.0/entity.animations;
			
			Render.drawImage(entity.texture.name, 
				(meterInPixel(position.x)-camera.x)*camera.zoom, 
				(meterInPixel(position.y)-camera.y)*camera.zoom, 
				angle, 
				camera.zoom, 
				entity.color,
				entity.framex, 
				entity.framey, 
				frames,
				animations,
				entity.flip);
			
			if (scriptActive) {
				// step
				entity.onPrestep(camera);
				
				// contact
				for (var contact = entity.body.GetContactList(); contact; contact = contact.next) {						
					entity.onContact(contact.other.GetUserData());
				}
			}
		});
		
		// draw collison box
		if (Editor.showPhysicalBody) {
			var camera = this.camera;
			this.map.entities.each(function(entity) {
				if (typeof(entity.body.mesh) == 'undefined') {
					entity.body.mesh = createMeshFromBody(entity.body);
				}
			
				var position = entity.body.GetPosition();
				var angle = entity.body.GetAngle();
				Render.draw(entity.body.mesh, entity.body.IsAwake() ? Editor.green : Editor.red, Render.images.get('white'), (meterInPixel(position.x)-camera.x)*camera.zoom, (meterInPixel(position.y)-camera.y)*camera.zoom, angle, camera.zoom, camera.zoom);
			});
		}
		
		var mouse = this.mouse;
		this.selection.each(function(selected) {
			Render.drawRect(mouse.x-selected.x, mouse.y-selected.y, 0, selected.model.texture.width*camera.zoom, selected.model.texture.height*camera.zoom, {"r":1,"g":1,"b":1,"a":1}, selected.model.texture);
			Render.drawFrame(mouse.x-selected.x, mouse.y-selected.y, 0, selected.model.texture.width*camera.zoom, selected.model.texture.height*camera.zoom, {"r":1,"g":1,"b":0,"a":1});
		});
		
		this.time = current;
	},
	startGame: function() {
		clearInterval(this.id);			
		var game = this.map.clone();
		new Game(game).start();
	},
	addEntity: function(modelName) {
		var model = this.map.models.get(modelName);
		this.selection.length = 0;
		this.selection = [{"x":0,"y":0,"model":model}];
		Editor.mode = Editor.Modes.MOVE;
	},
	clearSelection: function () {
		this.selection.length = 0;
		Editor.mode = Editor.Modes.EDIT;
	},
	getViewPosition: function(e) {
		return {
			"x": e.clientX - this.canvas.offsetLeft - this.canvas.width/2,
			"y": this.canvas.height/2 - e.clientY + this.canvas.offsetTop,
		};
	},
	getSpacePosition: function(point) {
		return {
			"x": point.x / this.camera.zoom + this.camera.x,
			"y": point.y / this.camera.zoom + this.camera.y 
		};
	},
});

function onClick(event) {
	var mouse = Editor.getSpacePosition(Editor.getViewPosition(event));

	switch (Editor.mode) {
		/*case Editor.Modes.EDIT: {
			var target;
			Editor.map.entities.each(function(entity) {
				if (entity.selection)
					return;
				var position = entity.body.GetPosition();
				if (Math.abs(meterInPixel(position.x) - mouse.x) <= entity.width/2 &&
					Math.abs(meterInPixel(position.y) - mouse.y) <= entity.height/2 &&
					(!target || entity.layer >= target.layer)) {
					target = entity;
				}
			});
			
			if (!Input.keyDown.get('17'))
				Editor.clearSelection();
			
			if (target) {
				target.selection = true;
			}
			break;
		}*/
	
		case Editor.Modes.MOVE: {
			Editor.selection.each(function(selected) {
				var position = {"x":mouse.x-selected.x,"y":mouse.y-selected.y};
				position = Editor.getSpacePosition(position);
				var entity = new Entity(Editor.map.world, selected.model, pixelInMeter(mouse.x), pixelInMeter(mouse.y), 0);
				Editor.map.entities.push(entity);
			});
			break;
		}
	}
	return false;
}