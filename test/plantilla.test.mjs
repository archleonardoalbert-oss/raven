import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rellenar } from '../herramientas/plantilla.mjs';

const opc = { archivo: 'prueba.html' };

test('{{t}} emite los dos idiomas en spans', () => {
  assert.equal(rellenar('{{t a.b}}', { a: { b: { es: 'Hola', en: 'Hi' } } }, opc), '<span lang="es">Hola</span><span lang="en">Hi</span>');
});
test('{{es}} y {{en}} escapan para atributos', () => {
  assert.equal(rellenar('<meta content="{{es m}}">', { m: { es: 'A & "B"', en: 'x' } }, opc), '<meta content="A &amp; &quot;B&quot;">');
  assert.equal(rellenar('{{en m}}', { m: { es: 'x', en: 'Y' } }, opc), 'Y');
});
test('el HTML en línea de un texto se conserva', () => {
  assert.equal(rellenar('{{t x}}', { x: { es: 'μ<sub>A</sub>', en: 'μ<sub>A</sub>' } }, opc), '<span lang="es">μ<sub>A</sub></span><span lang="en">μ<sub>A</sub></span>');
});
test('{{json}} incrusta el valor como JSON', () => {
  assert.equal(rellenar('{{json d}}', { d: [1, 'a'] }, opc), '[1,"a"]');
});
test('falta una clave: error con la clave y el archivo', () => {
  assert.throws(() => rellenar('{{t nada}}', {}, { archivo: 'plantillas/index.html' }), /Falta el texto «nada».*plantillas\/index\.html/);
});
test('falta un idioma: error que lo nombra', () => {
  assert.throws(() => rellenar('{{t x}}', { x: { es: 'Hola' } }, opc), /idioma en/);
});
test('{{es-html}} y {{en-html}} insertan un idioma sin escapar (bloques de párrafos)', () => {
  assert.equal(rellenar('<div lang="es">{{es-html p}}</div>', { p: { es: '<p>A & b</p>', en: '<p>x</p>' } }, opc), '<div lang="es"><p>A & b</p></div>');
  assert.equal(rellenar('{{en-html p}}', { p: { es: 'x', en: '<p>Y</p>' } }, opc), '<p>Y</p>');
});
