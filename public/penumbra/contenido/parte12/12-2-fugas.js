import { AZUL, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { DATOS_FUGA, exactitudFuga, sigma } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { coma } from '../parte9/comun.js';

const R = String.raw;
const D = DATOS_FUGA.slice(0, 130), memo = new Map();
const ex = (k, duro) => { const c = `${k.toFixed(1)}|${duro}`; if (!memo.has(c)) memo.set(c, exactitudFuga(+k.toFixed(1), duro)); return memo.get(c); };
const salto = (i) => ((i * 0.618) % 1);

export default {
  id: '12-2-fugas',
  titulo: 'Cuando los conceptos filtran',
  puente: 'Si un grado filtra, ¿cómo se usa sin que lo haga? Hay que controlar por dónde entra cada concepto en una regla, y para eso hace falta una pieza nueva: el literal.',
  pregunta: 'Pasas un número por el cuello de botella, y debería decir solo «sí» o «no». Pero un 0,97 dice algo más que un 0,55. ¿Y si por esa rendija pasa lo que no querías que pasara?',
  escena: {
    id: 'fugas', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [-2, 2], y: [0, 1], caja: { x: 70, y: 60, w: 640, h: 400 } },
    entradas: [
      { id: 'k', tipo: 'deslizador', etiqueta: 'pendiente del concepto', min: 0.5, max: 8, paso: 0.5, valor: 2 },
      { id: 'duro', tipo: 'deslizador', etiqueta: 'concepto: 0 blando, 1 duro', min: 0, max: 1, paso: 1, valor: 0 },
    ],
    pasos: [
      { dur: 3000, texto: 'La tarea: separar <b style="color:#f4d345;font-weight:400">lo lejos del centro</b> de <b style="color:#58c4dd;font-weight:400">lo cercano</b>. Y el concepto que dejamos pasar es otro: «$x$ es positivo». No tiene nada que ver con la tarea.' },
      { dur: 3400, texto: 'Con un concepto <b>duro</b>, solo 0 o 1. A la derecha, lo que ve quien decide: dos montones, mezclados. Con eso no se puede resolver: se queda en la mitad, y es lo que debe pasar.' },
      { dur: 3400, texto: 'Con el concepto <b>blando</b>, los puntos se reparten por la curva. Y mira: lo cercano queda en el medio, y lo lejano en los extremos. <b style="color:#f05a5a;font-weight:400">Se ve a simple vista</b>.' },
      { dur: 3000, texto: 'Eso es una <b>fuga</b>: lo que dice el grado, además del concepto, es cuánta seguridad tiene. Quien decide lo aprovecha, acierta mucho, y su explicación es falsa: no usa lo que dice usar.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, duro = paso <= 1 ? 1 : paso === 2 ? 0 : Math.round(e.duro), k = paso >= 3 ? e.k : 2, mezcla = paso <= 1 ? 1 : paso === 2 ? 1 - ev(q(2), 0, 0.6) : duro, c = (x) => mix(sigma(k * x), x > 0 ? 1 : 0, mezcla);
      const P = [marco({ x: [-2, 2], y: [0, 1] }, { alfa: al, ticks: { x: [-2, -1, 0, 1, 2], y: [0, 1] }, etiquetas: { x: 'x', y: R`\text{concepto: «es positivo»}` } }), curva((x) => [x, c(x)], [-2, 2], { n: 200, color: GRIS2, ancho: 2, alfa: al, tol: 1 })];
      D.forEach((d, i) => P.push(punto([d.x, c(d.x)], { color: d.y ? ORO : AZUL, radio: 4.2, alfa: al, halo: 0 })));
      const V = [marco({ x: [0, 1], y: [0, 1] }, { alfa: g1, soloBase: true, ticks: { x: [], y: [0, 1] } }), rotulo([0.5, 1], R`\text{lo que ve quien decide}`, { clave: 'vt', dy: -18, tam: 16, color: GRIS2, alfa: g1 })];
      if (g1 > 0) D.forEach((d, i) => V.push(punto([0.12 + 0.76 * salto(i), c(d.x)], { color: d.y ? ORO : AZUL, radio: 4, alfa: g1, halo: 0 })));
      const ac = paso <= 1 ? ex(2, true) : paso === 2 ? ex(2, false) : ex(k, !!duro);
      V.push(rotulo([0.5, 0], R`\text{el mejor posible:}\ ${coma(ac)}`, { clave: 'ex', dy: 22, tam: 19, color: ac > 0.7 ? ROJO : ORO, alfa: g1 }));
      return { principal: P, paneles: [{ ejes: { x: [0, 1], y: [0, 1], caja: { x: 800, y: 60, w: 240, h: 400 } }, prims: V }] };
    },
  },
  manipulacion: '<ul><li>Cambia de blando a duro: el acierto cae de golpe.</li><li>Sube la pendiente con el concepto blando: los puntos se pegan a los extremos, pero siguen distinguiéndose.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Queremos que un concepto cuente una sola cosa. Pero un número continuo tiene sitio para mucho más: un 0,97 y un 0,55 significan «sí» los dos, y entre ambos cabe información sobre cualquier otra cosa. Quien decide aprende a leerla. El modelo acierta más, y por eso cuesta tanto notarlo, y la explicación deja de ser verdadera: dice «por este concepto», y usa lo que iba escondido dentro.' },
    { tipo: 'ejemplo', texto: 'Lo que midieron Mahinpei et al. con dígitos: se quería saber si el número es par, y solo se daban conceptos como «es un 4» o «es un 5».', tabla: [['Prueba', 'Acierto'], ['Lo esperado si no se filtra nada', '50 %, como tirar una moneda'], ['Lo obtenido con conceptos blandos', '69 %']], cierre: 'Aciertan muy por encima de lo posible con lo que dicen los conceptos. La diferencia viene de la fuga.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\hat{c} \in [0, 1]`, dice: 'Concepto blando: un número que puede llevar información de más.' },
      { tex: R`\hat{c} \in \{0, 1\}`, dice: 'Concepto duro: solo dos valores, y no cabe nada más.' },
    ], todo: R`P(\text{acierto}) \le \max\big(P(y = 0),\ P(y = 1)\big)`, lee: 'Si el concepto duro no dice nada sobre $y$, ninguna decisión puede superar a responder siempre lo más común.' },
    { tipo: 'formal', titulo: 'Fuga de información', tex: R`Un modelo con cuello de botella tiene fuga si $f$ extrae de $\hat{c}$ información sobre $y$ que no está en el concepto verdadero $c$. Es decir, si $y$ no es independiente de $\hat{c}$, sabiendo $c$.`, lee: 'Mahinpei et al. (2021) mostraron que ocurre incluso entrenando por separado. Remedios: conceptos duros, entrenar $f$ con los conceptos verdaderos, reglas que limitan la forma de usarlos, y medirlo.' },
    { tipo: 'demo', titulo: 'Con un concepto duro que no informa, no se puede ganar al azar', plan: 'Solo hay dos entradas posibles. Se cuenta lo mejor que puede hacer cualquier $f$.', tex: R`Si $\hat{c}$ es binario e independiente de $y$, para toda $f$: $P(f(\hat{c}) = y) \le \max(P(y = 0), P(y = 1))$.`, pasos: [
      { texto: R`Se separa por el valor del concepto: $P(f(\hat{c}) = y) = \sum_{v} P(\hat{c} = v)\, P(y = f(v) \mid \hat{c} = v)$.`, porque: 'Se reparte entre los dos casos posibles.' },
      { texto: R`Por independencia, $P(y = f(v) \mid \hat{c} = v) = P(y = f(v)) \le \max_t P(y = t)$.`, porque: 'Saber el concepto no cambia nada sobre $y$.' },
      { texto: R`Y una media ponderada de cosas que no pasan de ese máximo, no pasa de él.`, porque: 'Con un grado blando, en cambio, la entrada no tiene dos valores sino infinitos, y este argumento ya no funciona.' },
    ] },
    { tipo: 'nota', titulo: 'No es solo un defecto', texto: 'Una fuga es a veces información útil que faltó en tu lista de conceptos. Si aparece, conviene preguntarse qué concepto falta. Pero entonces hay que añadirlo a la vista, no dejarlo pasar a escondidas.' },
  ],
  tecnicas: [{ titulo: 'Desconfía de un acierto demasiado bueno', texto: 'Prueba con un concepto que no debería servir. Si aun así acierta, algo se está colando.' }],
  retos: [
    { id: 'tapa-fuga', tipo: 'manipular', enunciado: R`Tapa la fuga: consigue que lo mejor posible no pase de $0{,}6$.`, precision: (e) => (ex(e.k, !!Math.round(e.duro)) <= 0.6 ? 1 : 0), prueba: { duro: 1 }, pendiente: (e) => `Ahora, lo mejor posible es ${ex(e.k, !!Math.round(e.duro)).toFixed(2).replace('.', ',')}.`, pistas: ['Lo que importa es el tipo de concepto, no la pendiente.'], explicacion: 'Dos valores no tienen sitio para esconder nada.' },
    { id: 'fuga-calc', tipo: 'calcular', enunciado: R`Un concepto duro no informa sobre $y$, y $P(y = 1) = 0{,}7$. ¿Cuál es el mayor acierto posible?`, respuesta: 0.7, tol: 0.001, pistas: ['Responde siempre lo más común.'], explicacion: R`$\max(0{,}3;\ 0{,}7) = 0{,}7$.` },
    { id: 'fuga-elegir', tipo: 'elegir', enunciado: 'Un modelo con conceptos acierta el 92 %. Sin un concepto clave, sigue en el 90 %. ¿Qué sospechas?', opciones: ['Que el concepto no importaba, seguro', 'Que puede haber fuga por los otros conceptos', 'Que está calibrado', 'Nada'], correcta: 1, explicacion: 'Antes de concluir que no importaba, comprueba si su información llega por otro camino.' },
    { id: 'demuestra-fuga', tipo: 'demostrar', enunciado: R`Demuestra que un concepto blando inyectivo no pierde información: que de $\hat{c}(x)$ se puede recuperar $x$.`, pistas: ['Inyectivo significa que valores distintos de $x$ dan valores distintos de $\hat{c}$. La sigmoide lo es.'], solucion: [{ texto: R`Como $\hat{c}$ es inyectivo, tiene función inversa en su imagen: $x = \hat{c}^{-1}(\hat{c}(x))$.`, porque: 'Es lo que da la inyectividad.' }, { texto: R`Por tanto, cualquier $y$ que dependa de $x$ es también función de $\hat{c}$: $y = h(x) = h(\hat{c}^{-1}(\hat{c}(x)))$.`, porque: 'Por ese cuello cabe toda la entrada. No había ningún cuello.' }] },
  ],
  referencias: ['A. Mahinpei et al., «Promises and Pitfalls of Black-Box Concept Learning Models», <em>ICML Workshop</em> (2021).', 'P. W. Koh et al., <em>ICML</em> (2020).'],
};
