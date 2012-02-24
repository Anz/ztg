var gl;
var canvas;
var program;

var PRIMITIVE = {TRIANGLES:0,LINES:1};

var xaxis;
var yaxis;

var images = new Hash()

function graphic_init() {
	canvas = $('canvas');
	
	gl = canvas.getContext("experimental-webgl");
	if (!gl) {
		alert("No known OpenGL context detected! Is it enabled?");
		return;
	}
	
	program = graphic_shader('shader/vertex.vs', 'shader/fragment.fs');
	
	images.set('white', graphic_texture_solid(255,255,255,255));
}

function graphic_clear(background) {
	if (!gl) {
		graphic_init();
	}
	gl.clearColor(background.r, background.g, background.b, background.a);
	gl.clear(gl.COLOR_BUFFER_BIT);
}
/*
function graphinc_draw(camera, entities) {
	if (!gl) {
		graphic_init();
	}

	//gl.viewport(0, 0, canvas.width, canvas.height);
	
	graphic_load_projection(camera.zoom);
	
	entities.sort(
		function (a, b) {
			return a.layer - b.layer;
		});
		
	for (var i=0; i<entities.length; i++) {
		var entity = entities[i];
		if (!entity.width) entity.width = entity.model.texture.width;
		if (!entity.height) entity.height = entity.model.texture.height;
		if (!entity.width || !entity.height) continue;
		
		graphic_render_mesh(entity.model.mesh, entity.color, entity.model.texture, entity.x-camera.x, entity.y-camera.y, entity.layer, entity.width, entity.height);
	}	
}
*/
function graphic_render_mesh(mesh, color, texture, x, y, layer, angle, width, height) {
	// settings
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	var modelMatrix = [
		width, 0,   0,    0,
		0,   height, 0,    0,
		0,   0,   1,  0,
		x,   y,   0,    1
	];
	
	// set uniforms
	gl.uniform4f(program.position, x, y, layer, angle);
	
	gl.uniformMatrix4fv(program.modelMatrix, false, modelMatrix);
	gl.uniform4f(program.color, color.r, color.g, color.b, color.a);
	
	// vertices
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
	gl.enableVertexAttribArray(program.vertexPosition);
	gl.vertexAttribPointer(program.vertexPosition, 2, gl.FLOAT, false, 0, 0);

	// texture
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureCoords);
	gl.enableVertexAttribArray(program.textureCoord);
	gl.vertexAttribPointer(program.textureCoord, 2, gl.FLOAT, false, 0, 0);

	if (!texture)
		texture = graphic_texture('white');
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(program.sampler, 0);

	// indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
	
	// draw the buffer
	gl.drawElements(mesh.type, mesh.num_indices, gl.UNSIGNED_SHORT, 0);
}

var Mesh = Class.create({
	initialize: function(type, vertices, textureCoords, indices) {
		if (!gl)
			graphic_init();

		switch (type) {
			case PRIMITIVE.TRIANGLES: this.type = gl.TRIANGLES; break;
			case PRIMITIVE.LINES: this.type = gl.LINES; break;
			default: alert('Not supported mesh type: ' + type);
		}

		// vertex
		this.vertices = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		
		// texture coordinates
		if (!textureCoords) {
			textureCoords = new Array(vertices.length);
		}
		
		this.textureCoords = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		
		// index
		this.indices = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		
		this.num_indices = indices.length;
	}
});

function graphic_shader(vertexUrl, fragmentUrl) {
	if (!gl) {
		graphic_init();
	}

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
						program.position = gl.getUniformLocation(program, "uPosition");
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
	if (!gl) {
		graphic_init();
	}

	var texture = images.get(name);
	
	if (texture) {
		return texture;
	}


	var texture = gl.createTexture();
	images.set(name, texture);
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
	if (!gl) {
		graphic_init();
	}

    var data = new Uint8Array([r, g, b, a]);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	texture.width = 1;
	texture.height = 1;
    return texture;
}


function graphic_load_projection(zoom) {
	var r = canvas.width/2.0;
	var l = -r;
	var t = canvas.height/2.0;
	var b = -t;
	var n = 0.0;
	var f = 1.0;
	
	var projectionMatrix = [
		2.0/(r-l)*zoom,    0,            0,            0,
		0,            2.0/(t-b)*zoom,    0,            0,
		0,            0,            -2.0/(f-n),   0,
		-(r+l)/(r-l), -(t+b)/(t-b), -(f+n)/(f-n), 1
	];

	gl.uniformMatrix4fv(program.projectionMatrix, false, projectionMatrix);
}