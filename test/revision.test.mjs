import { temporal } from './temporal.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { construir } from '../construir.mjs';
import { validarProyectos } from '../herramientas/portada.mjs';

function copia({ demos = [] } = {}) {
  const r = temporal('raven-rev-');
  for (const d of ['sitio', 'plantillas', 'contenido']) cpSync(d, join(r, d), { recursive: true });
  for (const id of demos) mkdirSync(join(r, 'demos', id), { recursive: true });
  return r;
}
const editarProyectos = (r, f) => { const ruta = join(r, 'contenido/proyectos.json'); const ps = JSON.parse(readFileSync(ruta, 'utf8')); f(ps); writeFileSync(ruta, JSON.stringify(ps)); };

test('un proyecto sin traducción de su descripción: error que nombra proyecto y campo', () => {
  const ps = JSON.parse(readFileSync('contenido/proyectos.json', 'utf8')); delete ps[0].desc.en;
  assert.throws(() => validarProyectos(ps), /penumbra.*desc\.en/);
});
test('un $ o un {{ en los textos de un proyecto sale literal', async () => {
  const r = copia(); editarProyectos(r, (ps) => { ps[0].desc.es = 'Precio $& y $\' y $$x$$ y {{t nada}}'; });
  await construir({ raiz: r, salida: 'dist' });
  assert.ok(readFileSync(join(r, 'dist/index.html'), 'utf8').includes('Precio $&amp; y $\' y $$x$$ y {{t nada}}') || readFileSync(join(r, 'dist/index.html'), 'utf8').includes('Precio $& y $\' y $$x$$ y {{t nada}}'));
});
test('demo:true pero sin carpeta en demos/: no hay botón de demo', async () => {
  const r = copia({ demos: ['semillero'] }); await construir({ raiz: r, salida: 'dist' });
  assert.ok(!readFileSync(join(r, 'dist/proyectos/hortus/index.html'), 'utf8').includes('href="../../hortus/"'));
  assert.ok(readFileSync(join(r, 'dist/proyectos/semillero/index.html'), 'utf8').includes('href="../../semillero/"'));
});
test('un proyecto sin plantilla de página: error que nombra el archivo', async () => {
  const r = copia(); rmSync(join(r, 'sitio/proyectos/hortus/plantilla.html'));
  await assert.rejects(construir({ raiz: r, salida: 'dist' }), /sitio\/proyectos\/hortus\/plantilla\.html/);
});
test('construir se niega a usar como salida la raíz o algo que la contenga', async () => {
  const r = copia();
  await assert.rejects(construir({ raiz: r, salida: '.' }), /salida/);
  await assert.rejects(construir({ raiz: r, salida: '..' }), /salida/);
  assert.ok(existsSync(join(r, 'contenido/proyectos.json')));
});
