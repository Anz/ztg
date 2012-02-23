var keys = new Hash();

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
			if (entity.model.name == 'hero') {
				if (keys.get('65')) entity.body.ApplyImpulse(new b2Vec2(-1,0), entity.body.GetWorldCenter());
				if (keys.get('68')) entity.body.ApplyImpulse(new b2Vec2(1,0), entity.body.GetWorldCenter());
				if (keys.get('32')) entity.body.ApplyImpulse(new b2Vec2(0,200), entity.body.GetWorldCenter());
				var position = entity.body.GetPosition();
				camera.x = meterInPixel(position.x);
				camera.y = meterInPixel(position.y);
			}
		});
	
		// draw
		graphic_clear({"r":0,"g":0,"b":0,"a":1});
		graphic_load_projection(camera.zoom);
		
		this.map.entities.sort(function (a, b) { return a.layer - b.layer; });
		this.map.entities.each(function(entity) {
			var position = entity.body.GetPosition();
			if (!entity.width) entity.width = entity.model.texture.width;
			if (!entity.height) entity.height = entity.model.texture.height;
			if (!entity.width || !entity.height) return;
			graphic_render_mesh(entity.model.mesh, entity.color, entity.model.texture, meterInPixel(position.x)-camera.x, meterInPixel(position.y)-camera.y, entity.width, entity.height);
		});
		
		//graphinc_draw(camera, this.map.entities, {"r":0,"g":0,"b":0,"a":1});
	}
});

var Map = Class.create({
	initialize: function() {
		this.entities = [];
		this.models = new Hash();
		this.world = new b2World(new b2Vec2(0, -9.81), true);
	},
	load: function(url) {
		var models = this.models;
		var entities = this.entities;
		var world = this.world;
		
		// create mesh
		var sprite_vertices = [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5];
		var sprite_textureCoords = [0.0, 1.0, 1.0, 1.0,	0.0, 0.0, 1.0, 0.0];
		var sprite_indices = [0, 1, 2, 2, 1, 3];
		var sprite = new Mesh(PRIMITIVE.TRIANGLES, sprite_vertices, sprite_textureCoords, sprite_indices);
		
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
					entities.push(new Entity(world, model, entity.x, entity.y, entity.layer));
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
		
		this.entities.each(function(entity) {
			var position = entity.body.GetPosition();
			map.entities.push(new Entity(map.world, entity.model, meterInPixel(position.x), meterInPixel(position.y), entity.layer));
		});
		return map;
	}
});

var Entity = Class.create({
	initialize: function(world, model, x, y, layer) {
		this.model = model;
		this.layer = layer;
		this.width = model.texture.width;
		this.height = model.texture.height;
		this.color = {"r":1,"g":1,"b":1,"a":1};
	
		// physical body
		var bodyDef = new b2BodyDef();
		if (model.dynamic) 
			bodyDef.type = b2Body.b2_dynamicBody;
		bodyDef.position.Set(pixelInMeter(x), pixelInMeter(y));
		this.body = world.CreateBody(bodyDef);
		var body = this.body;
		model.shapes.each(function(shape) {
			var shapeDef = new b2PolygonShape();

			shapeDef.SetAsOrientedBox(pixelInMeter(shape.width)/2, pixelInMeter(shape.height)/2, new b2Vec2(pixelInMeter(shape.x), pixelInMeter(shape.y)), 0);
			
			var fixtureDef = new b2FixtureDef();
			fixtureDef.shape = shapeDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.3;
			body.CreateFixture(fixtureDef);
		});
	},
	destroy: function() {
		this.body.GetWorld().DestroyBody(this.body);
	}
});

var Model = Class.create({
	initialize: function(name, image, mesh) {
		this.name = name;
		this.image = image;
		this.texture = graphic_texture(image);
		this.mesh = mesh;
		this.dynamic = false;
		this.shapes = [];
	}
});

function pixelInMeter(pixel) {
	return pixel / 37;
}

function meterInPixel(meter) {
	return meter * 37;
}