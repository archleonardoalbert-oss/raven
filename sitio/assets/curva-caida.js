// Trayectoria de la cámara en la escena del agujero negro, como función pura del progreso p de la sección (0 → 1).
// Continua en posición y en velocidad de principio a fin: así la escena no da tirones ni cambia de ritmo de golpe.
//   · aproximación [0, A]: de la galaxia al punto del botón, pasando por los cinco faros (sale y llega desde parada);
//   · pausa [A, B]: quieta en la vista de lado, junto al horizonte, mientras aparece el botón;
//   · retirada [B, R]: el mismo camino al revés, más rápido, y sale hacia la galaxia con la velocidad que se le pida
//     (la del vuelo de la galaxia hacia Proyectos), para que el relevo no tenga parón.
// La curva es una spline cúbica monótona (Fritsch–Carlson) en log r y en el ángulo: sin esquinas en los faros.
import { vista } from './penumbra/caida.js';

export const TRAMOS = { A: 0.6, B: 0.7, R: 0.9 };

const lim = (x, a, b) => Math.max(a, Math.min(b, x));
const suave = (x) => { const u = lim(x, 0, 1); return u * u * (3 - 2 * u); };
const mezclar = (a, b, k) => a + (b - a) * k;
// las mismas fórmulas que penumbra/caida.js: cómo mira quien cae a un radio dado
export const incDe = (r) => mezclar(0.28, 0.07, suave((30 - r) / 22));
// el giro de lado empieza desde r = 6 y es gradual: con (5 − r)/3,2 coincidía con el giro de la órbita y la vista
// pasaba de girar a quedarse quieta en un trecho muy corto (un frenazo visible); en el punto del botón (r = 2,8)
// da el mismo giro que antes (0,39 π: la vista de lado de la captura de Leonardo)
export const giraDe = (r) => Math.PI * (0.5 * suave((6 - r) / 4.65) + 0.5 * suave((1.62 - r) / 0.42));
export const fovDe = (r) => mezclar(0.62, 1.3, suave((12 - r) / 9));

// desplazamiento percibido entre dos cámaras: lo que se mueve respecto a su distancia al centro, más lo que gira la mirada
export function desplazamiento(a, b) {
  const d = Math.hypot(b.C[0] - a.C[0], b.C[1] - a.C[1], b.C[2] - a.C[2]) / Math.max(1e-9, Math.hypot(...a.C));
  const g = Math.acos(lim(a.f[0] * b.f[0] + a.f[1] * b.f[1] + a.f[2] * b.f[2], -1, 1));
  return d + g;
}

export function splineMonotona(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  const f = (x) => {
    const xx = lim(x, xs[0], xs[n - 1]); let i = 0; while (i < n - 2 && xx > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (xx - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
  f.pendienteInicial = m[0];
  return f;
}

// avance con rampas de aceleración y frenado (velocidad trapezoidal: continua, sin arranques secos)
function rampas(q, a = 0.12) {
  const v = 1 / (1 - a), x = lim(q, 0, 1);
  if (x < a) return (v * x * x) / (2 * a);
  if (x > 1 - a) return 1 - (v * (1 - x) ** 2) / (2 * a);
  return v * (x - a / 2);
}

/**
 * @param R0 radio de entrada (donde deja la cámara la galaxia), radios: los de los 5 faros, rBoton: el del botón,
 * salida: velocidad de log r por unidad de p al terminar la retirada (la del vuelo de la galaxia que la sigue).
 */
export function crearCurva({ R0, radios, rBoton, salida = 20, us = [0, 0.2, 0.36, 0.52, 0.68, 0.84, 1], INC0 = Math.atan2(2, 4.6), FOV0 = (50 * Math.PI) / 180, lado = 0.08 }) {
  const rs = [R0, ...radios, rBoton];
  // ángulo: como en la caída de Penumbra, cada tramo gira más cuanto más cerca del centro
  const azs = [0, 0.3]; for (let i = 0; i < radios.length; i++) azs.push(azs.at(-1) + 0.62 + 0.42 / radios[i] ** 0.4);
  const L = splineMonotona(us, rs.map(Math.log)), AZ = splineMonotona(us, azs);
  // pose en un punto de la spline: en la entrada se mezcla la mirada de la galaxia con la de la caída
  const poseU = (u) => {
    const r = Math.exp(L(u)), mezcla = suave(u / us[1]);
    return { r, az: AZ(u), inc: mezclar(INC0, incDe(r), mezcla), gira: giraDe(r) * mezcla, fov: mezclar(FOV0, fovDe(r), mezcla), roll: 0, mezcla };
  };
  const { A, B, R } = TRAMOS;
  // ritmo constante: la curva se recorre por la distancia que se percibe (cambio de log r, del ángulo y del giro de
  // la mirada), no por el parámetro de la spline; si no, cada tramo entre faros iría a una velocidad distinta
  // (medida con la cámara de verdad: cuánto se desplaza respecto a su distancia al centro y cuánto gira la mirada)
  const camDe = (u) => { const q = poseU(u); return vista(q, { lado: lado * q.mezcla }); };
  const NT = 400, us_ = [], ls = [0];
  for (let i = 0; i <= NT; i++) us_.push(i / NT);
  let prev = camDe(0);
  for (let i = 1; i <= NT; i++) {
    const v = camDe(us_[i]);
    ls.push(ls[i - 1] + desplazamiento(prev, v)); prev = v;
  }
  const total = ls[NT], ss = ls.map((x) => x / total);
  const uDeS = splineMonotona(ss, us_), sDeU = splineMonotona(us_, ss);
  // retirada: u = 1 − h(w), con h(0)=0, h'(0)=0 (sale de la pausa desde parada), h(1)=1, h'(1)=c (sale con velocidad)
  const dLds0 = (L(uDeS(1e-4)) - L(0)) / 1e-4;  // cómo cambia log r al empezar la curva, por unidad de recorrido
  const c = lim((salida * (R - B)) / Math.max(1e-6, Math.abs(dLds0)), 0.3, 2.9);
  const h = (w) => (3 - c) * w * w + (c - 2) * w * w * w;
  const kDe = (u) => {  // índice continuo de faro: 0…4 en los faros, < 0 antes del primero, 5 en el botón
    let i = 1; while (i < us.length - 2 && u > us[i + 1]) i++;
    return i - 1 + (u - us[i]) / (us[i + 1] - us[i]);
  };
  const enU = (u, fase) => ({ u, ...poseU(u), k: kDe(u), fase });
  const qDeS = (x) => { let lo = 0, hi = 1; for (let n = 0; n < 60; n++) { const m = (lo + hi) / 2; if (rampas(m) < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  return {
    pose(p) {
      if (p < A) return enU(uDeS(rampas(p / A)), 'aproximacion');
      if (p < B) return enU(1, 'pausa');
      if (p < R) return enU(uDeS(1 - h((p - B) / (R - B))), 'retirada');
      return enU(0, 'fuera');
    },
    // en qué p está cada faro (para el índice de capítulos y las pruebas)
    pFaro: (k) => A * qDeS(sDeU(us[k + 1])),
  };
}
