// Catálogo de proyectos de Raven: una entrada por proyecto. «destacado» = es uno de los planetas de la
// portada (como mucho tres). Las etiquetas salen de ETIQUETAS; añadir un proyecto es añadir una entrada.
export const ETIQUETAS = {
  curso: { es: 'Curso', en: 'Course' },
  herramienta: { es: 'Herramienta', en: 'Tool' },
  ia: { es: 'IA', en: 'AI' },
  matematicas: { es: 'Matemáticas', en: 'Mathematics' },
  graficos: { es: 'Gráficos 3D', en: '3D graphics' },
  simulacion: { es: 'Simulación', en: 'Simulation' },
  algoritmos: { es: 'Algoritmos', en: 'Algorithms' },
  web: { es: 'Web', en: 'Web' },
  linux: { es: 'Linux', en: 'Linux' },
};
export const PROYECTOS = [
  {
    id: 'penumbra', nombre: 'Penumbra', fecha: '2026-11-05', destacado: true, color: '#8fdcef', fuente: 'Lectura',
    tipo: { es: 'Curso interactivo', en: 'Interactive course' },
    desc: { es: 'Curso de lógica difusa con animaciones manipulables, 168 retos y un controlador que sostiene un péndulo invertido.', en: 'A fuzzy logic course with hands-on animations, 168 challenges and a controller that balances an inverted pendulum.' },
    etiquetas: ['curso', 'matematicas', 'graficos', 'web'],
  },
  {
    id: 'hortus', nombre: 'Hortus Algorithmicus', fecha: '2026-11-08', destacado: true, color: '#f2d9a0', fuente: 'Cormorant',
    tipo: { es: 'Escritorio Linux', en: 'Linux desktop' },
    desc: { es: 'Fondo de escritorio vivo: disco, red, memoria y CPU dibujados por los algoritmos que los gestionan.', en: 'A living wallpaper: disk, network, memory and CPU drawn by the algorithms that manage them.' },
    etiquetas: ['linux', 'simulacion', 'algoritmos', 'graficos'],
  },
  {
    id: 'semillero', nombre: 'Semillero', fecha: '2026-10-23', destacado: true, color: '#8ff0bb', fuente: 'EB Garamond',
    tipo: { es: 'Herramienta con IA', en: 'AI tool' },
    desc: { es: 'Un almacén de ideas: Claude investiga cada una, emite un dictamen y convierte las buenas en un plan de estudio.', en: 'An idea vault: Claude researches each one, delivers a verdict and turns the good ones into a study plan.' },
    etiquetas: ['herramienta', 'ia', 'web'],
  },
];
