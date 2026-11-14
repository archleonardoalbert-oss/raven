// HORTUS ALGORITHMICUS · utilidades compartidas
"use strict";
var H = window.H || (window.H = {});

// generador pseudoaleatorio con semilla (la lámina es siempre la misma)
H.rng = function (semilla) {
  let a = semilla >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

H.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
H.mix = (a, b, f) => a + (b - a) * f;
H.suave = f => f * f * (3 - 2 * f);
H.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// colores de la lámina: cada algoritmo tiene el suyo
H.C = {
  tinta: "#cfd9ea",
  tenue: "rgba(143,163,192,0.55)",
  muyTenue: "rgba(143,163,192,0.22)",
  red: [111, 227, 255],      // Dijkstra · bajada
  subida: [186, 146, 255],   // Dijkstra · subida
  sitio: [255, 196, 110],    // sitios reales de la red
  arbol: [232, 193, 114],    // árbol B+
  vida: [125, 255, 154],     // Juego de la Vida
  farol: [255, 233, 176],    // reloj binario
};
H.rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// color térmico: frío azul → templado ámbar → caliente rojo blanco
H.calor = function (f) {
  f = H.clamp(f, 0, 1);
  const P = [[90, 160, 255], [120, 230, 220], [255, 205, 110], [255, 110, 60], [255, 60, 90]];
  const x = f * (P.length - 1), i = Math.min(P.length - 2, Math.floor(x)), g = x - i;
  return [H.mix(P[i][0], P[i + 1][0], g), H.mix(P[i][1], P[i + 1][1], g), H.mix(P[i][2], P[i + 1][2], g)];
};

// sprite de resplandor precalculado (dibujar luces es así casi gratis)
H.sprites = {};
H.brillo = function (c, r) {
  const k = c.join(",") + ":" + r;
  if (H.sprites[k]) return H.sprites[k];
  const s = document.createElement("canvas");
  s.width = s.height = r * 2;
  const g = s.getContext("2d");
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, H.rgba(c, 1));
  gr.addColorStop(0.09, H.rgba(c, 0.6));
  gr.addColorStop(0.22, H.rgba(c, 0.12));
  gr.addColorStop(0.6, H.rgba(c, 0.02));
  gr.addColorStop(1, H.rgba(c, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, r * 2, r * 2);
  return (H.sprites[k] = s);
};
H.luz = function (ctx, x, y, c, r, a) {
  const s = H.brillo(c, r);
  ctx.globalAlpha = a;
  ctx.drawImage(s, x - r, y - r);
  ctx.globalAlpha = 1;
};

// formato de cantidades
H.bytes = function (b) {
  if (b < 1024) return b.toFixed(0) + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1073741824).toFixed(2) + " GB";
};
H.hex = (n, d) => n.toString(16).padStart(d, "0");

// cola de prioridad (montículo binario) para Dijkstra
H.Monticulo = class {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(k, v) {
    const a = this.a; a.push([k, v]);
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
};

// ── sprites para dibujar rápido figuras pequeñas que giran ─────────────────
// (dibujar una imagen precalculada es mucho más barato que trazar una elipse)
H.SS = 4;   // supermuestreo de los sprites: nítidos aunque la pantalla escale
H.spriteElipse = function (rgb, rx, ry) {
  const k = "e" + rgb.join(",") + ":" + rx + ":" + ry;
  if (H.sprites[k]) return H.sprites[k];
  const s = document.createElement("canvas");
  s.width = Math.ceil(rx * 2 * H.SS) + 2; s.height = Math.ceil(ry * 2 * H.SS) + 2;
  const g = s.getContext("2d");
  g.fillStyle = H.rgba(rgb, 1);
  g.beginPath(); g.ellipse(s.width / 2, s.height / 2, rx * H.SS, ry * H.SS, 0, 0, 6.2832); g.fill();
  return (H.sprites[k] = s);
};
// dibuja img centrada en (x,y), girada ang, con tamaño w×h, sobre la transformación base m
H.rot = function (ctx, m, img, x, y, ang, w, h) {
  const c = Math.cos(ang), s = Math.sin(ang);
  ctx.setTransform(m.a * c + m.c * s, m.b * c + m.d * s, -m.a * s + m.c * c, -m.b * s + m.d * c,
                   m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
};
// caché de un trozo de texto/dibujo que solo cambia cuando cambia su «clave»
H.cache = function (id, w, h, clave, dibujar) {
  const c = H.sprites["c:" + id] || (H.sprites["c:" + id] = { cv: document.createElement("canvas"), clave: null });
  if (c.clave !== clave) {
    const esc = H.escalaCache || 1;
    c.cv.width = Math.ceil(w * esc); c.cv.height = Math.ceil(h * esc);
    const g = c.cv.getContext("2d");
    g.setTransform(esc, 0, 0, esc, 0, 0);
    dibujar(g);
    c.clave = clave;
  }
  return c.cv;
};

// ── texto en caché: cada etiqueta se rasteriza una vez y luego solo se pega ──
// (fillText es de lo más caro del canvas; pegar una imagen es casi gratis)
H.textos = new Map();
H.texto = function (ctx, str, x, y, fuente, color, alin, base) {
  str = String(str);
  const esc = H.escalaCache || 1;
  const k = fuente + "|" + color + "|" + esc + "|" + str;
  let s = H.textos.get(k);
  if (!s) {
    if (H.textos.size > 4000) H.textos.clear();
    const m = H._medidor || (H._medidor = document.createElement("canvas").getContext("2d"));
    m.font = fuente;
    const met = m.measureText(str);
    const tam = parseFloat(fuente.match(/([\d.]+)px/)[1]);
    const w = Math.ceil(met.width) + 4, h = Math.ceil(tam * 1.5) + 4;
    s = document.createElement("canvas");
    s.width = Math.ceil(w * esc); s.height = Math.ceil(h * esc);
    const g = s.getContext("2d");
    g.setTransform(esc, 0, 0, esc, 0, 0);
    g.font = fuente; g.fillStyle = color; g.textBaseline = "alphabetic"; g.textAlign = "left";
    g.fillText(str, 2, Math.ceil(tam * 1.1) + 2);
    s.w = w; s.h = h; s.asc = Math.ceil(tam * 1.1) + 2; s.tam = tam;
    H.textos.set(k, s);
  }
  let dx = 2;
  if (alin === "center") dx = s.w / 2; else if (alin === "right") dx = s.w - 2;
  let dy = s.asc;                                   // alphabetic
  if (base === "middle") dy = s.asc - s.tam * 0.36;
  ctx.drawImage(s, x - dx, y - dy, s.w, s.h);
};
