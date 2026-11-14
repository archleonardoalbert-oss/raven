// Sistemas difusos completos: agregar, concretar la salida, Sugeno, Tsukamoto y el controlador del péndulo.
const malla = ([a, b], n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

/** El punto de equilibrio de la figura. Si la figura está vacía, el centro del dominio. */
export function centroide(f, dom, n = 1000) {
  let s = 0, m = 0;
  for (const x of malla(dom, n)) { const v = f(x); s += v; m += x * v; }
  return s > 1e-12 ? m / s : (dom[0] + dom[1]) / 2;
}

/** El punto que parte la figura en dos trozos de igual área. */
export function bisector(f, dom, n = 1000) {
  const xs = malla(dom, n), vs = xs.map(f), total = vs.reduce((a, b) => a + b, 0);
  if (total <= 1e-12) return (dom[0] + dom[1]) / 2;
  let ac = 0;
  for (let i = 0; i < xs.length; i++) { ac += vs[i]; if (ac >= total / 2) return xs[i]; }
  return dom[1];
}

/** Dónde empieza, dónde acaba y por dónde queda el centro de los puntos más altos. */
export function maximos(f, dom, n = 1000) {
  const xs = malla(dom, n), vs = xs.map(f), top = Math.max(...vs), en = xs.filter((_, i) => vs[i] >= top - 1e-9);
  return { altura: top, primero: en[0], ultimo: en.at(-1), medio: en.reduce((a, b) => a + b, 0) / en.length };
}

/** Recorta cada salida a la fuerza de su regla, y une con máximo. */
export const agregar = (reglas, T = Math.min) => (y) => Math.max(0, ...reglas.map((r) => T(r.fuerza, r.salida(y))));

/** Media de los resultados, pesada por la fuerza de cada regla. Si ninguna se dispara, 0. */
export function sugeno(reglas) {
  const s = reglas.reduce((a, r) => a + r.fuerza, 0);
  return s > 1e-12 ? reglas.reduce((a, r) => a + r.fuerza * r.z, 0) / s : 0;
}
export const tsukamoto = (reglas) => sugeno(reglas.map((r) => ({ fuerza: r.fuerza, z: r.inversa(r.fuerza) })));

/** Un sistema de Sugeno con n triángulos en [0, 1], y como salida el valor de f en el centro de cada uno. */
export function interpolante(f, n) {
  const h = 1 / (n - 1);
  return (x) => {
    const i = Math.min(n - 2, Math.floor(x / h)), u = (x - i * h) / h;
    return (1 - u) * f(i * h) + u * f((i + 1) * h);
  };
}
export function peorError(f, n, m = 1000) {
  const g = interpolante(f, n);
  return Math.max(...malla([0, 1], m).map((x) => Math.abs(f(x) - g(x))));
}

const grados = (v, ancho) => {
  const u = Number.isFinite(ancho) ? Math.max(-1, Math.min(1, v / ancho)) : 0;
  return [Math.max(0, -u), 1 - Math.abs(u), Math.max(0, u)];
};
/** Filas: ángulo (izquierda, recto, derecha). Columnas: velocidad (a la izquierda, quieto, a la derecha). Valores: fracción de F. */
export const TABLA_PENDULO = [[-1, -0.5, 0], [-0.5, 0, 0.5], [0, 0.5, 1]];

/** Con cuánta fuerza se dispara cada una de las 9 reglas (por filas). Con ancho infinito, esa entrada se ignora y vale «recto». */
export function activaciones(theta, omega, { anchoAngulo, anchoVel }, T = (u, v) => u * v) {
  const a = grados((theta * 180) / Math.PI, anchoAngulo), w = grados(omega, anchoVel), r = [];
  for (const u of a) for (const v of w) r.push(T(u, v));
  return r;
}
export function fuerzaPendulo(theta, omega, P, T) {
  const act = activaciones(theta, omega, P, T), z = TABLA_PENDULO.flat();
  return (P.F ?? 18) * sugeno(act.map((fuerza, i) => ({ fuerza, z: z[i] })));
}
