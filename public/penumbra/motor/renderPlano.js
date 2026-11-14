// Gráficas en plano sobre Canvas 2D, dentro de una caja del lienzo. Sirve para escenas enteras y para los paneles
// enlazados de las escenas 3D.
import { GRIS, GRIS2, TEXTO, escalaGrado, rgb } from './colores.js';

const coma = (v) => String(+v.toFixed(3)).replace('.', '{,}');

export function crearRenderPlano(lienzo, { x: [x0, x1], y: [y0, y1], caja, id = 'p' }) {
  const g = lienzo.g2d;
  const aX = (v) => caja.x + ((v - x0) / (x1 - x0)) * caja.w;
  const aY = (v) => caja.y + caja.h - ((v - y0) / (y1 - y0)) * caja.h;
  const deX = (px) => x0 + ((px - caja.x) / caja.w) * (x1 - x0);
  const deY = (py) => y0 + ((caja.y + caja.h - py) / caja.h) * (y1 - y0);
  const hoja = document.createElement('canvas'), mh = hoja.getContext('2d');
  let claveHoja = null;

  function pintarMapa(q) {
    const k = lienzo.escala(), w = Math.max(1, Math.round(caja.w * k)), h = Math.max(1, Math.round(caja.h * k));
    const clave = `${q.clave ?? Math.random()}|${w}|${h}`;
    if (clave !== claveHoja) {
      claveHoja = clave;
      hoja.width = w; hoja.height = h;
      const im = mh.createImageData(w, h);
      for (let j = 0, o = 0; j < h; j++) {
        const yy = y1 - ((j + 0.5) / h) * (y1 - y0);
        for (let i = 0; i < w; i++, o += 4) {
          const c = escalaGrado(Math.min(1, Math.max(0, q.f(x0 + ((i + 0.5) / w) * (x1 - x0), yy))));
          im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255;
        }
      }
      mh.putImageData(im, 0, 0);
    }
    g.save();
    if (q.desde !== undefined) { g.beginPath(); g.rect(caja.x, caja.y, caja.w, aY(q.desde) - caja.y); g.clip(); }
    g.imageSmoothingEnabled = false;
    g.drawImage(hoja, caja.x, caja.y, caja.w, caja.h);
    g.restore();
  }

  const trazo = (pts, c, w, a, dash) => {
    g.save();
    g.strokeStyle = rgb(c, a); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    if (dash) g.setLineDash(dash === true ? [4, 5] : dash);
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(aX(p[0]), aY(p[1])) : g.moveTo(aX(p[0]), aY(p[1]))));
    g.stroke();
    g.restore();
  };

  function dibujar(prims) {
    const rotulos = [];
    for (const q of prims) {
      if (q.tipo === 'mapaCalor') pintarMapa(q);
      else if (q.tipo === 'marco') {
        const a = q.alfa ?? 1, et = q.etiquetas ?? {}, tx = q.ticks?.x ?? [x0, (x0 + x1) / 2, x1], ty = q.ticks?.y ?? [y0, y1];
        trazo([[x0, y0], [x1, y0]], GRIS2, 1.4, a);
        if (!q.soloBase) { trazo([[x0, y0], [x0, y1]], GRIS2, 1.4, a); trazo([[x0, y1], [x1, y1]], GRIS, 1, 0.3 * a, [3, 6]); }
        tx.forEach((v) => { trazo([[v, y0], [v, y0]], GRIS2, 1, a); rotulos.push({ clave: `${id}tx${v}`, x: aX(v), y: aY(y0) + 15, tex: coma(v), tam: 15, color: GRIS2, alfa: a }); });
        ty.forEach((v) => rotulos.push({ clave: `${id}ty${v}`, x: aX(x0) - 11, y: aY(v), tex: coma(v), tam: 15, color: GRIS2, ancla: 'r', alfa: a }));
        if (et.x) {
          const libreAbajo = !tx.some((v) => Math.abs(aX(v) - aX((x0 + x1) / 2)) < 100);
          rotulos.push(libreAbajo ? { clave: `${id}ex`, x: aX((x0 + x1) / 2), y: aY(y0) + 16, tex: et.x, tam: 19, color: GRIS2, alfa: a } : { clave: `${id}ex`, x: aX(x1), y: aY(y0) - 16, tex: et.x, tam: 19, ancla: 'r', color: GRIS2, alfa: a });
        }
        if (et.y) {
          // una letra cabe junto al eje; una palabra no: se pone encima, para que no se corte ni pise los números
          const largo = et.y.includes('\\text');
          rotulos.push(largo ? { clave: `${id}ey`, x: aX(x0) + 2, y: aY(y1) - 15, tex: et.y, tam: 17, color: q.colorY ?? GRIS2, ancla: 'l', alfa: a } : { clave: `${id}ey`, x: aX(x0) - 40, y: aY((y0 + y1) / 2), tex: et.y, tam: 26, color: q.colorY ?? TEXTO, alfa: a });
        }
      } else if (q.tipo === 'poligono') {
        g.fillStyle = rgb(q.color ?? GRIS, q.alfa ?? 1);
        g.beginPath();
        q.puntos.forEach((p, i) => (i ? g.lineTo(aX(p[0]), aY(p[1])) : g.moveTo(aX(p[0]), aY(p[1]))));
        g.closePath(); g.fill();
      } else if (q.tipo === 'linea') trazo([q.de, q.a], q.color ?? GRIS2, q.ancho ?? 2, q.alfa ?? 1, q.discontinua);
      else if (q.tipo === 'curva') {
        if (q.colorPor) {
          for (let i = 0; i + 1 < q.puntos.length; i++) {
            const s = [q.puntos[i], q.puntos[i + 1]], c = q.colorPor(s[0], s[1]);
            if (q.brillo) trazo(s, c, (q.ancho ?? 3) * 2.5, 0.1 * (q.alfa ?? 1));
            trazo(s, c, q.ancho ?? 3, q.alfa ?? 1);
          }
        } else {
          if (q.brillo) trazo(q.puntos, q.color ?? GRIS2, (q.ancho ?? 3) * 2.5, 0.12 * (q.alfa ?? 1));
          trazo(q.puntos, q.color ?? GRIS2, q.ancho ?? 3, q.alfa ?? 1, q.discontinua);
        }
      } else if (q.tipo === 'punto') {
        const c = q.color ?? [255, 255, 255];
        g.save();
        g.globalAlpha = q.alfa ?? 1; g.fillStyle = rgb(c); g.shadowColor = rgb(c); g.shadowBlur = q.halo ?? 12;
        g.beginPath(); g.arc(aX(q.p[0]), aY(q.p[1]), q.radio ?? 6, 0, 7); g.fill();
        g.restore();
      } else if (q.tipo === 'rotulo') {
        rotulos.push({ clave: q.clave ? `${id}${q.clave}` : undefined, x: aX(q.p[0]) + (q.dx ?? 0), y: aY(q.p[1]) + (q.dy ?? 0), tex: q.tex, tam: q.tam, color: q.color, ancla: q.ancla, alfa: q.alfa });
      }
    }
    lienzo.rotular(rotulos);
  }

  return { dibujar, aX, aY, deX, deY, caja };
}
