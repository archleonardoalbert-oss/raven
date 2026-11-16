// Conductor del scroll por paradas (solo en la portada). Dentro de cada parada el navegador desplaza con normalidad
// y la cámara está quieta; al empujar más allá de su borde se acumula el empuje (con un aviso que se llena) y, al
// llegar al umbral, la cámara viaja sola a la parada vecina. La lógica vive en conductor-modelo.js.
import { construirParadas, paradaEn, crearAutomata, zonaSegura } from './conductor-modelo.js';

const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
// zona segura de cada parada de la galaxia: según su contenido, dentro del reposo de la cámara
const conZona = (d) => (d.top === undefined ? d : { ...d, ...zonaSegura({ restIni: d.ini, restFin: d.fin, top: d.top, bottom: d.bottom, alto: innerHeight }) });
const paradas = () => construirParadas({ descansos: (window.__ravenDescansos?.() ?? []).map(conZona), faros: window.__ravenFaros?.() ?? [], resumen: window.__ravenResumen?.() ?? null });
let automata = crearAutomata({ alto: innerHeight });
addEventListener('resize', () => { automata = crearAutomata({ alto: innerHeight }); });

let viajando = false, ultimoGesto = -Infinity, sentido = 1, ultimoY = scrollY, actual = -1, quietoT = 0;
const saltando = () => window.__ravenSaltando?.() ?? false;
const ocupado = () => viajando || saltando();
const gesto = () => { ultimoGesto = performance.now(); };

// ── aviso: «Sigue para ir a …» con una barra que se llena ─────────────────────────────────────────
const aviso = document.createElement('div');
aviso.className = 'parada-aviso'; aviso.setAttribute('aria-hidden', 'true');
aviso.innerHTML = '<span class="parada-aviso-texto"></span><span class="parada-aviso-barra"><span></span></span>';
document.body.append(aviso);
const avisoTexto = aviso.querySelector('.parada-aviso-texto'), avisoLleno = aviso.querySelector('.parada-aviso-barra span');
let avisoT = 0;
function mostrarAviso(orden, dir) {
  if (!orden.destino) { ocultarAviso(); return; }
  const en = window.ravenIdioma?.() === 'en';
  avisoTexto.textContent = en ? `Keep going to ${orden.destino.nombre?.en ?? ''}` : `Sigue para ir a ${orden.destino.nombre?.es ?? ''}`;
  avisoLleno.style.transform = `scaleX(${Math.min(1, orden.progreso).toFixed(3)})`;
  aviso.classList.toggle('arriba', dir < 0);
  aviso.classList.add('visible');
  clearTimeout(avisoT); avisoT = setTimeout(ocultarAviso, 700);
}
function ocultarAviso() { aviso.classList.remove('visible'); }

// ── viaje ─────────────────────────────────────────────────────────────────────────────────────────
const suave = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
function viajar(orden) {
  ocultarAviso();
  const llegar = () => { viajando = false; actual = paradaEn(paradas(), scrollY); automata.evento('llegada', {}); };
  if (reducido) {
    scrollTo({ top: orden.y, behavior: 'instant' }); window.__ravenFijarScroll?.(); window.__ravenFijarCaida?.(); llegar(); return;
  }
  viajando = true;
  const y0 = scrollY, d = orden.y - y0, t0 = performance.now();
  const paso = (t) => {
    const u = Math.min(1, (t - t0) / orden.duracion);
    scrollTo({ top: y0 + d * suave(u), behavior: 'instant' });
    if (u < 1) requestAnimationFrame(paso); else llegar();
  };
  requestAnimationFrame(paso);
}
function ejecutar(orden, e, dir) {
  if (orden.hacer === 'nativo') return;
  e?.preventDefault();
  if (orden.hacer === 'ajustar') scrollTo({ top: orden.y, behavior: 'instant' });
  else if (orden.hacer === 'retener') mostrarAviso(orden, dir);
  else if (orden.hacer === 'viajar') viajar(orden);
}

// ── rueda ─────────────────────────────────────────────────────────────────────────────────────────
addEventListener('wheel', (e) => {
  if (e.ctrlKey) return;  // zoom
  if (ocupado()) { e.preventDefault(); return; }
  gesto();
  const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
  ejecutar(automata.evento('rueda', { dy, y: scrollY, paradas: paradas() }), e, Math.sign(dy));
}, { passive: false });

// ── teclado (Inicio/Fin siguen siendo saltos de nav.js) ───────────────────────────────────────────
addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
  const tecla = e.key === ' ' && e.shiftKey ? 'PageUp' : e.key;
  if (![' ', 'Spacebar', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(tecla)) return;
  if (ocupado()) { e.preventDefault(); return; }
  gesto();
  ejecutar(automata.evento('tecla', { tecla, y: scrollY, paradas: paradas() }), e, 0);
});

// ── táctil ────────────────────────────────────────────────────────────────────────────────────────
let toque = null;
addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) { toque = null; return; }
  const y = e.touches[0].clientY; toque = { y, previo: y, t: performance.now(), muestras: [[performance.now(), y]] };
  gesto();
}, { passive: true });
addEventListener('touchmove', (e) => {
  if (!toque) return;
  if (ocupado()) { e.preventDefault(); return; }
  const y = e.touches[0].clientY, dy = toque.previo - y; toque.previo = y;
  const ahora = performance.now(); toque.muestras.push([ahora, y]); toque.muestras = toque.muestras.filter(([t]) => ahora - t < 120);
  gesto();
  if (dy) ejecutar(automata.evento('rueda', { dy, y: scrollY, paradas: paradas() }), e, Math.sign(dy));
}, { passive: false });
addEventListener('touchend', () => {
  if (!toque || ocupado()) { toque = null; return; }
  const m = toque.muestras, [t0, y0] = m[0], [t1, y1] = m[m.length - 1];
  const velocidad = t1 > t0 ? (y0 - y1) / (t1 - t0) : 0;  // px/ms; positiva = hacia abajo en la página
  toque = null; gesto();
  ejecutar(automata.evento('toqueFin', { velocidad, y: scrollY, paradas: paradas() }), null, Math.sign(velocidad));
}, { passive: true });

// ── scroll: la inercia no saca de la parada; quedarse en un trayecto (barra) lleva a una parada ────
addEventListener('scroll', () => {
  const dy = scrollY - ultimoY; if (Math.abs(dy) > 1) sentido = Math.sign(dy); ultimoY = scrollY;
  if (ocupado()) return;
  const P = paradas(), i = paradaEn(P, scrollY);
  if (i >= 0) actual = i;
  else if (actual >= 0 && P[actual] && performance.now() - ultimoGesto < 600) {
    // inercia de un gesto (rueda suave, trackpad, móvil) que rebasa el borde: se queda en el borde
    const p = P[actual]; scrollTo({ top: scrollY > p.fin ? p.fin : p.ini, behavior: 'instant' }); return;
  }
  clearTimeout(quietoT);
  quietoT = setTimeout(() => {
    if (ocupado()) return;
    const P2 = paradas();
    if (paradaEn(P2, scrollY) >= 0) return;
    ejecutar(automata.evento('quieto', { y: scrollY, paradas: P2, sentido }), null, sentido);
  }, 220);
}, { passive: true });

window.__ravenConductor = {
  // tras un salto de hiperespacio (índice, #ancla, Inicio/Fin): se llega a una parada sin viaje extra
  trasSalto() { viajando = false; actual = paradaEn(paradas(), scrollY); automata.evento('llegada', {}); ocultarAviso(); },
  paradas,
};
