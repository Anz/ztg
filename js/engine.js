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

function engine_pause() {
	game.running = false;
}

function engine_main(map) {
	if (!keys)
		engine_keyboard();

	var entity = map[0];
	
	var camera = {'x': 0, 'y': 0};
	
	if (entity) {
		if (keys['87']) entity.y += 10;
		if (keys['65']) entity.x -= 10;
		if (keys['83']) entity.y -= 10;
		if (keys['68']) entity.x += 10;
		
		camera.x = entity.x;
		camera.y = entity.y;
	}

	graphinc_draw(camera, map);
	if (map.running) {
		setTimeout(engine_main, 0, map);
	}
}

function engine_map(url) {
	var map = [];

	new Ajax.Request(url,
	  {
		method:'get',
		onSuccess: function(response){
			var models = JSON.parse(response.responseText);
		  
			for (var i=0; i<models.length; i++) {
				var model = models[i];
				var entity = engine_entity(model);
				map.push(entity);
			}
		},
		onFailure: function() { 
			alert('Can not load ' + url); 
		}
	  });
	  
	  return map;
}

function engine_entity(model) {
	var entity = JSON.parse(JSON.stringify(model));
	
	if (!entity.x)
		entity.x = 0;
		
	if (!entity.y)
		entity.y = 0;
		
	if (!entity.size)
		entity.size = 1.0;
		
	if (!entity.texture && entity.image)
		entity.texture = graphic_texture(entity.image);
	
	return entity;
}