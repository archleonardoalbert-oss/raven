import { ev, mix } from '../../motor/tiempo.js';
import { RENDER3D, mA, mB, paisaje } from '../parte3/paisaje.js';

const R = String.raw;

export default {
  id: '4-2-producto',
  titulo: 'Producto cartesiano',
  puente: 'De dos conjuntos has fabricado una relación. Ahora, el viaje inverso: de una relación, recuperar lo que dice sobre cada dimensión.',
  pregunta: 'Si sabes que «estudiar mucho» es una curva sobre las horas, y «buena nota» otra curva sobre las notas, ¿cómo fabricas el conjunto de parejas (horas, nota) que cumplen las dos?',
  escena: {
    id: 'producto', formato: '3d', W: 1100, H: 690, render3d: RENDER3D,
    entradas: [{ id: 'p', tipo: 'arrastre', panel: 0, valor: [0.62, 0.4], region: { x: [0, 1], y: [0, 1] } }],
    pasos: [
      { dur: 3000, texto: 'Dos conjuntos, cada uno con su eje: <b style="color:#58c4dd;font-weight:400">«estudiar mucho»</b>, sobre las horas, y <b style="color:#fc6282;font-weight:400">«buena nota»</b>, sobre las notas.' },
      { dur: 5200, texto: 'Para cada pareja (horas, nota), su grado es el menor de los dos: tiene que cumplir las dos cosas. Cada corte añade un trozo al terreno.' },
      { dur: 2000, texto: 'El terreno completo es el producto cartesiano $A \\times B$. Y es exactamente la relación «estudia mucho y saca buena nota».' },
    ],
    primitivas({ q, paso, e }) {
      const barr = ev(q(1), 0, 1), vAuto = paso < 2 ? mix(1, 0, barr) : mix(0, 0.4, ev(q(2), 0, 0.7)), rev = paso < 2 ? vAuto : 0, reposo = paso === 2 && q(2) >= 1;
      return paisaje({ f: Math.min, glsl: 'return min(a,b);', v: reposo ? e.p[1] : vAuto, xp: reposo ? e.p[0] : 0.62, rev, ba: ev(q(0), 0, 0.3), pA: ev(q(0), 0.2, 0.6), pB: ev(q(0), 0.6, 1), fr: ev(q(1), 0, 0.15), so: ev(q(1), 0.1, 0.25), claveMapa: 'prod' });
    },
  },
  manipulacion: '<ul><li>Arrastra en el mapa de arriba a la derecha: mueves una pareja $(x, y)$ y lees su grado.</li><li>Gira la vista 3D para ver el terreno desde otro lado.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Ya conoces el «y». Si un conjunto habla de una cosa, y otro de otra, el «y» entre los dos habla de parejas. Eso es el [[producto cartesiano]] de conjuntos difusos.' },
    { tipo: 'ejemplo', texto: 'Sean «estudia mucho» = 0,5 con 2 horas, y 1 con 4 horas; y «buena nota» = 0,6 con un 7, y 1 con un 9:', tabla: [['', 'nota 7 (0,6)', 'nota 9 (1)'], ['2 horas (0,5)', '0,5', '0,5'], ['4 horas (1)', '0,6', '1']], cierre: 'Cada casilla es el menor entre el grado de su fila y el de su columna. De dos listas, una tabla.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`A \times B`, dice: 'El producto: una relación entre $X$ e $Y$, hecha con $A$ y $B$.' },
      { tex: R`\mu_A(x)`, dice: 'Cuánto cumple $x$ la primera cosa.' },
      { tex: R`\mu_B(y)`, dice: 'Cuánto cumple $y$ la segunda.' },
      { tex: R`\min(\ \cdot\ ,\ \cdot\ )`, dice: 'Tiene que cumplir las dos: el menor. Se puede usar otra [[norma T]].' },
    ], todo: R`\mu_{A \times B}(x, y) = \min(\mu_A(x),\ \mu_B(y))`, lee: '«El grado de la pareja es el menor de los grados de sus partes».' },
    { tipo: 'formal', titulo: 'Producto cartesiano difuso', tex: R`Dados $A$ en $X$ y $B$ en $Y$: $\ \mu_{A \times B}(x, y) = \min(\mu_A(x),\ \mu_B(y))$. Con varios conjuntos, el mínimo de todos.`, lee: 'Zadeh lo definió con el mínimo. Con otra [[norma T]], por ejemplo el producto, sale otro terreno, igual de válido.' },
    { tipo: 'demo', titulo: 'Sus cortes son productos de cortes', plan: 'Una propiedad que lo hace muy manejable: cortar el terreno es lo mismo que cortar cada eje.', tex: R`$(A \times B)_\alpha = A_\alpha \times B_\alpha$.`, pasos: [
      { texto: R`$(x, y) \in (A \times B)_\alpha$ si y solo si $\min(\mu_A(x), \mu_B(y)) \ge \alpha$.`, porque: 'Definición de corte y de producto.' },
      { texto: R`Eso equivale a $\mu_A(x) \ge \alpha$ y $\mu_B(y) \ge \alpha$.`, porque: 'El menor llega al listón si y solo si llegan los dos.' },
      { texto: R`Es decir, $x \in A_\alpha$ e $y \in B_\alpha$: la pareja está en $A_\alpha \times B_\alpha$.`, porque: 'Definición de corte, y de producto cartesiano clásico. Por eso los cortes del terreno, vistos desde arriba, son rectángulos.' },
    ] },
    { tipo: 'nota', titulo: 'Para qué sirve', texto: 'Es la pieza central de las reglas: «si $x$ es $A$, entonces $y$ es $B$» se construye a partir de esta relación. Lo verás en «Razonar».' },
  ],
  tecnicas: [
    { titulo: 'Corta para reducir', texto: 'Una propiedad de un terreno difuso suele reducirse a algo clásico sobre sus cortes. Compruébala en un nivel cualquiera.' },
  ],
  retos: [
    { id: 'busca-punto', tipo: 'manipular', enunciado: R`Busca en el mapa una pareja $(x, y)$ con grado de al menos $0{,}9$.`, precision: (e) => (Math.min(mA(e.p[0]), mB(e.p[1])) >= 0.9 ? 1 : 0), prueba: { p: [0.85, 0.58] }, pendiente: (e) => `Ahí el grado es ${Math.min(mA(e.p[0]), mB(e.p[1])).toFixed(2).replace('.', ',')}.`, pistas: ['Las dos curvas tienen que ser altas a la vez: busca la zona dorada del mapa.'], explicacion: 'Solo donde se cumplen las dos.' },
    { id: 'producto-cuenta', tipo: 'calcular', enunciado: R`Si $\mu_A(x) = 0{,}7$ y $\mu_B(y) = 0{,}4$, ¿cuánto vale $\mu_{A \times B}(x, y)$?`, respuesta: 0.4, tol: 0.001, pistas: ['El menor de los dos.'], explicacion: R`$\min(0{,}7;\ 0{,}4) = 0{,}4$.` },
    { id: 'producto-y', tipo: 'elegir', enunciado: 'Vistos desde arriba, ¿qué forma tienen los cortes del terreno de un producto?', opciones: ['Círculos', 'Rectángulos', 'Triángulos', 'Depende del nivel'], correcta: 1, explicacion: R`Son $A_\alpha \times B_\alpha$: un intervalo en $x$ por un intervalo en $y$, si los cortes son intervalos.` },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 6.', 'L. A. Zadeh (1965, 1975).'],
};
