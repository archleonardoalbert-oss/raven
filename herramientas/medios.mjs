// Qué enseña cada proyecto: su presentación principal (demo, vídeo o imagen), el medio que va al lado en su
// página (vídeo o imagen de sitio/proyectos/<id>/media/) y si tiene miniatura. Sin datos explícitos se deduce
// de los archivos, así los proyectos de siempre no cambian.
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX = 25 * 1024 * 1024;  // límite de Cloudflare por archivo
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function medioDe(p, sitio) {
  const base = join(sitio, 'proyectos', p.id), hay = (a) => existsSync(join(base, a));
  const miniatura = hay('media/miniatura.webp');
  const medio = p.medio ?? (hay(`media/${p.id}.mp4`) ? { tipo: 'video', archivo: `media/${p.id}.mp4` } : miniatura ? { tipo: 'imagen', archivo: 'media/miniatura.webp' } : null);
  const mal = (m) => { throw new Error(`Proyecto «${p.id}»: ${m}`); };
  if (medio) {
    if (!['video', 'imagen'].includes(medio.tipo)) mal(`el medio debe ser «video» o «imagen» (es «${medio.tipo}»)`);
    if (!/^media\/[\w.-]+$/.test(medio.archivo ?? '') || medio.archivo.includes('..')) mal(`el medio tiene que estar dentro de media/ (${medio.archivo})`);
    if (!hay(medio.archivo)) mal(`no existe el medio sitio/proyectos/${p.id}/${medio.archivo}`);
    if (statSync(join(base, medio.archivo)).size > MAX) mal(`${medio.archivo} pesa más de 25 MB (límite de Cloudflare)`);
  }
  const presentacion = p.presentacion ?? (p.demo ? 'demo' : medio?.tipo ?? 'imagen');
  if (!['demo', 'video', 'imagen'].includes(presentacion)) mal(`presentación desconocida «${presentacion}»`);
  if (presentacion === 'demo' && !p.demo) mal('tiene presentación «demo» pero no tiene demo (su raven.json no declara demo)');
  return { presentacion, medio, miniatura };
}

export function htmlMedio({ medio, miniatura }) {
  if (!medio) return '';
  if (medio.tipo === 'imagen') return `<img src="${esc(medio.archivo)}" alt="" loading="lazy">`;
  return `<video src="${esc(medio.archivo)}"${miniatura ? ' poster="media/miniatura.webp"' : ''} autoplay muted loop playsinline preload="metadata"></video>`;
}

const fecha = (f, l) => new Date(`${f}T12:00:00Z`).toLocaleDateString(l === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export function htmlNovedades(novedades = []) {
  if (!novedades.length) return '';
  const lista = [...novedades].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((n) =>
    `<li><time datetime="${esc(n.fecha)}"><span lang="es">${fecha(n.fecha, 'es')}</span><span lang="en">${fecha(n.fecha, 'en')}</span></time><p><span lang="es">${n.es}</span><span lang="en">${n.en}</span></p></li>`).join('');
  return `<section class="p-novedades"><h2><span lang="es">Novedades</span><span lang="en">What's new</span></h2><ol>${lista}</ol></section>`;
}

// mini obra para las tarjetas de proyectos que aún no tienen miniatura
export const MINI_OBRA = '<div class="mini-obra" aria-hidden="true"><span class="mo-bloque"></span><span class="mo-bloque"></span><span class="mo-bloque mo-cae"></span><span class="mo-bicho"></span></div>';
