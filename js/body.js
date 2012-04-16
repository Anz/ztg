
function createBodyFromModel(world, model, x, y, angle) {
	// body defintion
	var bodyDef = new b2BodyDef();
	bodyDef.fixedRotation = model.fixedRotation;
	bodyDef.type = model.dynamic ? b2Body.b2_dynamicBody : b2Body.b2_staticBody;
	bodyDef.bullet = model.bullet;
	bodyDef.linearDamping = model.linearDamping;
	bodyDef.angularDamping = model.angularDamping;
	bodyDef.position.Set(x, y);
	bodyDef.angle = angle;
	
	// body
	var body = world.CreateBody(bodyDef);
	
	// shapes
	model.shapes.each(function(shape) {
		// shape definition
		var shapeDef;
		switch (shape.type) {
			case 'box':
				shapeDef = new b2PolygonShape();
				shapeDef.SetAsOrientedBox(pixelInMeter(shape.width)/2, pixelInMeter(shape.height)/2, new b2Vec2(pixelInMeter(shape.x), pixelInMeter(shape.y)), 0);
				shapeDef.radius = 10;
				break;
				
			case 'circle':
				shapeDef = new b2CircleShape(pixelInMeter(shape.radius));
				shapeDef.SetLocalPosition(new b2Vec2(pixelInMeter(shape.x), pixelInMeter(shape.y)));
				break;
			
			case 'polygon':
				shapeDef = new b2PolygonShape();
				var vertices = new Array(shape.vertices.length/2);
				for (var i=0; i<shape.vertices.length/2; i++) {
					vertices[i] = new b2Vec2(pixelInMeter(shape.vertices[i*2]), pixelInMeter(shape.vertices[i*2+1]));
				};
				shapeDef.SetAsVector(vertices, vertices.length);
				break;
			
			default:
				return;
		}
		
		// fixture
		var fixtureDef = new b2FixtureDef();
		fixtureDef.shape = shapeDef;
		fixtureDef.restitution = typeof shape.restitution != 'undefined' ? shape.restitution : 0;
		fixtureDef.density = typeof shape.density != 'undefined' ? shape.density : 1;
		fixtureDef.friction = typeof shape.friction != 'undefined' ? shape.friction : 0.3;
		body.CreateFixture(fixtureDef);
	});
	
	return body;
}

function createMeshFromBody (body) {
	var bodyMeshVertices = [];
	var bodyMeshIndices = [];
	
	// physical mesh
	for (var fixture = body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
		var shape = fixture.GetShape();
		var indexStart = bodyMeshVertices.length/2;
		if (shape.GetType() == 1) {
			var vertices = shape.GetVertices();
			if (shape.GetVertices().length == 2) {
				bodyMeshVertices.push(meterInPixel(vertices[0].x));
				bodyMeshVertices.push(meterInPixel(vertices[0].y));
				bodyMeshVertices.push(meterInPixel(vertices[1].x));
				bodyMeshVertices.push(meterInPixel(vertices[1].y));
				bodyMeshVertices.push(meterInPixel(vertices[1].x));
				bodyMeshVertices.push(meterInPixel(vertices[1].y)-5);
				
				bodyMeshVertices.push(meterInPixel(vertices[0].x));
				bodyMeshVertices.push(meterInPixel(vertices[0].y));
				bodyMeshVertices.push(meterInPixel(vertices[1].x));
				bodyMeshVertices.push(meterInPixel(vertices[1].y)-5);
				bodyMeshVertices.push(meterInPixel(vertices[0].x));
				bodyMeshVertices.push(meterInPixel(vertices[0].y)-5);
				bodyMeshIndices.push(indexStart);
				bodyMeshIndices.push(indexStart+1);
				bodyMeshIndices.push(indexStart+2);
				bodyMeshIndices.push(indexStart+3);
				bodyMeshIndices.push(indexStart+4);
				bodyMeshIndices.push(indexStart+5);
			} else {
				bodyMeshVertices.push(meterInPixel(vertices[0].x));
				bodyMeshVertices.push(meterInPixel(vertices[0].y));
				bodyMeshVertices.push(meterInPixel(vertices[1].x));
				bodyMeshVertices.push(meterInPixel(vertices[1].y));
				for (var i=2; i<vertices.length; i++) {
					var vertex = vertices[i];
					bodyMeshVertices.push(meterInPixel(vertex.x));
					bodyMeshVertices.push(meterInPixel(vertex.y));
					
					bodyMeshIndices.push(indexStart);
					bodyMeshIndices.push(indexStart+i-1);
					bodyMeshIndices.push(indexStart+i);
				}
			}
		} else {
			var position = shape.GetLocalPosition();
			var radius = meterInPixel(shape.GetRadius());
			bodyMeshVertices.push(meterInPixel(position.x));
			bodyMeshVertices.push(meterInPixel(position.y));
			bodyMeshIndices.push(indexStart);
			
			bodyMeshVertices.push(meterInPixel(position.x));
			bodyMeshVertices.push(radius+meterInPixel(position.y));
			bodyMeshIndices.push(indexStart+1);
			
			var numberOfVertices = 32;
			for(var i=0; i <= numberOfVertices; i++) {
				bodyMeshVertices.push(Math.sin(i/numberOfVertices*2*Math.PI)*radius+meterInPixel(position.x));
				bodyMeshVertices.push(Math.cos(i/numberOfVertices*2*Math.PI)*radius+meterInPixel(position.y));
			
				bodyMeshIndices.push(indexStart+i+2);
				if (i < numberOfVertices) {
					bodyMeshIndices.push(indexStart);
					bodyMeshIndices.push(indexStart+i+2);
				}
			}
		}
	}
	
	return Render.createMesh(Render.gl.TRIANGLES, bodyMeshVertices, null, bodyMeshIndices);
}