// Construye el sitio publicable en dist/: fuentes estáticas (sitio/), demos ya construidas (demos/) y, en
// las fases siguientes, el contenido de contenido/ rellenando las plantillas. Uso: node construir.mjs
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { rellenar, enAtributo } from './herramientas/plantilla.mjs';
import { validarProyectos, seccionesPrincipales, nombresMundo } from './herramientas/portada.mjs';
import { validarHabilidades, modulosDatos } from './herramientas/datos.mjs';
import { medioDe, htmlMedio, htmlNovedades, htmlCifras, MINI_OBRA } from './herramientas/medios.mjs';
import { readdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// edicion: construcción para el editor visual de Raven Manager (marcas data-raven-texto y el puente); nunca se publica
export async function construir({ raiz = process.cwd(), salida = 'dist', edicion = false } = {}) {
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
  const proyectos = (await leer('contenido/proyectos.json')).map((p) => p);
  const etiquetas = await leer('contenido/etiquetas.json');
  const sistemas = {};
  for (const f of readdirSync(join(raiz, 'contenido/sistemas')).filter((x) => x.endsWith('.json'))) sistemas[f.slice(0, -5)] = await leer(`contenido/sistemas/${f}`);
  validarProyectos(proyectos);
  // presentación, medio y miniatura de cada proyecto (deducidos de sus archivos si no se dicen)
  for (const p of proyectos) Object.assign(p, medioDe(p, join(raiz, 'sitio')));
  const habilidades = await leer('contenido/habilidades.json');
  validarHabilidades(habilidades, proyectos);
  const modulos = modulosDatos({ habilidades, proyectos, sistemas });
  await writeFile(join(dist, 'assets/habilidades-datos.js'), modulos.habilidades);
  await writeFile(join(dist, 'assets/sistemas-datos.js'), modulos.sistemas);
  // catálogo para el navegador (biblioteca): «destacado» es el nombre que usa biblioteca.js para «principal»
  const catalogo = proyectos.map(({ principal, ...p }) => ({ ...p, destacado: principal }));
  await writeFile(join(dist, 'assets/proyectos-datos.js'), `// Generado por construir.mjs desde contenido/: no editar a mano.\nexport const ETIQUETAS = ${JSON.stringify(etiquetas, null, 2)};\nexport const PROYECTOS = ${JSON.stringify(catalogo, null, 2)};\nexport const MINI_OBRA = ${JSON.stringify(MINI_OBRA)};\n`);
  // primero se rellenan los textos de la plantilla y después se insertan las piezas del catálogo (con función:
  // un «$» o un «{{» en los datos de un proyecto deben salir tal cual)
  const plantilla = await readFile(join(raiz, 'plantillas/index.html'), 'utf8');
  for (const m of ['<!--PRINCIPALES-->', '<!--MUNDOS-->']) if (!plantilla.includes(m)) throw new Error(`Falta el marcador ${m} en plantillas/index.html`);
  const secciones = seccionesPrincipales(proyectos, sistemas, textos, { edicion }), mundos = nombresMundo(proyectos, { edicion });
  const portada = rellenar(plantilla, textos, { archivo: 'plantillas/index.html', marcar: edicion ? 'textos' : null }).replace(/<!--PRINCIPALES-->\r?\n?/, () => secciones).replace('<!--MUNDOS-->', () => mundos);
  await writeFile(join(dist, 'index.html'), portada);

  // páginas de proyecto: cada una con su plantilla propia y sus textos; sin demo, sin botón de demo
  for (const p of proyectos) {
    const pl = join(raiz, `sitio/proyectos/${p.id}/plantilla.html`);
    // sin página propia todavía: la página «en obras» con los datos del catálogo
    const enObras = !existsSync(pl);
    let html = await readFile(enObras ? join(raiz, 'plantillas/proyecto-en-obras.html') : pl, 'utf8');
    if (enObras) {
      const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      const v = { ID: p.id, NOMBRE: esc(p.nombre), COLOR: esc(p.color), TIPO_ES: esc(p.tipo.es), TIPO_EN: esc(p.tipo.en), DESC_ES: esc(p.desc.es), DESC_EN: esc(p.desc.en) };
      // en edición, los campos del catálogo se marcan donde son texto (no dentro de atributos)
      const campo = { NOMBRE: 'nombre', TIPO_ES: 'tipo', TIPO_EN: 'tipo', DESC_ES: 'desc', DESC_EN: 'desc' };
      html = html.replace(/\{\{(ID|NOMBRE|COLOR|TIPO_ES|TIPO_EN|DESC_ES|DESC_EN)\}\}/g, (_, k, i, todo) =>
        edicion && campo[k] && !enAtributo(todo, i) ? `<span data-raven-texto="proyectos|${p.id}.${campo[k]}"${k.endsWith('_EN') ? ' data-idioma="en"' : k.endsWith('_ES') ? ' data-idioma="es"' : ''}>${v[k]}</span>` : v[k]);
      await mkdir(join(dist, `proyectos/${p.id}`), { recursive: true });
    }
    // hay demo si el proyecto la declara y además está construida en demos/<id>
    const hayDemo = p.presentacion === 'demo' && p.demo && existsSync(join(raiz, 'demos', p.id));
    if (p.demo && !hayDemo) console.warn(`Aviso: «${p.id}» declara demo pero no existe demos/${p.id}: se publica sin botón de demo`);
    if (!hayDemo) html = html.replace(/\s*<!--DEMO-->[\s\S]*?<!--\/DEMO-->/g, '');
    html = html.replace(/<!--\/?DEMO-->/g, '');
    // botón al código: solo si el proyecto tiene repo público
    const codigo = p.repo ? `<a class="p-boton boton-linea" href="https://github.com/${p.repo}" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .4 1 .2 2 .1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg><span lang="es">${textos.proyectos.codigo.es}</span><span lang="en">${textos.proyectos.codigo.en}</span></a>` : '';
    html = html.replace('<!--CODIGO-->', () => codigo);
    const t = existsSync(join(raiz, `contenido/paginas/${p.id}.json`)) ? await leer(`contenido/paginas/${p.id}.json`) : {};
    for (const m of ['<!--MEDIO-->', '<!--NOVEDADES-->']) if (!html.includes(m)) throw new Error(`Falta el marcador ${m} en la página de «${p.id}»`);
    html = html.replace('<!--MEDIO-->', () => htmlMedio(p)).replace('<!--NOVEDADES-->', () => htmlNovedades(t.novedades));
    html = html.replace('<!--CIFRAS-->', () => htmlCifras(t.cifras));  // opcional
    await writeFile(join(dist, `proyectos/${p.id}/index.html`), rellenar(html, t, { archivo: `sitio/proyectos/${p.id}/plantilla.html`, marcar: edicion ? `paginas/${p.id}` : null }));
  }
  if (edicion) await inyectarPuente(dist, proyectos);
}

if (import.meta.url === `file://${process.argv[1]}`) await construir();

// modo edición: copia el puente (herramientas/edicion, fuera de sitio/ para que «volver a una versión» no lo toque)
// y lo enlaza en cada página generada (no en las demos)
async function inyectarPuente(dist, proyectos) {
  await cp(new URL('./herramientas/edicion', import.meta.url).pathname, join(dist, '_edicion'), { recursive: true });
  const demos = new Set(proyectos.map((p) => p.id));
  for (const rel of readdirSync(dist, { recursive: true }).filter((f) => f.endsWith('.html') && !demos.has(f.split('/')[0]))) {
    const nivel = '../'.repeat(rel.split('/').length - 1), f = join(dist, rel);
    const html = await readFile(f, 'utf8');
    await writeFile(f, html.replace('</head>', `<link rel="stylesheet" href="${nivel}_edicion/puente.css">\n<script type="module" src="${nivel}_edicion/puente.js"></script>\n</head>`));
  }
}
