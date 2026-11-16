// Modelo del scroll por paradas (sin DOM: se prueba en Node). Las paradas son zonas de scroll en las que la cámara
// está quieta y el contenido se lee; entre ellas, viajes que la cámara hace sola. El autómata decide, ante cada
// gesto, si el navegador desplaza con normalidad, si se retiene en el borde (acumulando el empuje) o si se viaja.

export const UMBRAL = 0.33;          // fracción de pantalla que hay que empujar en un borde para salir
export const OLVIDO_MS = 600;        // sin empujar este tiempo, el empuje acumulado se vacía
export const PAUSA_LLEGADA_MS = 300; // tras llegar, hace falta este tiempo quieto antes de volver a acumular
export const GESTO_RECIENTE_MS = 600;
export const VELOCIDAD_RAPIDA = 0.9; // px/ms de un gesto táctil que sale al momento

export const duracionViaje = (distancia, alto) => Math.round(Math.min(2600, Math.max(1400, 900 + (250 * Math.abs(distancia)) / Math.max(1, alto))));

export function construirParadas({ descansos = [], faros = [], resumen = null }) {
  return [...descansos.filter((d) => d.id !== 'habilidades'), ...faros, ...(resumen ? [resumen] : [])]
    .filter((p) => p.fin > p.ini)
    .sort((a, b) => a.ini - b.ini);
}
// Zona segura de una parada a partir de su contenido (px de documento) y del reposo de la cámara [restIni, restFin]:
// empieza cuando el contenido se ve entero (o, si no cabe, con su tope al 15 % de la pantalla) y acaba un 15 % de
// pantalla después de su último punto cómodo de lectura. Mide al menos un 40 % de pantalla. `cubre` dice si el
// reposo de la cámara alcanza (si no, hay que alargar su data-mantener).
export function zonaSegura({ restIni, restFin, top, bottom, alto }) {
  const a = top - 0.15 * alto, z = bottom - 0.85 * alto, lo = Math.min(a, z), hi = Math.max(a, z), c = 0.15 * alto, min = 0.4 * alto;
  let ini = restIni <= 0 ? 0 : Math.max(restIni, lo), fin = Math.min(restFin, hi + c);
  if (fin - ini < min) fin = Math.min(restFin, ini + min);
  if (fin - ini < min) ini = Math.max(restIni, fin - min);
  // al bajar se llega donde el contenido se ve mejor sin salir de la zona (en la última parada puede ser el fondo)
  const llegada = Math.round(Math.min(fin, Math.max(ini, lo)));
  return { ini: Math.round(ini), fin: Math.round(fin), llegada, cubre: fin >= hi + c - 0.5 && fin - ini >= min - 0.5 };
}
export const paradaEn = (paradas, y) => paradas.findIndex((p) => y >= p.ini - 2 && y <= p.fin + 2);

const ABAJO = new Set([' ', 'Spacebar', 'PageDown', 'ArrowDown']), ARRIBA = new Set(['PageUp', 'ArrowUp']);

export function crearAutomata({ alto, ahora = () => performance.now() }) {
  let acumulado = 0, ultimoEmpuje = -Infinity, ultimoGesto = -Infinity, desdeLlegada = false;
  const enBorde = (p, y, dir) => (dir > 0 ? y >= p.fin - 1 : y <= p.ini + 1);
  const viajar = (paradas, j, dir, y0) => {
    const d = paradas[j], y = dir > 0 ? (d.llegada > d.ini ? d.llegada : d.ini + 1) : d.fin - 1;
    acumulado = 0; desdeLlegada = true;
    return { hacer: 'viajar', y, duracion: duracionViaje(y - y0, alto), destino: d };
  };

  function rueda({ dy, y, paradas }) {
    const t = ahora(), i = paradaEn(paradas, y), dir = Math.sign(dy);
    if (!dir) return { hacer: 'nativo' };
    const reciente = t - ultimoGesto < PAUSA_LLEGADA_MS;
    ultimoGesto = t;
    if (!reciente) desdeLlegada = false;  // un gesto nuevo (tras una pausa) ya no es la inercia de la llegada
    if (i < 0) return { hacer: 'nativo' };
    const p = paradas[i];
    if (!enBorde(p, y, dir)) {
      if (dir > 0 && y + dy > p.fin) return { hacer: 'ajustar', y: p.fin };
      if (dir < 0 && y + dy < p.ini) return { hacer: 'ajustar', y: p.ini };
      return { hacer: 'nativo' };
    }
    const destino = paradas[i + dir] ?? null;
    // la inercia del gesto que trajo hasta aquí no cuenta: hace falta un gesto nuevo
    if (desdeLlegada && reciente) return { hacer: 'retener', progreso: 0, destino };
    desdeLlegada = false;
    if (t - ultimoEmpuje > OLVIDO_MS) acumulado = 0;
    acumulado += Math.abs(dy); ultimoEmpuje = t;
    if (!destino) return { hacer: 'retener', progreso: Math.min(1, acumulado / (UMBRAL * alto)), destino: null };
    const progreso = acumulado / (UMBRAL * alto);
    if (progreso >= 1) return viajar(paradas, i + dir, dir, y);
    return { hacer: 'retener', progreso, destino };
  }

  function tecla({ tecla: k, y, paradas }) {
    const dir = ABAJO.has(k) ? 1 : ARRIBA.has(k) ? -1 : 0, i = paradaEn(paradas, y);
    ultimoGesto = ahora();
    if (!dir || i < 0 || !enBorde(paradas[i], y, dir) || !paradas[i + dir]) return { hacer: 'nativo' };
    return viajar(paradas, i + dir, dir, y);
  }

  function toqueFin({ velocidad, y, paradas }) {
    const dir = Math.sign(velocidad), i = paradaEn(paradas, y);
    ultimoGesto = ahora();
    if (Math.abs(velocidad) < VELOCIDAD_RAPIDA || i < 0 || !enBorde(paradas[i], y, dir) || !paradas[i + dir]) return { hacer: 'nativo' };
    return viajar(paradas, i + dir, dir, y);
  }

  // el scroll se quedó quieto: si es en un trayecto, o fue inercia (vuelve al borde) o la barra (viaja)
  function quieto({ y, paradas, sentido = 1 }) {
    if (paradaEn(paradas, y) >= 0) return { hacer: 'nativo' };
    const antes = [...paradas].reverse().find((p) => p.fin < y), despues = paradas.find((p) => p.ini > y);
    if (ahora() - ultimoGesto < GESTO_RECIENTE_MS) {
      if (sentido > 0 && antes) return { hacer: 'ajustar', y: antes.fin };
      if (sentido < 0 && despues) return { hacer: 'ajustar', y: despues.ini };
    }
    const j = sentido > 0 ? (despues ? paradas.indexOf(despues) : paradas.indexOf(antes)) : (antes ? paradas.indexOf(antes) : paradas.indexOf(despues));
    if (j < 0) return { hacer: 'nativo' };
    return viajar(paradas, j, paradas[j].ini > y ? 1 : -1, y);
  }

  return {
    evento(tipo, datos) {
      if (tipo === 'rueda') return rueda(datos);
      if (tipo === 'tecla') return tecla(datos);
      if (tipo === 'toqueFin') return toqueFin(datos);
      if (tipo === 'quieto') return quieto(datos);
      if (tipo === 'llegada') { desdeLlegada = true; acumulado = 0; ultimoGesto = ahora(); return { hacer: 'nativo' }; }
      return { hacer: 'nativo' };
    },
  };
}
