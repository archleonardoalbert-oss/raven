import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { construir } from '../construir.mjs';
import { volcarTextos } from '../herramientas/volcar-textos.mjs';

const referencia = JSON.parse(readFileSync('test/referencia/textos.json', 'utf8'));
const nuevo = () => mkdtempSync(join(tmpdir(), 'raven-'));

test('dist contiene sitio y demos', async () => {
  const tmp = nuevo(); await construir({ salida: tmp });
  assert.ok(existsSync(`${tmp}/index.html`));
  if (existsSync('demos/penumbra')) assert.ok(existsSync(`${tmp}/penumbra/index.html`));  // en CI las demos pueden faltar si fallan
});
test('los textos de dist coinciden con la referencia', async () => {
  const tmp = nuevo(); await construir({ salida: tmp });
  assert.deepEqual(volcarTextos(tmp), referencia);
});
test('construir vacía la salida antes y no deja restos', async () => {
  const tmp = nuevo(); writeFileSync(`${tmp}/viejo.txt`, 'x'); mkdirSync(`${tmp}/viejo`);
  await construir({ salida: tmp });
  assert.ok(!existsSync(`${tmp}/viejo.txt`)); assert.ok(!existsSync(`${tmp}/viejo`));
});
