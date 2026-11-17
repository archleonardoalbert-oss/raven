// Regenera test/referencia/textos.json a partir de la muestra fija (test/muestra) con las tres demos, igual que la
// prueba «los textos de dist coinciden con la referencia». Úsalo solo cuando un cambio de plantilla o de textos de la
// muestra sea intencionado, y revisa el diff antes de guardarlo.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { construir } from '../construir.mjs';
import { volcarTextos } from './volcar-textos.mjs';
import { copiaMuestra } from '../test/muestra.mjs';

const r = copiaMuestra({ demos: ['penumbra', 'semillero', 'hortus'], prefijo: 'raven-raiz-' });
await construir({ raiz: r, salida: 'dist' });
writeFileSync(new URL('../test/referencia/textos.json', import.meta.url), JSON.stringify(volcarTextos(join(r, 'dist')), null, 1) + '\n');
console.log('referencia regenerada');
