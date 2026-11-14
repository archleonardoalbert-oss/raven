import { AZUL, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { repartir, ajustarIsotonica } from '../../nucleo/decisor.js';
import { umbralCoste } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev } from '../../motor/tiempo.js';
import { barra, tramo } from '../parte9/comun.js';
import { codigo, coma } from '../parte14/comun.js';

const R = String.raw;
const U = [0, 1], [V, P] = repartir(), F = ajustarIsotonica(V.map((q) => q.a), V.map((q) => q.y)), C = P.map((q) => ({ m: F(q.a), y: q.y }));
const tasa = (u) => { let fn = 0, fp = 0, pos = 0, neg = 0; for (const { m, y } of C) { if (y) { pos++; if (m < u) fn++; } else { neg++; if (m >= u) fp++; } } return { fn: fn / pos, fp: fp / neg, nfn: fn, nfp: fp }; };
const costeM = (u, c) => { const t = tasa(u); return (c * t.nfn + t.nfp) / C.length; };
export default {
  id: '18-5-medir',
  titulo: 'Medir lo que has construido',
  puente: 'Has llegado al final. Vuelve a la órbita cuando quieras: los fragmentos, los motores y las fórmulas seguirán ahí.',
  pregunta: 'Último paso. Tienes grados, reglas y una salida. Pero un 0,4 no decide nada por sí solo: hay que trazar una línea, y a cada lado de esa línea hay un error distinto. Si no avisar cuesta diez veces más que una falsa alarma, ¿dónde la pones?',
  escena: {
    id: 'medir', formato: 'plano', W: 1100, H: 520,
    ejes: { x: U, y: U, caja: { x: 80, y: 60, w: 520, h: 370 } },
    entradas: [{ id: 'c', tipo: 'deslizador', etiqueta: 'cuánto peor es no avisar que una falsa alarma', min: 1, max: 20, paso: 1, valor: 1 }],
    pasos: [
      { dur: 3000, texto: 'Dos errores, según dónde pongas el umbral. <b style="color:#fc6282;font-weight:400">No avisar</b> crece con él, y la <b style="color:#58c4dd;font-weight:400">falsa alarma</b> baja. Datos de juguete, con grados ya calibrados.' },
      { dur: 3000, texto: 'Si los dos errores cuestan lo mismo, el umbral bueno es 0,5. Sube el coste de no avisar: la línea dorada baja.' },
      { dur: 3000, texto: 'Esa línea sale de una fórmula. Y solo funciona si los grados están calibrados: <b style="color:#f4d345;font-weight:400">por eso se calibra</b>. A la derecha, los errores que comete.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g1 = paso >= 1 ? ev(q(1), 0, 0.5) : 0, g2 = paso >= 2 ? ev(q(2), 0, 0.5) : 0, c = e.c, u = umbralCoste(c, 1), t = tasa(u), N = [marco({ x: U, y: U }, { alfa: al, ticks: { x: [0, 0.5, 1], y: [0, 1] }, etiquetas: { x: R`\text{umbral}`, y: R`\text{tasa}` } }), curva((x) => [x, tasa(x).fn], U, { n: 120, color: ROSA, ancho: 2.6, alfa: al, tol: 1 }), curva((x) => [x, tasa(x).fp], U, { n: 120, color: AZUL, ancho: 2.6, alfa: al, tol: 1 })];
      if (g1 > 0) N.push(...tramo([u, 0], [u, 1], { color: ORO, ancho: 2.2, alfa: g1 }), rotulo([u, 1], R`u = ${coma(u)}`, { clave: 'u', dy: -14, tam: 21, color: ORO, alfa: g1 }));
      const B = [marco({ x: [0, 2], y: U }, { alfa: g2, ticks: { x: [], y: [0, 1] } }), barra(0.15, 0.85, t.fn, { color: ROSA, alfa: 0.8 * g2 }), barra(1.15, 1.85, t.fp, { color: AZUL, alfa: 0.8 * g2 }), rotulo([0.5, 0], R`\text{no avisa}`, { clave: 'a', dy: 20, tam: 16, color: ROSA, alfa: g2 }), rotulo([1.5, 0], R`\text{falsa alarma}`, { clave: 'b', dy: 20, tam: 16, color: AZUL, alfa: g2 }), rotulo([0.5, t.fn], R`${coma(t.fn)}`, { clave: 'c', dy: -14, tam: 19, color: ROSA, alfa: g2 }), rotulo([1.5, t.fp], R`${coma(t.fp)}`, { clave: 'd', dy: -14, tam: 19, color: AZUL, alfa: g2 })];
      return { principal: N, paneles: [{ ejes: { x: [0, 2], y: U, caja: { x: 700, y: 100, w: 340, h: 330 } }, prims: B }] };
    },
  },
  manipulacion: '<ul><li>Sube el coste de no avisar: el umbral baja, y las falsas alarmas suben.</li><li>No hay umbral que elimine los dos errores: lo que decides es cuál prefieres.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Un sistema no es bueno o malo: es bueno para unos costes. Por eso, medirlo son tres preguntas. ¿Sus grados significan lo que dicen? Eso es la calibración. ¿Ordena bien? ¿Y qué errores comete, con el umbral que se usaría de verdad? Con cada una, se mide con datos que el sistema no ha visto.' },
    codigo('El umbral', 'Se avisa si el coste esperado de no avisar supera al de avisar:', "def umbral(coste_no_avisar, coste_falsa_alarma):\n    return coste_falsa_alarma / (coste_falsa_alarma + coste_no_avisar)\n\nfor c in (1, 4, 9, 19):\n    print(c, round(umbral(c, 1), 3))", 'Si no avisar es 9 veces peor, se avisa a partir de 0,1. Es una decisión de valores, no de matemáticas: la tiene que tomar quien responda de ella.'),
    { tipo: 'ejemplo', texto: 'Lo que un informe honesto debería incluir:', tabla: [['Pregunta', 'Se mide con'], ['¿Sus grados son fiables?', 'ECE, por concepto'], ['¿Ordena bien?', 'AUC, o kappa ponderado'], ['¿Qué error cuesta más?', 'Tasa de no avisar, con el umbral elegido'], ['¿Y si quitas una pieza?', 'Sin $\\varphi$; con MIN en vez de PROD'], ['¿Cuánto duda?', 'Un intervalo de confianza']], cierre: 'En CCD, el plan de evaluación sigue este esquema. Y hasta que se haga, cualquier número es una promesa, no un resultado.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`C_{\text{FN}}`, dice: 'Lo que cuesta no avisar.' },
      { tex: R`C_{\text{FP}}`, dice: 'Lo que cuesta una falsa alarma.' },
      { tex: R`\mu`, dice: 'El grado calibrado: la probabilidad de que el concepto esté.' },
    ], todo: R`\text{avisar} \iff \mu \ge u = \frac{C_{\text{FP}}}{C_{\text{FP}} + C_{\text{FN}}}`, lee: '«Avisa si el grado supera ese umbral». Con costes iguales, $u = 0{,}5$.' },
    { tipo: 'formal', titulo: 'Lo que se supone', tex: R`El coste esperado de no avisar es $\mu\, C_{\text{FN}}$, y el de avisar, $(1 - \mu)\, C_{\text{FP}}$. Solo son correctos si $\mu$ es de verdad la probabilidad.`, lee: 'Si el grado no está calibrado, la fórmula sigue dando un número, pero ya no significa nada. Esto es lo que conecta toda esta última parte.' },
    { tipo: 'demo', titulo: 'De dónde sale el umbral', plan: 'Se comparan los dos costes esperados.', tex: R`Avisar sale a cuenta si y solo si $\mu \ge \frac{C_{\text{FP}}}{C_{\text{FP}} + C_{\text{FN}}}$.`, pasos: [
      { texto: R`Avisar sale a cuenta si $(1 - \mu)\, C_{\text{FP}} \le \mu\, C_{\text{FN}}$.`, porque: 'Se compara lo que cuesta cada decisión.' },
      { texto: R`Agrupando: $C_{\text{FP}} \le \mu\, (C_{\text{FN}} + C_{\text{FP}})$.`, porque: 'Se pasa $\\mu\\, C_{\\text{FP}}$ al otro lado.' },
      { texto: R`Se divide por $C_{\text{FN}} + C_{\text{FP}} > 0$.`, porque: 'El sentido se mantiene, y sale el umbral.' },
    ] },
    { tipo: 'nota', titulo: 'Hasta aquí', texto: 'Has recorrido una librería entera, con sus fallos, tres motores de inferencia y el salto que hay de un texto a un grado fiable. Los datos de estas últimas paradas son de juguete; las salidas de los bloques ejecutados, no. Lo que falta es lo que ningún curso puede darte: datos reales, y alguien que responda por la decisión.' },
  ],
  tecnicas: [{ titulo: 'Di los costes en voz alta', texto: 'Todo umbral esconde una decisión sobre qué error es peor. Escríbela: «prefiero 9 falsas alarmas a un caso sin avisar». Si no la escribes, la toma el 0,5 de serie, y nadie la habrá decidido.' }],
  retos: [
    { id: 'umbral-01', tipo: 'manipular', enunciado: R`Busca el coste de no avisar que lleve el umbral a $0{,}1$.`, precision: (e) => (Math.abs(umbralCoste(e.c, 1) - 0.1) < 1e-6 ? 1 : 0), prueba: { c: 9 }, pendiente: (e) => `El umbral es ${umbralCoste(e.c, 1).toFixed(3).replace('.', ',')}.`, pistas: [R`$\frac{1}{1 + c} = 0{,}1$.`], explicacion: R`$c = 9$.` },
    { id: 'umbral-calc', tipo: 'calcular', enunciado: R`Si $C_{\text{FN}} = 3$ y $C_{\text{FP}} = 1$, ¿cuánto vale el umbral?`, respuesta: 0.25, tol: 0.001, pistas: [R`$\frac{1}{1 + 3}$.`], explicacion: R`$0{,}25$.` },
    { id: 'medir-elegir', tipo: 'elegir', enunciado: '¿Por qué la fórmula del umbral exige grados calibrados?', opciones: ['Por velocidad', 'Porque usa el grado como una probabilidad', 'Porque lo pide fuzzython', 'No lo exige'], correcta: 1, explicacion: 'Calcula un coste esperado. Solo tiene sentido si el grado es una probabilidad.' },
    { id: 'demuestra-igual', tipo: 'demostrar', enunciado: R`Demuestra que, con costes iguales, el umbral es $\frac{1}{2}$.`, pistas: ['Sustituye.'], solucion: [{ texto: R`Con $C_{\text{FN}} = C_{\text{FP}} = C$: $u = \frac{C}{2 C}$.`, porque: 'Se sustituye en la fórmula.' }, { texto: R`Se simplifica $C > 0$: $u = \frac{1}{2}$.`, porque: 'Por eso el 0,5 de serie supone, en silencio, que ambos errores valen igual.' }] },
  ],
  referencias: ['C. Elkan, «The foundations of cost-sensitive learning», IJCAI (2001).', 'Propuesta propia: <em>Células de Concepto Difusas</em>, plan de evaluación.'],
};
