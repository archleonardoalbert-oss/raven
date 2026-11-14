// La caída al agujero negro y las dos transiciones épicas, como funciones puras del avance y del tiempo.
const mezcla = (a, b, k) => a + (b - a) * k, suave = (x) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); }, cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const FRAC_SOMBRA = 0.36;  // lo que ocupa el disco del eclipse: la fracción de media pantalla
export const DISCO_LUNA = 0.0262; // su radio aparente, en radianes
export const DURA_ECLIPSE = 7.6, DURA_ENTRADA = 15;
/** Cuánto tapa la Luna al sol siempre, en el amanecer: lo justo para que se vea que ahí hay algo. */
export const ECLIPSE_REPOSO = 0.74;
export const OFFSET_LUNA = [-0.13, -0.05]; // de dónde viene, en radianes, respecto al sol
const TRAMOS = [[32, 21], [19, 11.5], [10.5, 5.6], [4.8, 2.05], [1.6, 1.07]];
/** Radio de cada anillo: de lejos a pegado al horizonte. r = 1 es el horizonte; r = 1,5, la esfera de fotones. */
export function trayecto(regiones) {
  const pts = []; let az = 0.3;
  regiones.forEach((reg, ir) => { const [a, b] = TRAMOS[Math.min(ir, TRAMOS.length - 1)], n = reg.conceptos.length; reg.conceptos.forEach((c, i) => { const f = n > 1 ? i / (n - 1) : 0, r = a * (b / a) ** f; pts.push({ c, region: reg, r, az, ir }); az += 0.62 + 0.42 / r ** 0.4; }); });
  return pts;
}
/** Dónde está y hacia dónde mira quien cae, para un avance continuo. */
export function pose(P, s) {
  const x = Math.max(0, Math.min(P.length - 1, s)), i = Math.min(P.length - 2, Math.floor(x)), f = P.length > 1 ? x - i : 0, A = P[Math.max(0, i)], B = P[Math.min(P.length - 1, i + 1)] ?? A, r = A.r * (B.r / A.r) ** f;
  return { r, az: mezcla(A.az, B.az, f), inc: mezcla(0.28, 0.07, suave((30 - r) / 22)), gira: Math.PI * (0.5 * suave((5 - r) / 3.2) + 0.5 * suave((1.62 - r) / 0.42)), fov: mezcla(0.62, 1.3, suave((12 - r) / 9)), roll: 0 };
}
/** De la pose a la cámara. gira: 0 mira al centro; π/2, de lado, con el agujero a la izquierda; π, hacia fuera. */
export function vista({ r, az, inc, gira, fov, roll = 0 }, { lado = 0, mirX = 0, mirY = 0 } = {}) {
  const C = [r * Math.cos(inc) * Math.sin(az), -r * Math.cos(inc) * Math.cos(az), r * Math.sin(inc)], n = norm(C), tan = norm(cruz([0, 0, 1], n)), m = norm(n.map((v, j) => -v * Math.cos(gira) + tan[j] * Math.sin(gira)));
  const d0 = norm(cruz(m, [0, 0, 1])), a0 = cruz(d0, m), f = norm(m.map((v, j) => v + d0[j] * (mirX + lado) + a0[j] * mirY)), d1 = norm(cruz(f, [0, 0, 1])), a1 = cruz(d1, f), c = Math.cos(roll), z = Math.sin(roll);
  const de = d1.map((v, j) => v * c + a1[j] * z), ar = a1.map((v, j) => -d1[j] * z + v * c);
  return { C, f, de, ar, fov, r, base: [...de, ...ar, ...f.map((v) => -v)] };
}
/** El faro de una parada flota delante de quien llega a ella, a la derecha: al acercarte lo pasas de largo. */
export function faroDe(P, k) { const p = pose(P, k), v = vista(p), d = Math.max(0.45 * (p.r - 1), 0.18), t = Math.tan(p.fov / 2); return v.C.map((x, j) => x + d * (v.f[j] + v.de[j] * 0.75 * t + v.ar[j] * 0.12 * t)); }
/** Al soltar, la caída se posa suavemente en la parada más cercana. */
export function iman(obj, quieto, dt, max) { const x = Math.max(0, Math.min(max, obj)); if (quieto < 1.1) return x; const k = Math.round(x); return k + (x - k) * Math.exp(-dt * 2.2); }
/** Cuántos segundos pasan allá fuera por cada segundo tuyo, quieto a ese radio. */
export const dilatacion = (r) => 1 / Math.sqrt(Math.max(1 - 1 / r, 1e-4));
export const angSombraDe = (r) => Math.asin((2.598076 * Math.sqrt(1 - 1 / r)) / r);
const FOV_FINAL_ECLIPSE = (2 * Math.atan(Math.tan(DISCO_LUNA) / FRAC_SOMBRA) * 180) / Math.PI;
/** En el mapa: giras hacia el sol, sube, la Luna lo tapa y todo se oscurece. Acaba en un disco negro con su corona. */
export function guionEclipse(t) {
  const cubre = ECLIPSE_REPOSO + (1 - ECLIPSE_REPOSO) * suave((t - 2.2) / 3.6);
  return { gira: suave(t / 2.6), sube: suave((t - 0.4) / 2.6), cubre, alabeo: 0 - 2 * Math.PI * suave((t - 0.2) / 6.6), fov: 38 * Math.exp(Math.log(FOV_FINAL_ECLIPSE / 38) * suave((t - 1.2) / 5.8)), expo: 1 - 0.8 * suave((t - 3.2) / 2.6), puente: suave((t - 7.1) / 0.5) };
}
const claves = (t, K) => { for (let i = 0; i + 1 < K.length; i++) if (t <= K[i + 1][0]) return mezcla(K[i][1], K[i + 1][1], suave((t - K[i][0]) / (K[i + 1][0] - K[i][0]))); return K.at(-1)[1]; };
/** En el agujero negro: la sombra coincide con el disco del eclipse. La corona prende y es el disco de acreción; la cámara cae girando, roza el disco y se posa en la primera órbita. */
export function guionEntrada(t, fin) {
  const r = t <= 9 ? 140 * (14 / 140) ** suave(t / 9) : 14 * (fin.r / 14) ** suave((t - 9) / 6), frac = mezcla(FRAC_SOMBRA, 0.7, suave(t / 7)), dolly = 2 * Math.atan(Math.tan(angSombraDe(r)) / frac);
  return { r, az: fin.az - 4.5 * Math.PI * (1 - suave(t / DURA_ENTRADA)), inc: claves(t, [[0, 1.42], [4, 1.2], [9, -0.12], [DURA_ENTRADA, fin.inc]]), gira: fin.gira * suave(t / DURA_ENTRADA), roll: (fin.roll ?? 0) - 2 * Math.PI * (1 - suave((t - 5) / 7)), fov: mezcla(dolly, fin.fov, suave((t - 7) / 8)), brillo: suave(t / 3.5), lado: suave((t - 9) / 6), titulo: suave((t - 10.5) / 1.2) * (1 - suave((t - 13.4) / 1.2)) };
}
