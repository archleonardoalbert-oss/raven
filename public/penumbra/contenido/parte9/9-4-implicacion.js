import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { IMPL, gradImpl, sigmoidal } from '../../nucleo/ia.js';
import { linea, mapaCalor, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma, flecha } from './comun.js';

const R = String.raw;
const U = [0, 1], TIPOS = [['reichenbach', 'Reichenbach'], ['godel', 'Gödel'], ['sigmoidal', 'Sigmoidal']];
const SIG = sigmoidal(IMPL.reichenbach, 9, -0.5);
const impl = (t, a, c) => (t === 'sigmoidal' ? SIG(a, c) : IMPL[t](a, c));
/** La sigmoidal reparte como Reichenbach, multiplicado por la pendiente de su curva en S: se calcula por diferencias. */
const grad = (t, a, c) => { if (t !== 'sigmoidal') return gradImpl(t, a, c); const h = 1e-4, g = gradImpl('reichenbach', a, c), f = (SIG(a, Math.min(1, c + h)) - SIG(a, Math.max(0, c - h))) / ((Math.min(1, c + h) - Math.max(0, c - h)) * Math.max(a, 1e-6)); return { mp: g.mp * f, mt: g.mt * f }; };
/** Una colección de casos: la mayoría no son cuervos ni negros; unos pocos son cuervos. */
function totales(t, cuervos) {
  const casos = [[0.1, 0.1, 1 - cuervos], [0.9, 0.8, cuervos]];
  return casos.reduce((s, [a, c, peso]) => { const g = grad(t, a, c); return { mp: s.mp + peso * g.mp, mt: s.mt + peso * g.mt }; }, { mp: 0, mt: 0 });
}

export default {
  id: '9-4-implicacion',
  titulo: 'La implicación y sus gradientes',
  puente: 'Ya sabes qué operadores dejan pasar la señal. Toca usarlos: escribir una regla entera y convertirla en la pérdida con la que aprende una red.',
  pregunta: '«Todos los cuervos son negros». La red ve algo que parece un cuervo y no parece negro. Hay dos formas de arreglarlo: o es negro, o no era un cuervo. ¿Cuál elige el gradiente? Casi siempre, la segunda.',
  escena: {
    id: 'impl-grad', formato: 'plano', W: 1100, H: 560,
    ejes: { x: U, y: U, caja: { x: 80, y: 70, w: 420, h: 420 } },
    entradas: [
      { id: 'tipo', tipo: 'deslizador', etiqueta: 'implicación (0 Reichenbach, 1 Gödel, 2 sigmoidal)', min: 0, max: 2, paso: 1, valor: 0 },
      { id: 'a', tipo: 'deslizador', etiqueta: 'a: ¿es un cuervo?', min: 0, max: 1, paso: 0.01, valor: 0.1 },
      { id: 'c', tipo: 'deslizador', etiqueta: 'c: ¿es negro?', min: 0, max: 1, paso: 0.01, valor: 0.1 },
      { id: 'cuervos', tipo: 'deslizador', etiqueta: 'proporción de cuervos en los datos', min: 0, max: 1, paso: 0.01, valor: 0.1 },
    ],
    pasos: [
      { dur: 2800, texto: 'El mapa es «si $a$, entonces $c$», según Reichenbach: $1 - a + a c$. Es la misma familia que viste en la región 5. El punto es lo que dice ahora la red sobre un objeto.' },
      { dur: 3400, texto: 'Dos fuerzas lo corrigen. <b style="color:#fc6282;font-weight:400">Sube $c$</b>: es el modus ponens, «es un cuervo, luego es negro». <b style="color:#58c4dd;font-weight:400">Baja $a$</b>: es el modus tollens, «no es negro, luego no era un cuervo».' },
      { dur: 3600, texto: 'En una foto cualquiera, casi nada es un cuervo ni es negro: el punto vive abajo a la izquierda. Allí, la fuerza que manda es la azul: <b>la red aprende a negar que hay cuervos</b>.' },
      { dur: 3400, texto: 'A la derecha, la suma sobre todos los datos. Con pocos cuervos, el desequilibrio es enorme. Gödel se va al otro extremo: no usa nunca el modus tollens, y eso le hace errar por el lado opuesto.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), f1 = ev(q(1), 0, 0.5), t = paso < 3 ? 'reichenbach' : TIPOS[Math.round(e.tipo)][0], g = grad(t, e.a, e.c);
      const N = [mapaCalor((a, c) => impl(t, a, c), { clave: `im${t}` }), marco({ x: U, y: U }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: R`a\ \text{(cuervo)},\quad c\ \text{(negro)}`, y: 'c' } }), punto([e.a, e.c], { color: BLANCO, radio: 8, alfa: al })];
      N.push(rotulo([0.5, 1], R`\text{${TIPOS.find(([k]) => k === t)[1]}}:\ I(a, c) = ${coma(impl(t, e.a, e.c))}`, { clave: 'v', dy: -20, tam: 20, alfa: al }));
      if (f1 > 0) {
        if (g.mp > 1e-6) N.push(...flecha([e.a, e.c], [0, Math.min(0.42, g.mp * 0.3)], { color: ROSA, alfa: f1, ancho: 3.4 }));
        if (g.mt > 1e-6) N.push(...flecha([e.a, e.c], [-Math.min(0.42, g.mt * 0.3), 0], { color: AZUL, alfa: f1, ancho: 3.4 }));
      }
      const D = [], d = ev(q(3), 0, 0.4), tot = totales(t, e.cuervos);
      if (f1 > 0) { D.push(rotulo([215, 12], R`{\color{#fc6282}\text{sube } c:\ ${coma(g.mp)}}\qquad {\color{#58c4dd}\text{baja } a:\ ${coma(g.mt)}}`, { clave: 'g', tam: 22, alfa: f1 })); D.push(rotulo([215, 44], R`\text{en este objeto}`, { clave: 'ge', tam: 15, color: GRIS2, alfa: f1 })); }
      if (d > 0) {
        const m = Math.max(tot.mp, tot.mt, 0.2), H = 210, baseY = 330;
        D.push(poligono([[110, baseY], [190, baseY], [190, baseY - (tot.mp / m) * H], [110, baseY - (tot.mp / m) * H]], { color: ROSA, alfa: d }), poligono([[240, baseY], [320, baseY], [320, baseY - (tot.mt / m) * H], [240, baseY - (tot.mt / m) * H]], { color: AZUL, alfa: d }));
        D.push(punto([90, baseY], { color: GRIS2, radio: 2, alfa: d, halo: 0 }), punto([340, baseY], { color: GRIS2, radio: 2, alfa: d, halo: 0 }), linea([90, baseY], [340, baseY], { color: GRIS2, ancho: 1, alfa: d }));
        D.push(rotulo([150, 356], R`\text{modus ponens}`, { clave: 'mp', tam: 15, color: ROSA, alfa: d }), rotulo([280, 356], R`\text{modus tollens}`, { clave: 'mt', tam: 15, color: AZUL, alfa: d }), rotulo([215, 390], R`\text{Sobre todos los datos}`, { clave: 'tod', tam: 17, color: ORO, alfa: d }));
      }
      return { principal: N, paneles: [{ ejes: { x: [0, 430], y: [420, 0], caja: { x: 620, y: 70, w: 430, h: 420 } }, prims: D }] };
    },
  },
  manipulacion: '<ul><li>Cambia la proporción de cuervos: el equilibrio llega con muchos más de los que hay en el mundo real.</li><li>Prueba con Gödel y con la sigmoidal, y compara las dos barras.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Ante una regla violada, un gradiente puede subir la conclusión o bajar la condición. Las dos arreglan la lógica, pero no significan lo mismo. Con reglas como «si es cuervo, es negro», casi todo en el mundo es «no cuervo y no negro», y por eso la inmensa mayoría del gradiente empuja a negar la condición: es una versión diferenciable de la paradoja de los cuervos de Hempel.' },
    { tipo: 'ejemplo', texto: 'Con la implicación de Reichenbach, $I(a, c) = 1 - a + ac$, en tres objetos:', tabla: [['Objeto', 'a', 'c', 'Sube c: a', 'Baja a: 1 − c'], ['Fondo de una foto', '0,1', '0,1', '0,1', '0,9'], ['Algo negro, no cuervo', '0,1', '0,9', '0,1', '0,1'], ['Un cuervo negro', '0,9', '0,8', '0,9', '0,2']], cierre: 'Si el 90 % de los casos son como el primero, en total la fuerza de negar es unas 5 veces la de afirmar.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\frac{\partial I}{\partial c} = a`, dice: 'El empujón del modus ponens: cuanto más cuervo, más hay que subir «negro».' },
      { tex: R`-\frac{\partial I}{\partial a} = 1 - c`, dice: 'El del modus tollens: cuanto menos negro, más hay que bajar «cuervo».' },
      { tex: R`\sigma_I(a, c)`, dice: 'La implicación sigmoidal: pasa $I$ por una curva en S, reescalada para conservar los extremos.' },
    ], todo: R`\sigma_I(a, c) = \frac{1}{e^{\frac{s}{2}} - 1}\left((1 + e^{\frac{s}{2}})\, \sigma\big(s(I(a, c) - \tfrac{1}{2})\big) - 1\right)`, lee: 'Es la fórmula del artículo con $b_0 = -\\frac{1}{2}$. Sus autores usan $s = 9$: da más pendiente en la zona central, y menos en las esquinas.' },
    { tipo: 'formal', titulo: 'Lo que dicen los experimentos', tex: R`En su tarea con MNIST y pocas etiquetas: Reichenbach 96,3 %; sigmoidal 96,3 % con Adam y 97,3 % con SGD; Gödel 90,5 %; Goguen 93,6 %. Las implicaciones S, como Reichenbach, se comportaron mejor que las R, como Gödel.`, lee: 'Otro dato honesto: los métodos que no usan lógica, como Ladder Networks, seguían por encima (98,9 %). Las reglas ayudan, pero no son magia.' },
    { tipo: 'demo', titulo: 'Reichenbach trata igual a las dos reglas', plan: 'Una propiedad de simetría, que explica por qué se porta bien: la contrapositiva, «si no es negro, no es cuervo», da la misma implicación, y los empujones se intercambian.', tex: R`$I(a, c) = I(1 - c,\ 1 - a)$.`, pasos: [
      { texto: R`$I(1 - c,\ 1 - a) = 1 - (1 - c) + (1 - c)(1 - a)$.`, porque: 'Se sustituye en la fórmula.' },
      { texto: R`Desarrollando: $c + 1 - a - c + ac = 1 - a + ac$.`, porque: 'Se multiplica y se cancela $c$.' },
      { texto: 'Es $I(a, c)$.', porque: 'Por eso sus dos derivadas son la misma función, con los papeles cambiados: $a$ en una, y $1 - c$ en la otra. Lógicamente es simétrica; el desequilibrio viene de los datos, no del operador.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Suma sobre los datos, no sobre un caso', texto: 'Un operador parece justo en un punto, y deja de serlo al sumarlo en una población muy desequilibrada. Evalúa siempre con datos como los reales.' }],
  retos: [
    { id: 'equilibra', tipo: 'manipular', enunciado: 'Con Reichenbach, busca la proporción de cuervos que iguala las dos barras totales, con margen de 0,05.', precision: (e) => { const T = totales('reichenbach', e.cuervos); return Math.round(e.tipo) === 0 && Math.abs(T.mp - T.mt) < 0.05 ? 1 : 0; }, prueba: { tipo: 0, cuervos: 0.53 }, pendiente: (e) => { const T = totales('reichenbach', e.cuervos); return `Ahora: sube ${T.mp.toFixed(2).replace('.', ',')}, baja ${T.mt.toFixed(2).replace('.', ',')}.`; }, pistas: ['Hacen falta muchos más cuervos de los que hay en una foto.'], explicacion: 'Más o menos la mitad de los datos tendrían que ser cuervos. En el mundo real, eso casi nunca pasa.' },
    { id: 'mt-calc', tipo: 'calcular', enunciado: R`Con Reichenbach, $a = 0{,}2$ y $c = 0{,}3$. ¿Cuántas veces es mayor el empujón de bajar $a$ que el de subir $c$?`, respuesta: 3.5, tol: 0.01, pistas: [R`Baja: $1 - c$. Sube: $a$.`], explicacion: R`$\frac{0{,}7}{0{,}2} = 3{,}5$.` },
    { id: 'godel-elegir', tipo: 'elegir', enunciado: '¿Por qué le va mal a Gödel en estos experimentos?', opciones: ['Porque es muy lenta', 'Porque su derivada respecto a la condición es 0: nunca usa el modus tollens, y hace muchas inferencias equivocadas de modus ponens', 'Porque no vale 1 en las esquinas', 'Porque no es una implicación'], correcta: 1, explicacion: 'Es lo contrario del desequilibrio de Reichenbach, y le va peor.' },
    { id: 'demuestra-cuervos', tipo: 'demostrar', enunciado: R`Demuestra que, en Reichenbach, las dos fuerzas son iguales exactamente cuando $a + c = 1$.`, pistas: ['Iguala $a$ con $1 - c$.'],
      solucion: [{ texto: R`$a = 1 - c \iff a + c = 1$.`, porque: 'Basta sumar $c$ a los dos lados.' }, { texto: R`Por tanto, por encima de esa diagonal manda el modus ponens; por debajo, el tollens.`, porque: 'Si $a + c < 1$, entonces $a < 1 - c$. Y casi todos los datos están por debajo.' }] },
  ],
  referencias: ['E. van Krieken, E. Acar, F. van Harmelen, «Analyzing differentiable fuzzy logic operators», <em>Artificial Intelligence</em> 302 (2022).', 'C. G. Hempel, «Studies in the logic of confirmation», <em>Mind</em> 54 (1945).'],
};
