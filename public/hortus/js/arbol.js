// HORTUS ALGORITHMICUS · Fig. I — Arbor B+ (el disco)
// Tu raíz es btrfs, un sistema de archivos hecho de árboles B. Aquí el árbol es un
// B+ real de orden 5 (máx. 4 claves por nodo): cada clave vale el 2 % del disco
// ocupado. Las claves se insertan con el algoritmo de verdad: cuando una hoja se
// llena se parte en dos y la clave separadora sube al padre. Está dibujado como
// un árbol vivo: raíz en el suelo, ramas que se dividen, hojas en la copa unidas
// por los punteros entre hermanas. Cada lectura del disco es una búsqueda (savia
// que sube de la raíz a la hoja) y cada escritura enciende su clave.
"use strict";

H.Arbol = (function () {
  const MAXK = 4;
  const A = {
    raiz: null, n: 0, hojas: [], niveles: [], altura: 1,
    secuencia: [], busquedas: [], fx: [], sucio: true,
    acumL: 0, acumE: 0, ultimaNueva: null, tCambio: 99,
    suelo: 944,                 // = H.Vida.y0: la línea de la tierra
  };

  // objectids «de btrfs» inventados pero fijos: 3 cifras hex, todos distintos
  (function () {
    const r = H.rng(7331), usados = new Set();
    while (A.secuencia.length < 50) {
      const k = 0x100 + ((r() * 0xEFF) | 0);
      if (!usados.has(k)) { usados.add(k); A.secuencia.push(k); }
    }
  })();

  const hoja = () => ({ hoja: true, k: [], hijos: null, sig: null });
  const interno = () => ({ hoja: false, k: [], hijos: [] });

  function insertar(raiz, clave) {
    const r = ins(raiz, clave);
    if (!r) return raiz;
    const nr = interno();
    nr.k = [r.sep]; nr.hijos = [raiz, r.der];
    return nr;
  }
  function ins(nodo, clave) {
    if (nodo.hoja) {
      let i = 0; while (i < nodo.k.length && nodo.k[i] < clave) i++;
      nodo.k.splice(i, 0, clave);
      if (nodo.k.length <= MAXK) return null;
      const der = hoja(), m = Math.ceil(nodo.k.length / 2);
      der.k = nodo.k.splice(m); der.sig = nodo.sig; nodo.sig = der;
      return { sep: der.k[0], der };                  // B+: la separadora se copia
    }
    let i = 0; while (i < nodo.k.length && clave >= nodo.k[i]) i++;
    const r = ins(nodo.hijos[i], clave);
    if (!r) return null;
    nodo.k.splice(i, 0, r.sep); nodo.hijos.splice(i + 1, 0, r.der);
    if (nodo.k.length <= MAXK) return null;
    const der = interno(), m = Math.floor(nodo.k.length / 2);
    const sep = nodo.k[m];
    der.k = nodo.k.splice(m + 1); nodo.k.splice(m);   // interno: la separadora sube
    der.hijos = nodo.hijos.splice(m + 1);
    return { sep, der };
  }

  function construir(n) {
    let raiz = hoja();
    for (let i = 0; i < n; i++) raiz = insertar(raiz, A.secuencia[i]);
    return raiz;
  }

  function contar(nodo) {
    if (nodo.hoja) return (nodo.total = nodo.k.length);
    let s = 0; for (const h of nodo.hijos) s += contar(h);
    return (nodo.total = s);
  }

  // ── colocación: copa arriba, raíz abajo ─────────────────────────────────
  function colocar() {
    const niveles = [];
    (function rec(nd, d) { (niveles[d] || (niveles[d] = [])).push(nd); nd.prof = d; if (!nd.hoja) nd.hijos.forEach(h => rec(h, d + 1)); })(A.raiz, 0);
    A.niveles = niveles;
    A.altura = niveles.length;
    const hojas = niveles[niveles.length - 1];
    A.hojas = hojas;
    const ranura = 21, pad = 7;
    const w = MAXK * ranura + pad * 2 - 6;
    let gap = 16;
    let total = hojas.length * w + (hojas.length - 1) * gap;
    if (total > 1640) { gap = Math.max(5, (1640 - hojas.length * w) / Math.max(1, hojas.length - 1)); total = hojas.length * w + (hojas.length - 1) * gap; }
    const yRaiz = 880, yHojas = 660;
    const paso = A.altura > 1 ? (yRaiz - yHojas) / (A.altura - 1) : 0;
    hojas.forEach((h, i) => { h.w = w; h.cx = 960 - total / 2 + w / 2 + i * (w + gap); });
    for (let d = niveles.length - 2; d >= 0; d--) for (const nd of niveles[d]) {
      nd.w = w; nd.cx = (nd.hijos[0].cx + nd.hijos[nd.hijos.length - 1].cx) / 2;
    }
    niveles.forEach((nv, d) => nv.forEach(nd => { nd.cy = yRaiz - d * paso; nd.h = 22; }));
    // ramas: de la cara superior del padre (en la posición de cada puntero) a la base del hijo
    let id = 0;
    niveles.forEach(nv => nv.forEach(nd => { nd.id = id++; }));
    niveles.forEach(nv => nv.forEach(nd => {
      if (nd.hoja) return;
      nd.ramas = nd.hijos.map((h, i) => {
        const c = nd.hijos.length;
        const x0 = c > 1 ? nd.cx - nd.w / 2 + pad + i * ((nd.w - 2 * pad) / (c - 1)) : nd.cx;
        const y0 = nd.cy - nd.h / 2;
        const x3 = h.cx, y3 = h.cy + h.h / 2;
        const g = Math.sqrt(h.total + 1) * 2.3 + 1.2;
        return { x0, y0, x1: x0, y1: H.mix(y0, y3, 0.55), x2: x3, y2: H.mix(y0, y3, 0.45), x3, y3, g, hijo: h };
      });
    }));
  }

  A.fijarDisco = function (porcentaje) {
    const n = H.clamp(Math.round(porcentaje / 2), 1, 50);
    if (n === A.n && A.raiz) return;
    const antes = A.n;
    A.n = n;
    A.raiz = construir(n);
    contar(A.raiz);
    colocar();
    A.ultimaNueva = n > antes && antes > 0 ? A.secuencia[n - 1] : null;
    A.tCambio = 0;
    A.sucio = true;
  };

  function bez(r, t) {
    const u = 1 - t;
    return {
      x: u * u * u * r.x0 + 3 * u * u * t * r.x1 + 3 * u * t * t * r.x2 + t * t * t * r.x3,
      y: u * u * u * r.y0 + 3 * u * u * t * r.y1 + 3 * u * t * t * r.y2 + t * t * t * r.y3,
    };
  }

  // camino de búsqueda real: desde la raíz, comparando con las separadoras
  function buscar(clave) {
    const pasos = [];
    let nd = A.raiz;
    while (!nd.hoja) {
      let i = 0; while (i < nd.k.length && clave >= nd.k[i]) i++;
      pasos.push({ nodo: nd, rama: nd.ramas[i] });
      nd = nd.hijos[i];
    }
    return { pasos, hoja: nd, clave };
  }

  // disco = { lectura: B/s, escritura: B/s }
  A.paso = function (dt, disco) {
    A.tCambio += dt;
    const tasa = b => b <= 0 ? 0 : Math.min(9, 0.25 + 2.2 * Math.log10(1 + b / 4096));
    A.acumL += tasa(disco.lectura) * dt;
    A.acumE += tasa(disco.escritura) * dt;
    const claveAl = () => A.secuencia[(Math.random() * A.n) | 0];
    while (A.acumL >= 1) { A.acumL--; A.busquedas.push(Object.assign(buscar(claveAl()), { t: 0, tipo: "l" })); }
    while (A.acumE >= 1) { A.acumE--; A.busquedas.push(Object.assign(buscar(claveAl()), { t: 0, tipo: "e" })); }
    for (const b of A.busquedas) b.t += dt;
    const durTramo = 0.42;
    A.busquedas = A.busquedas.filter(b => b.t < b.pasos.length * durTramo + 1.6);
    A.durTramo = durTramo;
  };

  // ── capa fija: tronco, raíces, ramas con corteza, nodos y claves ─────────
  // el árbol entero (corteza, raíces, nodos) se pinta en una imagen aparte y
  // solo se rehace cuando cambia el disco o la resolución
  A.dibujarFijo = function (ctx) {
    if (!A.raiz) return;
    const esc = H.escalaCache || 1, m = ctx.getTransform();
    if (!A.lienzo || A.claveLienzo !== A.n + ":" + esc) {
      A.lienzo = A.lienzo || document.createElement("canvas");
      A.lienzo.width = Math.ceil(1920 * esc); A.lienzo.height = Math.ceil(1080 * esc);
      const g = A.lienzo.getContext("2d");
      g.setTransform(esc, 0, 0, esc, 0, 0);
      pintarArbol(g);
      A.claveLienzo = A.n + ":" + esc;
    }
    ctx.save(); ctx.setTransform(m.a / esc, 0, 0, m.d / esc, m.e, m.f);
    ctx.drawImage(A.lienzo, 0, 0);
    ctx.restore();
    A.sucio = false;
  };

  function pintarArbol(ctx) {
    const r = H.rng(99);
    ctx.save();
    const oro = H.C.arbol;
    const raiz = A.raiz;

    // raíces que bajan al suelo (y siguen dentro de la tierra de la Vida)
    const baseX = raiz.cx, baseY = raiz.cy + raiz.h / 2;
    const tronco = Math.sqrt(raiz.total + 1) * 3.4 + 6;
    function raizRec(x, y, ang, len, g, prof) {
      if (prof > 5 || g < 0.25) return;
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      ctx.strokeStyle = H.rgba(oro, 0.07 + 0.16 * (g / (g + 3)));
      ctx.lineWidth = g;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ang + 0.4) * len * 0.5, y + Math.sin(ang + 0.4) * len * 0.5, x2, y2);
      ctx.stroke();
      const n = prof < 2 ? 3 : 2;
      for (let i = 0; i < n; i++) raizRec(x2, y2, ang + (r() - 0.5) * 1.3, len * (0.55 + r() * 0.3), g * 0.62, prof + 1);
    }
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + (i - 3) * 0.32 + (r() - 0.5) * 0.15;
      raizRec(baseX + (i - 3) * tronco * 0.22, A.suelo + 3, a, 24 + r() * 18, tronco * 0.26, 0);   // nacen bajo tierra
    }
    // tronco: de la base de la raíz del árbol B+ hasta el suelo
    rama(ctx, { x0: baseX, y0: A.suelo + 5, x1: baseX - 4, y1: H.mix(A.suelo, baseY, 0.4), x2: baseX + 3, y2: H.mix(A.suelo, baseY, 0.7), x3: baseX, y3: baseY, g: tronco }, r, true);

    // ramas
    for (const nv of A.niveles) for (const nd of nv) if (!nd.hoja) for (const rm of nd.ramas) rama(ctx, rm, r, false);

    // punteros entre hojas hermanas (la lista enlazada de un B+): zarcillos
    ctx.lineWidth = 0.8;
    for (let i = 0; i < A.hojas.length - 1; i++) {
      const a = A.hojas[i], b = A.hojas[i + 1];
      const x0 = a.cx + a.w / 2, x1 = b.cx - b.w / 2, y = a.cy - a.h / 2 - 2;
      ctx.strokeStyle = H.rgba(oro, 0.38);
      ctx.setLineDash([1.5, 2.5]);
      ctx.beginPath(); ctx.moveTo(x0 - 4, y); ctx.bezierCurveTo(x0 + 4, y - 14, x1 - 4, y - 14, x1 + 2, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = H.rgba(oro, 0.55);
      ctx.beginPath(); ctx.moveTo(x1 + 3, y + 0.5); ctx.lineTo(x1 - 1.5, y - 3.5); ctx.lineTo(x1 - 2.5, y + 1.5); ctx.fill();
    }

    // nodos
    for (const nv of A.niveles) for (const nd of nv) nodo(ctx, nd);

    // anotación de la figura
    ctx.font = "italic 17px Cormorant";
    ctx.fillStyle = "rgba(207,217,234,0.82)";
    ctx.textAlign = "left";
    const ax = baseX + 150, ay = A.suelo - 50;
    ctx.fillText("Fig. I — Arbor B+", ax, ay);
    ctx.font = "9px JBM";
    ctx.fillStyle = H.rgba(oro, 0.7);
    const lineas = [
      `orden 5 · ${A.n} claves · altura ${A.altura} · ${A.hojas.length} hojas`,
      `1 clave = 2 % del disco · / btrfs`,
      `partición: la hoja llena se divide,`,
      `la separadora sube al padre`,
    ];
    lineas.forEach((l, i) => ctx.fillText(l, ax, ay + 15 + i * 12));
    ctx.strokeStyle = "rgba(143,163,192,0.3)"; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(ax - 6, ay - 4); ctx.lineTo(baseX + tronco * 0.6, ay + 22); ctx.stroke();
    ctx.restore();
  }

  function rama(ctx, rm, r, esTronco) {
    // forma afilada: dos curvas paralelas, más gruesa abajo
    const N = 26, izq = [], der = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = bez(rm, t), q = bez(rm, Math.min(1, t + 0.01)), q0 = bez(rm, Math.max(0, t - 0.01));
      const dx = q.x - q0.x, dy = q.y - q0.y, l = Math.hypot(dx, dy) || 1;
      const g = rm.g * (1 - t * (esTronco ? 0.25 : 0.62)) * 0.5;
      izq.push({ x: p.x - dy / l * g, y: p.y + dx / l * g });
      der.push({ x: p.x + dy / l * g, y: p.y - dx / l * g });
    }
    const gr = ctx.createLinearGradient(rm.x0, rm.y0, rm.x3, rm.y3);
    gr.addColorStop(0, "rgba(46,34,20,0.95)");
    gr.addColorStop(1, "rgba(28,22,16,0.9)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(izq[0].x, izq[0].y);
    izq.forEach(p => ctx.lineTo(p.x, p.y));
    for (let i = der.length - 1; i >= 0; i--) ctx.lineTo(der[i].x, der[i].y);
    ctx.closePath(); ctx.fill();
    // borde luminoso a un lado (la luz de la copa)
    ctx.strokeStyle = H.rgba(H.C.arbol, 0.42);
    ctx.lineWidth = 0.7;
    ctx.beginPath(); izq.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    ctx.strokeStyle = H.rgba(H.C.arbol, 0.14);
    ctx.beginPath(); der.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    // corteza: estrías finas a lo largo
    const estr = Math.max(1, Math.round(rm.g / 2.2));
    ctx.lineWidth = 0.45;
    for (let k = 0; k < estr; k++) {
      const off = (k + 0.5) / estr - 0.5 + (r() - 0.5) * 0.08;
      ctx.strokeStyle = `rgba(232,193,114,${0.05 + r() * 0.08})`;
      ctx.beginPath();
      let empezado = false;
      for (let i = 0; i <= N; i++) {
        if (r() < 0.06) { empezado = false; continue; }
        const x = H.mix(izq[i].x, der[i].x, 0.5 + off * 0.9), y = H.mix(izq[i].y, der[i].y, 0.5 + off * 0.9);
        if (!empezado) { ctx.moveTo(x, y); empezado = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function nodo(ctx, nd) {
    const oro = H.C.arbol;
    const x = nd.cx - nd.w / 2, y = nd.cy - nd.h / 2, w = nd.w, h = nd.h;
    ctx.fillStyle = "rgba(9,12,20,0.92)";
    ctx.strokeStyle = H.rgba(oro, nd.hoja ? 0.75 : 0.55);
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.fill(); ctx.stroke();
    const ranura = (w - 8) / MAXK;
    ctx.font = "10px JBM";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < MAXK; i++) {
      const sx = x + 4 + i * ranura;
      if (i > 0) {
        ctx.strokeStyle = H.rgba(oro, 0.22); ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(sx, y + 4); ctx.lineTo(sx, y + h - 4); ctx.stroke();
      }
      if (i < nd.k.length) {
        ctx.fillStyle = H.rgba(oro, nd.hoja ? 0.95 : 0.7);
        ctx.fillText(H.hex(nd.k[i], 3), sx + ranura / 2, nd.cy + 0.5);
      } else {
        ctx.fillStyle = H.rgba(oro, 0.2);
        ctx.fillText("·", sx + ranura / 2, nd.cy);
      }
    }
    // punteros a hijos (puntitos en la cara superior)
    if (!nd.hoja) for (const rm of nd.ramas) {
      ctx.fillStyle = H.rgba(oro, 0.8);
      ctx.beginPath(); ctx.arc(rm.x0, y, 1.6, 0, 6.2832); ctx.fill();
    }
    ctx.font = "7.5px JBM";
    ctx.fillStyle = "rgba(143,163,192,0.4)";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(`n${nd.id}·${nd.k.length}/${MAXK}`, x + 1, y + h + 9);
  }

  function frutoSprite() {
    if (A._fruto) return A._fruto;
    const S = H.SS, c = document.createElement("canvas");
    c.width = c.height = 18 * S;
    const g = c.getContext("2d");
    g.setTransform(S, 0, 0, S, 0, 0);
    g.drawImage(H.brillo(H.C.arbol, 9), 0, 0);
    g.globalAlpha = 2.4;          // el punto central conserva su intensidad (0,8 / 0,34)
    g.fillStyle = H.rgba(H.C.arbol, 1);
    g.beginPath(); g.arc(9, 9, 1.2, 0, 6.2832); g.fill();
    return (A._fruto = c);
  }

  // ── capa viva: savia de las búsquedas, frutos de las claves ──────────────
  A.dibujarVivo = function (ctx, t) {
    if (!A.raiz) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const oro = H.C.arbol;
    // follaje de la copa: hojas finas alrededor de cada nodo hoja, mecidas por el aire
    const m = ctx.getTransform();
    const hojaOro = H.spriteElipse([232, 193, 114], 5.5, 1.8), hojaVerde = H.spriteElipse([160, 210, 130], 5.5, 1.8);
    for (const hj of A.hojas) {
      if (!hj.follaje) {        // posiciones fijas de cada hoja (se calculan una vez)
        hj.follaje = [];
        const n = 26;
        for (let i = 0; i < n; i++) {
          const sem = hj.id * 131 + i * 17;
          const a = Math.PI + (i / (n - 1)) * Math.PI + Math.sin(sem) * 0.15;
          const rad = hj.w * 0.55 + (Math.sin(sem * 3.1) * 0.5 + 0.5) * 22;
          hj.follaje.push({ sem, bx: hj.cx + Math.cos(a) * rad, by: hj.cy - 6 + Math.sin(a) * rad * 0.62, a0: a + Math.PI / 2,
                            lum: 0.10 + 0.10 * (Math.sin(sem * 7.7) * 0.5 + 0.5), img: Math.sin(sem) > 0.3 ? hojaOro : hojaVerde });
        }
      }
      // las hojas de cada nodo, en dos capas desfasadas que se mecen por separado
      const esc = H.escalaCache || 1;
      if (!hj.capasFollaje || hj.escFol !== esc) {
        hj.escFol = esc;
        const W = hj.w + 70, Hh = 70;
        hj.capasFollaje = [0, 1].map(k => {
          const c = document.createElement("canvas");
          c.width = Math.ceil(W * esc); c.height = Math.ceil(Hh * esc);
          const g = c.getContext("2d");
          const base = new DOMMatrix([esc, 0, 0, esc, (W / 2 - hj.cx) * esc, (Hh - 8 - hj.cy) * esc]);
          g.globalCompositeOperation = "lighter";
          hj.follaje.forEach((f, i) => {
            if (i % 2 !== k) return;
            g.globalAlpha = f.lum;
            H.rot(g, base, f.img, f.bx, f.by, f.a0, 11, 3.6);
          });
          c.W = W; c.Hh = Hh;
          return c;
        });
      }
      hj.capasFollaje.forEach((c, k) => {
        const sem = hj.id * 3.7 + k * 2.1;
        const sway = Math.sin(t * (0.9 + 0.15 * k) + sem) * 2.2;
        const ang = Math.sin(t * (1.2 - 0.1 * k) + sem) * 0.035;
        H.rot(ctx, m, c, hj.cx + sway, hj.cy - 8 - c.Hh / 2 + 8, ang, c.W, c.Hh);
      });
    }
    ctx.setTransform(m); ctx.globalAlpha = 1;
    // cada clave de la copa es un fruto que respira
    for (const hj of A.hojas) {
      const ranura = (hj.w - 8) / MAXK;
      hj.k.forEach((k, i) => {
        const x = hj.cx - hj.w / 2 + 4 + (i + 0.5) * ranura, y = hj.cy - hj.h / 2 - 9;
        const fase = (k * 0.37) % 6.28;
        ctx.globalAlpha = 0.22 + 0.12 * Math.sin(t * 1.3 + fase);
        const fr = frutoSprite();
        ctx.drawImage(fr, x - 9, y - 9, 18, 18);
        ctx.globalAlpha = 1;
      });
    }
    // clave recién insertada (el disco ha crecido)
    if (A.ultimaNueva !== null && A.tCambio < 6) {
      for (const hj of A.hojas) {
        const i = hj.k.indexOf(A.ultimaNueva);
        if (i < 0) continue;
        const ranura = (hj.w - 8) / MAXK;
        const x = hj.cx - hj.w / 2 + 4 + (i + 0.5) * ranura;
        const f = A.tCambio / 6;
        H.luz(ctx, x, hj.cy, [255, 240, 200], 40, 0.9 * (1 - f));
        ctx.strokeStyle = H.rgba(oro, 0.8 * (1 - f));
        ctx.beginPath(); ctx.arc(x, hj.cy, 10 + f * 60, 0, 6.2832); ctx.stroke();
      }
    }
    // búsquedas: la savia sube rama a rama por el camino real de la búsqueda
    const D = A.durTramo || 0.42;
    for (const b of A.busquedas) {
      const c = b.tipo === "l" ? [255, 226, 150] : [255, 255, 235];
      const tramo = Math.floor(b.t / D);
      if (tramo < b.pasos.length) {
        const f = (b.t % D) / D;
        const rm = b.pasos[tramo].rama;
        const p = bez(rm, H.suave(f));
        H.luz(ctx, p.x, p.y, c, 16, 0.85);
        for (let k = 1; k <= 5; k++) {
          const q = bez(rm, H.clamp(H.suave(f) - k * 0.05, 0, 1));
          H.luz(ctx, q.x, q.y, c, 8, 0.25 * (1 - k / 6));
        }
        // nodo que está comparando ahora
        const nd = b.pasos[tramo].nodo;
        H.luz(ctx, nd.cx, nd.cy, oro, 30, 0.25 * (1 - f));
      } else {
        // llegó a la hoja: la clave se enciende
        const f = (b.t - b.pasos.length * D) / 1.6;
        const hj = b.hoja, i = hj.k.indexOf(b.clave);
        if (i >= 0) {
          const ranura = (hj.w - 8) / MAXK;
          const x = hj.cx - hj.w / 2 + 4 + (i + 0.5) * ranura;
          H.luz(ctx, x, hj.cy, c, b.tipo === "e" ? 30 : 22, (1 - f) * 0.9);
          if (b.tipo === "e") {
            ctx.strokeStyle = H.rgba(c, 0.7 * (1 - f));
            ctx.lineWidth = 0.8;
            ctx.strokeRect(x - 9 - f * 4, hj.cy - 8 - f * 4, 18 + f * 8, 16 + f * 8);
          }
        }
      }
    }
    ctx.restore();
  };

  return A;
})();
