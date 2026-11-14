// Emular un modelo decisor: de logits a un grado calibrado. Los datos son de juguete.
import { ece, muestraCalibracion, pav, sigma } from './ia.js';
/** La ecuación (1) del informe: a = e^lS / (e^lS + e^lN) = σ(lS − lN). */
export const aDeLogits = (si, no) => sigma(si - no);
const logit = (p) => Math.log(p / (1 - p));
/** Media de varias lecturas, en logits: es lo que no se sale de escala cerca de 0 o de 1. */
export const promedioLogit = (A) => sigma(A.reduce((s, a) => s + logit(a), 0) / A.length);
/** φ: regresión isotónica. Devuelve una función monótona, escalonada, y constante fuera de lo visto. */
export function ajustarIsotonica(conf, y) { const o = conf.map((c, i) => [c, y[i]]).sort((a, b) => a[0] - b[0]), xs = o.map((q) => q[0]), f = pav(o.map((q) => q[1])); return (c) => { if (!xs.length) return c; let i = 0; while (i + 1 < xs.length && xs[i + 1] <= c) i++; return f[i]; }; }
const EXAGERA = 3;
/** El decisor de juguete exagera: dice σ(3 z) cuando la verdad es σ(z). Una parte para calibrar, otra para medir. */
export function repartir() { const C = muestraCalibracion.map((m) => ({ a: sigma(EXAGERA * m.logit), y: m.y })); return [C.slice(0, 400), C.slice(400)]; }
export function eceConValidacion(n) { const [V, P] = repartir(), v = V.slice(0, n), f = n ? ajustarIsotonica(v.map((q) => q.a), v.map((q) => q.y)) : (c) => c; return ece(P.map((q) => f(q.a)), P.map((q) => q.y)); }
export const GRADOS_EJEMPLO = [[0.9, 0.8, 0.1], [0.9, 0.1, 0.1], [0.1, 0.2, 0.8], [0.1, 0.1, 0.1]];
const NIVELES = [1, 2, 4, 5];
export const fuerzasJuguete = ([d, s, g]) => [d * s, d * (1 - s), (1 - d) * g, (1 - d) * (1 - g)];
/** Las cuatro reglas de juguete: dolor y sudor, 1; dolor sin sudor, 2; sin dolor con golpe, 4; ni una cosa ni otra, 5. */
export function nivelJuguete(g) { const w = fuerzasJuguete(g), d = w.reduce((a, b) => a + b, 0); return d ? w.reduce((s, v, i) => s + v * NIVELES[i], 0) / d : 0; }
