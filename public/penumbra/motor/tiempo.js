// Curvas y tramos de tiempo: la «suave» de 3Blue1Brown arranca y frena sin brusquedad.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (t) => { const u = clamp(t); return u * u * u * (10 - 15 * u + 6 * u * u); };
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ev = (t, a, b) => smooth(seg(t, a, b));
export const mix = (a, b, t) => a + (b - a) * t;
export const mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
/** Sube al entrar en [a, b] y baja al salir, con rampas de duración f. */
export const vent = (t, a, b, f = 0.45) => ev(t, a, a + f) * (1 - ev(t, b - f, b));
