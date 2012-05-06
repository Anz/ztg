var Stack = Class.create(Entity, {
	/*initialize: function(map, attributes) {
		this.map = map;
		this.onCreate(attribtues);
	},*/
	onCreate: function (attributes) {
		// hack to wait for image is loaded
		if (typeof(this.texture.width) == 'undefined') {
			var obj = this;
			setTimeout(function() {obj.onCreate(attributes);}, 100);
			return;
		}
		
		this.ttl = 0;
		
		attributes.type = this.getValue(attributes.subtype, 'Framed');
		for (var i = 0; i < this.getValue(attributes.stacksize, 0); i++) {
			attributes.y += this.texture.height;
			var entity = new global[attributes.type](this.map, attributes);
			entity.angle = 0;
			entity.framex = 0;
			entity.framey = 0;
			entity.flip = false;
			
			this.map.entities.push(entity);
		}
	}
});