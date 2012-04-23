var Switch = Class.create(Entity, {
	onCreate: function (attributes) {
		this.layer = this.getValue(attributes.layer, 0.1);
		this.speed = this.getValue(attributes.speed, 100);
	},
	onStep: function (camera) {
		if (typeof(this.opened) != 'undefined') {
			var step = Math.round((new Date().getTime() - this.opened) / this.speed);
			if (step < this.frames) {
				this.framex = step;
			} else {
				this.framex = this.frames - 1;
			}
			
			/*if (now - this.opened > 100) {
				this.framex = 1;
			}
			if (now - this.opened > 200) {
				this.framex = 2;
			}*/
		} else if (typeof(this.closed) != 'undefined') {
			var step = Math.round((new Date().getTime() - this.closed) / this.speed);
			if (step < this.frames) {
				this.framex = this.frames - step - 1;
			} else {
				this.framex = 0;
			}
			//this.framex = this.frames-(((now - this.opened)/100)%this.frames);
			/*if (now - this.closed > 100) {
				this.framex = 1;
			}
			if (now - this.closed > 200) {
				this.framex = 0;
			}*/
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