// Relaciones difusas como matrices de grados, y el principio de extensión.
export const componer = (R, S) => R.map((f) => S[0].map((_, k) => Math.max(...f.map((v, j) => Math.min(v, S[j][k])))));
export const proyeccion = (R, eje) => (eje === 'filas' ? R.map((f) => Math.max(...f)) : R[0].map((_, j) => Math.max(...R.map((f) => f[j]))));
export const esReflexiva = (R) => R.every((f, i) => f[i] === 1);
export const esSimetrica = (R) => R.every((f, i) => f.every((v, j) => v === R[j][i]));
export const esTransitiva = (R) => R.every((f, i) => f.every((_, k) => f.every((v, j) => Math.min(v, R[j][k]) <= R[i][k])));
/** Las clases del corte de nivel a, si R es una similitud. */
export function grupos(R, a) {
  const hecho = new Set(), r = [];
  R.forEach((f, i) => { if (hecho.has(i)) return; const g = f.map((v, j) => (v >= a ? j : -1)).filter((j) => j >= 0); g.forEach((j) => hecho.add(j)); r.push(g); });
  return r;
}
export function extender(A, f) {
  const m = new Map();
  for (const [x, g] of A) { const y = f(x); m.set(y, Math.max(m.get(y) ?? 0, g)); }
  return [...m.entries()].sort((p, q) => p[0] - q[0]);
}
export function sumaDiscreta(A, B) {
  const m = new Map();
  for (const [x, a] of A) for (const [y, b] of B) m.set(x + y, Math.max(m.get(x + y) ?? 0, Math.min(a, b)));
  return [...m.entries()].sort((p, q) => p[0] - q[0]);
}
export const sumaTri = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const restaTri = (a, b) => [a[0] - b[2], a[1] - b[1], a[2] - b[0]];
export const cortesTri = ([a, b, c], al) => [a + al * (b - a), c - al * (c - b)];
