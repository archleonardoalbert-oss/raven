// HORTUS ALGORITHMICUS · Fig. I — Arbor B+ (el disco), versión botánica en 3D
// Tu raíz es btrfs, un sistema de archivos hecho de árboles B. Aquí el árbol es un
// B+ real de orden 5 (máx. 4 claves por nodo): cada clave vale el 2 % del disco
// ocupado. La anatomía del árbol ES la estructura del B+:
//   · el tronco es la raíz del B+; cada horquilla es un nodo interno;
//   · cada nodo hoja del B+ es una rama con 4 brotes (sus 4 huecos de clave):
//     cada clave hace crecer su propia copa; un hueco libre es una ramita seca;
//   · las ramillas de cada copa crecen en 3D con el algoritmo de colonización del
//     espacio (Runions et al., 2007): buscan los puntos libres de su nube como
//     las ramas reales buscan la luz;
//   · el grosor de cada segmento es la regla de Leonardo (modelo de tuberías):
//     sección del padre = suma de las secciones de los hijos, d² = Σ d², calculada
//     desde las puntas hasta el tronco;
//   · la enredadera que cuelga entre las ramas es la lista enlazada de hojas;
//   · cada lectura o escritura del disco es una búsqueda real: un hilo de savia
//     que sube del suelo por el camino exacto (raíz → separadoras → hoja → clave).
// Todo se genera en 3D (x, y, z) y se proyecta con la cámara algo elevada: lo que
// está delante tapa a lo de detrás, la luz de la luna es tridimensional y lo
// lejano se oscurece y enfría (perspectiva aérea).
"use strict";

H.Arbol = (function () {
  const MAXK = 4;
  const A = {
    raiz: null, n: 0, hojas: [], niveles: [], altura: 1,
    secuencia: [], busquedas: [], sucio: true, polen: [], caidas: [],
    deuda: 0, goteo: 0, restoLlenado: 0, ultimaNueva: null, tCambio: 99,
    suelo: 944,                 // = H.Vida.y0: la línea de la tierra
  };
  const norm3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return { x: x / l, y: y / l, z: z / l }; };
  const LUZ = norm3(0.3, -0.85, 0.45);       // la luna: arriba, algo a la derecha y por delante
  const INCL = 0.2;                          // cámara elevada: lo cercano (z>0) se ve más abajo
  const py = (y, z) => y + z * INCL;

  // objectids «de btrfs» inventados pero fijos: 3 cifras hex, todos distintos
  (function () {
    const r = H.rng(7331), usados = new Set();
    while (A.secuencia.length < 50) {
      const k = 0x100 + ((r() * 0xEFF) | 0);
      if (!usados.has(k)) { usados.add(k); A.secuencia.push(k); }
    }
  })();

  // ── el árbol B+ (algoritmo de verdad) ────────────────────────────────────
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

  function bez(r, t) {
    const u = 1 - t;
    return {
      x: u * u * u * r.x0 + 3 * u * u * t * r.x1 + 3 * u * t * t * r.x2 + t * t * t * r.x3,
      y: u * u * u * r.y0 + 3 * u * u * t * r.y1 + 3 * u * t * t * r.y2 + t * t * t * r.y3,
    };
  }
  // guía curva de P a C (en x,y; z se interpola aparte): sale subiendo y se abre
  function guia(P, C, r, sube) {
    const dx = C.x - P.x, dy = C.y - P.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L, w = (r() - 0.5) * 0.22 * L;
    return {
      x0: P.x, y0: P.y,
      x1: P.x + dx * 0.22 + nx * w, y1: P.y + dy * 0.22 + ny * w - L * sube,
      x2: P.x + dx * 0.68 - nx * w * 0.5, y2: P.y + dy * 0.68 - ny * w * 0.5 - L * sube * 0.25,
      x3: C.x, y3: C.y,
    };
  }

  // ── el grafo de madera: nodos 3D con padre, hijos y radio ────────────────
  // g: −1 = esqueleto (tronco y ramas del B+, capa fija); id de nodo hoja = su
  // rama, que se mece. Los hijos siempre tienen índice mayor que el padre.
  let N = [];
  function nodo(x, y, z, p, g, seco) {
    const i = N.length;
    N.push({ x, y, z, p, h: [], r: 0, g, seco: !!seco });
    if (p >= 0) N[p].h.push(i);
    return i;
  }
  // cadena de nodos a lo largo de una guía, con ondulación natural en 3D
  function cadena(desde, cv, z1, g, paso, amp, r, seco) {
    let L = 0, a = bez(cv, 0);
    for (let k = 1; k <= 24; k++) { const b = bez(cv, k / 24); L += Math.hypot(b.x - a.x, b.y - a.y); a = b; }
    const n = Math.max(2, Math.round(L / paso)), z0 = N[desde].z;
    const f1 = 1.5 + r() * 2, f2 = 4 + r() * 5, p1 = r() * 6.3, p2 = r() * 6.3, p3 = r() * 6.3;
    const ids = [desde];
    let prev = desde;
    for (let i = 1; i <= n; i++) {
      const t = i / n, p = bez(cv, t), q = bez(cv, Math.min(1, t + 0.01)), q0 = bez(cv, Math.max(0, t - 0.01));
      const dx = q.x - q0.x, dy = q.y - q0.y, l = Math.hypot(dx, dy) || 1;
      const env = i === n ? 0 : amp * Math.sin(Math.PI * t);
      const w = env * (Math.sin(t * f1 * Math.PI + p1) + 0.45 * Math.sin(t * f2 * Math.PI + p2));
      const wz = env * 1.4 * Math.sin(t * f1 * 0.8 * Math.PI + p3);
      prev = nodo(p.x - dy / l * w, p.y + dx / l * w, H.mix(z0, z1, H.suave(t)) + wz, prev, g, seco);
      ids.push(prev);
    }
    return ids;
  }

  // colonización del espacio en 3D: las ramillas crecen hacia los puntos libres
  function colonizar(base, nube, g, r, nPts = 230, act0 = null) {
    const P = [];
    for (let k = 0; P.length < nPts && k < 8000; k++) {
      const u = r() * 2 - 1, v = r() * 2 - 1, w = r() * 2 - 1;
      if (u * u + v * v + w * w > 1 || v > 0.45) continue;    // una cúpula: casi nada por debajo
      P.push({ x: nube.x + u * nube.rx, y: nube.y + v * nube.ry, z: nube.z + w * nube.rz });
    }
    const act = act0 ? act0.slice() : base.slice(-5);
    const D = 3.6, DI2 = 26 * 26, DK2 = 4.8 * 4.8;
    for (let it = 0; it < 100 && P.length; it++) {
      const acc = new Map();
      for (const p of P) {
        let best = -1, bd = DI2;
        for (const i of act) { const n = N[i], dx = n.x - p.x, dy = n.y - p.y, dz = n.z - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = i; } }
        if (best < 0) continue;
        const d = Math.sqrt(bd) || 1, v = acc.get(best) || { x: 0, y: 0, z: 0 }, n = N[best];
        v.x += (p.x - n.x) / d; v.y += (p.y - n.y) / d; v.z += (p.z - n.z) / d;
        acc.set(best, v);
      }
      if (!acc.size) break;
      const nuevos = [];
      for (const [i, v] of acc) {
        const d = norm3(v.x + (r() - 0.5) * 0.6, v.y - 0.3 + (r() - 0.5) * 0.6, v.z + (r() - 0.5) * 0.6);   // −0.3: fototropismo
        const x = N[i].x + d.x * D, y = N[i].y + d.y * D, z = N[i].z + d.z * D;
        if (N[i].h.some(c => Math.abs(N[c].x - x) + Math.abs(N[c].y - y) + Math.abs(N[c].z - z) < 1.5)) continue;
        nuevos.push(nodo(x, y, z, i, g));
      }
      if (!nuevos.length) break;
      act.push(...nuevos);
      for (let k = P.length - 1; k >= 0; k--) for (const i of nuevos) {
        const dx = N[i].x - P[k].x, dy = N[i].y - P[k].y, dz = N[i].z - P[k].z;
        if (dx * dx + dy * dy + dz * dz < DK2) { P.splice(k, 1); break; }
      }
    }
  }

  // ── construcción del árbol entero ───────────────────────────────────────
  function colocar() {
    const niveles = [];
    (function rec(nd, d) { (niveles[d] || (niveles[d] = [])).push(nd); nd.prof = d; if (!nd.hoja) nd.hijos.forEach(h => rec(h, d + 1)); })(A.raiz, 0);
    A.niveles = niveles;
    A.altura = niveles.length;
    const hojas = niveles[niveles.length - 1];
    A.hojas = hojas;
    let id = 0;
    niveles.forEach(nv => nv.forEach(nd => { nd.id = id++; }));
    const L = hojas.length;
    // copa ancha (como una encina): una cúpula en 3D, más alta en el centro;
    // las ramas se reparten por delante y por detrás del tronco
    const W = Math.min(860, 120 + L * 64);       // compacta: no invade las flores de la Fig. III
    hojas.forEach((h, i) => {
      const r = H.rng(h.k[0] * 13 + 5);
      const u = L > 1 ? (i / (L - 1)) * 2 - 1 : 0;
      const z = (i % 3 === 0 ? 46 : i % 3 === 1 ? -40 : 8) + (r() - 0.5) * 24;
      h.copa = { x: 960 + u * W / 2 + (r() - 0.5) * 16, y: 656 + 92 * u * u + (r() - 0.5) * 12 - z * INCL, z };
      h.pf = { x: H.mix(h.copa.x, 960, 0.06), y: h.copa.y + 44 + r() * 8, z: z * 0.85 };
    });
    const yRaiz = 872;
    const yHojasF = hojas.reduce((s, h) => s + h.pf.y, 0) / L;
    for (let d = niveles.length - 2; d >= 0; d--) for (const nd of niveles[d]) {
      let sx = 0, sz = 0, sw = 0;
      for (const c of nd.hijos) { const w = c.total + 0.5; sx += c.pf.x * w; sz += c.pf.z * w; sw += w; }
      const fr = A.altura > 1 ? d / (A.altura - 1) : 0;
      const r = H.rng(nd.k[0] * 7 + d);
      nd.pf = d === 0 ? { x: 958, y: yRaiz, z: 0 }
        : { x: H.mix(sx / sw, 960, 0.4) + (r() - 0.5) * 14, y: H.mix(yRaiz, yHojasF, fr) + (r() - 0.5) * 10, z: sz / sw * 0.6 };
    }
    if (A.altura === 1) A.raiz.pf = { x: 958, y: 820, z: 0 };

    N = [];
    const r0 = H.rng(4242);
    const base = nodo(963, A.suelo + 8, 0, -1, -1);
    const rf = A.raiz.pf;
    A.troncoIds = cadena(base, { x0: 963, y0: A.suelo + 8, x1: 951, y1: H.mix(A.suelo, rf.y, 0.4), x2: rf.x + 6, y2: H.mix(A.suelo, rf.y, 0.75), x3: rf.x, y3: rf.y }, 0, -1, 6, 3, r0);
    A.raiz.ni = A.troncoIds[A.troncoIds.length - 1];
    niveles.forEach(nv => nv.forEach(nd => {
      if (nd.hoja) return;
      const r = H.rng(nd.k[0] * 31 + 1);
      nd.cadenas = nd.hijos.map(h => {
        const len = Math.hypot(h.pf.x - nd.pf.x, h.pf.y - nd.pf.y);
        const ids = cadena(nd.ni, guia(nd.pf, h.pf, r, 0.3), h.pf.z, -1, 6, Math.min(7, len * 0.035), r);
        h.ni = ids[ids.length - 1];
        return ids;
      });
    }));
    for (const h of hojas) {
      const r = H.rng(h.k[0] * 17 + 3);
      h.brotes = [];
      for (let j = 0; j < MAXK; j++) {
        const a = Math.PI * (1.13 + j * 0.245) + (r() - 0.5) * 0.12;
        const lleno = j < h.k.length;
        const zf = h.copa.z + (j % 2 ? 14 : -14) + (r() - 0.5) * 10;
        const fin = { x: h.copa.x + Math.cos(a) * 26, y: h.copa.y + Math.sin(a) * 15 + 8 };
        const ids = cadena(h.ni, guia(h.pf, fin, r, 0.12), zf, h.id, 4, 1.6, r, !lleno);
        const b = { ids, lleno, fin, a };
        if (lleno) {
          b.nube = { x: fin.x + Math.cos(a) * 8, y: fin.y - 18, z: zf, rx: 34, ry: 27, rz: 28 };
          colonizar(ids, b.nube, h.id, r);
        } else {
          const t = ids[ids.length - 1];
          for (const da of [-0.55, 0.5]) {
            const l = 5 + r() * 4;
            nodo(N[t].x + Math.cos(a + da) * l, N[t].y + Math.sin(a + da) * l, N[t].z + (r() - 0.5) * 4, t, h.id, true);
          }
        }
        h.brotes.push(b);
      }
    }
    // suavizado de las ramillas (el crecimiento por pasos deja quiebros)
    for (let pasada = 0; pasada < 2; pasada++) {
      for (let i = 0; i < N.length; i++) {
        const n = N[i];
        if (n.g < 0 || n.p < 0 || !n.h.length) continue;
        let cx = 0, cy = 0, cz = 0; for (const c of n.h) { cx += N[c].x; cy += N[c].y; cz += N[c].z; }
        const k = n.h.length, p = N[n.p];
        n.x = n.x * 0.5 + (p.x + cx / k) * 0.25; n.y = n.y * 0.5 + (p.y + cy / k) * 0.25; n.z = n.z * 0.5 + (p.z + cz / k) * 0.25;
      }
    }
    // regla de Leonardo desde las puntas: r² = Σ r_hijo²; algo más grueso hacia la base
    for (let i = N.length - 1; i >= 0; i--) {
      const n = N[i];
      if (!n.h.length) { n.r = 0.32; continue; }
      let s = 0; for (const c of n.h) s += N[c].r * N[c].r;
      n.r = Math.sqrt(s) * (n.h.length === 1 ? 1.008 : 1);
    }
    A.troncoIds.forEach((id, k) => { const f = 1 - k / (A.troncoIds.length - 1); N[id].r *= 1 + 0.32 * f * f; });
    // contrafuertes: raíces que salen del pie del tronco y se hunden en la tierra,
    // con la misma madera 3D (las de delante tapan el tronco, las de detrás no)
    {
      const rr = H.rng(808), ti = A.troncoIds[Math.min(6, A.troncoIds.length - 2)], rT = N[A.troncoIds[0]].r;
      A.raicesBase = [];
      for (const [s, zf] of [[-1.7, -0.9], [-1.0, 1.0], [0.2, 1.3], [1.15, 0.7], [1.9, -0.7], [-0.3, -1.2]]) {
        const fin = { x: N[ti].x + s * rT * 2.3 + (rr() - 0.5) * 8, y: A.suelo + 11 };   // se hunde en la tierra
        const ids = cadena(ti, guia({ x: N[ti].x, y: N[ti].y }, fin, rr, -0.42), zf * 30, -1, 4, 1.5, rr);   // nace en el eje: su punta queda dentro del tronco
        // se afinan hasta el grosor con el que siguen bajo tierra
        // nace fino dentro del tronco y se ensancha (sin corte plano arriba), luego se afina hacia la tierra
        ids.forEach((id, k) => { if (k) { const t = k / (ids.length - 1); const lleno = H.mix(rT * (0.7 - Math.abs(s) * 0.08), rT * 0.24, Math.pow(t, 0.8)); N[id].r = Math.max(0.8, lleno * (0.2 + 0.8 * H.suave(H.clamp(t / 0.4, 0, 1)))); } });
        for (let k = 1; k < ids.length; k++) N[ids[k]].cf = true;      // contrafuerte: se dibuja detrás del tronco
        A.raicesBase.push({ id: ids[ids.length - 1], prev: ids[ids.length - 2], s, ids, kTronco: A.troncoIds.indexOf(ti) });
      }
    }
    // posición en pantalla de cada nodo (proyección con la cámara elevada)
    for (const n of N) { n.sx = n.x; n.sy = py(n.y, n.z); }
    hojasYFrutos();
    caminos();
    {   // dónde va el grabado del tronco (lo usan la savia y pintarGrabado)
      const objetivo = A.suelo - 44;
      let k = 0; for (let i = 0; i < A.troncoIds.length; i++) if (Math.abs(N[A.troncoIds[i]].sy - objetivo) < Math.abs(N[A.troncoIds[k]].sy - objetivo)) k = i;
      const nd = N[A.troncoIds[k]];
      A.heridaGeo = null;      // (el grabado del tronco se retiró)
    }
    A.arbolitos = [];
    A.camTroncoMedio = [-1, 1].map(lado => {
      const ti = A.troncoIds[Math.min(6, A.troncoIds.length - 2)], k0 = A.troncoIds.indexOf(ti), kN = A.troncoIds.length - 1, w = A.heridaGeo, c = [];
      for (let k = k0; k < kN; k++) for (let sub = 0; sub < 3; sub++) {
        const pA = N[A.troncoIds[k]], pB = N[A.troncoIds[k + 1]], u = sub / 3;
        const x0 = H.mix(pA.sx, pB.sx, u), y0 = H.mix(pA.sy, pB.sy, u), rr = H.mix(pA.r, pB.r, u), t = (k + u - k0) / Math.max(1, kN - k0);
        let x = x0 + lado * rr * 0.32 * Math.sin(Math.PI * Math.min(1, t * 1.15));   // nace en el punto exacto y se abre un poco
        if (w) { const dy = (y0 - w.cy) / (w.bh * 1.5); if (Math.abs(dy) < 1) { const borde = w.bw * 1.18 * Math.sqrt(Math.max(0, 1 - ((y0 - w.cy) / (w.bh * 1.25)) ** 2)); x = w.cx + lado * H.mix(Math.abs(x - w.cx), Math.max(Math.abs(x - w.cx), borde, w.bw * 0.75), H.suave(1 - Math.abs(dy))); } }
        c.push({ x, y: y0 });
      }
      c.push({ x: N[A.troncoIds[kN]].sx, y: N[A.troncoIds[kN]].sy });
      for (let pasada = 0; pasada < 3; pasada++) for (let i = 1; i < c.length - 1; i++) c[i].x = c[i - 1].x * 0.25 + c[i].x * 0.5 + c[i + 1].x * 0.25;
      c.L = [0]; for (let i = 1; i < c.length; i++) c.L.push(c.L[i - 1] + Math.hypot(c[i].x - c[i - 1].x, c[i].y - c[i - 1].y));
      return c;
    });
    generarRaices();
    generarColonias();
    A.raicesCentro = A.raices.filter(R => R.cam && R.pts.length > 1);   // cualquier raíz puede lanzar una luz dorada
  }

  // hojas: en las ramillas finas, alternas, y tres en cada punta; cada una con
  // su normal 3D (para la luz) y su profundidad (para el orden y la niebla)
  function hojasYFrutos() {
    for (const h of A.hojas) {
      const r = H.rng(h.k[0] * 71 + 9);
      h.follaje = [];
      for (let i = 0; i < N.length; i++) {
        const n = N[i];
        if (n.g !== h.id || n.seco || n.r > 0.62 || n.p < 0) continue;
        const pa = N[n.p], dir = Math.atan2(n.sy - pa.sy, n.sx - pa.sx);
        const ang = !n.h.length ? [0, -0.75, 0.75] : r() < 0.6 ? [(i % 2 ? 1 : -1) * (0.9 + r() * 0.4)] : [];
        for (const da of ang) {
          const len = 6.2 + r() * 3.4;
          // normal: hacia arriba y hacia fuera de su nube, con desorden
          const bt = h.brotes.find(b => b.nube && Math.abs(b.nube.x - n.x) < 45) || h.brotes[0];
          const c = bt.nube || { x: n.x, y: n.y + 10, z: n.z };
          const nn = norm3((n.x - c.x) / 30 + (r() - 0.5) * 0.9, -0.6 + (n.y - c.y) / 40 + (r() - 0.5) * 0.9, (n.z - c.z) / 30 + 0.3 + (r() - 0.5) * 0.9);
          const dif = Math.max(0, nn.x * LUZ.x + nn.y * LUZ.y + nn.z * LUZ.z);
          // oclusión: hojas del interior y de detrás de su nube, en sombra
          const dc = Math.hypot((n.x - c.x) / 34, (n.y - c.y) / 27, (n.z - c.z) / 28);
          const ocl = H.clamp(0.35 + 0.65 * dc, 0, 1) * H.clamp(0.6 + (n.z - c.z) / 50, 0.25, 1);
          // la luna atraviesa algunas hojas por detrás (translucidez)
          const trans = nn.z < -0.2 && r() < 0.25 ? 0.18 : 0;
          const b = H.clamp(0.08 + dif * 0.9 * ocl + trans - H.clamp((n.y - 660) / 170, 0, 1) * 0.15, 0, 1);
          h.follaje.push({ x: n.sx, y: n.sy, z: n.z, a: dir + da + (r() - 0.5) * 0.4, len, wid: len * (0.34 + r() * 0.08) * (0.55 + 0.45 * Math.abs(nn.z)), b, v: r() });
        }
      }
      h.follaje.sort((p, q) => p.z - q.z);      // de atrás adelante
    }
  }

  // caminos de la savia (listas de puntos en pantalla) para cada búsqueda
  function caminos() {
    const pts = ids => ids.map(i => ({ x: N[i].sx, y: N[i].sy }));
    A.camTronco = pts(A.troncoIds);
    for (const nv of A.niveles) for (const nd of nv) if (!nd.hoja) nd.cam = nd.cadenas.map(pts);
    for (const h of A.hojas) for (const b of h.brotes) {
      const ids = b.ids.slice();
      let c = ids[ids.length - 1];
      for (let k = 0; k < 9 && N[c].h.length; k++) {
        c = N[c].h.reduce((a, x) => N[x].r > N[a].r ? x : a, N[c].h[0]);
        ids.push(c);
      }
      b.cam = pts(ids);
      const u = b.cam[b.cam.length - 1];
      b.centro = b.nube ? { x: H.mix(u.x, b.nube.x, 0.5), y: H.mix(u.y, py(b.nube.y, b.nube.z), 0.5) } : u;
    }
    const largo = c => { c.L = [0]; for (let i = 1; i < c.length; i++) c.L.push(c.L[i - 1] + Math.hypot(c[i].x - c[i - 1].x, c[i].y - c[i - 1].y)); return c; };
    largo(A.camTronco);
    for (const nv of A.niveles) for (const nd of nv) if (!nd.hoja) nd.cam.forEach(largo);
    for (const h of A.hojas) for (const b of h.brotes) largo(b.cam);
  }

  // ── raíces bajo tierra, como datos: cada una con su recorrido, su madre y el
  // punto donde nace de ella. Continúan cada contrafuerte, se abren casi en
  // horizontal (los primeros palmos de suelo), ceden poco a poco hacia abajo
  // (gravitropismo) y echan raicillas. Cada punta es un camino propio para la savia.
  // ── raíces bajo tierra: crecen por colonización del espacio, igual que las
  // copas pero buscando tierra libre. Arrancan de cada contrafuerte, de la raíz
  // pivotante y de la base de cada arbolito; su grosor es la regla de Leonardo
  // desde las puntas. Los injertos hacia los arbolitos son raíces guiadas. Al
  // final se trocean en cadenas (madre, punto donde nace) para dibujarlas y para
  // los caminos de la savia.
  function generarRaices() {
    const r = H.rng(2718), pie = N[A.troncoIds[0]], rT = pie.r, fondo = 1070;
    const RN = [];
    const nr = (x, y, p, base, tipo) => { const i = RN.length; RN.push({ x, y, p, h: [], w: 0, base, tipo }); if (p >= 0) RN[p].h.push(i); return i; };
    const inicios = [];
    // cada raíz principal nace EXACTAMENTE donde su contrafuerte entra en la
    // tierra, con el grosor que tiene la madera en ese punto (sin huecos)
    const YS = A.suelo + 2;
    (A.raicesBase || []).forEach((b, bi) => {
      let x = N[b.id].sx, w = N[b.id].r * 2;
      for (let k = 1; k < b.ids.length; k++) {
        const p0 = N[b.ids[k - 1]], p1 = N[b.ids[k]];
        if (p0.sy <= YS && p1.sy >= YS) { const f = (YS - p0.sy) / ((p1.sy - p0.sy) || 1); x = H.mix(p0.sx, p1.sx, f); w = H.mix(p0.r, p1.r, f) * 2; break; }
      }
      const i = nr(x, YS, -1, bi, Math.abs(b.s) > 0.8 ? "lateral" : "centro");
      RN[i].wObj = w; inicios.push(i);
    });
    // y tres raíces que salen del propio pie del tronco
    for (const f of [-0.45, 0, 0.45]) { const i = nr(pie.sx + f * rT, YS, -1, -1, "centro"); RN[i].wObj = rT * 0.62; inicios.push(i); }
    for (const T of A.arbolitos || []) {
      const i = nr(T.piv.x, A.suelo + 6, -1, T.g, "arbolito"); RN[i].wObj = N[T.tronco[0]].r * 2; inicios.push(i);
    }
    // injertos: raíces guiadas desde los contrafuertes laterales hasta cada arbolito
    const injertos = [];
    for (const T of A.arbolitos || []) {
      T.injertos = [];
      (A.raicesBase || []).forEach((b, bi) => {
        if (Math.abs(b.s) <= 0.8 || Math.sign(b.s) !== T.lado) return;
        const ini = inicios.find(i => RN[i].base === bi), S = RN[ini], E = { x: T.piv.x - T.lado * 5, y: A.suelo + 12 };
        const k = injertos.filter(o => o.T === T).length, prof = 30 + k * 20 + r() * 8;
        const cv = { x0: S.x, y0: S.y, x1: H.mix(S.x, E.x, 0.28), y1: A.suelo + prof, x2: H.mix(S.x, E.x, 0.72), y2: A.suelo + prof * 0.8, x3: E.x, y3: E.y };
        const n = Math.round(Math.abs(E.x - S.x) / 6), f1 = r() * 6.3, f2 = r() * 6.3, ids = [ini];
        let prev = ini;
        for (let i = 1; i <= n; i++) {
          const t = i / n, p = bez(cv, t), env = Math.sin(Math.PI * t);
          prev = nr(p.x, Math.max(A.suelo + 7, p.y + env * (Math.sin(t * 8 + f1) * 3 + Math.sin(t * 21 + f2) * 1.2)), prev, bi, "injerto");
          ids.push(prev);
        }
        injertos.push({ T, ids, b, w0: S.wObj });
      });
    }
    // tierra libre: más densa cerca de la superficie y bajo cada tronco
    const P = [];
    const tierra = (cx, rx, ry, n) => {
      for (let k = 0, g = 0; k < n && g < n * 30; g++) {
        const u = r() * 2 - 1, v = Math.pow(r(), 1.3);
        if (r() > (1 - v * 0.5) * (1 - Math.abs(u) * 0.4)) continue;
        const y = A.suelo + 12 + v * ry;
        if (y > fondo - 4) continue;
        P.push({ x: cx + u * rx, y }); k++;
      }
    };
    tierra(pie.sx, 330, 116, 950);
    for (const T of A.arbolitos || []) tierra(T.piv.x, 120, 92, 300);
    const act = inicios.slice();
    const D = 5.5, DI2 = 46 * 46, DK2 = 8.5 * 8.5;
    for (let it = 0; it < 90 && P.length; it++) {
      const acc = new Map();
      for (const p of P) {
        let best = -1, bd = DI2;
        for (const i of act) { const dx = RN[i].x - p.x, dy = RN[i].y - p.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
        if (best < 0) continue;
        const d = Math.sqrt(bd) || 1, v = acc.get(best) || { x: 0, y: 0 };
        v.x += (p.x - RN[best].x) / d; v.y += (p.y - RN[best].y) / d; acc.set(best, v);
      }
      if (!acc.size) break;
      const nuevos = [];
      for (const [i, v] of acc) {
        let vx = v.x + (r() - 0.5) * 0.7, vy = v.y + 0.18 + (r() - 0.5) * 0.7;      // +0.18: gravitropismo
        const l = Math.hypot(vx, vy) || 1, q = RN[i];
        const x = q.x + vx / l * D, y = H.clamp(q.y + vy / l * D, A.suelo + 7, fondo);
        if (q.h.some(c => Math.abs(RN[c].x - x) + Math.abs(RN[c].y - y) < 2)) continue;
        nuevos.push(nr(x, y, i, q.base, q.tipo === "injerto" ? "lateral" : q.tipo));
      }
      if (!nuevos.length) break;
      act.push(...nuevos);
      for (let k = P.length - 1; k >= 0; k--) for (const i of nuevos) {
        const dx = RN[i].x - P[k].x, dy = RN[i].y - P[k].y;
        if (dx * dx + dy * dy < DK2) { P.splice(k, 1); break; }
      }
    }
    // suavizado (sin quiebros) salvo arranques e injertos
    for (let pasada = 0; pasada < 3; pasada++) for (const n of RN) {
      if (n.p < 0 || !n.h.length || n.tipo === "injerto") continue;
      let cx = 0, cy = 0; for (const c of n.h) { cx += RN[c].x; cy += RN[c].y; }
      const k = n.h.length, p = RN[n.p];
      n.x = n.x * 0.5 + (p.x + cx / k) * 0.25; n.y = n.y * 0.5 + (p.y + cy / k) * 0.25;
    }
    // Leonardo desde las puntas
    for (let i = RN.length - 1; i >= 0; i--) {
      const n = RN[i];
      if (!n.h.length) { n.w = 0.45; continue; }
      let s = 0; for (const c of n.h) s += RN[c].w * RN[c].w;
      n.w = Math.sqrt(s) * (n.h.length === 1 ? 1.012 : 1);
    }
    // cada sistema se escala para empalmar con el grosor de su contrafuerte/tronco
    for (const i0 of inicios) {
      const f = H.clamp(RN[i0].wObj / (RN[i0].w || 1), 0.3, 8);        // todo el sistema, al grosor de su arranque
      const pila = [i0];
      while (pila.length) { const i = pila.pop(); RN[i].w *= f; for (const c of RN[i].h) if (RN[c].tipo !== "injerto") pila.push(c); }
      RN[i0].w = RN[i0].wObj;
    }
    for (const o of injertos) o.ids.forEach((id, k) => { const t = k / (o.ids.length - 1); RN[id].w = Math.max(RN[id].w, H.mix(o.w0 * 0.9, 2.6, Math.pow(t, 0.55))); });
    // cadenas: se sigue al hijo más grueso; los demás nacen como raíz hija
    A.raices = [];
    for (const i0 of inicios) {
      const pila = [[i0, -1, 0]];
      while (pila.length) {
        const [ini, padre, iPadre] = pila.pop();
        const ids = padre >= 0 ? [RN[ini].p, ini] : [ini];
        let c = ini;
        const idx = A.raices.length;
        while (RN[c].h.length) {
          const hs = RN[c].h.slice().sort((a, b) => RN[b].w - RN[a].w);
          for (let k = 1; k < hs.length; k++) pila.push([hs[k], idx, ids.length - 1]);
          c = hs[0]; ids.push(c);
        }
        const tipo = RN[ini].tipo === "injerto" ? "injerto" : RN[ini].tipo;
        const pts = ids.map(i => ({ x: RN[i].x, y: RN[i].y, w: RN[i].w }));
        if (padre >= 0 && pts.length > 1) pts[0].w = pts[1].w;                     // nace con su propio grosor
        const nP = pts.length;                                                    // la punta se afila
        for (let k = Math.max(1, nP - 3); k < nP; k++) pts[k].w = Math.min(pts[k].w, H.mix(pts[Math.max(0, nP - 4)].w, 0.25, (k - (nP - 4)) / 3));
        A.raices.push({ pts, padre, iPadre, base: RN[ini].base, tipo, ancho: RN[ini].w, prof: padre < 0 ? 0 : 1 });
      }
    }
    // caminos de las luces de la RAM: tronco grande → contrafuerte → injerto
    const ti = A.troncoIds[Math.min(6, A.troncoIds.length - 2)];
    for (const o of injertos) {
      const cam = [{ x: N[ti].sx, y: N[ti].sy }];
      for (let i = 1; i < o.b.ids.length; i++) cam.push({ x: N[o.b.ids[i]].sx, y: N[o.b.ids[i]].sy });
      for (const id of o.ids) cam.push({ x: RN[id].x, y: RN[id].y });
      o.T.injertos.push(cam);
    }
    // camino de cada punta: su raíz → sus raíces madre → contrafuerte → tronco
    for (const R0 of A.raices) {
      if (R0.tipo === "injerto" || R0.tipo === "arbolito") continue;     // todas las raíces del árbol llevan savia
      const c = [];
      const pon = (x, y) => { const u = c[c.length - 1]; if (!u || Math.abs(u.x - x) + Math.abs(u.y - y) > 0.5) c.push({ x, y }); };
      let R = R0, hasta = R0.pts.length - 1;
      for (;;) {
        for (let k = hasta; k >= 0; k--) pon(R.pts[k].x, R.pts[k].y);
        if (R.padre < 0) break;
        hasta = R.iPadre; R = A.raices[R.padre];
      }
      // dentro del tronco la savia sube por vasos paralelos (xilema): cada luz
      // conserva el carril por el que entró y los carriles confluyen suavemente
      // hacia la horquilla, donde se reparten por las ramas
      let k0 = 0, carril;
      if (R.base >= 0) {
        const b = A.raicesBase[R.base];
        for (let k = b.ids.length - 1; k >= 1; k--) if (N[b.ids[k]].sy < A.suelo + 2) pon(N[b.ids[k]].sx, N[b.ids[k]].sy);   // solo la parte sobre tierra (la raíz nace donde el contrafuerte la cruza)
        k0 = Math.max(0, b.kTronco);
        const t0 = N[A.troncoIds[k0]], e = N[b.ids[1]];
        carril = H.clamp((e.sx - t0.sx) / (t0.r || 1), -0.85, 0.85);
      } else carril = (A.raices.indexOf(R0) % 2 ? 1 : -1) * 0.45;
      carril = H.clamp(carril + (r() - 0.5) * 0.3, -0.85, 0.85);
      const w = A.heridaGeo, kN = A.troncoIds.length - 1;
      for (let k = k0; k < kN; k++) for (let sub = 0; sub < 3; sub++) {
        const pA = N[A.troncoIds[k]], pB = N[A.troncoIds[k + 1]], u = sub / 3;
        const x0 = H.mix(pA.sx, pB.sx, u), y0 = H.mix(pA.sy, pB.sy, u), rr = H.mix(pA.r, pB.r, u);
        const t = (k + u - k0) / Math.max(1, kN - k0);
        let off = carril * rr * 0.75 * Math.pow(1 - t, 0.8);               // confluye hacia arriba
        pon(x0 + off, y0);
      }
      pon(N[A.troncoIds[kN]].sx, N[A.troncoIds[kN]].sy);
      // el grabado: todo punto que caería encima se aparta hacia el borde del
      // tronco con una curva suave (por el lado por el que llega cada luz)
      if (w) {
        const lado = carril >= 0 ? 1 : -1;
        for (const q of c) {
          const dy = (q.y - w.cy) / (w.bh * 1.5);
          if (Math.abs(dy) >= 1 || Math.abs(q.x - w.cx) > w.bw * 1.6) continue;
          const borde = w.bw * 1.18 * Math.sqrt(Math.max(0, 1 - ((q.y - w.cy) / (w.bh * 1.25)) ** 2));
          const objetivo = Math.max(borde, w.bw * 0.75);
          const dx = q.x - w.cx, sgn = Math.abs(dx) > 1 ? Math.sign(dx) : lado;
          q.x = w.cx + sgn * H.mix(Math.abs(dx), Math.max(Math.abs(dx), objetivo), H.suave(1 - Math.abs(dy)));
        }
      }
      // suavizado del tramo del tronco (sin quiebros al entrar ni al confluir)
      for (let pasada = 0; pasada < 4; pasada++) for (let i = 1; i < c.length - 1; i++) {
        const q = c[i];
        if (Math.abs(q.x - N[A.troncoIds[0]].sx) > 70 || q.y < N[A.troncoIds[kN]].sy - 2) continue;
        q.x = c[i - 1].x * 0.25 + q.x * 0.5 + c[i + 1].x * 0.25;
        q.y = c[i - 1].y * 0.25 + q.y * 0.5 + c[i + 1].y * 0.25;
      }
      c.L = [0]; for (let i = 1; i < c.length; i++) c.L.push(c.L[i - 1] + Math.hypot(c[i].x - c[i - 1].x, c[i].y - c[i - 1].y));
      R0.cam = c;
    }
  }

  // ══ LA RAM: MICORRIZAS (hongos bioluminiscentes unidos a las raíces) ═══════
  // Los hongos micorrícicos se unen a las raíces de los árboles e intercambian
  // nutrientes con ellos, como la RAM intercambia datos con el disco. Y son
  // efímeros como la RAM: brotan, brillan y se retiran.
  //   · setas verde menta / cian = RAM en uso por los programas;
  //   · setas violetas = caché de disco; el resto duerme bajo tierra;
  //   · memoria → RAM (lecturas): luz cian por los cordones de micelio, desde el
  //     árbol hasta una seta, que se enciende;
  //   · RAM → memoria (escrituras): luz rosa de una seta hasta el tronco;
  //   · esporas luminosas que suben, más cuanto más llena está la RAM.
  const COL_LEE = [120, 232, 255], COL_ESC = [255, 128, 196];
  const POR_LUZ_RAM = 65536;            // 1 luz por cada 64 KB transferidos
  const PAL_USO = [[96, 255, 196], [110, 226, 255]], PAL_CACHE = [196, 156, 255];
  const CORROS = [{ x: 190, n: 15, lado: -1 }, { x: 420, n: 9, lado: -1 }, { x: 1500, n: 9, lado: 1 }, { x: 1730, n: 15, lado: 1 }];

  function generarColonias() {
    const r = H.rng(6060);
    A.colonias = [];
    const setas = [];
    const ti = A.troncoIds[Math.min(6, A.troncoIds.length - 2)];
    for (const C of CORROS) {
      const col = { x: C.x, lado: C.lado, setas: [], injertos: [], hifas: [] };
      for (let k = 0; k < C.n; k++) {
        const z = (r() - 0.5) * 2;                                   // −1 detrás … +1 delante
        const tipo = r() < 0.7 ? "campana" : r() < 0.6 ? "cupula" : "conica";
        const grande = C.n > 10, gigante = grande && k < 2;              // uno o dos gigantes en los corros grandes
        const S = { x: C.x + (r() - 0.5) * (grande ? 170 : 100), y: A.suelo + 2 + z * 5, z,
                    alto: gigante ? 46 + r() * 12 : 13 + r() * (grande ? 29 : 22), ancho: 0, inclina: (r() - 0.5) * 0.35, tipo: gigante ? "campana" : tipo,
                    orden: gigante ? r() * 0.3 : r(), g: 0, destello: 0, col,
                    est: "oculta", papel: "uso", bam: 0 };      // nacen escondidas: brotan con su animación
        S.ancho = (S.tipo === "cupula" ? 10 : 7) + S.alto * (S.tipo === "cupula" ? 0.32 : 0.26) + r() * 2.5;
        col.setas.push(S); setas.push(S);
      }
      col.setas.sort((a, b) => a.z - b.z);
      // cordones de micelio: de los contrafuertes laterales de su lado hasta el corro
      const salidas = (A.raicesBase || []).filter(b => Math.abs(b.s) > 0.8 && Math.sign(b.s) === C.lado);
      salidas.forEach((b, k) => {
        const S0 = { x: N[b.id].sx, y: N[b.id].sy }, E = { x: C.x + (r() - 0.5) * 20, y: A.suelo + 6 };
        const prof = 18 + k * 14 + r() * 10;
        const cv = { x0: S0.x, y0: S0.y, x1: H.mix(S0.x, E.x, 0.3), y1: A.suelo + prof, x2: H.mix(S0.x, E.x, 0.7), y2: A.suelo + prof * 0.9, x3: E.x, y3: E.y };
        const n = Math.max(8, Math.round(Math.abs(E.x - S0.x) / 6)), f1 = r() * 6.3;
        const cuerda = [];
        const f2 = r() * 6.3, f3 = r() * 6.3;
        for (let i = 0; i <= n; i++) {
          const t = i / n, p = bez(cv, t), env = Math.sin(Math.PI * t);
          const ond = Math.sin(t * 13 + f1) * 2.6 + Math.sin(t * 31 + f2) * 1.3 + Math.sin(t * 71 + f3) * 0.6;
          cuerda.push({ x: p.x + Math.sin(t * 17 + f3) * 1.5 * env, y: Math.max(A.suelo + 5, p.y + ond * env) });
        }
        col.hifas.push({ pts: cuerda, cordon: true });
        const cam = [{ x: N[ti].sx, y: N[ti].sy }];
        for (let i = 1; i < b.ids.length; i++) cam.push({ x: N[b.ids[i]].sx, y: N[b.ids[i]].sy });
        for (const p of cuerda) cam.push(p);
        col.injertos.push(cam);
      });
      // micelio fino alrededor del corro: hifas que se ramifican por la tierra
      const crece = (x, y, a, largo, prof) => {
        const pts = [{ x, y }], n = Math.max(3, Math.round(largo / 5));
        for (let i = 0; i < n; i++) {
          a += (r() - 0.5) * 0.9;
          x += Math.cos(a) * 5; y = H.clamp(y + Math.sin(a) * 5, A.suelo + 4, 1068);
          pts.push({ x, y });
          if (prof < 3 && r() < 0.16) crece(x, y, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.8), largo * 0.5, prof + 1);
        }
        col.hifas.push({ pts, cordon: false });
      };
      for (let k = 0; k < 16; k++) crece(C.x + (r() - 0.5) * 60, A.suelo + 5, Math.PI / 2 + (r() - 0.5) * 2.6, 40 + r() * 70, 0);
      A.colonias.push(col);
    }
    // a cada seta, su papel según su orden (se reparte en cada paso con la RAM)
    setas.sort((a, b) => a.orden - b.orden);
    A.setas = setas;
  }

  // sprite de una seta (pie, anillo, sombrerillo con láminas), en su color
  function spriteSeta(S, col, esc) {
    const W = S.ancho * 2.4 + 8, Hh = S.alto + S.ancho * 1.1 + 8;
    const c = document.createElement("canvas");
    c.width = Math.ceil(W * esc); c.height = Math.ceil(Hh * esc);
    const g = c.getContext("2d"); g.scale(esc, esc);
    const bx = W / 2, by = Hh - 3, tx = bx + Math.sin(S.inclina) * S.alto, ty = by - S.alto;
    const claro = H.mix3(col, [255, 255, 255], 0.55), oscuro = col.map(v => v * 0.35);
    // pie: fino, algo curvo, translúcido, más grueso en la base
    const pw = Math.max(1.1, S.ancho * 0.16);
    const gp = g.createLinearGradient(bx - pw, 0, bx + pw, 0);
    gp.addColorStop(0, H.rgba(oscuro, 0.9)); gp.addColorStop(0.55, H.rgba(H.mix3(col, [230, 255, 245], 0.5), 0.95)); gp.addColorStop(1, H.rgba(oscuro, 0.9));
    g.fillStyle = gp;
    g.beginPath();
    g.moveTo(bx - pw * 1.5, by);
    g.quadraticCurveTo(bx - pw + (tx - bx) * 0.4, by - S.alto * 0.5, tx - pw * 0.7, ty + 2);
    g.lineTo(tx + pw * 0.7, ty + 2);
    g.quadraticCurveTo(bx + pw + (tx - bx) * 0.4, by - S.alto * 0.5, bx + pw * 1.5, by);
    g.closePath(); g.fill();
    // sombrerillo
    const R = S.ancho, h = S.tipo === "campana" ? R * 0.95 : S.tipo === "conica" ? R * 1.25 : R * 0.6;
    const gc = g.createRadialGradient(tx + R * 0.25, ty - h * 0.75, R * 0.1, tx, ty - h * 0.3, R * 1.2);
    gc.addColorStop(0, H.rgba(claro, 1)); gc.addColorStop(0.45, H.rgba(col, 0.95)); gc.addColorStop(1, H.rgba(col.map(v => v * 0.55), 0.9));
    g.fillStyle = gc;
    g.beginPath();
    g.moveTo(tx - R, ty);
    if (S.tipo === "conica") { g.quadraticCurveTo(tx - R * 0.55, ty - h * 0.55, tx, ty - h); g.quadraticCurveTo(tx + R * 0.55, ty - h * 0.55, tx + R, ty); }
    else g.bezierCurveTo(tx - R * 1.02, ty - h * 1.25, tx + R * 1.02, ty - h * 1.25, tx + R, ty);
    g.quadraticCurveTo(tx, ty + R * 0.22, tx - R, ty);
    g.fill();
    // borde translúcido estriado (las láminas se adivinan a través)
    g.strokeStyle = H.rgba(claro, 0.5); g.lineWidth = 0.35;
    for (let k = -6; k <= 6; k++) {
      const u = k / 7;
      g.beginPath(); g.moveTo(tx + u * R * 0.98, ty + R * 0.1 * (1 - u * u)); g.lineTo(tx + u * R * 0.55, ty - h * 0.55); g.stroke();
    }
    // láminas por debajo (la cámara está algo alta: se ve el filo)
    g.fillStyle = H.rgba(H.mix3(col, [255, 255, 255], 0.3), 0.55);
    g.beginPath(); g.ellipse(tx, ty + R * 0.05, R * 0.95, R * 0.16, 0, 0, Math.PI); g.fill();
    g.strokeStyle = H.rgba(oscuro, 0.6); g.lineWidth = 0.3;
    for (let k = -8; k <= 8; k++) { const u = k / 9; g.beginPath(); g.moveTo(tx, ty + R * 0.05); g.lineTo(tx + u * R * 0.95, ty + R * 0.05 + R * 0.15 * Math.sqrt(1 - u * u)); g.stroke(); }
    // brillo en la cima y motitas
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.beginPath(); g.ellipse(tx - R * 0.3, ty - h * 0.75, R * 0.22, h * 0.12, -0.4, 0, 6.2832); g.fill();
    if (S.tipo === "cupula") { g.fillStyle = H.rgba(claro, 0.7); for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(tx + Math.cos(k * 1.9) * R * 0.5, ty - h * 0.5 + Math.sin(k * 2.7) * h * 0.25, 0.5 + (k % 3) * 0.25, 0, 6.2832); g.fill(); } }
    return { c, W, Hh, bx, by, tx, ty: ty - h * 0.45 };
  }

  // datos de cada segundo: RAM (en uso y caché) y bytes leídos/escritos del disco
  A.memoria = function (ram, disco) {
    if (ram && isFinite(ram.pct)) { A.ramPct = ram.pct; A.cachePct = isFinite(ram.cache) ? ram.cache : 0; }
    if (!disco) return;
    A.restoLee = (A.restoLee || 0) + Math.max(0, disco.lectura || 0);
    A.restoEsc = (A.restoEsc || 0) + Math.max(0, disco.escritura || 0);
    const nl = Math.floor(A.restoLee / POR_LUZ_RAM), ne = Math.floor(A.restoEsc / POR_LUZ_RAM);
    A.restoLee -= nl * POR_LUZ_RAM; A.restoEsc -= ne * POR_LUZ_RAM;
    A.deudaLee = Math.min(240, (A.deudaLee || 0) + nl);
    A.deudaEsc = Math.min(240, (A.deudaEsc || 0) + ne);
  };
  function caminoSeta(S) {        // de la base del corro, por el pie, hasta el sombrerillo
    return [{ x: S.col.x, y: A.suelo + 6 }, { x: S.x, y: S.y + 2 }, { x: S.x + Math.sin(S.inclina) * S.alto * 0.5, y: S.y - S.alto * 0.5 }, { x: S.x + Math.sin(S.inclina) * S.alto, y: S.y - S.alto - S.ancho * 0.35 }];
  }
  function lanzarFlujo(tipo) {
    const vivas = (A.setas || []).filter(S => S.g > 0.5);
    const S = vivas.length ? vivas[(Math.random() * vivas.length) | 0] : null;
    const col = S ? S.col : A.colonias[(Math.random() * A.colonias.length) | 0];
    if (!col || !col.injertos.length) return;
    let cam = col.injertos[(Math.random() * col.injertos.length) | 0].concat(S ? caminoSeta(S) : []);
    if (tipo === "esc") cam = cam.slice().reverse();
    const L = [0]; for (let i = 1; i < cam.length; i++) L.push(L[i - 1] + Math.hypot(cam[i].x - cam[i - 1].x, cam[i].y - cam[i - 1].y));
    cam.L = L;
    A.flujos.push({ cam, tipo, t: 0, dur: L[L.length - 1] / 430, seta: S, lado: col.lado });
  }
  function pasoMemoria(dt) {
    A.flujos = A.flujos || []; A.esporas = A.esporas || []; A.chispasRAM = A.chispasRAM || [];
    if (!A.setas) return;
    // papel de cada seta: las primeras, RAM en uso; las siguientes, caché; el resto duerme
    const n = A.setas.length, nUso = Math.round(n * H.clamp((A.ramPct || 0) / 100, 0, 1)), nCache = Math.round(n * H.clamp((A.cachePct || 0) / 100, 0, 1));
    // cada seta: quieta → se esconde (tiembla y se hunde) → brota otra en su
    // lugar, con otro color y otra forma (rebote amortiguado). Cada una con su
    // pequeño retraso, para que no cambien todas a la vez.
    const DB = 0.85, DS = 1.35;
    A.setas.forEach((S, i) => {
      const objetivo = i < nUso ? "uso" : i < nUso + nCache ? "cache" : "duerme";
      if (S.retraso === undefined) { S.retraso = ((S.orden * 7.31) % 1) * 1.4; S.alto0 = S.alto; }
      if (!A.setasListas) { S.papel = objetivo === "duerme" ? "uso" : objetivo; S.est = objetivo === "duerme" ? "oculta" : "quieta"; S.g = S.est === "quieta" ? 1 : 0; S.bam = 0; }
      S.destello = Math.max(0, S.destello - dt * 1.5);
      if (S.est === "quieta" && objetivo !== S.papel) { S.est = "baja"; S.t = -S.retraso; }
      else if (S.est === "oculta" && objetivo !== "duerme") { variante(S); S.papel = objetivo; S.est = "sube"; S.t = -S.retraso; }
      if (S.est === "baja") {
        S.t += dt;
        const u = H.clamp(S.t / DB, 0, 1);
        S.bam = S.t > 0 ? Math.sin(S.t * 30) * 0.13 * Math.min(1, u * 5) * (1 - u) : 0;     // tiembla antes de hundirse
        S.g = S.t > 0 ? Math.max(0, 1 - u * u * (2.7 * u - 1.7)) : 1;                       // se agacha un poco y se hunde
        if (u >= 1) {
          if (objetivo === "duerme") { S.est = "oculta"; S.g = 0; S.bam = 0; }
          else { variante(S); S.papel = objetivo; S.est = "sube"; S.t = 0; S.g = 0; }
        }
      } else if (S.est === "sube") {
        S.t += dt;
        const u = H.clamp(S.t / DS, 0, 1);
        S.g = S.t > 0 ? H.clamp(1 - Math.exp(-6 * u) * Math.cos(9 * u), 0, 1.3) : 0;      // brota con rebote
        S.bam = S.t > 0 ? Math.sin(S.t * 11) * 0.22 * Math.exp(-4 * u) : 0;               // y se bambolea hasta quedarse quieta
        if (u >= 1) { S.est = "quieta"; S.g = 1; S.bam = 0; }
      }
    });
    if (A.ramPct !== undefined) A.setasListas = true;
    for (const [k, tipo] of [["deudaLee", "lee"], ["deudaEsc", "esc"]]) {
      const ritmo = Math.min(60, Math.max((A[k] || 0) / 2, A[k] > 0 ? 2 : 0));
      const gk = k + "G"; A[gk] = (A[gk] || 0) + ritmo * dt;
      while (A[gk] >= 1 && A[k] >= 1 && A.flujos.length < A.MAX_FLUJOS) { A[gk]--; A[k]--; lanzarFlujo(tipo); }
      if (A[k] < 1) A[gk] = Math.min(A[gk], 1);
    }
    for (const fl of A.flujos) {
      fl.t += dt;
      if (!fl.llego && fl.t >= fl.dur) {
        fl.llego = true;
        const p = fl.cam[fl.cam.length - 1];
        A.chispasRAM.push({ x: p.x, y: p.y, t: 0, tipo: fl.tipo });
        if (fl.tipo === "lee" && fl.seta) { fl.seta.destello = 1; for (let k = 0; k < 4; k++) soltarEspora(fl.seta); }
        // la escritura llega al tronco: lo que de ella ocupe espacio nuevo sigue
        // como savia dorada hacia las hojas (una rosa = 64 KB → hasta 6 doradas)
        if (fl.tipo === "esc") { A.acumConv = (A.acumConv || 0) + POR_LUZ_RAM; A.ultimaRosa = A.reloj || 0; }
      }
    }
    A.flujos = A.flujos.filter(fl => fl.t < fl.dur + 0.1);
    A.chispasRAM = A.chispasRAM.filter(c => (c.t += dt) < 1.2);
    // esporas: cada seta despierta suelta alguna; más cuanto más llena la RAM
    const f = H.clamp((A.ramPct || 0) / 100, 0, 1);
    for (const S of A.setas) {
      if (S.g < 0.6) continue;
      S.acEsp = (S.acEsp || 0) + dt * (0.05 + 0.5 * f * f) * S.g;
      while (S.acEsp >= 1) { S.acEsp--; soltarEspora(S); }
    }
    for (const e of A.esporas) {
      e.t += dt; e.f += dt * 1.7;
      e.x += (e.vx + Math.sin(e.f) * 6) * dt; e.y += e.vy * dt; e.vy *= Math.exp(-dt * 0.15);
    }
    A.esporas = A.esporas.filter(e => e.t < e.vida); if (A.esporas.length > 90) A.esporas.splice(0, A.esporas.length - 90);
  }
  // una seta nueva en el mismo sitio: otra forma, otra altura, otra inclinación
  function variante(S) {
    const tipos = ["campana", "campana", "cupula", "conica"];
    S.tipo = tipos[(Math.random() * tipos.length) | 0];
    S.alto = H.clamp(S.alto0 * (0.82 + Math.random() * 0.36), 10, 70);
    S.inclina = (Math.random() - 0.5) * 0.35;
    S.ancho = (S.tipo === "cupula" ? 10 : 7) + S.alto * (S.tipo === "cupula" ? 0.32 : 0.26) + Math.random() * 2.5;
    S.sprU = S.sprC = null;
  }
  function soltarEspora(S) {
    const c = S.papel === "cache" ? PAL_CACHE : PAL_USO[S.orden < 0.5 ? 0 : 1];
    A.esporas.push({ x: S.x + Math.sin(S.inclina) * S.alto + (Math.random() - 0.5) * S.ancho, y: S.y - S.alto + 2,
                     vx: (Math.random() - 0.5) * 6, vy: -(6 + Math.random() * 10), f: Math.random() * 6.3, t: 0, vida: 4 + Math.random() * 5, c });
  }
  function enCamino2(c, d) {
    let i = 1; while (i < c.length - 1 && c.L[i] < d) i++;
    const s = H.clamp((d - c.L[i - 1]) / ((c.L[i] - c.L[i - 1]) || 1), 0, 1);
    return { x: H.mix(c[i - 1].x, c[i].x, s), y: H.mix(c[i - 1].y, c[i].y, s) };
  }
  // micelio bajo tierra (capa fija): hifas finas y cordones algo más gruesos
  function pintarMicelio(ctx) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const col of A.colonias || []) for (const h of col.hifas) {
      const P = h.pts;
      ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      if (h.cordon) { cordonHifas(ctx, P); continue; }
      ctx.strokeStyle = "rgba(140,250,220,0.3)"; ctx.lineWidth = 0.5; ctx.stroke();
    }
    ctx.restore();
  }
  // un cordón de micelio como el de verdad: un haz de hifas finas que se trenzan,
  // se separan y se vuelven a juntar, con brillo irregular, ramitas que brotan
  // hacia la tierra y nódulos (no un cable liso)
  function cordonHifas(ctx, P) {
    const r = H.rng(Math.round(P[0].x * 7 + P[P.length - 1].x)), n = P.length;
    const nor = P.map((p, k) => {
      const a = P[Math.max(0, k - 1)], b = P[Math.min(n - 1, k + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
    });
    // halo muy tenue e irregular (el haz respira a lo largo)
    for (let k = 1; k < n; k++) {
      const v = 0.5 + 0.5 * Math.sin(k * 0.35 + 1.3) * Math.sin(k * 0.13);
      ctx.strokeStyle = `rgba(110,235,210,${0.03 + 0.06 * v})`; ctx.lineWidth = 4 + 3 * v;
      ctx.beginPath(); ctx.moveTo(P[k - 1].x, P[k - 1].y); ctx.lineTo(P[k].x, P[k].y); ctx.stroke();
    }
    // hifas trenzadas: cada una oscila alrededor del eje con su fase y su ritmo
    const nH = 6;
    for (let hh = 0; hh < nH; hh++) {
      const fase = r() * 6.3, frec = 0.22 + r() * 0.25, amp = 1.2 + r() * 2.2, frec2 = 0.07 + r() * 0.06;
      const brillo = 0.25 + r() * 0.35, ancho = 0.35 + r() * 0.45;
      let prev = null;
      for (let k = 0; k < n; k++) {
        const abre = 0.55 + 0.45 * Math.sin(k * frec2 + fase * 0.7);          // el haz se abre y se cierra
        const o = Math.sin(k * frec + fase) * amp * abre;
        const q = { x: P[k].x + nor[k].x * o, y: P[k].y + nor[k].y * o };
        if (prev && r() > 0.04) {                                              // pequeñas interrupciones
          const v = brillo * (0.55 + 0.45 * Math.sin(k * 0.5 + fase * 2));
          ctx.strokeStyle = `rgba(160,255,232,${v})`; ctx.lineWidth = ancho;
          ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
        prev = q;
      }
    }
    // ramitas de hifas que brotan del cordón y se bifurcan
    const rama = (x, y, a, l, prof) => {
      const x2 = x + Math.cos(a) * l, y2 = Math.max(A.suelo + 5, y + Math.sin(a) * l);
      ctx.strokeStyle = `rgba(140,250,222,${0.22 - prof * 0.06})`; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + x2) / 2 + (r() - 0.5) * 4, (y + y2) / 2 + (r() - 0.5) * 4, x2, y2); ctx.stroke();
      if (prof < 2) { rama(x2, y2, a - 0.4 - r() * 0.4, l * 0.6, prof + 1); if (r() < 0.6) rama(x2, y2, a + 0.4 + r() * 0.4, l * 0.55, prof + 1); }
    };
    for (let k = 3; k < n - 3; k += 3 + ((r() * 4) | 0)) {
      const lado = r() < 0.6 ? 1 : -1, a = Math.atan2(nor[k].y * lado, nor[k].x * lado) + (r() - 0.5) * 0.8;
      rama(P[k].x, P[k].y, a, 6 + r() * 10, 0);
    }
    // nódulos que brillan aquí y allá
    for (let k = 2; k < n - 2; k += 4 + ((r() * 6) | 0)) {
      const o = (r() - 0.5) * 3;
      H.luz(ctx, P[k].x + nor[k].x * o, P[k].y + nor[k].y * o, [140, 255, 225], 4, 0.35 + r() * 0.3);
    }
  }

  // las setas (capa viva): brotan, laten y se encienden al llegarles datos
  function dibujarHongos(ctx, m, t) {
    const esc = H.escalaCache || 1;
    for (const col of A.colonias || []) {
      // resplandor del corro sobre la hierba, según cuántas setas brillan
      let suma = 0; for (const S of col.setas) suma += S.g;
      if (suma > 0.05) {
        ctx.setTransform(m); ctx.globalCompositeOperation = "lighter";
        ctx.save(); ctx.translate(col.x, A.suelo); ctx.scale(1, 0.28);
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
        gr.addColorStop(0, `rgba(110,240,210,${Math.min(0.3, 0.03 * suma)})`); gr.addColorStop(1, "rgba(110,240,210,0)");
        ctx.fillStyle = gr; ctx.fillRect(-150, -150, 300, 300); ctx.restore();
        ctx.globalCompositeOperation = "source-over";
      }
      for (const S of col.setas) {
        if (S.g < 0.03) continue;
        const pal = S.papel === "cache" ? PAL_CACHE : PAL_USO[S.orden < 0.5 ? 0 : 1];
        const k = S.papel === "cache" ? "sprC" : "sprU";
        if (!S[k] || S[k + "e"] !== esc) { S[k] = spriteSeta(S, pal, esc); S[k + "e"] = esc; }
        const sp = S[k], g = S.g, mece = Math.sin(t * 0.9 + S.orden * 20) * 0.02;
        ctx.setTransform(m); ctx.translate(S.x, S.y); ctx.rotate(mece + (S.bam || 0)); ctx.scale(0.25 + 0.75 * Math.min(1, g), g);
        ctx.globalAlpha = Math.min(1, g * 1.4);
        ctx.drawImage(sp.c, -sp.bx, -sp.by, sp.W, sp.Hh);
        ctx.globalAlpha = 1;
        // luz propia del sombrerillo: late despacio y destella al llegar datos
        const late = 0.75 + 0.25 * Math.sin(t * (0.8 + S.orden) + S.orden * 30);
        ctx.setTransform(m); ctx.globalCompositeOperation = "lighter";
        const cx = S.x + Math.sin(S.inclina) * S.alto * g, cy = S.y - (S.alto + S.ancho * 0.4) * g;
        const noche = 1;                                                        // brillan también de día
        H.luz(ctx, cx, cy, pal, Math.round(S.ancho * 4), (0.4 * late * noche + 0.6 * S.destello) * g * (S.papel === "cache" ? 0.75 : 1));
        if (S.destello > 0.02) H.luz(ctx, cx, cy, [255, 255, 255], Math.round(S.ancho * 1.4), 0.8 * S.destello);
        ctx.globalCompositeOperation = "source-over";
      }
    }
    ctx.setTransform(m);
  }
  function dibujarFlujos(ctx, m, t) {
    ctx.setTransform(m);
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const fl of A.flujos || []) {
      const c = fl.cam, Lt = c.L[c.L.length - 1], d = H.clamp(fl.t / fl.dur, 0, 1) * Lt;
      // estela en 3 tramos que se desvanecen (una línea cada uno: barato)
      const col = fl.tipo === "lee" ? COL_LEE : COL_ESC, cola = 80, pasos = 3;
      ctx.lineWidth = 1.6;
      for (let k = 0; k < pasos; k++) {
        const a = Math.max(0, d - cola * (k + 1) / pasos), b = Math.max(0, d - cola * k / pasos);
        if (b <= a) continue;
        const p = enCamino2(c, a), m = enCamino2(c, (a + b) / 2), q = enCamino2(c, b);
        ctx.strokeStyle = H.rgba(col, 0.7 * (1 - k / pasos));
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(m.x, m.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      const h = enCamino2(c, d);
      H.luz(ctx, h.x, h.y, col, 13, 0.95);
    }
    for (const s of A.chispasRAM || []) {
      const f = s.t / 1.2, col = s.tipo === "lee" ? COL_LEE : s.tipo === "oro" ? [255, 214, 130] : COL_ESC;
      H.luz(ctx, s.x, s.y, col, s.tipo === "lee" ? 18 : 26, 0.85 * (1 - f));
      ctx.strokeStyle = H.rgba(col, 0.5 * (1 - f)); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(s.x, s.y, 4 + f * 16, 0, 6.2832); ctx.stroke();
    }
    // el punto de convergencia: brilla según lo acumulado y destella al soltar
    if (A.camTroncoMedio) {
      const p = A.camTroncoMedio[0][0], carga = H.clamp((A.acumConv || 0) / (A.POR_LUZ_ORO * 6), 0, 1);
      A.pulsoConv = Math.max(0, (A.pulsoConv || 0) - 0.06);
      H.luz(ctx, p.x, p.y, [255, 214, 130], 22, 0.12 + 0.4 * carga + 0.45 * A.pulsoConv);
      H.luz(ctx, p.x, p.y, [255, 248, 220], 7, 0.25 + 0.5 * carga + 0.5 * A.pulsoConv);
    }
    // esporas luminosas que suben y se apagan
    for (const e of A.esporas || []) {
      const v = Math.min(1, e.t / 0.6, (e.vida - e.t) / 1.5);
      H.luz(ctx, e.x, e.y, e.c, 5, 0.8 * v);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(m);
  }

  A.fijarDisco = function (porcentaje, disco) {
    A.pct = porcentaje;
    if (disco && disco.total) { A.usado = disco.usado; A.total = disco.total; }
    // frutos (>70 %) y grabado del tronco: se rehacen al cambiar su cifra
    if (A.raiz && (claveFrutos() !== A.kFrutos || textoGrabado().join() !== A.kTexto)) A.sucio = true;
    const n = H.clamp(Math.round(porcentaje / 2), 1, 50);
    if (n === A.n && A.raiz) return;
    const antes = A.n;
    // si el disco se libera, las copas de las claves borradas se deshojan
    if (A.raiz && n < antes) for (const h of A.hojas) h.brotes.forEach((b, j) => {
      if (!b.lleno || A.secuencia.indexOf(h.k[j]) < n) return;
      for (let i = 0; i < 46; i++) A.caidas.push({
        x: b.centro.x + (Math.random() - 0.5) * 56, y: b.centro.y + (Math.random() - 0.5) * 34,
        vx: (Math.random() - 0.5) * 14, vy: 8 + Math.random() * 14, a: Math.random() * 6.3, va: (Math.random() - 0.5) * 5,
        t: 0, f: Math.random() * 6.3, b: 0.2 + Math.random() * 0.6 });
    });
    A.n = n;
    A.raiz = construir(n);
    contar(A.raiz);
    colocar();
    A.ultimaNueva = n > antes && antes > 0 ? A.secuencia[n - 1] : null;
    A.tCambio = 0;
    A.sucio = true;
    A.lienzo = null;
  };

  // camino de búsqueda real: tronco → ramas elegidas por las separadoras → brote de la clave
  function tomarFicha() {
    const F = A.fichasOro || [], ahora = A.reloj || 0;
    A.fichasOro = F.filter(f => f.n > 0 && ahora - f.t < 3);
    const f = A.fichasOro[0];
    if (!f) return null;
    f.n--;
    return f;
  }
  function buscar(clave, ladoTronco) {
    const RC = A.raicesCentro || [];
    const raiz = RC.length ? RC[(Math.random() * RC.length) | 0] : null;
    const desdeTronco = ladoTronco != null && A.camTroncoMedio;
    const tramos = [{ cam: desdeTronco ? A.camTroncoMedio[ladoTronco > 0 ? 1 : 0] : raiz ? raiz.cam : A.camTronco, nodo: null }];
    if (desdeTronco) { const p = tramos[0].cam[0]; (A.chispasRAM = A.chispasRAM || []).push({ x: p.x, y: p.y, t: 0, tipo: "oro" }); }
    let nd = A.raiz;
    while (!nd.hoja) {
      let i = 0; while (i < nd.k.length && clave >= nd.k[i]) i++;
      tramos.push({ cam: nd.cam[i], nodo: nd });
      nd = nd.hijos[i];
    }
    const j = nd.k.indexOf(clave);
    if (j >= 0) tramos.push({ cam: nd.brotes[j].cam, nodo: nd });
    // la savia avanza a velocidad constante: cada tramo dura lo que mide
    const T = []; let acc = 0;
    for (const tr of tramos) { tr.dur = Math.max(0.2, tr.cam.L[tr.cam.L.length - 1] / A.velSavia); acc += tr.dur; T.push(acc); }
    return { tramos, hoja: nd, j, clave, T, fin: acc };
  }
  // en qué tramo va una búsqueda y qué fracción lleva de él
  function progreso(b) {
    let k = 0; while (k < b.T.length && b.t >= b.T[k]) k++;
    if (k >= b.T.length) return { k, f: 1 };
    const ini = k ? b.T[k - 1] : 0;
    return { k, f: (b.t - ini) / b.tramos[k].dur };
  }
  function enCamino(c, f) {
    const d = f * c.L[c.L.length - 1];
    let i = 1; while (i < c.length - 1 && c.L[i] < d) i++;
    const s = (d - c.L[i - 1]) / ((c.L[i] - c.L[i - 1]) || 1);
    return { x: H.mix(c[i - 1].x, c[i].x, s), y: H.mix(c[i - 1].y, c[i].y, s) };
  }

  A.velSavia = 520;          // px/s
  A.POR_LUZ_ORO = 10240;     // bytes llenados por cada luz dorada (10 KB)
  A.MAX_SAVIA = 45;          // luces doradas a la vez, como mucho (las demás esperan su turno)
  A.MAX_FLUJOS = 20;         // luces de los hongos a la vez, como mucho
  // bytes de almacenamiento llenados en el último segundo (del anfitrión)
  A.llenar = function (bytes) {
    A.restoLlenado += Math.max(0, bytes || 0);
    const n = Math.floor(A.restoLlenado / A.POR_LUZ_ORO);
    A.restoLlenado -= n * A.POR_LUZ_ORO;
    // luces pendientes (tope: 300, unos 2,5 s de flujo máximo; lo que pase de
    // 1,2 MB/s ya va con el tronco a pleno caudal)
    A.deuda = Math.min(300, A.deuda + n);
  };
  A.paso = function (dt, disco) {
    A.tCambio += dt;
    // la savia sale SOLO cuando se llena almacenamiento: una luz por cada 10 KB,
    // repartida entre todas las copas: en btrfs los datos nuevos cuelgan de
    // muchas claves distintas (cada archivo, cada extensión), no de una sola
    // caudal continuo: las luces pendientes salen a ritmo constante (se vacían en
    // ~2,5 s), así la escritura a trompicones del sistema se ve como un flujo
    A.reloj = (A.reloj || 0) + dt;
    const ritmo = Math.min(120, Math.max(A.deuda / 2.5, A.deuda > 0 ? 2 : 0));   // luces/s
    A.goteo += ritmo * dt;
    while (A.goteo >= 1 && A.deuda >= 1 && A.busquedas.length < A.MAX_SAVIA) {   // tope de luces a la vez
      A.goteo--; A.deuda--; A.lanzadas = (A.lanzadas || 0) + 1;
      // si acaba de llegar una escritura (luz rosa) al tronco, la dorada nace de
      // ella; si no (escrituras muy pequeñas), sale de las raíces del centro
      // las doradas que vienen de las setas (escrituras que llegan como luz rosa
      // al punto de convergencia) nacen en ese punto: cada POR_LUZ_ORO acumulado
      // allí da una; el resto del espacio llenado sale de las raíces del centro
      const deSetas = (A.acumConv || 0) >= A.POR_LUZ_ORO;
      if (deSetas) { A.acumConv -= A.POR_LUZ_ORO; A.pulsoConv = 1; }
      A.busquedas.push(Object.assign(buscar(A.secuencia[(Math.random() * A.n) | 0], deSetas ? (Math.random() < 0.5 ? -1 : 1) : null), { t: 0, tipo: "e" }));
    }
    if (A.deuda < 1) A.goteo = Math.min(A.goteo, 1);
    if ((A.reloj || 0) - (A.ultimaRosa || -99) > 4) A.acumConv = 0;     // sin rosas recientes, el punto se vacía
    for (const b of A.busquedas) b.t += dt;
    for (const b of A.busquedas) if (!b.llego && b.t >= b.fin && b.j >= 0) {
      b.llego = true;
      const p = b.hoja.brotes[b.j].centro, n = 3;
      for (let i = 0; i < n && A.polen.length < 120; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 12 + Math.random() * 26;
        A.polen.push({ x: p.x + (Math.random() - 0.5) * 30, y: p.y + (Math.random() - 0.5) * 18, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                       t: 0, vida: 2.5 + Math.random() * 2.5, f: Math.random() * 6.3, e: b.tipo === "e" });
      }
    }
    A.busquedas = A.busquedas.filter(b => b.t < b.fin + 2.2);
    for (const q of A.polen) {
      q.t += dt; q.f += dt * 2.3;
      q.vx += Math.sin(q.f) * 9 * dt; q.vy += -3 * dt;
      q.vx *= Math.exp(-dt * 0.9); q.vy *= Math.exp(-dt * 0.9);
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    A.polen = A.polen.filter(q => q.t < q.vida);
    for (const c of A.caidas) {
      c.t += dt; c.f += dt * 2.6;
      c.x += (c.vx + Math.sin(c.f) * 22) * dt; c.y += c.vy * dt; c.a += c.va * dt * Math.cos(c.f);
      if (c.y > A.suelo - 2) { c.y = A.suelo - 2; c.vx = 0; c.vy = 0; c.va = 0; }
    }
    A.caidas = A.caidas.filter(c => c.t < 9);
    pasoMemoria(dt);
  };

  // ── dibujo de la madera ──────────────────────────────────────────────────
  // cadenas de dibujo: se sigue siempre el hijo más grueso; los demás empiezan
  // una cadena nueva desde la horquilla. Una cadena no cruza de grupo.
  function cadenasDeDibujo(inicio = 0) {
    const res = [], pila = [[inicio, -1]];
    while (pila.length) {
      const [ini, desde] = pila.pop();
      const ids = desde >= 0 ? [desde, ini] : [ini];
      let c = ini;
      while (N[c].h.length) {
        const hs = N[c].h.slice().sort((a, b) => N[b].r - N[a].r);
        for (let k = 1; k < hs.length; k++) pila.push([hs[k], c]);
        if (N[hs[0]].g !== N[c].g) { pila.push([hs[0], c]); break; }
        c = hs[0]; ids.push(c);
      }
      const z = ids.reduce((s, i) => s + N[i].z, 0) / ids.length;
      res.push({ ids, g: N[ini].g, r0: N[ini].r, seco: N[ini].seco, z, cf: !!N[ini].cf, hija: desde >= 0 });
    }
    // de atrás adelante (por capas de profundidad) y, dentro, de grueso a fino
    return res.sort((a, b) => (b.cf - a.cf) || (Math.round(a.z / 25) - Math.round(b.z / 25)) || (b.r0 - a.r0));
  }

  // pinta un conjunto de cadenas como una sola pieza: por grupos (contrafuertes
  // primero, luego por profundidad), en cada grupo todas las siluetas y después
  // todo el sombreado. Así no quedan huecos ni bordes en las uniones, y una
  // rama de atrás no pinta su sombreado encima de una de delante.
  function pintarPorCapas(ctx, lista, r) {
    const grupos = new Map();
    for (const ch of lista) {
      const k = ch.cf ? -1 : 0;        // contrafuertes detrás; el resto, una sola pieza
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(ch);
    }
    for (const k of [...grupos.keys()].sort((a, b) => a - b)) {
      const g = grupos.get(k);
      for (const ch of g) pintarCadena(ctx, ch, r, "silueta");
      for (const ch of g) pintarCadena(ctx, ch, r, "sombra");
    }
  }

  // niebla: lo lejano (z<0) se oscurece y enfría
  const niebla = (c, z) => { const f = H.clamp(-z / 120, 0, 0.5); return H.mix3(c, [16, 22, 40], f); };

  // dibujo en dos pasadas para que el árbol sea UNA sola pieza:
  //   «silueta»: cuerpo de madera con uniones redondeadas en cada nudo (sin huecos);
  //   «sombra»: volumen y corteza encima. El lado iluminado se decide punto a punto
  //   (mismo criterio en la rama madre y en la hija) y en las ramas hijas el
  //   sombreado nace en cero en la unión, así se funden con su madre.
  // Sin modo: las dos pasadas seguidas.
  function pintarCadena(ctx, ch, r, modo) {
    const ids = ch.ids, P = ids.map(i => N[i]), n = P.length;
    if (n < 2) return;
    const rad = P.map((p, k) => k === 0 && ch.hija ? P[1].r : p.r);
    const maxR = Math.max(...rad);
    const corteza = niebla(ch.seco ? [70, 62, 52] : [54, 40, 27], ch.z);
    if (maxR < 0.95) {        // ramilla fina: un trazo (va en la silueta)
      if (modo === "sombra") return;
      ctx.strokeStyle = H.rgba(niebla(ch.seco ? [80, 72, 62] : [58, 44, 30], ch.z), ch.seco ? 0.85 : 0.97);   // del tono del tronco
      ctx.lineWidth = Math.max(0.55, maxR * 2); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); P.forEach((p, k) => k ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)); ctx.stroke();
      return;
    }
    const nor = P.map((p, k) => {
      const a = P[Math.max(0, k - 1)], b = P[Math.min(n - 1, k + 1)];
      const tx = b.sx - a.sx, ty = b.sy - a.sy, l = Math.hypot(tx, ty) || 1;
      return { x: -ty / l, y: tx / l };
    });
    // lado iluminado por punto (suavizado), no uno por rama
    const crudo = nor.map(q => q.x * LUZ.x + q.y * LUZ.y);
    const ladoK = crudo.map((_, k) => { let s2 = 0; for (let j = -2; j <= 2; j++) s2 += crudo[H.clamp(k + j, 0, n - 1)]; return s2 >= 0 ? 1 : -1; });
    const lado = ladoK.reduce((a, b) => a + b, 0) >= 0 ? 1 : -1;
    // sombreado: nace en cero en la unión con su madre y, si la rama sigue en otra
    // capa (la parte que se mece), se apaga en cero al final: las mitades encajan
    const sigue = N[ids[n - 1]].h.length > 0;
    const radS = rad.map((v, k) => v * (ch.hija ? H.suave(H.clamp(k / 2.5, 0, 1)) : 1) * (sigue ? H.suave(H.clamp((n - 1 - k) / 2.5, 0, 1)) : 1));
    const en = (k, f) => ({ x: P[k].sx + nor[k].x * radS[k] * f * ladoK[k], y: P[k].sy + nor[k].y * radS[k] * f * ladoK[k] });
    const banda = (f0, f1) => {
      ctx.beginPath();
      for (let k = 0; k < n; k++) { const q = en(k, f0); k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
      for (let k = n - 1; k >= 0; k--) { const q = en(k, f1); ctx.lineTo(q.x, q.y); }
      ctx.closePath(); ctx.fill();
    };
    if (modo !== "sombra") {
      // silueta: polígono del cuerpo + un disco en cada nudo (uniones redondas)
      ctx.fillStyle = H.rgba(corteza, 1);
      ctx.beginPath();
      for (let k = 0; k < n; k++) { const x = P[k].sx + nor[k].x * rad[k], y = P[k].sy + nor[k].y * rad[k]; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      for (let k = n - 1; k >= 0; k--) ctx.lineTo(P[k].sx - nor[k].x * rad[k], P[k].sy - nor[k].y * rad[k]);
      ctx.closePath(); ctx.fill();
      for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(P[k].sx, P[k].sy, rad[k], 0, 6.2832); ctx.fill(); }
      if (modo === "silueta") return;
    }
    // volumen cilíndrico: sombra propia, media luz, luz cálida y filo frío de luna
    ctx.fillStyle = "rgba(0,0,0,0.42)"; banda(-0.15, -1.0);
    ctx.fillStyle = "rgba(0,0,0,0.25)"; banda(-0.72, -1.0);
    ctx.fillStyle = "rgba(255,214,150,0.075)"; banda(0.2, 0.85);
    ctx.fillStyle = "rgba(205,215,235,0.065)"; banda(0.6, 0.96);
    // luz reflejada del suelo en el borde de sombra (da cuerpo, como en un dibujo)
    ctx.fillStyle = "rgba(120,100,70,0.08)"; banda(-0.88, -0.98);
    if (maxR < 1.8) return;
    // corteza: surcos oscuros y crestas claras que siguen la rama, ondulados y rotos
    const nS = Math.max(3, Math.round(maxR * 1.7));
    for (let s = 0; s < nS; s++) {
      const o = -0.88 + 1.76 * (s + r() * 0.6) / nS, fase = r() * 6.3, surco = s % 2 === 0;
      const ilum = o * lado > 0;
      ctx.strokeStyle = surco ? `rgba(0,0,0,${0.3 + r() * 0.2})` : `rgba(235,195,130,${ilum ? 0.09 + r() * 0.1 : 0.03})`;
      ctx.lineWidth = surco ? 0.55 + r() * 0.4 : 0.4;
      ctx.beginPath();
      let dentro = false;
      for (let k = 0; k < n; k++) {
        // junto a las uniones no hay surcos (se cruzarían con los de la madre)
        if (r() < 0.08 || radS[k] < rad[k] * 0.7) { dentro = false; continue; }
        // los surcos se curvan con el volumen (más juntos en los bordes)
        const oo = Math.sin(H.clamp(o + Math.sin(k * 0.55 + fase) * 0.07, -0.95, 0.95) * Math.PI / 2);
        const x = P[k].sx + nor[k].x * radS[k] * oo, y = P[k].sy + nor[k].y * radS[k] * oo;
        if (!dentro) { ctx.moveTo(x, y); dentro = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(225,215,190,0.28)"; ctx.lineWidth = 0.6;
    ctx.beginPath();
    { let dentro = false;
      for (let k = 0; k < n; k++) { if (radS[k] < rad[k] * 0.7) { dentro = false; continue; } const q = en(k, 0.97); if (!dentro) { ctx.moveTo(q.x, q.y); dentro = true; } else ctx.lineTo(q.x, q.y); } }
    ctx.stroke();
    if (maxR < 2.6 || ch.g >= 0) return;
    // musgo y líquenes en el lomo iluminado de las ramas gruesas
    for (let k = 1; k < n - 1; k++) {
      if (r() > 0.55) continue;
      for (let m = 0; m < 3; m++) {
        const q = en(k, 0.55 + r() * 0.42);
        ctx.fillStyle = r() < 0.8 ? `rgba(${96 + r() * 30 | 0},${132 + r() * 30 | 0},${70 + r() * 20 | 0},${0.25 + r() * 0.35})` : "rgba(190,200,170,0.35)";
        ctx.fillRect(q.x + (r() - 0.5) * 2, q.y + (r() - 0.5) * 2, 0.8 + r() * 1.1, 0.8 + r() * 1.1);
      }
    }
  }

  function pintarHoja(ctx, m, f, alfa) {
    const b = f.b;
    // sombra profunda → verde medio → luz de luna, con variación propia y niebla
    const osc = f.pal ? [22, 30, 18] : [12, 24, 19], med = f.pal ? [74, 96, 50] : [42, 72, 45], luz = f.pal ? [156, 176, 104] : [128, 156, 108];
    let c = b < 0.5 ? H.mix3(osc, med, b / 0.5) : H.mix3(med, luz, (b - 0.5) / 0.5);
    if (f.v < 0.1) c = H.mix3(c, [130, 118, 56], 0.35);          // alguna amarillea
    else if (f.v > 0.9) c = H.mix3(c, [72, 98, 96], 0.4);          // alguna azulada
    if (f.z !== undefined) c = niebla(c, f.z);
    const ca = Math.cos(f.a), sa = Math.sin(f.a), x = f.x + ca * 1.2, y = f.y + sa * 1.2;
    ctx.setTransform(m.a * ca + m.c * sa, m.b * ca + m.d * sa, -m.a * sa + m.c * ca, -m.b * sa + m.d * ca,
                     m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
    ctx.globalAlpha = alfa;
    ctx.fillStyle = H.rgba(c, 1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(f.len * 0.42, -f.wid, f.len, 0);
    ctx.quadraticCurveTo(f.len * 0.42, f.wid, 0, 0);
    ctx.fill();
    // media hoja en sombra (la hoja se pliega por el nervio: volumen)
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(f.len * 0.42, f.wid, f.len, 0); ctx.closePath(); ctx.fill();
    if (b > 0.5) {
      ctx.strokeStyle = H.rgba(H.mix3(c, [230, 230, 190], 0.35), 0.6); ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(0.5, 0); ctx.lineTo(f.len * 0.9, 0); ctx.stroke();
      ctx.strokeStyle = H.rgba(H.mix3(c, [220, 230, 210], 0.5), 0.5);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(f.len * 0.42, -f.wid, f.len, 0); ctx.stroke();
    }
  }

  // ── frutos: el árbol fructifica cuando el disco pasa del 70 % ─────────────
  // cuantos más y más maduros (verde → amarillo → naranja → rojo) más se acerca
  // el disco al 100 %: el aviso de que hay que cosechar (liberar espacio)
  const claveFrutos = () => (A.pct || 0) > 70 ? Math.round(A.pct) : 0;
  function frutosDe(h) {
    const res = [], pct = A.pct || 0;
    if (pct <= 70) return res;
    const f = H.clamp((pct - 70) / 30, 0, 1);
    const r = H.rng(h.k[0] * 211 + 7);
    h.brotes.forEach(b => {
      if (!b.lleno) return;
      // cuelgan de ramillas finas de la mitad baja de su copa
      const cand = [];
      for (let i = 0; i < N.length; i++) {
        const n = N[i];
        if (n.g === h.id && !n.seco && n.r < 0.5 && n.y > b.nube.y - 4 && Math.abs(n.x - b.nube.x) < b.nube.rx * 0.9) cand.push(i);
      }
      const esperados = 1 + 5 * f;                      // frutos por copa (1 nada más pasar del 70 %, 4 al 100 %)
      const k = Math.floor(esperados) + (r() < esperados % 1 ? 1 : 0);
      for (let q = 0; q < k && cand.length; q++) {
        const nd = N[cand.splice((r() * cand.length) | 0, 1)[0]];
        const mad = H.clamp(f * 1.15 + (r() - 0.5) * 0.35, 0, 1);
        res.push({ fruto: true, x: nd.sx, y: nd.sy, z: nd.z + 80, mad, rad: 3 + 3.4 * f + r() * 0.5, tallo: 2 + r() * 2.5, inc: (r() - 0.5) * 0.6 });
      }
    });
    return res;
  }
  function pintarFruto(ctx, m, fr) {
    ctx.setTransform(m); ctx.globalAlpha = 1;
    const verde = [176, 200, 64], amar = [236, 200, 60], nar = [226, 118, 42], rojo = [176, 36, 32];
    let c = fr.mad < 0.33 ? H.mix3(verde, amar, fr.mad / 0.33) : fr.mad < 0.66 ? H.mix3(amar, nar, (fr.mad - 0.33) / 0.33) : H.mix3(nar, rojo, (fr.mad - 0.66) / 0.34);
    c = niebla(c, fr.z - 80);
    const x = fr.x + Math.sin(fr.inc) * fr.tallo, y = fr.y + Math.cos(fr.inc) * fr.tallo + fr.rad;
    ctx.strokeStyle = "rgba(58,46,30,0.95)"; ctx.lineWidth = 0.55;          // pedúnculo
    ctx.beginPath(); ctx.moveTo(fr.x, fr.y);
    ctx.quadraticCurveTo(fr.x + Math.sin(fr.inc) * fr.tallo * 0.2, fr.y + fr.tallo * 0.6, x, y - fr.rad * 0.85); ctx.stroke();
    // resplandor propio, suave: de noche los frutos se ven entre el follaje
    ctx.globalCompositeOperation = "lighter";
    const gh = ctx.createRadialGradient(x, y, 0, x, y, fr.rad * 3.4);
    gh.addColorStop(0, H.rgba(c, 0.32)); gh.addColorStop(1, H.rgba(c, 0));
    ctx.fillStyle = gh; ctx.beginPath(); ctx.arc(x, y, fr.rad * 3.4, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    // cuerpo esférico iluminado por la luna, con sombra propia
    const gx = x + LUZ.x * fr.rad * 0.45, gy = y + LUZ.y * fr.rad * 0.45;
    const gr = ctx.createRadialGradient(gx, gy, fr.rad * 0.08, x, y, fr.rad * 1.05);
    gr.addColorStop(0, H.rgba(H.mix3(c, [255, 240, 210], 0.45), 1));
    gr.addColorStop(0.45, H.rgba(c, 1));
    gr.addColorStop(1, H.rgba(c.map(v => v * 0.32), 1));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, fr.rad, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "rgba(255,252,240,0.8)";                                 // brillo especular
    ctx.beginPath(); ctx.arc(x + LUZ.x * fr.rad * 0.42, y + LUZ.y * fr.rad * 0.42, fr.rad * 0.17, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = H.rgba(c.map(v => v * 0.4), 0.8); ctx.lineWidth = 0.35;   // hoyuelo del pedúnculo
    ctx.beginPath(); ctx.arc(x, y - fr.rad * 0.72, fr.rad * 0.25, 0.3, 2.85); ctx.stroke();
  }

  // ── grabado a navaja en el tronco: los datos reales del disco ──────────────
  function textoGrabado() {
    const gb = v => Math.round(v / 1e9);
    return ["DISCO", Math.round(A.pct || 0) + "%", A.total ? gb(A.usado) + " GB" : "", A.total ? "de " + gb(A.total) : ""];
  }
  function pintarGrabado(ctx) {
    const lineas = textoGrabado();
    const objetivo = A.suelo - 44;
    let k = 0; for (let i = 0; i < A.troncoIds.length; i++) if (Math.abs(N[A.troncoIds[i]].sy - objetivo) < Math.abs(N[A.troncoIds[k]].sy - objetivo)) k = i;
    const nd = N[A.troncoIds[k]], cx = nd.sx + 1, cy = nd.sy, rT = nd.r;
    const bw = rT * 0.8, bh = 31, r = H.rng(5150);
    // la herida: corteza arrancada con borde irregular
    const borde = [];
    for (let i = 0; i < 34; i++) {
      const a = i / 34 * 6.2832, ru = 1 + (r() - 0.5) * 0.08 + Math.sin(a * 3 + 1) * 0.04;
      borde.push({ x: cx + Math.cos(a) * bw * ru, y: cy + Math.sin(a) * bh * ru });
    }
    A.herida = { cx, cy, bw: bw * 1.12, bh: bh * 1.12 };
    // contorno suave: curvas por los puntos medios (sin esquinas de polígono)
    const traza = (ps, e) => {
      const q = ps.map(p => ({ x: cx + (p.x - cx) * e, y: cy + (p.y - cy) * e })), n = q.length;
      const mid = i => ({ x: (q[i].x + q[(i + 1) % n].x) / 2, y: (q[i].y + q[(i + 1) % n].y) / 2 });
      ctx.beginPath(); const m0 = mid(n - 1); ctx.moveTo(m0.x, m0.y);
      for (let i = 0; i < n; i++) { const mm = mid(i); ctx.quadraticCurveTo(q[i].x, q[i].y, mm.x, mm.y); }
      ctx.closePath();
    };
    ctx.save();
    // sin parche: las letras se tallan directamente en la corteza, como en un
    // árbol de verdad; el corte deja ver la madera algo más clara dentro del surco
    ctx.save();
    // letras talladas a navaja: surco oscuro, pared iluminada abajo, letra a letra
    // un poco torcida, y comprimidas hacia los lados por la curvatura del tronco
    const tam = [7.5, 17, 7.5, 7.5], ys = [cy - 19, cy - 2, cy + 12, cy + 21];
    lineas.forEach((txt, li) => {
      if (!txt) return;
      const fuente = li === 1 ? `700 ${tam[li]}px Cormorant` : `700 ${tam[li]}px JBM`;
      ctx.font = fuente;
      let ancho = ctx.measureText(txt).width + (txt.length - 1) * (li === 1 ? 0.5 : 1);
      const esc = Math.min(1, (bw * 1.75) / ancho);
      let x = cx - ancho * esc / 2;
      for (const ch of txt) {
        const w = ctx.measureText(ch).width * esc, xc = x + w / 2;
        const sq = Math.sqrt(Math.max(0.35, 1 - ((xc - cx) / (rT * 1.02)) ** 2));
        const rot = (r() - 0.5) * 0.12, dy = (r() - 0.5) * 0.9;
        const pinta = (ox, oy, col) => {
          ctx.save(); ctx.translate(xc + ox, ys[li] + dy + oy); ctx.rotate(rot); ctx.scale(esc * sq, esc);
          ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ch, 0, 0);
          ctx.restore();
        };
        pinta(0, -0.55, "rgba(8,5,3,0.55)");             // sombra en la pared de arriba
        pinta(0, 0, "rgba(128,98,64,0.62)");             // madera del fondo del surco
        pinta(0.1, 0.6, "rgba(215,185,140,0.22)");       // labio de abajo, con luz
        x += w + (li === 1 ? 0.5 : 1) * esc;
      }
    });
    // arañazos de la navaja
    ctx.strokeStyle = "rgba(120,92,60,0.25)"; ctx.lineWidth = 0.4;
    for (let i = 0; i < 4; i++) { const x = cx + (r() - 0.5) * bw * 1.4, y = cy + (r() - 0.5) * bh * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 6, y + (r() - 0.5) * 3); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }

  // la rama de cada nodo hoja (madera fina + hojas, ordenadas en profundidad) en
  // dos capas que se mecen alrededor de su horquilla: detrás y delante de su madera
  function capasRama(h, esc, cadenas) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const n of N) if (n.g === h.id) { x0 = Math.min(x0, n.sx); y0 = Math.min(y0, n.sy); x1 = Math.max(x1, n.sx); y1 = Math.max(y1, n.sy); }
    x0 -= 24; y0 -= 14; x1 += 24; y1 += 36;     // abajo, sitio para los frutos que cuelgan
    const W = x1 - x0, Hh = y1 - y0, r = H.rng(h.id * 5 + 1);
    const zMadera = cadenas.filter(ch => ch.g === h.id).reduce((s, ch, _, a) => s + ch.z / a.length, 0);
    const capas = [0, 1].map(capa => {
      const c = document.createElement("canvas");
      c.width = Math.ceil(W * esc); c.height = Math.ceil(Hh * esc);
      const g = c.getContext("2d");
      const m = new DOMMatrix([esc, 0, 0, esc, -x0 * esc, -y0 * esc]);
      g.lineCap = "round"; g.lineJoin = "round";
      const cosas = h.follaje.concat(h.frutos || []).sort((p, q) => p.z - q.z);
      const pinta = f => f.fruto ? pintarFruto(g, m, f) : pintarHoja(g, m, f, 1);
      if (capa === 0) {
        for (const f of cosas) if (f.z < zMadera - 6) pinta(f);
        g.setTransform(m); g.globalAlpha = 1;
        pintarPorCapas(g, cadenas.filter(ch => ch.g === h.id), r);
      } else for (const f of cosas) if (f.z >= zMadera - 6) pinta(f);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      return c;
    });
    // solo hojas (la madera, nunca): lo que la madera tapa se borra, para que los
    // tintes del clima no aclaren ni oscurezcan las ramitas respecto al tronco
    const soloHojas = [0, 1].map(capa => {
      const c = document.createElement("canvas");
      c.width = capas[capa].width; c.height = capas[capa].height;
      const g = c.getContext("2d"), m = new DOMMatrix([esc, 0, 0, esc, -x0 * esc, -y0 * esc]);
      g.lineCap = "round"; g.lineJoin = "round";
      const cosas = h.follaje.concat(h.frutos || []).sort((p, q) => p.z - q.z);
      for (const f of cosas) if ((f.z < zMadera - 6) === (capa === 0) && !f.fruto) pintarHoja(g, m, f, 1);
      if (capa === 0) { g.setTransform(m); g.globalAlpha = 1; g.globalCompositeOperation = "destination-out"; for (const ch of cadenas) if (ch.g === h.id) pintarCadena(g, ch, H.rng(1), "silueta"); }
      return c;
    });
    const tinte = (c, col, al) => {
      const v = document.createElement("canvas"); v.width = c.width; v.height = c.height;
      const g = v.getContext("2d"); g.drawImage(c, 0, 0);
      g.globalCompositeOperation = "source-atop"; g.fillStyle = H.rgba(col, al); g.fillRect(0, 0, v.width, v.height);
      return v;
    };
    const amarillas = soloHojas.map(c => tinte(c, [196, 162, 52], 0.55));       // calor: hojas que amarillean
    const quemadas = soloHojas.map(c => tinte(c, [92, 38, 14], 0.7));           // fuego: chamuscadas
    const escarchadas = soloHojas.map(c => tinte(c, [214, 228, 248], 0.5));     // frío: escarcha blanca azulada
    return { capas, amarillas, quemadas, escarchadas, x0, y0, W, Hh, piv: { x: N[h.ni].sx, y: N[h.ni].sy }, z: h.copa.z };
  }

  A.dibujarFijo = function (ctx) {
    if (!A.raiz) return;
    const esc = H.escalaCache || 1, m = ctx.getTransform();
    if (!A.lienzo || A.claveLienzo !== A.n + ":" + esc) {
      A.lienzo = document.createElement("canvas");
      A.lienzo.width = Math.ceil(1920 * esc); A.lienzo.height = Math.ceil(1080 * esc);
      const g = A.lienzo.getContext("2d");
      g.setTransform(esc, 0, 0, esc, 0, 0);
      A.cadenas = cadenasDeDibujo();
      pintarArbol(g, A.cadenas);
      A.claveLienzo = A.n + ":" + esc;
      A.kFrutos = null; A.kTexto = null;
    }
    if (A.kFrutos !== claveFrutos()) {
      A.kFrutos = claveFrutos();
      for (const h of A.hojas) { h.frutos = frutosDe(h); h.rama = capasRama(h, esc, A.cadenas); }
      A.ramasOrden = A.hojas.slice().sort((a, b) => a.rama.z - b.rama.z);     // de atrás adelante
    }
    ctx.save(); ctx.setTransform(m.a / esc, 0, 0, m.d / esc, m.e, m.f);
    ctx.drawImage(A.lienzo, 0, 0);
    ctx.restore();
    A.kTexto = textoGrabado().join();      // (el grabado del tronco se retiró: ya no se pinta)
    A.sucio = false;
  };

  function pintarArbol(ctx, cadenas) {
    const r = H.rng(99);
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const oro = H.C.arbol;
    const pie = N[A.troncoIds[0]], rT = pie.r;

    // el árbol alumbra el jardín: resplandor cálido muy suave bajo la copa
    {
      ctx.save(); ctx.translate(960, 790); ctx.scale(1, 0.42);
      const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 720);
      gl.addColorStop(0, "rgba(255,200,120,0.07)"); gl.addColorStop(0.45, "rgba(255,190,110,0.028)"); gl.addColorStop(1, "rgba(255,190,110,0)");
      ctx.fillStyle = gl; ctx.fillRect(-720, -720, 1440, 1440);
      ctx.restore();
    }
    // sombra de la copa en la tierra (la luna está arriba y delante)
    {
      ctx.save(); ctx.translate(985, A.suelo - 2); ctx.scale(1, 0.05);
      const gs = ctx.createRadialGradient(0, 0, 0, 0, 0, 560);
      gs.addColorStop(0, "rgba(0,0,0,0.35)"); gs.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gs; ctx.fillRect(-560, -560, 1120, 1120);
      ctx.restore();
    }
    // raíces bajo tierra como tubos continuos (cada tramo con extremos redondos,
    // grosor de Leonardo): todo el entramado se pinta en tres pasadas —silueta,
    // sombra abajo y filo dorado arriba—, así las uniones no tienen cortes ni
    // escalones y las puntas se afilan sin líneas rectas
    function tubo(R, pasada) {
      const P = R.pts;
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i], w = (a.w + b.w) / 2;
        if (pasada === 0) { ctx.lineWidth = Math.max(0.4, w); }
        else if (pasada === 1) { if (w < 1.6) continue; ctx.lineWidth = w * 0.45; }
        else { if (w < 1.1) continue; ctx.lineWidth = Math.min(0.7, w * 0.25); }
        const off = pasada === 1 ? w * 0.24 : pasada === 2 ? -w * 0.36 : 0;
        ctx.beginPath(); ctx.moveTo(a.x, a.y + off); ctx.lineTo(b.x, b.y + off); ctx.stroke();
      }
    }
    function pintarRaices(lista) {
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgb(112,84,44)"; for (const R of lista) tubo(R, 0);
      ctx.strokeStyle = "rgba(24,14,5,0.5)"; for (const R of lista) tubo(R, 1);
      ctx.strokeStyle = H.rgba(oro, 0.85); for (const R of lista) tubo(R, 2);
    }
    // se pintan opacas en una capa aparte y se funden de una vez: dorado uniforme
    // y tenue, sin que los solapes sumen brillo encima del Juego de la Vida
    const ctxFinal = ctx, capaR = document.createElement("canvas");
    capaR.width = ctxFinal.canvas.width; capaR.height = ctxFinal.canvas.height;
    ctx = capaR.getContext("2d"); ctx.setTransform(ctxFinal.getTransform()); ctx.lineCap = "round"; ctx.lineJoin = "round";
    pintarRaices(A.raices || []);
    ctx = ctxFinal;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.72; ctx.drawImage(capaR, 0, 0); ctx.restore();
    // empalme contrafuerte → raíz: el primer tramo de cada raíz que nace de un
    // contrafuerte se pinta con la madera opaca del tronco y se funde poco a poco
    // con el tono de las raíces enterradas (sin corte en la línea del suelo)
    for (const R of A.raices || []) {
      if (R.padre >= 0 || !(R.base >= 0) || R.tipo === "arbolito") continue;
      const P = R.pts, n = Math.min(P.length, 14);
      if (n < 3) continue;
      // trazos continuos (sin cuentas oscuras en las uniones) con degradado a lo largo
      const gm = ctx.createLinearGradient(P[0].x, P[0].y, P[n - 1].x, P[n - 1].y);
      gm.addColorStop(0, "rgba(84,62,36,0.42)"); gm.addColorStop(1, "rgba(84,62,36,0)");
      const go = ctx.createLinearGradient(P[0].x, P[0].y, P[n - 1].x, P[n - 1].y);
      go.addColorStop(0, H.rgba(oro, 0.55)); go.addColorStop(1, H.rgba(oro, 0));
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const trozos = 3, paso = (n - 1) / trozos;
      for (let tz = 0; tz < trozos; tz++) {
        const i0 = Math.round(tz * paso), i1 = Math.round((tz + 1) * paso);
        let w = 0; for (let k = i0; k <= i1; k++) w += P[k].w; w /= (i1 - i0 + 1);
        ctx.strokeStyle = gm; ctx.lineWidth = w;
        ctx.beginPath(); for (let k = i0; k <= i1; k++) k > i0 ? ctx.lineTo(P[k].x, P[k].y) : ctx.moveTo(P[k].x, P[k].y); ctx.stroke();
      }
      ctx.strokeStyle = go; ctx.lineWidth = 0.6;
      ctx.beginPath(); for (let k = 0; k < n; k++) { const y = P[k].y - P[k].w * 0.42; k ? ctx.lineTo(P[k].x, y) : ctx.moveTo(P[k].x, y); } ctx.stroke();
      ctx.globalAlpha = 1;
    }
    pintarMicelio(ctx);
    // madera del esqueleto (tronco y ramas del B+), de atrás adelante
    // la madera del árbol solo por encima de la tierra: bajo el suelo siguen el
    // cuello de raíz y las raíces (sin bloque opaco que se corte de golpe)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1920, A.suelo + 2); ctx.clip();
    pintarPorCapas(ctx, cadenas.filter(ch => ch.g < 0), r);
    ctx.restore();
    // nudos del tronco: cicatrices de ramas perdidas, con sus anillos
    for (const f of [0.7]) {      // (el de más abajo caía en el canto, junto al grabado, y parecía un corte)
      const k = Math.round(f * (A.troncoIds.length - 1)), p = N[A.troncoIds[k]], q = N[A.troncoIds[k + 1]];
      const a = Math.atan2(q.sy - p.sy, q.sx - p.sx), lado = f < 0.5 ? -1 : 1;
      const x = p.sx + Math.cos(a + 1.57) * p.r * 0.35 * lado, y = p.sy + Math.sin(a + 1.57) * p.r * 0.35 * lado;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = "rgba(20,14,9,0.85)"; ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 1.9, 0, 0, 6.2832); ctx.fill();
      for (let k2 = 1; k2 <= 3; k2++) {
        ctx.strokeStyle = `rgba(225,190,130,${0.22 - k2 * 0.05})`; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 3.2 + k2 * 1.6, 1.9 + k2 * 1.1, 0, 0, 6.2832); ctx.stroke();
      }
      ctx.restore();
    }
    // enredadera colgante entre ramas vecinas: la lista enlazada de hojas
    for (let i = 0; i < A.hojas.length - 1; i++) {
      const a = A.hojas[i], b = A.hojas[i + 1];
      const pa = a.brotes[MAXK - 1].cam, pb = b.brotes[0].cam;
      const p0 = pa[Math.floor(pa.length * 0.6)], p1 = pb[Math.floor(pb.length * 0.6)];
      const cy = Math.max(p0.y, p1.y) + 30;
      const c = { x0: p0.x, y0: p0.y, x1: H.mix(p0.x, p1.x, 0.3), y1: cy, x2: H.mix(p0.x, p1.x, 0.7), y2: cy, x3: p1.x, y3: p1.y };
      ctx.strokeStyle = "rgba(96,120,72,0.65)"; ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) { const q = bez(c, k / 40), ond = Math.sin(k * 1.1 + i) * 1.4; k ? ctx.lineTo(q.x, q.y + ond) : ctx.moveTo(q.x, q.y + ond); }
      ctx.stroke();
      for (let k = 2; k < 40; k += 3) {
        const q = bez(c, k / 40), q2 = bez(c, (k + 1) / 40);
        const an = Math.atan2(q2.y - q.y, q2.x - q.x) + (k % 6 < 3 ? -1 : 1) * (0.8 + r() * 0.4);
        const t = r();
        ctx.fillStyle = `rgba(${60 + t * 50 | 0},${92 + t * 50 | 0},${56 + t * 30 | 0},0.8)`;
        ctx.beginPath(); ctx.ellipse(q.x + Math.cos(an) * 2.6, q.y + Math.sin(an) * 2.6, 2.6, 1.15, an, 0, 6.2832); ctx.fill();
      }
      for (let k = 8; k < 40; k += 11) {
        const q = bez(c, k / 40);
        ctx.strokeStyle = "rgba(120,150,90,0.5)"; ctx.lineWidth = 0.45;
        ctx.beginPath();
        for (let u = 0; u <= 16; u++) { const x = q.x + Math.sin(u * 0.9) * 2, y = q.y + u * 0.7; u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
      const q = bez(c, 0.95), an = Math.atan2(p1.y - q.y, p1.x - q.x);
      ctx.fillStyle = "rgba(160,200,120,0.6)";
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x - Math.cos(an - 0.5) * 5, p1.y - Math.sin(an - 0.5) * 5);
      ctx.lineTo(p1.x - Math.cos(an + 0.5) * 5, p1.y - Math.sin(an + 0.5) * 5);
      ctx.fill();
    }
    ctx.restore();
  }

  // capa de una rama con el clima ya aplicado: se recompone solo cuando la
  // escarcha, el calor o el fuego cambian un escalón (1/16), no en cada fotograma
  function capaClima(R, k) {
    const Cl = H.Clima;
    if (!Cl || !R.amarillas) return R.capas[k];
    const q = v => Math.round(H.clamp(v, 0, 1) * 16);
    const clave = q(Cl.escarcha) + ":" + q(Cl.calor) + ":" + q(Cl.fuego);
    if (clave === "0:0:0") return R.capas[k];
    R.mix = R.mix || []; R.mixK = R.mixK || [];
    if (R.mixK[k] !== clave) {
      const base = R.capas[k], c = R.mix[k] || document.createElement("canvas");
      c.width = base.width; c.height = base.height;
      const g = c.getContext("2d"); g.drawImage(base, 0, 0);
      if (Cl.escarcha > 0.02) { g.globalAlpha = Cl.escarcha * 0.6; g.drawImage(R.escarchadas[k], 0, 0); }
      if (Cl.calor > 0.02) { g.globalAlpha = Cl.calor * 0.6; g.drawImage(R.amarillas[k], 0, 0); }
      if (Cl.fuego > 0.02) { g.globalAlpha = Cl.fuego * 0.75; g.drawImage(R.quemadas[k], 0, 0); }
      R.mix[k] = c; R.mixK[k] = clave;
    }
    return R.mix[k];
  }

  // ── capa viva ────────────────────────────────────────────────────────────
  A.dibujarVivo = function (ctx, t) {
    if (!A.raiz || !A.ramasOrden) return;
    ctx.save();
    const m = ctx.getTransform();
    // cada rama se mece alrededor de su horquilla, de atrás adelante; ráfagas
    // de viento que recorren la copa de lado a lado
    dibujarHongos(ctx, m, t);
    for (const h of A.ramasOrden) {
      const R = h.rama, sem = h.id * 3.7;
      const racha = 0.55 + 0.45 * Math.sin(t * 0.23 - h.copa.x * 0.003);
      R.capas.forEach((c, k) => {
        const ang = (Math.sin(t * (0.85 + 0.12 * k) + sem + k * 0.6) * 0.010 + Math.sin(t * 2.1 + sem * 1.7) * 0.003 * k) * racha;
        ctx.setTransform(m); ctx.translate(R.piv.x, R.piv.y); ctx.rotate(ang);
        const dx = R.x0 - R.piv.x + (k ? Math.sin(t * 1.7 + sem) * 0.5 * racha : 0), dy = R.y0 - R.piv.y;
        ctx.drawImage(capaClima(R, k), dx, dy, R.W, R.Hh);
      });
    }
    ctx.setTransform(m);
    ctx.globalCompositeOperation = "lighter";
    const oro = H.C.arbol;
    if (A.ultimaNueva !== null && A.tCambio < 6) {
      for (const h of A.hojas) {
        const j = h.k.indexOf(A.ultimaNueva);
        if (j < 0) continue;
        const p = h.brotes[j].centro, f = A.tCambio / 6;
        H.luz(ctx, p.x, p.y, [255, 240, 200], 44, 0.9 * (1 - f));
        ctx.strokeStyle = H.rgba(oro, 0.8 * (1 - f));
        ctx.beginPath(); ctx.arc(p.x, p.y, 12 + f * 60, 0, 6.2832); ctx.stroke();
      }
    }
    // búsquedas: hilo de savia por dentro de la madera, por el camino exacto;
    // lo recorrido queda encendido y se apaga despacio
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const b of A.busquedas) {
      const c = [255, 220, 140];
      const pr = progreso(b), hecho = pr.k >= b.tramos.length ? b.tramos.length : pr.k + pr.f;
      for (let k = 0; k < Math.ceil(hecho); k++) {
        const cam = b.tramos[k].cam, hasta = Math.min(1, hecho - k);
        const edad = b.t - ((k ? b.T[k - 1] : 0) + hasta * b.tramos[k].dur);
        const al = 0.55 * Math.exp(-Math.max(0, edad) * 1.6);
        if (al < 0.02) continue;
        const Lt = cam.L[cam.L.length - 1], dTot = H.suave(hasta) * Lt;
        const ruta = new Path2D(); ruta.moveTo(cam[0].x, cam[0].y);
        for (let i = 1; i < cam.length && cam.L[i - 1] < dTot; i++) {
          if (cam.L[i] <= dTot) ruta.lineTo(cam[i].x, cam[i].y);
          else { const q = enCamino(cam, dTot / Lt); ruta.lineTo(q.x, q.y); }
        }
        const g = k === 0 ? 2.2 : k < b.tramos.length - 1 ? 1.6 : 1;
        if (k === 0 && A.herida) {
          const w = A.herida; ctx.save(); ctx.beginPath();
          ctx.rect(0, 0, 1920, 1080); ctx.ellipse(w.cx, w.cy, w.bw, w.bh, 0, 0, 6.2832);
          ctx.clip("evenodd");
          ctx.strokeStyle = H.rgba(c, al * 0.14); ctx.lineWidth = g * 3.5; ctx.stroke(ruta);
          ctx.strokeStyle = H.rgba(c, al * 0.6); ctx.lineWidth = g * 0.8; ctx.stroke(ruta);
          ctx.restore(); continue;
        }
        ctx.strokeStyle = H.rgba(c, al * 0.14); ctx.lineWidth = g * 3.5; ctx.stroke(ruta);
        ctx.strokeStyle = H.rgba(c, al * 0.6); ctx.lineWidth = g * 0.8; ctx.stroke(ruta);
      }
      const tramo = pr.k;
      if (tramo < b.tramos.length) {
        const f = pr.f, cam = b.tramos[tramo].cam;
        const p = enCamino(cam, H.suave(f));
        const w = A.herida, dentro = tramo === 0 && w && ((p.x - w.cx) / w.bw) ** 2 + ((p.y - w.cy) / w.bh) ** 2 < 1;
        if (!dentro) H.luz(ctx, p.x, p.y, c, 16, 0.85);
        const nd = b.tramos[tramo].nodo;
        if (nd && N[nd.ni]) H.luz(ctx, N[nd.ni].sx, N[nd.ni].sy, oro, 30, 0.3 * (1 - f));
      } else if (b.j >= 0) {
        const f = (b.t - b.fin) / 1.6, p = b.hoja.brotes[b.j].centro;
        if (f < 1) {
          H.luz(ctx, p.x, p.y, c, b.tipo === "e" ? 38 : 30, (1 - f) * 0.85);
          if (b.tipo === "e") {
            ctx.strokeStyle = H.rgba(c, 0.7 * (1 - f)); ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(p.x, p.y, 12 + f * 16, 0, 6.2832); ctx.stroke();
          }
        }
      }
    }
    for (const q of A.polen) {
      const v = Math.min(1, q.t / 0.3, (q.vida - q.t) / 1.2);
      H.luz(ctx, q.x, q.y, q.e ? [225, 240, 255] : [255, 210, 120], 5, 0.8 * v);
      ctx.fillStyle = H.rgba(q.e ? [245, 250, 255] : [255, 236, 180], 0.9 * v);
      ctx.fillRect(q.x - 0.6, q.y - 0.6, 1.2, 1.2);
    }
    dibujarFlujos(ctx, m, t);
    // hojas que caen (disco liberado): giran, se mecen y se posan en la tierra
    ctx.globalCompositeOperation = "source-over";
    for (const c of A.caidas) {
      const f = { x: c.x, y: c.y, a: c.a, len: 7.5, wid: 2.8 * Math.abs(Math.cos(c.f * 0.7)) + 0.4, b: c.b, v: 0.5 };
      pintarHoja(ctx, m, f, Math.min(1, (9 - c.t) / 2));
    }
    ctx.setTransform(m); ctx.globalAlpha = 1;
    ctx.restore();
  };

  return A;
})();
