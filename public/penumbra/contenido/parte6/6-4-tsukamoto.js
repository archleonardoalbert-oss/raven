import { AZUL, BLANCO, ORO, ROSA } from '../../motor/colores.js';
import { sugeno } from '../../nucleo/sistemas.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { LIENZO } from '../parte4/matriz.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const cl = (v) => Math.max(0, Math.min(1, v));
const DX = [0, 10], DZ = [0, 10];
const seco = (x) => cl(1 - x / 10), humedo = (x) => cl(x / 10);
const largo = (z) => cl((z - 2) / 6), corto = (z) => cl((6 - z) / 4);
const invLargo = (h) => 2 + 6 * h, invCorto = (h) => 6 - 4 * h;
export const riego = (x) => { const a = seco(x), b = humedo(x); return sugeno([{ fuerza: a, z: invLargo(a) }, { fuerza: b, z: invCorto(b) }]); };

const CI = { x: 70, y: 60, w: 400, h: 320 }, CD = { x: 610, y: 60, w: 420, h: 320 };
const py = (h) => CI.y + CI.h * (1 - h);

export default {
  id: '6-4-tsukamoto',
  titulo: 'Tsukamoto: conclusiones que no retroceden',
  puente: 'Ya conoces las tres máquinas. Una pregunta profunda: ¿hasta dónde llegan? ¿Hay algo que estos sistemas no puedan aprender a hacer? La respuesta sorprende.',
  pregunta: '¿Se puede leer directamente en una curva qué tiempo de riego corresponde a una fuerza dada? Sí, si la curva nunca retrocede.',
  escena: {
    id: 'tsukamoto', formato: 'plano', W: 1100, H: 540, ejes: LIENZO(1100, 540),
    entradas: [{ id: 'x', tipo: 'deslizador', etiqueta: 'humedad de la tierra', min: 0, max: 10, paso: 0.05, valor: 3 }],
    pasos: [
      { dur: 2600, texto: 'Un sistema de riego. Si la tierra está <b style="color:#58c4dd;font-weight:400">seca</b>, riego largo; si está <b style="color:#fc6282;font-weight:400">húmeda</b>, riego corto. Entra una medida: cada regla recibe una fuerza.' },
      { dur: 3000, texto: 'A la derecha, las conclusiones. Solo cambian en un sentido: «largo» <b>nunca baja</b>, «corto» <b>nunca sube</b>. Por eso, dentro de su tramo inclinado, a cada altura le corresponde un solo punto.' },
      { dur: 3000, texto: 'Lleva cada fuerza a su curva, y baja al eje. Sin figuras: cada regla da <b>un tiempo exacto</b>.' },
      { dur: 2600, texto: 'Y al final, la misma media pesada de Sugeno. <b style="color:#f4d345;font-weight:400">Esa es la orden.</b>' },
    ],
    primitivas({ q, e }) {
      const x = e.x, a = seco(x), b = humedo(x), z1 = invLargo(a), z2 = invCorto(b), s = riego(x);
      const al = ev(q(0), 0, 0.5), c = ev(q(1), 0, 0.6), ll = ev(q(2), 0, 0.6), m = ev(q(3), 0, 0.5);
      const I = [marco({ x: DX, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { x: R`\text{humedad}`, y: R`\mu` } })];
      I.push(curva((u) => [u, seco(u)], DX, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 60, color: AZUL, ancho: 2.8 }), curva((u) => [u, humedo(u)], DX, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 60, color: ROSA, ancho: 2.8 }));
      I.push(rotulo([1.4, 1], R`\text{seca}`, { clave: 'n1', dy: -14, tam: 18, color: AZUL, alfa: al }), rotulo([8.6, 1], R`\text{húmeda}`, { clave: 'n2', dy: -14, tam: 18, color: ROSA, alfa: al }));
      I.push(linea([x, 0], [x, Math.max(a, b)], { color: BLANCO, ancho: 1.4, alfa: 0.7 * al }), punto([x, a], { color: AZUL, radio: 6, alfa: al }), punto([x, b], { color: ROSA, radio: 6, alfa: al }));
      I.push(rotulo([x, a], coma(a), { clave: 'wa', dx: -14, dy: -12, ancla: 'r', tam: 17, color: AZUL, alfa: al }), rotulo([x, b], coma(b), { clave: 'wb', dx: -14, dy: 12, ancla: 'r', tam: 17, color: ROSA, alfa: al }));
      const D = [marco({ x: DZ, y: [0, 1] }, { alfa: c, ticks: { x: [0, 2, 4, 6, 8, 10], y: [0, 1] }, etiquetas: { x: R`\text{minutos de riego}` } })];
      if (c > 0) {
        D.push(curva((u) => [u, largo(u)], DZ, { hasta: Math.max(c, 1e-3), n: 100, color: AZUL, ancho: 2.8 }), curva((u) => [u, corto(u)], DZ, { hasta: Math.max(c, 1e-3), n: 100, color: ROSA, ancho: 2.8 }));
        D.push(rotulo([8.8, 1], R`\text{largo}`, { clave: 'n3', dy: -14, tam: 18, color: AZUL, alfa: c }), rotulo([1, 1], R`\text{corto}`, { clave: 'n4', dy: -14, tam: 18, color: ROSA, alfa: c }));
      }
      const N = [];
      if (ll > 0) {
        const X0 = CI.x + (x / 10) * CI.w;
        N.push(punto([X0, py(a)], { color: AZUL, radio: 2, alfa: ll }), punto([CD.x + (z1 / 10) * CD.w, py(a)], { color: AZUL, radio: 2, alfa: ll }), punto([X0, py(b)], { color: ROSA, radio: 2, alfa: ll }), punto([CD.x + (z2 / 10) * CD.w, py(b)], { color: ROSA, radio: 2, alfa: ll }));
        N.push(linea([X0, py(a)], [CD.x + (z1 / 10) * CD.w, py(a)], { color: AZUL, ancho: 1.3, alfa: 0.7 * ll, discontinua: true }), linea([X0, py(b)], [CD.x + (z2 / 10) * CD.w, py(b)], { color: ROSA, ancho: 1.3, alfa: 0.7 * ll, discontinua: true }));
        D.push(punto([z1, a], { color: AZUL, radio: 6, alfa: ll }), linea([z1, a], [z1, 0], { color: AZUL, ancho: 1.6, alfa: ll }), punto([z2, b], { color: ROSA, radio: 6, alfa: ll }), linea([z2, b], [z2, 0], { color: ROSA, ancho: 1.6, alfa: ll }));
      }
      if (m > 0) {
        D.push(linea([s, 0], [s, 0.18], { color: ORO, ancho: 3.4, alfa: m }), punto([s, 0.18], { color: ORO, radio: 3, alfa: m }), punto([s, 0], { color: ORO, radio: 8, alfa: m }));
        N.push(rotulo([550, 470], R`z = \dfrac{{\color{#58c4dd}${coma(a)}} \cdot ${coma(z1)} + {\color{#fc6282}${coma(b)}} \cdot ${coma(z2)}}{${coma(a)} + ${coma(b)}} = {\color{#f4d345}${coma(s)}\ \text{minutos}}`, { clave: 'cuenta', tam: 23, alfa: m }));
      }
      return { principal: N, paneles: [{ ejes: { x: DX, y: [0, 1], caja: CI }, prims: I }, { ejes: { x: DZ, y: [0, 1], caja: CD }, prims: D }] };
    },
  },
  manipulacion: '<ul><li>Mueve la humedad, y sigue con la vista las líneas: de cada fuerza, a su curva; de la curva, al eje.</li><li>Con tierra muy seca, ¿cuánto riega? ¿Y muy húmeda?</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Tsukamoto (1979) exige una sola cosa: que las conclusiones sean [[monótonas|monótona]], que solo avancen en un sentido. Entonces, cada altura corresponde a un solo punto, y cada regla da un número exacto sin recortes. Es un punto medio: las conclusiones siguen siendo palabras, como en Mamdani, y el cálculo es tan barato como en Sugeno.' },
    { tipo: 'ejemplo', texto: 'Con humedad 3:', tabla: [['Regla', 'Fuerza', 'Lectura en la curva', 'Minutos'], ['Seca → largo', '0,7', '2 + 6 · 0,7', '6,2'], ['Húmeda → corto', '0,3', '6 − 4 · 0,3', '4,8']], cierre: 'Media pesada: $0{,}7 \\cdot 6{,}2 + 0{,}3 \\cdot 4{,}8 = 5{,}78$ minutos.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\mu_{C_i}`, dice: 'La curva de la conclusión. Debe ser monótona.' },
      { tex: R`\mu_{C_i}^{-1}`, dice: 'Su inversa: le das una altura, y te devuelve el punto. El $-1$ no es un exponente: significa «hacia atrás».' },
      { tex: R`z_i = \mu_{C_i}^{-1}(w_i)`, dice: 'Lo que dice la regla $i$: el punto de su curva a la altura de su fuerza.' },
    ], todo: R`z = \frac{\sum_i w_i\, \mu_{C_i}^{-1}(w_i)}{\sum_i w_i}`, lee: 'Es la media de Sugeno, con los resultados leídos en las curvas.' },
    { tipo: 'formal', titulo: 'Sistema de Tsukamoto', tex: R`Con reglas «si $x$ es $A_i$, entonces $z$ es $C_i$», donde cada $\mu_{C_i}$ es estrictamente [[monótona]], la salida es la fórmula anterior, con $w_i = \mu_{A_i}(x)$.`, lee: '«Estrictamente» significa que no se queda plana. Las de la escena tienen tramos planos en los extremos: se lee solo en su tramo inclinado, y entre 0 y 1 ya da un único punto.' },
    { tipo: 'demo', titulo: 'Estricta significa una sola respuesta', plan: 'Por qué se exige que la curva no se quede plana: si dos puntos distintos tuvieran la misma altura, la lectura sería ambigua.', tex: R`Si $\mu$ es estrictamente creciente, a cada altura le corresponde a lo sumo un punto.`, pasos: [
      { texto: R`Supongamos que $z_1 \neq z_2$ tienen la misma altura. Sea, por ejemplo, $z_1 < z_2$.`, porque: 'Se razona por contradicción: se supone lo contrario y se busca un choque.' },
      { texto: R`Por ser estrictamente creciente, $\mu(z_1) < \mu(z_2)$.`, porque: 'Definición: si avanza $z$, sube la altura.' },
      { texto: R`Eso contradice que tengan la misma altura. Por tanto, no existen esos dos puntos.`, porque: 'La suposición lleva a un absurdo.' },
    ] },
    { tipo: 'nota', titulo: 'Las tres máquinas', texto: 'Mamdani: conclusiones como figuras, y hay que concretar. Sugeno: conclusiones como fórmulas, y media pesada. Tsukamoto: conclusiones como curvas monótonas, y media pesada de las lecturas.' },
  ],
  tecnicas: [
    { titulo: 'Busca un choque', texto: 'Para probar que algo es único, supón que hay dos, y busca una contradicción. Es la técnica estándar de unicidad.' },
  ],
  retos: [
    { id: 'lleva-salida', tipo: 'manipular', enunciado: R`Busca la humedad con la que se riega $5$ minutos, con un margen de $0{,}25$.`, precision: (e) => (Math.abs(riego(e.x) - 5) <= 0.25 ? 1 : 0), prueba: { x: 4.2 }, pendiente: (e) => `Ahora se riega ${riego(e.x).toFixed(2).replace('.', ',')} minutos.`, pistas: ['Con más humedad, menos riego.'], explicacion: 'Las dos reglas se reparten el trabajo.' },
    { id: 'tsukamoto-calc', tipo: 'calcular', enunciado: R`Con la curva $\mu(z) = \frac{z}{10}$, y una fuerza de $0{,}4$, ¿qué valor de $z$ da la regla?`, respuesta: 4, tol: 0.001, pistas: [R`Despeja $z$ en $\frac{z}{10} = 0{,}4$.`], explicacion: R`$z = 10 \cdot 0{,}4 = 4$.` },
    { id: 'tsukamoto-elegir', tipo: 'elegir', enunciado: '¿Por qué un triángulo no sirve como conclusión en Tsukamoto?', opciones: ['Porque no es difuso', 'Porque, a una misma altura, sube y baja: habría dos puntos', 'Porque es demasiado estrecho', 'Porque no llega a 1'], correcta: 1, explicacion: 'Un triángulo no es monótono: la lectura hacia atrás sería ambigua.' },
  ],
  referencias: ['Y. Tsukamoto, «An approach to fuzzy reasoning method», en <em>Advances in Fuzzy Set Theory and Applications</em> (1979).', 'J.-S. R. Jang, C.-T. Sun, E. Mizutani, <em>Neuro-Fuzzy and Soft Computing</em>, 1997, cap. 4.'],
};
