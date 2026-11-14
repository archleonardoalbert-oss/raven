import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { triangular } from '../../nucleo/difuso.js';
import { sugeno } from '../../nucleo/sistemas.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DX = [0, 10], DZ = [0, 12];
const COLOR = [AZUL, ROSA, BLANCO];
const A = [triangular(-5, 0, 5), triangular(0, 5, 10), triangular(5, 10, 15)];
const Z = [(x) => 2 + 0.3 * x, (x) => 0.5 + 1.2 * x, (x) => 8 + 0.2 * x];
export const salidaSugeno = (x) => sugeno(A.map((f, i) => ({ fuerza: f(x), z: Z[i](x) })));

export default {
  id: '6-3-sugeno',
  titulo: 'Sugeno: cada regla da una fórmula',
  puente: 'Sugeno cambia la conclusión por una fórmula. Tsukamoto propuso otra forma, con conclusiones que nunca retroceden: es un punto intermedio, y muy fácil de leer.',
  pregunta: '¿Y si cada regla, en lugar de dar una figura, diera directamente una fórmula? Nada de recortar ni de buscar equilibrios: solo una media.',
  escena: {
    id: 'sugeno', formato: 'plano', W: 1100, H: 620,
    ejes: { x: DX, y: [0, 1], caja: { x: 110, y: 84, w: 880, h: 130 } },
    entradas: [{ id: 'x', tipo: 'deslizador', etiqueta: 'la entrada x', min: 0, max: 10, paso: 0.05, valor: 3 }],
    pasos: [
      { dur: 2400, texto: 'Arriba, tres palabras: <b style="color:#58c4dd;font-weight:400">bajo</b>, <b style="color:#fc6282;font-weight:400">medio</b> y <b>alto</b>. Las condiciones son iguales que en Mamdani.' },
      { dur: 2800, texto: 'Abajo está la diferencia. La conclusión de cada regla no es una figura, sino <b>una fórmula</b>, una recta: «si $x$ es bajo, entonces $z = 2 + 0{,}3x$».' },
      { dur: 3000, texto: 'Entra un número. Cada regla se dispara con su fuerza, y da su resultado. Cuanta más fuerza, <b>mayor el punto</b>.' },
      { dur: 2600, texto: 'La orden es <b style="color:#f4d345;font-weight:400">la media de esos resultados, pesada por su fuerza</b>. Una sola operación, y no hace falta concretar nada.' },
      { dur: 3400, texto: 'Recorre todas las entradas: la media va pasando de una recta a otra <b style="color:#f4d345;font-weight:400">sin saltos</b>. Rectas sencillas, mezcladas, forman una curva.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), lin = ev(q(1), 0, 0.6), pr = ev(q(2), 0, 0.4), med = ev(q(3), 0, 0.5);
      const barrido = ev(q(4), 0, 0.8), vuelta = ev(q(4), 0.8, 1), x = paso === 4 ? mix(mix(0, 10, barrido), e.x, vuelta) : e.x;
      const w = A.map((f) => f(x)), z = Z.map((f) => f(x)), s = salidaSugeno(x);
      const N = [marco({ x: DX, y: [0, 1] }, { alfa: al, ticks: { x: [0, 5, 10], y: [0, 1] }, etiquetas: { y: R`\mu` } })];
      A.forEach((f, i) => N.push(curva((u) => [u, f(u)], DX, { hasta: Math.max(ev(q(0), 0, 1), 1e-3), n: 200, color: COLOR[i], ancho: 2.8 })));
      const D = [marco({ x: DX, y: DZ }, { alfa: lin, ticks: { x: [0, 5, 10], y: [0, 6, 12] }, etiquetas: { x: 'x', y: 'z' } })];
      Z.forEach((f, i) => { if (lin > 0) { D.push(curva((u) => [u, f(u)], DX, { hasta: Math.max(lin, 1e-3), n: 2, color: COLOR[i], ancho: 2, alfa: 0.75 })); } });
      if (lin > 0) D.push(rotulo([0.2, 3.2], R`z_1`, { clave: 'z1', tam: 17, color: AZUL, alfa: lin }), rotulo([5.6, 8.4], R`z_2`, { clave: 'z2', tam: 17, color: ROSA, alfa: lin }), rotulo([1, 9.3], R`z_3`, { clave: 'z3', tam: 17, color: BLANCO, alfa: lin }));
      if (pr > 0) {
        N.push(linea([x, 0], [x, 1], { color: GRIS2, ancho: 1.4, alfa: 0.7 * pr, discontinua: true }));
        D.push(linea([x, 0], [x, 12], { color: GRIS2, ancho: 1.4, alfa: 0.7 * pr, discontinua: true }));
        w.forEach((v, i) => {
          if (v > 0.001) { N.push(punto([x, v], { color: COLOR[i], radio: 6, alfa: pr })); D.push(punto([x, z[i]], { color: COLOR[i], radio: 3 + 11 * v, alfa: pr * Math.max(0.4, v) })); }
        });
      }
      if (lin > 0 && med > 0) {
        const hasta = paso === 4 ? barrido : 0;
        if (hasta > 0.002) D.push(curva((u) => [u, salidaSugeno(u)], DX, { hasta, n: 240, color: ORO, ancho: 3.4, brillo: true }));
        else if (paso === 4 || q(4) >= 1) D.push(curva((u) => [u, salidaSugeno(u)], DX, { n: 240, color: ORO, ancho: 3.4, brillo: true }));
        D.push(punto([x, s], { color: ORO, radio: 8, alfa: med }));
        const pesos = w.map((v, i) => [v, z[i], i]).filter(([v]) => v > 0.001);
        const arriba = pesos.map(([v, zi]) => `${coma(v)} \\cdot ${coma(zi)}`).join(' + '), abajo = pesos.map(([v]) => coma(v)).join(' + ');
        N.push(rotulo([9.8, 1.3], R`z = \dfrac{${arriba}}{${abajo}} = {\color{#f4d345}${coma(s)}}`, { clave: 'cuenta', ancla: 'r', tam: 19, alfa: med }));
      }
      return { principal: N, paneles: [{ ejes: { x: DX, y: DZ, caja: { x: 110, y: 262, w: 880, h: 310 } }, prims: D }] };
    },
  },
  manipulacion: '<ul><li>Mueve la entrada: mira cómo cambia el tamaño de los puntos, que es la fuerza de cada regla.</li><li>Fíjate en que el punto dorado siempre queda entre los otros.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'En 1985, Takagi y Sugeno propusieron cambiar la conclusión: en vez de «entonces $z$ es rápido», una fórmula, «entonces $z = 2 + 0{,}3x$». Cada regla es un experto local, que sabe describir bien lo que ocurre en su zona. El sistema pasa de uno a otro con suavidad.' },
    { tipo: 'ejemplo', texto: 'Con la entrada $x = 3$:', tabla: [['Regla', 'Fuerza', 'Fórmula', 'Resultado'], ['Si x es bajo', '0,4', '2 + 0,3x', '2,9'], ['Si x es medio', '0,6', '0,5 + 1,2x', '4,1'], ['Si x es alto', '0', '8 + 0,2x', '(no cuenta)']], cierre: 'Media pesada: $\\frac{0{,}4 \\cdot 2{,}9 + 0{,}6 \\cdot 4{,}1}{0{,}4 + 0{,}6} = 3{,}62$. Nada de figuras.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`w_i`, dice: 'La fuerza de la regla $i$, como en Mamdani.' },
      { tex: R`z_i = a_i x + b_i`, dice: 'Su fórmula: una recta. Se llama de primer orden. Si es solo un número, $z_i = b_i$, de orden cero.' },
      { tex: R`\sum_i w_i z_i`, dice: 'Cada resultado por su peso.' },
      { tex: R`\sum_i w_i`, dice: 'Se divide por el peso total, para que sea una media.' },
    ], todo: R`z = \frac{\sum_i w_i z_i}{\sum_i w_i}`, lee: '«La salida es la media de los resultados, pesada por la fuerza de cada regla».' },
    { tipo: 'formal', titulo: 'Sistema de Takagi-Sugeno', tex: R`Con $n$ reglas «si $x$ es $A_i$, entonces $z_i = f_i(x)$», y con $w_i = \mu_{A_i}(x)$, la salida es $z = \frac{\sum_i w_i f_i(x)}{\sum_i w_i}$, si $\sum_i w_i > 0$.`, lee: 'Si los $f_i$ son rectas, el sistema entero se divide en zonas donde se comporta casi como una recta. Es lo que permite analizar su estabilidad con matemáticas clásicas.' },
    { tipo: 'demo', titulo: 'La salida siempre queda entre los extremos', plan: 'Una media no se sale de sus valores. Es una propiedad de seguridad importante: el sistema nunca pide algo que ninguna regla le pidió.', tex: R`Si $w_i \ge 0$ y $\sum_i w_i > 0$, entonces $\min_i z_i \le z \le \max_i z_i$.`, pasos: [
      { texto: R`Sea $m = \max_i z_i$. Cada $z_i \le m$, y como $w_i \ge 0$: $w_i z_i \le w_i m$.`, porque: 'Multiplicar por algo no negativo conserva el orden.' },
      { texto: R`Sumando: $\sum_i w_i z_i \le m \sum_i w_i$.`, porque: 'Se suman desigualdades del mismo sentido, y $m$ es factor común.' },
      { texto: R`Dividiendo entre $\sum_i w_i > 0$: $z \le m$. Con $\min$ se razona igual.`, porque: 'Dividir por algo positivo conserva el orden.' },
    ] },
    { tipo: 'nota', titulo: 'Mamdani o Sugeno', texto: 'Mamdani se lee mejor, porque cada conclusión es una palabra. Sugeno se calcula rápido y se ajusta bien con datos: por eso lo usa ANFIS, en la próxima región. Es la opción más habitual en aparatos con poca potencia.' },
  ],
  tecnicas: [
    { titulo: 'Acota una media por sus extremos', texto: 'Si reconoces una media pesada, ya sabes que queda entre el menor y el mayor valor. Sirve en muchísimos sitios.' },
  ],
  retos: [
    { id: 'lleva-a-z', tipo: 'manipular', enunciado: R`Mueve la entrada para que la salida valga $6$, con un margen de $0{,}15$.`, precision: (e) => (Math.abs(salidaSugeno(e.x) - 6) <= 0.15 ? 1 : 0), prueba: { x: 4.75 }, pendiente: (e) => `Ahora vale ${salidaSugeno(e.x).toFixed(2).replace('.', ',')}.`, pistas: ['La curva dorada sube en casi todo su recorrido.'], explicacion: 'Justo en el centro, solo está encendida la regla «medio»: $0{,}5 + 1{,}2 \\cdot 5 = 6{,}5$. Un poco antes se cruza con el 6.' },
    { id: 'sugeno-calc', tipo: 'calcular', enunciado: R`Dos reglas: fuerza $0{,}25$ con resultado $8$, y fuerza $0{,}75$ con resultado $4$. ¿Cuánto da el sistema?`, respuesta: 5, tol: 0.001, pistas: [R`Numerador: $2 + 3$. Denominador: $1$.`], explicacion: R`$\frac{5}{1} = 5$.` },
    { id: 'sugeno-elegir', tipo: 'elegir', enunciado: '¿Qué paso de Mamdani se ahorra Sugeno?', opciones: ['Convertir a grados', 'Combinar la condición', 'Construir una figura y concretarla', 'Ninguno'], correcta: 2, explicacion: 'Cada regla ya da un número: basta con hacer la media.' },
    { id: 'demuestra-entre', tipo: 'demostrar', enunciado: R`Demuestra que, si todas las reglas dan el mismo resultado $k$, el sistema da $k$.`, pistas: ['Saca $k$ como factor común.'],
      solucion: [
        { texto: R`$\dfrac{\sum_i w_i k}{\sum_i w_i} = \dfrac{k \sum_i w_i}{\sum_i w_i}$.`, porque: 'Factor común.' },
        { texto: R`Se cancela: da $k$.`, porque: 'Si todos los expertos coinciden, la media no puede decir otra cosa.' },
      ] },
  ],
  referencias: ['T. Takagi, M. Sugeno, «Fuzzy identification of systems and its applications to modeling and control», <em>IEEE Trans. SMC</em> 15 (1985).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 11.4.3.'],
};
