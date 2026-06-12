varying vec3  vColor;
varying float vAlpha;
varying float vGlow;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p) * 2.0;
  float halo = smoothstep(1.0, 0.0, d);
  halo *= halo;
  float core = smoothstep(0.38, 0.0, d) * vGlow;
  vec3 col = vColor * (halo + core * 1.6) + vec3(1.0) * core * core * 0.6;
  gl_FragColor = vec4(col, halo * vAlpha);
}
