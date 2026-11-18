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
      const clicEn = async (sel) => { const r = await p.evaluate((s) => { const el = document.querySelector(s); if (el.closest('.resumen')) el.scrollIntoView({ block: 'center' }); const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; }, sel); if (process.env.DEPURAR) console.log('clic', sel, r); await p.mouse.click(r[0], r[1]); };

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

      // 6. revisión final: foco, «Ver todo» sin salto de cámara, segunda caída tras cerrar, botón oculto inerte
      await ir(0.65); await espera(2000);
      await clicEn('.cruzar'); await espera(5200);
      ok(await p.evaluate(() => document.querySelector('.resumen').contains(document.activeElement)), `${tam}: al abrirse el resumen el foco entra en él`);
      await clicEn('.resumen-seguir'); await espera(1900);
      // vuelve a cruzar enseguida (dentro de los 4 s del cierre anterior)
      await ir(0.65); await espera(900);
      await clicEn('.cruzar'); await espera(5200);
      ok(await p.evaluate(() => document.querySelector('.resumen').classList.contains('abierto')), `${tam}: cruzar otra vez justo después de cerrar abre el resumen`);
      await clicEn('.resumen-seguir'); await espera(3500);
      ok(await p.evaluate(() => !!document.activeElement?.closest?.('#proyectos')), `${tam}: al salir, el foco queda en Proyectos`);
      await espera(1800);
      // «Ver todo de una vez»: la cámara no salta mientras la capa aún no tapa la escena
      await ir(0.3); await espera(1500);
      const saltos = await p.evaluate(async () => {
        const c0 = window.__ravenCamara.position.clone(); document.querySelector('.saltar-caida').click();
        let malos = 0; const capa = document.querySelector('.resumen');
        for (let n = 0; n < 60; n++) { await new Promise((r) => requestAnimationFrame(r)); if (+getComputedStyle(capa).opacity < 0.98 && window.__ravenCamara.position.distanceTo(c0) > c0.length() * 0.05) malos++; }
        return malos;
      });
      ok(saltos === 0, `${tam}: «Ver todo» no hace saltar la cámara mientras la capa no la tapa (${saltos} cuadros)`);
      await p.keyboard.press('Escape'); await espera(3500); await espera(1800);
      // el botón ya desvanecido no se puede activar con el teclado
      await ir(0.65); await espera(2000);
      await p.evaluate(() => document.querySelector('.cruzar').focus());
      await ir(0.95); await espera(1500);
      await p.keyboard.press('Enter'); await espera(800);
      ok(await p.evaluate(() => !window.__ravenBH.cruce && !document.querySelector('.resumen').classList.contains('abierto')), `${tam}: Enter sobre el botón ya desvanecido no hace nada`);
      // «Ver todo» invisible (en la retirada) no se puede pulsar
      await ir(0.8); await espera(1200);
      ok(await p.evaluate(() => { const e = document.querySelector('.saltar-caida'), r = e.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.saltar-caida') !== e; }), `${tam}: «Ver todo» invisible no recibe clics`);
      await p.close();
    }
  } finally { await b.close(); }
  // 8. revisión del rediseño: la primera pantalla no desaparece tras cargar y «En cifras» de Penumbra se ve nítido
  const b3 = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi', extraPrefsFirefox: { 'webgl.force-enabled': true } });
  try {
    const p = await b3.newPage(); await p.setViewport({ width: 1440, height: 900 });
    await p.goto(url, { waitUntil: 'load' }); await espera(2000);
    let minimo = 1; const t0 = Date.now();
    while (Date.now() - t0 < 7000) { minimo = Math.min(minimo, await p.evaluate(() => Math.min(...['.hero-lema', '.hero-sobre', '.barra'].map((s) => +getComputedStyle(document.querySelector(s)).opacity)))); await espera(150); }
    ok(minimo > 0.95, `la primera pantalla no desaparece tras cargar (opacidad mínima ${minimo.toFixed(2)})`);
    await p.goto(url + 'proyectos/penumbra/', { waitUntil: 'load' }); await espera(1500);
    const f = await p.evaluate(() => { const c = document.querySelector('.p-cifras'); return c ? { filtro: getComputedStyle(c).filter, op: +getComputedStyle(c).opacity } : null; });
    ok(f && (f.filtro === 'none' || /blur\(0px\)/.test(f.filtro)) && f.op > 0.95, `«En cifras» de Penumbra se ve nítido (${JSON.stringify(f)})`);
  } finally { await b3.close(); }
  // 9. bienvenida «Primera luz»: aparece al cargar (y al recargar), los textos esperan al estallido, termina con la
  // galaxia encendida y el texto legible, y un gesto la termina al momento
  const b4 = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi', extraPrefsFirefox: { 'webgl.force-enabled': true } });
  try {
    const p = await b4.newPage(); await p.setViewport({ width: 1440, height: 900 });
    await p.goto(url, { waitUntil: 'load' });
    ok(await p.evaluate(() => document.documentElement.classList.contains('bienvenida')), 'bienvenida: aparece al cargar');
    // el encendido pasa por muchos valores intermedios (avanza por cuadros pintados): no salta de 0 a 1 tras un tirón
    const valores = new Set();
    for (let n = 0; n < 160; n++) { const e = await p.evaluate(() => window.__ravenEncendido?.()); if (e) { if (e.valor > 0 && e.valor < 1) valores.add(e.valor); if (e.fase === 'hecho') break; } await espera(30); }
    ok(valores.size >= 5, `bienvenida: la galaxia se enciende de forma gradual (${valores.size} pasos intermedios vistos)`);
    await p.waitForFunction(() => document.documentElement.classList.contains('encendida'), { timeout: 15000 }).catch(() => {});
    ok(await p.evaluate(() => document.documentElement.classList.contains('encendida') && +getComputedStyle(document.querySelector('.hero-lema')).opacity > 0.95), 'bienvenida: la galaxia termina encendida y el texto legible');
    await p.reload({ waitUntil: 'load' });
    ok(await p.evaluate(() => document.documentElement.classList.contains('bienvenida')), 'bienvenida: se repite al recargar');
    const q = await b4.newPage(); await q.setViewport({ width: 1440, height: 900 });
    q.goto(url, { waitUntil: 'load' }).catch(() => {}); await q.waitForSelector('.hero-lema', { timeout: 30000 });
    const antes = await q.evaluate(() => ({ revelar: document.documentElement.classList.contains('revelar'), op: +getComputedStyle(document.querySelector('.hero-lema')).opacity }));
    ok(antes.revelar || antes.op < 0.05, `bienvenida: los textos esperan al estallido (${JSON.stringify(antes)})`);
    await q.mouse.click(700, 120); await espera(300);
    ok(await q.evaluate(() => document.documentElement.classList.contains('bienvenida-fin') && +getComputedStyle(document.querySelector('.hero-lema')).opacity > 0.95), 'bienvenida: un clic la termina al momento');
  } finally { await b4.close(); }
  // 7. sin WebGL: los faros, el botón y «Ver todo» siguen apareciendo (el resumen sigue siendo accesible)
  const b2 = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi', extraPrefsFirefox: { 'webgl.disabled': true } });
  try {
    const p = await b2.newPage(); await p.setViewport({ width: 1440, height: 900 });
    await p.goto(url, { waitUntil: 'load' }); await espera(4000);
    const a = (q) => p.evaluate(async (q) => { const s = document.getElementById('habilidades'), alto = s.offsetHeight - innerHeight; scrollTo({ top: s.offsetTop + q * alto, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 1500)); return { saltar: +getComputedStyle(s).getPropertyValue('--saltar') || 0, boton: document.querySelector('.cruzar').classList.contains('activo') }; }, q);
    ok((await a(0.3)).saltar > 0.5, 'sin WebGL: «Ver todo de una vez» aparece en la aproximación');
    ok((await a(0.65)).boton, 'sin WebGL: el botón aparece en la pausa');
  } finally { await b2.close(); }
  return { errores, pasos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errores, pasos } = await humoCruzar({ url: process.argv[2], capturas: process.argv[3] });
  for (const s of pasos) console.log(`✓ ${s}`);
  for (const e of errores) console.log(`✗ ${e}`);
  process.exit(errores.length ? 1 : 0);
}
