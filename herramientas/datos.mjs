// Validación de habilidades y generación de los módulos de datos que leen la galaxia y el agujero negro.
// las habilidades citan proyectos por id; «raven» es la propia web (no está en la biblioteca)
const PROPIO = { id: 'raven', nombre: 'Raven' };

export function validarHabilidades(areas, proyectos) {
  const ids = new Set([PROPIO.id, ...proyectos.map((p) => p.id)]);
  for (const a of areas) {
    if (!a.es || !a.en || !a.lema?.es || !a.lema?.en) throw new Error(`Área incompleta: ${a.es ?? '¿?'}`);
    if (!a.habilidades?.length) throw new Error(`Área sin habilidades: ${a.es}`);
    for (const h of a.habilidades) for (const p of h.proyectos ?? []) {
      if (!ids.has(p)) throw new Error(`La habilidad «${h.es}» cita un proyecto que no existe: ${p}`);
    }
  }
}

export function modulosDatos({ habilidades, proyectos, sistemas }) {
  const visible = Object.fromEntries([PROPIO, ...proyectos].map((p) => [p.id, p.nombreCorto ?? p.nombre]));
  const AREAS = habilidades.map((a) => ({ es: a.es, en: a.en, lema: a.lema, h: a.habilidades.map((h) => ({ es: h.es, en: h.en, p: (h.proyectos ?? []).map((id) => visible[id]) })) }));
  const SISTEMAS = Object.fromEntries(proyectos.filter((p) => p.principal).map((p) => [p.id, sistemas[p.id]]));
  const cab = '// Generado por construir.mjs desde contenido/: no editar a mano.\n';
  return {
    habilidades: `${cab}export const AREAS = ${JSON.stringify(AREAS, null, 2)};\n`,
    sistemas: `${cab}export const SISTEMAS = ${JSON.stringify(SISTEMAS, null, 2)};\n`,
  };
}
