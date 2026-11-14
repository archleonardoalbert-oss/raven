import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { fuerzasJuguete, nivelJuguete } from '../../nucleo/decisor.js';
import { marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { barra, tramo } from '../parte9/comun.js';
import { codigo, coma } from '../parte14/comun.js';

const R = String.raw;
const COL = [ROSA, ORO, AZUL, GRIS2], NIV = [1, 2, 4, 5], TIT = ['dolor y sudor', 'dolor sin sudor', 'golpe, sin dolor', 'ni una ni otra'];
const g = (e) => [e.d, e.s, e.g];
export default {
  id: '18-4-unir',
  titulo: 'El decisor dentro de fuzzython',
  puente: 'Ya tienes el sistema entero. Falta lo que decide si vale algo: medirlo como se mide algo que se usa para decidir.',
  pregunta: 'Aquí se cierra el círculo. Texto, pregunta, grado, y una regla que se lee. Falta un detalle: fuzzython espera una variable y una palabra. ¿Cómo le das un grado que ya tienes calculado?',
  escena: {
    id: 'unir', formato: 'plano', W: 1100, H: 520,
    ejes: { x: [0, 4], y: [0, 1], caja: { x: 70, y: 70, w: 540, h: 360 } },
    entradas: [{ id: 'd', tipo: 'deslizador', etiqueta: 'grado de «dolor torácico»', min: 0, max: 1, paso: 0.05, valor: 0.9 }, { id: 's', tipo: 'deslizador', etiqueta: 'grado de «sudoración»', min: 0, max: 1, paso: 0.05, valor: 0.5 }, { id: 'g', tipo: 'deslizador', etiqueta: 'grado de «golpe leve»', min: 0, max: 1, paso: 0.05, valor: 0.1 }],
    pasos: [
      { dur: 3000, texto: 'Tres grados, de tres preguntas a un decisor calibrado. Cuatro reglas <b style="color:#58c4dd;font-weight:400">de juguete</b>: esto no es un sistema de triaje, ni sirve para decidir nada sobre personas.' },
      { dur: 3000, texto: 'Cada regla multiplica sus grados. Se usa <code>PROD</code>: con grados calibrados e independientes, ese producto es una probabilidad. Lo viste en la región 12.' },
      { dur: 3000, texto: 'Cada regla apunta a un nivel, y la salida es la media ponderada: Sugeno. Y a diferencia de una red, <b style="color:#f4d345;font-weight:400">se puede leer qué regla empujó</b>.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, w = fuerzasJuguete(g(e)), r = nivelJuguete(g(e)), N = [marco({ x: [0, 4], y: [0, 1] }, { alfa: al, ticks: { x: [], y: [0, 1] }, etiquetas: { y: R`\text{fuerza}` } })];
      w.forEach((v, i) => N.push(barra(i + 0.15, i + 0.85, v * g1, { color: COL[i], alfa: 0.8 * al }), rotulo([i + 0.5, 0], R`\text{${TIT[i]}}`, { clave: 'q' + i, dy: 20, tam: 14, color: COL[i], alfa: al }), rotulo([i + 0.5, v * g1], R`${coma(v)}`, { clave: 'w' + i, dy: -14, tam: 18, color: COL[i], alfa: g1 })));
      const G = [marco({ x: [0.5, 5.5], y: [0, 1] }, { alfa: g2, ticks: { x: [1, 2, 3, 4, 5], y: [] }, soloBase: true, etiquetas: { x: R`\text{nivel}` } })];
      if (g2 > 0) { NIV.forEach((n, i) => G.push(...tramo([n, 0], [n, w[i]], { color: COL[i], ancho: 5, alfa: g2 }))); G.push(punto([r, 0], { color: [255, 255, 255], radio: 9, alfa: g2, halo: 1 }), rotulo([5.5, 1], R`\text{salida: }${coma(r, 2)}`, { clave: 'r', ancla: 'r', dy: -14, tam: 24, color: [255, 255, 255], alfa: g2 })); }
      return { principal: N, paneles: [{ ejes: { x: [0.5, 5.5], y: [0, 1], caja: { x: 690, y: 110, w: 360, h: 300 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Baja el grado de dolor, y mira cómo se reparte la fuerza entre las otras reglas.</li><li>Con todo en 0,5, las cuatro pesan igual.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'La pieza que une los dos mundos es una palabra de una sola recta: <code>Polygon((0, 0), (1, 1))</code>. Su grado en $x$ es justo $x$. Así, una variable cuyo valor es ya un grado se convierte en una palabra sin deformarlo. Lo que el decisor leyó en el texto entra en las reglas sin más.' },
    codigo('Todo junto', 'Se ejecuta de verdad con fuzzython. Solo los grados son de juguete: en un uso real, vendrían del decisor, tras pasar por $\\varphi$.', "b = RuleBlock('nivel_toy', operators=('PROD', 'ASUM', 'ZADEH'))\nb.add_rules('if dolor is si_dolor and sudor is si_sudor then z = 1',\n            'if dolor is si_dolor and sudor is not si_sudor then z = 2',\n            'if dolor is not si_dolor and golpe is si_golpe then z = 4',\n            'if dolor is not si_dolor and golpe is not si_golpe then z = 5',\n            scope=locals())\nsistema = SugenoSystem('s', b)\n\ncasos = ((0.9, 0.8, 0.1), (0.9, 0.1, 0.1), (0.1, 0.2, 0.8), (0.1, 0.1, 0.1))\nfor d, s, g in casos:\n    y = sistema.compute({'dolor': d, 'sudor': s, 'golpe': g})\n    print('nivel', round(y['nivel_toy'], 10))", 'Tres detalles: cada variable necesita su propia palabra, porque los nombres se buscan en <code>scope</code>. Ninguna de ellas contiene «is». Y <code>is not</code> usa el complemento $1 - x$.', { prefacio: "from adjective import Adjective\nfrom fsets.polygon import Polygon\nfrom ruleblock import RuleBlock\nfrom systems.sugeno import SugenoSystem\nfrom variable import Variable\n\ndef palabra(nombre):\n    return Adjective(nombre, Polygon((0, 0), (1, 1)))\n\nsi_dolor, si_sudor, si_golpe = palabra('si_dolor'), palabra('si_sudor'), palabra('si_golpe')\ndolor = Variable('dolor', 'grado', si_dolor)\nsudor = Variable('sudor', 'grado', si_sudor)\ngolpe = Variable('golpe', 'grado', si_golpe)", prefacioTitulo: 'Las palabras y las variables' }),
    { tipo: 'ejemplo', texto: 'El primer caso: dolor 0,9, sudor 0,8, golpe 0,1.', tabla: [['Regla', 'Fuerza', 'Nivel'], ['dolor y sudor', '$0{,}9 \\cdot 0{,}8 = 0{,}72$', '1'], ['dolor sin sudor', '$0{,}9 \\cdot 0{,}2 = 0{,}18$', '2'], ['golpe, sin dolor', '$0{,}1 \\cdot 0{,}1 = 0{,}01$', '4'], ['ni una ni otra', '$0{,}1 \\cdot 0{,}9 = 0{,}09$', '5']], cierre: 'Las fuerzas suman 1, y la media da $1{,}57$. Y se puede explicar: lo empuja, sobre todo, la primera regla.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\mu_k`, dice: 'El grado calibrado de un concepto.' },
      { tex: R`w_r = \prod_k \ell_{r k}`, dice: 'La fuerza: el producto de lo que pide la regla.' },
      { tex: R`\ell_{r k}`, dice: 'Es $\\mu_k$ o $1 - \\mu_k$, según la regla lo pida en positivo o en negativo.' },
    ], todo: R`y = \frac{\sum_r w_r\, z_r}{\sum_r w_r}`, lee: 'Es Sugeno, otra vez. Esto es el modelo CCD de la región 12, escrito con fuzzython.' },
    { tipo: 'formal', titulo: 'Las fuerzas son probabilidades', tex: R`Si los conceptos son independientes dado el texto, y cada $\mu_k$ es la probabilidad de que esté presente, entonces $w_r$ es la probabilidad de la combinación exacta que pide la regla, y si las reglas cubren todas las combinaciones sin repetirse, $\sum_r w_r = 1$.`, lee: 'Por eso se elige PROD. Con MIN sería una regla razonable, pero sus fuerzas no serían probabilidades.' },
    { tipo: 'demo', titulo: 'Las cuatro fuerzas suman 1', plan: 'Se saca factor común dos veces.', tex: R`$d s + d (1 - s) + (1 - d) g + (1 - d)(1 - g) = 1$.`, pasos: [
      { texto: R`$d s + d (1 - s) = d$.`, porque: 'Factor común $d$, y $s + 1 - s = 1$.' },
      { texto: R`$(1 - d) g + (1 - d)(1 - g) = 1 - d$.`, porque: 'Factor común $1 - d$.' },
      { texto: R`Sumando: $d + 1 - d = 1$.`, porque: 'Por eso el denominador no hace nada en este caso, y la salida es una esperanza del nivel.' },
    ] },
    { tipo: 'nota', titulo: 'Lo que esto no es', texto: 'Los grados y las reglas de esta parada son de juguete, y sirven para aprender a montar la pieza. Un sistema real de este tipo, para personas, exige datos, validación y supervisión clínica, y no se ha hecho aquí.' },
  ],
  tecnicas: [{ titulo: 'Una función identidad es un adaptador', texto: 'Cuando dos sistemas hablan casi igual, busca la pieza que no hace nada, salvo encajar. La recta de 0 a 1 convierte un número en una palabra, sin tocarlo.' }],
  retos: [
    { id: 'unir-nivel', tipo: 'manipular', enunciado: R`Busca grados para que la salida esté por debajo de $1{,}2$.`, precision: (e) => (nivelJuguete(g(e)) < 1.2 ? 1 : 0), prueba: { d: 1, s: 1, g: 0 }, pendiente: (e) => `La salida es ${nivelJuguete(g(e)).toFixed(2).replace('.', ',')}.`, pistas: ['Hace falta que la primera regla lo acapare todo.'], explicacion: 'Con dolor y sudor cerca de 1.' },
    { id: 'unir-calc', tipo: 'calcular', enunciado: R`Con dolor $0{,}5$, sudor $0{,}5$, golpe $0{,}5$, ¿cuál es la salida?`, respuesta: 3, tol: 0.001, pistas: [R`Las cuatro fuerzas valen $0{,}25$.`], explicacion: R`$\frac{1 + 2 + 4 + 5}{4} = 3$.` },
    { id: 'unir-elegir', tipo: 'elegir', enunciado: '¿Por qué cada variable tiene su propia palabra?', opciones: ['Por velocidad', 'Porque los nombres de las reglas se buscan en scope', 'Porque Polygon no se puede repetir', 'Para que sume 1'], correcta: 1, explicacion: 'Un nombre de Python es una clave: no puede significar dos cosas a la vez.' },
    { id: 'demuestra-prop', tipo: 'demostrar', enunciado: R`Demuestra que, si todas las fuerzas salvo una son 0, la salida es el nivel de esa regla.`, pistas: ['Sustituye en la media.'], solucion: [{ texto: R`$y = \frac{w\, z}{w}$.`, porque: 'Los demás sumandos valen 0.' }, { texto: R`Con $w > 0$, se simplifica: $y = z$.`, porque: 'Lo mismo que en Sugeno.' }] },
  ],
  referencias: ['Propuesta propia: <em>Células de Concepto Difusas</em>.', 'P. W. Koh et al., «Concept Bottleneck Models», ICML (2020).'],
};
