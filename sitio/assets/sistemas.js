// Los sistemas planetarios de los proyectos. Cada uno vive en su propia escena «local», donde la unidad es el
// radio del planeta: la galaxia no podría pintar algo tan pequeño con la precisión de la GPU (un planeta real
// mide ~0,00001 unidades de la galaxia). galaxia.js pinta esta escena encima, con una cámara sincronizada.
import * as THREE from 'three';

// ── ruido: simplex 3D (Ashima / Stefan Gustavson) y fbm ───────────────────────────────────────────────
const RUIDO = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
 vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
 i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
 float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
 vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
 vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
 return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s*.5+.5;}
float fbm3(vec3 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*snoise(p);p=p*2.1+vec3(4.3,1.1,7.7);a*=.5;}return s*.5+.5;}
`;
const VERT_ESFERA = `
varying vec3 vP; varying vec3 vW; varying vec3 vNW;
void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vNW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w; }`;

// planeta rocoso u oceánico: continentes por fbm, hielo en los polos, brillo especular del mar y luces de ciudad
function planetaRocoso(o) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLuz: { value: new THREE.Vector3(1, 0, 0) }, uT: { value: 0 }, uSemilla: { value: o.semilla ?? 0 },
      cOceano: { value: new THREE.Color(o.oceano) }, cBajo: { value: new THREE.Color(o.bajo) }, cAlto: { value: new THREE.Color(o.alto) },
      cHielo: { value: new THREE.Color(o.hielo ?? '#e8eef5') }, cCiudad: { value: new THREE.Color(o.ciudad ?? '#000') }, uMar: { value: o.mar ?? 0.5 },
    },
    vertexShader: VERT_ESFERA,
    fragmentShader: `${RUIDO}
      uniform vec3 uLuz; uniform float uT; uniform float uSemilla; uniform vec3 cOceano, cBajo, cAlto, cHielo, cCiudad; uniform float uMar;
      varying vec3 vP; varying vec3 vW; varying vec3 vNW;
      void main(){
        vec3 p = normalize(vP) + uSemilla;
        float h = fbm(p * 1.9);
        float tierra = smoothstep(uMar, uMar + 0.025, h);
        float detalle = fbm(p * 9.0);
        vec3 mar = mix(cOceano * 0.55, cOceano, smoothstep(uMar - 0.25, uMar, h));
        vec3 suelo = mix(cBajo, cAlto, smoothstep(uMar, uMar + 0.3, h + 0.15 * (detalle - 0.5)));
        vec3 col = mix(mar, suelo * (0.8 + 0.4 * detalle), tierra);
        float lat = abs(normalize(vP).y);
        col = mix(col, cHielo, smoothstep(0.8, 0.9, lat + 0.1 * (detalle - 0.5)));
        vec3 n = normalize(vNW), V = normalize(cameraPosition - vW);
        float d = dot(n, uLuz), dia = smoothstep(-0.1, 0.2, d);
        vec3 H = normalize(uLuz + V);
        float brillo = pow(max(dot(n, H), 0.0), 80.0) * (1.0 - tierra) * dia;
        vec3 c = col * (0.015 + 1.05 * max(d, 0.0)) + brillo * vec3(1.0, 0.92, 0.8) * 0.9;
        float ciudad = tierra * smoothstep(0.62, 0.8, fbm(p * 22.0)) * smoothstep(0.55, 0.0, lat) * (1.0 - dia);
        c += cCiudad * ciudad * 1.6;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}
// gigante gaseoso: bandas por latitud deformadas por turbulencia y una gran tormenta
function planetaGaseoso(o) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLuz: { value: new THREE.Vector3(1, 0, 0) }, uT: { value: 0 },
      c1: { value: new THREE.Color(o.c1) }, c2: { value: new THREE.Color(o.c2) }, c3: { value: new THREE.Color(o.c3) }, cTormenta: { value: new THREE.Color(o.tormenta) },
    },
    vertexShader: VERT_ESFERA,
    fragmentShader: `${RUIDO}
      uniform vec3 uLuz; uniform float uT; uniform vec3 c1, c2, c3, cTormenta;
      varying vec3 vP; varying vec3 vW; varying vec3 vNW;
      void main(){
        vec3 p = normalize(vP);
        float giro = uT * 0.02;
        vec3 q = vec3(p.x * cos(giro) - p.z * sin(giro), p.y, p.x * sin(giro) + p.z * cos(giro));
        float turb = fbm(q * vec3(2.0, 9.0, 2.0) + vec3(0.0, 0.0, uT * 0.01));
        float y = p.y + 0.06 * (turb - 0.5);
        float b = sin(y * 18.0) * 0.5 + 0.5, b2 = sin(y * 41.0 + turb * 3.0) * 0.5 + 0.5;
        vec3 col = mix(mix(c1, c2, b), c3, b2 * 0.45);
        // gran tormenta ovalada
        vec2 e = vec2(atan(q.z, q.x) - 1.2, (p.y + 0.32) * 3.2);
        float tor = smoothstep(0.32, 0.0, length(e * vec2(1.0, 1.6)) - 0.02 * fbm3(q * 20.0));
        col = mix(col, cTormenta, tor * 0.85);
        col *= 0.85 + 0.3 * fbm3(q * 14.0);
        vec3 n = normalize(vNW); float d = dot(n, uLuz);
        vec3 c = col * (0.012 + 1.1 * smoothstep(-0.05, 1.0, d));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}
function nubes(o) {
  return new THREE.ShaderMaterial({
    uniforms: { uLuz: { value: new THREE.Vector3(1, 0, 0) }, uT: { value: 0 }, uDens: { value: o.densidad ?? 0.5 } },
    vertexShader: VERT_ESFERA,
    fragmentShader: `${RUIDO}
      uniform vec3 uLuz; uniform float uT; uniform float uDens; varying vec3 vP; varying vec3 vW; varying vec3 vNW;
      void main(){
        vec3 p = normalize(vP); float g = uT * 0.012;
        vec3 q = vec3(p.x * cos(g) - p.z * sin(g), p.y, p.x * sin(g) + p.z * cos(g));
        float n = fbm(q * 2.6 + vec3(0.0, 0.0, uT * 0.004));
        float a = smoothstep(1.0 - uDens, 1.0 - uDens + 0.22, n);
        vec3 nn = normalize(vNW); float d = max(dot(nn, uLuz), 0.0);
        gl_FragColor = vec4(vec3(1.0) * (0.02 + 1.05 * d), a * 0.92);
      }`,
    transparent: true, depthWrite: false,
  });
}
function atmosfera(color, fuerza = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uLuz: { value: new THREE.Vector3(1, 0, 0) }, cAtm: { value: new THREE.Color(color) }, uF: { value: fuerza } },
    vertexShader: VERT_ESFERA,
    fragmentShader: `uniform vec3 uLuz; uniform vec3 cAtm; uniform float uF; varying vec3 vP; varying vec3 vW; varying vec3 vNW;
      void main(){ vec3 n = normalize(vNW), V = normalize(cameraPosition - vW);
        float borde = pow(1.0 - max(dot(n, V), 0.0), 2.6);
        float luz = smoothstep(-0.35, 0.6, dot(n, uLuz));
        gl_FragColor = vec4(cAtm * borde * luz * 1.6 * uF, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
function luna(o) {
  return new THREE.ShaderMaterial({
    uniforms: { uLuz: { value: new THREE.Vector3(1, 0, 0) }, cBase: { value: new THREE.Color(o.color) }, uSemilla: { value: o.semilla ?? 0 } },
    vertexShader: VERT_ESFERA,
    fragmentShader: `${RUIDO}
      uniform vec3 uLuz; uniform vec3 cBase; uniform float uSemilla; varying vec3 vP; varying vec3 vW; varying vec3 vNW;
      void main(){ vec3 p = normalize(vP) * 3.0 + uSemilla;
        float n = fbm(p); float crater = smoothstep(0.62, 0.66, fbm3(p * 2.4)) * 0.35;
        vec3 col = cBase * (0.65 + 0.55 * n - crater);
        float d = dot(normalize(vNW), uLuz);
        gl_FragColor = vec4(col * (0.01 + 1.05 * max(d, 0.0)), 1.0); }`,
  });
}
function estrella(color) {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, cE: { value: new THREE.Color(color) } },
    vertexShader: VERT_ESFERA,
    fragmentShader: `${RUIDO}
      uniform float uT; uniform vec3 cE; varying vec3 vP; varying vec3 vW; varying vec3 vNW;
      void main(){ vec3 p = normalize(vP);
        float gr = fbm(p * 7.0 + vec3(uT * 0.05)); float man = smoothstep(0.7, 0.78, fbm3(p * 3.0 + 9.0));
        vec3 n = normalize(vNW), V = normalize(cameraPosition - vW);
        float limbo = pow(max(dot(n, V), 0.0), 0.45);
        vec3 c = cE * (1.6 + 1.2 * gr - 0.9 * man) * limbo;
        gl_FragColor = vec4(c * 1.6, 1.0); }`,
  });
}
function texturaCorona() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.12, 'rgba(255,255,255,0.75)'); g.addColorStop(0.35, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const tCorona = texturaCorona();
function sol(color, radio, pos) {
  const g = new THREE.Group(); g.position.copy(pos);
  const esf = new THREE.Mesh(new THREE.SphereGeometry(radio, 64, 48), estrella(color));
  const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: tCorona, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  corona.scale.setScalar(radio * 9);
  g.add(esf, corona);
  return { g, esf };
}
// anillos con bandas, divisiones y la sombra del planeta
function anillos(o) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uLuz: { value: new THREE.Vector3(1, 0, 0) }, uIn: { value: o.interior }, uOut: { value: o.exterior }, c1: { value: new THREE.Color(o.c1) }, c2: { value: new THREE.Color(o.c2) } },
    vertexShader: `varying vec3 vL; varying vec3 vW; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${RUIDO}
      uniform vec3 uLuz; uniform float uIn, uOut; uniform vec3 c1, c2; varying vec3 vL; varying vec3 vW;
      void main(){ float r = length(vL.xy); float x = (r - uIn) / (uOut - uIn);
        float bandas = fbm3(vec3(x * 34.0, 0.0, 0.0)) * 0.7 + fbm3(vec3(x * 160.0, 3.0, 0.0)) * 0.3;
        float dens = smoothstep(0.0, 0.04, x) * smoothstep(1.0, 0.92, x) * (0.35 + 0.9 * bandas);
        dens *= 1.0 - 0.9 * smoothstep(0.03, 0.0, abs(x - 0.58));      // gran división
        dens *= 1.0 - 0.6 * smoothstep(0.012, 0.0, abs(x - 0.83));
        vec3 col = mix(c1, c2, bandas);
        // sombra del planeta (radio 1 en el origen) sobre el anillo
        vec3 p = vW; float b = dot(p, uLuz); float d2 = dot(p, p) - b * b;
        float sombra = (b < 0.0 && d2 < 1.0) ? 0.08 : 1.0;
        gl_FragColor = vec4(col * (0.08 + 0.95 * sombra), clamp(dens, 0.0, 0.95)); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(o.interior, o.exterior, 256, 1), m);
  return mesh;
}
// agujero negro compañero (estilizado: la lente física solo existe para el del centro de la galaxia)
function agujeroCompanero(pos, inclinacion) {
  const g = new THREE.Group(); g.position.copy(pos);
  const sombra = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  const disco = new THREE.Mesh(new THREE.RingGeometry(1.7, 7, 256, 1), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uCentro: { value: new THREE.Vector3() }, uNormal: { value: new THREE.Vector3(0, 1, 0) } },
    vertexShader: `varying vec3 vL; varying vec3 vW; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${RUIDO}
      uniform float uT; uniform vec3 uCentro; uniform vec3 uNormal; varying vec3 vL; varying vec3 vW;
      void main(){ float r = length(vL.xy), a = atan(vL.y, vL.x);
        float om = 2.2 * pow(r, -1.5);
        float rayas = fbm3(vec3(cos(a - uT * om) * r * 1.2, sin(a - uT * om) * r * 1.2, r * 2.5));
        float x = (r - 1.7) / 5.3;
        float temp = pow(1.0 - x, 2.2);
        vec3 col = mix(vec3(0.9, 0.25, 0.05), mix(vec3(1.0, 0.75, 0.35), vec3(1.0, 0.97, 0.9), smoothstep(0.55, 1.0, temp)), smoothstep(0.0, 0.6, temp));
        // Doppler: el lado que se acerca brilla más
        vec3 rad = normalize(vW - uCentro), vel = normalize(cross(uNormal, rad));
        float dop = 1.0 + 0.75 * dot(vel, normalize(cameraPosition - vW));
        float I = temp * (0.4 + 0.9 * rayas) * dop * dop * dop * smoothstep(0.0, 0.05, x) * smoothstep(1.0, 0.6, x);
        gl_FragColor = vec4(col * I * 2.2, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  disco.rotation.x = Math.PI / 2 + inclinacion;
  const anillo = new THREE.Mesh(new THREE.RingGeometry(1.42, 1.56, 128), new THREE.MeshBasicMaterial({ color: '#ffe2b0', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(sombra, disco, anillo);
  return { g, disco, anillo };
}

// Cada sistema se construye desde su descripción en contenido/sistemas/<id>.json (ver herramientas/datos.mjs).
function construirSistema(d) {
  const g = new THREE.Group();
  const soles = d.estrellas.map((e) => sol(e.color, e.radio, new THREE.Vector3(...e.pos)));
  const P = d.planeta;
  const planeta = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), P.tipo === 'gaseoso' ? planetaGaseoso(P) : planetaRocoso(P));
  if (P.inclinacion) planeta.rotation.z = P.inclinacion;
  const nub = d.nubes ? new THREE.Mesh(new THREE.SphereGeometry(d.nubes.radio, 96, 72), nubes({ densidad: d.nubes.densidad })) : null;
  const atm = d.atmosfera ? new THREE.Mesh(new THREE.SphereGeometry(d.atmosfera.radio, 96, 72), atmosfera(d.atmosfera.color, d.atmosfera.fuerza)) : null;
  const lunas = (d.lunas || []).map((l) => ({ m: new THREE.Mesh(new THREE.SphereGeometry(l.radio, 64, 48), luna({ color: l.color, semilla: l.semilla })), r: l.orbita, v: l.vel, f: l.fase, inc: l.inc }));
  let anillo = null;
  if (d.anillos) { anillo = anillos(d.anillos); anillo.rotation.x = d.anillos.rotX; anillo.rotation.y = d.anillos.rotY; }
  const bh = d.agujero ? agujeroCompanero(new THREE.Vector3(...d.agujero.pos), d.agujero.inclinacion) : null;
  g.add(...soles.map((s) => s.g), planeta, ...[nub, atm, anillo, bh?.g].filter(Boolean), ...lunas.map((l) => l.m));
  return { g, sol: soles[0], sol2: soles[1], planeta, nub, atm, anillo, lunas, bh };
}

export function crearSistemas(descripciones) {
  const sistemas = Object.fromEntries(Object.entries(descripciones).map(([id, d]) => [id, construirSistema(d)]));

  const tmp = new THREE.Vector3();
  function actualizar(id, t) {
    const S = sistemas[id]; if (!S) return;
    const luz = tmp.copy(S.sol.g.position).normalize();
    for (const m of [S.planeta, S.nub, S.atm, S.anillo].filter(Boolean)) {
      const u = m.material.uniforms; if (u.uLuz) u.uLuz.value.copy(luz); if (u.uT) u.uT.value = t;
    }
    S.planeta.rotation.y = t * 0.03;
    S.sol.esf.material.uniforms.uT.value = t; if (S.sol2) S.sol2.esf.material.uniforms.uT.value = t;
    for (const L of S.lunas) {
      const a = L.f + t * L.v;
      L.m.position.set(Math.cos(a) * L.r, Math.sin(a) * L.r * L.inc, Math.sin(a) * L.r);
      L.m.material.uniforms.uLuz.value.copy(S.sol.g.position).sub(L.m.position).normalize();
    }
    if (S.bh) {
      const d = S.bh.disco.material.uniforms; d.uT.value = t;
      d.uCentro.value.copy(S.bh.g.position);
      d.uNormal.value.set(0, 0, 1).applyQuaternion(S.bh.disco.quaternion);
    }
  }
  return { sistemas, actualizar };
}
