var Switch = Class.create(Entity, {
	onCreate: function (attributes) {
		this.layer = this.getValue(attributes.layer, 0.1);
	},
	onStep: function (camera) {
		if (typeof(this.opened) != 'undefined') {
			var now = new Date().getTime();
			if (now - this.opened > 100) {
				this.framex = 1;
			}
			if (now - this.opened > 200) {
				this.framex = 2;
			}
		} else if (typeof(this.closed) != 'undefined') {
			var now = new Date().getTime();
			if (now - this.closed > 100) {
				this.framex = 1;
			}
			if (now - this.closed > 200) {
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