// La biblioteca: todas las tarjetas, con búsqueda de texto, etiquetas combinables (deben cumplirse todas) y
// orden. El estado vive en la URL (?q=…&e=ia,web&o=nombre), así una búsqueda se puede compartir.
import { PROYECTOS, ETIQUETAS } from '../assets/proyectos-datos.js';

const raiz = document.documentElement;
const L = () => (raiz.dataset.idioma === 'en' ? 'en' : 'es');
const $ = (id) => document.getElementById(id);
const q = $('q'), orden = $('orden'), rejilla = $('rejilla'), cajaEtq = $('etiquetas'), cuenta = $('cuenta'), vacio = $('vacio');
const params = new URLSearchParams(location.search);
const activas = new Set((params.get('e') || '').split(',').filter((e) => ETIQUETAS[e]));
q.value = params.get('q') || '';
orden.value = params.get('o') || 'destacados';

const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (t) => t.replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[x]);

function pintarEtiquetas() {
  const usadas = Object.keys(ETIQUETAS).filter((e) => PROYECTOS.some((p) => p.etiquetas.includes(e)));
  cajaEtq.innerHTML = usadas.map((e) => `<button type="button" data-e="${e}" aria-pressed="${activas.has(e)}">${ETIQUETAS[e][L()]}</button>`).join('');
}
function textos() {
  q.placeholder = L() === 'en' ? 'Search projects' : 'Buscar proyectos';
  for (const o of orden.options) o.textContent = o.dataset[L()];
}

// tarjeta de un proyecto que aún no tiene miniatura: un bichito colocando bloques
const MINI_OBRA = '<div class="mini-obra" aria-hidden="true"><span class="mo-bloque"></span><span class="mo-bloque"></span><span class="mo-bloque mo-cae"></span><span class="mo-bicho"></span></div>';
function tarjeta(p) {
  const l = L();
  return `<li class="tarjeta" style="--tinte:${p.color}">
    <a href="${p.id}/">
      <div class="vista">${p.miniatura === false ? MINI_OBRA : `<img src="${p.id}/media/miniatura.webp" alt="" loading="lazy" width="1200" height="750">`}${p.medio?.tipo === 'video' ? `<video data-src="${p.id}/${p.medio.archivo}" muted loop playsinline preload="none"></video>` : ''}${p.destacado ? `<span class="sello">${l === 'en' ? 'Featured' : 'Destacado'}</span>` : ''}</div>
      <p class="tipo">${esc(p.tipo[l])}</p>
      <h2 style="font-family:'${p.fuente}', Georgia, serif">${esc(p.nombre)}</h2>
      <p class="desc">${esc(p.desc[l])}</p>
      <ul class="chips">${p.etiquetas.map((e) => `<li>${ETIQUETAS[e][l]}</li>`).join('')}</ul>
    </a>
  </li>`;
}

function filtrar() {
  const t = sinAcentos(q.value.trim()), l = L();
  let lista = PROYECTOS.filter((p) => {
    if ([...activas].some((e) => !p.etiquetas.includes(e))) return false;
    if (!t) return true;
    const hay = sinAcentos([p.nombre, p.tipo.es, p.tipo.en, p.desc.es, p.desc.en, ...p.etiquetas.flatMap((e) => [ETIQUETAS[e].es, ETIQUETAS[e].en])].join(' '));
    return t.split(/\s+/).every((w) => hay.includes(w));
  });
  const o = orden.value;
  lista.sort((a, b) => o === 'nombre' ? a.nombre.localeCompare(b.nombre, l)
    : o === 'recientes' ? b.fecha.localeCompare(a.fecha)
    : (b.destacado - a.destacado) || b.fecha.localeCompare(a.fecha));
  rejilla.innerHTML = lista.map(tarjeta).join('');
  vacio.hidden = lista.length > 0;
  cuenta.textContent = l === 'en' ? `${lista.length} ${lista.length === 1 ? 'project' : 'projects'}` : `${lista.length} ${lista.length === 1 ? 'proyecto' : 'proyectos'}`;
  // la URL guarda el estado
  const u = new URLSearchParams();
  if (q.value.trim()) u.set('q', q.value.trim());
  if (activas.size) u.set('e', [...activas].join(','));
  if (o !== 'destacados') u.set('o', o);
  history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
  activarVideos();
}

// vídeo al pasar el ratón (en táctiles queda la imagen)
function activarVideos() {
  if (!matchMedia('(hover: hover)').matches) return;
  for (const t of rejilla.querySelectorAll('.tarjeta')) {
    const vista = t.querySelector('.vista'), v = vista.querySelector('video');
    t.addEventListener('pointerenter', () => { if (!v.src) v.src = v.dataset.src; v.play().then(() => vista.classList.add('reproduciendo')).catch(() => {}); });
    t.addEventListener('pointerleave', () => { v.pause(); vista.classList.remove('reproduciendo'); });
  }
}

cajaEtq.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-e]'); if (!b) return;
  activas.has(b.dataset.e) ? activas.delete(b.dataset.e) : activas.add(b.dataset.e);
  b.setAttribute('aria-pressed', String(activas.has(b.dataset.e)));
  filtrar();
});
q.addEventListener('input', filtrar);
orden.addEventListener('change', filtrar);
$('limpiar').addEventListener('click', () => { activas.clear(); q.value = ''; pintarEtiquetas(); filtrar(); q.focus(); });
addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); } });
document.addEventListener('raven-idioma', () => { textos(); pintarEtiquetas(); filtrar(); });
textos(); pintarEtiquetas(); filtrar();

// cielo: estrellas fijas y tenues, sin coste de GPU
const c = $('cielo'), x = c.getContext('2d');
function cielo() {
  const dpr = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  x.fillStyle = '#03040b'; x.fillRect(0, 0, c.width, c.height);
  const g = x.createRadialGradient(c.width * 0.8, 0, 0, c.width * 0.8, 0, c.width * 0.8);
  g.addColorStop(0, 'rgba(110,90,220,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < (innerWidth * innerHeight) / 1800; i++) { x.fillStyle = `rgba(230,232,255,${(0.15 + r() * 0.6).toFixed(2)})`; const t = r() < 0.06 ? 2 : 1; x.fillRect(Math.round(r() * c.width), Math.round(r() * c.height), t * dpr, t * dpr); }
}
addEventListener('resize', cielo); cielo();
