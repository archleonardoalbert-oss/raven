# Sistema visual y primera pantalla · Diseño (proyecto 1 de 3 del rediseño)

**Fecha:** 2026-11-17 · **Base:** `~/reports/Rediseño de Raven portafolio.md` (aprobado por Leonardo).

**Orden acordado:** 1) sistema visual y primera pantalla → 2) galaxia → 3) casos de estudio y CV.

Leonardo pidió hacerlo todo y revisarlo al final. Las decisiones de este documento son de Claude y se basan en el
informe.

## Intención

- **Fuera la paleta azulada:** la paleta actual es el cliché oscuro de «diseño hecho por IA» (negro azulado, blanco
  azulado, violeta y cian, paneles de cristal).
- **Que en 10 segundos se sepa quién es Leonardo** (IA y agentes, software, matemática), con un clic a los proyectos y
  al contacto, sin esperar a la galaxia.

## Decisiones

- **Paleta «Luz antigua»** (los nombres de variables antiguos se conservan como alias, para no romper nada):
  - base: negro neutro `#050505`; superficies `#0c0b0a`;
  - texto: `#ECE7DF`, `#B5AEA3` y `#7A746B` (blancos cálidos, nunca blanco puro sobre negro puro);
  - acento único: oro estelar `#E8B96A` (luz de estrellas tipo K/G), para el foco, los botones principales, la
    selección y los enlaces activos;
  - toque escaso: rosa H-alfa `#E2627E`, solo en detalles vivos;
  - filos: `rgb(236 231 223 / 0.10)`;
  - prohibido: azul marino, violeta, cian, degradados de titular y cristal con desenfoque.
- **Tipografía:**
  - Bodoni Moda se queda para la voz (titulares): es distintiva y editorial;
  - Manrope pasa a Instrument Sans para leer: menos genérica que las geométricas de siempre.
- **Superficies:**
  - los paneles de cristal pasan a negro neutro translúcido con un filo fino, sin brillo ni desenfoque;
  - radios de 6 px en paneles y 4 px en botones (editorial, no «burbuja»);
  - botón principal: oro con texto negro; secundario: filo de tinta.
- **Primera pantalla:**
  - visible al instante: la pantalla de carga deja de tapar el contenido y la galaxia aparece con un fundido cuando
    está lista;
  - jerarquía: nombre, lema nuevo con IA y agentes, y botones a Proyectos (la biblioteca, a un clic), GitHub y correo;
  - el viaje («Comenzar el viaje») queda como invitación secundaria;
  - el CV en PDF llega en el proyecto 3.
- **Interruptor de movimiento:**
  - un botón visible en la barra («Movimiento») que guarda la preferencia;
  - con él apagado, la página se comporta como con `prefers-reduced-motion`: sin animaciones CSS y con la cámara en
    saltos.
- **Textos (con la regla de Raven):**
  - el lema y la descripción meta dicen IA y agentes;
  - nada genérico ni con debilidades.

## Verificación

- Las 68 pruebas existentes y la referencia de textos actualizada.
- El humo general y el humo del botón.
- Capturas en escritorio y móvil (portada, Sobre mí, proyectos, biblioteca y una página de proyecto).
- El contraste de los textos sobre negro: `#ECE7DF` ≈ 17:1; `#B5AEA3` ≈ 9:1; `#7A746B` ≈ 4,3:1, solo para textos
  grandes o secundarios.
