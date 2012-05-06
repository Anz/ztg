attribute vec2 vertexPosition;
attribute vec2 textureCoord;

uniform mat4 projectionMatrix;
uniform vec2 uCamera;
uniform vec2 uPosition;
uniform float uRotation;
uniform vec2 uSize;
uniform vec4 uColor;
uniform vec4 uTextureCoord;

varying vec2 vTextureCoord;
varying vec4 vColor;

void main() {
		float right = uCamera.x/2.0;
		float left = -right;
		float top = uCamera.y/2.0;
		float bottom = -top;
		float near = 0.0;
		float far = 1.0;
		
		mat4 projectionMatrix = mat4(
			2.0/(right-left), 0, 0, 0,
			0, 2.0/(top-bottom), 0, 0,
			0, 0, -2.0/(far-near), 0,
			-(right+left)/(right-left), -(top+bottom)/(top-bottom), -(far+near)/(far-near), 1);

		mat4 positionMatrix = mat4( 
			uSize.x, 0.0, 0.0, 0.0,
			0.0, uSize.y, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			uPosition.x, uPosition.y, 0.0, 1.0 );

		mat4 rotationMatrix = mat4( 
			cos(uRotation), -sin(uRotation), 0.0, 0.0,
			sin(uRotation),  cos(uRotation), 0.0, 0.0,
			0.0,           0.0, 1.0, 0.0,
			0.0,           0.0, 0.0, 1.0 );

		gl_Position = projectionMatrix * positionMatrix * rotationMatrix * vec4(vertexPosition, 0.0, 1.0);
		vTextureCoord = textureCoord*vec2(uTextureCoord.z, uTextureCoord.w)+vec2(uTextureCoord.x, uTextureCoord.y);
		vColor = uColor;
		gl_PointSize = 3.0;
}