// Lo que se va construyendo para el péndulo, parada a parada. Se guarda aparte de las notas.
const CLAVE = 'penumbra-taller-v1';

export function crearTaller(almacen) {
  let datos = {};
  try { datos = JSON.parse(almacen.getItem(CLAVE)) || {}; } catch { datos = {}; }
  return {
    leer: () => ({ ...datos }),
    guardar(piezas) {
      datos = { ...datos, ...piezas };
      try { almacen.setItem(CLAVE, JSON.stringify(datos)); } catch { /* sin almacenamiento */ }
    },
    reiniciar() { datos = {}; try { almacen.removeItem(CLAVE); } catch { /* sin almacenamiento */ } },
  };
}
