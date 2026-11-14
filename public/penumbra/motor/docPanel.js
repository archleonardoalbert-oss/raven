// La documentación de fuzzython: un panel que se abre sobre la parada, y al cerrarlo sigues donde estabas.
import { DOC } from '../contenido/docFuzzython.js';
import { SALIDAS } from '../contenido/parte14/salidas.js';
const sinTiempos = (s) => s.replace(/^\[.* system time\] compute.*\n?/gm, '');
const quitarMarcas = (t) => t.replace(/<[^>]+>/g, ' ').replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1');
const textoDe = (s) => [s.titulo, ...s.bloques.flatMap((b) => [b.p, b.h, b.aviso, b.cod, b.pre, b.esquema, ...(b.lista ?? []), ...(b.tabla ?? []).flat()])].filter(Boolean).map(quitarMarcas).join(' ').toLowerCase();
/** Quien filtra escribe una o más palabras: una sección vale si las contiene todas. */
export const coincide = (texto, consulta) => consulta.toLowerCase().split(/\s+/).filter(Boolean).every((p) => texto.includes(p));
export function crearDoc({ h, prosa, pintarTex, colorear }) {
  let panel = null;
  const bloqueCodigo = (cod, etiqueta) => {
    const copiar = h('button', { type: 'button', className: 'doc-copiar', textContent: 'Copiar' });
    copiar.addEventListener('click', async () => { try { await navigator.clipboard.writeText(cod); copiar.textContent = 'Copiado'; } catch { copiar.textContent = 'No se pudo copiar'; } setTimeout(() => { copiar.textContent = 'Copiar'; }, 1600); });
    return h('div', { className: 'doc-codigo' }, copiar, h('pre', { className: 'codigo', tabIndex: 0, innerHTML: colorear(cod) }), etiqueta);
  };
  const salida = (cod) => { const s = sinTiempos(SALIDAS[cod] ?? '').trimEnd(); return s ? h('div', {}, h('p', { className: 'salida-rot', textContent: 'Lo que imprime, ejecutado de verdad' }), h('pre', { className: 'salida', tabIndex: 0, textContent: s })) : null; };
  function pintarBloque(b) {
    if (b.p) return h('p', { innerHTML: prosa(b.p) });
    if (b.h) return h('h3', { textContent: b.h });
    if (b.lista) return h('ul', {}, b.lista.map((x) => h('li', { innerHTML: prosa(x) })));
    if (b.aviso) return h('p', { className: 'doc-aviso', innerHTML: prosa(b.aviso) });
    if (b.pre) return h('pre', { className: 'codigo doc-pre', tabIndex: 0, textContent: b.pre });
    if (b.cod) return bloqueCodigo(b.cod, salida(b.cod));
    if (b.esquema) return bloqueCodigo(b.esquema, h('p', { className: 'salida-rot', textContent: 'Esquema: no se ha ejecutado aquí' }));
    if (b.tabla) { const [cab, ...filas] = b.tabla; return h('div', { className: 'doc-tabla', tabIndex: 0 }, h('table', {}, h('thead', {}, h('tr', {}, cab.map((c) => h('th', { innerHTML: prosa(c) })))), h('tbody', {}, filas.map((f) => h('tr', {}, f.map((c) => h('td', { innerHTML: prosa(c) })))))));  }
    return null;
  }
  function construir() {
    const cerrar = h('button', { type: 'button', className: 'doc-cerrar', textContent: 'Cerrar' }), busca = h('input', { type: 'search', className: 'doc-busca', placeholder: 'Buscar en la documentación', ariaLabel: 'Buscar en la documentación' }), vacio = h('p', { className: 'doc-vacio', hidden: true, textContent: 'Nada coincide con esa búsqueda. Prueba con otra palabra: por ejemplo, Polygon, norma o Sugeno.' });
    const cuerpo = h('main', { className: 'doc-cuerpo', tabIndex: -1 }), indice = h('nav', { className: 'doc-indice', ariaLabel: 'Apartados de la documentación' });
    const items = DOC.map((s, i) => {
      const sec = h('section', { id: `doc-${s.id}` }, h('h2', { textContent: `${i + 1}. ${s.titulo}` }), s.bloques.map(pintarBloque));
      const a = h('button', { type: 'button', className: 'doc-enlace', textContent: `${i + 1}. ${s.titulo}` });
      a.addEventListener('click', () => { sec.scrollIntoView({ block: 'start' }); });
      cuerpo.append(sec); indice.append(a);
      return { s, sec, a, texto: textoDe(s) };
    });
    cuerpo.append(vacio);
    const d = h('dialog', { className: 'doc', ariaLabel: 'Documentación de fuzzython' }, h('div', { className: 'doc-cab' }, h('h1', { textContent: 'fuzzython, de la A a la Z' }), busca, cerrar), h('div', { className: 'doc-marco' }, indice, cuerpo));
    cerrar.addEventListener('click', () => d.close());
    // la parada escucha el teclado: aquí dentro no debe enterarse
    d.addEventListener('keydown', (e) => { if (e.key !== 'Escape') e.stopPropagation(); });
    busca.addEventListener('input', () => { const q = busca.value.trim(); let n = 0; for (const it of items) { const ok = !q || coincide(it.texto, q); it.sec.hidden = !ok; it.a.hidden = !ok; if (ok) n++; } vacio.hidden = n > 0; cuerpo.scrollTop = 0; });
    const marcar = () => { const top = cuerpo.getBoundingClientRect().top + 40; let act = null; for (const it of items) if (!it.sec.hidden && it.sec.getBoundingClientRect().top <= top) act = it; for (const it of items) it.a.classList.toggle('activo', it === (act ?? items[0])); };
    cuerpo.addEventListener('scroll', marcar, { passive: true });
    document.body.append(d);
    pintarTex?.(d);
    marcar();
    return d;
  }
  return { abrir() { panel ??= construir(); panel.showModal(); return panel; } };
}
