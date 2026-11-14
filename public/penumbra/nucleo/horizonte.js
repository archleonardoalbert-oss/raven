// La física del agujero negro de Schwarzschild, en unidades con r_s = 1 (por tanto M = 1/2).
// La luz sigue d²u/dφ² + u = (3/2) u², con u = 1/r. El disco es el de Novikov-Thorne en su límite sin rotación
// (Page y Thorne, 1974; Luminet, 1979). El mismo cálculo va en el shader de motor/horizonteGL.js.
export const RADIO_FOTONES = 1.5;
export const B_CRITICO = (3 * Math.sqrt(3)) / 2;
export const ISCO = 3;

const paso = (u, v, h) => {
  const f = (a) => -a + 1.5 * a * a;
  const k1u = v, k1v = f(u), k2u = v + (h / 2) * k1v, k2v = f(u + (h / 2) * k1u), k3u = v + (h / 2) * k2v, k3v = f(u + (h / 2) * k2u), k4u = v + h * k3v, k4v = f(u + h * k3u);
  return [u + (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u), v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v)];
};
/** Traza un rayo de parámetro de impacto b desde r0. Devuelve si cae, y cuánto se desvía respecto a una recta. */
export function trazar({ r0, b, entra = true, h = 0.002 }) {
  let u = 1 / r0, v = Math.sqrt(Math.max(0, 1 / (b * b) - u * u * (1 - u))) * (entra ? 1 : -1), fi = 0;
  const fi0 = Math.asin(Math.min(1, b / r0));
  for (let i = 0; i < 400000; i++) {
    const uAnt = u; [u, v] = paso(u, v, h); fi += h;
    if (u >= 1) return { capturado: true, fi, deflexion: Infinity };
    // la salida se interpola dentro del último paso: en campo débil, la deflexión es mucho menor que h
    if (u <= 1 / r0 && v < 0) { const fiS = fi - h * ((1 / r0 - u) / (uAnt - u)); return { capturado: false, fi: fiS, deflexion: fiS - (Math.PI - 2 * fi0) }; }
  }
  return { capturado: true, fi, deflexion: Infinity };
}
/** Velocidad angular de una órbita circular vista desde lejos. */
export const omega = (r) => Math.sqrt(1 / (2 * r * r * r));
/** Medio ángulo de la sombra para un observador quieto en r0 (Synge, 1966). */
export const angSombra = (r0) => { const s = B_CRITICO * Math.sqrt(1 - 1 / r0) / r0, a = Math.asin(Math.min(1, s)); return r0 >= 1.5 ? a : Math.PI - a; };
/** Flujo del disco, forma cerrada de Luminet con r* = r / M = 2 r. Sin unidades: el valor absoluto lo fija la exposición. */
export function flujoDisco(r) {
  const x = 2 * r; if (x <= 6) return 0; const sx = Math.sqrt(x), s3 = Math.sqrt(3), s6 = Math.sqrt(6);
  return (1 / ((x - 3) * x ** 2.5)) * (sx - s6 + (s3 / 2) * Math.log(((sx + s3) * (s6 - s3)) / ((sx - s3) * (s6 + s3))));
}
/** La misma cantidad por la integral de Page y Thorne, para comprobar la fórmula. En M = 1. */
export function flujoIntegral(r) {
  const x = 2 * r, O = (a) => a ** -1.5, E = (a) => (1 - 2 / a) / Math.sqrt(1 - 3 / a), L = (a) => Math.sqrt(a) / Math.sqrt(1 - 3 / a), d = 1e-4, D = (f, a) => (f(a + d) - f(a - d)) / (2 * d);
  let I = 0; const n = 4000, h = (x - 6) / n; for (let i = 0; i < n; i++) { const a = 6.0000001 + (i + 0.5) * h; I += (E(a) - O(a) * L(a)) * D(L, a) * h; }
  const den = (E(x) - O(x) * L(x)) ** 2; return ((-D(O, x) / den) * I) / x * (2 / 3);
}
/** g = ν_observado / ν_emitido, para una órbita circular en r. Lfot: momento angular del fotón por unidad de energía. r0: observador quieto. */
export const corrimiento = ({ r, Lfot, r0 }) => (Math.sqrt(1 - 1.5 / r) / (1 - omega(r) * Lfot)) / Math.sqrt(1 - 1 / r0);

/** Cromaticidad del cuerpo negro: ajuste de Wyman et al. (2013) a las curvas CIE 1931, integrado sobre la ley de Planck, a sRGB lineal con Y = 1. */
const gs = (l, a, m, s1, s2) => { const t = (l - m) * (l < m ? s1 : s2); return a * Math.exp(-0.5 * t * t); };
const xb = (l) => gs(l, 1.056, 599.8, 0.0264, 0.0323) + gs(l, 0.362, 442, 0.0624, 0.0374) + gs(l, -0.065, 501.1, 0.049, 0.0382);
const yb = (l) => gs(l, 0.821, 568.8, 0.0213, 0.0247) + gs(l, 0.286, 530.9, 0.0613, 0.0322);
const zb = (l) => gs(l, 1.217, 437, 0.0845, 0.0278) + gs(l, 0.681, 459, 0.0385, 0.0725);
export function cromaCuerpoNegro(T) {
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 5) { const w = l * 1e-9, B = 1 / (w ** 5 * (Math.exp(0.0143877 / (w * T)) - 1)); X += xb(l) * B; Y += yb(l) * B; Z += zb(l) * B; }
  X /= Y; Z /= Y;
  return [Math.max(0, 3.2406 * X - 1.5372 - 0.4986 * Z), Math.max(0, -0.9689 * X + 1.8758 + 0.0415 * Z), Math.max(0, 0.0557 * X - 0.204 + 1.057 * Z)];
}
