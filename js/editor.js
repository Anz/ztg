var camera = {'x': 0, 'y': 0,'zoom': 1};
var position;
var accerlation = {'x': 0, 'y': 0};
var canvas;

var ADDING_SIZE = 128;

var Modes = {NONE:0,EDIT:1,MOVE:2,ADD:3};
var mode = Modes.EDIT;
var moving = [];
var adding = [];
var map;

function editor_init() {
	map = engine_map('data/map.json');
	editor_resume();
}
	
function editor_resume() {
	canvas = $('canvas');

	// mouse move events
	canvas.onmousemove = onMouseMove;
	// mouse down events
	canvas.onmousedown = onMouseDown;
	// mouse up events
	canvas.onmouseup = onMouseUp;	
	// mouse wheel events
	window.onmousewheel = onMouseWheel;
	document.addEventListener('DOMMouseScroll', onMouseWheel, false);	
	// mouse out events
	canvas.onmouseout = onMouseOut;	
	// keyboard events
	document.onkeydown = onKeyDown;
	
	mode = Modes.EDIT;
	
	model_editor_main(camera, map.entities);
}

function model_editor_main(camera, entities) {
	if (map.models.length > 0 && adding.length == 0) {		
		for (var i=0; i<map.models.length; i++) {
			var model = map.models[i];
			adding.push(Entity(model,0,0,1.1,null,null));
		}
	}

	camera.x -= accerlation.x;
	camera.y += accerlation.y;
	accerlation.x -= accerlation.x * 0.20;
	accerlation.y -= accerlation.y * 0.20;
	
	var drawable = entities;
	switch (mode) {
		case Modes.MOVE: drawable = drawable.concat(moving); break;
		case Modes.ADD: drawable = drawable.concat(adding); break;
	}

	graphinc_draw(camera, drawable, true);
	
	if (mode != Modes.NONE)
		setTimeout(model_editor_main, 0, camera, entities);
}

function onMouseMove(event) {		
	switch (mode) {
		case Modes.EDIT: {
			if (!position)
				return;
			accerlation.x += (event.clientX - position.x) / 2;
			accerlation.y += (event.clientY - position.y) / 2;	
			position.x = event.clientX;
			position.y = event.clientY;
			break;
		}
		case Modes.MOVE: {			
			for (var i=0; i<moving.length; i++) {
				var element = moving[i];
				element.x = (event.clientX - canvas.offsetLeft - canvas.width/2) / camera.zoom  + camera.x;
				element.y =  (canvas.height/2 - event.clientY + canvas.offsetTop) / camera.zoom + camera.y;
			}
			break;
		}
	}
}

function onMouseDown(event) {	
	switch (mode) {
		case Modes.MOVE: {
			for (var i=0; i<moving.length; i++) {
				var element = moving[i];
				map.entities.push(element);
			}
			moving.length = 0;
			mode = Modes.EDIT;
			break;
		}
		case Modes.EDIT: {
			position = {"x":event.clientX,"y":event.clientY};
			break;
		}
		case Modes.ADD: {
			var mousex = (event.clientX - canvas.offsetLeft - canvas.width/2) / camera.zoom + camera.x;
			var mousey =  (canvas.height/2 - event.clientY + canvas.offsetTop) / camera.zoom + camera.y;
		
			for (var i=0; i<adding.length; i++) {
				var entity = adding[i];
				if (Math.abs(entity.x - mousex) < ADDING_SIZE / 2 && 
					Math.abs(entity.y - mousey) < ADDING_SIZE / 2) {
					moving.push(entity.clone());
					mode = Modes.MOVE;
					return;
				}
			}
			break;
		}
	}
}

function onMouseUp(event) {
	position = null;
}

function onMouseOut(event) {
	position = null;
}

function onMouseWheel(event) {
	var delta = event.wheelDelta ? -event.wheelDelta/200 : event.detail/10;

	switch (mode) {
		case Modes.EDIT:
		case Modes.MOVE: {
			camera.zoom = Math.min(2, Math.max(0.5, camera.zoom-delta));
			break;
		}
		case Modes.ADD: {
			for (var i=0; i<adding.length; i++) {
				var element = adding[i];
				element.y += delta * 200;
			}
			break;
		}
	}
}

function onKeyDown(event) {
	switch (event.keyCode) {
		case 32: { // ctrl+space
			if (!event.ctrlKey) 
				return;
				
			mode = Modes.NONE;

			canvas.onmousemove = null;
			canvas.onmousedown = null;
			canvas.onmouseup = null;
			window.onmousewheel = onMouseWheel;
			document.removeEventListener('DOMMouseScroll', onMouseWheel, false);
			canvas.onmouseout = null;
			document.onkeydown = null;
			
			var game = new Array(map.entities.length);
			
			for (var i=0; i<map.entities.length; i++) {
				game[i] = map.entities[i].clone();
			}
			game.editor = editor_resume;
			
			engine_resume(game);
			break;
		}
		case 191: { // §
			if (mode == Modes.ADD) {
				mode = Modes.EDIT;
				break;
			}
			
			var accerlation = {'x': 0, 'y': 0};
		
			mode = Modes.ADD;
			var frame_per_line = 3;
			var framesize = ADDING_SIZE;
			var framespace = ADDING_SIZE + 30;
			
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
			break;
		}
		case 27: { // esc
			if (mode = Modes.MOVE) {
				moving.length = 0;
				mode = Modes.EDIT;
			}
			break;
		}
	}
}