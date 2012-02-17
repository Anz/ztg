var map;

function init() {
	map = engine_map('data/map.json');
	menu_game();
}

function menu_game() {
	engine_resume(map.entities);
}

function menu_editor() {
	engine_pause(map.entities);
	editor_init(map);
}

