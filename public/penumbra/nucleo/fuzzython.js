// Lo esencial de fuzzython en JavaScript, para las escenas del curso. tests/fuzzython.test.mjs lo compara con los resultados del fuzzython real.
export const NORMAS_FZ = {
  MIN: (x, y) => Math.min(x, y), MAX: (x, y) => Math.max(x, y), PROD: (x, y) => x * y, ASUM: (x, y) => x + y - x * y, BDIF: (x, y) => Math.max(0, x + y - 1), BSUM: (x, y) => Math.min(1, x + y),
  DPROD: (x, y) => (x === 1 ? y : y === 1 ? x : 0), DSUM: (x, y) => (x === 0 ? y : y === 0 ? x : 1), EPROD: (x, y) => (x * y) / (1 + (1 - x) * (1 - y)), ESUM: (x, y) => (x + y) / (1 + x * y),
  FAND: (x, y, p = 0.5) => (1 - p) * Math.min(x, y) + (p * (x + y)) / 2, FOR: (x, y, p = 0.5) => p * Math.max(x, y) + ((1 - p) * (x + y)) / 2, NSUM: (x, y) => (x + y) / Math.max(1, x + y),
};
export const gaussiana = (c, w, h = 1) => (x) => h * Math.exp(-((x - c) ** 2) / (2 * w * w));
export const sFuncion = (a, b, c) => (x) => { if (x <= a) return 0; if (x <= b) { const n = (x - a) / (c - a); return 2 * n * n; } if (x < c) { const n = (x - c) / (c - a); return 1 - 2 * n * n; } return 1; };
/** Polígono: puntos unidos por rectas. Fuera de ellos sigue constante: esa es la regla de fuzzython. */
export function poligono(puntos) {
  const P = [...puntos].sort((a, b) => a[0] - b[0]), val = (x) => {
    if (!P.length) return 0; if (x <= P[0][0]) return P[0][1]; if (x >= P.at(-1)[0]) return P.at(-1)[1];
    let i = 0; while (P[i][0] <= x) i++; const [a, b] = P[i - 1], [c, d] = P[i]; return b + ((d - b) * (x - a)) / (c - a);
  };
  const area = (A = P[0][0], B = P.at(-1)[0]) => { let s = 0; for (let i = 0; i + 1 < P.length; i++) { const [a, b] = P[i], [c, d] = P[i + 1], l = Math.max(a, A), r = Math.min(c, B); if (r > l) { const m = (d - b) / (c - a), y = (x) => b + m * (x - a); s += ((y(l) + y(r)) * (r - l)) / 2; } } return s; };
  const yes = {
    puntos: P, val, area,
    minimizar: (v) => { const Q = [[P[0][0], Math.min(P[0][1], v)]]; for (let i = 1; i < P.length; i++) { const [a, b] = P[i - 1], [c, d] = P[i]; if ((b < v || d < v) && d !== b) { const x = a + ((v - b) * (c - a)) / (d - b); if (x > a && x < c) Q.push([x, v]); } Q.push([c, Math.min(d, v)]); } return poligono(Q); },
    escalar: (v) => poligono(P.map(([x, y]) => [x, y * v])),
    complemento: () => poligono(P.map(([x, y]) => [x, 1 - y])),
    combinar: (op, o) => {
      const xs = [...new Set([...P, ...o.puntos].map((p) => p[0]))].sort((a, b) => a - b), ex = [];
      for (let i = 0; i + 1 < xs.length; i++) { const a = xs[i], c = xs[i + 1], m1 = (val(c) - val(a)) / (c - a), m2 = (o.val(c) - o.val(a)) / (c - a); if (m1 !== m2) { const x = a + (o.val(a) - val(a)) / (m1 - m2); if (x > a && x < c) ex.push(x); } }
      return poligono([...xs, ...ex].sort((a, b) => a - b).map((x) => [x, op(val(x), o.val(x))]));
    },
    COG: () => { let s = 0; for (let i = 0; i + 1 < P.length; i++) { const [a, b] = P[i], [c, d] = P[i + 1], m = (d - b) / (c - a), n = b - m * a, I = (x) => x * x * ((m * x) / 3 + n / 2); s += I(c) - I(a); } return s / area(); },
    COA: () => { let a = P[0][0], b = P.at(-1)[0], t = area() / 2; for (let i = 0; i < 80; i++) { const c = (a + b) / 2; if (area(P[0][0], c) < t) a = c; else b = c; } return (a + b) / 2; },
    LM: () => { let x = null, m = -Infinity; for (const [a, b] of P) if (b > m) { m = b; x = a; } return x; },
    RM: () => { let x = null, m = -Infinity; for (const [a, b] of P) if (b >= m) { m = b; x = a; } return x; },
    CM: () => (yes.LM() + yes.RM()) / 2,
    MM: () => { const m = Math.max(...P.map((p) => p[1])), xs = P.filter((p) => p[1] === m).map((p) => p[0]); return xs.reduce((a, b) => a + b, 0) / xs.length; },
  };
  return yes;
}
/** El ejemplo del propio fuzzython: temperatura y minutos. */
export const EJEMPLO = {
  temp: { cold: poligono([[0, 1], [15, 1], [20, 0]]), normal: poligono([[15, 0], [20, 1], [30, 1], [35, 0]]), hot: poligono([[30, 0], [35, 1], [40, 1]]) },
  min: { short: poligono([[0, 1], [10, 1], [15, 0]]), usual: poligono([[10, 0], [15, 1], [25, 1], [30, 0]]), large: poligono([[25, 0], [30, 1], [40, 1]]) },
  reglas: [{ texto: 'if temp is cold or temp is normal then minutes is short with 0.5', fuerza: (t, E) => Math.max(E.temp.cold.val(t), E.temp.normal.val(t)) * 0.5, sale: 'short' }, { texto: 'if temp is normal then minutes is usual', fuerza: (t, E) => E.temp.normal.val(t), sale: 'usual' }, { texto: 'if temp is hot then minutes is large', fuerza: (t, E) => E.temp.hot.val(t), sale: 'large' }],
};
/** Como en Adjective.set_strength: si dos reglas llegan al mismo adjetivo, gana el máximo, sea cual sea ACCU. */
export function fuerzasEjemplo(t) { const f = { short: 0, usual: 0, large: 0 }; for (const r of EJEMPLO.reglas) f[r.sale] = Math.max(f[r.sale], r.fuerza(t, EJEMPLO)); return f; }
const gradoCon = (A, E) => (E.punto ? Math.min(A.val(E.punto[0]), E.punto[1]) : Math.max(...A.combinar(NORMAS_FZ.MIN, E).puntos.map((p) => p[1])));
/** Entrada difusa: el grado es el máximo de min(A, entrada). E es un polígono, o { punto: [x, grado] } si es un Singleton. */
export function fuerzasDifusas(E) { const T0 = EJEMPLO.temp, c = gradoCon(T0.cold, E), n = gradoCon(T0.normal, E), h = gradoCon(T0.hot, E); return { short: Math.max(c, n) * 0.5, usual: n, large: h }; }
export function mamdaniDifuso(E, op = {}) { const c = conjuntoDe(fuerzasDifusas(E), op); return c ? c[op.metodo ?? 'COG']() : 0; }
export function conjuntoDe(f, { activacion = 'MIN', acumulacion = 'MAX' } = {}) { const sets = Object.entries(f).filter(([, v]) => v > 0).map(([k, v]) => (activacion === 'PROD' ? EJEMPLO.min[k].escalar(v) : EJEMPLO.min[k].minimizar(v))); return sets.length ? sets.reduce((a, b) => a.combinar(NORMAS_FZ[acumulacion], b)) : null; }
export function conjuntoEjemplo(t, op = {}) { return conjuntoDe(fuerzasEjemplo(t), op); }
export function mamdaniEjemplo(t, op = {}) { const c = conjuntoEjemplo(t, op); return c ? c[op.metodo ?? 'COG']() : 0; }
const T = EJEMPLO.temp; const fs = (t) => [T.cold.val(t), T.normal.val(t), T.hot.val(t)];
export function sugenoEjemplo(t) { const w = fs(t), z = [t * 0.1, t * 0.3 + 1, t * 0.6 + 2], d = w.reduce((a, b) => a + b, 0); return d ? w.reduce((s, v, i) => s + v * z[i], 0) / d : 0; }
const invertir = (p, y) => { const [a, b] = [p.puntos[0][0], p.puntos.at(-1)[0]], ya = p.val(a), yb = p.val(b); if (y === ya) return [y, a]; if (y === yb) return [y, b]; const crece = ya <= yb; if (y < Math.min(ya, yb) || y > Math.max(ya, yb)) return [0, 0]; let lo = a, hi = b; for (let i = 0; i < 60; i++) { const c = (lo + hi) / 2; if ((p.val(c) > y) === crece) hi = c; else lo = c; } return [y, (lo + hi) / 2]; };
export const CORTO_T = poligono([[0, 1], [15, 1], [25, 0]]), LARGO_T = poligono([[15, 0], [25, 1], [40, 1]]);
/** Regla por regla: [fuerza, x]. */
export function tsukamotoReglas(t) { const [c, n, h] = fs(t); return [invertir(CORTO_T, c), invertir(LARGO_T, n * 0.5), invertir(LARGO_T, h)]; }
export function tsukamotoEjemplo(t) { const we = tsukamotoReglas(t), d = we.reduce((a, q) => a + q[0], 0); return d ? we.reduce((a, q) => a + q[0] * q[1], 0) / d : 0; }
/** FuzzySet.area: trapecios sumando `a += step`. El error de redondeo puede añadir un tramo de más. */
export function areaDiscreta(f, a, b, res = 100) { const step = (b - a) / res; let x = a, s = 0, y1 = f(x), n = 0; while (x < b) { x += step; const y2 = f(x); s += ((y1 + y2) * step) / 2; y1 = y2; n++; } return { area: s, tramos: n }; }
