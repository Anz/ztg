var Zombie = Class.create(Entity, {
	onCreate: function (attributes) {
		// animation counter
		this.ani = 0;
	
		// fixture defintion
		var fixtureDef = new b2FixtureDef();
		fixtureDef.restitution = this.getValue(attributes.restitution, 0);
		fixtureDef.density = this.getValue(attributes.density, 4.2);
		fixtureDef.friction = this.getValue(attributes.friction, 17);
		fixtureDef.filter.categoryBits = CATEGORY.ENEMY;
		fixtureDef.filter.maskBits = 0x00FF ^ CATEGORY.ENEMY;
	
		// box shape definition
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsOrientedBox(pixelInMeter(12)/2, pixelInMeter(52)/2, new b2Vec2(0, pixelInMeter(5)), 0);
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
		
		// circle top shape definition
		var shapeDef = new b2PolygonShape();
		shapeDef = new b2CircleShape(pixelInMeter(6));
		shapeDef.SetLocalPosition(new b2Vec2(0, pixelInMeter(35)));
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
		
		// circle bottom shape definition
		var shapeDef = new b2PolygonShape();
		shapeDef = new b2CircleShape(pixelInMeter(6));
		shapeDef.SetLocalPosition(new b2Vec2(0, pixelInMeter(-20)));
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
		
		this.k = 0;
	},
	onStep: function (camera) {
	
		var john;
		this.map.entities.each(function(entity) {
			if (entity instanceof Player) {
				john = entity;
			}
		});
		
		if (typeof(this.health) == 'undefined') {
			this.health = 100;
		}
		
		if (this.health <= 0) {
			var position = this.body.GetPosition();
			this.map.world.DestroyBody(this.body);
			this.map.entities = this.map.entities.without(this);
			
			var head = new Framed(this.map, {
				shape: 'circle',
				texture: "zombie_head.png", 
				x: meterInPixel(position.x), 
				y: meterInPixel(position.y+0.7), 
				dynamic: true,
				category: CATEGORY.LIMB,
				mask: CATEGORY.MAP|CATEGORY.PLAYER|CATEGORY.ENEMY|CATEGORY.LIMB
			});
			head.ttl = 3000;
			head.framex = 0;
			head.framey = 0;
			head.flipx = false;
			
			var body = new Framed(this.map, {
				texture: "zombie_body.png", 
				x: meterInPixel(position.x), 
				y: meterInPixel(position.y), 
				dynamic: true,
				category: CATEGORY.LIMB,
				mask: CATEGORY.MAP|CATEGORY.PLAYER|CATEGORY.ENEMY|CATEGORY.LIMB
			});
			body.ttl = 3000;
			body.framex = 0;
			body.framey = 0;
			body.flipx = false;
			
			var leg = new Framed(this.map, {
				texture: "zombie_leg.png", 
				x: meterInPixel(position.x), 
				y: meterInPixel(position.y-0.5), 
				dynamic: true,
				category: CATEGORY.LIMB,
				mask: CATEGORY.MAP|CATEGORY.PLAYER|CATEGORY.ENEMY|CATEGORY.LIMB
			});
			leg.ttl = 3000;
			leg.framex = 0;
			leg.framey = 0;
			leg.flipx = false;
			this.map.entities.push(leg);
		}
		
		var factor = this.body.GetPosition().x < john.body.GetPosition().x ? 1 : -1;
		this.flipx = factor == -1 ? true : false;


		this.framex = Math.round(this.k);
		if (Math.abs(this.body.GetLinearVelocity().x) < 2) {
			this.body.ApplyImpulse(new b2Vec2(factor*2,0), this.body.GetPosition());
		}
		this.k += 0.15;
	}
});