import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { ajustarIsotonica, eceConValidacion, repartir } from '../../nucleo/decisor.js';
import { binsCalibracion } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { tramo } from '../parte9/comun.js';
import { codigo, coma } from '../parte14/comun.js';

const R = String.raw;
const U = [0, 1], [V, P] = repartir();
const fi = (n) => { const v = V.slice(0, n); return ajustarIsotonica(v.map((q) => q.a), v.map((q) => q.y)); };
export default {
  id: '18-3-calibrar',
  titulo: 'Calibrar, con los datos que tienes',
  puente: 'Ya tienes un grado que significa algo. Falta conectarlo: que esos grados entren en fuzzython como si fueran un sensor.',
  pregunta: 'En la región 11 viste qué es calibrar. Ahora el problema real: etiquetar textos a mano cuesta caro. ¿Cuántos ejemplos necesitas? ¿Y cómo saber si tu calibración es buena, o si solo se aprendió los que le diste?',
  escena: {
    id: 'calibrar', formato: 'plano', W: 1100, H: 520,
    ejes: { x: U, y: U, caja: { x: 90, y: 50, w: 390, h: 390 } },
    entradas: [{ id: 'n', tipo: 'deslizador', etiqueta: 'textos etiquetados a mano', min: 10, max: 400, paso: 10, valor: 30 }],
    pasos: [
      { dur: 2800, texto: 'Un decisor de juguete, que se pasa de seguro. Cada punto es un grupo de respuestas: cuánto decía, frente a cuánto acertaba. Debería estar en la diagonal.' },
      { dur: 3000, texto: 'Con unos textos etiquetados, se ajusta $\\varphi$: una función creciente en <b style="color:#f4d345;font-weight:400">escalones</b>. Lleva lo que dice el modelo a lo que debería decir.' },
      { dur: 3000, texto: 'Se mide <b>con textos que no vio</b>. A la derecha, el error según cuántos etiquetas. Con muy pocos, <b>puede salir peor que sin calibrar</b>. Aquí hace falta un centenar.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, n = Math.round(e.n), f = fi(n), N = [marco({ x: U, y: U }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: R`\text{lo que dice}`, y: R`\text{lo que acierta}` } }), ...tramo([0, 0], [1, 1], { color: GRIS2, ancho: 1, alfa: al, discontinua: true })];
      for (const b of binsCalibracion(P.map((q0) => q0.a), P.map((q0) => q0.y))) if (b.n) N.push(punto([b.conf, b.acc], { color: ROSA, radio: 3 + Math.sqrt(b.n) * 0.7, alfa: al, halo: 0 }));
      if (g1 > 0) { N.push(curva((x) => [x, f(x)], U, { n: 300, color: ORO, ancho: 2.6, alfa: g1, tol: 1 })); for (const b of binsCalibracion(P.map((q0) => f(q0.a)), P.map((q0) => q0.y))) if (b.n) N.push(punto([b.conf, b.acc], { color: AZUL, radio: 3 + Math.sqrt(b.n) * 0.7, alfa: g1, halo: 0 })); }
      const G = [marco({ x: [0, 400], y: [0, 0.3] }, { alfa: g2, ticks: { x: [0, 200, 400], y: [0, 0.3] }, etiquetas: { x: R`\text{etiquetados}`, y: R`\text{ECE}` } })];
      if (g2 > 0) { for (let i = 10; i < 400; i += 10) G.push(...tramo([i, Math.min(0.3, eceConValidacion(i))], [i + 10, Math.min(0.3, eceConValidacion(i + 10))], { color: ORO, ancho: 2.2, alfa: g2 })); const s = eceConValidacion(0); G.push(...tramo([0, s], [400, s], { color: ROSA, ancho: 1.4, alfa: g2, discontinua: true }), punto([n, eceConValidacion(n)], { color: ORO, radio: 7, alfa: g2 }), rotulo([400, 0.3], R`\text{ECE} = ${coma(eceConValidacion(n), 3)}`, { clave: 'e', ancla: 'r', dy: -14, tam: 20, color: ORO, alfa: g2 })); }
      return { principal: N, paneles: [{ ejes: { x: [0, 400], y: [0, 0.3], caja: { x: 610, y: 90, w: 430, h: 340 } }, prims: G }] };
    },
  },
  manipulacion: '<ul><li>Empieza con 10 textos: los escalones son toscos, y el error, mayor que sin calibrar. Súbelos.</li><li>En la gráfica de la derecha, la línea rosa es sin calibrar.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un concepto, una $\\varphi$. Se reúnen textos, una persona marca si el concepto está o no, y se ajusta la función creciente que mejor lleva los grados crudos a esas marcas. Como solo puede subir, no cambia el orden de los casos: si el modelo ordenaba bien, sigue ordenando igual. Solo corrige lo que significan los números.' },
    codigo('Ajustarla', 'Con una regresión isotónica. Son diez líneas, sin librerías. Con <code>sklearn.isotonic.IsotonicRegression</code> sale igual:', "# de juguete: lo que dijo el modelo, y si estaba el concepto\ndatos = [(0.05, 0), (0.15, 0), (0.3, 1), (0.45, 0), (0.6, 0), (0.7, 1), (0.85, 1), (0.95, 1)]\nphi = isotonica(datos)\nprint([round(phi(a), 2) for a in (0.1, 0.5, 0.65, 0.9)])", 'Cada bloque guarda dónde empieza, la suma de sus marcas y cuántas hay. Si dos vecinos violan el orden, se funden.', { prefacio: "def isotonica(pares):\n    pares = sorted(pares)\n    bloques = []\n    for x, y in pares:\n        bloques.append([x, y, 1])\n        while len(bloques) > 1 and bloques[-2][1] / bloques[-2][2] > bloques[-1][1] / bloques[-1][2]:\n            x2, s, n = bloques.pop()\n            bloques[-1][1] += s\n            bloques[-1][2] += n\n    def phi(a):\n        v = bloques[0][1] / bloques[0][2]\n        for x, s, n in bloques:\n            if x <= a:\n                v = s / n\n        return v\n    return phi", prefacioTitulo: 'La función isotonica' }),
    { tipo: 'ejemplo', texto: 'Así se reparte el trabajo:', tabla: [['Parte', 'Para qué', 'Toca'], ['Ajuste', 'Sacar $\\varphi$', 'Una vez, por concepto'], ['Validación', 'Decidir, comparar', 'Nunca se usa para ajustar'], ['Prueba', 'El número que publicas', 'Solo al final']], cierre: 'Si mides con los textos que usaste para ajustar, el error sale casi 0, y es mentira.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\varphi_k`, dice: 'La calibración del concepto $k$: creciente.' },
      { tex: R`a_k(x)`, dice: 'El grado crudo.' },
      { tex: R`\mu_k(x)`, dice: 'El grado calibrado: la capa de conceptos.' },
    ], todo: R`\mu_k(x) = \varphi_k(a_k(x))`, lee: '«El grado calibrado es el crudo, corregido». Si $\\varphi_k$ se parece a la diagonal, ya estaba calibrado: es una forma de comprobar lo que declara un fabricante.' },
    { tipo: 'formal', titulo: 'El error de calibración', tex: R`Se agrupan las respuestas en $M$ grupos por confianza, $B_1, \dots, B_M$: $\text{ECE} = \sum_{b = 1}^M \frac{|B_b|}{N} |\text{acc}(B_b) - \text{conf}(B_b)|$.`, lee: '«La distancia a la diagonal, de media, con cada grupo pesando según su tamaño». Se debe calcular siempre con textos no vistos.' },
    { tipo: 'demo', titulo: 'Calibrar no cambia cómo se ordena', plan: 'Se usa que $\\varphi$ es no decreciente.', tex: R`Si $a(x) \le a(y)$, entonces $\mu(x) \le \mu(y)$. Por tanto, ningún par bien ordenado pasa a estar mal ordenado.`, pasos: [
      { texto: R`$\varphi$ es no decreciente por construcción.`, porque: 'Eso impone la regresión isotónica.' },
      { texto: R`Luego $\varphi(a(x)) \le \varphi(a(y))$.`, porque: 'Es la definición de no decreciente.' },
      { texto: R`Dos valores distintos pueden volverse iguales, porque $\varphi$ es escalonada. Pero nunca se invierten.`, porque: 'El AUC, que mide cómo ordena, puede bajar un poco por los empates, y nada más. Si el modelo ordena mal, calibrar no lo arregla.' },
    ] },
  ],
  tecnicas: [{ titulo: 'Deja una parte sin tocar', texto: 'Antes de ajustar nada, aparta textos, y no los mires. Cualquier número que publiques debe venir de ahí. Es la regla más sencilla, y la que más se incumple.' }],
  retos: [
    { id: 'calib-mejor', tipo: 'manipular', enunciado: R`Busca cuántos textos etiquetar para que el ECE baje de $0{,}08$.`, precision: (e) => (eceConValidacion(Math.round(e.n)) < 0.08 ? 1 : 0), prueba: { n: 400 }, pendiente: (e) => `Con ${Math.round(e.n)}, el ECE es ${eceConValidacion(Math.round(e.n)).toFixed(3).replace('.', ',')}.`, pistas: ['Sigue subiendo.'], explicacion: 'En estos datos, a partir de unos 100. No hay un número mágico: depende de cada caso, y por eso se mide.' },
    { id: 'ece-calc', tipo: 'calcular', enunciado: R`Un grupo tiene confianza $0{,}9$ y acierta $0{,}7$. Es la mitad de los datos, y la otra mitad está perfecta. ¿Cuánto vale el ECE?`, respuesta: 0.1, tol: 0.001, pistas: [R`$0{,}5 \cdot 0{,}2 + 0{,}5 \cdot 0$.`], explicacion: R`$0{,}1$.` },
    { id: 'calib-elegir', tipo: 'elegir', enunciado: 'Mides el ECE con los mismos textos con que ajustaste, y da casi 0. ¿Qué significa?', opciones: ['Que está perfecto', 'Nada: se ha aprendido esos textos', 'Que necesitas más conceptos', 'Que el modelo es muy bueno'], correcta: 1, explicacion: 'Una isotónica puede ajustarse casi por completo a lo que ve. Hay que medir con lo que no ha visto.' },
    { id: 'demuestra-id', tipo: 'demostrar', enunciado: R`Demuestra que, si un decisor está perfectamente calibrado, su ECE es 0.`, pistas: ['Mira cada grupo.'], solucion: [{ texto: R`Calibrado significa que, en cada grupo, $\text{acc}(B_b) = \text{conf}(B_b)$.`, porque: 'Es la definición, aplicada a cada grupo.' }, { texto: R`Cada sumando es $\frac{|B_b|}{N} \cdot 0$.`, porque: 'La suma es 0.' }] },
  ],
  referencias: ['B. Zadrozny, C. Elkan, «Transforming classifier scores into accurate multiclass probability estimates», KDD (2002).', 'C. Guo et al., «On calibration of modern neural networks», ICML (2017).'],
};
