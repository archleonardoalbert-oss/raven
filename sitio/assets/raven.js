// Coreografía de la portada: pantalla de carga, nombre que aparece letra a letra, manifiesto que se
// enciende palabra a palabra con el scroll, paneles que entran, botones magnéticos y vídeos que solo se
// reproducen cuando están a la vista. La cámara 3D la lleva galaxia.js.
(function () {
  const raiz = document.documentElement;
  const reducido = (window.ravenReducido ?? matchMedia('(prefers-reduced-motion: reduce)').matches);

  // partir el nombre en palabras y letras
  for (const el of document.querySelectorAll('[data-partir]')) {
    const palabras = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    let n = 0;
    el.innerHTML = palabras.map((p) => `<span class="palabra" aria-hidden="true">${[...p].map((l) => `<span class="letra" style="--i:${n++}">${l}</span>`).join('')}</span>`).join(' ');
    el.classList.add('partido');
  }
  // tarjetas de los planetas: la mitad de su altura, para centrarlas en la pantalla (raven.css, .capitulo.proyecto)
  const centrarTarjetas = () => { for (const c of document.querySelectorAll('.capitulo.proyecto > .cristal')) c.style.setProperty('--medio-tarjeta', `${Math.round(c.offsetHeight / 2)}px`); };
  centrarTarjetas();
  addEventListener('resize', centrarTarjetas); addEventListener('load', centrarTarjetas); document.addEventListener('raven-idioma', () => requestAnimationFrame(centrarTarjetas));
  for (const img of document.querySelectorAll('.capitulo.proyecto img')) img.addEventListener('load', centrarTarjetas);

  // partir el manifiesto (cada idioma por separado) en palabras
  for (const el of document.querySelectorAll('[data-palabras] > [lang]')) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((p) => `<span class="pal">${p}</span>`).join(' ');
  }

  // fin de la carga: cuando la galaxia está lista (o a los 6 s, por si falla WebGL)
  let entrada = false;
  function entrar() {
    if (entrada) return; entrada = true;
    raiz.classList.add('listo', 'galaxia-lista');
  }
  // la entrada de la primera pantalla («Primera luz») va en CSS: html.bienvenida en raven.css
  addEventListener('galaxia-lista', entrar);
  if (raiz.classList.contains('galaxia-lista')) entrar();
  // si la galaxia no arranca (sin WebGL), entra igual y queda una imagen de la galaxia de fondo
  setTimeout(() => { if (!raiz.classList.contains('webgl-ok')) raiz.classList.add('sin-webgl'); entrar(); }, 6000);

  if (window.gsap && window.ScrollTrigger && !reducido) {
    gsap.registerPlugin(ScrollTrigger);
    // el manifiesto se enciende palabra a palabra al pasar
    for (const bloque of document.querySelectorAll('[data-palabras]')) {
      const actualizar = (p) => {
        const pals = [...bloque.querySelectorAll(':scope > [lang]:not([style*="none"]) .pal')].filter((e) => e.offsetParent);
        pals.forEach((e, i) => { e.style.opacity = (0.12 + 0.88 * Math.min(1, Math.max(0, p * pals.length * 1.15 - i))).toFixed(3); });
      };
      ScrollTrigger.create({ trigger: bloque, start: 'top 80%', end: 'bottom 35%', scrub: true, onUpdate: (s) => actualizar(s.progress) });
    }
    // paneles de cristal: entran desde la profundidad
    for (const c of document.querySelectorAll('.cristal')) {
      // las tarjetas de los planetas van fijas en el centro: su entrada y su salida las marca la sección (la tarjeta
      // «sin fijar» engañaría a ScrollTrigger y se desvanecería con la cámara aún en el planeta)
      const sec = c.closest('.capitulo.proyecto'), planeta = sec && innerWidth > 760;
      gsap.fromTo(c, { y: 120, opacity: 0, scale: 0.94, filter: 'blur(10px)' }, {
        y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'power2.out',
        scrollTrigger: planeta ? { trigger: sec, start: 'top 110%', end: 'top 55%', scrub: 0.8 } : { trigger: c, start: 'top 95%', end: 'top 45%', scrub: 0.8 },
      });
      gsap.to(c, { y: -80, opacity: 0, ease: 'power1.in', scrollTrigger: planeta ? { trigger: sec, start: 'bottom 45%', end: 'bottom 5%', scrub: 0.8 } : { trigger: c, start: 'bottom 30%', end: 'bottom -10%', scrub: 0.8 } });
    }
    for (const t of document.querySelectorAll('.proyectos-intro, .contacto')) {
      gsap.from(t.children, { y: 60, opacity: 0, stagger: 0.08, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: t, start: 'top 65%', once: true } });
    }
    document.addEventListener('raven-idioma', () => ScrollTrigger.refresh());
  }

  // vídeos de las tarjetas: se reproducen al pasar el ratón (con la galaxia 3D a la vez, varios vídeos
  // descodificándose podían hacer perder el contexto WebGL); en pantallas táctiles queda la imagen
  if (matchMedia('(hover: hover)').matches) {
    for (const t of document.querySelectorAll('.tarjeta')) {
      const vista = t.querySelector('.vista'), v = vista?.querySelector('video');
      if (!v) continue;
      t.addEventListener('pointerenter', () => { if (!v.src) v.src = v.dataset.src; v.play().then(() => vista.classList.add('reproduciendo')).catch(() => {}); });
      t.addEventListener('pointerleave', () => { v.pause(); vista.classList.remove('reproduciendo'); });
    }
  }

  // botones magnéticos (solo con ratón)
  if (matchMedia('(pointer: fine)').matches && !reducido) {
    for (const b of document.querySelectorAll('.boton, .hero-bajar')) {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    }
  }
})();
