// Construye el sitio publicable en dist/: fuentes estáticas (sitio/), demos ya construidas (demos/) y, en
// las fases siguientes, el contenido de contenido/ rellenando las plantillas. Uso: node construir.mjs
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { rellenar } from './herramientas/plantilla.mjs';
import { validarProyectos, seccionesPrincipales, nombresMundo } from './herramientas/portada.mjs';
import { validarHabilidades, modulosDatos } from './herramientas/datos.mjs';
import { readdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export async function construir({ raiz = process.cwd(), salida = 'dist' } = {}) {
  const dist = resolve(raiz, salida), base = resolve(raiz);
  // nunca borrar la raíz del proyecto ni nada que la contenga
  if (dist === base || base.startsWith(dist + '/')) throw new Error(`La salida no puede ser la raíz del proyecto ni contenerla: ${dist}`);
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
  const habilidades = await leer('contenido/habilidades.json');
  validarHabilidades(habilidades, proyectos);
  const modulos = modulosDatos({ habilidades, proyectos, sistemas });
  await writeFile(join(dist, 'assets/habilidades-datos.js'), modulos.habilidades);
  await writeFile(join(dist, 'assets/sistemas-datos.js'), modulos.sistemas);
  // catálogo para el navegador (biblioteca): «destacado» es el nombre que usa biblioteca.js para «principal»
  const catalogo = proyectos.map(({ principal, ...p }) => ({ ...p, destacado: principal }));
  await writeFile(join(dist, 'assets/proyectos-datos.js'), `// Generado por construir.mjs desde contenido/: no editar a mano.\nexport const ETIQUETAS = ${JSON.stringify(etiquetas, null, 2)};\nexport const PROYECTOS = ${JSON.stringify(catalogo, null, 2)};\n`);
  // primero se rellenan los textos de la plantilla y después se insertan las piezas del catálogo (con función:
  // un «$» o un «{{» en los datos de un proyecto deben salir tal cual)
  const plantilla = await readFile(join(raiz, 'plantillas/index.html'), 'utf8');
  for (const m of ['<!--PRINCIPALES-->', '<!--MUNDOS-->']) if (!plantilla.includes(m)) throw new Error(`Falta el marcador ${m} en plantillas/index.html`);
  const secciones = seccionesPrincipales(proyectos, sistemas, textos), mundos = nombresMundo(proyectos);
  const portada = rellenar(plantilla, textos, { archivo: 'plantillas/index.html' }).replace(/<!--PRINCIPALES-->\r?\n?/, () => secciones).replace('<!--MUNDOS-->', () => mundos);
  await writeFile(join(dist, 'index.html'), portada);

  // páginas de proyecto: cada una con su plantilla propia y sus textos; sin demo, sin botón de demo
  for (const p of proyectos) {
    const pl = join(raiz, `sitio/proyectos/${p.id}/plantilla.html`);
    if (!existsSync(pl)) throw new Error(`Falta la página del proyecto «${p.id}»: sitio/proyectos/${p.id}/plantilla.html`);
    let html = await readFile(pl, 'utf8');
    // hay demo si el proyecto la declara y además está construida en demos/<id>
    const hayDemo = p.demo && existsSync(join(raiz, 'demos', p.id));
    if (p.demo && !hayDemo) console.warn(`Aviso: «${p.id}» declara demo pero no existe demos/${p.id}: se publica sin botón de demo`);
    if (!hayDemo) html = html.replace(/\s*<!--DEMO-->[\s\S]*?<!--\/DEMO-->/g, '');
    html = html.replace(/<!--\/?DEMO-->/g, '');
    // botón al código: solo si el proyecto tiene repo público
    const codigo = p.repo ? `<a class="p-boton boton-linea" href="https://github.com/${p.repo}" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .4 1 .2 2 .1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg><span lang="es">${textos.proyectos.codigo.es}</span><span lang="en">${textos.proyectos.codigo.en}</span></a>` : '';
    html = html.replace('<!--CODIGO-->', () => codigo);
    const t = await leer(`contenido/paginas/${p.id}.json`);
    await writeFile(join(dist, `proyectos/${p.id}/index.html`), rellenar(html, t, { archivo: `sitio/proyectos/${p.id}/plantilla.html` }));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await construir();
