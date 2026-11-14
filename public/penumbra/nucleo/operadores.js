// «Y», «o» y «no» con grados: las familias de operadores.
export const NORMAS_T = {
  minimo: Math.min,
  producto: (a, b) => a * b,
  lukasiewicz: (a, b) => Math.max(0, a + b - 1),
  drastica: (a, b) => (a === 1 ? b : b === 1 ? a : 0),
};
/** La norma S de De Morgan: S(a, b) = 1 − T(1 − a, 1 − b). */
export const dual = (T) => (a, b) => 1 - T(1 - a, 1 - b);
export const yager = (p) => (a, b) => Math.max(0, 1 - ((1 - a) ** p + (1 - b) ** p) ** (1 / p));
export const sugeno = (l) => (a) => (1 - a) / (1 + l * a);
export const yagerC = (w) => (a) => (1 - a ** w) ** (1 / w);
/** Generador aditivo decreciente f con f(1) = 0, y su inversa g con corte en f(0). */
export const GENERADORES = {
  producto: { f: (a) => -Math.log(a), g: (u) => Math.exp(-u), f0: Infinity },
  lukasiewicz: { f: (a) => 1 - a, g: (u) => 1 - u, f0: 1 },
};
export const sumaCon = ({ f, g, f0 }) => (a, b) => (f(a) + f(b) >= f0 ? 0 : g(f(a) + f(b)));
