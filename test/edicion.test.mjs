// Modo edición: marcas para el editor visual del Manager, que nunca llegan a la web pública.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { construir } from '../construir.mjs';
import { rellenar } from '../herramientas/plantilla.mjs';
import { copiaMuestra } from './muestra.mjs';

const htmls = (d) => readdirSync(d, { recursive: true }).filter((f) => f.endsWith('.html')).map((f) => join(d, f));

test('en edición cada texto lleva su marca y la página el puente', async () => {
  const r = copiaMuestra(); await construir({ raiz: r, salida: 'ed', edicion: true });
  const h = readFileSync(join(r, 'ed/index.html'), 'utf8');
  assert.match(h, /<span lang="es" data-raven-texto="textos\|sobre-mi\.1">/);
  assert.match(h, /data-raven-texto="proyectos\|penumbra\.desc"/);
  assert.match(h, /data-raven-texto="proyectos\|penumbra\.nombre"/);
  assert.match(h, /<script type="module" src="[^"]*_edicion\/puente\.js"><\/script>/);
  assert.match(readFileSync(join(r, 'ed/proyectos/hortus/index.html'), 'utf8'), /data-raven-texto="paginas\/hortus\|pagina\.\d+"/);
  assert.ok(statSync(join(r, 'ed/_edicion/puente.js')).isFile());
});
test('la construcción normal no lleva ninguna marca ni el puente', async () => {
  const r = copiaMuestra(); await construir({ raiz: r, salida: 'dist' });
  for (const f of htmls(join(r, 'dist'))) { const h = readFileSync(f, 'utf8'); assert.ok(!h.includes('data-raven-texto') && !h.includes('_edicion'), f); }
});
test('dentro de atributos y de <title> no se marca', () => {
  const t = { a: { es: 'Hola', en: 'Hi' } };
  const h = rellenar('<title>{{es a}}</title><meta content="{{es a}}"><p>{{t a}}</p>', t, { marcar: 'textos' });
  assert.match(h, /<title>Hola<\/title><meta content="Hola">/);
  assert.match(h, /<p><span lang="es" data-raven-texto="textos\|a">Hola<\/span>/);
});
test('un texto repetido lleva la misma marca en cada aparición, y el HTML en línea se envuelve', () => {
  const t = { a: { es: 'X', en: 'Y' }, b: { es: 'con <em>énfasis</em>', en: 'with <em>emphasis</em>' } };
  const h = rellenar('<a>{{t a}}</a><a>{{t a}}</a><div lang="es">{{es-html b}}</div>', t, { marcar: 'textos' });
  assert.equal(h.match(/data-raven-texto="textos\|a"/g).length, 4);
  assert.match(h, /<span data-raven-texto="textos\|b" lang="es">con <em>énfasis<\/em><\/span>/);
});
test('una etiqueta nueva usada por un proyecto llega a los filtros de la biblioteca; una sin uso no', async () => {
  const r = copiaMuestra();
  const e = JSON.parse(readFileSync(join(r, 'contenido/etiquetas.json'), 'utf8')); e.juegos = { es: 'Juegos', en: 'Games' }; e.nada = { es: 'Nada', en: 'None' };
  writeFileSync(join(r, 'contenido/etiquetas.json'), JSON.stringify(e));
  const ps = JSON.parse(readFileSync(join(r, 'contenido/proyectos.json'), 'utf8')); ps[0].etiquetas.push('juegos');
  writeFileSync(join(r, 'contenido/proyectos.json'), JSON.stringify(ps));
  await construir({ raiz: r, salida: 'dist' });
  const { ETIQUETAS, PROYECTOS } = await import(join(r, 'dist/assets/proyectos-datos.js'));
  const usadas = Object.keys(ETIQUETAS).filter((x) => PROYECTOS.some((p) => p.etiquetas.includes(x)));
  assert.ok(usadas.includes('juegos')); assert.ok(!usadas.includes('nada'));
  assert.match(readFileSync('sitio/proyectos/biblioteca.js', 'utf8'), /Object\.keys\(ETIQUETAS\)\.filter\(\(e\) => PROYECTOS\.some/);
});
