// Mide la fluidez de la cámara en la escena del agujero negro (y su relevo hacia Proyectos) en Firefox oculto.
// Recorre el tramo a velocidad de scroll constante y con pasos de rueda reales, registra la cámara cuadro a cuadro y
// calcula su velocidad relativa (desplazamiento / distancia al centro, por segundo: igual de exigente lejos que cerca).
// Un «tirón» es un cuadro cuya velocidad cambia más de un 25 % respecto a la del anterior.
// Uso: node herramientas/medir-caida.mjs [url] [--arriba]
import puppeteer from 'puppeteer-core';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export function analizar(muestras) {
  const v = [];
  for (let i = 1; i < muestras.length; i++) {
    const [t0, a] = muestras[i - 1], [t1, b, donde] = muestras[i], dt = (t1 - t0) / 1000;
    if (dt <= 0) continue;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), r = Math.max(1e-6, Math.hypot(...a));
    // también el giro: cuánto cambia la dirección en que mira (radianes)
    const giro = Math.acos(Math.min(1, Math.max(-1, a[3] * b[3] + a[4] * b[4] + a[5] * b[5])));
    v.push({ t: t1, v: d / r / dt + giro / dt, dt, donde });
  }
  const mediana = [...v].map((x) => x.v).sort((p, q) => p - q)[Math.floor(v.length / 2)] ?? 0;
  let cambios = [];
  for (let i = 1; i < v.length; i++) {
    const a = v[i - 1].v, b = v[i].v, m = Math.max(a, b);
    if (m < mediana * 0.15) continue;  // quieta o casi: no cuenta
    // cuadros irregulares del navegador oculto (más de 45 ms o el doble que el anterior): el reloj de la escena se
    // recorta a 50 ms y la velocidad medida miente; se cuentan aparte
    const irregular = v[i].dt > 0.045 || v[i - 1].dt > 0.045 || v[i].dt > 1.8 * v[i - 1].dt || v[i - 1].dt > 1.8 * v[i].dt;
    // fuera de la escena (más allá de la llegada a Proyectos, p ≈ 1,12) no cuenta
    if (parseFloat(String(v[i].donde).split('@')[1]) > 1.13) continue;
    // un arranque desde parada (0,03 → 0,3) no es un tirón: el cambio se compara con la velocidad típica si es mayor
    cambios.push({ t: v[i].t, c: Math.abs(b - a) / Math.max(m, mediana), a, b, irregular, donde: v[i].donde, dt: v[i].dt });
  }
  const todos = cambios; cambios = todos.filter((x) => !x.irregular);
  const ord = [...cambios].sort((p, q) => q.c - p.c);
  return {
    cuadros: v.length, mediana: +mediana.toFixed(3),
    p99: +(ord[Math.floor(ord.length * 0.01)]?.c ?? 0).toFixed(3), max: +(ord[0]?.c ?? 0).toFixed(3),
    tirones: cambios.filter((x) => x.c > 0.25).length, irregulares: todos.length - cambios.length,
    peores: ord.slice(0, 6).map((x) => `${x.donde} ${(x.c * 100).toFixed(0)}% (${x.a.toFixed(2)}→${x.b.toFixed(2)}) dt=${(x.dt * 1000).toFixed(0)}ms`),
  };
}

export async function medirCaida({ url = 'http://127.0.0.1:4500/', arriba = false } = {}) {
  const b = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi', extraPrefsFirefox: { 'webgl.force-enabled': true } });
  const out = {};
  try {
    for (const modo of ['constante', 'rueda']) {
      const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
      await p.goto(url, { waitUntil: 'load' }); await espera(5000);
      const { ini, fin } = await p.evaluate(() => {
        const h = document.getElementById('habilidades'), pr = document.getElementById('proyectos');
        return { ini: h.offsetTop - innerHeight * 0.6, fin: pr.offsetTop + innerHeight * 0.2 };
      });
      const [y0, y1] = arriba ? [fin, ini] : [ini, fin];
      await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y0); await espera(2500);
      // registro cuadro a cuadro (y, en modo constante, el propio scroll)
      await p.evaluate((y0, y1, constante) => {
        window.__muestras = []; window.__fin = false;
        const vel = 700, t0 = performance.now();  // px/s
        // la cámara se muestrea justo tras pintar cada cuadro (un muestreo por cuadro pintado, sin duplicados)
        window.__ravenTrasCuadro = () => { if (window.__fin) return; const c = window.__ravenCamara, e = c.matrixWorld.elements; window.__muestras.push([window.__tEscena = (window.__tEscena ?? 0) + (window.__ravenDt ?? 0.016) * 1000, [c.position.x, c.position.y, c.position.z, -e[8], -e[9], -e[10]], `${window.__ravenBH?.fase ?? ''}@${(window.__ravenBH?.p ?? 0).toFixed(3)}`]); };
        const paso = (t) => {
          if (constante) { const y = y0 + Math.sign(y1 - y0) * vel * (t - t0) / 1000; scrollTo({ top: y, behavior: 'instant' }); if ((y1 - y) * Math.sign(y1 - y0) <= 0) { window.__fin = true; return; } }
          if (!window.__fin) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      }, y0, y1, modo === 'constante');
      if (modo === 'rueda') {
        await p.mouse.move(640, 360);
        for (let n = 0; n < 400; n++) {
          await p.mouse.wheel({ deltaY: arriba ? -100 : 100 }); await espera(90);
          const y = await p.evaluate(() => scrollY);
          if (arriba ? y <= y1 : y >= y1) break;
        }
        await espera(1500); await p.evaluate(() => { window.__fin = true; });
      } else {
        while (!(await p.evaluate(() => window.__fin))) await espera(250);
        await espera(200);
      }
      out[modo] = analizar(await p.evaluate(() => window.__muestras));
      await p.close();
    }
  } finally { await b.close(); }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv.slice(2).find((a) => !a.startsWith('--'));
  console.log(JSON.stringify(await medirCaida({ url, arriba: process.argv.includes('--arriba') }), null, 1));
}
