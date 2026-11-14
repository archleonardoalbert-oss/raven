#!/bin/sh
# Copia la versión de master de Penumbra a public/penumbra (mismo conjunto que empaquetar/construir.sh).
set -e
ORIGEN="$HOME/Leo/Tutoriales/LogicaDifusa"
DESTINO="$(dirname "$0")/../public/penumbra"
rm -rf "$DESTINO"; mkdir -p "$DESTINO"
git -C "$ORIGEN" archive master index.html concepto.html horizonte.html favicon.svg css motor nucleo contenido vendor \
  | tar -x -C "$DESTINO"
echo "Penumbra copiada en $DESTINO ($(du -sh "$DESTINO" | cut -f1))"
