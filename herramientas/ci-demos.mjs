// Orquesta las demos en GitHub Actions. La caché (carpeta restaurada por actions/cache) guarda la última demo
// buena de cada proyecto con su commit en <cache>/<id>/.commit. Para cada proyecto con demo: si el commit de su
// rama publicada no cambió, se reutiliza; si cambió, se construye; si la construcción falla, se usa la última
// buena (y se anota). Devuelve si algo cambió y una huella para decidir si hay que desplegar.
// Uso en CI: node herramientas/ci-demos.mjs <cache> <demos>
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { traerDemo } from './demos.mjs';

const leerCommit = (d) => (existsSync(join(d, '.commit')) ? readFileSync(join(d, '.commit'), 'utf8').trim() : null);

export async function actualizarDemos({ proyectos, cache, demos, remotos, traer = traerDemo, ahora = () => new Date().toISOString() }) {
  const conDemo = proyectos.filter((p) => p.demo && p.repo);
  const shas = await remotos(conDemo);
  const lineas = [], usados = [], estado = {};  // estado: lo que el Manager muestra de cada demo
  let cambiado = false;
  for (const p of conDemo) {
    const enCache = join(cache, p.id), salida = join(demos, p.id), previo = leerCommit(enCache);
    if (previo && previo === shas[p.id]) { lineas.push(`- ${p.id}: sin cambios (${previo.slice(0, 7)})`); }
    else {
      try {
        const nuevo = join(cache, `.${p.id}-nuevo`);
        const r = await traer({ id: p.id, repo: p.repo, rama: p.rama, destino: nuevo });
        if (r.demo) {
          rmSync(enCache, { recursive: true, force: true }); cpSync(nuevo, enCache, { recursive: true }); writeFileSync(join(enCache, '.commit'), r.commit); writeFileSync(join(enCache, '.fecha'), ahora());
          lineas.push(`- ${p.id}: demo reconstruida (${r.commit.slice(0, 7)})`);
        } else { rmSync(enCache, { recursive: true, force: true }); lineas.push(`- ${p.id}: su repo no tiene raven.json: sin demo`); }
        rmSync(nuevo, { recursive: true, force: true });
        cambiado = true;
      } catch (e) {
        estado[p.id] = { ok: false, nota: e.message };
        lineas.push(`- ${p.id}: ${e.message}. ${previo ? `Se publica la última demo buena (${previo.slice(0, 7)}).` : 'No hay demo previa: se publica sin demo.'}`);
      }
    }
    const c = leerCommit(enCache);
    if (c) { rmSync(salida, { recursive: true, force: true }); cpSync(enCache, salida, { recursive: true, filter: (o) => !o.endsWith('/.commit') && !o.endsWith('/.fecha') }); usados.push(`${p.id}:${c}`); }
    if (!estado[p.id]) estado[p.id] = c ? { ok: true, fecha: existsSync(join(enCache, '.fecha')) ? readFileSync(join(enCache, '.fecha'), 'utf8') : null, commit: c } : { ok: false, nota: 'sin demo' };
    else if (c) Object.assign(estado[p.id], { commit: c, anterior: true });
  }
  mkdirSync(demos, { recursive: true }); writeFileSync(join(demos, 'demos-estado.json'), JSON.stringify(estado, null, 2));
  return { cambiado, huella: usados.join(' '), resumen: lineas.join('\n') };
}

// commit de la rama publicada de cada repo, sin clonar
export async function remotosGit(proyectos) {
  const r = {};
  for (const p of proyectos) r[p.id] = execFileSync('git', ['ls-remote', `https://github.com/${p.repo}.git`, `refs/heads/${p.rama}`]).toString().split('\t')[0];
  return r;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cache, demos] = process.argv.slice(2);
  const proyectos = JSON.parse(readFileSync('contenido/proyectos.json', 'utf8'));
  const traer = (o) => traerDemo({ ...o, repo: `https://github.com/${o.repo}.git` });
  const r = await actualizarDemos({ proyectos, cache, demos, remotos: remotosGit, traer });
  console.log(r.resumen);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Demos\n${r.resumen}\n`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `cambiado=${r.cambiado}\nhuella=${r.huella}\n`);
}
