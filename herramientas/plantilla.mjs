// Rellena una plantilla HTML con los textos de contenido/. Marcadores:
//   {{t clave}}    → <span lang="es">…</span><span lang="en">…</span> (HTML en línea de confianza, tal cual)
//   {{es clave}}   → solo el español, escapado (para atributos y <meta>); {{en clave}} igual en inglés
//   {{es-html clave}} / {{en-html clave}} → un idioma sin escapar (bloques con párrafos)
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

// ¿La posición `i` cae dentro de una etiqueta (un atributo) o de <title>? Ahí el modo edición no puede marcar.
export function enAtributo(html, i) {
  return html.lastIndexOf('<', i - 1) > html.lastIndexOf('>', i - 1) || html.lastIndexOf('<title', i) > html.lastIndexOf('</title>', i);
}

// `marcar` (modo edición del Manager): nombre del archivo lógico ('textos', 'paginas/<id>'); cada texto sale con
// data-raven-texto="<marcar>|<clave>" para que el editor visual sepa qué se pincha. Nunca en la web pública.
export function rellenar(html, textos, { archivo = '¿?', marcar = null } = {}) {
  return html.replace(/\{\{(t|es|en|es-html|en-html|json) ([\w.-]+)\}\}/g, (_, tipo, clave, i) => {
    const v = buscar(textos, clave, archivo);
    if (tipo === 'json') return JSON.stringify(v);
    const m = marcar && !enAtributo(html, i) ? ` data-raven-texto="${marcar}|${clave}"` : '';
    if (tipo === 't') return `<span lang="es"${m}>${idioma(v, 'es', clave, archivo)}</span><span lang="en"${m}>${idioma(v, 'en', clave, archivo)}</span>`;
    const l = tipo.slice(0, 2), texto = tipo.endsWith('-html') ? idioma(v, l, clave, archivo) : escapar(idioma(v, tipo, clave, archivo));
    return m ? `<span${m} lang="${l}">${texto}</span>` : texto;
  });
}
