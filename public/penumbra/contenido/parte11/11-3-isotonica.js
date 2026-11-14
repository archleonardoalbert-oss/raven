import { AZUL, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { pavPasos } from '../../nucleo/ia.js';
import { linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { coma, tramo } from '../parte9/comun.js';

const R = String.raw;
const Y = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1], N_ = Y.length, PASOS = pavPasos(Y), U = PASOS.length - 1;
const violan = (b) => { const r = []; for (let i = 0; i + 1 < b.length; i++) if (b[i].s / b[i].n > b[i + 1].s / b[i + 1].n + 1e-12) r.push(i); return r; };

export default {
  id: '11-3-isotonica',
  titulo: 'Regresión isotónica',
  puente: 'Ya sabes calibrar un número. Toca conectarlo: ¿de dónde sale ese número cuando lo que tienes delante es un texto?',
  pregunta: 'Si el modelo se equivoca de una forma rara, un solo número no lo arregla. ¿Se puede corregir suponiendo solo esto: «a mayor puntuación, no menos probable»? Sí, y el algoritmo es casi un juego.',
  escena: {
    id: 'isotonica', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [-0.5, N_ - 0.5], y: [-0.05, 1.05], caja: { x: 90, y: 60, w: 920, h: 390 } },
    entradas: [{ id: 'k', tipo: 'deslizador', etiqueta: 'fusiones', min: 0, max: U, paso: 1, valor: U }],
    pasos: [
      { dur: 2800, texto: 'Dieciséis casos, ordenados por la puntuación del modelo: a la izquierda, los más bajos. Cada punto está arriba si fue un «sí», abajo si fue un «no».' },
      { dur: 3000, texto: 'Queremos una curva que nunca baje. Empezamos con un bloque por caso. <b style="color:#f05a5a;font-weight:400">En rojo</b>, donde un bloque está más alto que el siguiente: una violación.' },
      { dur: 6000, texto: 'La regla: <b>dos vecinos que violan el orden se funden en su media</b>. Y se vuelve a mirar hacia atrás, por si la fusión ha creado otra violación.' },
      { dur: 3000, texto: 'Fin: una escalera que <b style="color:#f4d345;font-weight:400">nunca baja</b>. Ese es el mapa $\\varphi$ que convierte puntuación en grado calibrado. Y no se ha supuesto ninguna fórmula.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.4) : 0, k = paso <= 1 ? 0 : paso === 2 ? Math.round(ev(q(2), 0.03, 0.95) * U) : Math.round(e.k), B = PASOS[k], vio = new Set(violan(B));
      const P = [marco({ x: [-0.5, N_ - 0.5], y: [-0.05, 1.05] }, { alfa: al, ticks: { x: [], y: [0, 0.5, 1] }, etiquetas: { x: R`\text{puntuación del modelo: de menor a mayor}` } })];
      Y.forEach((y, i) => P.push(punto([i, y], { color: y ? ORO : AZUL, radio: 6, alfa: al * ev(q(0), i / 32, i / 32 + 0.4) })));
      B.forEach((b, i) => { const v = b.s / b.n, mal = vio.has(i) || vio.has(i - 1); P.push(...tramo([b.de - 0.42, v], [b.a + 0.42, v], { color: mal ? ROJO : ORO, ancho: b.n > 1 ? 4 : 2.6, alfa: g1 })); if (b.n > 1) P.push(rotulo([(b.de + b.a) / 2, v], coma(v), { clave: `b${b.de}`, dy: -16, tam: 16, color: ORO, alfa: g1 })); });
      for (let i = 0; i + 1 < B.length; i++) { const a = B[i].s / B[i].n, c = B[i + 1].s / B[i + 1].n; P.push(linea([B[i].a + 0.42, a], [B[i + 1].de - 0.42, c], { color: vio.has(i) ? ROJO : GRIS2, ancho: 1.2, alfa: 0.6 * g1 })); }
      P.push(rotulo([N_ - 0.5, 1.05], R`\text{${B.length} bloques, ${vio.size} violaciones}`, { clave: 'n', ancla: 'r', dy: -18, tam: 19, alfa: g1 }));
      return P;
    },
  },
  manipulacion: '<ul><li>Mueve las fusiones hacia atrás, y sigue cada bloque: los rojos desaparecen de uno en uno.</li><li>Fíjate en cómo una fusión a veces provoca otra justo a su izquierda.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Solo se supone una cosa: si la puntuación sube, la probabilidad real no baja. La regresión isotónica busca la curva más cercana a los datos que respete eso, y nada más. Es la aplicación $\\mu = \\varphi(a)$: toma la puntuación $a$ de un modelo de lenguaje, con $a = \\frac{e^{\\ell_{\\text{Sí}}}}{e^{\\ell_{\\text{Sí}}} + e^{\\ell_{\\text{No}}}}$, y devuelve un grado en el que confiar.' },
    { tipo: 'ejemplo', texto: 'Con los resultados $1, 0, 1, 1$, por orden de puntuación:', tabla: [['Paso', 'Bloques', '¿Qué pasa?'], ['Inicio', '1 | 0 | 1 | 1', '1 > 0: violación'], ['Fundir los dos primeros', '0,5 0,5 | 1 | 1', 'Ya no baja: fin']], cierre: R`Sale $\varphi = (0{,}5;\ 0{,}5;\ 1;\ 1)$.` },
    { tipo: 'simbolos', piezas: [
      { tex: R`y_i`, dice: 'El resultado del caso $i$: 1 si fue un «sí», 0 si fue un «no». Los casos van ordenados por puntuación.' },
      { tex: R`\varphi_i`, dice: 'El grado calibrado que se asigna a ese caso.' },
      { tex: R`\varphi_1 \le \varphi_2 \le \dots \le \varphi_n`, dice: 'La condición: la curva nunca baja. Eso significa «isotónica».' },
    ], todo: R`\min_{\varphi_1 \le \dots \le \varphi_n} \sum_{i = 1}^n (y_i - \varphi_i)^2`, lee: '«De entre todas las curvas que nunca bajan, la que menos se separa de los datos». El algoritmo PAV da el óptimo exacto.' },
    { tipo: 'formal', titulo: 'Pool Adjacent Violators', tex: R`Parte de bloques de un caso. Mientras dos bloques vecinos tengan medias $\bar{y}_i > \bar{y}_{i + 1}$, fúndelos, con la media ponderada por su tamaño. El resultado resuelve el problema de mínimos cuadrados con esa restricción, en un número de fusiones menor que $n$.`, lee: 'Zadrozny y Elkan (2002) lo usaron para calibrar clasificadores. Comparado con la temperatura, es más flexible, y por eso necesita más datos para no ajustarse al ruido.' },
    { tipo: 'demo', titulo: 'Por qué se funden en la media', plan: 'El caso más pequeño posible explica toda la regla: dos valores en el orden equivocado.', tex: R`Si $a > b$, el mínimo de $(a - f_1)^2 + (b - f_2)^2$ con $f_1 \le f_2$ está en $f_1 = f_2 = \frac{a + b}{2}$.`, pasos: [
      { texto: R`Supón un óptimo con $f_1 < f_2$. Entonces se puede mover cada uno un poco sin romper la condición, luego cada sumando está en su mínimo: $f_1 = a$ y $f_2 = b$.`, porque: 'Si la condición no aprieta, cada variable va a su sitio por separado.' },
      { texto: R`Pero eso daría $f_1 = a > b = f_2$, lo contrario de lo supuesto. Por tanto, en el óptimo $f_1 = f_2 = f$.`, porque: 'Contradicción: la condición tiene que apretar.' },
      { texto: R`Queda minimizar $(a - f)^2 + (b - f)^2$. Derivando: $-2(a - f) - 2(b - f) = 0$, es decir, $f = \frac{a + b}{2}$.`, porque: 'La media es lo que minimiza la suma de cuadrados.' },
    ] },
    { tipo: 'nota', titulo: 'En una sola palabra', texto: 'La temperatura supone una forma y necesita pocos datos. La isotónica no supone la forma y necesita más. Si tienes pocos ejemplos etiquetados, empieza por la temperatura.' },
  ],
  tecnicas: [{ titulo: 'Resuelve primero el caso de dos', texto: 'Muchos algoritmos con restricciones se entienden mirando dos variables. Lo que pasa con dos suele ser la regla que se aplica una y otra vez.' }],
  retos: [
    { id: 'doce-bloques', tipo: 'manipular', enunciado: R`Busca el momento exacto en que quedan $12$ bloques.`, precision: (e) => (PASOS[Math.round(e.k)].length === 12 ? 1 : 0), prueba: { k: PASOS.findIndex((b) => b.length === 12) }, pendiente: (e) => `Ahora hay ${PASOS[Math.round(e.k)].length} bloques.`, pistas: ['Cada fusión quita un bloque.'], explicacion: R`Se empieza con 16: hacen falta 4 fusiones.` },
    { id: 'pav-calc', tipo: 'calcular', enunciado: R`Con los resultados $0, 1, 0$, ¿qué grado da PAV al último caso?`, respuesta: 0.5, tol: 0.001, pistas: ['Solo los dos últimos violan el orden.'], explicacion: R`Se funden $1$ y $0$ en $0{,}5$. Queda $(0;\ 0{,}5;\ 0{,}5)$.` },
    { id: 'iso-elegir', tipo: 'elegir', enunciado: 'Tienes 40 ejemplos etiquetados para calibrar. ¿Qué eliges?', opciones: ['Isotónica, siempre', 'Temperatura: un solo parámetro aprende bien con pocos datos', 'Ninguna', 'La que dé más exactitud, porque la cambia'], correcta: 1, explicacion: 'Con pocos datos, cuanto menos haya que aprender, mejor.' },
    { id: 'demuestra-entre', tipo: 'demostrar', enunciado: R`Demuestra que la media ponderada de dos bloques queda entre sus dos medias.`, pistas: [R`Escríbela como $t\,a + (1 - t)\,b$.`], solucion: [{ texto: R`Con tamaños $n_1, n_2$, la media es $\frac{n_1 a + n_2 b}{n_1 + n_2} = t\,a + (1 - t)\,b$, con $t = \frac{n_1}{n_1 + n_2} \in (0, 1)$.`, porque: 'Se reparte la fracción.' }, { texto: R`Si $b < a$, entonces $b = t b + (1 - t) b < t a + (1 - t) b < t a + (1 - t) a = a$.`, porque: 'Se cambia un solo término cada vez. Por eso una fusión baja el de la izquierda y sube el de la derecha.' }] },
  ],
  referencias: ['B. Zadrozny, C. Elkan, «Transforming classifier scores into accurate multiclass probability estimates», <em>KDD</em> (2002).', 'M. Ayer et al., «An empirical distribution function for sampling with incomplete information», <em>Ann. Math. Statist.</em> 26 (1955).'],
};
