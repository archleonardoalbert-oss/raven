import { AZUL, BLANCO, GRIS2, ORO, ROJO } from '../../motor/colores.js';
import { binsCalibracion, ece, muestraCalibracion, sigma } from '../../nucleo/ia.js';
import { curva, linea, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { barra, coma } from '../parte9/comun.js';

const R = String.raw;
// el modelo de juguete exagera: dice σ(3 z) cuando la verdad es σ(z)
const EXAGERA = 3, Y = muestraCalibracion.map((m) => m.y), dice = (T) => muestraCalibracion.map((m) => sigma((EXAGERA * m.logit) / T));
const TS = Array.from({ length: 61 }, (_, i) => 0.5 + (i / 60) * 5.5), ECES = TS.map((T) => ece(dice(T), Y));
const eceDe = (T) => { const u = Math.min(59.999, Math.max(0, ((T - 0.5) / 5.5) * 60)), i = Math.floor(u); return ECES[i] + (ECES[i + 1] - ECES[i]) * (u - i); };
const exactitud = muestraCalibracion.filter((m) => (m.logit > 0 ? 1 : 0) === m.y).length / muestraCalibracion.length;

export default {
  id: '11-2-calibrar',
  titulo: 'Calibrar: decir la verdad sobre tu duda',
  puente: 'Un solo número $T$ corrige bien cuando el error es igual en todas partes. Si la forma del error es más rara, hace falta una herramienta más flexible.',
  pregunta: 'Cuando este modelo dice «90 %», ¿acierta nueve de cada diez veces? Hay una gráfica que lo muestra de un vistazo, y un arreglo tan simple que parece trampa.',
  escena: {
    id: 'calibrar', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 1], y: [0, 1], caja: { x: 70, y: 60, w: 420, h: 420 } },
    entradas: [{ id: 'T', tipo: 'deslizador', etiqueta: 'temperatura T', min: 0.5, max: 6, paso: 0.05, valor: 1 }],
    pasos: [
      { dur: 3000, texto: 'Se agrupan los casos según lo que dijo el modelo. Cada barra mide <b>cuántos eran de verdad un «sí»</b> en ese grupo. Sobre datos de juguete, 600 casos.' },
      { dur: 3000, texto: 'Si el modelo fuera sincero, cada barra llegaría justo a la <b>diagonal</b>. Y no: en rojo, lo que le falta. Cuando dice 90 %, acierta mucho menos. <b style="color:#f05a5a;font-weight:400">Se pasa de seguro.</b>' },
      { dur: 3600, texto: 'El arreglo: divide sus [[logits|logit]] por un solo número, la <b>temperatura</b>. Sube $T$, y las barras se acercan a la diagonal. A la derecha, el error de calibración se hunde.' },
      { dur: 3000, texto: 'Mira la exactitud: <b>no ha cambiado nada</b>. Dividir por $T$ no cambia lo que decide; solo cambia cuánto presume. Ahora te toca: el modelo vuelve a su estado original.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.4) : 0, T = paso <= 1 ? 1 : paso === 2 ? mix(1, 3, ev(q(2), 0.1, 0.9)) : mix(3, e.T, ev(q(3), 0.45, 0.85));
      const p = dice(T), B = binsCalibracion(p, Y), N = [marco({ x: [0, 1], y: [0, 1] }, { alfa: al, ticks: { x: [0, 1], y: [0, 0.5, 1] }, etiquetas: { x: R`\text{lo que dijo}`, y: R`\text{lo que pasó}` } })];
      B.forEach((b, m) => { if (!b.n) return; const a0 = m / 10 + 0.008, a1 = (m + 1) / 10 - 0.008, h = b.acc * ev(q(0), m / 20, m / 20 + 0.5), c = (m + 0.5) / 10; N.push(barra(a0, a1, h, { color: AZUL, alfa: 0.75 * al })); if (g1 > 0) N.push(barra(a0, a1, Math.max(c, h), { color: ROJO, alfa: 0.45 * g1 }, Math.min(c, h))); });
      N.push(linea([0, 0], [1, 1], { color: BLANCO, ancho: 1.6, alfa: 0.7 * g1, discontinua: true }));
      const E = eceDe(T), G = [marco({ x: [0.5, 6], y: [0, 0.3] }, { alfa: g2, ticks: { x: [1, 3, 6], y: [0, 0.3] }, etiquetas: { x: 'T', y: R`\text{error de calibración}` } })];
      if (g2 > 0) G.push(curva((t) => [t, eceDe(t)], [0.5, 6], { n: 80, color: ROJO, ancho: 2.6, alfa: g2 }), punto([T, E], { color: ORO, radio: 7, alfa: g2 }));
      const L = [rotulo([0, 1], R`T = ${coma(T)}`, { clave: 't', ancla: 'l', tam: 24, color: ORO, alfa: g2 }), rotulo([0, 0.55], R`\text{error} = {\color{#f05a5a}${coma(E, 3)}}`, { clave: 'e', ancla: 'l', tam: 21, alfa: g1 }), rotulo([0, 0.1], R`\text{exactitud} = ${coma(exactitud, 3)}`, { clave: 'x', ancla: 'l', tam: 21, alfa: g1 })];
      return { principal: N, paneles: [{ ejes: { x: [0.5, 6], y: [0, 0.3], caja: { x: 610, y: 66, w: 420, h: 250 } }, prims: G }, { ejes: { x: [0, 1], y: [0, 1], caja: { x: 610, y: 370, w: 420, h: 110 } }, prims: L }] };
    },
  },
  manipulacion: '<ul><li>Mueve $T$: por debajo de 3, el modelo presume; por encima, se queda corto.</li><li>La exactitud no se mueve nunca. Compruébalo.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un modelo está calibrado si, entre todo lo que dice con un 80 %, ocurre el 80 %. No hace falta ser adivino: un modelo que dijera siempre la frecuencia general estaría calibrado, y sería inútil. Por eso calibrar y acertar son cosas distintas. Las redes modernas aciertan mucho y exageran su seguridad.' },
    { tipo: 'ejemplo', texto: 'Tres grupos de casos de un mismo modelo:', tabla: [['Lo que dijo (media)', 'Lo que pasó', 'Casos', 'Diferencia'], ['0,9', '0,7', '50', '0,2'], ['0,5', '0,5', '30', '0'], ['0,1', '0,3', '20', '0,2']], cierre: R`El error es la media ponderada: $0{,}5 \cdot 0{,}2 + 0{,}3 \cdot 0 + 0{,}2 \cdot 0{,}2 = 0{,}14$.` },
    { tipo: 'simbolos', piezas: [
      { tex: R`B_m`, dice: 'El grupo número $m$: los casos cuya confianza cae en ese tramo.' },
      { tex: R`\mathrm{acc}(B_m)`, dice: 'Lo que pasó de verdad en ese grupo.' },
      { tex: R`\mathrm{conf}(B_m)`, dice: 'Lo que dijo el modelo, de media, en ese grupo.' },
    ], todo: R`\mathrm{ECE} = \sum_{m} \frac{|B_m|}{n}\ \big|\mathrm{acc}(B_m) - \mathrm{conf}(B_m)\big|`, lee: '«La diferencia entre lo que dijo y lo que pasó, promediada según lo grande que es cada grupo». ECE son las siglas de <em>expected calibration error</em>. Aquí, con dos clases, medimos la clase «sí».' },
    { tipo: 'formal', titulo: 'Calibración y temperatura', tex: R`Un modelo está calibrado si $P(\hat{Y} = Y \mid \hat{P} = p) = p$ para todo $p$. El escalado de temperatura elige un solo $T > 0$ en datos que no se usaron para entrenar, minimizando la pérdida logarítmica de $\mathrm{softmax}\left(\frac{z}{T}\right)$.`, lee: 'Guo et al. (2017) midieron una ResNet-110 en CIFAR-100: bajó de ECE 16,53 % a 1,26 %, con un solo parámetro.' },
    { tipo: 'demo', titulo: 'La temperatura no cambia la decisión', plan: 'Hay que ver que el orden de las clases sobrevive. El mayor logit sigue siendo el mayor.', tex: R`Para todo $T > 0$: $\ \arg\max_j\ \mathrm{softmax}\left(\frac{z}{T}\right)_j = \arg\max_j z_j$.`, pasos: [
      { texto: R`$\mathrm{softmax}\left(\frac{z}{T}\right)_j = \frac{e^{z_j \frac{1}{T}}}{D}$, donde el denominador $D$ es el mismo para todas las clases.`, porque: 'Por tanto, para comparar clases basta mirar los numeradores.' },
      { texto: R`Si $z_i > z_j$ y $T > 0$, entonces $\frac{z_i}{T} > \frac{z_j}{T}$.`, porque: 'Dividir por un positivo no invierte una desigualdad.' },
      { texto: R`Y como la exponencial es creciente, $e^{z_i \frac{1}{T}} > e^{z_j \frac{1}{T}}$.`, porque: 'Luego la clase ganadora es la misma, y la exactitud no puede cambiar.' },
    ] },
    { tipo: 'nota', titulo: 'Los límites de esa medida', texto: 'El ECE depende de cómo hagas los grupos, y errores de signo contrario se cancelan dentro de un mismo grupo. Nixon et al. (2019) lo critican a fondo y proponen variantes. Úsalo, pero mira también la gráfica.' },
  ],
  tecnicas: [{ titulo: 'Reserva datos para calibrar', texto: 'Calibra siempre con datos que el modelo no haya visto al entrenar. En los de entrenamiento, ya se cree todo lo que dice.' }],
  retos: [
    { id: 'baja-ece', tipo: 'manipular', enunciado: R`Encuentra una temperatura que deje el error de calibración por debajo de $0{,}06$.`, precision: (e) => (eceDe(e.T) < 0.06 ? 1 : 0), prueba: { T: 3 }, pendiente: (e) => `Ahora, el error es ${eceDe(e.T).toFixed(3).replace('.', ',')}.`, pistas: ['Busca el fondo de la curva roja.'], explicacion: 'El modelo exageraba por 3, y un solo número lo deshace.' },
    { id: 'ece-calc', tipo: 'calcular', enunciado: R`Dos grupos: 80 casos con confianza $0{,}9$ y acierto $0{,}8$; 20 casos con confianza $0{,}5$ y acierto $0{,}5$. ¿Cuánto vale el ECE?`, respuesta: 0.08, tol: 0.001, pistas: [R`$0{,}8 \cdot 0{,}1 + 0{,}2 \cdot 0$.`], explicacion: R`$0{,}08$.` },
    { id: 'cal-elegir', tipo: 'elegir', enunciado: 'Un modelo dice siempre 0,3, y en los datos hay un 30 % de «sí». ¿Qué es?', opciones: ['Calibrado e inútil', 'Muy exacto', 'Descalibrado', 'Imposible'], correcta: 0, explicacion: 'Dice la verdad sobre sí mismo, y no distingue un caso de otro.' },
    { id: 'demuestra-t', tipo: 'demostrar', enunciado: R`Demuestra que, con dos clases, al crecer $T$ sin límite, la probabilidad tiende a $\frac{1}{2}$.`, pistas: [R`Usa $\sigma\left(\frac{z}{T}\right)$. ¿A qué tiende lo de dentro?`], solucion: [{ texto: R`Si $z$ es fijo, $\frac{z}{T} \to 0$ al crecer $T$.`, porque: 'Un número fijo entre uno cada vez mayor.' }, { texto: R`Como $\sigma$ es continua y $\sigma(0) = \frac{1}{2}$, el límite es $\frac{1}{2}$.`, porque: 'Máxima temperatura, máxima duda: lo mismo que viste en la softmax.' }] },
  ],
  referencias: ['C. Guo, G. Pleiss, Y. Sun, K. Q. Weinberger, «On Calibration of Modern Neural Networks», <em>ICML</em> (2017).', 'J. Nixon et al., «Measuring Calibration in Deep Learning», <em>CVPR Workshops</em> (2019).'],
};
