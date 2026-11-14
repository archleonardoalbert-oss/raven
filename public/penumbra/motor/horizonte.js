// El Horizonte: aquí no hay mapa ni panel. La rueda es la caída. Cada parada es un faro real, con su luz doblada por la gravedad.
import { crearHorizonte } from './horizonteGL.js';
import { crearSonido } from './sonidoCaida.js';
import { CATALOGO } from '../contenido/catalogo.js';
import { crearProgreso } from '../nucleo/progreso.js';
import { crearLugar } from '../nucleo/lugar.js';
import { DURA_ENTRADA, dilatacion, faroDe, guionEntrada, iman, pose, trayecto, vista } from '../nucleo/caida.js';
const h = (t, a = {}, ...c) => { const e = document.createElement(t); for (const [k, v] of Object.entries(a)) { if (k === 'className') e.className = v; else if (k === 'textContent') e.textContent = v; else e.setAttribute(k, v); } c.flat().forEach((x) => e.append(x)); return e; };
const lim = (x, a, b) => Math.max(a, Math.min(b, x)), suave = (x) => { const u = lim(x, 0, 1); return u * u * (3 - 2 * u); }, coma = (x, d) => x.toFixed(d).replace('.', ',');
const ruidoLento = (t, a) => Math.sin(t * 1.7 + a) * 0.6 + Math.sin(t * 3.9 + a * 2.1) * 0.3 + Math.sin(t * 7.3 + a * 3.7) * 0.1;
export function montarHorizonte(raiz, { catalogo = CATALOGO, almacen = localStorage } = {}) {
  const regiones = catalogo.filter((r) => r.lado === 'horizonte'), P = trayecto(regiones), progreso = crearProgreso(almacen), N = P.length, MAX = N - 1, q = new URLSearchParams(location.search);
  const FAROS = P.map((_, k) => faroDe(P, k)), reducido = matchMedia('(prefers-reduced-motion: reduce)').matches, sonido = crearSonido();
  const grado = (x) => progreso.gradoConcepto(x.c.id, x.c.retos);
  const canvas = h('canvas', { id: 'c', 'aria-hidden': 'true' });
  const tarjeta = h('div', { className: 'hz-capitulo', 'aria-live': 'polite' }), titulo = h('h1', { className: 'hz-titulo', textContent: 'El Horizonte' });
  const faroEl = h('a', { className: 'hz-faro', href: '#' }), faroAnillo = h('span', { className: 'hz-faro-aro' }), faroTit = h('span', { className: 'hz-faro-tit' }), faroEntra = h('span', { className: 'hz-faro-entra', textContent: 'Entrar' }); faroEl.append(faroAnillo, faroTit, faroEntra);
  const reloj = h('p', { className: 'hz-reloj' }), pista = h('p', { className: 'hz-pista', textContent: 'Desplázate para caer' }), destello = h('div', { className: 'hz-destello' });
  const volver = h('a', { className: 'hz-volver', href: 'index.html?lado=alba', textContent: 'Volver al amanecer' });
  const bSonido = h('button', { type: 'button', className: 'hz-boton' }), bRuta = h('button', { type: 'button', className: 'hz-boton', textContent: 'Ruta' }), acciones = h('div', { className: 'hz-acciones' }, bRuta, bSonido);
  const ruta = h('dialog', { className: 'hz-ruta', 'aria-label': 'Todas las paradas de la caída' });
  raiz.append(canvas, titulo, tarjeta, faroEl, reloj, pista, volver, acciones, ruta, destello);
  const pintaSonido = () => { bSonido.textContent = sonido.activo ? 'Sonido: sí' : 'Sonido: no'; bSonido.setAttribute('aria-pressed', String(sonido.activo)); }; pintaSonido();
  bSonido.addEventListener('click', () => { sonido.alternar(); pintaSonido(); });
  let g = null; try { g = crearHorizonte(canvas); } catch { canvas.remove(); document.body.classList.add('hz-sin-gl'); }
  const inicial = () => { const pid = q.get('ir'); if (pid) { const i = P.findIndex((x) => x.c.id === pid); if (i >= 0) return i; } const l = crearLugar(almacen).ultimoEntre?.(P.map((x) => x.c.id)); if (l) { const i = P.findIndex((x) => x.c.id === l.c); if (i >= 0) return i; } const i = P.findIndex((x) => grado(x) < 0.7); return i < 0 ? 0 : i; };
  // obj: adónde quieres ir. s: dónde estás, siempre un poco por detrás: eso es la inercia.
  let obj = inicial(), s = q.has('ir') && obj > 0 && !reducido ? obj - 0.8 : obj, vel = 0, t = 0, ult = performance.now(), fijo = false, quieto = 9, mirX = 0, mirY = 0, mirXo = 0, mirYo = 0, sacude = 0, anilloVisto = -1, tarjetaHasta = 0, ultReloj = -1, ha = false;
  const entrando = q.get('entrada') === 'eclipse' && !reducido && !!g; let tEnt = entrando ? 0 : DURA_ENTRADA, picado = null;
  if (entrando) { obj = 0; s = 0; document.body.classList.add('hz-entrada'); }
  const actual = () => Math.round(lim(obj, 0, MAX));
  const salto = (d) => { obj = lim(actual() + d, 0, MAX); quieto = 0; ocultarPista(); };
  function ocultarPista() { if (!ha) { ha = true; pista.classList.add('oculta'); } }
  function saltarEntrada() { tEnt = DURA_ENTRADA; document.body.classList.remove('hz-entrada'); document.getElementById('puente')?.remove(); }
  function entrar() {
    if (picado || !P[actual()]) return; const k = actual(), url = `concepto.html?c=${P[k].c.id}`;
    if (reducido || !g) { location.href = url; return; }
    picado = { desde: performance.now(), k, url }; destello.classList.add('sube');
  }
  faroEl.addEventListener('click', (e) => { e.preventDefault(); entrar(); });
  // --- el mando: la rueda, el dedo o el teclado son la caída; el ratón, adónde miras
  addEventListener('wheel', (e) => { if (ruta.open) return; e.preventDefault(); if (tEnt < DURA_ENTRADA) return; const d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY; obj = lim(obj + d * 0.0014, 0, MAX); quieto = 0; ocultarPista(); }, { passive: false });
  addEventListener('keydown', (e) => {
    if (ruta.open) return; if (tEnt < DURA_ENTRADA) { saltarEntrada(); return; } const ab = ['ArrowDown', 'ArrowRight', 'PageDown', ' '], ar = ['ArrowUp', 'ArrowLeft', 'PageUp'];
    if (e.target.closest?.('button') && e.key === ' ') return;
    if (ab.includes(e.key)) { salto(1); e.preventDefault(); } else if (ar.includes(e.key)) { salto(-1); e.preventDefault(); } else if (e.key === 'Enter' && !e.target.closest?.('a,button')) entrar();
  });
  let dedo = null;
  canvas.addEventListener('pointerdown', (e) => { if (tEnt < DURA_ENTRADA) { saltarEntrada(); return; } if (e.pointerType !== 'mouse') { dedo = e.clientY; canvas.setPointerCapture(e.pointerId); } });
  canvas.addEventListener('pointermove', (e) => { if (dedo !== null) { obj = lim(obj + (dedo - e.clientY) * 0.006, 0, MAX); dedo = e.clientY; quieto = 0; ocultarPista(); } });
  canvas.addEventListener('pointerup', () => { dedo = null; });
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mirXo = (e.clientX / innerWidth - 0.5) * 0.16; mirYo = -(e.clientY / innerHeight - 0.5) * 0.1; } });
  // --- la ruta: para quien prefiere saltar; se abre aparte y no estorba
  function pintarRuta() {
    const cerrar = h('button', { type: 'button', className: 'hz-boton', textContent: 'Cerrar' }); cerrar.addEventListener('click', () => ruta.close());
    ruta.replaceChildren(h('div', { className: 'hz-ruta-cab' }, h('h2', { textContent: 'La caída entera' }), cerrar), ...regiones.map((r) => h('section', {}, h('h3', { textContent: r.titulo }), h('p', { textContent: r.lema }), h('ol', {}, r.conceptos.map((c) => { const i = P.findIndex((y) => y.c.id === c.id), hecha = grado(P[i]) >= 0.7, b = h('button', { type: 'button', className: `${i === actual() ? 'activa ' : ''}${hecha ? 'hecha' : ''}`, textContent: c.titulo }); b.addEventListener('click', () => { obj = i; quieto = 0; ocultarPista(); if (g) ruta.close(); else location.href = `concepto.html?c=${c.id}`; }); return h('li', {}, b); })))));
  }
  bRuta.addEventListener('click', () => { pintarRuta(); ruta.showModal(); });
  if (!g) { pintarRuta(); ruta.show(); }
  /** El ojo se adapta: pegado al horizonte, un observador quieto recibe la luz con un corrimiento al azul enorme (g⁴ crece como (1 − 1/r)⁻²). */
  const exposicion = (r) => 0.62 * Math.min(1, (1 - 1 / r) ** 2 / 0.3);
  let calidad = 1, mediaDt = 0.016, revisar = performance.now() + 3000;
  const faros = new Float32Array(16), farosC = new Float32Array(16);
  function ponerFaros(sA, expo) {
    const pr = Math.ceil(sA - 0.2); faros.fill(0); farosC.fill(0);
    for (let n = 0; n < 3; n++) { const k = pr + n; if (k < 0 || k > MAX) continue; const d = k - sA, al = suave((3.2 - d) / 1) * suave((d + 0.18) / 0.16), B = FAROS[k], dist = Math.max(0.45 * (P[k].r - 1), 0.18), hecha = grado(P[k]) >= 0.7, late = 1 + 0.18 * Math.sin(t * 2.4 + k); faros.set([...B, dist * 0.012], n * 4); farosC.set(hecha ? [0.55, 0.78, 1] : [1, 0.72, 0.32], n * 4); farosC[n * 4 + 3] = (al * late * 0.62) / Math.max(expo, 0.02); }
  }
  function pintarFaro(v, k, sA) {
    const B = FAROS[k], d = B.map((x, i) => x - v.C[i]), z = d[0] * v.f[0] + d[1] * v.f[1] + d[2] * v.f[2], asp = innerWidth / innerHeight, tf = Math.tan(v.fov / 2);
    const nx = (d[0] * v.de[0] + d[1] * v.de[1] + d[2] * v.de[2]) / (z * tf * asp), ny = (d[0] * v.ar[0] + d[1] * v.ar[1] + d[2] * v.ar[2]) / (z * tf), al = (1 - suave((Math.abs(sA - k) - 0.1) / 0.28)) * (picado ? 0 : 1) * (tEnt < DURA_ENTRADA ? 0 : 1);
    faroEl.classList.toggle('sin-aro', v.r < 5); // tan cerca, la gravedad desplaza la imagen del faro: un aro recto ya no caería encima
    faroEl.style.opacity = String(al); faroEl.style.pointerEvents = al > 0.4 ? 'auto' : 'none'; faroEl.tabIndex = al > 0.4 ? 0 : -1;
    if (faroEl.dataset.k !== String(k)) { faroEl.dataset.k = String(k); faroTit.textContent = P[k].c.titulo; faroEl.href = `concepto.html?c=${P[k].c.id}`; faroEl.classList.toggle('hecha', grado(P[k]) >= 0.7); faroEntra.textContent = grado(P[k]) > 0 ? 'Seguir' : 'Entrar'; }
    if (innerWidth <= 760) faroEl.style.transform = `translate(${innerWidth / 2}px, ${innerHeight * 0.74}px)`;
    else faroEl.style.transform = `translate(${lim((nx * 0.5 + 0.5) * innerWidth, 60, innerWidth - 300).toFixed(1)}px, ${lim((0.5 - ny * 0.5) * innerHeight, 80, innerHeight - 110).toFixed(1)}px)`;
  }
  function pintarCapitulo(k, ms) {
    const ir = P[k].ir; if (ir !== anilloVisto) { const prim = anilloVisto < 0; anilloVisto = ir; const r = P[k].region; tarjeta.replaceChildren(h('h2', { textContent: r.titulo }), h('p', { textContent: r.lema })); if (!prim || !entrando) { tarjeta.classList.add('visible'); tarjetaHasta = ms + 4200; if (!prim) sacude = Math.max(sacude, 1); } }
    if (tarjetaHasta && ms > tarjetaHasta) { tarjeta.classList.remove('visible'); tarjetaHasta = 0; }
  }
  function cuadro(ms) {
    requestAnimationFrame(cuadro); if (document.hidden) { ult = ms; return; }
    const dt = Math.min(0.05, (ms - ult) / 1000); ult = ms;
    // si la gráfica no llega, baja un poco la resolución interna antes que la fluidez
    if (dt > 0) { mediaDt += (dt - mediaDt) * 0.03; if (ms > revisar) { revisar = ms + 1500; if (mediaDt > 0.026 && calidad > 0.65) calidad *= 0.9; else if (mediaDt < 0.0185 && calidad < 1) calidad = Math.min(1, calidad * 1.05); } }
    const W = Math.round(innerWidth * Math.min(devicePixelRatio || 1, 1.25) * calidad), H = Math.round(innerHeight * Math.min(devicePixelRatio || 1, 1.25) * calidad); if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    if (!fijo) {
      if (tEnt < DURA_ENTRADA) { tEnt += dt; if (tEnt >= DURA_ENTRADA) saltarEntrada(); }
      else { quieto += dt; obj = iman(obj, quieto, dt, MAX); const a = reducido ? 1 : 1 - Math.exp(-dt * 3.2), ant = s; s += (obj - s) * a; vel += ((dt > 0 ? (s - ant) / dt : 0) - vel) * (1 - Math.exp(-dt * 6)); }
      mirX += (mirXo - mirX) * (1 - Math.exp(-dt * 2.4)); mirY += (mirYo - mirY) * (1 - Math.exp(-dt * 2.4)); sacude *= Math.exp(-dt * 1.6);
    }
    if (!g) return;
    const base = pose(P, s), ent = tEnt < DURA_ENTRADA ? guionEntrada(tEnt, base) : null, p0 = ent ?? base, r = p0.r, rapido = lim(Math.abs(vel) / 1.6, 0, 1), cerca = suave((6 - r) / 5);
    t += (dt || 0) * (fijo ? 0 : Math.min(dilatacion(r), 4));
    const mov = reducido || fijo ? 0 : 1, tem = mov * (0.0009 + 0.0035 * cerca + 0.006 * rapido + 0.012 * sacude), banco = mov * (lim(vel, -1.6, 1.6) * 0.16), giro = (ent ? ent.roll : 0) + banco + mov * 0.015 * Math.sin(ms * 0.00031);
    const lado0 = innerWidth > 760 ? 0.1 + 0.06 * suave((1.62 - r) / 0.42) : 0, lado = lado0 * (ent ? ent.lado : 1);
    let po = { ...p0, roll: giro, fov: p0.fov * (1 + 0.14 * rapido * mov) };
    let mx = (ent ? 0 : mirX) + tem * ruidoLento(ms * 0.003, 1), my = (ent ? 0 : mirY) + tem * ruidoLento(ms * 0.003, 5);
    if (picado) { const u = suave((ms - picado.desde) / 900); po.fov *= 1 - 0.62 * u * u; mx += u * 0.34 * Math.tan(po.fov / 2); if (ms - picado.desde > 950) { const url = picado.url; picado = null; location.href = url; return; } }
    const v = vista(po, { lado, mirX: mx, mirY: my }), expo = exposicion(r);
    ponerFaros(ent ? -9 : s, expo);
    g.dibujar({ C: v.C, base: v.base, fov: po.fov, t, expo, brillo: ent ? ent.brillo : 1, faros, farosC });
    const puente = document.getElementById('puente'); if (puente && ent) { puente.style.opacity = String(1 - suave(tEnt / 2.4)); if (tEnt > 2.5) puente.remove(); } else if (puente && !entrando) puente.remove();
    titulo.style.opacity = ent ? String(ent.titulo) : '0';
    const k = lim(Math.round(s), 0, MAX); pintarFaro(v, k, s); if (!ent) pintarCapitulo(k, ms);
    const rr = Math.round(r * 100); if (rr !== ultReloj) { ultReloj = rr; reloj.textContent = `A ${coma(r, r < 3 ? 2 : 1)} veces el radio del horizonte. Por cada segundo tuyo, allí fuera pasan ${coma(dilatacion(r), 2)}.`; }
    reloj.style.opacity = ent ? '0' : ''; sonido.actualizar(ent ? suave(tEnt / DURA_ENTRADA) * 0.5 : cerca, ent ? Math.sin(Math.PI * tEnt / DURA_ENTRADA) : rapido);
  }
  if (q.has('ir') && !entrando) { destello.classList.add('baja'); }
  requestAnimationFrame(cuadro);
  return { fijar: (o) => { saltarEntrada(); if ('k' in o) { s = o.k; obj = Math.round(o.k); vel = 0; } if ('t' in o) t = o.t; fijo = true; }, actual: () => P[actual()]?.c.id, paradas: () => P.map((x) => ({ id: x.c.id, r: x.r })), avance: () => s };
}
