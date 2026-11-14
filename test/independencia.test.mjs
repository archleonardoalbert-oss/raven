import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const archivos = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? archivos(p) : /\.(js|css|html)$/.test(n) ? [p] : []; });
const PRESTADO = /(\.\.\/)+(penumbra|hortus|semillero)\//;

test('ningún archivo de sitio/ ni plantillas/ carga recursos de las demos', () => {
  const malos = [];
  for (const f of [...archivos('sitio'), ...archivos('plantillas')]) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (PRESTADO.test(l) && !l.includes('<!--DEMO-->')) malos.push(`${f}:${i + 1}`);  // el botón de demo sí enlaza a ella
    });
  }
  assert.deepEqual(malos, []);
});
