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
		this.game = new Game(this.map);
		
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
		
		this.camera = {'x': 0, 'y': 0,'zoom': 2};

		this.mouse = {"x":0,"y":0};
		
		this.selection = [];

		this.Modes = {EDIT:0,MOVE:1};
		this.mode = this.Modes.EDIT;
		
		this.showPhysicalBody = false;
		this.scriptActive = false;
		
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
		
		requestAnimationFrame (function() { obj.main(); });
	},
	main: function() {	
		var obj = this;
		requestAnimationFrame (function() { obj.main(); });
		
			
		// drop selection
		if (Input.readRightClick()) {
			this.selection.length = 0;
		}

		// camera moving
		if (!this.scriptActive) {
			if (Input.keyDown.get('87')) this.game.camera.y += 20 / this.game.camera.zoom;
			if (Input.keyDown.get('65')) this.game.camera.x -= 20 / this.game.camera.zoom;
			if (Input.keyDown.get('83')) this.game.camera.y -= 20 / this.game.camera.zoom;
			if (Input.keyDown.get('68')) this.game.camera.x += 20 / this.game.camera.zoom;
		}
		
		// camera zoom
		this.game.camera.zoom = Math.min(10, Math.max(0.05, this.game.camera.zoom-Input.readMouseWheel()*this.game.camera.zoom));
		
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
		var map = this.map;
		var camera = this.camera;
		var world = this.map.world;
		var scriptActive = this.scriptActive;
		
		// physic
		this.game.physic();
		
		this.game.drawEntities();
		
		// draw bounding box
		if (Editor.showPhysicalBody) {
			this.drawBoundingBox();
		}
		
		// scripting
		if (scriptActive) {
			this.game.script();
		}
		
		var mouse = this.mouse;
		this.selection.each(function(selected) {
			Render.drawRect(mouse.x-selected.x, mouse.y-selected.y, 0, selected.model.texture.width*camera.zoom, selected.model.texture.height*camera.zoom, {"r":1,"g":1,"b":1,"a":1}, selected.model.texture);
			Render.drawFrame(mouse.x-selected.x, mouse.y-selected.y, 0, selected.model.texture.width*camera.zoom, selected.model.texture.height*camera.zoom, {"r":1,"g":1,"b":0,"a":1});
		});
	},
	drawBoundingBox: function() {
		var camera = this.game.camera;
	
		this.game.map.entities.each(function(entity) {		
			var position = entity.body.GetPosition();
			var angle = entity.body.GetAngle();
					
			if (typeof(entity.body.mesh) == 'undefined') {
				entity.body.mesh = createMeshFromBody(entity.body);
			}
			Render.draw(entity.body.mesh, entity.body.IsAwake() ? Editor.green : Editor.red, Render.images.get('white'), meterInPixel(position.x)-camera.x, meterInPixel(position.y)-camera.y, angle, 1, 1, 0, 0, camera.zoom);
		});
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