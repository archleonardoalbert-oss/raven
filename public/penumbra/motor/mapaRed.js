// La red neuronal del cruce: pesos y activaciones reales (una pasada hacia delante de verdad), y la ruta que la recorre.
// Las neuronas de la ruta son los capítulos del amanecer: el camino que vuelas al entrar es el curso.
import { ev } from './tiempo.js';

export const CAPAS = [10, 18, 22, 24, 22, 18, 12];
export const DURA_CRUCE = 47;
export const CENTRO_RED = [0.5, 2.7, 1.55];
const sig = (x) => 1 / (1 + Math.exp(-x));

function azar(semilla) { let s = semilla >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; let x = s; x ^= x >>> 15; x = Math.imul(x, 2654435761) >>> 0; return (x ^ (x >>> 13)) >>> 0 ? ((x ^ (x >>> 13)) >>> 0) / 4294967296 : 0.5; }; }

/** `cimas`: dónde está cada capítulo sobre el terreno; hay tantos como capas ocultas. */
export function crearRed(cimas) {
  const r = azar(20261106), nodos = [], porCapa = [];
  CAPAS.forEach((n, c) => {
    const lista = [];
    for (let k = 0; k < n; k++) {
      // anamorfosis: en altura van a intervalos regulares, y en profundidad, al azar. Desde dentro, un cielo sin orden; solo desde el lado exacto,
      // cada capa se ve como la columna perfecta de un diagrama. Nunca se mueven: todo cuadra por el punto de vista.
      const altoCapa = 0.95 * Math.sqrt(n / 24), yd = (r() - 0.5) * 0.85; r();
      const orden = [CENTRO_RED[0] - 1.75 + (3.5 * c) / (CAPAS.length - 1) + (r() - 0.5) * 0.015, CENTRO_RED[1] + yd, CENTRO_RED[2] + altoCapa * (((2 * k + 1) / n) - 1)];
      const caos = orden;
      const nodo = { i: nodos.length, capa: c, caos, orden, fin: orden, cima: null, sesgo: (r() - 0.5) * 1.2, activ: c === 0 ? r() : 0, esCapitulo: false, ruta: -1 };
      nodos.push(nodo); lista.push(nodo);
    }
    porCapa.push(lista);
  });
  const todas = [];
  for (let c = 0; c + 1 < CAPAS.length; c++) for (const b of porCapa[c + 1]) for (const a of porCapa[c]) todas.push({ a: a.i, b: b.i, w: (r() - 0.5) * 2.4 / Math.sqrt(CAPAS[c] / 10) });
  // la pasada hacia delante
  for (let c = 1; c < CAPAS.length; c++) for (const b of porCapa[c]) {
    let s = b.sesgo;
    for (const e of todas) if (e.b === b.i) s += e.w * nodos[e.a].activ;
    b.activ = sig(s);
  }
  // la ruta: en cada capa, la neurona a la que más empuja la anterior, entre las que quedan a un giro suave
  const inicio = porCapa[0].reduce((m, n) => (Math.hypot(n.orden[1] - CENTRO_RED[1], n.orden[2] - CENTRO_RED[2]) < 0.55 && n.activ > m.activ ? n : m), { activ: -1 }), ruta = [inicio.i];
  for (let c = 1; c < CAPAS.length; c++) {
    const previa = ruta.at(-1), pp = nodos[previa].orden;
    let mejor = null, mv = -Infinity;
    for (const e of todas) if (e.a === previa) { const q = nodos[e.b].orden, lat = Math.hypot(q[1] - pp[1], q[2] - pp[2]); const v = e.w * nodos[previa].activ + nodos[e.b].activ * 0.4 - lat * 0.9 - (lat > 0.72 ? 50 : 0); if (v > mv) { mv = v; mejor = e.b; } }
    ruta.push(mejor);
  }
  ruta.forEach((i, k) => { nodos[i].ruta = k; });
  // los capítulos: las capas ocultas de la ruta
  for (let k = 1; k + 1 < ruta.length; k++) { const n = nodos[ruta[k]]; if (cimas[k - 1]) { n.cima = cimas[k - 1]; n.esCapitulo = true; } }
  // se dibujan las aristas que pesan, y siempre las de la ruta
  const enRutaE = (e) => nodos[e.a].ruta >= 0 && nodos[e.b].ruta === nodos[e.a].ruta + 1;
  const orden = [...todas].sort((x, y) => Math.abs(y.w) - Math.abs(x.w)), corte = Math.abs(orden[Math.floor(orden.length * 0.2)].w);
  const aristas = todas.filter((e) => enRutaE(e) || Math.abs(e.w) >= corte);
  // polvo: luces sueltas, sin conexiones: el fondo de estrellas del viaje. Se apagan al alejarse, y queda solo la red.
  const polvo = Array.from({ length: 1400 }, () => { const az = r() * 6.2832, po = Math.acos(2 * r() - 1), R = 0.5 + 8 * Math.cbrt(r()), p = [CENTRO_RED[0] - 1.2 + R * Math.sin(po) * Math.cos(az), CENTRO_RED[1] + R * Math.sin(po) * Math.sin(az), CENTRO_RED[2] + 0.8 * R * Math.cos(po)]; return { caos: p, activ: r() * r() }; });
  return { nodos, todas, aristas, ruta, porCapa, polvo };
}

const resta = (a, b) => a.map((v, i) => v - b[i]), suma = (a, b, k = 1) => a.map((v, i) => v + b[i] * k), lon = (a) => Math.hypot(...a), unit = (a) => { const l = lon(a) || 1; return a.map((v) => v / l); }, sm = (x) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

/** Catmull-Rom centrípeta: nunca hace bucles ni se pasa, aunque los puntos estén a distancias muy distintas. */
function curvaSuave(P, porTramo = 200) {
  const Q = [suma(P[0], resta(P[0], P[1])), ...P, suma(P.at(-1), resta(P.at(-1), P.at(-2)))], S = [];
  for (let i = 1; i + 2 < Q.length; i++) {
    const [p0, p1, p2, p3] = [Q[i - 1], Q[i], Q[i + 1], Q[i + 2]], t1 = lon(resta(p1, p0)) ** 0.5, t2 = t1 + lon(resta(p2, p1)) ** 0.5, t3 = t2 + lon(resta(p3, p2)) ** 0.5;
    for (let j = 0; j < porTramo; j++) {
      const t = t1 + ((t2 - t1) * j) / porTramo, m = (a, b, ta, tb) => suma(a.map((v) => (v * (tb - t)) / (tb - ta)), b.map((v) => (v * (t - ta)) / (tb - ta))), A1 = m(p0, p1, 0, t1), A2 = m(p1, p2, t1, t2), A3 = m(p2, p3, t2, t3), B1 = m(A1, A2, 0, t2), B2 = m(A2, A3, t1, t3);
      S.push(m(B1, B2, t1, t2));
    }
  }
  S.push(P.at(-1));
  return S;
}

const FIN_VUELO = 35.5, TABLA = 120;
/** La velocidad deseada a lo largo de la película: llega lanzada desde la Luna, se calma entre las neuronas, y sale barriendo hacia fuera. */
const CLAVES_V = [[0, 1.05], [7.5, 0.62], [11.5, 0.3], [25.5, 0.3], [28.5, 0.85], [31, 1.45], [FIN_VUELO, 0]];
function velocidad(t) {
  for (let i = 0; i + 1 < CLAVES_V.length; i++) { const [a, va] = CLAVES_V[i], [b, vb] = CLAVES_V[i + 1]; if (t <= b) return va + (vb - va) * sm((t - a) / (b - a)); }
  return 0;
}

/** El vuelo entero, tabulado: posición por longitud de arco, y mirada suavizada en el tiempo. Una sola curva, de las estrellas al punto desde el que todo cuadra. */
export function crearVuelo(red) {
  const N = red.ruta.map((i) => red.nodos[i].orden), a = N[0], z = N.at(-1), ang = -0.07, D = 6.5;
  const llegada = [CENTRO_RED[0] + D * Math.sin(ang), CENTRO_RED[1] - D * Math.cos(ang), CENTRO_RED[2] + 0.16];
  // se pasa muy cerca de cada neurona, nunca a través: un pequeño desvío que alterna de lado
  const conDesvio = N.map((p, k) => [p[0], p[1] + (k % 2 ? 0.045 : -0.045), p[2] + (k % 2 ? -0.03 : 0.03)]);
  const P = [suma(a, [-8.2, -0.5, 0.3]), suma(a, [-4.6, -0.3, 0.18]), suma(a, [-1.8, -0.1, 0.06]), ...conDesvio, suma(z, [0.62, -0.28, 0.06]), [z[0] + 1.25, CENTRO_RED[1] - 1.05, z[2] + 0.14], [z[0] + 1.1, CENTRO_RED[1] - 3.0, CENTRO_RED[2] + 0.25], [CENTRO_RED[0] + 1.25, CENTRO_RED[1] - 5.3, CENTRO_RED[2] + 0.22], llegada];
  const C = curvaSuave(P), L = [0];
  for (let i = 1; i < C.length; i++) L.push(L[i - 1] + lon(resta(C[i], C[i - 1])));
  const total = L.at(-1), enS = (s) => { const x = Math.min(total, Math.max(0, s)); let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= x) lo = m; else hi = m; } const f = (x - L[lo]) / Math.max(L[hi] - L[lo], 1e-9); return suma(C[lo], resta(C[hi], C[lo]), f); };
  const sNodo = conDesvio.map((p) => { let m = 0, d = Infinity; C.forEach((q, i) => { const e = lon(resta(q, p)); if (e < d) { d = e; m = i; } }); return L[m]; });
  // velocidad integrada; aminora un poco al pasar junto a cada neurona, sin llegar nunca a parar
  const n = Math.ceil(DURA_CRUCE * TABLA) + 1, S = new Float64Array(n);
  for (let i = 1; i < n; i++) { const t = (i - 1) / TABLA; let fr = 1; for (const q of sNodo) fr -= 0.3 * Math.exp(-(((S[i - 1] - q) / 0.13) ** 2)); S[i] = S[i - 1] + (velocidad(t) * Math.max(fr, 0.4)) / TABLA; }
  const esc = total / S[n - 1];
  // la distancia prevista se reparte en la real: se recorre exactamente la curva
  const ojo = Array.from(S, (s) => enS(s * esc));
  // la mirada: hacia delante por la curva, atraída por la neurona que viene; y al salir, hacia el centro de la red
  const miraCruda = Array.from(S, (s0, i) => {
    const s = s0 * esc, t = i / TABLA, p = ojo[i];
    let ade = [0, 0, 0]; for (const d of [0.22, 0.42, 0.62, 0.85, 1.1]) ade = suma(ade, unit(resta(enS(s + d), p)), 0.2);
    let hacia = ade; const sig = sNodo.findIndex((q) => q > s + 0.02);
    if (sig >= 0) { const dist = lon(resta(N[sig], p)); hacia = suma(ade, unit(resta(N[sig], p)), 0.5 * sm((1.1 - dist) / 0.5) * sm(dist / 0.18)); }
    return suma(unit(hacia), resta(unit(resta(CENTRO_RED, p)), unit(hacia)), sm((t - 23.4) / 9.6));
  });
  // suavizado gaussiano en el tiempo (tres pasadas de caja): el giro de un avión grande
  const caja = (A, r) => { const B = A.map(() => [0, 0, 0]); let acc = [0, 0, 0]; const m = A.length, w = 2 * r + 1, de = (i) => A[Math.min(m - 1, Math.max(0, i))]; for (let i = -r; i <= r; i++) acc = suma(acc, de(i)); for (let i = 0; i < m; i++) { B[i] = acc.map((v) => v / w); acc = suma(suma(acc, de(i + r + 1)), de(i - r), -1); } return B; };
  const dir = caja(caja(caja(miraCruda, 54), 54), 54).map(unit);
  // el alabeo nace de la curvatura, como al inclinarse en un giro
  const giro = dir.map((d, i) => { if (i + 1 >= dir.length) return [0, 0, 0]; const e = resta(dir[i + 1], d), der = unit([d[1], -d[0], 0]); return [(e[0] * der[0] + e[1] * der[1]) * TABLA, 0, 0]; });
  const alabeo = caja(caja(giro, 70), 70).map((g, i) => [Math.max(-0.42, Math.min(0.42, g[0] * 0.55)) * (1 - sm((i / TABLA - 24) / 6))]);
  const tNodos = sNodo.map((q) => { const v = q / esc; let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= v) lo = m; else hi = m; } return lo / TABLA; });
  const mezcla = (A, f, i) => A[i].map((v, k) => v + (A[Math.min(i + 1, n - 1)][k] - v) * f);
  /** Qué neurona de la ruta toca ahora: i al pasar junto a la neurona i; negativa antes de la primera. */
  const uDe = (s) => { if (s <= sNodo[0]) return (s - sNodo[0]) / (sNodo[1] - sNodo[0]); for (let k = 0; k + 1 < sNodo.length; k++) if (s < sNodo[k + 1]) return k + (s - sNodo[k]) / (sNodo[k + 1] - sNodo[k]); return sNodo.length - 1 + (s - sNodo.at(-1)) / (sNodo.at(-1) - sNodo.at(-2)); };
  const en = (t) => {
    const x = Math.min(n - 1.001, Math.max(0, t * TABLA)), i = Math.floor(x), f = x - i;
    return { ojo: mezcla(ojo, f, i), dir: unit(mezcla(dir, f, i)), alabeo: mezcla(alabeo, f, i)[0], fov: 72 + (30 - 72) * sm((t - 27) / 8.5), u: uDe((S[i] + (S[Math.min(i + 1, n - 1)] - S[i]) * f) * esc) };
  };
  return { en, tNodos, total };
}

export function guionCruce(t) {
  return {
    negro: ev(t, 0, 1.6), retro: ev(t, 27, 35), orden: 1, baja: 0, lejos: ev(t, 25.5, 32.5), nebula: 1 - ev(t, 36, 41),
    aristas: 0.5 * ev(t, 8.5, 14) + 0.5 * ev(t, 30, 35), polvo: 1 - ev(t, 29, 34),
    ola: ev(t, 33, 34), nombres: ev(t, 37.6, 38.8) * (1 - ev(t, 41.6, 42.4)), oroRuta: ev(t, 36.4, 38),
    hilos: ev(t, 39.6, 42.6), alba: ev(t, 39.6, 45), suelo: ev(t, 39.8, 43.4), giro: ev(t, 40.6, 45.6), fuerza: 1 - ev(t, 42.4, 44.4),
    rotulos: ev(t, 44.6, 45.6), camino: ev(t, 43.5, 45.8), ui: ev(t, 45.4, 46.8),
    textos: [
      ['Parecen estrellas.', ev(t, 2.4, 3.6) * (1 - ev(t, 6, 7))],
      ['Pero están conectadas.', ev(t, 9.6, 10.8) * (1 - ev(t, 13.2, 14.2))],
      ['Cada una calcula un grado, y se lo pasa a las siguientes.', ev(t, 16, 17) * (1 - ev(t, 21, 22))],
      ['Es una red neuronal.', ev(t, 34, 35) * (1 - ev(t, 36.8, 37.5))],
      ['Y las neuronas que has cruzado son este camino.', ev(t, 37.8, 38.7) * (1 - ev(t, 40.8, 41.6))],
    ],
    titulo: ev(t, 43.2, 44.2) * (1 - ev(t, 45.2, 45.9)),
  };
}
