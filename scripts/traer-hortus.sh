#!/bin/sh
# Copia Hortus (rama main) a demos/hortus en modo demostración: en la web no hay hortus.py que mande
# los sensores, así que la página entra sola con ?demo (datos simulados) y lleva un rótulo discreto.
set -e
ORIGEN="$HOME/Proyectos/hortus"
DESTINO="$(dirname "$0")/../demos/hortus"
rm -rf "$DESTINO"; mkdir -p "$DESTINO"
git -C "$ORIGEN" archive main index.html js fuentes | tar -x -C "$DESTINO"

python3 - "$DESTINO/index.html" <<'EOF'
import sys
f = sys.argv[1]; s = open(f, encoding='utf-8').read()
entrar = '<script>if (!new URLSearchParams(location.search).has("demo")) location.replace("?demo" + (location.search ? "&" + location.search.slice(1) : ""));</script>\n'
s = s.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="icon" href="data:,">\n' + entrar, 1)
rotulo = '''<div id="rotulo">
  <b>Hortus Algorithmicus</b> · fondo de escritorio vivo: cada dato del equipo lo dibuja el algoritmo que de verdad hace ese trabajo
  (disco = árbol B+, red = Dijkstra, RAM = micorrizas, CPU = Juego de la Vida, temperatura = clima difuso).
  <a href="../">← Volver a Raven</a>
</div>
<style>
  #rotulo { position: fixed; left: 16px; bottom: 16px; max-width: min(560px, calc(100vw - 32px)); z-index: 5;
    font: 13px/1.5 system-ui, sans-serif; color: #c9cfdd; background: rgb(4 6 14 / 0.9);
    border: 1px solid rgb(201 207 221 / 0.18); border-radius: 10px; padding: 10px 14px;
    transition: opacity 1.2s; }
  #rotulo a { color: #e8d9a8; margin-left: 4px; white-space: nowrap; }
  #rotulo.tenue { opacity: 0; }
  #rotulo.tenue:hover { opacity: 1; }
</style>
<script>setTimeout(() => document.getElementById("rotulo").classList.add("tenue"), 9000);</script>
'''
s = s.replace('</body>', rotulo + '</body>', 1)
open(f, 'w', encoding='utf-8').write(s)
EOF
# Menos tráfico simulado que en la demo de escritorio: cada 50 kB es un LED con estela y, con
# ~2 MB/s, la constelación se llenaba de luces y los fps caían en navegadores normales.
sed -i -e 's/420000 \* (0.6/90000 * (0.6/' -e 's/bajada: 1500000, subida: 20000/bajada: 180000, subida: 20000/' "$DESTINO/js/escena.js"
grep -q "bajada: 180000" "$DESTINO/js/escena.js" || { echo "No se pudo reducir el tráfico simulado de Hortus" >&2; exit 1; }
echo "Hortus copiado en $DESTINO ($(du -sh "$DESTINO" | cut -f1))"
