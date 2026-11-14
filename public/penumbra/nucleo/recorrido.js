// Lo que orienta a quien estudia: cuál es la siguiente parada y qué palabras se pueden preguntar.
export const UMBRAL_DOMINIO = 0.7;

/** El primer concepto escrito cuyo grado aún no llega al umbral; null si ya se dominan todos. */
export function siguienteConcepto(catalogo, progreso, umbral = UMBRAL_DOMINIO) {
  for (const region of catalogo) {
    for (const c of region.conceptos) {
      if (c.estado === 'listo' && progreso.gradoConcepto(c.id, c.retos) < umbral) return { ...c, region };
    }
  }
  return null;
}

/** «[[palabra]]» o «[[texto|clave]]» → botón que abre su explicación. Una clave desconocida es un error de contenido. */
export function enlazarTerminos(texto, glosario) {
  return String(texto).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, visible, clave) => {
    const k = clave ?? visible;
    if (!glosario[k]) throw new Error(`Término sin explicar: ${k}`);
    return `<button type="button" class="termino" data-termino="${k}">${visible}</button>`;
  });
}
