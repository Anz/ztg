var Bullet = Class.create(Entity, {
	onCreate: function (attributes) {
		// hack to wait for image is loaded
		if (typeof(this.texture.width) == 'undefined') {
			var obj = this;
			setTimeout(function() {obj.onCreate(attributes);}, 100);
			return;
		}
	
		// fixture defintion
		var fixtureDef = new b2FixtureDef();
		fixtureDef.restitution = this.getValue(attributes.restitution, 0);
		fixtureDef.density = this.getValue(attributes.density, 0.001);
		fixtureDef.friction = this.getValue(attributes.friction, 1);
		
		// shape definition
		var shapeDef = new b2PolygonShape();
		shapeDef = new b2CircleShape(pixelInMeter(6));
		shapeDef.SetLocalPosition(new b2Vec2(0, 0));
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
		
		// add impulse/force
		if (typeof(attributes.impulse) != 'undefined') {
			this.body.ApplyImpulse(new b2Vec2(attributes.impulse.x,	attributes.impulse.y), this.body.GetPosition());
		}
		
		if (typeof(attributes.force) != 'undefined') {
			this.body.ApplyForce(new b2Vec2(attributes.force.x,	attributes.force.y), this.body.GetPosition());
		}
	},
	onStep: function (camera) {
		if (typeof(this.ttl) != 'undefined' && new Date().getTime() - this.ttl > 100) {
			this.map.world.DestroyBody(this.body);
			this.map.entities = this.map.entities.without(this);
		}
	},
	onContact: function(entity) {	
		if (entity instanceof Bullet || entity instanceof Player) {
			return;
		}
		if (typeof(this.ttl) == 'undefined') {
			this.ttl = new Date().getTime();
			entity.body.ApplyImpulse(new b2Vec2(2*(this.body.GetPosition().x<entity.body.GetPosition().x?1:-1),0), entity.body.GetPosition());
			
			if (typeof(entity.health) != 'undefined') {
				entity.health -= 34;
			}
		}
	}
});