import { test } from 'node:test';
import assert from 'node:assert/strict';
import { volcarTextos } from '../herramientas/volcar-textos.mjs';

test('vuelca el texto visible por idioma, sin scripts, estilos ni svg', () => {
  const v = volcarTextos('test/fixtures/volcado');
  assert.deepEqual(v['index.html'], [[null, 'T'], [null, 'Hola mundo'], ['es', 'Uno & dos'], ['en', 'One & two']]);
  assert.deepEqual(v['sub/index.html'], [[null, 'Sub']]);
});

test('incluye los <meta> con nombre y omite el doctype', () => {
  const v = volcarTextos('test/fixtures/meta');
  assert.deepEqual(v['index.html'], [['meta:description', 'Desc'], [null, 'X']]);
});
