// Toda la luz que puede ver quien está a un radio dado, en una tabla. Un rayo solo depende de su ángulo con la radial (ψ):
// en vez de integrar la órbita en cada píxel, se integra una vez por ψ, y cada píxel solo la lee. Misma física, muchísimo menos trabajo.
export const LUT_W = 220, LUT_LADO = 260, LUT_H = LUT_LADO * 2, PHI_MAX = 14, EPS_FILAS = 2e-5, DEL_FILAS = 5e-4;
// Las columnas se aprietan en los ángulos pequeños: visto desde lejos, un rayo cruza casi todo el disco en muy poco ángulo.
export const POT_COL = 2.5; const phiCol = (c) => PHI_MAX * (c / (LUT_W - 1)) ** POT_COL, colPhi = (p) => (p / PHI_MAX) ** (1 / POT_COL) * (LUT_W - 1);
const BC = 2.598076211, L0 = Math.log(EPS_FILAS / (1 + DEL_FILAS)), L1 = Math.log((1 + EPS_FILAS) / DEL_FILAS);
export function psiCritico(r0) { const s = Math.min(1, (BC * Math.sqrt(1 - 1 / r0)) / r0); return r0 >= 1.5 ? Math.PI - Math.asin(s) : Math.asin(s); }
/** Las filas se aprietan alrededor del ángulo crítico, donde todo cambia deprisa, y también en los rayos casi radiales.
 Es una escala logit: x = (ln((s + ε) / (1 - s + δ)) - L0) / (L1 - L0). Cada lado se interpola por separado: nunca se mezcla un rayo que escapa con uno que cae. */
const psiDeFila = (r0, lado, x) => { const c = psiCritico(r0), y = Math.exp(L0 + x * (L1 - L0)), s = Math.min(1, Math.max(0, (y * (1 + DEL_FILAS) - EPS_FILAS) / (1 + y))); return lado === 0 ? c * (1 - s) : c + (Math.PI - c) * s; };
const f = (x) => -x + 1.5 * x * x;
export function construirLUT(r0, salida) {
  const L = salida ?? { uv: new Float32Array(LUT_W * LUT_H * 2), fin: new Float32Array(LUT_H * 4), r0 }; L.r0 = r0; L.psiC = psiCritico(r0); const { uv, fin } = L, u0 = 1 / r0, fs = Math.sqrt(Math.max(1 - u0, 1e-6)), umin = Math.min(0.5 / r0, 0.012);
  for (let fila = 0; fila < LUT_H; fila++) {
    const lado = fila < LUT_LADO ? 0 : 1, x = (fila - lado * LUT_LADO) / (LUT_LADO - 1), psi = psiDeFila(r0, lado, x), cp = Math.cos(psi), sp = Math.max(Math.sin(psi), 1e-3);
    let u = u0, v = (-u0 * fs * cp) / sp, fi = 0, estado = 0, col = 0, o = fila * LUT_W * 2;
    uv[o] = u; uv[o + 1] = v;
    for (col = 1; col < LUT_W && !estado; col++) {
      const dp = phiCol(col) - phiCol(col - 1), n = Math.max(1, Math.ceil(dp / (u > 0.5 ? 0.012 : u > 0.2 ? 0.03 : 0.07))), h = dp / n;
      for (let i = 0; i < n; i++) {
        const k1 = v, l1 = f(u), u2 = u + 0.5 * h * k1, k2 = v + 0.5 * h * l1, l2 = f(u2), u3 = u + 0.5 * h * k2, k3 = v + 0.5 * h * l2, l3 = f(u3), u4 = u + h * k3, k4 = v + h * l3, l4 = f(u4);
        u += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); v += (h / 6) * (l1 + 2 * l2 + 2 * l3 + l4); fi += h;
        if (u >= 0.995) { estado = 2; break; } if (u < umin && v < 0) { estado = 1; break; }
      }
      uv[o + col * 2] = u; uv[o + col * 2 + 1] = v;
    }
    for (let c = col; c < LUT_W; c++) { uv[o + c * 2] = u; uv[o + c * 2 + 1] = v; } // lo que sobra repite el final, por si se interpola en el borde
    fin[fila * 4] = fi; fin[fila * 4 + 1] = fi + Math.atan2(u, -v); fin[fila * 4 + 2] = estado === 1 ? 1 : 0;
  }
  return L;
}
const coordFila = (L, psi) => { const lado = psi < L.psiC ? 0 : 1, s = lado === 0 ? 1 - psi / L.psiC : (psi - L.psiC) / (Math.PI - L.psiC), q = Math.min(1, Math.max(s, 0)), x = (Math.log((q + EPS_FILAS) / (1 - q + DEL_FILAS)) - L0) / (L1 - L0), y = Math.min(0.999999, Math.max(0, x)) * (LUT_LADO - 1); return { base: lado * LUT_LADO, i: Math.floor(y), a: y - Math.floor(y) }; };
/** Lo mismo que hace el shader: las dos funciones de abajo son su réplica, para poder probarlo. */
export function leerEnd(L, psi) { const { base, i, a } = coordFila(L, psi), p = (base + i) * 4, q = p + 4; return { fin: L.fin[p] * (1 - a) + L.fin[q] * a, salida: L.fin[p + 1] * (1 - a) + L.fin[q + 1] * a, sale: L.fin[p + 2] * (1 - a) + L.fin[q + 2] * a > 0.5 }; }
export function leerUV(L, psi, phi) { const { base, i, a } = coordFila(L, psi), c = Math.min(LUT_W - 1.001, colPhi(phi)), j = Math.floor(c), b = c - j, at = (fi, co, k) => L.uv[(fi * LUT_W + co) * 2 + k], m = (k) => (at(base + i, j, k) * (1 - b) + at(base + i, j + 1, k) * b) * (1 - a) + (at(base + i + 1, j, k) * (1 - b) + at(base + i + 1, j + 1, k) * b) * a; return { u: m(0), v: m(1) }; }
