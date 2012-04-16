var Stack = Class.create(Entity, {
	onCreate: function (attributes) {
		// hack to wait for image is loaded
		if (typeof(this.texture.width) == 'undefined') {
			var obj = this;
			setTimeout(function() {obj.onCreate(attributes);}, 100);
			return;
		}

		// shape
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsOrientedBox(pixelInMeter(this.texture.width)/2, pixelInMeter(this.texture.height)/2, new b2Vec2(0, 0), 0);
		shapeDef.radius = 10;
		
		// fixture
		var fixtureDef = new b2FixtureDef();
		fixtureDef.shape = shapeDef;
		fixtureDef.restitution = this.getValue(attributes.restitution, 0);
		fixtureDef.density = this.getValue(attributes.density, 1);
		fixtureDef.friction = this.getValue(attributes.friction, 0.3);
		this.body.CreateFixture(fixtureDef);
		
		//attributes.type = attributes.subtype;
		for (var i = 0; i < this.getValue(attributes.stacksize, 1) - 1; i++) {
			attributes.y += this.texture.height;
			var entity = new global['Circle'](this.map, attributes);
			entity.angle = 0;
			entity.framex = 0;
			entity.framey = 0;
			entity.flip = false;
			
			this.map.entities.push(entity);
		}
	}
});