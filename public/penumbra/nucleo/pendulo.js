// El péndulo invertido sobre un carro: la física que tu controlador difuso tendrá que dominar.
// Varilla uniforme de masa m y semilongitud l sobre un carro de masa M; theta se mide desde la vertical.
export const PARAMETROS = { M: 1, m: 0.1, l: 0.5, g: 9.8 };

function derivadas(s, F, P) {
  const { M, m, l, g } = P, t = M + m, sen = Math.sin(s.theta), cos = Math.cos(s.theta);
  const aux = (F + m * l * s.omega * s.omega * sen) / t;
  const alfa = (g * sen - cos * aux) / (l * (4 / 3 - (m * cos * cos) / t));
  return { theta: s.omega, omega: alfa, x: s.v, v: aux - (m * l * alfa * cos) / t };
}

const suma = (s, d, h) => ({ theta: s.theta + d.theta * h, omega: s.omega + d.omega * h, x: s.x + d.x * h, v: s.v + d.v * h });

/** Integra con Runge-Kutta de orden 4. `fuerza(s, t)` da la fuerza sobre el carro. Devuelve la lista de estados. */
export function simular(inicial, { T, dt = 0.01, fuerza = () => 0, parar = false, parametros = PARAMETROS }) {
  const r = [{ ...inicial, t: 0 }];
  let s = inicial;
  for (let i = 1; i <= Math.round(T / dt); i++) {
    const F = fuerza(s, (i - 1) * dt);
    const k1 = derivadas(s, F, parametros), k2 = derivadas(suma(s, k1, dt / 2), F, parametros), k3 = derivadas(suma(s, k2, dt / 2), F, parametros), k4 = derivadas(suma(s, k3, dt), F, parametros);
    s = { theta: s.theta + (dt / 6) * (k1.theta + 2 * k2.theta + 2 * k3.theta + k4.theta), omega: s.omega + (dt / 6) * (k1.omega + 2 * k2.omega + 2 * k3.omega + k4.omega), x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x), v: s.v + (dt / 6) * (k1.v + 2 * k2.v + 2 * k3.v + k4.v) };
    if (parar && Math.abs(s.theta) >= Math.PI / 2) { r.push({ theta: Math.sign(s.theta) * Math.PI / 2, omega: 0, x: s.x, v: 0, t: i * dt }); break; }
    r.push({ ...s, t: i * dt });
  }
  return r;
}

export function energia(s, { M, m, l, g } = PARAMETROS) {
  return 0.5 * (M + m) * s.v * s.v + m * l * s.v * s.omega * Math.cos(s.theta) + (2 / 3) * m * l * l * s.omega * s.omega + m * g * l * Math.cos(s.theta);
}
