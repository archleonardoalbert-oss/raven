// HORTUS ALGORITHMICUS · orquestación: capas, bucle a 60 fps y datos del sistema.
// Capa «fondo»: cielo, marco, título (se repinta cada minuto).
// Capa «estructura»: árbol B+ y grafo (solo cuando cambian).
// Capa «viva»: todo lo que se mueve (cada fotograma).
"use strict";

(function () {
  const W = 1920, Hh = 1080;
  const capas = {};
  let escala = 1, dpr = 1;
  const datos = {
    red: { bajada: 0, subida: 0 }, disco: { uso: 50, lectura: 0, escritura: 0 },
    cpu: { nucleos: new Array(12).fill(0.05), temp: 45 }, sistema: null, ram: null, bat: null,
  };
  let horaFija = null;
  const q = new URLSearchParams(location.search);
  if (q.has("hora")) horaFija = Number(q.get("hora"));

  function lienzo(id, opaco) {
    // «fondo» no está en la página: es una imagen intermedia que se copia en «estructura»
    const c = document.getElementById(id) || document.createElement("canvas");
    return { c, ctx: c.getContext("2d", { alpha: !opaco }) };
  }
  function ajustar() {
    dpr = window.devicePixelRatio || 1;
    escala = Math.min(window.innerWidth / W, window.innerHeight / Hh);
    for (const k in capas) {
      const { c, ctx } = capas[k];
      c.width = Math.round(window.innerWidth * dpr); c.height = Math.round(window.innerHeight * dpr);
      c.style.width = window.innerWidth + "px"; c.style.height = window.innerHeight + "px";
      const ox = (window.innerWidth - W * escala) / 2, oy = (window.innerHeight - Hh * escala) / 2;
      ctx.setTransform(escala * dpr, 0, 0, escala * dpr, ox * dpr, oy * dpr);
    }
    sucioFondo = true; H.Arbol.sucio = true; H.Grafo.sucio = true;
    // los trozos en caché se rehacen a la nueva resolución
    H.escalaCache = escala * dpr;
    for (const k in H.sprites) if (k.startsWith("c:")) H.sprites[k].clave = null;
  }

  let sucioFondo = true, minutoAnt = -1, cometaAntes = false;
  function horaActual() {
    const f = horaFija !== null ? new Date(2026, 10, 8, Math.floor(horaFija), (horaFija % 1) * 60, 0) : new Date();
    return { f, h: f.getHours() + f.getMinutes() / 60 + f.getSeconds() / 3600 };
  }

  // ── entrada de datos: el proceso anfitrión llama a hortus.datos({...}) ────
  let pausado = false, tempForzada = null;
  window.hortus = {
    datos(d) {
      Object.assign(datos, d);
      H.Arbol.fijarDisco(datos.disco.uso, datos.disco);
      if (datos.red) H.Grafo.actualizar(datos.red);
      if (d.disco && H.Arbol.llenar) H.Arbol.llenar(d.disco.llenado);
      if (H.Arbol.memoria) H.Arbol.memoria(d.ram, d.disco);
    },
    // nadie ve el fondo (juego a pantalla completa, tapa bajada, suspensión):
    // se congela sin gastar nada y, al volver, sigue exactamente donde estaba
    // una notificación de cualquier aplicación: cruza un cometa por el cielo
    cometa(app) { if (!pausado) H.Cometa.lanzar(app); },
    // demostración: fija la temperatura que ven las flores (−1 vuelve a la real)
    forzarTemp(v) { tempForzada = v >= 0 ? v : null; },
    pausa(p) {
      if (p === pausado) return;
      pausado = p;
      if (!p) { ultimo = performance.now(); acumulado = DT; requestAnimationFrame(fotograma); }
    },
  };

  // modo demostración (para revisar sin el anfitrión): ?demo
  function demo(t) {
    const n = 12;
    datos.red.bajada = 1.5e6 * (0.5 + 0.5 * Math.sin(t * 0.3)) ** 2 + 2e4;
    datos.red.subida = 8e4 * (0.5 + 0.5 * Math.sin(t * 0.21 + 1)) + 4e3;
    datos.disco.lectura = 2e6 * Math.max(0, Math.sin(t * 0.5));
    datos.disco.escritura = 4e5 * Math.max(0, Math.sin(t * 0.37 + 2));
    datos.cpu.nucleos = Array.from({ length: n }, (_, i) => H.clamp(0.15 + 0.6 * Math.max(0, Math.sin(t * 0.2 + i * 0.7)) ** 2 + (i === 3 ? 0.4 : 0), 0, 1));
    datos.cpu.temp = Number(q.get("temp") || (52 + 20 * Math.sin(t * 0.05)));
    datos.disco.uso = Number(q.get("disco") || 71);
    datos.disco.total = 476e9; datos.disco.usado = datos.disco.total * datos.disco.uso / 100;
    datos.sistema = { host: "Arch-Leonardo", kernel: "linux 7.3.1-cachyos", activo: "21 h 04 min" };
    datos.ram = { pct: 52 }; datos.bat = { pct: 88, estado: "descargando" };
    // red de prueba: una vez por segundo, unos sitios con tráfico variable
    if (Math.floor(t) !== demo.seg) {
      demo.seg = Math.floor(t);
      const sin = q.get("enlace") === "no", sinVpn = q.get("enlace") === "sinvpn";
      datos.red.enlace = { conectado: !sin, tipo: "usb", iface: "enp7s0f4u1", vpn: !sin && !sinVpn };
      datos.red.sitios = sin ? [] : [
        { ip: "160.79.104.10", nombre: "claude · anthropic.com", bajada: 30000 + 20000 * Math.sin(t), subida: 9000 },
        { ip: "142.250.69.174", nombre: "Battle.net · 1e100.net", bajada: 90000 * (0.6 + 0.4 * Math.sin(t * 0.7)), subida: 0 },
        { ip: "137.221.64.6", nombre: "SC2_x64 · blizzard.com", bajada: 60000, subida: 55000 },
        { ip: "99.86.57.104", nombre: "Battle.net · cloudfront.net", bajada: 0, subida: 0 },
        { ip: "8.232.70.12", nombre: "Agent · 8.232.70.12", bajada: 180000, subida: 20000 },
      ];
      H.Grafo.actualizar(datos.red);
      if (H.Arbol.llenar) H.Arbol.llenar(Math.max(0, Math.sin(t * 0.4)) * 2.5e6);   // copia simulada
      if (H.Arbol.memoria) H.Arbol.memoria({ pct: Number(q.get("ram") || 58), cache: Number(q.get("cache") || 22) }, { lectura: 2.5e6 * Math.max(0.15, Math.sin(t * 0.5)), escritura: 1.2e6 * Math.max(0.1, Math.sin(t * 0.37 + 2)) });
    }
    H.Arbol.fijarDisco(datos.disco.uso, datos.disco);
  }

  // ── perfil (?perfil): cuánto cuesta cada parte, impreso cada 300 fotogramas ──
  const perfil = q.has("perfil") ? {} : null;
  let nPerfil = 0;
  const sin = (q.get("sin") || "").split(",");
  function mide(nombre, fn) {
    if (sin.includes(nombre.split(".")[0]) || sin.includes(nombre)) return;
    if (!perfil) return fn();
    const a = performance.now(); fn(); perfil[nombre] = (perfil[nombre] || 0) + performance.now() - a;
  }

  let t = 0, ultimo = performance.now(), acumulado = 0;
  const DT = 1 / 60;
  let vsync = 1 / 60;

  function fotograma(ahora) {
    if (pausado) return;            // sin pedir más fotogramas: coste cero
    requestAnimationFrame(fotograma);
    // al menos 60 fps, pero siempre en un múltiplo exacto del refresco de la
    // pantalla: a 144 Hz, 60 fps saldría a saltos de 2 y 3 refrescos (13,9/20,8 ms)
    // y lo rápido (el cometa) se trabaría; se pinta cada 2 refrescos = 72 fps parejos
    const delta = (ahora - ultimo) / 1000;
    ultimo = ahora;
    if (delta > 0.002 && delta < 0.05) vsync += (delta - vsync) * 0.05;   // refresco medido
    acumulado += delta;
    const k = Math.max(1, Math.floor(DT / vsync + 0.05));
    if (acumulado < k * vsync - vsync / 2) return;
    const dt = Math.min(0.1, acumulado);
    if (perfil) { perfil._max = Math.max(perfil._max || 0, acumulado * 1000); if (acumulado > 1.5 * k * vsync) perfil._saltos = (perfil._saltos || 0) + 1; perfil._vs = vsync * 1000; perfil._k = k; }
    acumulado = 0;
    t += dt;
    if (q.has("demo")) demo(t);
    if (q.has("cometa") && (t - dt < 1e-6 || Math.floor(t / 4) !== Math.floor((t - dt) / 4))) H.Cometa.lanzar(q.get("cometa") || "Telegram");

    const { f, h } = horaActual();
    mide("Grafo.paso", () => H.Grafo.paso(dt, datos.red));
    mide("Arbol.paso", () => H.Arbol.paso(dt, datos.disco));
    mide("Vida.paso", () => H.Vida.paso(dt, datos.cpu.nucleos));
    // la temperatura gobierna el cielo y el jardín (con el controlador difuso de las flores)
    mide("Clima.paso", () => H.Clima.paso(dt, tempForzada !== null ? tempForzada : datos.cpu.temp));

    // cielo y lámina (cada minuto): «fondo» = cielo, sol y estrellas;
    // «lamina» = marco, título, rótulos y rejilla del suelo (por encima del cometa)
    let cieloSucio = false;
    if (sucioFondo || H.Clima.clave !== minutoAnt) {
      const todo = sucioFondo;
      minutoAnt = H.Clima.clave;
      const c = capas.fondo.ctx;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, capas.fondo.c.width, capas.fondo.c.height); c.restore();
      H.Clima.dibujarEstrellas(c);
      cieloSucio = true;
      if (todo) {
        const l = capas.lamina.ctx;
        l.save(); l.setTransform(1, 0, 0, 1, 0, 0); l.clearRect(0, 0, capas.lamina.c.width, capas.lamina.c.height); l.restore();
        H.Vida.dibujarFijo(l, 12);
        sucioFondo = false;
        H.Arbol.sucio = true; H.Grafo.sucio = true;
      }
    }
    // capa cielo (opaca, la de más abajo): solo se repinta si cambia o si cruza un cometa
    const cometa = H.Cometa.activo();
    cometaAntes = cometa;
    // capa estructura (transparente): lámina + grafo + árbol, cuando cambian
    if (H.Grafo.sucio) {
      const c = capas.redFija.ctx;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, capas.redFija.c.width, capas.redFija.c.height); c.restore();
      H.Lamina.dibujarMarco(c);
      H.Grafo.dibujarFijo(c);
      H.Arbol.sucio = true;
    }
    if (H.Arbol.sucio) {
      const c = capas.estructura.ctx;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, capas.estructura.c.width, capas.estructura.c.height);
      c.drawImage(capas.lamina.c, 0, 0); c.restore();
      H.Arbol.dibujarFijo(c);
    }
    {
      // la constelación (con el título) en una imagen aparte...
      const c = capas.red.ctx, W = capas.red.c.width, Hc = capas.red.c.height;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, Hc); c.drawImage(capas.redFija.c, 0, 0); c.restore();
      mide("Grafo.dibujarVivo", () => H.Grafo.dibujarVivo(c, t));
      // ...y la capa del cielo se compone en cada fotograma: cielo, cometa,
      // constelación y, de día, su versión en tinta (sin filtros CSS: el
      // compositor de WebKit no los soporta bien y tapaba todo en negro)
      const k = capas.cielo.ctx;
      H.Clima.componerCielo(k, capas.fondo.c);
      if (cometa) mide("Cometa.dibujar", () => H.Cometa.dibujar(k, dt, H.Clima.posSol()));
      const op = H.suave(H.clamp((H.Clima.dia - 0.2) / 0.6, 0, 1));   // la tinta entra con el día de verdad
      k.save(); k.setTransform(1, 0, 0, 1, 0, 0);
      k.globalAlpha = 1 - op * 0.92; k.drawImage(capas.red.c, 0, 0);
      if (op > 0.01) {
        // tinta: copia desaturada e invertida (conserva el alfa) multiplicada sobre el cielo
        const ct = capas.redTinta.ctx;
        ct.save(); ct.setTransform(1, 0, 0, 1, 0, 0); ct.globalCompositeOperation = "copy"; ct.drawImage(capas.red.c, 0, 0);
        ct.globalCompositeOperation = "saturation"; ct.fillStyle = "rgb(128,128,128)"; ct.fillRect(0, 0, W, Hc);
        ct.globalCompositeOperation = "difference"; ct.fillStyle = "rgb(255,255,255)"; ct.fillRect(0, 0, W, Hc);
        ct.globalCompositeOperation = "destination-in"; ct.drawImage(capas.red.c, 0, 0);
        ct.restore();
        k.globalAlpha = op; k.globalCompositeOperation = "multiply"; k.drawImage(capas.redTinta.c, 0, 0);
      }
      k.restore();
    }
    // capa viva
    const c = capas.viva.ctx;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, capas.viva.c.width, capas.viva.c.height); c.restore();
    mide("Arbol.dibujarVivo", () => H.Arbol.dibujarVivo(c, t));
    mide("Clima.dibujarVivo", () => H.Clima.dibujarVivo(c, t));
    mide("Vida.dibujarVivo", () => H.Vida.dibujarVivo(c, t));
    mide("Lamina.dibujarRotuloRed", () => H.Lamina.dibujarRotuloRed(c, datos, H.Grafo));
    // (calima por distorsión desactivada: leer las capas de la GPU costaba ~25 ms/fotograma)
    mide("Lamina.dibujarInfo", () => H.Lamina.dibujarInfo(c, datos));
    window.hortusListo = true;
    if (perfil && ++nPerfil === 300) {
      const o = {}; let tot = 0;
      for (const k in perfil) { if (k[0] === "_") { o[k] = +perfil[k].toFixed(2); continue; } o[k] = +(perfil[k] / 300).toFixed(3); tot += perfil[k] / 300; perfil[k] = 0; }
      perfil._max = 0; perfil._saltos = 0;
      console.log("PERFIL ms/fotograma total=" + tot.toFixed(2) + " " + JSON.stringify(o));
      console.log("LUCES savia=" + H.Arbol.busquedas.length + " flujos=" + (H.Arbol.flujos || []).length + " esporas=" + (H.Arbol.esporas || []).length + " polen=" + H.Arbol.polen.length);
      nPerfil = 0;
    }
  }

  async function iniciar() {
    capas.fondo = lienzo("fondo"); capas.lamina = lienzo("lamina");   // fondo: solo estrellas, transparente
    capas.cielo = lienzo("cielo", true); capas.estructura = lienzo("estructura"); capas.viva = lienzo("viva");
    capas.redFija = lienzo("redFija"); capas.red = lienzo("red"); capas.redTinta = lienzo("redTinta");
    try {
      const fuentes = [
        new FontFace("Cormorant", "url(fuentes/cormorant.ttf)", { weight: "300 700" }),
        new FontFace("Cormorant", "url(fuentes/cormorant-italica.ttf)", { weight: "300 700", style: "italic" }),
        new FontFace("JBM", "url(fuentes/jetbrains.ttf)"),
      ];
      for (const fu of fuentes) { await fu.load(); document.fonts.add(fu); }
    } catch (e) { console.warn("fuentes", e); }
    H.Grafo.crear();
    H.Vida.crear(12);
    H.Arbol.fijarDisco(datos.disco.uso, datos.disco);
    ajustar();
    window.addEventListener("resize", ajustar);
    requestAnimationFrame(fotograma);
  }
  iniciar();
})();
