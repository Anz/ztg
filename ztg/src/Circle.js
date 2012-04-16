var Circle = Class.create(Entity, {
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
		fixtureDef.density = this.getValue(attributes.density, 1);
		fixtureDef.friction = this.getValue(attributes.friction, 0.3);
		
		// shape definition
		var shapeDef = new b2PolygonShape();
		var radius = this.getValue(attributes.diagonal, false) ? Math.sqrt(Math.pow(this.texture.width/2, 2)+Math.pow(this.texture.height/2, 2)) : (this.texture.width+this.texture.height)/4;
		shapeDef = new b2CircleShape(pixelInMeter(radius));
		shapeDef.SetLocalPosition(new b2Vec2(0, 0));
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
	}
});