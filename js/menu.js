var map;

function init() {
	map = engine_map('data/map.json');
	menu_game();
}

var editorRunning;
var entities = [];

function menu_game() {
	engine_resume(map.entities);
	
	for (var key in map.models) {
		var model = map.models[key];
		var entity = {"model":model};
		entities.push(entity);
	}
	
	editorRunning = false;
}

function menu_editor() {
	engine_pause(map.entities);
	
	editorRunning = true;
	var camera = {'x': 0, 'y': 0};
	
	var frame_per_line = 3;
	var framesize = 128;
	var framespace = 128 + 30;
	//var linewidth = frame_per_line*framesize + (frame_per_line-1)*framespace;

	for (var i=0; i<entities.length; i++) {
		var entity = entities[i];
		
		var x = (i % frame_per_line) - Math.floor(frame_per_line / 2);
		var y = Math.floor(i / frame_per_line);
		
		entity.y = -y * framespace;		
		//model.x = /*(x * (framesize+framespace) - linewidth / 2)*/ x * framespace * Math.max(1, 1-Math.abs(model.y)/480);		
		entity.x = x * framespace * Math.max(1, 1-Math.abs(entity.y)/480);		
		entity.size = Math.min(framesize / entity.model.texture.width, framesize / entity.model.texture.height);
		entity.layer = 1;
	}
	
	document.addEventListener('DOMMouseScroll', function (event) {
		if (!editorRunning)
			return;
	
		for (var i=0; i<entities.length; i++) {
			var model = entities[i];
			
			model.y += event.detail * 30;
		}
	}, false);
	
	model_editor_main(camera, entities.concat(map.entities));
}

function model_editor_main(camera, entities) {

	graphinc_draw(camera, entities, true);
	
	if (editorRunning)
		setTimeout(model_editor_main, 0, camera, entities);
}