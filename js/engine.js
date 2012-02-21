var keys = new Hash();
var intervalId;

var Game = Class.create({
	initialize: function(map) {
		this.map = map;
	},
	start: function() {	
		document.onkeydown = function (event) {
			if(event.altKey && event.keyCode != 18) alert(event.keyCode);
			keys.set(event.keyCode.toString(), true);
		};
		
		document.onkeyup = function (event) {
			keys.unset(event.keyCode.toString());
		};
		
		var game = this;
		this.intervalId = setInterval(function(){ game.main(); }, 1000/60);
	},
	main: function () {
		if (keys.get('27')) {
			clearInterval(this.intervalId);
			editor_resume();
			return;
		}
		
		// physics
		this.map.world.Step(1000/60, 8, 3);

		var camera = {'x': 0, 'y': 0, 'zoom': 2};
		
		this.map.entities.each(function(entity) {
			if (!entity.body)
				return;
		
			var position = entity.body.GetPosition();
			entity.x = position.x * 37;
			entity.y = position.y * 37;
		
			if (entity.model.name == 'hero') {
				if (keys.get('65')) entity.body.ApplyImpulse(new b2Vec2(-1,1), entity.body.GetWorldCenter());
				if (keys.get('68')) entity.body.ApplyImpulse(new b2Vec2(1,1), entity.body.GetWorldCenter());
				if (keys.get('32')) entity.body.ApplyImpulse(new b2Vec2(0,200), entity.body.GetWorldCenter());
				
				camera.x = entity.x;
				camera.y = entity.y;
			}
		});
	
		// draw
		graphinc_draw(camera, this.map.entities, {"r":0,"g":0,"b":0,"a":1});
	}
});

var Map = Class.create({
	initialize: function () {
		this.entities = [];
		this.models = new Hash();
	},
	load: function(url) {
		var models = this.models;
		var entities = this.entities;
		var world = this.world;
	
		// create physic world
		var gravity = new b2Vec2(0, -9.81);
		var doSleep = true;
		this.world = new b2World(gravity, doSleep);
		
		// create mesh
		var sprite_vertices = [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5];
		var sprite_textureCoords = [0.0, 1.0, 1.0, 1.0,	0.0, 0.0, 1.0, 0.0];
		var sprite_indices = [0, 1, 2, 2, 1, 3];
		var sprite = graphic_mesh(PRIMITIVE.TRIANGLES, sprite_vertices, sprite_textureCoords, sprite_indices)
		
		new Ajax.Request(url, {
			method:'get',
			asynchronous: false,
			onSuccess: function(response){
				// load file
				var file = JSON.parse(response.responseText);
				
				// load models
				file.models.each(function(model) {
					model.mesh = sprite;
					model.texture = graphic_texture(model.image);
					models.set(model.name, model);
				});
				
				// load entities
				file.entities.each(function(entity) {
					var model = models.get(entity.modelref);
					if(!model) {
						alert('Model not defined: ' + entity.modelref);
						return;
					}
					entities.push(Entity(model, entity.x, entity.y, entity.layer, world));
				});
			},
			onFailure: function() { 
				alert('Can not load map: ' + url); 
			}
		});
		  
		return map;
	},
	clone: function() {
		var map = new Map();
		map.models = this.models;
		var models = this.models;
		
		// create physic world
		var gravity = new b2Vec2(0, -9.81);
		var doSleep = true;
		map.world = new b2World(gravity, doSleep);
		
		this.entities.each(function(entity) {
			map.entities.push(Entity(entity.model, entity.x, entity.y, entity.layer, map.world));
		});
		return map;
	}
});

function Entity(model, x, y, layer, world) {
	var entity = {
		"model": model,
		"x": x, 
		"y": y,
		"layer": layer, 
		"width": model.texture.width,
		"height": model.texture.height,
		"color": {"r":1,"g":1,"b":1,"a":1}
	}
	
	if (world && model.shapes) {
		var bodyDef = new b2BodyDef();
		if (model.dynamic) 
			bodyDef.type = b2Body.b2_dynamicBody;
		bodyDef.position.Set(x/37, y/37);
		entity.body = world.CreateBody(bodyDef);
	
		model.shapes.each(function(shape) {				
			var dynamicBox = new b2PolygonShape();

			dynamicBox.SetAsOrientedBox(shape.width/37/2, shape.height/37/2, new b2Vec2(shape.x/37, shape.y/37), 0);
			
			var fixtureDef = new b2FixtureDef();
			fixtureDef.shape = dynamicBox;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.3;
			entity.body.CreateFixture(fixtureDef);
		});
	}
	
	return entity;
}