// Una parada del camino: se recorre por etapas, una cada vez, con un solo botón que dice qué viene ahora.
// Lo que ya has recorrido se ve nítido; lo que falta, borroso.
import { CATALOGO, buscarConcepto } from '../contenido/catalogo.js';
import { GLOSARIO } from '../contenido/glosario.js';
import { crearProgreso } from '../nucleo/progreso.js';
import { crearTaller } from '../nucleo/taller.js';
import { enlazarTerminos } from '../nucleo/recorrido.js';
import { notaCalculo, notaDemostracion, notaEleccion, notaManipular } from '../nucleo/retos.js';
import { montarEscena } from './escena.js';
import { escalaGrado, rgb } from './colores.js';
import { reproducirEntrada } from './valiente.js';
import { crearLugar } from '../nucleo/lugar.js';

export const h = (tag, props = {}, ...hijos) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k in el) el[k] = v; else el.setAttribute(k, v);
  }
  el.append(...hijos.flat().filter((x) => x != null && x !== false));
  return el;
};
const prosa = (texto) => enlazarTerminos(texto ?? '', GLOSARIO);
const html = (tag, texto, clase) => h(tag, { innerHTML: prosa(texto), className: clase });
const OPCIONES_TEX = { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false, strict: false };
const pintarTex = (el) => window.renderMathInElement?.(el, OPCIONES_TEX);
const coma = (v, d = 2) => v.toFixed(d).replace('.', ',');
const texto = (tex, display = false) => (window.katex ? window.katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: false }) : tex);

/** Título cuyas últimas letras pierden el borde. `--b` en el elemento regula cuánto: se aclara al avanzar. */
export function tituloDifuso(t, tag = 'h1') {
  const el = h(tag, { className: 'difuso', ariaLabel: t });
  const n = t.length;
  [...t].forEach((c, i) => {
    const s = h('span', { textContent: c === ' ' ? ' ' : c, ariaHidden: 'true' });
    s.style.setProperty('--d', Math.max(0, (i - n * 0.55) / (n * 0.45)).toFixed(3));
    el.append(s);
  });
  return el;
}

export function barraGrado(valor) {
  const barra = h('div', { className: 'grado', role: 'img' });
  const relleno = h('i'), num = h('b');
  instalarGlosario();
  const nombre = h('button', { type: 'button', className: 'termino', textContent: 'tu grado' });
  nombre.dataset.termino = 'grado de dominio';
  barra.append(nombre, h('div', { className: 'grado-carril' }, relleno), num);
  const fijar = (v) => {
    relleno.style.width = `${v * 100}%`;
    num.textContent = coma(v);
    barra.setAttribute('aria-label', `grado de dominio ${coma(v)}`);
    barra.dataset.valor = String(v);
  };
  fijar(valor);
  return { el: barra, fijar };
}

// ---------------------------------------------------------------- glosario: toda palabra se puede preguntar
let tarjeta = null;
function instalarGlosario() {
  if (tarjeta) return;
  tarjeta = h('div', { className: 'glosario-tarjeta', role: 'dialog', hidden: true });
  document.body.append(tarjeta);
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest?.('.termino');
    if (!b) { if (!ev.target.closest?.('.glosario-tarjeta')) tarjeta.hidden = true; return; }
    const g = GLOSARIO[b.dataset.termino];
    tarjeta.replaceChildren(h('b', { textContent: g.titulo }), h('p', { innerHTML: g.texto }), h('p', { className: 'ejemplo-glosario', innerHTML: `Por ejemplo: ${g.ejemplo}` }));
    pintarTex(tarjeta);
    tarjeta.hidden = false;
    const r = b.getBoundingClientRect(), w = Math.min(360, innerWidth - 24);
    tarjeta.style.width = `${w}px`;
    tarjeta.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left))}px`;
    const abajo = r.bottom + 8, cabe = abajo + 230 < innerHeight;
    tarjeta.style.top = cabe ? `${abajo}px` : 'auto';
    tarjeta.style.bottom = cabe ? 'auto' : `${innerHeight - r.top + 8}px`;
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') tarjeta.hidden = true; });
}

// ---------------------------------------------------------------- entenderlo, un latido cada vez
const pasoDemo = (p) => h('li', {}, html('div', p.texto, 'texto'), p.porque ? html('div', p.porque, 'porque') : null);
const ETIQUETA_BLOQUE = { idea: 'La idea', ejemplo: 'Con números', simbolos: 'Pieza a pieza', formal: 'Con rigor', nota: 'Fíjate', demo: 'Demostración' };

/**
 * Cada latido es lo que se ve de una vez. Un grupo (por ejemplo, una fórmula leída pieza a pieza) se va llenando:
 * sus latidos añaden al mismo espacio. Al cambiar de grupo, la pantalla se limpia: nunca hay un muro acumulado.
 * Devuelve { grupos: [{ etiqueta, primero, ultimo }], latidos: [{ grupo, pintar(contenedor) }] }.
 */
function secuencia(c) {
  const latidos = [], grupos = [];
  const grupo = (etiqueta) => { grupos.push({ etiqueta, primero: latidos.length, ultimo: latidos.length }); return grupos.length - 1; };
  const nuevo = (g, pintar) => { latidos.push({ grupo: g, pintar }); grupos[g].ultimo = latidos.length - 1; };
  const bloques = c.entender ?? c.rigor.map((b) => ({ tipo: b.pasos ? 'demo' : b.tipo === 'NOTA' ? 'nota' : b.tipo === 'EJ' ? 'ejemplo' : 'formal', titulo: b.titulo, tex: b.tex, texto: b.tex, pasos: b.pasos, valiente: b.valiente, cartelas: b.cartelas }));
  for (const b of bloques) {
    const g = grupo(b.etiqueta ?? (b.titulo && b.tipo !== 'formal' ? b.titulo : ETIQUETA_BLOQUE[b.tipo]));
    if (b.tipo === 'idea') nuevo(g, (k) => k.append(html('p', b.texto, 'idea')));
    else if (b.tipo === 'ejemplo') {
      nuevo(g, (k) => k.append(h('p', { className: 'rotulo-etapa', textContent: 'Con números' }), html('p', b.texto),
        b.tabla ? h('table', { className: 'tabla-ejemplo' }, h('tbody', {}, b.tabla.map((fila) => h('tr', {}, fila.map((v, i) => h(i ? 'td' : 'th', { innerHTML: prosa(v) })))))) : ''));
      if (b.cierre) nuevo(g, (k) => k.append(html('p', b.cierre, 'cierre')));
    } else if (b.tipo === 'codigo') {
      nuevo(g, (k) => k.append(...(b.texto ? [html('p', b.texto)] : []), ...(b.prefacio ? [h('details', { className: 'prefacio' }, h('summary', { textContent: `${b.prefacioTitulo ?? 'La preparación'}: ${b.prefacio.split('\n').length} líneas` }), h('pre', { className: 'codigo', tabIndex: 0, innerHTML: colorearPython(b.prefacio) }))] : []), h('pre', { className: 'codigo', tabIndex: 0, innerHTML: colorearPython(b.codigo) }), ...(b.salida ? [h('p', { className: 'salida-rot', textContent: b.ejecutado === false ? 'Esquema: no se ha ejecutado aquí' : 'Lo que imprime, ejecutado de verdad' }), h('pre', { className: 'salida', tabIndex: 0, textContent: b.salida })] : [])));
      if (b.cierre) nuevo(g, (k) => k.append(html('p', b.cierre, 'cierre')));
    } else if (b.tipo === 'simbolos') {
      const lista = (k) => { let l = k.querySelector('.lectura'); if (!l) { k.append(h('p', { className: 'rotulo-etapa', textContent: 'Pieza a pieza' })); if (b.intro) k.append(html('p', b.intro)); l = h('dl', { className: 'lectura' }); k.append(l); } return l; };
      b.piezas.forEach((p) => nuevo(g, (k) => lista(k).append(h('div', { className: 'pieza' }, h('dt', { innerHTML: texto(p.tex) }), h('dd', { innerHTML: prosa(p.dice) })))));
      if (b.todo) {
        const gt = grupo('Todo junto');
        nuevo(gt, (k) => k.append(h('p', { className: 'rotulo-etapa', textContent: 'Todo junto' }), h('div', { className: 'formula-grande', innerHTML: texto(b.todo, true) }), b.lee ? html('p', b.lee) : ''));
      }
    } else if (b.tipo === 'formal') {
      nuevo(g, (k) => k.append(h('div', { className: 'formal' }, h('p', { className: 'rotulo-etapa', textContent: b.titulo ? `Ahora sí, con todo el rigor · ${b.titulo}` : 'Ahora sí, con todo el rigor' }), html('div', b.tex, 'formal-tex'))));
      if (b.lee) nuevo(g, (k) => k.append(html('p', b.lee, 'cierre')));
    } else if (b.tipo === 'nota') {
      nuevo(g, (k) => k.append(b.titulo ? h('b', { className: 'nota-titulo', textContent: b.titulo, style: 'font-weight:400' }) : '', html('p', b.texto, 'idea')));
    } else if (b.tipo === 'demo') {
      nuevo(g, (k) => k.append(h('p', { className: 'rotulo-etapa', textContent: b.valiente ? 'Un reto mayor' : 'Vamos a demostrarlo' }), h('b', { textContent: b.titulo ?? '', style: 'font-weight:400;display:block' }), b.plan ? html('p', b.plan) : '', b.tex ? html('p', b.tex) : ''));
      if (b.valiente) {
        let revelada = false;
        nuevo(g, (k) => {
          const cuerpo = h('ol', { className: 'razonamiento', hidden: !revelada }, b.pasos.map(pasoDemo));
          const boton = h('button', { type: 'button', className: 'boton-valiente', textContent: '⚔ Demostración solo para valientes' });
          boton.addEventListener('click', () => reproducirEntrada({ titulo: b.titulo ?? c.titulo, cartelas: b.cartelas, alTerminar: () => { revelada = true; cuerpo.hidden = false; pintarTex(cuerpo); } }));
          k.append(boton, cuerpo);
        });
      } else {
        const gd = grupo('Paso a paso');
        b.pasos.forEach((p) => nuevo(gd, (k) => {
          let ol = k.querySelector('.razonamiento');
          if (!ol) { if (b.tex) k.append(html('p', b.tex, 'cierre')); ol = h('ol', { className: 'razonamiento' }); k.append(ol); }
          ol.append(pasoDemo(p));
        }));
      }
    }
  }
  if (c.tecnicas?.length) {
    const g = grupo('Lo que te llevas');
    nuevo(g, (k) => k.append(h('p', { className: 'rotulo-etapa', textContent: 'Lo que te llevas' }), h('ul', { className: 'tecnicas' }, c.tecnicas.map((x) => h('li', {}, h('b', { innerHTML: x.titulo }), html('span', x.texto)))),
      c.referencias?.length ? h('details', { className: 'de-donde' }, h('summary', { textContent: 'De dónde sale esto' }), h('ul', { className: 'referencias' }, c.referencias.map((r) => h('li', { innerHTML: r })))) : ''));
  }
  return { grupos, latidos };
}

// ---------------------------------------------------------------- retos
function zonaPistas(pistas) {
  let usadas = 0;
  const lista = h('ol', { className: 'pistas' }), boton = h('button', { type: 'button', className: 'boton-pista' });
  const pintar = () => { boton.hidden = usadas >= pistas.length; boton.textContent = `Pedir una pista (${usadas + 1} de ${pistas.length})`; };
  boton.addEventListener('click', () => { const li = html('li', pistas[usadas]); lista.append(li); pintarTex(li); usadas++; pintar(); });
  pintar();
  return { el: h('div', {}, lista, pistas.length ? boton : null), usadas: () => usadas };
}

function tarjetaReto(reto, { registrar, notaInicial, escena, escenaDisponible, taller }) {
  const marca = h('span', { className: 'reto-nota' });
  let mejor = notaInicial;
  const fijarNota = () => { marca.textContent = mejor > 0 ? `mejor nota ${coma(mejor)}` : ''; };
  fijarNota();
  const salida = h('p', { className: 'reto-salida', ariaLive: 'polite' });
  const responder = (nota, t) => { registrar(reto.id, nota); salida.innerHTML = prosa(t); pintarTex(salida); salida.dataset.nota = String(nota); mejor = Math.max(mejor, nota); fijarNota(); };
  const pistas = zonaPistas(reto.pistas ?? []);
  const caja = h('section', { className: `reto reto-${reto.tipo}`, id: `reto-${reto.id}` },
    h('header', {}, h('span', { className: 'reto-tipo', textContent: { calcular: 'Calcula', manipular: 'Manipula', elegir: 'Elige', contraejemplo: 'Encuentra el contraejemplo', demostrar: 'Demuestra' }[reto.tipo] }), marca),
    html('div', reto.enunciado, 'reto-enunciado'));
  const acciones = h('div', { className: 'reto-acciones' });
  caja.append(acciones, pistas.el, salida);

  if (reto.tipo === 'calcular') {
    const entrada = h('input', { type: 'text', inputMode: 'decimal', placeholder: 'tu respuesta', autocomplete: 'off' });
    const b = h('button', { type: 'button', textContent: 'Comprobar' });
    const hacer = () => {
      const v = parseFloat(entrada.value.replace(',', '.'));
      if (Number.isNaN(v)) { salida.textContent = 'Escribe un número, por ejemplo 0,35.'; return; }
      const nota = notaCalculo(v, reto.respuesta, reto.tol, pistas.usadas());
      responder(nota, Math.abs(v - reto.respuesta) <= reto.tol ? `Correcto. ${reto.explicacion ?? ''}` : `Aún no: te da una precisión de ${coma(nota)}. Revísalo o pide una pista.`);
    };
    b.addEventListener('click', hacer);
    entrada.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') hacer(); });
    acciones.append(entrada, b);
  } else if (reto.tipo === 'elegir' || reto.tipo === 'contraejemplo') {
    let intentos = 0, hecho = false;
    reto.opciones.forEach((op, i) => {
      const b = html('button', op);
      b.type = 'button'; b.className = 'opcion';
      b.addEventListener('click', () => {
        if (hecho) return;
        intentos++;
        if (i === reto.correcta) { hecho = true; b.classList.add('bien'); responder(notaEleccion(true, intentos), `Correcto. ${reto.explicacion ?? ''}`); }
        else { b.classList.add('mal'); b.disabled = true; salida.innerHTML = prosa(reto.porQueNo?.[i] ?? 'Esa no. Piénsalo otra vez.'); pintarTex(salida); }
      });
      acciones.append(b);
    });
  } else if (reto.tipo === 'manipular') {
    if (!escenaDisponible) acciones.append(h('p', { textContent: 'Este reto necesita la escena, y tu navegador no puede dibujarla.' }));
    else {
      const b = h('button', { type: 'button', textContent: 'Comprobar en la escena' });
      b.addEventListener('click', () => {
        const pr = reto.precision(escena.estado().e), nota = notaManipular(pr, pistas.usadas());
        if (pr >= 1 && reto.guardar) taller.guardar(reto.guardar(escena.estado().e));
        responder(nota, pr >= 1 ? `Conseguido. ${reto.explicacion ?? ''}` : (reto.pendiente?.(escena.estado().e) ?? `Vas por ${coma(pr)}. Sigue moviendo.`));
      });
      acciones.append(b);
    }
  } else if (reto.tipo === 'demostrar') {
    const sol = h('ol', { className: 'razonamiento solucion', hidden: true }, reto.solucion.map(pasoDemo));
    const ver = h('button', { type: 'button', textContent: 'Ver la solución modelo' });
    const auto = h('div', { className: 'autoevaluacion', hidden: true }, h('span', { textContent: 'Con la mano en el corazón, tu demostración…' }));
    for (const [n, t] of [[1, 'era completa y correcta'], [0.5, 'tenía la idea, con huecos'], [0, 'no llegó']]) {
      const b = h('button', { type: 'button', textContent: t });
      b.addEventListener('click', () => responder(notaDemostracion(n, pistas.usadas()), 'Anotado. Lo que cuenta es lo que te llevas de ella.'));
      auto.append(b);
    }
    ver.addEventListener('click', () => { sol.hidden = false; auto.hidden = false; ver.hidden = true; pintarTex(sol); auto.scrollIntoView?.({ block: 'nearest' }); });
    acciones.append(ver);
    caja.append(sol, auto);
  }
  return caja;
}

// ---------------------------------------------------------------- la ruta de la región
function rutaRegion(region, ficha, progreso) {
  const ol = h('ol', { className: 'ruta' });
  region.conceptos.forEach((x) => {
    const g = progreso.gradoConcepto(x.id, x.retos), actual = x.id === ficha.id;
    const punto = h(x.estado === 'listo' && !actual ? 'a' : 'span', { className: `estacion${actual ? ' actual' : ''}`, href: x.estado === 'listo' && !actual ? `concepto.html?c=${x.id}` : null, title: `${x.titulo} · grado ${coma(g)}`, ariaLabel: x.titulo });
    punto.style.setProperty('--color', rgb(g > 0 ? escalaGrado(g) : [58, 62, 84]));
    ol.append(h('li', {}, punto));
  });
  return h('nav', { className: 'ruta-region', ariaLabel: `Paradas de ${region.titulo}` }, h('a', { href: region.lado === 'horizonte' ? 'horizonte.html' : region.lado === 'alba' ? 'index.html?lado=alba' : 'index.html', className: 'volver-mapa', textContent: '⌂ Mapa' }), h('span', { className: 'ruta-nombre', textContent: `${region.id}. ${region.titulo}` }), ol, region.lado === 'horizonte' ? botonDoc() : null);
}

/** En toda la ruta del Horizonte, la documentación de fuzzython está a un clic, en cualquier etapa. */
function botonDoc() {
  let doc = null; const b = h('button', { type: 'button', className: 'boton-doc', textContent: 'Documentación' });
  b.addEventListener('click', async () => { if (!doc) { const { crearDoc } = await import('./docPanel.js'); doc = crearDoc({ h, prosa, pintarTex, colorear: colorearPython }); } doc.abrir(); });
  return b;
}

// ---------------------------------------------------------------- página
const ETAPAS = [
  { id: 'pregunta', nombre: 'La pregunta', seguir: 'Vamos a verlo' },
  { id: 'mira', nombre: 'Míralo', seguir: 'Ahora tócalo tú' },
  { id: 'toca', nombre: 'Tócalo', seguir: 'Entendamos lo que ha pasado' },
  { id: 'entiende', nombre: 'Entiéndelo', seguir: 'Demuestra que lo tienes' },
  { id: 'demuestra', nombre: 'Demuéstralo', seguir: 'Terminar esta parada' },
  { id: 'llegada', nombre: 'Lo siguiente' },
];

/** Colorea Python sin depender de nada: primero se escapa, y luego se marcan comentarios, cadenas, palabras clave y números. */
export function colorearPython(src) {
  const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return src.split('\n').map((lin) => {
    let out = '', i = 0, m;
    const re = /(#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(from|import|def|return|for|in|if|else|with|as|print|class|lambda|None|True|False)\b|\b(\d+(?:\.\d+)?)\b/g;
    while ((m = re.exec(lin))) { out += esc(lin.slice(i, m.index)); const c = m[1] ? 'com' : m[2] ? 'cad' : m[3] ? 'pc' : 'num'; out += `<span class="${c}">${esc(m[0])}</span>`; i = m.index + m[0].length; }
    return out + esc(lin.slice(i));
  }).join('\n');
}

function mensajeAmable(raiz, titulo, t) {
  raiz.replaceChildren(h('main', { className: 'mensaje' }, tituloDifuso(titulo), h('p', { innerHTML: t }), h('a', { href: 'index.html', className: 'boton-mapa', textContent: 'Volver al mapa' })));
}

/** Cambia lo que se ve conservando lo que permanece (la escena, el título) y sugiriendo la dirección del avance. */
function transicion(cambio, dir = 'adelante') {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reducido) { cambio(); return; }
  document.documentElement.dataset.dir = dir;
  document.startViewTransition(cambio);
}

export async function montarConcepto(raiz, id, { catalogo = CATALOGO, almacen } = {}) {
  instalarGlosario();
  const hallado = id ? buscarConcepto(id, catalogo) : null;
  if (!hallado) return mensajeAmable(raiz, 'Aquí no hay nada', 'No encuentro ese concepto. Quizá el enlace está mal; en el mapa están todos.');
  const { region, concepto: ficha, siguiente } = hallado;
  if (ficha.estado !== 'listo') return mensajeAmable(raiz, ficha.titulo, `Este concepto de la región «${region.titulo}» aún no está escrito.`);
  const c = (await ficha.carga()).default;
  document.title = `${c.titulo} · Penumbra`;

  const guardado = almacen === undefined ? tryLocal() : almacen, progreso = crearProgreso(guardado), taller = crearTaller(guardado), lugar = crearLugar(guardado);
  const grado = barraGrado(progreso.gradoConcepto(c.id, c.retos));
  const titulo = tituloDifuso(c.titulo, 'h1');
  titulo.classList.add('titulo-parada');
  const textos = h('div', { className: 'pasos-lista' }), controles = h('div', { className: 'escena-controles' }), zonaEscena = h('div', { className: 'escena-lienzo' });
  const bloqueLienzo = h('div', { className: 'bloque-lienzo' }, zonaEscena);
  bloqueLienzo.style.setProperty('--ratio', String(c.escena.W / c.escena.H));
  const encaje = h('div', { className: 'encaje' }, bloqueLienzo);
  encaje.style.setProperty('--ratio', String(c.escena.W / c.escena.H));

  const raiel = h('ol', { className: 'etapas' });
  const secciones = {};
  const huecoMira = h('div', { className: 'hueco-mira' }), huecoToca = h('div', { className: 'hueco-escena' }), huecoRetos = h('div', { className: 'hueco-escena' });
  secciones.pregunta = h('section', { id: 'pregunta', className: 'seccion-pregunta' }, html('p', c.pregunta, 'pregunta'));
  secciones.mira = h('section', { id: 'animacion' }, huecoMira);
  const panelToca = h('div', { className: 'toca-panel' }, h('h2', { textContent: 'Ahora, tú' }), html('div', c.manipulacion, 'manipulacion'));
  secciones.toca = h('section', { id: 'manipulacion', className: 'toca' }, huecoToca, panelToca);

  const hilo = h('ol', { className: 'hilo' }), latido = h('div', { className: 'latido' }), latidoMarco = h('div', { className: 'latido-marco' }, latido);
  secciones.entiende = h('section', { id: 'rigor', className: 'lectura-guiada' }, hilo, latidoMarco);

  const pestanas = h('div', { className: 'pestanas-reto' }), listaRetos = h('div', { id: 'lista-retos', className: 'columna-reto' }, pestanas);
  secciones.demuestra = h('section', { id: 'retos', className: 'zona-retos' }, listaRetos);
  const proxima = siguiente?.estado === 'listo' ? siguiente : null;
  const notaLlegada = h('p', { className: 'tenue' });
  // dentro del capítulo, se sigue andando; al cambiar de capítulo, se viaja por el mapa
  const cambiaCapitulo = proxima && !region.conceptos.some((x) => x.id === proxima.id), regionSig = cambiaCapitulo ? buscarConcepto(proxima.id, catalogo).region : null;
  const enHorizonte = region.lado === 'horizonte', destinoFinal = !proxima ? (enHorizonte ? 'horizonte.html' : region.lado === 'alba' ? 'index.html?lado=alba' : 'index.html') : cambiaCapitulo ? (enHorizonte ? `horizonte.html?ir=${proxima.id}` : `index.html?viaje=${proxima.id}`) : `concepto.html?c=${proxima.id}`;
  const textoFinal = !proxima ? 'Volver al mapa' : cambiaCapitulo ? (enHorizonte ? `Caer al anillo ${regionSig.anillo}: ${regionSig.titulo}` : `Viajar al capítulo ${regionSig.id}: ${regionSig.titulo}`) : `Siguiente parada: ${proxima.titulo}`;
  secciones.llegada = h('section', { id: 'llegada', className: 'llegada' },
    h('p', { className: 'rotulo-etapa', textContent: 'Parada terminada' }), html('p', c.puente, 'puente'), notaLlegada,
    h('a', { className: 'boton-seguir', href: destinoFinal, textContent: textoFinal }));

  const seguir = h('button', { type: 'button', className: 'boton-seguir' }), atras = h('button', { type: 'button', className: 'boton-atras', textContent: '← Volver' }), centro = h('div', { className: 'pie-centro' });
  const pie = h('footer', { className: 'pie-etapa' }, atras, centro, seguir);
  const escenario = h('main', { className: 'escenario' }, ...Object.values(secciones));
  const app = h('div', { className: `app${new URLSearchParams(location.search).has('llegas') ? ' llega' : ''}` }, h('header', { className: 'barra-alta' }, rutaRegion(region, ficha, progreso), grado.el, titulo, raiel), escenario, pie);
  raiz.replaceChildren(app);

  const escena = montarEscena(zonaEscena, c.escena, { textos, controles, teclado: false, alCambiar: () => { refrescarPie(); guardarLugar(); } });
  const escenaDisponible = c.escena.formato === 'plano' || !!escena.lienzo.gl;
  const botonesEscena = controles.querySelector('.escena-botones');

  // --- retos, uno cada vez
  const tarjetas = c.retos.map((reto) => tarjetaReto(reto, {
    registrar: (r, nota) => {
      progreso.registrar(c.id, r, nota);
      grado.fijar(progreso.gradoConcepto(c.id, c.retos));
      grado.el.classList.add('sube'); setTimeout(() => grado.el.classList.remove('sube'), 900);
      pintarPestanas();
    },
    notaInicial: progreso.notaReto(c.id, reto.id), escena, escenaDisponible, taller,
  }));
  let iReto = 0;
  function pintarPestanas() {
    pestanas.replaceChildren(...c.retos.map((r, i) => {
      const b = h('button', { type: 'button', textContent: `Reto ${i + 1}`, className: `${i === iReto ? 'actual' : ''} ${progreso.notaReto(c.id, r.id) > 0 ? 'hecho' : ''}` });
      b.dataset.reto = r.id;
      b.addEventListener('click', () => mostrarReto(i));
      return b;
    }));
  }
  function mostrarReto(i) {
    iReto = i;
    tarjetas.forEach((t, k) => { if (k === i) { if (!t.isConnected) listaRetos.append(t); } else t.remove(); });
    const conEscena = c.retos[i].tipo === 'manipular' && escenaDisponible;
    secciones.demuestra.classList.toggle('con-escena', conEscena);
    if (conEscena && etapaId() === 'demuestra') { escena.reposo(); huecoRetos.replaceChildren(encaje, controles); if (!huecoRetos.isConnected) secciones.demuestra.append(huecoRetos); } else huecoRetos.remove();
    pintarPestanas(); pintarTex(listaRetos); refrescarPie(); guardarLugar();
  }

  // --- lectura por latidos
  const { grupos, latidos } = secuencia(c);
  let iLatido = -1;
  const itemsHilo = grupos.map((g) => {
    const b = h('button', { type: 'button' }, h('i'), h('span', { textContent: g.etiqueta }));
    b.addEventListener('click', () => mostrarLatido(g.ultimo));
    const li = h('li', {}, b);
    hilo.append(li);
    return { li, b };
  });
  function mostrarLatido(i, animar = true) {
    const anterior = iLatido;
    iLatido = i;
    const g = latidos[i].grupo, primero = grupos[g].primero;
    const mismoGrupo = anterior >= 0 && latidos[anterior].grupo === g && i === anterior + 1;
    if (mismoGrupo) {
      const antes = new Set(latido.querySelectorAll('*'));
      latidos[i].pintar(latido);
      latido.querySelectorAll('*').forEach((el) => { if (!antes.has(el) && !antes.has(el.parentElement) && animar) el.classList.add('entra'); });
    } else {
      latido.replaceChildren();
      for (let k = primero; k <= i; k++) latidos[k].pintar(latido);
      if (animar) { latido.classList.remove('entra'); void latido.offsetWidth; latido.classList.add('entra'); }
    }
    pintarTex(latido);
    latidoMarco.scrollTop = latidoMarco.scrollHeight;
    itemsHilo.forEach(({ li, b }, k) => {
      li.className = k < g ? 'hecho' : k === g ? 'actual' : '';
      b.disabled = grupos[k].primero > Math.max(i, tope);
    });
    tope = Math.max(tope, i);
    guardarLugar();
    itemsHilo[g].li.scrollIntoView?.({ block: 'nearest' });
    refrescarPie();
  }
  let tope = 0, listo = false;
  const borradores = {};
  let esperaGuardar = 0;
  /** A cada gesto: lo guarda enseguida, sin escribir a cada píxel de un arrastre. */
  function guardarLugar() {
    if (!listo) return;
    clearTimeout(esperaGuardar);
    esperaGuardar = setTimeout(escribirLugar, 60);
  }
  function escribirLugar() {
    clearTimeout(esperaGuardar);
    if (listo) lugar.guardar(c.id, { etapa, latido: iLatido, tope, reto: iReto, scroll: latidoMarco.scrollTop, borradores, latidosTotal: latidos.length, pasosTotal: c.escena.pasos.length, ...escena.valores() });
  }
  addEventListener('pagehide', escribirLugar);
  document.addEventListener('visibilitychange', () => { if (document.hidden) escribirLugar(); });
  latidoMarco.addEventListener('scroll', guardarLugar, { passive: true });

  // --- etapas
  let etapa = 0;
  const etapaId = () => ETAPAS[etapa].id;
  ETAPAS.forEach((e, i) => {
    const b = h('button', { type: 'button', textContent: e.nombre });
    b.addEventListener('click', () => irA(i));
    raiel.append(h('li', {}, b));
  });
  const enMira = () => etapaId() === 'mira';

  function refrescarPie() {
    const e = ETAPAS[etapa], ultimoPaso = escena.estado().paso >= c.escena.pasos.length - 1;
    let t = e.seguir;
    if (enMira() && !ultimoPaso) t = 'Siguiente paso';
    if (e.id === 'entiende' && iLatido < latidos.length - 1) t = 'Seguir';
    if (e.id === 'demuestra' && iReto < c.retos.length - 1) t = 'Siguiente reto';
    seguir.textContent = `${t} →`;
    seguir.hidden = !e.seguir;
    atras.hidden = etapa === 0;
    if (e.id === 'entiende') centro.textContent = `${iLatido + 1} / ${latidos.length}`;
    centro.className = 'pie-centro escena-contador';
  }

  for (const s of Object.values(secciones)) s.tabIndex = -1;
  let yaEnfocable = false;
  function aplicarEtapa() {
    const e = ETAPAS[etapa];
    for (const [k, s] of Object.entries(secciones)) s.hidden = k !== e.id;
    [...raiel.children].forEach((li, k) => { li.className = k < etapa ? 'pasada' : k === etapa ? 'actual' : 'futura'; li.firstChild.setAttribute('aria-current', k === etapa ? 'step' : 'false'); });
    titulo.style.setProperty('--b', String(1 - etapa / (ETAPAS.length - 1)));
    app.dataset.etapa = e.id;
    if (yaEnfocable) secciones[e.id].focus({ preventScroll: true });
    yaEnfocable = true;
    centro.replaceChildren();
    if (e.id === 'mira') { huecoMira.replaceChildren(textos, encaje); centro.append(botonesEscena); controles.remove(); }
    if (e.id === 'toca') { huecoToca.replaceChildren(encaje); panelToca.append(controles); escena.reposo(); }
    if (e.id === 'demuestra') mostrarReto(iReto);
    if (e.id === 'entiende' && iLatido < 0) mostrarLatido(0);
    if (e.id === 'llegada') notaLlegada.textContent = `Tu grado aquí: ${coma(progreso.gradoConcepto(c.id, c.retos))}. ${progreso.gradoConcepto(c.id, c.retos) < 0.7 ? 'Puedes seguir, y volver a los retos cuando quieras: nada se bloquea.' : 'Lo tienes.'}`;
    history.replaceState(null, '', `${location.pathname}?c=${c.id}#${e.id}`);
    refrescarPie();
    guardarLugar();
  }
  function irA(i) {
    const j = Math.max(0, Math.min(ETAPAS.length - 1, i));
    if (j === etapa && app.dataset.etapa) return;
    const dir = j < etapa ? 'atras' : 'adelante';
    etapa = j;
    transicion(aplicarEtapa, dir);
  }

  const adelante = () => {
    const e = ETAPAS[etapa];
    if (enMira() && escena.estado().paso < c.escena.pasos.length - 1) { escena.avanzar(); return; }
    if (e.id === 'entiende' && iLatido < latidos.length - 1) { mostrarLatido(iLatido + 1); return; }
    if (e.id === 'demuestra' && iReto < c.retos.length - 1) { mostrarReto(iReto + 1); return; }
    if (e.seguir) irA(etapa + 1); else location.href = destinoFinal;
  };
  const retroceder = () => {
    const e = ETAPAS[etapa];
    if (enMira() && escena.estado().paso > 0) { escena.retroceder(); return; }
    if (e.id === 'entiende' && iLatido > 0) { mostrarLatido(iLatido - 1); return; }
    if (e.id === 'demuestra' && iReto > 0) { mostrarReto(iReto - 1); return; }
    irA(etapa - 1);
  };
  seguir.addEventListener('click', adelante);
  atras.addEventListener('click', retroceder);
  document.addEventListener('keydown', (ev) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName) || document.querySelector('.cine') || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { if (tarjeta) tarjeta.hidden = true; }
    if (ev.key === 'ArrowRight' || (ev.key === 'Enter' && !/^(BUTTON|A|SUMMARY)$/.test(ev.target.tagName))) { ev.preventDefault(); adelante(); }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); retroceder(); }
  });

  // --- tu lugar: «Continuar» y recargar te devuelven exactamente aquí; abrir la parada desde la lista, al principio
  const parametros = new URLSearchParams(location.search), recargada = performance.getEntriesByType?.('navigation')[0]?.type === 'reload';
  const vuelve = (parametros.has('seguir') || recargada) && !parametros.has('paso') ? lugar.de(c.id) : null;
  listaRetos.addEventListener('input', (ev) => { const r = ev.target.closest?.('[data-reto-id]')?.dataset.retoId; if (r) { borradores[r] = ev.target.value; guardarLugar(); } });
  tarjetas.forEach((t, i) => { t.dataset.retoId = c.retos[i].id; const campo = t.querySelector('input[type=text]'); if (campo && vuelve?.borradores?.[c.retos[i].id]) { campo.value = vuelve.borradores[c.retos[i].id]; borradores[c.retos[i].id] = campo.value; } });
  const pedido = location.hash.slice(1), iPedido = ETAPAS.findIndex((e) => e.id === pedido);
  etapa = vuelve ? vuelve.etapa ?? 0 : iPedido >= 0 ? iPedido : parametros.has('paso') ? 1 : 0;
  if (vuelve) {
    iReto = Math.min(c.retos.length - 1, vuelve.reto ?? 0);
    tope = Math.min(latidos.length - 1, vuelve.tope ?? 0);
    escena.colocar({ paso: vuelve.paso, entradas: vuelve.entradas });
    if ((vuelve.latido ?? -1) >= 0) mostrarLatido(Math.min(latidos.length - 1, vuelve.latido), false);
  }
  listo = true;
  aplicarEtapa();
  if (vuelve?.scroll) latidoMarco.scrollTop = vuelve.scroll;
  pintarTex(app);
  return { escena, progreso, irA, leerTodo: () => { mostrarLatido(latidos.length - 1, false); } };
}

/** El mejor sitio disponible para las notas: localStorage; si no, sessionStorage; si no, window.name, que dura en la pestaña. */
export function tryLocal() {
  for (const k of ['localStorage', 'sessionStorage']) {
    try { const a = window[k]; a.setItem('penumbra-prueba', '1'); a.removeItem('penumbra-prueba'); return a; } catch { /* bloqueado: se prueba el siguiente */ }
  }
  const leer = () => { try { return JSON.parse(window.name) || {}; } catch { return {}; } };
  return {
    getItem: (c) => leer()[c] ?? null,
    setItem: (c, v) => { const d = leer(); d[c] = String(v); window.name = JSON.stringify(d); },
    removeItem: (c) => { const d = leer(); delete d[c]; window.name = JSON.stringify(d); },
  };
}
