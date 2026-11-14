// Vuelca el texto visible de cada .html de una carpeta, por idioma: sirve de referencia para comprobar que
// construir el sitio desde datos no pierde ni cambia ningún texto. Uso: node herramientas/volcar-textos.mjs <dir>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';

const DEMOS = new Set(['penumbra', 'semillero', 'hortus']);
const OMITIR = new Set(['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT']);
const limpio = (t) => t.replace(/\s+/g, ' ').trim();

function htmls(dir, base = dir) {
  const r = [];
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!(dir === base && DEMOS.has(n))) r.push(...htmls(p, base)); }
    else if (n.endsWith('.html')) r.push(p);
  }
  return r;
}

// recorre en orden de documento; cada bloque de texto queda con el idioma del ancestro más cercano con lang
function recorrer(nodo, lang, salida) {
  for (const h of nodo.childNodes) {
    if (h.nodeType === 3) { const t = limpio(h.text); if (t && !/^<!doctype/i.test(t)) salida.push([lang, t]); continue; }
    if (h.nodeType !== 1 || OMITIR.has(h.tagName)) continue;
    // los <meta> con nombre también son texto de la página (título, descripción, vista previa)
    if (h.tagName === 'META') { const n = h.getAttribute('name') || h.getAttribute('property'); if (n && h.getAttribute('content')) salida.push([`meta:${n}`, h.getAttribute('content')]); continue; }
    const l = h.tagName === 'HTML' ? null : h.getAttribute('lang');  // el lang del documento no cuenta
    recorrer(h, l && l !== 'es' && l !== 'en' ? lang : (l ?? lang), salida);
  }
}
export function volcarTextos(dir) {
  const r = {};
  for (const f of htmls(dir)) {
    const raiz = parse(readFileSync(f, 'utf8'), { comment: false });
    const salida = [];
    recorrer(raiz, null, salida);
    r[relative(dir, f)] = salida;
  }
  return r;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(volcarTextos(process.argv[2] ?? 'sitio'), null, 1));
