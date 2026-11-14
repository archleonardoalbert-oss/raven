// El lienzo de una escena: capa GL abajo, Canvas 2D encima y capa de rótulos KaTeX arriba, todas con las mismas
// coordenadas lógicas W × H y a la resolución real del dispositivo.

const CUBRIR = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;';

export function soportaGL2() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export function crearLienzo(contenedor, { W, H, gl: usarGL = false }) {
  const raiz = document.createElement('div');
  raiz.className = 'lienzo';
  raiz.style.cssText = `position:relative;width:100%;aspect-ratio:${W}/${H};overflow:hidden;touch-action:none;`;
  let glCanvas = null, gl = null;
  if (usarGL) {
    glCanvas = document.createElement('canvas');
    glCanvas.style.cssText = CUBRIR;
    gl = glCanvas.getContext('webgl2', { antialias: true, alpha: false });
    raiz.append(glCanvas);
  }
  const lienzo2d = document.createElement('canvas');
  lienzo2d.style.cssText = CUBRIR;
  const g2d = lienzo2d.getContext('2d');
  const capaTex = document.createElement('div');
  capaTex.style.cssText = CUBRIR + 'pointer-events:none;';
  raiz.append(lienzo2d, capaTex);
  contenedor.append(raiz);

  let k = 1, generacion = 0, fnTamano = null;
  const elementos = new Map();

  function aplicar() {
    const rect = raiz.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    const pw = Math.round(rect.width * dpr), ph = Math.round(rect.height * dpr);
    for (const c of [glCanvas, lienzo2d]) if (c && (c.width !== pw || c.height !== ph)) { c.width = pw; c.height = ph; }
    k = pw / W;
    g2d.setTransform(1, 0, 0, 1, 0, 0);
    g2d.clearRect(0, 0, pw, ph);
    g2d.setTransform(k, 0, 0, k, 0, 0);
    for (const [clave, e] of elementos) if (e.gen !== generacion) { e.el.remove(); elementos.delete(clave); }
    generacion++;
  }

  /** Añade o actualiza rótulos: [{clave, x, y, tex, color, tam, ancla, alfa}] en coordenadas lógicas. */
  function rotular(lista) {
    const escalaCss = raiz.getBoundingClientRect().width / W;
    for (const r of lista) {
      const clave = r.clave ?? r.tex;
      let e = elementos.get(clave);
      if (!e) {
        const el = document.createElement('div');
        el.dataset.clave = clave;
        el.style.cssText = 'position:absolute;white-space:nowrap;line-height:1;text-shadow:0 0 5px #000,0 0 2px #000;';
        capaTex.append(el);
        e = { el, tex: null };
        elementos.set(clave, e);
      }
      if (e.tex !== r.tex) {
        if (window.katex) window.katex.render(r.tex, e.el, { throwOnError: false });
        else e.el.textContent = r.tex;
        e.tex = r.tex;
      }
      e.gen = generacion;
      const s = e.el.style, a = r.ancla ?? 'c';
      s.left = `${(r.x / W) * 100}%`;
      s.top = `${(r.y / H) * 100}%`;
      s.fontSize = `${(r.tam ?? 20) * escalaCss}px`;
      s.color = r.color ? `rgb(${r.color.join(',')})` : '#e8e4d8';
      s.opacity = String(r.alfa ?? 1);
      s.transform = `translate(${a === 'l' ? '0' : a === 'r' ? '-100%' : '-50%'},-50%)`;
    }
  }

  const obs = new ResizeObserver(() => { fnTamano?.(); });
  obs.observe(raiz);

  /** Bucle que solo corre con la escena a la vista. Devuelve la función para pararlo. */
  function animar(fn) {
    let visible = true, activo = true, ult = performance.now();
    const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.05 });
    io.observe(raiz);
    const cuadro = (ms) => {
      if (!activo) return;
      const dt = Math.min(0.05, (ms - ult) / 1000);
      ult = ms;
      if (visible) fn(dt);
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
    return () => { activo = false; io.disconnect(); };
  }

  return {
    W, H, raiz, gl, glCanvas, g2d, capaTex, aplicar, rotular, animar,
    escala: () => k,
    alTamano: (fn) => { fnTamano = fn; },
    pos(evento) {
      const r = raiz.getBoundingClientRect();
      return [((evento.clientX - r.left) * W) / r.width, ((evento.clientY - r.top) * H) / r.height];
    },
  };
}
