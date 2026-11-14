import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarProyectos, seccionesPrincipales, nombresMundo } from '../herramientas/portada.mjs';

const p = (id, principal = false, demo = true) => ({ id, nombre: id.toUpperCase(), principal, demo, color: '#fff', tinte: '#aaa', fuente: 'Serif',
  tipo: { es: 'Tipo', en: 'Type' }, desc: { es: 'Desc', en: 'Desc' }, etiquetas: [], fecha: '2026-01-01' });
const sis = { a: { camara: { escritorio: '@a:1,1,1|@a:0,0,0', movil: '@a:2,2,2|@a:0,-1,0' } }, b: { camara: { escritorio: '@b:1,1,1|@b:0,0,0', movil: '@b:2,2,2|@b:0,-1,0' } } };
const tx = { proyectos: { conocer: { es: 'Conocer el proyecto', en: 'Explore the project' } } };
const contar = (s, t) => s.split(t).length - 1;

test('más de 3 principales: error claro', () => {
  assert.throws(() => validarProyectos([p('a', true), p('b', true), p('c', true), p('d', true)]), /Como mucho 3 proyectos principales/);
});
test('ids repetidos: error', () => { assert.throws(() => validarProyectos([p('a'), p('a')]), /repetido.*a/); });
test('un principal: una sección y ninguna salida', () => {
  const h = seccionesPrincipales([p('a', true)], sis, tx);
  assert.equal(contar(h, 'class="capitulo proyecto"'), 1); assert.equal(contar(h, 'class="salida"'), 0);
  assert.match(h, /id="p-a" data-camara="@a:1,1,1\|@a:0,0,0" data-camara-movil="@a:2,2,2\|@a:0,-1,0"/);
});
test('dos principales: una salida entre ellas', () => {
  const h = seccionesPrincipales([p('a', true), p('b', true)], sis, tx);
  assert.equal(contar(h, 'class="capitulo proyecto"'), 2); assert.equal(contar(h, 'class="salida"'), 1);
});
test('ningún principal: nada', () => { assert.equal(seccionesPrincipales([], sis, tx), ''); });
test('un principal sin sistema: error que lo nombra', () => {
  assert.throws(() => seccionesPrincipales([p('z', true)], sis, tx), /sistema.*z/);
});
test('nombres de los mundos para las etiquetas 3D', () => {
  assert.equal(nombresMundo([p('a', true)]), '<span class="nombre-mundo" data-mundo="a">A</span>');
});
