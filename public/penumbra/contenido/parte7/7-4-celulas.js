import { AZUL, BLANCO, GRIS2, ORO, TEXTO, escalaGrado } from '../../motor/colores.js';
import { sugeno } from '../../nucleo/sistemas.js';
import { linea, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { LIENZO } from '../parte4/matriz.js';

const R = String.raw;
const coma = (v) => v.toFixed(2).replace('.', '{,}');
const CONCEPTOS = [['dolor', 'dolor torácico opresivo'], ['sudor', 'está sudando'], ['edad', 'más de 65 años'], ['aire', 'le falta el aire'], ['trauma', 'traumatismo leve']];
const REGLAS = [
  { txt: 'dolor Y sudor', esi: 2, f: (c) => c.dolor * c.sudor },
  { txt: 'le falta el aire Y más de 65', esi: 2, f: (c) => c.aire * c.edad },
  { txt: 'NO dolor', esi: 4, f: (c) => 1 - c.dolor },
  { txt: 'traumatismo Y NO dolor', esi: 5, f: (c) => c.trauma * (1 - c.dolor) },
];
/** El nivel que sale, o null si ninguna regla se enciende: el sistema no tiene nada que decir. */
export const nivelCCD = (c) => (REGLAS.some((r) => r.f(c) > 1e-9) ? sugeno(REGLAS.map((r) => ({ fuerza: r.f(c), z: r.esi }))) : null);
const X_ESI = (v) => 800 + ((v - 1) / 4) * 250;

export default {
  id: '7-4-celulas',
  titulo: 'Tu propuesta: Células de Concepto Difusas',
  puente: 'Una capa de reglas que aprende de ejemplos. Falta aplicarle lo mismo a lo tuyo: tu péndulo todavía lleva números elegidos a mano.',
  pregunta: 'Una IA de urgencias que dice «nivel 2», sin explicar por qué, no sirve. Con todo lo que sabes ya, ¿cómo harías que mostrara su razonamiento? Es tu propuesta de investigación.',
  escena: {
    id: 'celulas', formato: 'plano', W: 1100, H: 560, ejes: LIENZO(1100, 560),
    entradas: [
      { id: 'dolor', tipo: 'deslizador', etiqueta: '¿dolor torácico opresivo?', min: 0, max: 1, paso: 0.01, valor: 0.9 },
      { id: 'sudor', tipo: 'deslizador', etiqueta: '¿está sudando?', min: 0, max: 1, paso: 0.01, valor: 0.7 },
      { id: 'edad', tipo: 'deslizador', etiqueta: '¿más de 65 años?', min: 0, max: 1, paso: 0.01, valor: 0.85 },
      { id: 'aire', tipo: 'deslizador', etiqueta: '¿le falta el aire?', min: 0, max: 1, paso: 0.01, valor: 0.2 },
      { id: 'trauma', tipo: 'deslizador', etiqueta: '¿traumatismo leve?', min: 0, max: 1, paso: 0.01, valor: 0.04 },
    ],
    pasos: [
      { dur: 2600, texto: 'Entra una nota de urgencias. Un modelo decisor no escribe nada: responde preguntas cerradas, con un porcentaje. <b style="color:#58c4dd;font-weight:400">Cada pregunta es una célula de concepto</b>, y ese porcentaje, lo fuerte que se enciende.' },
      { dur: 2800, texto: 'Esos porcentajes <b>ya son grados</b>. Entran en reglas que se pueden leer, con un «y» hecho con el producto: $0{,}9 \\cdot 0{,}7 = 0{,}63$.' },
      { dur: 2800, texto: 'Es un sistema de Sugeno: una media pesada de los niveles que piden las reglas. Sale <b style="color:#f4d345;font-weight:400">un nivel de urgencia, y su motivo</b>.' },
      { dur: 3600, texto: 'Lo mejor: <b>se puede preguntar qué cambiaría la decisión</b>. Si el dolor hubiera salido 0,3, las reglas se reordenan: la urgencia baja, es decir, el número sube. Un médico puede revisar justo eso.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), reg = ev(q(1), 0, 0.5), sal = ev(q(2), 0, 0.5), baja = paso === 3 ? ev(q(3), 0, 0.4) * (1 - ev(q(3), 0.65, 1)) : 0;
      const c = { ...e, dolor: mix(e.dolor, 0.3, baja) }, nivel = nivelCCD(c), F = REGLAS.map((r) => r.f(c)), mayor = F.indexOf(Math.max(...F)), N = [];
      N.push(rotulo([175, 30], R`\text{Preguntas a Jev: las células}`, { clave: 'tc', tam: 18, color: AZUL, alfa: al }));
      CONCEPTOS.forEach(([k, txt], i) => {
        const y = 66 + i * 86, v = c[k], a = ev(q(0), (i / 5) * 0.6, (i / 5) * 0.6 + 0.4);
        N.push(rotulo([30, y], R`\text{${txt}}`, { clave: `c${i}`, ancla: 'l', tam: 17, color: TEXTO, alfa: a }));
        N.push(poligono([[30, y + 16], [290, y + 16], [290, y + 34], [30, y + 34]], { color: [30, 34, 54], alfa: a }), poligono([[30, y + 16], [30 + 260 * v, y + 16], [30 + 260 * v, y + 34], [30, y + 34]], { color: AZUL, alfa: a }));
        N.push(rotulo([300, y + 25], coma(v), { clave: `v${i}`, ancla: 'l', tam: 17, alfa: a }));
      });
      N.push(rotulo([560, 30], R`\text{Reglas que se pueden leer}`, { clave: 'tr', tam: 18, color: ORO, alfa: reg }));
      REGLAS.forEach((r, i) => {
        const y = 80 + i * 100, v = F[i], a = reg, res = i === mayor && sal > 0;
        N.push(rotulo([400, y], R`\text{si ${r.txt}}`, { clave: `r${i}`, ancla: 'l', tam: 17, alfa: a }), rotulo([400, y + 26], R`\Rightarrow\ \text{ESI ${r.esi}}`, { clave: `rs${i}`, ancla: 'l', tam: 17, color: GRIS2, alfa: a }));
        N.push(poligono([[540, y + 16], [720, y + 16], [720, y + 34], [540, y + 34]], { color: [30, 34, 54], alfa: a }), poligono([[540, y + 16], [540 + 180 * v, y + 16], [540 + 180 * v, y + 34], [540, y + 34]], { color: res ? ORO : escalaGrado(v), alfa: a }));
        N.push(rotulo([726, y + 25], coma(v), { clave: `f${i}`, ancla: 'l', tam: 17, color: res ? ORO : BLANCO, alfa: a }));
      });
      N.push(rotulo([925, 30], R`\text{El nivel de urgencia}`, { clave: 'te', tam: 18, color: ORO, alfa: sal }));
      for (let n = 1; n <= 5; n++) N.push(punto([X_ESI(n), 200], { color: GRIS2, radio: 5, alfa: sal, halo: 0 }), rotulo([X_ESI(n), 200], String(n), { clave: `e${n}`, dy: 24, tam: 18, color: GRIS2, alfa: sal }));
      N.push(linea([X_ESI(1), 200], [X_ESI(5), 200], { color: GRIS2, ancho: 1.6, alfa: sal }));
      if (nivel !== null) N.push(punto([X_ESI(nivel), 200], { color: ORO, radio: 11, alfa: sal }));
      N.push(rotulo([X_ESI(1), 200], R`\text{muy urgente}`, { clave: 'e-a', dy: 48, tam: 13, color: GRIS2, alfa: sal }), rotulo([X_ESI(5), 200], R`\text{no urgente}`, { clave: 'e-b', dy: 48, tam: 13, color: GRIS2, alfa: sal }));
      N.push(rotulo([925, 130], nivel === null ? R`\text{Ninguna regla}` : R`\text{ESI } {\color{#f4d345}${coma(nivel)}}`, { clave: 'n', tam: 32, alfa: sal }));
      N.push(rotulo([925, 300], R`\text{Motivo: si ${REGLAS[mayor].txt}}`, { clave: 'mot', tam: 15, alfa: sal }), rotulo([925, 330], R`\text{con fuerza } ${coma(F[mayor])}`, { clave: 'mot2', tam: 15, color: GRIS2, alfa: sal }));
      N.push(rotulo([550, 530], R`\text{Reglas de ejemplo, escritas a mano para esta animación. No es un resultado clínico.}`, { clave: 'av', tam: 14, color: GRIS2, alfa: reg }));
      return N;
    },
  },
  manipulacion: '<ul><li>Baja el dolor torácico: mira qué regla pasa a mandar, y cómo cambia el motivo.</li><li>Sube «le falta el aire»: otra regla toma el relevo, y el nivel se mantiene.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Tu propuesta, Células de Concepto Difusas, junta todo lo de esta región. Un modelo decisor, Jev, contesta preguntas concretas sobre la nota de un paciente de urgencias. El resultado es un nivel de la escala [[ESI]], de 1, lo más urgente, a 5. Cada pregunta es una neurona con significado. Y una capa de reglas difusas entrenable, de Sugeno, decide. El resultado se explica: no solo dice el nivel, sino por qué, y qué lo cambiaría.' },
    { tipo: 'ejemplo', texto: 'Con estas reglas de ejemplo, y las respuestas de la animación:', tabla: [['Regla', 'Fuerza', 'Pide'], ['Dolor Y sudor', '0,9 · 0,7 = 0,63', 'ESI 2'], ['Falta aire Y más de 65', '0,2 · 0,85 = 0,17', 'ESI 2'], ['NO dolor', '1 − 0,9 = 0,10', 'ESI 4'], ['Traumatismo Y NO dolor', '0,04 · 0,1 = 0,004', 'ESI 5']], cierre: 'Media pesada: unos 2,23. Nivel 2, con motivo: la primera regla.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`c_k \in [0, 1]`, dice: 'Cuánto se enciende el concepto $k$: la probabilidad calibrada que da Jev, usada como grado.' },
      { tex: R`w_r = \prod_k c_k`, dice: 'La fuerza de la regla $r$: el producto de sus condiciones. $\\prod$ es como $\\sum$, pero multiplica. Las condiciones negadas entran como $1 - c_k$.' },
      { tex: R`z_r`, dice: 'El nivel que recomienda esa regla.' },
    ], todo: R`\hat{y} = \frac{\sum_r w_r z_r}{\sum_r w_r}`, lee: 'Es el sistema de Sugeno que ya conoces: el mismo que se entrena con [[gradiente]] en ANFIS. Solo que aquí los grados vienen de un modelo que lee texto.' },
    { tipo: 'formal', titulo: 'Qué se entrena y qué no', tex: R`Jev no se entrena: se usa tal cual, y sus respuestas se guardan en una tabla. Lo que se aprende, sobre esa tabla, son las reglas: qué conceptos entran en cada una, con qué signo, y qué nivel recomienda. Infra-triar, dar un nivel menos urgente que el real, cuesta más en el entrenamiento que sobre-triar.`, lee: 'Es una propuesta de investigación: todavía no hay resultados experimentales. El plan es compararla con el algoritmo oficial de triaje, con la misma capa sobre un LLM, y con una suma lineal en vez de reglas.' },
    { tipo: 'demo', titulo: 'Por qué el producto, y no el mínimo', plan: 'Para entrenar hacen falta [[derivadas|derivada]]. Comparamos qué le dice cada «y» a cada una de sus entradas.', tex: R`Con $0 < a < b$: la derivada de $\min(a, b)$ respecto a $b$ es 0; la de $a \cdot b$ respecto a $b$ es $a > 0$.`, pasos: [
      { texto: R`Si $a < b$, entonces $\min(a, b) = a$ en una zona alrededor de $b$, que no depende de $b$. Su derivada respecto a $b$ es 0.`, porque: 'Mover un poco $b$ no cambia el mínimo.' },
      { texto: R`En cambio, la derivada de $a \cdot b$ respecto a $b$ es $a$, positiva.`, porque: 'La derivada de $b$ multiplicado por una constante.' },
      { texto: R`Con el mínimo, el gradiente no llega a la condición mayor: esa entrada no aprende. Con el producto, llegan las dos.`, porque: 'El ajuste es proporcional a la derivada. Por eso, las capas difusas entrenables prefieren el producto.' },
    ] },
    { tipo: 'nota', titulo: 'Sin engañarse', texto: 'Las células de concepto son una inspiración, no una simulación del cerebro. Casi todo lo que se sabe de Jev lo dice su fabricante, por eso la propuesta incluye medirlo. Y que unas reglas sean legibles no garantiza que sean correctas: están para que una persona pueda encontrar los errores. Un sistema así no reemplaza a ningún profesional sanitario.' },
  ],
  tecnicas: [
    { titulo: 'Elige las piezas por lo que permiten', texto: 'El producto no se elige por ser más cierto, sino porque permite aprender. Una decisión técnica se justifica por lo que hace posible.' },
    { titulo: 'Pregunta qué cambiaría', texto: 'Una explicación útil no solo dice por qué, también qué habría cambiado la decisión. Se llama explicación contrafactual.' },
  ],
  retos: [
    { id: 'que-cambia', tipo: 'manipular', enunciado: R`Baja una sola respuesta, la del dolor, hasta que el número de nivel llegue a $3$: menos urgente. ¿Cuánto hace falta?`, precision: (e) => ((nivelCCD(e) ?? 0) >= 3 ? 1 : 0), prueba: { dolor: 0.3 }, pendiente: (e) => (nivelCCD(e) === null ? 'Ahora no se enciende ninguna regla.' : `Ahora, el nivel es ${nivelCCD(e).toFixed(2).replace('.', ',')}.`), pistas: ['Mira qué regla manda en cada momento.'], explicacion: 'Eso es una explicación contrafactual: «si esto hubiera sido distinto, la decisión también».' },
    { id: 'regla-ccd-calc', tipo: 'calcular', enunciado: R`Una regla pide $a$ Y NO $b$. Si $a = 0{,}8$ y $b = 0{,}25$, ¿con qué fuerza se dispara, con el producto?`, respuesta: 0.6, tol: 0.001, pistas: [R`NO $b$ vale $1 - 0{,}25$.`], explicacion: R`$0{,}8 \cdot 0{,}75 = 0{,}6$.` },
    { id: 'ccd-elegir', tipo: 'elegir', enunciado: 'En esta propuesta, ¿qué parte se entrena?', opciones: ['Jev, el modelo que lee la nota', 'La capa de reglas difusas', 'Las dos a la vez', 'Ninguna: las reglas las escribe un médico'], correcta: 1, explicacion: 'Jev se usa tal cual: lo que se aprende, a partir de ejemplos, son las reglas.' },
    { id: 'demuestra-producto', tipo: 'demostrar', enunciado: R`Demuestra que, en $[0, 1]$, el producto nunca supera al mínimo: $a \cdot b \le \min(a, b)$.`, pistas: ['Como $b \\le 1$, ¿qué pasa al multiplicar $a$ por $b$?'],
      solucion: [
        { texto: R`Como $b \le 1$ y $a \ge 0$: $a b \le a$.`, porque: 'Multiplicar por algo no negativo conserva el orden.' },
        { texto: R`Igualmente, $a b \le b$.`, porque: 'El mismo razonamiento, con los papeles cambiados.' },
        { texto: R`Si no supera a ninguno de los dos, no supera al menor.`, porque: 'Por eso, una regla con producto es más exigente: cada condición nueva resta fuerza.' },
      ] },
  ],
  referencias: ['L. Albert, B. Quintana Hernández, <em>Células de Concepto Difusas</em>, propuesta de investigación, Universidad de La Habana, 2026.', 'R. Quian Quiroga et al., «Invariant visual representation by single neurons in the human brain», <em>Nature</em> 435 (2005).', 'P. W. Koh et al., «Concept bottleneck models», <em>ICML</em> (2020).'],
};
