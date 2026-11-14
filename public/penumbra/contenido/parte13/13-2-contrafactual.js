import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { contrafactual } from '../../nucleo/ia.js';
import { curva, mapaCalor, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma, flecha } from '../parte9/comun.js';

const R = String.raw;
const U = [0, 1], f = ([a, b]) => 1 - (1 - a * b) * (1 - 0.07), BORDE = 0.43 / 0.93;
const cuenta = (x) => contrafactual(f, x, 0.5, [U, U]);

export default {
  id: '13-2-contrafactual',
  titulo: 'Qué habría cambiado la decisión',
  puente: 'Ya sabes preguntarle a un modelo por qué, y qué haría falta para cambiarlo. Queda lo más incómodo: demostrar, con un experimento bien hecho, que sirve de algo.',
  pregunta: 'El sistema dice «no urgente». Un médico pregunta lo mejor que se puede preguntar: ¿qué tendría que haber sido distinto para que dijera «urgente»? Y se responde con una búsqueda muy concreta.',
  escena: {
    id: 'contrafactual', formato: 'plano', W: 1100, H: 540,
    ejes: { x: U, y: U, caja: { x: 90, y: 50, w: 430, h: 430 } },
    entradas: [
      { id: 'a', tipo: 'deslizador', etiqueta: 'grado de dolor', min: 0, max: 1, paso: 0.01, valor: 0.3 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'grado de sudoración', min: 0, max: 1, paso: 0.01, valor: 0.75 },
    ],
    pasos: [
      { dur: 2800, texto: 'El sistema, visto como un mapa, con el resto de conceptos fijos. Claro: urgente. Oscuro: no urgente. La curva blanca es <b>la frontera</b>, donde cambia la decisión.' },
      { dur: 2800, texto: 'Este caso cae en «no urgente». Queda lejos de la frontera, pero ¿lejos en qué dirección? Hay más de una manera de llegar.' },
      { dur: 3200, texto: 'Dos respuestas posibles, cambiando un solo concepto: <b style="color:#58c4dd;font-weight:400">más dolor</b>, o <b style="color:#fc6282;font-weight:400">más sudoración</b>. Y alguna puede no llegar nunca, por mucho que subas.' },
      { dur: 3200, texto: 'Se elige el <b style="color:#f4d345;font-weight:400">cambio más pequeño</b>. Ya no es solo «por qué», sino «<b>qué habría bastado</b>». Se puede comprobar en el caso real: ¿de verdad no tenía ese dolor?' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, x = [e.a, e.b], v = f(x);
      const P = [mapaCalor((a, b) => f([a, b]), { clave: 'cf' }), marco({ x: U, y: U }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: R`\text{dolor}`, y: R`\text{sudoración}` } }), curva((a) => [a, BORDE / a], [BORDE, 1], { n: 80, color: [255, 255, 255], ancho: 2.4, alfa: al })];
      if (g1 > 0) P.push(punto(x, { color: [255, 255, 255], radio: 8, alfa: g1 }));
      const lado = v > 0.5, cf = cuenta(x), T = [];
      if (g2 > 0 && !lado) {
        const llegaA = x[1] > BORDE, llegaB = x[0] > BORDE;
        if (llegaA) P.push(...flecha(x, [BORDE / x[1] - x[0], 0], { color: AZUL, alfa: g2 }));
        if (llegaB) P.push(...flecha(x, [0, BORDE / x[0] - x[1]], { color: ROSA, alfa: g2 }));
        if (!llegaB) T.push(rotulo([0, 0.32], R`\text{Solo con sudoración, no se llega.}`, { clave: 'nb', ancla: 'l', tam: 16, color: ROSA, alfa: g2 }));
        if (!llegaA) T.push(rotulo([0, 0.22], R`\text{Solo con dolor, no se llega.}`, { clave: 'na', ancla: 'l', tam: 16, color: AZUL, alfa: g2 }));
      }
      T.push(rotulo([0, 1], R`\text{Salida: } ${coma(v)}\quad \text{(${lado ? 'urgente' : 'no urgente'})}`, { clave: 's', ancla: 'l', tam: 21, alfa: al }));
      if (g3 > 0) T.push(rotulo([0, 0.72], lado ? R`\text{Ya está al otro lado.}` : cf ? R`\text{Habría bastado: ${cf.indice ? 'sudoración' : 'dolor'} } = ${coma(cf.x[cf.indice])}` : R`\text{Un solo concepto no basta.}`, { clave: 'cf', ancla: 'l', tam: 20, color: ORO, alfa: g3 }));
      return { principal: P, paneles: [{ ejes: { x: [0, 1], y: [0, 1], caja: { x: 610, y: 150, w: 430, h: 220 } }, prims: T }] };
    },
  },
  manipulacion: '<ul><li>Mueve el caso: cuando está muy abajo, una de las flechas desaparece.</li><li>Cruza la frontera, y observa cómo cambia la decisión.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un contrafactual es la explicación que da una persona: «no te lo dieron porque ganabas 3000; con 3500 te lo habrían dado». No describe el modelo por dentro, y no hace falta abrirlo. Y se puede usar en dos sentidos: como explicación, y como alarma: si el cambio más pequeño es absurdo, el modelo también lo es.' },
    { tipo: 'ejemplo', texto: 'En nuestro modelo de conceptos, la frontera es $a b \\approx 0{,}46$. Tres casos:', tabla: [['Dolor', 'Sudor', 'Respuesta'], ['0,30', '0,75', 'Habría bastado con dolor 0,62'], ['0,50', '0,50', 'Dolor 0,92, o sudor 0,92'], ['0,20', '0,30', 'Un solo concepto no basta']], cierre: 'El último es importante: a veces, ningún cambio de un solo concepto lo arregla.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`x`, dice: 'El caso tal como es.' },
      { tex: R`x'`, dice: 'El caso alternativo: lo más parecido posible que cambia la decisión.' },
      { tex: R`y'`, dice: 'La decisión que se busca.' },
      { tex: R`d(x, x')`, dice: 'Lo lejos que está uno de otro. Se elige, y eso decide qué explicaciones salen.' },
    ], todo: R`\min_{x'}\ \lambda \big(f(x') - y'\big)^2 + d(x, x')`, lee: '«Acércate a la decisión que buscas, moviéndote lo menos posible». Con $\\lambda$ se aumenta hasta llegar.' },
    { tipo: 'formal', titulo: 'Contrafactuales (Wachter et al., 2017)', tex: R`Un contrafactual de $x$ para la salida $y'$ es una solución de $\arg\min_{x'} \max_\lambda\ \lambda (f(x') - y')^2 + d(x, x')$. Con conceptos, $x$ y $x'$ son vectores de grados, de modo que cada contrafactual se puede leer.`, lee: 'Ventaja de los conceptos frente a los píxeles o las palabras: cambiar un concepto tiene significado. Advertencia: esto no dice qué causa qué, solo cómo responde el modelo.' },
    { tipo: 'demo', titulo: 'En una neurona, la respuesta es exacta', plan: 'En una sigmoide, la frontera es una recta. Se despeja cuánto hay que mover cada coordenada.', tex: R`Si $f(x) = \sigma(w \cdot x + b)$, y $w \cdot x + b < 0$, el menor cambio de una sola coordenada que lleva a $f = \frac{1}{2}$ se hace en la de mayor $|w_i|$, y vale $\frac{|w \cdot x + b|}{|w_i|}$.`, pasos: [
      { texto: R`$f = \frac{1}{2}$ significa $w \cdot x' + b = 0$.`, porque: 'Porque $\\sigma(0) = \\frac{1}{2}$.' },
      { texto: R`Si solo cambia la coordenada $i$, en $\delta$: $w \cdot x + b + w_i \delta = 0$.`, porque: 'El resto de los términos no cambia.' },
      { texto: R`Luego $|\delta| = \frac{|w \cdot x + b|}{|w_i|}$.`, porque: 'Se despeja, y el numerador es igual para todas las coordenadas. Por tanto, el menor $|\\delta|$ está en el mayor $|w_i|$.' },
    ] },
    { tipo: 'nota', titulo: 'No es consejo', texto: 'Un contrafactual dice qué cambiaría la salida del modelo, y no qué cambiaría la salud de nadie. Bajar un grado de «dolor» en un informe no le quita el dolor a nadie.' },
  ],
  tecnicas: [{ titulo: 'Pregunta qué habría bastado', texto: 'Para entender una decisión de la que no ves el interior, busca el cambio más pequeño que la invierte. Dice mucho, y solo necesitas poder preguntar.' }],
  retos: [
    { id: 'cruza', tipo: 'manipular', enunciado: R`Mueve el caso hasta que la decisión sea «urgente».`, precision: (e) => (f([e.a, e.b]) > 0.5 ? 1 : 0), prueba: { a: 0.9, b: 0.8 }, pendiente: (e) => `Ahora, la salida es ${f([e.a, e.b]).toFixed(2).replace('.', ',')}.`, pistas: ['Sigue la flecha más corta.'], explicacion: 'Lo que has hecho a mano es lo que busca el algoritmo.' },
    { id: 'cf-calc', tipo: 'calcular', enunciado: R`Si $f = \sigma(2 x_1 + 4 x_2 - 3)$ y estás en $(0, 0)$, ¿cuánto hay que mover $x_2$ para llegar a $f = \frac{1}{2}$?`, respuesta: 0.75, tol: 0.001, pistas: ['Resuelve $4 x_2 - 3 = 0$.'], explicacion: R`$x_2 = \frac{3}{4}$.` },
    { id: 'cf-elegir', tipo: 'elegir', enunciado: 'El contrafactual dice «con otro código postal, habría sido urgente». ¿Qué concluyes?', opciones: ['Que hay que mudarse', 'Que el modelo usa algo que no debería: es una alarma', 'Que está bien calibrado', 'Nada'], correcta: 1, explicacion: 'Un contrafactual absurdo es una prueba barata de que algo va mal.' },
    { id: 'demuestra-cf', tipo: 'demostrar', enunciado: R`Demuestra que, si $f$ es creciente en una coordenada, y aun con su mayor valor no llega a la meta, ningún cambio de esa coordenada sola sirve.`, pistas: ['Compara cualquier valor con el mayor.'], solucion: [{ texto: R`Para cualquier valor $u$ de esa coordenada, por ser creciente, $f(\dots, u, \dots) \le f(\dots, u_{\max}, \dots)$.`, porque: 'Es la definición de creciente.' }, { texto: R`Y este último está por debajo de la meta, luego todos lo están.`, porque: 'Por eso desaparece a veces una flecha de la escena.' }] },
  ],
  referencias: ['S. Wachter, B. Mittelstadt, C. Russell, «Counterfactual Explanations without Opening the Black Box», <em>Harvard J. Law & Technology</em> 31 (2018).'],
};
