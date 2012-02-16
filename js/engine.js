var keys;

function engine_keyboard() {
	keys = {};
	
	/*document.addEventListener('keypress', function (event) {
		//alert('keypress');
		keys[event.keyCode.toString()] = true;
	});
	
	document.addEventListener('keyup', function (event) {
		//alert(event.keyCode);
		keys[event.keyCode.toString() ] = false;
	});*/
	
	document.onkeydown = function (event) {
		keys[event.keyCode.toString()] = true;
	};
	
	document.onkeyup = function (event) {
		keys[event.keyCode.toString()] = false;
	};
}

function engine_resume(game) {
	game.running = true;
	
	engine_main(game);
}

function engine_pause(game) {
	game.running = false;
}

function engine_main(map) {
	if (!keys)
		engine_keyboard();

	var entity;
	for (var i=0; i<map.length; i++) {
		entity = map[i];
		if (entity.name == 'hero') {
			break;
		}
	}
	
	var camera = {'x': 0, 'y': 0};
	
	if (entity) {
		if (keys['87']) entity.y += 6;
		if (keys['65']) entity.x -= 6;
		if (keys['83']) entity.y -= 6;
		if (keys['68']) entity.x += 6;
		
		camera.x = entity.x;
		camera.y = entity.y;
	}

	graphinc_draw(camera, map, false);
	if (map.running) {
		setTimeout(engine_main, 0, map);
	}
}

function engine_map(url) {
	var map = {"entities":[],"models":[]};

	new Ajax.Request(url,
	  {
		method:'get',
		onSuccess: function(response){
			// load file
			var file = JSON.parse(response.responseText);
			
			// load models
			for (var i=0; i<file.models.length; i++) {
				var model = file.models[i];
				model.texture = graphic_texture(model.image);
				map.models.push(model);
			}
			
			for (var i=0; i<file.entities.length; i++) {
				var entity = file.entities[i];
				entity.model = map.models[entity.modelref];
				for (var j=0; j<file.models.length; j++) {
					var model = file.models[j];
					if (entity.modelref == model.name) {
						entity.model = model;
						break;
					}
				}
				
				if (!entity.x) entity.x = 0;
				if (!entity.y) entity.y = 0;
				if (!entity.size) entity.size = 1;
				if (!entity.layer) entity.layer = 0;
				if (!entity.color) entity.color = { "r":1,"g":1,"b":1,"a":1};
				
				map.entities.push(entity);
			}
		},
		onFailure: function() { 
			alert('Can not load ' + url); 
		}
	  });
	  
	  return map;
}