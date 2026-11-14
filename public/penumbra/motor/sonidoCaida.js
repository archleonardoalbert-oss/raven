// El sonido de la caída, sintetizado: un zumbido grave que sube al acercarse, y un rugido que crece con la velocidad.
export function crearSonido() {
  let ctx = null, gen = null, activo = true;
  try { activo = localStorage.getItem('penumbra-sonido') !== '0'; } catch { /* sin almacenamiento */ }
  function arrancar() {
    if (ctx || !activo) { ctx?.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    const sal = ctx.createGain(); sal.gain.value = 0; sal.connect(ctx.destination);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), go = ctx.createGain(); o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.value = 38; o2.frequency.value = 57.3; go.gain.value = 0.5; o1.connect(go); o2.connect(go); go.connect(sal); o1.start(); o2.start();
    const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let u = 0; for (let i = 0; i < n; i++) { u = (u + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = u * 3.5; }
    const ru = ctx.createBufferSource(); ru.buffer = b; ru.loop = true; const fi = ctx.createBiquadFilter(); fi.type = 'lowpass'; fi.frequency.value = 200; const gr = ctx.createGain(); gr.gain.value = 0.1; ru.connect(fi); fi.connect(gr); gr.connect(sal); ru.start();
    gen = { sal, o1, o2, fi, gr };
  }
  addEventListener('pointerdown', arrancar); addEventListener('keydown', arrancar); addEventListener('wheel', arrancar, { passive: true });
  return {
    get activo() { return activo; },
    alternar() { activo = !activo; try { localStorage.setItem('penumbra-sonido', activo ? '1' : '0'); } catch { /* sin almacenamiento */ } if (activo) arrancar(); else if (gen) gen.sal.gain.setTargetAtTime(0, ctx.currentTime, 0.1); return activo; },
    /** cerca: 0 lejos, 1 en el horizonte. rapidez: 0 quieto, 1 cayendo a toda velocidad. */
    actualizar(cerca, rapidez) { if (!gen || !activo) return; const q = ctx.currentTime; gen.sal.gain.setTargetAtTime(0.16 + 0.2 * cerca, q, 0.4); gen.o1.frequency.setTargetAtTime(34 + 26 * cerca + 14 * rapidez, q, 0.25); gen.o2.frequency.setTargetAtTime(51 + 44 * cerca + 22 * rapidez, q, 0.25); gen.fi.frequency.setTargetAtTime(150 + 500 * cerca + 1500 * rapidez, q, 0.15); gen.gr.gain.setTargetAtTime(0.05 + 0.12 * cerca + 0.75 * rapidez, q, 0.15); },
  };
}
