
global = this;

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
	
	// head element
	var elementHead = document.getElementsByTagName("head")[0];
	
	// load javascript
	var script = document.createElement('script');
	script.setAttribute("type","text/javascript");
	script.setAttribute("src", url + '.js');
	elementHead.appendChild(script);

	// load json
	new Ajax.Request(url + '.json', {
		method:'get',
		asynchronous: false,
		onSuccess: function(response){
			// load file
			var file = JSON.parse(response.responseText);
			
			// load javascript
			file.types.each(function(type) {
				new Ajax.Request('ztg/src/' + type + '.js', {
					method:'get',
					asynchronous: false,
					onSuccess: function(response){	
						var script = document.createElement('script');
						script.type = "text/javascript";
						script.text = response.responseText;
						elementHead.appendChild(script);
					}
				});
			});
			
			// load entities
			file.entities2.each(function(entityDef) {
				var entity = new this[entityDef.type](map, entityDef);
				entity.framex = 0;
				entity.framey = 0;
				entity.flip = false;
				
				map.entities.push(entity);
			});

		},
		onFailure: function() { 
			alert('Can not load map: ' + url); 
		}
	});
	
	return map;
}