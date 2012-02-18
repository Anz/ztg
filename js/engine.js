var keys = {};

function engine_resume(game) {
	
	document.onkeydown = function (event) {
		if(event.altKey && event.keyCode != 18) alert(event.keyCode);
		keys[event.keyCode.toString()] = true;
	};
	
	document.onkeyup = function (event) {
		keys[event.keyCode.toString()] = false;
	};
	
	engine_main(game);
}

function engine_main(map) {
	if (keys['27']) {
		editor_resume();
		return;
	}

	var entity;
	for (var i=0; i<map.length; i++) {
		entity = map[i];
		if (entity.name == 'hero') {
			break;
		}
	}
	
	var camera = {'x': 0, 'y': 0, 'zoom': 2};
	
	if (entity) {
		if (keys['87']) entity.y += 6;
		if (keys['65']) entity.x -= 6;
		if (keys['83']) entity.y -= 6;
		if (keys['68']) entity.x += 6;
		
		camera.x = entity.x;
		camera.y = entity.y;
	}

	graphinc_draw(camera, map, false);
	setTimeout(engine_main, 0, map);
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
				
				if (!entity.size) entity.size = 1;
				if (!entity.color) entity.color = { "r":1,"g":1,"b":1,"a":1};
				entity.clone = function () {
					return Entity(this.model,this.x,this.y,this.layer,this.size,this.color);
				}
				
				map.entities.push(entity);
			}
		},
		onFailure: function() { 
			alert('Can not load ' + url); 
		}
	  });
	  
	  return map;
}

function Entity(model, x, y, layer, size, color) {
	var entity = {
		"model": model,
		"x": x ? x : 0, 
		"y": y ? y : 0,
		"size": size ? size : 1, 
		"layer": layer ? layer : 0, 
		"color": color ? color : {"r":1,"g":1,"b":1,"a":1}, 
		"clone": function () {
			return Entity(this.model,this.x,this.y,this.layer,this.size,this.color);
		}
	}
	return entity;
}