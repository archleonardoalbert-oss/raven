// Extrae de un HTML los pares <span|div lang="es">…</…><span|div lang="en">…</…> y los sustituye por marcadores
// {{t clave}}; la clave es «sección.n» (sección = id de la <section>/<header>/<footer> que lo contiene).
// Devuelve { plantilla, textos }. Herramienta de migración (Fase 1) y de uso futuro al importar páginas.
const PAR = /<(span|div) lang="es">([\s\S]*?)<\/\1>\s*<\1 lang="en">([\s\S]*?)<\/\1>/g;

export function extraerTextos(html, { prefijo = '' } = {}) {
  const textos = {}, cuenta = {};
  const seccionEn = (pos) => {
    const antes = html.slice(0, pos);
    const m = [...antes.matchAll(/<(section|header|footer|div|article)\b[^>]*\bid="([^"]+)"/g)].at(-1);
    const abre = [...antes.matchAll(/<(header|footer)\b[^>]*class="([\w-]+)/g)].at(-1);
    if (abre && (!m || abre.index > m.index)) return abre[2];
    return m ? m[2] : 'general';
  };
  const plantilla = html.replace(PAR, (todo, etq, es, en, pos) => {
    const s = (prefijo + seccionEn(pos)).replace(/[^\w-]/g, '-');
    cuenta[s] = (cuenta[s] ?? 0) + 1;
    (textos[s] ??= {})[cuenta[s]] = { es: es.trim(), en: en.trim() };
    return etq === 'div' ? `<div lang="es">{{es-html ${s}.${cuenta[s]}}}</div><div lang="en">{{en-html ${s}.${cuenta[s]}}}</div>` : `{{t ${s}.${cuenta[s]}}}`;
  });
  return { plantilla, textos };
}
