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

var Entity = Class.create({
	initialize: function(world, model, x, y, angle) {
		this.model = model;
		this.layer = model.layer;
		this.width = model.texture.width;
		this.height = model.texture.height;
		this.color = {"r":1,"g":1,"b":1,"a":1};
	

		


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