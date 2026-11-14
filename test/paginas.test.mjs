import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { construir } from '../construir.mjs';

// copia del proyecto sin demos/ para construir en aislado
function copia() {
  const r = mkdtempSync(join(tmpdir(), 'raven-raiz-'));
  for (const d of ['sitio', 'plantillas', 'contenido']) cpSync(d, join(r, d), { recursive: true });
  return r;
}

test('un proyecto sin demo no enlaza a una demo en su página', async () => {
  const r = copia();
  const f = join(r, 'contenido/proyectos.json'); const ps = JSON.parse(readFileSync(f, 'utf8'));
  ps.find((p) => p.id === 'penumbra').demo = false; writeFileSync(f, JSON.stringify(ps));
  await construir({ raiz: r, salida: 'dist' });
  const html = readFileSync(join(r, 'dist/proyectos/penumbra/index.html'), 'utf8');
  assert.ok(!html.includes('href="../../penumbra/"'), 'la página sigue enlazando a la demo');
  assert.ok(readFileSync(join(r, 'dist/proyectos/semillero/index.html'), 'utf8').includes('href="../../semillero/"'));
});
test('las plantillas de página no se publican', async () => {
  const r = copia(); await construir({ raiz: r, salida: 'dist' });
  assert.ok(!existsSync(join(r, 'dist/proyectos/penumbra/plantilla.html')));
});
