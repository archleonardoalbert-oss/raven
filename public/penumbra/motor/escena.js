// Una escena es una función pura (paso, p, entradas) → primitivas. El reloj solo decide p; todo lo que se ve se
// deriva de ese estado, así que ◀ restaura exactamente y pulsar rápido no puede dejar nada a medias.
import { GLOSARIO } from '../contenido/glosario.js';
import { enlazarTerminos } from '../nucleo/recorrido.js';
import { compilar } from '../nucleo/expresion.js';
import { clamp } from './tiempo.js';
import { crearLienzo } from './lienzo.js';
import { crearRender3D } from './render3d.js';
import { crearRenderNiebla } from './renderNiebla.js';
import { crearRenderPlano } from './renderPlano.js';

// ---------------------------------------------------------------- parte pura
export function primitivasDe(def, { paso, p, e }) {
  const q = (i) => (paso > i ? 1 : paso === i ? p : 0);
  return def.primitivas({ paso, p, e, q });
}

/** Devuelve siempre { principal, paneles, niebla, grupos }; `grupos` son las listas de primitivas por sistema de coordenadas. */
export function normalizar(r) {
  const o = Array.isArray(r) ? { principal: r } : r;
  const principal = o.principal ?? [], paneles = o.paneles ?? [];
  return { principal, paneles, niebla: o.niebla ?? null, grupos: [principal, ...paneles.map((x) => x.prims)] };
}

export function* recorrerEstados(def, e = crearEntradas(def).e) {
  for (let paso = 0; paso < def.pasos.length; paso++) {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) yield { ctx: { paso, p, e }, prims: primitivasDe(def, { paso, p, e }) };
  }
}

export function crearEntradas(def) {
  const e = {}, avisos = {}, previos = {};
  const porId = Object.fromEntries((def.entradas ?? []).map((x) => [x.id, x]));

  function actualizar(id, valor) {
    const d = porId[id];
    if (d.tipo === 'deslizador') e[id] = clamp(+valor, d.min, d.max);
    else if (d.tipo === 'arrastre') {
      const r = d.region;
      e[id] = [clamp(valor[0], r.x[0], r.x[1]), clamp(valor[1], r.y[0], r.y[1])];
    } else if (d.tipo === 'expresion') {
      const c = compilar(valor, d.vars ?? ['x']);
      if (c.error) { avisos[id] = `No se entiende: ${c.error}`; return; }
      const f = (...a) => { const v = c.f(...a); return Number.isFinite(v) ? clamp(v) : 0; };
      avisos[id] = null;
      const [a, b] = d.dominio ?? [0, 1];
      let finitos = 0;
      for (let i = 0; i <= 200; i++) {
        const v = c.f(a + ((b - a) * i) / 200);
        if (!Number.isFinite(v)) continue;
        finitos++;
        if (!avisos[id] && (v < -1e-9 || v > 1 + 1e-9)) avisos[id] = 'Se ha recortado a [0, 1]: un grado no puede salir de ahí.';
      }
      if (finitos === 0) avisos[id] = 'Esta fórmula no da ningún número en este dominio, así que se dibuja 0.';
      e[id] = f;
      e[`${id}_tex`] = c.latex;
      previos[id] = valor;
    }
  }
  for (const d of def.entradas ?? []) {
    avisos[d.id] = null;
    actualizar(d.id, d.valor);
  }
  const valores = () => Object.fromEntries((def.entradas ?? []).map((d) => [d.id, d.tipo === 'expresion' ? previos[d.id] : e[d.id]]));
  return { e, avisos, actualizar, definicion: porId, valores };
}

// ---------------------------------------------------------------- montaje
const ETIQUETA = { atras: '◀', adelante: '▶', repetir: '↻' };
const TITULO = { atras: 'Paso anterior (←)', adelante: 'Paso siguiente (→)', repetir: 'Repetir el movimiento' };

function leerFijado() {
  try {
    const q = new URLSearchParams(location.search);
    if (!q.has('paso')) return null;
    return { paso: +q.get('paso'), p: q.has('p') ? +q.get('p') : 1 };
  } catch { return null; }
}

export function montarEscena(contenedor, def, { textos = null, controles = null, alCambiar = null, teclado: usaTeclado = true } = {}) {
  const usaGL = def.formato !== 'plano';
  const lienzo = crearLienzo(contenedor, { W: def.W, H: def.H, gl: usaGL });
  const entradas = crearEntradas(def), n = def.pasos.length;
  const fijado = leerFijado(), reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paso = fijado ? clamp(fijado.paso, 0, n - 1) : 0, p = fijado ? fijado.p : reducido ? 1 : 0, sucio = true;
  let camara = def.camara ?? { yaw: -0.72, pitch: 0.6 };

  const sinGL = usaGL && !lienzo.gl;
  if (sinGL) {
    const aviso = document.createElement('p');
    aviso.className = 'aviso-sin-gl';
    aviso.textContent = 'Tu navegador no ofrece WebGL2, así que esta escena no se puede dibujar. El texto, el rigor y los retos que no dependen de ella siguen disponibles.';
    contenedor.prepend(aviso);
    lienzo.raiz.style.display = 'none';
  }

  let r3 = null, rNiebla = null, rSobre = null, rPlano = null;
  if (!sinGL) {
    if (def.formato === '3d') r3 = crearRender3D(lienzo, def.render3d);
    if (def.formato === 'niebla') {
      rNiebla = crearRenderNiebla(lienzo);
      rSobre = crearRenderPlano(lienzo, { x: [0, def.W], y: [def.H, 0], caja: { x: 0, y: 0, w: def.W, h: def.H }, id: 's' });
    }
    if (def.formato === 'plano') rPlano = crearRenderPlano(lienzo, { ...def.ejes, id: 'm' });
  }
  const rPaneles = new Map();
  const panel = (i, ejes) => {
    if (!rPaneles.has(i)) rPaneles.set(i, crearRenderPlano(lienzo, { ...ejes, id: `p${i}` }));
    return rPaneles.get(i);
  };

  const actual = () => primitivasDe(def, { paso, p, e: entradas.e });

  function pintar() {
    if (sinGL) return;
    const { principal, paneles, niebla } = normalizar(actual());
    lienzo.aplicar();
    if (r3) r3.dibujar(principal, camara);
    if (rNiebla) { rNiebla.dibujar(niebla); rSobre.dibujar(principal); }
    if (rPlano) rPlano.dibujar(principal);
    paneles.forEach((x, i) => panel(i, x.ejes).dibujar(x.prims));
    if (r3) camara = r3.camara();
  }

  // --- texto y controles
  const lineas = [];
  if (textos) {
    def.pasos.forEach((d, i) => {
      const el = document.createElement('p');
      el.className = 'paso-texto';
      el.innerHTML = enlazarTerminos(d.texto ?? '', GLOSARIO);
      el.addEventListener('click', (ev) => { if (!ev.target.closest?.('.termino')) irA(i); });
      textos.append(el);
      lineas.push(el);
    });
    window.renderMathInElement?.(textos, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false, strict: false });
  }
  const destinoCtl = controles ?? contenedor;
  const barra = document.createElement('div');
  barra.className = 'escena-botones';
  const contador = document.createElement('span');
  contador.className = 'escena-contador';
  for (const a of ['atras', 'adelante', 'repetir']) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.a = a; b.textContent = ETIQUETA[a]; b.title = TITULO[a];
    b.addEventListener('click', () => ({ atras: retroceder, adelante: avanzar, repetir })[a]());
    barra.append(b);
  }
  barra.append(contador);
  destinoCtl.append(barra);

  const notificar = () => alCambiar?.(api);
  for (const d of def.entradas ?? []) {
    if (d.tipo === 'arrastre') continue;
    const fila = document.createElement('label');
    fila.className = 'entrada';
    const nombre = document.createElement('span');
    nombre.textContent = d.etiqueta ?? d.id;
    const inp = document.createElement('input');
    inp.dataset.entrada = d.id;
    const aviso = document.createElement('small'), lectura = document.createElement('output');
    const leer = () => { lectura.textContent = String(+(+inp.value).toFixed(3)).replace('.', ','); };
    if (d.tipo === 'deslizador') { inp.type = 'range'; inp.min = d.min; inp.max = d.max; inp.step = d.paso ?? 0.01; inp.value = d.valor; leer(); }
    else { inp.type = 'text'; inp.value = d.valor; inp.spellcheck = false; }
    inp.addEventListener('input', () => {
      entradas.actualizar(d.id, inp.value);
      aviso.textContent = entradas.avisos[d.id] ?? '';
      if (d.tipo === 'deslizador') leer();
      sucio = true;
      notificar();
    });
    fila.append(nombre, inp, ...(d.tipo === 'deslizador' ? [lectura] : []), aviso);
    destinoCtl.append(fila);
  }

  function refrescarUI() {
    contador.textContent = `${paso + 1} / ${n}`;
    lineas.forEach((el, i) => {
      el.classList.toggle('actual', i === paso);
      el.classList.toggle('pasado', i < paso);
      el.classList.toggle('futuro', i > paso);
    });
    barra.querySelector('[data-a=atras]').disabled = paso === 0;
    barra.querySelector('[data-a=adelante]').disabled = paso === n - 1;
  }

  // --- pasos
  const inicial = () => (reducido ? 1 : 0);
  function avanzar() { if (paso < n - 1) { paso++; p = inicial(); sucio = true; refrescarUI(); notificar(); } }
  function retroceder() { if (paso > 0) { paso--; p = 1; sucio = true; refrescarUI(); notificar(); } }
  function repetir() { p = inicial(); sucio = true; }
  function irA(i) {
    const j = clamp(i, 0, n - 1);
    if (j === paso) { repetir(); return; }
    p = j > paso ? inicial() : 1;
    paso = j; sucio = true; refrescarUI(); notificar();
  }

  // --- ratón
  const aModelo = (d, px) => {
    if (r3 && d.panel === undefined) return entradas.e[d.id];
    if (d.panel !== undefined) {
      const { paneles } = normalizar(actual());
      const r = panel(d.panel, paneles[d.panel].ejes);
      return [r.deX(px[0]), r.deY(px[1])];
    }
    if (rPlano) return [rPlano.deX(px[0]), rPlano.deY(px[1])];
    return px;
  };
  const aLogico = (d, m) => {
    if (r3 && d.panel === undefined) return entradas.e[d.id];
    if (d.panel !== undefined) {
      const { paneles } = normalizar(actual());
      const r = panel(d.panel, paneles[d.panel].ejes);
      return [r.aX(m[0]), r.aY(m[1])];
    }
    if (rPlano) return [rPlano.aX(m[0]), rPlano.aY(m[1])];
    return m;
  };
  /** Un arrastre se engancha a su punto de control y, si lo declara, a toda su panel o región. */
  const arrastres = (def.entradas ?? []).filter((d) => d.tipo === 'arrastre');
  let agarre = null, giro = null;
  const sueltaTodo = () => { agarre = null; giro = null; };
  const raiz = lienzo.raiz;
  // Sin ratón: el lienzo describe lo que muestra, y las flechas mueven lo que se puede arrastrar.
  const arrastrable = (def.entradas ?? []).find((d) => d.tipo === 'arrastre');
  raiz.setAttribute('role', 'img');
  raiz.tabIndex = arrastrable ? 0 : -1;
  raiz.addEventListener('keydown', (ev) => {
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
    if (!arrastrable || !dir || document.activeElement !== raiz) return;
    ev.preventDefault(); ev.stopPropagation();
    const r = arrastrable.region, [x, y] = entradas.e[arrastrable.id];
    entradas.actualizar(arrastrable.id, [x + dir[0] * 0.02 * (r.x[1] - r.x[0]), y + dir[1] * 0.02 * (r.y[1] - r.y[0])]);
    sucio = true;
    notificar();
  });
  raiz.addEventListener('pointerdown', (ev) => {
    const px = lienzo.pos(ev);
    let mejor = null, md = 30;
    // el asa de un eje se dibuja como una línea: se agarra a cualquier altura, por su distancia en ese eje
    const distancia = (d) => {
      const l = aLogico(d, entradas.e[d.id]);
      if (d.eje === 'x') return Math.abs(l[0] - px[0]);
      if (d.eje === 'y') return Math.abs(l[1] - px[1]);
      return Math.hypot(l[0] - px[0], l[1] - px[1]);
    };
    const dentroDePanel = (d) => {
      if (d.panel === undefined) return true;
      const c = normalizar(actual()).paneles[d.panel].ejes.caja;
      return px[0] >= c.x && px[0] <= c.x + c.w && px[1] >= c.y - 24 && px[1] <= c.y + c.h + 44;
    };
    for (const d of arrastres) {
      if (!dentroDePanel(d)) continue;
      const dist = distancia(d);
      if (dist < md) { md = dist; mejor = d; }
    }
    if (!mejor && r3) {
      let menor = Infinity;
      for (const d of arrastres) if (d.panel !== undefined && dentroDePanel(d) && distancia(d) < menor) { menor = distancia(d); mejor = d; }
    }
    if (mejor) agarre = mejor;
    else if (r3) giro = px;
    else return;
    raiz.setPointerCapture(ev.pointerId);
    if (agarre && r3) moverA(agarre, px);
  });
  const moverA = (d, px) => {
    const previo = entradas.e[d.id], m = aModelo(d, px);
    entradas.actualizar(d.id, d.eje === 'x' ? [m[0], previo[1]] : d.eje === 'y' ? [previo[0], m[1]] : m);
    sucio = true;
    notificar();
  };
  raiz.addEventListener('pointermove', (ev) => {
    const px = lienzo.pos(ev);
    if (agarre) moverA(agarre, px);
    else if (giro) {
      camara = r3.camaraValida({ yaw: camara.yaw + (px[0] - giro[0]) * 0.007, pitch: camara.pitch + (px[1] - giro[1]) * 0.005 });
      giro = px;
      sucio = true;
    }
  });
  raiz.addEventListener('pointerup', sueltaTodo);
  raiz.addEventListener('pointercancel', sueltaTodo);
  raiz.addEventListener('lostpointercapture', sueltaTodo);

  // --- teclado
  const teclado = (ev) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    if (ev.key === 'ArrowRight') avanzar();
    if (ev.key === 'ArrowLeft') retroceder();
  };
  if (usaTeclado) document.addEventListener('keydown', teclado);

  // --- bucle
  lienzo.alTamano(() => { sucio = true; });
  const parar = lienzo.animar((dt) => {
    if (!fijado && p < 1) {
      p = Math.min(1, p + (dt * 1000) / (def.pasos[paso].dur ?? 1000));
      sucio = true;
    }
    if (sucio) { sucio = false; pintar(); }
  });
  refrescarUI();

  const api = {
    avanzar, retroceder, repetir, irA, lienzo, entradas,
    /** El estado final de la escena, sin animar: lo que necesita quien la va a manipular. */
    reposo() { if (paso !== n - 1 || p !== 1) { paso = n - 1; p = 1; sucio = true; refrescarUI(); } },
    estado: () => ({ paso, p, e: entradas.e }),
    /** Lo que hay que guardar para volver aquí: el paso y cómo están los mandos. */
    valores: () => ({ paso, entradas: entradas.valores() }),
    /** Vuelve a un sitio guardado, sin animar: los mandos como estaban, y el paso ya terminado. */
    colocar({ paso: pasoG = 0, entradas: vs = {} }) {
      for (const [id, v] of Object.entries(vs)) if (entradas.definicion[id]) entradas.actualizar(id, v);
      paso = Math.max(0, Math.min(n - 1, pasoG)); p = 1; sucio = true; refrescarUI();
    },
    notificar: () => notificar(),
    instantanea: () => JSON.parse(JSON.stringify(normalizar(actual()).grupos)),
    aPantalla(m, d = arrastres[0]) {
      const l = aLogico(d ?? {}, m), r = raiz.getBoundingClientRect();
      return [r.left + (l[0] * r.width) / def.W, r.top + (l[1] * r.height) / def.H];
    },
    actualizar(id, v) { entradas.actualizar(id, v); sucio = true; notificar(); },
    destruir() { parar(); document.removeEventListener('keydown', teclado); },
  };
  return api;
}
