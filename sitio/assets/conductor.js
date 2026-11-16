// Conductor del scroll por paradas (solo en la portada). Dentro de cada parada el navegador desplaza con normalidad
// y la cámara está quieta; al empujar más allá de su borde se acumula el empuje (con un aviso que se llena) y, al
// llegar al umbral, la cámara viaja sola a la parada vecina. La lógica vive en conductor-modelo.js.
import { construirParadas, paradaEn, crearAutomata, zonaSegura, desplazableDentro } from './conductor-modelo.js';

const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── paradas (en caché: se recalculan al cambiar tamaño, contenido o idioma) ───────────────────────
// zona segura de cada parada de la galaxia: según su contenido, dentro del reposo de la cámara
const conZona = (d) => (d.top === undefined ? d : { ...d, ...zonaSegura({ restIni: d.ini, restFin: d.fin, top: d.top, bottom: d.bottom, alto: innerHeight }) });
let cache = null;
const paradas = () => (cache ??= construirParadas({ descansos: (window.__ravenDescansos?.() ?? []).map(conZona), faros: window.__ravenFaros?.() ?? [], resumen: window.__ravenResumen?.() ?? null }));
const invalidar = () => { cache = null; };
addEventListener('load', invalidar);
document.addEventListener('raven-idioma', invalidar);
if ('ResizeObserver' in window) new ResizeObserver(invalidar).observe(document.body);

const automata = crearAutomata({ alto: () => innerHeight });
let viajando = false, viaje = 0, ultimoGesto = -Infinity, sentido = 1, ultimoY = scrollY, actual = -1, fraccion = 0, quietoT = 0;
let inerciaTactil = false, arrastrandoBarra = false, esperaInicial = location.hash ? performance.now() + 1500 : 0;
const saltando = () => window.__ravenSaltando?.() ?? false;
const ocupado = () => viajando || saltando();
const gesto = () => { ultimoGesto = performance.now(); automata.evento('gesto', {}); };

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

// ── viaje (cancelable: un salto del índice o de Inicio/Fin lo interrumpe) ────────────────────────
const suave = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
function recordar() { const P = paradas(), i = paradaEn(P, scrollY); actual = i; if (i >= 0) fraccion = (scrollY - P[i].ini) / Math.max(1, P[i].fin - P[i].ini); }
function viajar(orden) {
  ocultarAviso(); clearTimeout(quietoT);
  const id = ++viaje;
  const llegar = () => { if (id !== viaje) return; viajando = false; recordar(); automata.evento('llegada', {}); };
  if (reducido) {
    scrollTo({ top: orden.y, behavior: 'instant' }); window.__ravenFijarScroll?.(); window.__ravenFijarCaida?.(); llegar(); return;
  }
  viajando = true;
  const y0 = scrollY, d = orden.y - y0, t0 = performance.now();
  const paso = (t) => {
    if (id !== viaje) return;
    const u = Math.min(1, (t - t0) / orden.duracion);
    scrollTo({ top: y0 + d * suave(u), behavior: 'instant' });
    if (u < 1) requestAnimationFrame(paso); else llegar();
  };
  requestAnimationFrame(paso);
}
function ejecutar(orden, e, dir) {
  if (orden.hacer === 'nativo') return;
  if (e?.cancelable !== false) e?.preventDefault();
  if (orden.hacer === 'ajustar') scrollTo({ top: orden.y, behavior: 'instant' });
  else if (orden.hacer === 'retener') mostrarAviso(orden, dir);
  else if (orden.hacer === 'viajar') viajar(orden);
}

// un contenedor interior desplazable (la lista del resumen, la tarjeta de Sobre mí) se queda el gesto mientras pueda
function interior(objetivo, dy) {
  const cadena = [];
  for (let el = objetivo instanceof Element ? objetivo : null; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const o = getComputedStyle(el).overflowY;
    cadena.push({ desplazable: o === 'auto' || o === 'scroll', scrollTop: el.scrollTop, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight });
  }
  return desplazableDentro(cadena, dy);
}

// ── rueda ─────────────────────────────────────────────────────────────────────────────────────────
addEventListener('wheel', (e) => {
  if (e.ctrlKey) return;  // zoom
  if (ocupado()) { e.preventDefault(); return; }
  const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
  if (interior(e.target, dy)) return;
  ultimoGesto = performance.now();
  ejecutar(automata.evento('rueda', { dy, y: scrollY, paradas: paradas() }), e, Math.sign(dy));
}, { passive: false });

// ── teclado (Inicio/Fin siguen siendo saltos de nav.js) ───────────────────────────────────────────
addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
  const tecla = e.key === ' ' && e.shiftKey ? 'PageUp' : e.key;
  if (![' ', 'Spacebar', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(tecla)) return;
  if (ocupado()) { e.preventDefault(); return; }
  if (interior(document.activeElement, ['PageUp', 'ArrowUp'].includes(tecla) ? -1 : 1)) return;
  ultimoGesto = performance.now();
  ejecutar(automata.evento('tecla', { tecla, y: scrollY, paradas: paradas() }), e, 0);
});

// ── táctil ────────────────────────────────────────────────────────────────────────────────────────
let toque = null;
addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) { toque = null; return; }
  const y = e.touches[0].clientY; toque = { y, previo: y, objetivo: e.target, muestras: [[performance.now(), y]] };
  inerciaTactil = false; gesto();
}, { passive: true });
addEventListener('touchmove', (e) => {
  if (!toque) return;
  if (ocupado()) { if (e.cancelable) e.preventDefault(); return; }
  const y = e.touches[0].clientY, dy = toque.previo - y; toque.previo = y;
  const ahora = performance.now(); toque.muestras.push([ahora, y]); toque.muestras = toque.muestras.filter(([t]) => ahora - t < 120);
  if (!dy || interior(toque.objetivo, dy)) return;
  ultimoGesto = ahora;
  ejecutar(automata.evento('rueda', { dy, y: scrollY, paradas: paradas() }), e, Math.sign(dy));
}, { passive: false });
addEventListener('touchend', () => {
  if (!toque || ocupado()) { toque = null; return; }
  const m = toque.muestras, [t0, y0] = m[0], [t1, y1] = m[m.length - 1];
  const velocidad = t1 > t0 ? (y0 - y1) / (t1 - t0) : 0;  // px/ms; positiva = hacia abajo en la página
  const objetivo = toque.objetivo; toque = null;
  inerciaTactil = true; gesto();  // el desplazamiento que sigue al soltar es inercia del gesto: nunca viaja sola
  if (!interior(objetivo, velocidad)) ejecutar(automata.evento('toqueFin', { velocidad, y: scrollY, paradas: paradas() }), null, Math.sign(velocidad));
}, { passive: true });

// ── barra de scroll: mientras se arrastra no se decide nada ───────────────────────────────────────
addEventListener('pointerdown', (e) => { if (e.clientX >= document.documentElement.clientWidth) arrastrandoBarra = true; }, { passive: true });
addEventListener('pointerup', () => { if (arrastrandoBarra) { arrastrandoBarra = false; programarQuieto(); } }, { passive: true });

// ── scroll: la inercia no saca de la parada; quedarse en un trayecto (barra) lleva a una parada ────
function programarQuieto() {
  clearTimeout(quietoT);
  quietoT = setTimeout(() => {
    inerciaTactil = false;
    if (ocupado() || arrastrandoBarra || performance.now() < esperaInicial) return;
    const P = paradas();
    if (paradaEn(P, scrollY) >= 0) return;
    ejecutar(automata.evento('quieto', { y: scrollY, paradas: P, sentido }), null, sentido);
  }, 220);
}
addEventListener('scroll', () => {
  const dy = scrollY - ultimoY; if (Math.abs(dy) > 1) sentido = Math.sign(dy); ultimoY = scrollY;
  if (ocupado()) return;
  if (toque || inerciaTactil) gesto();
  const P = paradas(), i = paradaEn(P, scrollY);
  if (i >= 0) { actual = i; fraccion = (scrollY - P[i].ini) / Math.max(1, P[i].fin - P[i].ini); }
  else if (actual >= 0 && P[actual] && performance.now() - ultimoGesto < 600) {
    // inercia de un gesto (rueda suave, trackpad, móvil) que rebasa el borde: se queda en el borde
    const p = P[actual]; scrollTo({ top: scrollY > p.fin ? p.fin : p.ini, behavior: 'instant' }); return;
  }
  programarQuieto();
}, { passive: true });

// ── cambio de tamaño: sigue en la misma parada, en la misma posición relativa ─────────────────────
let anchoPrevio = innerWidth, altoPrevio = innerHeight, tamT = 0, idPrevio = null;
addEventListener('resize', () => {
  if (idPrevio === null && cache && actual >= 0) idPrevio = cache[actual]?.id ?? null;  // la parada en que se estaba, antes de medir de nuevo
  invalidar();
  // la barra del navegador móvil al aparecer y ocultarse cambia el alto unos px: eso no es un cambio de tamaño
  if (innerWidth === anchoPrevio && Math.abs(innerHeight - altoPrevio) < 150) return;
  clearTimeout(tamT);
  tamT = setTimeout(() => {
    anchoPrevio = innerWidth; altoPrevio = innerHeight;
    const id = idPrevio; idPrevio = null;
    if (actual < 0 || ocupado()) return;
    invalidar();
    const P = paradas(), j = id ? P.findIndex((p) => p.id === id) : -1, p = P[j >= 0 ? j : actual];
    if (!p) return;
    scrollTo({ top: Math.round(p.ini + fraccion * (p.fin - p.ini)), behavior: 'instant' });
    window.__ravenFijarScroll?.(); window.__ravenFijarCaida?.(); recordar();
  }, 200);
});

window.__ravenConductor = {
  // tras un salto de hiperespacio (índice, #ancla, Inicio/Fin): se llega a una parada sin viaje extra
  trasSalto() { viaje++; viajando = false; clearTimeout(quietoT); esperaInicial = 0; invalidar(); recordar(); automata.evento('llegada', {}); ocultarAviso(); },
  paradas,
};
