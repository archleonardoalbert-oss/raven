// HORTUS ALGORITHMICUS · Fig. II — Via Dijkstrae (la red)
// El cielo es un grafo: cada estrella un router, cada arista un enlace con peso.
// Tus paquetes reales viajan por el árbol de caminos mínimos que calcula Dijkstra
// desde «localhost» (así encamina OSPF en los routers de verdad). Los enlaces muy
// usados se congestionan, suben de peso y Dijkstra, al recalcular, cambia las rutas.
// El camino de salida es el REAL en cada momento (interfaz de la ruta por defecto,
// operador y la VPN si está levantada); si se cae, Dijkstra recalcula y lo que
// queda detrás se vuelve inalcanzable (d = ∞). Los sitios son tus conexiones TCP
// reales (y QUIC): cada servidor ocupa una estrella con su nombre. Cada LED son
// 50 kB reales: del sitio a localhost si bajas, de localhost al sitio si subes.
// Cuantos más LEDs hay en vuelo, más rápido viajan todos.
"use strict";

H.Grafo = (function () {
  const G = {
    nodos: [], aristas: [], ady: [],
    casa: 0, servidores: [],
    dist: [], prev: [], ruta: [],          // tabla de encaminamiento vigente
    anim: null,                            // ejecución animada en curso
    paquetes: [], destellos: [], relajos: [],
    reloj: 0, proxima: 1.0, ejecuciones: 0,
    sitios: new Map(), ranuras: [], cola: [], rutas: new Set(),
    enlace: { conectado: true, tipo: "usb", iface: "usb0", vpn: true }, claveEnlace: "",
    sucio: true, ultimoAsentado: -1,
  };

  const zonasLibres = [
    { x0: 40, y0: 40, x1: 800, y1: 222 },     // título
    { x0: 1070, y0: 448, x1: 1480, y1: 545 }, // rótulo de la red
    { x0: 1500, y0: 40, x1: 1890, y1: 222 },  // reloj binario
  ];
  const libre = (x, y) => !zonasLibres.some(z => x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1);

  G.crear = function () {
    const r = H.rng(20261108);
    const N = G.nodos;
    // la cadena de salida, colocada a mano
    const cadena = [
      { x: 960, y: 556, nombre: "localhost", tipo: "casa" },     // separado de la copa del árbol
      { x: 900, y: 500, nombre: "usb0 · redmi", tipo: "cadena" },
      { x: 1006, y: 450, nombre: "operador", tipo: "cadena" },
      { x: 946, y: 398, nombre: "wg0 · proton", tipo: "cadena" },
    ];
    cadena.forEach(c => N.push(c));
    // malla: muestreo de Poisson por rechazo (estrellas bien repartidas)
    let intentos = 0;
    while (N.length < 112 && intentos < 40000) {
      intentos++;
      const x = 70 + r() * 1780;
      const y = 72 + Math.pow(r(), 1.15) * 450;
      if (!libre(x, y)) continue;
      if (y > 395 && Math.abs(x - 955) < 120) continue;   // hueco para la cadena
      let ok = true;
      for (const n of N) { if (Math.hypot(n.x - x, n.y - y) < 62) { ok = false; break; } }
      if (ok) N.push({ x, y, tipo: "malla" });
    }
    N.forEach((n, i) => { n.id = i; n.fase = r() * 6.28; n.brilloBase = 0.5 + r() * 0.5; });

    // aristas de la malla: grafo de Gabriel (plano, conexo y con aspecto orgánico)
    const M = N.filter(n => n.tipo === "malla");
    for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) {
      const a = M[i], b = M[j];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r2 = ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) / 4;
      if (r2 > 230 * 230 / 4 * 4) continue;
      let vacio = true;
      for (const c of M) {
        if (c === a || c === b) continue;
        if ((c.x - mx) ** 2 + (c.y - my) ** 2 < r2) { vacio = false; break; }
      }
      if (vacio) G.unir(a.id, b.id);
    }
    G.unir(0, 1, "local"); G.unir(1, 2, "local"); G.unir(2, 3, "vpn");
    // con VPN se sale a internet desde wg0; sin ella, directamente desde el operador
    M.slice().sort((p, q) => H.dist(p, N[3]) - H.dist(q, N[3])).slice(0, 4).forEach(m => G.unir(3, m.id, "vpn"));
    M.slice().sort((p, q) => H.dist(p, N[2]) - H.dist(q, N[2])).slice(0, 4).forEach(m => G.unir(2, m.id, "sinvpn"));
    N[0].nombre = "localhost"; N[1].nombre = "usb0 · redmi"; N[2].nombre = "operador"; N[3].nombre = "wg0 · proton";

    // estrellas que pueden alojar un sitio real: las más lejanas primero, separadas
    const lejos = M.slice().sort((p, q) => H.dist(q, N[0]) - H.dist(p, N[0]));
    for (const n of lejos) if (G.ranuras.every(id => H.dist(N[id], n) > 92)) G.ranuras.push(n.id);

    G.casa = 0;
    G.dijkstraCompleto(true);
  };

  G.unir = function (a, b, cond) {
    const N = G.nodos;
    const len = H.dist(N[a], N[b]);
    const e = { a, b, len, carga: 0, peso: len, id: G.aristas.length, cond: cond || null };
    G.aristas.push(e);
    (G.ady[a] || (G.ady[a] = [])).push(e);
    (G.ady[b] || (G.ady[b] = [])).push(e);
  };

  // ¿existe ahora este router / este enlace? (según la conexión real)
  function nodoActivo(id) {
    const E = G.enlace;
    if (id === 0) return true;
    if (id === 3) return E.conectado && E.vpn;
    return E.conectado;
  }
  function aristaActiva(e) {
    if (!nodoActivo(e.a) || !nodoActivo(e.b)) return false;
    if (e.cond === "vpn") return G.enlace.vpn;
    if (e.cond === "sinvpn") return !G.enlace.vpn;
    return true;
  }
  G.nodoActivo = nodoActivo;

  // Dijkstra de verdad, con montículo; guarda el orden de los sucesos para animarlo
  G.dijkstraCompleto = function (inmediato) {
    const n = G.nodos.length;
    for (const e of G.aristas) e.peso = Math.round(e.len * (1 + 2.2 * e.carga));
    const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), hecho = new Array(n).fill(false);
    const sucesos = [];
    const pq = new H.Monticulo();
    dist[G.casa] = 0; pq.push(0, G.casa);
    while (pq.size) {
      const [d, u] = pq.pop();
      if (hecho[u]) continue;
      hecho[u] = true;
      sucesos.push({ tipo: "asentar", v: u, d });
      // un sitio real es solo destino, nunca router de paso: salir de él cuesta
      // muchísimo, así ninguna ruta (ni sus LEDs) atraviesa la estrella de otro sitio
      const transito = u !== G.casa && G.nodos[u].tipo === "servidor" ? 1e6 : 0;
      for (const e of G.ady[u] || []) {
        if (!aristaActiva(e)) continue;
        const v = e.a === u ? e.b : e.a;
        if (hecho[v]) continue;
        const nd = d + e.peso + transito;
        if (nd < dist[v]) {
          dist[v] = nd; prev[v] = u; pq.push(nd, v);
          sucesos.push({ tipo: "relajar", u, v, e: e.id, d: nd });
        }
      }
    }
    G.ejecuciones++;
    if (inmediato) { G.dist = dist; G.prev = prev; G.sucio = true; calcularRutas(); return; }
    // la tabla de rutas nueva vale YA (como en un router); la animación solo
    // enseña cómo la calculó Dijkstra
    G.dist = dist; G.prev = prev; calcularRutas();
    G.anim = { sucesos, i: 0, t: 0, dist: new Array(n).fill(Infinity), prev: new Array(n).fill(-1),
               estado: new Array(n).fill(0), final: { dist, prev } };
    G.anim.dist[G.casa] = 0; G.anim.estado[G.casa] = 1;
  };

  function camino(desde) {     // de un nodo hasta localhost siguiendo la tabla
    const p = [desde];
    let v = desde, guard = 0;
    while (v !== G.casa && v >= 0 && guard++ < 300) { v = G.prev[v]; p.push(v); }
    return v === G.casa ? p : null;
  }

  function aristaEntre(u, v) {
    for (const e of G.ady[u] || []) if ((e.a === u && e.b === v) || (e.b === u && e.a === v)) return e;
    return null;
  }

  // las rutas en uso: aristas entre localhost y cada sitio con tráfico reciente
  function calcularRutas() {
    const r = new Set();
    for (const s of G.sitios.values()) {
      if (G.reloj - s.ultimoTrafico > 6) continue;
      const p = camino(s.nodo);
      if (!p) continue;
      for (let i = 0; i < p.length - 1; i++) { const e = aristaEntre(p[i], p[i + 1]); if (e) r.add(e.id); }
    }
    G.rutas = r;
    G.sucio = true;
  }

  // un LED = 50 kB reales, entre un sitio y localhost
  function lanzar(sitio, tipo) {
    let p = camino(sitio.nodo);
    if (!p || p.length < 2) return;
    if (tipo === "subida") p = p.slice().reverse();
    G.paquetes.push({ p, i: 0, s: 0, tipo, tam: 1 });
  }

  // datos reales de la red, una vez por segundo:
  // red = { bajada, subida, enlace: {conectado, tipo, iface, vpn}, sitios: [{ip, nombre, bajada, subida}] }
  G.actualizar = function (red) {
    const N = G.nodos;
    // ── el enlace: si cambia, cambia el grafo y Dijkstra recalcula al momento ──
    if (red.enlace) {
      const clave = JSON.stringify(red.enlace);
      if (clave !== G.claveEnlace) {
        G.claveEnlace = clave;
        G.enlace = red.enlace;
        const E = G.enlace;
        N[0].nombre = E.conectado ? "localhost" : "localhost · sin conexión";
        N[1].nombre = E.conectado ? `${E.iface} · ${E.tipo === "usb" ? "redmi (usb)" : E.tipo}` : "sin enlace";
        N[2].nombre = "operador";
        N[3].nombre = E.vpn ? "wg0 · proton" : "wg0 · proton (apagada)";
        G.paquetes = [];
        G.anim = null;
        G.dijkstraCompleto(false);
      }
    }
    // ── los sitios: cada servidor real ocupa una estrella ──────────────────
    const vistos = new Set();
    let total = 0;
    const pedidos = [];
    // un mismo servicio suele usar varias IPs (p. ej. muchas «1e100.net»): una
    // sola estrella por nombre, con el tráfico de todas sumado
    const porNombre = new Map();
    for (const d of red.sitios || []) {
      const k = d.nombre || d.ip, a = porNombre.get(k);
      if (a) { a.bajada += d.bajada || 0; a.subida += d.subida || 0; a.quic = a.quic || d.quic; }
      else porNombre.set(k, Object.assign({}, d, { ip: k, bajada: d.bajada || 0, subida: d.subida || 0 }));
    }
    let cambioSitios = false;
    for (const d of porNombre.values()) {
      vistos.add(d.ip);
      let s = G.sitios.get(d.ip);
      if (!s) {
        // estrella libre elegida por el ip (así un sitio vuelve a su sitio)
        let h = 0; for (const ch of d.ip) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        const libres = G.ranuras.filter(id => N[id].tipo === "malla");
        if (!libres.length) continue;
        const id = libres[h % libres.length];
        s = { ip: d.ip, nodo: id, ultimoTrafico: -99 };
        G.sitios.set(d.ip, s);
        N[id].tipo = "servidor";
        G.sucio = true; cambioSitios = true;
      }
      s.visto = G.reloj; s.bajada = d.bajada; s.subida = d.subida; s.quic = !!d.quic;
      const nom = (d.nombre || d.ip).length > 40 ? (d.nombre || d.ip).slice(0, 39) + "…" : (d.nombre || d.ip);
      if (N[s.nodo].nombre !== nom) { N[s.nodo].nombre = nom; G.sucio = true; }
      if (d.bajada > 0 || d.subida > 0) { if (G.reloj - s.ultimoTrafico > 6) G.sucio = true; s.ultimoTrafico = G.reloj; }
      // un LED por cada 50 kB (mínimo 1 si hubo tráfico), repartidos en el segundo
      const nb = d.bajada > 0 ? Math.max(1, Math.floor(d.bajada / 50000)) : 0;
      const ns = d.subida > 0 ? Math.max(1, Math.floor(d.subida / 50000)) : 0;
      pedidos.push([s, nb, ns]); total += nb + ns;
    }
    const tope = 160;                      // a más de 8 MB/s se escalan (el rótulo da la cifra exacta)
    const f = total > tope ? tope / total : 1;
    for (const [s, nb, ns] of pedidos) {
      for (let k = 0, n = nb ? Math.max(1, Math.round(nb * f)) : 0; k < n; k++) G.cola.push({ t: G.reloj + Math.random() * 0.97, s, tipo: "bajada" });
      for (let k = 0, n = ns ? Math.max(1, Math.round(ns * f)) : 0; k < n; k++) G.cola.push({ t: G.reloj + Math.random() * 0.97, s, tipo: "subida" });
    }
    // conexiones cerradas: la estrella vuelve a ser un router anónimo
    for (const [ip, s] of G.sitios) {
      if (vistos.has(ip) || G.reloj - s.visto < 4) continue;
      const n = N[s.nodo]; n.tipo = "malla"; n.nombre = undefined;
      G.sitios.delete(ip); G.sucio = true; cambioSitios = true;
    }
    // cambió qué estrellas son sitios: la tabla de rutas se rehace ya, para que
    // ningún LED nuevo atraviese un sitio (la animación de Dijkstra sigue a su ritmo)
    if (cambioSitios) {
      const anim = G.anim; G.dijkstraCompleto(true); G.anim = anim;
    }
    calcularRutas();
  };

  G.paso = function (dt, red) {
    G.reloj += dt;
    // ── animación de Dijkstra ───────────────────────────────────────────────
    G.proxima -= dt;
    if (!G.anim && G.proxima <= 0) { G.dijkstraCompleto(false); }
    if (G.anim) {
      const A = G.anim;
      A.t += dt;
      const ritmo = 0.024;                          // s por suceso
      while (A.i < A.sucesos.length && A.i * ritmo <= A.t) {
        const s = A.sucesos[A.i++];
        if (s.tipo === "asentar") {
          A.estado[s.v] = 2;
          G.destellos.push({ v: s.v, t: 0 });
          G.ultimoAsentado = s.v;
        } else {
          A.dist[s.v] = s.d; A.prev[s.v] = s.u; A.estado[s.v] = 1;
          G.relajos.push({ u: s.u, v: s.v, t: 0 });
        }
        G.sucio = true;
      }
      if (A.i >= A.sucesos.length) {
        G.dist = A.final.dist; G.prev = A.final.prev;   // nueva tabla de rutas
        G.anim = null; G.proxima = 7.5; G.sucio = true;
        calcularRutas();
      }
    }
    // ── LEDs: salen de la cola a su hora; todos a la misma velocidad, que
    //    crece con cuántos hay en vuelo ─────────────────────────────────────
    if (G.cola.length) {
      const quedan = [];
      for (const c of G.cola) { if (c.t <= G.reloj) lanzar(c.s, c.tipo); else quedan.push(c); }
      G.cola = quedan;
    }
    G.velocidad = Math.min(1500, 170 + 13 * G.paquetes.length);
    const N = G.nodos;
    for (const pk of G.paquetes) {
      const a = N[pk.p[pk.i]], b = N[pk.p[pk.i + 1]];
      const L = H.dist(a, b);
      pk.s += G.velocidad * dt;
      while (pk.s >= L && !pk.fin) {
        const e = aristaEntre(pk.p[pk.i], pk.p[pk.i + 1]);
        if (e) e.carga = Math.min(1.5, e.carga + 0.06);     // el enlace se congestiona
        pk.s -= L; pk.i++;
        if (pk.i >= pk.p.length - 1) { pk.fin = true; break; }
      }
    }
    G.paquetes = G.paquetes.filter(p => !p.fin);
    for (const e of G.aristas) e.carga *= Math.exp(-dt * 0.12);
    G.destellos = G.destellos.filter(d => (d.t += dt) < 1.4);
    G.relajos = G.relajos.filter(d => (d.t += dt) < 0.5);
  };

  const placaX = (x, w) => H.clamp(x, 14 + w / 2, 1906 - w / 2);   // nunca se corta en el borde

  // ── colocación de etiquetas: ningún nombre tapa a otro, nunca ──────────────
  // Cada sitio tiene un bloque (placa con su nombre + línea de tráfico). Se
  // prueban 12 posiciones alrededor de su estrella y se elige la que menos pisa
  // lo ya colocado: otras placas, los nombres de localhost y de la cadena de
  // salida y las demás estrellas. Se prefiere la posición anterior (no salta).
  function colocarEtiquetas(ctx) {
    const N = G.nodos, ocup = [];
    const area = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    ctx.font = "500 12px JBM";
    for (const n of N) if (n.nombre && (n.tipo === "casa" || n.tipo === "cadena")) {
      const w = ctx.measureText(n.nombre).width;
      if (n.tipo === "casa") ocup.push({ x0: n.x - 24 - w, x1: n.x - 14, y0: n.y - 24, y1: n.y - 3 });
      else ocup.push({ x0: n.x - 16 - w, x1: n.x - 6, y0: n.y - 9, y1: n.y + 9 });
      ocup.push({ x0: n.x - 12, x1: n.x + 12, y0: n.y - 12, y1: n.y + 12 });
    }
    const sitios = [...G.sitios.values()].map(s => ({ n: N[s.nodo], s })).filter(o => o.n.nombre);
    for (const { n } of sitios) ocup.push({ x0: n.x - 14, x1: n.x + 14, y0: n.y - 14, y1: n.y + 14 });
    sitios.sort((a, b) => (b.s.ultimoTrafico - a.s.ultimoTrafico) || (a.n.x - b.n.x));
    const C = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1], [0, -2], [0, 2], [2, 0], [-2, 0]];
    ctx.font = "600 12px JBM";
    for (const { n } of sitios) {
      const w = ctx.measureText(n.nombre).width + 14, W = Math.max(w, 130), Hb = 31;
      let mejor = null;
      C.forEach(([ox, oy], ci) => {
        let cx = n.x + ox * (Math.abs(ox) === 2 ? W / 2 + 60 : W / 2 + 22);
        let cy = n.y + oy * (Math.abs(oy) === 2 ? Hb / 2 + 46 : Hb / 2 + 18);
        if (ox === 0) cx = n.x;
        cx = H.clamp(cx, 14 + W / 2, 1906 - W / 2); cy = H.clamp(cy, 16 + Hb / 2, 640 - Hb / 2);
        const rc = { x0: cx - W / 2 - 4, x1: cx + W / 2 + 4, y0: cy - Hb / 2 - 3, y1: cy + Hb / 2 + 3 };
        let coste = 0; for (const o of ocup) coste += area(rc, o) * 20;
        coste += (Math.abs(ox) + Math.abs(oy)) * 6 + Math.hypot(cx - n.x, cy - n.y) * 0.05 - (ci === n.etqC ? 4 : 0);
        if (!mejor || coste < mejor.coste) mejor = { coste, rc, cx, cy, ci };
      });
      n.etqC = mejor.ci;
      const abajo = mejor.cy >= n.y;
      n.etq = { cx: mejor.cx, w,
                ty: abajo ? mejor.cy - Hb / 2 + 10 : mejor.cy + Hb / 2 - 7,        // placa: la parte cercana a la estrella
                tyT: abajo ? mejor.cy + Hb / 2 - 2 : mejor.cy - Hb / 2 + 9,        // tráfico: la parte lejana
                lejos: Math.hypot(mejor.cx - n.x, mejor.cy - n.y) > 36 };
      ocup.push(mejor.rc);
    }
  }

  // ── capa fija: aristas, nodos, pesos, distancias, etiquetas ───────────────
  G.dibujarFijo = function (ctx) {
    const N = G.nodos;
    const A = G.anim;
    const prev = A ? A.prev : G.prev, dist = A ? A.dist : G.dist;
    ctx.save();
    ctx.lineCap = "round";
    // aristas
    for (const e of G.aristas) {
      const a = N[e.a], b = N[e.b];
      const activa = aristaActiva(e);
      if (!activa && (e.cond === "vpn" || e.cond === "sinvpn") && !(e.a < 4 && e.b < 4)) continue;   // salida que no existe
      const esArbol = activa && (prev[e.a] === e.b || prev[e.b] === e.a);
      const enUso = esArbol && G.rutas.has(e.id);
      const cong = H.clamp(e.carga / 1.2, 0, 1);
      ctx.strokeStyle = !activa ? "rgba(143,163,192,0.10)"
        : enUso ? H.rgba(H.mix3(H.C.red, [255, 150, 90], cong), 0.85)
        : esArbol ? H.rgba(H.C.red, 0.16) : H.rgba([120, 150, 190], 0.09);
      ctx.lineWidth = enUso ? 1.7 : esArbol ? 0.9 : 0.7;
      if (!esArbol) ctx.setLineDash([2, 4]); else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      // flecha de la ruta (hacia localhost) en las rutas en uso
      if (enUso) {
        const hijo = prev[e.a] === e.b ? a : b, padre = hijo === a ? b : a;
        const ang = Math.atan2(padre.y - hijo.y, padre.x - hijo.x);
        const mx = H.mix(hijo.x, padre.x, 0.56), my = H.mix(hijo.y, padre.y, 0.56);
        ctx.fillStyle = H.rgba(H.C.red, 0.5);
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4);
        ctx.lineTo(mx + Math.cos(ang + 2.5) * 3.2, my + Math.sin(ang + 2.5) * 3.2);
        ctx.lineTo(mx + Math.cos(ang - 2.5) * 3.2, my + Math.sin(ang - 2.5) * 3.2);
        ctx.fill();
      }
      ctx.setLineDash([]);
    }
    // brillo fijo de las estrellas (el centelleo va en la capa viva)
    ctx.globalCompositeOperation = "lighter";
    for (const n of N) if (n.tipo === "malla") H.luz(ctx, n.x, n.y, [150, 190, 255], 9, 0.10);
    ctx.globalCompositeOperation = "source-over";
    // nodos (sin rótulos numéricos: la lámina queda limpia)
    colocarEtiquetas(ctx);
    const sitioDe = new Map();
    for (const s of G.sitios.values()) sitioDe.set(s.nodo, s);
    for (const n of N) {
      const est = A ? A.estado[n.id] : 2;
      const vivo = nodoActivo(n.id);
      if (n.tipo === "servidor") {
        // sitio real: estrella dorada con doble anillo y cruz de grabado
        const s = sitioDe.get(n.id), activo = s && G.reloj - s.ultimoTrafico < 6;
        const col = activo ? H.C.sitio : [205, 185, 150];
        ctx.globalCompositeOperation = "lighter";
        H.luz(ctx, n.x, n.y, col, activo ? 26 : 16, activo ? 0.55 : 0.25);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = H.rgba(col, 1);
        ctx.beginPath(); ctx.arc(n.x, n.y, activo ? 4.2 : 3.2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = H.rgba(col, activo ? 0.9 : 0.5); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(n.x, n.y, 8.5, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = H.rgba(col, activo ? 0.45 : 0.22); ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.arc(n.x, n.y, 12.5, 0, 6.2832); ctx.stroke();
        ctx.beginPath();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(n.x + dx * 14, n.y + dy * 14); ctx.lineTo(n.x + dx * 19, n.y + dy * 19); }
        ctx.stroke();
        if (n.nombre) {
          // nombre en placa oscura con filete dorado, donde lo ha colocado el
          // colocador de etiquetas (sin pisar ningún otro nombre)
          const E = n.etq || { cx: n.x, ty: n.y - 26, w: 100, lejos: false };
          const ty = E.ty, w = E.w, cx = E.cx;
          if (E.lejos) {
            ctx.strokeStyle = H.rgba(col, 0.35); ctx.lineWidth = 0.6;
            const ax = H.clamp(n.x, cx - w / 2, cx + w / 2), ay = ty < n.y ? ty + 7 : ty - 10;
            const d = Math.hypot(ax - n.x, ay - n.y) || 1;
            ctx.beginPath(); ctx.moveTo(n.x + (ax - n.x) / d * 15, n.y + (ay - n.y) / d * 15); ctx.lineTo(ax, ay); ctx.stroke();
          }
          ctx.fillStyle = "rgba(6,10,22,0.82)";
          ctx.beginPath(); ctx.roundRect(cx - w / 2, ty - 10, w, 17, 3); ctx.fill();
          ctx.strokeStyle = H.rgba(col, activo ? 0.75 : 0.35); ctx.lineWidth = 0.8; ctx.stroke();
          H.texto(ctx, n.nombre, cx, ty + 3, "600 12px JBM", activo ? "rgba(255,236,196,1)" : "rgba(225,215,195,0.75)", "center");
        }
        continue;
      }
      if (n.tipo === "casa") {
        // localhost: el nodo más importante (origen de todo Dijkstra, este equipo)
        const col = vivo ? H.C.red : [120, 130, 150];   // (la estrella en sí se pinta en la capa viva)
        // nombre sin marco, discreto, a la izquierda (la estrella ya destaca sola)
        H.texto(ctx, n.nombre, n.x - 20, n.y - 9, "500 12px JBM", vivo ? "rgba(175,225,245,0.85)" : "rgba(160,170,185,0.7)", "right");
        continue;
      }
      const col = !vivo ? [110, 120, 140] : n.tipo === "malla" ? [170, 195, 230] : H.C.red;
      ctx.fillStyle = H.rgba(col, est === 2 ? 0.95 : 0.45);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.tipo === "malla" ? 1.9 : 3.0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = H.rgba(col, est === 2 ? 0.45 : 0.18);
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.tipo === "malla" ? 4.5 : 7, 0, 6.2832); ctx.stroke();
      if (n.nombre) {
        H.texto(ctx, n.nombre, n.x - 12, n.y + 4, n.tipo === "casa" ? "11px JBM" : "10px JBM",
                !vivo ? "rgba(143,163,192,0.4)" : "rgba(111,227,255,0.85)", "right");
      }
    }
    ctx.restore();
    G.sucio = false;
  };

  // ── capa viva: frente de búsqueda, relajaciones, paquetes ─────────────────
  G.dibujarVivo = function (ctx, t) {
    const N = G.nodos;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // centelleo de las estrellas: 4 familias mezcladas, cada una con su ritmo
    // (la parte fija del brillo va en la capa de estructura)
    const esc = H.escalaCache || 1;
    if (!G.familias || G.escFam !== esc) {
      G.escFam = esc;
      G.familias = [0, 1, 2, 3].map(k => {
        const c = document.createElement("canvas");
        c.width = Math.ceil(1920 * esc); c.height = Math.ceil(620 * esc);
        const g = c.getContext("2d");
        g.setTransform(esc, 0, 0, esc, 0, 0);
        g.globalCompositeOperation = "lighter";
        for (const n of N) if (n.tipo === "malla" && n.id % 4 === k) H.luz(g, n.x, n.y, [150, 190, 255], 9, 0.14 * n.brilloBase);
        return c;
      });
    }
    const m0 = ctx.getTransform();
    ctx.setTransform(m0.a / esc, 0, 0, m0.d / esc, m0.e, m0.f);
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * (0.7 + 0.23 * k) + k * 1.7);
      ctx.drawImage(G.familias[k], 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(m0);
    // nodos especiales
    for (const n of N) {
      if (n.tipo === "malla" || n.tipo === "servidor" || !nodoActivo(n.id)) continue;
      if (n.tipo === "casa") {
        // localhost: la estrella principal. Halo de color, núcleo blanco, picos de
        // difracción (4 largos y 4 cortos, como en una foto de telescopio) y centelleo
        const tw = 0.86 + 0.1 * Math.sin(t * 3.1) + 0.06 * Math.sin(t * 7.7 + 1);
        H.luz(ctx, n.x, n.y, H.C.red, 80, 0.32 * tw);
        H.luz(ctx, n.x, n.y, [190, 240, 255], 30, 0.75 * tw);
        const pico = (a, L, w, al) => {
          const ca = Math.cos(a), sa = Math.sin(a);
          const g = ctx.createLinearGradient(n.x, n.y, n.x + ca * L, n.y + sa * L);
          g.addColorStop(0, `rgba(240,252,255,${al})`); g.addColorStop(0.25, H.rgba(H.C.red, al * 0.55)); g.addColorStop(1, H.rgba(H.C.red, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(n.x - sa * w, n.y + ca * w); ctx.lineTo(n.x + ca * L, n.y + sa * L); ctx.lineTo(n.x + sa * w, n.y - ca * w);
          ctx.closePath(); ctx.fill();
        };
        for (let k = 0; k < 4; k++) pico(k * Math.PI / 2, 78 * tw, 1.6, 0.95);
        for (let k = 0; k < 4; k++) pico(Math.PI / 4 + k * Math.PI / 2, 30 * tw, 1.1, 0.55);
        H.luz(ctx, n.x, n.y, [255, 255, 255], 12, 1);
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.beginPath(); ctx.arc(n.x, n.y, 3.2, 0, 6.2832); ctx.fill();
        // pulso suave que se expande (el origen de todas las rutas)
        const f = (t % 3) / 3;
        ctx.strokeStyle = H.rgba(H.C.red, 0.35 * (1 - f)); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, 14 + f * 46, 0, 6.2832); ctx.stroke();
        continue;
      }
      H.luz(ctx, n.x, n.y, H.C.red, 20, 0.3);
    }
    for (const s of G.sitios.values()) {
      if (!(s.bajada > 0 || s.subida > 0)) continue;
      const n = N[s.nodo], p = 0.5 + 0.5 * Math.sin(t * 3 + n.id);
      H.luz(ctx, n.x, n.y, H.C.sitio, 30, 0.25 + 0.3 * p);
      ctx.strokeStyle = H.rgba(H.C.sitio, 0.5 * (1 - p)); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, 12.5 + 8 * p, 0, 6.2832); ctx.stroke();
    }
    // tráfico de cada sitio, junto a su nombre (cifras reales del último segundo)
    for (const s of G.sitios.values()) {
      if (!(s.bajada > 0 || s.subida > 0)) continue;
      const n = N[s.nodo];
      if (!n.etq) continue;
      const txt = (s.bajada > 0 ? "↓" + H.bytes(s.bajada) + "/s " : "") + (s.subida > 0 ? "↑" + H.bytes(s.subida) + "/s" : "") + (s.quic ? " ~quic" : "");
      H.texto(ctx, txt, n.etq.cx, n.etq.tyT, "10px JBM", "rgba(160,238,255,0.95)", "center");
    }
    // frente de búsqueda de Dijkstra
    if (G.anim) {
      const A = G.anim;
      for (let v = 0; v < N.length; v++) {
        if (A.estado[v] !== 1) continue;
        const n = N[v];
        const pr = 7 + 3 * Math.sin(t * 9 + v);
        ctx.strokeStyle = H.rgba(H.C.red, 0.75);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, pr, 0, 6.2832); ctx.stroke();
        H.luz(ctx, n.x, n.y, H.C.red, 18, 0.35);
      }
      // texto del suceso actual
      if (G.ultimoAsentado >= 0) {
        const n = N[G.ultimoAsentado];
        // (sin texto de suceso: solo queda el título)
      }
    }
    for (const d of G.destellos) {
      const n = N[d.v], f = d.t / 1.4;
      ctx.strokeStyle = H.rgba(H.C.red, 0.6 * (1 - f));
      ctx.lineWidth = 1.2 * (1 - f) + 0.3;
      ctx.beginPath(); ctx.arc(n.x, n.y, 4 + f * 26, 0, 6.2832); ctx.stroke();
    }
    for (const r of G.relajos) {
      const a = N[r.u], b = N[r.v], f = r.t / 0.5;
      const x = H.mix(a.x, b.x, f), y = H.mix(a.y, b.y, f);
      H.luz(ctx, x, y, [200, 245, 255], 12, 0.7 * (1 - f * 0.5));
    }
    // paquetes con estela
    for (const pk of G.paquetes) {
      const a = N[pk.p[pk.i]], b = N[pk.p[pk.i + 1]];
      const L = H.dist(a, b), f = H.clamp(pk.s / L, 0, 1);
      const x = H.mix(a.x, b.x, f), y = H.mix(a.y, b.y, f);
      const c = pk.tipo === "bajada" ? H.C.red : H.C.subida;
      const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
      const larga = 22 + pk.tam * 6;
      for (let k = 1; k <= 6; k++) H.luz(ctx, x - ux * larga * k / 6, y - uy * larga * k / 6, c, 7, 0.9 * (1 - k / 7));
      H.luz(ctx, x, y, c, Math.round(16 + pk.tam * 3), 1);
      H.luz(ctx, x, y, [255, 255, 255], 6, 1);
    }
    ctx.restore();
  };

  return G;
})();

H.mix3 = (a, b, f) => [H.mix(a[0], b[0], f), H.mix(a[1], b[1], f), H.mix(a[2], b[2], f)];
