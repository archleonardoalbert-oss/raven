import { AZUL, BLANCO, GRIS2, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { FORMULAS, LOGICAS } from '../../nucleo/logicas.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { matriz } from '../parte4/matriz.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const LISTA = [LOGICAS.lukasiewicz, LOGICAS.godel, LOGICAS.producto], DOM = [0, 1], NOM = ['Łuk.', 'Gödel', 'Prod.'];
/** Estas fórmulas solo tienen una letra: basta recorrer sus valores. */
const peor = (f, L) => { let m = 1; for (let i = 0; i <= 100; i++) m = Math.min(m, f.f(L, i / 100, 0, 0)); return m; };
const TABLA = FORMULAS.map((f) => LISTA.map((L) => { const v = peor(f, L); return v < 0.02 ? 0 : +v.toFixed(2); }));
const valor = (fi, li, a) => FORMULAS[fi].f(LISTA[li], a, 0, 0);

export default {
  id: '8-5-completitud',
  titulo: 'Completitud: probar y ser verdad',
  puente: 'Has llegado al final del mapa. Empezaste con un palo que caía y una frase vaga, y aquí hay un teorema que los une: la vaguedad tiene reglas exactas. Enhorabuena.',
  pregunta: 'Hay dos formas de saber que una fórmula es buena. Una: comprobar que siempre vale 1. Otra: demostrarla desde los axiomas. ¿Son lo mismo?',
  escena: {
    id: 'completitud', formato: 'plano', W: 1100, H: 560,
    ejes: { x: DOM, y: DOM, caja: { x: 90, y: 90, w: 480, h: 360 } },
    entradas: [
      { id: 'formula', tipo: 'deslizador', etiqueta: 'la fórmula (de la primera a la última fila)', min: 0, max: 4, paso: 1, valor: 1 },
      { id: 'logica', tipo: 'deslizador', etiqueta: 'la lógica (0 Łuk., 1 Gödel, 2 producto)', min: 0, max: 2, paso: 1, valor: 0 },
      { id: 'a', tipo: 'deslizador', etiqueta: 'la verdad de φ', min: 0, max: 1, paso: 0.01, valor: 0.5 },
    ],
    pasos: [
      { dur: 2400, texto: 'Prueba una fórmula con todos los valores posibles. <b>$\\varphi \\to \\varphi$</b> se queda <b style="color:#f4d345;font-weight:400">pegada a 1</b>, sea cual sea el valor. Es una tautología.' },
      { dur: 2800, texto: '<b>$\\varphi \\vee \\neg\\varphi$</b>, «o es o no es». En lógica clásica, es sagrada. Aquí <b style="color:#f05a5a;font-weight:400">se hunde</b>. Eso ya es una prueba: no es una tautología, en ninguna de las tres.' },
      { dur: 3000, texto: '<b>$\\neg\\neg\\varphi \\to \\varphi$</b>. En Łukasiewicz es 1. En Gödel, se hunde. Una fórmula puede ser ley en una lógica, y no en otra.' },
      { dur: 3400, texto: 'La tabla entera: el peor valor de cada fórmula, en cada lógica. Y el teorema: <b style="color:#f4d345;font-weight:400">vale siempre 1 si y solo si se puede demostrar</b>. Lo que se ve y lo que se prueba coinciden.' },
    ],
    primitivas({ q, paso, e }) {
      const fi = paso === 0 ? 0 : paso === 1 ? 1 : paso === 2 ? 2 : Math.round(e.formula), li = paso === 2 ? (ev(q(2), 0.45, 0.5) >= 1 ? 1 : 0) : paso === 3 ? Math.round(e.logica) : 0, al = ev(q(paso), 0, 0.3), f = (u) => valor(fi, li, u), a = paso === 3 ? e.a : 0.5, pe = TABLA[fi][li], ok = pe >= 0.999;
      const P = [marco({ x: DOM, y: DOM }, { alfa: 1, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: R`\text{verdad de } \varphi`, y: R`\text{valor}` } }), linea([0, 1], [1, 1], { color: GRIS2, ancho: 1.2, alfa: 0.7, discontinua: true })];
      P.push(curva((u) => [u, f(u)], DOM, { hasta: Math.max(ev(q(paso), 0, 0.9), 1e-3), n: 300, color: ok ? ORO : ROJO, ancho: 3.4, brillo: true }), punto([a, f(a)], { color: BLANCO, radio: 7 }));
      P.push(rotulo([0.5, 1], FORMULAS[fi].tex, { clave: 'f', dy: -52, tam: 28, alfa: al }), rotulo([0.5, 1], R`\text{${LISTA[li].nombre}}`, { clave: 'l', dy: -16, tam: 18, color: li === 0 ? AZUL : li === 1 ? ROSA : BLANCO, alfa: al }));
      P.push(rotulo([0.98, 0.1], R`\text{en } ${coma(a)}: \ ${coma(f(a))}`, { clave: 'val', ancla: 'r', tam: 20, alfa: al }));
      const T = [], t = ev(q(3), 0, 0.5);
      if (t > 0) {
        T.push(...matriz(TABLA, { x: 96, y: 40, lado: 56, cols: NOM, filas: FORMULAS.map((_, i) => `${i + 1}`), alfa: t, id: 'tt', resalta: [[fi, li]] }));
        FORMULAS.forEach((x, i) => T.push(rotulo([300, 68 + i * 56], x.tex, { clave: `x${i}`, ancla: 'l', tam: 17, color: GRIS2, alfa: t })));
      }
      return { principal: P, paneles: [{ ejes: { x: [0, 480], y: [360, 0], caja: { x: 610, y: 90, w: 480, h: 360 } }, prims: T }] };
    },
  },
  manipulacion: '<ul><li>Recorre fórmulas y lógicas. Si la curva toca 1 en toda su longitud, es dorada; si se hunde, es roja.</li><li>La tabla te dice dónde buscar: una casilla por debajo de 1 significa que existe un contraejemplo. Un 0 indica que la fórmula se acerca a 0 tanto como quieras, cerca de $\\varphi = 0$.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una lógica tiene dos caras. La sintaxis: fórmulas, axiomas y pasos, como un juego de símbolos. La semántica: lo que significan, los valores. Un sistema es [[correcto|correcta]] si todo lo que demuestra es verdad; [[completo|completa]] si todo lo que es verdad lo demuestra. Si tiene las dos cosas, los axiomas no se quedan cortos ni se pasan.' },
    { tipo: 'ejemplo', texto: 'Cómo se decide cada caso:', tabla: [['Pregunta', 'Si es que sí', 'Basta con'], ['¿No es tautología?', 'no se puede demostrar', 'un contraejemplo'], ['¿Es tautología?', 'hay una demostración', 'el teorema dice que existe']], cierre: 'Para negar, basta un valor: $\\varphi \\vee \\neg\\varphi$ con $\\varphi = 0{,}5$ en Łukasiewicz da $0{,}5$. Por tanto, en ningún caso podrá salir de los axiomas: ahorramos buscar una demostración que no existe.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\vdash_{\text{BL}} \varphi`, dice: 'De los axiomas de BL sale $\\varphi$: se puede demostrar. El signo se llama «torniquete».' },
      { tex: R`\models_{T} \varphi`, dice: 'Con [[la norma|norma T]] $T$, $\\varphi$ vale siempre 1.' },
      { tex: R`\text{para toda } T \text{ continua}`, dice: 'Con [[todas las normas|norma T]] que son continuas.' },
    ], todo: R`\vdash_{\text{BL}} \varphi \iff \models_{T} \varphi \ \text{ para toda } T \text{ continua}`, lee: '«Se puede demostrar exactamente lo que vale 1 con toda [[norma T]] continua». Es la completitud estándar de BL.' },
    { tipo: 'formal', titulo: 'Completitud estándar de BL', tex: R`Conjeturada por Hájek en 1998, y probada por Cignoli, Esteva, Godo y Torrens (2000). Sigue tres pasos: toda fórmula no demostrable falla en algún álgebra de BL; ese fallo se puede llevar a una [[cadena]], por la prelinealidad; y, si falla en una cadena de BL, falla en alguna [[norma T]] continua sobre $[0, 1]$.`, lee: 'Es el teorema mirado por el otro lado: si no se puede demostrar, se puede enseñar un contraejemplo.' },
    { tipo: 'demo', titulo: 'La mitad fácil: lo demostrado es verdad', plan: 'La corrección. Una demostración es una lista de pasos. Si los axiomas valen 1, y cada paso conserva el 1, todo lo demostrado vale 1. Es una [[inducción]] sobre la longitud de la demostración. La pieza clave: la regla no pierde verdad.', tex: R`Si $v(\varphi) = 1$ y $v(\varphi \to \psi) = 1$, entonces $v(\psi) = 1$.`, pasos: [
      { texto: R`Como $v(\varphi \to \psi) = 1$: $v(\varphi) \le v(\psi)$.`, porque: 'La implicación vale 1 justo cuando hay orden: se demostró en «BL».' },
      { texto: R`Como $v(\varphi) = 1$: $1 \le v(\psi)$.`, porque: 'Se sustituye.' },
      { texto: R`Y como nada pasa de 1: $v(\psi) = 1$.`, porque: 'Los valores están en $[0, 1]$. El [[modus ponens]] conserva la verdad total.' },
    ] },
    { tipo: 'nota', titulo: 'Y más allá', texto: 'Sobre esto se ha construido mucho: lógica de primer orden con grados, complejidad, e infinidad de variantes. Si quieres seguir, el libro de Hájek es el punto de partida, junto con el <em>Handbook of Mathematical Fuzzy Logic</em> (2011–2015).' },
  ],
  tecnicas: [
    { titulo: 'Un contraejemplo ahorra una búsqueda', texto: 'Si una fórmula tiene un valor que no da 1, ya sabes que no se puede demostrar, sin intentarlo.' },
    { titulo: 'Inducción sobre las demostraciones', texto: 'Para probar algo de todo lo demostrable: que los axiomas lo cumplen, y que cada regla lo conserva.' },
  ],
  retos: [
    { id: 'encuentra-contra', tipo: 'manipular', enunciado: R`Encuentra un contraejemplo fuerte: elige fórmula, lógica y valor, para que la fórmula valga menos de $0{,}5$.`, precision: (e) => (valor(Math.round(e.formula), Math.round(e.logica), e.a) < 0.5 ? 1 : 0), prueba: { formula: 1, logica: 1, a: 0.1 }, pendiente: (e) => `Ahora vale ${valor(Math.round(e.formula), Math.round(e.logica), e.a).toFixed(2).replace('.', ',')}.`, pistas: ['Mira la tabla: busca una casilla por debajo de 0,5.'], explicacion: 'Con ese valor, ya sabes que esa fórmula no se puede demostrar en esa lógica.' },
    { id: 'valor-calc', tipo: 'calcular', enunciado: R`En Łukasiewicz, con $\varphi = 0{,}3$, ¿cuánto vale $\varphi \vee \neg\varphi$?`, respuesta: 0.7, tol: 0.001, pistas: [R`Aquí $\vee$ es el máximo, y $\neg 0{,}3 = 0{,}7$.`], explicacion: R`$\max(0{,}3;\ 0{,}7) = 0{,}7$.` },
    { id: 'completitud-elegir', tipo: 'elegir', enunciado: 'Una fórmula vale 1 con toda [[norma T]] continua. ¿Qué dice la completitud?', opciones: ['Que es falsa en alguna [[norma|norma T]]', 'Que hay una demostración de ella desde los axiomas de BL', 'Que hay que añadir un axioma nuevo', 'Que solo vale en lógica clásica'], correcta: 1, explicacion: 'Si es verdad en todas, existe una demostración: a los axiomas no les falta nada.' },
    { id: 'demuestra-correccion', tipo: 'demostrar', enunciado: R`Demuestra que $\varphi \vee \neg\varphi$ no se puede demostrar en BL.`, pistas: ['Usa la corrección: basta un valor que no dé 1.'],
      solucion: [
        { texto: R`En Łukasiewicz, con $v(\varphi) = 0{,}5$: $\neg 0{,}5 = 0{,}5$, y $\max(0{,}5;\ 0{,}5) = 0{,}5 \neq 1$.`, porque: 'Cálculo directo.' },
        { texto: R`Si se pudiera demostrar en BL, valdría 1 con cualquier [[norma|norma T]] continua, también con la de Łukasiewicz.`, porque: 'Por la corrección.' },
        { texto: R`Es una contradicción: no se puede demostrar.`, porque: 'Un solo contraejemplo basta. Se acaba de ver una ley clásica que estas lógicas no aceptan.' },
      ] },
  ],
  referencias: ['R. Cignoli, F. Esteva, L. Godo, A. Torrens, «Basic fuzzy logic is the logic of continuous t-norms and their residua», <em>Soft Computing</em> 4 (2000).', 'P. Hájek, <em>Metamathematics of Fuzzy Logic</em>, 1998.', 'P. Cintula, P. Hájek, C. Noguera (eds.), <em>Handbook of Mathematical Fuzzy Logic</em>, College Publications, 2011–2015.'],
};
