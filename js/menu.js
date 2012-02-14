var game;
var map;
var models;

function init() {
	game = engine_map('data/map.json');
	map = engine_map('data/map.json');
	models = engine_map('data/models.json');
	menu_game();
}

function menu_game() {
	engine_resume(game);
	models.running = false;
}

function menu_map() {
	engine_pause(game);
	models.running = false;
}

function menu_model() {
	engine_pause(game);
	
	models.running = true;
	var camera = {'x': 0, 'y': 0};
	
	var frame_per_line = 3;
	var framesize = 128;
	var framespace = 30;
	var linewidth = frame_per_line*framesize + (frame_per_line-1)*framespace;

	for (var i=0; i<models.length; i++) {
		var model = models[i];
		
		var x = i % frame_per_line;
		var y = Math.floor(i / frame_per_line);
		
		model.y = -y * (framesize+framespace);		
		model.x = (x * (framesize+framespace) - linewidth / 2) * Math.max(1, 1-Math.abs(model.y)/480);		
		model.size = Math.min(framesize / model.texture.width, framesize / model.texture.height);
	}
	
	document.addEventListener('DOMMouseScroll', function (event) {
		if (!models.running)
			return;
	
		for (var i=0; i<models.length; i++) {
			var model = models[i];
			
			model.y += event.detail * 30;
		}
	}, false);
	
	model_editor(camera, models);
}

function model_editor(camera, models) {

	graphinc_draw(camera, models);
	
	if (models.running)
		setTimeout(model_editor, 0, camera, models);
}