import { ev, mix } from '../../motor/tiempo.js';
import { RENDER3D, paisaje } from './paisaje.js';

const R = String.raw;
const T = [Math.min, (a, b) => a * b, (a, b) => Math.max(0, a + b - 1)];
const GLSL = 'float tp=uP<.5?min(a,b):uP<1.5?a*b:max(0.,a+b-1.);float tc=uC<.5?min(a,b):uC<1.5?a*b:max(0.,a+b-1.);return mix(tp,tc,uM);';
const NOMBRES = ['mínimo', 'producto', 'Łukasiewicz'];

export default {
  id: '3-4-normas-t',
  titulo: 'Muchos «y»: las normas T',
  puente: 'Si hay muchos «y», debe de haber muchos «o». Y, de hecho, hay una forma exacta de obtener cada «o» a partir de su «y».',
  pregunta: 'El mínimo no es la única forma razonable de decir «y». ¿Cuáles son las otras? ¿Y qué tiene que cumplir una regla para que merezca llamarse «y»?',
  escena: {
    id: 'normas-t', formato: '3d', W: 1100, H: 690, render3d: RENDER3D,
    entradas: [
      { id: 'norma', tipo: 'deslizador', etiqueta: 'el «y» (0 mínimo, 1 producto, 2 Łukasiewicz)', min: 0, max: 2, paso: 1, valor: 2 },
      { id: 'p', tipo: 'arrastre', panel: 0, valor: [0.62, 0.4], region: { x: [0, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 3000, texto: 'Dos conjuntos: <b style="color:#58c4dd;font-weight:400">A</b> sobre $x$, y <b style="color:#fc6282;font-weight:400">B</b> sobre $y$, cada uno en su pared. Con ellos vamos a construir un terreno: el grado de «A y B» en cada punto del suelo.' },
      { dur: 5000, texto: 'Corte a corte: para cada $y$, B da una altura, la línea rosa. Con el mínimo, esa altura corta la curva azul, y queda lo dorado. El terreno crece detrás del plano.' },
      { dur: 2000, texto: 'Todos los cortes juntos forman el terreno del «y». A la derecha, lo mismo en plano: dónde estás y qué pasa en ese corte.' },
      { dur: 2800, texto: 'Con el <b style="color:#f4d345;font-weight:400">producto</b> no corta: aplasta la curva entera. Mira el corte: lo dorado baja por todas partes.' },
      { dur: 2800, texto: 'Con <b style="color:#f4d345;font-weight:400">Łukasiewicz</b>, la curva se hunde, y lo que queda bajo cero se recorta. Es el «y» más severo de los tres.' },
    ],
    primitivas({ q, paso, e }) {
      const previa = paso <= 2 ? 0 : paso === 3 ? 0 : 1, actual = paso <= 2 ? 0 : paso === 3 ? 1 : 2;
      const reposo = paso === 4 && q(4) >= 1, cur = reposo ? Math.round(e.norma) : actual, prev = reposo ? cur : previa, m = reposo || paso <= 2 ? 1 : ev(q(paso), 0, 0.7);
      const f = (a, b) => mix(T[prev](a, b), T[cur](a, b), m);
      const barr = ev(q(1), 0, 1), vAuto = paso < 2 ? mix(1, 0, barr) : mix(0, 0.4, ev(q(2), 0, 0.7)), rev = paso < 2 ? vAuto : 0;
      const v = paso >= 2 && q(2) >= 1 ? e.p[1] : vAuto, xp = paso >= 2 && q(2) >= 1 ? e.p[0] : 0.62;
      return paisaje({ f, glsl: GLSL, uniformes: { uP: prev, uC: cur, uM: m }, v, xp, rev, ba: ev(q(0), 0, 0.3), pA: ev(q(0), 0.2, 0.6), pB: ev(q(0), 0.6, 1), fr: ev(q(1), 0, 0.15), so: ev(q(1), 0.1, 0.25), claveMapa: `t${prev}${cur}${m.toFixed(3)}` });
    },
  },
  manipulacion: '<ul><li>Cambia el «y» con el deslizador, y mira cómo se deforma todo el terreno.</li><li>Arrastra en el mapa de arriba a la derecha: mueves el punto, y con él el corte.</li><li>Arrastra la vista 3D para girar la cámara.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La pregunta', texto: 'Si grado 0,7 y grado 0,6 se combinan con «y», ¿cuánto da? Con el mínimo, 0,6. Pero podrías pensar que dos dudas pesan más que una, y que el resultado debería ser menor. Eso da otros «y».' },
    { tipo: 'ejemplo', texto: 'Tres formas de decir «a y b»:', tabla: [['a, b', 'Mínimo', 'Producto', 'Łukasiewicz'], ['0,7; 0,6', '0,6', '0,42', '0,3'], ['0,9; 0,9', '0,9', '0,81', '0,8'], ['1; 0,6', '0,6', '0,6', '0,6'], ['0,5; 0,5', '0,5', '0,25', '0']], cierre: 'Las tres coinciden cuando uno de los grados es 1. Y siempre: mínimo ≥ producto ≥ Łukasiewicz.' },
    { tipo: 'idea', etiqueta: 'Qué pedirle a un «y»', texto: 'No vale cualquier regla. Piensa qué esperas de un «y»: que «A y totalmente cierto» sea A. Que el orden no importe. Que dé igual cómo agrupes. Y que, si una entrada sube, el resultado no baje. Esas cuatro exigencias definen las [[normas T|norma T]].' },
    { tipo: 'simbolos', intro: 'Las cuatro, leídas.', piezas: [
      { tex: R`T(a, 1) = a`, dice: '«A y totalmente cierto» es A: el 1 no molesta.' },
      { tex: R`T(a, b) = T(b, a)`, dice: 'El orden no importa: es [[conmutativa]].' },
      { tex: R`T(a, T(b, c)) = T(T(a, b), c)`, dice: 'Da igual cómo agrupes tres: es [[asociativa]].' },
      { tex: R`b \le c \Rightarrow T(a, b) \le T(a, c)`, dice: 'Si sube una entrada, el resultado no baja: es [[monótona]]. La flecha $\\Rightarrow$ se lee «entonces».' },
    ], todo: R`T : [0, 1] \times [0, 1] \to [0, 1]`, lee: '$T$ recibe dos grados y da un grado. El símbolo $\\times$ se lee «y otro de»: dos entradas.' },
    { tipo: 'formal', titulo: 'Norma T', tex: R`Una [[norma T]] es una función $T : [0,1] \times [0,1] \to [0,1]$ con esas cuatro propiedades. Las más usadas: mínimo, producto $ab$, Łukasiewicz $\max(0, a + b - 1)$. Y la más severa, la drástica: $T(a, b) = b$ si $a = 1$, $= a$ si $b = 1$, y $0$ en otro caso.`, lee: 'Solo mirando el borde del terreno ya se ve la primera condición: donde un grado es 1, el terreno copia al otro.' },
    { tipo: 'demo', titulo: 'El mínimo es el mayor «y» posible', plan: 'Las cuatro condiciones bastan para poner un techo: ninguna [[norma T]] supera al mínimo. Y es un argumento de dos líneas, usando solo la monotonía y el 1.', tex: R`Para toda [[norma T]] $T$: $\ T(a, b) \le \min(a, b)$.`, pasos: [
      { texto: R`Como $b \le 1$, por monotonía $T(a, b) \le T(a, 1) = a$.`, porque: 'Primero, la cuarta condición; luego, la primera: el 1 no molesta.' },
      { texto: R`Igual con el otro: como $a \le 1$, $T(a, b) = T(b, a) \le T(b, 1) = b$.`, porque: 'Se usa que el orden no importa para aplicar lo mismo a $b$.' },
      { texto: R`$T(a, b)$ no supera a $a$ ni a $b$, luego no supera al menor de los dos.`, porque: 'Si no supera a ninguno, no supera a su mínimo.' },
    ] },
    { tipo: 'nota', titulo: 'Y por abajo', texto: 'Del mismo modo, ninguna [[norma T]] baja de la drástica. Todos los «y» razonables viven entre esos dos extremos. Y solo el mínimo cumple $T(a, a) = a$ en todos los puntos: elegir otro es renunciar a esa ley.' },
    { tipo: 'nota', titulo: 'Tu péndulo', texto: 'Tu controlador va a tener que combinar «inclinado a la derecha» Y «cayendo». Por eso, el reto de elegir un «y» guardará tu elección en el taller. En la región «Sistemas» verás cómo cambia su comportamiento.' },
  ],
  tecnicas: [
    { titulo: 'Acota por los dos lados', texto: 'Para probar que algo no supera al mínimo de dos cosas, prueba que no supera a ninguna de ellas.' },
    { titulo: 'Define por lo que pides', texto: 'En vez de discutir qué fórmula es «la correcta», di qué propiedades exiges. Luego estudias todo lo que las cumple. Es una de las ideas más potentes de las matemáticas.' },
  ],
  retos: [
    { id: 'elige-y', tipo: 'manipular', enunciado: 'Elige el «y» de tu péndulo. Para un controlador, los habituales son el mínimo o el producto: ponlo en 0 o en 1.', precision: (e) => (Math.round(e.norma) < 2 ? 1 : 0), prueba: { norma: 1 }, guardar: (e) => ({ normaY: NOMBRES[Math.round(e.norma)] }),
      pendiente: () => 'Ese es Łukasiewicz: demasiado severo para un controlador. Prueba con otro.', pistas: ['El deslizador tiene tres posiciones.'], explicacion: 'Guardado en tu taller. Podrás cambiarlo.' },
    { id: 'calcula-normas', tipo: 'calcular', enunciado: R`Con $a = 0{,}8$ y $b = 0{,}7$, ¿cuánto vale el producto menos Łukasiewicz?`, respuesta: 0.06, tol: 0.001, pistas: [R`Producto: $0{,}56$.`, R`Łukasiewicz: $0{,}8 + 0{,}7 - 1$.`], explicacion: R`$0{,}56 - 0{,}5 = 0{,}06$.` },
    { id: 'demuestra-tope-min', tipo: 'demostrar', enunciado: R`Demuestra que el producto cumple la cuarta condición: si $b \le c$, entonces $ab \le ac$, para $a \in [0, 1]$.`, pistas: ['¿Qué pasa con una desigualdad al multiplicarla por un número que no es negativo?'],
      solucion: [
        { texto: R`Partimos de $b \le c$, y sabemos que $a \ge 0$.`, porque: 'Es la hipótesis, y $a$ es un grado.' },
        { texto: R`Multiplicar los dos lados por un número no negativo conserva la desigualdad: $ab \le ac$.`, porque: 'Propiedad de los números reales. Con un negativo se invertiría; aquí no pasa.' },
      ] },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, sec. 3.2.', 'E. P. Klement, R. Mesiar, E. Pap, <em>Triangular Norms</em>, Kluwer, 2000.', 'B. Schweizer, A. Sklar (1961): los axiomas.'],
};
