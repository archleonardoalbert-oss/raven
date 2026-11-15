import { temporal } from './temporal.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, writeFileSync, readFileSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { construir } from '../construir.mjs';
import { volcarTextos } from '../herramientas/volcar-textos.mjs';
import { copiaMuestra } from './muestra.mjs';

const referencia = JSON.parse(readFileSync('test/referencia/textos.json', 'utf8'));
const nuevo = () => temporal('raven-');

test('dist contiene sitio y demos', async () => {
  const tmp = nuevo(); await construir({ salida: tmp });
  assert.ok(existsSync(`${tmp}/index.html`));
  if (existsSync('demos/penumbra')) assert.ok(existsSync(`${tmp}/penumbra/index.html`));  // en CI las demos pueden faltar si fallan
});
// la referencia se construye con la muestra fija de contenido (no con contenido/, que edita Raven Manager) y con
// las tres demos presentes: vigila que el código de construcción no altere ningún texto
const copiaConDemos = () => copiaMuestra({ demos: ['penumbra', 'semillero', 'hortus'], prefijo: 'raven-raiz-' });
test('los textos de dist coinciden con la referencia', async () => {
  const r = copiaConDemos(), tmp = join(r, 'dist'); await construir({ raiz: r, salida: 'dist' });
  assert.deepEqual(volcarTextos(tmp), referencia);
});
test('construir vacía la salida antes y no deja restos', async () => {
  const tmp = nuevo(); writeFileSync(`${tmp}/viejo.txt`, 'x'); mkdirSync(`${tmp}/viejo`);
  await construir({ salida: tmp });
  assert.ok(!existsSync(`${tmp}/viejo.txt`)); assert.ok(!existsSync(`${tmp}/viejo`));
});
