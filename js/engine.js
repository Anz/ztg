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

	var camera = {'x': 0, 'y': 0, 'zoom': 2};
	
	for (var i=0; i<map.length; i++) {
		var entity = map[i];
		if (entity.model.name == 'hero') {
			if (keys['87']) entity.y += 6;
			if (keys['65']) entity.x -= 6;
			if (keys['83']) entity.y -= 6;
			if (keys['68']) entity.x += 6;
			
			camera.x = entity.x;
			camera.y = entity.y;
			break;
		}
	}

	graphinc_draw(camera, map, {"r":0,"g":0,"b":0,"a":1});
	setTimeout(engine_main, 0, map);
}

function engine_map(url) {
	var map = {"entities":[],"models":[]};
	
	// create mesh
	var sprite_vertices = [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5];
	var sprite_textureCoords = [0.0, 1.0, 1.0, 1.0,	0.0, 0.0, 1.0, 0.0];
	var sprite_indices = [0, 1, 2, 2, 1, 3];
	sprite = graphic_mesh(PRIMITIVE.TRIANGLES, sprite_vertices, sprite_textureCoords, sprite_indices);

	new Ajax.Request(url,
	  {
		method:'get',
		onSuccess: function(response){
			// load file
			var file = JSON.parse(response.responseText);
			
			// load models
			for (var i=0; i<file.models.length; i++) {
				var model = file.models[i];
				model.mesh = sprite;
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