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
		this.framex = this.getValue(attributes.frame, 0);
		this.framey = this.getValue(attributes.animation, 0);
		this.frames = this.getValue(attributes.frames <= 0 ? 1 : attributes.frames, 1);
		this.animations = this.getValue(attributes.animations <= 0 ? 1 : attributes.animations, 1);
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