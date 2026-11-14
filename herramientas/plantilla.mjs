// Rellena una plantilla HTML con los textos de contenido/. Marcadores:
//   {{t clave}}    → <span lang="es">…</span><span lang="en">…</span> (HTML en línea de confianza, tal cual)
//   {{es clave}}   → solo el español, escapado (para atributos y <meta>); {{en clave}} igual en inglés
//   {{json clave}} → el valor como JSON (datos dentro de un <script>)
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function buscar(textos, clave, archivo) {
  const v = clave.split('.').reduce((o, k) => (o == null ? undefined : o[k]), textos);
  if (v === undefined) throw new Error(`Falta el texto «${clave}» en ${archivo}`);
  return v;
}
function idioma(v, l, clave, archivo) {
  if (typeof v?.[l] !== 'string') throw new Error(`Falta el texto «${clave}» (idioma ${l}) en ${archivo}`);
  return v[l];
}

export function rellenar(html, textos, { archivo = '¿?' } = {}) {
  return html.replace(/\{\{(t|es|en|json) ([\w.-]+)\}\}/g, (_, tipo, clave) => {
    const v = buscar(textos, clave, archivo);
    if (tipo === 'json') return JSON.stringify(v);
    if (tipo === 't') return `<span lang="es">${idioma(v, 'es', clave, archivo)}</span><span lang="en">${idioma(v, 'en', clave, archivo)}</span>`;
    return escapar(idioma(v, tipo, clave, archivo));
  });
}
