// La portada: un terreno con una colina por región, cuya altura y color cuentan cuánto dominas cada una.
import { CATALOGO } from '../contenido/catalogo.js';
import { crearProgreso } from '../nucleo/progreso.js';
import { siguienteConcepto } from '../nucleo/recorrido.js';
import { alturaMapa, regionEn } from './alturaMapa.js';
import { crearTaller } from '../nucleo/taller.js';
import { crearLugar, describirLugar } from '../nucleo/lugar.js';
import { buscarConcepto } from '../contenido/catalogo.js';
import { barraGrado, h, tituloDifuso, tryLocal } from './concepto.js';
import { soportaGL2 } from './lienzo.js';
import { camaraLibre, camaraMapa, crearPaisaje, proyectar } from './mapaGL.js';
import { LUNA_D, LUNA_R } from './lunaGL.js';
import { DURA_ECLIPSE, ECLIPSE_REPOSO, OFFSET_LUNA, guionEclipse } from '../nucleo/caida.js';
import { DURA_CRUCE, crearRed, crearVuelo, guionCruce } from './mapaRed.js';
import { DURA_NACER, DURA_VIAJE, formulaNacer, guionNacer, guionViaje } from './mapaGuion.js';
import { ev, mix } from './tiempo.js';

const ESCZ = 0.46, AMP = (g) => 0.32 + 0.17 * g;
const CLAVE_NACIO = 'penumbra-mapa-nacio';
const haNacido = () => { try { return !!sessionStorage.getItem(CLAVE_NACIO); } catch { return true; } };
const marcarNacido = () => { try { sessionStorage.setItem(CLAVE_NACIO, '1'); } catch { /* sin almacenamiento */ } };
const coma = (v) => v.toFixed(2).replace('.', ',');
const ETAPA_FINAL = 5; // índice de «Lo siguiente»: quien llega a «Lo siguiente» ya terminó esa parada: el mapa propone la próxima

function listaConceptos(region, progreso) {
  const proximo = siguienteConcepto([region], progreso)?.id;
  return h('ul', { className: 'mapa-conceptos' }, region.conceptos.map((c) => {
    const g = progreso.gradoConcepto(c.id, c.retos);
    if (c.estado !== 'listo') return h('li', { className: 'pendiente' }, h('span', { textContent: c.titulo }), h('small', { textContent: 'aún no' }));
    const fila = h('li', { className: c.id === proximo ? 'proximo' : g >= 0.7 ? 'dominado' : '' }, h('a', { href: `concepto.html?c=${c.id}`, textContent: c.titulo }), h('small', { textContent: c.id === proximo ? 'te toca' : coma(g) }));
    fila.style.setProperty('--g', String(g));
    return fila;
  }));
}

function listaPlana(raiz, catalogo, progreso) {
  raiz.append(h('div', { className: 'mapa-lista' }, catalogo.map((r) => h('section', {}, h('h2', { textContent: `${r.id}. ${r.titulo}` }), h('p', { textContent: r.lema }), listaConceptos(r, progreso)))));
}

/** El péndulo siempre está a mano, con lo que lleves construido. */
function tuPendulo(almacen) {
  const t = crearTaller(almacen).leer(), piezas = [];
  if (t.anchoAngulo) piezas.push(`«inclinado» a ${String(t.anchoAngulo).replace('.', ',')}°`);
  if (t.normaY) piezas.push(`«y» ${t.normaY}`);
  if (t.fuerzaMaxima) piezas.push(`fuerza ${t.fuerzaMaxima.toFixed(1).replace('.', ',')}`);
  return h('div', { className: 'tu-pendulo' },
    h('p', { className: 'tenue', textContent: piezas.length ? `En tu taller: ${piezas.join(', ')}.` : 'Tu taller está vacío: los retos del péndulo le van añadiendo piezas.' }),
    h('a', { className: 'enlace-pendulo', href: 'concepto.html?c=6-6-pendulo#toca', textContent: 'Probar tu péndulo' }));
}

export function montarMapa(raiz, { catalogo: todas = CATALOGO, almacen = tryLocal() } = {}) {
  const progreso = crearProgreso(almacen), parametrosUrl = new URLSearchParams(location.search);
  // el mapa tiene dos lados: la noche, con el curso, y el amanecer, con la lógica difusa dentro de las redes
  const idViaje = parametrosUrl.get('viaje'), viaje = idViaje ? buscarConcepto(idViaje, todas) : null;
  const lado = viaje ? (viaje.region.lado ?? 'noche') : parametrosUrl.get('lado') === 'alba' ? 'alba' : 'noche', esAlba = lado === 'alba';
  const catalogo = todas.filter((r) => (r.lado ?? 'noche') === lado);
  const cabecera = h('header', { className: 'mapa-cabecera' }, tituloDifuso(esAlba ? 'Amanecer' : 'Penumbra'), h('p', { className: 'lema', textContent: esAlba ? 'La misma lógica, dentro de las redes neuronales.' : 'Un camino por la lógica difusa: de lo que tiene borde a lo que no.' }));
  const pagina = h('main', { className: 'portada' });
  raiz.replaceChildren(pagina);
  pagina.append(cabecera);
  const pie = () => {
    const zona = h('div', { className: 'mapa-pie' });
    const inicio = h('button', { type: 'button', textContent: 'Empezar de cero' });
    inicio.addEventListener('click', () => {
      const si = h('button', { type: 'button', className: 'peligro', textContent: 'Sí, borrar todo' }), no = h('button', { type: 'button', textContent: 'Cancelar' });
      si.addEventListener('click', () => { progreso.reiniciar(); crearLugar(almacen).olvidar(); zona.replaceChildren(inicio, verNacer); alCambiar(); });
      no.addEventListener('click', () => zona.replaceChildren(inicio, verNacer));
      zona.replaceChildren(h('span', { textContent: 'Se borrarán todas tus notas. ¿Seguro?' }), si, no);
    });
    const verNacer = esAlba ? h('span', {}, h('a', { href: 'index.html?lado=alba&cruce=1', textContent: 'Ver otra vez el cruce' }), h('a', { href: 'index.html', textContent: 'Volver a la noche' }), soportaGL2() ? null : h('a', { href: 'horizonte.html', textContent: 'El Horizonte' })) : h('a', { href: 'index.html?nacer=1', textContent: 'Ver cómo nace el mapa' });
    zona.append(inicio, verNacer);
    return zona;
  };
  let alCambiar = () => {};

  if (!soportaGL2()) {
    listaPlana(pagina, todas, progreso);
    pagina.append(pie());
    alCambiar = () => { pagina.querySelector('.mapa-lista').remove(); listaPlana(pagina, todas, progreso); };
    return null;
  }

  const zonaMapa = h('div', { className: 'mapa-lienzo' }), panel = h('aside', { className: 'mapa-panel' }), cuerpoPanel = h('div', { className: 'panel-cuerpo' });
  const indice = h('nav', { className: 'mapa-indice', ariaLabel: 'Capítulos' });
  panel.append(cuerpoPanel, pie());
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Paisaje de montañas, una por cada capítulo del curso. Cuanto más dominas un capítulo, más alta y dorada es su montaña.');
  const capaRotulos = h('div', { className: 'mapa-rotulos' });
  zonaMapa.append(canvas, capaRotulos);
  pagina.prepend(zonaMapa);
  pagina.append(indice, panel);

  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // cuatro modos: el viaje entre capítulos, el cruce al amanecer, el mapa que nace de su fórmula, y el mapa normal
  if (viaje && reducido) { location.replace(`concepto.html?c=${idViaje}`); return null; }
  // si el navegador dibuja por CPU, no hay GPU que aproveche: menos resolución y nada de movimiento en reposo
  const software = (() => { const c = document.createElement('canvas').getContext('webgl2'), d = c?.getExtension('WEBGL_debug_renderer_info'); return d ? /swiftshader|llvmpipe|software/i.test(c.getParameter(d.UNMASKED_RENDERER_WEBGL)) : false; })();
  const pais = crearPaisaje(canvas, { software, luna: !esAlba });
  let modo = viaje ? 'viaje' : esAlba ? (!reducido && parametrosUrl.has('cruce') ? 'cruce' : 'normal') : (!reducido && (parametrosUrl.has('nacer') || !haNacido())) ? 'nace' : 'normal';
  let t = reducido ? 9 : 0, enfocada = null, fijada = null, mapaSucio = true;
  const INICIO = { yaw: -0.22, pitch: 0.39 };
  let camara = { ...INICIO }, zoom = 1;
  const camaraValida = (c) => ({ yaw: Math.max(-0.95, Math.min(0.55, c.yaw)), pitch: Math.max(0.2, Math.min(1.05, c.pitch)) });

  // lo que solo cambia con el progreso se calcula una vez, no en cada cuadro
  let gradosC = null, cimasC = null, sigC;
  const grados = () => (gradosC ??= catalogo.map((r) => progreso.gradoRegion(r.id, catalogo)));
  const cimaDe = (r, g) => { cimasC ??= new Map(); if (!cimasC.has(r.id)) cimasC.set(r.id, [r.posicion[0], r.posicion[1], alturaMapa(r.posicion[0], r.posicion[1], g, catalogo, 1) * ESCZ]); return cimasC.get(r.id); };

  /** El camino: pasa por todas las cimas, en orden, y por donde va el curso se enciende. */
  const puntosCamino = () => {
    const pts = [], pos = catalogo.map((r) => r.posicion);
    for (let i = 0; i + 1 < pos.length; i++) {
      const a = pos[Math.max(0, i - 1)], b = pos[i], c = pos[i + 1], d = pos[Math.min(pos.length - 1, i + 2)];
      for (let k = 0; k < 44; k++) {
        const u = k / 44, cr = (j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * u * u + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * u * u * u);
        pts.push([cr(0), cr(1)]);
      }
    }
    pts.push(pos.at(-1));
    return pts;
  };
  const todosPuntos = puntosCamino();
  pais.fijarCamino(todosPuntos, 0.0058);
  let huellaCampo = '';
  const regsDe = (g, cada = () => 1) => { const d = new Float32Array(32); for (let i = 0; i < 8; i++) { const r = catalogo[i]; d.set(r ? [r.posicion[0], r.posicion[1], AMP(g[i]) * cada(i), g[i]] : [-9, -9, 0, 0], i * 4); } return d; };
  const fijarCampo = () => { const g = grados(), k = g.join(); if (k !== huellaCampo) { huellaCampo = k; pais.fijarCampo(regsDe(g), catalogo, g); pais.hornearLuz(sol()); } };

  // --- rótulos: texto de verdad, nítido, y que se puede usar con teclado
  const rotulos = catalogo.map((r) => {
    const b = h('button', { type: 'button', className: 'mapa-rotulo' }, h('span', { className: 'rotulo-titulo', textContent: r.titulo }), h('span', { className: 'rotulo-lema', textContent: r.lema }));
    b.addEventListener('click', (ev2) => { if (ev2.detail === 0) abrir(r.id); });
    capaRotulos.append(b);
    return b;
  });

  // --- encuadre: todo el camino a la izquierda del panel; al elegir un capítulo, se acerca a su montaña
  const vistaGeneral = () => ({ objetivo: [0.5, 0.53, 0.1], dist: 1.72 * Math.max(1, 1.5 / (innerWidth / innerHeight)) * zoom, corrimiento: innerWidth > 900 ? -0.27 : 0, alzado: -0.46 });
  const vistaDe = (id) => { const r = catalogo.find((x) => x.id === id), [x, y, z] = cimaDe(r, grados(), 1); return { objetivo: [x, y, z * 0.55], dist: 1.12 * zoom, corrimiento: innerWidth > 900 ? -0.3 : 0, alzado: -0.2 }; };
  const objetivoVista = () => (fijada ? vistaDe(fijada) : vistaGeneral());
  let vista = objetivoVista(), vuelo = null, vpActual = null, ojoActual = null, huellaRotulos = '';

  let centrosC = null, vpDeCentros = null, wDeCentros = 0;
  const centros = () => {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (centrosC && vpDeCentros === vpActual && wDeCentros === W) return centrosC;
    const g = grados(); vpDeCentros = vpActual; wDeCentros = W;
    return (centrosC = catalogo.map((r, i) => { const [x, y] = proyectar(vpActual, modo === 'cruce' ? posNeuronaRuta(i) : cimaDe(r, g)); return [x * W, y * H + (modo === 'cruce' && t <= 42.6 ? (i % 2 ? -36 : 36) : 0)]; }));
  };

  function colocarRotulos() {
    const cs = centros(), aparece = modo === 'nace' ? guionNacer(t).rotulos : modo === 'viaje' ? 0 : modo === 'cruce' ? Math.max(guionCruce(t).nombres, guionCruce(t).rotulos) : ev(t, 0.35, 1.1), activos = catalogo.map((r) => enfocada === r.id || fijada === r.id), clave = cs.flat().map((v) => v.toFixed(1)).join() + activos.join() + aparece.toFixed(2);
    if (clave === huellaRotulos) return;
    huellaRotulos = clave;
    rotulos.forEach((b, i) => {
      b.style.transform = `translate(${cs[i][0].toFixed(1)}px, ${cs[i][1].toFixed(1)}px) translate(-50%, -100%)`;
      b.style.opacity = String(aparece);
      b.classList.toggle('activa', activos[i]);
      b.classList.toggle('apagada', !!fijada && !activos[i]);
    });
  }

  const sig = () => { if (sigC === undefined) sigC = siguienteConcepto(catalogo, progreso); return sigC; };
  function datosFaros() {
    const g = grados(), s = sig(), d = new Float32Array(catalogo.length * 6), aparece = modo === 'nace' ? guionNacer(t).camino : 1, llegaA = modo === 'viaje' ? guionViaje(t).llega : 0;
    catalogo.forEach((r, i) => d.set([...cimaDe(r, g), g[i], (modo === 'viaje' ? (r.id === viaje.region.id ? llegaA * 1.6 : 0) : ((enfocada === r.id || fijada === r.id) ? 1 : 0) * aparece), (modo === 'viaje' ? 0 : s?.region.id === r.id ? 1 : 0) * aparece], i * 6));
    return d;
  }
  /** Hasta dónde se ha andado: la fracción del camino hasta la región de tu siguiente parada. */
  const hecho = () => { const s = sig(), i = s ? catalogo.findIndex((r) => r.id === s.region.id) : catalogo.length - 1; return i / (catalogo.length - 1); };

  // nitidez: la escena se dibuja con muchos más píxeles que la pantalla, hasta donde la máquina aguante
  let escala = software ? 1 : Math.max(1, Math.min(2, Math.sqrt(5.2e6 / Math.max(1, innerWidth * innerHeight * (devicePixelRatio || 1) ** 2))));
  const CAM_PLANO = { yaw: -0.72, pitch: 0.78, dist: 2.25, objetivo: [0.5, 0.5, 0.06], corrimiento: 0, alzado: 0 };
  const mezclaCam = (a, b, k) => ({ yaw: mix(a.yaw, b.yaw, k), pitch: mix(a.pitch, b.pitch, k), dist: mix(a.dist, b.dist, k), objetivo: a.objetivo.map((v, i) => mix(v, b.objetivo[i], k)), corrimiento: mix(a.corrimiento, b.corrimiento, k), alzado: mix(a.alzado, b.alzado, k) });
  function camaraActual() {
    if (modo === 'nace') {
      const g = guionNacer(t), fin = { ...camaraValida(camara), ...vistaGeneral() };
      return mezclaCam({ ...CAM_PLANO, yaw: CAM_PLANO.yaw + Math.min(t, 11) * 0.016 }, fin, g.giro);
    }
    if (modo === 'viaje') return camaraViaje();
    return { ...camaraValida(camara), ...(vuelo ? vuelo(t) : vista) };
  }
  /** La luz de la luna: se mueve tan despacio que la penumbra respira. */
  function sol() { const az = (esAlba ? 1.16 : 1.24) + (reducido ? 0 : 0.05 * Math.sin(t / 26)), el = esAlba ? 0.115 : 0.26, c = Math.cos(el); return [Math.cos(az) * c, Math.sin(az) * c, Math.sin(el)]; }
  fijarCampo();
  let solActual = sol(), huellaCamara = '';
  function pintar(rehacer = true) {
    const W = canvas.clientWidth || 1, H = canvas.clientHeight || 1, dpr = devicePixelRatio || 1;
    pais.ajustar(Math.round(W * dpr), Math.round(H * dpr), Math.max(2, Math.round(W * dpr * escala)), Math.max(2, Math.round(H * dpr * escala)));
    if (rehacer) {
      const { vp, ojo } = modo === 'cruce' ? camaraCruce(W / H, t) : modo === 'luna' ? camaraLuna(W / H) : modo === 'eclipse' ? camaraEclipse(W / H) : camaraMapa({ ...camaraActual(), aspecto: W / H });
      vpActual = vp; ojoActual = ojo;
    }
    const vp = vpActual, ojo = ojoActual;
    const foco = enfocada ?? fijada, rf = catalogo.find((r) => r.id === foco), g = grados(), comun = { vp, ojo, sol: solActual, t, rehacer, alba: esAlba ? 1 : 0, faros: datosFaros(), eclipse: esAlba ? ECLIPSE_REPOSO : 0, disco: esAlba && modo === 'normal' ? discoPantalla(solActual, ECLIPSE_REPOSO) : undefined };
    if (modo === 'nace') {
      const gu = guionNacer(t);
      pais.hornearNace(gu, regsDe(g, (i) => gu.s[i]));
      pais.dibujar({ ...comun, expo: 1, foco: [0, 0, 0, 0], hecho: hecho(), aparece: gu.camino, nace: gu });
      pintarNacimiento(gu);
      if (t >= DURA_NACER) terminarNacimiento();
    } else if (modo === 'luna') {
      const u = t - lunaDesde.t;
      pais.dibujar({ ...comun, rehacer: true, haloLuna: 1 - ev(u, 0.3, 2.6), expo: 1 - ev(u, DURA_LUNA - 0.55, DURA_LUNA - 0.05), foco: [0, 0, 0, 0], hecho: hecho(), aparece: 1 - ev(u, 0, 1) });
      if (u >= DURA_LUNA) { modo = 'saliendo'; location.href = 'index.html?lado=alba&cruce=1'; }
    } else if (modo === 'eclipse') {
      const u = t - eclipseDesde.t, g = guionEclipse(u);
      pais.dibujar({ ...comun, rehacer: true, disco: discoPantalla(solEclipse(g.sube), g.cubre), solCielo: solEclipse(g.sube), eclipse: g.cubre, eclipseK: 1 / g.expo, expo: g.expo, foco: [0, 0, 0, 0], hecho: hecho(), aparece: 1 - ev(u, 0, 1) });
      puenteEclipse.style.opacity = String(g.puente);
      if (u >= DURA_ECLIPSE) { modo = 'saliendo'; location.href = 'horizonte.html?entrada=eclipse'; }
    } else if (modo === 'saliendo') { /* ya está cargando la página siguiente */
    } else if (modo === 'cruce') {
      const gu = guionCruce(t);
      pais.dibujar({ ...comun, rehacer: true, alba: gu.alba, sinTerreno: gu.suelo <= 0, expo: gu.negro, foco: [0, 0, 0, 0], hecho: hecho(), aparece: gu.camino, faros: gu.camino > 0 ? comun.faros : new Float32Array(0),
        cielo: gu.suelo, nebula: gu.nebula, solCielo: solAlba(gu.alba), eclipse: ECLIPSE_REPOSO * ev(t, DURA_CRUCE - 6, DURA_CRUCE - 1),
        red: { orden: 1, baja: 0, ola: gu.ola, oro: gu.oroRuta, vuelo: recorrido.en(t).u, aristas: gu.aristas, fondo: gu.suelo, fuerza: gu.fuerza, hilos: gu.hilos, polvo: gu.polvo, lejos: gu.lejos, vpPrevio: camaraCruce(W / H, t - 1 / 60).vp, estela: 1 - gu.retro * 0.85 } });
      pintarCruce(gu);
      if (t >= DURA_CRUCE) terminarCruce();
    } else if (modo === 'viaje') {
      const gu = guionViaje(t), u = uDeViaje(gu);
      pais.dibujar({ ...comun, expo: gu.expo, foco: [0, 0, 0, 0], hecho: u, aparece: 1, cometa: [u, 1 - gu.tarjeta * 0.7] });
      pintarViaje(gu);
      if (t >= DURA_VIAJE) salirDeViaje();
    } else {
      pais.dibujar({ ...comun, expo: ev(t, 0, 0.8) * (vuelo ? 1 - 0.8 * ev(t - t0Vuelo, 0.4, 0.9) : 1), foco: rf ? [rf.posicion[0], rf.posicion[1], 0, 1] : [0, 0, 0, 0], hecho: hecho(), aparece: 1 });
    }
    colocarRotulos();
    colocarChispa();
    colocarPuertaSol();
  }

  // --- el cruce: entras en la luz, vuelas de neurona en neurona, y al alejarte ves la red entera
  const red = modo === 'cruce' ? crearRed(catalogo.map((r) => cimaDe(r, grados()))) : null;
  if (red) pais.fijarRed(red);
  const mixV = (a, b, k) => a.map((v, i) => mix(v, b[i], k));
  const posNeuronaRuta = (i) => { const n = red.nodos[red.ruta[i + 1]]; return t > 42.6 ? n.cima : n.orden; };
  const recorrido = red ? crearVuelo(red) : null;
  /** El sol sube de verdad durante el cruce: al principio aún está bajo el horizonte. */
  const solAlba = (k) => { const az = 1.16 + (reducido ? 0 : 0.05 * Math.sin(t / 26)), el = mix(-0.075, 0.115, k), c = Math.cos(el); return [Math.cos(az) * c, Math.sin(az) * c, Math.sin(el)]; };
  /** Función pura del tiempo: una sola curva de principio a fin, y al final se suelta hacia la vista del mapa. */
  function camaraCruce(aspecto, T) {
    const gu = guionCruce(T), f = recorrido.en(T), mira = f.ojo.map((v, i) => v + f.dir[i]), v = vistaGeneral(), general = camaraMapa({ ...INICIO, ...v, aspecto });
    return camaraLibre({ ojo: mixV(f.ojo, general.ojo, gu.giro), mira: mixV(mira, v.objetivo, gu.giro), aspecto, fov: mix(f.fov, 38, gu.giro), alabeo: f.alabeo * (1 - gu.giro), corrimiento: v.corrimiento * gu.giro, alzado: v.alzado * gu.giro });
  }
  const capaCruce = h('div', { className: 'mapa-cruce' }), lineasCruce = [], tituloCruce = h('div', { className: 'cruce-titulo' }, tituloDifuso('Amanecer', 'h2'), h('p', { textContent: 'La misma lógica, dentro de las redes neuronales.' })), hud = h('div', { className: 'cruce-hud' }), saltaCruce = h('button', { type: 'button', className: 'nace-saltar', textContent: 'Saltar' });
  if (red) guionCruce(0).textos.forEach(([x]) => { const p = h('p', { className: 'cruce-texto', textContent: x }); lineasCruce.push(p); capaCruce.append(p); });
  capaCruce.append(hud, tituloCruce, saltaCruce);
  let hudActual = -1;
  function pintarCruce(gu) {
    gu.textos.forEach(([, a], i) => { lineasCruce[i].style.opacity = String(a); });
    tituloCruce.style.opacity = String(gu.titulo); tituloCruce.style.setProperty('--b', String(1 - gu.titulo));
    pagina.style.setProperty('--ui', String(gu.ui));
    // al pasar junto a una neurona, se lee lo que calcula de verdad
    const u = recorrido.en(t).u, k = Math.round(u), cerca = Math.abs(u - k) < 0.3 && gu.retro < 0.01 && k >= 0 && k < red.ruta.length;
    hud.style.opacity = cerca ? '1' : '0';
    if (cerca) {
      const n = red.nodos[red.ruta[k]], [a, b] = proyectar(vpActual, n.orden);
      if (k !== hudActual) { hudActual = k; if (window.katex) window.katex.render(String.raw`\sigma(w \cdot x + b) = ${n.activ.toFixed(2).replace('.', '{,}')}`, hud, { throwOnError: false, strict: false }); }
      hud.style.transform = `translate(${(a * canvas.clientWidth + 74).toFixed(0)}px, ${(b * canvas.clientHeight - 14).toFixed(0)}px)`;
    }
  }
  function terminarCruce() {
    if (modo !== 'cruce') return;
    try { localStorage.setItem('penumbra-alba-visto', '1'); } catch { /* sin almacenamiento */ }
    modo = 'normal';
    t = Math.max(t, 2);
    capaCruce.remove();
    pagina.classList.remove('cruzando');
    pagina.style.removeProperty('--ui');
    history.replaceState(null, '', 'index.html?lado=alba');
    centrosC = null; mapaSucio = true;
    pintar();
  }
  saltaCruce.addEventListener('click', (ev2) => { ev2.stopPropagation(); terminarCruce(); });

  // --- la Luna es la puerta: en su sombra parpadea una luz, y al tocarla la cámara entra en esa sombra
  const aroLuna = h('span', { className: 'luna-aro' }), chispa = h('button', { type: 'button', className: 'mapa-chispa', ariaLabel: 'Toca la Luna: lleva a la ruta del amanecer' }, aroLuna), R_LUNA = LUNA_R;
  /** La dirección exacta de un punto de la Luna, en su propio plano: el mismo cálculo que el cielo. */
  const dirLuna = (qx, qy) => {
    const luna = LUNA_D;
    const n = Math.hypot(luna[1], luna[0]), x = [luna[1] / n, -luna[0] / n, 0], y = [x[1] * luna[2], -x[0] * luna[2], x[0] * luna[1] - x[1] * luna[0]];
    return [0, 1, 2].map((i) => luna[i] + (x[i] * qx + y[i] * qy) * R_LUNA);
  };
  function colocarChispa() {
    if (esAlba || modo === 'cruce' || modo === 'viaje' || modo === 'nace') { chispa.hidden = true; return; }
    const P = (d) => [0, 1, 2].map((i) => ojoActual[i] + d[i] * 12), W = canvas.clientWidth, H = canvas.clientHeight;
    const [a, b] = proyectar(vpActual, P(dirLuna(0.88, 0.2))), [c, e] = proyectar(vpActual, P(dirLuna(0, 0)));
    chispa.hidden = !(a > 0 && a < 1 && b > 0 && b < 1);
    const rPx = Math.hypot((a - c) * W, (b - e) * H) / 0.902;
    chispa.style.setProperty('--r', `${Math.max(16, rPx).toFixed(1)}px`);
    chispa.style.setProperty('--cx', `${((c - a) * W).toFixed(1)}px`);
    chispa.style.setProperty('--cy', `${((e - b) * H).toFixed(1)}px`);
    chispa.style.transform = `translate(${(a * W).toFixed(1)}px, ${(b * H).toFixed(1)}px)`;
  }
  // --- el sol es la puerta del amanecer: giras hacia él, la Luna lo tapa, y su sombra es la de un agujero negro
  let eclipseDesde = null;
  const puenteEclipse = h('div', { className: 'eclipse-puente' }), puertaSol = h('button', { type: 'button', className: 'mapa-chispa puerta-sol', ariaLabel: 'Toca el sol: lleva al Horizonte' }, h('span', { className: 'luna-aro' }));
  puenteEclipse.style.opacity = '0';
  const solEclipse = (k) => { const az = eclipseDesde.az, el = mix(0.115, 0.33, k), c = Math.cos(el); return [Math.cos(az) * c, Math.sin(az) * c, Math.sin(el)]; };
  const dirSol = (s) => { const l = Math.hypot(s[0], s[1], s[2] * 0.36); return [s[0] / l, s[1] / l, (s[2] * 0.36) / l]; };
  function camaraEclipse(aspecto) {
    const g = guionEclipse(t - eclipseDesde.t), d = dirSol(solEclipse(g.sube)), mira = eclipseDesde.ojo.map((v, i) => v + d[i] * 12);
    return camaraLibre({ ojo: eclipseDesde.ojo, mira: mixV(eclipseDesde.mira, mira, g.gira), aspecto, fov: g.fov, alabeo: g.alabeo, corrimiento: eclipseDesde.corr * (1 - g.gira), alzado: eclipseDesde.alz * (1 - g.gira) });
  }
  function irAlEclipse() {
    if (reducido) { location.href = 'horizonte.html'; return; }
    if (modo === 'eclipse') return;
    const c = camaraActual(), { ojo } = camaraMapa({ ...c, aspecto: canvas.clientWidth / canvas.clientHeight });
    eclipseDesde = { t, ojo, mira: c.objetivo, corr: c.corrimiento, alz: c.alzado, az: Math.atan2(solActual[1], solActual[0]) };
    modo = 'eclipse';
    pagina.classList.add('a-la-luna');
    puertaSol.hidden = true;
    pagina.append(puenteEclipse);
  }
  puertaSol.addEventListener('pointerdown', (ev2) => ev2.stopPropagation());
  puertaSol.addEventListener('click', (ev2) => { ev2.stopPropagation(); irAlEclipse(); });
  /** Dónde cae el disco en la pantalla: [u, v (hacia arriba), radio en alturas de pantalla, aspecto]. */
  function discoPantalla(solD, cubre) {
    const d = dirSol(solD), n = Math.hypot(d[0], d[1]), ex = [d[1] / n, -d[0] / n, 0], ey = [ex[1] * d[2], -ex[0] * d[2], ex[0] * d[1] - ex[1] * d[0]], k = 1 - cubre, en = (rx, ry) => { const w = [0, 1, 2].map((i) => d[i] + ex[i] * (OFFSET_LUNA[0] * k + rx) + ey[i] * (OFFSET_LUNA[1] * k + ry)); return proyectar(vpActual, w.map((x, i) => ojoActual[i] + x * 12)); };
    const [a, b] = en(0, 0), [c2, e2] = en(0.0262, 0), W = canvas.clientWidth, H = canvas.clientHeight;
    return [a, 1 - b, Math.hypot((c2 - a) * W, (e2 - b) * H) / H, W / H];
  }
  function colocarPuertaSol() {
    if (!esAlba || modo !== 'normal') { puertaSol.hidden = true; return; }
    // la puerta es el disco negro: el mismo cálculo que el cielo, y late igual que la Luna
    const [u, v, rv] = discoPantalla(solActual, ECLIPSE_REPOSO), a = u, b = 1 - v, W = canvas.clientWidth, H = canvas.clientHeight, rPx = rv * H;
    puertaSol.hidden = !(a > 0.02 && a < 0.98 && b > 0.02 && b < 0.98);
    puertaSol.style.setProperty('--r', `${Math.max(20, rPx * 1.25).toFixed(1)}px`); puertaSol.style.setProperty('--cx', '0px'); puertaSol.style.setProperty('--cy', '0px');
    puertaSol.style.transform = `translate(${(a * W).toFixed(1)}px, ${(b * H).toFixed(1)}px)`;
  }
  let lunaDesde = null;
  const DURA_LUNA = 4.4;
  /** Hacia la Luna: se aparta la mirada del mapa, y se estrecha el campo de visión hasta que la sombra llena toda la pantalla. */
  function camaraLuna(aspecto) {
    const k = ev(t - lunaDesde.t, 0, DURA_LUNA), kg = ev(t - lunaDesde.t, 0, DURA_LUNA * 0.6), d = dirLuna(0.88, 0.2), mira = lunaDesde.ojo.map((v, i) => v + d[i] * 12);
    const inicioMira = lunaDesde.mira, m = inicioMira.map((v, i) => mix(v, mira[i], kg));
    return camaraLibre({ ojo: lunaDesde.ojo, mira: m, aspecto, fov: 38 * Math.exp(Math.log(1.1 / 38) * k * k * (3 - 2 * k)), corrimiento: lunaDesde.corr * (1 - kg), alzado: lunaDesde.alz * (1 - kg) });
  }
  chispa.addEventListener('pointerdown', (ev2) => ev2.stopPropagation());
  chispa.addEventListener('click', (ev2) => {
    ev2.stopPropagation();
    if (reducido) { location.href = 'index.html?lado=alba'; return; }
    const c = camaraActual(), { ojo } = camaraMapa({ ...c, aspecto: canvas.clientWidth / canvas.clientHeight });
    lunaDesde = { t, ojo, mira: c.objetivo, corr: c.corrimiento, alz: c.alzado };
    modo = 'luna';
    pagina.classList.add('a-la-luna');
  });

  // --- el nacimiento: el mapa sale de su fórmula, término a término
  const capaNacer = h('div', { className: 'mapa-nace' }), formulaEl = h('div', { className: 'nace-formula' }), textoEl = h('p', { className: 'nace-texto' }), saltar = h('button', { type: 'button', className: 'nace-saltar', textContent: 'Saltar' });
  const trazos = document.createElement('canvas');
  trazos.className = 'nace-trazos';
  capaNacer.append(trazos, formulaEl, textoEl, saltar);
  let texAnterior = null, textoAnterior = null;
  /** Ejes, marcas y centros, en un lienzo encima: líneas finas y texto nítido, a la resolución de la pantalla. */
  function pintarTrazos(gu) {
    const W = canvas.clientWidth, H = canvas.clientHeight, dpr = devicePixelRatio || 1;
    if (trazos.width !== Math.round(W * dpr)) { trazos.width = Math.round(W * dpr); trazos.height = Math.round(H * dpr); }
    const c = trazos.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const al = gu.trazos; if (al <= 0.001) { trazos.style.display = 'none'; return; }
    trazos.style.display = '';
    const P = (x, y, z) => { const [a, b] = proyectar(vpActual, [x, y, z]); return [a * W, b * H]; };
    c.lineCap = 'round'; c.font = 'italic 19px Lectura, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const eje = (fin, nombre) => {
      const k = gu.ejes, o = P(0, 0, 0), a = P(fin[0] * 1.14 * k, fin[1] * 1.14 * k, fin[2] * 0.56 * k);
      c.globalAlpha = al * Math.min(1, k * 3); c.strokeStyle = '#d7dee6'; c.fillStyle = '#e9eef2'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(...o); c.lineTo(...a); c.stroke();
      const ang = Math.atan2(a[1] - o[1], a[0] - o[0]);
      c.beginPath(); c.moveTo(...a); c.lineTo(a[0] - 11 * Math.cos(ang - 0.32), a[1] - 11 * Math.sin(ang - 0.32)); c.lineTo(a[0] - 11 * Math.cos(ang + 0.32), a[1] - 11 * Math.sin(ang + 0.32)); c.closePath(); c.fill();
      if (k > 0.9) c.fillText(nombre, a[0] + 16 * Math.cos(ang), a[1] + 16 * Math.sin(ang));
      for (let m = 0.25; m <= 1 && k * 1.14 > m && fin[2] === 0; m += 0.25) {
        const q = P(fin[0] * m, fin[1] * m, 0), nx = -Math.sin(ang), ny = Math.cos(ang);
        c.beginPath(); c.moveTo(q[0] - nx * 5, q[1] - ny * 5); c.lineTo(q[0] + nx * 5, q[1] + ny * 5); c.stroke();
      }
    };
    eje([1, 0, 0], 'x'); eje([0, 1, 0], 'y'); eje([0, 0, 1], 'z');
    const g = grados();
    catalogo.forEach((r, i) => {
      const s = gu.s[i]; if (s <= 0) return;
      const altoK = AMP(g[i]) * s + 0.05, base = P(r.posicion[0], r.posicion[1], 0), cima = P(r.posicion[0], r.posicion[1], altoK * ESCZ);
      const brote = Math.min(1, s * 2);
      c.globalAlpha = al * brote * 0.9; c.setLineDash([3, 5]); c.lineWidth = 1; c.strokeStyle = '#e9eef2';
      c.beginPath(); c.moveTo(...base); c.lineTo(...cima); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#58c4dd'; c.beginPath(); c.arc(cima[0], cima[1], 3.2, 0, 7); c.fill();
      c.fillStyle = '#f0f4f7'; c.font = 'italic 16px Lectura, Georgia, serif'; c.fillText(`c${'₁₂₃₄₅₆₇₈'[i]}`, cima[0], cima[1] - 16);
      c.font = '14px Lectura, Georgia, serif'; c.fillStyle = '#b9c5ce'; c.fillText(r.titulo, cima[0], cima[1] - 34);
      c.font = 'italic 19px Lectura, Georgia, serif';
    });
    c.globalAlpha = 1;
  }
  function pintarNacimiento(gu) {
    const f = formulaNacer(t);
    if (f.tex !== texAnterior) { texAnterior = f.tex; if (f.tex && window.katex) window.katex.render(f.tex, formulaEl, { displayMode: true, throwOnError: false, strict: false }); else formulaEl.textContent = f.tex; }
    if (f.texto !== textoAnterior) { textoAnterior = f.texto; textoEl.innerHTML = f.texto; window.renderMathInElement?.(textoEl, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false, strict: false }); }
    formulaEl.style.opacity = String(gu.formula); textoEl.style.opacity = String(gu.formula);
    saltar.style.opacity = String((1 - gu.ui) * 0.8);
    pagina.style.setProperty('--ui', String(gu.ui));
    pintarTrazos(gu);
  }
  function terminarNacimiento() {
    marcarNacido();
    modo = 'normal';
    pais.terminarNace();
    t = Math.max(t, 2);
    capaNacer.remove();
    pagina.classList.remove('naciendo');
    pagina.style.removeProperty('--ui');
    mapaSucio = true;
    pintar();
  }
  saltar.addEventListener('click', (ev2) => { ev2.stopPropagation(); terminarNacimiento(); });

  // --- el viaje entre capítulos: sales de donde estabas y recorres el camino hasta el siguiente
  const iDest = viaje ? catalogo.findIndex((r) => r.id === viaje.region.id) : 0, iOrig = Math.max(0, iDest - 1), nTramos = catalogo.length - 1;
  const uDeViaje = (gu) => mix(iOrig / nTramos, iDest / nTramos, gu.recorrido);
  const tarjetaViaje = h('div', { className: 'viaje-tarjeta' }), dejaEl = h('p', { className: 'viaje-deja' });
  function camaraViaje() {
    const gu = guionViaje(t), a = catalogo[iOrig].posicion, b = catalogo[iDest].posicion, g = grados(), r = gu.recorrido;
    const pts = todosPuntos, idx = Math.min(pts.length - 1, Math.round(uDeViaje(gu) * (pts.length - 1))), pos = pts[idx];
    const zA = cimaDe(catalogo[iOrig], g)[2], zB = cimaDe(catalogo[iDest], g)[2];
    const dx = b[0] - a[0], dy = b[1] - a[1], yawVuelo = Math.atan2(-dx, dy);
    let dY = yawVuelo - INICIO.yaw; dY = Math.atan2(Math.sin(dY), Math.cos(dY));
    const yaw = INICIO.yaw + dY * gu.chase * 0.82 + 0.1 * Math.sin(t * 0.4);
    return { yaw, pitch: 0.44 + 0.12 * gu.altura - 0.1 * gu.zambulle, dist: mix(0.86 + 0.5 * gu.altura, 0.26, gu.zambulle), objetivo: [pos[0], pos[1], mix(zA, zB, r) * 0.8], corrimiento: 0, alzado: mix(-0.18, 0, gu.zambulle) };
  }
  function pintarViaje(gu) {
    tarjetaViaje.style.opacity = String(gu.tarjeta * (1 - gu.zambulle));
    tarjetaViaje.style.setProperty('--b', String(1 - gu.tarjeta));
    dejaEl.style.opacity = String(gu.deja);
  }
  let saliendo = false;
  function salirDeViaje() { if (saliendo) return; saliendo = true; location.replace(`concepto.html?c=${idViaje}&llegas=1`); }

  /** Al continuar, la cámara cae sobre la montaña y la página se funde: no es un enlace más, es seguir andando. */
  let t0Vuelo = 0;
  function volarA(destinoC, seguir = false) {
    const destino = `concepto.html?c=${destinoC.id}${seguir ? '&seguir=1' : ''}`;
    if (reducido) { location.href = destino; return; }
    const de = { ...vista }, a = vistaDe(destinoC.region.id);
    t0Vuelo = t;
    vuelo = (tt) => { const k = ev(tt - t0Vuelo, 0, 0.9); return { objetivo: de.objetivo.map((v, i) => mix(v, a.objetivo[i], k)), dist: mix(de.dist, 0.72, k), corrimiento: mix(de.corrimiento, 0, k), alzado: mix(de.alzado, 0, k) }; };
    pagina.classList.add('fundiendo');
    setTimeout(() => { location.href = destino; }, 880);
  }

  // --- el panel: solo cambia al elegir, nunca al pasar el ratón
  let huella = '';
  /** Solo se anima el panel si cambia de verdad lo que dice. */
  function rellenar(...hijos) {
    const clave = hijos.map((x) => x?.textContent ?? '').join('|');
    if (clave !== huella) { huella = clave; cuerpoPanel.style.animation = 'none'; void cuerpoPanel.offsetWidth; cuerpoPanel.style.animation = ''; }
    cuerpoPanel.replaceChildren(...hijos);
  }
  function pintarPanel() {
    const r = catalogo.find((x) => x.id === fijada), s = sig();
    [...indice.children].forEach((b) => { const id = +b.dataset.region; b.classList.toggle('activa', id === fijada); b.style.setProperty('--g', String(progreso.gradoRegion(id, catalogo))); });
    if (!r) {
      if (!s && !crearLugar(almacen).ultimoEntre(catalogo.flatMap((x) => x.conceptos.map((c) => c.id)))) { rellenar(h('h2', { textContent: 'Has recorrido todo el curso' }), h('p', { textContent: 'Tus montañas brillan. Vuelve a cualquier parada cuando quieras.' }), tuPendulo(almacen)); return; }
      // lo primero es donde te quedaste; si aún no has empezado nada, tu siguiente parada
      const l0 = crearLugar(almacen).ultimoEntre(catalogo.flatMap((x) => x.conceptos.map((c) => c.id))), l = l0 && l0.etapa !== ETAPA_FINAL ? l0 : null, aqui = l && buscarConcepto(l.c, todas);
      const destino = aqui ? { ...aqui.concepto, region: aqui.region } : s;
      const ir = h('button', { type: 'button', className: 'boton-seguir', textContent: 'Continuar el camino' });
      ir.addEventListener('click', () => volarA(destino, !!aqui));
      const donde = h('p', { className: 'tenue', textContent: aqui ? describirLugar(l, { pasos: l.pasosTotal, latidos: l.latidosTotal, retos: aqui.concepto.retos.length }) : `Capítulo ${destino.region.id}: ${destino.region.titulo}` });
      rellenar(h('p', { className: 'rotulo-etapa', textContent: aqui ? 'Sigue donde lo dejaste' : 'Tu siguiente parada' }), h('h2', { textContent: destino.titulo }), aqui ? h('p', { className: 'tenue', textContent: `Capítulo ${aqui.region.id}: ${aqui.region.titulo}` }) : '', donde, ir,
        h('p', { className: 'tenue', textContent: 'Cada montaña es un capítulo. Crece y se vuelve dorada con lo que demuestras en los retos; mirar no la sube.' }), tuPendulo(almacen));
      return;
    }
    const { el } = barraGrado(progreso.gradoRegion(r.id, catalogo));
    const salir = h('button', { type: 'button', className: 'boton-atras', textContent: 'Ver todo el camino' });
    salir.addEventListener('click', () => abrir(null));
    rellenar(salir, h('p', { className: 'rotulo-etapa', textContent: `Capítulo ${r.id}` }), h('h2', { textContent: r.titulo }), h('p', { className: 'lema', textContent: r.lema }), el, listaConceptos(r, progreso),
      s ? h('p', { className: 'tenue siguiente-aqui' }, 'Tu siguiente parada: ', h('a', { href: `concepto.html?c=${s.id}`, textContent: s.titulo })) : '');
  }

  /** Elegir un capítulo acerca la cámara a su montaña; soltarlo vuelve a la vista completa. */
  function abrir(id) {
    fijada = id;
    enfocada = null;
    pintarPanel();
    mapaSucio = true;
  }
  catalogo.forEach((r) => {
    const b = h('button', { type: 'button' }, h('span', { className: 'indice-num', textContent: String(r.id) }), h('span', { className: 'indice-nombre', textContent: r.titulo }));
    b.dataset.region = String(r.id);
    b.addEventListener('click', () => abrir(fijada === r.id ? null : r.id));
    indice.append(b);
  });

  // --- ratón: pasar por encima solo resalta; elegir exige un clic
  let giro = null, movido = 0;
  const zona = zonaMapa;
  const posDe = (ev2) => { const b = canvas.getBoundingClientRect(); return [ev2.clientX - b.left, ev2.clientY - b.top]; };
  zona.addEventListener('pointerdown', (ev2) => { giro = posDe(ev2); movido = 0; zona.setPointerCapture(ev2.pointerId); });
  zona.addEventListener('pointermove', (ev2) => {
    const px = posDe(ev2);
    if (giro) {
      movido += Math.hypot(px[0] - giro[0], px[1] - giro[1]);
      camara = camaraValida({ yaw: camara.yaw - (px[0] - giro[0]) * 0.0042, pitch: camara.pitch + (px[1] - giro[1]) * 0.0032 });
      giro = px;
      mapaSucio = true;
      return;
    }
    const i = regionEn(px, centros(), 62), id = i >= 0 ? catalogo[i].id : null;
    zona.style.cursor = id ? 'pointer' : 'grab';
    if (id !== enfocada) { enfocada = id; mapaSucio = true; colocarRotulos(); }
  });
  zona.addEventListener('pointerleave', () => { if (!giro && enfocada !== null) { enfocada = null; mapaSucio = true; } });
  const soltar = (ev2) => {
    if (giro && movido < 6 && ev2.type === 'pointerup') {
      const i = regionEn(posDe(ev2), centros(), 62);
      if (i >= 0) abrir(catalogo[i].id);
    }
    giro = null;
  };
  zona.addEventListener('pointerup', soltar);
  zona.addEventListener('pointercancel', soltar);
  zona.addEventListener('wheel', (ev2) => { ev2.preventDefault(); zoom = Math.max(0.62, Math.min(1.25, zoom * Math.exp(ev2.deltaY * 0.0009))); mapaSucio = true; }, { passive: false });
  addEventListener('keydown', (ev2) => { if (ev2.key === 'Escape' && fijada) abrir(null); });
  addEventListener('resize', () => { mapaSucio = true; });

  alCambiar = () => { gradosC = null; cimasC = null; sigC = undefined; fijarCampo(); pintarPanel(); mapaSucio = true; };

  // --- el bucle: a 30 cuadros la luz se mueve; si la máquina no da para más, baja la resolución antes que la fluidez
  const DORMIR = 25000;
  let pedido = 0;
  const despertar = () => { ultGesto = performance.now(); if (!pedido) { ult = performance.now(); pedido = requestAnimationFrame(cuadro); } };
  let ult = performance.now(), ultCuadro = 0, ultFondo = 0, ultLuz = 0, ultGesto = performance.now(), activo = true, lentos = 0, congelado = false;
  for (const ev2 of ['pointermove', 'pointerdown', 'keydown', 'wheel']) addEventListener(ev2, despertar, { passive: true });
  document.addEventListener('visibilitychange', despertar);
  const io = new IntersectionObserver((e2) => { activo = e2[0].isIntersecting; });
  io.observe(pagina);
  const cuadro = (ms) => {
    pedido = requestAnimationFrame(cuadro);
    if (!activo || document.hidden || congelado) { ult = ms; return; }
    const dt = Math.min(0.25, (ms - ult) / 1000);
    ult = ms;
    t += dt;
    let mueve = false;
    const a = objetivoVista(), k = Math.min(1, dt * 3.4);
    vista.dist += (a.dist - vista.dist) * k; vista.corrimiento += (a.corrimiento - vista.corrimiento) * k; vista.alzado += (a.alzado - vista.alzado) * k;
    vista.objetivo = vista.objetivo.map((v, i) => { const d = a.objetivo[i] - v; if (Math.abs(d) > 2e-4) mueve = true; return v + d * k; });
    if (Math.abs(a.dist - vista.dist) > 1e-3) mueve = true;
    const animando = t < 1.2 || vuelo || mueve || modo !== 'normal' || mapaSucio;
    if (animando) {
      if (ms - ultCuadro < 14) return; // pantallas de 144 Hz: con 60 cuadros basta y se ahorra CPU
      if (ultCuadro && !reducido) {
        if (ms - ultCuadro > 42) lentos++; else lentos = Math.max(0, lentos - 1);
        if (lentos > 14) { lentos = 0; escala = escala > 1 ? Math.max(1, escala * 0.86) : Math.max(0.7, escala * 0.9); }
      }
      ultCuadro = ms; ultFondo = ms;
      mapaSucio = false;
      pintar(true);
      return;
    }
    // en reposo: solo lo que brilla encima, 30 veces por segundo, y el fondo muy de vez en cuando
    if (reducido || software) return;
    if (ms - ultGesto > DORMIR) { cancelAnimationFrame(pedido); pedido = 0; return; } // nadie toca nada: el bucle entero se para hasta el próximo gesto
    if (ms - ultCuadro < 32) return;
    ultCuadro = ms;
    if (ms - ultLuz > 4000) {
      if (pais.avanzarLuz(sol())) { ultLuz = ms; solActual = sol(); ultFondo = 0; }
    }
    const fondo = ms - ultFondo > 140;
    if (fondo) ultFondo = ms;
    pintar(fondo);
  };
  pintarPanel();
  if (modo === 'nace') {
    pagina.classList.add('naciendo');
    pagina.append(capaNacer);
    addEventListener('keydown', (ev2) => { if (modo === 'nace' && ev2.key === 'Escape') terminarNacimiento(); });
  }
  zonaMapa.append(chispa, puertaSol);
  if (esAlba) pagina.classList.add('lado-alba');
  if (modo === 'cruce') {
    pagina.classList.add('cruzando');
    pagina.append(capaCruce);
    addEventListener('keydown', (ev2) => { if (modo === 'cruce' && ev2.key === 'Escape') terminarCruce(); });
  }
  if (modo === 'viaje') {
    const o = catalogo[iOrig], titulo = tituloDifuso(viaje.region.titulo, 'h2');
    pagina.classList.add('viajando');
    dejaEl.textContent = `Dejas atrás ${o.titulo}`;
    tarjetaViaje.append(h('p', { className: 'viaje-num', textContent: `Capítulo ${viaje.region.id}` }), titulo, h('p', { className: 'viaje-lema', textContent: viaje.region.lema }));
    const salto = h('button', { type: 'button', className: 'nace-saltar', textContent: 'Saltar' });
    salto.addEventListener('click', salirDeViaje);
    pagina.append(dejaEl, tarjetaViaje, salto);
    addEventListener('keydown', (ev2) => { if (['Escape', ' ', 'Enter'].includes(ev2.key)) { ev2.preventDefault(); salirDeViaje(); } });
  }
  pintar();
  pedido = requestAnimationFrame(cuadro);

  return {
    camara: () => camaraValida(camara),
    modo: () => modo,
    /** Para comprobar y capturar un instante exacto de los guiones. */
    fijarT(v, e = escala) { congelado = true; t = v; escala = e; pintar(); },
    campo: (x, y) => pais.leerCampo(x, y),
    aPantalla(id) {
      const i = catalogo.findIndex((r) => r.id === id), [x, y] = centros()[i], b = canvas.getBoundingClientRect();
      return [b.left + x, b.top + y];
    },
  };
}
