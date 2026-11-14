// Las matemáticas de la ruta del amanecer: operadores derivables, reglas como pérdida, calibración, conceptos y evaluación.
export const sigma = (x) => 1 / (1 + Math.exp(-x));
export function softmax(z, T = 1) { const e = z.map((v) => Math.exp(v / T)), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); }

export const NORMAS = { minimo: Math.min, producto: (a, b) => a * b, lukasiewicz: (a, b) => Math.max(0, a + b - 1) };
export function gradNorma(n, a, b) {
  if (n === 'minimo') return a < b ? [1, 0] : a > b ? [0, 1] : [0.5, 0.5];
  if (n === 'producto') return [b, a];
  return a + b > 1 ? [1, 1] : [0, 0];
}

export const IMPL = {
  reichenbach: (a, c) => 1 - a + a * c, kleene: (a, c) => Math.max(1 - a, c), lukasiewicz: (a, c) => Math.min(1, 1 - a + c),
  godel: (a, c) => (a <= c ? 1 : c), goguen: (a, c) => (a <= c ? 1 : c / a),
};
/** mp: cuánto empuja a subir la conclusión. mt: cuánto empuja a bajar la condición. */
export function gradImpl(n, a, c) {
  if (n === 'reichenbach') return { mp: a, mt: 1 - c };
  if (n === 'kleene') return 1 - a > c ? { mp: 0, mt: 1 } : { mp: 1, mt: 0 };
  if (n === 'lukasiewicz') return a > c ? { mp: 1, mt: 1 } : { mp: 0, mt: 0 };
  if (n === 'godel') return a > c ? { mp: 1, mt: 0 } : { mp: 0, mt: 0 };
  return a > c ? { mp: 1 / a, mt: c / (a * a) } : { mp: 0, mt: 0 };
}
/** La implicación sigmoidal de van Krieken et al.: la curva en S de I, reescalada para conservar los extremos. */
export function sigmoidal(I, s = 9, b0 = -0.5) {
  const d = (1 + Math.exp(-s * (1 + b0))) / (Math.exp(-b0 * s) - Math.exp(-s * (1 + b0))), h = 1 + Math.exp(-b0 * s);
  return (a, c) => d * (h * sigma(s * (I(a, c) + b0)) - 1);
}

export const existeP = (v, p) => (v.reduce((s, a) => s + a ** p, 0) / v.length) ** (1 / p);
export const paraTodoP = (v, p) => 1 - (v.reduce((s, a) => s + (1 - a) ** p, 0) / v.length) ** (1 / p);

// ---- un clasificador pequeño, de verdad: regresión logística sobre rasgos cuadráticos
const rasgos = ([x, y]) => [1, x, y, x * x, y * y, x * y];
const azarDe = (sem) => { let s = sem >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return ((s ^ (s >>> 13)) >>> 0) / 4294967296; }; };
const CLASE = ([x, y]) => (x * x + (y - 0.1) ** 2 < 0.42 ? 1 : 0);
export const puntosJuguete = (() => { const r = azarDe(7), P = []; for (let i = 0; i < 160; i++) { const p = [r() * 2 - 1, r() * 2 - 1]; P.push({ p, y: CLASE(p) }); } return P; })();
/** Pocas etiquetas, todas de un lado: sin más información, la frontera queda mal. */
export const ETIQUETADOS = [{ p: [-0.15, 0.1], y: 1 }, { p: [0.2, 0.3], y: 1 }, { p: [-0.75, 0.3], y: 0 }, { p: [-0.8, -0.5], y: 0 }];
/** La regla: «si está lejos del centro, no es de la clase». lejos(p) es un grado. */
export const lejos = ([x, y]) => sigma((Math.hypot(x, y - 0.1) - 0.72) * 9);
export const predecir = (w, p) => { const f = rasgos(p); return sigma(f.reduce((s, v, i) => s + v * w[i], 0)); };
export function entrenarConRegla({ conRegla = true, epocas = 300, eta = 0.5, cada = 3, etiquetados = ETIQUETADOS, pesoRegla = 1.2, reglaMala = false } = {}) {
  let w = [0, 0.1, -0.1, 0, 0, 0];
  const estado = (e) => {
    const sat = paraTodoP(puntosJuguete.map(({ p }) => IMPL.reichenbach(lejos(p), 1 - predecir(w, p))), 2);
    return { epoca: e, w: [...w], satisfaccion: sat, exactitud: puntosJuguete.filter(({ p, y }) => (predecir(w, p) > 0.5 ? 1 : 0) === y).length / puntosJuguete.length };
  };
  const h = [estado(0)];
  for (let e = 1; e <= epocas; e++) {
    const g = Array(6).fill(0);
    for (const { p, y } of etiquetados) { const f = rasgos(p), q = predecir(w, p); f.forEach((v, i) => { g[i] += ((q - y) * v) / etiquetados.length; }); }
    if (conRegla) for (const { p } of puntosJuguete) {
      // pérdida de la regla: 1 - I(a, 1 - q), con I = 1 - a + a(1 - q) = 1 - aq; su derivada respecto a q es a
      // la regla falsa dice lo contrario, «si lejos, entonces sí»: su pérdida es a(1 - q), y empuja al revés
      const a = lejos(p), f = rasgos(p), q = predecir(w, p), signo = reglaMala ? -1 : 1;
      f.forEach((v, i) => { g[i] += (signo * pesoRegla * a * q * (1 - q) * v) / puntosJuguete.length; });
    }
    w = w.map((v, i) => v - eta * g[i]);
    if (e % cada === 0 || e === epocas) h.push(estado(e));
  }
  return h;
}

/** P(A y B) para dos sucesos de probabilidades a y b, con dependencia r ∈ [-1, 1]: r = 0 es independencia; ±1, los extremos posibles. */
export function conjuncionReal(a, b, r) {
  const i = a * b;
  return r >= 0 ? i + r * (Math.min(a, b) - i) : i + -r * (Math.max(0, a + b - 1) - i);
}

export function binsCalibracion(conf, acierto, M = 10) {
  const B = Array.from({ length: M }, (_, m) => ({ m, n: 0, conf: 0, acc: 0 }));
  conf.forEach((c, i) => { const m = Math.min(M - 1, Math.max(0, Math.ceil(c * M - 1e-12) - 1)); B[m].n++; B[m].conf += c; B[m].acc += acierto[i]; });
  for (const b of B) if (b.n) { b.conf /= b.n; b.acc /= b.n; }
  return B;
}
export const ece = (conf, acierto, M = 10) => binsCalibracion(conf, acierto, M).reduce((s, b) => s + (b.n / conf.length) * Math.abs(b.acc - b.conf), 0);
/** Un modelo de juguete que se pasa de seguro: su confianza es la verdadera, exagerada por un factor. */
export const muestraCalibracion = (() => { const r = azarDe(11), M = []; for (let i = 0; i < 600; i++) { const logit = (r() - 0.5) * 5; M.push({ logit, y: r() < sigma(logit) ? 1 : 0 }); } return M; })();

/** Pool Adjacent Violators: dos bloques vecinos que violan el orden se funden en su media. Con historia, para animarlo. */
export function pavPasos(y) {
  let b = y.map((v, i) => ({ de: i, a: i, s: v, n: 1 }));
  const pasos = [b.map((x) => ({ ...x }))];
  for (let i = 0; i + 1 < b.length;) {
    if (b[i].s / b[i].n > b[i + 1].s / b[i + 1].n + 1e-12) {
      b[i] = { de: b[i].de, a: b[i + 1].a, s: b[i].s + b[i + 1].s, n: b[i].n + b[i + 1].n };
      b.splice(i + 1, 1);
      pasos.push(b.map((x) => ({ ...x })));
      if (i > 0) i--;
    } else i++;
  }
  return pasos;
}
export const pav = (y) => { const p = pavPasos(y).at(-1), r = []; for (const b of p) for (let k = b.de; k <= b.a; k++) r[k] = b.s / b.n; return r; };

export const owa = (v, w) => [...v].sort((a, b) => b - a).reduce((s, x, j) => s + x * w[j], 0);
export const orness = (w) => w.reduce((s, x, j) => s + (w.length - 1 - j) * x, 0) / (w.length - 1);
export const pesosOwa = (n, o) => { // pesos que van de «el mayor» a «el menor», según el orness pedido
  const q = o <= 0.5 ? 2 * o : 1 / (2 - 2 * o), Q = (r) => r ** (1 / Math.max(q, 1e-3));
  return Array.from({ length: n }, (_, j) => Q((j + 1) / n) - Q(j / n));
};

export const literal = (mu, p, m) => 1 - m + m * (p * mu + (1 - p) * (1 - mu));
export const fuerzaRegla = (mu, R) => R.reduce((s, { m, p }, k) => s * literal(mu[k], p, m), 1);
export function salidaTSK(reglas) {
  const t = reglas.reduce((s, r) => s + r.w, 0), L = reglas[0].theta.length, z = Array(L).fill(0);
  for (const r of reglas) r.theta.forEach((v, j) => { z[j] += ((r.w / t) * v); });
  return { z, p: softmax(z) };
}
export function proxGrupo(v, lambda) { const n = Math.hypot(...v), k = n > 0 ? Math.max(0, 1 - lambda / n) : 0; return v.map((x) => x * k); }

export const umbralCoste = (cFalsoNeg, cFalsoPos) => cFalsoPos / (cFalsoPos + cFalsoNeg);
export const matrizCoste = (L, beta) => Array.from({ length: L }, (_, y) => Array.from({ length: L }, (_, j) => (j > y ? beta * (j - y) : y - j)));
/** Elige la decisión de menor coste esperado. C[y][j]: coste de decidir j si la verdad es y. */
export function decisionCoste(p, C) { const c = C[0].map((_, j) => p.reduce((s, py, y) => s + py * C[y][j], 0)); return c.indexOf(Math.min(...c)); }

/** El menor cambio en una sola coordenada que lleva f(x) hasta la meta. Búsqueda por bisección, suponiendo f monótona en esa coordenada. */
export function contrafactual(f, x, meta, rangos) {
  let mejor = null;
  x.forEach((v, i) => {
    const prueba = (u) => { const y = [...x]; y[i] = u; return f(y); }, extremos = rangos[i];
    for (const fin of extremos) {
      if ((prueba(fin) - meta) * (f(x) - meta) > 0) continue;
      let a = v, b = fin;
      for (let k = 0; k < 50; k++) { const c = (a + b) / 2; if ((prueba(c) - meta) * (f(x) - meta) > 0) a = c; else b = c; }
      const dist = Math.abs(b - v);
      if (!mejor || dist < mejor.dist) { const y = [...x]; y[i] = b; mejor = { indice: i, dist, x: y }; }
    }
  });
  return mejor;
}

export function kappaCuadratico(a, b, L) {
  const n = a.length, O = Array.from({ length: L }, () => Array(L).fill(0)), fa = Array(L).fill(0), fb = Array(L).fill(0);
  a.forEach((v, i) => { O[v - 1][b[i] - 1]++; fa[v - 1]++; fb[b[i] - 1]++; });
  let nu = 0, de = 0;
  for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) { const w = (i - j) ** 2 / (L - 1) ** 2; nu += w * O[i][j]; de += (w * fa[i] * fb[j]) / n; }
  return de > 0 ? 1 - nu / de : 1;
}
const Z95 = 1.645, Z80 = 0.842;
export const tamanoNoInferioridad = (delta, d, za = Z95, zb = Z80) => ((za + zb) ** 2 * d) / delta ** 2;
const phi = (x) => 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp((-2 * x * x) / Math.PI)));
/** Potencia si los dos sistemas son igual de buenos en realidad: aproximación normal. */
export const potenciaNoInferioridad = (n, delta, d, za = Z95) => phi((delta * Math.sqrt(n)) / Math.sqrt(d) - za);

// ---- la capa difusa de CCD, entrenable, sobre conceptos de juguete
const K_CCD = 6;
export const NOMBRES_CCD = ['dolor torácico', 'sudoración', 'falta de aire', 'más de 65 años', 'golpe leve', 'pidió cita'];
const regla = (mu) => (mu[0] * mu[1] > 0.35 || mu[2] * mu[3] > 0.35 ? 0 : 1); // la «verdad» de juguete: 0 urgente, 1 no urgente
export const CASOS_CCD = (() => { const r = azarDe(23), C = []; for (let i = 0; i < 240; i++) { const mu = Array.from({ length: K_CCD }, () => (r() < 0.45 ? 0.55 + 0.45 * r() : 0.45 * r())); C.push({ mu, y: regla(mu) }); } return C; })();
/** La capa difusa de verdad: relevancia m y polaridad π por regla y concepto, y consecuentes θ, con su gradiente exacto. Tras cada paso, group lasso por concepto. */
export function entrenarCCD({ lambda = 0.012, epocas = 400, eta = 0.9, cada = 5, R = 3 } = {}) {
  const r = azarDe(5), L = 2;
  const m = Array.from({ length: R }, () => Array.from({ length: K_CCD }, () => 0.3 + 0.3 * r()));
  const s = Array.from({ length: R }, () => Array.from({ length: K_CCD }, () => (r() - 0.35) * 2.2));
  const th = Array.from({ length: R }, (_, i) => (i < R - 1 ? [0.5 + r() * 0.4, -0.5 - r() * 0.4] : [-0.8, 0.8]));
  const pasoAdelante = (mu) => {
    const f = m.map((mf, ri) => mf.map((mk, k) => 1 - mk + mk * (sigma(s[ri][k]) * mu[k] + (1 - sigma(s[ri][k])) * (1 - mu[k]))));
    const w = f.map((fr) => Math.max(1e-9, fr.reduce((a, b) => a * b, 1))), t = w.reduce((a, b) => a + b, 0), z = [0, 1].map((j) => w.reduce((acc, v, ri) => acc + (v / t) * th[ri][j], 0));
    return { f, w, t, z, p: softmax(z) };
  };
  const estado = (e) => {
    let per = 0, ok = 0;
    for (const c of CASOS_CCD) { const { p } = pasoAdelante(c.mu); per -= Math.log(p[c.y] + 1e-9); if ((p[1] > 0.5 ? 1 : 0) === c.y) ok++; }
    return { epoca: e, perdida: per / CASOS_CCD.length, exactitud: ok / CASOS_CCD.length, activos: Array.from({ length: K_CCD }, (_, k) => k).filter((k) => Math.hypot(...m.map((f) => f[k])) > 1e-6).length, m: m.map((f) => [...f]), pol: s.map((f) => f.map(sigma)), th: th.map((x) => [...x]) };
  };
  const h = [estado(0)];
  for (let e = 1; e <= epocas; e++) {
    const gm = m.map((f) => f.map(() => 0)), gs = m.map((f) => f.map(() => 0)), gt = th.map((f) => f.map(() => 0));
    for (const c of CASOS_CCD) {
      const { f, w, t, z, p } = pasoAdelante(c.mu), dz = [p[0] - (c.y === 0 ? 1 : 0), p[1] - (c.y === 1 ? 1 : 0)];
      for (let ri = 0; ri < R; ri++) {
        const dW = (dz[0] * (th[ri][0] - z[0]) + dz[1] * (th[ri][1] - z[1])) / t;
        gt[ri][0] += (dz[0] * w[ri]) / t; gt[ri][1] += (dz[1] * w[ri]) / t;
        for (let k = 0; k < K_CCD; k++) {
          const pi = sigma(s[ri][k]), l = pi * c.mu[k] + (1 - pi) * (1 - c.mu[k]), fk = Math.max(1e-6, f[ri][k]);
          gm[ri][k] += dW * w[ri] * (l - 1) / fk;
          gs[ri][k] += dW * w[ri] * m[ri][k] * (2 * c.mu[k] - 1) * pi * (1 - pi) / fk;
        }
      }
    }
    const n = CASOS_CCD.length;
    for (let ri = 0; ri < R; ri++) {
      th[ri][0] -= (eta * gt[ri][0]) / n; th[ri][1] -= (eta * gt[ri][1]) / n;
      for (let k = 0; k < K_CCD; k++) { m[ri][k] = Math.min(1, Math.max(0, m[ri][k] - (eta * 1.5 * gm[ri][k]) / n)); s[ri][k] -= (eta * 3 * gs[ri][k]) / n; }
    }
    for (let k = 0; k < K_CCD; k++) { const col = proxGrupo(m.map((f) => f[k]), eta * lambda); m.forEach((f, i) => { f[k] = col[i]; }); }
    if (e % cada === 0 || e === epocas) h.push(estado(e));
  }
  return h;
}

/** Exactitud final según cuántas etiquetas hay: las primeras n de una lista fija, equilibrada. */
export const LISTA_ETIQUETAS = (() => { const pos = puntosJuguete.filter((x) => x.y === 1), neg = puntosJuguete.filter((x) => x.y === 0), L = []; for (let i = 0; i < 24; i++) { L.push(pos[i % pos.length]); L.push(neg[i % neg.length]); } return L; })();
export const exactitudCon = (n, opciones) => entrenarConRegla({ etiquetados: LISTA_ETIQUETAS.slice(0, n), epocas: 240, cada: 240, ...opciones }).at(-1).exactitud;

/** Error de un clasificador sobre conceptos según cuántos se corrigen a mano, de los más dudosos a los menos. */
export function curvaIntervencion(ruido = 0.3, K = 6) {
  const r = azarDe(31), casos = CASOS_CCD.map((c) => ({ ...c, pred: c.mu.map((v) => Math.min(1, Math.max(0, v + (r() - 0.5) * 2 * ruido))) }));
  const dec = (m) => (m[0] * m[1] > 0.35 || m[2] * m[3] > 0.35 ? 0 : 1), orden = [0, 2, 1, 3, 4, 5];
  return Array.from({ length: K + 1 }, (_, n) => { const fijos = new Set(orden.slice(0, n)); return casos.filter((c) => dec(c.pred.map((v, k) => (fijos.has(k) ? c.mu[k] : v))) === c.y).length / casos.length; });
}

/** La fuga: la tarea depende de lo lejos que está x de la frontera, algo que el concepto «x > 0» no debería contar. */
export const DATOS_FUGA = (() => { const r = azarDe(41), D = []; for (let i = 0; i < 400; i++) { const x = (r() - 0.5) * 4; D.push({ x, y: Math.abs(x) > 1 ? 1 : 0 }); } return D; })();
export function exactitudFuga(pendiente, duro) {
  const c = (x) => { const v = sigma(pendiente * x); return duro ? (v > 0.5 ? 1 : 0) : v; };
  // el mejor umbral posible sobre lo que deja pasar el concepto: lo peor que puede pasar, no lo que aprende un modelo concreto
  const puntua = (f) => DATOS_FUGA.filter((d) => f(c(d.x)) === d.y).length / DATOS_FUGA.length;
  let mejor = 0;
  for (let a = 0; a <= 1.0001; a += 0.01) for (let b = a; b <= 1.0001; b += 0.01) { mejor = Math.max(mejor, puntua((v) => (v >= a && v <= b ? 0 : 1))); if (duro) break; }
  return Math.max(mejor, DATOS_FUGA.filter((d) => d.y === 1).length / DATOS_FUGA.length);
}

/** Fidelidad: en cuántos casos la regla binarizada decide igual que el modelo continuo. */
export function fidelidad(est, umbral = 0.5) {
  const salida = (m, pol, mu) => { const w = m.map((f, ri) => f.reduce((a, mk, k) => a * literal(mu[k], pol[ri][k], mk), 1)), t = w.reduce((a, b) => a + b, 0) + 1e-9, z = [0, 1].map((j) => w.reduce((acc, v, ri) => acc + (v / t) * est.th[ri][j], 0)); return z[1] > z[0] ? 1 : 0; };
  const bm = est.m.map((f) => f.map((v) => (v > umbral ? 1 : 0))), bp = est.pol.map((f) => f.map((v) => (v > 0.5 ? 1 : 0)));
  return CASOS_CCD.filter((c) => salida(est.m, est.pol, c.mu) === salida(bm, bp, c.mu)).length / CASOS_CCD.length;
}
