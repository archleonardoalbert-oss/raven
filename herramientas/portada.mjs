// Piezas de la portada que dependen del catálogo: las secciones de los proyectos principales (planetas), las
// salidas entre ellas y los nombres que la escena 3D coloca sobre cada estrella.
import { MINI_OBRA } from './medios.mjs';
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const MAX_PRINCIPALES = 3;

export function validarProyectos(proyectos) {
  const vistos = new Set();
  for (const p of proyectos) { if (vistos.has(p.id)) throw new Error(`Proyecto repetido: ${p.id}`); vistos.add(p.id); }
  for (const p of proyectos) {
    const falta = (c) => { throw new Error(`Proyecto «${p.id}»: falta ${c}`); };
    for (const c of ['nombre', 'color', 'tinte', 'fuente', 'fecha']) if (!p[c]) falta(c);
    for (const c of ['tipo', 'desc']) for (const l of ['es', 'en']) if (typeof p[c]?.[l] !== 'string' || !p[c][l]) falta(`${c}.${l}`);
  }
  const n = proyectos.filter((p) => p.principal).length;
  if (n > MAX_PRINCIPALES) throw new Error(`Como mucho 3 proyectos principales (hay ${n})`);
}

const bilingue = (v, marca = '') => `<span lang="es"${marca}>${v.es}</span><span lang="en"${marca}>${v.en}</span>`;
const marcaDe = (edicion, id, campo) => (edicion ? ` data-raven-texto="proyectos|${id}.${campo}"` : '');
const SALIDA = '  <div class="salida" data-camara="0,95,80|0,0,0" data-mantener="0" aria-hidden="true"></div>\n';

function seccion(p, sistema, textos, edicion) {
  if (!sistema?.camara) throw new Error(`Falta el sistema planetario de ${p.id} (contenido/sistemas/${p.id}.json)`);
  if (!textos.proyectos?.conocer?.es || !textos.proyectos?.conocer?.en) throw new Error('Falta el texto «proyectos.conocer» en contenido/textos.json');
  return `  <section class="capitulo proyecto" id="p-${p.id}" data-camara="${sistema.camara.escritorio}" data-camara-movil="${sistema.camara.movil}" style="--tinte: ${p.tinte}">
    <article class="cristal tarjeta">
      <div class="vista">${p.miniatura === false ? MINI_OBRA : `<img src="proyectos/${p.id}/media/miniatura.webp" alt="" loading="lazy">`}${p.medio?.tipo === 'video' || p.medio === undefined ? `<video data-src="proyectos/${p.id}/${p.medio?.archivo ?? `media/${p.id}.mp4`}" muted loop playsinline preload="none"></video>` : ''}</div>
      <p class="tipo">${bilingue(p.tipo, marcaDe(edicion, p.id, 'tipo'))}</p>
      <h3 class="t-${p.id}" style="font-family: '${esc(p.fuente)}', Georgia, serif; color: ${p.color}">${edicion ? `<span${marcaDe(edicion, p.id, 'nombre')}>${esc(p.nombre)}</span>` : esc(p.nombre)}</h3>
      <p>${bilingue(p.desc, marcaDe(edicion, p.id, 'desc'))}</p>
      <a class="boton" href="proyectos/${p.id}/">${bilingue(textos.proyectos.conocer)}</a>
    </article>
  </section>
`;
}

export function seccionesPrincipales(proyectos, sistemas, textos, { edicion = false } = {}) {
  return proyectos.filter((p) => p.principal).map((p) => seccion(p, sistemas[p.id], textos, edicion)).join(`\n${SALIDA}\n`);
}

export function nombresMundo(proyectos, { edicion = false } = {}) {
  return proyectos.filter((p) => p.principal).map((p) => `<span class="nombre-mundo" data-mundo="${p.id}"${marcaDe(edicion, p.id, 'nombre')}>${esc(p.nombre)}</span>`).join('\n  ');
}
