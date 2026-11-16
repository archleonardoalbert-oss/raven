# Caída limpia y botón para cruzar · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que la escena del agujero negro sea continua (sin saltos ni cambios bruscos de velocidad), con los 5 faros en
la aproximación, un botón tambaleante en la vista final para cruzar el horizonte y ver el resumen, y una retirada
rápida hacia Proyectos si se sigue con el scroll.

**Architecture:**
- **Curva:** un módulo puro, `sitio/assets/curva-caida.js`, da la pose de la cámara en función del progreso de la
  sección, con una spline monótona por los faros, la pausa y la retirada.
- **Suavizado:** `galaxia.js` suaviza el scroll con un muelle críticamente amortiguado, lo expone y copia la pose de la
  caída sin perseguirla.
- **Escena:** `agujero.js` usa la curva, y el botón, la caída por tiempo y la capa del resumen viven en un módulo nuevo,
  `cruzar.js`.

**Spec:** `docs/superpowers/specs/2026-11-16-agujero-negro-limpio-y-boton-design.md`

## Global Constraints

- **Continuidad:** sin saltos de posición, y cambio de velocidad entre cuadros por debajo del 25 % fuera del arranque y
  del frenado, a velocidad constante y con pasos de rueda reales.
- **Faros:** 5, con su rótulo junto al faro, el grupo «n / 5» con su lema y el reloj; todos antes del punto del botón
  (r ≈ 2,8).
- **Tramos orientativos:** aproximación 0–0,72; pausa de unos 0,14; retirada hasta 1. La retirada recorre la curva al
  revés y sale con velocidad hacia Proyectos.
- **Botón:** «Cruzar el horizonte / todas mis habilidades» (EN «Cross the horizon / all my skills»).
- **Caída por tiempo:** 3,5 s (2,5 s en móvil), con el scroll bloqueado; con movimiento reducido, el resumen aparece
  al momento.
- **Capa del resumen:** fija, con «Seguir a Proyectos» / «On to Projects»; también se cierra con `Esc` o con un scroll
  al final de la lista; siempre aterriza en Proyectos tras el destello.
- **Pruebas:** Node para la curva; medición y humo en Firefox oculto. **Commits:** con
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Publicar en `main` al terminar.

## Review Focus

1. Relevo galaxia → caída y caída → galaxia (retirada → Proyectos): sin salto ni parón. → Tasks 3 y 5.
2. Pasos de rueda reales: la velocidad no da tirones (muelle de segundo orden). → Tasks 3 y 5.
3. El bloqueo del scroll durante la caída siempre se libera (también si se cierra pronto o hay un error). → Task 4.
4. Volver hacia arriba desde Proyectos: la retirada al revés y el botón vuelve a aparecer. → Task 5.
5. «Ver todo de una vez» durante la aproximación abre la capa y cerrarla lleva a Proyectos. → Task 4.

---

### Task 1: Medición de base
**Files:** `herramientas/medir-caida.mjs`, `sitio/assets/galaxia.js` (expone `window.__ravenCamara`)
- Se recorre la sección `#habilidades` y su relevo a Proyectos a velocidad constante (`scrollTo` cada cuadro) y con
  pasos de rueda reales (`mouse.wheel` de 100 cada 90 ms).
- Se registra la posición de la cámara cuadro a cuadro y se calculan la velocidad en escala logarítmica de la distancia
  al centro (más el ángulo), los saltos y el cambio de velocidad entre cuadros (el percentil 99 y el máximo).
- [ ] Línea base registrada en el diario.

### Task 2: Curva continua (Node)
**Files:** `sitio/assets/curva-caida.js`, `test/curva-caida.test.mjs`
**Produces:**
- `crearCurva({ R0, radiosFaros, rBoton, azs }) → { pose(p) → { r, az, k, fase } }`:
  - `k` es el índice continuo de faro (0…4) y `fase` vale `'aproximacion' | 'pausa' | 'retirada'`;
  - `TRAMOS = { aprox: 0.72, pausa: 0.86 }`.
- `splineMonotona(xs, ys) → (x) → y` (Fritsch–Carlson).
- [ ] Pruebas:
  - la curva pasa por los nudos;
  - es continua en valor y en derivada en cada nudo (diferencia relativa por debajo del 2 %);
  - `log r` es monótona en la aproximación;
  - pose constante en la pausa;
  - la retirada termina en `R0` con velocidad distinta de 0;
  - la velocidad es continua en 0,72 (frenado hasta 0) y en el paso de la pausa a la retirada.

### Task 3: Integración en la escena
**Files:** `sitio/assets/galaxia.js`, `sitio/assets/agujero.js`, `sitio/assets/nav.js`, `plantillas/index.html`,
`sitio/assets/raven.css`
- **`galaxia.js`:**
  - `yS` pasa a muelle críticamente amortiguado (`ω ≈ 10`, equivalente al filtro actual), con `window.__ravenYS()`;
  - dentro de la caída, la cámara copia la pose de la caída, sin `lerp`/`slerp`/`fov` perseguido.
- **`agujero.js`:**
  - `p` sale de `__ravenYS`;
  - la pose viene de la curva, y la luz, el rótulo y el grupo de los faros usan `k`;
  - el reloj sigue igual;
  - en la retirada no hay faros ni rótulos;
  - la salida antigua por el horizonte (negro, destello, resumen ligado al scroll) desaparece de la sección.
- **Plantilla y estilos:** `.caida` con unos 420vh y un `data-mantener` que no retenga al final; el ancla `habilidades`
  de `nav.js` al principio.
- [ ] Medición (Task 1) tras la integración y capturas de 3 momentos (un faro, la pausa y la retirada).

### Task 4: Botón, caída por tiempo y capa del resumen
**Files:** `sitio/assets/cruzar.js`, `sitio/assets/agujero.js`, `plantillas/index.html`, `sitio/assets/raven.css`,
`sitio/assets/nav.js`
- **Botón `.cruzar`:** anillo de luz del disco que gira despacio, interior negro, texto en Bodoni y Manrope; precesión
  3D más vaivén; se estabiliza al pasar el ratón; foco visible. Aparece con el frenado y en la pausa, y se va en la
  retirada.
- **Caída al pulsar:**
  - se bloquea el scroll;
  - la caída la conduce `agujero.js` con un progreso por tiempo de `r_boton` a 1,015 (`poseRadio`), con el negro
    encima;
  - después, la capa del resumen;
  - el bloqueo se libera en un `finally`, y también si pasan 6 s.
- **Capa:** `.resumen` fija y desplazable por dentro, con un botón «Seguir a Proyectos». Al cerrarla (botón, `Esc` o
  rueda hacia abajo con la lista al final), destello y salto a Proyectos con la función de salto de `nav.js`
  (`window.__ravenSaltar(id)`).
- **«Ver todo de una vez»** y el ancla `resumen`: la capa al momento.
- **Movimiento reducido:** la capa al momento.
- [ ] Humo: el botón aparece en la pausa; al pulsarlo sale la capa en menos de 5 s; «Seguir a Proyectos» aterriza en
  Proyectos con el scroll libre; «Ver todo de una vez» abre la capa.

### Task 5: Verificación y publicación
- [ ] Medición final dentro del criterio (a velocidad constante y con rueda), incluido el relevo hacia Proyectos y el
  recorrido hacia arriba.
- [ ] `npm test`, humo general y humo del botón en verde.
- [ ] Revisión final (subagente) y correcciones; push a `main`, despliegue en verde, humo contra la web publicada.
