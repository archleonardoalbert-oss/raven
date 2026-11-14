import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { poligono } from '../../nucleo/fuzzython.js';
import { punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { tramo } from '../parte9/comun.js';
import { codigo, coma } from '../parte14/comun.js';

const R = String.raw;
const hot = poligono([[30, 0], [35, 1], [40, 1]]), normal = poligono([[15, 0], [20, 1], [30, 1], [35, 0]]), high = poligono([[40, 0], [80, 1], [100, 1]]);
const val = (e) => { const a = hot.val(e.t), b = high.val(e.h), c = normal.val(e.t), y = Math.min(a, b), o = Math.max(y, c); return { a, b, c, y, o, f: o * 0.8 }; };
const POS = { a: [14, 12], b: [40, 12], c: [68, 12], y: [27, 35], o: [46, 58], f: [46, 82] };
export default {
  id: '15-2-reglas',
  titulo: 'Reglas que se leen',
  puente: 'Tienes reglas. Para que calculen hay que agruparlas en un bloque, y decidir con qué normas. Ahí está lo interesante.',
  pregunta: 'En fuzzython una regla es una frase: <code>if temp is hot and hum is high or temp is normal then ...</code>. Se lee como inglés. ¿Pero qué se calcula primero, el <code>and</code> o el <code>or</code>? Y el <code>with 0.8</code> del final, ¿qué hace?',
  escena: {
    id: 'reglas', formato: 'plano', W: 1100, H: 520,
    ejes: { x: [0, 100], y: [0, 100], caja: { x: 90, y: 40, w: 920, h: 430 } },
    entradas: [{ id: 't', tipo: 'deslizador', etiqueta: 'temperatura', min: 0, max: 40, paso: 0.5, valor: 33 }, { id: 'h', tipo: 'deslizador', etiqueta: 'humedad', min: 0, max: 100, paso: 1, valor: 70 }],
    pasos: [
      { dur: 2800, texto: 'La frase se convierte en un árbol. Abajo, las hojas: cada una es una variable y una palabra. <code>and</code> ata más fuerte que <code>or</code>, igual que × antes que +.' },
      { dur: 2800, texto: 'Los grados suben desde las hojas. <code>and</code> toma el mínimo de los suyos.' },
      { dur: 2800, texto: '<code>or</code> toma el máximo: se queda con lo que venga de «hot y high», o con «normal» si es mayor.' },
      { dur: 2800, texto: 'Y <code>with 0.8</code> multiplica el resultado. Esa es <b style="color:#f4d345;font-weight:400">la fuerza de la regla</b>. Es un peso, no un filtro. Mueve las dos entradas.' },
    ],
    primitivas({ q, paso, e }) {
      const v = val(e), g0 = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, N = [];
      const lin = (a, b, g, c = GRIS2) => N.push(...tramo(POS[a], POS[b], { color: c, ancho: 1.6, alfa: g }));
      lin('a', 'y', g0); lin('b', 'y', g0); lin('y', 'o', g0); lin('c', 'o', g0); lin('o', 'f', g0);
      const nodo = (k, tit, valor, g, col) => { N.push(punto(POS[k], { color: col, radio: 9, alfa: g0 })); N.push(rotulo(POS[k], R`\text{${tit}}`, { clave: 'n' + k, ...(k === 'a' || k === 'b' || k === 'c' ? { dy: 26 } : { dx: -18, dy: -4, ancla: 'r' }), tam: 20, color: col, alfa: g0 })); N.push(rotulo(POS[k], R`${coma(valor)}`, { clave: 'v' + k, dx: 30, tam: 24, color: BLANCO, alfa: g })); };
      nodo('a', 'temp is hot', v.a, g0, ROSA); nodo('b', 'hum is high', v.b, g0, AZUL); nodo('c', 'temp is normal', v.c, g0, ORO);
      nodo('y', 'and = min', v.y, g1, BLANCO); nodo('o', 'or = max', v.o, g2, BLANCO); nodo('f', 'with 0.8', v.f, g3, ORO);
      return N;
    },
  },
  manipulacion: '<ul><li>Mueve la humedad: si «normal» ya es mayor, no cambia nada.</li><li>Sube la temperatura a 38, y solo queda el camino de «hot».</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Cada regla se analiza una sola vez, al crearla, y queda como un árbol. Los nombres de la frase no son los <code>name</code> de tus objetos: se buscan en <code>scope</code>, un diccionario de variables de Python. Por eso casi siempre se pasa <code>scope=locals()</code>.' },
    codigo('En Python', 'La regla de la escena:', "from rules.rule import Rule\n\nr = Rule.parse('if temp is hot and hum is high or temp is normal then minutes is large with 0.8', locals())\ntemp.value = 33\nhum.value = 70\nprint(type(r).__name__, r.weight)\nr._antecedent.print_tree()      # el árbol: no hay forma pública de verlo\nprint(r._antecedent.evaluate())", 'Da 0,6: el mínimo de 0,6 y 0,75 es 0,6, y el máximo con «normal», 0,4, también. Multiplicado por 0,8, la fuerza es 0,48.', { prefacio: "from adjective import Adjective\nfrom fsets.polygon import Polygon\nfrom variable import Variable\n\nnormal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))\nhot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))\ntemp = Variable('temp', 'C', normal, hot)\nhigh = Adjective('high', Polygon((40, 0), (80, 1), (100, 1)))\nhum = Variable('hum', '%', high)\nlarge = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))\nminutes = Variable('minutes', 'min', large, defuzzification='COG', default=0)" }),
    { tipo: 'ejemplo', texto: 'Qué acepta el analizador, comprobado una a una:', tabla: [['Escribes', 'Pasa'], ['<code>IF temp is hot then ...</code>', 'Error: <code>if</code> va en minúsculas'], ['<code>temp IS hot and hum IS high</code>', 'Bien: en el antecedente da igual'], ['<code>not (temp is hot)</code>', 'Error: va en mayúsculas, <code>NOT (</code>'], ['<code>temp is not hot</code>', 'Bien'], ['<code>then z = dist*2</code>', 'Falla: «dist» contiene «is»']], cierre: 'La última es la más traicionera: busca la palabra «is» como simple texto, y confunde la regla.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\text{and} \to T`, dice: 'La [[norma T]] del bloque. De serie, el mínimo.' },
      { tex: R`\text{or} \to S`, dice: 'La [[norma S]] del bloque. De serie, el máximo.' },
      { tex: R`\text{NOT} \to C`, dice: 'El complemento. De serie, $1 - x$.' },
      { tex: R`w`, dice: 'El peso que acompaña a <code>with</code>.' },
    ], todo: R`\text{fuerza} = \text{antecedente} \cdot w`, lee: '«La fuerza es el grado del antecedente, multiplicado por el peso». El peso actúa sobre toda la regla.' },
    { tipo: 'formal', titulo: 'La gramática', tex: R`$\text{antecedente} \to \text{término}\ \{\text{or término}\}$; $\ \text{término} \to \text{factor}\ \{\text{and factor}\}$; $\ \text{factor} \to \text{var is [not] adj} \mid (\text{antecedente}) \mid \text{NOT}\,(\text{antecedente})$.`, lee: 'Que <code>and</code> esté más abajo en la gramática es justo lo que le da preferencia sobre <code>or</code>. Es la misma técnica de las calculadoras.' },
    { tipo: 'demo', titulo: 'Sin paréntesis, el orden importa', plan: 'Basta un contraejemplo, con los grados de la escena.', tex: R`$a \text{ or } (b \text{ and } c)$ y $(a \text{ or } b) \text{ and } c$ no son la misma regla.`, pasos: [
      { texto: R`Toma $a = 1$, $b = 0$, $c = 0$.`, porque: 'Se busca el caso más simple que las separe.' },
      { texto: R`Lo primero da $\max(1, \min(0, 0)) = 1$.`, porque: 'Basta con $a$.' },
      { texto: R`Lo segundo da $\min(\max(1, 0), 0) = 0$.`, porque: 'Falla por $c$. Son distintas, y por eso hay que saber qué agrupa el analizador.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Probar el analizador con casos raros', texto: 'Lee reglas con espacios, mayúsculas y nombres extraños antes de fiarte de ellas. Y si la librería es antigua, recuerda: esa frase se evalúa con <code>eval</code>. Nunca cargues reglas de alguien en quien no confías.' }],
  retos: [
    { id: 'regla-048', tipo: 'manipular', enunciado: R`Busca entradas para que la fuerza de la regla sea exactamente $0{,}8$.`, precision: (e) => (Math.abs(val(e).f - 0.8) < 0.001 ? 1 : 0), prueba: { t: 25, h: 70 }, pendiente: (e) => `La fuerza es ${val(e).f.toFixed(2).replace('.', ',')}.`, pistas: ['El máximo posible es el peso: hace falta un 1 en el «or».'], explicacion: 'Con «normal» igual a 1, por ejemplo a 25 grados, la humedad da igual.' },
    { id: 'fuerza-calc', tipo: 'calcular', enunciado: R`Si «hot» vale $0{,}9$, «high» $0{,}5$ y «normal» $0{,}2$, ¿qué fuerza tiene la regla?`, respuesta: 0.4, tol: 0.001, pistas: [R`$\min(0{,}9;\ 0{,}5) = 0{,}5$; $\max(0{,}5;\ 0{,}2) = 0{,}5$.`], explicacion: R`$0{,}5 \cdot 0{,}8 = 0{,}4$.` },
    { id: 'analiza-elegir', tipo: 'elegir', enunciado: '¿Cuál de estas reglas se analiza bien?', opciones: ['IF temp is hot then m is large', 'if not (temp is hot) then m is large', 'if temp is not hot then m is large', 'if temp is hot Then m is large'], correcta: 2, explicacion: '<code>is not</code> se admite en cualquier forma. Las otras tropiezan con mayúsculas y minúsculas.' },
    { id: 'demuestra-morgan', tipo: 'demostrar', enunciado: R`Demuestra, con mínimo y máximo y $C(x) = 1 - x$, que <code>NOT (a or b)</code> equivale a <code>a is not ... and b is not ...</code>.`, pistas: ['Supón $a \\le b$.'], solucion: [{ texto: R`Si $a \le b$: $1 - \max(a, b) = 1 - b$.`, porque: 'El máximo es $b$.' }, { texto: R`Y $\min(1 - a, 1 - b) = 1 - b$, porque $1 - b \le 1 - a$.`, porque: 'Restar de 1 invierte el orden. El caso $a > b$ es igual.' }] },
  ],
  referencias: ['<em>fuzzython</em>: rules/parser.py y rules/rule.py.', 'Documentación interna: sección 7.'],
};
