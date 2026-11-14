// Matemáticas de conjuntos difusos: un conjunto es una función μ(x) con valores en [0, 1]; un dominio es [a, b].

const TOL = 1e-9;
const N = 2000;

// ---------------------------------------------------------------- formas
export const clasico = (a, b) => (x) => (x >= a && x <= b ? 1 : 0);

export const triangular = (a, b, c) => (x) => {
  if (x === b) return 1;
  if (x <= a || x >= c) return 0;
  return x < b ? (x - a) / (b - a) : (c - x) / (c - b);
};

export const trapecial = (a, b, c, d) => (x) => {
  if (x >= b && x <= c) return 1;
  if (x <= a || x >= d) return 0;
  return x < b ? (x - a) / (b - a) : (d - x) / (d - c);
};

export const gaussiana = (c, s) => (x) => Math.exp(-((x - c) ** 2) / (2 * s * s));
export const campana = (c, a, k) => (x) => 1 / (1 + Math.abs((x - c) / a) ** (2 * k));
export const sigmoide = (c, w) => (x) => 1 / (1 + Math.exp(-(x - c) / w));

// ---------------------------------------------------------------- muestreo
const muestras = ([a, b], n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

/** El máximo local cerca de x por sección áurea, para no perder picos entre dos muestras. */
function cima(m, a, b) {
  const r = (Math.sqrt(5) - 1) / 2;
  let c = b - r * (b - a), d = a + r * (b - a);
  for (let i = 0; i < 50; i++) {
    if (m(c) > m(d)) { b = d; d = c; c = b - r * (b - a); } else { a = c; c = d; d = a + r * (b - a); }
  }
  return (a + b) / 2;
}

const cimas = (m, xs) => {
  const r = [];
  for (let i = 1; i < xs.length - 1; i++) {
    if (m(xs[i]) >= m(xs[i - 1]) && m(xs[i]) >= m(xs[i + 1])) r.push(cima(m, xs[i - 1], xs[i + 1]));
  }
  return r;
};

/** Los intervalos donde se cumple `dentro(μ(x))`; cada borde se afina por bisección. */
function intervalos(m, dentro, dom, n) {
  const xs = muestras(dom, n), res = [];
  const borde = (fuera, den) => {
    for (let i = 0; i < 40; i++) {
      const c = (fuera + den) / 2;
      if (dentro(m(c))) den = c; else fuera = c;
    }
    return den;
  };
  let ini = null;
  xs.forEach((x, i) => {
    const d = dentro(m(x));
    if (d && ini === null) ini = i === 0 ? x : borde(xs[i - 1], x);
    if (!d && ini !== null) { res.push([ini, borde(x, xs[i - 1])]); ini = null; }
  });
  if (ini !== null) res.push([ini, xs[n]]);
  for (const c of cimas(m, xs)) {
    if (dentro(m(c)) && !res.some(([a, b]) => c >= a - TOL && c <= b + TOL)) res.push([c, c]);
  }
  return res.sort((p, q) => p[0] - q[0]);
}

// ---------------------------------------------------------------- piezas
export const corteAlfa = (m, alfa, dom, n = N) => intervalos(m, (v) => v >= alfa - TOL, dom, n);
export const corteFuerte = (m, alfa, dom, n = N) => intervalos(m, (v) => v > alfa + TOL, dom, n);
export const soporte = (m, dom, n = N) => corteFuerte(m, 0, dom, n);
export const nucleo = (m, dom, n = N) => corteAlfa(m, 1, dom, n);

export function altura(m, dom, n = N) {
  const xs = muestras(dom, n);
  return Math.max(...xs.map(m), ...cimas(m, xs).map(m));
}

export const esNormal = (m, dom, n = N) => altura(m, dom, n) >= 1 - TOL;

/** Cuasi-concavidad: ningún punto queda por debajo de lo que tiene a ambos lados. */
export function esConvexo(m, dom, n = N) {
  const v = muestras(dom, n).map(m), suf = [...v];
  for (let i = n - 1; i >= 0; i--) suf[i] = Math.max(v[i], suf[i + 1]);
  let pre = v[0];
  for (let i = 1; i < n; i++) {
    if (v[i] < Math.min(pre, suf[i + 1]) - 1e-7) return false;
    pre = Math.max(pre, v[i]);
  }
  return true;
}

/** μ′(x) = sup { α · 1_{A_α}(x) } sobre `niveles` niveles equiespaciados: la fórmula del teorema de representación. */
export function reconstruir(m, dom, niveles, n = N) {
  const cortes = Array.from({ length: niveles }, (_, k) => {
    const alfa = (k + 1) / niveles;
    return { alfa, tramos: corteAlfa(m, alfa, dom, n) };
  });
  return (x) => {
    let r = 0;
    for (const { alfa, tramos } of cortes) {
      if (tramos.some(([a, b]) => x >= a - TOL && x <= b + TOL)) r = alfa;
    }
    return r;
  };
}

export const cardinalSigma = (valores) => valores.reduce((s, v) => s + v, 0);
export const contenido = (m, v, dom, n = N) => muestras(dom, n).every((x) => m(x) <= v(x) + TOL);

/** Grado de inclusión de μ en ν (Kosko): Σ mín(μ, ν) entre Σ μ; vale 1 si μ es vacío. */
export function grado(m, v, dom, n = N) {
  let arriba = 0, abajo = 0;
  for (const x of muestras(dom, n)) { arriba += Math.min(m(x), v(x)); abajo += m(x); }
  return abajo === 0 ? 1 : arriba / abajo;
}
