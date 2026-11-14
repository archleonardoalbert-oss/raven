import { AZUL, ORO, ROSA, TEXTO } from '../../motor/colores.js';
import { grupos } from '../../nucleo/relaciones.js';
import { poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { LIENZO, matriz } from './matriz.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const N = ['manzana', 'pera', 'perro', 'lobo', 'gato'];
const SIM = [[1, 0.8, 0.4, 0.4, 0.4], [0.8, 1, 0.4, 0.4, 0.4], [0.4, 0.4, 1, 0.9, 0.6], [0.4, 0.4, 0.9, 1, 0.6], [0.4, 0.4, 0.6, 0.6, 1]];
const COLORES = [AZUL, ROSA, ORO, [120, 220, 150], [190, 140, 240]];

export default {
  id: '4-5-similitud',
  titulo: 'Parecerse: las relaciones de similitud',
  puente: 'Hasta aquí, relaciones entre cosas. Ahora, otra gran idea: si sabes cuánto vale la entrada de una función, ¿cuánto vale su salida, si la entrada es difusa?',
  pregunta: 'Un perro se parece a un lobo. Un gato se parece a un perro, aunque menos. ¿Se pueden repartir en grupos? Depende de cuánto exijas para decir que dos cosas son «lo mismo».',
  escena: {
    id: 'similitud', formato: 'plano', W: 1100, H: 500, ejes: LIENZO(1100, 500),
    entradas: [{ id: 'alfa', tipo: 'deslizador', etiqueta: 'qué exiges para decir «son parecidos», α', min: 0.3, max: 1, paso: 0.01, valor: 0.95 }],
    pasos: [
      { dur: 2000, texto: 'Una tabla de parecidos entre cinco cosas. Todo se parece del todo a sí mismo: la diagonal es 1. Y si A se parece a B, B se parece a A.' },
      { dur: 2600, texto: 'Pon un listón muy alto, $\\alpha = 0{,}95$. Solo cuentan como iguales los que lo superan. Nadie lo hace: cinco grupos, uno por cosa.' },
      { dur: 3600, texto: 'Baja el listón. A 0,9, se juntan perro y lobo. A 0,8, manzana y pera. A 0,6, se les une el gato. A 0,4, todo es un solo grupo.' },
      { dur: 2000, texto: 'Lo importante: en cada nivel hay grupos bien separados, y <b style="color:#f4d345;font-weight:400">los grupos nunca se rompen al bajar el listón</b>: solo se funden. Es una clasificación con niveles de detalle.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.5), alfa = paso === 0 ? 1 : paso === 1 ? mix(1, 0.95, ev(q(1), 0, 0.6)) : paso === 2 ? mix(0.95, 0.35, ev(q(2), 0, 1)) : e.alfa;
      const G = grupos(SIM, alfa), L = [];
      const dentro = []; SIM.forEach((f, i) => f.forEach((v, j) => { if (v >= alfa && paso >= 1) dentro.push([i, j]); }));
      L.push(...matriz(SIM, { x: 130, y: 90, lado: 62, filas: N, cols: N.map((t) => t.slice(0, 3)), alfa: al, resalta: dentro, atenuar: paso >= 1 }));
      if (paso >= 1) {
        const a = ev(q(1), 0, 0.4);
        L.push(rotulo([820, 66], R`\alpha = ${coma(alfa)}:\quad ${G.length}\ \text{grupos}`, { clave: 'n', tam: 26, color: ORO, alfa: a }));
        let y = 110;
        G.forEach((g, k) => {
          const c = COLORES[k % 5], alto = 34 + g.length * 30;
          L.push(poligono([[640, y], [1020, y], [1020, y + alto - 12], [640, y + alto - 12]], { color: c, alfa: 0.13 * a }));
          L.push(rotulo([662, y + 20], R`\text{Grupo ${k + 1}}`, { clave: `tg${k}`, ancla: 'l', tam: 15, color: c, alfa: a }));
          g.forEach((i, t) => { L.push(punto([690, y + 48 + t * 28 - 14], { color: c, radio: 6, alfa: a })); L.push(rotulo([710, y + 48 + t * 28 - 14], R`\text{${N[i]}}`, { clave: `gn${i}`, ancla: 'l', tam: 19, color: TEXTO, alfa: a })); });
          y += alto;
        });
      }
      return L;
    },
  },
  manipulacion: '<ul><li>Mueve el listón $\\alpha$ despacio, de arriba abajo: mira los momentos exactos en que se funden los grupos.</li><li>Observa las casillas iluminadas: son las parejas que superan el listón.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'En lo clásico, una [[relación de equivalencia]] reparte las cosas en grupos: dos cosas son «iguales» o no. La versión difusa dice <em>cuán</em> iguales son. Y resulta que contiene muchas clasificaciones a la vez, una por cada nivel de exigencia.' },
    { tipo: 'ejemplo', texto: 'Con la tabla de la escena, cada listón da un reparto:', tabla: [['Listón', 'Grupos'], ['0,95', 'cada cosa sola'], ['0,9', '{perro, lobo}, y el resto solos'], ['0,8', '{manzana, pera}, {perro, lobo}, {gato}'], ['0,6', '{manzana, pera}, {perro, lobo, gato}'], ['0,4', 'todo junto']], cierre: 'De más fino a más grueso: un árbol de clasificación, con solo una tabla de grados.' },
    { tipo: 'simbolos', intro: 'Las tres condiciones de una similitud.', piezas: [
      { tex: R`\mu_S(x, x) = 1`, dice: '[[Reflexiva|reflexiva]]: todo se parece del todo a sí mismo.' },
      { tex: R`\mu_S(x, y) = \mu_S(y, x)`, dice: '[[Simétrica|simétrica]]: A se parece a B lo mismo que B a A.' },
      { tex: R`\mu_S(x, z) \ge \min(\mu_S(x, y),\ \mu_S(y, z))`, dice: '[[Transitiva|transitiva]]: si $x$ se parece a $y$, e $y$ a $z$, entonces $x$ se parece a $z$, al menos tanto como el peor de los dos parecidos.' },
    ], todo: R`\mu_S(x, z) \ge \sup_y \min(\mu_S(x, y),\ \mu_S(y, z))`, lee: 'Escrita para todos los $y$ a la vez. Es decir: $S \\circ S \\subseteq S$. Pasar por un intermediario no puede dar más parecido que el directo.' },
    { tipo: 'formal', titulo: 'Relación de similitud', tex: R`Una relación difusa $S$ en $X$ es de similitud si es reflexiva, simétrica y transitiva en el sentido máx-mín.`, lee: 'Es lo mismo que una relación de equivalencia, en la que los valores 0 y 1 se han cambiado por grados.' },
    { tipo: 'demo', titulo: 'Cada corte reparte en grupos', plan: 'Esta es la razón de la escena: en cada listón, las parejas que lo superan forman una relación de equivalencia clásica. Comprobamos las tres propiedades.', tex: R`Si $S$ es de similitud, cada corte $S_\alpha$, con $\alpha \in (0, 1]$, es una relación de equivalencia.`, pasos: [
      { texto: R`Reflexiva: $\mu_S(x, x) = 1 \ge \alpha$, luego $(x, x) \in S_\alpha$.`, porque: 'La diagonal vale 1, y ningún listón pasa de 1.' },
      { texto: R`Simétrica: si $\mu_S(x, y) \ge \alpha$, como $\mu_S(y, x) = \mu_S(x, y)$, también $(y, x) \in S_\alpha$.`, porque: 'Los dos grados son el mismo número.' },
      { texto: R`Transitiva: si $\mu_S(x, y) \ge \alpha$ y $\mu_S(y, z) \ge \alpha$, entonces $\min(\mu_S(x, y), \mu_S(y, z)) \ge \alpha$.`, porque: 'Si llegan los dos, llega el menor.' },
      { texto: R`Y como $\mu_S(x, z)$ no baja de ese mínimo, $\mu_S(x, z) \ge \alpha$: $(x, z) \in S_\alpha$.`, porque: 'Es justo lo que exige la tercera condición de una similitud.' },
    ] },
    { tipo: 'nota', titulo: 'Y los grupos solo se funden', texto: 'Como los cortes se anidan, si dos cosas están juntas en un listón, lo siguen estando en cualquier listón más bajo. Por eso, al bajar, los grupos solo se funden; nunca se rompen. Esto se llama un árbol de partición.' },
  ],
  tecnicas: [
    { titulo: 'Baja de lo difuso a lo clásico', texto: 'Para entender una estructura difusa, mira sus cortes. Aquí, una sola tabla contiene una familia entera de clasificaciones.' },
    { titulo: 'Si te falta algo, compón', texto: 'Una relación que casi es transitiva se puede cerrar: compónla consigo misma hasta que deje de cambiar. Se llama cierre transitivo.' },
  ],
  retos: [
    { id: 'grupos-alfa', tipo: 'manipular', enunciado: 'Pon el listón de modo que queden exactamente 2 grupos.', precision: (e) => (grupos(SIM, e.alfa).length === 2 ? 1 : 0), prueba: { alfa: 0.5 }, pendiente: (e) => `Ahora hay ${grupos(SIM, e.alfa).length} grupos.`, pistas: ['Mira qué valores distintos hay en la tabla: los cambios ocurren justo ahí.'], explicacion: 'Frutas y animales: entre 0,4 y 0,6.' },
    { id: 'transitiva-calc', tipo: 'calcular', enunciado: R`Si $\mu_S(x, y) = 0{,}7$ y $\mu_S(y, z) = 0{,}5$, ¿cuál es el mínimo valor posible de $\mu_S(x, z)$ en una similitud?`, respuesta: 0.5, tol: 0.001, pistas: ['Es el peor de los dos parecidos.'], explicacion: R`$\min(0{,}7;\ 0{,}5) = 0{,}5$.` },
    { id: 'demuestra-corte', tipo: 'demostrar', enunciado: R`Demuestra que, si $\alpha \le \beta$, el grupo de $x$ en $S_\beta$ está dentro de su grupo en $S_\alpha$.`, pistas: ['Toma un $y$ del grupo en $S_\\beta$: ¿qué sabes de $\\mu_S(x, y)$?'],
      solucion: [
        { texto: R`Si $y$ está en el grupo de $x$ en $S_\beta$, entonces $\mu_S(x, y) \ge \beta$.`, porque: 'Definición del corte.' },
        { texto: R`Como $\beta \ge \alpha$, resulta $\mu_S(x, y) \ge \alpha$. Luego $y$ también está en el grupo de $x$ en $S_\alpha$.`, porque: 'Encadenar desigualdades: los cortes se anidan.' },
      ] },
  ],
  referencias: ['L. A. Zadeh, «Similarity relations and fuzzy orderings», <em>Information Sciences</em> 3 (1971).', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 6.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 5.'],
};
