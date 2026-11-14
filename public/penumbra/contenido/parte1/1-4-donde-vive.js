import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { clamp, ev } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const caliente = (T) => clamp((T - 20) / 10), templado = (T) => 1 - caliente(T);
const velocidad = (T, baja, alta) => { const a = templado(T), b = caliente(T); return (a * baja + b * alta) / (a + b); };

export default {
  id: '1-4-donde-vive',
  titulo: 'Dónde vive la lógica difusa',
  puente: 'Quizá ya te lo has preguntado: un número de 0 a 1… ¿no es una probabilidad? No lo es, y la diferencia importa.',
  pregunta: 'Un termostato solo sabe encender y apagar. Tú le dirías «si hace calor, más fuerte». ¿Se le puede enseñar a una máquina a entender eso?',
  escena: {
    id: 'ventilador', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [15, 35], y: [0, 1], caja: { x: 130, y: 70, w: 840, h: 400 } },
    entradas: [
      { id: 'T', tipo: 'arrastre', eje: 'x', valor: [24, 0.5], region: { x: [15, 35], y: [0, 1] } },
      { id: 'alta', tipo: 'deslizador', etiqueta: 'velocidad si hace calor', min: 0.5, max: 1, paso: 0.01, valor: 1 },
      { id: 'baja', tipo: 'deslizador', etiqueta: 'velocidad si está templado', min: 0, max: 0.5, paso: 0.01, valor: 0.2 },
    ],
    pasos: [
      { dur: 2000, texto: 'Un termostato tiene una frontera: por debajo de 25 °C, apagado; por encima, a tope. En torno a 25 °C, cualquier oscilación lo hace saltar.' },
      { dur: 2600, texto: 'Dos ideas vagas describen mejor la temperatura: «templado» y «caliente». Entre 20 °C y 30 °C, ambas son ciertas a la vez, en parte.' },
      { dur: 3000, texto: 'Dos reglas: si está templado, gira despacio; si hace calor, gira rápido. La salida mezcla las dos según el grado de cada una, y la curva dorada ya no salta.' },
      { dur: 1500, texto: 'Esta mezcla de reglas es la idea detrás de muchos controladores reales. La construirás a fondo en la región «Sistemas».' },
    ],
    primitivas({ q, paso, e }) {
      const N = [marco({ x: [15, 35], y: [0, 1] }, { alfa: ev(q(0), 0, 0.4), ticks: { x: [15, 20, 25, 30, 35], y: [0, 1] }, etiquetas: { x: R`\text{temperatura (°C)}` } })];
      const a0 = ev(q(0), 0.2, 1), desv = paso >= 2 ? 1 - 0.75 * ev(q(2), 0, 0.6) : 1;
      if (a0 > 0) N.push(curva((T) => [T, T < 25 ? 0 : 1], [15, 35], { hasta: a0, n: 400, color: GRIS2, ancho: 3, alfa: desv }), rotulo([16, 0], R`\text{termostato}`, { clave: 'termo', dy: -18, ancla: 'l', tam: 19, color: GRIS2, alfa: desv * a0 }));
      const m = ev(q(1), 0, 1);
      if (m > 0) {
        N.push(curva((T) => [T, templado(T)], [15, 35], { hasta: m, n: 80, color: AZUL, ancho: 2.6 }), curva((T) => [T, caliente(T)], [15, 35], { hasta: m, n: 80, color: ROSA, ancho: 2.6 }));
        N.push(rotulo([17, 1], R`\text{templado}`, { clave: 'tem', dy: -18, tam: 20, color: AZUL, alfa: m }), rotulo([33, 1], R`\text{caliente}`, { clave: 'cal', dy: -18, tam: 20, color: ROSA, alfa: m }));
      }
      const v = ev(q(2), 0.2, 1);
      if (v > 0) N.push(curva((T) => [T, velocidad(T, e.baja, e.alta)], [15, 35], { hasta: v, n: 120, color: ORO, ancho: 3.8, brillo: true }), rotulo([33.5, velocidad(33.5, e.baja, e.alta)], R`\text{velocidad}`, { clave: 'vel', dy: 22, tam: 20, color: ORO, alfa: v }));
      if (v > 0.9) {
        const T = e.T[0], a = templado(T), b = caliente(T), s = velocidad(T, e.baja, e.alta), al = ev(v, 0.9, 1);
        N.push(linea([T, 0], [T, Math.max(a, b, s)], { color: BLANCO, ancho: 1.2, alfa: 0.5 * al, discontinua: true }));
        N.push(punto([T, a], { color: AZUL, radio: 5.5, alfa: al }), punto([T, b], { color: ROSA, radio: 5.5, alfa: al }), punto([T, s], { color: ORO, radio: 7, alfa: al }));
        N.push(rotulo([T, s], R`${T.toFixed(0)}\text{ °C} \to ${coma(s)}`, { clave: 'lec', dx: 16, dy: 24, ancla: 'l', tam: 21, color: ORO, alfa: al }));
      }
      return N;
    },
  },
  manipulacion: `<ul>
    <li>Arrastra la línea vertical por la temperatura: mira cómo pierde fuerza una regla mientras la gana la otra.</li>
    <li>Cambia las velocidades de cada regla: es decir, cambia lo que «sabe» el controlador, sin ninguna ecuación física.</li></ul>`,
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'El termostato conoce una sola frontera. Tú, en cambio, piensas con reglas vagas: «si está templado, despacio; si hace calor, fuerte». Un sistema difuso hace justo eso: traduce esas reglas a números.' },
    { tipo: 'ejemplo', texto: 'Con las dos reglas de la escena, y velocidades 0,2 y 1:', tabla: [['Temperatura', '20', '25', '27', '30'], ['Grado de «templado»', '1', '0,5', '0,3', '0'], ['Grado de «caliente»', '0', '0,5', '0,7', '1'], ['Velocidad', '0,2', '0,6', '0,76', '1']], cierre: 'A 25 °C, las dos reglas pesan igual, y sale la media entre 0,2 y 1.' },
    { tipo: 'simbolos', intro: 'La mezcla, pieza a pieza.', piezas: [
      { tex: R`a,\ b`, dice: 'Los grados con que se cumple cada regla: «templado» y «caliente».' },
      { tex: R`v_a,\ v_b`, dice: 'La velocidad que pide cada regla.' },
      { tex: R`a\, v_a + b\, v_b`, dice: 'Cada velocidad pesa según lo que se cumple su regla.' },
      { tex: R`\div\ (a + b)`, dice: 'Dividir por el peso total, para que el resultado quede entre las dos velocidades.' },
    ], todo: R`v = \dfrac{a\, v_a + b\, v_b}{a + b}`, lee: 'Es una [[media ponderada|media-ponderada]]: como la nota de un curso en el que cada examen pesa distinto.' },
    { tipo: 'formal', titulo: 'Un sistema de reglas, en pequeño', tex: R`Si cada regla $i$ se cumple con grado $g_i$ y pide una salida $v_i$, la salida del sistema es $\dfrac{\sum_i g_i\, v_i}{\sum_i g_i}$, siempre que algún $g_i$ sea positivo.`, lee: 'El símbolo $\\sum_i$ quiere decir «suma para todas las reglas». En la región 6 lo llamarás sistema de Sugeno.' },
    { tipo: 'idea', etiqueta: 'Para qué sirve', texto: 'Zimmermann resume su utilidad en varios objetivos. Los tres más claros: convertir decisiones de sí o no en decisiones graduales; resumir montañas de datos en pocas palabras; y conseguir soluciones aproximadas más baratas que un modelo exacto.' },
    { tipo: 'nota', titulo: 'En el mundo real', texto: 'El caso más citado es el metro de Sendai, en Japón: en su línea Namboku, abierta en 1987, un control difuso de Hitachi gobernaba aceleración, frenado y parada. Desde finales de los años 80, fabricantes japoneses como Matsushita lanzaron lavadoras, aspiradoras y cámaras «difusas». También fue en parte un reclamo comercial: no te creas todas las etiquetas.' },
    { tipo: 'nota', titulo: 'De dónde sale lo vago', texto: 'Hay dos fuentes. A veces está en la palabra misma: «alto» no tiene frontera, sepas lo que sepas. Otras veces es falta de capacidad: se podría definir con exactitud quién es un «cliente solvente», pero harían falta más datos de los que una persona puede manejar a la vez.' },
    { tipo: 'nota', titulo: 'Cuándo no usarla', texto: 'Encaja si hay conocimiento experto en palabras y no hay un modelo preciso, o sale muy caro. No encaja si el problema exige exactitud y hay un algoritmo exacto: comprobar una contraseña no admite grados.' },
  ],
  tecnicas: [
    { titulo: 'Pregúntate quién tiene el conocimiento', texto: 'Si lo tiene una persona experta y lo cuenta con palabras vagas («si va un poco rápido, frena algo»), la lógica difusa puede traducirlo. Si lo tiene una ecuación exacta, usa la ecuación.' },
  ],
  retos: [
    { id: 'se-presta', tipo: 'elegir', enunciado: '¿Cuál de estos problemas se presta mejor a un sistema difuso?',
      opciones: ['Verificar que dos archivos son idénticos', 'Calcular el saldo exacto de una cuenta', 'Ajustar la frenada de un tren como lo haría un conductor experto', 'Ordenar una lista de números'],
      correcta: 2, explicacion: 'Hay conocimiento experto en palabras y no hace falta una respuesta exacta: es justo el caso de Sendai.' },
    { id: 'decidir-ventilador', tipo: 'calcular', enunciado: R`Con el controlador de la escena ($v_a = 0{,}2$ y $v_b = 1$), ¿qué velocidad da a $T = 27$ °C?`,
      respuesta: 0.76, tol: 0.006, pistas: [R`Entre 20 y 30 °C, $\mu_{\text{caliente}}(T) = (T - 20) \div 10$.`, R`$a = 0{,}3$ y $b = 0{,}7$; además $a + b = 1$.`], explicacion: R`$0{,}3 \cdot 0{,}2 + 0{,}7 \cdot 1 = 0{,}76$.` },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., Kluwer, 2001, caps. 1–2.', 'Sendai Subway 1000 series y control difuso de Hitachi (historia de la línea Namboku, 1987).', 'Tech Monitor (c. 1990): gama de electrodomésticos difusos de Matsushita.', 'The Japan Times (2017): historia de las arroceras y «fuzzy logic» como reclamo.'],
};
