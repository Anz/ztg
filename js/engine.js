var Game = Class.create({
	initialize: function(map) {
		this.map = map;
		this.camera = {'x': 0, 'y': 0,'zoom': 2};
	},
	start: function() {		
		Render.backgroundColor = {"r":0,"g":0,"b":0,"a":1};
		
		var game = this;
		this.intervalId = setInterval(function(){ game.main(); }, 1000/60);
	},
	main: function () {
		// physic
		this.game.physic();
		
		// draw
		this.game.drawEntities();
		
		// scripting
		this.game.script();
	},
	drawEntities: function () {
		var camera = this.camera;
		
		// sort entities
		this.map.entities.sort(function (a, b){ return a.layer - b.layer; });
	
		this.map.entities.each(function(entity) {		
			var position = entity.body.GetPosition();
			var angle = entity.body.GetAngle();
			
			var frameWidth = entity.texture.width/entity.frames;
			var frameHeight = entity.texture.height/entity.animations;
			
			Render.drawImage(
				entity.texture, 
				entity.color, 
				meterInPixel(position.x)-camera.x, 
				meterInPixel(position.y)-camera.y,
				entity.framex*frameWidth, 
				entity.framey*frameHeight,
				frameWidth,
				frameHeight,
				angle,
				camera.zoom);
		});
	},
	physic: function() {
		this.map.world.Step(1/30, 8, 3);
	},
	script: function() {
		var camera = this.camera;
	
		this.map.entities.each(function(entity) {
			// step
			entity.onPrestep(camera);
			
			// contact
			for (var contact = entity.body.GetContactList(); contact; contact = contact.next) {						
				entity.onContact(contact.other.GetUserData());
			}
		});
	}
});

function pixelInMeter(pixel) {
	return pixel / 37;
}

function meterInPixel(meter) {
	return meter * 37;
}