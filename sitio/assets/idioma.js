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
  // Movimiento: lo decide la preferencia del sistema («reducir movimiento»); sin ella, la página anima con normalidad.
  // (el interruptor de la barra se retiró; una elección guardada de antes ya no cuenta)
  try { localStorage.removeItem('raven-movimiento'); } catch (e) {}
  window.ravenReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  raiz.dataset.movimiento = window.ravenReducido ? 'reducido' : 'normal';
  // La barra de las páginas toma fondo en cuanto el contenido pasa por debajo.
  const marcar = () => raiz.classList.toggle('desplazado', scrollY > 40);
  addEventListener('scroll', marcar, { passive: true });
  marcar();
})();
