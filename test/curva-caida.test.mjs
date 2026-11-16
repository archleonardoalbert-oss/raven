import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splineMonotona, crearCurva, TRAMOS, desplazamiento } from '../sitio/assets/curva-caida.js';
import { vista } from '../sitio/assets/penumbra/caida.js';

const C = crearCurva({ R0: 125, radios: [30, 17, 9.5, 5.6, 3.6], rBoton: 2.8, salida: 30 });
const h = 1e-7;
const vel = (p) => (Math.log(C.pose(p + h).r) - Math.log(C.pose(p - h).r)) / (2 * h);
const velAz = (p) => (C.pose(p + h).az - C.pose(p - h).az) / (2 * h);

test('spline monótona: pasa por los nudos y no se sale de ellos', () => {
  const f = splineMonotona([0, 1, 2, 3], [10, 4, 3.5, 1]);
  assert.equal(f(0), 10); assert.equal(f(2), 3.5); assert.ok(Math.abs(f(3) - 1) < 1e-12);
  for (let x = 0; x <= 3; x += 0.01) assert.ok(f(x) <= 10 + 1e-9 && f(x) >= 1 - 1e-9);
});
test('la aproximación pasa por los cinco faros (k entero) con su radio, y termina en el botón', () => {
  for (let k = 0; k < 5; k++) { const p = C.pFaro(k), q = C.pose(p); assert.ok(Math.abs(q.k - k) < 1e-6, `k=${q.k}`); assert.ok(Math.abs(q.r - [30, 17, 9.5, 5.6, 3.6][k]) < 1e-6); }
  assert.ok(Math.abs(C.pose(TRAMOS.A).r - 2.8) < 1e-9); assert.equal(C.pose(TRAMOS.A).fase, 'pausa');
  assert.ok(Math.abs(C.pose(0).r - 125) < 1e-9);
});
test('log r es monótona en la aproximación', () => {
  let ant = Infinity; for (let p = 0; p <= TRAMOS.A; p += 0.001) { const r = C.pose(p).r; assert.ok(r <= ant + 1e-9); ant = r; }
});
test('velocidad continua en toda la escena (sin esquinas en los faros ni en los cambios de tramo)', () => {
  // a ambos lados de cada nudo y de cada cambio de tramo, la misma velocidad
  const puntos = [...[0, 1, 2, 3, 4].map((k) => C.pFaro(k)), TRAMOS.A, TRAMOS.B];
  for (const x of puntos) for (const v of [vel, velAz]) {
    const a = v(x - 2e-6), b = v(x + 2e-6);  // muy cerca: una esquina da salto, una aceleración no
    assert.ok(Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1) < 0.03, `esquina en p=${x.toFixed(4)}: ${a.toFixed(3)} → ${b.toFixed(3)}`);
  }
  // y en todo el recorrido, ningún cambio brusco entre pasos pequeños
  // (la retirada acelera fuerte a propósito, pero sin esquinas: la cubre la prueba de arriba)
  for (let p = 0.002; p < TRAMOS.A - 0.002; p += 0.0005) for (const v of [vel, velAz]) {
    const a = v(p), b = v(p + 0.0005);
    // escala: la velocidad típica de la escena (~5); arrancar desde 0 no cuenta como cambio brusco
    assert.ok(Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 5) < 0.15, `cambio brusco en p=${p.toFixed(4)}: ${a.toFixed(3)} → ${b.toFixed(3)}`);
  }
});
test('arranca y frena desde parada; la pausa es quieta', () => {
  assert.ok(Math.abs(vel(0.0001)) < 0.5); assert.ok(Math.abs(vel(TRAMOS.A - 0.0001)) < 0.5);
  const q = C.pose(TRAMOS.A + 0.01), w = C.pose(TRAMOS.B - 0.01);
  assert.equal(q.r, w.r); assert.equal(q.az, w.az); assert.equal(q.fase, 'pausa');
});
test('la retirada deshace el camino (más rápida) y sale con la velocidad pedida hacia la galaxia', () => {
  assert.equal(C.pose(TRAMOS.B + 0.01).fase, 'retirada');
  assert.ok(Math.abs(C.pose(TRAMOS.R - 1e-9).r - 125) < 0.5);
  const v = vel(TRAMOS.R - 0.0002);
  assert.ok(Math.abs(v - 30) / 30 < 0.05, `velocidad de salida ${v}`);
  assert.ok((TRAMOS.R - TRAMOS.B) * 3 <= TRAMOS.A + 1e-9, 'al menos tres veces más corta');
});
test('al principio la pose es la de la galaxia (mezcla 0, inclinación y campo de la galaxia) y en los faros, la de la caída (mezcla 1)', () => {
  assert.equal(C.pose(0).mezcla, 0); assert.equal(C.pose(C.pFaro(0)).mezcla, 1);
  assert.ok(Math.abs(C.pose(0).inc - Math.atan2(2, 4.6)) < 1e-9); assert.ok(Math.abs(C.pose(0).fov - (50 * Math.PI) / 180) < 1e-9);
});

test('ritmo constante: en el centro de la aproximación la cámara real (posición y mirada) avanza a ritmo parejo (±12 %)', () => {
  // velocidad percibida: cambio de log r, del ángulo y del giro de la mirada
  const cam = (p) => { const q = C.pose(p); return vista(q, { lado: 0.08 * q.mezcla }); };
  const vp = (p) => desplazamiento(cam(p - 1e-6), cam(p + 1e-6)) / 2e-6;
  const vs = []; for (let p = TRAMOS.A * 0.15; p < TRAMOS.A * 0.85; p += 0.005) vs.push(vp(p));
  const med = vs.reduce((s, x) => s + x, 0) / vs.length;
  for (const v of vs) assert.ok(Math.abs(v - med) / med < 0.12, `velocidad ${v.toFixed(2)} frente a media ${med.toFixed(2)}`);
});
