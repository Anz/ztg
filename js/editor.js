var camera = {'x': 0, 'y': 0,'zoom': 1};
var canvas;
var textureWhite;

var ZOOM_MAX = 0.2;

var mouse = {"x":0,"y":0};
var keys = new Hash();

var Modes = {EDIT:0,MOVE:1,ADD:2};
var mode = Modes.EDIT;
var models;
var map;

var id;

function editor_init() {
	map = new Map();
	map.load('data/map.json');
	
	canvas = $('canvas');
	
	editor_resume();
}
	
function editor_resume() {
	// register event handlers
	canvas.onmousemove = onMouseMove;
	canvas.onclick = onClick;
	canvas.oncontextmenu = onRightClick
	window.onmousewheel = onMouseWheel;
	document.addEventListener('DOMMouseScroll', onMouseWheel, false);	
	document.onkeydown = function (e) { keys.set(e.keyCode.toString(), true); };
	document.onkeyup = function (e) { keys.unset(e.keyCode.toString()); };
	
	Render.backgroundColor = {"r":0.3,"g":0.3,"b":0.3,"a":1};
	mode = Modes.EDIT;
	
	id = setInterval(model_editor_main, 1000/60);
}

function model_editor_main() {
	// start game
	if (keys.get('17') && keys.get('32')) {		
		clearInterval(id);
	
		canvas.onmousemove = null;
		canvas.onclick = null;
		canvas.oncontextmenu = null
		window.onmousewheel = null;
		document.removeEventListener('DOMMouseScroll', onMouseWheel, false);	
		document.onkeydown = null;
		document.onkeyup = null;
		
		var game = map.clone();
		keys = new Hash();
		new Game(game).start();
		return;
	}
	
	// calculate physics
	if (mode != Modes.MOVE)
		map.world.Step(1000/60, 8, 3);

	// load models
	if (!models && map.models.keys().length > 0) {
		models = new Map();
		map.models.keys().each(function(key, i) {
			var model = map.models.get(key);
						
			var frame_per_line = 3;
			var framesize = 128;
			var framespace = framesize + 30;
			
		
			var x = (i % frame_per_line) - Math.floor(frame_per_line / 2);
			var y = Math.floor(i / frame_per_line);
			
			var entity = new Entity(models.world, model, x * framespace / camera.zoom + camera.x, -y * framespace / camera.zoom + camera.y, 0);
			
			var sizeFactor = Math.min(1, Math.min(framesize / entity.model.texture.width, framesize / entity.model.texture.height)) / camera.zoom;
			entity.width = entity.model.texture.width*sizeFactor;
			entity.height = entity.model.texture.height*sizeFactor;
			entity.layer = 3;
			entity.color = { "r":1,"g":1,"b":1,"a":1};
			
			models.entities.push(entity);
		});
	}

	// camera moving
	if (keys.get('87')) camera.y += 20 / camera.zoom;
	if (keys.get('65')) camera.x -= 20 / camera.zoom;
	if (keys.get('83')) camera.y -= 20 / camera.zoom;
	if (keys.get('68')) camera.x += 20 / camera.zoom;
	
	// reset camera
	if (keys.get('226')) {
		mouse.x = 0;
		mouse.y = 0;
		camera.x = 0;
		camera.y = 0;
		camera.zoom = 1;
	}
	
	// change into adding mode
	if (keys.get('32')) {
		mode = Modes.ADD;
	}
	
	// change into moving mode
	if (keys.get('89')) {
		var count = 0;
		map.entities.each(function(entity) {
			if (!entity.selection)
				return;
			entity.oldPosition = entity.body.GetPosition();
			count++;
		});
		if (count > 0)
			mode = Modes.MOVE;
	}
	
	// delete selection
	if (keys.get('46')) {
		map.entities.each(function(entity) {
			if (!entity.selection)
				return;
			entity.destroy();
			map.entities = map.entities.without(entity);
		});
	}
	
	// moving selection along the cursor
	if (mode == Modes.MOVE) {
		var target = getSpacePosition(mouse);
		
		var center = {"x":0,"y":0};
		var count = 0;
		map.entities.each(function(entity) {
			if (!entity.selection)
				return;
			var position = entity.body.GetPosition();
			center.x += position.x;
			center.y += position.y;
			count++;
		});
		if (count > 0) {
			center.x /= count;
			center.y /= count;
			
			
			map.entities.each(function(entity) {
				if (!entity.selection)
					return;
				var position = entity.body.GetPosition();
				position.x += pixelInMeter(target.x) - center.x;
				position.y += pixelInMeter(target.y) - center.y;
				entity.body.SetPosition(position);
			});
		} else {
			mode = Modes.EDIT;
		}
	}
	
	// clear screen
	Render.clear();
	
	for (var x = ((canvas.width/2+camera.x) % 10* camera.zoom)-canvas.width/2; x <= canvas.width/2; x += 10 * camera.zoom) {
		Render.drawLine(x, -canvas.height/2, x, canvas.height/2, {"r":0.5,"g":0.5,"b":0.5,"a":1});
	}
	for (var y = ((canvas.height/2+camera.y) % (10* camera.zoom))-canvas.height/2; y <= canvas.height/2; y += 10 * camera.zoom) {
		Render.drawLine(-canvas.width/2, y, canvas.width/2, y, {"r":0.5,"g":0.5,"b":0.5,"a":1});
	}
	for (var x = ((canvas.width/2+camera.x) % (100* camera.zoom))-canvas.width/2; x <= canvas.width/2; x += 100 * camera.zoom) {
		Render.drawLine(x, -canvas.height/2, x, canvas.height/2, {"r":0.6,"g":0.6,"b":0.6,"a":1});
	}
	for (var y = ((canvas.height/2+camera.y) % (100* camera.zoom))-canvas.height/2; y <= canvas.height/2; y += 100 * camera.zoom) {
		Render.drawLine(-canvas.width/2, y, canvas.width/2, y, {"r":0.6,"g":0.6,"b":0.6,"a":1});
	}
	Render.drawLine(-camera.x*camera.zoom, -canvas.height/2, -camera.x*camera.zoom, canvas.height/2, {"r":1,"g":1,"b":0,"a":1});
	Render.drawLine(-canvas.width/2, -camera.y*camera.zoom, canvas.width/2, -camera.y*camera.zoom, {"r":1,"g":1,"b":0,"a":1});
	
	// draw entities
	map.entities.sort(function (a, b) {	return a.layer - b.layer; });
	map.entities.each(function(entity) {
		var position = entity.body.GetPosition();
		var angle = entity.body.GetAngle();
		if (!entity.width) entity.width = entity.model.texture.width;
		if (!entity.height) entity.height = entity.model.texture.height;
		if (!entity.width || !entity.height) return;
		Render.drawRect((meterInPixel(position.x)-camera.x)*camera.zoom, (meterInPixel(position.y)-camera.y)*camera.zoom, angle, entity.width*camera.zoom, entity.height*camera.zoom, entity.color, entity.model.texture);
	});
	
	// draw selection
	map.entities.each(function(entity) {
		if (!entity.selection) 
			return;
		var position = entity.body.GetPosition();
		var angle = entity.body.GetAngle();
		Render.drawFrame((meterInPixel(position.x)-camera.x)*camera.zoom, (meterInPixel(position.y)-camera.y)*camera.zoom, angle,  entity.width*camera.zoom, entity.width*camera.zoom, {"r":1,"g":1,"b":0,"a":1});
	});
	
	if (mode == Modes.ADD) {
		models.entities.each(function(entity) {
			var position = entity.body.GetPosition();
			Render.draw(entity.model.mesh, 1, entity.color, entity.model.texture, meterInPixel(position.x), meterInPixel(position.y), entity.layer, 0, entity.width, entity.height);
		});
	}
}

function onMouseMove(event) {
	mouse = getViewPosition(event);
}

function onClick(event) {
	var mouse = getSpacePosition(getViewPosition(event));

	switch (mode) {
		case Modes.EDIT: {
			var target;
			map.entities.each(function(entity) {
				if (entity.selection)
					return;
				var position = entity.body.GetPosition();
				if (Math.abs(meterInPixel(position.x) - mouse.x) <= entity.width/2 &&
					Math.abs(meterInPixel(position.y) - mouse.y) <= entity.height/2 &&
					(!target || entity.layer >= target.layer)) {
					target = entity;
				}
			});
			
			if (!keys.get('17'))
				clearSelection();
			
			if (target) {
				var position = target.body.GetPosition();
				target.selection = true;
				target.oldx = position.x;
				target.oldy = position.y;
			}
			break;
		}
	
		case Modes.MOVE: {
			map.world.ClearForces();
			map.entities.each(function(entity) {
				delete entity.selection;
				delete entity.oldx;
				delete entity.oldy;
				entity.body.SetAwake(true);
			});
			mode = Modes.EDIT;
			break;
		}
		case Modes.ADD: {
			clearSelection();
			models.entities.each(function(entity) {
				var position = entity.body.GetPosition();
				if (Math.abs(meterInPixel(position.x) - mouse.x) < entity.width/2 && 
					Math.abs(meterInPixel(position.y) - mouse.y) < entity.height/2) {					
					var clone = new Entity(map.world, entity.model, pixelInMeter(mouse.x), pixelInMeter(mouse.y), 1);
					clone.width = clone.model.texture.width;
					clone.height = clone.model.texture.height;
					clone.selection = true;
					map.entities.push(clone);
					mode = Modes.MOVE;
					throw $break;
				}
			});
			break;
		}
	}
	return false;
}

function onRightClick(event) {
	// dropping selection and change back to edit
	map.entities.each(function(entity) {
		if (!entity.selection)
			return;
		if (entity.oldPosition) {
			entity.body.SetPosition(entity.oldPosition);
			delete entity.oldPosition;
		} else {
			entity.destroy();
			map.entities = map.entities.without(entity);
		}
	});
	mode = Modes.EDIT;
	return false;
}

function onMouseWheel(event) {
	var delta = event.wheelDelta ? -event.wheelDelta/200 : event.detail/10;

	switch (mode) {
		case Modes.EDIT:
		case Modes.MOVE: {
			camera.zoom = Math.min(4, Math.max(ZOOM_MAX, camera.zoom-delta));
			break;
		}
		case Modes.ADD: {
			models.entities.each(function(entity) {
				var position = entity.body.GetPosition();
				position.y += pixelInMeter(delta * 100);
				entity.body.SetPosition(position);
			});
			break;
		}
	}
}

function clearSelection() {
	map.entities.each(function(entity) {
		delete entity.selection;
		delete entity.oldx;
		delete entity.oldy;
	});
}

function getViewPosition(e) {
	return {
		"x": e.clientX - canvas.offsetLeft - canvas.width/2,
		"y": canvas.height/2 - e.clientY + canvas.offsetTop,
	};
}

function getSpacePosition(point) {
	return {
		"x": point.x / camera.zoom + camera.x,
		"y": point.y / camera.zoom + camera.y 
	};
}