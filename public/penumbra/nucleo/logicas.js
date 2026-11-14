// Las lógicas de las normas T: operaciones, axiomas y comprobación numérica.
const LUK = { nombre: 'Łukasiewicz', t: (a, b) => Math.max(0, a + b - 1), r: (a, b) => Math.min(1, 1 - a + b) };
const GOD = { nombre: 'Gödel', t: Math.min, r: (a, b) => (a <= b ? 1 : b) };
const PRO = { nombre: 'Producto', t: (a, b) => a * b, r: (a, b) => (a <= b ? 1 : b / a) };
export const LOGICAS = { lukasiewicz: LUK, godel: GOD, producto: PRO };
export const NILPOTENTE = { nombre: 'Mínimo nilpotente', t: (a, b) => (a + b > 1 + 1e-12 ? Math.min(a, b) : 0), r: (a, b) => (a <= b + 1e-12 ? 1 : Math.max(1 - a, b)) };

export const neg = (L, a) => L.r(a, 0);
export const inf = (L, a, b) => L.t(a, L.r(a, b));
export const sup = (L, a, b) => inf(L, L.r(L.r(a, b), b), L.r(L.r(b, a), a));

export const AXIOMAS_BL = [
  { id: 'A1', f: (L, a, b, c) => L.r(L.r(a, b), L.r(L.r(b, c), L.r(a, c))) },
  { id: 'A2', f: (L, a, b) => L.r(L.t(a, b), a) },
  { id: 'A3', f: (L, a, b) => L.r(L.t(a, b), L.t(b, a)) },
  { id: 'A4', f: (L, a, b) => L.r(L.t(a, L.r(a, b)), L.t(b, L.r(b, a))) },
  { id: 'A5a', f: (L, a, b, c) => L.r(L.r(a, L.r(b, c)), L.r(L.t(a, b), c)) },
  { id: 'A5b', f: (L, a, b, c) => L.r(L.r(L.t(a, b), c), L.r(a, L.r(b, c))) },
  { id: 'A6', f: (L, a, b, c) => L.r(L.r(L.r(a, b), c), L.r(L.r(L.r(b, a), c), c)) },
  { id: 'A7', f: (L, a) => L.r(0, a) },
];
export const EXTRA = {
  lukasiewicz: { id: 'doble', f: (L, a) => L.r(neg(L, neg(L, a)), a) },
  godel: { id: 'contraccion', f: (L, a) => L.r(a, L.t(a, a)) },
  producto: { id: 'cancelar', f: (L, a, b) => sup(L, neg(L, a), L.r(L.r(a, L.t(a, b)), b)) },
};
export const FORMULAS = [
  { id: 'identidad', tex: String.raw`\varphi \to \varphi`, nombre: 'Lo que se implica a sí mismo', f: (L, a) => L.r(a, a) },
  { id: 'tercio', tex: String.raw`\varphi \vee \neg\varphi`, nombre: 'El tercio excluso', f: (L, a) => sup(L, a, neg(L, a)) },
  { id: 'doble', tex: String.raw`\neg\neg\varphi \to \varphi`, nombre: 'La doble negación', f: EXTRA.lukasiewicz.f },
  { id: 'contraccion', tex: String.raw`\varphi \to (\varphi \,\&\, \varphi)`, nombre: 'La contracción', f: EXTRA.godel.f },
  { id: 'nocontra', tex: String.raw`\neg(\varphi \,\&\, \neg\varphi)`, nombre: 'La no contradicción', f: (L, a) => neg(L, L.t(a, neg(L, a))) },
];
export const rejilla = (n) => Array.from({ length: n }, (_, i) => i / (n - 1));
/** El valor más bajo de una fórmula. Si es 1, se comporta como tautología en esa rejilla. */
export function peorValor(fm, L, n = 21) {
  let m = 1;
  const G = rejilla(n);
  for (const a of G) for (const b of G) for (const c of G) m = Math.min(m, fm.f(L, a, b, c));
  return m;
}
export const sumaOrdinal = (bloques) => (a, b) => {
  for (const [u, v, T] of bloques) if (a >= u && a <= v && b >= u && b <= v && v > u) return u + (v - u) * T((a - u) / (v - u), (b - u) / (v - u));
  return Math.min(a, b);
};
export const cadena = (n) => rejilla(n);
