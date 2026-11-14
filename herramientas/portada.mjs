// Piezas de la portada que dependen del catálogo: las secciones de los proyectos principales (planetas), las
// salidas entre ellas y los nombres que la escena 3D coloca sobre cada estrella.
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const MAX_PRINCIPALES = 3;

export function validarProyectos(proyectos) {
  const vistos = new Set();
  for (const p of proyectos) { if (vistos.has(p.id)) throw new Error(`Proyecto repetido: ${p.id}`); vistos.add(p.id); }
  const n = proyectos.filter((p) => p.principal).length;
  if (n > MAX_PRINCIPALES) throw new Error(`Como mucho 3 proyectos principales (hay ${n})`);
}

const bilingue = (v) => `<span lang="es">${v.es}</span><span lang="en">${v.en}</span>`;
const SALIDA = '  <div class="salida" data-camara="0,95,80|0,0,0" data-mantener="0" aria-hidden="true"></div>\n';

function seccion(p, sistema, textos) {
  if (!sistema?.camara) throw new Error(`Falta el sistema planetario de ${p.id} (contenido/sistemas/${p.id}.json)`);
  return `  <section class="capitulo proyecto" id="p-${p.id}" data-camara="${sistema.camara.escritorio}" data-camara-movil="${sistema.camara.movil}" style="--tinte: ${p.tinte}">
    <article class="cristal tarjeta">
      <div class="vista"><img src="proyectos/${p.id}/media/miniatura.webp" alt="" loading="lazy"><video data-src="proyectos/${p.id}/media/${p.id}.mp4" muted loop playsinline preload="none"></video></div>
      <p class="tipo">${bilingue(p.tipo)}</p>
      <h3 class="t-${p.id}" style="font-family: '${esc(p.fuente)}', Georgia, serif; color: ${p.color}">${esc(p.nombre)}</h3>
      <p>${bilingue(p.desc)}</p>
      <a class="boton" href="proyectos/${p.id}/">${bilingue(textos.proyectos.conocer)}</a>
    </article>
  </section>
`;
}

export function seccionesPrincipales(proyectos, sistemas, textos) {
  return proyectos.filter((p) => p.principal).map((p) => seccion(p, sistemas[p.id], textos)).join(`\n${SALIDA}\n`);
}

export function nombresMundo(proyectos) {
  return proyectos.filter((p) => p.principal).map((p) => `<span class="nombre-mundo" data-mundo="${p.id}">${esc(p.nombre)}</span>`).join('\n  ');
}
