// El paisaje de una operación: dos conjuntos en sus paredes, y el terreno que sale de combinarlos corte a corte.
// La misma escena sirve para normas T, normas S y sus familias. Lo que se dibuja y lo que se calcula salen de aquí.
import { AZUL, BLANCO, GRIS2, ORO, ROSA, TEXTO } from '../../motor/colores.js';
import { curva, linea, mapaCalor, marco, poligono, punto, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
export const mA = (x) => 1 / (1 + Math.exp(-(x - 0.45) / 0.07));
export const mB = (y) => Math.exp(-((y - 0.58) ** 2) / (2 * 0.17 * 0.17));
const fn = (v) => v.toFixed(2).replace('.', '{,}');

export const GLSL_ENTRADAS = 'float a=1./(1.+exp(-(x-.45)/.07));float dy=y-.58;float b=exp(-(dy*dy)/(2.*.17*.17));';
export const RENDER3D = { cx: 365, cy: 372, S: 335 };

/** op: f(a, b) → resultado. glsl: cuerpo que usa a y b. `etapa` controla el dibujo: {pared, corte, barrido, rev}. */
export function paisaje({ f, glsl, uniformes, v, xp, rev, ba, pA, pB, fr, so, titulo, claveMapa, nombreCorte = R`T(a, b)` }) {
  const a = mA(xp), b = mB(v), z = f(a, b);
  const P = [marco({ x: [0, 1], y: [0, 1], z: [0, 1] }, { alfa: ba, etiquetas: { x: 'x', y: 'y', z: R`\text{grado}` } })];
  if (rev < 1) {
    P.push(terreno((x, y) => f(mA(x), mB(y)), { glsl: GLSL_ENTRADAS + glsl, uniformes, desde: rev }));
    const fal = (g) => { for (let i = 0; i < 50; i++) { const s = g(i / 50), t = g((i + 1) / 50), zs = f(mA(s[0]), mB(s[1])), zt = f(mA(t[0]), mB(t[1])); P.push(poligono([[s[0], s[1], 0], [t[0], t[1], 0], [t[0], t[1], zt], [s[0], s[1], zs]], { color: [80, 130, 170], alfa: 0.22 })); } };
    fal((u) => [1, mix(rev, 1, u)]);
    if (rev <= 0) fal((u) => [u, 0]);
  }
  if (pA > 0) P.push(curva((u) => [u, 1, mA(u)], [0, 1], { hasta: pA, n: 120, color: AZUL, ancho: 3, brillo: true }));
  if (pB > 0) P.push(curva((u) => [0, u, mB(u)], [0, 1], { hasta: pB, n: 120, color: ROSA, ancho: 3, brillo: true }));
  if (pA > 0.9) P.push(rotulo([0.85, 1, 1.07], R`\mu_A(x)`, { clave: 'ma', tam: 22, color: AZUL, siempre: true }));
  if (pB > 0.9) P.push(rotulo([0, 0.34, 0.98], R`\mu_B(y)`, { clave: 'mb', tam: 22, color: ROSA, dx: -32, siempre: true }));
  if (fr > 0) {
    const K = 60;
    for (let i = 0; i < K; i++) {
      const x0 = i / K, x1 = (i + 1) / K, z0 = f(mA(x0), b), z1 = f(mA(x1), b);
      P.push(poligono([[x0, v, z0], [x1, v, z1], [x1, v, 1], [x0, v, 1]], { color: TEXTO, alfa: 0.05 * fr }), poligono([[x0, v, 0], [x1, v, 0], [x1, v, z1], [x0, v, z0]], { color: ORO, alfa: 0.34 * fr }));
    }
    P.push(curva((u) => [u, v, mA(u)], [0, 1], { n: 100, color: AZUL, ancho: 2, alfa: 0.95 * fr }), linea([0, v, b], [1, v, b], { color: ROSA, ancho: 2.3, alfa: fr }), curva((u) => [u, v, f(mA(u), b)], [0, 1], { n: 120, color: ORO, ancho: 3.6, alfa: fr }));
    P.push(linea([0, v, 0], [1, v, 0], { color: TEXTO, ancho: 1.1, alfa: 0.42 * fr }), linea([0, v, 1], [1, v, 1], { color: TEXTO, ancho: 1.1, alfa: 0.42 * fr }));
  }
  if (so > 0) {
    P.push(linea([xp, 1, 0], [xp, 1, a], { color: AZUL, ancho: 1.5, alfa: 0.85 * so, discontinua: true }), linea([0, v, 0], [0, v, b], { color: ROSA, ancho: 1.5, alfa: 0.85 * so, discontinua: true }));
    P.push(linea([xp, 1, a], [xp, v, a], { color: AZUL, ancho: 1.3, alfa: 0.65 * so, discontinua: true }), linea([xp, 1, 0], [xp, v, 0], { color: AZUL, ancho: 2, alfa: 0.95 * so }), linea([0, v, 0], [xp, v, 0], { color: ROSA, ancho: 2, alfa: 0.95 * so }));
    P.push(linea([xp, v, 0], [xp, v, z], { color: BLANCO, ancho: 2.3, alfa: so }));
    P.push(punto([xp, 1, a], { color: AZUL, alfa: so }), punto([0, v, b], { color: ROSA, alfa: so }), punto([xp, v, a], { color: AZUL, radio: 4, alfa: so }), punto([xp, v, 0], { color: BLANCO, radio: 4, alfa: so }), punto([xp, v, z], { color: ORO, radio: 7, alfa: so }));
    P.push(rotulo([xp, 1, a], 'a', { clave: 'la', dx: 15, dy: -17, tam: 21, color: AZUL, alfa: so }), rotulo([0, v, b], 'b', { clave: 'lb', dx: -15, dy: -13, tam: 21, color: ROSA, alfa: so }), rotulo([xp, v, z], nombreCorte, { clave: 'lt', dx: 22, dy: -17, ancla: 'l', tam: 21, color: ORO, alfa: so }));
  }
  const M = [], C = [], pa = fr;
  if (pa > 0) {
    M.push(mapaCalor((x, y) => f(mA(x), mB(y)), { clave: claveMapa, desde: rev }), marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x', y: 'y' } }));
    M.push(rotulo([0.5, 1], R`\text{El suelo, desde arriba}`, { clave: 'tm', dy: -18, tam: 16, color: GRIS2, alfa: pa }));
    M.push(linea([0, v], [1, v], { color: TEXTO, ancho: 1, alfa: 0.55 * pa, discontinua: true }), linea([xp, 1], [xp, v], { color: AZUL, ancho: 1.8, alfa: pa }), linea([0, v], [xp, v], { color: ROSA, ancho: 1.8, alfa: pa }), punto([xp, v], { color: ORO, radio: 6, alfa: pa }));
    C.push(marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: 'x' } }));
    C.push(rotulo([0.5, 1], R`\text{Corte en } y = ${fn(v)}`, { clave: 'tc', dy: -20, tam: 16, color: GRIS2, alfa: pa }));
    C.push(curva((u) => [u, mA(u)], [0, 1], { n: 100, color: AZUL, ancho: 2, alfa: pa }), linea([0, b], [1, b], { color: ROSA, ancho: 2, alfa: pa }), curva((u) => [u, f(mA(u), b)], [0, 1], { n: 160, color: ORO, ancho: 3.2, alfa: pa }));
    C.push(punto([xp, a], { color: AZUL, radio: 5, alfa: pa }), punto([xp, b], { color: ROSA, radio: 5, alfa: pa }), punto([xp, z], { color: ORO, radio: 6, alfa: pa }));
    C.push(rotulo([0.5, 0], R`{\color{#58c4dd}${fn(a)}},\ {\color{#fc6282}${fn(b)}} \ \to\ {\color{#f4d345}${fn(z)}}`, { clave: 'cuenta', dy: 44, tam: 22, alfa: pa, ...(titulo ? {} : {}) }));
  }
  return { principal: P, paneles: [
    { ejes: { x: [0, 1], y: [0, 1], caja: { x: 810, y: 90, w: 216, h: 216 } }, prims: M },
    { ejes: { x: [0, 1], y: [0, 1], caja: { x: 786, y: 400, w: 280, h: 190 } }, prims: C },
  ] };
}
