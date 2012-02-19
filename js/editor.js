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
var selection = [];
var adding = [];
var map;

function editor_init() {
	map = engine_map('data/map.json');
	canvas = $('canvas');
	
	grid = Grid();
	
	textureWhite = graphic_texture_solid(255,255,255,255);
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
	
	mode = Modes.EDIT;
	
	model_editor_main(camera, map.entities);
}

function model_editor_main() {
	// start game
	if (keys.get('17') && keys.get('32')) {		
		canvas.onmousemove = null;
		canvas.onclick = null;
		canvas.oncontextmenu = null
		window.onmousewheel = null;
		document.removeEventListener('DOMMouseScroll', onMouseWheel, false);	
		document.onkeydown = null;
		document.onkeyup = null;
		
		var game = new Array(map.entities.length-grid.length);
		var index = 0;
		map.entities.each(function(entity) {
			game[index] = entity.clone();
			index++;
		});
		game.editor = editor_resume;
		keys = new Hash();
		engine_resume(game);
		return;
	}

	// load models
	if (map.models.length > 0 && adding.length == 0) {		
		map.models.each(function(model) {
			adding.push(Entity(model,0,0,1.1));
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
	grid[0].x = camera.x;
	grid[1].y = camera.y;
	grid[2].x = camera.x-(camera.x % 100);
	grid[2].y = camera.y-(camera.y % 100);
	grid[3].x = camera.x-(camera.x % 100);
	grid[3].y = camera.y-(camera.y % 100);
	
	// change into adding mode
	if (keys.get('32')) {
		mode = Modes.ADD;
	}
	
	// change into moving mode
	if (keys.get('89') && selection.length > 0) {
		mode = Modes.MOVE;
	}
	
	// delete selection
	if (keys.get('88')) {
		selection.each(function(entity) {
			map.entities = map.entities.without(entity.target);
		});
		selection.length = 0;
	}
	
	// moving adding elements along the cursor
	if (mode == Modes.ADD) {
		var frame_per_line = 3;
		var framesize = 128;
		var framespace = framesize + 30;
		
		for (var i=0; i<adding.length; i++) {
			var entity = adding[i];
			
			var x = (i % frame_per_line) - Math.floor(frame_per_line / 2);
			var y = Math.floor(i / frame_per_line);
			
			entity.y = -y * framespace / camera.zoom + camera.y;
			entity.x = x * framespace * Math.max(1, 1-Math.abs(entity.y)/480) / camera.zoom + camera.x;
			var sizeFactor = Math.min(1, Math.min(framesize / entity.model.texture.width, framesize / entity.model.texture.height)) / camera.zoom;
			entity.width = entity.model.texture.width*sizeFactor;
			entity.height = entity.model.texture.height*sizeFactor;
			entity.layer = 3;
			entity.color = { "r":1,"g":1,"b":1,"a":1};
		}
	}
	
	// moving selection along the cursor
	if (mode == Modes.MOVE && selection.length > 0) {
		var target = getSpacePosition(mouse);
		
		var average = {"x":0,"y":0};
		selection.each(function(entity) {
			average.x += entity.x;
			average.y += entity.y;
		});
		average.x /= selection.length;
		average.y /= selection.length;
		
		
		selection.each(function(entity) {
			entity.x += target.x - average.x;
			entity.y += target.y - average.y;
			entity.target.x = entity.x;
			entity.target.y = entity.y;
		});
		
		var dist = {}
		selection.each(function(element) {
			map.entities.each(function(entity) {
				if (entity.target)
					return;			
				var distx = Math.abs(entity.x - element.target.x) - (entity.width + element.target.width) / 2;
				var disty = Math.abs(entity.y - element.target.y) - (entity.height + element.target.height) / 2;
				if (Math.abs(distx) <= 10 && disty < 0 && (!dist.x || Math.abs(distx) < Math.abs(dist.x))) {
					if (entity.x < element.target.x) distx = -distx;
					dist.x = distx;
				}
				if (Math.abs(disty) <= 10 && distx < 0 && (!dist.y || Math.abs(disty) < Math.abs(dist.y))) {
					if (entity.y < element.target.y) disty = -disty;
					dist.y = disty;
				}
			});
		});
		if (dist.x) {
			selection.each(function(entity) {
					entity.x += dist.x;
					entity.target.x = entity.x;
			});
		}
		if (dist.y) {
			selection.each(function(entity) {
					entity.y += dist.y;
					entity.target.y = entity.y;
			});
		}
	}
	
	var drawable = map.entities.concat(selection.concat(grid));
	if (mode == Modes.ADD)
		drawable = drawable.concat(adding);

	graphinc_draw(camera, drawable, {"r":0.3,"g":0.3,"b":0.3,"a":1});
	
	setTimeout(model_editor_main, 0);
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
				if (Math.abs(entity.x - mouse.x) <= entity.width/2 &&
					Math.abs(entity.y - mouse.y) <= entity.height/2 &&
					(!target || entity.layer >= target.layer)) {
					target = entity;
				}
			});
			
			if (!keys.get('17')) {
				selection.each(function(entity) {
					delete entity.target.selection;
					delete entity.target.oldx;
					delete entity.target.oldy;
				});
				selection.length = 0;
			}
			
			if (target) {
				var frame = Entity(frameMesh, target.x, target.y, 2, target.width, target.height, {"r":1,"g":1,"b":0,"a":1});
				frame.target = target;
				target.selection = frame;
				target.oldx = target.x;
				target.oldy = target.y;
				selection.push(frame);
			}
			break;
		}
	
		case Modes.MOVE: {
			selection.each(function(entity) {
				delete entity.target.selection;
				delete entity.target.oldx;
				delete entity.target.oldy;
			});
			selection.length = 0;
			mode = Modes.EDIT;
			break;
		}
		case Modes.ADD: {		
			adding.each(function(entity) {
				if (Math.abs(entity.x - mouse.x) < entity.width/2 && 
					Math.abs(entity.y - mouse.y) < entity.height/2) {
					selection.each(function(entity) {
						delete entity.target.selection;
						delete entity.target.oldx;
						delete entity.target.oldy;
					});
					selection.length = 0;
					
					var clone = entity.clone();
					clone.width = clone.model.texture.width;
					clone.height = clone.model.texture.height;
					var frame = Entity(frameMesh, clone.x, clone.y, 2, clone.width, clone.height, {"r":1,"g":1,"b":0,"a":1});
					frame.target = clone;
					clone.selection = frame;
					selection.push(frame);
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
	selection.each(function(entity) {
		if (typeof entity.target.oldx != "undefined" && typeof entity.target.oldy != "undefined") {
			entity.target.x = entity.target.oldx;
			entity.target.y = entity.target.oldy;
			entity.x = entity.target.x;
			entity.y = entity.target.y;
		} else {
			map.entities = map.entities.without(entity.target);
			selection = selection.without(entity);
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
			adding.each(function(entity) {
				entity.y += delta * 100;
			});
			break;
		}
	}
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
	
	var model = {
		"xaxis": {
			"name": "_xaxis",
			"mesh": graphic_mesh(gl.LINES, xaxis_vertices, null, xaxis_indices),
			"texture": textureWhite
		},
		"yaxis": {
			"name": "_yaxis",
			"mesh": graphic_mesh(gl.LINES, yaxis_vertices, null, yaxis_indices),
			"texture": textureWhite
		},
		"small": {
			"name": "_smallgrid",
			"mesh": graphic_mesh(PRIMITIVE.LINES, small_grid_vertices, null, small_grid_indices),
			"texture": textureWhite
		},
		"big": {
			"name": "_biggrid",
			"mesh": graphic_mesh(PRIMITIVE.LINES, big_grid_vertices, null, big_grid_indices),
			"texture": textureWhite
		}
	};
	
	var grid = [
		Entity(model.xaxis, 0, 0, -1, 1, 1, {"r":1,"g":1,"b":0,"a":1}),
		Entity(model.yaxis, 0, 0, -1, 1, 1, {"r":1,"g":1,"b":0,"a":1}),
		Entity(model.small, 0, 0, -3, 1, 1, {"r":0.5,"g":0.5,"b":0.5,"a":1}),
		Entity(model.big, 0, 0, -2, 1, 1, {"r":0.6,"g":0.6,"b":0.6,"a":1})
	];
	
	return grid;
}

function Frame(entity) {
	var vertices = [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5];
	var indices = [0, 1, 1, 3, 3, 2, 2, 0];
	var mesh = graphic_mesh(PRIMITIVE.LINES, vertices, null, indices);
	
	var model = {"name": "_frame", "mesh": mesh, "texture": textureWhite };
	return model;
}