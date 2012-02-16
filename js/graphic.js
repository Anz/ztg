var gl;
var canvas;
var program;

var sprite = {};
var small_grid;
var big_grid;
var xaxis;
var yaxis;

var images = {};
var textureWhite;

function graphic_init() {
	canvas = $('canvas');
	
	gl = canvas.getContext("experimental-webgl");
	if (!gl) {
		alert("No known OpenGL context detected! Is it enabled?");
		return;
	}
	
	// set states
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.3, 0.3, 0.3, 1.0);
	
	program = graphic_shader('shader/vertex.vs', 'shader/fragment.fs');
	
	textureWhite = graphic_texture_solid(255,255,255,255);
	
	graphic_mesh_init();
}

function graphinc_draw(camera, entities, grid) {
	if (!gl) {
		graphic_init();
	}

	
	gl.enable(gl.TEXTURE_2D);
	
	graphic_load_projection();
	
	if (grid) {
		gl.clearColor(0.3, 0.3, 0.3, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// render grid
		var color = { "r":0.5,"g":0.5,"b":0.5,"a":1};
		graphic_render_mesh(small_grid, color, textureWhite, -(camera.x % 100), -(camera.y % 100), 1, 1);
		var color = { "r":0.6,"g":0.6,"b":0.6,"a":1};
		graphic_render_mesh(big_grid, color, textureWhite, -(camera.x % 100), -(camera.y % 100), 1, 1);
		var color = { "r":1,"g":1,"b":0,"a":1};
		graphic_render_mesh(xaxis, color, textureWhite, 0, -camera.y, 1, 1);
		graphic_render_mesh(yaxis, color, textureWhite, -camera.x, 0, 1, 1);
	} else{
		gl.clearColor(0, 0, 0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	
	entities.sort(
		function (a, b) {
			return a.layer - b.layer;
		});
		
	for (var i=0; i<entities.length; i++) {
		var entity = entities[i];
		
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		graphic_render_mesh(sprite, entity.color, entity.model.texture, entity.x-camera.x, entity.y-camera.y, entity.model.texture.width*entity.size, entity.model.texture.height*entity.size);
	}	
}

function graphic_render_mesh(mesh, color, texture, x, y, width, height) {
	var modelMatrix = [
		width, 0,   0,    0,
		0,   height, 0,    0,
		0,   0,   1,  0,
		x,   y,   0,    1
	];
	
	gl.uniformMatrix4fv(program.modelMatrix, false, modelMatrix);
	gl.uniform4f(program.color, color.r, color.g, color.b, color.a);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
	gl.enableVertexAttribArray(program.vertexPosition);
	gl.vertexAttribPointer(program.vertexPosition, 2, gl.FLOAT, false, 0, 0);

	// texture
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoords);
	gl.enableVertexAttribArray(program.textureCoord);
	gl.vertexAttribPointer(program.textureCoord, 2, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(program.sampler, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
	
	// draw the buffer
	gl.drawElements(mesh.type, mesh.num_indices, gl.UNSIGNED_SHORT, 0);
}

function graphic_mesh_init() {
	var sprite_vertices = [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5];
	var sprite_textureCoords = [0.0, 1.0, 1.0, 1.0,	0.0, 0.0, 1.0, 0.0];
	var sprite_indices = [0, 1, 2, 2, 1, 3];
	sprite = graphic_mesh(gl.TRIANGLES, sprite_vertices, sprite_textureCoords, sprite_indices);
	
	var width = canvas.width/2;
	var height = canvas.height/2;
	
	var xaxis_vertices = [-width,  0, width,  0];
	var xaxis_indices = [0, 1];
	xaxis = graphic_mesh(gl.LINES, xaxis_vertices, null, xaxis_indices);
	
	var yaxis_vertices = [0,  -height, 0,  height];
	var yaxis_indices = [0, 1];
	yaxis = graphic_mesh(gl.LINES, yaxis_vertices, null, yaxis_indices);
	
	// grid
	var xlimit = width + 100 - (width % 100) + 100;
	var ylimit = height + 100 - (height % 100) + 100;
	
	var small_grid_vertices = [];
	var big_grid_vertices = [];
	
	for (var i=-xlimit; i<=xlimit; i+=10) {
		var grid_vertices;
		if(Math.abs(i)  % 100 == 0) grid_vertices = big_grid_vertices;
		else grid_vertices = small_grid_vertices;
		
 		grid_vertices.push(i);
		grid_vertices.push(-ylimit);		
		grid_vertices.push(i);
		grid_vertices.push(ylimit);
	}
	
	for (var i=-ylimit; i<=ylimit; i+=10) {
		var grid_vertices;
		if (Math.abs(i) % 100 == 0) grid_vertices = big_grid_vertices;
		else grid_vertices = small_grid_vertices;
	
		grid_vertices.push(-xlimit);
		grid_vertices.push(i);		
		grid_vertices.push(xlimit);
		grid_vertices.push(i);
	}
	
	var small_grid_indices = new Array(small_grid_vertices.length/2);
	var big_grid_indices = new Array(big_grid_vertices.length/2);
	
	for (var i=0; i<small_grid_vertices.length/2; i++) {
		small_grid_indices[i] = i;
		if (i < big_grid_vertices.length/2)
			big_grid_indices[i] = i;
	}
	
	small_grid = graphic_mesh(gl.LINES, small_grid_vertices, null, small_grid_indices);
	big_grid = graphic_mesh(gl.LINES, big_grid_vertices, null, big_grid_indices);
}

function graphic_mesh(type, vertices, textureCoords, indices) {
	var mesh = {};
	mesh.type = type;

	// vertex
	mesh.vertices = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	// texture coordinates
	if (!textureCoords) {
		textureCoords = new Array(vertices.length);
	}
	
	mesh.texCoords = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoords);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
	
	// index
	mesh.indices = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	
	mesh.num_indices = indices.length;
	
	return mesh;
}

function graphic_shader(vertexUrl, fragmentUrl) {
	// create program object
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	var program = gl.createProgram();

	new Ajax.Request(vertexUrl, {
		asynchronous: 'false',
		contentType: 'x-shader/x-vertex',
		method:'get',
		onSuccess: function(response){
			gl.shaderSource(vertexShader, response.responseText);
			gl.compileShader(vertexShader);
			
			if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
				alert('vertex compile: ' +  gl.getShaderInfoLog(vertexShader));
				return null;
			}
			
				new Ajax.Request(fragmentUrl, {
					asynchronous: 'false',
					contentType: 'x-shader/x-fragment',
					method:'get',
					onSuccess: function(response){
						gl.shaderSource(fragmentShader, response.responseText);
						gl.compileShader(fragmentShader);
						var fragmentShaderSource = response.responseText;
						
						if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
							alert('fragment compile: ' + gl.getShaderInfoLog(fragmentShader));
							return null;
						}
						
						// attach our two shaders to the program
						gl.attachShader(program, vertexShader);
						gl.attachShader(program, fragmentShader);

						// linking
						gl.linkProgram(program);
						if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
							alert('linking: ' + gl.getProgramInfoLog(program));
							return;
						}
						gl.useProgram(program);
						
						program.vertexPosition = gl.getAttribLocation(program, "vertexPosition");						
						program.textureCoord = gl.getAttribLocation(program, "textureCoord");						
						program.modelMatrix = gl.getUniformLocation(program, "modelMatrix");
						program.projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
						program.color = gl.getUniformLocation(program, "uColor");
						program.sampler = gl.getUniformLocation(program, "sampler");
						
					    gl.uniform1i(program.sampler, 0);
					},
					onFailure: function() { 
						alert('Can not load vertex shader' + url); 
					}
				  });
		},
		onFailure: function() { 
			alert('Can not load vertex shader' + url); 
		}
	  });

	return program;
}


function graphic_texture(name) {
	var texture = images[name];
	
	if (texture) {
		return texture;
	}


	var texture = gl.createTexture();
	images[name] = texture;
	texture.image = new Image();
    texture.image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		texture.width = texture.image.width;
		texture.height = texture.image.height;
    }

    texture.image.src = 'img/' + name;
	
	return texture;
}

function graphic_texture_solid(r, g, b, a) {
    var data = new Uint8Array([r, g, b, a]);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return texture;
}


function graphic_load_projection() {
	var r = canvas.width/2.0;
	var l = -r;
	var t = canvas.height/2.0;
	var b = -t;
	var n = 0.0;
	var f = 1.0;
	
	var projectionMatrix = [
		2.0/(r-l),    0,            0,            0,
		0,            2.0/(t-b),    0,            0,
		0,            0,            -2.0/(f-n),   0,
		-(r+l)/(r-l), -(t+b)/(t-b), -(f+n)/(f-n), 1
	];

	gl.uniformMatrix4fv(program.projectionMatrix, false, projectionMatrix);
}