#!/bin/sh
# Publica la demo de solo lectura del Semillero en demos/semillero.
# 1) copia filtrada de datos con SOLO las ideas autorizadas (sin ajustes, notas, registros ni PDF de terceros)
# 2) servidor desechable sobre esa copia (Claude desactivado) y grabación de las respuestas de la API
# 3) compila la interfaz en modo demo (rama demo-publica del Semillero) y lo junta todo
set -e
IDEAS="cursos/ai neurociencia/ablacion-virtual-espectral-del-conectoma-de-c-elegans-frente"; export IDEAS
SEM="$HOME/Proyectos/semillero"; WT="$SEM/.worktrees/demo-publica"
RAVEN="$(cd "$(dirname "$0")/.." && pwd)"; DESTINO="$RAVEN/demos/semillero"
TMP="$(mktemp -d)"; trap 'kill $PID 2>/dev/null; rm -rf "$TMP"' EXIT

mkdir -p "$TMP/demo-datos/carpetas"; : > "$TMP/demo-datos/notas-globales.md"
for par in $IDEAS; do
  c=${par%%/*}; i=${par#*/}; mkdir -p "$TMP/demo-datos/carpetas/$c/ideas"
  cp "$SEM/datos/carpetas/$c/carpeta.json" "$TMP/demo-datos/carpetas/$c/"; : > "$TMP/demo-datos/carpetas/$c/notas.md"
  rsync -a --exclude registro --exclude 'germinacion/recursos' "$SEM/datos/carpetas/$c/ideas/$i" "$TMP/demo-datos/carpetas/$c/ideas/"
done

if lsof -ti:4418 >/dev/null 2>&1; then echo "El puerto 4418 está ocupado: para ese proceso antes de seguir" >&2; exit 1; fi
(cd "$SEM" && SEMILLERO_DATOS="$TMP/demo-datos" SEMILLERO_PUERTO=4418 SEMILLERO_CLAUDE=/bin/false exec node server/index.js >"$TMP/servidor.log" 2>&1) & PID=$!
sleep 3
SEMILLERO="$SEM" node "$RAVEN/scripts/semillero/grabar.mjs" "$TMP"
kill $PID 2>/dev/null || true

(cd "$WT/web" && npx vite build --config vite.demo.config.js --logLevel warn)
rm -rf "$DESTINO"; cp -r "$WT/web/dist-demo" "$DESTINO"
mkdir -p "$DESTINO/demo/archivos"
cp "$TMP/paquete-demo.json" "$DESTINO/demo/paquete.json"
cp -r "$TMP/demo-datos/carpetas" "$DESTINO/demo/archivos/"
find "$DESTINO/demo/archivos" -name idea.json -delete
# Las webs de curso piden el puente en la raíz del sitio; aquí vive junto a la demo.
find "$DESTINO/demo/archivos" -name "*.html" -exec sed -i 's|src="/semillero-puente.js"|src="/semillero/semillero-puente.js"|g' {} +
echo "Semillero (demo) en $DESTINO ($(du -sh "$DESTINO" | cut -f1))"
