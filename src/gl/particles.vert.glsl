// Every particle = $1,000,000. Formations are computed procedurally from a
// per-particle random seed, so morphing between scenes costs zero memory:
// two formation evaluations + a mix, all on the GPU.

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uCount;        // fraction of particles visible (0..1)
uniform float uSpread;       // global scale of the active formation
uniform int   uFormA;
uniform int   uFormB;
uniform float uMorph;        // 0 = formA, 1 = formB
uniform float uSwirl;        // turbulence amplitude mid-morph
uniform float uAlpha;
uniform float uBillionLock;  // 1 => first uBillionFrac particles pin to a gold orb
uniform float uBillionFrac;
uniform vec3  uBillionPos;
uniform float uDrift;        // ambient wobble amplitude

attribute vec3  aSeed;       // uniform random in [0,1)^3
attribute float aIndex;      // i / (N-1), used as visibility threshold

varying vec3  vColor;
varying float vAlpha;
varying float vGlow;

#define PI  3.14159265359
#define TAU 6.28318530718

// 0 dust · 1 orb · 2 galaxy · 3 tunnel · 4 column · 5 line
vec3 formation(int f, vec3 s) {
  if (f == 0) {
    return (s - 0.5) * vec3(90.0, 55.0, 70.0);
  } else if (f == 1) {
    float th = s.x * TAU;
    float cp = s.y * 2.0 - 1.0;
    float sp = sqrt(max(0.0, 1.0 - cp * cp));
    float r  = pow(s.z, 0.4) * 6.0;
    return vec3(cos(th) * sp, cp, sin(th) * sp) * r;
  } else if (f == 2) {
    float r   = pow(s.x, 0.65) * 30.0;
    float arm = floor(s.y * 2.0) * PI;
    float ang = arm + r * 0.26 + (fract(s.y * 2.0) - 0.5) * (1.4 - r * 0.02);
    float y   = (s.z - 0.5) * 5.5 * exp(-r * 0.09);
    return vec3(cos(ang) * r, y, sin(ang) * r);
  } else if (f == 3) {
    float z   = (s.x - 0.5) * 260.0;
    float ang = s.z * TAU + z * 0.045;
    float r   = 10.0 + (s.y - 0.5) * 3.5;
    return vec3(cos(ang) * r, sin(ang) * r, z);
  } else if (f == 4) {
    float a  = s.x * TAU;
    float rr = sqrt(s.z) * 1.6;
    return vec3(cos(a) * rr, (s.y - 0.5) * 280.0, sin(a) * rr);
  }
  return vec3((s.x - 0.5) * 80.0, (s.y - 0.5) * 0.5, (s.z - 0.5) * 0.5);
}

void main() {
  float visible = step(aIndex, uCount);

  vec3 pa = formation(uFormA, aSeed);
  vec3 pb = formation(uFormB, aSeed);
  float m = smoothstep(0.0, 1.0, uMorph);
  vec3 pos = mix(pa, pb, m);

  // organic scatter at the midpoint of a morph
  float bell = uMorph * (1.0 - uMorph) * 4.0;
  pos += bell * uSwirl * 6.0 * vec3(
    sin(aSeed.y * 31.4 + uTime * 0.6),
    cos(aSeed.z * 27.1 + uTime * 0.5),
    sin(aSeed.x * 19.7 + uTime * 0.7)
  );

  pos *= uSpread;

  // ambient drift so nothing is ever frozen
  pos += uDrift * vec3(
    sin(uTime * 0.32 + aSeed.x * 40.0),
    cos(uTime * 0.27 + aSeed.y * 43.0),
    sin(uTime * 0.23 + aSeed.z * 47.0)
  );

  // the billion: first 1,000 particles can be pinned into a tight gold orb
  float isB = step(aIndex, uBillionFrac) * uBillionLock;
  vec3 bpos = uBillionPos + formation(1, aSeed) * 0.5;
  pos = mix(pos, bpos, isB);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.6 + aSeed.x * 0.9) * (1.0 + isB * 0.1);
  gl_PointSize = clamp(size * uPixelRatio * 340.0 / max(1.0, -mv.z), 1.0, 48.0) * visible;
  if (visible < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);

  // fade particles that get too close to the lens — prevents additive blowout
  float nearFade = smoothstep(2.0, 10.0, -mv.z);

  vec3 cGreen = vec3(0.000, 0.902, 0.463);
  vec3 cIce   = vec3(0.720, 1.000, 0.880);
  vec3 cGold  = vec3(1.000, 0.835, 0.310);
  vec3 col = cGreen;
  col = mix(col, cIce,  step(0.80, aSeed.z));
  col = mix(col, cGold, step(0.94, aSeed.y));
  col = mix(col, cGold * 1.25, isB);

  vColor = col;
  vAlpha = uAlpha * visible * nearFade * (1.0 + isB * 0.25);
  vGlow  = 0.4 + aSeed.z * 0.6 + isB * 0.3;
}
