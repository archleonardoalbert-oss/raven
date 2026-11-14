// HORTUS ALGORITHMICUS · Fig. IV — Vita Conwayi (la CPU)
// El suelo del jardín es el Juego de la Vida (regla B3/S23), que es Turing-completo:
// cómputo puro. Hay una franja por hilo del procesador. Cada franja calcula tantas
// generaciones por segundo como carga tiene su hilo, y cuanto más trabaja, más
// patrones nuevos siembra (planeadores, naves, R-pentominós). Con la CPU en reposo
// el suelo se calma hasta quedar en vidas quietas: bloques, colmenas, parpadeadores.
"use strict";

H.Vida = (function () {
  const V = {
    cols: 384, filas: 26, celda: 5, y0: 944,
    a: null, b: null, edad: null, rastro: null,
    franjas: [], lienzo: null, img: null, peq: null,
    generaciones: 0, poblacion: 0,
  };
  const PAT = {
    planeador: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
    rpento: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
    nave: [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]],
    bellota: [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]],
    diehard: [[6, 0], [0, 1], [1, 1], [1, 2], [5, 2], [6, 2], [7, 2]],
  };
  const nombresPat = Object.keys(PAT);

  V.crear = function (nHilos) {
    const n = V.cols * V.filas;
    V.a = new Uint8Array(n); V.b = new Uint8Array(n);
    V.edad = new Uint16Array(n); V.rastro = new Float32Array(n);
    V.franjas = [];
    const ancho = V.cols / nHilos;
    for (let i = 0; i < nHilos; i++) {
      V.franjas.push({ c0: Math.round(i * ancho), c1: Math.round((i + 1) * ancho), carga: 0, acum: 0, acumSiembra: 0, gps: 0, gen: 0 });
    }
    // estado inicial: un poco de vida quieta repartida
    const r = H.rng(42);
    for (let k = 0; k < 60; k++) sembrar("rpento", (r() * V.cols) | 0, (r() * V.filas) | 0, r);
    for (let k = 0; k < 120; k++) pasoGlobal(0, V.cols);
    V.lienzo = document.createElement("canvas");
    V.lienzo.width = V.cols; V.lienzo.height = V.filas;
    V.img = V.lienzo.getContext("2d").createImageData(V.cols, V.filas);
    V.peq = document.createElement("canvas");
    V.peq.width = V.cols / 2; V.peq.height = V.filas / 2;
  };

  function sembrar(nombre, cx, cy, r) {
    const p = PAT[nombre];
    const rot = (r() * 4) | 0, esp = r() < 0.5;
    for (let [x, y] of p) {
      if (esp) x = -x;
      for (let k = 0; k < rot; k++) [x, y] = [-y, x];
      const c = ((cx + x) % V.cols + V.cols) % V.cols, f = ((cy + y) % V.filas + V.filas) % V.filas;
      V.a[f * V.cols + c] = 1;
    }
  }

  function pasoGlobal(c0, c1) {
    const C = V.cols, F = V.filas, a = V.a, b = V.b;
    for (let f = 0; f < F; f++) {
      const fa = ((f - 1 + F) % F) * C, fm = f * C, fb = ((f + 1) % F) * C;
      for (let c = c0; c < c1; c++) {
        const ci = (c - 1 + C) % C, cd = (c + 1) % C;
        const n = a[fa + ci] + a[fa + c] + a[fa + cd] + a[fm + ci] + a[fm + cd] + a[fb + ci] + a[fb + c] + a[fb + cd];
        const viva = a[fm + c];
        b[fm + c] = (n === 3 || (viva && n === 2)) ? 1 : 0;
      }
    }
    for (let f = 0; f < F; f++) for (let c = c0; c < c1; c++) {
      const i = f * C + c;
      if (V.b[i]) { V.edad[i] = V.a[i] ? Math.min(65000, V.edad[i] + 1) : 1; }
      else { if (V.a[i]) V.rastro[i] = 1; V.edad[i] = 0; }
      V.a[i] = V.b[i];
    }
  }

  // cargas: array con la carga 0..1 de cada hilo
  V.paso = function (dt, cargas) {
    const r = Math.random;
    V.franjas.forEach((fr, i) => {
      fr.carga += ((cargas[i] || 0) - fr.carga) * (1 - Math.exp(-dt * 3));
      fr.gps = 0.6 + 26 * fr.carga;
      fr.acum += fr.gps * dt;
      let pasos = 0;
      while (fr.acum >= 1 && pasos < 4) { fr.acum--; pasos++; pasoGlobal(fr.c0, fr.c1); fr.gen++; V.generaciones++; }
      if (fr.acum > 4) fr.acum = 0;
      fr.acumSiembra += (0.02 + 1.4 * fr.carga * fr.carga) * dt;
      while (fr.acumSiembra >= 1) {
        fr.acumSiembra--;
        const nom = fr.carga > 0.6 && r() < 0.3 ? "bellota" : nombresPat[(r() * nombresPat.length) | 0];
        sembrar(nom, fr.c0 + 3 + ((r() * (fr.c1 - fr.c0 - 6)) | 0), (r() * V.filas) | 0, r);
      }
    });
    for (let i = 0; i < V.rastro.length; i++) if (V.rastro[i] > 0) V.rastro[i] = Math.max(0, V.rastro[i] - dt * 2.6);
  };

  V.dibujarFijo = function (ctx, nHilos) {
    const y0 = V.y0, h = V.filas * V.celda;
    ctx.save();
    // rejilla finísima
    ctx.strokeStyle = "rgba(125,255,154,0.035)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let c = 0; c <= V.cols; c += 2) { ctx.moveTo(c * V.celda, y0); ctx.lineTo(c * V.celda, y0 + h); }
    for (let f = 0; f <= V.filas; f += 2) { ctx.moveTo(0, y0 + f * V.celda); ctx.lineTo(1920, y0 + f * V.celda); }
    ctx.stroke();
    // horizonte del suelo
    const g = ctx.createLinearGradient(0, y0 - 14, 0, y0 + 4);
    g.addColorStop(0, "rgba(125,255,154,0)"); g.addColorStop(1, "rgba(125,255,154,0.10)");
    ctx.fillStyle = g; ctx.fillRect(0, y0 - 14, 1920, 18);
    ctx.strokeStyle = "rgba(125,255,154,0.28)"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(1920, y0); ctx.stroke();
    // hierba en el horizonte
    {
      const r = H.rng(77);
      ctx.lineWidth = 0.6;
      for (let x = 0; x < 1920; x += 2.2) {
        const h = 3 + r() * 9 + (r() < 0.05 ? 10 : 0);
        const inc = (r() - 0.5) * 5;
        ctx.strokeStyle = `rgba(110,200,140,${0.10 + r() * 0.18})`;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + inc * 0.3, y0 - h * 0.6, x + inc, y0 - h); ctx.stroke();
      }
    }
    // separadores de franjas (hilos)
    V.franjas.forEach((fr, i) => {
      if (i > 0) {
        ctx.strokeStyle = "rgba(125,255,154,0.16)"; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(fr.c0 * V.celda, y0); ctx.lineTo(fr.c0 * V.celda, y0 + h); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    ctx.restore();
  };

  V.dibujarVivo = function (ctx, t) {
    const C = V.cols, F = V.filas, d = V.img.data;
    let pob = 0;
    const cv = H.C.vida;
    for (let i = 0; i < C * F; i++) {
      const o = i * 4;
      if (V.a[i]) {
        pob++;
        const e = Math.min(1, V.edad[i] / 30);
        d[o] = H.mix(225, cv[0] * 0.35, e); d[o + 1] = H.mix(255, cv[1] * 0.5, e); d[o + 2] = H.mix(230, cv[2] * 0.42, e); d[o + 3] = H.mix(255, 200, e);
      } else if (V.rastro[i] > 0) {
        const r = V.rastro[i];
        d[o] = 30; d[o + 1] = 120; d[o + 2] = 100; d[o + 3] = 90 * r;
      } else { d[o + 3] = 0; }
    }
    V.poblacion = pob;
    const lctx = V.lienzo.getContext("2d");
    lctx.putImageData(V.img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // celdas nítidas con un hueco de 1 px (aspecto de rejilla de fósforo)
    ctx.drawImage(V.lienzo, 0, V.y0, C * V.celda, F * V.celda);
    // el hueco de 1 px entre celdas: rejilla oscura precalculada una sola vez
    ctx.drawImage(H.cache("rejillaVida", C * V.celda, F * V.celda, "fija", g => {
      g.strokeStyle = "rgba(4,6,12,0.9)"; g.lineWidth = 1;
      g.beginPath();
      for (let c = 0; c <= C; c++) { g.moveTo(c * V.celda + 0.5, 0); g.lineTo(c * V.celda + 0.5, F * V.celda); }
      for (let f = 0; f <= F; f++) { g.moveTo(0, f * V.celda + 0.5); g.lineTo(C * V.celda, f * V.celda + 0.5); }
      g.stroke();
    }), 0, V.y0, C * V.celda, F * V.celda);
    // resplandor: la misma imagen reducida y difuminada al ampliar
    const p = V.peq.getContext("2d");
    p.clearRect(0, 0, V.peq.width, V.peq.height);
    p.imageSmoothingEnabled = true;
    p.drawImage(V.lienzo, 0, 0, V.peq.width, V.peq.height);
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.16;
    ctx.drawImage(V.peq, -6, V.y0 - 8, C * V.celda + 12, F * V.celda + 16);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    // rótulos de cada hilo
    // rótulos de cada hilo: se redibujan solo cuando cambia el texto
    ctx.fillStyle = H.rgba(cv, 0.5);
    for (const fr of V.franjas) ctx.fillRect(fr.c0 * V.celda, V.y0 - 2, (fr.c1 - fr.c0) * V.celda * fr.carga, 1.5);
    ctx.restore();
  };

  return V;
})();
