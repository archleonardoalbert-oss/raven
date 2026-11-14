// La documentación completa de fuzzython. Todo bloque `cod` se ejecuta con el fuzzython real, y su salida la genera ejecutar_bloques.py.
const C = (s, ...v) => String.raw(s, ...v).replace(/^\n/, '').replace(/\n\s*$/, '');
export const DOC = [
  { id: 'que-es', titulo: 'Qué es y para qué sirve', bloques: [
    { p: 'fuzzython es una librería de Python para construir <b>sistemas de inferencia difusa</b>: programas que deciden con reglas escritas casi en lenguaje natural, como «si la temperatura es alta, el tiempo es largo», aunque «alta» sea una cuestión de grado.' },
    { p: 'La escribieron Carloluis Evelio Rodríguez Pérez, Yudivián Almeida Cruz y Nayla López Gil, en MATCOM (Universidad de La Habana). Su código apenas ha cambiado desde 2013, y no traía documentación: esta se ha escrito leyendo todo su código y ejecutándolo.' },
    { h: 'Lo que puede hacer' },
    { lista: ['Definir conjuntos difusos con <b>diez formas</b> ya hechas, o con cualquier función tuya.', 'Combinarlos con <b>trece operadores</b> de «y» y «o», y tres complementos, o los que le añadas.', 'Calcular con <b>tres motores de inferencia</b>: Mamdani, Sugeno y Tsukamoto.', 'Escribir las reglas <b>como texto</b>: <code>if temp is hot then minutes is large</code>.', 'Aceptar <b>entradas difusas</b>: «unos 33 grados», en lugar de 33 exactos.', 'Convertir el resultado en un número con <b>siete métodos</b> de desdifusión.', 'Guardar y leer sistemas en archivos <b>FCL</b>, un formato estándar.'] },
    { h: 'Para qué sirve, y para qué no' },
    { tabla: [['Sirve para', 'Por qué'], ['Control: climatización, velocidad, nivel', 'Las reglas de un experto, y una salida que cambia sin saltos'], ['Decisiones explicables', 'Se puede leer qué regla empujó el resultado'], ['Aprender lógica difusa', 'Su código es corto y se lee entero'], ['Combinarla con modelos de lenguaje', 'Los grados pueden venir de un decisor: lo verás en esta ruta']] },
    { aviso: 'No aprende de datos: las reglas y las formas las escribes tú. No se mantiene desde hace años, y tiene <b>24 fallos conocidos</b>, todos descritos aquí con su arreglo. Para un sistema en producción, léelos antes.' },
    { h: 'Cómo encajan las piezas' },
    { pre: C`
Conjunto difuso (fsets/)        la forma de la función de pertenencia
  └─ Adjective                  nombre + conjunto: «caliente»
       └─ Variable              nombre + adjetivos + cómo desdifusar
            └─ Predicate        «temp is caliente»
                 └─ And, Or, Not      árbol con el «si» de una regla
                      └─ Rule         si árbol, entonces consecuente, con peso
                           └─ RuleBlock    reglas + normas que comparten
                                └─ System  compute(entradas)` },
    { tabla: [['Ruta', 'Qué hay'], ['<code>fsets/</code>', '<code>FuzzySet</code> y sus 10 formas'], ['<code>norms/norms.py</code>', 'Las normas y <code>get_norm</code>'], ['<code>operators/</code>', '<code>And</code>, <code>Or</code>, <code>Not</code> y el analizador del antecedente'], ['<code>rules/</code>', '<code>Rule</code>, <code>MRule</code>, <code>SRule</code>, <code>TRule</code> y su analizador'], ['<code>systems/</code>', '<code>MamdaniSystem</code>, <code>SugenoSystem</code>, <code>TsukamotoSystem</code>'], ['<code>store/</code>', 'La gramática FCL y su lector'], ['Raíz', '<code>adjective.py</code>, <code>variable.py</code>, <code>predicate.py</code>, <code>ruleblock.py</code>, <code>interval.py</code>, <code>utils.py</code>']] },
  ] },
  { id: 'instalar', titulo: 'Instalar y arrancar', bloques: [
    { p: 'Es el primer obstáculo: ni <code>pip install</code> ni <code>import fuzzython</code> son la vía práctica. Los módulos se importan desde la raíz del repositorio (<code>from interval import Interval</code>), y <code>setup.py</code> deja fuera los módulos sueltos y usa <code>distutils</code>, retirado en Python 3.12.' },
    { h: 'Paso a paso' },
    { lista: ['Descarga el código: <code>git clone https://github.com/yudivian/fuzzython</code>.', 'Pon estas líneas al principio de tu programa, antes de importar nada de la librería.', 'Ejecuta el comprobador de abajo.'] },
    { cod: C`
import sys, time

# compute() mide su tiempo con time.clock, que Python retiró en la versión 3.8.
# Sin esta línea, todo compute() falla con AttributeError.
time.clock = time.perf_counter

# La raíz del repositorio tiene que estar en la ruta de búsqueda.
sys.path.insert(0, 'ruta/a/fuzzython')

# Comprobación rápida: un triángulo con vértice en 5 vale 1 en el 5.
from fsets.polygon import Polygon
print(Polygon((0, 0), (5, 1), (10, 0))(5))` },
    { h: 'Lo que debes saber' },
    { lista: ['<b>Avisos:</b> Python 3.14 muestra <code>SyntaxWarning</code> por los dibujos de los comentarios. No afectan; se silencian con <code>python -W ignore</code>.', '<b>Tiempos:</b> cada <code>compute()</code> imprime una línea como <code>[mamdani system time] compute: 0.00054s</code>. En los ejemplos de abajo se omite.', '<b><code>antlr3</code>:</b> solo hace falta para <em>leer</em> FCL. No se declara como dependencia.', '<b>Licencia:</b> de tipo BSD. Conserva el aviso de copyright si redistribuyes: lee <code>LICENSE</code>.'] },
  ] },
  { id: 'primero', titulo: 'Tu primer sistema, línea a línea', bloques: [
    { p: 'El sistema: según la temperatura del agua, cuántos minutos dejar algo al fuego. Se construye de abajo arriba, en el orden del esquema.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.mamdani import MamdaniSystem
from variable import Variable

# 1. LAS PALABRAS DE LA ENTRADA. Un Adjective es un nombre y un conjunto.
#    Polygon une puntos (x, y) con rectas, y fuera de ellos sigue constante:
#    por eso 'cold' vale 1 por debajo de 15 sin decir nada más.
cold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))
normal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))
hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))

# 2. LA VARIABLE DE ENTRADA: nombre, unidad y sus palabras.
#    La unidad va antes que los adjetivos: no se la puede saltar.
temp = Variable('temp', 'C', cold, normal, hot)

# 3. LA SALIDA. Además dice cómo pasar a un número (defuzzification)
#    y qué responder si no se activa ninguna regla (default).
short = Adjective('short', Polygon((0, 1), (10, 1), (15, 0)))
usual = Adjective('usual', Polygon((10, 0), (15, 1), (25, 1), (30, 0)))
large = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))
minutes = Variable('minutes', 'min', short, usual, large,
                   defuzzification='COG', default=0)

# 4. LAS REGLAS. Un bloque reúne reglas, y elige sus operadores.
#    Los nombres del texto se buscan en scope: por eso locals().
block = RuleBlock('primero', operators=('MIN', 'MAX', 'ZADEH'),
                  activation='MIN', accumulation='MAX')
block.add_rules(
    'if temp is cold or temp is normal then minutes is short with 0.5',
    'if temp is normal then minutes is usual',
    'if temp is hot then minutes is large',
    scope=locals())

# 5. EL SISTEMA, y a calcular. Las entradas van en un diccionario.
sistema = MamdaniSystem('cocina', block)
print(sistema.compute({'temp': 33}))

# 6. Mirar por dentro: tras calcular, cada adjetivo guarda su fuerza.
print(round(short.strength, 3), round(usual.strength, 3), round(large.strength, 3))` },
    { h: 'Qué ha calculado' },
    { tabla: [['Paso', 'Cuenta', 'Resultado'], ['Grados', '$\\mu_{\\text{normal}}(33) = \\frac{35 - 33}{5}$, $\\mu_{\\text{hot}}(33) = \\frac{33 - 30}{5}$', '$0{,}4$ y $0{,}6$'], ['Regla 1', '$\\max(0;\\ 0{,}4) \\cdot 0{,}5$', '<code>short</code>: $0{,}2$'], ['Regla 2', '$0{,}4$', '<code>usual</code>: $0{,}4$'], ['Regla 3', '$0{,}6$', '<code>large</code>: $0{,}6$'], ['Activar', 'Cada conjunto se recorta a su fuerza', ''], ['Acumular', 'El máximo de los tres recortes', 'Área $16{,}2$'], ['Desdifusar', '$\\frac{\\int x\\, \\mu(x)\\, dx}{\\int \\mu(x)\\, dx} = \\frac{391{,}13}{16{,}2}$', '$24{,}144$']] },
    { p: 'La salida es un diccionario de diccionarios: <code>{bloque: {variable: valor}}</code>. Para sacar el número: <code>resultado[\'primero\'][\'minutes\']</code>.' },
    { p: 'Lo mismo paso a paso, llamando a cada fase de <code>compute</code>:' },
    { cod: C`
sistema.reset()                       # pone a cero las fuerzas
sistema.fuzzify({'temp': 18})         # solo guarda el valor en la variable
sistema.inference()                   # evalúa las reglas: aquí salen los grados
print(sistema.defuzzify())            # une los conjuntos, y pasa a número` },
    { aviso: 'El nombre engaña: <code>fuzzify</code> no calcula ningún grado, solo guarda el valor. Los grados se calculan al evaluar cada regla.' },
  ] },
  { id: 'interval', titulo: 'Interval: dónde mirar', bloques: [
    { p: 'Un intervalo dice dónde integrar y dónde buscar el máximo de un conjunto. Una función por sí sola no sabe dónde empieza ni dónde acaba.' },
    { cod: C`
from interval import Interval

a = Interval(0, 10)
print(a.left, a.right, a.size)   # extremos y longitud
print(3 in a, 12 in a)           # ¿contiene este número?
print(a & Interval(5, 20))       # intersección (también a.intersect)
print(a | Interval(5, 20))       # unión que se solapa (también a.union)
print(a | Interval(20, 30))      # unión separada: un Compound
print(Interval().left)           # sin extremos: toda la recta
print(Interval(5, 5).singleton())  # ¿es un solo punto?
print(Interval(5, 1).empty())      # ¿está vacío?
print(a.middle)                  # ¡cuidado! da 5 aquí, por casualidad
print(Interval(10, 20).middle)   # debería ser 15: da 5 (fallo F15)
print(Interval(2, 4) == Interval(2, 4), Interval(2, 4) == (2, 4))` },
    { tabla: [['Miembro', 'Qué hace'], ['<code>left</code>, <code>right</code>, <code>size</code>', 'Extremos y longitud'], ['<code>middle</code>', 'Debería ser el punto medio; da la mitad del ancho (F15)'], ['<code>empty()</code>, <code>singleton()</code>, <code>empty_or_singleton()</code>', 'Comprobaciones'], ['<code>sampling(paso)</code>', 'Recorre el intervalo de paso en paso'], ['<code>in</code>', 'Pertenencia'], ['<code>&amp;</code>, <code>|</code>, <code>intersect</code>, <code>union</code>', 'Intersección y unión'], ['<code>*</code>, <code>&lt;</code>, <code>==</code>', 'Producto, orden y comparación']] },
    { aviso: 'Una unión separada da un <code>Compound</code>. Al iterarlo salen intervalos, no extremos, y eso rompe <code>COG</code> de los conjuntos no poligonales (F17).' },
  ] },
  { id: 'fuzzyset', titulo: 'FuzzySet: la base de todo', bloques: [
    { p: 'Un conjunto difuso es una función de un número en $[0, 1]$, y un intervalo. Las diez formas heredan de aquí.' },
    { cod: C`
from fsets.fuzzy_set import FuzzySet
from interval import Interval

# «alto»: 0 hasta 160 cm, 1 desde 180 cm, y una recta en medio.
def alto_f(x):
    return min(1, max(0, (x - 160) / 20))

alto = FuzzySet(alto_f, Interval(150, 190))

print(alto(170))              # pertenencia, llamándolo como una función
print(alto.membership(175))   # lo mismo, por su nombre
print(round(alto.area(), 4))  # área: 100 trapecios por defecto
print(round(alto.area(1000), 4))    # con más tramos
print(round(alto.area_(170, 180), 4))  # área entre dos puntos
print(round(alto.COG(), 3))   # centro de gravedad` },
    { h: 'Operar' },
    { cod: C`
bajo = ~alto                         # complemento: 1 - x
print(round(bajo(170), 3))
medio = FuzzySet(lambda x: max(0, 1 - abs(x - 170) / 10), Interval(150, 190))
print(round((alto & medio)(172), 3))  # intersección, con su norma T
print(round((alto | medio)(172), 3))  # unión, con su norma S

# Otra norma, para esta operación
from norms.norms import get_norm
print(round(alto.intersect(medio, get_norm('PROD'))(172), 3))

# Varios a la vez
print(round(FuzzySet.conjunction(alto, medio, alto, tnorm=get_norm('PROD'))(172), 3))

# Con un número: recortar, elevar y operar punto a punto
print(alto.minimize(0.4)(190), alto.maximize(0.4)(150))
print(round((alto * 0.5)(180), 3), round((alto + medio)(172), 3))`},
    { tabla: [['Grupo', 'Métodos', 'Notas'], ['Pertenencia', '<code>s(x)</code>, <code>s.membership(x)</code>', ''], ['Conjuntos', '<code>&amp;</code>, <code>|</code>, <code>~</code>, <code>intersect</code>, <code>union</code>, <code>complement</code>', 'Admiten otra norma'], ['Varios', '<code>conjunction</code>, <code>disjunction</code>', 'Métodos de clase'], ['Con otro', '<code>fuzzify_with(otro)</code>', '$\\sup_x T(\\mu(x), \\mu\'(x))$, en 100 muestras'], ['Desdifusión', '<code>COG</code>, <code>COA</code>, <code>CM</code>, <code>MM</code>, <code>LM</code>, <code>RM</code>', 'Ver su sección'], ['Con un número', '<code>activate(norma, v)</code>, <code>minimize</code>, <code>maximize</code>', 'Lo que usa la activación'], ['Aritmética', '<code>+ - * / **</code>', 'Punto a punto. Puede salir de $[0, 1]$: no se comprueba'], ['Numéricos', '<code>area(res)</code>, <code>area_(a, b)</code>, <code>coordinates(res)</code>', 'Trapecios; 100 de serie']] },
    { aviso: 'El área avanza sumando decimales (<code>a += step</code>), y puede dar un tramo de más: la función 1 en $[0, 1]$ da $1{,}143$ con resolución 7. Con los 100 de serie, el error suele ser despreciable. Pero mira arriba: con 1000 tramos el área de <code>alto</code> da $20{,}04$ en vez de $20$. Más resolución no siempre es mejor (F19).' },
  ] },
  { id: 'formas', titulo: 'Las diez formas', bloques: [
    { p: 'Todas se importan de su archivo: <code>from fsets.polygon import Polygon</code>, y así con las demás, en minúsculas.' },
    { h: 'Polygon: la que debes usar' },
    { cod: C`
from fsets.polygon import Polygon

p = Polygon((0, 0), (2, 1), (5, 0.4), (10, 1))
print(p(1), p(3.5), p(10))          # interpola entre puntos
print(p(-5), p(99))                 # fuera, sigue constante: ¡no vale 0!
print(p.area(), round(p.COG(), 4))  # integra de forma exacta
print(len(list(p)), p[0])           # sus puntos, y acceso por posición
p.add_point((12, 0))                # este sí cambia el original
print(p)

# Cualquier función se puede muestrear como polígono:
import math
campana = Polygon.create_from(lambda x: math.exp(-(x - 5) ** 2 / 4), 0, 10, 50)
print(round(campana(5), 3), round(campana.COG(), 3))` },
    { p: 'Y dentro, <code>Polygon.Rect(m, n)</code> es la recta $y = m x + n$, con <code>build_from(p1, p2)</code>, <code>intersect(otra)</code>, <code>get_x(y)</code> y <code>area(a, b)</code>.' },
    { h: 'Trapezoid y Triangular' },
    { cod: C`
from fsets.trapezoid import Trapezoid
from fsets.triangular import Triangular

t = Trapezoid((1, 0), (3, 1), (7, 1), (9, 0))
print(t(2), t(5), t(8), t.area())
try:
    print(t.COG())                  # fallo F2 con meseta plana
except Exception as e:
    print('COG del trapecio:', type(e).__name__)

tri = Triangular((1, 0), (5, 1), (9, 0))
print(tri(3), tri.COG())
simetrico = Triangular((1, 0), (5, 1))   # sin el tercer punto, lo completa
print(simetrico(9), simetrico(7))` },
    { h: 'Gaussian, Gamma y Singleton' },
    { cod: C`
from fsets.gaussian import Gaussian
from fsets.gamma import Gamma
from fsets.singleton import Singleton
from interval import Interval

g = Gaussian(5, 1.5)                 # centro, ancho, y altura opcional
print(round(g(5), 3), round(g(6.5), 3), g.interval)  # ¡solo cubre ± 1 ancho!
print(g.COG())                       # siempre el centro

gam = Gamma(3, 0.4, Interval(0, 10))  # 0 hasta el 3, y luego sube
print(gam(2), round(gam(5), 3))

s = Singleton(5, 0.8)                # solo vale en un punto
print(s(5), s(6), s.membership(5))   # su membership da 0 (fallo F4)` },
    { h: 'SFunction, ZFunction y PiFunction' },
    { cod: C`
from fsets.sfunction import SFunction
from fsets.zfunction import ZFunction
from fsets.pifunction import PiFunction

s = SFunction((1, 0), 5, (9, 1))     # sube en forma de S
print(s(1), s(3), s(5), s(7), s(9))

# Para que baje, los puntos van al revés de lo que dice su comentario:
z = ZFunction((1, 0), 5, (9, 1))
print(z(1), z(3), z(5), z(7), z(9))
print(round(z(8), 3), round(z.membership(8), 3))   # no coinciden (F4)

try:
    PiFunction(5, 4)(5)
except Exception as e:
    print('PiFunction:', type(e).__name__, e)      # rota (F3)` },
    { h: 'Polynomial' },
    { cod: C`
from fsets.polynomial import Polynomial

# Coeficientes de mayor a menor grado: -0,04 x² + 0,4 x
p = Polynomial(-0.04, 0.4, 0, interval=Interval(0, 10))
print(p(5), p.grade)   # grade cuenta coeficientes: da 3, no 2` },
    { tabla: [['Forma', 'Usar en', 'Cuidado'], ['<code>Polygon</code>', 'Todo', 'Un borde vertical real divide por cero (F21)'], ['<code>Trapezoid</code>', 'Antecedentes', 'COG, COA, CM y MM fallan si la meseta es plana (F2)'], ['<code>Triangular</code>', 'Todo', '<code>add_point</code> devuelve otro objeto, no cambia este'], ['<code>Gaussian</code>', 'Antecedentes', 'Dos separadas rompen COG (F17); <code>~g</code> falla (F10)'], ['<code>Gamma</code>', 'Antecedentes', 'Su comentario dice que es una V; es de un solo lado'], ['<code>Singleton</code>', 'Salida con COGS', '<code>membership</code> da 0 (F4)'], ['<code>SFunction</code>', 'Antecedentes', 'Recortarla da una forma falsa (F5); salta si $b$ no está en el centro'], ['<code>ZFunction</code>', 'Antecedentes', 'Lo mismo, y los puntos al revés'], ['<code>PiFunction</code>', 'En ningún sitio', 'Falla al evaluarla (F3)'], ['<code>Polynomial</code>', 'Con un <code>Interval</code>', 'Con una tupla falla; <code>str(p)</code> también (F14)']] },
  ] },
  { id: 'normas', titulo: 'Normas: los «y», los «o» y los «no»', bloques: [
    { p: 'Una <b>[[norma T]]</b> generaliza el «y»; una <b>[[norma S]]</b>, el «o»; un complemento, el «no». En fuzzython se buscan por nombre.' },
    { cod: C`
from norms.norms import get_norm

for nombre in ('MIN', 'PROD', 'BDIF', 'DPROD', 'EPROD', 'FAND',
               'MAX', 'ASUM', 'BSUM', 'DSUM', 'ESUM', 'FOR', 'NSUM'):
    print(nombre.ljust(6), round(get_norm(nombre)(0.5, 0.7), 4))

for nombre in ('ZADEH', 'SUGENO', 'YAGER'):
    print(nombre.ljust(6), get_norm(nombre)(0.3))

print(get_norm('NOEXISTE'))   # no da error: un aviso y None (F12)` },
    { tabla: [['Nombre', 'Fórmula', 'Pareja', 'Nota'], ['<code>MIN</code>', '$\\min(x, y)$', '<code>MAX</code>', 'Admite más argumentos'], ['<code>PROD</code>', '$x y$', '<code>ASUM</code>', 'Probabilidades independientes'], ['<code>BDIF</code>', '$\\max(0, x + y - 1)$', '<code>BSUM</code>', 'Łukasiewicz'], ['<code>DPROD</code>', '$y$ si $x = 1$; $x$ si $y = 1$; si no, 0', '<code>DSUM</code>', 'La más baja de todas'], ['<code>EPROD</code>', '$\\frac{x y}{1 + (1 - x)(1 - y)}$', '<code>ESUM</code>', 'Einstein'], ['<code>FAND</code>', '$\\frac{1}{2} \\min(x, y) + \\frac{x + y}{4}$', '<code>FOR</code>', '<b>No es una norma T</b>'], ['<code>NSUM</code>', '$\\frac{x + y}{\\max(1, x + y)}$', '', 'Con dos argumentos, igual a <code>BSUM</code>'], ['<code>ZADEH</code>', '$1 - x$', '', 'Complemento'], ['<code>SUGENO</code>', '$\\frac{1 - x}{1 + \\lambda x}$', '', 'Por nombre, $\\lambda = 0$: igual a <code>ZADEH</code>'], ['<code>YAGER</code>', '$(1 - x^w)^{\\frac{1}{w}}$', '', 'Por nombre, $w = 1$: igual a <code>ZADEH</code>']] },
    { h: 'Cómo elegir' },
    { lista: ['<b><code>MIN</code> y <code>MAX</code>:</b> la opción de serie. Solo cuenta el grado más débil, o el más fuerte.', '<b><code>PROD</code> y <code>ASUM</code>:</b> cuando cada grado importa, o los grados son probabilidades independientes.', '<b><code>BDIF</code> y <code>BSUM</code>:</b> la lógica de Łukasiewicz. Más exigente en el «y».', '<b><code>FAND</code> y <code>FOR</code>:</b> un «y» que compensa: un grado bajo no lo hunde del todo. Pero no son normas.'] },
    { h: 'Un complemento con parámetro' },
    { p: 'Por nombre siempre usa el parámetro de serie. Para otro, se asigna una función a <code>block.not_</code>, <b>antes</b> de añadir las reglas, porque cada regla copia sus normas al crearse.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.sugeno import SugenoSystem
from variable import Variable

si = Adjective('si', Polygon((0, 0), (1, 1)))
x = Variable('x', '', si)
b = RuleBlock('b')
b.not_ = lambda v: (1 - v) / (1 + 2 * v)     # Sugeno, con lambda = 2
b.add_rule('if x is not si then z = 1', locals())
print(SugenoSystem('s', b).compute({'x': 0.5}))   # media ponderada: siempre 1
print(round(b.not_(0.5), 4))                       # la fuerza: 0,25, no 0,5` },
  ] },
  { id: 'adjetivos', titulo: 'Adjective y Variable', bloques: [
    { p: 'Un <code>Adjective</code> es una palabra; una <code>Variable</code>, lo que se mide. Viene de la variable lingüística de Zadeh.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from variable import Variable

cold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))
hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))
temp = Variable('temp', 'C', cold, hot)

print(cold.name, cold.fset)        # su nombre y su conjunto
print(cold.membership(18))         # el grado de un valor
print(temp.name, temp.unit)
print(temp.fuzzify(18))            # guarda el valor, y lista los grados
print(temp.value)

# La fuerza se queda con el máximo, por muchas reglas que lleguen
cold.strength = 0.3
cold.strength = 0.7
cold.strength = 0.2
print(cold.strength)
temp.reset()                       # pone a cero las de esta variable
print(cold.strength)` },
    { tabla: [['Parámetro de <code>Variable</code>', 'Para qué'], ['<code>name</code>', 'El nombre'], ['<code>unit</code>', 'La unidad: obligatoria para poder pasar adjetivos'], ['<code>*adjectives</code>', 'Sus palabras'], ['<code>defuzzification</code>', 'En mayúsculas: <code>COG</code>, <code>COA</code>, <code>CM</code>, <code>MM</code>, <code>LM</code>, <code>RM</code>, <code>COGS</code>'], ['<code>default</code>', 'Qué responder si nada se activa, o si la cuenta falla']] },
    { aviso: 'Si la desdifusión falla, <code>Variable</code> captura el error, lo imprime y devuelve <code>default</code>. Con <code>default=0</code>, un error parece un resultado (F6). Mientras desarrollas, usa <code>default=float(\'nan\')</code>.' },
    { aviso: 'La fuerza y el conjunto activado se guardan <b>dentro del adjetivo</b>. Por eso no se pueden usar hilos, y dos sistemas que comparten adjetivos se pisan. Un juego de adjetivos por sistema.' },
  ] },
  { id: 'reglas', titulo: 'Reglas: la gramática completa', bloques: [
    { pre: C`
regla        ->  [prefijo ':'] 'if' antecedente ' then ' consecuente
prefijo      ->  's' | 't'         (sin él: se decide por el contenido)
consecuente  ->  salida 'is' adj {',' salida 'is' adj} ['with' peso]   Mamdani
               | nombre '=' expresión ['with' peso]                    Sugeno
antecedente  ->  término {'or' término}
término      ->  factor {'and' factor}
factor       ->  var 'is' ['not'] adj | '(' antecedente ')' | 'NOT' '(' antecedente ')'` },
    { p: 'Como <code>and</code> está más abajo en la gramática, se calcula antes que <code>or</code>: igual que × antes que +. Usa paréntesis si lo necesitas.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from rules.rule import Rule
from variable import Variable

normal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))
hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))
temp = Variable('temp', 'C', normal, hot)
high = Adjective('high', Polygon((40, 0), (80, 1), (100, 1)))
hum = Variable('hum', '%', high)
large = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))
small = Adjective('small', Polygon((0, 1), (25, 0)))
minutes = Variable('minutes', 'min', large, small, defuzzification='COG', default=0)
ruido = Variable('ruido', 'dB', Adjective('fuerte', Polygon((0, 0), (10, 1))), defuzzification='COG', default=0)
fuerte = list(ruido.adjectives)[0]

# Sin paréntesis: primero and
r1 = Rule.parse('if temp is hot and hum is high or temp is normal then minutes is large', locals())
r1._antecedent.print_tree()

# Con paréntesis, otra regla
r2 = Rule.parse('if temp is hot and (hum is high or temp is normal) then minutes is large', locals())
r2._antecedent.print_tree()

# Negar una palabra, o un paréntesis entero (NOT, en mayúsculas)
r3 = Rule.parse('if temp is not hot then minutes is small', locals())
r4 = Rule.parse('if NOT (temp is hot or hum is high) then minutes is small', locals())
print(r3._antecedent, '|', r4._antecedent)

# Varias salidas a la vez, y un peso para toda la regla
r5 = Rule.parse('if temp is hot then minutes is large, ruido is fuerte with 0.8', locals())
print(type(r5).__name__, r5.weight)` },
    { h: 'Las sutilezas, comprobadas una a una' },
    { tabla: [['Elemento', 'La regla real'], ['<code>if</code>, <code> then </code>, <code>with</code>, el <code>is</code> del consecuente', 'Solo en minúsculas; <code> then </code> con un espacio a cada lado'], ['<code>and</code>, <code>or</code>, <code>is</code>, <code>not</code> del antecedente', 'En cualquier forma'], ['<code>NOT (</code>', 'Solo en mayúsculas'], ['Nombres', 'Son claves de <code>scope</code>, no el <code>name</code> de tus objetos'], ['Separación', 'Por espacios: <code>temp is(hot)</code> no funciona'], ['¿Sugeno o Mamdani?', 'Si «is» no aparece como texto en el consecuente, es Sugeno (F9)'], ['Consecuente negado', 'Error: no se permite'], ['Peso', 'Afecta a toda la regla. <code>with 2</code> se acepta sin comprobar; <code>rule.weight = 2</code> se ignora en silencio'], ['Sugeno: variables', 'Solo las de su propio antecedente (F8)'], ['Sugeno: operaciones', '<code>+ - * /</code>, también entre variables. No <code>**</code> ni <code>-x</code>'], ['<code>t:</code>', 'Obligatorio con <code>TsukamotoSystem</code>'], ['Sistema equivocado', 'Una regla Sugeno en Mamdani no aporta salida. Una Mamdani en Sugeno da error']] },
    { h: 'Un árbol, sin texto' },
    { p: 'El texto solo es una comodidad: se puede construir el mismo árbol a mano.' },
    { cod: C`
from operators._and import And
from operators._or import Or
from operators._not import Not
from predicate import Predicate
from norms.norms import get_norm

p_hot = Predicate(temp, hot)
p_high = Predicate(hum, high)
arbol = Or(And(p_hot, p_high, get_norm('MIN')), Not(p_hot, get_norm('ZADEH')), get_norm('MAX'))
temp.value, hum.value = 33, 70
print(arbol)
print(round(arbol.evaluate(), 3))   # max(min(0,6; 0,75); 1 - 0,6)
print(len(list(arbol.leaves())))    # sus hojas` },
  ] },
  { id: 'bloque', titulo: 'RuleBlock: reglas con sus normas', bloques: [
    { p: 'Un bloque decide cinco cosas: el «y», el «o», el «no», cómo activar y cómo acumular.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.mamdani import MamdaniSystem
from variable import Variable

def sistema(**normas):
    # Cada sistema crea sus propios adjetivos: guardan estado.
    cold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))
    normal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))
    hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))
    temp = Variable('temp', 'C', cold, normal, hot)
    short = Adjective('short', Polygon((0, 1), (10, 1), (15, 0)))
    usual = Adjective('usual', Polygon((10, 0), (15, 1), (25, 1), (30, 0)))
    large = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))
    minutes = Variable('minutes', 'min', short, usual, large, defuzzification='COG', default=0)
    b = RuleBlock('b', **normas)
    b.add_rules('if temp is cold or temp is normal then minutes is short with 0.5',
                'if temp is normal then minutes is usual',
                'if temp is hot then minutes is large', scope=locals())
    return MamdaniSystem('m', b), b

for normas in ({}, {'activation': 'PROD'}, {'accumulation': 'BSUM'},
               {'operators': ('PROD', 'ASUM', 'ZADEH')}):
    s, b = sistema(**normas)
    print(normas, round(s.compute({'temp': 33})['b']['minutes'], 4))

s, b = sistema()
print(len(b.rules), list(b.inputs), list(b.outputs))   # qué tiene dentro
print(b)` },
    { tabla: [['Parámetro', 'De serie', 'Qué hace'], ['<code>operators</code>', '<code>(\'MIN\', \'MAX\', \'ZADEH\')</code>', 'Se aplican <b>al analizar</b> la regla: cambiarlos después no sirve'], ['<code>activation</code>', '<code>\'MIN\'</code>', '<code>MIN</code> recorta; <code>PROD</code> escala: es el sistema de Larsen'], ['<code>accumulation</code>', '<code>\'MAX\'</code>', 'Une los conjuntos de palabras distintas']] },
    { aviso: 'Dentro de una misma palabra, siempre gana el máximo (F7). Si dos reglas llegan a <code>large</code> con fuerzas 0,6 y 0,3, su fuerza es 0,6, aunque <code>accumulation</code> sea <code>BSUM</code>.' },
    { p: 'Un sistema admite varios bloques: <code>MamdaniSystem(\'m\', b1, b2)</code>. Cada uno da su propia entrada en el resultado.' },
  ] },
  { id: 'mamdani', titulo: 'Motor 1: Mamdani', bloques: [
    { p: 'Cada regla responde con una <b>forma</b>; se unen, y al final se reduce a un número. Se lee muy bien, y exige integrar.' },
    { lista: ['<b>Regla:</b> <code>if ... then salida is palabra [, otra is palabra] [with w]</code>.', '<b>Salida:</b> <code>{bloque: {variable: valor}}</code>.', '<b>Si nada se activa:</b> el <code>default</code>, e imprime un error.', '<b>Admite</b> varias salidas por regla, y elegirlas: <code>compute(entradas, outputs={\'minutes\': minutes})</code>.'] },
    { cod: C`
# Un ejemplo con dos entradas: la potencia de un ventilador
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.mamdani import MamdaniSystem
from variable import Variable

fresco = Adjective('fresco', Polygon((15, 1), (25, 0)))
calido = Adjective('calido', Polygon((20, 0), (30, 1)))
temp = Variable('temp', 'C', fresco, calido)
seco = Adjective('seco', Polygon((30, 1), (60, 0)))
humedo = Adjective('humedo', Polygon((40, 0), (80, 1)))
hum = Variable('hum', '%', seco, humedo)
baja = Adjective('baja', Polygon((0, 1), (40, 0)))
media = Adjective('media', Polygon((20, 0), (50, 1), (80, 0)))
alta = Adjective('alta', Polygon((60, 0), (100, 1)))
potencia = Variable('potencia', '%', baja, media, alta, defuzzification='COG', default=float('nan'))

b = RuleBlock('ventilador')
b.add_rules('if temp is fresco then potencia is baja',
            'if temp is calido and hum is seco then potencia is media',
            'if temp is calido and hum is humedo then potencia is alta', scope=locals())
s = MamdaniSystem('v', b)

for t, h in ((18, 50), (26, 40), (26, 75), (32, 90)):
    r = s.compute({'temp': t, 'hum': h})['ventilador']['potencia']
    print(t, h, round(r, 1), '|', round(baja.strength, 2), round(media.strength, 2), round(alta.strength, 2))` },
    { p: 'Las fuerzas de la derecha explican cada resultado. Cuando un sistema difuso dé un número raro, empieza mirando ahí.' },
  ] },
  { id: 'sugeno', titulo: 'Motor 2: Sugeno', bloques: [
    { p: 'Cada regla responde con un <b>número</b>, calculado con su fórmula. La salida es la media ponderada: $y = \\frac{\\sum_r w_r z_r}{\\sum_r w_r}$. Sin integrales, y muy rápido.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.sugeno import SugenoSystem
from variable import Variable

cold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))
normal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))
hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))
temp = Variable('temp', 'C', cold, normal, hot)

b = RuleBlock('b')
b.add_rules('if temp is cold then z = temp*0.1',        # z es un adorno: no se usa
            'if temp is normal then z = temp*0.3 + 1',
            'if temp is hot then z = temp*0.6 + 2 with 0.9', scope=locals())
s = SugenoSystem('s', b)
print(s.compute({'temp': 33}))     # {bloque: valor}, sin la variable

# Una constante también vale como fórmula: es el orden cero
b0 = RuleBlock('cero')
b0.add_rules('if temp is cold then z = 2', 'if temp is hot then z = 8', scope=locals())
print(SugenoSystem('s0', b0).compute({'temp': 10}))

# Si no se activa ninguna regla, devuelve 0, sin avisar
print(SugenoSystem('s0', b0).compute({'temp': 25}))` },
    { h: 'Sus dos trampas' },
    { cod: C`
far = Adjective('far', Polygon((0, 0), (10, 1)))
dist = Variable('dist', 'm', far)
fast = Adjective('fast', Polygon((0, 0), (10, 1)))
vel = Variable('vel', 'm/s', fast)

def prueba(regla, **entradas):
    b = RuleBlock('t')
    try:
        b.add_rules(regla, scope=globals())
        print(SugenoSystem('p', b).compute(entradas))
    except Exception as e:
        print(type(e).__name__, e)

# 1. Solo ve las variables de su antecedente:
prueba('if temp is hot then z = vel*2', temp=33, vel=5)
# El arreglo: menciónala en el antecedente
prueba('if temp is hot and vel is fast then z = vel*2', temp=33, vel=5)
# 2. Busca «is» como texto, y dist lo contiene:
prueba('if temp is hot then z = dist*2', temp=33, dist=5)` },
    { aviso: 'La fórmula pasa por <code>eval</code>: ejecuta <b>cualquier código de Python</b>. Nunca cargues reglas ni archivos FCL de alguien en quien no confías (F8).' },
  ] },
  { id: 'tsukamoto', titulo: 'Motor 3: Tsukamoto', bloques: [
    { p: 'Cada regla da un número: el punto en que su curva vale la fuerza de la regla. La salida es la media ponderada de esos puntos. Exige curvas <b>monótonas</b>: que solo suban o solo bajen.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.tsukamoto import TsukamotoSystem
from variable import Variable

cold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))
normal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))
hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))
temp = Variable('temp', 'C', cold, normal, hot)
short = Adjective('short', Polygon((0, 1), (15, 1), (25, 0)))    # solo baja
large = Adjective('large', Polygon((15, 0), (25, 1), (40, 1)))   # solo sube
minutes = Variable('minutes', 'min', short, large, defuzzification='COG', default=0)

b = RuleBlock('b')
b.add_rule('t:if temp is cold then minutes is short', locals())   # t: es obligatorio
b.add_rule('t:if temp is normal then minutes is large with 0.5', locals())
b.add_rule('t:if temp is hot then minutes is large', locals())
s = TsukamotoSystem('t', b)
print(s.compute({'temp': 33}))
print(round(s.compute({'temp': 33})['b'], 4))   # acaba con tolerancia: redondea` },
    { p: 'A 33 grados: $\\frac{0{,}2 \\cdot 17 + 0{,}6 \\cdot 21}{0{,}8} = 20$. El peso actúa dos veces: cambia dónde cae el punto, y cuánto cuenta.' },
    { h: 'Con una curva que no es monótona' },
    { cod: C`
tri = Adjective('tri', Polygon((0, 0), (20, 1), (40, 0)))     # sube y baja
salida = Variable('salida', 'min', tri, defuzzification='COG', default=0)
b2 = RuleBlock('b2')
b2.add_rule('t:if temp is normal then salida is tri', locals())
print(TsukamotoSystem('t2', b2).compute({'temp': 18}))` },
    { aviso: 'Da 0, sin ningún error. Comprueba tú la monotonía antes (F22). Esta función de una línea basta: <code>ys == sorted(ys) or ys == sorted(ys, reverse=True)</code>, con <code>ys = [y for x, y in polígono]</code>.' },
    { h: 'Los tres motores, frente a frente' },
    { tabla: [['', 'Mamdani', 'Sugeno', 'Tsukamoto'], ['Clase de regla', '<code>MRule</code>', '<code>SRule</code>', '<code>TRule</code>'], ['Consecuente', 'Una o varias palabras', 'Una fórmula', 'Una palabra monótona'], ['Por regla', 'Recorta o escala', 'Evalúa con <code>eval</code>', 'Busca $x$ con $\\mu(x) = w$'], ['Combina', 'Acumula y desdifusa', '$\\frac{\\sum w z}{\\sum w}$', '$\\frac{\\sum w x}{\\sum w}$'], ['Salida', '<code>{bloque: {var: v}}</code>', '<code>{bloque: v}</code>', '<code>{bloque: v}</code>'], ['Si nada se activa', '<code>default</code> y un error', '0', '0'], ['¿Integra?', 'Sí', 'No', 'No'], ['Mejor para', 'Reglas de un experto', 'Control, y aproximar funciones', 'Salidas monótonas']] },
  ] },
  { id: 'difusa', titulo: 'Entradas difusas', bloques: [
    { p: 'La función que el README no menciona. Si no sabes el valor exacto, pasa un conjunto en lugar de un número. El grado de cada palabra es el mejor encaje posible con la entrada: $\\sup_x \\min(\\mu_A(x), \\mu_E(x))$.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from fsets.singleton import Singleton
from fsets.triangular import Triangular
from ruleblock import RuleBlock
from systems.mamdani import MamdaniSystem
from variable import Variable

cold = Adjective('cold', Polygon((0, 1), (15, 1), (20, 0)))
normal = Adjective('normal', Polygon((15, 0), (20, 1), (30, 1), (35, 0)))
hot = Adjective('hot', Polygon((30, 0), (35, 1), (40, 1)))
temp = Variable('temp', 'C', cold, normal, hot)
short = Adjective('short', Polygon((0, 1), (10, 1), (15, 0)))
usual = Adjective('usual', Polygon((10, 0), (15, 1), (25, 1), (30, 0)))
large = Adjective('large', Polygon((25, 0), (30, 1), (40, 1)))
minutes = Variable('minutes', 'min', short, usual, large, defuzzification='COG', default=0)
b = RuleBlock('b')
b.add_rules('if temp is cold or temp is normal then minutes is short with 0.5',
            'if temp is normal then minutes is usual',
            'if temp is hot then minutes is large', scope=locals())
m = MamdaniSystem('m', b)

print(m.compute({'temp': 33}))                                       # exacto
print(m.compute({'temp': Triangular((30, 0), (33, 1), (36, 0))}))    # «unos 33»
print(round(usual.strength, 3), round(large.strength, 3))            # suben los dos
print(m.compute({'temp': Singleton(33, 0.5)}))                       # «33, pero solo al 0,5»` },
    { lista: ['Entre polígonos, se calcula exacto; en otros casos, con 100 muestras.', 'En Sugeno solo sirve para el antecedente: si la fórmula usa esa variable, falla.', '<code>ZFunction</code>, <code>Singleton</code> y <code>PiFunction</code> tienen mal <code>membership</code>: como palabra de una regla, con entrada difusa, dan grados falsos (F4).'] },
  ] },
  { id: 'desdifusion', titulo: 'Desdifusión: del conjunto al número', bloques: [
    { p: 'Se elige con <code>defuzzification=</code>, en mayúsculas. <code>Variable</code> llama al método de ese nombre, así que vale cualquier método sin argumentos, también uno tuyo.' },
    { cod: C`
from fsets.polygon import Polygon

m = Polygon((0, 0), (4, 1), (8, 0)).minimize(0.7) | Polygon((2, 0), (6, 1), (10, 0)).minimize(0.3)
for metodo in ('COG', 'COA', 'CM', 'MM', 'LM', 'RM'):
    print(metodo, round(getattr(m, metodo)(), 4))` },
    { tabla: [['Nombre', 'Significado', 'En <code>FuzzySet</code>', 'En <code>Polygon</code>'], ['<code>COG</code>', '$\\frac{\\int x\\, \\mu}{\\int \\mu}$: el punto de equilibrio', 'Trapecios', 'Exacto'], ['<code>COA</code>', 'Parte el área en dos', 'Bisección', 'Áreas exactas'], ['<code>LM</code>', 'Primer máximo', 'Muestreado', 'Entre vértices'], ['<code>RM</code>', 'Último máximo', 'Muestreado', 'Entre vértices'], ['<code>CM</code>', '$\\frac{LM + RM}{2}$', 'Heredado', 'Heredado'], ['<code>MM</code>', 'Media de los puntos de máximo', 'Muestreado', 'Solo vértices: sesgado (F20)'], ['<code>COGS</code>', '$\\frac{\\sum s_i w_i}{\\sum w_i}$', 'Solo <code>Singleton</code>', '']] },
    { lista: ['<b>Control:</b> <code>COG</code>. Cambia sin saltos.', '<b>Con dos opiniones separadas:</b> <code>COG</code> puede caer entre ellas, donde ninguna regla opina. Mira <code>LM</code> o <code>RM</code>.', '<b>Mesetas:</b> usa <code>CM</code>, no <code>MM</code>.', '<b>Con salidas de un solo punto:</b> <code>COGS</code>.'] },
    { h: 'Salidas de un solo punto, con COGS' },
    { cod: C`
from adjective import Adjective
from fsets.singleton import Singleton
from ruleblock import RuleBlock
from systems.mamdani import MamdaniSystem
from variable import Variable

fria = Adjective('fria', Polygon((0, 1), (20, 0)))
agua = Variable('agua', 'C', fria)
poco = Adjective('poco', Singleton(10))
mucho = Adjective('mucho', Singleton(90))
fuego = Variable('fuego', '%', poco, mucho, defuzzification='COGS', default=0)
b = RuleBlock('b')
b.add_rules('if agua is fria then fuego is mucho', 'if agua is not fria then fuego is poco', scope=locals())
print(MamdaniSystem('f', b).compute({'agua': 5}))   # (0,25·10 + 0,75·90) / 1` },
  ] },
  { id: 'fcl', titulo: 'FCL: sistemas en un archivo', bloques: [
    { p: 'FCL (<em>Fuzzy Control Language</em>) es el formato de la norma IEC 61131-7. Escribir funciona sin nada más. Leer necesita <code>antlr3</code> 3.5, retocado como indica <code>store/reader.py</code>.' },
    { cod: C`
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.mamdani import MamdaniSystem
from variable import Variable

frio = Adjective('frio', Polygon((0, 1), (15, 1), (20, 0)))
temp = Variable('temp', 'C', frio)
corto = Adjective('corto', Polygon((0, 1), (10, 1), (15, 0)))
tiempo = Variable('tiempo', 'min', corto, defuzzification='COG', default=0)
b = RuleBlock('primero')
b.add_rule('if temp is frio then tiempo is corto with 0.5', locals())
s = MamdaniSystem('cocina', b)

print(s.dump_())    # el texto; s.dump('sistema.fcl') lo guarda en un archivo` },
    { p: 'El <code>RULE 74</code> es un contador global: cuenta todas las reglas creadas hasta entonces, así que tu número será otro.' },
    { p: 'Y para leerlo. <b>Este bloque no se ha ejecutado</b>, porque exige ese <code>antlr3</code>; la sintaxis sale de la gramática <code>store/FCL.g</code>:' },
    { esquema: C`
from store.reader import load_from_file, load_from_string

sistema = load_from_file('sistema.fcl')   # None si falla, e imprime el error
print(sistema.compute({'temp': 10}))` },
    { pre: C`
FUNCTION_BLOCK _SUGENO_ nombre           (* tipo opcional; sin él, Mamdani *)
    VAR_INPUT temp: REAL; END_VAR
    VAR_OUTPUT tiempo: REAL; END_VAR

    FUZZIFY temp
        TERM frio := (0, 1) (15, 1) (20, 0);
        TERM medio := Trapezoid((15, 0), (20, 1), (30, 1), (35, 0));
    END_FUZZIFY

    DEFUZZIFY tiempo
        TERM corto := (0, 1) (10, 1) (15, 0);
        METHOD: COG;
        DEFAULT := 0;                    (* obligatorio; NC significa «ninguno» *)
    END_DEFUZZIFY

    RULEBLOCK primero
        AND: MIN;                        (* el par OR se completa solo *)
        ACT: MIN;
        ACCU: MAX;                       (* obligatorio *)
        RULE 1: IF temp IS frio THEN tiempo IS corto WITH 0.5;
    END_RULEBLOCK
END_FUNCTION_BLOCK` },
    { tabla: [['Detalle', 'Qué pasa'], ['Tipo', '<code>_SUGENO_</code>, <code>_TSUKAMOTO_</code> y <code>_MAMDAMI_</code>, <b>con esa errata</b>; <code>_MAMDANI_</code> no se reconoce'], ['Conjuntos con nombre', '<code>Nombre(params)</code> importa <code>fsets.&lt;nombre&gt;</code>'], ['Consecuentes Sugeno', 'Admiten <code>+ - * ** / //</code>'], ['Comentarios', '<code>(* ... *)</code>'], ['Números', 'Sin exponente: <code>1e-5</code> no vale'], ['<code>RANGE</code>', 'Se lee, y se descarta'], ['Sin <code>ACT</code> en Mamdani', 'Todas las salidas dan <code>default</code>']] },
    { aviso: '<code>dump()</code> no siempre se puede volver a leer: pierde <code>OR</code> y <code>NOT</code> si no son el par de serie, <code>Gaussian</code> y <code>Gamma</code> escriben un <code>Interval</code> que la gramática no admite, y <code>default=None</code> no escribe <code>DEFAULT</code>, que es obligatorio. Y FCL pasa por <code>eval</code>: nunca cargues uno ajeno.' },
  ] },
  { id: 'extender', titulo: 'Extenderlo: piezas propias', bloques: [
    { h: 'Una norma' },
    { p: 'El decorador le pone nombre. Para que <code>get_norm</code> la encuentre, guárdala en <code>norms/hamacher2.py</code> (el archivo, con el nombre en minúsculas), o regístrala en el módulo:' },
    { cod: C`
import norms.norms as registro
from norms.norms import get_norm
from utils import norm

@norm(type_='TNORM', name='HAMACHER2')
def hamacher2(x, y):
    d = 2 + (1 - 2) * (x + y - x * y)
    return 0 if d == 0 else x * y / d

registro.hamacher2 = hamacher2    # ya la encuentra por su nombre
t = get_norm('HAMACHER2')

# Antes de confiar en ella, comprueba que el 1 es neutro:
print(t(0.5, 1), t(0.7, 1), t(0.5, 0.5))
print(get_norm('FAND')(0.5, 1))    # esta falla la prueba: no es una norma T` },
    { h: 'Un conjunto' },
    { p: 'Hereda de <code>FuzzySet</code>, y define <code>__call__</code> <b>y también</b> <code>membership</code>: si no, las entradas difusas usarán la de la clase madre (F4).' },
    { cod: C`
import math
from fsets.fuzzy_set import FuzzySet
from interval import Interval

class Logistica(FuzzySet):
    def __init__(self, c, k, intervalo):
        super().__init__(None, intervalo)
        self.c, self.k = c, k
    def __call__(self, x):
        return 1 / (1 + math.exp(-self.k * (x - self.c)))
    membership = __call__

f = Logistica(5, 2, Interval(0, 10))
print(round(f(5), 3), round(f(7), 3), round(f.COG(), 3))` },
    { h: 'Un método de desdifusión' },
    { cod: C`
from fsets.polygon import Polygon

# Variable llama por su nombre a cualquier método sin argumentos.
# Este devuelve el primer vértice con grado de 0,5 o más.
def primero_medio(self):
    xs = [x for x, y in self if y >= 0.5]
    return xs[0] if xs else None
Polygon.PRIMERO = primero_medio

print(Polygon((0, 0), (4, 1), (8, 0)).PRIMERO())` },
    { h: 'Un motor de inferencia' },
    { p: 'Hereda de <code>System</code>, e implementa <code>inference</code> y <code>compute</code>; si hace falta, una clase de <code>Rule</code> con su <code>compute</code>. Para usarlo desde FCL hay que tocar <code>get_system</code> en <code>store/FCL.g</code> y regenerar con ANTLR.' },
  ] },
  { id: 'proyecto', titulo: 'Un proyecto completo: control de un péndulo', bloques: [
    { p: 'Como el de la región 6 del curso: mantener un péndulo invertido en pie, con dos entradas, y simulado paso a paso. Sugeno, porque se ejecuta muchas veces por segundo.' },
    { cod: C`
import math
from adjective import Adjective
from fsets.polygon import Polygon
from ruleblock import RuleBlock
from systems.sugeno import SugenoSystem
from variable import Variable

# Entradas: el ángulo (rad) y la velocidad con la que cae (rad/s)
izq = Adjective('izq', Polygon((-0.5, 1), (0, 0)))
der = Adjective('der', Polygon((0, 0), (0.5, 1)))
centro = Adjective('centro', Polygon((-0.3, 0), (0, 1), (0.3, 0)))
ang = Variable('ang', 'rad', izq, centro, der)
baja = Adjective('baja', Polygon((-2, 1), (0, 0)))
sube = Adjective('sube', Polygon((0, 0), (2, 1)))
quieto = Adjective('quieto', Polygon((-1, 0), (0, 1), (1, 0)))
vel = Variable('vel', 'rad/s', baja, quieto, sube)

# La salida es la fuerza, cada regla con su valor (orden cero)
b = RuleBlock('fuerza')
b.add_rules('if ang is izq then z = -18',
            'if ang is der then z = 18',
            'if vel is baja then z = -7',
            'if vel is sube then z = 7',
            'if ang is centro and vel is quieto then z = 0', scope=locals())
control = SugenoSystem('pendulo', b)

# Simulación: ángulo inicial de 0,3 rad, 5 segundos, pasos de 20 ms
g, l, dt = 9.8, 1.0, 0.02
th, om = 0.3, 0.0
import contextlib, io
for i in range(251):
    if i % 50 == 0:
        print(f't = {i * dt:.0f} s   ángulo = {th:+.4f}   velocidad = {om:+.4f}')
    with contextlib.redirect_stdout(io.StringIO()):      # calla la línea del tiempo
        u = control.compute({'ang': th, 'vel': om})['fuerza']
    om += (g / l * math.sin(th) - u / l) * dt
    th += om * dt` },
    { p: 'El ángulo cae hacia 0: las reglas sostienen el péndulo. Mira cómo se lee el controlador: dos reglas para el ángulo, dos para la velocidad, y una para no hacer nada.' },
    { aviso: 'Es un modelo simplificado, para aprender a montar la pieza. Un control real exige validar el modelo del sistema, y sus límites.' },
  ] },
  { id: 'fallos', titulo: 'Los 24 fallos, y cómo evitarlos', bloques: [
    { p: 'Encontrados leyendo y ejecutando todo su código. <b>Alta:</b> impide o falsea un cálculo normal. <b>Media:</b> afecta a una función concreta. <b>Baja:</b> una rareza.' },
    { tabla: [['Id', 'Dónde', 'Qué pasa', 'Gravedad', 'Arreglo'],
      ['F1', '<code>utils.py</code>', '<code>time.clock</code> no existe: <code>compute()</code> falla', 'Alta', '<code>time.clock = time.perf_counter</code>'],
      ['F2', '<code>fsets/trapezoid.py</code>', 'Con meseta plana, <code>COG</code>, <code>COA</code>, <code>CM</code> y <code>MM</code> lanzan <code>TypeError</code>', 'Alta', 'Usa <code>Polygon</code>'],
      ['F3', '<code>fsets/pifunction.py</code>', 'No se puede evaluar', 'Alta', '<code>Polygon.create_from</code>'],
      ['F4', '<code>sfunction</code>, <code>singleton</code>, <code>pifunction</code>', '<code>membership</code> mal enlazado', 'Alta, con entradas difusas', 'Evítalas ahí'],
      ['F5', '<code>fsets/sfunction.py</code>', 'Recortar S o Z da una forma falsa, sin avisar', 'Alta', 'No en consecuentes'],
      ['F6', '<code>variable.py</code>', 'Cualquier error de desdifusión se vuelve <code>default</code>', 'Alta', '<code>default=float(\'nan\')</code>'],
      ['F7', '<code>adjective.py</code>', 'Dentro de una palabra, siempre el máximo', 'Media', 'Conócelo'],
      ['F8', '<code>rules/srule.py</code>', '<code>eval</code> ve solo su antecedente, y ejecuta cualquier código', 'Alta', 'Solo reglas tuyas'],
      ['F9', '<code>rules/parser.py</code>', 'Busca «is» como texto: <code>dist</code> falla', 'Media', 'Evita esos nombres'],
      ['F10', '<code>fsets/fuzzy_set.py</code>', '<code>~Gaussian(...)</code> falla al evaluarse', 'Media', 'Pasa a <code>Polygon</code>'],
      ['F11', '<code>fsets/polygon.py</code>', '<code>complement</code> ignora su argumento', 'Media', 'Calcúlalo aparte'],
      ['F12', '<code>norms/norms.py</code>', 'Una norma mal escrita no da error', 'Media', 'Comprueba <code>get_norm</code>'],
      ['F13', '<code>rules/rule.py</code>', 'Errata: <code>input_adj</code> falla con árboles', 'Baja', 'No lo uses ahí'],
      ['F14', '<code>fsets/polynomial.py</code>', 'Falla con tupla, y al imprimirlo', 'Media', 'Dale un <code>Interval</code>'],
      ['F15', '<code>interval.py</code>', '<code>middle</code> da medio ancho', 'Baja', 'Calcula <code>(a + b) / 2</code>'],
      ['F16', '<code>interval.py</code>', 'Compara mal con tuplas', 'Baja', 'Compara con un <code>Interval</code>'],
      ['F17', '<code>fsets/fuzzy_set.py</code>', 'Dos gaussianas separadas rompen <code>COG</code>', 'Alta', 'Pasa a <code>Polygon</code>'],
      ['F18', '<code>Polygon.union</code>', 'Unir polígonos separados inventa área', 'Media', 'Baja sus bordes a 0'],
      ['F19', '<code>fsets/fuzzy_set.py</code>', '<code>a += step</code>: un tramo de más', 'Media', 'Usa <code>Polygon</code>'],
      ['F20', '<code>Polygon.MM</code>', 'Promedia vértices', 'Media', 'Usa <code>CM</code>'],
      ['F21', 'Borde vertical', 'Divide por cero', 'Media', 'Prolonga con <code>Polygon</code>'],
      ['F22', '<code>TRule</code>', 'Curva no monótona: da 0 o algo arbitrario', 'Media', 'Compruébala'],
      ['F23', '<code>store/FCL.g</code>', '<code>_MAMDAMI_</code>; <code>ACT</code> sin valor; <code>RANGE</code> se descarta', 'Media', 'Prueba con ejemplos'],
      ['F24', '<code>fsets/*.py</code>', 'Avisos de Python 3.14 por los comentarios', 'Baja', 'Ignóralos, de momento']] },
    { p: 'Se reprodujeron ejecutando la librería con Python 3.14, salvo F23 y la parte de F12 sobre <code>AND</code>, que se han leído en el código porque leer FCL exige <code>antlr3</code>.' },
    { h: 'Siete recetas para no tropezar' },
    { lista: ['<b>Usa <code>Polygon</code> para todo</b>: es exacto, y evita F2, F3, F5, F17 y F19.', '<b>Fija siempre <code>defuzzification</code> y <code>default</code></b>, con un <code>default</code> imposible, como <code>float(\'nan\')</code>.', '<b>No uses <code>ZFunction</code>, <code>SFunction</code> ni <code>PiFunction</code> en consecuentes.</b>', '<b>Escribe las reglas en minúsculas</b>, salvo <code>NOT (</code>. Y evita nombres con «is».', '<b>En Sugeno, pon en el antecedente</b> todas las variables de la fórmula.', '<b>Un <code>RuleBlock</code> y un juego de adjetivos por sistema.</b>', '<b>No cargues FCL ni reglas de nadie en quien no confíes.</b>'] },
    { h: 'Un comprobador para copiar' },
    { cod: C`
import math
from fsets.polygon import Polygon
from fsets.pifunction import PiFunction
from fsets.zfunction import ZFunction

def caso(nombre, f):
    try:
        print(nombre, f())
    except Exception as e:
        print(nombre, 'FALLA:', type(e).__name__)

t = Polygon((0, 0), (5, 1), (10, 0))
caso('centro del triángulo, 5:', lambda: round(t.COG(), 6))
caso('área del triángulo, 5:', lambda: t.area())
caso('PiFunction:', lambda: PiFunction(5, 4)(5))
z = ZFunction((0, 0), 5, (10, 1))
caso('Z y membership iguales:', lambda: math.isclose(z(8), z.membership(8)))` },
  ] },
  { id: 'teoria', titulo: 'Lo que dice la teoría, y lo que hace', bloques: [
    { p: 'Dónde se separa de los libros, y qué parada del curso explica cada idea.' },
    { tabla: [['Tema', 'Teoría', 'fuzzython', 'Parada'], ['Acumulación', 'Sobre todas las reglas', 'Máximo dentro de la palabra, y <code>ACCU</code> entre palabras', 'Mamdani (6-1)'], ['Peso de regla', 'Varía según el autor', 'Multiplica el antecedente', 'Reglas (5-4)'], ['Tsukamoto', 'Consecuente monótono', 'Lo supone, y no lo comprueba', 'Tsukamoto (6-4)'], ['Sugeno', '$z = f(x)$, de cualquier entrada', 'Solo las de esa regla', 'Sugeno (6-3)'], ['Normas', 'Conmutativas, asociativas, monótonas, con neutro', '<code>FAND</code> y <code>FOR</code> no lo son', 'Normas (3-4, 3-5)'], ['Entrada difusa', 'Composición sup-T', 'Sí, y exacta entre polígonos', 'Composicional (5-6)'], ['Varias salidas', 'Normal en Mamdani', 'Sí en Mamdani; una por bloque en los otros', 'Lingüística (5-3)']] },
  ] },
  { id: 'referencia', titulo: 'Referencia rápida', bloques: [
    { pre: C`
# Construir
FuzzySet(funcion, Interval(a, b))        Polygon((x, y), ...)
Adjective('nombre', conjunto)            Variable('nombre', 'unidad', *adjetivos,
                                                  defuzzification='COG', default=0)
RuleBlock('nombre', operators=('MIN', 'MAX', 'ZADEH'),
          activation='MIN', accumulation='MAX')
bloque.add_rule('texto', locals())       bloque.add_rules('a', 'b', scope=locals())

# Calcular
MamdaniSystem('n', bloque).compute({'x': 1})     -> {bloque: {variable: valor}}
SugenoSystem('n', bloque).compute({'x': 1})      -> {bloque: valor}
TsukamotoSystem('n', bloque).compute({'x': 1})   -> {bloque: valor}

# Reglas
if a is p and b is not q or c is r then s is t with 0.5     Mamdani
if a is p then z = a*0.3 + 1                                Sugeno
t:if a is p then s is monotona                              Tsukamoto
if NOT (a is p or b is q) then s is t                       negar un paréntesis

# Conjuntos
s(x)   s.membership(x)   s & o   s | o   ~s   s.area()   s.COG()   s.minimize(v)
Polygon.create_from(funcion, a, b, muestras)

# Normas
T: MIN PROD BDIF DPROD EPROD        S: MAX ASUM BSUM DSUM ESUM NSUM
No lo son: FAND FOR                 Complementos: ZADEH SUGENO YAGER
Desdifusión: COG COA CM MM LM RM COGS` },
  ] },
];
