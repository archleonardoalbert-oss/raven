// Las pruebas trabajan con una muestra fija de contenido (test/muestra/contenido), nunca con contenido/: ese lo
// edita Raven Manager y un cambio de textos o proyectos no debe romper ninguna prueba. sitio/ y plantillas/ sí
// son los reales (son código).
import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { temporal } from './temporal.mjs';

export const MUESTRA = new URL('./muestra/contenido', import.meta.url).pathname;
export function copiaMuestra({ demos = [], prefijo = 'raven-muestra-' } = {}) {
  const r = temporal(prefijo);
  for (const d of ['sitio', 'plantillas']) cpSync(d, join(r, d), { recursive: true });
  cpSync(MUESTRA, join(r, 'contenido'), { recursive: true });
  for (const id of demos) mkdirSync(join(r, 'demos', id), { recursive: true });
  return r;
}
