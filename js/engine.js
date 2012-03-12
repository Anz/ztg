var Game = Class.create({
	initialize: function(map) {
		this.map = map;
		
		var contactListener = new b2ContactListener();
		contactListener.BeginContact = function (contact) {
			var entity1 = contact.GetFixtureA().GetBody().GetUserData();
			var entity2 = contact.GetFixtureB().GetBody().GetUserData();
		
			if (entity1.body.IsBullet()) {
				entity1.body.SetActive(false);
				entity2.body.ApplyImpulse(new b2Vec2(10,0), entity2.body.GetPosition());
				//map.entities = map.entities.without(entity1);
				//entity1.destroy();
			}
			if (entity2.body.IsBullet()) {
				entity2.body.SetActive(false);
				entity1.body.ApplyImpulse(new b2Vec2(10,0), entity1.body.GetPosition());
				//map.entities = map.entities.without(entity2);
				//entity2.destroy();
			}
		};
		this.map.world.SetContactListener(contactListener);
	},
	start: function() {		
		Render.backgroundColor = {"r":0,"g":0,"b":0,"a":1};
		
		var game = this;
		this.intervalId = setInterval(function(){ game.main(); }, 1000/60);
	},
	main: function () {
		if (Input.keyDown.get('27')) {
			clearInterval(this.intervalId);
			Editor.resume();
			return;
		}
		
		
		// physics
		this.map.world.Step(1.0/30.0, 8, 3);
		
		// handle collision
		/*for (var contact = this.map.world.GetContactList(); contact; contact = contact.GetNext()) {
			var entity1 = contact.GetFixtureA().GetBody().GetUserData();
			var entity2 = contact.GetFixtureB().GetBody().GetUserData();
			
			if (entity1.body.IsBullet()) {
				entity2.body.ApplyImpulse(new b2Vec2(0,10), entity2.body.GetPosition());
				this.map.entities = this.map.entities.without(entity1);
				entity1.destroy();
			}
			if (entity2.body.IsBullet()) {
				entity1.body.ApplyImpulse(new b2Vec2(0,10), entity1.body.GetPosition());
				this.map.entities = this.map.entities.without(entity2);
				entity2.destroy();
			}
		}*/

		var camera = {'x': 0, 'y': 0, 'zoom': 2};
		var map = this.map;
		this.map.entities.each(function(entity) {
			if (entity.model.name == 'hero') {
				var position = entity.body.GetPosition();
				if (Input.keyDown.get('65') && entity.body.GetLinearVelocity().x > -5) entity.body.ApplyImpulse(new b2Vec2(-5,0), entity.body.GetWorldCenter());
				if (Input.keyDown.get('68') && entity.body.GetLinearVelocity().x < 5) entity.body.ApplyImpulse(new b2Vec2(5,0), entity.body.GetWorldCenter());
				if (Input.keyDown.get('32') && entity.body.GetLinearVelocity().y < 5) {
					entity.body.ApplyImpulse(new b2Vec2(0,20), entity.body.GetWorldCenter());
					Input.keyDown.unset('32');
				}
				var now = new Date().getTime();
				if (Input.keyDown.get('13') && (!entity.lastShot || now - entity.lastShot > 200)) {
					entity.lastShot = now;
					var bullet = new Entity(map.world, map.models.get('bullet'), position.x+pixelInMeter(50), position.y+pixelInMeter(5), 0.1);
					bullet.body.ApplyImpulse(new b2Vec2(2,0), bullet.body.GetPosition());
					map.entities.push(bullet);
				}
				camera.x = meterInPixel(position.x);
				camera.y = meterInPixel(position.y)+30;
			}
		});
	
		// draw
		Render.clear();
		
		this.map.entities.sort(function (a, b) { return a.layer - b.layer; });
		this.map.entities.each(function(entity) {
			if (entity.body.IsBullet() && !entity.body.IsActive()) {
				entity.destroy();
				return;
			}
		
			var position = entity.body.GetPosition();
			var angle = entity.body.GetAngle();
			if (!entity.width) entity.width = entity.model.texture.width;
			if (!entity.height) entity.height = entity.model.texture.height;
			if (!entity.width || !entity.height) return;
			Render.drawRect((meterInPixel(position.x)-camera.x)*camera.zoom, (meterInPixel(position.y)-camera.y)*camera.zoom, angle, entity.width*camera.zoom, entity.height*camera.zoom, entity.color, entity.model.texture);
		});
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
		
		new Ajax.Request(url, {
			method:'get',
			asynchronous: false,
			onSuccess: function(response){
				// load file
				var file = JSON.parse(response.responseText);
				
				// load models
				file.models.each(function(model) {
					model.texture = Render.loadTexture(model.image);
					models.set(model.name, model);
				});
				
				// load entities
				file.entities.each(function(entity) {
					var model = models.get(entity.modelref);
					if(!model) {
						alert('Model not defined: ' + entity.modelref);
						return;
					}
					if (!entity.angle) entity.angle = 0;
					entities.push(new Entity(world, model, pixelInMeter(entity.x), pixelInMeter(entity.y), entity.angle));
				});
			},
			onFailure: function() { 
				alert('Can not load map: ' + url); 
			}
		});
	},
	clone: function() {
		var map = new Map();
		map.models = this.models;
		var models = this.models;
		
		this.entities.each(function(entity) {
			var position = entity.body.GetPosition();
			map.entities.push(new Entity(map.world, entity.model, position.x, position.y, entity.body.GetAngle()));
		});
		return map;
	}
});

var Entity = Class.create({
	initialize: function(world, model, x, y, angle) {
		this.model = model;
		this.layer = model.layer;
		this.width = model.texture.width;
		this.height = model.texture.height;
		this.color = {"r":1,"g":1,"b":1,"a":1};
	
		// physical body
		var bodyDef = new b2BodyDef();
		bodyDef.userData = this;
		if (model.fixedRotation)
			bodyDef.fixedRotation = true;
		if (model.dynamic) 
			bodyDef.type = b2Body.b2_dynamicBody;
		if (model.bullet) 
			bodyDef.bullet = model.bullet;
		if (model.linearDamping)
			bodyDef.linearDamping = model.linearDamping;
		if (model.angularDamping)
			bodyDef.angularDamping = model.angularDamping;
		bodyDef.position.Set(x, y);
		bodyDef.angle = angle;
		this.body = world.CreateBody(bodyDef);
		var body = this.body;
		model.shapes.each(function(shape) {
			var shapeDef;
			if (shape.type == 'box') {
				shapeDef = new b2PolygonShape();
				shapeDef.SetAsOrientedBox(pixelInMeter(shape.width)/2, pixelInMeter(shape.height)/2, new b2Vec2(pixelInMeter(shape.x), pixelInMeter(shape.y)), 0);
				shapeDef.radius = 10;
			} else if (shape.type == 'circle') {
				shapeDef = new b2CircleShape(pixelInMeter(shape.radius));
				shapeDef.SetLocalPosition(new b2Vec2(pixelInMeter(shape.x), pixelInMeter(shape.y)));
			} else if (shape.type == 'polygon') {
				shapeDef = new b2PolygonShape();
				var vertices = new Array(shape.vertices.length/2);
				for (var i=0; i<shape.vertices.length/2; i++) {
					vertices[i] = new b2Vec2(pixelInMeter(shape.vertices[i*2]), pixelInMeter(shape.vertices[i*2+1]));
				};
				shapeDef.SetAsVector(vertices, vertices.length);
			} else {
				alert('unknown shape type for model: ' + model.name); 
			}
			var fixtureDef = new b2FixtureDef();
			fixtureDef.shape = shapeDef;
			fixtureDef.restitution = typeof shape.restitution != 'undefined' ? shape.restitution : 0;
			fixtureDef.density = typeof shape.density != 'undefined' ? shape.density : 1;
			fixtureDef.friction = typeof shape.friction != 'undefined' ? shape.friction : 0.3;
			body.CreateFixture(fixtureDef);
		});
		
		var bodyMeshVertices = [];
		var bodyMeshIndices = [];
		
		// physical mesh
		for (var fixture = this.body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
			var shape = fixture.GetShape();
			var indexStart = bodyMeshVertices.length/2;
			if (shape.GetType() == 1) {
				var vertices = shape.GetVertices();
				bodyMeshVertices.push(meterInPixel(vertices[0].x));
				bodyMeshVertices.push(meterInPixel(vertices[0].y));
				bodyMeshVertices.push(meterInPixel(vertices[1].x));
				bodyMeshVertices.push(meterInPixel(vertices[1].y));
				for (var i=2; i<vertices.length; i++) {
					var vertex = vertices[i];
					bodyMeshVertices.push(meterInPixel(vertex.x));
					bodyMeshVertices.push(meterInPixel(vertex.y));
					
					bodyMeshIndices.push(indexStart);
					bodyMeshIndices.push(indexStart+i-1);
					bodyMeshIndices.push(indexStart+i);
				}
			} else {
				var position = shape.GetLocalPosition();
				var radius = meterInPixel(shape.GetRadius());
				bodyMeshVertices.push(meterInPixel(position.x));
				bodyMeshVertices.push(meterInPixel(position.y));
				bodyMeshIndices.push(indexStart);
				
				bodyMeshVertices.push(meterInPixel(position.x));
				bodyMeshVertices.push(radius+meterInPixel(position.y));
				bodyMeshIndices.push(indexStart+1);
				
				var numberOfVertices = 32;
				for(var i=0; i <= numberOfVertices; i++) {
					bodyMeshVertices.push(Math.sin(i/numberOfVertices*2*Math.PI)*radius+meterInPixel(position.x));
					bodyMeshVertices.push(Math.cos(i/numberOfVertices*2*Math.PI)*radius+meterInPixel(position.y));
				
					bodyMeshIndices.push(indexStart+i+2);
					if (i < numberOfVertices) {
						bodyMeshIndices.push(indexStart);
						bodyMeshIndices.push(indexStart+i+2);
					}
				}
			}
		}
		this.body.mesh = Render.createMesh(Render.gl.TRIANGLES, bodyMeshVertices, null, bodyMeshIndices);

	},
	destroy: function() {
		this.body.GetWorld().DestroyBody(this.body);
	}
});

var Model = Class.create({
	initialize: function(name, image, mesh) {
		this.name = name;
		this.image = image;
		this.texture = Render.loadTexture(image);
		this.mesh = mesh;
		this.fixedRotation = false;
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