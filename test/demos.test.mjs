import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { traerDemo } from '../herramientas/demos.mjs';

// repo git de ejemplo con los archivos dados, en la rama «main»
function repo(archivos) {
  const d = mkdtempSync(join(tmpdir(), 'repo-'));
  for (const [r, c] of Object.entries(archivos)) { mkdirSync(join(d, r, '..'), { recursive: true }); writeFileSync(join(d, r), c); }
  const g = (...a) => execFileSync('git', a, { cwd: d, stdio: 'ignore' });
  g('init', '-q', '-b', 'main'); g('add', '-A'); g('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'x');
  return d;
}
const destino = () => join(mkdtempSync(join(tmpdir(), 'dest-')), 'demo');

test('copia la carpeta indicada, filtrada por «incluir»', async () => {
  const r = repo({ 'raven.json': JSON.stringify({ demo: { carpeta: '.', construir: null, incluir: ['index.html', 'css'] } }), 'index.html': 'hola', 'css/a.css': 'x', 'secreto.txt': 'no' });
  const d = destino(); const res = await traerDemo({ repo: r, rama: 'main', destino: d, id: 'p' });
  assert.equal(res.demo, true); assert.ok(existsSync(join(d, 'index.html'))); assert.ok(existsSync(join(d, 'css/a.css'))); assert.ok(!existsSync(join(d, 'secreto.txt')));
});
test('ejecuta «construir» y copia su carpeta de salida', async () => {
  const r = repo({ 'raven.json': JSON.stringify({ demo: { carpeta: 'out', construir: 'mkdir -p out && echo hecho > out/index.html' } }) });
  const d = destino(); await traerDemo({ repo: r, rama: 'main', destino: d, id: 'p' });
  assert.equal(readFileSync(join(d, 'index.html'), 'utf8').trim(), 'hecho');
});
test('sin raven.json: el proyecto no tiene demo', async () => {
  const r = repo({ 'README.md': 'x' });
  const res = await traerDemo({ repo: r, rama: 'main', destino: destino(), id: 'p' });
  assert.equal(res.demo, false);
});
test('si «construir» falla: error que nombra el proyecto', async () => {
  const r = repo({ 'raven.json': JSON.stringify({ demo: { carpeta: 'out', construir: 'exit 3' } }) });
  await assert.rejects(traerDemo({ repo: r, rama: 'main', destino: destino(), id: 'hortus' }), /hortus/);
});
test('el build no recibe secretos del entorno', async () => {
  process.env.CLOUDFLARE_API_TOKEN = 'no-debe-verse';
  const r = repo({ 'raven.json': JSON.stringify({ demo: { carpeta: 'out', construir: 'mkdir -p out && echo "[$CLOUDFLARE_API_TOKEN]" > out/index.html' } }) });
  const d = destino(); await traerDemo({ repo: r, rama: 'main', destino: d, id: 'p' });
  assert.equal(readFileSync(join(d, 'index.html'), 'utf8').trim(), '[]');
  delete process.env.CLOUDFLARE_API_TOKEN;
});
test('una carpeta de salida fuera del repo se rechaza', async () => {
  const r = repo({ 'raven.json': JSON.stringify({ demo: { carpeta: '../..', construir: null } }) });
  await assert.rejects(traerDemo({ repo: r, rama: 'main', destino: destino(), id: 'p' }), /carpeta/);
});
