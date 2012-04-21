var Game = Class.create({
	initialize: function(map) {
		this.map = map;
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

function texcb(texture) {
	alert('callback');
}

var CATEGORY = {
	MAP: 0x0001,
	PLAYER: 0x0002,
	ENEMY: 0x0004,
	BULLET: 0x0008,
	ITEM: 0x000F,
	LIMB: 0x0010
};

var Entity = Class.create({
	initialize: function(map, attributes) {
		// attributes
		this.map = map;
		this.world = map.world;
		this.layer = this.getValue(attributes.layer, 0.5);
		this.angle = this.getValue(attributes.angle, 0);
		this.frame = 0;
		this.animation = 0;
		this.frames = this.getValue(attributes.frames, 1);
		this.animations = this.getValue(attributes.animations, 1);
		this.color = this.getValue(attributes.color, {r:1,g:1,b:1,a:1});
		this.texture = Render.loadTexture(attributes.texture);
		
		// body defintion
		var bodyDef = new b2BodyDef();
		bodyDef.fixedRotation = this.getValue(attributes.fixedRotation, false);
		bodyDef.type = this.getValue(attributes.dynamic, false) ? b2Body.b2_dynamicBody : b2Body.b2_staticBody;
		bodyDef.bullet = this.getValue(attributes.bullet, false);
		bodyDef.linearDamping = this.getValue(attributes.linearDamping, 0);
		bodyDef.angularDamping = this.getValue(attributes.angularDamping, 0);
		bodyDef.position.Set(this.getValue(pixelInMeter(attributes.x), 0), this.getValue(pixelInMeter(attributes.y), 0));
		bodyDef.position.Set(this.getValue(pixelInMeter(attributes.x), 0), this.getValue(pixelInMeter(attributes.y), 0));
		bodyDef.angle = this.getValue(attributes.angle, 0);

		// body
		this.body = this.world.CreateBody(bodyDef);
		this.body.SetUserData(this);
		
		// fixture definition
		this.fixtureDef = new b2FixtureDef();
		this.fixtureDef.restitution = this.getValue(attributes.restitution, 0);
		this.fixtureDef.density = this.getValue(attributes.density, 1);
		this.fixtureDef.friction = this.getValue(attributes.friction, 0.3);
		this.fixtureDef.filter.categoryBits = this.getValue(attributes.category, 0x0001);
		this.fixtureDef.filter.maskBits = this.getValue(attributes.mask, 0xFFFF);
		this.fixtureDef.filter.groupIndex = this.getValue(attributes.group, 0);
		
		// born time
		this.born = new Date().getTime();
		
		// call subclass		
		this.onCreate(attributes);
		
		// add to map
		this.map.entities.push(this);
	},
	onCreate: function(attributes) {
	},
	onPrestep: function(camera) {
		if (typeof(this.ttl) != 'undefined') {
			if (this.color.a <= 0) {
				this.map.world.DestroyBody(this.body);
				this.map.entities = this.map.entities.without(this);
			} else{
				this.color.a = 1.0 - 1.0/this.ttl*(new Date().getTime() - this.born);
			}
		}
		this.onStep(camera);
	},
	onStep: function(camera) {
	},
	onContact: function(entity) {
	},
	onAction: function() {
	},
	getValue: function (value, defaultValue) {
		return typeof(value) != 'undefined' ? value : defaultValue;
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