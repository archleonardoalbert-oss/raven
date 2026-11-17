// Penumbra: curvas de pertenencia que respiran en el cielo, una cordillera en alambre, el título
// que se desdibuja hacia el final y un medidor μ por sección que sube mientras la lees.
(function () {
  const reducido = (window.ravenReducido ?? matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Título: el grado de cada letra baja hacia el final de la palabra (las últimas, más borrosas).
  const letras = [...document.querySelectorAll('.titulo-difuso span')];
  letras.forEach((l, i) => l.style.setProperty('--b', Math.max(0, (i - 4) * 1.6).toFixed(2)));

  // Cordillera: varias líneas de cresta superpuestas, como el terreno del mapa.
  const svg = document.querySelector('.cordillera');
  if (svg) {
    const ns = 'http://www.w3.org/2000/svg';
    let semilla = 3;
    const azar = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646;
    const picos = Array.from({ length: 9 }, (_, i) => ({ x: 80 + i * 165 + azar() * 60, h: 70 + azar() * 130, w: 70 + azar() * 80 }));
    const altura = (x, desfase) => picos.reduce((m, p) => Math.max(m, p.h * Math.exp(-(((x - p.x - desfase) / p.w) ** 2))), 0);
    const silueta = [];
    for (let x = 0; x <= 1440; x += 12) silueta.push(`${x},${260 - altura(x, 0) - 20}`);
    const fondo = document.createElementNS(ns, 'polygon');
    fondo.setAttribute('points', `0,260 ${silueta.join(' ')} 1440,260`);
    svg.append(fondo);
    for (let k = 0; k < 7; k++) {
      const linea = document.createElementNS(ns, 'polyline');
      const pts = [];
      for (let x = 0; x <= 1440; x += 12) pts.push(`${x},${260 - altura(x, 0) * (1 - k * 0.13) - 20 + k * 9}`);
      linea.setAttribute('points', pts.join(' '));
      svg.append(linea);
    }
  }

  // Curvas de pertenencia: azul μA (trapecio), rosa μB (campana) y oro = min(μA, μB), que se mueven despacio.
  const lienzo = document.getElementById('curvas');
  if (lienzo) {
    const ctx = lienzo.getContext('2d');
    let W, H, dpr;
    const ajustar = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = lienzo.clientWidth; H = lienzo.clientHeight;
      lienzo.width = W * dpr; lienzo.height = H * dpr;
    };
    const trap = (x, a, b, c, d) => Math.max(0, Math.min((x - a) / (b - a), 1, (d - x) / (d - c)));
    const campana = (x, m, s) => Math.exp(-(((x - m) / s) ** 2));
    function dibujar(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const base = H * (innerWidth < 760 ? 0.5 : 0.52), alto = H * 0.3;
      const a = 0.18 + 0.04 * Math.sin(t * 0.00031), m = 0.58 + 0.07 * Math.sin(t * 0.00023 + 1);
      const curva = (f, color, ancho, alfa) => {
        ctx.beginPath();
        for (let i = 0; i <= 240; i++) {
          const u = i / 240, y = base - f(u) * alto;
          i ? ctx.lineTo(u * W, y) : ctx.moveTo(u * W, y);
        }
        ctx.strokeStyle = color; ctx.globalAlpha = alfa; ctx.lineWidth = ancho; ctx.stroke();
      };
      const fA = (u) => trap(u, a - 0.12, a + 0.06, a + 0.22, a + 0.42);
      const fB = (u) => campana(u, m, 0.13);
      // relleno dorado de la intersección (t-norma mínimo)
      ctx.beginPath(); ctx.moveTo(0, base);
      for (let i = 0; i <= 240; i++) { const u = i / 240; ctx.lineTo(u * W, base - Math.min(fA(u), fB(u)) * alto); }
      ctx.lineTo(W, base); ctx.closePath();
      ctx.globalAlpha = 0.16; ctx.fillStyle = '#f4d345'; ctx.fill();
      curva(fA, '#58c4dd', 1.6, 0.55);
      curva(fB, '#fc6282', 1.6, 0.55);
      curva((u) => Math.min(fA(u), fB(u)), '#f4d345', 2, 0.8);
      ctx.globalAlpha = 1;
      if (!reducido) requestAnimationFrame(dibujar);
    }
    addEventListener('resize', ajustar);
    ajustar();
    requestAnimationFrame(dibujar);
  }

  // Medidor μ: el grado de cada sección es cuánto de ella has recorrido en pantalla.
  const secciones = [...document.querySelectorAll('[data-grado]')];
  function medir() {
    const vh = innerHeight;
    for (const s of secciones) {
      const r = s.getBoundingClientRect();
      const g = reducido ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / Math.max(1, r.height * 0.7)));
      s.style.setProperty('--grado', g.toFixed(3));
      const v = s.querySelector('.medidor-valor');
      if (v) v.textContent = window.ravenIdioma?.() === 'en' ? g.toFixed(2) : g.toFixed(2).replace('.', ',');
    }
  }
  addEventListener('scroll', medir, { passive: true });
  addEventListener('resize', medir);
  document.addEventListener('raven-idioma', medir);
  medir();
})();
