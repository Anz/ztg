var Cave = Class.create(Entity, {
	onCreate: function (attributes) {
		this.layer = 0.1;
	
		// shape
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsOrientedBox(pixelInMeter(2300)/2, pixelInMeter(50)/2, new b2Vec2(pixelInMeter(-900), pixelInMeter(-95)), 0);
		shapeDef.SetAsEdge(new b2Vec2(-pixelInMeter(2300)/2+pixelInMeter(-900), pixelInMeter(-65)), new b2Vec2(pixelInMeter(2300)/2+pixelInMeter(-900), pixelInMeter(-65)));
		
		// fixture
		var fixtureDef = new b2FixtureDef();
		fixtureDef.shape = shapeDef;
		fixtureDef.restitution = this.getValue(attributes.restitution, 0);
		fixtureDef.density = this.getValue(attributes.density, 1);
		fixtureDef.friction = this.getValue(attributes.friction, 0.3);
		this.body.CreateFixture(fixtureDef);
		
		// shape
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsEdge(new b2Vec2(-pixelInMeter(1680)/2+pixelInMeter(1180), pixelInMeter(-65)), new b2Vec2(pixelInMeter(1680)/2+pixelInMeter(1180), pixelInMeter(-65)));
		
		// fixture
		var fixtureDef = new b2FixtureDef();
		fixtureDef.shape = shapeDef;
		fixtureDef.restitution = this.getValue(attributes.restitution, 0);
		fixtureDef.density = this.getValue(attributes.density, 1);
		fixtureDef.friction = this.getValue(attributes.friction, 0.3);
		this.body.CreateFixture(fixtureDef);
	}
});