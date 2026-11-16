// Cruzar el horizonte: al pulsar el botón de la vista junto al agujero negro, la cámara cae sola hasta el horizonte
// (agujero.js la conduce con estado.cruce.avance de 0 a 1), todo se apaga y se abre el resumen con todas las
// habilidades. Al cerrarlo (botón, Esc o seguir bajando al final de la lista) se sale con el salto de hiperespacio de
// nav.js y se aterriza en Proyectos. Mientras dura, el scroll de la página está bloqueado; siempre se libera.
const raiz = document.documentElement;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const movil = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const boton = document.querySelector('.cruzar'), capa = document.querySelector('.resumen'), negro = document.querySelector('.caida .negro');
const seguir = capa.querySelector('.resumen-seguir');
const estado = () => window.__ravenBH;
const suave = (x) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

// ── bloqueo del scroll ───────────────────────────────────────────────────────────────────────────
// dentro de la capa abierta solo se permite lo que la propia capa puede desplazar: si no le queda recorrido en ese
// sentido (o no tiene), el navegador pasaría el gesto a la página de debajo
let toqueY = 0;
addEventListener('touchstart', (e) => { toqueY = e.touches[0]?.clientY ?? 0; }, { passive: true });
function parar(e) {
  if (capa.contains(e.target) && capa.classList.contains('abierto')) {
    const dy = e.type === 'wheel' ? e.deltaY : toqueY - (e.touches[0]?.clientY ?? toqueY);
    if (e.type === 'touchmove') toqueY = e.touches[0]?.clientY ?? toqueY;
    const puede = dy < 0 ? capa.scrollTop > 0 : capa.scrollTop + capa.clientHeight < capa.scrollHeight - 1;
    if (dy && puede) return;
  }
  if (e.cancelable) e.preventDefault();
}
const teclas = (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key) && !capa.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); } };
let bloqueado = false, seguro = 0;
function bloquear() {
  if (bloqueado) return; bloqueado = true;
  raiz.classList.add('cruzando');
  addEventListener('wheel', parar, { passive: false }); addEventListener('touchmove', parar, { passive: false }); addEventListener('keydown', teclas, true);
}
function liberar() {
  if (!bloqueado) return; bloqueado = false;
  raiz.classList.remove('cruzando');
  removeEventListener('wheel', parar); removeEventListener('touchmove', parar); removeEventListener('keydown', teclas, true);
}

// ── la caída ─────────────────────────────────────────────────────────────────────────────────────
let anim = 0;
function cruzar() {
  const bh = estado(); if (!bh || bh.cruce) return;
  bloquear();
  if (reducido) { abrir(); return; }
  bh.cruce = { avance: 0 };
  const dura = movil ? 2500 : 3500, t0 = performance.now();
  clearTimeout(seguro); seguro = setTimeout(() => { if (!capa.classList.contains('abierto')) abrir(); }, dura + 2500);  // por si algo se atasca
  const paso = (t) => {
    const u = Math.min(1, (t - t0) / dura);
    bh.cruce.avance = u;
    negro.style.opacity = String(suave((u - 0.62) / 0.33));
    if (u < 1) anim = requestAnimationFrame(paso); else abrir();
  };
  anim = requestAnimationFrame(paso);
}

// ── la capa del resumen ──────────────────────────────────────────────────────────────────────────
let alFinal = false;
function abrir() {
  cancelAnimationFrame(anim); clearTimeout(seguro);
  const bh = estado(); if (bh) bh.cruce = { avance: 1 };
  bloquear();
  negro.style.opacity = '1';
  capa.hidden = false; capa.scrollTop = 0; alFinal = false;
  requestAnimationFrame(() => capa.classList.add('abierto'));
  seguir.focus({ preventScroll: true });
}
function cerrar() {
  if (!capa.classList.contains('abierto')) return;
  capa.classList.remove('abierto');
  const salir = () => {
    // con la pantalla tapada: fuera del agujero negro y scroll libre otra vez
    const bh = estado(); if (bh) bh.cruce = null;
    negro.style.opacity = '0'; capa.hidden = true; liberar();
  };
  if (window.__ravenSaltar) window.__ravenSaltar('proyectos', salir);
  else { salir(); document.getElementById('proyectos').scrollIntoView(); }
  setTimeout(() => { if (bloqueado) salir(); }, 4000);  // siempre se libera
}
window.__ravenAbrirResumen = () => { abrir(); };

boton.addEventListener('click', cruzar);
seguir.addEventListener('click', cerrar);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && capa.classList.contains('abierto')) cerrar(); });
// seguir bajando al final de la lista también sale (un empujón más, no el mismo gesto que llegó al final)
capa.addEventListener('wheel', (e) => {
  const fin = capa.scrollTop + capa.clientHeight >= capa.scrollHeight - 2;
  if (e.deltaY > 0 && fin && alFinal) cerrar();
  clearTimeout(capa._t); capa._t = setTimeout(() => { alFinal = capa.scrollTop + capa.clientHeight >= capa.scrollHeight - 2; }, 350);
}, { passive: true });
if (location.hash === '#resumen') addEventListener('load', () => setTimeout(abrir, 400));
