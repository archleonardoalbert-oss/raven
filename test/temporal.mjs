// Carpetas temporales para las pruebas que se borran solas al terminar el proceso: /tmp vive en la RAM y
// las copias del sitio (~40 MB cada una) se acumulaban entre ejecuciones.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const creadas = [];
process.on('exit', () => { for (const d of creadas) rmSync(d, { recursive: true, force: true }); });
export function temporal(prefijo = 'raven-') { const d = mkdtempSync(join(tmpdir(), prefijo)); creadas.push(d); return d; }
