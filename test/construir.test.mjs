import { temporal } from './temporal.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, writeFileSync, readFileSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { construir } from '../construir.mjs';
import { volcarTextos } from '../herramientas/volcar-textos.mjs';

const referencia = JSON.parse(readFileSync('test/referencia/textos.json', 'utf8'));
const nuevo = () => temporal('raven-');

test('dist contiene sitio y demos', async () => {
  const tmp = nuevo(); await construir({ salida: tmp });
  assert.ok(existsSync(`${tmp}/index.html`));
  if (existsSync('demos/penumbra')) assert.ok(existsSync(`${tmp}/penumbra/index.html`));  // en CI las demos pueden faltar si fallan
});
// la referencia no depende de que las demos existan: se construye en una copia con las tres demos presentes
function copiaConDemos() {
  const r = temporal('raven-raiz-');
  for (const d of ['sitio', 'plantillas', 'contenido']) cpSync(d, join(r, d), { recursive: true });
  for (const id of ['penumbra', 'semillero', 'hortus']) mkdirSync(join(r, 'demos', id), { recursive: true });
  return r;
}
test('los textos de dist coinciden con la referencia', async () => {
  const r = copiaConDemos(), tmp = join(r, 'dist'); await construir({ raiz: r, salida: 'dist' });
  assert.deepEqual(volcarTextos(tmp), referencia);
});
test('construir vacía la salida antes y no deja restos', async () => {
  const tmp = nuevo(); writeFileSync(`${tmp}/viejo.txt`, 'x'); mkdirSync(`${tmp}/viejo`);
  await construir({ salida: tmp });
  assert.ok(!existsSync(`${tmp}/viejo.txt`)); assert.ok(!existsSync(`${tmp}/viejo`));
});
