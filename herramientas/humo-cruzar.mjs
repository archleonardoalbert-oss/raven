// Humo del botón para cruzar el horizonte, en Firefox oculto: aparece en la pausa, pulsarlo cae y abre el resumen,
// «Seguir a Proyectos» aterriza en Proyectos con el scroll libre, «Ver todo de una vez» abre la capa y Esc sale, y
// seguir con el scroll sin pulsar lleva a Proyectos. Nunca abre ventanas visibles.
// Uso: node herramientas/humo-cruzar.mjs [url] [carpeta-capturas]
import puppeteer from 'puppeteer-core';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function humoCruzar({ url = 'http://127.0.0.1:4500/', capturas = null } = {}) {
  const b = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi', extraPrefsFirefox: { 'webgl.force-enabled': true } });
  const errores = [], pasos = [];
  const ok = (c, t) => { (c ? pasos : errores).push(t); if (process.env.DEPURAR) console.log(c ? '✓' : '✗', t); };
  try {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await b.newPage(); await p.setViewport({ width: w, height: h }); p.setDefaultNavigationTimeout(90000);
      const tam = `${w}×${h}`;
      p.on('pageerror', (e) => errores.push(`${tam}: JS ${e.message}`));
      await p.goto(url, { waitUntil: 'load' }); await espera(5000);
      const ir = (q) => p.evaluate((q) => { const { arriba, alto } = window.__ravenCaida; scrollTo({ top: arriba + q * alto, behavior: 'instant' }); window.__ravenFijarScroll(); }, q);
      const enProyectos = () => p.evaluate(() => { const pr = document.getElementById('proyectos'); return scrollY >= pr.offsetTop - innerHeight * 0.6 && scrollY <= pr.offsetTop + innerHeight; });
      const clicEn = async (sel) => { const r = await p.evaluate((s) => { const el = document.querySelector(s); const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; }, sel); if (process.env.DEPURAR) console.log('clic', sel, r); await p.mouse.click(r[0], r[1]); };

      // 1. en la pausa aparece el botón
      await ir(0.65); await espera(2000);
      ok(await p.evaluate(() => document.querySelector('.cruzar').classList.contains('activo')), `${tam}: el botón aparece en la pausa`);
      // en un faro no
      await ir(0.2); await espera(1200);
      ok(!(await p.evaluate(() => document.querySelector('.cruzar').classList.contains('activo'))), `${tam}: el botón no está en los faros`);

      // 2. pulsarlo: cae y abre el resumen
      await ir(0.65); await espera(2000);
      await clicEn('.cruzar'); await espera(5200);
      ok(await p.evaluate(() => document.querySelector('.resumen').classList.contains('abierto')), `${tam}: pulsar el botón abre el resumen tras la caída`);
      if (capturas) await p.screenshot({ path: `${capturas}/resumen-${w}.png` });
      const y0 = await p.evaluate(() => scrollY); await p.mouse.wheel({ deltaY: 300 }); await espera(400);
      if (process.env.DEPURAR) console.log('rueda con capa:', y0, await p.evaluate(() => scrollY));
      ok(Math.abs((await p.evaluate(() => scrollY)) - y0) < 2, `${tam}: con el resumen abierto la página no se desplaza`);

      // 3. «Seguir a Proyectos»
      await clicEn('.resumen-seguir'); await espera(3500);
      ok(await enProyectos(), `${tam}: «Seguir a Proyectos» aterriza en Proyectos`);
      ok(await p.evaluate(() => !document.documentElement.classList.contains('cruzando') && document.querySelector('.resumen').hidden && !window.__ravenBH.cruce), `${tam}: al salir, el scroll queda libre y la capa cerrada`);
      const y1 = await p.evaluate(() => scrollY); await p.mouse.move(w / 2, h / 2); await p.mouse.wheel({ deltaY: 200 }); await espera(700);
      ok((await p.evaluate(() => scrollY)) !== y1, `${tam}: la rueda vuelve a desplazar la página`);
      await espera(1800);  // el imán de la portada termina su viaje (un salto programático no lo cancela; una persona, sí)

      // 4. «Ver todo de una vez» y Esc
      if (process.env.DEPURAR) await p.evaluate(() => { const o = window.scrollTo; window.__trazas = []; window.scrollTo = function (...a) { const y = typeof a[0] === 'object' ? a[0].top : a[1]; if (y > 7000) window.__trazas.push(new Error().stack.split('\n').slice(1, 5).join(' | ')); return o.apply(this, a); }; });
      await ir(0.3);
      if (process.env.DEPURAR) { const ys = []; for (let i = 0; i < 8; i++) { ys.push(await p.evaluate(() => Math.round(scrollY))); await espera(150); } console.log('ys tras ir:', ys.join(' ')); console.log(await p.evaluate(() => window.__trazas.join('\n'))); }
      await espera(300);
      if (process.env.DEPURAR) console.log('tras ir(0.3):', await p.evaluate(() => ({ y: scrollY, p: window.__ravenBH.p, top: document.querySelector('.caida-escena').getBoundingClientRect().top, saltando: window.__ravenSaltando?.(), ov: getComputedStyle(document.documentElement).overflow })));
      await clicEn('.saltar-caida'); await espera(1200);
      ok(await p.evaluate(() => document.querySelector('.resumen').classList.contains('abierto')), `${tam}: «Ver todo de una vez» abre el resumen al momento`);
      await p.keyboard.press('Escape'); await espera(3500);
      ok(await enProyectos(), `${tam}: Esc sale del resumen y aterriza en Proyectos`);

      // 5. sin pulsar: seguir con el scroll lleva a Proyectos (retirada)
      await ir(0.68); await espera(1500);
      await p.evaluate(async () => { const { arriba, alto } = window.__ravenCaida; for (let q = 0.68; q <= 1.13; q += 0.01) { scrollTo({ top: arriba + q * alto, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)); } });
      await espera(2500);
      ok(await enProyectos() && !(await p.evaluate(() => window.__ravenBH.activo)), `${tam}: sin pulsar, seguir con el scroll lleva a Proyectos`);
      await p.close();
    }
  } finally { await b.close(); }
  return { errores, pasos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errores, pasos } = await humoCruzar({ url: process.argv[2], capturas: process.argv[3] });
  for (const s of pasos) console.log(`✓ ${s}`);
  for (const e of errores) console.log(`✗ ${e}`);
  process.exit(errores.length ? 1 : 0);
}
