
var f = 0;
function john_main(map, camera, entity) {
	entity.framex = Math.round(f);
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
		entity.flip = true;
		if (entity.framey == 0) {
			f += 0.6;
		}
	}
	if (Input.keyDown.get('68') && entity.body.GetLinearVelocity().x < 5) {
		entity.body.ApplyImpulse(new b2Vec2(5,0), entity.body.GetWorldCenter());
		entity.flip = false;
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
		bullet.body = createBodyFromModel(map.world, bullet.model, position.x+pixelInMeter(40)*(entity.flip?-1:1), position.y+pixelInMeter(-2), 0);
		bullet.body.SetUserData(bullet);
		
		
		bullet.body.ApplyImpulse(new b2Vec2(0.0005*(entity.flip?-1:1),0), bullet.body.GetPosition());
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
	//entity.body.ApplyImpulse(new b2Vec2(0,2), entity.body.GetPosition());
	
	if (typeof(entity.health) == 'undefined') {
		entity.health = 100;
	}
	
	if (entity.health <= 0) {
		map.world.DestroyBody(entity.body);
		map.entities = map.entities.without(entity);
	}
}

function bullet_main(map, camera, entity) {
	if (typeof(entity.ttl) != 'undefined' && new Date().getTime() - entity.ttl > 100) {
		map.world.DestroyBody(entity.body);
		map.entities = map.entities.without(entity);
	}
}

function bullet_oncontact(map, camera, entity, other) {
	if (other.model.bullet || other.model.id == 'john') {
		return;
	}
	if (typeof(entity.ttl) == 'undefined') {
		entity.ttl = new Date().getTime();
		other.body.ApplyImpulse(new b2Vec2(2,0), other.body.GetPosition());
		
		if (typeof(other.health) != 'undefined') {
			other.health -= 34;
		}
	}
}


var k = 0;
function zombie_main(map, camera, entity) {
	var john;
	map.entities.each(function(entity) {
		if (entity.modelid == 'john') {
			john = entity;
		}
	});
	
	if (typeof(entity.health) == 'undefined') {
		entity.health = 100;
	}
	
	if (entity.health <= 0) {
		var position = entity.body.GetPosition();
		map.world.DestroyBody(entity.body);
		map.entities = map.entities.without(entity);
		
		
		var head = {};
		head.model = map.models.get('zombie_head');
		head.color = {r:1,g:1,b:1,a:1};
		head.angle = 0;
		head.framex = 0;
		head.framey = 0;
		head.body = createBodyFromModel(map.world, head.model, position.x, position.y+0.7, 0);
		head.body.SetUserData(head);
		map.entities.push(head);
		
		var body = {};
		body.model = map.models.get('zombie_body');
		body.color = {r:1,g:1,b:1,a:1};
		body.angle = 0;
		body.framex = 0;
		body.framey = 0;
		body.body = createBodyFromModel(map.world, head.model, position.x, position.y, 0);
		body.body.SetUserData(body);
		map.entities.push(body);
		
		var leg = {};
		leg.model = map.models.get('zombie_leg');
		leg.color = {r:1,g:1,b:1,a:1};
		leg.angle = 0;
		leg.framex = 0;
		leg.framey = 0;
		leg.body = createBodyFromModel(map.world, leg.model, position.x, position.y-0.5, 0);
		leg.body.SetUserData(leg);
		map.entities.push(leg);
	}
	
	var factor = entity.body.GetPosition().x < john.body.GetPosition().x ? 1 : -1;
	entity.flip = factor == -1 ? true : false;


	entity.framex = Math.round(k);
	entity.body.ApplyImpulse(new b2Vec2(factor*2,0), entity.body.GetPosition());
	k += 0.15;
}

function blood_main(map, camera, entity) {
	entity = {"r":1,"g":1,"b":1,"a":0};
}