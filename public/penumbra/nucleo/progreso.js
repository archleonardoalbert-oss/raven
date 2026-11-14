// El progreso difuso: nada queda «completado», cada concepto tiene un grado en [0, 1] que sale solo de los retos.
const CLAVE = 'penumbra-progreso-v1';

function leer(almacen) {
  try {
    const crudo = JSON.parse(almacen.getItem(CLAVE));
    if (!crudo || typeof crudo !== 'object') return {};
    const limpio = {};
    for (const [c, retos] of Object.entries(crudo)) {
      if (!retos || typeof retos !== 'object') continue;
      limpio[c] = {};
      for (const [r, n] of Object.entries(retos)) if (typeof n === 'number' && Number.isFinite(n)) limpio[c][r] = Math.min(1, Math.max(0, n));
    }
    return limpio;
  } catch { return {}; }
}

/** `almacen` es localStorage; si está bloqueado o falla, el progreso dura lo que dure la sesión. */
export function crearProgreso(almacen = globalThis.localStorage) {
  let notas = leer(almacen ?? {});
  const guardar = () => { try { almacen.setItem(CLAVE, JSON.stringify(notas)); } catch { /* sin almacenamiento */ } };
  const media = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);

  const notaReto = (c, r) => notas[c]?.[r] ?? 0;
  const gradoConcepto = (c, retos) => media((retos ?? []).map((r) => notaReto(c, r.id)));
  return {
    registrar(c, r, nota) {
      const n = Math.min(1, Math.max(0, nota));
      notas[c] ??= {};
      notas[c][r] = Math.max(notas[c][r] ?? 0, n);
      guardar();
    },
    notaReto,
    gradoConcepto,
    gradoRegion(id, catalogo) {
      const region = catalogo.find((x) => x.id === id);
      return media((region?.conceptos ?? []).map((c) => gradoConcepto(c.id, c.retos)));
    },
    reiniciar() {
      notas = {};
      try { almacen.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    },
  };
}
