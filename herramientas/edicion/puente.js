// Puente del modo edición: une la página de Raven (dentro de un iframe del Manager) con el editor visual.
// página → Manager: listo (qué textos hay y cuáles se ven), clic (qué texto se pinchó)
// Manager → página: pintar (vista en vivo), marcar/ir (señalar y llevar a un texto), idioma, etiquetas
const SEL = '[data-raven-texto]';
const enviar = (m) => parent.postMessage(m, location.origin);
const partes = (el) => { const [archivo, clave] = el.dataset.ravenTexto.split('|'); return { archivo, clave }; };
const deClave = (archivo, clave) => document.querySelectorAll(`[data-raven-texto="${CSS.escape(`${archivo}|${clave}`)}"]`);
const idiomaDe = (el) => el.getAttribute('lang') || el.dataset.idioma || null;
let nombres = {}, marcas = true;  // marcas: false en la ficha del proyecto (sin contornos ni edición por clic)
const delManager = (el) => !!el.closest?.('[data-rv-manager]');  // interfaz del Manager montada en la página

const etiqueta = document.createElement('div'); etiqueta.className = 'rv-etiqueta'; etiqueta.hidden = true;
document.addEventListener('DOMContentLoaded', () => document.body.append(etiqueta));

function visible(el) { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; }
function anunciar() {
  const vistos = new Map();
  for (const el of document.querySelectorAll(SEL)) { const k = el.dataset.ravenTexto; vistos.set(k, (vistos.get(k) ?? false) || visible(el)); }
  enviar({ tipo: 'listo', textos: [...vistos].map(([k, v]) => { const [archivo, clave] = k.split('|'); return { archivo, clave, visible: v }; }) });
}

// pasar el ratón: contorno y etiqueta «Zona · Elemento»
document.addEventListener('mouseover', (e) => {
  const el = marcas && !delManager(e.target) ? e.target.closest(SEL) : null;
  for (const x of document.querySelectorAll('.rv-encima')) if (!el || x.dataset.ravenTexto !== el.dataset.ravenTexto) x.classList.remove('rv-encima');
  if (!el) { etiqueta.hidden = true; return; }
  for (const x of deClave(...Object.values(partes(el)))) x.classList.add('rv-encima');
  const r = el.getBoundingClientRect();
  etiqueta.textContent = nombres[el.dataset.ravenTexto] ?? partes(el).clave;
  etiqueta.style.left = `${Math.max(4, r.left)}px`; etiqueta.style.top = `${Math.max(24, r.top)}px`; etiqueta.hidden = false;
});
// clic: se edita en el Manager; los enlaces y botones de la página no navegan en modo edición
document.addEventListener('click', (e) => {
  if (!e.isTrusted || delManager(e.target)) return;  // clics simulados (cambio de idioma) o de la interfaz del Manager
  const el = marcas ? e.target.closest(SEL) : null;
  e.preventDefault(); e.stopPropagation();
  if (el) { marcar(partes(el)); enviar({ tipo: 'clic', ...partes(el) }); }
}, true);

function marcar({ archivo, clave }, desplazar = false) {
  for (const x of document.querySelectorAll('.rv-activo')) x.classList.remove('rv-activo');
  const els = [...deClave(archivo, clave)];
  for (const x of els) x.classList.add('rv-activo');
  if (desplazar) { const el = els.find(visible) ?? els[0]; (el?.closest('section') && !visible(el) ? el.closest('section') : el)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}

addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.source !== parent) return;
  const m = e.data ?? {};
  if (m.tipo === 'pintar') {
    for (const el of deClave(m.archivo, m.clave)) { const l = idiomaDe(el); const v = l === 'en' ? m.en : l === 'es' ? m.es : m.es; if (typeof v === 'string') el.innerHTML = v; }
  } else if (m.tipo === 'marcar') marcar(m);
  else if (m.tipo === 'ir') marcar(m, true);
  else if (m.tipo === 'idioma') document.querySelector(`[data-poner-idioma="${m.l === 'en' ? 'en' : 'es'}"]`)?.click();
  else if (m.tipo === 'etiquetas') nombres = m.mapa ?? {};
  else if (m.tipo === 'anunciar') anunciar();
  else if (m.tipo === 'modo') { marcas = m.marcas !== false; document.documentElement.classList.toggle('rv-sin-marcas', !marcas); etiqueta.hidden = true; }
});
addEventListener('load', () => setTimeout(anunciar, 300));
