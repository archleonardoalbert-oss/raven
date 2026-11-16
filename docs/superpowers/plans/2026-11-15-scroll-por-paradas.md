# Scroll por paradas · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que la portada de Raven se recorra por paradas: scroll normal dentro de cada una (con la cámara quieta) y un viaje automático a la vecina al empujar más allá de su zona segura.

**Architecture:**
- **Modelo puro** (`sitio/assets/conductor-modelo.js`): construye las paradas a partir de las zonas de descanso de la galaxia, de los faros y del resumen, y contiene el autómata de empuje y viaje. Se prueba en Node.
- **Ejecución en la página** (`sitio/assets/conductor.js`): escucha la rueda, los gestos táctiles, el teclado y el scroll; anima el viaje y pinta el indicador.
- **Caída:** `agujero.js` gana mesetas (la cámara clavada en cada faro) y publica las paradas de los faros.
- **Galaxia:** deja de dar la caída entera como una sola zona de descanso.
- **Navegación:** `nav.js` pierde el imán y avisa al conductor tras un salto de hiperespacio.

**Spec:** `docs/superpowers/specs/2026-11-15-scroll-por-paradas-design.md` (con sus decisiones tras la revisión).

## Global Constraints

- **Paradas:** portada, manifiesto, sobre mí, faro 1…N, resumen, proyectos, `p-<id>`… y contacto.
- **Cámara:** quieta en toda la zona segura.
- **Empuje para salir:** el 33 % de `innerHeight`; se vacía tras 600 ms sin empujar. Tras llegar, hace falta un gesto nuevo (300 ms quieto).
- **Duración del viaje:** `clamp(1.4, 0.9 + 0.25 · pantallas, 2.6)` segundos.
- **Inercia** que rebasa el borde: vuelve al borde. Lo que queda quieto en un trayecto sin rueda ni toque recientes (600 ms) viaja a la parada más cercana en la dirección del último movimiento.
- **Teclado:** `Inicio`/`Fin` son saltos de hiperespacio (como hoy); `Espacio`, `AvPág`/`RePág` y las flechas son scroll nativo dentro de la parada y, en el borde, viaje.
- **`prefers-reduced-motion`:** salto inmediato.
- **Pruebas:** Node para el modelo; humo en Firefox oculto con eventos de rueda reales; la construcción pública sin cambios fuera de la portada.
- **Commits:** con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Publicar en `main` al terminar.

## Review Focus

1. Inercia del trackpad tras un viaje: no encadena un segundo viaje. → Task 1.
2. Una parada más alta que la pantalla (Sobre mí en móvil): se lee entera antes de poder salir. → Task 4.
3. Arrastrar la barra de scroll hasta la mitad de un trayecto: la cámara lo completa hacia la parada más cercana. → Task 3.
4. Saltos del índice o de `#ancla` aterrizan dentro de una parada y el conductor no lanza un viaje extra. → Task 3.
5. Cambiar el tamaño de la ventana a mitad de una parada: sigue en la misma parada, con las zonas recalculadas. → Task 3.

---

### Task 1: Modelo de paradas y autómata (Node)
**Files:** `sitio/assets/conductor-modelo.js`, `test/conductor.test.mjs`
**Interfaces — Produces:**
- `construirParadas({ descansos, faros, resumen }) → [{ id, nombre, ini, fin }]`: ordenadas. Quita el descanso de `habilidades` y mete los faros y el resumen.
- `paradaEn(paradas, y) → índice | -1`: con una tolerancia de 2 px.
- `crearAutomata({ alto, ahora }) → { evento(tipo, datos) → orden }`:
  - eventos: `rueda { dy, y, paradas }`, `tecla { tecla, y, paradas }`, `toqueFin { velocidad, y, paradas }` (en px/ms), `llegada {}`, `quieto { y, paradas, ultimoGesto }`;
  - órdenes: `{ hacer: 'nativo' }`, `{ hacer: 'ajustar', y }` (fijar en el borde), `{ hacer: 'retener', progreso, destino }`, `{ hacer: 'viajar', y, duracion, destino }`, `{ hacer: 'ignorar' }`.
- [ ] Pruebas:
  - dentro de la zona, nativo;
  - un paso de rueda que cruzaría el borde, ajustar al borde;
  - en el borde, empujes que suman menos del umbral, retener con progreso;
  - al sumar el umbral, viajar a `ini + 1` de la siguiente (bajando) o a `fin − 1` de la anterior (subiendo);
  - 600 ms sin empujar, progreso a 0;
  - tras `llegada`, empujar sin pausa no acumula, y tras 300 ms quieto sí;
  - `Espacio` en el borde viaja y dentro es nativo;
  - un gesto táctil rápido hacia fuera en el borde viaja;
  - `quieto` en un trayecto con gesto antiguo viaja a la más cercana en la dirección del último movimiento, y con gesto reciente ajusta al borde;
  - en la última parada, empujar hacia abajo retiene sin destino;
  - la duración sigue la fórmula.

### Task 2: Mesetas en la caída y paradas de los faros
**Files:** `sitio/assets/agujero.js`, `sitio/assets/galaxia.js`
- `agujero.js`:
  - `s` objetivo con mesetas: `q = (p − T_ENTRA)/(T_FAROS − T_ENTRA)`, faro `k` en `q_k = k/(N−1)` y semiancho de meseta `w = 0.32/(N−1)`; entre mesetas, transición `suave`;
  - publica `window.__ravenFaros()` → `[{ id: 'faro-k', nombre: { es, en }, ini, fin }]` en px de scroll, y `window.__ravenResumen()` con la zona en la que el resumen está a la vista (p de 0,885 a 0,95).
- `galaxia.js`: `__ravenDescansos` añade `nombre` a cada descanso (sacado del índice o del título del capítulo) y marca `id`.
- [ ] Verificación en Firefox oculto: con el scroll en el centro de la meseta del faro 2, `s` vale 2 y el rótulo es el del área 2; la cámara no se mueve al desplazarse dentro de la meseta (el mismo `estado.C` a ±30 % de la meseta).

### Task 3: Conductor en la página, indicador e integración con nav.js
**Files:** `sitio/assets/conductor.js`, `sitio/assets/raven.css`, `sitio/assets/nav.js`, `plantillas/index.html`
- `conductor.js`:
  - importa el modelo;
  - recalcula las paradas al cargar, al cambiar el tamaño y tras `raven-idioma`;
  - escucha `wheel`, `touchstart`/`touchmove`/`touchend` (con `passive: false`), `keydown` y `scroll`;
  - ejecuta las órdenes: `ajustar` con `scrollTo` instantáneo; `viajar` animando con `requestAnimationFrame`; `retener` con `preventDefault` y el indicador;
  - expone `window.__ravenConductor = { trasSalto() }`.
- **Indicador:** píldora de cristal centrada abajo o arriba: «Sigue para ir a <parada>» / «Keep going to <stop>», con una barra que se llena; aparece al retener y se desvanece en 500 ms.
- `nav.js`: se retira el imán; `saltar()` llama a `__ravenConductor.trasSalto()` al colocar; el índice y las teclas `Inicio`/`Fin` quedan igual.
- [ ] Humo (Task 4).

### Task 4: Ajuste de zonas y humo en Firefox
**Files:** `plantillas/index.html` (`data-mantener`), `sitio/assets/raven.css` (alturas), `herramientas/humo-paradas.mjs`
- Medir en 1440×900 y 390×844 que cada zona segura cubre su contenido con colchón (tarjeta o sección entera visible desplazándose dentro); subir `data-mantener` o la altura donde no.
- Humo:
  - rueda dentro de la portada sin salir;
  - un empuje del 33 % lleva al Manifiesto (la cámara en reposo y el indicador visto mientras se empuja);
  - viajes sucesivos hasta el faro 1 y el faro 2 (rótulo correcto), el resumen, un planeta y contacto;
  - subir de vuelta una parada;
  - en Sobre mí a 390×844 se puede leer hasta el final antes de salir;
  - sin errores de la página.
- [ ] Humo en verde; `npm test` en verde (más las pruebas existentes); construcción pública igual fuera de la portada.

### Task 5: Publicar
- [ ] Commit, push a `main`, esperar a «Desplegar» en verde y comprobar la web publicada con el humo contra la URL real.
