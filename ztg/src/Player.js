var Player = Class.create(Entity, {
	onCreate: function (attributes) {
		// animation counter
		this.ani = 0;
	
		// fixture defintion
		var fixtureDef = new b2FixtureDef();
		fixtureDef.restitution = this.getValue(attributes.restitution, 0);
		fixtureDef.density = this.getValue(attributes.density, 4);
		fixtureDef.friction = this.getValue(attributes.friction, 15);
		fixtureDef.filter.categoryBits = this.getValue(attributes.category, CATEGORY.PLAYER);
		fixtureDef.filter.maskBits = this.getValue(attributes.mask, 0xFFFF);
	
		// circle bottom shape definition
		var shapeDef = new b2PolygonShape();
		shapeDef = new b2CircleShape(pixelInMeter(6));
		shapeDef.SetLocalPosition(new b2Vec2(0, pixelInMeter(-20)));
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
	
		// box shape definition
		fixtureDef.friction = 0;
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsOrientedBox(pixelInMeter(12)/2, pixelInMeter(52)/2, new b2Vec2(0, pixelInMeter(5)), 0);
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
		
		// circle top shape definition
		var shapeDef = new b2PolygonShape();
		shapeDef = new b2CircleShape(pixelInMeter(6));
		shapeDef.SetLocalPosition(new b2Vec2(0, pixelInMeter(32)));
		fixtureDef.shape = shapeDef;
		this.body.CreateFixture(fixtureDef);
		
		
		this.lastShot = new Date().getTime(); 
	},
	onStep: function (camera) {	
		this.framex = Math.round(this.ani);
		if (this.framey == 1) {
			this.ani += 0.15;
			
			if (Math.abs(this.body.GetLinearVelocity().y) < 0.1) {
				this.framex = 0;
				this.framey = 0;
			}
		}
		
		var position = this.body.GetPosition();
		if (Input.keyDown.get('65') && this.body.GetLinearVelocity().x > -5) {
			this.body.ApplyImpulse(new b2Vec2(-5,0), this.body.GetWorldCenter());
			this.flipx = true;
			if (this.framey == 0) {
				this.ani += 2;
			}
		}
		if (Input.keyDown.get('68') && this.body.GetLinearVelocity().x < 5) {
			this.body.ApplyImpulse(new b2Vec2(5,0), this.body.GetWorldCenter());
			this.flipx = false;
			if (this.framey == 0) {
				this.ani += 2;
			}
		}
		if (Input.keyDown.get('32') && this.body.GetLinearVelocity().y < 5 && Math.abs(this.body.GetLinearVelocity().y) < 0.1) {
			this.body.ApplyImpulse(new b2Vec2(0,15), this.body.GetWorldCenter());
			this.framex = 0;
			this.framey = 1;
		}
		var now = new Date().getTime();
		if (Input.keyDown.get('13') && (!this.lastShot || now - this.lastShot > 200)) {
			this.lastShot = now;
			var bullet = new Bullet(this.map, {
				texture: "bullet.png", 
				x: meterInPixel(position.x+pixelInMeter(40)*(this.flipx?-1:1)), 
				y: meterInPixel(position.y+pixelInMeter(10)), 
				dynamic: true,
				impulse: {x: 0.0006*(this.flipx?-1:1), y: 0},
				force: {x: 0, y: 0.00081}
			});
			bullet.framex = 0;
			bullet.framey = 0;
			bullet.flipx = false;

			this.map.entities.push(bullet);
		}
		if (Input.keyDown.get('70')) {
			this.map.entities.each(function(entity) {
				if (entity instanceof Switch && entity.body.GetContactList() && entity.body.GetContactList().contact.IsTouching()) {
					entity.onAction();
				}
			});
			Input.keyDown.unset('70');
		}
		
		var diffx = meterInPixel(position.x) - camera.x;
		if (Math.abs(diffx) > 20) {
			camera.x += diffx - 20 * diffx/Math.abs(diffx);
		}
		
		var diffy = meterInPixel(position.y) - (camera.y);
		/*if (diffy > 40) {
			camera.y += diffy - 40;
		} else*/ if (diffy < 0) {
			camera.y = meterInPixel(position.y);
		}
		
		//camera.x = meterInPixel(position.x);
		camera.y = meterInPixel(position.y);
	}
});