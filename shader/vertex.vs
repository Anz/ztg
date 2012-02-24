attribute vec2 vertexPosition;
attribute vec2 textureCoord;

uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform vec4 uPosition;
uniform vec4 uColor;

varying vec2 vTextureCoord;
varying vec4 vColor;

void main() {
		mat4 rotationMatrix = mat4( 
			cos(uPosition.w), -sin(uPosition.w), 0.0, 0.0,
			sin(uPosition.w),  cos(uPosition.w), 0.0, 0.0,
			0.0,           0.0, 1.0, 0.0,
			0.0,           0.0, 0.0, 1.0 );

		gl_Position = projectionMatrix * modelMatrix * rotationMatrix * vec4(vertexPosition, 0.0, 1.0);
		vTextureCoord = textureCoord;
		vColor = uColor;
}