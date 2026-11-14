// Los dos guiones de la portada, como funciones puras del tiempo: el mapa que nace de su fórmula, y el viaje entre capítulos.
import { ev } from './tiempo.js';

export const DURA_NACER = 17, DURA_VIAJE = 7.4;
const T_CAMPANAS = 2.6, D_CAMPANA = 0.62;
/** Una campana sube, se pasa un poco y se asienta: se nota que es un valor que llega a su sitio. */
const asienta = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2);

export function guionNacer(t) {
  return {
    ejes: ev(t, 0.3, 1.4), plano: ev(t, 1.15, 2.4), base: ev(t, 1.2, 2.2),
    s: Array.from({ length: 8 }, (_, k) => asienta(Math.min(1, Math.max(0, (t - T_CAMPANAS - k * D_CAMPANA) / 0.95)))),
    roca2: ev(t, 8.2, 9.3), roca5: ev(t, 9.3, 10.8),
    mat: ev(t, 11, 13.6), caja: ev(t, 11.4, 14.2), cielo: ev(t, 11.8, 14.2),
    giro: ev(t, 10.6, 14.8), camino: ev(t, 13.2, 15.6), rotulos: ev(t, 14.8, 15.8), ui: ev(t, 15, 16.2),
    trazos: 1 - ev(t, 11, 12.6), formula: ev(t, 0.9, 1.5) * (1 - ev(t, 13.4, 14.6)),
  };
}

export function formulaNacer(t) {
  if (t < 1.15) return { tex: '', texto: '' };
  const a = String.raw`{\color{#58c4dd}a_i}`, g = String.raw`{\color{#f4d345}g_i}`;
  if (t < T_CAMPANAS) return { tex: 'z(p) = b', texto: 'Todo empieza plano: una función constante, sobre todos los puntos p = (x, y) del cuadrado.' };
  const campana = (i) => String.raw`${i}\, e^{-\frac{\|p - c_i\|^2}{2\sigma^2}}`;
  const k = Math.min(8, 1 + Math.floor((t - T_CAMPANAS) / D_CAMPANA));
  if (t < 8.2) return { tex: String.raw`z(p) = b + \sum_{i=1}^{${k}} ${campana(a)}`, texto: String.raw`Cada capítulo es una campana, centrada en su punto $c_i$. Su altura es $a_i = m + e\,${g}$: crece con $${g}$, tu grado.` };
  const n = t < 9.3 ? 2 : 6, suma = String.raw`z(p) = b + \sum_{i=1}^{8} ${campana(a)} + \rho(p)`;
  if (t < 11) return { tex: suma, texto: String.raw`Y la roca: $\rho$ suma ${n} octavas de ruido plegado, $1 - |2n - 1|$, cada una al doble de frecuencia. Eso dibuja las crestas.` };
  return { tex: suma, texto: 'Sigue siendo esta misma función. Lo demás es luz.' };
}

export function guionViaje(t) {
  const recorrido = ev(t, 1.15, 4.75);
  return {
    recorrido, deja: ev(t, 0.35, 0.9) * (1 - ev(t, 1.7, 2.3)), tarjeta: ev(t, 4.5, 5.2), llega: ev(t, 4.2, 5),
    zambulle: ev(t, 6.05, DURA_VIAJE), expo: ev(t, 0, 0.8) * (1 - ev(t, 6.7, DURA_VIAJE)), chase: ev(t, 0.5, 2.2) * (1 - ev(t, 4.3, 5.6)),
    altura: Math.sin(Math.PI * recorrido),
  };
}
