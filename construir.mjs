// Construye el sitio publicable en dist/: fuentes estáticas (sitio/), demos ya construidas (demos/) y, en
// las fases siguientes, el contenido de contenido/ rellenando las plantillas. Uso: node construir.mjs
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { rellenar } from './herramientas/plantilla.mjs';
import { validarProyectos, seccionesPrincipales, nombresMundo } from './herramientas/portada.mjs';
import { readdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export async function construir({ raiz = process.cwd(), salida = 'dist' } = {}) {
  const dist = resolve(raiz, salida);
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  // las plantillas de página se rellenan abajo; no se publican tal cual
  await cp(join(raiz, 'sitio'), dist, { recursive: true, filter: (o) => !o.endsWith('plantilla.html') });
  if (existsSync(join(raiz, 'demos'))) await cp(join(raiz, 'demos'), dist, { recursive: true });
  const leer = async (r) => JSON.parse(await readFile(join(raiz, r), 'utf8'));
  const textos = await leer('contenido/textos.json');
  const proyectos = await leer('contenido/proyectos.json');
  const etiquetas = await leer('contenido/etiquetas.json');
  const sistemas = {};
  for (const f of readdirSync(join(raiz, 'contenido/sistemas')).filter((x) => x.endsWith('.json'))) sistemas[f.slice(0, -5)] = await leer(`contenido/sistemas/${f}`);
  validarProyectos(proyectos);
  // catálogo para el navegador (biblioteca): «destacado» es el nombre que usa biblioteca.js para «principal»
  const catalogo = proyectos.map(({ principal, ...p }) => ({ ...p, destacado: principal }));
  await writeFile(join(dist, 'assets/proyectos-datos.js'), `// Generado por construir.mjs desde contenido/: no editar a mano.\nexport const ETIQUETAS = ${JSON.stringify(etiquetas, null, 2)};\nexport const PROYECTOS = ${JSON.stringify(catalogo, null, 2)};\n`);
  let portada = await readFile(join(raiz, 'plantillas/index.html'), 'utf8');
  portada = portada.replace('<!--PRINCIPALES-->\n', seccionesPrincipales(proyectos, sistemas, textos)).replace('<!--MUNDOS-->', nombresMundo(proyectos));
  await writeFile(join(dist, 'index.html'), rellenar(portada, textos, { archivo: 'plantillas/index.html' }));

  // páginas de proyecto: cada una con su plantilla propia y sus textos; sin demo, sin botón de demo
  for (const p of proyectos) {
    const pl = join(raiz, `sitio/proyectos/${p.id}/plantilla.html`);
    if (!existsSync(pl)) continue;
    let html = await readFile(pl, 'utf8');
    if (!p.demo) html = html.replace(/\s*<!--DEMO-->[\s\S]*?<!--\/DEMO-->/g, '');
    html = html.replace(/<!--\/?DEMO-->/g, '');
    const t = await leer(`contenido/paginas/${p.id}.json`);
    await writeFile(join(dist, `proyectos/${p.id}/index.html`), rellenar(html, t, { archivo: `sitio/proyectos/${p.id}/plantilla.html` }));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await construir();
