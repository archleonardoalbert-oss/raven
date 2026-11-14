import { yager } from '../../nucleo/operadores.js';
import { ev, mix } from '../../motor/tiempo.js';
import { RENDER3D, paisaje } from './paisaje.js';

const R = String.raw;
const GLSL = 'float s=pow(pow(1.-a,uP)+pow(1.-b,uP),1./uP);return max(0.,1.-s);';

export default {
  id: '3-8-parametrizados',
  titulo: 'Un botón para ajustar el «y»',
  puente: 'Has terminado «El álgebra». Sabes combinar grados en un punto. Ahora, algo más ambicioso: relacionar dos mundos enteros. «Si estudias mucho, sacas buena nota» conecta horas con notas.',
  pregunta: '¿Cuál de todos los «y» es el correcto? ¿Y si no hubiera que elegir, sino ajustar un botón hasta que el sistema se comporte como quieres?',
  escena: {
    id: 'parametrizados', formato: '3d', W: 1100, H: 690, render3d: RENDER3D,
    entradas: [
      { id: 'pot', tipo: 'deslizador', etiqueta: 'el botón, p', min: 1, max: 12, paso: 0.1, valor: 1 },
      { id: 'q', tipo: 'arrastre', panel: 0, valor: [0.62, 0.4], region: { x: [0, 1], y: [0, 1] } },
    ],
    pasos: [
      { dur: 2400, texto: 'Este es el terreno de Yager con el botón $p$ en 1: es Łukasiewicz, el severo. Fíjate en el corte.' },
      { dur: 3600, texto: 'Sube el botón. El terreno se transforma sin saltos: <em>cada posición</em> del botón es un «y» legítimo, con sus cuatro condiciones.' },
      { dur: 2400, texto: 'Con $p$ grande, ya casi es el mínimo. Así, el severo y el generoso son los dos extremos de una misma familia.' },
    ],
    primitivas({ q, paso, e }) {
      const reposo = paso === 2 && q(2) >= 1, p = paso === 0 ? 1 : paso === 1 ? mix(1, 12, ev(q(1), 0, 1)) : mix(12, e.pot, ev(q(2), 0.6, 1)), f = yager(p);
      const usa = reposo ? e.q : [0.62, 0.4];
      return paisaje({ f, glsl: GLSL, uniformes: { uP: p }, v: usa[1], xp: usa[0], rev: 1 - ev(q(0), 0.1, 1), ba: ev(q(0), 0, 0.3), pA: ev(q(0), 0, 0.5), pB: ev(q(0), 0, 0.5), fr: ev(q(0), 0.5, 1), so: ev(q(0), 0.6, 1), claveMapa: `y${p.toFixed(2)}` });
    },
  },
  manipulacion: '<ul><li>Mueve el botón $p$ de 1 a 12: mira cómo sube todo el terreno.</li><li>Arrastra en el mapa para ver qué pasa en otros cortes.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Hasta ahora has elegido entre unos pocos «y». Pero en la práctica, nadie sabe de antemano cuál encaja. Lo más útil es tener una familia con un [[parámetro]]: un botón que se ajusta hasta que el sistema se comporta bien, incluso de forma automática.' },
    { tipo: 'ejemplo', texto: 'La familia de Yager, para $a = 0{,}7$ y $b = 0{,}6$:', tabla: [['p', '1', '2', '4', '12', '∞'], ['Resultado', '0,3', '0,5', '0,57', '0,6', '0,6']], cierre: 'Empieza en Łukasiewicz, y se acerca al mínimo. Entre medias, hay infinitos «y».' },
    { tipo: 'simbolos', intro: 'La fórmula de Yager, desde dentro hacia fuera.', piezas: [
      { tex: R`1 - a,\ 1 - b`, dice: 'Lo que le falta a cada grado: su «defecto».' },
      { tex: R`(1 - a)^p + (1 - b)^p`, dice: 'Se juntan los defectos, elevados a $p$.' },
      { tex: R`(\ \cdots\ )^{\frac{1}{p}}`, dice: 'Se deshace el exponente. Con $p$ grande, esto casi se queda con el mayor defecto.' },
      { tex: R`\max(0,\ 1 - \cdots)`, dice: 'El resultado es 1 menos los defectos juntos, sin bajar de 0.' },
    ], todo: R`T_p(a, b) = \max\left(0,\ 1 - \left((1 - a)^p + (1 - b)^p\right)^{\frac{1}{p}}\right)`, lee: 'Con $p = 1$, los defectos se suman: Łukasiewicz. Con $p$ enorme, solo cuenta el mayor defecto: el mínimo.' },
    { tipo: 'formal', titulo: 'Familia de Yager', tex: R`Para $p \ge 1$, $T_p$ es una [[norma T]]. Además, $T_1(a, b) = \max(0, a + b - 1)$ y $\lim_{p \to \infty} T_p(a, b) = \min(a, b)$.`, lee: 'El símbolo $\\lim_{p \\to \\infty}$ quiere decir: a qué se acerca, si $p$ crece sin parar.' },
    { tipo: 'demo', titulo: 'Con p enorme, solo cuenta el mayor defecto', plan: 'Se sabe por una trampa: atrapar la expresión entre dos cosas que se acercan al mismo número. Sean $u$ y $w$ los dos defectos, con $u \\ge w$.', tex: R`Si $u \ge w \ge 0$, entonces $(u^p + w^p)^{\frac{1}{p}} \to u$ cuando $p \to \infty$.`, pasos: [
      { texto: R`Por abajo: $u^p \le u^p + w^p$, luego $u \le (u^p + w^p)^{\frac{1}{p}}$.`, porque: 'Sumar algo no negativo no baja nada, y elevar a $\\frac{1}{p}$ conserva el orden.' },
      { texto: R`Por arriba: $w^p \le u^p$, luego $u^p + w^p \le 2u^p$, y $(u^p + w^p)^{\frac{1}{p}} \le 2^{\frac{1}{p}}\, u$.`, porque: 'Se cambia $w$ por el mayor, $u$. La raíz de un producto es el producto de las raíces.' },
      { texto: R`Cuando $p \to \infty$, $2^{\frac{1}{p}} \to 1$. La expresión queda atrapada entre $u$ y algo que tiende a $u$.`, porque: 'El exponente $\\frac{1}{p}$ tiende a 0, y $2^0 = 1$.' },
      { texto: R`Por tanto, $T_p(a, b) \to \max(0,\ 1 - u)$, y como $u = 1 - \min(a, b)$, eso es $\min(a, b)$.`, porque: 'El mayor defecto es el del menor grado.' },
    ] },
    { tipo: 'nota', titulo: 'Las personas no usan el mínimo', texto: 'Zimmermann y Zysno midieron cómo combina «y» la gente, y no encaja ni con el mínimo ni con el producto. Las personas <em>compensan</em>: si algo es muy bueno en un aspecto, perdonan un poco el otro. Para eso propusieron un operador con botón, entre el «y» y el «o». La mejor regla depende de para qué la quieres.' },
  ],
  tecnicas: [
    { titulo: 'Atrapa entre dos', texto: 'Para saber a qué tiende algo difícil, busca un límite por abajo y otro por arriba que tiendan al mismo número.' },
    { titulo: 'Si dudas entre dos, busca la familia', texto: 'Cuando dos opciones parecen razonables, muchas veces son extremos de una misma familia. Un parámetro lo resuelve.' },
  ],
  retos: [
    { id: 'ajusta-p', tipo: 'manipular', enunciado: R`Sube el botón hasta que $T_p(0{,}7;\ 0{,}6)$ llegue a $0{,}55$.`, precision: (e) => (yager(e.pot)(0.7, 0.6) >= 0.55 ? 1 : 0), prueba: { pot: 5 }, pendiente: (e) => `Ahora da ${yager(e.pot)(0.7, 0.6).toFixed(2).replace('.', ',')}. Hace falta 0,55.`, pistas: ['Con $p$ grande se acerca a 0,6.'], explicacion: 'Un botón, y el «y» se vuelve menos severo sin dejar de ser un «y».' },
    { id: 'extremos-p', tipo: 'calcular', enunciado: R`¿Cuánto vale $T_2(0{,}7;\ 0{,}6)$, con $p = 2$?`, respuesta: 0.5, tol: 0.001, pistas: [R`Defectos: $0{,}3$ y $0{,}4$.`, R`$\sqrt{0{,}09 + 0{,}16} = 0{,}5$.`], explicacion: R`$1 - 0{,}5 = 0{,}5$.` },
    { id: 'la-gente-compensa', tipo: 'elegir', enunciado: 'Según los experimentos, ¿qué hace la gente al combinar dos cualidades con «y»?', opciones: ['Usa siempre el mínimo', 'Multiplica los grados', 'Compensa: lo muy bueno perdona en parte lo flojo', 'Usa el máximo'], correcta: 2, explicacion: 'Por eso, en modelos de decisión humana se usan operadores con compensación.' },
  ],
  referencias: ['R. R. Yager, «On a general class of fuzzy connectives», <em>Fuzzy Sets and Systems</em> 4 (1980).', 'H.-J. Zimmermann, P. Zysno (1980); y H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 3 y 16.'],
};
