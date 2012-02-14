attribute vec2 vertexPosition;
attribute vec2 textureCoord;

uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;

varying vec2 vTextureCoord;

void main() {
		gl_Position = projectionMatrix * modelMatrix * vec4(vertexPosition, 0.0, 1.0);
		vTextureCoord = textureCoord;
}