// El mapa del curso: 8 regiones con sus conceptos. `temas` enlaza con los títulos de los vídeos que dieron el alcance.
const listo = (id, titulo, retos, temas = []) => ({ id, titulo, estado: 'listo', carga: () => import(`./parte${id.split('-')[0]}/${id}.js`), retos: retos.map((r) => ({ id: r })), temas });
const pend = (id, titulo, temas = []) => ({ id, titulo, estado: 'pendiente', retos: [], temas });

export const CATALOGO = [
  { id: 1, titulo: 'El borde', lema: 'Donde lo nítido empieza a deshacerse.', posicion: [0.16, 0.2], conceptos: [
    listo('1-1-quien-es-alto', '¿Quién es alto?', ['borrosidad', 'grado-174'], ['1.0 Conjuntos difusos (contenido)']),
    listo('1-2-monton', 'La paradoja del montón', ['verdad-tras-n', 'causa-paradoja']),
    listo('1-3-conjunto-difuso', 'Qué es un conjunto difuso', ['cerca-de-5', 'discreto-a-tabla'], ['1.1 Conjuntos certeros vs difusos']),
    listo('1-4-donde-vive', 'Dónde vive la lógica difusa', ['se-presta', 'decidir-ventilador'], ['Introducción al curso y aplicaciones']),
    listo('1-5-no-es-probabilidad', 'Pertenencia no es probabilidad', ['grado-o-azar', 'botellas']),
    listo('1-6-anatomia', 'Soporte, núcleo y altura', ['moldear-trapecio', 'calcular-anatomia']),
    listo('1-7-inclusion', 'Inclusión y cardinalidad', ['cardinal', 'inclusion', 'demostrar-inclusion']),
    listo('1-8-cortes-alfa', 'α-cortes', ['corte-triangulo', 'propiedad-monotonia']),
    listo('1-9-representacion', 'El teorema de representación', ['niveles-necesarios', 'demostrar-representacion']),
    listo('1-10-convexidad', 'Convexidad', ['contraejemplo', 'interseccion', 'demostrar-cortes-convexos']),
  ] },
  { id: 2, titulo: 'La forma', lema: 'Cada idea vaga tiene su curva.', posicion: [0.5, 0.15], conceptos: [
    listo('2-1-parametrizadas', 'Una curva con pocos botones', ['ajusta-triangulo', 'punto-triangulo', 'cuantos-numeros'], ['1.4 Funciones de membresía (1)']),
    listo('2-2-tipicas', 'Las cinco formas de siempre', ['elige-forma', 'calcula-gaussiana', 'sin-puntas'], ['1.4 Funciones de membresía típicas (2)']),
    listo('2-3-construirlas', 'De dónde salen los grados', ['jurado-suficiente', 'contar-votos', 'directo-o-indirecto']),
    listo('2-4-pendulo', 'Tu péndulo: darle palabras al ángulo', ['ajusta-angulo', 'grado-angulo']),
  ] },
  { id: 3, titulo: 'El álgebra', lema: 'Y, o, no: cuando dejan de ser únicos.', posicion: [0.84, 0.22], conceptos: [
    listo('3-1-zadeh', 'Y, o, no: las operaciones de Zadeh', ['acerca-nubes', 'casa-interseccion', 'casa-complemento'], ['1.2 Operaciones entre conjuntos difusos']),
    listo('3-2-leyes', 'Las leyes que se conservan', ['comprueba-ley', 'cual-se-conserva', 'demuestra-morgan'], ['1.3 Propiedades de las operaciones difusas (1)']),
    listo('3-3-leyes-que-caen', 'Las leyes que caen', ['borrar-joroba', 'joroba-punto', 'demuestra-tope'], ['1.3 Propiedades de las operaciones difusas (2)']),
    listo('3-4-normas-t', 'Muchos «y»: las normas T', ['elige-y', 'calcula-normas', 'demuestra-tope-min'], ['2.2.1 Normas T']),
    listo('3-5-normas-s', 'Muchos «o»: normas S y dualidad', ['calcula-dual', 'dual-elegir', 'demuestra-dual'], ['2.2.2 Normas S']),
    listo('3-6-complementos', 'Muchos «no»: los complementos', ['punto-fijo', 'calcula-sugeno', 'demuestra-involucion'], ['2.2.3 Complemento difuso']),
    listo('3-7-generadores', 'Fabricar un «y» con una sola curva', ['generador-suma', 'calcula-generador', 'demuestra-asociativa']),
    listo('3-8-parametrizados', 'Un botón para ajustar el «y»', ['ajusta-p', 'extremos-p', 'la-gente-compensa']),
  ] },
  { id: 4, titulo: 'Relaciones y extensión', lema: 'Cuando el grado une dos mundos.', posicion: [0.84, 0.54], conceptos: [
    listo('4-1-relaciones', 'Relaciones difusas', ['leer-relacion', 'relacion-o-no'], ['2.0 Otras operaciones difusas (contenido)', '2.1.1 Relaciones difusas']),
    listo('4-2-producto', 'Producto cartesiano', ['busca-punto', 'producto-cuenta', 'producto-y'], ['2.1.2 Producto cartesiano difuso']),
    listo('4-3-proyeccion', 'Sombras y cortinas: proyección y extensión', ['proyecta-calc', 'proyecta-pierde', 'demuestra-cilindro']),
    listo('4-4-composicion', 'Encadenar relaciones: la composición', ['compone-calc', 'compone-elegir', 'demuestra-monotona'], ['2.1.3 Composición entre relaciones difusas']),
    listo('4-5-similitud', 'Parecerse: las relaciones de similitud', ['grupos-alfa', 'transitiva-calc', 'demuestra-corte']),
    listo('4-6-extension-1d', 'El principio de extensión', ['centra-entrada', 'extiende-calc', 'por-que-max'], ['2.3.1 Principio de extensión unidimensional']),
    listo('4-7-extension-nd', 'Extensión con varias entradas', ['busca-z', 'suma-discreta', 'demuestra-clasico'], ['2.3.2 Principio de extensión multidimensional']),
    listo('4-8-numeros', 'Números difusos y su aritmética', ['ajusta-suma', 'pie-suma', 'resta-sorpresa']),
  ] },
  { id: 5, titulo: 'Razonar', lema: 'Sacar conclusiones de lo que es casi cierto.', posicion: [0.5, 0.5], conceptos: [
    listo('5-1-clasica-difusa', 'De dos valores a infinitos', ['tabla-verdad', 'dos-valores'], ['3.0 Razonamiento difuso (contenido)', '3.1 Lógica clásica vs difusa']),
    listo('5-2-implicaciones', '«Si… entonces», con grados', ['busca-diferencia', 'implica-calc', 'demuestra-esquinas']),
    listo('5-3-linguistica', 'Hablar con palabras: variables lingüísticas', ['ajusta-muy', 'muy-calc', 'hedge-elegir'], ['3.2.1 Variable lingüística']),
    listo('5-4-reglas', 'Reglas si-entonces', ['encuentra-verdad', 'regla-calc', 'mamdani-o-implica'], ['3.2.2 Regla si-entonces']),
    listo('5-5-modus-ponens', 'Modus ponens generalizado', ['altura-recorte', 'mp-calc', 'demuestra-recorte'], ['3.2.3 Modus ponens difuso']),
    listo('5-6-composicional', 'La regla composicional', ['cri-calc', 'cri-elegir', 'demuestra-cri']),
    listo('5-7-ecuaciones', 'Razonar hacia atrás: ecuaciones relacionales', ['alfa-calc', 'hay-solucion', 'demuestra-sanchez']),
    listo('5-8-pendulo', 'Tu péndulo: su primera regla', ['elige-signo', 'peso-regla']),
  ] },
  { id: 6, titulo: 'Sistemas', lema: 'De las reglas a una máquina que decide.', posicion: [0.16, 0.54], conceptos: [
    listo('6-1-mamdani', 'Mamdani: la máquina completa', ['ajusta-rapido', 'mamdani-fuerza', 'mamdani-orden', 'demuestra-sin-reglas']), listo('6-2-defuzzificacion', 'De una figura a un número', ['separa-metodos', 'centroide-calc', 'metodo-elegir', 'demuestra-simetrica']), listo('6-3-sugeno', 'Sugeno: cada regla da una fórmula', ['lleva-a-z', 'sugeno-calc', 'sugeno-elegir', 'demuestra-entre']),
    listo('6-4-tsukamoto', 'Tsukamoto: conclusiones que no retroceden', ['lleva-salida', 'tsukamoto-calc', 'tsukamoto-elegir']), listo('6-5-aproximacion', 'Pueden imitar cualquier curva', ['bajar-error', 'cuantas-reglas', 'demuestra-lipschitz']), listo('6-6-pendulo', 'El péndulo se sostiene', ['sostenlo', 'tabla-calc', 'quien-falta', 'demuestra-pd']),
    listo('6-7-diseno', 'Diseñar de verdad: el riel y la estabilidad', ['centra', 'umbral-calc', 'cobertura-elegir', 'demuestra-muelle']),
  ] },
  { id: 7, titulo: 'Aprender', lema: 'Reglas que se ajustan solas.', posicion: [0.3, 0.85], conceptos: [
    listo('7-1-c-medias', 'Encontrar los grupos: c-medias difusas', ['alas-difusas', 'pertenencia-calc', 'cmedias-elegir', 'demuestra-centro']), listo('7-2-anfis', 'Reglas que se ajustan solas: ANFIS', ['entrena', 'gradiente-calc', 'anfis-elegir', 'demuestra-derivada']), listo('7-3-tipo-2', 'Dudar de la curva: conjuntos de tipo 2', ['ensancha', 'intervalo-calc', 'tipo2-elegir', 'demuestra-extremos']), listo('7-4-celulas', 'Tu propuesta: Células de Concepto Difusas', ['que-cambia', 'regla-ccd-calc', 'ccd-elegir', 'demuestra-producto']),
    listo('7-5-pendulo', 'Tu péndulo se ajusta solo', ['ajusta-solo', 'paso-calc', 'ajuste-elegir', 'demuestra-tanteo']),
  ] },
  { id: 8, titulo: 'Solo para valientes', lema: 'La lógica misma, sin red.', posicion: [0.72, 0.86], conceptos: [
    listo('8-1-bl', 'BL: la lógica de las normas continuas', ['busca-residuo', 'residuo-calc', 'bl-elegir', 'demuestra-uno']), listo('8-2-lukasiewicz', 'Las tres grandes', ['busca-contraccion', 'negacion-calc', 'tres-elegir', 'demuestra-goedel']), listo('8-3-mtl', 'MTL: cuando la norma da un salto', ['cruza-salto', 'nilpotente-calc', 'mtl-elegir', 'demuestra-izquierda']), listo('8-4-algebra', 'El álgebra detrás de la lógica', ['busca-tabla', 'cadena-calc', 'algebra-elegir', 'demuestra-prelineal']), listo('8-5-completitud', 'Completitud: probar y ser verdad', ['encuentra-contra', 'valor-calc', 'completitud-elegir', 'demuestra-correccion']),
  ] },
  // --- el otro lado del mapa: el amanecer. La misma lógica, dentro de las redes.
  { id: 9, lado: 'alba', titulo: 'La neurona difusa', lema: 'Cada neurona calcula un grado.', posicion: [0.14, 0.34], conceptos: [
    listo('9-1-neurona', 'Una neurona es una curva de pertenencia', ['haz-un-y', 'sigmoide-calc', 'centro-calc', 'demuestra-pendiente']), listo('9-2-softmax', 'Softmax: quién decide', ['enfria', 'softmax-calc', 'softmax-elegir', 'demuestra-dos']), listo('9-3-gradientes', 'Operadores que dejan pasar el gradiente', ['zona-muda', 'producto-calc', 'gradiente-elegir', 'demuestra-producto-grad']), listo('9-4-implicacion', 'La implicación y sus gradientes', ['equilibra', 'mt-calc', 'godel-elegir', 'demuestra-cuervos']),
  ] },
  { id: 10, lado: 'alba', titulo: 'Reglas que enseñan', lema: 'Una regla también puede ser una pérdida.', posicion: [0.38, 0.72], conceptos: [
    listo('10-1-regla-perdida', 'Una regla como función de pérdida', ['apaga-regla', 'perdida-calc', 'regla-elegir', 'demuestra-cumple']), listo('10-2-cuantificadores', '«Para todo» y «existe», suaves', ['casi-min', 'pmedia-calc', 'p-elegir', 'demuestra-rmse']), listo('10-3-pocas-etiquetas', 'Aprender con pocas etiquetas', ['donde-ayuda', 'lambda-calc', 'peso-elegir', 'demuestra-lambda']),
  ] },
  { id: 11, lado: 'alba', titulo: 'Grados en los que confiar', lema: 'Un 80 % tiene que significar algo.', posicion: [0.56, 0.28], conceptos: [
    listo('11-1-probabilidad', 'Cuándo una probabilidad es un grado', ['van-juntas', 'limite-calc', 'prod-elegir', 'demuestra-prop']), listo('11-2-calibrar', 'Calibrar: decir la verdad sobre tu duda', ['baja-ece', 'ece-calc', 'cal-elegir', 'demuestra-t']), listo('11-3-isotonica', 'Regresión isotónica', ['doce-bloques', 'pav-calc', 'iso-elegir', 'demuestra-entre']), listo('11-4-decisor', 'Un modelo decisor como fuzzificador', ['grado-alto', 'decisor-calc', 'decisor-elegir', 'demuestra-sigmoide']), listo('11-5-owa', 'Preguntar de varias formas: OWA', ['optimista', 'owa-calc', 'owa-elegir', 'demuestra-entre-owa']),
  ] },
  { id: 12, lado: 'alba', titulo: 'Conceptos y reglas', lema: 'Entre el texto y la decisión, algo que se pueda leer.', posicion: [0.74, 0.66], conceptos: [
    listo('12-1-cuello', 'El cuello de botella de conceptos', ['interviene', 'cuello-calc', 'cuello-elegir', 'demuestra-cuello']), listo('12-2-fugas', 'Cuando los conceptos filtran', ['tapa-fuga', 'fuga-calc', 'fuga-elegir', 'demuestra-fuga']), listo('12-3-literal', 'El literal suave', ['haz-no', 'literal-calc', 'literal-elegir', 'demuestra-rango']), listo('12-4-group-lasso', 'Group lasso: quedarse con pocas preguntas', ['tres-activos', 'prox-calc', 'lasso-elegir', 'demuestra-prox']), listo('12-5-extraer', 'De pesos a frases', ['regla-vacia', 'fidelidad-calc', 'fidelidad-elegir', 'demuestra-binario']),
  ] },
  { id: 13, lado: 'alba', titulo: 'Decidir y rendir cuentas', lema: 'Una decisión tiene consecuencias, y hay que probarla.', posicion: [0.88, 0.26], conceptos: [
    listo('13-1-coste', 'Errores que no pesan igual', ['baja-beta', 'umbral-calc', 'dec-elegir', 'demuestra-iguales']), listo('13-2-contrafactual', 'Qué habría cambiado la decisión', ['cruza', 'cf-calc', 'cf-elegir', 'demuestra-cf']), listo('13-3-evaluar', '¿Funciona de verdad?', ['potencia-80', 'tam-calc', 'eval-elegir', 'demuestra-circular']), listo('13-4-ccd', 'Células de Concepto Difusas, enteras', ['enciende-urgente', 'tsk-calc', 'ccd-elegir', 'demuestra-ccd']),
  ] },
  // --- el Horizonte: fuzzython, en una órbita que cae al agujero negro
  { id: 14, lado: 'horizonte', anillo: 1, titulo: 'El borde del disco', lema: 'Aquí todo es grado: las piezas de las que está hecho fuzzython.', posicion: [0.5, 0.5], conceptos: [
    listo('14-1-encender', 'Encender fuzzython', ['treinta-minutos', 'parche-elegir', 'cuenta-333', 'demuestra-orden']),
    listo('14-2-conjunto', 'FuzzySet e Interval', ['area-mala', 'res-calc', 'interval-elegir', 'demuestra-area']),
    listo('14-3-formas', 'Las diez formas', ['forma-z', 'gauss-calc', 'forma-elegir', 'demuestra-tri']),
    listo('14-4-operar', 'Operar conjuntos', ['norma-baja', 'cruce-calc', 'operar-elegir', 'demuestra-comp']),
  ] },
  { id: 15, lado: 'horizonte', anillo: 2, titulo: 'Las órbitas medias', lema: 'Los números ganan nombre: palabras, frases y normas.', posicion: [0.5, 0.5], conceptos: [
    listo('15-1-palabras', 'Adjetivos y variables', ['palabras-iguales', 'grado-calc', 'default-elegir', 'demuestra-part']),
    listo('15-2-reglas', 'Reglas que se leen', ['regla-048', 'fuerza-calc', 'analiza-elegir', 'demuestra-morgan']),
    listo('15-3-bloque', 'Bloques y normas', ['larsen-30', 'altura-calc', 'estado-elegir', 'demuestra-coinciden']),
    listo('15-4-entrada', 'Entradas difusas', ['duda-23', 'hot-calc', 'readme-elegir', 'demuestra-singleton']),
  ] },
  { id: 16, lado: 'horizonte', anillo: 3, titulo: 'Las órbitas interiores', lema: 'Tres motores de inferencia, cada vez más cerca del centro.', posicion: [0.5, 0.5], conceptos: [
    listo('16-1-mamdani', 'Mamdani, regla a regla', ['relevo', 'fuerza-r1', 'nada-elegir', 'demuestra-centro']),
    listo('16-2-sugeno', 'Sugeno: una recta por regla', ['sug-10', 'sug-calc', 'sug-elegir', 'demuestra-meseta']),
    listo('16-3-tsukamoto', 'Tsukamoto: la curva al revés', ['tsk-salto', 'tsk-calc', 'tsk-elegir', 'demuestra-unico']),
    listo('16-4-extender', 'Archivos y piezas propias', ['hama-prod', 'hama-calc', 'fcl-elegir', 'demuestra-conm']),
  ] },
  { id: 17, lado: 'horizonte', anillo: 4, titulo: 'El horizonte', lema: 'Aquí todos los grados caen en un solo número. No hay vuelta atrás.', posicion: [0.5, 0.5], conceptos: [
    listo('17-1-colapso', 'El último número', ['colapso-iguales', 'cm-calc', 'metodo-elegir', 'demuestra-tramo']),
    listo('17-2-fragmentos', 'Fragmentos del disco', ['frag-22', 'altos-calc', 'frag-elegir', 'demuestra-nan']),
  ] },
  { id: 18, lado: 'horizonte', anillo: 5, titulo: 'Tras el horizonte', lema: 'El universo cabe en una ventana. Aquí dentro, decidir: emular a Jev y calibrar.', posicion: [0.5, 0.5], conceptos: [
    listo('18-1-emular', 'Un decisor con un modelo abierto', ['logit-08', 'logit-calc', 'emular-elegir', 'demuestra-simetria']),
    listo('18-2-plantilla', 'La pregunta bien hecha', ['plant-estable', 'logit-calc2', 'preg-elegir', 'demuestra-inversa']),
    listo('18-3-calibrar', 'Calibrar, con los datos que tienes', ['calib-mejor', 'ece-calc', 'calib-elegir', 'demuestra-id']),
    listo('18-4-unir', 'El decisor dentro de fuzzython', ['unir-nivel', 'unir-calc', 'unir-elegir', 'demuestra-prop']),
    listo('18-5-medir', 'Medir lo que has construido', ['umbral-01', 'umbral-calc', 'medir-elegir', 'demuestra-igual']),
  ] },
];

export const todosLosConceptos = (cat = CATALOGO) => cat.flatMap((r) => r.conceptos);

/** La parada que viene después en todo el curso, cruzando de región. Tras la última, null. */
export function siguienteEnCurso(id, cat = CATALOGO) {
  const r = cat.find((x) => x.conceptos.some((c) => c.id === id)), L = todosLosConceptos(cat.filter((x) => (x.lado ?? 'noche') === (r?.lado ?? 'noche'))), i = L.findIndex((c) => c.id === id);
  return L[i + 1] ?? null;
}

export function buscarConcepto(id, cat = CATALOGO) {
  for (const region of cat) {
    const i = region.conceptos.findIndex((c) => c.id === id);
    if (i >= 0) return { region, concepto: region.conceptos[i], anterior: region.conceptos[i - 1] ?? null, siguiente: siguienteEnCurso(id, cat) };
  }
  return null;
}
