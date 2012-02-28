var Render = Class.create({
	initialize: function(canvas) {
		this.canvas = canvas;
		this.gl = canvas.getContext("experimental-webgl");
		this.images = new Hash();
		this.backgroundColor = {"r":0,"g":0,"b":0,"a":1};
		this.PRIMITIVE = {TRIANGLES:0,LINES:1};
		if (!this.gl) {
			alert("Cannot initialize WebGL context");
			return;
		}
	
		this.program = graphic_shader('shader/vertex.vs', 'shader/fragment.fs');
		this.images.set('white', graphic_texture_solid(255,255,255,255));
	},
	clear: function clear(color) {
		this.gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
		this.gl.clear(gl.COLOR_BUFFER_BIT);
	},
	draw: function draw(mesh, color, texture, x, y, layer, angle, width, height) {
		// settings
		this.gl.enable(gl.BLEND);
		this.gl.blendFunc(gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		
		// set uniforms
		this.gl.uniform3f(program.position, x, y, layer);
		this.gl.uniform1f(program.rotation, angle);
		this.gl.uniform2f(program.size, width, height);
		
		this.gl.uniform4f(program.color, color.r, color.g, color.b, color.a);
		
		// vertices
		this.gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
		this.gl.enableVertexAttribArray(program.vertexPosition);
		this.gl.vertexAttribPointer(program.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);

		// texture
		this.gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureCoords);
		this.gl.enableVertexAttribArray(program.textureCoord);
		this.gl.vertexAttribPointer(program.textureCoord, 2, this.gl.FLOAT, false, 0, 0);

		if (!texture)
			texture = graphic_texture('white');
		this.gl.activeTexture(gl.TEXTURE0);
		this.gl.bindTexture(gl.TEXTURE_2D, texture);
		this.gl.uniform1i(program.sampler, 0);

		// indices
		this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
		
		// draw the buffer
		this.gl.drawElements(mesh.type, mesh.num_indices, gl.UNSIGNED_SHORT, 0);
	},
	createMesh: function(type, vertices, textureCoords, indices) {
		// mesh
		var mesh;
	
		var glType;
		switch (type) {
			case PRIMITIVE.TRIANGLES: glType = this.gl.TRIANGLES; break;
			case PRIMITIVE.LINES: glType = this.gl.LINES; break;
			default: alert('Not supported mesh type: ' + type);
		}

		// vertex
		mesh.vertices = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertices);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		
		// texture coordinates
		if (!textureCoords) {
			textureCoords = new Array(vertices.length);
		}
		
		mesh.textureCoords = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.textureCoords);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
		
		// index
		var glIndices = gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, glIndices);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
		
		mesh.num_indices = indices.length;
		mesh.num_vertices = vertices.length;
	},
	loadShader: function(vertexUrl, fragmentUrl) {
		var gl = this.gl;
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
							program.projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
							program.position = gl.getUniformLocation(program, "uPosition");
							program.rotation = gl.getUniformLocation(program, "uRotation");
							program.size = gl.getUniformLocation(program, "uSize");
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
				alert('Can not load shader' + url); 
			}
		  });

		return program;
	},
	loadTexture: function (name) {
		var gl = this.gl;
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
	},
	createTexture: function(r, g, b, a) {
		var data = new Uint8Array([r, g, b, a]);
		var texture = gl.createTexture();
		this.gl.bindTexture(gl.TEXTURE_2D, texture);
		this.gl.texImage2D(gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, gl.RGBA, this.gl.UNSIGNED_BYTE, data);
		this.gl.texParameteri(gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		this.gl.texParameteri(gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		texture.width = 1;
		texture.height = 1;
		return texture;
	},
	loadProjection: function (zoom) {
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

		this.gl.uniformMatrix4fv(program.projectionMatrix, false, projectionMatrix);
	},
	getInstance: function() {
		if (!Renderer)
			Renderer = new Render($('canvas'));
		return Renderer
	}
});