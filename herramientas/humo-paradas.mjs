// Humo del scroll por paradas en Firefox oculto, con rueda y teclado reales: dentro de una parada el scroll no sale,
// empujar en el borde muestra el aviso y lleva a la siguiente, los faros de la caída son paradas, se puede volver
// atrás y, en móvil, Sobre mí se lee entero sin salir de su parada. Nunca abre ventanas visibles.
// Uso: node herramientas/humo-paradas.mjs [url]   (por defecto http://127.0.0.1:4500/)
import puppeteer from 'puppeteer-core';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function humoParadas({ url = 'http://127.0.0.1:4500/' } = {}) {
  const b = await puppeteer.launch({ browser: 'firefox', executablePath: '/usr/bin/firefox', headless: true, protocol: 'webDriverBiDi', extraPrefsFirefox: { 'webgl.force-enabled': true } });
  const errores = [], pasos = [];
  const ok = (cond, texto) => { (cond ? pasos : errores).push(texto); };
  try {
    const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 }); p.setDefaultNavigationTimeout(90000);
    p.on('pageerror', (e) => errores.push(`JS ${e.message}`));
    await p.goto(url, { waitUntil: 'load' }); await espera(5000);
    const donde = () => p.evaluate(() => { const P = window.__ravenConductor.paradas(); const i = P.findIndex((z) => scrollY >= z.ini - 2 && scrollY <= z.fin + 2); return { id: P[i]?.id ?? null, y: Math.round(scrollY) }; });
    await p.mouse.move(720, 450);
    // empuja hasta que cambie de parada (o se agoten los intentos); devuelve si el aviso llegó a verse
    const empujar = async (dy) => {
      const antes = (await donde()).id; let aviso = false, pausado = false;
      await espera(450);  // gesto nuevo
      for (let n = 0; n < 60; n++) {
        await p.mouse.wheel({ deltaY: dy }); await espera(40);
        // al llegar al borde con un gesto continuo hay que hacer una pausa (la inercia no saca de la parada)
        if (!pausado && (await p.evaluate(() => document.querySelector('.parada-aviso')?.classList.contains('visible') && /scaleX\(0(\.0+)?\)/.test(document.querySelector('.parada-aviso-barra span').style.transform)))) { pausado = true; await espera(450); }
        aviso ||= await p.evaluate(() => document.querySelector('.parada-aviso')?.classList.contains('visible'));
        const d = await donde(); if (d.id !== antes && d.id) break;
      }
      await espera(2900);
      return { aviso, ...(await donde()) };
    };

    // 1. dentro de la portada: unos pasos de rueda no la abandonan
    for (let i = 0; i < 2; i++) { await p.mouse.wheel({ deltaY: 100 }); await espera(120); }
    await espera(800);
    ok((await donde()).id === 'inicio', 'la rueda dentro de la portada no sale de ella');

    // 2. recorrido hacia abajo
    const esperado = await p.evaluate(() => window.__ravenConductor.paradas().map((z) => z.id));
    const visto = ['inicio'];
    let r = await empujar(120);
    ok(r.aviso, 'el aviso «Sigue para ir a …» se ve al empujar en el borde');
    ok(r.id === esperado[1], `empujar en el borde lleva a ${esperado[1]} (llegó a ${r.id})`);
    visto.push(r.id);
    for (let k = 2; k < esperado.length; k++) {
      r = await empujar(120); visto.push(r.id);
      if (r.id !== esperado[k]) { errores.push(`esperaba ${esperado[k]} tras ${esperado[k - 1]}, llegó a ${r.id} (y=${r.y})`); break; }
      if (r.id === 'faro-1') {
        const t = await p.evaluate(() => ({ k: document.querySelector('.faro').dataset.k, o: +getComputedStyle(document.querySelector('.faro')).opacity }));
        ok(t.k === '1' && t.o > 0.3, `en la parada del faro 2 se ve su rótulo (k=${t.k}, opacidad ${t.o.toFixed(2)})`);
        const c0 = await p.evaluate(() => [...window.__ravenBH.C]);
        await p.mouse.wheel({ deltaY: 100 }); await espera(1500);
        const d1 = await donde(), c1 = await p.evaluate(() => [...window.__ravenBH.C]), mov = Math.max(...c1.map((v, i) => Math.abs(v - c0[i])));
        // tolerancia: la cámara tiene un balanceo vivo de milésimas; un viaje entre faros la mueve unidades
        ok(d1.id !== 'faro-1' || mov < 0.02, `desplazarse dentro del faro no mueve la cámara (se movió ${mov.toFixed(4)}, ${d1.id})`);
      }
    }
    ok(visto.at(-1) === 'contacto', `recorrido completo hasta Contacto: ${visto.join(' → ')}`);

    // 3. en la última parada, empujar no lleva a ningún sitio
    r = await empujar(120);
    ok(r.id === 'contacto', 'empujar al final se queda en Contacto');

    // 4. volver una parada hacia arriba
    r = await empujar(-120);
    ok(r.id === esperado.at(-2), `subir desde Contacto lleva a ${esperado.at(-2)} (llegó a ${r.id})`);
    // 5. un salto (Fin) durante un viaje gana: no lo deshace el viaje en curso
    await p.keyboard.press('Home'); await espera(2500);
    await p.evaluate(() => { const z = window.__ravenConductor.paradas()[0]; scrollTo({ top: z.fin, behavior: 'instant' }); });
    await espera(500); await p.keyboard.press('PageDown'); await espera(250); await p.keyboard.press('End'); await espera(4500);
    r = await donde();
    ok(r.id === 'contacto', `Fin durante un viaje lleva a Contacto (llegó a ${r.id})`);

    // 6. cambiar el tamaño a mitad de un faro: sigue en ese faro
    await p.evaluate(() => { const z = window.__ravenConductor.paradas().find((x) => x.id === 'faro-2'); scrollTo({ top: Math.round((z.ini + z.fin) / 2), behavior: 'instant' }); window.__ravenConductor.trasSalto(); });
    await espera(1500); await p.setViewport({ width: 1280, height: 720 }); await espera(2000);
    r = await donde();
    ok(r.id === 'faro-2', `tras cambiar el tamaño sigue en el faro 3 (está en ${r.id})`);
    await p.close();

    // 7. móvil: Sobre mí se lee entera dentro de su parada
    const m = await b.newPage(); await m.setViewport({ width: 390, height: 844 });
    m.on('pageerror', (e) => errores.push(`móvil: JS ${e.message}`));
    await m.goto(url, { waitUntil: 'load' }); await espera(5000);
    const lee = await m.evaluate(async () => {
      const z = window.__ravenConductor.paradas().find((x) => x.id === 'sobre-mi'), card = document.querySelector('#sobre-mi .cristal');
      scrollTo({ top: z.ini, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300)); const a = card.getBoundingClientRect().top;
      scrollTo({ top: z.fin, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300)); const f = card.getBoundingClientRect().bottom;
      return { arriba: Math.round(a), abajo: Math.round(f), alto: innerHeight };
    });
    ok(lee.arriba >= 0 && lee.abajo <= lee.alto, `móvil: Sobre mí se ve de principio (${lee.arriba}px) a fin (${lee.abajo}px de ${lee.alto}) sin salir de su parada`);
    await m.close();
  } finally { await b.close(); }
  return { errores, pasos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errores, pasos } = await humoParadas({ url: process.argv[2] });
  for (const s of pasos) console.log(`✓ ${s}`);
  for (const e of errores) console.log(`✗ ${e}`);
  process.exit(errores.length ? 1 : 0);
}
