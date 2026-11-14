import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { EJEMPLO, conjuntoEjemplo, fuerzasEjemplo, mamdaniEjemplo } from '../../nucleo/fuzzython.js';
import { marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { tramo } from '../parte9/comun.js';
import { PREP_MAMDANI, codigo, coma, relleno, trazar } from '../parte14/comun.js';

const R = String.raw;
const DT = [0, 40], DM = [0, 40], T = EJEMPLO.temp, M = EJEMPLO.min, O = ['short', 'usual', 'large'], COL = [AZUL, ORO, ROSA];
const act = (e) => (Math.round(e.ac) ? 'PROD' : 'MIN');
const ante = [(t) => [[T.cold, AZUL], [T.normal, ORO]], () => [[T.normal, ORO]], () => [[T.hot, ROSA]]];
const caja = (f, c) => ({ x: 70 + c * 300, y: 42 + f * 150, w: 240, h: 112 });
export default {
  id: '16-1-mamdani',
  titulo: 'Mamdani, regla a regla',
  puente: 'Mamdani te da una forma, y luego hay que resumirla. ¿Y si la salida de cada regla ya fuese un número? Eso es Sugeno.',
  pregunta: 'En la región 6 montaste Mamdani a mano. Ahora vas a ver lo que hace <code>compute</code> por dentro, regla a regla, en una sola pantalla. ¿Qué hace cada una, y cómo se juntan?',
  escena: {
    id: 'mamdani', formato: 'plano', W: 1100, H: 530,
    ejes: { x: DT, y: [0, 1], caja: caja(0, 0) },
    entradas: [{ id: 't', tipo: 'deslizador', etiqueta: 'temperatura', min: 0, max: 40, paso: 0.5, valor: 33 }, { id: 'ac', tipo: 'deslizador', etiqueta: 'activación: recortar (MIN) o escalar (PROD)', min: 0, max: 1, paso: 1, valor: 0 }],
    pasos: [
      { dur: 2800, texto: 'Cada fila es una regla. A la izquierda, su <em>si</em>: la temperatura entra y da un grado. Sale un número: <b style="color:#f4d345;font-weight:400">la fuerza</b>.' },
      { dur: 2800, texto: 'En el centro, su <em>entonces</em>: el conjunto de salida, recortado a esa fuerza. La primera regla lleva <code>with 0.5</code>: por eso nunca pasa de la mitad.' },
      { dur: 3000, texto: 'A la derecha, se unen los tres recortes. Ya no son palabras: es una sola forma, con la opinión de todas las reglas.' },
      { dur: 2800, texto: 'Su centro de gravedad es la respuesta. Mueve la temperatura, y mira cómo cada regla toma el relevo de la anterior.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, t = e.t, f = fuerzasEjemplo(t), A = paso >= 3 ? act(e) : 'MIN';
      const col0 = (i) => { const P = [marco({ x: DT, y: [0, 1] }, { alfa: al, ticks: { x: i === 2 ? [0, 20, 40] : [], y: [0, 1] } })]; for (const [S, c] of ante[i](t)) P.push(trazar(S, DT, { color: c, ancho: 2, alfa: al })); P.push(...tramo([t, 0], [t, 1], { color: GRIS2, ancho: 1, alfa: al, discontinua: true })); P.push(rotulo([40, 1], R`\text{regla ${i + 1}}:\ ${coma(f[O[i]])}`, { clave: 'f' + i, ancla: 'r', dy: -12, tam: 18, color: COL[i], alfa: al })); return P; };
      const col1 = (i) => { const S = M[O[i]], v = f[O[i]], C = A === 'PROD' ? S.escalar(v) : S.minimizar(v), P = [marco({ x: DM, y: [0, 1] }, { alfa: g1, ticks: { x: i === 2 ? [0, 20, 40] : [], y: [0, 1] } }), trazar(S, DM, { color: COL[i], ancho: 1.2, alfa: 0.4 * g1 })]; if (v > 0) P.push(relleno(C, DM, { color: COL[i], alfa: 0.55 * g1 }), trazar(C, DM, { color: COL[i], ancho: 2, alfa: g1 })); return P; };
      const cj = conjuntoEjemplo(t, { activacion: A }), res = cj ? cj.COG() : 0, F = { x: 670, y: 110, w: 380, h: 280 }, U = [marco({ x: DM, y: [0, 1] }, { alfa: g2, ticks: { x: [0, 20, 40], y: [0, 1] }, etiquetas: { x: R`\text{minutos}` } })];
      if (cj) U.push(relleno(cj, DM, { color: ORO, alfa: 0.45 * g2 }), trazar(cj, DM, { color: ORO, alfa: g2 }));
      if (g3 > 0 && cj) U.push(...tramo([res, 0], [res, 1], { color: [255, 255, 255], ancho: 2.4, alfa: g3 }), punto([res, 0], { color: [255, 255, 255], radio: 6, alfa: g3 }));
      U.push(rotulo([40, 1], R`${coma(res, 2)}\ \text{minutos}`, { clave: 'r', ancla: 'r', dy: -14, tam: 24, color: ORO, alfa: g3 }));
      return { principal: col0(0), paneles: [{ ejes: { x: DT, y: [0, 1], caja: caja(1, 0) }, prims: col0(1) }, { ejes: { x: DT, y: [0, 1], caja: caja(2, 0) }, prims: col0(2) }, { ejes: { x: DM, y: [0, 1], caja: { ...caja(0, 1), x: 360 } }, prims: col1(0) }, { ejes: { x: DM, y: [0, 1], caja: { ...caja(1, 1), x: 360 } }, prims: col1(1) }, { ejes: { x: DM, y: [0, 1], caja: { ...caja(2, 1), x: 360 } }, prims: col1(2) }, { ejes: { x: DM, y: [0, 1], caja: F }, prims: U }] };
    },
  },
  manipulacion: '<ul><li>Lleva la temperatura de 0 a 40, y mira el relevo entre filas.</li><li>Cambia a <code>PROD</code>: recortes y escalados dan otra forma, y otro número.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Cada regla responde con una forma entera, no con un número. Por eso Mamdani resulta tan natural para un experto: sus reglas se leen como lo que diría una persona. El precio es tener que integrar al final, y que el resultado no llegue nunca a los extremos.' },
    codigo('En Python', 'Se puede mirar el interior: tras calcular, las fuerzas siguen en cada adjetivo.', "from systems.mamdani import MamdaniSystem\n\nm = MamdaniSystem('m', b)\nprint(m.compute({'temp': 33}))\nprint(short.strength, usual.strength, large.strength)", 'Con esas tres fuerzas puedes rehacer la cuenta a mano. Hazlo la primera vez: es la mejor comprobación.', { prefacio: PREP_MAMDANI }),
    { tipo: 'ejemplo', texto: 'La cuenta de la escena, a 33 grados:', tabla: [['Regla', 'Grado', 'Peso', 'Fuerza'], ['cold o normal → short', '$\\max(0;\\ 0{,}4)$', '0,5', '0,2'], ['normal → usual', '0,4', '1', '0,4'], ['hot → large', '0,6', '1', '0,6']], cierre: 'Área $16{,}2$, primer momento $391{,}13$, y su cociente: $24{,}144$ minutos.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`w_r`, dice: 'La fuerza de la regla $r$.' },
      { tex: R`\mu_{B_r}`, dice: 'Su conjunto de salida.' },
      { tex: R`\mu(x)`, dice: 'Lo que resulta tras unirlos.' },
    ], todo: R`\mu(x) = \max_r \min(w_r, \mu_{B_r}(x))`, lee: '«Para cada $x$, el más alto de los recortes». Con palabras distintas: dentro de una palabra se queda con la mayor fuerza.' },
    { tipo: 'formal', titulo: 'La salida', tex: R`$y = \frac{\int x\, \mu(x)\, dx}{\int \mu(x)\, dx}$. Si nada se activa, $\int \mu = 0$, y fuzzython responde con el <code>default</code> de la variable, además de imprimir un error.`, lee: 'Que imprima un error en un caso normal despista: quizá solo sea que ninguna regla se activó.' },
    { tipo: 'demo', titulo: 'Mamdani no llega a los extremos', plan: 'El centro de gravedad de un conjunto queda dentro de lo que ocupa, y aquí no puede pegarse al borde.', tex: R`Con estas reglas, la salida siempre queda entre $6{,}89$ y $33{,}67$ minutos.`, pasos: [
      { texto: R`Solo se activa la regla 1 si $t < 15$. Ahí «cold» vale 1, luego su fuerza es $0{,}5$, siempre la misma. El centro de gravedad de ese recorte es $6{,}89$.`, porque: 'Es la meseta baja: la regla se dispara siempre con igual fuerza.' },
      { texto: R`Solo se activa la regla 3 si $t \ge 35$. Ahí su fuerza es 1, y el centro de «large» es $33{,}67$.`, porque: 'Es la meseta alta. En medio se mezclan varias reglas, y el centro queda entre las dos.' },
      { texto: R`Por tanto, aunque $\text{minutes}$ abarque de $0$ a $40$, ningún resultado sale de esa franja.`, porque: 'Es una propiedad del método. Si necesitas llegar al extremo, ensancha el conjunto más allá del rango real.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Mira las fuerzas antes que el resultado', texto: 'Cuando un sistema difuso da un número raro, imprime las fuerzas de cada adjetivo. Casi siempre, el fallo se ve ahí: una regla que no se activa o se activa de más.' }],
  retos: [
    { id: 'relevo', tipo: 'manipular', enunciado: 'Busca una temperatura donde solo se active la regla 3.', precision: (e) => { const f = fuerzasEjemplo(e.t); return f.short === 0 && f.usual === 0 && f.large > 0 ? 1 : 0; }, prueba: { t: 37 }, pendiente: (e) => { const f = fuerzasEjemplo(e.t); return `Fuerzas: ${f.short.toFixed(2).replace('.', ',')}, ${f.usual.toFixed(2).replace('.', ',')} y ${f.large.toFixed(2).replace('.', ',')}.`; }, pistas: ['Por encima de donde «normal» se apaga.'], explicacion: 'A partir de 35 grados. Por eso la respuesta se queda quieta.' },
    { id: 'fuerza-r1', tipo: 'calcular', enunciado: R`A 18 grados, ¿qué fuerza tiene la regla 1?`, respuesta: 0.3, tol: 0.001, pistas: [R`$\max(0{,}4;\ 0{,}6) \cdot 0{,}5$.`], explicacion: R`$0{,}6 \cdot 0{,}5 = 0{,}3$.` },
    { id: 'nada-elegir', tipo: 'elegir', enunciado: 'Si ninguna regla se activa en Mamdani, ¿qué devuelve?', opciones: ['0', 'NaN', 'El default de la variable, e imprime un error', 'Lanza una excepción'], correcta: 2, explicacion: 'En Sugeno y Tsukamoto devuelve 0, sin avisar.' },
    { id: 'demuestra-centro', tipo: 'demostrar', enunciado: R`Demuestra que el centro de gravedad de un conjunto simétrico respecto a $c$ es $c$.`, pistas: ['Cambia de variable: $x = c + u$.'], solucion: [{ texto: R`$\int x\, \mu = c \int \mu + \int u\, \mu(c + u)\, du$.`, porque: 'Se reparte $x = c + u$.' }, { texto: R`La última integral es de una función impar, luego vale 0.`, porque: '$\\mu(c + u)$ es par, y $u$ es impar. Queda $c \\int \\mu$, y al dividir sale $c$.' }] },
  ],
  referencias: ['E. H. Mamdani, S. Assilian, <em>Int. J. Man-Machine Studies</em> 7 (1975).', '<em>fuzzython</em>: systems/mamdani.py.'],
};
