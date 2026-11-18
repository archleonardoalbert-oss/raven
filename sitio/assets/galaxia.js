// La galaxia de Raven: una espiral barrada como la Vía Láctea, construida con los ingredientes que se
// observan en las reales: bulbo y barra de estrellas viejas (amarillo-anaranjadas), disco exponencial,
// dos brazos principales que nacen en los extremos de la barra y dos menores (espirales logarítmicas),
// estrellas jóvenes azules en los brazos, regiones HII rosas, bandas de polvo en el borde interior de cada
// brazo y la luz difusa de los millones de estrellas que no se resuelven. Gira con curva de rotación plana.
// La cámara viaja con el scroll: cada sección tiene un punto de vista (data-camara="pos|mira").
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { crearLente } from './lente.js';
import { crearSistemas } from './sistemas.js';
import { SISTEMAS } from './sistemas-datos.js';

const lienzo = document.getElementById('galaxia');
const reducido = (window.ravenReducido ?? matchMedia('(prefers-reduced-motion: reduce)').matches);
const movil = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const CALIDAD = movil ? 0.45 : 1;

lienzo.addEventListener('webglcontextlost', (e) => e.preventDefault());
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, movil ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 1);
// mapeo tonal ACES (lo aplica el OutputPass final): los núcleos brillantes se comprimen en vez de quemarse, con
// más contraste y color que AgX (que dejaba la galaxia grisácea)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
const escena = new THREE.Scene();
// el fondo como color de escena: three.js lo convierte bien de sRGB a lineal (el color de borrado no)
escena.background = new THREE.Color(0x050505);  // negro neutro (no azul); tras el mapeo tonal queda casi #000, como la página
const camara = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 3000);
window.__ravenCamara = camara;  // para herramientas/medir-caida.mjs
escena.add(camara);

let semilla = 20251112;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646;
const gauss = () => { const u = Math.max(1e-9, azar()), v = azar(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

// ── estructura de la galaxia ────────────────────────────────────────────────────────────────────────
const G = {
  R: 72,                // radio del disco visible
  h: 17,                // longitud de escala del disco exponencial
  barra: { a: 15, b: 5.2, c: 3.2, ang: 0.42 },
  paso: (13 * Math.PI) / 180,  // ángulo de paso de los brazos
  r0: 14.5,             // donde nacen los brazos (extremos de la barra)
};
const K = 1 / Math.tan(G.paso);
const BRAZOS = [
  { fase: G.barra.ang, fuerza: 1 },
  { fase: G.barra.ang + Math.PI, fuerza: 1 },
  { fase: G.barra.ang + Math.PI / 2 + 0.35, fuerza: 0.45 },
  { fase: G.barra.ang + (3 * Math.PI) / 2 + 0.35, fuerza: 0.45 },
];
const envolver = (a) => { a = (a + Math.PI) % (2 * Math.PI); return a < 0 ? a + Math.PI : a - Math.PI; };
// distancia angular (con signo) del punto (r, θ) al brazo más cercano
function brazoCercano(r, th) {
  let mejor = { d: 9, f: 0, i: 0 };
  if (r < G.r0 * 0.85) return mejor;
  const base = Math.log(r / G.r0) * K;
  BRAZOS.forEach((b, i) => {
    const d = envolver(th - (b.fase + base));
    if (Math.abs(d) < Math.abs(mejor.d)) mejor = { d, f: b.fuerza, i };
  });
  return mejor;
}
// color de cuerpo negro aproximado (temperatura en kelvin → RGB)
function cuerpoNegro(T) {
  const t = T / 100; let r, g, b;
  r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
  g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * Math.pow(t - 60, -0.0755);
  b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305;
  return new THREE.Color(Math.min(255, Math.max(0, r)) / 255, Math.min(255, Math.max(0, g)) / 255, Math.min(255, Math.max(0, b)) / 255);
}

// ── estrellas: tres poblaciones ─────────────────────────────────────────────────────────────────────
const posiciones = [], colores = [], tamanos = [], radios = [];
function estrella(x, y, z, color, tam) { posiciones.push(x, y, z); colores.push(color.r, color.g, color.b); tamanos.push(tam); radios.push(Math.hypot(x, z)); }
const magnitud = () => Math.pow(azar(), 6); // la mayoría débiles, unas pocas brillantes

// bulbo (casi esférico) y barra (elipsoide): estrellas viejas de 3400 a 5300 K
for (let i = 0; i < 32000 * CALIDAD; i++) {
  const enBarra = azar() < 0.55;
  let x, y, z;
  if (enBarra) { x = gauss() * G.barra.a * 0.5; z = gauss() * G.barra.b * 0.5; y = gauss() * G.barra.c * 0.45; }
  else { const r = -Math.log(1 - azar() * 0.98) * 3.2; const u = azar() * 2 - 1, t = azar() * 6.283, s = Math.sqrt(1 - u * u); x = r * s * Math.cos(t); y = r * u * 0.62; z = r * s * Math.sin(t); }
  const ca = Math.cos(G.barra.ang), sa = Math.sin(G.barra.ang);
  estrella(x * ca - z * sa, y, x * sa + z * ca, cuerpoNegro(3400 + azar() * 1900), 0.5 + magnitud() * 2.2);
}
// disco: estrellas de todas las edades, densidad exponencial modulada por los brazos
for (let i = 0; i < 120000 * CALIDAD;) {
  const r = -G.h * Math.log(azar() * azar()) * 0.55;
  if (r > G.R * 1.15 || r < 3) continue;
  const th = azar() * Math.PI * 2;
  const b = brazoCercano(r, th);
  const ancho = 0.16 + 0.004 * r;
  const enBrazo = b.f * Math.exp(-(b.d * b.d) / (2 * ancho * ancho));
  if (azar() > 0.32 + 0.68 * enBrazo) continue;
  i++;
  const espesor = 0.55 + r * 0.012;
  const T = enBrazo > 0.5 && azar() < 0.25 ? 6800 + azar() * 4500 : 3600 + azar() * 3200;
  estrella(Math.cos(th) * r, gauss() * espesor * (1 - enBrazo * 0.4), Math.sin(th) * r, cuerpoNegro(T), 0.45 + magnitud() * 1.9);
}
// estrellas jóvenes y masivas: azules, concentradas en el borde exterior (delantero) de los brazos
for (let i = 0; i < 12000 * CALIDAD;) {
  const r = G.r0 + -Math.log(azar()) * 22;
  if (r > G.R * 1.05) continue;
  const brazo = BRAZOS[azar() < 0.8 ? (azar() < 0.5 ? 0 : 1) : (azar() < 0.5 ? 2 : 3)];
  const th = brazo.fase + Math.log(r / G.r0) * K + 0.06 + gauss() * (0.06 + 0.002 * r);
  i++;
  const rr = r + gauss() * 0.8;
  estrella(Math.cos(th) * rr, gauss() * 0.35, Math.sin(th) * rr, cuerpoNegro(8000 + azar() * 7000).lerp(new THREE.Color(1, 0.97, 0.92), 0.5), 0.8 + magnitud() * 3.4);
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
geo.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
geo.setAttribute('tam', new THREE.Float32BufferAttribute(tamanos, 1));
geo.setAttribute('rad', new THREE.Float32BufferAttribute(radios, 1));

// rotación con curva plana: velocidad casi constante, así que la velocidad angular cae con el radio
const ROTAR = `
  uniform float uTiempo;
  // giro del patrón espiral: rígido y lento, más una «respiración» diferencial acotada. Con la rotación
  // diferencial pura (ángulo ∝ t / r) los brazos se enrollaban sin fin y, al rato, el disco quedaba uniforme.
  float giroDe(float r, float t) { return t * 0.035 + 0.22 * sin(t * 0.04) * (8.0 / max(r, 4.0)); }
  vec3 rotar(vec3 p, float r) {
    float a = giroDe(r, uTiempo);
    float c = cos(a), s = sin(a);
    return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  }`;
// bienvenida «Primera luz»: la galaxia se enciende desde el centro hacia fuera (0 → 1); sin bienvenida, ya encendida
const uEncendido = { value: window.ravenBienvenida ? 0 : 1 };
const ENCENDER = `
  uniform float uEncendido;
  float encendido(float r) { float R = uEncendido * 100.0 - 8.0; return (1.0 - smoothstep(R, R + 14.0, r)) * smoothstep(0.0, 0.12, uEncendido); }`;
const matEstrellas = new THREE.ShaderMaterial({
  uniforms: { uTiempo: { value: 0 }, uEscala: { value: renderer.getPixelRatio() * (movil ? 1.5 : 1) }, uVaciar: { value: 0 }, uEncendido },
  vertexShader: `
    attribute float tam; attribute float rad; varying vec3 vColor; varying float vAlfa;
    uniform float uEscala; uniform float uVaciar;
    ${ROTAR}
    ${ENCENDER}
    void main() {
      vec4 mv = modelViewMatrix * vec4(rotar(position, rad), 1.0);
      gl_Position = projectionMatrix * mv;
      float d = -mv.z;
      float px = tam * uEscala * 120.0 / d;
      // por debajo de un píxel la estrella no encoge: se apaga, como en una foto real
      vAlfa = clamp(px, 0.0, 1.0) * smoothstep(0.3 + 2.5 * uVaciar, 2.5 + 7.0 * uVaciar, d) * mix(1.0, smoothstep(2.0, 18.0, length(position)), uVaciar);
      vAlfa *= encendido(rad);
      gl_PointSize = clamp(px, 1.0, 9.0 * uEscala);
      vColor = color;
    }`,
  fragmentShader: `
    varying vec3 vColor; varying float vAlfa;
    void main() {
      vec2 q = gl_PointCoord - 0.5;
      float d = length(q);
      float nucleo = exp(-d * d * 60.0);
      float halo = exp(-d * d * 12.0) * 0.35;
      gl_FragColor = vec4(vColor, (nucleo + halo) * vAlfa * 0.55);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
});
const estrellas = new THREE.Points(geo, matEstrellas);

// ── luz difusa: textura procedural del disco (bulbo de Sérsic + disco exponencial + brazos + polvo) ──
function texturaDisco(n) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
  const escala = (G.R * 1.25) / (n / 2);
  const ca = Math.cos(-G.barra.ang), sa = Math.sin(-G.barra.ang);
  const ruido = (u, v) => Math.sin(u * 1.7 + Math.sin(v * 2.3)) * Math.sin(v * 1.9 + Math.sin(u * 2.9)) * 0.5 + 0.5;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    // el plano gira -90° en X y la textura se voltea al subirse: la fila j de arriba cae en z negativo
    const px = (i - n / 2) * escala, pz = (j - n / 2) * escala, r = Math.hypot(px, pz), th = Math.atan2(pz, px);
    const bx = px * ca - pz * sa, bz = px * sa + pz * ca;
    const bulbo = Math.exp(-7.67 * (Math.pow(r / 4.5, 0.25) - 1)) * 0.0013;
    const barra = Math.exp(-((bx / (G.barra.a * 0.62)) ** 2) - (bz / (G.barra.b * 0.62)) ** 2) * 0.55;
    const b = brazoCercano(r, th);
    const ancho = 0.2 + 0.004 * r;
    const brazo = b.f * Math.exp(-(b.d * b.d) / (2 * ancho * ancho));
    // polvo: banda estrecha en el borde interior (cóncavo) de cada brazo
    const dp = b.d + 0.13;
    const polvo = r > G.r0 * 0.6 ? Math.min(1, b.f * 1.3) * Math.exp(-(dp * dp) / (2 * 0.06 * 0.06)) * (0.5 + 0.5 * ruido(px * 0.5, pz * 0.5)) : 0;
    const disco = Math.exp(-r / G.h) * (0.18 + 1.6 * brazo) * (0.7 + 0.6 * ruido(px * 0.25, pz * 0.25));
    const borde = 1 - Math.min(1, Math.max(0, (r - G.R) / (G.R * 0.25)));
    const L = (Math.min(1.6, bulbo) + barra + disco) * borde * (1 - polvo * 0.92);
    const tib = Math.min(1, r / 30);   // centro dorado (estrellas viejas), brazos de un blanco frío; nunca violeta
    const R_ = L * (1.0 - 0.16 * tib), G_ = L * (0.8 + 0.05 * tib), B_ = L * (0.55 + 0.27 * tib) + brazo * 0.03 * borde * (1 - polvo);
    const k = (j * n + i) * 4;
    d[k] = Math.min(255, R_ * 210); d[k + 1] = Math.min(255, G_ * 210); d[k + 2] = Math.min(255, B_ * 230); d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const matDisco = new THREE.ShaderMaterial({
  uniforms: { uMapa: { value: texturaDisco(movil ? 512 : 1024) }, uTiempo: matEstrellas.uniforms.uTiempo, uGanancia: { value: 1.45 }, uVaciar: matEstrellas.uniforms.uVaciar, uEncendido },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform sampler2D uMapa; uniform float uTiempo; uniform float uGanancia; uniform float uVaciar; varying vec2 vUv; varying float vD; ${ENCENDER}
    void main(){
      // la luz difusa gira con el disco (rotación media, suficiente para la textura)
      vec2 p = vUv - 0.5; float r = length(p) * 180.0; float a = -(uTiempo * 0.035 + 0.22 * sin(uTiempo * 0.04) * (8.0 / max(r, 4.0)));
      vec2 q = vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a)) + 0.5;
      vec3 c = texture2D(uMapa, q).rgb * mix(1.0, smoothstep(0.0, 0.08, length(p)), uVaciar); gl_FragColor = vec4(c * uGanancia * smoothstep(1.0, 9.0, vD) * encendido(r), 1.0); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const discoLuz = new THREE.Mesh(new THREE.PlaneGeometry(G.R * 2.5, G.R * 2.5), matDisco);
discoLuz.rotation.x = -Math.PI / 2;
// un segundo plano, desplazado y tenue, da volumen al disco visto en oblicuo
const discoGrueso = new THREE.Mesh(discoLuz.geometry, matDisco.clone());
discoGrueso.material.uniforms.uMapa = matDisco.uniforms.uMapa; discoGrueso.material.uniforms.uTiempo = matEstrellas.uniforms.uTiempo;
discoGrueso.material.uniforms.uGanancia = { value: 0.22 }; discoGrueso.material.uniforms.uVaciar = matEstrellas.uniforms.uVaciar; discoGrueso.material.uniforms.uEncendido = uEncendido;
discoGrueso.rotation.x = -Math.PI / 2; discoGrueso.position.y = 0.7; discoGrueso.scale.set(1.03, 1.03, 1);

// ── polvo: partículas oscuras que tapan la luz difusa (mezcla normal, no aditiva) ───────────────────
const polvoPos = [], polvoRad = [];
for (let i = 0; i < 26000 * CALIDAD;) {
  const r = G.r0 * 0.8 + -Math.log(azar()) * 20;
  if (r > G.R) continue;
  const brazo = BRAZOS[azar() < 0.75 ? (azar() < 0.5 ? 0 : 1) : (azar() < 0.5 ? 2 : 3)];
  const th = brazo.fase + Math.log(r / G.r0) * K - 0.13 + gauss() * 0.035 * (1 + r * 0.01);
  i++;
  polvoPos.push(Math.cos(th) * r, gauss() * 0.22, Math.sin(th) * r); polvoRad.push(r);
}
const geoPolvo = new THREE.BufferGeometry();
geoPolvo.setAttribute('position', new THREE.Float32BufferAttribute(polvoPos, 3));
geoPolvo.setAttribute('rad', new THREE.Float32BufferAttribute(polvoRad, 1));
const polvo = new THREE.Points(geoPolvo, new THREE.ShaderMaterial({
  uniforms: { uTiempo: matEstrellas.uniforms.uTiempo, uEscala: matEstrellas.uniforms.uEscala, uEncendido },
  vertexShader: `attribute float rad; uniform float uEscala; varying float vA; ${ROTAR} ${ENCENDER}
    void main(){ vec4 mv = modelViewMatrix * vec4(rotar(position, rad), 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z;
      gl_PointSize = clamp(260.0 * uEscala / d, 1.0, 60.0 * uEscala); vA = smoothstep(1.5, 8.0, d) * encendido(rad); }`,
  fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(0.02, 0.012, 0.01, a * 0.42 * vA); }`,
  transparent: true, depthWrite: false, blending: THREE.NormalBlending,
}));

// ── regiones HII: racimos rosas de hidrógeno ionizado a lo largo de los brazos ──────────────────────
function texturaNube() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
const tNube = texturaNube();
const hiiPos = [], hiiCol = [], hiiTam = [], hiiRad = [];
for (let n = 0; n < 150 * (movil ? 0.6 : 1); n++) {
  const r = G.r0 + 2 + azar() * (G.R * 0.85 - G.r0);
  const brazo = BRAZOS[azar() < 0.7 ? (azar() < 0.5 ? 0 : 1) : (azar() < 0.5 ? 2 : 3)];
  const th0 = brazo.fase + Math.log(r / G.r0) * K + 0.04 + gauss() * 0.03;
  const cx = Math.cos(th0) * r, cz = Math.sin(th0) * r, tam = 0.4 + azar() * 1.3;
  for (let k = 0; k < 26; k++) {
    const x = cx + gauss() * tam, z = cz + gauss() * tam;
    hiiPos.push(x, gauss() * 0.2, z);
    const rosa = azar() < 0.82; hiiCol.push(rosa ? 1 : 1, rosa ? 0.27 : 0.78, rosa ? 0.36 : 0.6);
    hiiTam.push(1.4 + azar() * 2.6); hiiRad.push(Math.hypot(x, z));
  }
}
const geoHii = new THREE.BufferGeometry();
geoHii.setAttribute('position', new THREE.Float32BufferAttribute(hiiPos, 3));
geoHii.setAttribute('color', new THREE.Float32BufferAttribute(hiiCol, 3));
geoHii.setAttribute('tam', new THREE.Float32BufferAttribute(hiiTam, 1));
geoHii.setAttribute('rad', new THREE.Float32BufferAttribute(hiiRad, 1));
const hii = new THREE.Points(geoHii, new THREE.ShaderMaterial({
  uniforms: { uTiempo: matEstrellas.uniforms.uTiempo, uEscala: matEstrellas.uniforms.uEscala, uMapa: { value: tNube }, uEncendido },
  vertexShader: `attribute float tam; attribute float rad; uniform float uEscala; varying vec3 vC; varying float vA; ${ROTAR} ${ENCENDER}
    void main(){ vec4 mv = modelViewMatrix * vec4(rotar(position, rad), 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z;
      gl_PointSize = clamp(tam * 70.0 * uEscala / d, 1.0, 22.0 * uEscala); vC = color; vA = smoothstep(4.0, 18.0, d) * encendido(rad); }`,
  fragmentShader: `uniform sampler2D uMapa; varying vec3 vC; varying float vA; void main(){ gl_FragColor = vec4(vC, texture2D(uMapa, gl_PointCoord).a * 0.2 * vA); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
}));

// orden: luz difusa → polvo que la tapa → nebulosas y estrellas encima
discoGrueso.renderOrder = 0; discoLuz.renderOrder = 1; polvo.renderOrder = 2; hii.renderOrder = 3; estrellas.renderOrder = 4;
escena.add(discoGrueso, discoLuz, polvo, hii, estrellas);

// ── cielo lejano: estrellas de primer plano y galaxias de fondo ─────────────────────────────────────
{
  const n = movil ? 2500 : 6000, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = azar() * 2 - 1, t = azar() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    p.set([Math.cos(t) * s * 1400, u * 1400, Math.sin(t) * s * 1400], i * 3);
    const col = cuerpoNegro(3500 + azar() * 12000).multiplyScalar(0.4 + azar() * 0.6); c.set([col.r, col.g, col.b], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  escena.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.1, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false })));
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tNube, color: cuerpoNegro(4500 + azar() * 4000), transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
    const u = azar() * 2 - 1, t = azar() * 6.283, sq = Math.sqrt(1 - u * u);
    s.position.set(Math.cos(t) * sq * 1300, u * 1300, Math.sin(t) * sq * 1300); s.scale.set(8 + azar() * 10, 3 + azar() * 4, 1);
    s.material.rotation = azar() * 3; escena.add(s);
  }
}

// ── nebulosas lejanas: nubes tenues de hidrógeno (rojo H-alfa), polvo y luz reflejada en el cielo de fondo ──
// Dan profundidad y color al panorama sin competir con la galaxia: muy grandes, lejanas y casi transparentes.
function texturaNebulosa(n, sem) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
  let s0 = sem; const az = () => ((s0 = (s0 * 16807) % 2147483647) - 1) / 2147483646;
  const T = 64, rejilla = Array.from({ length: T * T }, az);
  const val = (u, v) => { const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const g = (a, b) => rejilla[((a % T) + T) % T + (((b % T) + T) % T) * T];
    return (g(i, j) * (1 - su) + g(i + 1, j) * su) * (1 - sv) + (g(i, j + 1) * (1 - su) + g(i + 1, j + 1) * su) * sv; };
  const fbm = (u, v) => { let a = 0, w = 0.5; for (let o = 0; o < 6; o++) { a += w * val(u, v); u *= 2.03; v *= 2.03; w *= 0.5; } return a; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u = i / n - 0.5, v = j / n - 0.5, r = Math.hypot(u, v) * 2;
    const q = fbm(i / n * 4 + 3, j / n * 4 + 7), w = fbm(i / n * 4 + q * 2.2, j / n * 4 - q * 1.7);  // ruido deformado: filamentos
    const a = Math.max(0, w - 0.38) * 1.9 * Math.max(0, 1 - r * r);
    const k = (j * n + i) * 4; d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = Math.min(255, a * 255);
  }
  x.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
}
{
  const NEB = [[1.0, 0.3, 0.36], [0.95, 0.55, 0.3], [0.62, 0.4, 0.3], [1.0, 0.3, 0.36], [0.9, 0.7, 0.5], [0.85, 0.32, 0.4]];
  const texs = [texturaNebulosa(movil ? 128 : 256, 911), texturaNebulosa(movil ? 128 : 256, 4242)];
  NEB.forEach((col, i) => {
    const m = new THREE.SpriteMaterial({ map: texs[i % 2], color: new THREE.Color(...col), transparent: true, opacity: 0.075 + azar() * 0.05, depthWrite: false, blending: THREE.AdditiveBlending });
    const sp = new THREE.Sprite(m), u = azar() * 1.4 - 0.7, t = azar() * 6.283, sq = Math.sqrt(1 - u * u);
    sp.position.set(Math.cos(t) * sq * 1250, u * 1250, Math.sin(t) * sq * 1250);
    const e = 520 + azar() * 520; sp.scale.set(e, e * (0.55 + azar() * 0.4), 1); m.rotation = azar() * 6.283;
    sp.renderOrder = -1; escena.add(sp);
  });
}

// ── proyectos: estrellas brillantes, diminutas frente a la galaxia, con picos de difracción ─────────
function texturaDestello() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); x.translate(128, 128);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.08, 'rgba(255,255,255,0.8)'); g.addColorStop(0.3, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(-128, -128, 256, 256);
  for (const [a, l] of [[0, 1], [Math.PI / 2, 1], [Math.PI / 4, 0.45], [-Math.PI / 4, 0.45]]) {
    x.save(); x.rotate(a);
    const s = x.createLinearGradient(-128 * l, 0, 128 * l, 0);
    s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,0.9)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = s; x.fillRect(-128 * l, -1.2, 256 * l, 2.4); x.restore();
  }
  return new THREE.CanvasTexture(c);
}
const tDestello = texturaDestello();
// las estrellas de los proyectos principales: su sitio en la galaxia viene de contenido/sistemas/<id>.json
const PROYECTOS = Object.entries(SISTEMAS).map(([id, d]) => ({ id, ...d.galaxia }));
const marcas = PROYECTOS.map((p) => {
  const th = p.th - brazoCercano(p.r, p.th).d * 0.85; // sobre su brazo
  const pos = new THREE.Vector3(Math.cos(th) * p.r, 0.25, Math.sin(th) * p.r);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tDestello, color: p.color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, sizeAttenuation: false }));
  s.position.copy(pos); s.renderOrder = 10;
  escena.add(s);
  return { ...p, pos, s };
});

// ── postprocesado: lente gravitatoria del agujero negro central y resplandor ───────────────────────
// El agujero negro vive en la propia escena: un pase de trazado de rayos (lente.js) curva la luz de la galaxia
// real a su alrededor. Siempre es el mismo motor, así que acercarse a él no tiene ningún relevo.
const RS = 0.04; // radio del horizonte en unidades de la galaxia
// galaxia (y hacia arriba) ↔ agujero negro (z es el eje del disco): bx = gx, by = -gz, bz = gy
const G2B = new THREE.Matrix3().set(1, 0, 0, 0, 0, -1, 0, 1, 0), B2G = G2B.clone().transpose();
const exposicionBH = (r) => 0.95 * Math.min(1, (1 - 1 / r) ** 2 / 0.3); // algo más que El Horizonte: allí su propio resplandor sumaba luz
// lo que no lleva shader propio (cielo lejano, nebulosas, galaxias de fondo, estrellas de los proyectos) se enciende
// con un fundido de su opacidad
const lejanos = [];
escena.traverse((o) => { if ((o.isSprite || o.isPoints) && o.material && !o.material.isShaderMaterial) lejanos.push([o.material, o.material.opacity]); });
// el encendido arranca cuando la galaxia está lista y dura 1,6 s (salida suave); un gesto lo termina al momento
// estado del encendido: 'espera' (la luz respira; se calienta la escena hasta que el pintado va fluido),
// 'enciende' (avanza por cuadros pintados, nunca por reloj: un tirón lo pausa en vez de saltárselo) o 'hecho'
let fase = uEncendido.value < 1 ? 'espera' : 'hecho', avance = 0, fluidos = 0, esperaDesde = 0;
const T_ENCENDER = 1.1;
// salida exponencial: brota de golpe desde el centro y se asienta con suavidad
const suaveSalida = (u) => { const x = Math.min(1, Math.max(0, u)); return x >= 1 ? 1 : (1 - Math.pow(2, -10 * x)) / (1 - Math.pow(2, -10)); };
function aplicarEncendido(e) {
  uEncendido.value = e;
  for (const [m, base] of lejanos) m.opacity = base * Math.min(1, Math.max(0, (e - 0.25) / 0.6));
}
window.__ravenEncenderYa = () => { if (fase !== 'hecho') { fase = 'hecho'; aplicarEncendido(1); document.documentElement.classList.add('encendida', 'estallido', 'revelar'); } };
window.__ravenFijarEncendido = (e) => { fase = 'fijo'; aplicarEncendido(e); };
window.__ravenEncendido = () => ({ fase, avance: +avance.toFixed(3), valor: +uEncendido.value.toFixed(3) });  // para las pruebas  // para fotografiar la bienvenida a mitad
if (uEncendido.value < 1) aplicarEncendido(0);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(escena, camara));
// los sistemas planetarios: otra escena, a escala local (unidad = radio del planeta), pintada encima
const ESCALA = 1e-5; // unidades de la galaxia por unidad local
const escenaLocal = new THREE.Scene();
const camLocal = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.01, 20000);
const { sistemas, actualizar: actualizarSistema } = crearSistemas(SISTEMAS);
for (const S of Object.values(sistemas)) { S.g.visible = false; escenaLocal.add(S.g); }
let lente = null;
try { lente = crearLente(renderer, { cubo: movil ? 256 : 512 }); composer.addPass(lente.pase); lente.material.uniforms.uB2G.value.copy(B2G); }
catch (e) { console.warn('Sin lente gravitatoria:', e); }
// umbral alto y radio corto: que brillen las estrellas fuertes y el disco sin velar todo el cielo
const paseLocal = new RenderPass(escenaLocal, camLocal); paseLocal.clear = false; paseLocal.clearDepth = true;
composer.addPass(paseLocal);
if (!movil) composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.7, 0.3, 0.62));
composer.addPass(new OutputPass());

// ── cámara guiada por el scroll ─────────────────────────────────────────────────────────────────────
// Un punto puede nombrar un proyecto, «@penumbra,dx,dy,dz», para colocarse respecto a su estrella.
// en pantallas estrechas un punto de vista puede tener su versión (data-camara-movil): planeta arriba, tarjeta abajo
const estrecha = matchMedia('(max-width: 760px)').matches;
const paradas = [...document.querySelectorAll('[data-camara]')].map((el) => {
  const [p, t] = ((estrecha && el.dataset.camaraMovil) || el.dataset.camara).split('|');
  const vec = (s) => {
    if (s.startsWith('@') && s.includes(':')) { const [id, d] = s.slice(1).split(':'); const m = marcas.find((x) => x.id === id); return m.pos.clone().add(new THREE.Vector3(...d.split(',').map(Number)).multiplyScalar(ESCALA)); }
    if (s.startsWith('@')) { const [id, ...d] = s.slice(1).split(','); const m = marcas.find((x) => x.id === id); return m.pos.clone().add(new THREE.Vector3(...d.map(Number))); }
    return new THREE.Vector3(...s.split(',').map(Number));
  };
  return { el, p: vec(p), t: vec(t), y: 0 };
});
// data-llegada="arriba": la cámara llega cuando la sección toca el borde superior (no el centro de la pantalla)
function medirParadas() { for (const s of paradas) s.y = s.el.getBoundingClientRect().top + scrollY + (s.el.dataset.llegada === 'arriba' ? innerHeight * 0.5 : 0); }
const suave = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const objetivoP = new THREE.Vector3(), objetivoT = new THREE.Vector3(), mirada = new THREE.Vector3(), dir = new THREE.Vector3(), da_ = new THREE.Vector3(), db_ = new THREE.Vector3();
// el scroll se suaviza aquí (no la posición de la cámara): así la cámara siempre está sobre su trayectoria,
// también a escala de planeta, donde un retraso de millonésimas de unidad serían varios radios
let yS = scrollY, vS = 0;
// el scroll suavizado lo usa también la caída al agujero negro (agujero.js): un solo avance para toda la escena
window.__ravenYS = () => yS;
// muelle críticamente amortiguado: sigue al scroll con el mismo retraso que antes, pero con la velocidad continua
// (un filtro de primer orden la hacía saltar con cada paso de la rueda: eran tirones)
const OMEGA = 12;
function seguirScroll(dt) {
  if (reducido) { yS = scrollY; vS = 0; return; }
  for (let paso = Math.min(dt, 1 / 120), resto = dt; resto > 1e-6; resto -= paso, paso = Math.min(paso, resto)) {
    vS += (OMEGA * OMEGA * (scrollY - yS) - 2 * OMEGA * vS) * paso; yS += vS * paso;
  }
  if (Math.abs(scrollY - yS) < 0.05 && Math.abs(vS) < 0.5) { yS = scrollY; vS = 0; }
}
// saltos (índice, atajos): se coloca el scroll y la cámara llega sin recorrer el camino
window.__ravenFijarScroll = () => { yS = scrollY; vS = 0; destino(); camara.position.copy(objetivoP); mirada.copy(objetivoT); camara.lookAt(mirada); };
// zonas de descanso (donde la cámara está quieta) en coordenadas de scroll, para el imán de nav.js
window.__ravenDescansos = () => { const r = []; for (let i = 0; i < paradas.length; i++) { const a = paradas[i], b = paradas[i + 1]; const m = Number(a.el.dataset.mantener ?? 0.5); const ini = a.y - innerHeight * 0.5, fin = b ? ini + m * (b.y - a.y) : document.documentElement.scrollHeight; if (m > 0) r.push({ id: a.el.id, ini, fin, sinIman: a.el.id === 'habilidades' }); } return r; };
function destino() {
  const y = yS + innerHeight * 0.5;
  let i = 0;
  while (i < paradas.length - 1 && y >= paradas[i + 1].y) i++;
  const a = paradas[i], b = paradas[Math.min(i + 1, paradas.length - 1)];
  // quieta en la primera mitad de cada sección (mientras lees), viaja en la segunda
  const bruto = a === b ? 0 : (y - a.y) / Math.max(1, b.y - a.y);
  const m = Number(a.el.dataset.mantener ?? 0.5);
  const x = Math.min(1, Math.max(0, (bruto - m) / (1 - m)));
  // al salir del agujero negro el vuelo no arranca desde parada: sigue con la velocidad de la retirada (agujero.js)
  const t = a.el.id === 'habilidades' ? 1 - (1 - x) * (1 - x) : suave(x);
  // la distancia al objetivo se interpola en escala logarítmica: de lejísimos a muy cerca sin saltos
  const da = a.p.distanceTo(a.t), db = b.p.distanceTo(b.t);
  // el punto al que se mira cambia mientras aún se está lejos: al acercarse a un planeta, el destino ya es su
  // estrella antes de que la distancia sea pequeña (así no se pasa rozando estrellas cualquiera)
  const sep = a.t.distanceTo(b.t);
  let w = t;
  if (sep > 1e-9 && Math.abs(Math.log(da / db)) > 0.5) {
    const dl = Math.log(da) + (Math.log(db) - Math.log(da)) * t;
    const lo = Math.log(Math.max(Math.min(da, db), 0.35 * sep)), hi = Math.log(Math.max(da, db));
    const wr = hi > lo ? Math.min(1, Math.max(0, (dl - lo) / (hi - lo))) : t;
    w = da > db ? 1 - wr : wr;
    w = w * w * (3 - 2 * w);
  }
  objetivoT.lerpVectors(a.t, b.t, w);
  da_.copy(a.p).sub(a.t).normalize(); db_.copy(b.p).sub(b.t).normalize();
  // la dirección arranca desde quieta también al salir del agujero negro (la retirada llega sin girar): solo la
  // distancia sale con velocidad
  dir.lerpVectors(da_, db_, a.el.id === 'habilidades' ? suave(x) : t).normalize();
  objetivoP.copy(objetivoT).addScaledVector(dir, Math.exp(Math.log(da) + (Math.log(db) - Math.log(da)) * t));
  return { i, t };
}
medirParadas(); destino();
camara.position.copy(objetivoP); mirada.copy(objetivoT); camara.lookAt(mirada);

const raton = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { raton.x = e.clientX / innerWidth - 0.5; raton.y = e.clientY / innerHeight - 0.5; }, { passive: true });

// ── etiquetas HTML proyectadas: habilidades alrededor del núcleo y nombres de los proyectos ─────────
const etiquetas = [...document.querySelectorAll('.astro')].map((el, i, todos) => {
  const a = (i / todos.length) * Math.PI * 2 + azar() * 0.3, r = 5 + azar() * 7;
  return { el, p: new THREE.Vector3(Math.cos(a) * r, 2.5 + gauss() * 2.2, Math.sin(a) * r) };
});
const nombres = Object.fromEntries([...document.querySelectorAll('[data-mundo]')].map((el) => [el.dataset.mundo, el]));
const v = new THREE.Vector3();
function colocar(el, p, alfa, desplazar = '-50%, -50%') {
  v.copy(p).project(camara);
  const ok = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
  el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px, 0) translate(${desplazar})`;
  el.style.opacity = ok ? alfa.toFixed(3) : 0;
}
function proyectoBajo(e) {
  for (const m of marcas) { v.copy(m.pos).project(camara); const dx = (v.x * 0.5 + 0.5) * innerWidth - e.clientX, dy = (-v.y * 0.5 + 0.5) * innerHeight - e.clientY; if (v.z < 1 && dx * dx + dy * dy < 22 * 22) return m; }
  return null;
}
lienzo.addEventListener('click', (e) => { const m = proyectoBajo(e); if (m) location.href = `proyectos/${m.id}/`; });
lienzo.addEventListener('pointermove', (e) => { lienzo.style.cursor = proyectoBajo(e) ? 'pointer' : ''; });

// ── bucle ──────────────────────────────────────────────────────────────────────────────────────────
const reloj = new THREE.Clock();
const bhP = new THREE.Vector3(), bhX = new THREE.Vector3(), bhY = new THREE.Vector3(), bhZ = new THREE.Vector3(), bhQ = new THREE.Quaternion(), bhM = new THREE.Matrix4();
let cuadros = 0;
function fotograma() {
  const dt = Math.min(0.05, reloj.getDelta()), t = reloj.elapsedTime;
  window.__ravenDt = dt;  // herramientas/medir-caida.mjs: el paso de tiempo con que avanza la escena en este cuadro
  const k = reducido ? 1 : 1 - Math.pow(0.003, dt);
  seguirScroll(dt);
  if (fase === 'espera' && esperaDesde) {
    // arranca cuando el pintado va fluido (3 cuadros seguidos rápidos) o, como mucho, a los 1,2 s
    const real = (performance.now() - (fotograma.ult ?? performance.now())) / 1000;
    fluidos = real < 1 / 35 ? fluidos + 1 : 0;
    if (fluidos >= 3 || performance.now() - esperaDesde > 1200) { fase = 'enciende'; document.documentElement.classList.add('estallido', 'revelar'); }
  } else if (fase === 'enciende') {
    avance += Math.min(dt, 1 / 30) / T_ENCENDER;
    aplicarEncendido(suaveSalida(avance));
    if (avance >= 1) { fase = 'hecho'; aplicarEncendido(1); document.documentElement.classList.add('encendida'); }
  }
  fotograma.ult = performance.now();
  // un error en la caída no debe parar la galaxia entera
  try { window.__ravenActualizarCaida?.(dt); } catch (e) { console.error(e); }
  const { i } = destino();
  const bh = window.__ravenBH;
  if (bh && bh.activo) {
    // dentro de la caída manda agujero.js: su pose (en unidades del agujero negro) se lleva a la galaxia
    bhP.set(bh.C[0], bh.C[1], bh.C[2]).applyMatrix3(B2G).multiplyScalar(RS);
    bhX.set(...bh.de).applyMatrix3(B2G); bhY.set(...bh.ar).applyMatrix3(B2G); bhZ.set(-bh.f[0], -bh.f[1], -bh.f[2]).applyMatrix3(B2G);
    bhQ.setFromRotationMatrix(bhM.makeBasis(bhX, bhY, bhZ));
    // la cámara está exactamente donde dice la caída (sin perseguirla: el retraso hacía variar la velocidad)
    camara.position.copy(bhP); camara.quaternion.copy(bhQ);
    // el leve paralaje del ratón de la galaxia, que se apaga al adentrarse (así el relevo coincide)
    const fuera = 1 - (bh.mezcla ?? 1), dd = camara.position.length();
    camara.position.x += raton.x * 0.0012 * dd * fuera; camara.position.y -= raton.y * 0.0008 * dd * fuera;
    const fov = (bh.fov * 180) / Math.PI; if (Math.abs(camara.fov - fov) > 1e-4) { camara.fov = fov; camara.updateProjectionMatrix(); }
    mirada.copy(camara.position).addScaledVector(bhZ, -camara.position.length());
  } else {
    if (Math.abs(camara.fov - 50) > 1e-3) { camara.fov += (50 - camara.fov) * k; camara.updateProjectionMatrix(); }
    camara.position.copy(objetivoP); mirada.copy(objetivoT);
    // bienvenida: la cámara llega un 12 % más lejos y se acerca mientras la galaxia se enciende
    if (uEncendido.value < 1) camara.position.sub(mirada).multiplyScalar(1 + 0.12 * (1 - uEncendido.value)).add(mirada);
    const dist = camara.position.distanceTo(mirada);
    camara.position.x += raton.x * 0.0012 * dist; camara.position.y -= raton.y * 0.0008 * dist;
    camara.lookAt(mirada);
  }
  matEstrellas.uniforms.uTiempo.value = reducido ? 0 : t * 0.6;
  // al acercarse al núcleo las estrellas del bulbo se apartan y queda el agujero negro
  const dc = camara.position.length();
  // en escala logarítmica de la distancia, como el avance de la cámara: el núcleo se atenúa a lo largo de toda
  // la zambullida (de 120 a 28 unidades: apagado antes de que la sombra ocupe unos píxeles), así la lente nunca encuentra de golpe una mancha brillante que curvar
  const rampaLog = (d, lejos, cerca) => { const x = Math.min(1, Math.max(0, Math.log(lejos / d) / Math.log(lejos / cerca))); return x * x * (3 - 2 * x); };
  matEstrellas.uniforms.uVaciar.value = rampaLog(dc, 120, 28);
  // la lente: activa a menos de 45 unidades del núcleo y entra gradualmente (uMezcla); más lejos no se ve
  const r0 = Math.max(1.003, dc / RS);
  if (lente) {
    v.set(0, 0, 0).project(camara);
    // margen amplio: el pase se enciende mucho antes de que el agujero negro pueda notarse
    // muy cerca, la sombra ocupa decenas de grados: el centro puede quedar fuera del encuadre y la sombra verse igual
    // (la vista de lado junto al horizonte); se enciende si el disco de la sombra toca el campo de visión
    const tfv = Math.tan((camara.fov * Math.PI) / 360), sombra = Math.asin(Math.min(1, (2.598076 * Math.sqrt(Math.max(0, 1 - 1 / r0))) / r0));
    camara.getWorldDirection(bhX); bhY.copy(camara.position).negate().normalize();
    const angulo = Math.acos(Math.min(1, Math.max(-1, bhX.dot(bhY)))), diagonal = Math.atan(tfv * Math.hypot(camara.aspect, 1));
    const on = dc < 45 && ((v.z < 1 && Math.abs(v.x) < 2.2 && Math.abs(v.y) < 2.2) || angulo < diagonal + sombra + 0.05);
    lente.pase.enabled = on;
    if (on) {
      const u = lente.material.uniforms;
      camara.updateMatrixWorld();
      u.uC.value.copy(camara.position).applyMatrix3(G2B).divideScalar(RS);
      const e = camara.matrixWorld.elements;
      bhX.set(e[0], e[1], e[2]).applyMatrix3(G2B); bhY.set(e[4], e[5], e[6]).applyMatrix3(G2B); bhZ.set(e[8], e[9], e[10]).applyMatrix3(G2B);
      u.uBase.value.set(bhX.x, bhY.x, bhZ.x, bhX.y, bhY.y, bhZ.y, bhX.z, bhY.z, bhZ.z);
      u.uFov.value = (camara.fov * Math.PI) / 180; u.uAsp.value = camara.aspect; u.uT.value = reducido ? 0 : t;
      u.uExpo.value = exposicionBH(r0);
      // el disco se enciende poco a poco al acercarse (nunca de golpe): invisible a 70 unidades, entero a 20
      u.uDisco.value = rampaLog(dc, 60, 7);
      u.uMezcla.value = rampaLog(dc, 45, 20);  // la lente entra gradualmente (al encenderse no cambia nada)
      for (let n = 0; n < 4; n++) {
        if (bh && bh.activo) { lente.faros[n].fromArray(bh.faros, n * 4); lente.farosC[n].fromArray(bh.farosC, n * 4); }
        else { lente.faros[n].set(0, 0, 0, 0); lente.farosC[n].set(0, 0, 0, 0); }
      }
      lente.ponerLut(r0);
      if (!movil || (cuadros++ & 1) === 0) {
        // las estrellas tienen tamaño en píxeles: en las caras del cubo (90° y pocos píxeles) se escalan para
        // ocupar el mismo ángulo que en pantalla; si no, los bordes (que leen el cubo) se ven blanquísimos
        const esc = matEstrellas.uniforms.uEscala, base = esc.value;
        const pxPantalla = renderer.domElement.height / (2 * Math.tan((camara.fov * Math.PI) / 360));
        const pxCubo = lente.camCubo.renderTarget.height / 2;
        esc.value = base * (pxCubo / pxPantalla);
        lente.camCubo.position.copy(camara.position);
        lente.camCubo.update(renderer, escena);
        esc.value = base;
      }
    }
  }
  // sistema planetario más cercano: su escena local se pinta con la cámara sincronizada
  let cerca = null, dCerca = Infinity;
  for (const m of marcas) { const d = camara.position.distanceTo(m.pos); if (d < dCerca) { dCerca = d; cerca = m; } }
  for (const [id, S] of Object.entries(sistemas)) S.g.visible = !!cerca && id === cerca.id && dCerca < 0.08;
  if (cerca && dCerca < 0.08) {
    camLocal.position.copy(camara.position).sub(cerca.pos).divideScalar(ESCALA);
    camLocal.quaternion.copy(camara.quaternion);
    if (camLocal.fov !== camara.fov || camLocal.aspect !== camara.aspect) { camLocal.fov = camara.fov; camLocal.aspect = camara.aspect; camLocal.updateProjectionMatrix(); }
    actualizarSistema(cerca.id, reducido ? 0 : t);
    const S = sistemas[cerca.id]; if (S.bh) S.bh.anillo.quaternion.copy(camLocal.quaternion);
  }
  for (const m of marcas) {
    const d = camara.position.distanceTo(m.pos);
    // la estrella de la galaxia cede su sitio a la estrella real del sistema al llegar
    m.s.material.opacity = Math.min(1, Math.max(0, (d - 0.004) / 0.012));
    const tam = Math.min(0.09, Math.max(0.018, 1.6 / d)) * (1 + 0.08 * Math.sin(t * 3 + m.r));
    m.s.scale.set(tam, tam, 1);
    const el = nombres[m.id];
    // dentro de un sistema, los nombres de las otras estrellas se apagan (no compiten con el planeta)
    const ajeno = cerca && cerca !== m ? Math.min(1, Math.max(0, (dCerca - 0.05) / 0.5)) : 1;
    if (el) colocar(el, m.pos, Math.max(0, Math.min(1, (90 - d) / 40)) * Math.min(1, Math.max(0, (d - 0.004) / 0.012)) * ajeno, '-50%, calc(-100% - 18px)');
  }
  for (const e of etiquetas) { const d = camara.position.distanceTo(e.p); colocar(e.el, e.p, Math.max(0, Math.min(1, (34 - d) / 14))); }
  document.documentElement.dataset.seccion = paradas[i]?.el.id || '';
  composer.render();
  window.__ravenTrasCuadro?.();  // herramientas/medir-caida.mjs muestrea aquí la cámara de cada cuadro pintado
  requestAnimationFrame(fotograma);
}
addEventListener('resize', () => {
  camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); camLocal.aspect = camara.aspect; camLocal.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); medirParadas();
});
document.addEventListener('raven-idioma', () => requestAnimationFrame(medirParadas));
addEventListener('load', medirParadas);
new ResizeObserver(medirParadas).observe(document.body);
requestAnimationFrame(fotograma);
// el punto de luz de la bienvenida se coloca justo sobre el núcleo antes de fundirse con él
{ const v = new THREE.Vector3(0, 0, 0).project(camara); const r = document.documentElement.style; r.setProperty('--luz-x', `${((v.x * 0.5 + 0.5) * 100).toFixed(2)}%`); r.setProperty('--luz-y', `${((0.5 - v.y * 0.5) * 100).toFixed(2)}%`); }
// se compila toda la escena por adelantado: el primer cuadro con la galaxia ya no congela la página
if (fase === 'espera') { try { renderer.compile(escena, camara); renderer.compile(escenaLocal, camLocal); } catch (e) {} esperaDesde = performance.now(); }
document.documentElement.classList.add('galaxia-lista', 'webgl-ok');
window.dispatchEvent(new Event('galaxia-lista'));
