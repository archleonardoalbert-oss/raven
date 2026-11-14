import { ev, mix } from '../../motor/tiempo.js';
import { RENDER3D, paisaje } from './paisaje.js';

const R = String.raw;
const T = [Math.min, (a, b) => a * b, (a, b) => Math.max(0, a + b - 1)];
const S = T.map((t) => (a, b) => 1 - t(1 - a, 1 - b));
const GLSL = 'float ta=uN<.5?min(a,b):uN<1.5?a*b:max(0.,a+b-1.);float na=1.-a;float nb=1.-b;float sa=1.-(uN<.5?min(na,nb):uN<1.5?na*nb:max(0.,na+nb-1.));return mix(ta,sa,uM);';

export default {
  id: '3-5-normas-s',
  titulo: 'Muchos «o»: normas S y dualidad',
  puente: 'Ya tienes «y» y «o» a elegir. ¿Y el «no»? Tampoco es único: «no muy alto» se puede entender de varias formas.',
  pregunta: '«No (caro y feo)» es lo mismo que «no caro o no feo». Si eso sigue valiendo, cada «y» trae su propio «o» de regalo. ¿Cuál?',
  escena: {
    id: 'normas-s', formato: '3d', W: 1100, H: 690, render3d: RENDER3D,
    entradas: [
      { id: 'norma', tipo: 'deslizador', etiqueta: 'la pareja (0 mín/máx, 1 producto, 2 Łukasiewicz)', min: 0, max: 2, paso: 1, valor: 1 },
      { id: 'lado', tipo: 'deslizador', etiqueta: 'del «y» (0) al «o» (1)', min: 0, max: 1, paso: 0.01, valor: 1 },
      { id: 'p', tipo: 'arrastre', panel: 0, valor: [0.62, 0.4], region: { x: [0, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2200, texto: 'Este es el terreno de un «y», el mínimo. Solo es alto donde los dos grados lo son: donde se cruzan las dos paredes altas.' },
      { dur: 3400, texto: 'Ahora, el «o». Para obtenerlo, dale la vuelta a todo: los grados con «no», luego el «y», y otra vez «no». El terreno se transforma: sube donde <em>alguno</em> de los dos es alto.' },
      { dur: 2600, texto: 'Mira el corte: con el mínimo, la línea rosa cortaba por arriba. Ahora levanta por abajo: lo dorado no baja nunca de la rosa, ni de la azul.' },
      { dur: 2600, texto: 'Cada «y» tiene su pareja. El producto da la <b style="color:#f4d345;font-weight:400">suma algebraica</b>. Łukasiewicz da la <b style="color:#f4d345;font-weight:400">suma acotada</b>.' },
    ],
    primitivas({ q, paso, e }) {
      const reposo = paso === 3 && q(3) >= 1, n = paso === 3 ? (reposo ? Math.round(e.norma) : 1) : 0;
      const m = reposo ? e.lado : paso === 0 ? 0 : paso === 1 ? ev(q(1), 0.1, 0.9) : 1;
      const f = (a, b) => mix(T[n](a, b), S[n](a, b), m), de = ev(q(0), 0.1, 1);
      const v = paso === 3 && reposo ? e.p[1] : 0.4, xp = paso === 3 && reposo ? e.p[0] : 0.62;
      return paisaje({ f, glsl: GLSL, uniformes: { uN: n, uM: m }, v, xp, rev: 1 - de, ba: ev(q(0), 0, 0.3), pA: ev(q(0), 0, 0.5), pB: ev(q(0), 0, 0.5), fr: ev(q(0), 0.5, 1), so: ev(q(0), 0.6, 1), claveMapa: `s${n}${m.toFixed(3)}`, nombreCorte: m > 0.5 ? R`S(a, b)` : R`T(a, b)` });
    },
  },
  manipulacion: '<ul><li>Mueve «del y al o»: el terreno pasa de uno a otro, y se ve que son la misma forma, volteada.</li><li>Elige la pareja, y arrastra en el mapa para mover el corte.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un «y» pide que se cumplan los dos. Un «o» se conforma con uno. Si el «no» da la vuelta a todo, un «o» es solo un «y» visto del revés: «A o B» es lo mismo que «no (no A y no B)». Cada «y» trae así su «o».' },
    { tipo: 'ejemplo', texto: 'Tres parejas, con $a = 0{,}3$ y $b = 0{,}6$:', tabla: [['Pareja', '«y»', '«o»'], ['Mínimo y máximo', '0,3', '0,6'], ['Producto y suma algebraica', '0,18', '0,72'], ['Łukasiewicz y suma acotada', '0', '0,9']], cierre: 'Cuanto más severo es el «y», más generoso es su «o». Fíjate: el «o» nunca baja del mayor de los dos.' },
    { tipo: 'simbolos', intro: 'La receta para sacar el «o», pieza a pieza.', piezas: [
      { tex: R`1 - a,\ 1 - b`, dice: 'Primero, «no a» y «no b».' },
      { tex: R`T(1 - a,\ 1 - b)`, dice: 'Después, «no a y no b». Esto sería «ninguno de los dos».' },
      { tex: R`1 - T(1 - a,\ 1 - b)`, dice: 'Y, por último, otro «no»: «no es verdad que ninguno de los dos». Es decir, alguno.' },
    ], todo: R`S(a, b) = 1 - T(1 - a,\ 1 - b)`, lee: 'A esta $S$ se la llama [[dual]] de $T$. Con el producto: $1 - (1 - a)(1 - b) = a + b - ab$.' },
    { tipo: 'formal', titulo: 'Norma S', tex: R`Una [[norma S]] es una función $S : [0,1] \times [0,1] \to [0,1]$ [[conmutativa]], [[asociativa]] y [[monótona]], con $S(a, 0) = a$. Las más usadas: máximo, suma algebraica $a + b - ab$ y suma acotada $\min(1, a + b)$.`, lee: 'La única diferencia con una [[norma T]] es el neutro: en el «o», el que no molesta es el 0, no el 1. «A o falso» es A.' },
    { tipo: 'demo', titulo: 'El dual de una norma T es una norma S', plan: 'Cuatro condiciones que comprobar. Las dos primeras salen casi solas. Fíjate en la monotonía: el orden se invierte dos veces, y vuelve a su sitio.', tex: R`Si $T$ es una [[norma T]], entonces $S(a, b) = 1 - T(1 - a,\ 1 - b)$ es una [[norma S]].`, pasos: [
      { texto: R`Neutro: $S(a, 0) = 1 - T(1 - a,\ 1) = 1 - (1 - a) = a$.`, porque: 'El 0 pasa a ser 1 y, en $T$, el 1 no molesta.' },
      { texto: R`El orden no importa: $S(a, b) = 1 - T(1 - a, 1 - b) = 1 - T(1 - b, 1 - a) = S(b, a)$.`, porque: 'Porque en $T$ no importa.' },
      { texto: R`Monotonía: si $b \le c$, entonces $1 - c \le 1 - b$, luego $T(1 - a, 1 - c) \le T(1 - a, 1 - b)$, y por tanto $S(a, b) \le S(a, c)$.`, porque: 'Restar de 1 invierte el orden; $T$ lo conserva; restar de 1 lo invierte otra vez.' },
      { texto: R`Asociatividad: como $1 - S(a, b) = T(1 - a, 1 - b)$, resulta $S(a, S(b, c)) = 1 - T(1 - a,\ T(1 - b, 1 - c))$. Igual por el otro lado, y son iguales porque $T$ es [[asociativa]].`, porque: 'El «no» de $S$ se cancela con el 1 de delante, y queda todo dentro de $T$.' },
    ] },
    { tipo: 'nota', titulo: 'Fíjate', texto: 'Por esto la ley de De Morgan vale para estas parejas: se ha construido cada «o» para que valga. Y como toda [[norma T]] no supera al mínimo, toda [[norma S]] no baja del máximo.' },
  ],
  tecnicas: [
    { titulo: 'Dualidad: la mitad de trabajo', texto: 'Si demuestras algo del «y», aplicando el «no» obtienes gratis el resultado del «o». Busca siempre la simetría.' },
    { titulo: 'Dos inversiones se anulan', texto: 'Cuando un argumento pasa dos veces por algo que invierte el orden, el orden vuelve a ser el original.' },
  ],
  retos: [
    { id: 'calcula-dual', tipo: 'calcular', enunciado: R`Con $a = 0{,}5$ y $b = 0{,}4$, ¿cuánto vale la suma algebraica $a + b - ab$?`, respuesta: 0.7, tol: 0.001, pistas: [R`$ab = 0{,}2$.`], explicacion: R`$0{,}9 - 0{,}2 = 0{,}7$. Y también: $1 - 0{,}5 \cdot 0{,}6 = 0{,}7$.` },
    { id: 'dual-elegir', tipo: 'elegir', enunciado: '¿Cuál es el valor neutro en un «o», el que nunca cambia el resultado?', opciones: ['1', '0', '0,5', 'No tiene'], correcta: 1, explicacion: '«A o algo totalmente falso» sigue siendo A. En el «y», ese papel lo hace el 1.' },
    { id: 'demuestra-dual', tipo: 'demostrar', enunciado: R`Demuestra que toda [[norma S]] cumple $S(a, b) \ge \max(a, b)$.`, pistas: ['Imita la demostración del techo de las normas T, usando el neutro 0.', 'Como $b \\ge 0$, ¿qué te dice la monotonía?'],
      solucion: [
        { texto: R`Como $b \ge 0$, por monotonía $S(a, b) \ge S(a, 0) = a$.`, porque: 'Monotonía, y el neutro del «o».' },
        { texto: R`Igual, $S(a, b) = S(b, a) \ge S(b, 0) = b$.`, porque: 'En el «o», el orden no importa.' },
        { texto: R`$S(a, b)$ no baja de ninguno de los dos, luego no baja del mayor.`, porque: 'Si está por encima de ambos, está por encima de su máximo.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 3.2.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 3.'],
};
