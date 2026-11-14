import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { curva, linea, mapaCalor, marco, poligono, punto, rotulo, terreno } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const DOSIGMA2 = 0.08;
const f = (x, y) => Math.exp(-((x - 0.5) ** 2 + (y - 0.5) ** 2) / DOSIGMA2);
const GLSL = 'float d=(x-.5)*(x-.5)+(y-.5)*(y-.5);return exp(-d/.08);';
const radio = (a) => Math.sqrt(-DOSIGMA2 * Math.log(a));

export default {
  id: '1-8-cortes-alfa',
  titulo: 'α-cortes',
  puente: 'Cortar es fácil. Lo sorprendente es que los cortes bastan para reconstruir todo el conjunto.',
  pregunta: '¿Se puede ver un conjunto difuso como muchos conjuntos clásicos? Córtalo a una altura y mira la silueta que queda.',
  escena: {
    id: 'cortes-alfa', formato: '3d', W: 1100, H: 690,
    render3d: { cx: 365, cy: 372, S: 335 },
    entradas: [{ id: 'alfa', tipo: 'deslizador', etiqueta: 'nivel α', min: 0.05, max: 0.98, paso: 0.01, valor: 0.5 }],
    pasos: [
      { dur: 3000, texto: 'Un conjunto difuso sobre el plano es un terreno: la altura en cada punto es su grado.' },
      { dur: 2400, texto: 'Levanta un plano horizontal hasta la altura $\\alpha$. Corta el terreno, y lo que queda por encima forma una isla.' },
      { dur: 2600, texto: 'El borde de la isla es una curva de nivel. Bájala al suelo por estas líneas.' },
      { dur: 2400, texto: 'Retiramos la mitad del terreno para verlo: en el suelo queda una región nítida, el <b style="color:#f4d345;font-weight:400">α-corte</b>, un conjunto clásico: todos los puntos con grado al menos $\\alpha$.' },
      { dur: 2200, texto: 'Cuanto más alto el listón $\\alpha$, más pequeño el corte. Mira el perfil abajo a la derecha: los cortes se anidan, cada uno dentro del anterior.' },
    ],
    primitivas({ q, paso, e }) {
      const a = paso >= 1 ? mix(0.02, e.alfa, ev(q(1), 0, 0.85)) : 0.02, r = radio(a), de = ev(q(0), 0.15, 1);
      const P = [marco({ x: [0, 1], y: [0, 1], z: [0, 1] }, { alfa: ev(q(0), 0, 0.3), paredX: GRIS2, paredY: GRIS2, etiquetas: { x: 'x', y: 'y', z: R`\mu` } })];
      const abre = paso === 3 ? 0.5 * ev(q(3), 0, 0.5) : paso > 3 ? 0.5 * (1 - ev(q(4), 0, 0.5)) : 0;
      if (de > 0) P.push(terreno(f, { glsl: GLSL, desde: Math.max(1 - de, abre) }));
      const pl = ev(q(1), 0, 0.3);
      if (pl > 0) {
        for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) {
          const x0 = i / 10, x1 = x0 + 0.1, y0 = j / 10, y1 = y0 + 0.1;
          P.push(poligono([[x0, y0, a], [x1, y0, a], [x1, y1, a], [x0, y1, a]], { color: BLANCO, alfa: 0.13 * pl }));
        }
        P.push(rotulo([1, 0, a], R`\alpha = ${coma(a)}`, { clave: 'alfa', dx: 16, ancla: 'l', tam: 22, color: BLANCO, alfa: pl, siempre: true }));
      }
      const cn = ev(q(2), 0, 0.5);
      const circulo = (z, hasta) => curva((u) => [0.5 + r * Math.cos(u), 0.5 + r * Math.sin(u), z], [0, 6.28319], { hasta, n: 120, color: ORO, ancho: 3.2, brillo: true });
      if (cn > 0) P.push(circulo(a, cn));
      const baj = ev(q(2), 0.45, 1);
      if (baj > 0) {
        for (let k = 0; k < 8; k++) {
          const u = (k / 8) * 6.28319, x = 0.5 + r * Math.cos(u), y = 0.5 + r * Math.sin(u);
          P.push(linea([x, y, a], [x, y, mix(a, 0, baj)], { color: ORO, ancho: 1.3, alfa: 0.75 * baj }));
          P.push(punto([x, y, mix(a, 0, baj)], { color: ORO, radio: 2.5, alfa: baj }));
        }
      }
      const sue = ev(q(3), 0, 0.6);
      if (sue > 0) {
        P.push(circulo(0, 1));
        for (let k = 0; k < 40; k++) {
          const u0 = (k / 40) * 6.28319, u1 = ((k + 1) / 40) * 6.28319;
          P.push(poligono([[0.5, 0.5, 0], [0.5 + r * Math.cos(u0), 0.5 + r * Math.sin(u0), 0], [0.5 + r * Math.cos(u1), 0.5 + r * Math.sin(u1), 0]], { color: ORO, alfa: 0.35 * sue }));
        }
      }
      // mapa desde arriba y perfil: lo mismo, en plano
      const pa = ev(q(1), 0, 0.5), M = [], C = [];
      if (pa > 0) {
        M.push(mapaCalor(f, { clave: 'corte' }), marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: {} }));
        M.push(rotulo([0.5, 1], R`\text{Desde arriba}`, { clave: 'tm', dy: -18, tam: 17, color: GRIS2, alfa: pa }));
        if (cn > 0) M.push(curva((u) => [0.5 + r * Math.cos(u), 0.5 + r * Math.sin(u)], [0, 6.28319], { hasta: cn, n: 120, color: BLANCO, ancho: 2.6 }));
        const xi = 0.5 - r, xd = 0.5 + r, g = (x) => f(x, 0.5);
        C.push(marco({ x: [0, 1], y: [0, 1] }, { alfa: pa, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: R`x`, y: R`\mu` } }));
        C.push(curva((x) => [x, g(x)], [0, 1], { n: 140, color: AZUL, ancho: 2.6 }));
        C.push(linea([0, a], [1, a], { color: BLANCO, ancho: 1.2, alfa: 0.7 * pa }));
        C.push(rotulo([0.5, 1], R`\text{Perfil en } y = 0{,}5`, { clave: 'tc', dy: -20, tam: 17, color: GRIS2, alfa: pa }));
        if (cn > 0) {
          C.push(punto([xi, g(xi)], { color: ORO, radio: 5, alfa: cn }), punto([xd, g(xd)], { color: ORO, radio: 5, alfa: cn }));
          C.push(linea([xi, g(xi)], [xi, 0], { color: ORO, ancho: 1, alfa: 0.6 * cn, discontinua: true }), linea([xd, g(xd)], [xd, 0], { color: ORO, ancho: 1, alfa: 0.6 * cn, discontinua: true }));
          C.push(poligono([[xi, 0], [xd, 0], [xd, 0.035], [xi, 0.035]], { color: ORO, alfa: cn }));
        }
        if (paso >= 4) {
          [0.2, 0.4, 0.6, 0.8].forEach((n, i) => { const ri = radio(n); C.push(poligono([[0.5 - ri, 0.05 + i * 0.022], [0.5 + ri, 0.05 + i * 0.022], [0.5 + ri, 0.058 + i * 0.022], [0.5 - ri, 0.058 + i * 0.022]], { color: ROSA, alfa: ev(q(4), 0, 0.6) * 0.9 })); });
        }
      }
      return { principal: P, paneles: [
        { ejes: { x: [0, 1], y: [0, 1], caja: { x: 810, y: 92, w: 216, h: 216 } }, prims: M },
        { ejes: { x: [0, 1], y: [0, 1], caja: { x: 786, y: 410, w: 280, h: 210 } }, prims: C },
      ] };
    },
  },
  manipulacion: '<ul><li>Mueve «nivel α»: el plano sube y baja, y todas las vistas se recalculan a la vez.</li><li>Arrastra la vista 3D para girar la cámara: la intersección del plano con el terreno es real.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Pon un listón. Fija, por ejemplo, 0,5, y pregunta: ¿quién pertenece al conjunto <em>al menos</em> con ese grado? La respuesta es un grupo normal y corriente: se está dentro o fuera. Has convertido lo difuso en nítido.' },
    { tipo: 'ejemplo', texto: 'La «casa cómoda» otra vez (dormitorios 1 a 6, con grados 0,2; 0,5; 0,8; 1; 0,7; 0,3). Sube el listón:', tabla: [['Listón', '0,2', '0,5', '0,8', '1'], ['Quién llega', '1, 2, 3, 4, 5, 6', '2, 3, 4, 5', '3, 4', '4']], cierre: 'Cuanto más alto el listón, menos gente. Y cada grupo está dentro del anterior.' },
    { tipo: 'simbolos', intro: 'A ese grupo se le llama α-corte. Pieza a pieza:', piezas: [
      { tex: R`\alpha`, dice: '«Alfa»: el listón, un número entre 0 y 1.' },
      { tex: R`A_\alpha`, dice: 'El corte de $A$ al nivel $\\alpha$: el grupo de los que llegan.' },
      { tex: R`\mu_A(x) \ge \alpha`, dice: 'Su grado llega al listón: mayor o igual.' },
    ], todo: R`A_\alpha = \{x \in X : \mu_A(x) \ge \alpha\}`, lee: '«El corte de nivel $\\alpha$ es el grupo de los $x$ cuyo grado llega a $\\alpha$». En la escena es la isla que asoma sobre el plano, vista desde arriba.' },
    { tipo: 'formal', titulo: 'α-corte y corte fuerte', tex: R`Para $\alpha \in [0, 1]$: $\ A_\alpha = \{x \in X : \mu_A(x) \ge \alpha\}$ y, con «mayor estricto», el corte fuerte $A_{\alpha^+} = \{x \in X : \mu_A(x) > \alpha\}$.`, lee: 'Ambos son conjuntos [[clásicos|clasico]]. En la casa, $A_{0{,}8} = \\{3, 4\\}$, pero el fuerte es $A_{0{,}8^+} = \\{4\\}$: quien llega justo al listón ya no pasa.' },
    { tipo: 'nota', titulo: 'Viejos conocidos', texto: R`Ya habías visto dos cortes sin saberlo: el soporte es el corte fuerte de nivel 0, $A_{0^+}$, y el núcleo es el corte de nivel 1, $A_1$.` },
    { tipo: 'demo', titulo: 'Los cortes se anidan', plan: 'Lo viste en la tabla. Ahora, que nadie pueda negarlo: subir el listón nunca añade a nadie.', tex: R`Si $\alpha \le \beta$, entonces $A_\beta \subseteq A_\alpha$. ($\beta$ es «beta», otro listón, más alto.)`, pasos: [
      { texto: R`Toma cualquier $x$ de $A_\beta$. Entonces $\mu_A(x) \ge \beta$.`, porque: 'Es lo que significa estar en el corte de nivel $\\beta$.' },
      { texto: R`Como $\beta \ge \alpha$, también $\mu_A(x) \ge \alpha$, así que $x$ está en $A_\alpha$.`, porque: 'Si superas el listón alto, superas el bajo.' },
    ] },
    { tipo: 'idea', etiqueta: 'El mínimo y el corte', texto: 'Ahora, algo que usarás mucho. Se llama <em>intersección</em> de dos conjuntos difusos al que da a cada cosa el menor de sus dos grados. Cortar esa intersección es lo mismo que cortar cada conjunto y quedarse con lo común.' },
    { tipo: 'demo', titulo: 'Cortar conserva la intersección y la unión', plan: 'La clave es una equivalencia muy simple sobre el mínimo. Lo mismo vale con el máximo, que da la <em>unión</em>.', tex: R`$(A \cap B)_\alpha = A_\alpha \cap B_\alpha$ y $(A \cup B)_\alpha = A_\alpha \cup B_\alpha$.`, pasos: [
      { texto: R`$x$ está en $(A \cap B)_\alpha$ si y solo si $\min(\mu_A(x), \mu_B(x)) \ge \alpha$.`, porque: 'Definiciones de corte y de intersección.' },
      { texto: R`El menor de dos números llega a $\alpha$ si y solo si llegan los dos.`, porque: 'Si el menor llega, el mayor también; y si llegan los dos, llega el menor.' },
      { texto: R`Eso es estar en $A_\alpha$ y en $B_\alpha$. Con el máximo: el mayor de dos llega a $\alpha$ si y solo si llega alguno de ellos.`, porque: 'El máximo es uno de los dos números.' },
    ] },
    { tipo: 'nota', titulo: 'Para curiosos: con infinitos conjuntos', texto: R`Si unes infinitos conjuntos, usando el [[supremo]] en vez del máximo, solo se garantiza $\bigcup_i (A_i)_\alpha \subseteq (\bigcup_i A_i)_\alpha$. Puede que los grados de $x$ se acerquen a $\alpha$ sin que ninguno llegue. Los cortes fuertes, en cambio, sí conservan esa unión.` },
  ],
  tecnicas: [
    { titulo: 'Traduce lo difuso a lo clásico', texto: 'Los cortes convierten una propiedad difusa en una familia de propiedades clásicas. Muchas demostraciones se reducen a un argumento clásico en cada nivel.' },
    { titulo: 'Desdobla mín y máx', texto: 'Las equivalencias $\\min(a, b) \\ge \\alpha \\iff (a \\ge \\alpha \\text{ y } b \\ge \\alpha)$ y su análoga con $\\max$ convierten operaciones difusas en «y» y «o» lógicos.' },
  ],
  retos: [
    { id: 'corte-triangulo', tipo: 'calcular', enunciado: R`Sea $\mu$ triangular, con pies en $0$ y $10$ y pico en $5$. ¿Cuánto mide el intervalo $A_{0{,}6}$?`, respuesta: 4, tol: 0.05,
      pistas: [R`A la izquierda, $\mu(x) = x \div 5$.`, R`Resuelve $x \div 5 = 0{,}6$: da $x = 3$; por simetría, el otro extremo es $7$.`], explicacion: R`$A_{0{,}6} = [3, 7]$, de longitud $4$.` },
    { id: 'propiedad-monotonia', tipo: 'elegir', enunciado: R`Como $0{,}3 \le 0{,}7$, ¿qué relación hay siempre entre $A_{0{,}3}$ y $A_{0{,}7}$?`, opciones: [R`$A_{0{,}3} \subseteq A_{0{,}7}$`, R`$A_{0{,}7} \subseteq A_{0{,}3}$`, 'No tienen nada en común', 'Depende de la forma de $A$'], correcta: 1,
      explicacion: 'Pedir grado al menos 0,7 es más exigente: quien lo cumple, también cumple grado al menos 0,3.' },
  ],
  referencias: ['H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., Kluwer, 2001, caps. 1–2.', 'G. J. Klir, B. Yuan, <em>Fuzzy Sets and Fuzzy Logic</em>, cap. 1–2.', 'M. Navara, temario del curso <em>Fuzzy Logic</em>, CTU Praga: cortes, propiedades «cutworthy».'],
};
