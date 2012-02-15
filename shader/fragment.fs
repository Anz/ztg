precision mediump float;

uniform sampler2D sampler;

varying vec2 vTextureCoord;
varying vec4 vColor;

void main() {
	gl_FragColor = texture2D(sampler, vec2(vTextureCoord.s, vTextureCoord.t)) * vColor;
}