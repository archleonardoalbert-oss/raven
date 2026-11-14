import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { MARIPOSA, fcm } from '../../nucleo/aprender.js';
import { linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix, mixc } from '../../motor/tiempo.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const INICIO = [[0.5, 3.5], [2, 0.5]], PUENTE = 7, CERCANO = 6;
const memo = new Map();
const historia = (m) => { const k = m.toFixed(2); if (!memo.has(k)) memo.set(k, fcm(MARIPOSA, INICIO, m, 15)); return memo.get(k); };

export default {
  id: '7-1-c-medias',
  titulo: 'Encontrar los grupos: c-medias difusas',
  puente: 'Los datos ya te dicen qué palabras usar. Falta lo demás: que las reglas se ajusten solas, a partir de ejemplos, hasta equivocarse lo menos posible.',
  pregunta: '¿De dónde salen las palabras? Hasta ahora, las curvas las has dibujado tú. ¿Y si los datos te dijeran qué grupos existen, y cuánto pertenece a cada uno cada punto?',
  escena: {
    id: 'c-medias', formato: 'plano', W: 1100, H: 560,
    ejes: { x: [-0.5, 6.5], y: [-0.5, 4.5], caja: { x: 70, y: 40, w: 680, h: 470 } },
    entradas: [
      { id: 'm', tipo: 'deslizador', etiqueta: 'cuánto se mezclan los grupos, m', min: 1.1, max: 4, paso: 0.05, valor: 2 },
      { id: 'vueltas', tipo: 'deslizador', etiqueta: 'vueltas del algoritmo', min: 0, max: 15, paso: 1, valor: 15 },
    ],
    pasos: [
      { dur: 2200, texto: 'Quince datos, en forma de mariposa. A simple vista hay dos alas. ¿Y el punto del centro? <b>¿De qué ala es?</b>' },
      { dur: 2800, texto: 'Se ponen dos centros al azar. Cada punto se pinta según lo cerca que esté de cada uno: <b style="color:#58c4dd;font-weight:400">azul</b>, <b style="color:#fc6282;font-weight:400">rosa</b>, o una mezcla de los dos. Es su grado en cada grupo.' },
      { dur: 3600, texto: 'Ahora se repiten dos pasos: cada centro va a <b>la media de los puntos, pesada por sus grados</b>, y se recalculan los grados. Los centros <b style="color:#f4d345;font-weight:400">encuentran las alas solos</b>.' },
      { dur: 3800, texto: 'El punto del centro queda en 0,5 y 0,5: de los dos por igual. Un agrupamiento clásico lo obligaría a elegir. Con $m$ casi en 1, los puntos dejan de mezclarse, y hasta el del centro acaba eligiendo un ala; con $m$ grande, se mezcla todo.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.5), vis = ev(q(1), 0, 0.4), bajar = paso === 3 ? ev(q(3), 0, 0.45) * (1 - ev(q(3), 0.55, 1)) : 0;
      const m = mix(e.m, 1.1, bajar), h = historia(m), t = paso < 2 ? 0 : paso === 2 ? Math.round(ev(q(2), 0, 0.85) * e.vueltas) : Math.round(e.vueltas), { centros, U } = h[Math.min(t, h.length - 1)];
      const P = [marco({ x: [-0.5, 6.5], y: [-0.5, 4.5] }, { alfa: al * 0.5, ticks: { x: [], y: [] } })], D = [];
      MARIPOSA.forEach((x, i) => {
        const c = mixc(GRIS2, mixc(AZUL, ROSA, U[i][1]), vis), r = i === PUENTE ? 13 : 10;
        P.push(punto(x, { color: c, radio: r * ev(q(0), (i / 15) * 0.5, (i / 15) * 0.5 + 0.4), halo: 0 }));
      });
      if (vis > 0) {
        for (let k = 0; k < 2; k++) {
          const camino = h.slice(0, t + 1).map((s) => s.centros[k]);
          for (let j = 0; j + 1 < camino.length; j++) P.push(punto(camino[j], { color: ORO, radio: 2.5, alfa: 0.55 * vis, halo: 0 }), punto(camino[j + 1], { color: ORO, radio: 2.5, alfa: 0.55 * vis, halo: 0 }), linea(camino[j], camino[j + 1], { color: ORO, ancho: 1.2, alfa: 0.55 * vis }));
          P.push(punto(centros[k], { color: k === 0 ? AZUL : ROSA, radio: 15, alfa: 0.35 * vis }), punto(centros[k], { color: BLANCO, radio: 6, alfa: vis }), rotulo(centros[k], `v_${k + 1}`, { clave: `v${k}`, dy: -24, tam: 20, alfa: vis }));
        }
        const pu = U[PUENTE], ce = U[CERCANO];
        D.push(rotulo([850, 110], R`\text{Punto del centro}`, { clave: 't1', tam: 18, color: GRIS2, alfa: vis }), rotulo([850, 148], R`{\color{#58c4dd}${coma(pu[0])}},\quad {\color{#fc6282}${coma(pu[1])}}`, { clave: 'u1', tam: 26, alfa: vis }));
        D.push(rotulo([850, 220], R`\text{Punto vecino, en }(2, 2)`, { clave: 't2', tam: 18, color: GRIS2, alfa: vis }), rotulo([850, 258], R`{\color{#58c4dd}${coma(ce[0])}},\quad {\color{#fc6282}${coma(ce[1])}}`, { clave: 'u2', tam: 26, alfa: vis }));
        D.push(rotulo([850, 340], `m = ${coma(m)}`, { clave: 'm', tam: 28, color: ORO, alfa: vis }), rotulo([850, 390], R`\text{vuelta } ${t}`, { clave: 't', tam: 20, color: GRIS2, alfa: vis }));
      }
      return { principal: P, paneles: [{ ejes: { x: [760, 1090], y: [510, 40], caja: { x: 760, y: 40, w: 330, h: 470 } }, prims: D }] };
    },
  },
  manipulacion: '<ul><li>Mueve $m$: de casi 1, grupos puros; a 4, todo muy mezclado.</li><li>Mueve las vueltas: en muy pocas, los centros ya están en su sitio.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Quieres repartir datos en grupos, un [[agrupamiento]], sin que nadie te diga antes cuáles son. El algoritmo clásico obliga a cada punto a estar en un solo grupo. Bezdek (1981) lo relajó: cada punto reparte un grado total de 1 entre los grupos. Lo que está en medio se queda en medio.' },
    { tipo: 'ejemplo', texto: 'Un punto a distancia 1 de un centro, y a distancia 3 del otro, con $m = 2$. Se reparte su grado en proporción al inverso del cuadrado de la distancia:', tabla: [['Centro', 'Distancia', 'Inverso del cuadrado', 'Grado'], ['Primero', '1', '1', '0,9'], ['Segundo', '3', '0,111', '0,1']], cierre: 'Tres veces más lejos, nueve veces menos grado. El total es 1.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`u_{ni}`, dice: 'El grado del punto $n$ en el grupo $i$. Los de un punto suman 1.' },
      { tex: R`v_i`, dice: 'El centro del grupo $i$.' },
      { tex: R`\|x_n - v_i\|^2`, dice: 'El cuadrado de la distancia del punto a ese centro.' },
      { tex: R`m > 1`, dice: 'Cuánto se mezclan los grupos. Se suele usar $m = 2$.' },
    ], todo: R`J = \sum_n \sum_i u_{ni}^{\,m}\, \|x_n - v_i\|^2`, lee: '«El coste total: cada punto, lejos de un centro al que pertenece mucho, cuesta mucho». Es lo que el algoritmo quiere hacer pequeño.' },
    { tipo: 'formal', titulo: 'El algoritmo', tex: R`Se alternan dos fórmulas hasta que nada cambia: $\ v_i = \dfrac{\sum_n u_{ni}^{\,m}\, x_n}{\sum_n u_{ni}^{\,m}}$, $\quad u_{ni} = \dfrac{1}{\sum_j \left(\frac{\|x_n - v_i\|}{\|x_n - v_j\|}\right)^{\frac{2}{m-1}}}$.`, lee: 'La primera mueve cada centro a la media pesada. La segunda reparte los grados según las distancias. Cada una baja el coste $J$ sin subirlo nunca.' },
    { tipo: 'demo', titulo: 'El mejor centro es la media pesada', plan: 'Con los grados fijos, se busca el centro que minimiza el coste. Como es una parábola, su mínimo está donde la [[derivada]] se hace cero. Lo vemos en una dimensión.', tex: R`Si los $a_n = u_{ni}^{\,m} \ge 0$ son fijos, no todos cero, entonces $\sum_n a_n (x_n - v)^2$ es mínimo en $v = \frac{\sum_n a_n x_n}{\sum_n a_n}$.`, pasos: [
      { texto: R`La derivada respecto a $v$ es $\sum_n -2\, a_n (x_n - v)$.`, porque: 'Se deriva cada término: la derivada de $(x - v)^2$ respecto a $v$ es $-2(x - v)$.' },
      { texto: R`Igualando a cero: $\sum_n a_n x_n = v \sum_n a_n$.`, porque: 'Se cancela el $-2$, y se separa la suma.' },
      { texto: R`Despejando, sale la fórmula. Y es un mínimo, porque el coste es una parábola que abre hacia arriba.`, porque: 'El coeficiente de $v^2$ es $\\sum_n a_n > 0$.' },
    ] },
    { tipo: 'nota', titulo: 'Sus límites', texto: 'Llega a un buen arreglo local, no necesariamente al mejor: depende de dónde empieza. Hay que elegir cuántos grupos quieres. Y los grados dicen «relativamente más cerca de este que de aquel», no «qué tan típico es»: un punto muy lejos de todo puede recibir 0,5 y 0,5.' },
  ],
  tecnicas: [
    { titulo: 'Alterna lo fácil', texto: 'Si mover todo a la vez es difícil, fija una parte y mueve la otra, por turnos. Si cada turno baja el coste, se avanza con seguridad.' },
    { titulo: 'Deriva e iguala a cero', texto: 'La forma estándar de buscar el mínimo de una parábola: donde deja de bajar y aún no sube, la inclinación es cero.' },
  ],
  retos: [
    { id: 'alas-difusas', tipo: 'manipular', enunciado: R`Sube $m$ hasta que el punto vecino, en $(2, 2)$, tenga menos de $0{,}75$ en su grupo principal.`, precision: (e) => (Math.max(...historia(e.m)[15].U[CERCANO]) < 0.75 ? 1 : 0), prueba: { m: 3.5 }, pendiente: (e) => `Ahora tiene ${Math.max(...historia(e.m)[15].U[CERCANO]).toFixed(2).replace('.', ',')}.`, pistas: ['Cuanto mayor es $m$, más se mezclan.'], explicacion: 'Con $m$ grande, los grados se acercan a repartirse por igual.' },
    { id: 'pertenencia-calc', tipo: 'calcular', enunciado: R`Con $m = 2$, un punto está a distancia $1$ de un centro, y a $2$ del otro. ¿Qué grado tiene en el primero?`, respuesta: 0.8, tol: 0.001, pistas: [R`Los pesos son $\frac{1}{1^2} = 1$ y $\frac{1}{2^2} = 0{,}25$. Reparte en proporción.`], explicacion: R`$\frac{1}{1 + 0{,}25} = 0{,}8$.` },
    { id: 'cmedias-elegir', tipo: 'elegir', enunciado: '¿Cuál es la diferencia con el agrupamiento clásico?', opciones: ['Que no necesita datos', 'Que cada punto reparte su grado entre los grupos, en vez de estar solo en uno', 'Que encuentra siempre el número de grupos', 'Que no tiene centros'], correcta: 1, explicacion: 'Los puntos ambiguos quedan marcados como tales: es información útil, no un error.' },
    { id: 'demuestra-centro', tipo: 'demostrar', enunciado: R`Demuestra que, si todos los grados son iguales, el centro es la media normal de los datos.`, pistas: ['Saca factor común en la fórmula del centro.'],
      solucion: [
        { texto: R`Con $a_n = a > 0$: $v = \dfrac{\sum_n a\, x_n}{\sum_n a} = \dfrac{a \sum_n x_n}{N a}$, siendo $N$ el número de datos.`, porque: 'Una constante sale de la suma, y sumar $N$ veces $a$ es $Na$.' },
        { texto: R`Se cancela $a$, y queda $\dfrac{1}{N} \sum_n x_n$.`, porque: 'Es la media aritmética. La media pesada es una generalización de la media de siempre.' },
      ] },
  ],
  referencias: ['J. C. Bezdek, <em>Pattern Recognition with Fuzzy Objective Function Algorithms</em>, 1981.', 'H.-J. Zimmermann, <em>Fuzzy Set Theory and Its Applications</em>, 4.ª ed., 2001, cap. 13.'],
};
