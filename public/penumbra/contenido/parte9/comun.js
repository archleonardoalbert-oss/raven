// Piezas comunes de las escenas del amanecer.
import { linea, poligono, punto } from '../../motor/primitivas.js';

const R = String.raw;
export const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
export const texto = (t) => R`\text{${t}}`;
/** Una flecha: del punto p, con vector v. Nace y acaba en puntos, para que se vea dónde empieza y dónde termina. */
export function flecha(p, v, { color, alfa = 1, ancho = 2.4 } = {}) {
  const q = [p[0] + v[0], p[1] + v[1]];
  return [punto(p, { color, radio: 3, alfa, halo: 0 }), linea(p, q, { color, ancho, alfa }), punto(q, { color, radio: 5, alfa, halo: 0 })];
}
/** Una barra rectangular entre x0 y x1, de y0 a y1. */
export const barra = (x0, x1, y1, op = {}, y0 = 0) => poligono([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], op);
/** Un tramo recto con sus dos extremos marcados: se ve dónde empieza y dónde termina. */
export const tramo = (p, q, { color, alfa = 1, ancho = 2, discontinua, radio = 2 } = {}) => [punto(p, { color, radio, alfa, halo: 0 }), linea(p, q, { color, ancho, alfa, discontinua }), punto(q, { color, radio, alfa, halo: 0 })];
