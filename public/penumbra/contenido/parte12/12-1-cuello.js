import { AZUL, BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { curvaIntervencion } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { barra, coma, tramo } from '../parte9/comun.js';

const R = String.raw;
const CURVA = curvaIntervencion(), NOM = ['dolor torácico', 'sudoración', 'falta de aire', 'más de 65 años'], FIJOS = [0.8, 0.1, 0.7];
const sale = (c) => 1 - (1 - c * FIJOS[0]) * (1 - FIJOS[1] * FIJOS[2]);

export default {
  id: '12-1-cuello',
  titulo: 'El cuello de botella de conceptos',
  puente: 'Pasar los grados tal cual parece lo más honrado. Pero un grado lleva más información de la que debería, y eso tiene una trampa.',
  pregunta: 'Una red lee un informe y dice «urgente». ¿Por qué? No lo sabe nadie. ¿Y si la obligas a pasar por un punto estrecho, donde solo puede expresarse con palabras que un médico entiende?',
  escena: {
    id: 'cuello', formato: 'plano', W: 1100, H: 560,
    ejes: { x: [0, 10], y: [0, 6], caja: { x: 40, y: 40, w: 640, h: 470 } },
    entradas: [{ id: 'c', tipo: 'deslizador', etiqueta: 'grado de «dolor torácico»', min: 0, max: 1, paso: 0.01, valor: 0.15 }],
    pasos: [
      { dur: 2800, texto: 'De un <b>texto</b> a una <b>decisión</b>. Una red normal mezcla todo por dentro, y lo que hay entre los dos extremos no significa nada para nosotros.' },
      { dur: 3200, texto: 'El cuello de botella: en medio, una capa con un sentido fijado de antemano. <b style="color:#58c4dd;font-weight:400">Cada neurona es un concepto</b>. La decisión solo puede usar lo que pasa por ahí.' },
      { dur: 3600, texto: 'Ahora se ve el error: el modelo no ha visto el dolor. Un médico lo corrige con la mano, y <b style="color:#f4d345;font-weight:400">la decisión cambia sola</b>. Eso se llama <b>intervenir</b>, y una caja negra no lo permite.' },
      { dur: 3000, texto: 'A la derecha, sobre casos de juguete: corrigiendo cada vez más conceptos, el acierto sube. Y vuelve el caso de antes, sin corregir: te toca a ti.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, c = paso <= 1 ? 0.15 : paso === 2 ? mix(0.15, 0.9, ev(q(2), 0.25, 0.75)) : mix(0.9, e.c, ev(q(3), 0.3, 0.7)), S = sale(c), V = [c, ...FIJOS];
      const N = [barra(0, 1.5, 4.2, { color: BLANCO, alfa: 0.07 * al }, 1.8), rotulo([0.75, 4.2], R`\text{informe}`, { clave: 'inf', dy: -14, tam: 17, color: GRIS2, alfa: al })];
      for (let i = 0; i < 6; i++) N.push(...tramo([0.2, 3.9 - i * 0.33], [i % 2 ? 1.05 : 1.3, 3.9 - i * 0.33], { color: GRIS2, ancho: 1.2, alfa: 0.6 * al, radio: 0.5 }));
      V.forEach((v, i) => { const y = 4.6 - i * 1.05, em = i === 0 && paso >= 2; N.push(...tramo([1.5, 3], [4, y + 0.2], { color: GRIS2, ancho: 1, alfa: 0.45 * g1, radio: 0.5 }), ...tramo([7, y + 0.2], [8.2, 3], { color: i === 0 ? ORO : GRIS2, ancho: 1 + 2 * v, alfa: 0.6 * g1, radio: 0.5 }), barra(4, 7, y + 0.4, { color: BLANCO, alfa: 0.07 * g1 }, y), barra(4, 4 + 3 * v, y + 0.4, { color: em ? ORO : AZUL, alfa: 0.85 * g1 }, y), rotulo([4, y + 0.4], R`\text{${NOM[i]}}`, { clave: `n${i}`, ancla: 'l', dy: -12, tam: 16, color: GRIS2, alfa: g1 }), rotulo([7, y + 0.4], coma(v), { clave: `v${i}`, ancla: 'r', dy: -12, tam: 16, color: em ? ORO : BLANCO, alfa: g1 })); });
      if (g1 < 1) N.push(...tramo([1.5, 3], [8.2, 3], { color: GRIS2, ancho: 1.5, alfa: al * (1 - g1), radio: 0.5 }));
      const urg = S > 0.5;
      N.push(barra(8.2, 10, 3.9, { color: urg ? ROJO : AZUL, alfa: 0.75 * al }, 2.1), rotulo([9.1, 3.3], R`\text{${urg ? 'urgente' : 'no urgente'}}`, { clave: 'dec', tam: 17, alfa: al }), rotulo([9.1, 2.7], coma(S), { clave: 'val', tam: 21, alfa: g1 }));
      const G = [marco({ x: [0, 6], y: [0.5, 1] }, { alfa: g3, ticks: { x: [0, 6], y: [0.5, 1] }, etiquetas: { x: R`\text{conceptos corregidos}`, y: R`\text{acierto}` } })];
      if (g3 > 0) { G.push(curva((u) => { const i = Math.min(5, Math.floor(u)); return [u, CURVA[i] + (CURVA[i + 1] - CURVA[i]) * (u - i)]; }, [0, 6], { n: 60, color: ORO, ancho: 2.8, alfa: g3 })); CURVA.forEach((v, i) => G.push(punto([i, v], { color: ORO, radio: 5, alfa: g3 }))); }
      return { principal: N, paneles: [{ ejes: { x: [0, 6], y: [0.5, 1], caja: { x: 780, y: 110, w: 270, h: 290 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Sube el grado de dolor, y busca el punto donde la decisión cambia.</li><li>Con la sudoración tan alta, un dolor moderado ya basta. Eso es lo que dice la regla.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Divide el modelo en dos: una parte que lee y da conceptos, $g$, y otra que decide solo con ellos, $f$. Así se puede leer qué ha visto, y corregirlo. La parte $g$ es justo el decisor de la parada anterior; lo nuevo es <b>obligar</b> a la decisión a pasar por ahí.' },
    { tipo: 'ejemplo', texto: 'Tres formas de entrenarlo, según Koh et al.:', tabla: [['Forma', 'Cómo', 'Consecuencia'], ['Independiente', '$g$ y $f$ por separado; $f$ aprende de los conceptos verdaderos', 'Intervenir funciona mejor'], ['Secuencial', 'Primero $g$; luego $f$, con lo que dice $g$', '$f$ se adapta a los errores de $g$'], ['Conjunta', 'Las dos a la vez, con una pérdida sumada', 'Suele acertar más, y se le cuela información']], cierre: 'En su experimento de artrosis de rodilla, corregir solo dos conceptos bajó mucho el error.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`g : x \mapsto \hat{c}`, dice: 'Del texto a los conceptos. El sombrero significa «estimado».' },
      { tex: R`f : \hat{c} \mapsto \hat{y}`, dice: 'De los conceptos a la decisión. No ve el texto.' },
      { tex: R`\hat{c}_j \leftarrow c_j`, dice: 'Intervenir: sustituir lo que dijo el modelo por el valor verdadero.' },
    ], todo: R`\hat{y} = f(g(x))`, lee: '«La decisión es función del texto, pero solo a través de los conceptos».' },
    { tipo: 'formal', titulo: 'Modelos con cuello de botella (Koh et al., 2020)', tex: R`Con datos $(x, c, y)$, el entrenamiento conjunto minimiza $L_Y(f(g(x)), y) + \lambda \sum_j L_{C_j}(g_j(x), c_j)$. La intervención en el concepto $j$ evalúa $f$ con $\hat{c}_j$ sustituido por $c_j$.`, lee: 'Hacen falta datos con los conceptos anotados: es su coste principal. Una capa difusa, como veremos, permite además que $f$ sean reglas que se leen.' },
    { tipo: 'demo', titulo: 'Si los conceptos activos son correctos, intervenir no cambia nada', plan: 'Se sigue la definición de $f$: una función solo mira sus entradas.', tex: R`Si $\hat{c}_j = c_j$ para los conceptos de los que depende $f$, y $f(c) = y$, entonces $f(\hat{c}) = y$.`, pasos: [
      { texto: R`$f$ solo depende de los conceptos activos: si coinciden en dos entradas, da lo mismo.`, porque: 'Es lo que significa «depende solo de».' },
      { texto: R`Luego $f(\hat{c}) = f(c) = y$.`, porque: 'Dicho al revés: si la decisión falla y $f$ es correcta, algún concepto activo está mal. Por eso los errores se pueden buscar. Lo usaremos en el capítulo siguiente.' },
    ] },
    { tipo: 'nota', titulo: 'Juguete', texto: 'Los casos son inventados, y la regla de ejemplo es para ver el mecanismo. Nada de esto describe cómo se debe atender a un paciente.' },
  ],
  tecnicas: [{ titulo: 'Fuerza un paso intermedio con sentido', texto: 'Si necesitas explicar una función complicada, escríbela como composición, con un punto medio que signifique algo. Pierdes algo de libertad, y ganas un sitio por el que mirar y corregir.' }],
  retos: [
    { id: 'interviene', tipo: 'manipular', enunciado: R`Corrige el concepto hasta que la decisión pase a «urgente».`, precision: (e) => (sale(e.c) > 0.5 ? 1 : 0), prueba: { c: 0.9 }, pendiente: (e) => `Ahora, la salida es ${sale(e.c).toFixed(2).replace('.', ',')}.`, pistas: ['Basta un poco más de la mitad.'], explicacion: 'Nadie ha vuelto a entrenar nada: se ha cambiado un número con sentido.' },
    { id: 'cuello-calc', tipo: 'calcular', enunciado: R`Con $f = 1 - (1 - c_1 c_2)(1 - c_3 c_4)$, y grados $0{,}5;\ 1;\ 0;\ 1$, ¿cuánto vale la salida?`, respuesta: 0.5, tol: 0.001, pistas: [R`El segundo paréntesis vale $1$.`], explicacion: R`$1 - (1 - 0{,}5) \cdot 1 = 0{,}5$.` },
    { id: 'cuello-elegir', tipo: 'elegir', enunciado: '¿Cuál es el principal coste de estos modelos?', opciones: ['Que no se pueden entrenar', 'Que hacen falta conceptos elegidos y, normalmente, anotados', 'Que no aceptan texto', 'Que no son derivables'], correcta: 1, explicacion: 'Alguien tiene que decidir qué conceptos importan.' },
    { id: 'demuestra-cuello', tipo: 'demostrar', enunciado: R`Demuestra que, si $f$ es correcta sobre conceptos verdaderos y $f(\hat{c}) \ne y$, algún concepto del que depende $f$ está mal estimado.`, pistas: ['Por contradicción.'], solucion: [{ texto: R`Supón que todos los conceptos de los que depende $f$ están bien: $\hat{c}_j = c_j$.`, porque: 'Es la negación de lo que queremos.' }, { texto: R`Entonces $f(\hat{c}) = f(c) = y$, lo que contradice $f(\hat{c}) \ne y$.`, porque: 'Luego al menos uno está mal.' }] },
  ],
  referencias: ['P. W. Koh et al., «Concept Bottleneck Models», <em>ICML</em> (2020).'],
};
