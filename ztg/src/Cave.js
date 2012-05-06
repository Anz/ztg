var Cave = Class.create(Entity, {
	onCreate: function (attributes) {
		this.layer = 0.1;
	
		// shape
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsOrientedBox(pixelInMeter(2300)/2, pixelInMeter(50)/2, new b2Vec2(pixelInMeter(-900), pixelInMeter(-95)), 0);
		shapeDef.SetAsEdge(new b2Vec2(-pixelInMeter(2300)/2+pixelInMeter(-900), pixelInMeter(-65)), new b2Vec2(pixelInMeter(2300)/2-pixelInMeter(1250), pixelInMeter(-65)));
		
		// fixture
		this.fixtureDef.shape = shapeDef;
		this.body.CreateFixture(this.fixtureDef);
		
		// shape
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsEdge(new b2Vec2(-pixelInMeter(1680)/2+pixelInMeter(900), pixelInMeter(-65)), new b2Vec2(pixelInMeter(1680)/2+pixelInMeter(1180), pixelInMeter(-65)));
		
		// fixture
		this.fixtureDef.shape = shapeDef;
		this.body.CreateFixture(this.fixtureDef);
	}
});