attribute vec2 vertexPosition;
attribute vec2 textureCoord;

uniform mat4 projectionMatrix;
uniform vec3 uPosition;
uniform float uRotation;
uniform vec2 uSize;
uniform vec4 uColor;

varying vec2 vTextureCoord;
varying vec4 vColor;

void main() {
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
		vTextureCoord = textureCoord;
		vColor = uColor;
}