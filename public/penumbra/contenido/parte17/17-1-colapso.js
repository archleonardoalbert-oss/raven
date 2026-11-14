import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { NORMAS_FZ, poligono } from '../../nucleo/fuzzython.js';
import { marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { tramo } from '../parte9/comun.js';
import { codigo, coma, relleno, trazar } from '../parte14/comun.js';

const R = String.raw;
const D = [0, 10], A = poligono([[0, 0], [4, 1], [8, 0]]), B = poligono([[2, 0], [6, 1], [10, 0]]), MET = ['COG', 'COA', 'CM', 'MM', 'LM', 'RM'], COL = [ORO, [255, 255, 255], AZUL, ROSA, GRIS2, GRIS2];
const forma = (e) => A.minimizar(e.a).combinar(NORMAS_FZ.MAX, B.minimizar(e.b));
export default {
  id: '17-1-colapso',
  titulo: 'El último número',
  puente: 'Ya sabes convertir cualquier forma en un número. Lo que queda antes de cruzar son los fallos: las piezas rotas que has ido viendo, todas juntas.',
  pregunta: 'Todo lo que has visto hasta aquí eran grados, formas, matices. Al final, alguien pide un número. Es el horizonte de un sistema difuso: lo que lo cruza ya no vuelve, porque un número no recuerda la forma de la que salió. Y fuzzython trae seis maneras de cruzarlo. ¿Cuál elegir?',
  escena: {
    id: 'colapso', formato: 'plano', W: 1100, H: 520,
    ejes: { x: D, y: [0, 1.1], caja: { x: 70, y: 40, w: 720, h: 410 } },
    entradas: [{ id: 'a', tipo: 'deslizador', etiqueta: 'la fuerza de la primera regla', min: 0.1, max: 1, paso: 0.05, valor: 0.7 }, { id: 'b', tipo: 'deslizador', etiqueta: 'la fuerza de la segunda', min: 0.1, max: 1, paso: 0.05, valor: 0.3 }],
    pasos: [
      { dur: 2800, texto: 'La forma que dejan dos reglas. Toda la información está aquí: dónde hay más peso, cuánta duda queda, si hay dos opiniones. Y hay que reducirla a un punto.' },
      { dur: 3000, texto: '<b style="color:#f4d345;font-weight:400">COG</b>, el centro de gravedad: donde se equilibraría la forma. <b style="font-weight:400">COA</b> la parte en dos áreas iguales. Tienen en cuenta toda la forma.' },
      { dur: 3000, texto: 'Los otros solo miran la parte más alta: <code>LM</code> su primer punto, <code>RM</code> el último, y <b style="color:#58c4dd;font-weight:400">CM</b> el medio. Lo demás, lo ignoran por completo.' },
      { dur: 3000, texto: '<b style="color:#fc6282;font-weight:400">MM</b> debería ser como CM en una meseta. Aquí <b>no coinciden</b>: fuzzython promedia solo los vértices, y si la meseta tiene uno de más, se desvía. Es un fallo real.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, F = forma(e), N = [marco({ x: D, y: [0, 1.1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] } }), relleno(F, D, { color: ORO, alfa: 0.25 * al }), trazar(F, D, { color: ORO, alfa: al })];
      const g = [g1, g1, g2, g3, g2, g2];
      MET.forEach((m, i) => { const x = F[m](), a = g[i]; if (a <= 0) return; N.push(...tramo([x, 0], [x, 1.02 - i * 0.07], { color: COL[i], ancho: i < 2 ? 2.4 : 1.6, alfa: a }), rotulo([x, 1.02 - i * 0.07], R`\text{${m}}\ ${coma(x, 2)}`, { clave: m, ancla: 'l', dx: 5, dy: -10, tam: 16, color: COL[i], alfa: a })); });
      const H = [marco({ x: [0, 6], y: [0, 10] }, { alfa: g1, ticks: { x: [], y: [0, 5, 10] } })]; MET.forEach((m, i) => { if (g[i] > 0) H.push(punto([i + 0.5, F[m]()], { color: COL[i], radio: 7, alfa: g[i], halo: 0 }), rotulo([i + 0.5, 0], R`\text{${m}}`, { clave: 'e' + m, dy: 18, tam: 13, color: COL[i], alfa: g[i] })); });
      return { principal: N, paneles: [{ ejes: { x: [0, 6], y: [0, 10], caja: { x: 830, y: 90, w: 240, h: 340 } }, prims: H }] };
    },
  },
  manipulacion: '<ul><li>Iguala las dos fuerzas: la forma se hace simétrica, y varios métodos coinciden.</li><li>Sube una y baja la otra: unos métodos saltan de golpe, y COG se mueve suavemente.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Este es el paso que no se deshace. De un número no se puede recuperar la forma: muchas formas distintas dan el mismo número. Por eso, elegir método es elegir qué se pierde. Los de área usan todo, y cambian poco a poco. Los de máximo se quedan con la opinión más fuerte, y pueden saltar.' },
    codigo('En Python', 'Es un parámetro de la variable de salida, y todos son métodos del conjunto:', "from fsets.polygon import Polygon\n\na = Polygon((0, 0), (4, 1), (8, 0)).minimize(0.7)\nb = Polygon((2, 0), (6, 1), (10, 0)).minimize(0.3)\nm = a | b\nfor metodo in ('COG', 'COA', 'CM', 'MM', 'LM', 'RM'):\n    print(metodo, round(getattr(m, metodo)(), 4))", 'En la meseta van de 2,8 a 5,2. Su centro real es 4,0, y <code>MM</code> da 3,8.'),
    codigo('Un fallo que se esconde', 'El mismo conjunto, como <code>Trapezoid</code> y como <code>Polygon</code>:', "from fsets.trapezoid import Trapezoid\n\nforma = ((0, 0), (2, 1), (6, 1), (8, 0))\nprint(Polygon(*forma).COG())\ntry:\n    print(Trapezoid(*forma).COG())\nexcept Exception as e:\n    print(type(e).__name__, e)", 'Dentro de un sistema, ese error ni se ve: <code>Variable</code> lo captura, lo imprime y devuelve <code>default</code>. Si es <code>None</code>, parecerá que no se activó nada.'),
    { tipo: 'ejemplo', texto: 'Para decidir:', tabla: [['Método', 'Usa', 'Cuándo'], ['COG', 'Toda la forma', 'Control: cambia sin saltos'], ['COA', 'Toda la forma', 'Si hay colas largas'], ['CM, MM', 'Solo la cima', 'Cuando importa la opinión más fuerte'], ['LM, RM', 'Un extremo de la cima', 'Decisiones prudentes, hacia un lado']], cierre: 'Si la forma tiene dos picos separados, COG puede caer entre los dos, donde ninguna regla opina. Lo viste en la región 6.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{COG} = \frac{\int x\, \mu(x)\, dx}{\int \mu(x)\, dx}`, dice: 'El punto de equilibrio.' },
      { tex: R`\int_a^{\text{COA}} \mu = \int_{\text{COA}}^b \mu`, dice: 'El punto que reparte el área.' },
      { tex: R`\text{CM} = \frac{\text{LM} + \text{RM}}{2}`, dice: 'El centro de la cima.' },
    ], todo: R`\text{defuzzify}: \mu \mapsto y \in \mathbb{R}`, lee: '«De una función entera, a un solo número». Por eso no es reversible.' },
    { tipo: 'formal', titulo: 'Exacto, a tramos', tex: R`En un tramo $\mu(x) = m x + n$: $\int x\, \mu(x)\, dx = x^2 \left(\frac{m x}{3} + \frac{n}{2}\right)$ entre sus extremos. Por eso <code>Polygon.COG</code> no aproxima: suma estos términos exactos.`, lee: 'En cambio, un <code>FuzzySet</code> general aproxima con 100 trapecios. Y por eso esta parada recomienda el polígono.' },
    { tipo: 'demo', titulo: 'No hay vuelta atrás', plan: 'Basta con dos formas distintas con igual COG.', tex: R`La desdifusión no es inyectiva: formas distintas pueden dar el mismo número.`, pasos: [
      { texto: R`Toma dos triángulos simétricos respecto a $x = 5$: uno de base $[4, 6]$ y otro de base $[0, 10]$.`, porque: 'Son funciones distintas.' },
      { texto: R`El centro de gravedad de cada uno es $5$.`, porque: 'Un conjunto simétrico tiene su centro en el eje: lo demostraste en Mamdani.' },
      { texto: R`Con ver el 5, no se puede saber cuál era: uno decía «seguro», y el otro «ni idea».`, porque: 'Esa es la información que se pierde al cruzar. Si la necesitas, guarda también el conjunto, o el grado de la cima.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Antes de reducir, decide qué conservar', texto: 'Si reduces algo rico a un número, guarda junto a él una medida de cuánto se ha perdido: la anchura de la forma, por ejemplo. Un 5 seguro y un 5 dudoso no son lo mismo.' }],
  retos: [
    { id: 'colapso-iguales', tipo: 'manipular', enunciado: R`Busca fuerzas tales que COG esté a menos de $0{,}05$ de $5$.`, precision: (e) => (Math.abs(forma(e).COG() - 5) < 0.05 ? 1 : 0), prueba: { a: 0.5, b: 0.5 }, pendiente: (e) => `El centro de gravedad es ${forma(e).COG().toFixed(2).replace('.', ',')}.`, pistas: ['La forma tiene que quedar simétrica.'], explicacion: 'Con fuerzas iguales, la forma es simétrica en torno a 5.' },
    { id: 'cm-calc', tipo: 'calcular', enunciado: R`Si la cima va de $2{,}8$ a $5{,}2$, ¿cuánto vale CM?`, respuesta: 4, tol: 0.001, pistas: [R`El punto medio.`], explicacion: R`$\frac{2{,}8 + 5{,}2}{2} = 4$.` },
    { id: 'metodo-elegir', tipo: 'elegir', enunciado: 'En un controlador, no quieres que la salida dé saltos. ¿Qué método eliges?', opciones: ['LM', 'RM', 'COG', 'MM'], correcta: 2, explicacion: 'Las áreas cambian de forma continua con las fuerzas. Los máximos pueden saltar.' },
    { id: 'demuestra-tramo', tipo: 'demostrar', enunciado: R`Comprueba la fórmula: la derivada de $x^2 \left(\frac{m x}{3} + \frac{n}{2}\right)$ es $x (m x + n)$.`, pistas: ['Escríbela como $\\frac{m x^3}{3} + \\frac{n x^2}{2}$.'], solucion: [{ texto: R`$\frac{m x^3}{3} + \frac{n x^2}{2}$ tiene derivada $m x^2 + n x$.`, porque: 'Derivada de potencias.' }, { texto: R`Y $m x^2 + n x = x (m x + n)$, que es $x\, \mu(x)$.`, porque: 'Es justo lo que se integra en el numerador de COG.' }] },
  ],
  referencias: ['W. Van Leekwijck, E. E. Kerre, «Defuzzification: criteria and classification», <em>Fuzzy Sets and Systems</em> 108 (1999).', '<em>fuzzython</em>: fsets/fuzzy_set.py y fsets/polygon.py.'],
};
