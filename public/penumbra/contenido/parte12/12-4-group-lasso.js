import { AZUL, BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { NOMBRES_CCD, proxGrupo } from '../../nucleo/ia.js';
import { curva, marco, poligono, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { coma, flecha } from '../parte9/comun.js';
import { CAMINO } from './caminoCCD.js';

const R = String.raw;
const Z1 = [1.1, 0.75], Z2 = [-0.42, 0.3], radio = (l) => 1.6 * (CAMINO[l].lambda / 0.08);

export default {
  id: '12-4-group-lasso',
  titulo: 'Group lasso: quedarse con pocas preguntas',
  puente: 'Quedan pocos conceptos, y con números cercanos a 0 o a 1. Ya casi se puede leer. Falta el último paso: convertirlo en frases, y comprobar si dicen lo mismo que el modelo.',
  pregunta: 'Una regla con seis conceptos no se lee. Si un concepto no sirve, querríamos borrarlo de todas las reglas a la vez, no de una en una. ¿Se puede pedir eso con una simple suma en la pérdida?',
  escena: {
    id: 'group-lasso', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [-1.6, 1.6], y: [-1.6, 1.6], caja: { x: 70, y: 60, w: 400, h: 400 } },
    entradas: [{ id: 'l', tipo: 'deslizador', etiqueta: 'presión λ (posición en la lista)', min: 0, max: CAMINO.length - 1, paso: 1, valor: 0 }],
    pasos: [
      { dur: 2800, texto: 'Dos columnas de relevancias, dibujadas como vectores: una <b style="color:#58c4dd;font-weight:400">grande</b> y otra <b style="color:#fc6282;font-weight:400">pequeña</b>. Su longitud mide cuánto se usa ese concepto en todas las reglas.' },
      { dur: 3400, texto: 'La presión $\\lambda$ dibuja un círculo. A cada vector se le <b>resta esa longitud</b>, sin cambiar su dirección. En <b style="color:#f4d345;font-weight:400">oro</b>, lo que queda.' },
      { dur: 3000, texto: 'Si el vector cabe en el círculo, lo que queda es <b>exactamente cero</b>. No casi cero: cero. El concepto muere, en todas las reglas a la vez.' },
      { dur: 3600, texto: 'A la derecha, entrenado de verdad con 240 casos de juguete. Cada columna es un concepto. Al subir la presión, las columnas se apagan, y mira qué poco baja el acierto hasta llegar a tres.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0, r = paso === 0 ? 0 : paso === 1 ? mix(0, 0.5, ev(q(1), 0.1, 0.9)) : paso === 2 ? mix(0.5, 0.75, ev(q(2), 0, 0.7)) : mix(0.75, radio(Math.max(Math.round(e.l), Math.round(Math.max(ev(q(3), 0.12, 0.6) * (1 - ev(q(3), 0.72, 0.94)), 0) * 7))), ev(q(3), 0, 0.12));
      const A = [marco({ x: [-1.6, 1.6], y: [-1.6, 1.6] }, { alfa: al, ticks: { x: [], y: [] } })];
      if (r > 1e-3) A.push(curva((t) => [r * Math.cos(t), r * Math.sin(t)], [0, 6.2832], { n: 90, color: BLANCO, ancho: 1.6, alfa: 0.8 * al }));
      const p1 = proxGrupo(Z1, r), p2 = proxGrupo(Z2, r);
      A.push(...flecha([0, 0], Z1, { color: AZUL, alfa: 0.55 * al }), ...flecha([0, 0], Z2, { color: [252, 98, 130], alfa: 0.55 * al }));
      if (Math.hypot(...p1) > 0) A.push(...flecha([0, 0], p1, { color: ORO, alfa: al, ancho: 3.4 }));
      if (Math.hypot(...p2) > 0) A.push(...flecha([0, 0], p2, { color: ORO, alfa: al, ancho: 3.4 })); else if (r > 0) A.push(punto(Z2, { color: ROJO, radio: 8, alfa: al }), rotulo(Z2, R`\text{muere}`, { clave: 'mu', dy: -18, tam: 17, color: ROJO, alfa: al }));
      const barrido = paso === 3 ? Math.max(ev(q(3), 0.12, 0.6) * (1 - ev(q(3), 0.72, 0.94)), 0) : 0, l = Math.max(Math.round(e.l), Math.round(barrido * 7)), C = CAMINO[l], R0 = C.m.length, K = NOMBRES_CCD.length, M = [];
      if (g3 > 0) {
        C.m.forEach((f, ri) => f.forEach((v, k) => { const X = k, Y = R0 - 1 - ri; M.push(poligono([[X + 0.05, Y + 0.05], [X + 0.95, Y + 0.05], [X + 0.95, Y + 0.95], [X + 0.05, Y + 0.95]], { color: v > 0 ? ORO : BLANCO, alfa: g3 * (v > 0 ? 0.15 + 0.8 * v : 0.05) }), rotulo([X + 0.5, Y + 0.5], v > 0 ? coma(v) : '0', { clave: `m${ri}${k}`, tam: 13, color: v > 0.45 ? [20, 20, 31] : BLANCO, alfa: g3 * (v > 0 ? 1 : 0.35) })); }));
        NOMBRES_CCD.forEach((n, k) => M.push(rotulo([k + 0.5, 0], R`\text{${n.split(' ')[0]}}`, { clave: `k${k}`, dy: 15, tam: 12, color: GRIS2, alfa: g3 })));
        M.push(rotulo([3, R0], R`\lambda = ${coma(C.lambda, 3)}\quad \text{activos: } ${C.activos}\quad \text{acierto: } ${coma(C.exactitud)}`, { clave: 'res', dy: -22, tam: 17, color: ORO, alfa: g3 }));
      }
      return { principal: A, paneles: [{ ejes: { x: [0, K], y: [0, R0], caja: { x: 560, y: 150, w: 480, h: 220 } }, prims: M }] };
    },
  },
  manipulacion: '<ul><li>Mueve la presión, y cuenta cuántas columnas siguen vivas.</li><li>A la izquierda, fíjate en que el vector pequeño muere antes.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Se suma a la pérdida la longitud de cada columna de relevancias. Una penalización sobre el cuadrado solo encogería: todo se haría pequeño, y nada llegaría a cero. La longitud, que no está elevada al cuadrado, tiene una punta en cero, y por eso los vectores se quedan clavados ahí. Y como se mide la columna entera, el concepto se apaga en todas las reglas a la vez.' },
    { tipo: 'ejemplo', texto: 'Lo que pasó al entrenar, en esta misma escena:', tabla: [['λ', 'Conceptos activos', 'Acierto'], ...CAMINO.filter((_, i) => [0, 4, 6, 7].includes(i)).map((c) => [String(c.lambda).replace('.', ','), String(c.activos), String(c.exactitud).replace('.', ',')])], cierre: 'Con la mitad de conceptos, casi lo mismo. Y con cero, el acierto de responder siempre lo más común. Son datos de juguete: en los reales habrá que medirlo.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`m_{\cdot k}`, dice: 'La columna del concepto $k$: su relevancia en todas las reglas. El punto significa «todas las filas».' },
      { tex: R`\|z\|`, dice: 'La longitud del vector $z$: la raíz de la suma de cuadrados.' },
      { tex: R`\lambda`, dice: 'La presión: cuánto cuesta usar un concepto.' },
    ], todo: R`\mathrm{prox}(z) = \max\left(0,\ 1 - \frac{\lambda}{\|z\|}\right) z`, lee: '«Se le resta $\\lambda$ a la longitud, sin cambiar la dirección; y si no llega, cero».' },
    { tipo: 'formal', titulo: 'Group lasso (Yuan y Lin, 2006)', tex: R`Se minimiza $L(m) + \lambda \sum_k \|m_{\cdot k}\|$. Como esa suma no es derivable en cero, cada paso de gradiente sobre $L$ va seguido del operador $\mathrm{prox}$, aplicado a cada columna. A esto se le llama gradiente proximal.`, lee: 'Es lo que hace nuestro entrenamiento. Sin grupos, sería el lasso, que apagaría números sueltos: el concepto seguiría en alguna regla.' },
    { tipo: 'demo', titulo: 'De dónde sale esa fórmula', plan: 'Hay que minimizar $\\frac{1}{2}\\|v - z\\|^2 + \\lambda \\|v\\|$. Primero se ve que $v$ apunta como $z$; luego queda un problema de una sola variable.', tex: R`El mínimo de $\frac{1}{2}\|v - z\|^2 + \lambda\|v\|$ es $v = \max\left(0,\ 1 - \frac{\lambda}{\|z\|}\right) z$.`, pasos: [
      { texto: R`Fijada la longitud de $v$, $\lambda \|v\|$ no cambia, y $\|v - z\|$ es mínima si $v$ apunta como $z$.`, porque: 'De todos los puntos de un círculo, el más cercano a $z$ es el de su misma dirección. Luego $v = t \\frac{z}{\\|z\\|}$, con $t \\ge 0$.' },
      { texto: R`Queda minimizar $h(t) = \frac{1}{2}(t - \|z\|)^2 + \lambda t$, con $t \ge 0$.`, porque: 'Se sustituye, y las longitudes se restan por ir en la misma dirección.' },
      { texto: R`$h'(t) = t - \|z\| + \lambda = 0$ da $t = \|z\| - \lambda$.`, porque: 'Es una parábola: tiene un solo mínimo.' },
      { texto: R`Si $\|z\| \le \lambda$, ese $t$ no es positivo. $h$ crece en todo $t > 0$, y el mínimo está en $t = 0$.`, porque: 'Aquí está el cero exacto. Juntando los dos casos, sale la fórmula.' },
    ] },
    { tipo: 'nota', titulo: 'Y otro empujón más', texto: 'Se puede sumar también $\\gamma \\sum m(1 - m)$. Ese término vale 0 solo si $m$ es 0 o 1, de modo que empuja cada relevancia a decidirse. Sirve para que, al redondear, no cambie casi nada: lo veremos en la siguiente parada. Aquí $\\gamma$ es la letra griega «gamma», otro peso.' },
  ],
  tecnicas: [{ titulo: 'Sin cuadrado, hay ceros', texto: 'Una penalización con punta en cero produce ceros exactos. Una suave, solo números pequeños. Es la razón de usar la longitud, y no su cuadrado.' }],
  retos: [
    { id: 'tres-activos', tipo: 'manipular', enunciado: R`Sube la presión hasta que queden exactamente $3$ conceptos activos.`, precision: (e) => (CAMINO[Math.round(e.l)].activos === 3 ? 1 : 0), prueba: { l: 5 }, pendiente: (e) => `Ahora hay ${CAMINO[Math.round(e.l)].activos} activos.`, pistas: ['Mira la cuenta en la parte de arriba de la tabla.'], explicacion: 'Tres conceptos dan casi el mismo acierto que seis.' },
    { id: 'prox-calc', tipo: 'calcular', enunciado: R`Con $z = (3, 4)$ y $\lambda = 2$, ¿qué longitud tiene el resultado?`, respuesta: 3, tol: 0.001, pistas: [R`$\|z\| = 5$.`], explicacion: R`$5 - 2 = 3$.` },
    { id: 'lasso-elegir', tipo: 'elegir', enunciado: '¿Por qué agrupar por columnas, y no penalizar cada número por separado?', opciones: ['Porque es más rápido', 'Porque así el concepto desaparece de todas las reglas a la vez', 'Porque si no, no es derivable', 'Porque da más acierto'], correcta: 1, explicacion: 'Lo que cuesta leer y medir es cada concepto. Si sigue en una regla, sigue costando.' },
    { id: 'demuestra-prox', tipo: 'demostrar', enunciado: R`Demuestra que, si $\|z\| > \lambda$, el resultado del operador tiene longitud $\|z\| - \lambda$.`, pistas: ['Saca el factor del paréntesis, que es positivo.'], solucion: [{ texto: R`Con $\|z\| > \lambda$, el factor $k = 1 - \frac{\lambda}{\|z\|}$ es positivo, y $\|k z\| = k \|z\|$.`, porque: 'Multiplicar por un positivo multiplica la longitud.' }, { texto: R`Y $k \|z\| = \|z\| - \lambda$.`, porque: 'Se reparte el producto.' }] },
  ],
  referencias: ['M. Yuan, Y. Lin, «Model selection and estimation in regression with grouped variables», <em>J. R. Statist. Soc. B</em> 68 (2006).'],
};
