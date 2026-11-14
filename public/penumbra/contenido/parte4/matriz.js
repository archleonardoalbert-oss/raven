// Una matriz de grados dibujada en coordenadas de píxel: casillas coloreadas por su grado, con el número encima.
import { TEXTO, escalaGrado } from '../../motor/colores.js';
import { poligono, rotulo } from '../../motor/primitivas.js';

const coma = (v) => (v === 0 ? '0' : v === 1 ? '1' : String(v).replace('.', '{,}'));
const R = String.raw;

export function matriz(M, { x, y, lado = 62, filas = [], cols = [], alfa = 1, id = 'm', resalta = [], atenuar = false }) {
  const p = [];
  M.forEach((f, i) => f.forEach((v, j) => {
    const X = x + j * lado, Y = y + i * lado, marcada = resalta.some(([a, b]) => a === i && b === j), a = alfa * (atenuar && !marcada ? 0.22 : 1), c = escalaGrado(v);
    p.push(poligono([[X + 2, Y + 2], [X + lado - 2, Y + 2], [X + lado - 2, Y + lado - 2], [X + 2, Y + lado - 2]], { color: c, alfa: a }));
    if (marcada) for (const q of [[[X, Y], [X + lado, Y], [X + lado, Y + 3], [X, Y + 3]], [[X, Y + lado - 3], [X + lado, Y + lado - 3], [X + lado, Y + lado], [X, Y + lado]], [[X, Y], [X + 3, Y], [X + 3, Y + lado], [X, Y + lado]], [[X + lado - 3, Y], [X + lado, Y], [X + lado, Y + lado], [X + lado - 3, Y + lado]]]) p.push(poligono(q, { color: [255, 255, 255], alfa }));
    p.push(rotulo([X + lado / 2, Y + lado / 2], coma(v), { clave: `${id}v${i}_${j}`, tam: 19, color: v > 0.55 ? [0, 0, 0] : [255, 255, 255], alfa: a }));
  }));
  filas.forEach((t, i) => p.push(rotulo([x - 10, y + (i + 0.5) * lado], R`\text{${t}}`, { clave: `${id}f${i}`, ancla: 'r', tam: 17, color: TEXTO, alfa })));
  cols.forEach((t, j) => p.push(rotulo([x + (j + 0.5) * lado, y - 14], R`\text{${t}}`, { clave: `${id}c${j}`, tam: 17, color: TEXTO, alfa })));
  return p;
}
export const LIENZO = (W, H) => ({ x: [0, W], y: [H, 0], caja: { x: 0, y: 0, w: W, h: H } });
