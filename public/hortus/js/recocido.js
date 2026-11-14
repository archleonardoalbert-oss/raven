// HORTUS ALGORITHMICUS · Fig. III — Recoctio simulata (la temperatura)
// Las luciérnagas recorren todas las flores del prado buscando la ruta más corta
// (el problema del viajante). La resuelven con recocido simulado, un algoritmo que
// usa literalmente una temperatura: aquí es la temperatura REAL de tu CPU.
// En frío solo aceptan cambios que acortan la ruta y el recorrido queda limpio.
// En caliente aceptan empeoramientos con probabilidad e^(−ΔL/τ) y la ruta se enreda.
// Las flores se mecen despacio, así que el algoritmo nunca deja de trabajar.
"use strict";

H.Recocido = (function () {
  const R = {
    flores: [], ruta: [], L: 0, tau: 1, tempC: 45, f: 0,
    intentos: 0, aceptEmp: 0, tasaEmp: 0, iter: 0,
    luciernagas: [], suelo: 944,
  };

  R.crear = function () {
    const r = H.rng(1950);
    const zonas = [{ x0: 40, x1: 300 }, { x0: 1620, x1: 1880 }];   // el centro, para el árbol y sus dos arbolitos
    for (const z of zonas) {
      let n = 0, g = 0;
      while (n < 11 && g++ < 8000) {
        const x = z.x0 + r() * (z.x1 - z.x0), y = 768 + r() * 136;
        if (R.flores.some(f => Math.hypot(f.bx - x, f.by - y) < 50)) continue;
        R.flores.push({ bx: x, by: y, x, y, fase: r() * 6.28, fase2: r() * 6.28, petalos: 5 + ((r() * 3) | 0), tam: 6.5 + r() * 3.5, tallo: r() });
        n++;
      }
    }
    R.ruta = R.flores.map((_, i) => i);
    for (let i = R.ruta.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [R.ruta[i], R.ruta[j]] = [R.ruta[j], R.ruta[i]]; }
    for (let k = 0; k < 5; k++) R.luciernagas.push({ s: k / 5, v: 0.018 + 0.006 * k, fase: k * 1.3 });
  };

  function longitud() {
    let L = 0;
    const F = R.flores, n = R.ruta.length;
    for (let i = 0; i < n; i++) { const a = F[R.ruta[i]], b = F[R.ruta[(i + 1) % n]]; L += Math.hypot(a.x - b.x, a.y - b.y); }
    return L;
  }

  R.paso = function (dt, t, tempC) {
    R.tempC += (tempC - R.tempC) * (1 - Math.exp(-dt * 1.5));
    R.f = H.clamp((R.tempC - 38) / (95 - 38), 0, 1);
    R.tau = 1.5 + 240 * Math.pow(R.f, 2.1);
    // las flores se mecen
    for (const f of R.flores) {
      f.x = f.bx + 16 * Math.sin(t * 0.05 + f.fase) + 5 * Math.sin(t * 0.13 + f.fase2);
      f.y = f.by + 9 * Math.sin(t * 0.04 + f.fase2);
    }
    // recocido: movimientos 2-opt (invertir un tramo de la ruta)
    const F = R.flores, n = R.ruta.length, ruta = R.ruta;
    const d = (i, j) => { const a = F[ruta[(i + n) % n]], b = F[ruta[(j + n) % n]]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const K = 90;
    let emp = 0, intentosEmp = 0;
    for (let k = 0; k < K; k++) {
      let i = (Math.random() * n) | 0, j = (Math.random() * n) | 0;
      if (i === j) continue;
      if (i > j) [i, j] = [j, i];
      if (j - i >= n - 1) continue;
      const delta = d(i - 1, j) + d(i, j + 1) - d(i - 1, i) - d(j, j + 1);
      let acepta = delta < 0;
      if (!acepta) { intentosEmp++; if (Math.random() < Math.exp(-delta / R.tau)) { acepta = true; emp++; } }
      if (acepta) {
        for (let a = i, b = j; a < b; a++, b--) [ruta[a], ruta[b]] = [ruta[b], ruta[a]];
      }
    }
    R.iter += K;
    if (intentosEmp) R.tasaEmp += (emp / intentosEmp - R.tasaEmp) * (1 - Math.exp(-dt * 2));
    R.L = longitud();
    for (const l of R.luciernagas) l.s = (l.s + l.v * dt * (0.6 + R.f)) % 1;
    R.D = difuso(R.tempC);
    R.pasoFuego(dt, t);
  };

  function puntoRuta(s) {
    const F = R.flores, n = R.ruta.length;
    const x = s * n, i = Math.floor(x) % n, g = x - Math.floor(x);
    const a = F[R.ruta[i]], b = F[R.ruta[(i + 1) % n]];
    return { x: H.mix(a.x, b.x, H.suave(g)), y: H.mix(a.y, b.y, H.suave(g)) - 10 * Math.sin(g * Math.PI) };
  }

  // ── controlador difuso de las flores (Takagi-Sugeno de orden cero) ────────
  // Entrada: temperatura de la CPU. Cuatro conjuntos trapezoidales; cada regla
  // propone un aspecto completo y la salida es su media ponderada por el grado
  // de activación, así las flores cambian de forma continua, sin saltos.
  const trap = (x, a, b, c, d) => x <= a || x >= d ? 0 : x < b ? (x - a) / (b - a) : x <= c ? 1 : (d - x) / (d - c);
  const REGLAS = {
    //            color            apertura  marchitez  temblor  rizo
    fria:      { c: [70, 135, 255],  ab: 0.30, mar: 0.00, tem: 0.00, rizo: 0.0, txt: "capullo azul cerrado, escarcha" },
    templada:  { c: [235, 215, 105], ab: 0.75, mar: 0.12, tem: 0.10, rizo: 0.2, txt: "flor amarilla entreabierta" },
    caliente:  { c: [255, 125, 40],  ab: 1.00, mar: 0.50, tem: 0.45, rizo: 0.6, txt: "naranja, abierta y mustia" },
    ardiente:  { c: [255, 48, 28],   ab: 1.12, mar: 0.95, tem: 1.00, rizo: 1.0, txt: "roja, marchita y en llamas" },
  };
  function difuso(T) {
    const mu = {
      fria: T <= 60 ? 1 : trap(T, -1, -1, 60, 68),
      templada: trap(T, 60, 66, 70, 76),
      caliente: trap(T, 70, 76, 84, 90),
      ardiente: T >= 86 ? 1 : trap(T, 80, 86, 999, 1000),
    };
    let suma = 0;
    const o = { c: [0, 0, 0], ab: 0, mar: 0, tem: 0, rizo: 0 };
    for (const k in mu) {
      const w = mu[k], r = REGLAS[k];
      if (!w) continue;
      suma += w;
      o.c[0] += w * r.c[0]; o.c[1] += w * r.c[1]; o.c[2] += w * r.c[2];
      o.ab += w * r.ab; o.mar += w * r.mar; o.tem += w * r.tem; o.rizo += w * r.rizo;
    }
    suma = suma || 1;
    o.c = o.c.map(v => v / suma); o.ab /= suma; o.mar /= suma; o.tem /= suma; o.rizo /= suma;
    o.mu = mu;
    o.escarcha = mu.fria;              // la escarcha y el fuego salen directos
    o.fuego = mu.ardiente;             // del grado de su conjunto
    let dom = "fria"; for (const k in mu) if (mu[k] > mu[dom]) dom = k;
    o.dominante = dom;
    return o;
  }
  R.difuso = difuso;
  R.brasas = [];

  // sprite de una flor para un estado difuso (se rehace solo si cambia ≥ 0,5 °C)
  function florSprite(f, D, clave) {
    if (f.sprite && f.claveSprite === clave) return f.sprite;
    const S = H.SS, ab = D.ab, c = D.c;
    const lado = (f.tam * ab + f.tam * 1.2) * 2 + 8;
    const s = f.sprite || document.createElement("canvas");
    s.width = s.height = Math.ceil(lado * S);
    const g = s.getContext("2d");
    g.setTransform(S, 0, 0, S, lado * S / 2, lado * S / 2);
    // ancho del pétalo: fino y cerrado en frío, ancho en calor
    const ry = f.tam * (0.22 + 0.24 * Math.min(1, ab));
    for (let p = 0; p < f.petalos; p++) {
      // con fuego intenso se caen pétalos (quemados)
      if (D.fuego > 0.55 && (p * 7 + f.petalos) % 5 === 0) continue;
      const a = p / f.petalos * 6.2832;
      const px = Math.cos(a) * f.tam * ab, py = Math.sin(a) * f.tam * ab;
      g.fillStyle = H.rgba(c, 0.30 + 0.25 * D.escarcha);
      g.strokeStyle = D.escarcha > 0.3 ? `rgba(225,240,255,${0.55 + 0.35 * D.escarcha})` : H.rgba(c, 0.7);
      g.lineWidth = 0.55;
      g.beginPath(); g.ellipse(px, py, f.tam * 0.9, ry, a, 0, 6.2832); g.fill(); g.stroke();
      // rizo: la punta del pétalo se dobla con el calor
      if (D.rizo > 0.05) {
        const tx = Math.cos(a) * f.tam * (ab + 0.85), ty = Math.sin(a) * f.tam * (ab + 0.85);
        g.fillStyle = H.rgba(c, 0.45 * D.rizo);
        g.beginPath(); g.ellipse(tx, ty, f.tam * 0.32, ry * 0.7, a + 1.2 * D.rizo, 0, 6.2832); g.fill();
      }
      // bordes chamuscados
      if (D.fuego > 0.05) {
        g.strokeStyle = `rgba(30,10,5,${0.6 * D.fuego})`; g.lineWidth = 0.9;
        g.beginPath(); g.ellipse(px, py, f.tam * 0.9, ry, a, -0.6, 0.6); g.stroke();
      }
    }
    // centro: cian helado en frío, ámbar en calor, brasa en fuego
    const centro = D.escarcha > 0.5 ? "rgba(200,235,255,0.95)" : D.fuego > 0.4 ? "rgba(255,200,90,0.95)" : "rgba(255,240,200,0.9)";
    g.fillStyle = centro;
    g.beginPath(); g.arc(0, 0, 1.4 + 0.6 * ab, 0, 6.2832); g.fill();
    s.lado = lado;
    f.sprite = s; f.claveSprite = clave;
    return s;
  }

  // lengua de fuego: lágrima con núcleo blanco-amarillo y borde rojo
  function llamaSprite() {
    if (R._llama) return R._llama;
    const S = H.SS, w = 10, h = 30, c = document.createElement("canvas");
    c.width = w * S; c.height = h * S;
    const g = c.getContext("2d");
    g.setTransform(S, 0, 0, S, 0, 0);
    const capas = [[1.0, "rgba(255,60,20,0.55)"], [0.7, "rgba(255,140,30,0.7)"], [0.42, "rgba(255,225,120,0.85)"], [0.2, "rgba(255,255,230,0.95)"]];
    for (const [k, col] of capas) {
      g.fillStyle = col;
      g.beginPath();
      const cx = w / 2, base = h - 2, r = (w / 2 - 0.5) * k, top = base - (h - 4) * k;
      g.moveTo(cx, top);
      g.bezierCurveTo(cx + r * 1.1, top + (base - top) * 0.45, cx + r, base, cx, base);
      g.bezierCurveTo(cx - r, base, cx - r * 1.1, top + (base - top) * 0.45, cx, top);
      g.fill();
    }
    return (R._llama = c);
  }
  function destelloSprite() {
    if (R._destello) return R._destello;
    const S = H.SS, c = document.createElement("canvas");
    c.width = c.height = 12 * S;
    const g = c.getContext("2d");
    g.setTransform(S, 0, 0, S, 6 * S, 6 * S);
    g.strokeStyle = "rgba(230,245,255,0.95)"; g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.moveTo(0, -5); g.lineTo(0, 5);
    g.moveTo(-2.2, -2.2); g.lineTo(2.2, 2.2); g.moveTo(-2.2, 2.2); g.lineTo(2.2, -2.2); g.stroke();
    return (R._destello = c);
  }

  // posición de la cabeza de cada flor: se dobla y tiembla según el estado difuso
  function cabeza(f, D, t) {
    const lado = f.tallo < 0.5 ? -1 : 1;
    const jit = D.tem * 1.6;
    return {
      x: f.x + lado * 10 * D.mar + jit * Math.sin(t * 23 + f.fase * 9),
      y: f.y + 14 * D.mar + jit * Math.cos(t * 19 + f.fase2 * 7),
      inclina: lado * 0.9 * D.mar,
    };
  }

  R.pasoFuego = function (dt, t) {
    const D = R.D;
    if (!D) return;
    if (D.fuego > 0.02) {
      for (const f of R.flores) {
        f.acumBrasa = (f.acumBrasa || 0) + dt * 11 * D.fuego;
        while (f.acumBrasa >= 1) {
          f.acumBrasa--;
          const h = cabeza(f, D, t);
          R.brasas.push({ x: h.x + (Math.random() - 0.5) * 12, y: h.y - 4, vx: (Math.random() - 0.5) * 14, vy: -(35 + Math.random() * 45), v: 0, max: 1 + Math.random() * 1.2, fase: Math.random() * 6.28 });
        }
      }
    }
    for (const b of R.brasas) {
      b.v += dt;
      b.x += (b.vx + 10 * Math.sin(t * 3 + b.fase)) * dt;
      b.y += b.vy * dt;
      b.vy *= Math.exp(-dt * 0.4);
    }
    R.brasas = R.brasas.filter(b => b.v < b.max);
    if (R.brasas.length > 500) R.brasas.splice(0, R.brasas.length - 500);
  };

  R.dibujarVivo = function (ctx, t) {
    const F = R.flores, n = R.ruta.length;
    const D = R.D || difuso(R.tempC);
    const c = D.c;
    ctx.save();
    const cabezas = F.map(f => cabeza(f, D, t));
    // tallos (todos en un único trazo): se doblan con la marchitez
    ctx.strokeStyle = D.fuego > 0.3 ? `rgba(${H.mix(125, 90, D.fuego)},${H.mix(200, 70, D.fuego)},${H.mix(150, 40, D.fuego)},0.3)` : "rgba(125,200,150,0.22)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    F.forEach((f, i) => {
      const h = cabezas[i];
      ctx.moveTo(f.bx + (f.tallo - 0.5) * 10, R.suelo + 2);
      ctx.quadraticCurveTo(f.bx + (f.tallo - 0.5) * 30 + (h.x - f.x) * 0.2, (f.y + R.suelo) / 2 - 8 * D.mar, h.x, h.y + f.tam * (1 - 0.6 * D.mar));
    });
    ctx.stroke();
    const m = ctx.getTransform();
    const hojita = H.spriteElipse([125, 200, 150], 6, 2);
    ctx.globalAlpha = 0.16 * (1 - 0.5 * D.fuego);
    for (const f of F) H.rot(ctx, m, hojita, H.mix(f.x, f.bx, 0.55) + 5, H.mix(f.y, R.suelo, 0.55) + 6 * D.mar, -0.5 + 0.9 * D.mar, 12, 4);
    ctx.globalAlpha = 1;

    // halo bajo cada flor: azul sereno en frío, rojo en fuego
    ctx.globalCompositeOperation = "lighter";
    for (const h of cabezas) {
      if (D.escarcha > 0.05) H.luz(ctx, h.x, h.y, [90, 160, 255], 22, 0.32 * D.escarcha);
      if (D.fuego > 0.02) { H.luz(ctx, h.x, h.y - 10, [255, 90, 30], 56, 0.5 * D.fuego); H.luz(ctx, h.x, h.y - 4, [255, 200, 120], 20, 0.35 * D.fuego); }
    }
    ctx.globalCompositeOperation = "source-over";

    // flores (sprite del estado difuso actual, aplastado al inclinarse)
    const clave = Math.round(R.tempC * 2);
    F.forEach((f, i) => {
      const img = florSprite(f, D, clave), h = cabezas[i];
      const giro = t * 0.05 * (1 - D.mar) + f.fase;
      // inclinación: la cabeza cae hacia un lado y, al mirar al suelo, se ve aplastada
      ctx.setTransform(m);
      ctx.translate(h.x, h.y);
      ctx.rotate(h.inclina);
      ctx.scale(1, 1 - 0.5 * D.mar);
      ctx.rotate(giro);
      ctx.drawImage(img, -img.lado / 2, -img.lado / 2, img.lado, img.lado);
    });
    ctx.setTransform(m);

    // escarcha: destellos de hielo alrededor de los capullos
    if (D.escarcha > 0.05) {
      const ds = destelloSprite();
      F.forEach((f, i) => {
        const h = cabezas[i];
        for (let k = 0; k < 3; k++) {
          const a = f.fase * 3 + k * 2.1, r = f.tam * 1.3 + 3;
          const tw = Math.max(0, Math.sin(t * (1.1 + 0.3 * k) + f.fase2 * 5 + k * 2));
          ctx.globalAlpha = D.escarcha * tw * tw * 0.9;
          ctx.drawImage(ds, h.x + Math.cos(a) * r - 4, h.y + Math.sin(a) * r - 4, 8, 8);
        }
      });
      ctx.globalAlpha = 1;
    }

    // fuego: lenguas de llama alrededor de cada flor y brasas que suben
    if (D.fuego > 0.02) {
      const ll = llamaSprite();
      ctx.globalCompositeOperation = "lighter";
      F.forEach((f, i) => {
        const h = cabezas[i];
        const N = 9;
        for (let k = 0; k < N; k++) {
          const a = k / N * 6.2832 + f.fase;
          const r = f.tam * 1.05 + 2;
          const parp = 0.65 + 0.2 * Math.sin(t * 11 + k * 2.3 + f.fase * 5) + 0.15 * Math.sin(t * 17.3 + k * 4.1);
          const alto = (f.tam * 2.6 + f.tam * 2.2 * ((k * 37 + i * 11) % 7) / 7) * parp * (0.45 + 0.55 * D.fuego);
          const ancho = f.tam * 1.1 + 2.5 * parp;
          const x = h.x + Math.cos(a) * r, y = h.y + Math.sin(a) * r * 0.6 + 3;
          const lean = Math.sin(t * 2.1 + k + f.fase) * 0.18;
          ctx.globalAlpha = Math.min(1, D.fuego * 1.2);
          ctx.setTransform(m.a * Math.cos(lean), m.b + m.a * Math.sin(lean), -m.d * Math.sin(lean), m.d * Math.cos(lean), m.a * x + m.e, m.d * y + m.f);
          ctx.drawImage(ll, -ancho / 2, -alto, ancho, alto);
        }
      });
      ctx.setTransform(m);
      ctx.globalAlpha = 1;
      for (const b of R.brasas) {
        const f = 1 - b.v / b.max;
        H.luz(ctx, b.x, b.y, f > 0.5 ? [255, 190, 90] : [255, 90, 40], 8, f * Math.min(1, D.fuego * 1.5));
        H.luz(ctx, b.x, b.y, [255, 240, 200], 3, f * 0.8 * Math.min(1, D.fuego * 1.5));
      }
      ctx.globalCompositeOperation = "source-over";
    }

    // la ruta actual
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = H.rgba(c, 0.38);
    ctx.lineWidth = 0.9;
    ctx.setLineDash([3, 4]);
    ctx.lineDashOffset = -t * 12;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const f = F[R.ruta[i % n]]; i ? ctx.lineTo(f.x, f.y) : ctx.moveTo(f.x, f.y); }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "lighter";
    // luciérnagas: parpadeo de luciérnaga (destello corto y pausa)
    for (const l of R.luciernagas) {
      const p = puntoRuta(l.s);
      const ciclo = (t * 0.8 + l.fase) % 1;
      const destello = ciclo < 0.18 ? Math.sin(ciclo / 0.18 * Math.PI) : 0;
      H.luz(ctx, p.x, p.y, c.map(Math.round), 26, 0.25 + 0.75 * destello);
      H.luz(ctx, p.x, p.y, [255, 250, 220], 6, 0.5 + 0.5 * destello);
      for (let k = 1; k < 8; k++) {
        const q = puntoRuta((l.s - k * 0.0025 + 1) % 1);
        H.luz(ctx, q.x, q.y, c.map(Math.round), 6, 0.12 * (1 - k / 8));
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  };

  return R;
})();
