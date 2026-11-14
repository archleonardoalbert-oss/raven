// Semillero: un tallo baja por el margen izquierdo de toda la página y se ilumina hasta donde has
// leído; al pasar por cada sección se abre su hoja.
(function () {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = document.querySelector('.tallo');
  const fondo = svg?.querySelector('.tallo-fondo');
  const vivo = svg?.querySelector('.tallo-vivo');
  const hitos = [...document.querySelectorAll('.hito')];
  let largo = 1;

  function trazar() {
    if (!svg) return;
    const alto = document.documentElement.scrollHeight;
    svg.setAttribute('viewBox', `0 0 60 ${alto}`);
    svg.style.height = `${alto}px`;
    // el tallo serpentea suavemente y pasa por la altura de cada hito
    let d = `M30 ${innerHeight * 0.75}`;
    let y = innerHeight * 0.75, lado = 1;
    while (y < alto - 40) {
      const sig = Math.min(alto - 40, y + 260);
      d += ` C${30 + 16 * lado} ${y + 90} ${30 + 16 * lado} ${sig - 90} 30 ${sig}`;
      y = sig; lado = -lado;
    }
    fondo.setAttribute('d', d);
    vivo.setAttribute('d', d);
    largo = vivo.getTotalLength();
    vivo.style.strokeDasharray = `${largo}`;
    actualizar();
  }

  function actualizar() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = reducido ? 1 : Math.min(1, Math.max(0, scrollY / Math.max(1, max)));
    if (vivo) vivo.style.strokeDashoffset = `${largo * (1 - p)}`;
    for (const h of hitos) h.classList.toggle('viva', reducido || h.getBoundingClientRect().top < innerHeight * 0.7);
  }

  addEventListener('scroll', actualizar, { passive: true });
  addEventListener('resize', trazar);
  document.addEventListener('raven-idioma', () => requestAnimationFrame(trazar));
  addEventListener('load', trazar);
  trazar();
})();
