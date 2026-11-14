// Trae la demo de un proyecto desde su repo: clon superficial de la rama publicada, lectura de raven.json,
// ejecución de «construir» (sin ningún secreto del entorno) y copia de la carpeta resultante filtrada por
// «incluir». Uso en CI: node herramientas/demos.mjs <id> <repo> <rama> <destino>
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// variables que sí pasan al build de una demo: nada de tokens ni credenciales
const PERMITIDAS = ['PATH', 'HOME', 'LANG', 'TMPDIR', 'CI', 'CHROME', 'npm_config_cache', 'NODE_OPTIONS'];
const entornoLimpio = () => Object.fromEntries(PERMITIDAS.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]]));

export async function traerDemo({ repo, rama, destino, id }) {
  const tmp = mkdtempSync(join(tmpdir(), `demo-${id}-`));
  try {
    execFileSync('git', ['clone', '-q', '--depth', '1', '--branch', rama, repo, tmp], { stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp }).toString().trim();
    const ruta = join(tmp, 'raven.json');
    if (!existsSync(ruta)) return { demo: false, commit };
    const { demo } = JSON.parse(readFileSync(ruta, 'utf8'));
    if (!demo) return { demo: false, commit };
    const carpeta = resolve(tmp, demo.carpeta ?? '.');
    if (carpeta !== tmp && !carpeta.startsWith(tmp + '/')) throw new Error(`«${id}»: la carpeta de la demo sale del repo (${demo.carpeta})`);
    if (demo.construir) {
      try { execFileSync('sh', ['-c', demo.construir], { cwd: tmp, env: entornoLimpio(), stdio: 'inherit' }); }
      catch (e) { throw new Error(`«${id}»: falló la construcción de la demo (${demo.construir})`); }
    }
    if (!existsSync(carpeta)) throw new Error(`«${id}»: no existe la carpeta de la demo (${demo.carpeta})`);
    rmSync(destino, { recursive: true, force: true }); mkdirSync(destino, { recursive: true });
    const incluir = demo.incluir;
    if (incluir) for (const n of incluir) cpSync(join(carpeta, n), join(destino, n), { recursive: true });
    else cpSync(carpeta, destino, { recursive: true, filter: (o) => !/\/\.git(\/|$)/.test(o) });
    return { demo: true, commit };
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [id, repo, rama, destino] = process.argv.slice(2);
  const r = await traerDemo({ id, repo, rama, destino });
  console.log(JSON.stringify({ id, ...r }));
}
