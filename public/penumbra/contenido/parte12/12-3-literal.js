import { AZUL, BLANCO, GRIS2, ORO, ROSA } from '../../motor/colores.js';
import { fuerzaRegla, literal } from '../../nucleo/ia.js';
import { curva, marco, punto, rotulo } from '../../motor/primitivas.js';
import { ev, mix } from '../../motor/tiempo.js';
import { barra, coma } from '../parte9/comun.js';

const R = String.raw;
const CON = [['dolor torácico', 0.9, { m: 1, p: 1 }], ['golpe leve', 0.1, { m: 1, p: 0 }], ['pidió cita', 0.7, { m: 0, p: 0.5 }]];

export default {
  id: '12-3-literal',
  titulo: 'El literal suave',
  puente: 'Con esta pieza, una regla se escribe con números que se pueden aprender. Pero al aprender, tiende a usar todos los conceptos a la vez. ¿Cómo se la obliga a elegir?',
  pregunta: 'Una regla dice «si hay dolor y no hay golpe...». Para cada concepto tiene que decidir dos cosas: ¿me importa? Y si me importa, ¿lo quiero o lo quiero al revés? ¿Se puede aprender eso con gradientes?',
  escena: {
    id: 'literal', formato: 'plano', W: 1100, H: 540,
    ejes: { x: [0, 1], y: [0, 1], caja: { x: 80, y: 60, w: 420, h: 400 } },
    entradas: [
      { id: 'p', tipo: 'deslizador', etiqueta: 'π: polaridad', min: 0, max: 1, paso: 0.01, valor: 0.6 },
      { id: 'm', tipo: 'deslizador', etiqueta: 'm: relevancia', min: 0, max: 1, paso: 0.01, valor: 0.6 },
    ],
    pasos: [
      { dur: 2800, texto: 'Lo que aporta un concepto a la regla, según su grado $\\mu$. Con $\\pi = 1$ y $m = 1$, la línea es la identidad: <b style="color:#58c4dd;font-weight:400">«lo quiero»</b>.' },
      { dur: 3000, texto: 'Baja $\\pi$ hasta 0, y la línea se da la vuelta: <b style="color:#fc6282;font-weight:400">«lo quiero al revés»</b>, un «no». En medio hay valores intermedios, y por eso se puede aprender: no hay salto.' },
      { dur: 3000, texto: 'Baja ahora $m$. La línea se levanta hasta quedar plana en 1: <b>«no me importa»</b>. Multiplicar por 1 no cambia nada, así que el concepto desaparece de la regla.' },
      { dur: 3400, texto: 'A la derecha, una regla entera: <b>«dolor Y NO golpe»</b>. Cada concepto aporta su factor, y se multiplican. La cita tiene $m = 0$: da igual lo que valga. Así se escribe una regla con números.' },
    ],
    primitivas({ q, paso, e }) {
      const al = ev(q(0), 0, 0.4), g3 = paso >= 3 ? ev(q(3), 0, 0.5) : 0;
      const p = paso === 0 ? 1 : paso === 1 ? mix(1, 0, ev(q(1), 0.1, 0.9)) : paso === 2 ? 0 : mix(0, e.p, ev(q(3), 0.3, 0.7)), m = paso <= 1 ? 1 : paso === 2 ? mix(1, 0, ev(q(2), 0.1, 0.9)) : mix(0, e.m, ev(q(3), 0.3, 0.7));
      const c = p > 0.5 ? AZUL : ROSA, A = [marco({ x: [0, 1], y: [0, 1] }, { alfa: al, ticks: { x: [0, 1], y: [0, 1] }, etiquetas: { x: R`\mu`, y: R`\text{lo que aporta}` } }), curva((u) => [u, literal(u, p, m)], [0, 1], { n: 2, color: c, ancho: 3.2, brillo: true, alfa: al }), punto([0, literal(0, p, m)], { color: c, radio: 5, alfa: al }), punto([1, literal(1, p, m)], { color: c, radio: 5, alfa: al }), rotulo([0.5, 0.08], R`\pi = ${coma(p)},\quad m = ${coma(m)}`, { clave: 'pm', tam: 21, color: ORO, alfa: al })];
      const B = [];
      if (g3 > 0) {
        CON.forEach(([nom, mu, r], i) => { const y = 3 - i, f = literal(mu, r.p, r.m); B.push(rotulo([0, y - 0.1], R`\text{${nom}}:\ \mu = ${coma(mu, 1)},\ \pi = ${coma(r.p, 1)},\ m = ${coma(r.m, 0)}`, { clave: `t${i}`, ancla: 'l', tam: 15, color: GRIS2, alfa: g3 }), barra(0, 1, y - 0.6, { color: BLANCO, alfa: 0.07 * g3 }, y - 0.85), barra(0, f * ev(q(3), i * 0.12, i * 0.12 + 0.4), y - 0.6, { color: r.m ? AZUL : GRIS2, alfa: 0.85 * g3 }, y - 0.85), rotulo([1, y - 0.72], coma(f), { clave: `f${i}`, ancla: 'l', dx: 8, tam: 16, alfa: g3 })); });
        const w = fuerzaRegla(CON.map((x) => x[1]), CON.map((x) => x[2]));
        B.push(rotulo([0.5, -0.2], R`w = \prod_k \left(1 - m_k + m_k\, \ell_k\right) = ${coma(w)}`, { clave: 'w', tam: 21, color: ORO, alfa: g3 }));
      }
      return { principal: A, paneles: [{ ejes: { x: [0, 1], y: [0, 3], caja: { x: 620, y: 80, w: 360, h: 310 } }, prims: B }] };
    },
  },
  manipulacion: '<ul><li>Mueve $\\pi$ con $m = 1$: la línea gira alrededor del punto central.</li><li>Pon $m = 0$, y mueve $\\pi$: no pasa nada. Da igual lo que quieras, si no te importa.</li></ul>',
  entender: [
    { tipo: 'idea', etiqueta: 'La idea', texto: 'Una regla es una lista de conceptos con dos decisiones por cada uno: si entra, y en qué sentido. Esas decisiones son discretas, y un gradiente no puede con lo discreto. Solución: convertirlas en dos números entre 0 y 1, y usar fórmulas que en los extremos den exactamente la regla de siempre. Durante el entrenamiento se mueven; al final, se leen.' },
    { tipo: 'ejemplo', texto: 'El factor $1 - m + m\\,\\ell$, con grado $\\mu = 0{,}8$:', tabla: [['π', 'm', 'Literal ℓ', 'Factor', 'Significa'], ['1', '1', '0,8', '0,8', 'el concepto'], ['0', '1', '0,2', '0,2', 'su negación'], ['1', '0', '0,8', '1', 'no importa'], ['0,5', '1', '0,5', '0,5', 'aún no ha decidido']], cierre: 'Las tres primeras filas son lógica; la última es un momento del entrenamiento.' },
    { tipo: 'simbolos', piezas: [
      { tex: R`\pi_{r k}`, dice: 'Polaridad: en la regla $r$, ¿el concepto $k$ va tal cual (1) o negado (0)? La letra griega «pi», aquí no es 3,14.' },
      { tex: R`m_{r k}`, dice: 'Relevancia: ¿importa este concepto en esta regla?' },
      { tex: R`\ell_{r k} = \pi_{r k}\,\mu_k + (1 - \pi_{r k})(1 - \mu_k)`, dice: 'El literal: el grado, o su negación, o una mezcla.' },
    ], todo: R`w_r = \prod_k \left(1 - m_{r k} + m_{r k}\, \ell_{r k}\right)`, lee: '«La fuerza de la regla es el producto de lo que aporta cada concepto». Si $m_{r k} = 0$, ese factor vale 1 y no cambia nada.' },
    { tipo: 'formal', titulo: 'Reglas con conceptos, aprendibles', tex: R`Las redes de razonamiento con conceptos (DCR, 2023) y los modelos con libro de reglas (CMR, 2024) separan el papel de cada concepto. En CMR, cada concepto es positivo, negativo o irrelevante, y $p(y \mid c, s) = \prod_i \big(p(I_i) + p(P_i)\,[c_i = 1] + p(N_i)\,[c_i = 0]\big)$.`, lee: 'Nuestra forma, con $\\pi$ y $m$, es la versión difusa de esa idea, con grados en lugar de conceptos binarios, y es derivable en todas partes.' },
    { tipo: 'demo', titulo: 'En los extremos, es la lógica de siempre', plan: 'Se sustituye cada valor extremo, y aparece cada caso.', tex: R`Si $\pi, m \in \{0, 1\}$, el factor $1 - m + m\,\ell$ es 1, $\mu$ o $1 - \mu$.`, pasos: [
      { texto: R`Con $m = 0$: $1 - 0 + 0 \cdot \ell = 1$.`, porque: 'El neutro del producto: el concepto no influye.' },
      { texto: R`Con $m = 1$: queda $\ell$. Y si $\pi = 1$, $\ell = \mu + 0 = \mu$.`, porque: 'El concepto tal cual.' },
      { texto: R`Con $m = 1$ y $\pi = 0$: $\ell = 0 + 1 \cdot (1 - \mu) = 1 - \mu$.`, porque: 'La negación. Si además $\mu \in \{0, 1\}$, $w$ es una conjunción de la lógica clásica.' },
    ] },
    { tipo: 'nota', titulo: '¿Por qué producto?', texto: 'Ya lo viste: entre las [[normas T|norma T]], el producto deja pasar el gradiente a todos los factores. El mínimo solo corrige al peor, y Łukasiewicz se puede quedar sin gradiente. Aquí, además, $\\frac{\\partial w}{\\partial m_{r k}}$ existe siempre.' },
  ],
  tecnicas: [{ titulo: 'Relaja, y que los extremos sean lo de siempre', texto: 'Para aprender algo discreto, usa una fórmula continua que coincida con lo discreto en los extremos. Luego puedes empujar hacia esos extremos.' }],
  retos: [
    { id: 'haz-no', tipo: 'manipular', enunciado: R`Convierte este concepto en una negación: que aporte $1 - \mu$.`, precision: (e) => (e.p < 0.05 && e.m > 0.95 ? 1 : 0), prueba: { p: 0, m: 1 }, pendiente: (e) => `Ahora, π = ${e.p.toFixed(2).replace('.', ',')} y m = ${e.m.toFixed(2).replace('.', ',')}.`, pistas: ['Importa del todo, y va al revés.'], explicacion: 'Línea decreciente, de 1 a 0.' },
    { id: 'literal-calc', tipo: 'calcular', enunciado: R`Con $\mu = 0{,}6$, $\pi = 0$ y $m = 0{,}5$, ¿cuánto aporta el concepto?`, respuesta: 0.7, tol: 0.001, pistas: [R`$\ell = 1 - 0{,}6 = 0{,}4$. Luego, $1 - m + m\,\ell$.`], explicacion: R`$0{,}5 + 0{,}5 \cdot 0{,}4 = 0{,}7$.` },
    { id: 'literal-elegir', tipo: 'elegir', enunciado: 'Una regla tiene $m_{r k} = 0$. ¿Qué pasa si cambias $\\pi_{r k}$?', opciones: ['La regla cambia de sentido', 'Nada: el factor vale 1', 'La regla se apaga', 'Se vuelve negación'], correcta: 1, explicacion: 'La polaridad solo cuenta si el concepto importa.' },
    { id: 'demuestra-rango', tipo: 'demostrar', enunciado: R`Demuestra que, si $\mu, \pi, m \in [0, 1]$, el factor $1 - m + m\,\ell$ está en $[0, 1]$.`, pistas: [R`Primero, $\ell$ es una media de $\mu$ y $1 - \mu$.`], solucion: [{ texto: R`$\ell = \pi \mu + (1 - \pi)(1 - \mu)$ es una media ponderada de dos valores de $[0, 1]$, luego $\ell \in [0, 1]$.`, porque: 'Una media no se sale del rango.' }, { texto: R`Y $1 - m + m\,\ell = (1 - m) \cdot 1 + m \cdot \ell$ es otra media, de $1$ y $\ell$.`, porque: 'Luego también queda en $[0, 1]$, y el producto de varios factores también.' }] },
  ],
  referencias: ['P. Barbiero et al., «Interpretable Neural-Symbolic Concept Reasoning», <em>ICML</em> (2023).', 'D. Debot et al., «Interpretable Concept-Based Memory Reasoning», <em>NeurIPS</em> (2024).'],
};
