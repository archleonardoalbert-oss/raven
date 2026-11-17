// CV de una página a partir del contenido de Raven (textos, proyectos con sus cifras, habilidades). Solo usa datos
// que ya están en la web: nada de fechas, niveles ni idiomas inventados. Para imprimir: papel blanco, tinta casi
// negra, Bodoni Moda e Instrument Sans como en la portada, y el oro como único acento.
//   node herramientas/cv.mjs           → sitio/cv/leonardo-albert-lopez-cv-es.pdf y …-en.pdf (Firefox oculto)
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => JSON.parse(readFileSync(join(raiz, r), 'utf8'));
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const sinHtml = (t) => String(t).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function htmlCV(L, { textos = leer('contenido/textos.json'), proyectos = leer('contenido/proyectos.json'), habilidades = leer('contenido/habilidades.json'), paginas = null } = {}) {
  const T = (s, k) => textos[s][k][L];
  const pag = (id) => paginas?.[id] ?? (() => { try { return leer(`contenido/paginas/${id}.json`); } catch { return {}; } })();
  const titulos = L === 'es'
    ? { perfil: 'Perfil', proy: 'Proyectos', hab: 'Habilidades', form: 'Formación', web: 'Portafolio' }
    : { perfil: 'Profile', proy: 'Projects', hab: 'Skills', form: 'Education', web: 'Portfolio' };
  const num = (n) => (typeof n === 'object' ? n[L] : n);
  const proy = proyectos.filter((p) => p.principal).map((p) => {
    const c = (pag(p.id).cifras ?? []).map((x) => `<li><b>${esc(num(x.n))}</b> ${esc(x[L])}</li>`).join('');
    return `<article><h3>${esc(p.nombre)} <span>${esc(p.tipo[L])}</span></h3><p>${esc(sinHtml(p.desc[L]))}</p>${c ? `<ul>${c}</ul>` : ''}
      <p class="enlace">github.com/${esc(p.repo)}</p></article>`;
  }).join('');
  const hab = habilidades.map((a) => `<div><h4>${esc(a[L])}</h4><p>${a.habilidades.map((h) => esc(h[L])).join(' · ')}</p></div>`).join('');
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><title>Leonardo Albert López · CV</title>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Instrument+Sans:wght@400..700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 12mm 14mm; }
  :root { --tinta: #14110d; --tinta-2: #4d463d; --tinta-3: #857c70; --oro: #b8862c; --filo: #e2d9c9; }
  * { box-sizing: border-box; }
  body { margin: 0; color: var(--tinta); font: 400 9.3pt/1.42 'Instrument Sans', sans-serif; background: #fff; }
  header { display: grid; grid-template-columns: 1fr auto; gap: 6mm; align-items: end; padding-bottom: 5mm; border-bottom: 0.6pt solid var(--tinta); }
  h1 { margin: 0; font: 400 28pt/0.95 'Bodoni Moda', serif; letter-spacing: -0.01em; }
  .lema { margin: 3mm 0 0; font-size: 10.6pt; color: var(--tinta-2); max-width: 118mm; }
  .contacto { text-align: right; font-size: 8.8pt; color: var(--tinta-2); line-height: 1.6; }
  .contacto b { color: var(--tinta); font-weight: 600; }
  h2 { margin: 5mm 0 2mm; font: italic 400 13pt 'Bodoni Moda', serif; color: var(--oro); }
  .perfil p { margin: 0; color: var(--tinta-2); }
  article { padding: 2.2mm 0; border-bottom: 0.4pt solid var(--filo); break-inside: avoid; }
  article h3 { margin: 0; font: 600 11pt 'Instrument Sans', sans-serif; }
  article h3 span { font-weight: 400; color: var(--tinta-3); font-size: 9pt; margin-left: 2mm; }
  article p { margin: 1mm 0 0; color: var(--tinta-2); }
  article ul { margin: 1.4mm 0 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm; }
  article li { font-size: 8.6pt; color: var(--tinta-2); line-height: 1.35; }
  article li b { display: block; font: 400 13pt 'Bodoni Moda', serif; color: var(--tinta); }
  .enlace { font-size: 8.4pt; color: var(--tinta-3) !important; }
  .hab { display: grid; grid-template-columns: 1fr 1fr; gap: 2.4mm 7mm; }
  .hab h4 { margin: 0; font: 600 9.4pt 'Instrument Sans', sans-serif; }
  .hab p { margin: 0.6mm 0 0; color: var(--tinta-2); font-size: 8.8pt; }
  .form p { margin: 0; }
</style></head><body>
<header>
  <div><h1>Leonardo Albert López</h1><p class="lema">${esc(T('inicio', '2'))}</p></div>
  <div class="contacto"><b>archleonardoalbert@gmail.com</b><br>github.com/archleonardoalbert-oss<br>${titulos.web}: raven.raven-0.workers.dev<br>${esc(T('sobre-mi', '10'))}</div>
</header>
<section class="perfil"><h2>${titulos.perfil}</h2><p>${esc(T('sobre-mi', '2'))} ${esc(sinHtml(T('sobre-mi', '3')))}</p></section>
<section class="form"><h2>${titulos.form}</h2><p><b>${esc(T('sobre-mi', '5'))}</b>, MatCom, ${esc(T('sobre-mi', '8'))}</p></section>
<section><h2>${titulos.proy}</h2>${proy}</section>
<section><h2>${titulos.hab}</h2><div class="hab">${hab}</div></section>
</body></html>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: puppeteer } = await import('puppeteer-core');
  const salida = join(raiz, 'sitio/cv'), tmp = mkdtempSync(join(tmpdir(), 'raven-cv-')); mkdirSync(salida, { recursive: true });
  const b = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi' });
  try {
    for (const L of ['es', 'en']) {
      const html = join(tmp, `cv-${L}.html`); writeFileSync(html, htmlCV(L));
      const p = await b.newPage(); await p.goto(`file://${html}`, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 1500));
      await p.pdf({ path: join(salida, `leonardo-albert-lopez-cv-${L}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
      await p.close(); console.log(`CV ${L} listo`);
    }
  } finally { await b.close(); rmSync(tmp, { recursive: true, force: true }); }
}
