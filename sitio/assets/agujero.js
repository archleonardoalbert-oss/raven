// La caída al agujero negro supermasivo del centro de la galaxia. Aquí no se pinta nada: este módulo dirige
// la cámara durante la caída (las mismas trayectorias que El Horizonte), coloca los faros de cada habilidad
// y los rótulos, y se lo pasa todo a galaxia.js, que pinta el agujero negro con su lente (lente.js) dentro de
// la propia galaxia. La aproximación pasa por los cinco faros y se detiene junto al horizonte, donde un botón
// permite cruzarlo (cruzar.js); si se sigue con el scroll, la cámara deshace el camino y sale hacia Proyectos.
import { trayecto, vista, dilatacion } from './penumbra/caida.js';
import { crearCurva, TRAMOS, incDe, fovDe, giraDe } from './curva-caida.js';

// Grandes áreas (contenido/habilidades.json): cada una es un faro de la caída; dentro del horizonte se abre
// el mapa con todas sus habilidades y los proyectos donde las aplico.
import { AREAS } from './habilidades-datos.js';

const raiz = document.documentElement;
const seccion = document.getElementById('habilidades');
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const movil = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const idioma = () => (raiz.dataset.idioma === 'en' ? 'en' : 'es');
const lim = (x, a, b) => Math.max(a, Math.min(b, x));
const suave = (x) => { const u = lim(x, 0, 1); return u * u * (3 - 2 * u); };
const mezcla = (a, b, k) => a + (b - a) * k;
const coma = (x, d) => (idioma() === 'en' ? x.toFixed(d) : x.toFixed(d).replace('.', ','));

const $ = (s) => seccion.querySelector(s);
const faroEl = $('.faro'), faroTit = $('.faro-titulo'), faroLinea = $('.faro-linea');
const destelloSalida = $('.destello-salida'), grupoEl = $('.grupo-caida'), relojEl = $('.reloj'), resumenEl = $('.resumen'), negro = $('.negro'), pista = $('.pista-caida');

// resumen: todas las habilidades por grupo
function pintarResumen() {
  const L = idioma();
  const esc = (t) => t.replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[x]);
  resumenEl.querySelector('.resumen-grupos').innerHTML = AREAS.map((g) => `<div class="resumen-grupo"><h3>${g[L]}</h3><p>${g.lema[L]}</p><ul>${g.h.map((c) =>
    `<li><span class="hab">${esc(c[L])}</span>${c.p.length ? `<span class="hab-en">${c.p.join(' · ')}</span>` : ''}</li>`).join('')}</ul></div>`).join('');
}
pintarResumen();
document.addEventListener('raven-idioma', () => { pintarResumen(); faroEl.dataset.k = ''; grupoEl.dataset.i = ''; });

// una región por área, con un solo faro (el contenido: título, lema, grupo)
const P = trayecto(AREAS.map((g) => ({ conceptos: [{ es: g.es, en: g.en, titulo: g.es, l: { es: g.h.slice(0, 4).map((x) => x.es).join(' · '), en: g.h.slice(0, 4).map((x) => x.en).join(' · ') } }] })));
const N = P.length, MAX = N - 1;
// los cinco faros, todos antes del punto del botón (repartidos en escala logarítmica hacia el horizonte)
const RADIOS = [30, 17, 9.5, 5.6, 3.6], R_BOTON = 2.8;
const exposicion = (r) => 0.62 * Math.min(1, (1 - 1 / r) ** 2 / 0.3);
// el punto de partida es exactamente donde deja la cámara la galaxia: (0, 2, 4,6) mirando al centro, 50° de campo
const RS = 0.04, R0 = Math.hypot(2.0, 4.6) / RS, INC0 = Math.atan2(2.0, 4.6), FOV0 = (50 * Math.PI) / 180;

// medidas de la sección y curva (se rehacen al cambiar el tamaño): la retirada sale con la velocidad con que la
// galaxia empieza a volar hacia Proyectos, y la galaxia mantiene su cámara quieta justo hasta que acaba la retirada
let curva, alto = 1, arriba = 0;
function medir() {
  const H = innerHeight, h = seccion.offsetHeight;
  arriba = seccion.getBoundingClientRect().top + scrollY; alto = Math.max(1, h - H);
  const gap = h - H / 2, m = (TRAMOS.R * alto) / gap;
  seccion.dataset.mantener = m.toFixed(4);
  const estrecha = matchMedia('(max-width: 760px)').matches, pr = document.getElementById('proyectos');
  const [pp, tt] = ((estrecha && pr.dataset.camaraMovil) || pr.dataset.camara).split('|').map((x) => x.split(',').map(Number));
  const db = Math.hypot(pp[0] - tt[0], pp[1] - tt[1], pp[2] - tt[2]), da = Math.hypot(2.0, 4.6);
  const salida = (Math.log(db / da) * 2 * alto) / (gap - TRAMOS.R * alto);  // d(log r)/dp del vuelo de la galaxia al arrancar
  curva = crearCurva({ R0, radios: RADIOS, rBoton: R_BOTON, salida, INC0, FOV0, lado: innerWidth > 760 ? 0.08 : 0 });
  window.__ravenCaida = { pFaro: curva.pFaro, tramos: TRAMOS, arriba, alto };
}
medir();
addEventListener('resize', medir); addEventListener('load', medir);

// pose completa: en la entrada se mezcla la mirada de la galaxia con la de la caída (sin saltos en el relevo)
const poseDe = (c) => ({ r: c.r, az: c.az, inc: c.inc, gira: c.gira, fov: c.fov, roll: 0 });
// cada faro flota delante de quien llega a él, a la derecha: al acercarte lo pasas de largo
function faroEn(k) {
  const c = curva.pose(curva.pFaro(k)), po = poseDe(c), v = vista(po), d = Math.max(0.45 * (po.r - 1), 0.18), t = Math.tan(po.fov / 2);
  return v.C.map((x, j) => x + d * (v.f[j] + v.de[j] * 0.75 * t + v.ar[j] * 0.12 * t));
}
let FAROS = P.map((_, k) => faroEn(k));
addEventListener('resize', () => { FAROS = P.map((_, k) => faroEn(k)); });

// cruzar el horizonte (cruzar.js): mientras dura, la caída sigue por tiempo desde el punto del botón
const estado = { activo: false, C: [0, 0, 0], de: [1, 0, 0], ar: [0, 0, 1], f: [0, 1, 0], fov: FOV0, mezcla: 0, faros: new Float32Array(16), farosC: new Float32Array(16), p: 0, fase: 'fuera', cruce: null };
window.__ravenBH = estado;
const progreso = () => ((window.__ravenYS?.() ?? scrollY) - arriba) / alto;
// mismas fórmulas que la caída: cómo mira quien cae a un radio dado (para cruzar el horizonte)
const poseRadio = (base, r) => ({ ...base, r, inc: incDe(r), gira: giraDe(r), fov: fovDe(r) });

const faros = estado.faros, farosC = estado.farosC;
let t = 0;
window.__ravenFijarCaida = () => {};  // nada que fijar: la caída no tiene suavizado propio
// la llama galaxia.js en cada cuadro, justo después de suavizar el scroll y antes de colocar la cámara: así la caída
// y la cámara nunca van desacompasadas un cuadro (con dos bucles separados, el orden variaba y daba tirones)
window.__ravenActualizarCaida = function cuadro(dt) {
  const p = progreso(), { A, B, R } = TRAMOS, cruce = estado.cruce;
  const c = curva.pose(p);
  estado.p = p; estado.fase = cruce ? 'cruce' : c.fase;
  estado.activo = !!cruce || (p >= 0 && p < R);
  raiz.dataset.escena = cruce || (p > 0.002 && p < R) ? 'agujero' : '';
  pista.style.opacity = String(suave((p - 0.012) / 0.02) * (1 - suave((p - 0.055) / 0.02)));
  // «Ver todo de una vez»: visible durante la aproximación
  seccion.style.setProperty('--saltar', String(cruce ? 0 : suave((p - 0.03) / 0.03) * (1 - suave((p - A + 0.03) / 0.03))));
  if (!estado.activo) { faroEl.style.opacity = 0; grupoEl.style.opacity = 0; relojEl.style.opacity = 0; return; }
  t += reducido ? 0 : dt;

  // dónde está quien cae
  let po = poseDe(c), m = c.mezcla;
  if (cruce) {
    // de la vista del botón hasta rozar el horizonte, por tiempo (cruzar.js marca el avance de 0 a 1)
    const u = suave(cruce.avance), b = poseDe(curva.pose(A));
    po = poseRadio({ ...b, az: b.az + 1.2 * u }, Math.exp(mezcla(Math.log(R_BOTON), Math.log(1.015), u))); m = 1;
  }
  estado.mezcla = m;
  const r = po.r;
  const lado = innerWidth > 760 ? 0.08 * m : 0;
  const v = vista(po, { lado, mirX: 0.004 * Math.sin(t * 0.6) * m, mirY: 0.003 * Math.sin(t * 0.43) * m });
  estado.C = v.C; estado.de = v.de; estado.ar = v.ar; estado.f = v.f; estado.fov = po.fov;
  const expo = exposicion(r);

  // faros: el actual y los dos siguientes, con su luz real (se apagan en la retirada y al cruzar)
  const k = c.k, apagar = cruce ? 0 : 1 - suave((p - B) / 0.025);
  faros.fill(0); farosC.fill(0);
  if (k > -0.6 && apagar > 0) {
    const pr = Math.ceil(k - 0.2);
    for (let n = 0; n < 3; n++) {
      const j = pr + n; if (j < 0 || j > MAX) continue;
      const d = j - k, al = suave((3.2 - d) / 1) * suave((d + 0.18) / 0.16), dist = Math.max(0.45 * (RADIOS[j] - 1), 0.18), late = 1 + 0.18 * Math.sin(t * 2.4 + j);
      faros.set([...FAROS[j], dist * 0.012], n * 4);
      farosC.set(P[j].ir === 0 ? [0.62, 0.7, 1] : P[j].ir === 1 ? [1, 0.74, 0.36] : [0.5, 1, 0.85], n * 4);
      farosC[n * 4 + 3] = (al * late * 0.62 * apagar) / Math.max(expo, 0.02);
    }
  }
  // rótulo de la habilidad junto a su faro, y el grupo «n / 5» (solo en la aproximación)
  const L = idioma();
  const kr = lim(Math.round(k), 0, MAX);
  const enFaros = !cruce && c.fase === 'aproximacion';
  if (faroEl.dataset.k !== String(kr)) { faroEl.dataset.k = String(kr); const cc = P[kr].c; faroTit.innerHTML = cc[L].replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[x]).replace('#', '<span class="sost">#</span>'); faroLinea.textContent = cc.l[L]; }
  const Bf = FAROS[kr], dd = Bf.map((x, i) => x - v.C[i]), z = dd[0] * v.f[0] + dd[1] * v.f[1] + dd[2] * v.f[2], asp = innerWidth / innerHeight, tf = Math.tan(po.fov / 2);
  const nx = (dd[0] * v.de[0] + dd[1] * v.de[1] + dd[2] * v.de[2]) / (z * tf * asp), ny = (dd[0] * v.ar[0] + dd[1] * v.ar[1] + dd[2] * v.ar[2]) / (z * tf);
  const alF = enFaros ? 1 - suave((Math.abs(k - kr) - 0.1) / 0.3) : 0;
  faroEl.style.opacity = alF.toFixed(3);
  if (innerWidth <= 760) faroEl.style.transform = `translate(-50%, 0) translate(${innerWidth / 2}px, ${innerHeight * 0.66}px)`;
  else faroEl.style.transform = `translate(${lim((nx * 0.5 + 0.5) * innerWidth + 58, 40, innerWidth - 500).toFixed(1)}px, ${lim((0.5 - ny * 0.5) * innerHeight - 42, 90, innerHeight - 180).toFixed(1)}px)`;

  const ir = P[kr].ir;
  if (grupoEl.dataset.i !== String(ir)) { grupoEl.dataset.i = String(ir); grupoEl.querySelector('h2').textContent = `${ir + 1} / ${AREAS.length}`; grupoEl.querySelector('p').textContent = AREAS[ir].lema[L]; }
  grupoEl.style.opacity = (enFaros ? 1 - suave((Math.abs(k - kr) - 0.15) / 0.3) : 0).toFixed(3);

  // reloj: a qué distancia del horizonte y cuánto se dilata el tiempo
  relojEl.style.opacity = String(suave((p - 0.02) / 0.03) * (1 - suave((p - B) / 0.03)) * (cruce ? 1 - suave(cruce.avance / 0.5) : 1));
  relojEl.textContent = L === 'en'
    ? `${coma(r, r < 3 ? 2 : 1)} times the horizon radius. For each of your seconds, ${coma(dilatacion(r), 2)} pass out there.`
    : `A ${coma(r, r < 3 ? 2 : 1)} veces el radio del horizonte. Por cada segundo tuyo, allí fuera pasan ${coma(dilatacion(r), 2)}.`;
};
