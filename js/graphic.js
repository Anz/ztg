// singleton instance
var Render;

// instance singleton
document.observe("dom:loaded", function() {
  Render = new Renderer($('canvas'));
});

var Renderer = Class.create({
	initialize: function(canvas) {
		this.canvas = canvas;
		this.gl = canvas.getContext("experimental-webgl");
		this.images = new Hash();
		this.backgroundColor = {"r":0,"g":0,"b":0,"a":1};
		if (!this.gl) {
			alert("Cannot initialize WebGL context");
			return;
		}
	
		// setup shaders
		this.program = this.loadShader('shader/vertex.vs', 'shader/fragment.fs');
		
		// setup textures
		this.images.set('white', this.createTexture([255,255,255,255],1,1));
		
		var pixelHatchSize = 128;
		var pixelHatch = new Array(pixelHatchSize*pixelHatchSize*4);
		for (var i=0; i<pixelHatchSize*pixelHatchSize; i++) {
			if (((i % pixelHatchSize)+2*(pixelHatchSize-(i / pixelHatchSize))) % (pixelHatchSize/2) < (pixelHatchSize/4)) {
				pixelHatch[i*4+0] = 0;
				pixelHatch[i*4+1] = 0;
				pixelHatch[i*4+2] = 0;
				pixelHatch[i*4+3] = 0;
			} else {
				pixelHatch[i*4+0] = 255;
				pixelHatch[i*4+1] = 255;
				pixelHatch[i*4+2] = 255;
				pixelHatch[i*4+3] = 255;
			}
		}
		this.images.set('hatched', this.createTexture(pixelHatch,pixelHatchSize,pixelHatchSize));
		
		// setup meshes
		this.lineMesh = this.createMesh(this.gl.LINES, [-0.5, -0.5, 0.5, 0.5], null, [0, 1]);
		this.frameMesh = this.createMesh(this.gl.LINES, [-0.5,  0.5, 0.5,  0.5, -0.5, -0.5, 0.5, -0.5], null, [0, 1, 1, 3, 3, 2, 2, 0]);
		this.rectMesh = this.createMesh(this.gl.TRIANGLES, [-0.5,  0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5], [0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0], [0, 1, 2, 2, 1, 3]);
		this.pointMesh = this.createMesh(this.gl.POINTS, [0, 0], null, [0]);
	},
	clear: function (color) {
		this.gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	},
	drawPoint: function (x, y, color) {
		this.draw(this.pointMesh, color, null, x, y, 0, 0, 0, 0, 0, 1, 1);
	},
	drawLine: function (sx, sy, tx, ty, color) {
		this.draw(this.lineMesh, color, null, (sx+tx)/2, (sy+ty)/2, 0, (tx-sx), (ty-sy), 0, 0, 1, 1);
	},
	drawFrame: function (x, y, angle, width, height, color) {
		this.draw(this.frameMesh, color, null, x, y, angle, width, height, 0, 0, 1, 1);
	},
	drawRect: function (x, y, angle, width, height, color, texture) {
		this.draw(this.rectMesh, color, texture, x, y, angle, width, height, 0, 0, 1, 1);
	},
	drawImage: function (image, x, y, angle, size, color, framex, framey, framew, frameh, flip) {
		var texture = this.loadTexture(image);
		this.draw(this.rectMesh, color, texture, x, y, angle, texture.width*size*framew*(flip?-1:1), texture.height*Math.abs(size)*frameh, framex, framey, framew, frameh);
	},
	draw: function (mesh, color, texture, x, y, angle, width, height, framex, framey, framew, frameh) {	
		// settings
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		
		// set uniforms
		this.gl.uniform2f(this.program.camera, this.canvas.width, this.canvas.height);
		this.gl.uniform2f(this.program.position, x, y);
		this.gl.uniform1f(this.program.rotation, -angle);
		this.gl.uniform2f(this.program.size, width, height);
		this.gl.uniform4f(this.program.frame, framex, frameh-framey-1, framew, frameh);
		
		this.gl.uniform4f(this.program.color, color.r, color.g, color.b, color.a);
		
		// vertices
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertices);
		this.gl.enableVertexAttribArray(this.program.vertexPosition);
		this.gl.vertexAttribPointer(this.program.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);

		// texture
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.textureCoords);
		this.gl.enableVertexAttribArray(this.program.textureCoord);
		this.gl.vertexAttribPointer(this.program.textureCoord, 2, this.gl.FLOAT, false, 0, 0);

		if (!texture)
			texture = this.loadTexture('white');
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		this.gl.uniform1i(this.program.sampler, 0);

		// indices
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
		
		// draw the buffer
		this.gl.drawElements(mesh.type, mesh.num_indices, this.gl.UNSIGNED_SHORT, 0);
	},	
	createMesh: function(type, vertices, textureCoords, indices) {
		// mesh
		var mesh = {};
		mesh.type = type;

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
		mesh.indices = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
		
		mesh.num_indices = indices.length;
		mesh.num_vertices = vertices.length;
		
		return mesh;
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
							program.camera = gl.getUniformLocation(program, "uCamera");
							program.position = gl.getUniformLocation(program, "uPosition");
							program.rotation = gl.getUniformLocation(program, "uRotation");
							program.size = gl.getUniformLocation(program, "uSize");
							program.color = gl.getUniformLocation(program, "uColor");
							program.frame = gl.getUniformLocation(program, "uTextureCoord");
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
		var texture = this.images.get(name);
		
		if (texture) {
			return texture;
		}	
		
		var texture = gl.createTexture();
		texture.name = name;
		texture.image = new Image();
		texture.image.onload = function() {
			texture.width = texture.image.width;
			texture.height = texture.image.height;
		
			/*if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
				// Scale up the texture to the next highest power of two dimensions.
				var canvas = document.createElement("canvas");
				canvas.width = nextHighestPowerOfTwo(image.width);
				canvas.height = nextHighestPowerOfTwo(image.height);
				var ctx = canvas.getContext("2d");
				ctx.drawImage(image, 0, 0, image.width, image.height);
				image = canvas;
			}
			
			texture.width = texture.image.efffectivwidth;
			texture.height = texture.image.height;*/
		
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		}

		texture.image.src = 'img/' + name;
		this.images.set(name, texture);
		
		return texture;
	},
	createTexture: function(pixels,width,height) {
		var data = new Uint8Array(pixels);
		var texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		texture.width = width;
		texture.height = height;
		return texture;
	}
});

/*function isPowerOfTwo(x) {
    return (x & (x - 1)) == 0;
}
 
function nextHighestPowerOfTwo(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
}*/