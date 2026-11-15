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

// mini obra para las tarjetas de proyectos que aún no tienen miniatura: dos Clawds en pixel-art (fiel al
// logo de Claude Code) bajo la grúa; uno carga material y otro suelda. Se anima con assets/mini-obra.css.
function clawdSvg(x, y, P, { carga = false, careta = false } = {}) {
  const r = (gx, gy, w, h, c) => `<rect x="${x + gx * P}" y="${y + gy * P}" width="${w * P}" height="${h * P}" fill="${c}"/>`;
  let s = r(3, 0, 12, 1, '#E58C6B') + r(3, 1, 12, 2, '#D97757') + r(3, 3, 12, 1, '#B35A3D') + r(1, 2, 2, 1, '#D97757') + r(15, 2, 2, 1, '#D97757');
  s += careta ? r(3, 0, 12, 2, '#2A2F45') + r(5, 1, 8, 1, '#8BEBFF') : r(5, 1, 1, 1, '#140d0b') + r(12, 1, 1, 1, '#140d0b');
  s += `<g class="mo-patas">${r(4, 4, 1, 1, '#B35A3D')}${r(11, 4, 1, 1, '#B35A3D')}</g><g class="mo-patas mo-patas-b">${r(6, 4, 1, 1, '#B35A3D')}${r(13, 4, 1, 1, '#B35A3D')}</g>`;
  s += r(4, -1, 10, 1, '#C48F2A') + r(6, -2, 6, 1, '#F2C14E') + r(7, -2, 2, 1, '#FFE28E');
  if (carga) s += r(3, -7, 12, 5, 'var(--tinte, #8fb8ff)') + r(3, -7, 12, 1, 'rgb(255 255 255 / .45)');
  return s;
}
export const MINI_OBRA = `<svg class="mini-obra" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">
<rect width="160" height="100" fill="#05060f"/><rect y="78" width="160" height="22" fill="#0a0c1d"/><rect y="78" width="160" height="1" fill="var(--tinte, #8fb8ff)" opacity=".5"/>
<g fill="#343c6b"><rect x="132" y="14" width="2" height="64"/><rect x="138" y="14" width="2" height="64"/><rect x="18" y="12" width="128" height="2"/><rect x="18" y="17" width="128" height="1"/><rect x="40" y="30" width="1" height="48"/><rect x="96" y="30" width="1" height="48"/></g>
<rect x="26" y="50" width="98" height="3" fill="#76594a"/><rect x="26" y="50" width="98" height="1" fill="#9a7a62"/>
<g class="mo-gancho"><rect x="112" y="18" width="1" height="10" fill="#8f97c4"/><rect x="105" y="28" width="15" height="9" fill="var(--tinte, #8fb8ff)"/><rect x="105" y="28" width="15" height="2" fill="#fff" opacity=".45"/></g>
<rect x="30" y="38" width="15" height="12" fill="var(--tinte, #8fb8ff)"/><rect x="30" y="38" width="15" height="2" fill="#fff" opacity=".4"/><rect x="46" y="38" width="15" height="12" fill="var(--tinte, #8fb8ff)" opacity=".8"/>
<g class="mo-soldador">${clawdSvg(64, 40, 2, { careta: true })}<rect class="mo-chispa" x="62" y="42" width="3" height="3" fill="#fff4d6"/><rect class="mo-chispa" x="58" y="38" width="2" height="2" fill="#ffb35c"/></g>
<g class="mo-cargador">${clawdSvg(4, 68, 2, { carga: true })}</g>
</svg>`;
