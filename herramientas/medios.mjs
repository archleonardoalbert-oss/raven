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
  // sin medio elegido a mano: si la presentación es «imagen», la miniatura; si no, el vídeo (o la miniatura si no hay vídeo)
  const video = hay(`media/${p.id}.mp4`) ? { tipo: 'video', archivo: `media/${p.id}.mp4` } : null, imagen = miniatura ? { tipo: 'imagen', archivo: 'media/miniatura.webp' } : null;
  const medio = p.medio ?? (p.presentacion === 'imagen' ? imagen ?? video : video ?? imagen);
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

// «En cifras»: resultados medidos del proyecto (lo primero que busca quien evalúa), en contenido/paginas/<id>.json
// como `cifras: [{ n, es, en }]`. Sin cifras no hay sección.
export function htmlCifras(cifras = []) {
  if (!cifras.length) return '';
  const num = (n) => (typeof n === 'object' ? `<span lang="es">${esc(n.es)}</span><span lang="en">${esc(n.en)}</span>` : esc(n));
  const items = cifras.map((c) => `<div><dt>${num(c.n)}</dt><dd><span lang="es">${esc(c.es)}</span><span lang="en">${esc(c.en)}</span></dd></div>`).join('');
  return `<section class="p-cifras"><h2><span lang="es">En cifras</span><span lang="en">In numbers</span></h2><dl>${items}</dl></section>`;
}

// mini obra para las tarjetas de proyectos que aún no tienen miniatura: dos Clawds en pixel-art (fiel al
// logo de Claude Code) bajo la grúa; uno carga material y otro suelda. Se anima con assets/mini-obra.css.
function clawdSvg(x, y, P, { carga = false, careta = false } = {}) {
  // misma silueta que el logo, con volumen (degradados definidos en <defs>)
  const X = (g) => x + g * P, Y = (g) => y + g * P;
  let s = '';
  for (const [g, b] of [[4, 'a'], [6, 'b'], [11, 'a'], [13, 'b']]) s += `<rect class="mo-pata mo-pata-${b}" x="${X(g)}" y="${Y(3.6)}" width="${0.9 * P}" height="${1.5 * P}" rx="${0.45 * P}" fill="#9a4529"/>`;
  s += `<rect x="${X(0.6)}" y="${Y(2)}" width="${2.9 * P}" height="${P}" rx="${0.5 * P}" fill="url(#mo-cuerpo)"/><rect x="${X(14.5)}" y="${Y(2)}" width="${2.9 * P}" height="${P}" rx="${0.5 * P}" fill="url(#mo-cuerpo)"/>`;
  s += `<rect x="${X(3)}" y="${Y(-0.2)}" width="${12 * P}" height="${4.2 * P}" rx="${1.3 * P}" fill="url(#mo-cuerpo)"/><rect x="${X(3)}" y="${Y(-0.2)}" width="${12 * P}" height="${4.2 * P}" rx="${1.3 * P}" fill="url(#mo-brillo)"/>`;
  s += careta
    ? `<rect x="${X(4.2)}" y="${Y(0.3)}" width="${9.6 * P}" height="${2.2 * P}" rx="${0.7 * P}" fill="#262b42"/><rect class="mo-visor" x="${X(5.6)}" y="${Y(1.05)}" width="${6.8 * P}" height="${0.7 * P}" rx="${0.35 * P}" fill="#8BEBFF"/>`
    : `<rect x="${X(4.95)}" y="${Y(0.6)}" width="${1.1 * P}" height="${1.7 * P}" rx="${0.55 * P}" fill="#140d0b"/><rect x="${X(11.95)}" y="${Y(0.6)}" width="${1.1 * P}" height="${1.7 * P}" rx="${0.55 * P}" fill="#140d0b"/><circle cx="${X(5.75)}" cy="${Y(1)}" r="${0.26 * P}" fill="#fff"/><circle cx="${X(12.75)}" cy="${Y(1)}" r="${0.26 * P}" fill="#fff"/>`;
  s += `<ellipse cx="${X(9)}" cy="${Y(-0.05)}" rx="${4.6 * P}" ry="${0.65 * P}" fill="#C48F2A"/><path d="M${X(5.7)} ${Y(-0.15)} A ${3.3 * P} ${2.3 * P} 0 0 1 ${X(12.3)} ${Y(-0.15)} Z" fill="url(#mo-casco)"/>`;
  if (carga) s += `<path d="M${X(3.5)} ${Y(-6.8)} l${1.2 * P} ${-1.2 * P} h${11 * P} l${-1.2 * P} ${1.2 * P} Z" fill="var(--tinte, #8fb8ff)" opacity=".75"/><rect x="${X(3.5)}" y="${Y(-6.8)}" width="${11 * P}" height="${4.2 * P}" fill="var(--tinte, #8fb8ff)"/><rect x="${X(8.4)}" y="${Y(-6.8)}" width="${1.2 * P}" height="${4.2 * P}" fill="rgb(0 0 0 / .18)"/>`;
  return s;
}
export const MINI_OBRA = `<svg class="mini-obra" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs><linearGradient id="mo-cuerpo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4A383"/><stop offset=".45" stop-color="#D97757"/><stop offset="1" stop-color="#A9502F"/></linearGradient>
<radialGradient id="mo-brillo" cx=".25" cy=".2" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="mo-casco" cx=".35" cy=".2" r=".9"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".4" stop-color="#F2C14E"/><stop offset="1" stop-color="#C48F2A"/></radialGradient></defs>
<rect width="160" height="100" fill="#05060f"/><rect y="78" width="160" height="22" fill="#0a0c1d"/><rect y="78" width="160" height="1" fill="var(--tinte, #8fb8ff)" opacity=".5"/>
<g fill="#343c6b"><rect x="132" y="14" width="2" height="64"/><rect x="138" y="14" width="2" height="64"/><rect x="18" y="12" width="128" height="2"/><rect x="18" y="17" width="128" height="1"/><rect x="40" y="30" width="1" height="48"/><rect x="96" y="30" width="1" height="48"/></g>
<rect x="26" y="50" width="98" height="3" fill="#76594a"/><rect x="26" y="50" width="98" height="1" fill="#9a7a62"/>
<g class="mo-gancho"><rect x="112" y="18" width="1" height="10" fill="#8f97c4"/><rect x="105" y="28" width="15" height="9" fill="var(--tinte, #8fb8ff)"/><rect x="105" y="28" width="15" height="2" fill="#fff" opacity=".45"/></g>
<rect x="30" y="38" width="15" height="12" fill="var(--tinte, #8fb8ff)"/><rect x="30" y="38" width="15" height="2" fill="#fff" opacity=".4"/><rect x="46" y="38" width="15" height="12" fill="var(--tinte, #8fb8ff)" opacity=".8"/>
<g class="mo-soldador">${clawdSvg(64, 40, 2, { careta: true })}<rect class="mo-chispa" x="62" y="42" width="3" height="3" fill="#fff4d6"/><rect class="mo-chispa" x="58" y="38" width="2" height="2" fill="#ffb35c"/></g>
<g class="mo-cargador">${clawdSvg(4, 68, 2, { carga: true })}</g>
</svg>`;
