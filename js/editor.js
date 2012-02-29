var camera = {'x': 0, 'y': 0,'zoom': 1};
var canvas;
var textureWhite;
var frameMesh;

var ZOOM_MAX = 0.2;

var mouse = {"x":0,"y":0};
var keys = new Hash();

var Modes = {EDIT:0,MOVE:1,ADD:2};
var mode = Modes.EDIT;
var grid;
var models;
var map;

var id;

function editor_init() {
	map = new Map();
	map.load('data/map.json');
	
	canvas = $('canvas');
	
	grid = Grid();
	
	frameMesh = Frame();
	
	editor_resume();
}
	
function editor_resume() {
	// register event handlers
	canvas.onmousemove = onMouseMove;
	canvas.onclick = onClick;
	canvas.oncontextmenu = onRightClick
	window.onmousewheel = onMouseWheel;
	document.addEventListener('DOMMouseScroll', onMouseWheel, false);	
	document.onkeydown = function (e) { keys.set(e.keyCode.toString(), true); };
	document.onkeyup = function (e) { keys.unset(e.keyCode.toString()); };
	
	Render.backgroundColor = {"r":0.3,"g":0.3,"b":0.3,"a":1};
	mode = Modes.EDIT;
	
	id = setInterval(model_editor_main, 1000/60);
}

function model_editor_main() {
	// start game
	if (keys.get('17') && keys.get('32')) {		
		clearInterval(id);
	
		canvas.onmousemove = null;
		canvas.onclick = null;
		canvas.oncontextmenu = null
		window.onmousewheel = null;
		document.removeEventListener('DOMMouseScroll', onMouseWheel, false);	
		document.onkeydown = null;
		document.onkeyup = null;
		
		var game = map.clone();
		keys = new Hash();
		new Game(game).start();
		return;
	}
	
	// calculate physics
	if (mode != Modes.MOVE)
		map.world.Step(1000/60, 8, 3);

	// load models
	if (!models && map.models.keys().length > 0) {
		models = new Map();
		map.models.keys().each(function(key, i) {
			var model = map.models.get(key);
						
			var frame_per_line = 3;
			var framesize = 128;
			var framespace = framesize + 30;
			
		
			var x = (i % frame_per_line) - Math.floor(frame_per_line / 2);
			var y = Math.floor(i / frame_per_line);
			
			var entity = new Entity(models.world, model, x * framespace / camera.zoom + camera.x, -y * framespace / camera.zoom + camera.y, 0);
			
			var sizeFactor = Math.min(1, Math.min(framesize / entity.model.texture.width, framesize / entity.model.texture.height)) / camera.zoom;
			entity.width = entity.model.texture.width*sizeFactor;
			entity.height = entity.model.texture.height*sizeFactor;
			entity.layer = 3;
			entity.color = { "r":1,"g":1,"b":1,"a":1};
			
			models.entities.push(entity);
		});
	}

	// camera moving
	if (keys.get('87')) camera.y += 20 / camera.zoom;
	if (keys.get('65')) camera.x -= 20 / camera.zoom;
	if (keys.get('83')) camera.y -= 20 / camera.zoom;
	if (keys.get('68')) camera.x += 20 / camera.zoom;
	
	// reset camera
	if (keys.get('226')) {
		mouse.x = 0;
		mouse.y = 0;
		camera.x = 0;
		camera.y = 0;
		camera.zoom = 1;
	}
	
	// set grid
	grid[0].body.SetPosition(new b2Vec2(pixelInMeter(camera.x-(camera.x % 100)), pixelInMeter(camera.y-(camera.y % 100))));
	grid[1].body.SetPosition(new b2Vec2(pixelInMeter(camera.x-(camera.x % 100)), pixelInMeter(camera.y-(camera.y % 100))));
	grid[2].body.SetPosition(new b2Vec2(pixelInMeter(camera.x), 0));
	grid[3].body.SetPosition(new b2Vec2(0, pixelInMeter(camera.y)));
	
	// change into adding mode
	if (keys.get('32')) {
		mode = Modes.ADD;
	}
	
	// change into moving mode
	if (keys.get('89')) {
		var count = 0;
		map.entities.each(function(entity) {
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
		map.entities.each(function(entity) {
			if (!entity.selection)
				return;
			entity.destroy();
			map.entities = map.entities.without(entity);
		});
	}
	
	// moving selection along the cursor
	if (mode == Modes.MOVE) {
		var target = getSpacePosition(mouse);
		
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
	
	// draw grid
	grid.each(function(entity) {
		var position = entity.body.GetPosition();
		Render.draw(entity.model.mesh, camera.zoom, entity.color, entity.model.texture, meterInPixel(position.x)-camera.x, meterInPixel(position.y)-camera.y, 0, 0, entity.width, entity.height);
	});
	
	// draw entities
	map.entities.sort(function (a, b) {	return a.layer - b.layer; });
	map.entities.each(function(entity) {
		var position = entity.body.GetPosition();
		var angle = entity.body.GetAngle();
		if (!entity.width) entity.width = entity.model.texture.width;
		if (!entity.height) entity.height = entity.model.texture.height;
		if (!entity.width || !entity.height) return;
		Render.draw(entity.model.mesh, camera.zoom, entity.color, entity.model.texture, meterInPixel(position.x)-camera.x, meterInPixel(position.y)-camera.y, entity.layer, angle, entity.width, entity.height);
	});
	
	// draw selection
	map.entities.each(function(entity) {
		if (!entity.selection) 
			return;
		var position = entity.body.GetPosition();
		var angle = entity.body.GetAngle();
		Render.draw(frameMesh, camera.zoom, {"r":1,"g":1,"b":0,"a":1}, null, meterInPixel(position.x)-camera.x, meterInPixel(position.y)-camera.y, entity.layer, angle, entity.width, entity.width);
	});
	
	if (mode == Modes.ADD) {
		models.entities.each(function(entity) {
			var position = entity.body.GetPosition();
			Render.draw(entity.model.mesh, 1, entity.color, entity.model.texture, meterInPixel(position.x), meterInPixel(position.y), entity.layer, 0, entity.width, entity.height);
		});
	}
}

function onMouseMove(event) {
	mouse = getViewPosition(event);
}

function onClick(event) {
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
}

function onRightClick(event) {
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
}

function onMouseWheel(event) {
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
}

function clearSelection() {
	map.entities.each(function(entity) {
		delete entity.selection;
		delete entity.oldx;
		delete entity.oldy;
	});
}

function getViewPosition(e) {
	return {
		"x": e.clientX - canvas.offsetLeft - canvas.width/2,
		"y": canvas.height/2 - e.clientY + canvas.offsetTop,
	};
}

function getSpacePosition(point) {
	return {
		"x": point.x / camera.zoom + camera.x,
		"y": point.y / camera.zoom + camera.y 
	};
}

function Grid() {
	var width = canvas.width/2 / ZOOM_MAX;
	var height = canvas.height/2 / ZOOM_MAX;
	
	var xaxis_vertices = [-width,  0, width,  0];
	var xaxis_indices = [0, 1];
	
	var yaxis_vertices = [0,  -height, 0,  height];
	var yaxis_indices = [0, 1];
	
	// grid
	var xlimit = width + 100 - (width % 100) + 100;
	var ylimit = height + 100 - (height % 100) + 100;
	
	var small_grid_vertices = [];
	var big_grid_vertices = [];
	
	for (var i=-xlimit; i<=xlimit; i+=10) {
		var grid_vertices;
		if(Math.abs(i)  % 100 == 0) grid_vertices = big_grid_vertices;
		else grid_vertices = small_grid_vertices;
		
 		grid_vertices.push(i);
		grid_vertices.push(-ylimit);		
		grid_vertices.push(i);
		grid_vertices.push(ylimit);
	}
	
	for (var i=-ylimit; i<=ylimit; i+=10) {
		var grid_vertices;
		if (Math.abs(i) % 100 == 0) grid_vertices = big_grid_vertices;
		else grid_vertices = small_grid_vertices;
	
		grid_vertices.push(-xlimit);
		grid_vertices.push(i);		
		grid_vertices.push(xlimit);
		grid_vertices.push(i);
	}
	
	var small_grid_indices = new Array(small_grid_vertices.length/2);
	var big_grid_indices = new Array(big_grid_vertices.length/2);
	
	for (var i=0; i<small_grid_vertices.length/2; i++) {
		small_grid_indices[i] = i;
		if (i < big_grid_vertices.length/2)
			big_grid_indices[i] = i;
	}
	
	var xaxis = new Model('_axis', 'white', Render.createMesh(Render.PRIMITIVE.LINES, xaxis_vertices, null, xaxis_indices));
	var yaxis = new Model('_yaxis', 'white', Render.createMesh(Render.PRIMITIVE.LINES, yaxis_vertices, null, yaxis_indices));
	var small = new Model('_smallgrid', 'white', Render.createMesh(Render.PRIMITIVE.LINES, small_grid_vertices, null, small_grid_indices));
	var big = new Model('_biggrid', 'white', Render.createMesh(Render.PRIMITIVE.LINES, big_grid_vertices, null, big_grid_indices));
	
	var grid = [
		new Entity(map.world, small, 0, 0, -3),
		new Entity(map.world, big, 0, 0, -2),
		new Entity(map.world, xaxis, 0, 0, -1),
		new Entity(map.world, yaxis, 0, 0, -1)
	];
	
	grid[0].color = {"r":0.5,"g":0.5,"b":0.5,"a":1};
	grid[1].color = {"r":0.6,"g":0.6,"b":0.6,"a":1};
	grid[2].color = {"r":1,"g":1,"b":0,"a":1};
	grid[3].color = {"r":1,"g":1,"b":0,"a":1};
	
	return grid;
}

function Frame() {
	var vertices = [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5];
	var indices = [0, 1, 1, 3, 3, 2, 2, 0];
	var mesh = Render.createMesh(Render.PRIMITIVE.LINES, vertices, null, indices);
	return mesh;
}