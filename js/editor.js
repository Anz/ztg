var entities = [];
var camera = {'x': 0, 'y': 0,'zoom': 1};
var position;
var accerlation = {'x': 0, 'y': 0};

var Modes = {EDIT:0,DROP:1};
var mode = 'edit';

function editor_init(map) {		
	var frame_per_line = 3;
	var framesize = 128;
	var framespace = 128 + 30;
	//var linewidth = frame_per_line*framesize + (frame_per_line-1)*framespace;

	for (var i=0; i<map.models.length; i++) {
		var model = map.models[i];
		var entity = {"model":model};
		
		var x = (i % frame_per_line) - Math.floor(frame_per_line / 2);
		var y = Math.floor(i / frame_per_line);
		
		entity.y = -y * framespace;		
		//model.x = /*(x * (framesize+framespace) - linewidth / 2)*/ x * framespace * Math.max(1, 1-Math.abs(model.y)/480);		
		entity.x = x * framespace * Math.max(1, 1-Math.abs(entity.y)/480);		
		entity.size = Math.min(framesize / entity.model.texture.width, framesize / entity.model.texture.height);
		entity.layer = 1;
		entity.color = { "r":1,"g":1,"b":1,"a":1};
		entities.push(entity);
	}
	
	document.addEventListener('DOMMouseScroll', function (event) {
		if (map.entities.running)
			return;
			
		camera.zoom = Math.min(2, Math.max(0.5, camera.zoom-event.detail/10));
	
	}, false);
	
	var canvas = $('canvas');
	canvas.onmousemove = (function (event) {
		if (map.entities.running)
			return;
			
		if (!position)
			return;
		
		accerlation.x += (event.clientX - position.x) / 2;
		accerlation.y += (event.clientY - position.y) / 2;
		
		position.x = event.clientX;
		position.y = event.clientY;
		
	});
	
	canvas.onmousedown = (function (event) {
		if (map.entities.running)
			return;
	
		position = {"x":event.clientX,"y":event.clientY};
	});

	canvas.onmouseup = (function (event) {
		if (map.entities.running)
			return;
		position = null;
	});
	
	canvas.onmouseout = (function (event) {
		if (map.entities.running)
			return;
		position = null;
	});
	
	window.onmousewheel = (function (event) {
		if (map.entities.running)
			return;
		
		camera.zoom = Math.min(2, Math.max(0.5, camera.zoom+event.wheelDelta/200));
	});
	
	document.onkeydown = function (event) {
		switch (event.keyCode) {
			case 32: if (event.ctrlKey) menu_game(); break;
		}
	};
	
	model_editor_main(camera, entities.concat(map.entities));
}

function model_editor_main(camera, entities) {

	camera.x -= accerlation.x;
	camera.y += accerlation.y;
	accerlation.x -= accerlation.x * 0.20;
	accerlation.y -= accerlation.y * 0.20;

	graphinc_draw(camera, entities, true);
	
	if (!map.entities.running)
		setTimeout(model_editor_main, 0, camera, entities);
}