import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirParadas, paradaEn, crearAutomata, duracionViaje } from '../sitio/assets/conductor-modelo.js';

const ALTO = 1000;
const P = construirParadas({
  descansos: [{ id: 'inicio', nombre: { es: 'Portada' }, ini: 0, fin: 600 }, { id: 'sobre-mi', nombre: { es: 'Sobre mí' }, ini: 2000, fin: 3000 }, { id: 'habilidades', ini: 3500, fin: 9000 }, { id: 'contacto', nombre: { es: 'Contacto' }, ini: 12000, fin: 12800 }],
  faros: [{ id: 'faro-0', nombre: { es: 'Matemáticas' }, ini: 4000, fin: 4500 }, { id: 'faro-1', nombre: { es: 'Gráficos' }, ini: 5500, fin: 6000 }],
  resumen: { id: 'resumen', nombre: { es: 'Resumen' }, ini: 8000, fin: 8600 },
});
function reloj() { let t = 0; return { ahora: () => t, pasar: (ms) => { t += ms; } }; }

test('construirParadas: ordena, quita la caída entera y mete faros y resumen', () => {
  assert.deepEqual(P.map((p) => p.id), ['inicio', 'sobre-mi', 'faro-0', 'faro-1', 'resumen', 'contacto']);
  assert.equal(paradaEn(P, 300), 0); assert.equal(paradaEn(P, 1500), -1); assert.equal(paradaEn(P, 4500), 2);
});
test('dentro de la zona: nativo; un paso que cruzaría el borde se ajusta al borde', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  assert.deepEqual(a.evento('rueda', { dy: 100, y: 200, paradas: P }), { hacer: 'nativo' });
  assert.deepEqual(a.evento('rueda', { dy: 100, y: 560, paradas: P }), { hacer: 'ajustar', y: 600 });
});
test('en el borde se acumula el empuje y al llegar al 33 % viaja; si se suelta 600 ms, vuelve a cero', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  const o1 = a.evento('rueda', { dy: 100, y: 600, paradas: P });
  assert.equal(o1.hacer, 'retener'); assert.ok(Math.abs(o1.progreso - 100 / 330) < 0.01); assert.equal(o1.destino.id, 'sobre-mi');
  r.pasar(700);
  assert.ok(a.evento('rueda', { dy: 100, y: 600, paradas: P }).progreso < 0.35, 'se vació');
  r.pasar(50); a.evento('rueda', { dy: 120, y: 600, paradas: P }); r.pasar(50);
  const o = a.evento('rueda', { dy: 120, y: 600, paradas: P });
  assert.equal(o.hacer, 'viajar'); assert.equal(o.y, 2001); assert.equal(o.destino.id, 'sobre-mi');
  assert.equal(o.duracion, duracionViaje(1401, ALTO));
});
test('subiendo viaja al final de la parada anterior', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  a.evento('rueda', { dy: -200, y: 2000, paradas: P }); r.pasar(30);
  const o = a.evento('rueda', { dy: -200, y: 2000, paradas: P });
  assert.equal(o.hacer, 'viajar'); assert.equal(o.y, 599);
});
test('tras llegar, la inercia no encadena otro viaje; tras 300 ms quieto vuelve a acumular', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  a.evento('llegada', {});
  for (let i = 0; i < 20; i++) { r.pasar(16); assert.equal(a.evento('rueda', { dy: 80, y: 3000, paradas: P }).hacer, 'retener'); }
  assert.equal(a.evento('rueda', { dy: 80, y: 3000, paradas: P }).progreso, 0);
  r.pasar(350);
  assert.ok(a.evento('rueda', { dy: 80, y: 3000, paradas: P }).progreso > 0);
});
test('teclado: dentro nativo; en el borde viaja al momento', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  assert.equal(a.evento('tecla', { tecla: ' ', y: 300, paradas: P }).hacer, 'nativo');
  assert.equal(a.evento('tecla', { tecla: 'PageDown', y: 600, paradas: P }).hacer, 'viajar');
  assert.equal(a.evento('tecla', { tecla: 'ArrowUp', y: 2000, paradas: P }).y, 599);
});
test('táctil: un gesto rápido hacia fuera en el borde viaja; uno lento no', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  assert.equal(a.evento('toqueFin', { velocidad: 0.3, y: 600, paradas: P }).hacer, 'nativo');
  assert.equal(a.evento('toqueFin', { velocidad: 1.4, y: 600, paradas: P }).hacer, 'viajar');
});
test('quieto en un trayecto: con gesto reciente vuelve al borde; sin gesto (barra) viaja a la más cercana en la dirección del movimiento', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  a.evento('rueda', { dy: 50, y: 200, paradas: P }); r.pasar(100);
  assert.deepEqual(a.evento('quieto', { y: 700, paradas: P, sentido: 1 }), { hacer: 'ajustar', y: 600 });
  r.pasar(1000);
  const o = a.evento('quieto', { y: 1200, paradas: P, sentido: 1 });
  assert.equal(o.hacer, 'viajar'); assert.equal(o.y, 2001);
});
test('en la última parada, empujar hacia abajo retiene sin destino', () => {
  const r = reloj(), a = crearAutomata({ alto: ALTO, ahora: r.ahora });
  const o = a.evento('rueda', { dy: 300, y: 12800, paradas: P });
  assert.equal(o.hacer, 'retener'); assert.equal(o.destino, null);
});
test('duración: entre 1,4 y 2,6 s, con ritmo por pantallas', () => {
  assert.equal(duracionViaje(100, 1000), 1400); assert.equal(duracionViaje(20000, 1000), 2600);
  assert.equal(duracionViaje(3000, 1000), 1650);
});
