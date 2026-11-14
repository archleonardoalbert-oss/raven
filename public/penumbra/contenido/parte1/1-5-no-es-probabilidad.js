import { AZUL, GRIS2, ORO, ROJO, ROSA } from '../../motor/colores.js';
import { linea, marco, poligono, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');

/** Una botella dibujada con polígonos, llena hasta `v`. */
function botella(cx, v, color, a) {
  const L = 0.13, base = 0.03, alto = 0.56, lleno = base + alto * v;
  const c = [[cx - L, base], [cx - L, base + alto], [cx - 0.05, base + alto + 0.08], [cx - 0.05, base + alto + 0.17], [cx + 0.05, base + alto + 0.17], [cx + 0.05, base + alto + 0.08], [cx + L, base + alto], [cx + L, base]];
  const r = [poligono([[cx - L, base], [cx + L, base], [cx + L, lleno], [cx - L, lleno]], { color, alfa: 0.75 * a })];
  c.forEach((p, i) => r.push(linea(p, c[(i + 1) % c.length], { color: GRIS2, ancho: 2, alfa: a })));
  return r;
}

export default {
  id: '1-5-no-es-probabilidad',
  titulo: 'Pertenencia no es probabilidad',
  puente: 'Ya sabes qué es y qué no es. Ahora, aprende a nombrar sus partes: dónde empieza, dónde está seguro y hasta dónde llega.',
  pregunta: 'Un número entre 0 y 1… eso ya existe: se llama probabilidad. ¿Para qué otro? Tienes sed y dos botellas: ¿de cuál bebes?',
  escena: {
    id: 'botellas', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 2], y: [0, 1], caja: { x: 40, y: 50, w: 640, h: 440 } },
    entradas: [{ id: 'grado', tipo: 'deslizador', etiqueta: 'el número de las etiquetas', min: 0.5, max: 0.99, paso: 0.01, valor: 0.91 }],
    pasos: [
      { dur: 2000, texto: 'La botella A tiene grado $0{,}91$ de pertenencia a «potable». La botella B tiene probabilidad $0{,}91$ de ser potable. El mismo número.' },
      { dur: 2600, texto: 'A es <em>casi agua</em>, en todos los casos: quizá un poco sucia, pero se puede beber. B es agua o no lo es: en nueve de cada diez botellas es agua pura, pero en la otra hay veneno. El número no dice lo mismo.' },
      { dur: 3000, texto: 'Ahora las abrimos. El grado de A no cambia: ya medía cuánto se parece a «potable». La probabilidad de B colapsa a 0 o a 1. Esta vez, a 0: era la que tenía veneno.' },
      { dur: 2600, texto: 'Otra diferencia: las probabilidades de todas las posibilidades suman 1. Los grados no tienen por qué. A la derecha, varias personas en «joven»: suman mucho más que 1, y no hay nada que corregir.' },
    ],
    primitivas({ q, paso, e }) {
      const N = [];
      const ent = ev(q(0), 0, 0.5), abrir = paso >= 2 ? ev(q(2), 0.15, 0.85) : 0, g = e.grado;
      N.push(...botella(0.5, g, AZUL, ent));
      N.push(...botella(1.5, mix(1, 0, abrir), ROSA, ent), ...(abrir > 0.5 ? [rotulo([1.5, 0.3], R`\text{veneno}`, { clave: 'v', tam: 28, color: ROJO, alfa: ev(abrir, 0.5, 1) })] : []));
      N.push(rotulo([0.5, 0.91], R`\mu = ${coma(g)}`, { clave: 'a', tam: 26, color: AZUL, alfa: ent }));
      N.push(rotulo([1.5, 0.91], abrir < 0.5 ? R`P = ${coma(g)}` : R`P = 0`, { clave: 'b', tam: 26, color: ROSA, alfa: ent }));
      N.push(rotulo([0.5, -0.04], R`\text{A: casi agua}`, { clave: 'la', tam: 19, alfa: ev(q(1), 0, 0.4) }), rotulo([1.5, -0.04], R`\text{B: agua o no}`, { clave: 'lb', tam: 19, alfa: ev(q(1), 0, 0.4) }));

      const P = [];
      const s = ev(q(3), 0, 0.6);
      if (s > 0) {
        P.push(marco({ x: [0, 5], y: [0, 1] }, { alfa: s, ticks: { x: [], y: [0, 1] } }));
        const grados = [1, 0.9, 0.8, 0.7, 0.55];
        grados.forEach((v, i) => {
          const c = i + 0.5, h = v * ev(q(3), 0.1 + i * 0.08, 0.5 + i * 0.08);
          P.push(poligono([[c - 0.32, 0], [c + 0.32, 0], [c + 0.32, h], [c - 0.32, h]], { color: ORO, alfa: 0.8 }));
          P.push(rotulo([c, 0], coma(v), { clave: `g${i}`, dy: 15, tam: 15, color: ORO, alfa: s }));
        });
        P.push(rotulo([2.5, 1], R`\text{«joven»: } \textstyle\sum \mu = ${coma(grados.reduce((a, b) => a + b, 0))}`, { clave: 'suma', dy: -20, tam: 20, color: ORO, alfa: ev(q(3), 0.7, 1) }));
      }
      return { principal: N, paneles: [{ ejes: { x: [0, 5], y: [0, 1], caja: { x: 740, y: 130, w: 320, h: 300 } }, prims: P }] };
    },
  },
  manipulacion: '<ul><li>Cambia el número de las etiquetas: por muy alto que sea, A y B siguen significando cosas distintas. En B, un número alto solo reduce la frecuencia del desastre.</li><li>Fíjate: el 0,91 de A sigue ahí, y el de B ya colapsó.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La duda', texto: 'Es la primera objeción que todo el mundo hace, y es buena: si ya existe la probabilidad, ¿para qué otro número de 0 a 1? Porque responden a preguntas distintas.' },
    { tipo: 'ejemplo', texto: 'Mira qué pasa con cada botella al saberlo todo sobre ella:', tabla: [['', 'Antes de abrir', 'Tras analizarla'], ['A, grado en «potable»', '0,91', '0,91'], ['B, probabilidad de ser potable', '0,91', '0 o 1']], cierre: 'En A no había nada oculto: el 0,91 describía cómo es. En B había un hecho oculto, y al conocerlo el número desaparece.' },
    { tipo: 'idea', etiqueta: 'Dos tipos de duda', texto: 'La probabilidad mide lo que <em>no sabes</em> de un hecho que está bien definido: ¿lloverá mañana? El grado mide algo que <em>no tiene frontera</em>, aunque lo sepas todo: ¿es alta esta persona de 1,74?' },
    { tipo: 'ejemplo', texto: 'Zimmermann usa un ejemplo muy claro: ¿qué es un pájaro? Sabemos todo sobre estos animales, y aun así:', tabla: [['Animal', 'gorrión', 'pingüino', 'murciélago'], ['¿Es un pájaro, según el habla común?', '1', 'dudoso', 'dudoso']], cierre: 'Nadie está esperando a descubrir un dato. Lo vago es la palabra.' },
    { tipo: 'simbolos', intro: 'La otra diferencia está en las cuentas.', piezas: [
      { tex: R`P(\omega)`, dice: 'La probabilidad de la posibilidad $\\omega$ («omega»).' },
      { tex: R`\sum_\omega`, dice: 'Sumar para todas las posibilidades.' },
      { tex: R`\sum_\omega P(\omega) = 1`, dice: 'Las probabilidades <b>tienen</b> que sumar 1: algo tiene que pasar.' },
      { tex: R`\sum_x \mu_A(x)`, dice: 'Los grados <b>pueden</b> sumar lo que sea: cada uno se fija sin mirar a los demás.' },
    ], todo: R`\sum_\omega P(\omega) = 1 \qquad \text{pero} \qquad \sum_x \mu_A(x) \text{ es libre}`, lee: 'Si diez personas son todas bastante jóvenes, sus grados suman mucho más que 1, y no hay nada que arreglar.' },
    { tipo: 'formal', titulo: 'Lo que distingue a una probabilidad', tex: R`En un espacio finito $\Omega$, una probabilidad cumple $P(E) \ge 0$, $P(\Omega) = 1$ y $P(E \cup F) = P(E) + P(F)$ si $E$ y $F$ no tienen nada en común. Una función $\mu_A : X \to [0, 1]$ no tiene ninguna de esas ligaduras entre puntos.`, lee: 'Aquí $E$ y $F$ son sucesos, es decir, grupos de posibilidades; $\\cup$ se lee «o».' },
    { tipo: 'nota', titulo: 'Pueden ir juntas', texto: '«Probablemente mañana hará bastante calor»: hay un hecho que no conoces (probabilidad) sobre una palabra vaga (grado). Por eso no compiten: se ocupan de cosas distintas.' },
    { tipo: 'nota', titulo: 'Una discusión viva', texto: 'El ejemplo de las botellas es de Bezdek (1993), y el número varía según la fuente. La frontera entre las dos teorías se ha discutido mucho: Kosko llegó a defender que la probabilidad es un caso de la pertenencia. Lo importante para ti: no combines grados con las reglas de la probabilidad sin justificarlo.' },
  ],
  tecnicas: [
    { titulo: 'La prueba de la observación', texto: 'Para clasificar un número entre 0 y 1, pregúntate: si lo supiera todo sobre este caso, ¿seguiría teniendo sentido? Si sí, es un grado. Si colapsa a 0 o 1, es una probabilidad.' },
    { titulo: 'La prueba de la suma', texto: 'Si los números deben sumar 1 sobre alternativas excluyentes, es un reparto de probabilidades. Si cada uno se puede fijar sin mirar a los demás, no lo es.' },
  ],
  retos: [
    { id: 'grado-o-azar', tipo: 'elegir', enunciado: '¿Cuál de estas frases expresa un <em>grado</em>, y no una probabilidad?',
      opciones: ['Hay un 30 % de que salga cara con esta moneda trucada', 'Esta sopa está bastante caliente', 'Probablemente el paquete llegue el lunes', 'Una de cada diez piezas sale defectuosa'],
      correcta: 1, explicacion: 'Aunque midas la temperatura exacta, «caliente» sigue siendo cuestión de grado. No queda ningún hecho por descubrir.' },
    { id: 'botellas', tipo: 'calcular', enunciado: R`Analizas por completo la composición de la botella A, de grado $0{,}91$ en «potable». ¿Qué grado tiene ahora en «potable»?`,
      respuesta: 0.91, tol: 0.001, pistas: ['¿Observar cambia el contenido, o cambia lo que sabes?'], explicacion: 'Sigue siendo 0,91: lo que había que saber ya lo decía el grado. La probabilidad sí habría colapsado.' },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., Kluwer, 2001, caps. 1–2.', 'J. C. Bezdek, «Fuzzy models — what are they and why?», <em>IEEE Transactions on Fuzzy Systems</em> 1 (1993), 1–6.', 'B. Kosko, «Fuzziness vs. probability», <em>International Journal of General Systems</em> 17 (1990), 211–240.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, Prentice Hall, 1995.'],
};
