import { temporal } from './temporal.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validarHabilidades, modulosDatos } from '../herramientas/datos.mjs';
import { construir } from '../construir.mjs';
import { MUESTRA, copiaMuestra } from './muestra.mjs';

const area = (h) => ({ es: 'Área', en: 'Area', principal: true, lema: { es: 'L', en: 'L' }, habilidades: h });
const proyectos = [{ id: 'penumbra', nombre: 'Penumbra', principal: true }, { id: 'hortus', nombre: 'Hortus Algorithmicus', nombreCorto: 'Hortus' }];

test('una habilidad que cita un proyecto inexistente: error que lo nombra', () => {
  assert.throws(() => validarHabilidades([area([{ es: 'X', en: 'X', proyectos: ['fantasma'] }])], proyectos), /fantasma/);
});
test('«raven» (la propia web) se acepta como proyecto citado', () => {
  validarHabilidades([area([{ es: 'X', en: 'X', proyectos: ['penumbra', 'raven'] }])], proyectos);
});
test('el mapa muestra el nombre corto del proyecto si lo tiene', () => {
  const { habilidades } = modulosDatos({ habilidades: [area([{ es: 'X', en: 'X', proyectos: ['hortus', 'raven'] }])], proyectos, sistemas: {} });
  assert.match(habilidades, /"Hortus",\s*"Raven"/);
});
test('un área sin habilidades: error', () => {
  assert.throws(() => validarHabilidades([area([])], proyectos), /sin habilidades/);
});
test('construir genera los módulos de habilidades y sistemas a partir de los JSON', async () => {
  const r = copiaMuestra(), tmp = join(r, 'dist'); await construir({ raiz: r, salida: 'dist' });
  const { AREAS } = await import(join(tmp, 'assets/habilidades-datos.js'));
  const { SISTEMAS } = await import(join(tmp, 'assets/sistemas-datos.js'));
  const h = JSON.parse(readFileSync(join(MUESTRA, 'habilidades.json'), 'utf8'));
  assert.equal(AREAS.length, h.length);
  assert.deepEqual(AREAS[0].h[0], { es: 'Lógica difusa', en: 'Fuzzy logic', p: ['Penumbra', 'Hortus'] });
  assert.deepEqual(Object.keys(SISTEMAS), ['penumbra', 'semillero', 'hortus']);
  assert.deepEqual(SISTEMAS.hortus, JSON.parse(readFileSync(join(MUESTRA, 'sistemas/hortus.json'), 'utf8')));
});
test('modulosDatos solo incluye sistemas de proyectos principales', () => {
  const { sistemas } = modulosDatos({ habilidades: [area([{ es: 'X', en: 'X', proyectos: [] }])], proyectos: [{ id: 'a', principal: false }, { id: 'b', principal: true }], sistemas: { a: { x: 1 }, b: { y: 2 } } });
  assert.match(sistemas, /"b"/); assert.doesNotMatch(sistemas, /"a"/);
});
