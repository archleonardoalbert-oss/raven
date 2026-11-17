// Escena «en obras»: de noche, bajo el cielo de Raven, una cuadrilla de Clawds (el bichito de Claude Code, en
// pixel-art fiel a su logo) construye el nombre del proyecto. La grúa baja cada letra con un Clawd montado
// encima, los soldadores la funden en su sitio entre chispas y el resto del equipo trabaja en el andamio.
const lienzo = document.querySelector('.obra-lienzo');
if (lienzo) iniciar(lienzo);

function iniciar(lienzo) {
  const ctx = lienzo.getContext('2d');
  const heroe = lienzo.closest('.obra-heroe'), suelo = heroe.querySelector('.obra-suelo'), arriba = heroe.querySelector('.obra-arriba');
  const NOMBRE = (lienzo.dataset.nombre || '').trim();
  const TINTE = getComputedStyle(document.body).getPropertyValue('--tinte').trim() || '#8fb8ff';
  const QUIETO = (window.ravenReducido ?? matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ── color ──
  const rgb = (hex) => { const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mezcla = (a, b, k) => { const x = rgb(a), y = rgb(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; };
  const alfa = (hex, a) => `rgba(${rgb(hex).join(',')},${a})`;
  const C = {
    cuerpo: '#D97757', luz: '#E58C6B', sombra: '#B35A3D', ojo: '#140d0b',
    casco: '#F2C14E', cascoLuz: '#FFE28E', cascoSombra: '#C48F2A', careta: '#2A2F45', visor: '#8BEBFF',
    acero: '#343c6b', aceroLuz: '#5964a3', tabla: '#4b3a33', tablaLuz: '#76594a',
    tinte: TINTE, tinteClaro: mezcla(TINTE, '#ffffff', 0.55), tinteOscuro: mezcla(TINTE, '#050505', 0.55),
  };

  // ── estado ──
  let w = 0, h = 0, dpr = 1, P = 4, fs = 100, fuente = '';
  let lineas = [], letras = [], tablones = [], andamio = {}, grua = {}, focos = [], escaleras = [], equipo = [], parts = [], estrellas = [], cajas = 0;
  let reloj = 0, ciclo = null, corriendo = true;

  const fuenteDe = (s) => `400 ${s}px "Bodoni Moda", Georgia, serif`;
  const eio = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const azar = (a, b) => a + Math.random() * (b - a);

  // ── composición ──
  function partir(palabras, n) {
    if (n === 1) return [palabras.join(' ')];
    let mejor = null;
    const prueba = (cortes) => {
      const ls = []; let i = 0;
      for (const c of [...cortes, palabras.length]) { ls.push(palabras.slice(i, c).join(' ')); i = c; }
      const m = Math.max(...ls.map((l) => l.length));
      if (!mejor || m < mejor.m) mejor = { ls, m };
    };
    for (let a = 1; a < palabras.length; a++) { if (n === 2) prueba([a]); else for (let b = a + 1; b < palabras.length; b++) prueba([a, b]); }
    return mejor ? mejor.ls : [palabras.join(' ')];
  }

  function componer() {
    const r = heroe.getBoundingClientRect();
    w = r.width; h = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr);
    P = lim(Math.floor(Math.min(w, h * 1.4) / 150), 3, 8);
    const ySuelo = Math.round(suelo.getBoundingClientRect().top - r.top);
    const tope = arriba.getBoundingClientRect().bottom - r.top + 6;
    const disponible = ySuelo - tope, maxW = w - 2 * Math.max(12, w * (w < 700 ? 0.035 : 0.07));
    const palabras = NOMBRE.split(/\s+/).filter(Boolean);
    let mejor = null;
    ctx.font = fuenteDe(100);
    for (let n = 1; n <= Math.min(3, palabras.length); n++) {
      const ls = partir(palabras, n);
      const ancho = Math.max(...ls.map((l) => ctx.measureText(l).width));
      const f = Math.min((100 * maxW) / ancho, w < 700 ? 130 : 200, (disponible - 30 * P) / (0.95 + n * 0.92));
      const puntos = f * (n === 1 ? 1.15 : 1);
      if (!mejor || puntos > mejor.puntos) mejor = { ls, f, puntos };
    }
    fs = Math.max(24, Math.floor(mejor.f)); fuente = fuenteDe(fs); ctx.font = fuente;
    const n = mejor.ls.length, ocupado = 0.95 * fs + 12 * P + n * 0.92 * fs + 26 * P;
    const holgura = Math.max(0, disponible - ocupado);
    const primero = tope + 0.95 * fs + 12 * P + 0.72 * fs + holgura * (w < 700 ? 0.42 : 0.3);
    lineas = mejor.ls.map((texto, k) => ({ texto, y: Math.round(primero + k * 0.92 * fs) }));
    letras = [];
    for (const [k, l] of lineas.entries()) {
      const total = ctx.measureText(l.texto).width, x0 = (w - total) / 2;
      [...l.texto].forEach((ch, i) => {
        if (ch === ' ') return;
        const m = ctx.measureText(ch);
        letras.push({ ch, linea: k, x: x0 + ctx.measureText(l.texto.slice(0, i)).width, y: l.y, w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, estado: 0, relleno: 0, aparicion: 0, brillo: 0 });
      });
    }
    // andamio: un tablón bajo cada línea de letras y más niveles hasta el suelo
    const xs = letras.map((l) => l.x), xe = letras.map((l) => l.x + l.w);
    andamio = { x0: Math.round(Math.min(...xs) - 7 * P), x1: Math.round(Math.max(...xe) + 7 * P), arriba: lineas[0].y - 0.72 * fs - 3 * P };
    tablones = lineas.map((l) => ({ y: l.y, linea: true }));
    const ultimo = lineas.at(-1).y, nivel = 18 * P, extra = Math.min(2, Math.max(0, Math.round((ySuelo - ultimo) / nivel) - 1));
    for (let i = 1; i <= extra; i++) tablones.push({ y: Math.round(ultimo + ((ySuelo - ultimo) * i) / (extra + 1)), linea: false });
    andamio.suelo = ySuelo;
    // grúa torre a la derecha
    const mastil = Math.round(Math.min(w - 7 * P, andamio.x1 + 28 * P));
    grua = { x: mastil, brazo: Math.round(tope + 4 * P), izq: Math.round(Math.max(5 * P, andamio.x0 - 8 * P)), carro: mastil - 12 * P, cable: 6 * P, giro: 0, vgiro: 0 };
    // escaleras del suelo al primer tablón inferior
    const bajos = tablones.filter((t) => !t.linea);
    escaleras = bajos.length ? [{ x: andamio.x0 + 6 * P, y0: bajos.at(-1).y, y1: ySuelo }] : [];
    focos = [{ x: Math.max(4 * P, andamio.x0 - 16 * P), y: ySuelo - 34 * P, fase: 0 }, { x: mastil - 5 * P, y: Math.round(lerp(grua.brazo, ySuelo, 0.55)), fase: 2 }];
    estrellas = Array.from({ length: Math.round((w * h) / 2600) }, () => ({ x: Math.random() * w, y: Math.random() * ySuelo, r: Math.random() < 0.08 ? 1.6 : Math.random() * 0.9 + 0.3, f: Math.random() * 6.28, v: azar(0.4, 1.6) }));
    crearEquipo(bajos);
    ciclo = { fase: 'ir', i: 0, t: 0, desde: grua.carro, cableDesde: grua.cable, espera: 0 };
    if (QUIETO) { for (const l of letras) { l.estado = 3; l.relleno = 1; l.aparicion = 1; } ciclo.fase = 'quieto'; }
  }
  const lerp = (a, b, k) => a + (b - a) * k;

  function crearEquipo(bajos) {
    equipo = [];
    lineas.forEach((l, k) => { const primera = letras.find((x) => x.linea === k); equipo.push({ tipo: 'soldador', linea: k, x: primera.x - 6 * P, y: l.y, mira: 1, cola: [], t: 0, dist: 0 }); });
    const ySuelo = andamio.suelo, ancho = andamio.x1 - andamio.x0;
    const pila = Math.max(10 * P, andamio.x0 - 4 * P), destino = grua.x - 14 * P;
    equipo.push({ tipo: 'cargador', x: pila + 4 * P, y: ySuelo, mira: 1, pila, destino, carga: true, dist: 0, pausa: 0 });
    equipo.push({ tipo: 'cargador', x: lerp(pila, destino, 0.55), y: ySuelo, mira: -1, pila, destino, carga: false, dist: 0, pausa: 0 });
    equipo.push({ tipo: 'jefe', x: andamio.x0 + ancho * 0.3, y: ySuelo, mira: 1, aviso: 0, texto: '!' });
    if (bajos.length) {
      equipo.push({ tipo: 'martillo', x: andamio.x0 + ancho * 0.62, y: bajos[0].y, mira: -1, t: 0, golpe: 0 });
      equipo.push({ tipo: 'dormilon', x: andamio.x1 - 5 * P, y: bajos.at(-1).y, mira: -1, z: 0, despierto: 0 });
      equipo.push({ tipo: 'escalador', x: escaleras[0].x, y: ySuelo, mira: 1, t: azar(0, 3), fase: 'abajo' });
    } else {
      equipo.push({ tipo: 'martillo', x: andamio.x0 + ancho * 0.66, y: ySuelo, mira: -1, t: 0, golpe: 0 });
      equipo.push({ tipo: 'dormilon', x: andamio.x1 - 5 * P, y: lineas.at(-1).y, mira: -1, z: 0, despierto: 0 });
    }
  }

  // ── Clawd con volumen: misma silueta que el logo (cuerpo ancho, dos ojos, bracitos y cuatro patitas), modelado
  // como un muñeco de plástico: luz arriba a la izquierda, brillo especular, sombras suaves y casco brillante ──
  function capsula(x, y, an, al) { const r = Math.min(an, al) / 2; ctx.beginPath(); ctx.roundRect(x, y, an, al, r); }
  function redondo(x, y, an, al, r) { ctx.beginPath(); ctx.roundRect(x, y, an, al, r); }
  function degradado(y0, y1, paradas) { const g = ctx.createLinearGradient(0, y0, 0, y1); paradas.forEach(([k, c]) => g.addColorStop(k, c)); return g; }

  function brazo(lado, angulo, herramienta, pose) {
    ctx.save();
    ctx.translate(lado * 5.7 * P, -2.5 * P); ctx.scale(lado, 1); ctx.rotate(-angulo);
    ctx.fillStyle = degradado(-0.5 * P, 0.5 * P, [[0, '#F2A07F'], [0.55, C.cuerpo], [1, C.sombra]]);
    capsula(-0.4 * P, -0.5 * P, 2.9 * P, P); ctx.fill();
    if (herramienta === 'martillo') {
      ctx.fillStyle = degradado(-0.3 * P, 0.3 * P, [[0, '#a8835e'], [1, '#6e4f33']]); capsula(2 * P, -0.3 * P, 3.4 * P, 0.6 * P); ctx.fill();
      ctx.fillStyle = degradado(-1.6 * P, 1.6 * P, [[0, '#e2e6f5'], [0.5, '#9aa3c7'], [1, '#5a6288']]); redondo(5 * P, -1.5 * P, 1.6 * P, 3 * P, 0.3 * P); ctx.fill();
    } else if (herramienta === 'soplete') {
      ctx.fillStyle = degradado(-0.5 * P, 0.5 * P, [[0, '#c9cfe6'], [1, '#5a6288']]); capsula(2.2 * P, -0.45 * P, 2.6 * P, 0.9 * P); ctx.fill();
      const llama = ctx.createRadialGradient(5.4 * P, 0, 0, 5.4 * P, 0, 1.6 * P); llama.addColorStop(0, '#ffffff'); llama.addColorStop(0.35, '#9fe8ff'); llama.addColorStop(1, 'rgba(80,160,255,0)');
      ctx.fillStyle = llama; ctx.beginPath(); ctx.ellipse(5.4 * P, 0, 1.7 * P * azar(0.8, 1.1), 0.7 * P, 0, 0, 7); ctx.fill();
    } else if (herramienta === 'plano') {
      ctx.save(); ctx.rotate(angulo - 0.15); ctx.fillStyle = '#dfeaff'; redondo(1.6 * P, -3.6 * P, 5 * P, 3.6 * P, 0.25 * P); ctx.fill();
      ctx.strokeStyle = '#6f93d6'; ctx.lineWidth = Math.max(1, P / 4); ctx.beginPath();
      ctx.moveTo(2.3 * P, -2.8 * P); ctx.lineTo(5.8 * P, -2.8 * P); ctx.moveTo(2.3 * P, -1.9 * P); ctx.lineTo(4.6 * P, -1.9 * P); ctx.rect(4.7 * P, -1.6 * P, 1.2 * P, 0.9 * P); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }

  function clawd(b, pose = {}) {
    const mira = b.mira ?? 1, salto = pose.salto ?? 0, sentado = !!pose.sentado;
    // sombra de contacto
    if (!pose.colgado) {
      const k = Math.max(0.35, 1 - salto / (8 * P)), sg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 7 * P * k);
      sg.addColorStop(0, `rgba(0,0,0,${0.5 * k})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(b.x, b.y, 7 * P * k, 1.3 * P * k, 0, 0, 7); ctx.fill();
    }
    ctx.save();
    ctx.translate(b.x, b.y - salto + (sentado ? P : 0)); ctx.scale(mira, 1);
    // patitas (detrás del cuerpo); al andar se levanta un par
    const paso = pose.paso ?? 0;
    for (const [gx, par] of [[-4.5, 0], [-2.5, 1], [2.5, 0], [4.5, 1]]) {
      const alzada = (paso === 1 && par === 1) || (paso === 2 && par === 0);
      const largo = sentado ? 1.9 * P : alzada ? 0.9 * P : 1.5 * P, dx = sentado ? 0.4 * P : 0;
      ctx.fillStyle = degradado(-1.2 * P, 0.4 * P, [[0, C.sombra], [1, '#8a3f27']]);
      capsula(gx * P - 0.45 * P + dx, -1.3 * P - (alzada ? 0.35 * P : 0), 0.9 * P, largo); ctx.fill();
    }
    const brazos = pose.brazos ?? 'fuera';
    const ang = { fuera: [0.08, 0.08], arriba: [1.25, 1.25], saluda: [0.08, pose.ola ? 1.7 : 1.1], martillo: [0.1, pose.golpe ? -0.35 : 1.3], soplete: [0.1, 0.05], plano: [0.1, 0.35] }[brazos] ?? [0.08, 0.08];
    const herramienta = { martillo: 'martillo', soplete: 'soplete', plano: 'plano' }[brazos];
    brazo(-1, ang[0], null, pose);
    // cuerpo: bloque redondeado con degradado, brillo especular y luz de borde
    const x0 = -6 * P, y0 = -5.2 * P, an = 12 * P, al = 4.2 * P;
    ctx.fillStyle = degradado(y0, y0 + al, [[0, '#F4A383'], [0.45, C.cuerpo], [1, '#A9502F']]);
    redondo(x0, y0, an, al, 1.3 * P); ctx.fill();
    const brillo = ctx.createRadialGradient(x0 + 3 * P, y0 + 0.8 * P, 0, x0 + 3 * P, y0 + 0.8 * P, 6 * P);
    brillo.addColorStop(0, 'rgba(255,255,255,0.42)'); brillo.addColorStop(0.5, 'rgba(255,255,255,0.08)'); brillo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = brillo; redondo(x0, y0, an, al, 1.3 * P); ctx.fill();
    ctx.strokeStyle = alfa(TINTE, 0.35); ctx.lineWidth = Math.max(1, P / 3);
    ctx.beginPath(); ctx.moveTo(x0 + 1.4 * P, y0 + al - P * 0.2); ctx.lineTo(x0 + an - 1.4 * P, y0 + al - P * 0.2); ctx.stroke();
    // ojos (o careta de soldar)
    if (pose.careta) {
      ctx.fillStyle = degradado(y0 + 0.4 * P, y0 + 2.6 * P, [[0, '#454c6e'], [1, '#1d2134']]); redondo(x0 + 1.2 * P, y0 + 0.5 * P, an - 2.4 * P, 2.2 * P, 0.7 * P); ctx.fill();
      ctx.fillStyle = C.visor; ctx.shadowColor = C.visor; ctx.shadowBlur = 3 * P; capsula(x0 + 2.6 * P, y0 + 1.25 * P, an - 5.2 * P, 0.7 * P); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; capsula(x0 + 1.8 * P, y0 + 0.65 * P, 3 * P, 0.35 * P); ctx.fill();
    } else {
      const alto = pose.parpadeo ? 0.25 * P : 1.7 * P;
      for (const ex of [-3.5, 3.5]) {
        ctx.fillStyle = C.ojo; capsula(ex * P - 0.55 * P, y0 + 1.6 * P - alto / 2, 1.1 * P, alto); ctx.fill();
        if (!pose.parpadeo) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ex * P - 0.15 * P, y0 + 1.2 * P, 0.26 * P, 0, 7); ctx.fill(); }
      }
    }
    brazo(1, ang[1], herramienta, pose);
    // casco de obra: cúpula brillante con ala
    if (pose.casco !== false) {
      const cy = y0 + 0.15 * P;
      ctx.fillStyle = degradado(cy - 0.5 * P, cy + 0.5 * P, [[0, C.casco], [1, C.cascoSombra]]);
      ctx.beginPath(); ctx.ellipse(0, cy, 4.6 * P, 0.65 * P, 0, 0, 7); ctx.fill();
      const cg = ctx.createRadialGradient(-1.2 * P, cy - 2 * P, 0.2 * P, 0, cy - 0.8 * P, 3.8 * P);
      cg.addColorStop(0, '#FFF1B8'); cg.addColorStop(0.35, C.casco); cg.addColorStop(1, C.cascoSombra);
      ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(0, cy - 0.1 * P, 3.3 * P, 2.3 * P, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; capsula(-0.4 * P, cy - 2.3 * P, 0.8 * P, 2.2 * P); ctx.fill();
    }
    // carga sobre la cabeza: caja con cara superior y frontal
    if (pose.carga) {
      const bx = -5.5 * P, by = y0 - 6.6 * P, ba = 11 * P, bh = 4.2 * P, d = 1.2 * P;
      ctx.fillStyle = C.tinteClaro; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + d, by - d); ctx.lineTo(bx + ba + d, by - d); ctx.lineTo(bx + ba, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.tinteOscuro; ctx.beginPath(); ctx.moveTo(bx + ba, by); ctx.lineTo(bx + ba + d, by - d); ctx.lineTo(bx + ba + d, by + bh - d); ctx.lineTo(bx + ba, by + bh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = degradado(by, by + bh, [[0, TINTE], [1, mezcla(TINTE, '#050505', 0.3)]]); ctx.fillRect(bx, by, ba, bh);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(bx + ba / 2 - 0.6 * P, by, 1.2 * P, bh);
    }
    ctx.restore();
  }
  const pasoDe = (dist) => [0, 1, 0, 2][Math.floor(dist / (2.5 * P)) % 4];

  // ── partículas ──
  function chispas(x, y, n, color) {
    for (let i = 0; i < n; i++) { const a = azar(-Math.PI * 0.95, -Math.PI * 0.05), v = azar(80, 340) * (P / 4); parts.push({ tipo: 'chispa', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: azar(0.35, 0.9), max: 0.9, color }); }
  }
  function polvo(x, y, n) { for (let i = 0; i < n; i++) parts.push({ tipo: 'polvo', x: x + azar(-1, 1) * 10 * P, y, vx: azar(-30, 30), vy: azar(-28, -6), vida: azar(0.5, 1.1), max: 1.1, r: azar(1.5, 4) * (P / 4) }); }
  function fuegos(x, y) { const c = [C.tinteClaro, '#ffffff', C.casco][Math.floor(Math.random() * 3)]; for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2, v = azar(120, 260) * (P / 4); parts.push({ tipo: 'chispa', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: azar(0.8, 1.4), max: 1.4, color: c, suave: true }); } }

  // ── ciclo de la grúa: ir → bajar → soltar, letra a letra; luego fiesta y reinicio ──
  function cableColocar(l) { return l.y - l.asc - 10 * P - grua.brazo; }
  function cableViaje(l) { return Math.max(3 * P, lineas[0].y - 0.72 * fs - 5 * P - l.desc - l.asc - 10 * P - grua.brazo); }
  const porLetra = () => lim(22 / Math.max(1, letras.length), 0.85, 1.9);

  function avanzarCiclo(dt) {
    const c = ciclo; if (!c || c.fase === 'quieto') return;
    c.t += dt;
    const l = letras[c.i], k = porLetra();
    if (c.fase === 'ir') {
      const dur = k * 0.45; l.estado = 1; l.aparicion = Math.min(1, l.aparicion + dt * 4);
      const e = eio(Math.min(1, c.t / dur)), antes = grua.carro;
      grua.carro = lerp(c.desde, l.x + l.w / 2, e); grua.cable = lerp(c.cableDesde, cableViaje(l), e);
      grua.vgiro -= (grua.carro - antes) * 0.00022;
      if (c.t >= dur) { c.fase = 'bajar'; c.t = 0; c.cableDesde = grua.cable; }
    } else if (c.fase === 'bajar') {
      const dur = k * 0.35, e = eio(Math.min(1, c.t / dur));
      grua.cable = lerp(c.cableDesde, cableColocar(l), e);
      if (c.t >= dur) {
        l.estado = 2; polvo(l.x + l.w / 2, l.y, 7);
        const s = equipo.find((m) => m.tipo === 'soldador' && m.linea === l.linea); s.cola.push(l);
        const jefe = equipo.find((m) => m.tipo === 'jefe'); jefe.aviso = 0.7; jefe.texto = '!';
        c.fase = 'subir'; c.t = 0; c.cableDesde = grua.cable;
      }
    } else if (c.fase === 'subir') {
      const dur = k * 0.2; grua.cable = lerp(c.cableDesde, c.cableDesde - 6 * P, eio(Math.min(1, c.t / dur)));
      if (c.t >= dur) {
        if (c.i + 1 < letras.length) { c.i++; c.fase = 'ir'; c.t = 0; c.desde = grua.carro; c.cableDesde = grua.cable; }
        else { c.fase = 'esperar'; c.t = 0; }
      }
    } else if (c.fase === 'esperar') {
      grua.carro = lerp(grua.carro, grua.x - 12 * P, dt * 1.5); grua.cable = lerp(grua.cable, 6 * P, dt * 1.5);
      if (letras.every((x) => x.estado === 3)) { c.fase = 'fiesta'; c.t = 0; c.fuegos = 0; }
    } else if (c.fase === 'fiesta') {
      for (const x of letras) x.brillo = Math.max(0, 1 - Math.abs((c.t * 1.2 - (x.x - andamio.x0) / (andamio.x1 - andamio.x0)) * 3));
      if (c.t > 0.4 + c.fuegos * 0.55 && c.fuegos < 4) { fuegos(lerp(andamio.x0, andamio.x1, azar(0.15, 0.85)), lineas[0].y - fs * azar(0.9, 1.4)); c.fuegos++; }
      const jefe = equipo.find((m) => m.tipo === 'jefe'); if (c.t < 0.1) { jefe.aviso = 2.2; jefe.texto = '✓'; }
      if (c.t > 6.5) { c.fase = 'reinicio'; c.t = 0; }
    } else if (c.fase === 'reinicio') {
      letras.forEach((x, i) => { if (c.t > (i / letras.length) * 1.2) { x.estado = 0; x.relleno = 0; x.aparicion = 0; x.brillo = 0; } });
      if (c.t > 1.6) { cajas = 0; ciclo = { fase: 'ir', i: 0, t: 0, desde: grua.carro, cableDesde: grua.cable }; }
    }
  }
  const enFiesta = () => ciclo?.fase === 'fiesta';

  // ── equipo ──
  function moverHacia(m, x, vel, dt) { const d = x - m.x; if (Math.abs(d) < 0.5) return true; const s = Math.sign(d) * Math.min(Math.abs(d), vel * dt); m.x += s; m.dist += Math.abs(s); m.mira = Math.sign(d); return false; }

  function actualizarEquipo(dt) {
    for (const m of equipo) {
      if (m.tipo === 'soldador') {
        const l = m.cola[0];
        m.soldando = false;
        if (l) {
          if (moverHacia(m, l.x + l.w / 2 + 10 * P, 46 * P, dt)) {
            m.mira = -1; m.soldando = true; m.t += dt;
            l.relleno = Math.min(1, l.relleno + dt / (porLetra() * 0.75));
            if (Math.random() < dt * 40) chispas(l.x + l.w / 2 + azar(-0.3, 0.3) * l.w, l.y - l.relleno * l.asc, 3, Math.random() < 0.5 ? '#fff4d6' : '#ffb35c');
            if (l.relleno >= 1) { l.estado = 3; l.brillo = 1; m.cola.shift(); }
          }
        }
      } else if (m.tipo === 'cargador') {
        if (m.pausa > 0) { m.pausa -= dt; continue; }
        if (moverHacia(m, m.carga ? m.destino : m.pila, 30 * P, dt)) {
          if (m.carga) { cajas = Math.min(cajas + 1, 9); polvo(m.x + 6 * P, m.y, 4); }
          m.carga = !m.carga; m.pausa = azar(0.3, 0.9);
        }
      } else if (m.tipo === 'martillo') {
        m.t += dt;
        const g = Math.floor(m.t / 0.32) % 2 === 1;
        if (g && !m.golpe) parts.push({ tipo: 'tok', x: m.x - 11 * P * m.mira, y: m.y - 2 * P, vx: 0, vy: -20, vida: 0.4, max: 0.4 });
        m.golpe = g;
      } else if (m.tipo === 'dormilon') {
        m.z += dt; if (enFiesta()) m.despierto = 1.2; else m.despierto = Math.max(0, m.despierto - dt);
        if (!m.despierto && m.z > 1.1) { m.z = 0; parts.push({ tipo: 'zeta', x: m.x + 4 * P * m.mira * -1, y: m.y - 9 * P, vx: 8, vy: -16, vida: 2.2, max: 2.2 }); }
      } else if (m.tipo === 'escalador') {
        const e = escaleras[0]; m.t += dt;
        const sube = (m.t % 9) < 4.5, prog = lim(((m.t % 4.5) - 0.8) / 3, 0, 1);
        m.y = sube ? lerp(e.y1, e.y0, prog) : lerp(e.y0, e.y1, prog); m.trepando = prog > 0 && prog < 1;
      } else if (m.tipo === 'jefe') { m.aviso = Math.max(0, m.aviso - dt); }
    }
  }

  // ── dibujo ──
  function fondo() {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#060818'); g.addColorStop(0.6, '#04050f'); g.addColorStop(1, '#050505');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const halo = ctx.createRadialGradient(w * 0.5, lineas[0].y - fs * 0.4, 0, w * 0.5, lineas[0].y - fs * 0.4, Math.max(w, h) * 0.6);
    halo.addColorStop(0, alfa(TINTE, 0.16)); halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    for (const s of estrellas) { ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.f + reloj * s.v)); ctx.fillStyle = '#e8ecff'; ctx.fillRect(s.x, s.y, s.r, s.r); }
    ctx.globalAlpha = 1;
  }

  function celosia(x0, y0, x1, y1, lado) { // tramo de celosía (mástil o brazo)
    ctx.strokeStyle = C.acero; ctx.lineWidth = Math.max(1, P / 3);
    const vertical = Math.abs(y1 - y0) > Math.abs(x1 - x0), n = Math.max(2, Math.round((vertical ? Math.abs(y1 - y0) : Math.abs(x1 - x0)) / lado));
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (vertical) { const ya = lerp(y0, y1, i / n), yb = lerp(y0, y1, (i + 1) / n); ctx.moveTo(x0, ya); ctx.lineTo(x1, yb); ctx.moveTo(x1, ya); ctx.lineTo(x0, yb); }
      else { const xa = lerp(x0, x1, i / n), xb = lerp(x0, x1, (i + 1) / n); ctx.moveTo(xa, y0); ctx.lineTo(xb, y1); ctx.moveTo(xa, y1); ctx.lineTo(xb, y0); }
    }
    ctx.stroke();
    ctx.fillStyle = C.aceroLuz;
    if (vertical) { ctx.fillRect(x0 - P / 2, y0, P, y1 - y0); ctx.fillRect(x1 - P / 2, y0, P, y1 - y0); }
    else { ctx.fillRect(x0, y0 - P / 2, x1 - x0, P); ctx.fillRect(x0, y1 - P / 2, x1 - x0, P); }
  }

  function dibujarGrua() {
    const { x, brazo } = grua, ySuelo = andamio.suelo;
    celosia(x - 4 * P, brazo, x + 4 * P, ySuelo, 8 * P);                // mástil
    ctx.fillStyle = C.acero; ctx.fillRect(x - 7 * P, ySuelo - 2 * P, 14 * P, 2 * P);
    const punta = Math.max(P, brazo - 14 * P);
    ctx.strokeStyle = C.aceroLuz; ctx.lineWidth = Math.max(1, P / 3);
    ctx.beginPath(); ctx.moveTo(x, punta); ctx.lineTo(grua.izq, brazo); ctx.moveTo(x, punta); ctx.lineTo(x + 26 * P, brazo); ctx.moveTo(x, punta); ctx.lineTo(x, brazo); ctx.stroke();
    celosia(grua.izq, brazo, x + 26 * P, brazo + 4 * P, 6 * P);          // brazo y contrabrazo
    ctx.fillStyle = '#272d52'; ctx.fillRect(x + 17 * P, brazo + 4 * P, 9 * P, 7 * P);   // contrapeso
    ctx.fillStyle = '#ff5a5a'; if (Math.floor(reloj * 1.4) % 2) ctx.fillRect(x - P / 2, punta - P, P * 1.2, P * 1.2);  // baliza
    // cabina con el operador
    ctx.fillStyle = '#2b3360'; ctx.fillRect(x - 7 * P, brazo + 5 * P, 10 * P, 8 * P);
    ctx.fillStyle = '#ffe9b0'; ctx.fillRect(x - 6 * P, brazo + 6 * P, 8 * P, 4 * P);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 6 * P, brazo + 6 * P, 8 * P, 4 * P); ctx.clip();
    ctx.fillStyle = degradado(brazo + 7.5 * P, brazo + 11 * P, [[0, '#F4A383'], [1, C.sombra]]); redondo(x - 5.5 * P, brazo + 7.6 * P, 7 * P, 4 * P, 1.2 * P); ctx.fill();
    const abiertos = Math.floor(reloj * 0.7) % 5; ctx.fillStyle = C.ojo;
    for (const ex of [x - 3.6 * P, x - 0.9 * P]) { capsula(ex, brazo + 8.2 * P + (abiertos ? 0 : 0.5 * P), 0.8 * P, abiertos ? 1.2 * P : 0.2 * P); ctx.fill(); }
    ctx.restore();
    // carro
    ctx.fillStyle = '#4a548f'; ctx.fillRect(grua.carro - 3 * P, brazo + 3 * P, 6 * P, 3 * P);
  }

  function dibujarCarga() { // cable, gancho, el jinete y la letra que cuelga
    const c = ciclo, ganchoY = grua.brazo + 6 * P + grua.cable;
    grua.vgiro += -grua.giro * 0.03; grua.vgiro *= 0.94; grua.giro = lim(grua.giro + grua.vgiro, -0.16, 0.16);
    ctx.save(); ctx.translate(grua.carro, grua.brazo + 6 * P); ctx.rotate(grua.giro);
    const largo = ganchoY - (grua.brazo + 6 * P);
    ctx.strokeStyle = '#8f97c4'; ctx.lineWidth = Math.max(1, P / 4); ctx.beginPath(); ctx.moveTo(-P, 0); ctx.lineTo(-P, largo); ctx.moveTo(P, 0); ctx.lineTo(P, largo); ctx.stroke();
    ctx.fillStyle = '#ffcf4a'; ctx.fillRect(-3 * P, largo, 6 * P, 2 * P);
    const l = c && ['ir', 'bajar'].includes(c.fase) ? letras[c.i] : null;
    const jinete = { x: 0, y: largo + 10 * P, mira: 1 };
    clawd(jinete, { brazos: l && c.fase === 'ir' ? 'saluda' : 'arriba', ola: Math.floor(reloj * 5) % 2, colgado: true, paso: l ? 0 : (Math.floor(reloj * 6) % 2) + 1 });
    if (l) {
      ctx.globalAlpha = l.aparicion;
      ctx.font = fuente; ctx.textBaseline = 'alphabetic';
      const bx = -l.w / 2, by = jinete.y + l.asc;
      ctx.fillStyle = '#0a0908'; ctx.fillText(l.ch, bx, by);
      ctx.strokeStyle = C.tinteClaro; ctx.lineWidth = Math.max(1, fs / 90); ctx.strokeText(l.ch, bx, by);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function dibujarLetras() {
    ctx.font = fuente; ctx.textBaseline = 'alphabetic';
    for (const l of letras) {
      if (l.estado === 1) continue;
      if (l.estado === 0) { ctx.setLineDash([P * 1.5, P * 1.5]); ctx.strokeStyle = alfa(TINTE, 0.22); ctx.lineWidth = Math.max(1, fs / 140); ctx.strokeText(l.ch, l.x, l.y); ctx.setLineDash([]); continue; }
      ctx.fillStyle = '#0a0908'; ctx.fillText(l.ch, l.x, l.y);
      if (l.relleno > 0) {
        const tope = l.y + l.desc - (l.asc + l.desc) * l.relleno;
        ctx.save(); ctx.beginPath(); ctx.rect(l.x - fs * 0.1, tope, l.w + fs * 0.2, (l.asc + l.desc) * l.relleno + 2); ctx.clip();
        const g = ctx.createLinearGradient(0, l.y - l.asc, 0, l.y + l.desc);
        g.addColorStop(0, C.tinteClaro); g.addColorStop(1, TINTE);
        ctx.fillStyle = g; ctx.shadowColor = alfa(TINTE, 0.75); ctx.shadowBlur = fs * (0.12 + l.brillo * 0.25);
        ctx.fillText(l.ch, l.x, l.y);
        ctx.restore();
        if (l.estado === 2) { ctx.fillStyle = '#fff6dc'; ctx.shadowColor = '#ffb35c'; ctx.shadowBlur = 12; ctx.fillRect(l.x, tope - 1, l.w, Math.max(2, P / 2)); ctx.shadowBlur = 0; }
      }
      ctx.strokeStyle = l.estado === 3 ? alfa('#ffffff', 0.25 + l.brillo * 0.6) : C.tinteClaro; ctx.lineWidth = Math.max(1, fs / 110); ctx.strokeText(l.ch, l.x, l.y);
      if (l.estado === 3 && l.brillo > 0 && !enFiesta()) l.brillo = Math.max(0, l.brillo - 0.02);
    }
  }

  function dibujarAndamio(delante) {
    const { x0, x1, arriba: a, suelo: s } = andamio, n = Math.max(2, Math.round((x1 - x0) / (30 * P))), paso = (x1 - x0) / n;
    if (!delante) {
      // postes y riostras
      const niveles = [a, ...tablones.map((t) => t.y), s];
      ctx.strokeStyle = alfa('#7a84c4', 0.18); ctx.lineWidth = Math.max(1, P / 4);
      ctx.beginPath();
      for (let i = 0; i < n; i++) for (let j = 1; j < niveles.length; j++) { const xa = x0 + i * paso, xb = xa + paso; ctx.moveTo(xa, niveles[j - 1]); ctx.lineTo(xb, niveles[j]); ctx.moveTo(xb, niveles[j - 1]); ctx.lineTo(xa, niveles[j]); }
      ctx.stroke();
      ctx.fillStyle = C.acero;
      for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + i * paso - P / 2), a, P, s - a);
      return;
    }
    for (const t of tablones) {
      ctx.fillStyle = C.tabla; ctx.fillRect(x0 - 2 * P, t.y, x1 - x0 + 4 * P, 2 * P);
      ctx.fillStyle = C.tablaLuz; ctx.fillRect(x0 - 2 * P, t.y, x1 - x0 + 4 * P, Math.max(1, P / 2));
    }
    for (const e of escaleras) {
      ctx.fillStyle = '#8b6b4a'; ctx.fillRect(e.x - 4 * P, e.y0, P, e.y1 - e.y0); ctx.fillRect(e.x + 3 * P, e.y0, P, e.y1 - e.y0);
      for (let y = e.y0 + 3 * P; y < e.y1; y += 4 * P) ctx.fillRect(e.x - 4 * P, y, 8 * P, Math.max(1, P / 2));
    }
  }

  function dibujarObra() { // pila de material y cajas entregadas
    const ySuelo = andamio.suelo, pila = equipo.find((m) => m.tipo === 'cargador')?.pila ?? andamio.x0;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? C.tinteOscuro : mezcla(TINTE, '#050505', 0.35); ctx.fillRect(pila - 14 * P + i * 2 * P, ySuelo - (i + 1) * 5 * P, 12 * P, 5 * P); }
    const dx = grua.x - 14 * P;
    for (let i = 0; i < cajas; i++) { const col = i % 3, fila = Math.floor(i / 3); ctx.fillStyle = C.tinte; ctx.fillRect(dx + 4 * P + col * 9 * P - fila * 4 * P + 6 * P, ySuelo - (fila + 1) * 5 * P, 8 * P, 5 * P); ctx.fillStyle = C.tinteClaro; ctx.fillRect(dx + 4 * P + col * 9 * P - fila * 4 * P + 6 * P, ySuelo - (fila + 1) * 5 * P, 8 * P, P); }
  }

  function dibujarEquipo() {
    for (const m of equipo) {
      const fiesta = enFiesta(), salto = fiesta ? Math.abs(Math.sin(reloj * 7 + m.x)) * 5 * P : 0, parpadeo = Math.sin(reloj * 0.9 + m.x) > 0.985;
      if (m.tipo === 'soldador') clawd(m, { careta: m.soldando, brazos: m.soldando ? 'soplete' : 'fuera', paso: m.soldando ? 0 : pasoDe(m.dist), salto: m.soldando ? 0 : salto, parpadeo });
      else if (m.tipo === 'cargador') clawd(m, { brazos: m.carga ? 'arriba' : 'fuera', carga: m.carga, paso: m.pausa > 0 ? 0 : pasoDe(m.dist), salto, parpadeo });
      else if (m.tipo === 'martillo') clawd(m, { brazos: fiesta ? 'arriba' : 'martillo', golpe: m.golpe, salto, parpadeo });
      else if (m.tipo === 'dormilon') {
        clawd(m, { sentado: !m.despierto, parpadeo: !m.despierto, brazos: m.despierto ? 'arriba' : 'fuera', salto: m.despierto ? salto : 0 });
      } else if (m.tipo === 'escalador') clawd(m, { brazos: m.trepando ? 'arriba' : 'fuera', paso: m.trepando ? (Math.floor(reloj * 8) % 2) + 1 : 0, salto: m.trepando ? 0 : salto, parpadeo });
      else if (m.tipo === 'jefe') {
        clawd(m, { brazos: fiesta ? 'saluda' : 'plano', ola: Math.floor(reloj * 5) % 2, salto, parpadeo });
        if (m.aviso > 0) globo(m.x, m.y - 14 * P, m.texto);
      }
    }
  }
  function globo(x, y, texto) {
    const t = 7 * P; ctx.fillStyle = '#ECE7DF'; ctx.fillRect(x - t / 2, y - t, t, t); ctx.fillRect(x - P / 2, y, P, P);
    ctx.fillStyle = '#0a0908'; ctx.font = `800 ${Math.round(t * 0.8)}px 'Instrument Sans', sans-serif`; ctx.textAlign = 'center'; ctx.fillText(texto, x, y - t * 0.2); ctx.textAlign = 'left';
  }

  function dibujarParticulas(dt) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.vida -= dt; const k = Math.max(0, p.vida / p.max);
      if (p.tipo === 'chispa') {
        p.vy += (p.suave ? 160 : 520) * dt * (P / 4); p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.strokeStyle = k > 0.6 ? '#ffffff' : p.color; ctx.globalAlpha = k; ctx.lineWidth = Math.max(1, P * 0.45);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025); ctx.stroke();
      }
    }
    // resplandor de cada soplete encendido
    for (const m of equipo) if (m.soldando && Math.random() > 0.15) {
      const x = m.x - 11.5 * P, y = m.y - 2.5 * P, r = 26 * P * azar(0.8, 1.1), g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,230,190,0.55)'); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    ctx.restore();
    for (const p of parts) {
      const k = Math.max(0, p.vida / p.max);
      if (p.tipo === 'polvo') { p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = `rgba(170,175,210,${0.35 * k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (2 - k), 0, 7); ctx.fill(); }
      else if (p.tipo === 'zeta') { p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = `rgba(236,231,223,${k})`; ctx.font = `700 ${Math.round(P * (3 + (1 - k) * 4))}px 'Instrument Sans', sans-serif`; ctx.fillText('z', p.x, p.y); }
      else if (p.tipo === 'tok') { p.y += p.vy * dt; ctx.fillStyle = `rgba(238,240,255,${k})`; ctx.fillRect(p.x - P, p.y - P, P / 1.5, P / 1.5); ctx.fillRect(p.x + P, p.y - 2 * P, P / 1.5, P / 1.5); ctx.fillRect(p.x, p.y - 3 * P, P / 1.5, P / 1.5); }
    }
    parts = parts.filter((p) => p.vida > 0);
  }

  function dibujarFocos() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const objetivo = { x: w / 2, y: lerp(andamio.arriba, lineas.at(-1).y, 0.5) };
    for (const f of focos) {
      const a = Math.atan2(objetivo.y - f.y, objetivo.x - f.x) + Math.sin(reloj * 0.35 + f.fase) * 0.22, largo = Math.hypot(w, h), apertura = 0.13;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, largo * 0.8);
      g.addColorStop(0, 'rgba(255,240,210,0.16)'); g.addColorStop(0.5, 'rgba(255,240,210,0.05)'); g.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(a - apertura) * largo, f.y + Math.sin(a - apertura) * largo); ctx.lineTo(f.x + Math.cos(a + apertura) * largo, f.y + Math.sin(a + apertura) * largo); ctx.closePath(); ctx.fill();
      const b = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 9 * P); b.addColorStop(0, 'rgba(255,248,225,0.9)'); b.addColorStop(1, 'rgba(255,248,225,0)'); ctx.fillStyle = b; ctx.fillRect(f.x - 9 * P, f.y - 9 * P, 18 * P, 18 * P);
    }
    ctx.restore();
    for (const f of focos) { ctx.fillStyle = '#2b3360'; ctx.fillRect(f.x - 3 * P, f.y - 2 * P, 6 * P, 4 * P); if (f.x < grua.x - 10 * P) ctx.fillRect(f.x - P / 2, f.y + 2 * P, P, andamio.suelo - f.y - 2 * P); }
  }

  function dibujarSuelo() {
    const s = andamio.suelo, g = ctx.createLinearGradient(0, s, 0, h);
    g.addColorStop(0, '#0a0c1d'); g.addColorStop(1, '#050505'); ctx.fillStyle = g; ctx.fillRect(0, s, w, h - s);
    ctx.strokeStyle = alfa(TINTE, 0.08); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -12; i <= 12; i++) { ctx.moveTo(w / 2 + i * 40 * P * 0.4, s); ctx.lineTo(w / 2 + i * 40 * P * 2.2, h); }
    for (let k = 1; k < 6; k++) { const y = s + (h - s) * (k / 6) ** 1.6; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    const l = ctx.createLinearGradient(0, 0, w, 0); l.addColorStop(0, 'rgba(0,0,0,0)'); l.addColorStop(0.5, alfa(TINTE, 0.55)); l.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = l; ctx.fillRect(0, s, w, Math.max(1, P / 2));
  }

  function cuadro(dt) {
    reloj += dt;
    avanzarCiclo(dt); actualizarEquipo(dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fondo();
    dibujarGrua();
    dibujarAndamio(false);
    dibujarLetras();
    dibujarSuelo();
    dibujarObra();
    dibujarAndamio(true);
    dibujarEquipo();
    dibujarCarga();
    dibujarParticulas(dt);
    dibujarFocos();
  }

  let antes = 0;
  function bucle(ahora) {
    const dt = Math.min(0.05, (ahora - antes) / 1000 || 0.016); antes = ahora;
    if (corriendo) cuadro(dt);
    requestAnimationFrame(bucle);
  }

  // para capturas y pruebas: ?obra=<segundos> adelanta la escena
  const salto = Number(new URLSearchParams(location.search).get('obra'));
  document.fonts.load(fuenteDe(100)).catch(() => {}).finally(() => {
    componer();
    if (salto > 0) for (let t = 0; t < salto; t += 1 / 30) { reloj += 1 / 30; avanzarCiclo(1 / 30); actualizarEquipo(1 / 30); parts = parts.filter((p) => (p.vida -= 1 / 30) > 0); }
    if (QUIETO) { cuadro(0); return; }
    new IntersectionObserver(([e]) => (corriendo = e.isIntersecting)).observe(heroe);
    document.addEventListener('visibilitychange', () => (corriendo = !document.hidden));
    let espera; addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(componer, 150); });
    requestAnimationFrame(bucle);
  });
}
