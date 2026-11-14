// Implicaciones, modificadores y razonamiento con grados.
export const cerrar = (v) => Math.min(1, Math.max(0, v));
export const IMPLICACIONES = {
  kleene: (a, b) => Math.max(1 - a, b),
  lukasiewicz: (a, b) => Math.min(1, 1 - a + b),
  godel: (a, b) => (a <= b ? 1 : b),
  zadeh: (a, b) => Math.max(Math.min(a, b), 1 - a),
};
export const muy = (v) => v * v;
export const algo = (v) => Math.sqrt(v);
/** Con la regla min(A, B), la entrada A' produce B recortado a la altura del solape entre A' y A. */
export function mpMamdani(Ap, A, B, dom) {
  const altura = Math.max(...dom.map((x) => Math.min(Ap(x), A(x))));
  return { altura, salida: (y) => Math.min(altura, B(y)) };
}
/** El mayor c con mín(a, c) ≤ b. */
export const alfaOp = (a, b) => (a <= b ? 1 : b);
/** (P⁻¹ α R): la mayor Q que puede resolver P ∘ Q = R. */
export const componerAlfa = (P, R) => P[0].map((_, j) => R[0].map((_, k) => Math.min(...P.map((f, i) => alfaOp(f[j], R[i][k])))));
