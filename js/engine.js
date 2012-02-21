var keys = {};

function engine_resume(game) {
	
	document.onkeydown = function (event) {
		if(event.altKey && event.keyCode != 18) alert(event.keyCode);
		keys[event.keyCode.toString()] = true;
	};
	
	document.onkeyup = function (event) {
		keys[event.keyCode.toString()] = false;
	};
	
	// world
	var gravity = new b2Vec2(0, -9.81);
	var doSleep = true;
	game.world = new b2World(gravity, doSleep);
	
	// ground
	var groundBodyDef = new b2BodyDef();
	groundBodyDef.position.Set(0.0, -200);
	var groundBody = game.world.CreateBody(groundBodyDef);
	
	var groundBox = new b2PolygonShape();
	groundBox.SetAsBox(50.0, 10.0);
	
	var groundFixtureDef = new b2FixtureDef();
	groundFixtureDef.shape = groundBox;
	groundFixtureDef.density = 1.0;
	groundFixtureDef.friction = 0.3;
	groundBody.CreateFixture(groundFixtureDef);
	
	// dynamic body
	var bodyDef = new b2BodyDef();
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.Set(0.0, 4.0);
	game.body = game.world.CreateBody(bodyDef);
	
	var dynamicBox = new b2PolygonShape();
	dynamicBox.SetAsBox(1.0, 1.0);
	
	var fixtureDef = new b2FixtureDef();
	fixtureDef.shape = dynamicBox;
	fixtureDef.density = 1.0;
	fixtureDef.friction = 0.3;
	game.body.CreateFixture(fixtureDef);
	game.body.SetAngle(1.5);
	
	engine_main(game);
}

function engine_main(map) {
	if (keys['27']) {
		editor_resume();
		return;
	}
	
	map.world.Step(1000/60, 8, 3);

	var camera = {'x': 0, 'y': 0, 'zoom': 2};
	
	map.each(function(entity) {
		if (entity.model.name == 'hero') {
			if (keys['87']) entity.y += 6;
			if (keys['65']) entity.x -= 6;
			if (keys['83']) entity.y -= 6;
			if (keys['68']) entity.x += 6;
			
			var position = map.body.GetPosition();
			entity.x = position.x;
			entity.y = position.y;
			
			camera.x = entity.x;
			camera.y = entity.y;
			throw $break;
		}
	});
	

	graphinc_draw(camera, map, {"r":0,"g":0,"b":0,"a":1});
	setTimeout(engine_main, 0, map);
}

function engine_map(url) {
	var map = {"entities":[],"models":[]};
	
	// create mesh
	var sprite_vertices = [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5];
	var sprite_textureCoords = [0.0, 1.0, 1.0, 1.0,	0.0, 0.0, 1.0, 0.0];
	var sprite_indices = [0, 1, 2, 2, 1, 3];
	var sprite = graphic_mesh(PRIMITIVE.TRIANGLES, sprite_vertices, sprite_textureCoords, sprite_indices);

	new Ajax.Request(url,
	  {
		method:'get',
		onSuccess: function(response){
			// load file
			var file = JSON.parse(response.responseText);
			
			// load models
			file.models.each(function(model) {
				model.mesh = sprite;
				model.texture = graphic_texture(model.image);
				map.models.push(model);
			});
			
			file.entities.each(function(entity) {
				entity.model;
				file.models.each(function(model) {
					if (entity.modelref == model.name) {
						entity.model = model;
						throw $break;
					}
				});
				if (!entity.width) entity.width = entity.model.texture.width;
				if (!entity.height) entity.height = entity.model.texture.height;
				if (!entity.color) entity.color = { "r":1,"g":1,"b":1,"a":1};
				entity.clone = function () {
					return Entity(this.model,this.x,this.y,this.layer,this.width,this.height,this.color);
				}
				
				map.entities.push(entity);
			});
		},
		onFailure: function() { 
			alert('Can not load ' + url); 
		}
	  });
	  
	  return map;
}

function Entity(model, x, y, layer, width, height, color) {
	var entity = {
		"model": model,
		"x": x ? x : 0, 
		"y": y ? y : 0,
		"width": width ? width : 0,
		"height": height ? height : 0,
		"layer": layer ? layer : 0, 
		"color": color ? color : {"r":1,"g":1,"b":1,"a":1}, 
		"clone": function () {
			return Entity(this.model,this.x,this.y,this.layer,this.width,this.height,this.color);
		}
	}
	return entity;
}