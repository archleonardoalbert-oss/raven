import { temporal } from './temporal.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, readFileSync, writeFileSync, mkdirSync, rmSync, truncateSync } from 'node:fs';
import { join } from 'node:path';
import { construir } from '../construir.mjs';
import { medioDe } from '../herramientas/medios.mjs';
import { copiaMuestra, MUESTRA } from './muestra.mjs';

const copia = ({ demos = [] } = {}) => copiaMuestra({ demos, prefijo: 'raven-med-' });
const editar = (r, archivo, f) => { const ruta = join(r, 'contenido', archivo); const o = JSON.parse(readFileSync(ruta, 'utf8')); f(o); writeFileSync(ruta, JSON.stringify(o)); };
const pagina = (r, id) => readFileSync(join(r, `dist/proyectos/${id}/index.html`), 'utf8');

test('por defecto: el vídeo del proyecto y presentación demo si declara demo', () => {
  const m = medioDe({ id: 'penumbra', demo: true }, 'sitio');
  assert.deepEqual(m, { presentacion: 'demo', medio: { tipo: 'video', archivo: 'media/penumbra.mp4' }, miniatura: true });
});
test('presentación demo sin demo: construir falla con un mensaje claro', async () => {
  const r = copia(); editar(r, 'proyectos.json', (ps) => { const h = ps.find((p) => p.id === 'hortus'); h.demo = false; h.presentacion = 'demo'; });
  await assert.rejects(construir({ raiz: r, salida: 'dist' }), /hortus.*presentación «demo».*no tiene demo/);
});
test('medio que no existe o pesa más de 25 MB: error', async () => {
  const r = copia(); editar(r, 'proyectos.json', (ps) => { ps.find((p) => p.id === 'hortus').medio = { tipo: 'imagen', archivo: 'media/nada.png' }; });
  await assert.rejects(construir({ raiz: r, salida: 'dist' }), /hortus.*media\/nada\.png/);
  const r2 = copia(); truncateSync(join(r2, 'sitio/proyectos/hortus/media/hortus.mp4'), 26 * 1024 * 1024);
  await assert.rejects(construir({ raiz: r2, salida: 'dist' }), /25 MB/);
  const r3 = copia(); editar(r3, 'proyectos.json', (ps) => { ps.find((p) => p.id === 'hortus').medio = { tipo: 'imagen', archivo: '../../../construir.mjs' }; });
  await assert.rejects(construir({ raiz: r3, salida: 'dist' }), /media\//);
});
test('presentación imagen: la página muestra la imagen y no el botón de demo', async () => {
  const r = copia({ demos: ['semillero'] });
  editar(r, 'proyectos.json', (ps) => { const s = ps.find((p) => p.id === 'semillero'); s.presentacion = 'imagen'; s.medio = { tipo: 'imagen', archivo: 'media/miniatura.webp' }; });
  await construir({ raiz: r, salida: 'dist' });
  const h = pagina(r, 'semillero');
  assert.match(h, /<img[^>]+src="media\/miniatura\.webp"/); assert.ok(!h.includes('<video')); assert.ok(!h.includes('href="../../semillero/"'));
  assert.ok(h.includes('href="https://github.com/'), 'el enlace al repo sale siempre');
});
test('presentación demo con demo construida: vídeo al lado y botón de demo', async () => {
  const r = copia({ demos: ['semillero'] }); await construir({ raiz: r, salida: 'dist' });
  const h = pagina(r, 'semillero');
  assert.match(h, /<video[^>]+src="media\/semillero\.mp4"/); assert.ok(h.includes('href="../../semillero/"'));
});
test('novedades: se pintan de la más reciente a la más antigua; sin novedades no hay sección', async () => {
  const r = copia();
  editar(r, 'paginas/hortus.json', (t) => { t.novedades = [{ fecha: '2026-11-10', es: 'Nuevo modo nocturno.', en: 'New night mode.' }, { fecha: '2026-11-14', es: 'Tráfico de red en vivo.', en: 'Live network traffic.' }]; });
  await construir({ raiz: r, salida: 'dist' });
  const h = pagina(r, 'hortus');
  assert.match(h, /class="p-novedades"/);
  assert.ok(h.indexOf('Tráfico de red en vivo.') < h.indexOf('Nuevo modo nocturno.'));
  assert.ok(!pagina(r, 'penumbra').includes('class="p-novedades"'));
});
test('un proyecto sin miniatura: la tarjeta de la biblioteca lleva la mini obra', async () => {
  const r = copia(); rmSync(join(r, 'sitio/proyectos/hortus/media/miniatura.webp'));
  await construir({ raiz: r, salida: 'dist' });
  const datos = readFileSync(join(r, 'dist/assets/proyectos-datos.js'), 'utf8');
  assert.match(datos, /"id": "hortus"[\s\S]*?"miniatura": false/);
  assert.match(datos, /MINI_OBRA = .*mini-obra/);
});

test('sin medio elegido a mano, la presentación decide: imagen → miniatura, vídeo → vídeo', () => {
  assert.deepEqual(medioDe({ id: 'penumbra', demo: true, presentacion: 'imagen' }, 'sitio').medio, { tipo: 'imagen', archivo: 'media/miniatura.webp' });
  assert.deepEqual(medioDe({ id: 'penumbra', demo: true, presentacion: 'video', medio: null }, 'sitio').medio, { tipo: 'video', archivo: 'media/penumbra.mp4' });
});
