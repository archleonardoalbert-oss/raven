import { temporal } from './temporal.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { actualizarDemos } from '../herramientas/ci-demos.mjs';

const P = [{ id: 'a', repo: 'o/a', rama: 'main', demo: true }, { id: 'b', repo: 'o/b', rama: 'main', demo: true }, { id: 'c', demo: false }];
function entorno(cacheInicial = {}) {
  const raiz = temporal('ci-'), cache = join(raiz, 'cache'), demos = join(raiz, 'demos');
  for (const [id, sha] of Object.entries(cacheInicial)) { mkdirSync(join(cache, id), { recursive: true }); writeFileSync(join(cache, id, '.commit'), sha); writeFileSync(join(cache, id, 'index.html'), `vieja-${id}`); }
  return { cache, demos };
}
const fingir = (falla = []) => async ({ id, destino }) => {
  if (falla.includes(id)) throw new Error(`«${id}»: falló la construcción`);
  mkdirSync(destino, { recursive: true }); writeFileSync(join(destino, 'index.html'), `nueva-${id}`); return { demo: true, commit: `sha-${id}-2` };
};

test('solo reconstruye las demos cuyo commit cambió', async () => {
  const e = entorno({ a: 'sha-a-1', b: 'sha-b-2' }); const traidas = [];
  const r = await actualizarDemos({ proyectos: P, ...e, remotos: async () => ({ a: 'sha-a-2', b: 'sha-b-2' }), traer: async (o) => { traidas.push(o.id); return fingir()(o); } });
  assert.deepEqual(traidas, ['a']); assert.equal(r.cambiado, true);
  assert.equal(readFileSync(join(e.demos, 'a/index.html'), 'utf8'), 'nueva-a'); assert.equal(readFileSync(join(e.demos, 'b/index.html'), 'utf8'), 'vieja-b');
});
test('si una demo falla se usa la última buena y se anota', async () => {
  const e = entorno({ a: 'sha-a-1' });
  const r = await actualizarDemos({ proyectos: P, ...e, remotos: async () => ({ a: 'sha-a-2', b: 'sha-b-2' }), traer: fingir(['a']) });
  assert.equal(readFileSync(join(e.demos, 'a/index.html'), 'utf8'), 'vieja-a');
  assert.match(r.resumen, /a.*falló.*última demo buena/);
});
test('si falla y no hay demo previa, el proyecto queda sin demo', async () => {
  const e = entorno();
  const r = await actualizarDemos({ proyectos: P, ...e, remotos: async () => ({ a: 'x', b: 'y' }), traer: fingir(['a']) });
  assert.ok(!existsSync(join(e.demos, 'a'))); assert.ok(existsSync(join(e.demos, 'b/index.html')));
});
test('nada cambió: cambiado=false y misma huella', async () => {
  const e = entorno({ a: 'sha-a-2', b: 'sha-b-2' });
  const r = await actualizarDemos({ proyectos: P, ...e, remotos: async () => ({ a: 'sha-a-2', b: 'sha-b-2' }), traer: fingir() });
  assert.equal(r.cambiado, false); assert.equal(r.huella, 'a:sha-a-2 b:sha-b-2');
});

test('actualizarDemos deja el estado de cada demo en demos/demos-estado.json', async () => {
  const { actualizarDemos } = await import('../herramientas/ci-demos.mjs');
  const { mkdtempSync, mkdirSync: md, writeFileSync: wf, readFileSync: rf } = await import('node:fs');
  const { join: j } = await import('node:path');
  const base = temporal('raven-est-'), cache = j(base, 'cache'), demos = j(base, 'demos'); md(cache); md(demos);
  const proyectos = [{ id: 'a', demo: true, repo: 'x/a', rama: 'main' }, { id: 'b', demo: true, repo: 'x/b', rama: 'main' }];
  const traer = async ({ id, destino }) => { if (id === 'b') throw new Error('falló la construcción'); md(destino, { recursive: true }); wf(j(destino, 'index.html'), 'x'); return { demo: true, commit: 'c'.repeat(40) }; };
  await actualizarDemos({ proyectos, cache, demos, remotos: async () => ({ a: 'c'.repeat(40), b: 'd'.repeat(40) }), traer, ahora: () => '2026-11-15T10:00:00.000Z' });
  const est = JSON.parse(rf(j(demos, 'demos-estado.json'), 'utf8'));
  assert.deepEqual(est.a, { ok: true, fecha: '2026-11-15T10:00:00.000Z', commit: 'c'.repeat(40) });
  assert.equal(est.b.ok, false); assert.match(est.b.nota, /falló la construcción/);
});
