// Hortus: cielo con estrellas alineadas al píxel (como en el fondo real, sin grano ni bruma) y un
// Juego de la Vida al pie de la página, que avanza despacio para no gastar.
(function () {
  const reducido = (window.ravenReducido ?? matchMedia('(prefers-reduced-motion: reduce)').matches);
  let semilla = 11;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646;

  const cielo = document.getElementById('cielo');
  const cc = cielo.getContext('2d');
  let estrellas = [];
  function ajustarCielo() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    cielo.width = Math.round(innerWidth * dpr); cielo.height = Math.round(innerHeight * dpr);
    semilla = 11;
    const n = Math.round((innerWidth * innerHeight) / 2600);
    estrellas = Array.from({ length: n }, () => ({
      x: Math.round(azar() * cielo.width), y: Math.round(azar() * cielo.height),
      t: azar() < 0.08 ? 2 : 1, b: 0.25 + azar() * 0.75, f: azar() * 6.28, v: 0.4 + azar() * 1.2,
    }));
  }
  function pintarCielo(t) {
    cc.fillStyle = '#04060e';
    cc.fillRect(0, 0, cielo.width, cielo.height);
    for (const e of estrellas) {
      const a = e.b * (reducido ? 1 : 0.65 + 0.35 * Math.sin(t * 0.001 * e.v + e.f));
      cc.fillStyle = `rgba(233, 228, 214, ${a.toFixed(3)})`;
      cc.fillRect(e.x, e.y, e.t, e.t);
    }
  }

  // Juego de la Vida en el suelo de la página
  const vida = document.getElementById('vida');
  const vc = vida.getContext('2d');
  const CEL = 6;
  let cols = 0, filas = 0, rejilla = new Uint8Array(0);
  function ajustarVida() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    vida.width = Math.round(vida.clientWidth * dpr); vida.height = Math.round(vida.clientHeight * dpr);
    cols = Math.floor(vida.clientWidth / CEL); filas = Math.floor(vida.clientHeight / CEL);
    rejilla = new Uint8Array(cols * filas).map(() => (Math.random() < 0.22 ? 1 : 0));
    vc.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function pasoVida() {
    const nueva = new Uint8Array(cols * filas);
    let vivas = 0;
    for (let y = 0; y < filas; y++) for (let x = 0; x < cols; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dx || dy) n += rejilla[((y + dy + filas) % filas) * cols + ((x + dx + cols) % cols)];
      }
      const v = rejilla[y * cols + x];
      nueva[y * cols + x] = n === 3 || (v && n === 2) ? 1 : 0;
      vivas += nueva[y * cols + x];
    }
    // como la CPU nunca está del todo quieta: si se apaga, nuevas semillas
    if (vivas < cols * filas * 0.04) for (let i = 0; i < cols * filas * 0.1; i++) nueva[Math.floor(Math.random() * nueva.length)] = 1;
    rejilla = nueva;
  }
  function pintarVida() {
    vc.clearRect(0, 0, vida.clientWidth, vida.clientHeight);
    for (let y = 0; y < filas; y++) for (let x = 0; x < cols; x++) {
      if (!rejilla[y * cols + x]) continue;
      const brillo = 0.35 + 0.65 * (1 - y / filas);
      vc.fillStyle = `rgba(155, 227, 122, ${brillo.toFixed(2)})`;
      vc.fillRect(x * CEL + 1, y * CEL + 1, CEL - 2, CEL - 2);
    }
  }

  let ultimoPaso = 0, vidaVisible = false;
  new IntersectionObserver(([e]) => { vidaVisible = e.isIntersecting; }).observe(vida);
  function bucle(t) {
    pintarCielo(t);
    if (vidaVisible && t - ultimoPaso > 160) { pasoVida(); pintarVida(); ultimoPaso = t; }
    if (!reducido) requestAnimationFrame(bucle);
  }
  addEventListener('resize', () => { ajustarCielo(); ajustarVida(); pintarVida(); });
  ajustarCielo(); ajustarVida(); pintarVida();
  requestAnimationFrame(bucle);
})();
