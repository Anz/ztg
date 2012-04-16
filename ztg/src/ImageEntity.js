var ImageEntity = Class.create(Entity, {
	onCreate: function (attributes) {
		this.layer = this.getValue(attributes.layer, 0.1);
	}
});