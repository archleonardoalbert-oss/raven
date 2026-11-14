// HORTUS ALGORITHMICUS · el cometa de las notificaciones
// Cada notificación del escritorio cruza el cielo como un cometa, dibujado en el
// mismo estilo de grabado que el resto de la lámina y POR DETRÁS de todas las
// figuras (vive en la capa del cielo). Es físicamente coherente:
//   · cola de polvo: curva, sigue la trayectoria, hecha de finas líneas de grabado
//   · cola de iones: recta y azulada, apunta siempre en sentido contrario al sol
//     (el sol de la lámina, en su posición real según la hora)
//   · núcleo pequeño y nítido, con su coma
// y lleva su anotación de figura: «Cometa — aplicación · hora».
"use strict";

H.Cometa = (function () {
  const C = { vivos: [] };

  // tono de la cola de iones según la aplicación (siempre el mismo para la misma)
  function tono(app) {
    let h = 0; for (const ch of app) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const P = [[150, 205, 255], [175, 170, 255], [140, 230, 230], [190, 215, 255], [160, 190, 255]];
    return P[h % P.length];
  }

  C.activo = () => C.vivos.length > 0;

  C.lanzar = function (app) {
    app = String(app || "notificación").slice(0, 28);
    const r = Math.random, izq = r() < 0.5;
    // cruza el cielo entero de lado a lado, en un arco suave (sale de la pantalla)
    const y0 = 90 + r() * 120, y2 = 150 + r() * 200;
    const p0 = { x: izq ? -140 : 2060, y: y0 };
    const p2 = { x: izq ? 2060 : -140, y: y2 };
    const p1 = { x: 960 + (r() - 0.5) * 300, y: Math.min(y0, y2) + 140 + r() * 120 };   // se curva hacia abajo
    const d = new Date();
    const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    const k = { app, hora, c: tono(app), p0, p1, p2, t: 0, dur: 6.5, hist: [] };
    // pruebas: ?cometaU=0.45 lo coloca ya a mitad de recorrido, con su cola hecha
    const u0 = Number(new URLSearchParams(location.search).get("cometaU") || 0);
    if (u0 > 0) for (let i = 109; i >= 0; i--) {
      const uu = Math.max(0, u0 - i * (1 / 60) / k.dur), a = bez(k, uu), b = bez(k, Math.min(1, uu + 0.002));
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      k.hist.unshift({ x: a.x, y: a.y, nx: -(b.y - a.y) / l, ny: (b.x - a.x) / l, id: k.n = (k.n || 0) + 1 });
      k.t = u0 * k.dur;
    }
    C.vivos.push(k);
  };

  function bez(k, u) {
    const v = 1 - u;
    return { x: v * v * k.p0.x + 2 * v * u * k.p1.x + u * u * k.p2.x, y: v * v * k.p0.y + 2 * v * u * k.p1.y + u * u * k.p2.y };
  }

  C.dibujar = function (ctx, dt, sol) {
    ctx.save();
    for (const k of C.vivos) {
      k.t += dt;
      const u = H.clamp(k.t / k.dur, 0, 1);
      const p = bez(k, u), q = bez(k, Math.min(1, u + 0.002));
      let mx = q.x - p.x, my = q.y - p.y; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;   // dirección de avance
      const nx = -my, ny = mx;                                                                     // perpendicular
      k.hist.unshift({ x: p.x, y: p.y, nx, ny, id: k.n = (k.n || 0) + 1 });
      if (k.hist.length > 110) k.hist.pop();
      const vis = Math.min(1, k.t / 0.6, (k.dur - k.t) / 0.6);   // aparece y se va suave

      ctx.globalCompositeOperation = "lighter";
      // ── cola de iones: recta, opuesta al sol, haz de líneas finas ─────────
      let ix = p.x - sol.x, iy = p.y - sol.y; const il = Math.hypot(ix, iy) || 1; ix /= il; iy /= il;
      const largoI = 300;
      for (let j = -3; j <= 3; j++) {
        const a = j * 0.022, ca = Math.cos(a), sa = Math.sin(a);
        const dx = ix * ca - iy * sa, dy = ix * sa + iy * ca;
        const g = ctx.createLinearGradient(p.x, p.y, p.x + dx * largoI, p.y + dy * largoI);
        const al = (j === 0 ? 0.55 : 0.28 - Math.abs(j) * 0.05) * vis;
        g.addColorStop(0, H.rgba(k.c, al)); g.addColorStop(0.5, H.rgba(k.c, al * 0.35)); g.addColorStop(1, H.rgba(k.c, 0));
        ctx.strokeStyle = g; ctx.lineWidth = j === 0 ? 1.1 : 0.7;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dx * largoI * (1 - Math.abs(j) * 0.08), p.y + dy * largoI * (1 - Math.abs(j) * 0.08)); ctx.stroke();
      }
      // ── cola de polvo: curva, sigue la trayectoria y se abre en abanico ────
      // (líneas de grabado paralelas que se separan con la edad, más cálidas)
      const H0 = k.hist, N = H0.length;
      for (let j = -4; j <= 4; j++) {
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const e = i / 110, s = H0[i];
          const abre = j * (0.6 + 14 * e * e) + 9 * e * e * Math.sign(j || 1) * 0.3;
          const x = s.x + s.nx * abre, y = s.y + s.ny * abre;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        const fin = H0[N - 1];
        const g = ctx.createLinearGradient(p.x, p.y, fin.x, fin.y);
        const al = (0.42 - Math.abs(j) * 0.04) * vis;
        g.addColorStop(0, `rgba(255,236,200,${al})`); g.addColorStop(0.4, `rgba(255,220,170,${al * 0.45})`); g.addColorStop(1, "rgba(255,210,160,0)");
        ctx.strokeStyle = g; ctx.lineWidth = j === 0 ? 1.0 : 0.6;
        ctx.stroke();
      }
      // punteado de grabado a lo largo de la cola de polvo
      ctx.fillStyle = `rgba(255,232,195,${0.5 * vis})`;
      // (cada punto va unido a su muestra de la trayectoria: no parpadea al avanzar)
      for (let i = 4; i < N; i++) {
        const s = H0[i]; if (s.id % 3) continue;
        const e = i / 110, o = Math.sin(s.id * 12.9898) * (2 + 12 * e * e);
        if (Math.sin(s.id * 78.233) < 0.2 - e) ctx.fillRect(s.x + s.nx * o - 0.5, s.y + s.ny * o - 0.5, 1, 1);
      }
      // ── coma y núcleo ─────────────────────────────────────────────────────
      H.luz(ctx, p.x, p.y, k.c, 26, 0.45 * vis);
      H.luz(ctx, p.x, p.y, [255, 255, 255], 8, 0.9 * vis);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(255,255,255,${vis})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = `rgba(230,240,255,${0.55 * vis})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, 6.2832); ctx.stroke();

      // ── anotación de figura, como las demás de la lámina ───────────────────
      const lx = p.x + nx * -34 + 10, ly = p.y + ny * -34 - 10;
      ctx.globalAlpha = vis;
      ctx.strokeStyle = "rgba(143,163,192,0.45)"; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(p.x + nx * -8, p.y + ny * -8); ctx.lineTo(lx - 4, ly + 3); ctx.stroke();
      H.texto(ctx, `Cometa — ${k.app}`, lx, ly, "italic 15px Cormorant", "rgba(225,232,244,0.88)");
      ctx.globalAlpha = 1;
    }
    C.vivos = C.vivos.filter(k => k.t < k.dur);
    ctx.restore();
  };

  return C;
})();
