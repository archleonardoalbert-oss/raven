// La caída al agujero negro supermasivo del centro de la galaxia. Aquí no se pinta nada: este módulo dirige
// la cámara durante la caída (las mismas trayectorias que El Horizonte), coloca los faros de cada habilidad
// y los rótulos, y se lo pasa todo a galaxia.js, que pinta el agujero negro con su lente (lente.js) dentro de
// la propia galaxia. Al cruzar el horizonte todo se apaga y queda el resumen.
import { trayecto, pose, vista, faroDe, dilatacion } from './penumbra/caida.js';

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

// una región por área, con un solo faro: así cada área cae en uno de los cinco anillos de la caída
const P = trayecto(AREAS.map((g) => ({ conceptos: [{ es: g.es, en: g.en, titulo: g.es, l: { es: g.h.slice(0, 4).map((x) => x.es).join(' · '), en: g.h.slice(0, 4).map((x) => x.en).join(' · ') } }] })));
const N = P.length, MAX = N - 1;
const FAROS = P.map((_, k) => faroDe(P, k));
const exposicion = (r) => 0.62 * Math.min(1, (1 - 1 / r) ** 2 / 0.3);

// mismas fórmulas que pose(): cómo mira quien cae a un radio dado
function poseRadio(base, r) {
  return { ...base, r, inc: mezcla(0.28, 0.07, suave((30 - r) / 22)), gira: Math.PI * (0.5 * suave((5 - r) / 3.2) + 0.5 * suave((1.62 - r) / 0.42)), fov: mezcla(0.62, 1.3, suave((12 - r) / 9)) };
}

// tramos de la sección (fracciones de su recorrido)
const T_ENTRA = 0.07, T_FAROS = 0.78, T_CAE = 0.87, T_SALE = 0.963;
// el punto de partida es exactamente donde deja la cámara la galaxia: (0, 2, 4,6) mirando al centro, 50° de campo
const RS = 0.04, R0 = Math.hypot(2.0, 4.6) / RS, INC0 = Math.atan2(2.0, 4.6), FOV0 = (50 * Math.PI) / 180;
function poseEntrada(u) {
  const p0 = pose(P, 0);
  // acercamiento recto: el ángulo apenas cambia (de 0 al de la primera órbita), solo se avanza hacia el centro
  return { ...p0, r: Math.exp(mezcla(Math.log(R0), Math.log(p0.r), u)), az: mezcla(0, p0.az, u), inc: mezcla(INC0, p0.inc, u), gira: p0.gira * u, fov: mezcla(FOV0, p0.fov, u), roll: 0 };
}
const estado = { activo: false, C: [0, 0, 0], de: [1, 0, 0], ar: [0, 0, 1], f: [0, 1, 0], fov: FOV0, faros: new Float32Array(16), farosC: new Float32Array(16) };
window.__ravenBH = estado;
function progreso() {
  const r = seccion.getBoundingClientRect();
  return (-r.top) / Math.max(1, r.height - innerHeight);
}

const faros = estado.faros, farosC = estado.farosC;
let s = 0, t = 0, ult = performance.now();
// scroll por paradas: en la zona de cada faro la cámara queda clavada en él (meseta); entre faros, el viaje
const SEG = 1 / Math.max(1, MAX), MESETA = 0.32 * SEG;
function sDe(p) {
  const q = lim((p - T_ENTRA) / (T_FAROS - T_ENTRA), 0, 1), k = Math.round(q / SEG);
  if (Math.abs(q - k * SEG) <= MESETA) return k;
  const k0 = Math.floor(q / SEG), u = (q - (k0 * SEG + MESETA)) / (SEG - 2 * MESETA);
  return lim(k0 + suave(lim(u, 0, 1)), 0, MAX);
}
window.__ravenFijarCaida = () => { s = sDe(progreso()); };
// zonas de scroll (px) de cada faro y del resumen, para el conductor de paradas
const yDe = (p) => seccion.offsetTop + p * Math.max(1, seccion.offsetHeight - innerHeight);
const pDe = (q) => T_ENTRA + lim(q, 0, 1) * (T_FAROS - T_ENTRA);
window.__ravenFaros = () => AREAS.map((g, k) => ({ id: `faro-${k}`, nombre: { es: g.es, en: g.en }, ini: Math.round(yDe(pDe(k * SEG - MESETA))), fin: Math.round(yDe(pDe(k * SEG + MESETA))) }));
window.__ravenResumen = () => ({ id: 'resumen', nombre: { es: 'el resumen de habilidades', en: 'the skills overview' }, ini: Math.round(yDe(0.885)), fin: Math.round(yDe(0.95)) });
function cuadro(ahora) {
  requestAnimationFrame(cuadro);
  const dt = Math.min(0.05, (ahora - ult) / 1000); ult = ahora;
  const p = progreso();
  estado.activo = p >= 0 && p < T_SALE;
  raiz.dataset.escena = p > 0.002 && p < T_SALE ? 'agujero' : '';
  pista.style.opacity = String(suave((p - 0.012) / 0.02) * (1 - suave((p - 0.055) / 0.02)));
  // salida: el resumen se va, un destello, y la cámara sale disparada del núcleo
  negro.style.opacity = String(suave((p - (T_CAE - 0.035)) / 0.035) * (1 - suave((p - T_SALE) / 0.018)));
  destelloSalida.style.opacity = String(Math.exp(-(((p - T_SALE - 0.002) / 0.006) ** 2)));
  const vR = suave((p - T_CAE - 0.01) / 0.04) * (1 - suave((p - T_SALE + 0.016) / 0.013));
  resumenEl.style.opacity = String(vR); resumenEl.style.transform = `translateY(${(1 - vR) * 30}px)`;
  // «Ver todo de una vez»: visible durante la caída, hasta el resumen
  seccion.style.setProperty('--saltar', String(suave((p - 0.03) / 0.03) * (1 - suave((p - T_CAE + 0.04) / 0.03))));
  if (!estado.activo) { faroEl.style.opacity = 0; grupoEl.style.opacity = 0; relojEl.style.opacity = 0; return; }
  t += reducido ? 0 : dt;

  // dónde está quien cae
  const objetivoS = sDe(p);
  s += (objetivoS - s) * (reducido ? 1 : 1 - Math.pow(0.02, dt));
  let po;
  if (p < T_ENTRA) {
    po = poseEntrada(suave(p / T_ENTRA));
  } else if (p < T_FAROS) {
    po = pose(P, s);
  } else {
    // pasado el último faro: la caída sigue hasta rozar el horizonte
    const u = suave((p - T_FAROS) / (T_CAE - T_FAROS)), pf = pose(P, MAX);
    po = poseRadio({ ...pf, az: pf.az + 1.2 * u }, Math.exp(mezcla(Math.log(pf.r), Math.log(1.015), u)));
  }
  const r = po.r;
  const lado = innerWidth > 760 ? 0.08 * suave(p / T_ENTRA) : 0;
  const v = vista(po, { lado, mirX: 0.004 * Math.sin(t * 0.6) * suave(p / T_ENTRA), mirY: 0.003 * Math.sin(t * 0.43) * suave(p / T_ENTRA) });
  estado.C = v.C; estado.de = v.de; estado.ar = v.ar; estado.f = v.f; estado.fov = po.fov;
  const expo = exposicion(r);

  // faros: el actual y los dos siguientes, con su luz real
  faros.fill(0); farosC.fill(0);
  if (p >= T_ENTRA * 0.6) {
    const pr = Math.ceil(s - 0.2);
    for (let n = 0; n < 3; n++) {
      const k = pr + n; if (k < 0 || k > MAX) continue;
      const d = k - s, al = suave((3.2 - d) / 1) * suave((d + 0.18) / 0.16), dist = Math.max(0.45 * (P[k].r - 1), 0.18), late = 1 + 0.18 * Math.sin(t * 2.4 + k);
      faros.set([...FAROS[k], dist * 0.012], n * 4);
      farosC.set(P[k].ir === 0 ? [0.62, 0.7, 1] : P[k].ir === 1 ? [1, 0.74, 0.36] : [0.5, 1, 0.85], n * 4);
      farosC[n * 4 + 3] = (al * late * 0.62) / Math.max(expo, 0.02);
    }
  }
  // rótulo de la habilidad junto a su faro
  const L = idioma();
  const k = lim(Math.round(s), 0, MAX);
  const enFaros = p >= T_ENTRA * 0.9 && p < T_FAROS + 0.02;
  if (faroEl.dataset.k !== String(k)) { faroEl.dataset.k = String(k); const c = P[k].c; faroTit.innerHTML = c[L].replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[x]).replace('#', '<span class="sost">#</span>'); faroLinea.textContent = c.l[L]; }
  const B = FAROS[k], dd = B.map((x, i) => x - v.C[i]), z = dd[0] * v.f[0] + dd[1] * v.f[1] + dd[2] * v.f[2], asp = innerWidth / innerHeight, tf = Math.tan(po.fov / 2);
  const nx = (dd[0] * v.de[0] + dd[1] * v.de[1] + dd[2] * v.de[2]) / (z * tf * asp), ny = (dd[0] * v.ar[0] + dd[1] * v.ar[1] + dd[2] * v.ar[2]) / (z * tf);
  const alF = enFaros ? 1 - suave((Math.abs(s - k) - 0.1) / 0.3) : 0;
  faroEl.style.opacity = alF.toFixed(3);
  if (innerWidth <= 760) faroEl.style.transform = `translate(-50%, 0) translate(${innerWidth / 2}px, ${innerHeight * 0.66}px)`;
  else faroEl.style.transform = `translate(${lim((nx * 0.5 + 0.5) * innerWidth + 58, 40, innerWidth - 500).toFixed(1)}px, ${lim((0.5 - ny * 0.5) * innerHeight - 42, 90, innerHeight - 180).toFixed(1)}px)`;

  // grupo: aparece al entrar en cada anillo
  const ir = P[k].ir;
  // contador de áreas (progreso visible): «2 / 5»
  if (grupoEl.dataset.i !== String(ir)) { grupoEl.dataset.i = String(ir); grupoEl.querySelector('h2').textContent = `${ir + 1} / ${AREAS.length}`; grupoEl.querySelector('p').textContent = AREAS[ir].lema[L]; }
  grupoEl.style.opacity = (enFaros ? 1 - suave((Math.abs(s - k) - 0.15) / 0.3) : 0).toFixed(3);

  // reloj: a qué distancia del horizonte y cuánto se dilata el tiempo
  relojEl.style.opacity = String(suave((p - 0.02) / 0.03) * (1 - suave((p - T_CAE + 0.03) / 0.03)));
  relojEl.textContent = L === 'en'
    ? `${coma(r, r < 3 ? 2 : 1)} times the horizon radius. For each of your seconds, ${coma(dilatacion(r), 2)} pass out there.`
    : `A ${coma(r, r < 3 ? 2 : 1)} veces el radio del horizonte. Por cada segundo tuyo, allí fuera pasan ${coma(dilatacion(r), 2)}.`;
}
requestAnimationFrame(cuadro);
