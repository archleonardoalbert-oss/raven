// Construye el sitio publicable en dist/: fuentes estáticas (sitio/), demos ya construidas (demos/) y, en
// las fases siguientes, el contenido de contenido/ rellenando las plantillas. Uso: node construir.mjs
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { rellenar } from './herramientas/plantilla.mjs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export async function construir({ raiz = process.cwd(), salida = 'dist' } = {}) {
  const dist = resolve(raiz, salida);
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(join(raiz, 'sitio'), dist, { recursive: true });
  if (existsSync(join(raiz, 'demos'))) await cp(join(raiz, 'demos'), dist, { recursive: true });
  const textos = JSON.parse(await readFile(join(raiz, 'contenido/textos.json'), 'utf8'));
  const portada = await readFile(join(raiz, 'plantillas/index.html'), 'utf8');
  await writeFile(join(dist, 'index.html'), rellenar(portada, textos, { archivo: 'plantillas/index.html' }));
}

if (import.meta.url === `file://${process.argv[1]}`) await construir();
