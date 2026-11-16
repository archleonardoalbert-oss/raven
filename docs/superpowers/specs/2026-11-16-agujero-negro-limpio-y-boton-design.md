# Caída al agujero negro: limpia, y con botón para cruzar · Diseño

**Fecha:** 2026-11-16 · **Estado:** pendiente de aprobación · **Repo:** Raven (`~/Proyectos/raven`)

## Intención

La animación del agujero negro (sección `#habilidades`) es la que más problemas da: se traba en ciertas zonas, cambia
de velocidad y da saltos bruscos. Leonardo quiere que quede **limpia y nítida, sin un solo salto**.

Además cambia el recorrido. Ya no se cae al agujero negro directamente con el scroll:

- Los **cinco faros** (uno por área de habilidades, con su rótulo de grupo «n / 5» y su lema, como ahora) ocurren
  **todos durante la aproximación**.
- La aproximación termina en la vista de lado, muy cerca del horizonte (la captura de Leonardo: unas 2,8 veces el radio
  del horizonte, con el agujero a la izquierda y el disco cruzando la pantalla). Ahí aparece un **botón tambaleante,
  muy llamativo y único**, para entrar en el agujero negro y ver todas sus habilidades una a una (el resumen).
- **Si se pulsa:** la cámara cruza el horizonte y aparece el resumen con todas las habilidades; después se sigue a
  Proyectos.
- **Si no se pulsa y se sigue con el scroll:** la cámara deshace el camino, bastante más rápido, alejándose del
  agujero, y se pasa a la sección de Proyectos.

## Objetivos

1. **Fluidez:** la cámara avanza de forma continua en posición y velocidad durante toda la escena, en las dos
   direcciones, con rueda de ratón, trackpad, teclado o táctil. Medible: cuadro a cuadro, sin cambios bruscos de
   velocidad (ver Verificación).
2. **Faros en la aproximación:** los 5 faros con su luz, su rótulo junto al faro, el grupo «n / 5» con su lema y el
   reloj de dilatación, como ahora, pero repartidos entre la entrada y el punto del botón.
3. **El botón:** aparece al llegar al punto final de la aproximación; tambaleo propio, estilo único coherente con
   Raven.
4. **Dos salidas:** pulsar → cruzar el horizonte y ver el resumen → Proyectos; seguir con el scroll → retirada rápida →
   Proyectos.
5. **Se conserva lo que ya existe:** el índice de capítulos, el salto «Ver todo de una vez», el idioma ES/EN, el móvil
   y `prefers-reduced-motion`.

## No objetivos

- Cambiar el aspecto del agujero negro (lente, disco, estrellas) o de la galaxia.
- Cambiar el contenido del resumen.

## Anti-objetivos

- Cualquier salto visible de cámara, también en los relevos galaxia → caída y caída → galaxia.
- Que el botón tape la escena o parezca un anuncio.
- Que alguien que solo hace scroll quede atrapado en el agujero negro.

## Enfoques considerados (de la conversación)

- **Elegido:** un solo avance suavizado para toda la escena (el mismo `yS` que ya suaviza la galaxia, expuesto a
  `agujero.js`), una trayectoria curva continua por los faros, y la cámara colocada exactamente donde dice la caída (sin
  perseguirla con retraso).
- Descartado: retocar los suavizados actuales. Son tres desacompasados (el de la galaxia, el del avance `s` y el de la
  cámara persiguiendo con `lerp`/`slerp`), y además hay tramos sin suavizar y tramos interpolados por separado, con
  esquinas en cada faro. Son la causa de los tirones.

## Diseño

### Causas actuales (diagnóstico del código)

1. **Suavizados desacompasados:**
   - `galaxia.js` suaviza `yS`;
   - `agujero.js` suaviza `s` (solo entre faros) con otra constante;
   - `galaxia.js` persigue la pose de la caída con `lerp`/`slerp` (constante `0,003^dt`).
2. **Cambios de régimen:** con `p < T_ENTRA` la cámara sigue el scroll crudo, entre faros va suavizada y tras el último
   faro vuelve al scroll crudo. Si `s` llevaba retraso, hay un salto en `T_FAROS`.
3. **Esquinas:** `pose(P, s)` interpola cada tramo por separado (geométrico en `r`, lineal en `az`), así que la
   velocidad cambia de golpe en cada faro.
4. **Persecución lineal:** el `lerp` en unidades de la galaxia retrasa mucho lejos del agujero y casi nada cerca, así
   que la velocidad aparente cambia sola.

### Avance único

- `galaxia.js` expone el scroll suavizado (`window.__ravenYS()`).
- `agujero.js` calcula su progreso `p` a partir de él (no de `getBoundingClientRect`).
- No hay ningún otro suavizado. Dentro de la caída, `galaxia.js` copia la pose sin `lerp`/`slerp`/`fov` perseguido.

### Trayectoria continua

- **Nudos en `(log r, az)`:**
  - la entrada (R0, el punto en que la deja la galaxia);
  - los 5 faros, con radios repartidos en escala logarítmica entre la entrada y el punto del botón (orientativo:
    30 · 17 · 9,5 · 5,6 · 3,6);
  - el punto del botón (`r ≈ 2,8`).
- **Curva:** spline cúbica monótona (Fritsch–Carlson) en `log r` y en `az`, con parámetro `u ∈ [0, 1]` → continua en
  posición y velocidad, sin esquinas.
- **Resto de la pose:** `inc`, `gira` y `fov`, las mismas funciones suaves de `r` que hoy.
- **Llegada:** la entrada de la curva arranca desde la galaxia con velocidad suave; la llegada al botón frena hasta
  pararse (`ease-out`).
- **Faros:** su posición (`faroDe`) se calcula sobre la curva nueva. Su luz, su rótulo y el grupo funcionan igual que
  hoy, con `s` = índice continuo sobre la curva.

### Tramos de la sección (fracciones de su recorrido; cifras orientativas)

| Tramo | De | A | Qué pasa |
|---|---|---|---|
| Aproximación | 0 | 0,72 | De la galaxia al punto del botón, pasando por los 5 faros |
| Pausa | 0,72 | 0,82 | Cámara quieta (con su leve balanceo vivo); el botón aparece y tambalea |
| Retirada | 0,82 | 1 | La cámara deshace la curva hacia fuera, rápida (unas 3 veces más corta en scroll que la aproximación), sin faros ni rótulos; termina en la pose de la galaxia y el relevo a Proyectos es continuo |

- La altura de la sección se reajusta para que la aproximación conserve un ritmo cómodo (orientativo: 420vh en total).
- Hacia arriba es el mismo recorrido al revés: desde Proyectos se vuelve a acercar y el botón reaparece.

### El botón

- **Forma:** un anillo luminoso que evoca el propio horizonte: un círculo de unos 132 px, con un borde fino de luz
  cálida (los colores del disco de acreción, `#ffd9a8` → `#ff9a4a`) que gira despacio. El interior es negro puro, con
  el texto en Bodoni Moda:
  - ES: «Cruzar el horizonte» y, debajo, en Manrope pequeño, «todas mis habilidades»;
  - EN: «Cross the horizon» / «all my skills».
- **Tambaleo:** el botón precesa como un objeto en órbita: una inclinación 3D (`rotateX`/`rotateY`) que da vueltas
  lentas, más un leve vaivén. Al pasar el ratón se estabiliza y el anillo se ensancha. El foco de teclado es visible.
- **Sitio:** a la derecha del agujero, sobre el espacio oscuro, sin tapar el disco (en móvil, centrado en el tercio
  inferior).
- **Aparición y desaparición:** aparece con la pausa (fundido y escala desde 0,8) y desaparece al empezar la retirada.
  Con `prefers-reduced-motion`, sin tambaleo.

### Cruzar el horizonte (al pulsar)

- **Animación automática por tiempo (unos 3,5 s):** el scroll se bloquea mientras dura. La cámara sigue la caída desde
  el punto del botón hasta rozar el horizonte (`r → 1,015`, la misma `poseRadio` de hoy), con el oscurecimiento
  (`.negro`), y aparece el resumen.
- **El resumen se muestra como capa** sobre la escena (`position: fixed`, desplazable por dentro en pantallas bajas),
  con un control para seguir: ES «Seguir a Proyectos» / EN «On to Projects».
- **Para salir:** ese control, `Esc` o un scroll hacia abajo al final de la lista. Se lanza el destello de salida
  actual y se aterriza en Proyectos (salto instantáneo de scroll tapado por el destello, como los saltos del índice).
- **«Ver todo de una vez»** (visible durante la aproximación) lleva a la misma capa del resumen directamente.

### Integración

- **`nav.js`:**
  - el ancla `resumen` abre la capa del resumen en vez de llevar a una posición de scroll;
  - el ancla `habilidades` aterriza al principio de la aproximación;
  - el imán actual se mantiene.
- **`galaxia.js`:** sin persecución dentro de la caída; expone `__ravenYS`.
- **`plantillas/index.html`:** el botón dentro de `.caida-escena`; el resumen sale de `.caida-escena` a una capa propia.
- **`penumbra/caida.js`:** no se toca (es copia de Penumbra). La curva nueva vive en un módulo propio,
  `sitio/assets/curva-caida.js`, puro y probado en Node.

## Verificación

- **Pruebas en Node** (`test/curva-caida.test.mjs`):
  - la curva pasa por los nudos;
  - es continua en valor y en primera derivada (diferencias finitas a ambos lados de cada nudo, menos de un 2 % de
    diferencia relativa);
  - `log r` es monótona;
  - el tramo de pausa da una pose constante.
- **Medición en Firefox oculto** (`herramientas/medir-caida.mjs`):
  - recorre la sección a velocidad de scroll constante (y otra vez con pasos de rueda reales);
  - registra la cámara real cuadro a cuadro;
  - calcula el cambio de velocidad entre cuadros consecutivos.
  - **Criterio:** ningún cuadro con un cambio de velocidad superior al 25 % del anterior fuera del arranque y del
    frenado, y ningún salto de posición.
  - Se mide antes del cambio (línea base) y después.
- **Humo:**
  - el botón aparece en la pausa;
  - pulsarlo muestra el resumen y «Seguir a Proyectos» aterriza en Proyectos;
  - seguir con el scroll lleva a Proyectos sin errores;
  - el humo general de Raven, sin errores.
- **Publicar:** en `main` tras las pruebas (despliegue por GitHub Actions).

## Decisiones tras la revisión del constructor (decisiones de Claude)

1. **Suavizado de segundo orden para toda la portada.** El `yS` de `galaxia.js` pasa de filtro exponencial (posición
   continua, pero velocidad a saltos en cada paso de rueda) a un muelle críticamente amortiguado con el mismo tiempo
   de respuesta: posición y velocidad continuas. La galaxia entera se beneficia y el retraso percibido es el mismo. El
   criterio de medición se aplica también con pasos de rueda reales.
2. **La pausa no retiene el scroll.** Leonardo rechazó cualquier freno en el scroll (el scroll por paradas, revertido el
   2026-11-16). Para que el botón no se pierda:
   - la pausa mide unos 0,14 de la sección;
   - el botón empieza a aparecer mientras la cámara frena, al final de la aproximación;
   - la sección sigue fuera del imán.
3. **La retirada fluye hacia Proyectos sin pararse.**
   - La retirada no frena al llegar a la entrada: sale con velocidad.
   - La parada `habilidades` de la galaxia deja de mantener la cámara quieta al final de la sección
     (`data-mantener` reajustado).
   - El vuelo de la galaxia hacia Proyectos arranca con esa velocidad.
   - Comprobado con la misma medición en el relevo.
4. **El resumen abierto sin el botón** («Ver todo de una vez» durante la aproximación) aparece al momento sobre el
   negro del horizonte, sin repetir la caída. Cerrarlo siempre aterriza en Proyectos (es el único sitio desde el que
   puede abrirse: la caída).
5. **Movimiento reducido y móvil:**
   - con `prefers-reduced-motion`, pulsar el botón muestra el resumen al momento, sin caída;
   - en móvil, la misma caída, pero de unos 2,5 s;
   - el bloqueo del scroll durante la caída se hace con `overflow: hidden` en la raíz más `preventDefault` en rueda y
     toque, y se libera siempre al terminar, aunque algo falle.

## Lo que queda al constructor

- Las cifras finas (radios de los faros, tramos, duraciones y alturas) dentro de lo indicado, ajustadas mirando
  capturas.
- El acabado visual del botón dentro de la descripción (sin romper la regla de texto de Raven: frases humanas y seguras).
