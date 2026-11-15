import { temporal } from './temporal.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MUESTRA } from './muestra.mjs';
import { construir } from '../construir.mjs';

// copia del proyecto sin demos/ para construir en aislado
function copia() {
  const r = temporal('raven-raiz-');
  for (const d of ['sitio', 'plantillas']) cpSync(d, join(r, d), { recursive: true });
  cpSync(MUESTRA, join(r, 'contenido'), { recursive: true });
  for (const id of ['penumbra', 'semillero', 'hortus']) mkdirSync(join(r, 'demos', id), { recursive: true });  // demos presentes (vacías)
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

test('con repo, la página enlaza al código en GitHub; sin repo, no', async () => {
  const r = copia();
  const f = join(r, 'contenido/proyectos.json'); const ps = JSON.parse(readFileSync(f, 'utf8'));
  ps.find((p) => p.id === 'penumbra').repo = 'archleonardoalbert-oss/penumbra-logica-difusa'; ps.find((p) => p.id === 'hortus').repo = '';
  writeFileSync(f, JSON.stringify(ps));
  await construir({ raiz: r, salida: 'dist' });
  assert.ok(readFileSync(join(r, 'dist/proyectos/penumbra/index.html'), 'utf8').includes('href="https://github.com/archleonardoalbert-oss/penumbra-logica-difusa"'));
  assert.ok(!readFileSync(join(r, 'dist/proyectos/hortus/index.html'), 'utf8').includes('github.com'));
});
