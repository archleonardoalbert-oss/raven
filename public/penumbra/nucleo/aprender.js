// Aprender de los datos: c-medias difusas, ajuste de un sistema de Sugeno y reducción de tipo.
const d2 = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** Los puntos de la «mariposa» de Bezdek: dos alas y un puente en el centro. */
export const MARIPOSA = [[0, 0], [0, 2], [0, 4], [1, 1], [1, 2], [1, 3], [2, 2], [3, 2], [4, 2], [5, 1], [5, 2], [5, 3], [6, 0], [6, 2], [6, 4]];

export function fcmPertenencias(datos, centros, m) {
  return datos.map((x) => {
    const D = centros.map((v) => d2(x, v)), cero = D.findIndex((v) => v < 1e-18);
    if (cero >= 0) return D.map((_, i) => (i === cero ? 1 : 0));
    return D.map((di) => 1 / D.reduce((s, dj) => s + (di / dj) ** (1 / (m - 1)), 0));
  });
}
export function fcmCentros(datos, U, m) {
  return U[0].map((_, i) => {
    const pesos = U.map((u) => u[i] ** m), tot = pesos.reduce((a, b) => a + b, 0);
    return datos[0].map((_x, k) => datos.reduce((s, x, n) => s + pesos[n] * x[k], 0) / tot);
  });
}
export const fcmCoste = (datos, centros, U, m) => datos.reduce((s, x, n) => s + centros.reduce((a, v, i) => a + U[n][i] ** m * d2(x, v), 0), 0);

/** Devuelve la historia: en la vuelta 0, los centros iniciales. */
export function fcm(datos, inicial, m, vueltas) {
  let centros = inicial, U = fcmPertenencias(datos, centros, m);
  const h = [{ centros, U, coste: fcmCoste(datos, centros, U, m) }];
  for (let t = 0; t < vueltas; t++) {
    centros = fcmCentros(datos, U, m);
    const costeCentros = fcmCoste(datos, centros, U, m);
    U = fcmPertenencias(datos, centros, m);
    h.push({ centros, U, coste: Math.min(costeCentros, fcmCoste(datos, centros, U, m)) });
  }
  return h;
}

export const objetivoAnfis = (x) => 0.5 + 0.32 * Math.sin(7 * x) * Math.cos(1.5 * x);
export const DATOS_ANFIS = Array.from({ length: 31 }, (_, i) => [i / 30, objetivoAnfis(i / 30)]);
export const INICIO_ANFIS = { c: [0.05, 0.3, 0.55, 0.8], s: [0.12, 0.12, 0.12, 0.12], z: [0.5, 0.5, 0.5, 0.5] };

const fuerzas = (p, x) => p.c.map((c, i) => Math.exp(-((x - c) ** 2) / (2 * p.s[i] ** 2)));
export function anfisSalida(p, x) {
  const w = fuerzas(p, x), t = w.reduce((a, b) => a + b, 0);
  return t > 1e-12 ? w.reduce((a, v, i) => a + v * p.z[i], 0) / t : 0;
}
export const anfisError = (p, datos) => Math.sqrt(datos.reduce((s, [x, y]) => s + (anfisSalida(p, x) - y) ** 2, 0) / datos.length);

/** Una vuelta: mueve cada número un poco cuesta abajo del error cuadrático. */
export function anfisPaso(p, datos, eta) {
  const n = p.c.length, gc = Array(n).fill(0), gs = Array(n).fill(0), gz = Array(n).fill(0);
  for (const [x, y] of datos) {
    const w = fuerzas(p, x), t = Math.max(w.reduce((a, b) => a + b, 0), 1e-9), f = w.reduce((a, v, i) => a + v * p.z[i], 0) / t, e = f - y;
    for (let i = 0; i < n; i++) {
      const dz = (p.z[i] - f) / t, u = x - p.c[i];
      gz[i] += e * (w[i] / t);
      gc[i] += e * dz * w[i] * (u / p.s[i] ** 2);
      gs[i] += e * dz * w[i] * (u * u / p.s[i] ** 3);
    }
  }
  const k = eta / datos.length * 4;
  return { c: p.c.map((v, i) => v - k * gc[i]), s: p.s.map((v, i) => Math.max(0.03, v - k * gs[i])), z: p.z.map((v, i) => v - k * gz[i]) };
}
export function anfisEntrena(inicio, datos, { epocas, eta, cada = 1 }) {
  let p = inicio;
  const h = [{ epoca: 0, p, error: anfisError(p, datos) }];
  for (let e = 1; e <= epocas; e++) {
    p = anfisPaso(p, datos, eta);
    if (e % cada === 0) h.push({ epoca: e, p, error: anfisError(p, datos) });
  }
  return h;
}

/** La salida de Sugeno recorre un intervalo si cada peso puede moverse entre lo y up. Busca sus extremos. */
export function kmIntervalo(z, lo, up) {
  const orden = z.map((_, i) => i).sort((a, b) => z[a] - z[b]), Z = orden.map((i) => z[i]), L = orden.map((i) => lo[i]), U = orden.map((i) => up[i]);
  const media = (w) => { const t = w.reduce((a, b) => a + b, 0); return t > 1e-12 ? w.reduce((a, v, i) => a + v * Z[i], 0) / t : 0; };
  let a = Infinity, b = -Infinity;
  for (let k = 0; k <= Z.length; k++) {
    a = Math.min(a, media(Z.map((_, i) => (i < k ? U[i] : L[i]))));
    b = Math.max(b, media(Z.map((_, i) => (i < k ? L[i] : U[i]))));
  }
  return [a, b];
}
