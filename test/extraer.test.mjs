import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extraerTextos } from '../herramientas/extraer-textos.mjs';

test('sustituye pares de spans por marcadores con clave por sección', () => {
  const { plantilla, textos } = extraerTextos('<section id="hero"><h1><span lang="es">Hola</span>\n <span lang="en">Hi</span></h1><p><span lang="es">A <b>b</b></span><span lang="en">A <b>b</b></span></p></section>');
  assert.equal(plantilla, '<section id="hero"><h1>{{t hero.1}}</h1><p>{{t hero.2}}</p></section>');
  assert.deepEqual(textos, { hero: { 1: { es: 'Hola', en: 'Hi' }, 2: { es: 'A <b>b</b>', en: 'A <b>b</b>' } } });
});
