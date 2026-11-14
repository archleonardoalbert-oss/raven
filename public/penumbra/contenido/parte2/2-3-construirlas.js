import { APAGADO, AZUL, BLANCO, GRIS2, ORO } from '../../motor/colores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v, d = 2) => v.toFixed(d).replace('.', '{,}');
const DOM = [150, 200], CENTRO = 175, ESC = 4;
/** El umbral de cada persona del jurado: sale de la curva logística, repartido por igual. Sin azar: siempre igual. */
const umbrales = (n) => Array.from({ length: n }, (_, i) => { const u = (i + 0.5) / n; return CENTRO + ESC * Math.log(u / (1 - u)); });
const logistica = (x) => 1 / (1 + Math.exp(-(x - CENTRO) / ESC));
const fraccion = (x, t) => t.filter((v) => v <= x).length / t.length;
const peorError = (n) => { const t = umbrales(n); let m = 0; for (let x = DOM[0]; x <= DOM[1]; x += 0.05) m = Math.max(m, Math.abs(fraccion(x, t) - logistica(x))); return m; };

export default {
  id: '2-3-construirlas',
  titulo: 'De dónde salen los grados',
  puente: 'Ya sabes de dónde salen los grados y qué formas toman. Es hora de usarlos: vas a darle palabras a tu primera máquina.',
  pregunta: '¿Quién decide que 1,74 m tiene grado 0,23 en «alto»? ¿Se lo inventa alguien? ¿Se puede medir?',
  escena: {
    id: 'jurado', formato: 'plano', W: 1100, H: 560,
    ejes: { x: DOM, y: [0, 1], caja: { x: 110, y: 60, w: 860, h: 300 } },
    entradas: [
      { id: 'n', tipo: 'deslizador', etiqueta: 'personas en el jurado', min: 4, max: 60, paso: 1, valor: 6 },
      { id: 'x', tipo: 'arrastre', eje: 'x', valor: [172, 0], region: { x: DOM, y: [0, 1] } },
    ],
    pasos: [
      { dur: 2000, texto: 'Reúne a un jurado y pregúntale a cada persona: ¿esta altura es «alta»? Cada una responde sí o no. Cada punto es una persona, puesta en la altura a partir de la cual diría que sí.' },
      { dur: 3200, texto: 'Sube la altura. Cada vez más personas dicen que sí. Nadie duda: cada una tiene su frontera. Lo que es gradual es el <em>desacuerdo</em> entre ellas.' },
      { dur: 2200, texto: 'Dibuja la fracción de síes. Da una escalera. Eso ya es una función de pertenencia, obtenida de personas reales.' },
      { dur: 2600, texto: 'Con más gente, los escalones se encogen, y la escalera se va pareciendo a una curva suave. Por eso se ajusta luego una forma con parámetros: en azul, una sigmoidal.' },
    ],
    primitivas({ q, paso, e }) {
      const n = paso >= 3 ? Math.round(mix(e.n, Math.max(e.n, 60), ev(q(3), 0, 0.6) * (1 - ev(q(3), 0.75, 1)))) : Math.round(e.n);
      const t = umbrales(n), al = ev(q(0), 0, 0.4);
      const N = [marco({ x: DOM, y: [0, 1] }, { alfa: al, ticks: { x: [150, 160, 170, 180, 190, 200], y: [0, 1] }, etiquetas: { x: R`\text{altura (cm)}`, y: R`\mu` }, colorY: ORO })];
      const x = paso === 0 ? 150 : paso === 1 ? mix(150, 200, ev(q(1), 0, 1)) : e.x[0], v = fraccion(x, t);
      t.forEach((u, i) => N.push(punto([u, -0.28 - (i % 3) * 0.06], { radio: n > 30 ? 3.5 : 6, color: u <= x ? ORO : APAGADO, alfa: al * ev(q(0), i / n * 0.6, i / n * 0.6 + 0.4), halo: u <= x ? 8 : 0 })));
      if (paso >= 1) {
        N.push(linea([x, 0], [x, 1], { color: BLANCO, ancho: 1.4, alfa: 0.6, discontinua: true }));
        N.push(rotulo([x, 1], R`${x.toFixed(0)}\text{ cm: } ${t.filter((u) => u <= x).length}\text{ de }${n}\text{ dicen sí}`, { clave: 'voto', dy: -18, tam: 19, alfa: ev(q(1), 0, 0.2) }));
      }
      const es = ev(q(2), 0, 1);
      if (es > 0) {
        N.push(curva((u) => [u, fraccion(u, t)], DOM, { hasta: es, n: 900, color: ORO, ancho: 2.8 }));
        if (paso >= 2) N.push(punto([x, v], { color: BLANCO, radio: 6 }));
      }
      const lo = ev(q(3), 0.5, 1);
      if (lo > 0) N.push(curva((u) => [u, logistica(u)], DOM, { n: 200, color: AZUL, ancho: 2.4, alfa: lo }));
      N.push(rotulo([151, -0.34], R`\text{cada punto, una persona}`, { clave: 'jur', ancla: 'l', tam: 16, color: GRIS2, alfa: al, dy: -28 }));
      return N;
    },
  },
  manipulacion: '<ul><li>Sube el número de personas: mira cómo la escalera dorada se acerca a la curva azul.</li><li>Arrastra la línea blanca y lee cuántas personas dicen que sí.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La duda', texto: 'Es la crítica más seria a toda la teoría: ¿los grados no son inventados? La honestidad primero: Zimmermann admite que las matemáticas de la pertenencia son claras, pero que aún no hay una teoría definitiva de cómo medirla.' },
    { tipo: 'idea', etiqueta: 'No es tan grave', texto: 'Tampoco es tan raro: durante siglos, las ciencias usaron medidas antes de tener una teoría de la medida. Mientras tanto, se usan métodos razonables, y se comprueba si funcionan. Hay varios.' },
    { tipo: 'ejemplo', texto: 'El primero: preguntar a un jurado y contar. Diez personas; ¿es alta esta altura?', tabla: [['Altura', '160', '170', '175', '180', '190'], ['Dicen sí', '0', '2', '5', '8', '10'], ['Grado', '0', '0,2', '0,5', '0,8', '1']], cierre: 'Si la mitad dice sí, el grado es 0,5. Esto convierte el desacuerdo de un grupo en un número.' },
    { tipo: 'simbolos', intro: 'La escalera, en símbolos.', piezas: [
      { tex: R`t_i`, dice: 'La frontera de la persona número $i$: la altura a partir de la cual dice sí.' },
      { tex: R`t_i \le x`, dice: 'Esa persona dice sí a la altura $x$.' },
      { tex: R`\#\{\dots\}`, dice: 'El símbolo # quiere decir «cuántos hay».' },
      { tex: R`\dfrac{1}{n}`, dice: 'Dividir entre el total de personas, para que quede entre 0 y 1.' },
    ], todo: R`\mu(x) = \dfrac{1}{n}\ \#\{\,i : t_i \le x\,\}`, lee: '«El grado de $x$ es la fracción de personas que dicen sí a $x$».' },
    { tipo: 'formal', titulo: 'Grado por votación', tex: R`Dado un jurado con fronteras $t_1, \dots, t_n$, el grado de $x$ es $\mu(x) = \frac{1}{n}\,\#\{i : t_i \le x\}$.`, lee: 'Solo funciona así cuando la palabra va en una dirección, como «alto». Con «cerca de 7», cada persona tendría un intervalo en vez de una frontera, pero la cuenta es la misma.' },
    { tipo: 'demo', titulo: 'La escalera nunca baja', plan: 'Tiene sentido: si a alguien le parece alta una altura, le parecerá alta otra mayor. Veámoslo.', tex: R`Si $x \le y$, entonces $\mu(x) \le \mu(y)$.`, pasos: [
      { texto: R`Si la persona $i$ dice sí a $x$, es que $t_i \le x$. Como $x \le y$, también $t_i \le y$: dice sí a $y$.`, porque: 'Encadenar desigualdades.' },
      { texto: R`Por tanto, los que dicen sí a $x$ son parte de los que dicen sí a $y$, y $\#\{i : t_i \le x\} \le \#\{i : t_i \le y\}$.`, porque: 'Un grupo que está dentro de otro no puede tener más miembros.' },
      { texto: R`Dividiendo entre $n > 0$, resulta $\mu(x) \le \mu(y)$.`, porque: 'Dividir entre un positivo conserva la desigualdad.' },
    ] },
    { tipo: 'nota', titulo: 'Otras formas de obtenerlos', texto: 'Se puede preguntar directamente: «del 0 al 100, ¿cuán alta es?». Es fácil, pero las respuestas se tuercen por sesgos. Se puede comparar: «¿cuál de estas dos es más alta?», y calcular los grados con muchas comparaciones: es más robusto, y más caro. Una persona experta puede dar la forma y los parámetros. Y se pueden ajustar a partir de datos, como verás en la región 7.' },
    { tipo: 'nota', titulo: 'Depende de para qué', texto: 'Zimmermann recoge experimentos que obtienen curvas muy parecidas a estas formas para palabras como «hombre joven». Pero «joven» depende del contexto: no significa lo mismo para personas que para perros. Un grado siempre es relativo a un contexto, y conviene decir cuál.' },
  ],
  tecnicas: [
    { titulo: 'Di de dónde sale tu número', texto: 'Cuando uses un grado, deja claro su origen: votación, criterio experto, ajuste a datos. Un modelo se juzga también por eso.' },
    { titulo: 'Compara con un caso límite', texto: 'Con una sola persona en el jurado, la curva es un escalón: un conjunto clásico. Lo clásico vuelve a aparecer como caso particular.' },
  ],
  retos: [
    { id: 'jurado-suficiente', tipo: 'manipular', enunciado: R`Añade gente hasta que la escalera se separe de la curva azul menos de $0{,}05$ en todas partes.`,
      precision: (e) => (peorError(Math.round(e.n)) < 0.05 ? 1 : 0), prueba: { n: 40 }, pistas: ['El peor error está cerca de 175, y se reduce con el número de personas.'],
      pendiente: (e) => `Ahora el peor error es ${coma(peorError(Math.round(e.n))).replace('{,}', ',')}. Hace falta menos de 0,05.`, explicacion: 'Cuanta más gente, menos escalones se notan.' },
    { id: 'contar-votos', tipo: 'calcular', enunciado: 'En un jurado de 20 personas, 13 dicen que esta sopa está «caliente». ¿Qué grado da la votación?', respuesta: 0.65, tol: 0.001, pistas: ['Fracción de personas que dicen sí.'], explicacion: R`$\frac{13}{20} = 0{,}65$.` },
    { id: 'directo-o-indirecto', tipo: 'elegir', enunciado: '¿Qué ventaja tiene comparar parejas frente a pedir directamente un número?', opciones: ['Es más rápido', 'Hace falta menos gente', 'Se tuerce menos por los sesgos de quien responde', 'Da grados exactos'], correcta: 2, explicacion: 'Decir cuál de dos es mayor es más fiable que inventar un número. A cambio, hacen falta muchas más preguntas.' },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 16.2.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 10 (construcción de conjuntos difusos).'],
};
