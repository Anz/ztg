var Animation = Class.create(Entity, {
	onCreate: function (attributes) {
		this.speed = this.getValue(attributes.speed, 1000);
		this.repeat = this.getValue(attributes.repeat, 'infinite');
		this.iteration = 0;
	},
	onStep: function (camera) {
		if (this.speed == 0) {
			return;
		}
		
		if (this.repeat != 'infinite' && this.iteration >= this.repeat) {
			this.map.world.DestroyBody(this.body);
			this.map.entities = this.map.entities.without(this);
			return;
		}
	
		var time = new Date().getTime() - this.born;
		var animation = time / this.speed;
		this.iteration = Math.round(animation/this.frames);
		this.framex = Math.round(animation) % this.frames;
	}
});