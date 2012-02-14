precision mediump float;

uniform sampler2D sampler;

varying vec2 vTextureCoord;

void main() {
	gl_FragColor = texture2D(sampler, vec2(vTextureCoord.s, vTextureCoord.t));
}