// Calificación de retos: siempre una nota en [0, 1]. Usar pistas resta, pero nunca más de un 60 %.
const factorPistas = (pistas) => Math.max(0.4, 1 - 0.2 * pistas);

export const notaManipular = (precision, pistas) => Math.min(1, Math.max(0, precision)) * factorPistas(pistas);

export function notaCalculo(valor, respuesta, tol, pistas) {
  const error = Math.abs(valor - respuesta);
  if (!Number.isFinite(error)) return 0;
  const precision = error <= tol ? 1 : Math.max(0, 1 - (error - tol) / (4 * tol));
  return notaManipular(precision, pistas);
}

export const notaEleccion = (acierto, intentos) => (!acierto ? 0 : intentos === 1 ? 1 : intentos === 2 ? 0.5 : 0);
export const notaDemostracion = (autoevaluacion, pistas) => notaManipular(autoevaluacion, pistas);
