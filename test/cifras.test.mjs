import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlCifras } from '../herramientas/medios.mjs';

test('cifras: sin datos no hay sección', () => { assert.equal(htmlCifras(), ''); assert.equal(htmlCifras([]), ''); });
test('cifras: cada cifra con su número y su texto en los dos idiomas, escapados', () => {
  const h = htmlCifras([{ n: '937', es: 'pruebas <automáticas>', en: 'automated tests' }, { n: '76', es: 'paradas', en: 'stops' }]);
  assert.match(h, /class="p-cifras"/);
  assert.match(h, /<span lang="es">En cifras<\/span><span lang="en">In numbers<\/span>/);
  assert.match(h, /<dt>937<\/dt><dd><span lang="es">pruebas &lt;automáticas&gt;<\/span><span lang="en">automated tests<\/span><\/dd>/);
  assert.equal((h.match(/<dt>/g) || []).length, 2);
});
test('cifras: el número puede tener versión por idioma (coma o punto decimal)', () => {
  const h = htmlCifras([{ n: { es: '1,3 W', en: '1.3 W' }, es: 'de consumo', en: 'of power' }]);
  assert.match(h, /<dt><span lang="es">1,3 W<\/span><span lang="en">1.3 W<\/span><\/dt>/);
});
