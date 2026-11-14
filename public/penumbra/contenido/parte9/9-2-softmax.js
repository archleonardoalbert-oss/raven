import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { softmax } from '../../nucleo/ia.js';
import { poligono, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { LIENZO } from '../parte4/matriz.js';
import { coma } from './comun.js';

const R = String.raw;
const NOMBRES = ['ESI 2', 'ESI 3', 'ESI 4'], COLOR = [AZUL, ROSA, BLANCO];
const barra = (x, y, w, h, v, color, alfa) => [poligono([[x, y], [x + w, y], [x + w, y - h], [x, y - h]], { color: [28, 32, 50], alfa }), poligono([[x, y], [x + w, y], [x + w, y - h * v], [x, y - h * v]], { color, alfa })];

export default {
  id: '9-2-softmax',
  titulo: 'Softmax: quién decide',
  puente: 'Ya tienes neuronas que dan grados y que eligen con suavidad. Para que una red aprenda, tiene que saber en qué se ha equivocado, y eso se comunica con gradientes. ¿Dejan pasar gradiente tus operadores?',
  pregunta: 'Tres opciones, con tres puntuaciones cualesquiera. ¿Cómo se convierten en un reparto entre ellas? Lo curioso: ya lo hiciste en Sugeno, sin saberlo.',
  escena: {
    id: 'softmax', formato: 'plano', W: 1100, H: 520, ejes: LIENZO(1100, 520),
    entradas: [
      { id: 'T', tipo: 'deslizador', etiqueta: 'temperatura T', min: 0.1, max: 6, paso: 0.05, valor: 1 },
      { id: 'a', tipo: 'deslizador', etiqueta: 'fuerza de la regla 1', min: 0.02, max: 1, paso: 0.01, valor: 0.63 },
      { id: 'b', tipo: 'deslizador', etiqueta: 'fuerza de la regla 2', min: 0.02, max: 1, paso: 0.01, valor: 0.17 },
      { id: 'c', tipo: 'deslizador', etiqueta: 'fuerza de la regla 3', min: 0.02, max: 1, paso: 0.01, valor: 0.1 },
    ],
    pasos: [
      { dur: 2800, texto: 'A la izquierda, las <b>fuerzas</b> de tres reglas de Sugeno. En esa región las dividías por su suma, para que el total fuera 1.' },
      { dur: 3000, texto: 'Ahora, sus <b>logaritmos</b>: son las puntuaciones, llamadas logits. Pueden ser cualquier número; aquí son negativos.' },
      { dur: 3200, texto: 'La <b style="color:#f4d345;font-weight:400">softmax</b> toma puntuaciones y da un reparto: eleva $e$ a cada una y divide por el total. Mira: <b>sale lo mismo que en Sugeno</b>. No se parecen: son la misma cuenta.' },
      { dur: 3400, texto: 'Divide las puntuaciones por una <b>temperatura</b>. Fría, el mayor se lo lleva todo: una decisión nítida. Caliente, todos se igualan: máxima duda.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), lg = ev(q(1), 0, 0.5), so = ev(q(2), 0, 0.5), w = [e.a, e.b, e.c], T = paso === 3 ? mix(mix(1, 0.2, ev(q(3), 0, 0.3)), mix(5, e.T, ev(q(3), 0.72, 1)), ev(q(3), 0.34, 0.68)) : 1;
      const suma = w[0] + w[1] + w[2], z = w.map((v) => Math.log(v)), p = softmax(z, T), N = [];
      N.push(rotulo([190, 40], R`\text{Fuerzas } w_i`, { clave: 'tw', tam: 21, alfa: al }), rotulo([550, 40], R`\text{Logits } z_i = \ln w_i`, { clave: 'tz', tam: 21, alfa: lg }), rotulo([910, 40], R`\text{Reparto}`, { clave: 'tp', tam: 21, color: ORO, alfa: so }));
      w.forEach((v, i) => {
        const x = 70 + i * 90;
        N.push(...barra(x, 330, 60, 240, v, COLOR[i], al), rotulo([x + 30, 350], R`\text{${NOMBRES[i]}}`, { clave: `n${i}`, tam: 16, color: GRIS2, alfa: al }), rotulo([x + 30, 76], coma(v), { clave: `w${i}`, tam: 19, alfa: al }));
        if (lg > 0) { const Y = 90 + (-z[i] / 4) * 240, x2 = 430 + i * 90; N.push(poligono([[x2, 90], [x2 + 60, 90], [x2 + 60, Y], [x2, Y]], { color: COLOR[i], alfa: 0.8 * lg }), rotulo([x2 + 30, 76], coma(z[i]), { clave: `z${i}`, tam: 19, alfa: lg })); }
        if (so > 0) { const x3 = 790 + i * 90; N.push(...barra(x3, 330, 60, 240, p[i], COLOR[i], so), rotulo([x3 + 30, 76], coma(p[i]), { clave: `p${i}`, tam: 19, color: ORO, alfa: so })); }
      });
      if (so > 0) N.push(rotulo([550, 400], R`p_i = \frac{e^{\frac{z_i}{T}}}{\sum_j e^{\frac{z_j}{T}}}`, { clave: 'f', tam: 30, alfa: so }));
      N.push(rotulo([190, 400], R`\sum w = ${coma(suma)}`, { clave: 'su', tam: 20, color: GRIS2, alfa: al }));
      if (paso === 3 || so > 0.9) N.push(rotulo([910, 400], `T = ${coma(T)}`, { clave: 'T', tam: 26, color: ORO, alfa: so }));
      return N;
    },
  },
  manipulacion: '<ul><li>Baja la temperatura hasta casi 0: el reparto se vuelve «todo o nada».</li><li>Súbela: las tres opciones se igualan. El orden nunca cambia.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una red que debe escoger entre varias clases termina con una [[softmax]]: convierte puntuaciones en un reparto que suma 1. Es una elección difusa, no un ganador único. Y es lo mismo que normalizar las fuerzas de las reglas en Sugeno: en tu propuesta CCD, por eso, «la normalización equivale a una softmax sobre las log-fuerzas».' },
    { tipo: 'ejemplo', texto: 'Con el ejemplo de tu informe: fuerzas 0,63 y 0,10.', tabla: [['', 'Regla 1', 'Regla 2'], ['Fuerza w', '0,63', '0,10'], ['Logit ln w', '−0,46', '−2,30'], ['eᶻ', '0,63', '0,10'], ['Entre la suma, 0,73', '0,863', '0,137']], cierre: 'Normalizar directamente da lo mismo: $\\frac{0{,}63}{0{,}73} \\approx 0{,}863$.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`z_i`, dice: 'La puntuación de la opción $i$: su [[logit]]. Puede ser cualquier número real.' },
      { tex: R`T > 0`, dice: 'La temperatura: cuánta duda se admite.' },
      { tex: R`\sum_j e^{\frac{z_j}{T}}`, dice: 'El total, para que el reparto sume 1.' },
    ], todo: R`p_i = \frac{e^{\frac{z_i}{T}}}{\sum_j e^{\frac{z_j}{T}}}`, lee: '«La parte de la opción $i$ es su exponencial entre el total». Con dos opciones, $p_1 = \\sigma(z_1 - z_2)$: es la [[sigmoide]] otra vez.' },
    { tipo: 'formal', titulo: 'Softmax con temperatura', tex: R`$\mathrm{softmax}_T : \mathbb{R}^L \to \Delta^{L-1}$, $\ \mathrm{softmax}_T(z)_i = \frac{e^{\frac{z_i}{T}}}{\sum_j e^{\frac{z_j}{T}}}$`, lee: '$\\Delta^{L-1}$ es el conjunto de los repartos: $L$ números no negativos que suman 1.' },
    { tipo: 'demo', titulo: 'Sugeno es una softmax', plan: 'La exponencial deshace el logaritmo. Con eso, la igualdad es inmediata; y dice algo profundo: una capa de Sugeno ya es una capa de red.', tex: R`Si $z_i = \ln w_i$, con $w_i > 0$, entonces $\mathrm{softmax}_1(z)_i = \frac{w_i}{\sum_j w_j}$.`, pasos: [
      { texto: R`$e^{z_i} = e^{\ln w_i} = w_i$.`, porque: 'El exponencial y el [[logaritmo]] son inversos.' },
      { texto: R`Sustituyendo en la softmax con $T = 1$: $\frac{w_i}{\sum_j w_j}$.`, porque: 'Arriba y abajo.' },
      { texto: R`Si además $w_i = \prod_k \ell_{ik}$, entonces $z_i = \sum_k \ln \ell_{ik}$.`, porque: 'El logaritmo convierte productos en sumas: es lo que se usa en la práctica, para evitar que productos de muchos números pequeños se hagan 0 en el ordenador.' },
    ] },
    { tipo: 'nota', titulo: 'Una probabilidad, o solo un reparto', texto: 'La salida de una softmax suma 1 y se parece a una probabilidad. Pero no por eso lo es: un modelo puede decir 0,99 y acertar el 70 % de las veces. Volverás a esto en el capítulo de la calibración.' },
  ],
  tecnicas: [{ titulo: 'Pasa a logaritmos', texto: 'Si multiplicas muchos grados pequeños, súmalos en logaritmos. Evita desbordamientos, y suele aclarar las derivadas.' }],
  retos: [
    { id: 'enfria', tipo: 'manipular', enunciado: R`Con las fuerzas iniciales, sube la temperatura hasta que la opción mayor baje de $0{,}5$.`, precision: (e) => (softmax([e.a, e.b, e.c].map(Math.log), e.T)[0] < 0.5 && Math.abs(e.a - 0.63) < 1e-9 ? 1 : 0), prueba: { T: 3, a: 0.63, b: 0.17, c: 0.1 }, pendiente: (e) => `Ahora, la mayor tiene ${softmax([e.a, e.b, e.c].map(Math.log), e.T)[0].toFixed(2).replace('.', ',')}.`, pistas: ['Mueve solo la temperatura.'], explicacion: 'Calentar no cambia el orden, solo la seguridad.' },
    { id: 'softmax-calc', tipo: 'calcular', enunciado: R`Dos logits iguales, $z_1 = z_2$. ¿Qué reparto da la primera opción?`, respuesta: 0.5, tol: 0.001, pistas: ['Las dos exponenciales son iguales.'], explicacion: R`$\frac{e^z}{2e^z} = 0{,}5$.` },
    { id: 'softmax-elegir', tipo: 'elegir', enunciado: '¿Qué le hace la temperatura a la clase ganadora?', opciones: ['La puede cambiar, si es muy alta', 'Nunca la cambia: solo la seguridad', 'La elimina', 'Depende del signo de los logits'], correcta: 1, explicacion: 'Dividir por un número positivo conserva el orden de los logits, y con él, el de las exponenciales.' },
    { id: 'demuestra-dos', tipo: 'demostrar', enunciado: R`Demuestra que, con dos opciones y $T = 1$, $p_1 = \sigma(z_1 - z_2)$.`, pistas: ['Divide arriba y abajo por $e^{z_1}$.'],
      solucion: [
        { texto: R`$p_1 = \dfrac{e^{z_1}}{e^{z_1} + e^{z_2}} = \dfrac{1}{1 + e^{z_2 - z_1}}$.`, porque: 'Se divide todo por $e^{z_1}$.' },
        { texto: R`Es decir, $\dfrac{1}{1 + e^{-(z_1 - z_2)}} = \sigma(z_1 - z_2)$.`, porque: 'Definición de sigmoide. Por eso, tanto en tu informe como en el modelo decisor, «Sí» contra «No» se calcula con estos dos logits.' },
      ] },
  ],
  referencias: ['C. Guo et al., «On calibration of modern neural networks», <em>ICML</em> (2017).', 'L. Albert, B. Quintana, <em>Modelos decisores, lógica difusa y texto</em>, informe técnico, 2026, sec. 4.3.', 'I. Goodfellow et al., <em>Deep Learning</em>, 2016, sec. 6.2.2.'],
};
