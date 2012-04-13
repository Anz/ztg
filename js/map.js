
var Map = Class.create({
	initialize: function() {
		this.entities = [];
		this.textures = new Hash();
		this.models = new Hash();
		this.world = new b2World(new b2Vec2(0, -9.81), true);
	},
	clone: function() {
		var map = new Map();
		map.models = this.models;
		var models = this.models;
		
		this.entities.each(function(entity) {
			var position = entity.body.GetPosition();
			map.entities.push(new Entity(map.world, entity.model, position.x, position.y, entity.body.GetAngle()));
		});
		return map;
	}
});

function loadMap(url) {
	var map = new Map();
	
	// load javascript
	var script = document.createElement('script');
	script.setAttribute("type","text/javascript");
	script.setAttribute("src", url + '.js');
	document.getElementsByTagName("head")[0].appendChild(script);

	// load json
	new Ajax.Request(url + '.json', {
		method:'get',
		asynchronous: false,
		onSuccess: function(response){
			// load file
			var file = JSON.parse(response.responseText);
			
			// load textures
			file.textures.each(function(texture) {
				map.textures.set(texture.id, texture);
			});
			
			// load models
			file.models.each(function(model) {
				model.texture = map.textures.get(model.textureid);
				model.main = window[model.id + '_main'];
				model.oncontact = window[model.id + '_oncontact'];
				model.fixedRotation = typeof(model.fixedRotation) == 'undefined' ? false : model.fixedRotation;
				model.dynamic = typeof(model.dynamic) == 'undefined' ? false : model.dynamic;
				model.bullet = typeof(model.bullet) == 'undefind' ? false: model.bullet;
				model.linearDamping = typeof(model.linearDamping) == 'undefined' ? 0 : model.linearDamping;
				model.angularDamping = typeof(model.angularDamping) == 'undefined' ? 0 : model.angularDamping;
				map.models.set(model.id, model);
			});
			
			// load entities
			file.entities.each(function(entity) {
				entity.model = map.models.get(entity.modelid);
				entity.color = {r:1,g:1,b:1,a:1};
				entity.angle = typeof(entity.angle) == 'undefined' ? 0 : entity.angle;
				entity.framex = 0;
				entity.framey = 0;
				map.entities.push(entity);
			});
		},
		onFailure: function() { 
			alert('Can not load map: ' + url); 
		}
	});
	
	return map;
}