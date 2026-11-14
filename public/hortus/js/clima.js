// HORTUS ALGORITHMICUS · el clima: la temperatura de la CPU gobierna el cielo y el jardín
// El sol y la luna son un termómetro: en frío la luna está alta y el jardín se
// cubre de escarcha; al calentarse la luna se pone, amanece y sale el sol; con
// mucho calor el aire reverbera y las hojas amarillean; ardiendo, el sol se
// vuelve rojo, el cielo se enciende y la hierba arde. Mismo controlador difuso
// (Takagi-Sugeno de orden cero, cuatro trapecios) que tenían las flores: los
// efectos se mezclan de forma continua según el grado de cada conjunto.
// La temperatura se sigue con retraso (~8 s) e histéresis: el cielo se mueve
// con calma aunque la CPU salte de golpe.
"use strict";

H.Clima = (function () {
  const C = {
    T: null, mu: { fria: 1, templada: 0, caliente: 0, ardiente: 0 }, dia: 0,
    escarcha: 1, calor: 0, fuego: 0, clave: null,
    gotas: [], brasas: [], humo: [], escarchaPts: null, llamas: null,
  };
  const SUELO = 944;
  const trap = (x, a, b, c, d) => x <= a || x >= d ? 0 : x < b ? (x - a) / (b - a) : x <= c ? 1 : (d - x) / (d - c);
  function difuso(T) {
    return {
      fria: T <= 60 ? 1 : trap(T, -1, -1, 60, 68),
      templada: trap(T, 60, 66, 70, 76),
      caliente: trap(T, 70, 76, 84, 90),
      ardiente: T >= 86 ? 1 : trap(T, 80, 86, 999, 1000),
    };
  }
  C.difuso = difuso;

  // ── el arco del cielo: el sol sale por la izquierda (desde detrás del suelo) y
  // la luna se pone por la derecha. f = 0 / 1 en el horizonte, 0,5 en lo alto.
  const arco = f => ({ x: 300 + f * 1320, y: 960 - Math.sin(f * Math.PI) * 800 });
  C.posSol = () => arco(C.fSol());
  C.fSol = () => -0.06 + H.clamp((C.T - 62) / 28, 0, 1) * 0.56;
  C.fLuna = () => 0.6 + H.clamp((C.T - 50) / 22, 0, 1) * 0.47;

  // ── paso: suavizado con histéresis y efectos que siguen a su conjunto
  C.paso = function (dt, Tcrudo) {
    if (!isFinite(Tcrudo)) return;
    if (C.T === null) C.T = Tcrudo;
    if (Math.abs(Tcrudo - C.T) > 0.6) C.T += (Tcrudo - C.T) * (1 - Math.exp(-dt / 8));
    const mu = difuso(C.T);
    C.mu = mu;
    C.dia = H.clamp(0.35 * mu.templada + mu.caliente + mu.ardiente, 0, 1);
    const sigue = (v, obj, tau) => C.listo ? v + (obj - v) * (1 - Math.exp(-dt / tau)) : obj;   // al arrancar: ya en su estado
    C.escarcha = sigue(C.escarcha, mu.fria, 3.5);
    C.calor = sigue(C.calor, H.clamp(mu.caliente + mu.ardiente * 0.6, 0, 1), 3);
    C.fuego = sigue(C.fuego, mu.ardiente, 2.5);
    C.clave = Math.round(C.noche() * 40);      // la imagen de estrellas se rehace al cambiar su brillo
    C.listo = true;
    pasoEfectos(dt);
  };

  // ── el cielo (capa de fondo, se repinta cuando cambia la clave) ───────────
  const CIELOS = {
    fria:     { a: [6, 9, 22],     b: [8, 12, 27] },
    templada: { a: [24, 26, 60],   b: [120, 70, 98] },
    caliente: { a: [62, 116, 176], b: [190, 184, 168] },
    ardiente: { a: [104, 50, 40],  b: [232, 118, 56] },
  };
  // ── el cielo: degradado, resplandor, sol y luna se pintan EN CADA FOTOGRAMA
  // (se mueven de forma continua); solo las estrellas van en una imagen aparte
  // que se rehace cuando cambia su brillo (C.clave)
  function coloresCielo() {
    const mu = C.mu;
    let s = 0; const a = [0, 0, 0], b = [0, 0, 0];
    for (const k in mu) { const w = mu[k]; if (!w) continue; s += w; for (let j = 0; j < 3; j++) { a[j] += w * CIELOS[k].a[j]; b[j] += w * CIELOS[k].b[j]; } }
    s = s || 1; for (let j = 0; j < 3; j++) { a[j] /= s; b[j] /= s; }
    return { a, b };
  }
  C.noche = () => H.clamp(C.mu.fria + 0.45 * C.mu.templada, 0, 1);
  C.dibujarEstrellas = function (ctx) { estrellas(ctx, C.noche()); };
  C.componerCielo = function (ctx, capaEstrellas) {
    const { a, b } = coloresCielo(), mu = C.mu;
    const g = ctx.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, H.rgba(a, 1)); g.addColorStop(0.868, H.rgba(b, 1));          // el cielo llega hasta la hierba
    g.addColorStop(0.876, "rgb(6,8,15)"); g.addColorStop(1, "rgb(4,5,10)");          // y debajo, la tierra
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    const m = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(capaEstrellas, 0, 0); ctx.setTransform(m);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 1920, SUELO); ctx.clip();        // el sol y la luna, solo por encima del suelo
    const sp = C.posSol(), calido = H.clamp(mu.templada * 0.8 + mu.caliente * 0.3 + mu.ardiente, 0, 1);
    if (calido > 0.01) {
      const col = H.mix3([255, 150, 110], [255, 90, 40], mu.ardiente);
      const gh = ctx.createRadialGradient(sp.x, SUELO, 0, sp.x, SUELO, 900);
      gh.addColorStop(0, H.rgba(col, 0.45 * calido)); gh.addColorStop(0.4, H.rgba(col, 0.14 * calido)); gh.addColorStop(1, H.rgba(col, 0));
      ctx.fillStyle = gh; ctx.fillRect(0, 0, 1920, SUELO);
    }
    luna(ctx);
    sol(ctx);
    ctx.restore();
  };

  // estrellas nítidas, de borde a borde, con banda de la Vía Láctea; al amanecer
  // se apagan una a una (las más débiles antes), no todas a la vez
  function estrellas(ctx, noche) {
    if (noche <= 0.01) return;
    const r = H.rng(314);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const estrella = (x, y, b, tint, umbral) => {
      const v = H.clamp((noche - umbral) / 0.35, 0, 1);
      if (v <= 0) return;
      const al = (0.18 + 0.82 * b) * v;
      const rgb = tint < 0.18 ? "255,222,195" : tint < 0.42 ? "195,212,255" : "238,242,255";
      ctx.fillStyle = `rgba(${rgb},${al.toFixed(3)})`;
      const sz = b > 0.55 ? 2 : 1;
      ctx.fillRect(x, y, sz, sz);
      if (b > 0.8) {
        ctx.fillStyle = `rgba(${rgb},${(0.35 * v).toFixed(3)})`;
        ctx.fillRect(x - 4, y, 3, 1); ctx.fillRect(x + sz + 1, y, 3, 1);
        ctx.fillRect(x, y - 4, 1, 3); ctx.fillRect(x, y + sz + 1, 1, 3);
      }
    };
    for (let i = 0; i < 2600; i++) {
      const x = Math.round(-6 + r() * 1932), y = Math.round(-6 + r() * 940);
      const b = Math.pow(r(), 3.2), tint = r(), salta = r() > 1 - H.clamp((y - 560) / 380, 0, 1) * 0.92, u = r();
      if (salta) continue;
      estrella(x, y, b, tint, (1 - b) * 0.55 + u * 0.4);
    }
    const ax = -200, ay = 900, bx = 2120, by = -120, L2 = Math.hypot(bx - ax, by - ay);
    for (let i = 0; i < 2200; i++) {
      const u = r(), g = (r() + r() + r() - 1.5) * 95 * (0.75 + 0.5 * Math.sin(u * 9.1));
      const x = Math.round(ax + (bx - ax) * u - (by - ay) / L2 * g), y = Math.round(ay + (by - ay) * u + (bx - ax) / L2 * g);
      const b = Math.pow(r(), 4.5) * 0.9, tint = r(), um = 0.45 + r() * 0.5;
      if (y > 930 || y < -6 || x < -6 || x > 1926) continue;
      estrella(x, y, b, tint, um);
    }
    ctx.restore();
  }

  // luna: disco pintado una vez a alta resolución (mares, cráteres con luz y
  // sombra, oscurecimiento del borde) y halo suave; cerca del horizonte se
  // achata y se vuelve anaranjada
  function spriteLuna(R) {
    if (C._luna && C._lunaR === R) return C._luna;
    const S = 4, c = document.createElement("canvas"); c.width = c.height = Math.ceil(R * 2 * S + 4);
    const g = c.getContext("2d"); g.setTransform(S, 0, 0, S, R * S + 2, R * S + 2);
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, 6.2832); g.clip();
    g.fillStyle = "rgb(232,234,240)"; g.fillRect(-R, -R, R * 2, R * 2);
    const r = H.rng(1969);
    // mares: manchas grises suaves, agrupadas como en la luna de verdad
    for (const [x, y, rr] of [[-0.32, -0.28, 0.34], [0.05, -0.38, 0.22], [0.28, -0.05, 0.26], [-0.12, 0.12, 0.3], [0.18, 0.36, 0.2], [-0.45, 0.25, 0.16], [0.42, -0.4, 0.12]]) {
      for (let k = 0; k < 5; k++) {
        const gx = (x + (r() - 0.5) * 0.12) * R, gy = (y + (r() - 0.5) * 0.12) * R, gr = rr * R * (0.6 + r() * 0.5);
        const gm = g.createRadialGradient(gx, gy, 0, gx, gy, gr);
        gm.addColorStop(0, "rgba(120,124,138,0.32)"); gm.addColorStop(1, "rgba(120,124,138,0)");
        g.fillStyle = gm; g.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
    }
    // cráteres: borde iluminado arriba-derecha, sombra abajo-izquierda
    for (let k = 0; k < 26; k++) {
      const a = r() * 6.2832, d = Math.sqrt(r()) * R * 0.9, cx = Math.cos(a) * d, cy = Math.sin(a) * d, cr = (0.02 + Math.pow(r(), 2.5) * 0.09) * R;
      g.fillStyle = "rgba(90,92,104,0.35)"; g.beginPath(); g.arc(cx, cy, cr, 0, 6.2832); g.fill();
      g.strokeStyle = "rgba(255,255,255,0.45)"; g.lineWidth = cr * 0.35; g.beginPath(); g.arc(cx, cy, cr, -2.2, 0.4); g.stroke();
    }
    // Tycho, con sus rayos tenues
    g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 0.15;
    for (let k = 0; k < 10; k++) { const a = k * 0.63; g.beginPath(); g.moveTo(-0.05 * R, 0.62 * R); g.lineTo(-0.05 * R + Math.cos(a) * R * 0.7, 0.62 * R + Math.sin(a) * R * 0.7); g.stroke(); }
    // oscurecimiento del borde y luz que viene de arriba a la derecha
    const lb = g.createRadialGradient(R * 0.25, -R * 0.25, R * 0.2, 0, 0, R * 1.02);
    lb.addColorStop(0, "rgba(255,255,255,0.12)"); lb.addColorStop(0.7, "rgba(0,0,0,0)"); lb.addColorStop(1, "rgba(20,24,40,0.45)");
    g.fillStyle = lb; g.fillRect(-R, -R, R * 2, R * 2);
    g.restore();
    C._luna = c; C._lunaR = R;
    return c;
  }
  function luna(ctx) {
    const f = C.fLuna();
    if (f >= 1.06) return;
    const p = arco(f), alt = H.clamp(Math.sin(f * Math.PI) * 1.6, 0, 1);
    const visible = H.clamp(1 - C.dia * 1.1, 0, 1);
    if (visible <= 0.01) return;
    const rojo = 1 - alt, col = H.mix3([214, 224, 255], [255, 170, 110], rojo * 0.8), R = 17;
    // aureola: halo suave y un anillo muy tenue
    const gl = ctx.createRadialGradient(p.x, p.y, R * 0.8, p.x, p.y, R * 9);
    gl.addColorStop(0, H.rgba(col, 0.2 * visible)); gl.addColorStop(0.3, H.rgba(col, 0.06 * visible)); gl.addColorStop(1, H.rgba(col, 0));
    ctx.fillStyle = gl; ctx.fillRect(p.x - R * 9, p.y - R * 9, R * 18, R * 18);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.88 + 0.12 * alt);
    const sp = spriteLuna(R), lado = sp.width / 4;
    ctx.globalAlpha = visible; ctx.drawImage(sp, -lado / 2, -lado / 2, lado, lado);
    if (rojo > 0.05) { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = H.rgba([255, 160, 100], rojo * 0.7 * visible); ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }

  // sol: disco con oscurecimiento del borde (centro blanco cálido, borde
  // anaranjado), corona suave y rayos muy discretos; ardiendo, más grande y rojo
  function sol(ctx) {
    const f = C.fSol();
    if (f <= -0.05) return;
    const p = arco(f), alt = H.clamp(Math.sin(Math.max(0, f) * Math.PI) * 1.6, 0, 1);
    const mu = C.mu, fuerza = H.clamp(0.35 * mu.templada + mu.caliente + mu.ardiente, 0, 1);
    const col = H.mix3(H.mix3([255, 226, 170], [255, 86, 46], mu.ardiente), [255, 116, 66], (1 - alt) * 0.7);
    const R = 17 + 9 * mu.ardiente;
    // corona: resplandor contenido (no deslumbra)
    const g1 = ctx.createRadialGradient(p.x, p.y, R * 0.9, p.x, p.y, R * (5 + 4 * fuerza));
    g1.addColorStop(0, H.rgba(col, 0.32 * fuerza + 0.1)); g1.addColorStop(0.25, H.rgba(col, 0.1 * fuerza + 0.03)); g1.addColorStop(1, H.rgba(col, 0));
    ctx.fillStyle = g1; ctx.fillRect(p.x - R * 9, p.y - R * 9, R * 18, R * 18);
    // rayos muy discretos, que giran despacio
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((performance.now() / 1000) * 0.02); ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * 6.2832, l = R * (k % 2 ? 2.6 : 3.8);
      const gr = ctx.createLinearGradient(0, 0, Math.cos(a) * l, Math.sin(a) * l);
      gr.addColorStop(0, H.rgba(col, 0.07 * fuerza)); gr.addColorStop(1, H.rgba(col, 0));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.08) * R, Math.sin(a - 0.08) * R); ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l); ctx.lineTo(Math.cos(a + 0.08) * R, Math.sin(a + 0.08) * R); ctx.fill();
    }
    ctx.restore();
    // disco achatado cerca del horizonte, con oscurecimiento del borde
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.8 + 0.2 * alt);
    const gd = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    gd.addColorStop(0, H.rgba(H.mix3(col, [255, 252, 240], 0.75), 1)); gd.addColorStop(0.7, H.rgba(H.mix3(col, [255, 240, 210], 0.35), 1)); gd.addColorStop(1, H.rgba(col.map((v, i) => v * (i ? 0.82 : 0.95)), 1));
    ctx.fillStyle = gd; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  // ── efectos del jardín (capa viva) ────────────────────────────────────────
  function prepararPuntos() {
    const A = H.Arbol;
    if (!A || !A.hojas || !A.hojas.length || !A.hojas[0].follaje) return false;
    if (C.escarchaPts && C.escarchaDe === A.claveLienzo) return true;
    const r = H.rng(88), pts = [];
    for (const h of A.hojas) for (const f of h.follaje) if (f.b > 0.45 && r() < 0.12) pts.push({ x: f.x, y: f.y, um: r(), vis: false });
    C.escarchaPts = pts; C.escarchaDe = A.claveLienzo;
    // focos de fuego por toda la hierba (cada uno prende a su umbral)
    C.llamas = [];
    for (let i = 0; i < 64; i++) C.llamas.push({ x: 15 + r() * 1890, um: r() * 0.85, ac: 0, acH: 0, ancho: 7 + r() * 9, fuerza: 0.7 + r() * 0.5, antes: 0 });
    C.llamas.sort((p, q) => p.x - q.x);
    return true;
  }

  // ── sprites del fuego y del humo (se pintan una vez) ──────────────────────
  // fuego: 24 tonos de la llama (blanco amarillento → naranja → rojo oscuro)
  function rampaFuego() {
    if (C._rampa) return C._rampa;
    const tonos = [[255, 248, 210], [255, 214, 120], [255, 150, 40], [232, 82, 20], [150, 30, 12]];
    C._rampa = Array.from({ length: 24 }, (_, i) => {
      const u = i / 23, k = Math.min(3, Math.floor(u * 4)), f = u * 4 - k, col = H.mix3(tonos[k], tonos[k + 1], f);
      const c = document.createElement("canvas"); c.width = c.height = 48;
      const g = c.getContext("2d"), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
      gr.addColorStop(0, H.rgba(col, 1)); gr.addColorStop(0.45, H.rgba(col, 0.55)); gr.addColorStop(1, H.rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
      return c;
    });
    return C._rampa;
  }
  // humo: bocanadas irregulares (varias manchas suaves solapadas), oscura y clara
  function spritesHumo() {
    if (C._humo) return C._humo;
    const r = H.rng(77);
    C._humo = [[46, 40, 42], [118, 112, 114]].map(col => [0, 1, 2].map(() => {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const g = c.getContext("2d");
      for (let k = 0; k < 14; k++) {
        const a = r() * 6.2832, d = r() * 30, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * 0.8, rr = 18 + r() * 26;
        const gr = g.createRadialGradient(x, y, 0, x, y, rr);
        gr.addColorStop(0, H.rgba(col, 0.22 + r() * 0.12)); gr.addColorStop(1, H.rgba(col, 0));
        g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      return c;
    }));
    return C._humo;
  }

  function pasoEfectos(dt) {
    if (!prepararPuntos()) return;
    const t = (C.reloj = (C.reloj || 0) + dt);
    // escarcha que se derrite: suelta gotas
    for (const p of C.escarchaPts) {
      const vis = C.escarcha > p.um * 0.95 + 0.04;
      p.vis = vis;
    }
    for (const g of C.gotas) { g.t += dt; g.vy += 220 * dt; g.y += g.vy * dt; }
    C.gotas = C.gotas.filter(g => g.y < SUELO + 2 && g.t < 4);
  }
  function soltarHumo(x, y, claro) {
    if (C.humo.length >= 170) return;
    C.humo.push({ x, y, r0: 8 + Math.random() * 6, t: 0, vida: 6 + Math.random() * 4, rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.4,
                  sem: Math.random() * 10, var: (Math.random() * 3) | 0, claro });
  }

  C.dibujarVivo = function (ctx, t) {
    if (!C.escarchaPts) return;
    ctx.save();
    // gotas del deshielo
    for (const g of C.gotas) { ctx.fillStyle = `rgba(200,225,255,${0.8 * (1 - g.t / 4)})`; ctx.fillRect(g.x - 0.6, g.y - 1.5, 1.2, 2.6); }
    ctx.restore();
  };

  // ── calima: el aire caliente refracta la luz y hace temblar lo que hay
  // detrás. Se copia la franja justo encima del suelo (todas las capas ya
  // pintadas) y se redibuja desplazada fila a fila con ondas que suben.
  C.distorsion = function (capas) {
    const I = H.clamp(C.calor * 0.6 + C.fuego * 0.8, 0, 1);
    if (I < 0.03) return;
    const ctx = capas.viva.ctx, m = ctx.getTransform(), e = m.a;          // e = escala·dpr
    const alto = 30 + 30 * C.fuego;                                      // en px de la lámina
    const y0 = Math.floor(m.f + (SUELO - alto) * e), hh = Math.ceil(alto * e), W = capas.viva.c.width;
    if (!C._tira) C._tira = document.createElement("canvas");
    const tira = C._tira;
    if (tira.width !== W || tira.height !== hh) { tira.width = W; tira.height = hh; }
    const g = tira.getContext("2d");
    g.clearRect(0, 0, W, hh);
    for (const k of ["cielo", "estructura", "viva"]) g.drawImage(capas[k].c, 0, y0, W, hh, 0, 0, W, hh);
    const t = (C.reloj || 0), fila = Math.max(2, Math.round(2 * e));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let y = 0; y < hh; y += fila) {
      const v = y / hh;                                                  // 0 arriba … 1 junto al suelo
      const fuerza = I * Math.pow(v, 1.4) * e;                            // tiembla más cerca del suelo
      const dx = (Math.sin(y * 0.55 / e - t * 7.5) * 1.3 + Math.sin(y * 0.23 / e - t * 4.1 + 1.7) * 0.9) * fuerza;
      const dy = Math.sin(y * 0.4 / e - t * 6) * 0.35 * fuerza;
      ctx.drawImage(tira, 0, y, W, fila, dx, y0 + y + dy, W, fila);
    }
    // aire caliente: un velo cálido muy leve que respira
    const gq = ctx.createLinearGradient(0, y0, 0, y0 + hh);
    gq.addColorStop(0, "rgba(255,225,185,0)"); gq.addColorStop(1, `rgba(255,225,185,${0.05 * I * (0.85 + 0.15 * Math.sin(t * 3))})`);
    ctx.fillStyle = gq; ctx.fillRect(0, y0, W, hh);
    ctx.restore();
  };

  return C;
})();
