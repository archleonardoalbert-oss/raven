// Lo que dibuja una escena, en coordenadas del modelo ([x, y] o [x, y, z]). Son datos puros: las pruebas los
// inspeccionan sin navegador y los tres renderizadores los dibujan.

export const linea = (de, a, op = {}) => ({ tipo: 'linea', de, a, ...op });
export const punto = (p, op = {}) => ({ tipo: 'punto', p, ...op });
export const poligono = (puntos, op = {}) => ({ tipo: 'poligono', puntos, ...op });
export const rotulo = (p, tex, op = {}) => ({ tipo: 'rotulo', p, tex, ...op });
export const marco = (dominio, op = {}) => ({ tipo: 'marco', dominio, ...op });
export const mapaCalor = (f, op = {}) => ({ tipo: 'mapaCalor', f, ...op });
export const terreno = (f, op = {}) => ({ tipo: 'terreno', f, desde: 0, ...op });

/** f(u) → punto. `hasta` (fracción del recorrido) deja la curva a medio trazar, terminando exactamente en su punta. */
export function curva(f, [u0, u1], op = {}) {
  const { hasta = 1, n = 160 } = op, fin = u0 + (u1 - u0) * hasta, puntos = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    if ((u1 > u0 && u >= fin) || (u1 < u0 && u <= fin)) break;
    puntos.push(f(u));
  }
  puntos.push(f(fin));
  // error de sustituir la curva por segmentos: la tolerancia con la que se puede «caer» sobre ella
  let tol = 0;
  for (let i = 0; i < n; i++) {
    const a = f(u0 + ((u1 - u0) * i) / n), b = f(u0 + ((u1 - u0) * (i + 1)) / n);
    tol = Math.max(tol, distSegmento(f(u0 + ((u1 - u0) * (i + 0.5)) / n), a, b));
  }
  return { tipo: 'curva', puntos, tol: tol * 1.05, ...op };
}

const dist = (p, q) => Math.hypot(...p.map((v, i) => v - (q[i] ?? 0)));

function distSegmento(p, a, b) {
  let num = 0, den = 0;
  for (let i = 0; i < p.length; i++) { num += (p[i] - a[i]) * (b[i] - a[i]); den += (b[i] - a[i]) ** 2; }
  const t = den === 0 ? 0 : Math.min(1, Math.max(0, num / den));
  return dist(p, a.map((v, i) => v + (b[i] - v) * t));
}

function enMarco(p, dominio, eps) {
  const ej = ['x', 'y', 'z'].filter((k) => dominio[k]);
  const dentro = ej.every((k, i) => p[i] >= dominio[k][0] - eps && p[i] <= dominio[k][1] + eps);
  return dentro && ej.some((k, i) => Math.abs(p[i] - dominio[k][0]) < eps || Math.abs(p[i] - dominio[k][1]) < eps);
}

/** Lista los extremos de línea que no caen sobre nada: un punto, una curva, otra línea, el marco o un terreno. */
export function coherencia(prims, { eps = 1e-6 } = {}) {
  const fallos = [], lineas = prims.filter((q) => q.tipo === 'linea');
  const anclado = (ext, propia) => prims.some((q) => {
    if (q.tipo === 'punto') return dist(ext, q.p) < eps;
    if (q.tipo === 'marco') return enMarco(ext, q.dominio, eps);
    if (q.tipo === 'terreno') return ext.length === 3 && Math.abs(ext[2] - q.f(ext[0], ext[1])) < eps;
    if (q.tipo === 'curva') {
      for (let i = 0; i + 1 < q.puntos.length; i++) {
        if (distSegmento(ext, q.puntos[i], q.puntos[i + 1]) < eps + q.tol) return true;
      }
      return false;
    }
    if (q.tipo === 'linea' && q !== propia) return dist(ext, q.de) < eps || dist(ext, q.a) < eps;
    return false;
  });
  for (const l of lineas) for (const extremo of [l.de, l.a]) if (!anclado(extremo, l)) fallos.push({ linea: l, extremo });
  return fallos;
}
