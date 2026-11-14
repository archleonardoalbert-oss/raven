// Diseñar el controlador: el carro en su riel, el umbral de estabilidad y el ajuste automático.
import { PARAMETROS, simular } from './pendulo.js';
import { fuerzaPendulo } from './sistemas.js';

const GRADOS = 180 / Math.PI;
const cerrar = (v, m) => Math.max(-m, Math.min(m, v));

/** Para volver al centro hay que inclinar el palo hacia él: el carro lo persigue. El palo se cuida del ángulo corregido. */
export function fuerzaConCarro(s, { kx = 0, kv = 0, ...P }, T) {
  const objetivo = -cerrar(kx * s.x + kv * s.v, 0.25);
  return fuerzaPendulo(s.theta - objetivo, s.omega, P, T);
}

/** La fuerza máxima por debajo de la cual el palo cae, con «inclinado del todo» en `a` grados. Sale de linealizar. */
export const umbralFuerza = (a, { M, m, g } = PARAMETROS) => (2 * (M + m) * g * a) / GRADOS;

/** Cuánto se aleja de la vertical y cuánto tarda en calmarse. Caer sale muy caro. */
export function costePendulo({ F, atencion }, { T = 4, dt = 0.02, a = 20 } = {}) {
  const P = { anchoAngulo: a, anchoVel: 2 / atencion, F };
  const tr = simular({ theta: 15 / GRADOS, omega: 0, x: 0, v: 0 }, { T, dt, parar: true, fuerza: (s) => fuerzaPendulo(s.theta, s.omega, P) });
  let J = 0;
  for (const s of tr) J += s.theta * s.theta * dt;
  const falta = T - tr.at(-1).t;
  return J + (falta > 1e-9 ? 1 + falta : 0);
}

const LIMITES = { F: [2, 30], atencion: [0.05, 1] };
/** Tantear: prueba a moverse en cada dirección. Si alguna mejora, va allí; si ninguna, acorta el paso. */
export function ajustar(inicio, vueltas, coste = costePendulo) {
  let p = inicio, J = coste(p), paso = 0.25;
  const h = [{ p, coste: J, paso }];
  for (let t = 0; t < vueltas; t++) {
    let mejor = null;
    for (const [k, signo] of [['F', 1], ['F', -1], ['atencion', 1], ['atencion', -1]]) {
      const [a, b] = LIMITES[k], q = { ...p, [k]: Math.max(a, Math.min(b, p[k] + signo * paso * (b - a))) }, j = coste(q);
      if (j < (mejor?.j ?? J) - 1e-12) mejor = { q, j };
    }
    if (mejor) { p = mejor.q; J = mejor.j; } else paso /= 2;
    h.push({ p, coste: J, paso });
  }
  return h;
}
