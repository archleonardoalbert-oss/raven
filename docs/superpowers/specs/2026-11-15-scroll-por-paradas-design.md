# Scroll por paradas · Diseño

**Fecha:** 2026-11-15 · **Estado:** pendiente de aprobación · **Repo:** Raven (`~/Proyectos/raven`)

## Intención

El scroll de la portada sigue siendo incómodo: la cámara está ligada al scroll de forma continua y, para viajar de una
sección a otra, hay que recorrer el trayecto a mano. El «imán» actual solo lo completa si te detienes a mitad.
Leonardo quiere que **nunca** se haga scroll solo para avanzar la animación. La portada se divide en **paradas**, cada
una con contenido real que vale la pena leer:

- Dentro de una parada hay un **margen cómodo** para desplazarse en las dos direcciones sin salir de ella.
- Al superar ese margen, la animación **corre sola** hasta la parada siguiente, o la anterior si se sube.

## Objetivos

1. **Paradas:**
   - Portada (`#inicio`);
   - Manifiesto;
   - Sobre mí;
   - **cada faro** de la caída en el agujero negro (uno por área de habilidades);
   - resumen de habilidades;
   - intro de Proyectos;
   - **cada planeta principal** (`#p-<id>`);
   - Contacto.
2. **Zona segura por parada:** dentro de ella el scroll es normal, en las dos direcciones. Es cómoda: al menos lo que
   ocupa su contenido más un colchón.
3. **Salir de una parada:** empujar una distancia clara (acumulada) más allá del borde. Entonces la cámara viaja sola,
   animada, a la parada vecina en esa dirección, y el scroll no interfiere mientras viaja.
4. **Indicador discreto en el borde:** «Sigue para ir a <siguiente parada>» se llena mientras empujas, para que el salto
   nunca sea accidental ni sorprenda.
5. **Se conserva lo que ya existe:**
   - la barra de scroll, el teclado y la accesibilidad;
   - el índice de capítulos con sus saltos de hiperespacio;
   - «Ver todo de una vez» en la caída;
   - los enlaces con `#ancla`;
   - el móvil con su inercia.

## No objetivos

- Cambiar los puntos de vista de la cámara, las trayectorias o la estética de cada sección.
- Las páginas de proyecto y la biblioteca (tienen scroll normal sin cámara).

## Anti-objetivos

- Saltos accidentales por un toque o una inercia del trackpad.
- Viajes que empiezan sin que se entienda por qué.
- Quedarse a mitad de un trayecto sin contenido.
- Que una parada larga, como Sobre mí en móvil, no deje leer todo su contenido.

## Enfoques considerados

- **A (elegido): scroll nativo con un «conductor» de paradas.** Se calculan los rangos de scroll de cada parada; un
  controlador intercepta la rueda, el gesto táctil y el teclado solo en los bordes de la zona segura, y lanza el viaje
  animado con `scrollTo` programático. Conserva todo lo nativo.
- B: scroll virtual a medida (sin scroll real del documento). Descartado: se pierden la barra, la búsqueda, la
  inercia del móvil y parte de la accesibilidad, y habría que rehacer la maquetación.
- C: `scroll-snap` de CSS. Descartado: no da la zona segura con viaje automático y sigue obligando a recorrer el
  trayecto.

## Diseño

### Modelo de paradas

Lo calcula `conductor.js`, un módulo nuevo en `sitio/assets/`, y se recalcula al cambiar el tamaño de la ventana y
cuando termina de cargar la escena.

- **Cada parada:** `{ id, nombre: { es, en }, ancla: y, ini, fin }` en píxeles de scroll. `ancla` es donde la cámara está
  quieta y el contenido a la vista (las «zonas de descanso» actuales, `window.__ravenDescansos`). `[ini, fin]` es la
  zona segura.
- **Zona segura:** desde el ancla hasta donde termina el contenido de la parada (la sección o su tarjeta), con un
  colchón de un 15 % de la pantalla a cada lado, sin invadir el viaje hacia la parada vecina. Si el contenido cabe en
  una pantalla, la zona mide al menos un 40 % de pantalla, para que la rueda y la inercia no la desborden al instante.
- **Faros:** el faro `k` (de `N = 5` áreas) está en el progreso de la sección
  `p_k = T_ENTRA + (k / (N − 1)) · (T_FAROS − T_ENTRA)` (tramos de `agujero.js`); en px,
  `y_k = sección.offsetTop + p_k · (sección.offsetHeight − innerHeight)`. Su zona segura es la ventana de progreso en la
  que su rótulo está visible, recortada a la mitad del trecho hacia los faros vecinos. La entrada (de la galaxia al
  primer faro) y la salida (del último faro al resumen) son viajes.
- **Resumen de habilidades:** el ancla `resumen` actual, con zona segura hasta el final de la caída antes del destello
  de salida.
- **Planetas:** cada sección `.proyecto` (`#p-<id>`); zona segura alrededor de su tarjeta.

### Comportamiento

- **Dentro de la zona segura:** nada cambia; el navegador desplaza normalmente.
- **En el borde, empujando hacia fuera:**
  - el scroll se retiene en el borde (`preventDefault` en `wheel`/`touchmove` y en las teclas de desplazamiento);
  - el empuje se acumula;
  - el indicador muestra el progreso del empuje;
  - si se deja de empujar más de 600 ms, el acumulado se vacía y el indicador se apaga.
- **Umbral de salida:** el 33 % de la altura de la pantalla acumulado. También salen al momento un gesto táctil rápido
  hacia fuera desde el borde (velocidad alta) y las teclas `Space`, `PageDown`/`PageUp`, `↓`/`↑` y `End`/`Home` cuando ya
  se está en el borde.
- **Viaje:**
  - animación de `scrollY` desde la posición actual hasta el ancla de la parada destino;
  - duración `clamp(1.3 s, 0,9 s + distancia·k, 2,6 s)`, curva suave de entrada y salida;
  - toda la entrada de scroll se ignora mientras dura (`preventDefault`);
  - el viaje nunca acaba a mitad de un trayecto.
  - La cámara ya sigue al scroll con su suavizado (`yS`), así que la animación de la galaxia, los planetas y la caída es
    la misma de siempre, solo que conducida.
- **Llegadas:**
  - **con la sincronía actual:** hacia abajo el viaje termina en el `ini` de la parada destino y hacia arriba en su `fin`
    (como el imán actual): se llega por el lado por el que se entra;
  - **cuando el contenido es más alto que la pantalla:** se llega al principio del contenido bajando y al final subiendo.
- **Otros caminos de entrada:**
  - **barra de scroll, búsqueda en la página o rueda sin el conductor:** si el scroll queda quieto en un trayecto (fuera
    de toda zona segura), un viaje lo lleva a la parada más cercana en la dirección del último movimiento. Sustituye al
    imán actual;
  - **índice de capítulos y `#ancla`:** se mantienen los saltos de hiperespacio actuales, que aterrizan en el ancla de la
    parada del capítulo.
- **«Ver todo de una vez»:** salta a la parada del resumen.
- **`prefers-reduced-motion`:** el viaje es un salto inmediato con un fundido corto (sin recorrido de cámara).
- **Móvil:** el mismo modelo, con `touchstart`/`touchmove`/`touchend` y `passive: false` solo mientras se está en un borde.
  El umbral es el mismo 33 % de pantalla en desplazamiento del dedo, o un gesto rápido.

### Indicador

Una píldora pequeña y centrada en el borde inferior (o superior al subir) con el nombre de la parada destino
(«Sigue para ir a Proyectos» / «Keep going to Projects») y una barra que se llena con el empuje. Aparece solo al
empujar en un borde y se desvanece al soltar o al viajar. Usa el estilo de cristal de Raven y respeta
`prefers-reduced-motion`.

### Integración

- `nav.js`:
  - el imán actual se retira (su caso, quedarse en un trayecto, lo cubre el conductor);
  - el índice y los saltos siguen igual, pero leen las paradas del conductor para el progreso.
- `galaxia.js` expone las paradas base (`__ravenDescansos`), como ahora.
- `agujero.js` expone las paradas de los faros (`__ravenFaros()` → lista de `{ k, y, ini, fin, nombre }`).
- El conductor solo se activa en la portada.

## Restricciones

- Firefox es el navegador de Leonardo; probar en él (Puppeteer con WebDriver BiDi, oculto) y en móvil emulado
  (390×844).
- Sin regresiones visuales: los planos de cámara de cada parada se ven igual que ahora.
- Pruebas: Node para el cálculo de paradas y el autómata (función pura de alturas → paradas; autómata de empuje →
  viaje), y humo en Firefox con eventos de rueda reales.
- Después de las pruebas, publicar en `main` (despliegue por GitHub Actions).

## Decisiones tras la revisión del constructor (decisiones de Claude)

1. **La cámara está quieta en toda la zona segura.** Es la única lectura fiel a «nunca scroll para avanzar la animación».
   - **Galaxia:** las zonas de descanso (`data-mantener`) y las alturas de sección se reajustan para que el reposo de
     cámara cubra el contenido de cada parada. El plano de llegada es el mismo de hoy.
   - **Caída:** el progreso `s` de `agujero.js` pasa a tener mesetas: en la zona segura de cada faro, `s = k` exacto, y
     entre faros la pendiente es más pronunciada.
   - Así, dentro de una parada solo se desplaza el contenido, nunca la cámara.
2. **Llegadas:**
   - bajando, al principio de la zona segura (el ancla); subiendo, al final;
   - tras llegar, el indicador empieza vacío y no acumula hasta un gesto nuevo: soltar 300 ms o empezar otro toque.
     Así un empuje largo no encadena dos viajes.
3. **Inercia que se sale de la zona** (móvil o trackpad sin eventos que cancelar): si el scroll rebasa un borde por
   inercia, el conductor lo devuelve suavemente al borde. **Solo sale de una parada un gesto explícito** (empuje
   acumulado o tecla). La regla de «quieto en un trayecto → viajar» queda solo para la barra de scroll y la búsqueda
   (scroll sin rueda ni toque en los últimos 600 ms).
4. **Teclado:**
   - `Inicio` y `Fin` siguen como hoy: saltos de hiperespacio a la portada y a Contacto;
   - `Espacio`, `AvPág`/`RePág` y las flechas: scroll nativo dentro de la zona y, ya en el borde, salida inmediata a la
     parada vecina.
5. **Duración del viaje:** con ritmo parecido para todos: `clamp(1,4 s, 0,9 s + 0,25 s · pantallas recorridas, 2,6 s)`,
   donde «pantallas» = distancia en px / `innerHeight`.

## Lo que queda al constructor

- Las cifras finas (colchón, umbral, duraciones) dentro de los rangos dados, ajustadas probando.
- Cómo detectar el «gesto rápido» en táctil (velocidad en px/ms).
- Cómo convivir con la inercia del trackpad tras un viaje: ignorar la rueda unos 400 ms después de llegar.
