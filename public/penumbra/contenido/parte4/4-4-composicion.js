import { ORO } from '../../motor/colores.js';
import { componer } from '../../nucleo/relaciones.js';
import { rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { LIENZO, matriz } from './matriz.js';

const R = String.raw;
const coma = (v) => String(v).replace('.', '{,}');
const P = ['Ana', 'Beto'], S = ['fiebre', 'tos', 'cansancio'], E = ['gripe', 'resfriado'];
const R1 = [[0.8, 0.3, 0.6], [0.2, 0.9, 0.4]], R2 = [[0.9, 0.3], [0.5, 0.8], [0.6, 0.4]], RES = componer(R1, R2);

export default {
  id: '4-4-composicion',
  titulo: 'Encadenar relaciones: la composición',
  puente: 'Sabes encadenar relaciones cualesquiera. Una familia especial, «parecerse», tiene una estructura preciosa: agrupa las cosas, con varios niveles de detalle.',
  pregunta: 'Ana tiene ciertos síntomas con cierto grado. Cada síntoma apunta a ciertas enfermedades. ¿Con qué grado apunta Ana a cada enfermedad? Hay que encadenar dos tablas.',
  escena: {
    id: 'composicion', formato: 'plano', W: 1100, H: 480, ejes: LIENZO(1100, 480),
    entradas: [
      { id: 'i', tipo: 'deslizador', etiqueta: 'persona (0 a 1)', min: 0, max: 1, paso: 1, valor: 0 },
      { id: 'k', tipo: 'deslizador', etiqueta: 'enfermedad (0 a 1)', min: 0, max: 1, paso: 1, valor: 0 },
    ],
    pasos: [
      { dur: 2200, texto: 'Dos relaciones: de personas a síntomas, y de síntomas a enfermedades. Queremos una tabla de personas a enfermedades.' },
      { dur: 2600, texto: '¿Con qué grado apunta Ana a la gripe? Hay varios caminos, uno por síntoma. Por ejemplo, a través de la fiebre. Un camino vale lo que su eslabón más débil: el <b style="color:#f4d345;font-weight:400">mínimo</b>.' },
      { dur: 3200, texto: 'Se calcula lo mismo para los otros dos caminos: por la tos y por el cansancio.' },
      { dur: 2600, texto: 'Basta con que haya un buen camino: de todos, el mejor, el <b style="color:#f4d345;font-weight:400">máximo</b>. Y ya está: es una casilla de la tabla final.' },
    ],
    primitivas({ q, paso, e }) {
      const i = paso >= 3 && q(3) >= 1 ? Math.round(e.i) : 0, k = paso >= 3 && q(3) >= 1 ? Math.round(e.k) : 0, al = ev(q(0), 0, 0.5);
      const visibles = paso === 0 ? 0 : paso === 1 ? 1 : 3, res1 = [];
      for (let j = 0; j < visibles; j++) res1.push([i, j]);
      const res2 = []; for (let j = 0; j < visibles; j++) res2.push([j, k]);
      const N = [
        ...matriz(R1, { x: 120, y: 70, lado: 66, filas: P, cols: S, alfa: al, id: 'a', resalta: res1, atenuar: paso >= 1 }),
        ...matriz(R2, { x: 520, y: 70, lado: 66, filas: S, cols: E, alfa: al, id: 'b', resalta: res2, atenuar: paso >= 1 }),
      ];
      N.push(rotulo([362, 150], R`\circ`, { clave: 'op', tam: 34, alfa: al }), rotulo([700, 150], '=', { clave: 'ig', tam: 30, alfa: al }));
      const vistos = paso >= 3 ? [[i, k]] : [];
      const R3 = RES.map((f, a) => f.map((v, b) => (paso >= 3 || false ? v : (a === i && b === k ? 0 : v))));
      N.push(...matriz(R3, { x: 800, y: 70, lado: 66, filas: P, cols: E, alfa: al * (paso >= 3 ? 1 : 0.35), id: 'c', resalta: vistos }));
      const caminos = [];
      for (let j = 0; j < 3; j++) caminos.push(Math.min(R1[i][j], R2[j][k]));
      for (let j = 0; j < visibles; j++) {
        const a = paso === 2 ? ev(q(2), j * 0.25, j * 0.25 + 0.5) : ev(q(1), 0, 0.5);
        N.push(rotulo([300, 320 + j * 38], R`\text{por ${S[j]}: } \min(${coma(R1[i][j])},\ ${coma(R2[j][k])}) = {\color{#f4d345}${coma(caminos[j])}}`, { clave: `cam${j}`, tam: 21, alfa: a }));
      }
      if (paso >= 3) N.push(rotulo([760, 358], R`\max(${caminos.map(coma).join(',\\ ')}) = ${coma(RES[i][k])}`, { clave: 'max', tam: 25, color: ORO, alfa: ev(q(3), 0, 0.5) }));
      return N;
    },
  },
  manipulacion: '<ul><li>Elige otra persona y otra enfermedad: mira qué caminos se iluminan y cuál gana.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Si sabes cómo se conecta A con B, y B con C, puedes deducir cómo se conecta A con C. Es lo que se llama [[composición]]. Con grados, dos reglas de sentido común: un camino vale lo que su eslabón más débil, y basta con el mejor camino.' },
    { tipo: 'ejemplo', texto: 'Ana y la gripe, a través de cada síntoma:', tabla: [['Síntoma', 'Ana lo tiene', 'Apunta a gripe', 'Camino (menor)'], ['Fiebre', '0,8', '0,9', '0,8'], ['Tos', '0,3', '0,5', '0,3'], ['Cansancio', '0,6', '0,6', '0,6']], cierre: 'De los tres caminos, el mejor vale 0,8. Así que Ana apunta a gripe con grado 0,8.' },
    { tipo: 'idea', etiqueta: 'Te suena', texto: 'Si has visto multiplicar [[matrices|matriz]], es lo mismo: cada casilla recorre una fila y una columna. Solo cambian las operaciones: en vez de multiplicar, mínimo; en vez de sumar, máximo.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`R \circ S`, dice: 'La composición: primero $R$, luego $S$. El círculo se lee «compuesta con».' },
      { tex: R`\min(\mu_R(x, y),\ \mu_S(y, z))`, dice: 'Un camino, de $x$ a $z$, pasando por $y$.' },
      { tex: R`\sup_y`, dice: 'De todos los caminos, el mejor. Es un [[supremo]], o un máximo si la tabla es finita.' },
    ], todo: R`\mu_{R \circ S}(x, z) = \sup_y\ \min(\mu_R(x, y),\ \mu_S(y, z))`, lee: '«El grado de $x$ a $z$ es el del mejor camino, y un camino vale lo que su eslabón más débil».' },
    { tipo: 'formal', titulo: 'Composición máx-mín', tex: R`Dadas $R$ entre $X$ e $Y$, y $S$ entre $Y$ y $Z$: $\ \mu_{R \circ S}(x, z) = \sup_{y \in Y} \min(\mu_R(x, y),\ \mu_S(y, z))$.`, lee: 'Se puede usar cualquier [[norma T]] en vez del mínimo. Por ejemplo, con el producto, un camino vale menos cuanto más largo es.' },
    { tipo: 'demo', titulo: 'Más relación da más composición', plan: 'Si una relación crece, la composición no puede bajar. Se ve mirando un solo camino.', tex: R`Si $R \subseteq R'$, entonces $R \circ S \subseteq R' \circ S$.`, pasos: [
      { texto: R`Fijemos $(x, z)$ y un $y$ cualquiera. Como $\mu_R(x, y) \le \mu_{R'}(x, y)$, se tiene $\min(\mu_R(x, y), \mu_S(y, z)) \le \min(\mu_{R'}(x, y), \mu_S(y, z))$.`, porque: 'Definición de $\\subseteq$, y el mínimo es [[monótono|monótona]] en cada entrada.' },
      { texto: R`Y este último es, como mucho, $\mu_{R' \circ S}(x, z)$.`, porque: 'Es uno de los caminos, y el [[supremo]] no baja de ninguno.' },
      { texto: R`Así que $\mu_{R' \circ S}(x, z)$ supera a todos los caminos de $R$, y por tanto a su [[supremo]] $\mu_{R \circ S}(x, z)$.`, porque: 'El [[supremo]] es el menor número que está por encima de todos.' },
    ] },
    { tipo: 'nota', titulo: 'Propiedades', texto: 'La composición es [[asociativa]]: da igual cómo agrupes tres relaciones. No es [[conmutativa]]: «primero $R$, luego $S$» no es lo mismo que al revés. Igual que con las matrices.' },
  ],
  tecnicas: [
    { titulo: 'Para acotar un supremo por arriba', texto: 'Si quieres probar que un [[supremo]] no supera a $c$, basta ver que cada uno de sus valores no supera a $c$.' },
  ],
  retos: [
    { id: 'compone-calc', tipo: 'calcular', enunciado: R`Con las tablas de la escena, ¿con qué grado apunta Beto al resfriado? Beto tiene $(0{,}2;\ 0{,}9;\ 0{,}4)$, y el resfriado recibe $(0{,}3;\ 0{,}8;\ 0{,}4)$.`, respuesta: 0.8, tol: 0.001, pistas: [R`Los caminos valen $\min(0{,}2;\ 0{,}3)$, $\min(0{,}9;\ 0{,}8)$ y $\min(0{,}4;\ 0{,}4)$.`], explicacion: R`$\max(0{,}2;\ 0{,}8;\ 0{,}4) = 0{,}8$, por la tos.` },
    { id: 'compone-elegir', tipo: 'elegir', enunciado: '¿Por qué se usa el mínimo dentro de cada camino?', opciones: ['Porque es más fácil de calcular', 'Porque un camino vale lo que su eslabón más débil', 'Porque los grados tienen que sumar 1', 'Porque así da 0 si no hay camino, y no hay otra forma'], correcta: 1, explicacion: 'Una cadena se rompe por su eslabón más débil. Luego, entre caminos, basta el mejor.' },
    { id: 'demuestra-monotona', tipo: 'demostrar', enunciado: R`Sea $I$ la identidad: $\mu_I(y, y) = 1$, y $\mu_I(y, z) = 0$ si $y \neq z$. Demuestra que $R \circ I = R$.`, pistas: ['Separa dos casos en el [[supremo]]: $y = z$ e $y \\neq z$.'],
      solucion: [
        { texto: R`$\mu_{R \circ I}(x, z) = \sup_y \min(\mu_R(x, y),\ \mu_I(y, z))$.`, porque: 'Definición de composición.' },
        { texto: R`Si $y \neq z$, el camino vale $\min(\mu_R(x, y),\ 0) = 0$.`, porque: 'El mínimo con 0 es 0.' },
        { texto: R`Si $y = z$, el camino vale $\min(\mu_R(x, z),\ 1) = \mu_R(x, z)$.`, porque: 'El mínimo con 1 deja igual.' },
        { texto: R`El mayor de todos es $\mu_R(x, z)$. Luego $R \circ I = R$.`, porque: 'Todos los demás valen 0.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 6.1.1.', 'E. Sanchez (1976): diagnóstico médico con relaciones difusas.'],
};
