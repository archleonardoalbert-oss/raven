// Navegación de la portada: índice de capítulos con progreso, saltos instantáneos con un destello de
// hiperespacio (sin recorrer todo el viaje), volver al inicio, atajos y un imán de scroll que completa los
// tramos vacíos de cámara cuando te detienes a mitad. Todo lo que ancla un salto es un elemento con id.
(function () {
  const raiz = document.documentElement;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAPITULOS = [
    { id: 'inicio', es: 'Inicio', en: 'Start' },
    { id: 'sobre-mi', es: 'Sobre mí', en: 'About' },
    { id: 'habilidades', es: 'Habilidades', en: 'Skills' },
    { id: 'proyectos', es: 'Proyectos', en: 'Projects' },
    { id: 'contacto', es: 'Contacto', en: 'Contact' },
  ];
  // dónde se «llega» a cada capítulo (la cámara ya quieta y el contenido a la vista)
  const ANCLA = {
    inicio: () => 0,
    'sobre-mi': (el) => el.offsetTop - innerHeight * 0.05,
    habilidades: (el) => el.offsetTop + (el.offsetHeight - innerHeight) * (window.__ravenCaida?.pFaro(0) ?? 0.12),  // en el primer faro
    resumen: () => { const el = document.getElementById('habilidades'); return el.offsetTop + (el.offsetHeight - innerHeight) * 0.91; },
    proyectos: (el) => el.offsetTop - innerHeight * 0.1,
    contacto: (el) => el.offsetTop + innerHeight * 0.1,
  };
  // la llegada se ajusta a la zona en que la cámara está quieta en ese capítulo (nunca a mitad de un viaje)
  const posDe = (id) => {
    const el = document.getElementById(id); const f = ANCLA[id] || ((e) => e.offsetTop);
    let y = f(el);
    const d = id !== 'habilidades' && id !== 'resumen' && window.__ravenDescansos?.().find((x) => x.id === id);
    if (d) y = Math.min(d.fin - 2, Math.max(d.ini + 2, y));
    return Math.max(0, Math.round(y));
  };

  // ── índice ──────────────────────────────────────────────────────────────────────────────────────
  const indice = document.createElement('nav');
  indice.className = 'indice'; indice.setAttribute('aria-label', 'Capítulos');
  indice.innerHTML = `<div class="indice-pista"><span class="indice-lleno"></span></div>` + CAPITULOS.map((c) =>
    `<a href="#${c.id}" data-ir="${c.id}"><span class="indice-punto"></span><span class="indice-nombre"><span lang="es">${c.es}</span><span lang="en">${c.en}</span></span></a>`).join('');
  document.body.append(indice);
  const lleno = indice.querySelector('.indice-lleno');
  const enlaces = [...indice.querySelectorAll('a')];

  const arriba = document.createElement('button');
  arriba.type = 'button'; arriba.className = 'arriba';
  arriba.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l7 7-1.4 1.4L13 8.8V19h-2V8.8l-4.6 4.6L5 12z"/></svg><span lang="es">Inicio</span><span lang="en">Top</span>';
  arriba.setAttribute('aria-label', 'Volver al inicio');
  document.body.append(arriba);
  const todos = document.createElement('a');
  todos.className = 'todos-flotante'; todos.href = 'proyectos/';
  todos.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"/></svg><span lang="es">Todos los proyectos</span><span lang="en">All projects</span>';
  document.body.append(todos);

  // ── salto por hiperespacio: las estrellas se estiran en estelas, destello, y al otro lado se frenan ──
  // Dura ~1,8 s: el tramo central, con la pantalla cubierta, da tiempo a que la escena de destino se pinte.
  const velo = document.createElement('canvas');
  velo.className = 'hiperespacio'; velo.setAttribute('aria-hidden', 'true');
  document.body.append(velo);
  const vx = velo.getContext('2d');
  const ESTRELLAS = Array.from({ length: 520 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random(), h: 205 + Math.random() * 60, l: 0.4 + Math.random() * 0.6 }));
  let saltando = false;
  function saltar(destinoY) {
    if (saltando) return;
    cancelarIman();
    const colocar = () => { scrollTo({ top: destinoY, behavior: 'instant' }); window.__ravenFijarScroll?.(); window.__ravenFijarCaida?.(); };
    if (reducido) { colocar(); return; }
    saltando = true;
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    velo.width = W * dpr; velo.height = H * dpr; vx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2;
    const T_IDA = 650, T_PAUSA = 420, T_VUELTA = 750, t0 = performance.now();
    let colocado = false;
    velo.style.opacity = '1';
    const cuadro = (ahora) => {
      const t = ahora - t0;
      let v, fondo, flash;            // v: velocidad de las estelas; fondo: cuánto tapa; flash: destello
      if (t < T_IDA) { const u = t / T_IDA; v = u * u; fondo = u; flash = Math.max(0, (u - 0.8) / 0.2) ** 2; }
      else if (t < T_IDA + T_PAUSA) { v = 1; fondo = 1; flash = Math.max(0, 1 - (t - T_IDA) / 160); if (!colocado) { colocado = true; colocar(); } }
      else { const u = Math.min(1, (t - T_IDA - T_PAUSA) / T_VUELTA); v = (1 - u) ** 2; fondo = (1 - u) ** 1.6; flash = 0; }
      vx.clearRect(0, 0, W, H);
      vx.fillStyle = `rgba(2,3,10,${Math.min(1, fondo).toFixed(3)})`; vx.fillRect(0, 0, W, H);
      const fase = (t / 1000) * (0.5 + 2.6 * v);
      vx.lineCap = 'round';
      for (const e of ESTRELLAS) {
        const r = (e.r + fase * (0.35 + e.l)) % 1;
        const d0 = Math.pow(r, 1.8) * R, largo = (18 + 520 * v * v) * Math.pow(r, 1.4) * e.l;
        const c = Math.cos(e.a), sn = Math.sin(e.a);
        const alfa = Math.min(1, r * 3) * (0.25 + 0.75 * v) * Math.max(fondo, 0.15);
        vx.strokeStyle = `hsla(${e.h} 90% ${78 + 18 * v}% / ${alfa.toFixed(3)})`;
        vx.lineWidth = 0.6 + 1.6 * r * e.l;
        vx.beginPath(); vx.moveTo(cx + c * d0, cy + sn * d0); vx.lineTo(cx + c * (d0 + largo), cy + sn * (d0 + largo)); vx.stroke();
      }
      const g = vx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6);
      g.addColorStop(0, `rgba(200,195,255,${(0.35 * v).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      vx.fillStyle = g; vx.fillRect(0, 0, W, H);
      if (flash > 0) { vx.fillStyle = `rgba(255,255,255,${(0.85 * flash).toFixed(3)})`; vx.fillRect(0, 0, W, H); }
      if (t < T_IDA + T_PAUSA + T_VUELTA) requestAnimationFrame(cuadro);
      else { vx.clearRect(0, 0, W, H); velo.style.opacity = '0'; saltando = false; }
    };
    requestAnimationFrame(cuadro);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-ir], .menu a[href^="#"], .marca, .hero-atajos a, .saltar-caida');
    if (!a) return;
    const id = a.dataset.ir || (a.getAttribute('href') || '#inicio').slice(1);
    if (!ANCLA[id] && !document.getElementById(id)) return;
    e.preventDefault();
    saltar(posDe(id));
    history.replaceState(null, '', id === 'inicio' ? location.pathname : `#${id}`);
  });
  arriba.addEventListener('click', () => saltar(0));
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'Home') { e.preventDefault(); saltar(0); }
    if (e.key === 'End') { e.preventDefault(); saltar(posDe('contacto')); }
  });
  // abrir con #seccion en la URL lleva directo allí
  if (location.hash && ANCLA[location.hash.slice(1)]) addEventListener('load', () => setTimeout(() => saltar(posDe(location.hash.slice(1))), 300));

  // ── progreso y capítulo actual ─────────────────────────────────────────────────────────────────
  function actualizar() {
    const max = raiz.scrollHeight - innerHeight;
    lleno.style.transform = `scaleY(${(scrollY / Math.max(1, max)).toFixed(4)})`;
    let actual = 0;
    CAPITULOS.forEach((c, i) => { if (scrollY + innerHeight * 0.5 >= document.getElementById(c.id).offsetTop) actual = i; });
    enlaces.forEach((a, i) => { a.classList.toggle('actual', i === actual); a.classList.toggle('visto', i < actual); });
    const fuera = scrollY > innerHeight * 0.6;
    const primero = document.querySelector('.capitulo.proyecto'), ini = primero ? primero.offsetTop - innerHeight * 0.6 : Infinity, fin = document.getElementById('contacto').offsetTop - innerHeight * 0.6;
    todos.classList.toggle('visible', scrollY > ini && scrollY < fin);
    arriba.classList.toggle('visible', fuera);
    indice.classList.toggle('visible', fuera);
  }
  addEventListener('scroll', actualizar, { passive: true });
  addEventListener('resize', actualizar);
  actualizar();

  // ── imán: si te detienes en un tramo de viaje (sin contenido), la cámara completa el trayecto ───
  let quieto = 0, ultimoY = scrollY, sentido = 1, animIman = 0;
  function cancelarIman() { cancelAnimationFrame(animIman); animIman = 0; }
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, cancelarIman, { passive: true }));
  function animarHasta(y) {
    const y0 = scrollY, d = y - y0, dur = Math.min(1100, 450 + Math.abs(d) * 0.35), t0 = performance.now();
    const paso = (t) => {
      const u = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - u, 3);
      scrollTo({ top: y0 + d * e, behavior: 'instant' });
      if (u < 1) animIman = requestAnimationFrame(paso); else animIman = 0;
    };
    animIman = requestAnimationFrame(paso);
  }
  function revisarIman() {
    if (reducido || saltando || animIman || !window.__ravenDescansos) return;
    const y = scrollY, D = window.__ravenDescansos();
    for (let i = 0; i < D.length - 1; i++) {
      const a = D[i], b = D[i + 1];
      if (y > a.fin + 2 && y < b.ini - 2) {           // estás en el tramo entre el descanso a y el b
        if (a.sinIman || b.sinIman) return;
        animarHasta(sentido > 0 ? b.ini + 1 : a.fin - 1);
        return;
      }
    }
  }
  addEventListener('scroll', () => {
    const dy = scrollY - ultimoY; if (Math.abs(dy) > 1) sentido = Math.sign(dy); ultimoY = scrollY;
    clearTimeout(quieto); quieto = setTimeout(revisarIman, 240);
  }, { passive: true });
})();
