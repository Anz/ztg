var camera = {'x': 0, 'y': 0,'zoom': 1};
var canvas;

var ZOOM_MAX = 0.2;

var mouse = {"x":0,"y":0};
var keys = {};

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
	for (var i=0; i<grid.length; i++) {
		map.entities.push(grid[i]);
	}
	
	editor_resume();
}
	
function editor_resume() {
	// register event handlers
	canvas.onmousemove = onMouseMove;
	canvas.onclick = onClick;
	canvas.oncontextmenu = onRightClick
	window.onmousewheel = onMouseWheel;
	document.addEventListener('DOMMouseScroll', onMouseWheel, false);	
	document.onkeydown = function (e) { keys[e.keyCode.toString()] = true; };
	document.onkeyup = function (e) { keys[e.keyCode.toString()] = false; };
	
	mode = Modes.EDIT;
	
	model_editor_main(camera, map.entities);
}

function model_editor_main(camera, entities) {
	// start game
	if (keys['17'] && keys['32']) {		
		canvas.onmousemove = null;
		canvas.onclick = null;
		canvas.oncontextmenu = null
		window.onmousewheel = null;
		document.removeEventListener('DOMMouseScroll', onMouseWheel, false);	
		document.onkeydown = null;
		document.onkeyup = null;
		
		var game = new Array(map.entities.length-grid.length);
		var index = 0;
		for (var i=0; i<map.entities.length; i++) {
			var entity = map.entities[i];
			if (grid.indexOf(entity) != -1)
				continue;
			game[index] = entity.clone();
			index++;
		}
		game.editor = editor_resume;
		
		engine_resume(game);
		return;
	}

	// load models
	if (map.models.length > 0 && adding.length == 0) {		
		for (var i=0; i<map.models.length; i++) {
			var model = map.models[i];
			adding.push(Entity(model,0,0,1.1,null,null));
		}
	}

	// camera moving
	if (keys['87']) camera.y += 20 / camera.zoom;
	if (keys['65']) camera.x -= 20 / camera.zoom;
	if (keys['83']) camera.y -= 20 / camera.zoom;
	if (keys['68']) camera.x += 20 / camera.zoom;
	
	// reset camera
	if (keys['226']) {
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
	if (keys['32']) {
		mode = Modes.ADD;
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
			entity.size = Math.min(1, Math.min(framesize / entity.model.texture.width, framesize / entity.model.texture.height)) / camera.zoom;
			entity.layer = 1.1;
			entity.color = { "r":1,"g":1,"b":1,"a":1};
		}
	}
	
	// moving selection along the cursor
	if (mode == Modes.MOVE) {
		var target = getSpacePosition(mouse);
		for (var i=0; i<selection.length; i++) {
			var entity = selection[i];
			entity.x = target.x;
			entity.y = target.y;
		}
		
		if (selection.length == 1) {
			var element = selection[0];
			for (var i=0; i<map.entities.length; i++) {
				var entity = map.entities[i];
				var distx = Math.abs(entity.x - element.x) - (entity.model.texture.width + element.model.texture.width) / 2;
				var disty = Math.abs(entity.y - element.y) - (entity.model.texture.height + element.model.texture.height) / 2;
				if (distx >= -10 && distx <= 10 && disty <= 2) {
					if (entity.x < element.x) element.x -= distx;
					if (entity.x > element.x) element.x += distx;
				}
				if (disty >= -10 && disty <= 10 && distx <= 2) {
					if (entity.y < element.y) element.y -= disty;
					if (entity.y > element.y) element.y += disty;
				}
			}
		}
	}
	
	var drawable = entities;
	switch (mode) {
		case Modes.MOVE: drawable = drawable.concat(selection); break;
		case Modes.ADD: drawable = drawable.concat(adding); break;
	}

	graphinc_draw(camera, drawable, {"r":0.3,"g":0.3,"b":0.3,"a":1});
	
	setTimeout(model_editor_main, 0, camera, entities);
}

function onMouseMove(event) {
	mouse = getViewPosition(event);
}

function onClick(event) {	
	switch (mode) {
		case Modes.MOVE: {
			for (var i=0; i<selection.length; i++) {
				var element = selection[i];
				map.entities.push(element);
			}
			selection.length = 0;
			mode = Modes.EDIT;
			break;
		}
		case Modes.ADD: {
			var mouse = getSpacePosition(getViewPosition(event));
		
			for (var i=0; i<adding.length; i++) {
				var entity = adding[i];
				if (Math.abs(entity.x - mouse.x) < entity.size*entity.model.texture.width/ 2 && 
					Math.abs(entity.y - mouse.y) < entity.size*entity.model.texture.height / 2) {
					var clone = entity.clone();
					clone.size = 1;
					selection.push(clone);
					mode = Modes.MOVE;
					break;
				}
			}
			break;
		}
	}
	return false;
}

function onRightClick(event) {
	// dropping selection andchange back to edit
	selection.length = 0;
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
			for (var i=0; i<adding.length; i++) {
				var element = adding[i];
				element.y += delta * 100;
			}
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
	
	var texture = graphic_texture_solid(255,255,255,255);
	
	var model = {
		"xaxis": {
			"name": "_xaxis",
			"mesh": graphic_mesh(gl.LINES, xaxis_vertices, null, xaxis_indices),
			"texture": texture
		},
		"yaxis": {
			"name": "_yaxis",
			"mesh": graphic_mesh(gl.LINES, yaxis_vertices, null, yaxis_indices),
			"texture": texture
		},
		"small": {
			"name": "_smallgrid",
			"mesh": graphic_mesh(PRIMITIVE.LINES, small_grid_vertices, null, small_grid_indices),
			"texture": texture
		},
		"big": {
			"name": "_biggrid",
			"mesh": graphic_mesh(PRIMITIVE.LINES, big_grid_vertices, null, big_grid_indices),
			"texture": texture
		}
	};
	
	var grid = [
		Entity(model.xaxis, 0, 0, -1, 1, {"r":1,"g":1,"b":0,"a":1}),
		Entity(model.yaxis, 0, 0, -1, 1, {"r":1,"g":1,"b":0,"a":1}),
		Entity(model.small, 0, 0, -3, 1, {"r":0.5,"g":0.5,"b":0.5,"a":1}),
		Entity(model.big, 0, 0, -2, 1, {"r":0.6,"g":0.6,"b":0.6,"a":1})
	];
	
	return grid;
}