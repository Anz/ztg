var Framed = Class.create(Entity, {
	onCreate: function (attributes) {
		// hack to wait for image is loaded
		if (typeof(this.texture.width) == 'undefined') {
			var obj = this;
			setTimeout(function() {obj.onCreate(attributes);}, 100);
			return;
		}

		switch (this.getValue(attributes.shape, 'box')) {
		
			// small circle
			case 'circle': {
				var shapeDef = new b2PolygonShape();
				var radius = (this.texture.width+this.texture.height)/4;
				shapeDef = new b2CircleShape(pixelInMeter(radius));
				shapeDef.SetLocalPosition(new b2Vec2(0, 0));
				this.fixtureDef.shape = shapeDef;
				this.body.CreateFixture(this.fixtureDef);
				break;
			}
			
			// big circle
			case 'bigcircle': {
				var shapeDef = new b2PolygonShape();
				var radius = Math.sqrt(Math.pow(this.texture.width/2, 2)+Math.pow(this.texture.height/2, 2));
				shapeDef = new b2CircleShape(pixelInMeter(radius));
				shapeDef.SetLocalPosition(new b2Vec2(0, 0));
				this.fixtureDef.shape = shapeDef;
				this.body.CreateFixture(this.fixtureDef);
				break;
			}
			
			// box
			case 'box': {
				var shapeDef = new b2PolygonShape();
				shapeDef.SetAsOrientedBox(pixelInMeter(this.texture.width)/2, pixelInMeter(this.texture.height)/2, new b2Vec2(0, 0), 0);
				shapeDef.radius = 0;
				
				this.fixtureDef.shape = shapeDef;
				this.body.CreateFixture(this.fixtureDef);
				break;
			}
		}
	}
});