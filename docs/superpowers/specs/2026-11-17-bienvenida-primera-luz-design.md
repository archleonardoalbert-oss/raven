# Bienvenida «Primera luz» · Diseño breve

**Fecha:** 2026-11-17 · **Elegido por Leonardo:** «Primera luz», rápida (entre 1,5 y 2,5 s).

**Intención:** al abrir la portada, hoy las letras suben de golpe y la galaxia aparece de un salto al terminar de
cargar. Leonardo quiere una entrada acogedora y elegante que dé la bienvenida, sin hacer esperar.

**Enfoques considerados:**
- **«Primera luz» (elegido):** un punto de luz y la galaxia que se enciende desde el centro.
- **«Llegada»:** la cámara viene desde muy lejos. Descartado: tarda más y no tapa la carga.
- **«Telón de oro»:** descartado, porque es un efecto de interfaz que no nace del espacio.

## Diseño

- **Punto de luz:** un punto cálido en el sitio del núcleo de la galaxia, que respira mientras la galaxia carga. Está en
  el HTML y el CSS, así que se ve desde el primer pintado.
- **Encendido:** cuando la galaxia está lista, se enciende del centro hacia fuera en 1,6 s (`uEncendido` de 0 a 1 en
  estrellas, luz difusa, polvo y regiones H-alfa; el cielo lejano y las estrellas de proyectos, con un fundido).
  Mientras, la cámara se acerca un 12 %. El punto se funde con el núcleo.
- **Texto, en CSS** (no depende de GSAP):
  - el nombre, letra a letra, de desenfocado y transparente a nítido (sin subir), escalonado 30 ms;
  - después, la línea de estudios, el lema, los botones, «Comenzar el viaje» y la barra, con fundido y un desenfoque
    leve;
  - todo legible antes de 1,5 s; la entrada completa dura unos 1,8 s.
- **Saltar:** cualquier rueda, tecla, clic o toque la termina al momento.
- **Solo en la primera visita de la sesión:**
  - no con movimiento reducido ni con `#ancla`;
  - sin bienvenida, todo aparece al instante, salvo la galaxia, que aparece con un fundido corto.
- **Red de seguridad:** si algo falla, el texto aparece igual a los 2,6 s.

## Verificación

- Captura de 4 momentos: el punto, el encendido a mitad, el texto entrando y el final.
- Humo: en la primera visita el texto queda legible antes de 1,6 s y la galaxia encendida antes de 2,6 s desde que está
  lista; en la segunda visita no hay entrada.
- Un clic durante la entrada la termina.
- El humo general y el del botón siguen en verde.
