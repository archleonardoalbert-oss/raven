// Prueba de humo en Firefox oculto: abre la portada, la biblioteca y cada página de proyecto en varios
// tamaños y recoge errores de consola, excepciones y respuestas 4xx/5xx. Nunca abre ventanas visibles.
// Uso: node herramientas/humo.mjs [url]   (por defecto http://127.0.0.1:4500/)
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

export async function humo({ url = 'http://127.0.0.1:4500/', tamanos = [[1440, 900], [390, 844]], espera = 6000 } = {}) {
  const proyectos = JSON.parse(readFileSync(new URL('../contenido/proyectos.json', import.meta.url), 'utf8'));
  const rutas = ['', 'proyectos/', ...proyectos.map((p) => `proyectos/${p.id}/`)];
  const b = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi', extraPrefsFirefox: { 'webgl.force-enabled': true } });
  const errores = [];
  try {
    for (const [w, h] of tamanos) for (const r of rutas) {
      const p = await b.newPage(); await p.setViewport({ width: w, height: h });
      const donde = `${w}x${h} /${r}`;
      p.on('pageerror', (e) => errores.push(`${donde}: JS ${e.message}`));
      p.on('console', (m) => { if (m.type() === 'error') errores.push(`${donde}: ${m.text().slice(0, 200)}`); });
      p.on('response', (res) => { if (res.status() >= 400) errores.push(`${donde}: ${res.status()} ${res.url()}`); });
      await p.goto(url + r, { waitUntil: 'load' }); await new Promise((ok) => setTimeout(ok, espera));
      await p.close();
    }
  } finally { await b.close(); }
  return { errores };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errores } = await humo({ url: process.argv[2] });
  console.log(errores.length ? errores.join('\n') : 'errores: []');
  process.exit(errores.length ? 1 : 0);
}
