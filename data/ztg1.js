
var f = 0;
function john_main(map, camera, entity) {
	entity.framex = Math.round(f);
	//entity.body.ApplyImpulse(new b2Vec2(5,0), entity.body.GetWorldCenter());
	if (entity.framey == 1) {
		f += 0.15;
		
		if (Math.abs(entity.body.GetLinearVelocity().y) < 0.1) {
			entity.framex = 0;
			entity.framey = 0;
		}
	}
	
	var position = entity.body.GetPosition();
	if (Input.keyDown.get('65') && entity.body.GetLinearVelocity().x > -5) {
		entity.body.ApplyImpulse(new b2Vec2(-5,0), entity.body.GetWorldCenter());
		//entity.framey = 0;
		if (entity.framey == 0) {
			f -= 0.6;
		}
	}
	if (Input.keyDown.get('68') && entity.body.GetLinearVelocity().x < 5) {
		entity.body.ApplyImpulse(new b2Vec2(5,0), entity.body.GetWorldCenter());
		//entity.framey = 0;
		if (entity.framey == 0) {
			f += 0.6;
		}
	}
	if (Input.keyDown.get('32') && entity.body.GetLinearVelocity().y < 5 && Math.abs(entity.body.GetLinearVelocity().y) < 0.1) {
		entity.body.ApplyImpulse(new b2Vec2(0,30), entity.body.GetWorldCenter());
		entity.framex = 0;
		entity.framey = 1;
	}
	var now = new Date().getTime();
	if (Input.keyDown.get('13') && (!entity.lastShot || now - entity.lastShot > 200)) {
		entity.lastShot = now;
		//var bullet = new Entity(map.world, map.models.get('bullet'), position.x+pixelInMeter(50), position.y+pixelInMeter(5), 0.1);
		var bullet = {};
		bullet.model = map.models.get('bullet');
		bullet.color = {r:1,g:1,b:1,a:1};
		bullet.angle = 0;
		bullet.framex = 0;
		bullet.framey = 0;
		bullet.body = createBodyFromModel(map.world, bullet.model, position.x+pixelInMeter(40), position.y+pixelInMeter(30), 0);
		bullet.body.SetUserData(bullet);
		
		
		bullet.body.ApplyImpulse(new b2Vec2(0.0005,0), bullet.body.GetPosition());
		bullet.body.ApplyForce(new b2Vec2(0,0.00081), bullet.body.GetPosition());
		map.entities.push(bullet);
	}
	
	var diffx =  meterInPixel(position.x) - camera.x;
	if (diffx > 100) {
		camera.x += diffx - 100;
	} else if (diffx < -100) {
		camera.x += diffx + 100;
	} 
	
	var diffy =  meterInPixel(position.y) - camera.y;
	if (diffy > 100) {
		camera.y += diffy - 100;
	} else if (diffx < -100) {
		camera.y += diffy + 100;
	} 
	//camera.y = meterInPixel(position.y)+30;
}

function john_oncontact(map, camera, entity, other) {
	//entity.framey = 0;
}

function Box_main(map, camera, entity) {
	//entity.body.ApplyImpulse(new b2Vec2(Math.random()*5-2.5,Math.random()*5-2.5), entity.body.GetPosition());
}