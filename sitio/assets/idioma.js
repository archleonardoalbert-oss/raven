// Español / inglés en la misma página: cada texto existe en los dos idiomas (lang="es" / lang="en")
// y el CSS oculta el que no toca según html[data-idioma]. La elección se recuerda en este navegador.
(function () {
  const raiz = document.documentElement;
  let guardado = null;
  try { guardado = localStorage.getItem('raven-idioma'); } catch (e) {}
  const inicial = guardado || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');

  function aplicar(idioma) {
    raiz.dataset.idioma = idioma;
    raiz.lang = idioma;
    for (const b of document.querySelectorAll('[data-poner-idioma]')) {
      b.setAttribute('aria-pressed', String(b.dataset.ponerIdioma === idioma));
    }
    const titulo = document.querySelector(`meta[name="titulo-${idioma}"]`);
    if (titulo) document.title = titulo.content;
    try { localStorage.setItem('raven-idioma', idioma); } catch (e) {}
    document.dispatchEvent(new CustomEvent('raven-idioma', { detail: idioma }));
  }

  aplicar(inicial);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-poner-idioma]');
    if (b) aplicar(b.dataset.ponerIdioma);
  });
  window.ravenIdioma = () => raiz.dataset.idioma;
  // Movimiento: el interruptor de la barra (guardado en este navegador) manda sobre la preferencia del sistema.
  // Con el movimiento reducido no hay animaciones y la cámara se mueve a saltos; se aplica al recargar la página.
  let mov = null;
  try { mov = localStorage.getItem('raven-movimiento'); } catch (e) {}
  window.ravenReducido = mov ? mov === 'reducido' : matchMedia('(prefers-reduced-motion: reduce)').matches;
  raiz.dataset.movimiento = window.ravenReducido ? 'reducido' : 'normal';
  // Bienvenida «Primera luz» (solo portada): la primera visita de la sesión, sin movimiento reducido ni #ancla
  let vista = null;
  try { vista = sessionStorage.getItem('raven-bienvenida'); } catch (e) {}
  window.ravenBienvenida = raiz.dataset.pagina === 'portada' && !window.ravenReducido && !vista && !location.hash;
  if (window.ravenBienvenida) {
    raiz.classList.add('bienvenida');
    try { sessionStorage.setItem('raven-bienvenida', '1'); } catch (e) {}
    // cualquier gesto la termina al momento; y, pase lo que pase, a los 2,6 s el texto ya está
    const terminar = () => { raiz.classList.add('bienvenida-fin'); window.__ravenEncenderYa?.(); quitar(); };
    const quitar = () => ['wheel', 'keydown', 'pointerdown', 'touchstart'].forEach((t) => removeEventListener(t, terminar, true));
    ['wheel', 'keydown', 'pointerdown', 'touchstart'].forEach((t) => addEventListener(t, terminar, { capture: true, passive: true }));
    setTimeout(quitar, 4000);
    // el nombre entra con su tipografía de verdad (Bodoni Moda), no con la de reserva: se espera a las fuentes (≤ 1 s)
    const fuentes = () => raiz.classList.add('fuentes-listas');
    (document.fonts?.ready ?? Promise.resolve()).then(fuentes); setTimeout(fuentes, 1000);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-movimiento-interruptor]');
    if (!b) return;
    try { localStorage.setItem('raven-movimiento', window.ravenReducido ? 'normal' : 'reducido'); } catch (err) {}
    location.reload();
  });
  const pintarMov = () => { for (const b of document.querySelectorAll('[data-movimiento-interruptor]')) b.setAttribute('aria-pressed', String(!window.ravenReducido)); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pintarMov); else pintarMov();
  // La barra de las páginas toma fondo en cuanto el contenido pasa por debajo.
  const marcar = () => raiz.classList.toggle('desplazado', scrollY > 40);
  addEventListener('scroll', marcar, { passive: true });
  marcar();
})();
