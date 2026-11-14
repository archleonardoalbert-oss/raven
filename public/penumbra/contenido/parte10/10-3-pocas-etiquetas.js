import { AZUL, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { exactitudCon } from '../../nucleo/ia.js';
import { linea, marco, punto, rotulo, curva } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma } from '../parte9/comun.js';

const R = String.raw;
const NS = [2, 4, 6, 8, 12, 16, 24, 32, 48];
const tabla = new Map();
const ex = (n, modo, peso = 1.2) => { const k = `${n}|${modo}|${peso}`; if (!tabla.has(k)) tabla.set(k, modo === 'sin' ? exactitudCon(n, { conRegla: false }) : exactitudCon(n, { conRegla: true, reglaMala: modo === 'mala', pesoRegla: peso })); return tabla.get(k); };
const X = (i) => i;
export default {
  id: '10-3-pocas-etiquetas',
  titulo: 'Aprender con pocas etiquetas',
  puente: 'Una regla enseña, si los grados son de fiar. Pero ¿cuándo lo son? El capítulo siguiente mira de cerca una pregunta incómoda: ¿qué significa que un modelo diga «80 %»?',
  pregunta: 'Si una regla ahorra etiquetas, ¿cuánto ahorra? ¿Y qué pasa si tu regla está equivocada? Conviene saberlo antes de confiar en ella.',
  escena: {
    id: 'pocas-etiquetas', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 8], y: [0.4, 1], caja: { x: 90, y: 50, w: 640, h: 410 } },
    entradas: [
      { id: 'n', tipo: 'deslizador', etiqueta: 'etiquetas (posición en la lista)', min: 0, max: 8, paso: 1, valor: 0 },
      { id: 'peso', tipo: 'deslizador', etiqueta: 'peso de la regla', min: 0.2, max: 6, paso: 0.2, valor: 1.2 },
    ],
    pasos: [
      { dur: 3000, texto: 'Se entrena muchas veces, de verdad, con cada vez más etiquetas. En <b style="color:#58c4dd;font-weight:400">azul</b>, solo con ejemplos: con muchos, aprende bien; con pocos, no.' },
      { dur: 3000, texto: 'En <b style="color:#f4d345;font-weight:400">oro</b>, añadiendo la regla. Con pocas etiquetas, <b>la ventaja es enorme</b>. Con muchas, se junta con la azul: la regla ya no aporta tanto.' },
      { dur: 3200, texto: 'En <b style="color:#f05a5a;font-weight:400">rojo</b>, una regla <b>falsa</b>: dice lo contrario de la verdad. Queda por debajo de no usar ninguna, y <b>ni con todas las etiquetas se recupera</b>. Una regla no es gratis: es una apuesta.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), [t1, t2, t3] = [ev(q(0), 0.1, 1), ev(q(1), 0, 0.85), ev(q(2), 0, 0.85)], peso = paso === 2 && q(2) >= 1 ? e.peso : 1.2;
      const N = [marco({ x: [0, 8], y: [0.4, 1] }, { alfa: al, ticks: { x: [], y: [0.5, 0.75, 1] }, etiquetas: { y: R`\text{exactitud}` } }), linea([0, 0.5], [8, 0.5], { color: GRIS2, ancho: 1, alfa: 0.4 * al, discontinua: true })];
      NS.forEach((n, i) => N.push(rotulo([X(i), 0.4], String(n), { clave: `n${i}`, dy: 16, tam: 16, color: GRIS2, alfa: al })));
      N.push(rotulo([4, 0.4], R`\text{etiquetas}`, { clave: 'tn', dy: 38, tam: 16, color: GRIS2, alfa: al }));
      const serie = (modo, color, t, p) => { if (t > 0) N.push(curva((u) => { const i = Math.min(8, Math.floor(u)), f = u - i; return [u, ex(NS[i], modo, p) + (ex(NS[Math.min(8, i + 1)], modo, p) - ex(NS[i], modo, p)) * f]; }, [0, 8], { hasta: Math.max(t, 1e-3), n: 64, color, ancho: 3 })); };
      serie('sin', AZUL, t1, 1.2); serie('con', ORO, t2, peso); serie('mala', ROJO, t3, peso);
      const k = Math.round(e.n), panel = [];
      if (paso === 2 && q(2) >= 1) { for (const [m, c] of [['sin', AZUL], ['con', ORO], ['mala', ROJO]]) N.push(punto([k, ex(NS[k], m, peso)], { color: c, radio: 7 })); }
      panel.push(rotulo([130, 40], R`\text{Con ${NS[k]} etiquetas}`, { clave: 'te', tam: 19, alfa: al }), rotulo([130, 90], R`{\color{#58c4dd}\text{sin regla } ${coma(ex(NS[k], 'sin'))}}`, { clave: 'a', tam: 20, alfa: t1 }), rotulo([130, 130], R`{\color{#f4d345}\text{con regla } ${coma(ex(NS[k], 'con', peso))}}`, { clave: 'b', tam: 20, alfa: t2 }), rotulo([130, 170], R`{\color{#f05a5a}\text{regla falsa } ${coma(ex(NS[k], 'mala', peso))}}`, { clave: 'c', tam: 20, alfa: t3 }));
      return { principal: N, paneles: [{ ejes: { x: [0, 260], y: [220, 0], caja: { x: 800, y: 100, w: 260, h: 220 } }, prims: panel }] };
    },
  },
  manipulacion: '<ul><li>Mueve las etiquetas: la distancia entre oro y azul se va cerrando.</li><li>Sube el peso de la regla: la falsa hace cada vez más daño; la verdadera deja de mejorar.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una regla es información gratis, si es cierta. Su valor es mayor donde faltan datos, y se desvanece cuando abundan. Y si es falsa, mete un sesgo que más datos tardan en corregir. Por eso se le da un peso, y por eso hay que comprobarla.' },
    { tipo: 'ejemplo', texto: 'Lo que midieron Van Krieken et al. en un problema con imágenes de dígitos y pocas etiquetas:', tabla: [['Configuración', 'Exactitud'], ['Reichenbach con el mismo problema', '96,3 %'], ['Reichenbach sigmoidal, con SGD', '97,3 %'], ['Con las dos reglas, y SGD', '98,0 %'], ['Gödel', '90,5 %'], ['Ladder Networks, sin lógica', '98,9 %']], cierre: 'Ayudan, sí; y no ganan a los mejores métodos que no usan lógica. Lo que aportan es otra cosa: conocimiento explícito, y que se puede leer.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`L_{\text{datos}}`, dice: 'La pérdida con los ejemplos etiquetados.' },
      { tex: R`L_{\text{regla}}`, dice: 'La pérdida de la regla, sobre todos los ejemplos.' },
      { tex: R`\lambda`, dice: 'El peso que se le da. La letra griega «lambda».' },
    ], todo: R`L = L_{\text{datos}} + \lambda\, L_{\text{regla}}`, lee: 'Es un equilibrio: si $\\lambda$ es 0, la regla no existe; si es enorme, los datos no cuentan.' },
    { tipo: 'formal', titulo: 'Aprendizaje semisupervisado con lógica', tex: R`Con datos etiquetados $\mathcal{D}_l$ y sin etiquetar $\mathcal{D}_u$: $\ \min_\theta\ \frac{1}{|\mathcal{D}_l|}\sum_{(x, y) \in \mathcal{D}_l} \ell(f_\theta(x), y) + \lambda \left(1 - \mathrm{Sat}\big(\varphi, f_\theta, \mathcal{D}_l \cup \mathcal{D}_u\big)\right)$.`, lee: 'El segundo término no usa $y$: por eso puede aprovechar lo no etiquetado.' },
    { tipo: 'demo', titulo: 'Con la regla a medias, el óptimo se desplaza', plan: 'Un cálculo en miniatura muestra de dónde viene el sesgo. Un solo parámetro $q$, un dato que dice 1, y una regla que empuja hacia 0.', tex: R`El mínimo de $(q - 1)^2 + \lambda q^2$ está en $\hat q = \frac{1}{1 + \lambda}$.`, pasos: [
      { texto: R`La derivada es $2(q - 1) + 2\lambda q$.`, porque: 'Se deriva cada sumando.' },
      { texto: R`Igualando a 0: $q(1 + \lambda) = 1$.`, porque: 'Se agrupa $q$.' },
      { texto: R`Por tanto, $\hat q = \frac{1}{1 + \lambda}$. Con $\lambda = 0$, se acierta; con $\lambda$ grande, la respuesta se aleja de lo que dice el dato.`, porque: 'Una regla falsa desplaza el óptimo por mucho que entrenes, y solo más datos o menos peso lo arreglan.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Prueba tus reglas contra los datos', texto: 'Antes de meter una regla, mide cuánto se cumple en datos etiquetados. Una regla que casi nunca se cumple, no es una regla: es un error en potencia.' }],
  retos: [
    { id: 'donde-ayuda', tipo: 'manipular', enunciado: R`Busca el número de etiquetas con el que la regla aporta al menos $0{,}2$ de exactitud sobre no usarla.`, precision: (e) => { const n = NS[Math.round(e.n)]; return n > 2 && ex(n, 'con') - ex(n, 'sin') >= 0.2 ? 1 : 0; }, prueba: { n: 1 }, pendiente: (e) => { const n = NS[Math.round(e.n)]; return `Con ${n} etiquetas, aporta ${(ex(n, 'con') - ex(n, 'sin')).toFixed(2).replace('.', ',')}.`; }, pistas: ['Mira donde más se separan oro y azul, con más de 2 etiquetas.'], explicacion: 'Donde escasean los datos, la regla vale más.' },
    { id: 'lambda-calc', tipo: 'calcular', enunciado: R`En el modelo en miniatura, con $\lambda = 4$, ¿cuánto vale $\hat q$?`, respuesta: 0.2, tol: 0.001, pistas: [R`$\frac{1}{1 + \lambda}$.`], explicacion: R`$\frac{1}{5} = 0{,}2$.` },
    { id: 'peso-elegir', tipo: 'elegir', enunciado: 'Tienes muchísimos datos bien etiquetados. ¿Qué esperas al añadir una regla correcta?', opciones: ['Una gran mejora', 'Poco efecto: los datos ya lo dicen', 'Que empeore siempre', 'Que no se pueda entrenar'], correcta: 1, explicacion: 'La regla aporta lo que falta; si no falta nada, aporta poco.' },
    { id: 'demuestra-lambda', tipo: 'demostrar', enunciado: R`Demuestra que $\hat q = \frac{1}{1 + \lambda}$ es un mínimo, y no un máximo.`, pistas: ['Mira la segunda derivada.'], solucion: [{ texto: R`La segunda derivada de $(q - 1)^2 + \lambda q^2$ es $2 + 2\lambda$.`, porque: 'Se deriva otra vez.' }, { texto: R`Es positiva para $\lambda \ge 0$, así que la función es una parábola hacia arriba, y su único punto crítico es un mínimo.`, porque: 'Curvatura positiva.' }] },
  ],
  referencias: ['E. van Krieken, E. Acar, F. van Harmelen, <em>Artificial Intelligence</em> 302 (2022), sec. 10.', 'S. Badreddine et al., <em>Artificial Intelligence</em> 303 (2022).'],
};
