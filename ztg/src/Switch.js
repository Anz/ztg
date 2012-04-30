var Switch = Class.create(Entity, {
	onCreate: function (attributes) {
		// hack to wait for image is loaded
		if (typeof(this.texture.width) == 'undefined') {
			var obj = this;
			setTimeout(function() {obj.onCreate(attributes);}, 100);
			return;
		}
	
		this.speed = this.getValue(attributes.speed, 100);
		
		var shapeDef = new b2PolygonShape();
		shapeDef.SetAsOrientedBox(pixelInMeter(this.texture.width/this.frames)/2, pixelInMeter(this.texture.height/this.animations)/2, new b2Vec2(0, 0), 0);
		shapeDef.radius = 0;
		
		this.fixtureDef.isSensor = true;
		this.fixtureDef.shape = shapeDef;
		this.fixtureDef.filter.categoryBits = this.getValue(attributes.category, CATEGORY.SWITCH);
		this.fixtureDef.filter.maskBits = this.getValue(attributes.mask, CATEGORY.PLAYER);
		this.fixture = this.body.CreateFixture(this.fixtureDef);
	},
	onStep: function (camera) {
		if (typeof(this.opened) != 'undefined') {
			var step = Math.round((new Date().getTime() - this.opened) / this.speed);
			if (step < this.frames) {
				this.framex = step;
			} else {
				this.framex = this.frames - 1;
			}
		} else if (typeof(this.closed) != 'undefined') {
			var step = Math.round((new Date().getTime() - this.closed) / this.speed);
			if (step < this.frames) {
				this.framex = this.frames - step - 1;
			} else {
				this.framex = 0;
			}
		}
	},
	onAction: function () {
		if (typeof(this.opened) == 'undefined') {
			delete this.closed;
			this.opened = new Date().getTime();
		} else {
			delete this.opened;
			this.closed = new Date().getTime();
		}
	}
});