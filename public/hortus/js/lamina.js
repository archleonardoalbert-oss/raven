// HORTUS ALGORITHMICUS · la lámina: cielo según la hora, marco grabado, título,
// leyenda y Fig. V — Horologium binarium (la hora en binario, en faroles).
"use strict";

H.Lamina = (function () {
  const L = { ruido: null };

  // paleta del cielo por hora: colores planos y uniformes (arriba / abajo casi iguales)
  const CIELO = [
    { h: 0, a: [6, 9, 22], b: [8, 12, 27] },
    { h: 5.5, a: [6, 9, 22], b: [8, 12, 27] },
    { h: 7, a: [20, 22, 46], b: [44, 32, 56] },
    { h: 9, a: [12, 30, 54], b: [16, 38, 62] },
    { h: 16, a: [12, 30, 54], b: [16, 38, 62] },
    { h: 18.5, a: [24, 18, 44], b: [58, 30, 46] },
    { h: 20.5, a: [7, 10, 24], b: [9, 13, 29] },
    { h: 24, a: [6, 9, 22], b: [8, 12, 27] },
  ];
  function cielo(h) {
    let i = 0; while (i < CIELO.length - 2 && h > CIELO[i + 1].h) i++;
    const A = CIELO[i], B = CIELO[i + 1], f = H.suave(H.clamp((h - A.h) / (B.h - A.h), 0, 1));
    return { a: H.mix3(A.a, B.a, f), b: H.mix3(A.b, B.b, f) };
  }

  // ── el sol, regulado con lógica difusa (Takagi-Sugeno) según la hora ─────
  const trap = (x, a, b, c, d) => x <= a || x >= d ? 0 : x < b ? (x - a) / (b - a) : x <= c ? 1 : (d - x) / (d - c);
  const REGLAS_SOL = {
    noche:     { brillo: 0.00, c: [190, 210, 255] },
    amanecer:  { brillo: 0.35, c: [255, 150, 90] },
    mañana:    { brillo: 0.75, c: [255, 222, 165] },
    mediodía:  { brillo: 1.00, c: [255, 250, 225] },
    tarde:     { brillo: 0.70, c: [255, 212, 145] },
    atardecer: { brillo: 0.30, c: [255, 105, 65] },
  };
  L.solDifuso = function (h) {
    const mu = {
      noche: h <= 5 || h >= 21 ? 1 : Math.max(trap(h, -1, -1, 5, 6.5), trap(h, 19.5, 21, 25, 26)),
      amanecer: trap(h, 5, 6.5, 7, 8.5),
      mañana: trap(h, 7, 9, 10.5, 12),
      mediodía: trap(h, 10.5, 12, 14, 15.5),
      tarde: trap(h, 14, 15.5, 16.5, 18),
      atardecer: trap(h, 16.5, 18, 18.5, 20),
    };
    let suma = 0, brillo = 0; const c = [0, 0, 0];
    for (const k in mu) {
      const w = mu[k]; if (!w) continue;
      suma += w; brillo += w * REGLAS_SOL[k].brillo;
      for (let j = 0; j < 3; j++) c[j] += w * REGLAS_SOL[k].c[j];
    }
    suma = suma || 1;
    let dom = "noche"; for (const k in mu) if (mu[k] > mu[dom]) dom = k;
    return { mu, brillo: brillo / suma, c: c.map(v => v / suma), dom, luna: mu.noche };
  };

  // posición del sol en su arco (fuera de 5–21 h sigue bajo el horizonte):
  // la usa la cola de iones del cometa, que siempre apunta lejos del sol
  L.posSol = function (hora) {
    const f = (hora - 5) / 16;
    return { x: 840 + f * 640, y: 340 - Math.sin(f * Math.PI) * 260 };
  };

  L.dibujarFondo = function (ctx, hora) {
    const c = cielo(hora);
    const g = ctx.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, H.rgba(c.a, 1));
    g.addColorStop(0.78, H.rgba(c.b, 1));
    g.addColorStop(0.88, "rgb(6,8,15)");
    g.addColorStop(1, "rgb(4,5,10)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    const S = L.solDifuso(hora);
    const noche = 0.25 + 0.75 * (1 - S.brillo);       // las estrellas se apagan con el sol

    // estrellas nítidas: posiciones enteras, 1 o 2 px exactos, sin difuminar.
    // Cubren TODO el ancho y siguen más allá del borde (las del filo salen
    // cortadas), así el cielo parece continuar fuera de la pantalla; se hacen
    // más raras al bajar hacia el horizonte. Una banda más densa (la Vía Láctea,
    // solo estrellas, sin bruma) cruza en diagonal de borde a borde.
    {
      const r = H.rng(314);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const estrella = (x, y, b, tint) => {
        const a = (0.18 + 0.82 * b) * noche;
        const rgb = tint < 0.18 ? "255,222,195" : tint < 0.42 ? "195,212,255" : "238,242,255";
        ctx.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
        const sz = b > 0.55 ? 2 : 1;
        ctx.fillRect(x, y, sz, sz);
        if (b > 0.8) {          // las más brillantes con destello en cruz, de 1 px
          ctx.fillStyle = `rgba(${rgb},${(0.35 * noche).toFixed(3)})`;
          ctx.fillRect(x - 4, y, 3, 1); ctx.fillRect(x + sz + 1, y, 3, 1);
          ctx.fillRect(x, y - 4, 1, 3); ctx.fillRect(x, y + sz + 1, 1, 3);
        }
      };
      // campo general: de borde a borde, desde arriba hasta cerca del horizonte
      for (let i = 0; i < 2600; i++) {
        const x = Math.round(-6 + r() * 1932), y = Math.round(-6 + r() * 940);
        const b = Math.pow(r(), 3.2), tint = r();
        if (r() > 1 - H.clamp((y - 560) / 380, 0, 1) * 0.92) continue;   // se aclaran al bajar
        estrella(x, y, b, tint);
      }
      // la banda: recta de (−200, 900) a (2120, −120), anchura gaussiana
      const ax = -200, ay = 900, bx = 2120, by = -120, L2 = Math.hypot(bx - ax, by - ay);
      for (let i = 0; i < 2200; i++) {
        const u = r(), g = (r() + r() + r() - 1.5) * 95 * (0.75 + 0.5 * Math.sin(u * 9.1));
        const x = Math.round(ax + (bx - ax) * u - (by - ay) / L2 * g);
        const y = Math.round(ay + (by - ay) * u + (bx - ax) / L2 * g);
        if (y > 930 || y < -6 || x < -6 || x > 1926) continue;
        estrella(x, y, Math.pow(r(), 4.5) * 0.9, r());
      }
      ctx.restore();
    }

    // sol (de día) y luna (de noche) recorriendo el cielo
    const arco = f => ({ x: Math.round(840 + f * 640), y: Math.round(340 - Math.sin(f * Math.PI) * 260) });
    ctx.setLineDash([1, 6]); ctx.strokeStyle = "rgba(143,163,192,0.12)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k <= 60; k++) { const p = arco(k / 60); k ? ctx.lineTo(p.x + 0.5, p.y + 0.5) : ctx.moveTo(p.x + 0.5, p.y + 0.5); }
    ctx.stroke(); ctx.setLineDash([]);
    if (S.brillo > 0.01 && hora > 5 && hora < 21) {
      const p = arco(H.clamp((hora - 5) / 16, 0, 1)), b = S.brillo, col = S.c;
      const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 90 + 230 * b);
      gl.addColorStop(0, H.rgba(col, 0.30 * b)); gl.addColorStop(0.25, H.rgba(col, 0.10 * b)); gl.addColorStop(1, H.rgba(col, 0));
      ctx.fillStyle = gl; ctx.fillRect(p.x - 330, p.y - 330, 660, 660);
      ctx.fillStyle = H.rgba(col, 0.25 + 0.7 * b);
      ctx.beginPath(); ctx.arc(p.x + 0.5, p.y + 0.5, 11, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = H.rgba(col, 0.5 + 0.5 * b); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x + 0.5, p.y + 0.5, 14, 0, 6.2832); ctx.stroke();
      const nR = 16, largo = 6 + 12 * b;
      ctx.beginPath();
      for (let k = 0; k < nR; k++) {
        const a = k / nR * 6.2832, l = k % 2 ? largo * 0.55 : largo;
        ctx.moveTo(p.x + 0.5 + Math.cos(a) * 18, p.y + 0.5 + Math.sin(a) * 18);
        ctx.lineTo(p.x + 0.5 + Math.cos(a) * (18 + l), p.y + 0.5 + Math.sin(a) * (18 + l));
      }
      ctx.stroke();
      L.rotuloSol = { x: p.x + 30, y: p.y + 4, S };
    } else L.rotuloSol = null;
    if (S.luna > 0.01) {
      const fN = ((hora + 24 - 19.5) % 24) / 10.5;
      const p = arco(H.clamp(fN, 0, 1)), a = S.luna;
      const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 150);
      gl.addColorStop(0, `rgba(190,210,255,${0.12 * a})`); gl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gl; ctx.fillRect(p.x - 160, p.y - 160, 320, 320);
      ctx.fillStyle = `rgba(215,225,255,${0.85 * a})`;
      ctx.beginPath(); ctx.arc(p.x + 0.5, p.y + 0.5, 10, 0, 6.2832); ctx.fill();
      ctx.fillStyle = H.rgba(cielo(hora).a, 1);
      ctx.beginPath(); ctx.arc(p.x + 4.5, p.y - 1.5, 9, 0, 6.2832); ctx.fill();
      if (!L.rotuloSol) L.rotuloSol = { x: p.x + 24, y: p.y + 4, S };
    }
  };

  // rótulo del sol: el estado del controlador difuso
  L.dibujarRotuloSol = function (ctx) {
    return;     // sin textos: solo queda el título
    const R = L.rotuloSol; if (!R) return;
    const S = R.S, col = S.brillo > 0.01 ? H.rgba(S.c.map(v => Math.round(v / 16) * 16), 0.75) : "rgba(200,215,255,0.6)";
    H.texto(ctx, S.brillo > 0.01 ? `sol · brillo ${S.brillo.toFixed(2)}` : `luna · ${S.luna.toFixed(2)}`, R.x, R.y, "9px JBM", col);
    H.texto(ctx, `difuso: si la hora es ${S.dom} (μ ${S.mu[S.dom].toFixed(2)})`, R.x, R.y + 12, "8px JBM", "rgba(143,163,192,0.5)");
  };

  // marco con reglas graduadas, como una lámina grabada
  L.dibujarMarco = function (ctx, info) {
    ctx.save();
    // sin marco ni reglas: el cielo llega hasta el borde de la pantalla (inmersivo)
    ctx.lineWidth = 0.8;
    // título
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(225,232,244,0.92)";
    ctx.font = "500 44px Cormorant";
    ctx.letterSpacing = "7px";
    ctx.fillText("HORTUS ALGORITHMICUS", 70, 106);
    ctx.letterSpacing = "0px";
    ctx.restore();
  };

  // información del sistema bajo el título (cambia cada segundo)
  L.dibujarInfo = function (ctx, d) {
    return;     // sin textos: solo queda el título
    if (!d.sistema) return;
    ctx.save();
    const s = d.sistema;
    H.texto(ctx, `${s.host} · ${s.kernel} · activo ${s.activo} · ram ${d.ram ? d.ram.pct.toFixed(0) : "?"} % · batería ${d.bat ? d.bat.pct.toFixed(0) + " % " + d.bat.estado : "?"}`, 72, 205, "8.5px JBM", "rgba(143,163,192,0.45)");
    ctx.restore();
  };

  // Fig. V — reloj binario en faroles colgados de una guirnalda
  L.dibujarReloj = function (ctx, fecha, t) {
    const h = fecha.getHours(), m = fecha.getMinutes(), s = fecha.getSeconds();
    const x0 = 1560, y0 = 70;
    ctx.save();
    const filas = [["h", h, 5], ["m", m, 6], ["s", s, 6]];
    const sep = 34;
    filas.forEach(([nom, v, bits], fi) => {
      const y = y0 + 40 + fi * 38;
      // guirnalda
      ctx.strokeStyle = "rgba(255,233,176,0.2)"; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(x0 + 18, y - 14);
      for (let b = 0; b <= 6; b++) ctx.quadraticCurveTo(x0 + 30 + (b - 0.5) * sep, y - 8, x0 + 30 + b * sep - (b === 6 ? sep / 2 : 0), y - 14);
      ctx.stroke();
      for (let b = 0; b < 6; b++) {
        const pos = 5 - b;
        const x = x0 + 30 + b * sep;
        if (pos >= bits) continue;
        const on = (v >> pos) & 1;
        const bal = Math.sin(t * 1.3 + b + fi * 2) * 1.2;
        // cuerda y farol
        ctx.strokeStyle = "rgba(255,233,176,0.25)";
        ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + bal, y - 7); ctx.stroke();
        ctx.fillStyle = on ? "rgba(255,233,176,0.95)" : "rgba(255,233,176,0.06)";
        ctx.strokeStyle = on ? "rgba(255,233,176,0.9)" : "rgba(255,233,176,0.3)";
        ctx.beginPath(); ctx.roundRect(x - 5 + bal, y - 7, 10, 13, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,233,176,0.4)";
        ctx.fillRect(x - 3 + bal, y - 8.5, 6, 1.5); ctx.fillRect(x - 3 + bal, y + 6, 6, 1.5);
        if (on) {
          ctx.globalCompositeOperation = "lighter";
          H.luz(ctx, x + bal, y, H.C.farol, 22, 0.55 + 0.1 * Math.sin(t * 7 + b));
          ctx.globalCompositeOperation = "source-over";
        }
      }
    });
    ctx.restore();
  };

  // Fig. II — anotación de la red (cambia con los datos)
  L.dibujarRotuloRed = function (ctx, d, G) {
    return;     // sin textos: solo queda el título
    const x = 1084, y = 470, T = "rgba(143,163,192,0.6)";
    const E = G.enlace, sitios = [...G.sitios.values()];
    const conTrafico = sitios.filter(s => s.bajada > 0 || s.subida > 0).length;
    H.texto(ctx, "Fig. II — Via Dijkstrae", x, y, "italic 17px Cormorant", "rgba(207,217,234,0.82)");
    H.texto(ctx, `↓ ${H.bytes(d.red.bajada)}/s`, x, y + 15, "9px JBM", "rgba(111,227,255,0.85)");
    H.texto(ctx, `↑ ${H.bytes(d.red.subida)}/s`, x + 100, y + 15, "9px JBM", "rgba(186,146,255,0.85)");
    const salida = !E.conectado ? "SIN CONEXIÓN · nada es alcanzable (d = ∞)"
      : `salida real: ${E.iface} (${E.tipo}) → operador → ${E.vpn ? "wg0 (Proton VPN)" : "internet, sin VPN"}`;
    H.texto(ctx, salida, x, y + 27, "9px JBM", E.conectado ? T : "rgba(255,140,120,0.85)");
    H.texto(ctx, `${sitios.length} sitios conectados · ${conTrafico} con tráfico · ${G.paquetes.length} LEDs en vuelo`, x, y + 39, "9px JBM", T);
    H.texto(ctx, `1 LED = 50 kB · más LEDs, más rápido (${Math.round(G.velocidad || 0)} px/s)`, x, y + 51, "9px JBM", T);
    H.texto(ctx, `rutas en uso: árbol de caminos mínimos · ejecución #${G.ejecuciones}`, x, y + 63, "9px JBM", T);
  };

  return L;
})();
