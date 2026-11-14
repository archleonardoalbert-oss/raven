// Dónde estabas exactamente: la etapa, el latido, el paso, el reto y los mandos. Se guarda a cada gesto, sin pedirlo.
const CLAVE = 'penumbra-lugar-v1';
const NOMBRES = ['La pregunta', 'Míralo', 'Tócalo', 'Entiéndelo', 'Demuéstralo', 'Parada terminada'];

export function crearLugar(almacen) {
  let datos = { ultimo: null, paradas: {} };
  try { const d = JSON.parse(almacen.getItem(CLAVE)); if (d?.paradas) datos = d; } catch { /* roto o bloqueado: se empieza de nuevo */ }
  const escribir = () => { try { almacen.setItem(CLAVE, JSON.stringify(datos)); } catch { /* sin almacenamiento */ } };
  return {
    guardar(c, lugar) { datos.ultimo = c; datos.paradas[c] = { ...lugar, cuando: Date.now() }; escribir(); },
    de: (c) => datos.paradas[c] ?? null,
    ultimo: () => (datos.ultimo ? { c: datos.ultimo, ...datos.paradas[datos.ultimo] } : null),
    /** El más reciente entre estas paradas: cada lado del mapa recuerda el suyo. */
    ultimoEntre(ids) { const c = ids.filter((i) => datos.paradas[i]).sort((a, b) => (datos.paradas[b].cuando ?? 0) - (datos.paradas[a].cuando ?? 0))[0]; return c ? { c, ...datos.paradas[c] } : null; },
    olvidar() { datos = { ultimo: null, paradas: {} }; try { almacen.removeItem(CLAVE); } catch { /* sin almacenamiento */ } },
  };
}

/** En palabras, para el botón de continuar. `tam` da los totales de esa parada, si se conocen. */
export function describirLugar(l, tam = {}) {
  const n = NOMBRES[l.etapa] ?? NOMBRES[0];
  if (l.etapa === 1 && tam.pasos) return `${n}, paso ${(l.paso ?? 0) + 1} de ${tam.pasos}`;
  if (l.etapa === 3 && tam.latidos) return `${n}, ${(l.latido ?? 0) + 1} de ${tam.latidos}`;
  if (l.etapa === 4 && tam.retos) return `${n}, reto ${(l.reto ?? 0) + 1} de ${tam.retos}`;
  return n;
}
