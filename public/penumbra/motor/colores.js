// Color con significado fijo en todo el curso.
import { mixc } from './tiempo.js';

export const AZUL = [88, 196, 221];     // primer conjunto o entrada
export const ROSA = [252, 98, 130];     // segundo conjunto o entrada
export const ORO = [244, 211, 69];      // el resultado
export const BLANCO = [255, 255, 255];  // la sonda
export const ROJO = [235, 72, 72];      // lo que falla, el contraejemplo
export const TEXTO = [232, 228, 216];
export const GRIS = [109, 113, 131];
export const GRIS2 = [167, 165, 152];
export const APAGADO = [36, 46, 72];

export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
/** La escala del grado: azul → turquesa → oro. */
export const escalaGrado = (v) => (v < 0.5 ? mixc([26, 54, 118], [58, 178, 172], v * 2) : mixc([58, 178, 172], ORO, (v - 0.5) * 2));
