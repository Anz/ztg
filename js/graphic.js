var gl;
var canvas;
var program;

var mesh = {};

var images = {};

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
	
	program = graphic_shader('file:///C:/workspace/prototype/shader/vertex.vs', 'shader/fragment.fs');
	
	graphic_mesh_init();
}

function graphinc_draw(camera, entities) {
	if (!gl) {
		graphic_init();
	}

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.TEXTURE_2D);
	
	graphic_load_projection();
		
	for (var i=0; i<entities.length; i++) {
		var entity = entities[i];
		
		var modelMatrix = [
			entity.texture.width*entity.size, 0,   0,    0,
			0,   entity.texture.height*entity.size, 0,    0,
			0,   0,   1,  0,
			entity.x-camera.x,   entity.y-camera.y,   0,    1
		];
		
		gl.uniformMatrix4fv(program.modelMatrix, false, modelMatrix);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
        gl.vertexAttribPointer(program.vertexPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoords);
        gl.vertexAttribPointer(program.textureCoord, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, entity.texture);
        gl.uniform1i(program.sampler, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);		
		
		// draw the buffer
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}	
}

function graphic_mesh_init() {
	mesh.vertices = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
	var vertices = [
		-0.5,  0.5, 
		 0.5,  0.5,
		-0.5, -0.5,
		 0.5, -0.5
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	mesh.texCoords = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texCoords);
    var textureCoords = [
		0.0, 1.0,
		1.0, 1.0,
		0.0, 0.0,
		1.0, 0.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
	
	mesh.indices = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
	var indices = [
	   0, 1, 2, 2, 1, 3
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
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
						gl.enableVertexAttribArray(program.vertexPosition);
						
						program.textureCoord = gl.getAttribLocation(program, "textureCoord");
						gl.enableVertexAttribArray(program.textureCoord);
						
						program.modelMatrix = gl.getUniformLocation(program, "modelMatrix");
						program.projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
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
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		texture.width = texture.image.width;
		texture.height = texture.image.height;
    }

    texture.image.src = 'img/' + name;
	
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