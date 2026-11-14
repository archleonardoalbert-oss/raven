// Renderizador 3D en WebGL2: un terreno opaco con profundidad real y, probado contra esa profundidad, todo lo demás.
// Proyección única: el mismo cálculo en GLSL y en JS, para que líneas y superficie coincidan al píxel.
import { clamp, mix } from './tiempo.js';
import { AZUL, ROSA, GRIS, GRIS2 } from './colores.js';

const MALLA = 170;
const DOM_UNIDAD = { x: [0, 1], y: [0, 1], z: [0, 1] };

const vsTerreno = (W, H, cuerpo, unis) => `#version 300 es
precision highp float;precision highp int;
in vec2 q;uniform vec4 uCam;uniform vec3 uEsc;uniform vec4 uDom;uniform vec2 uDomZ;${unis}
out vec3 vU;out vec2 vM;
float F(float x,float y){${cuerpo}}
void main(){
 vec2 m=vec2(mix(uDom.x,uDom.y,q.x),mix(uDom.z,uDom.w,q.y));float zm=F(m.x,m.y);float z=(zm-uDomZ.x)/(uDomZ.y-uDomZ.x);
 vU=vec3(q,z);vM=m;
 float a=q.x-.5,b=q.y-.5,c=z-.42,X=a*uCam.x-b*uCam.y,Y=a*uCam.y+b*uCam.x,up=c*uCam.z+Y*uCam.w,dp=Y*uCam.z-c*uCam.w,f=1./(1.+dp*.28);
 gl_Position=vec4((uEsc.x+X*uEsc.z*f)/${W}.*2.-1.,1.-(uEsc.y-up*uEsc.z*f)/${H}.*2.,dp*.5,1.);}`;

const fsTerreno = (cuerpo, unis) => `#version 300 es
precision highp float;precision highp int;
in vec3 vU;in vec2 vM;uniform float uDesde;uniform vec2 uDomZ;${unis}
out vec4 o;
float F(float x,float y){${cuerpo}}
vec3 cm(float v){vec3 a=vec3(.102,.212,.463),b=vec3(.227,.698,.675),c=vec3(.957,.827,.271);return v<.5?mix(a,b,v*2.):mix(b,c,(v-.5)*2.);}
float iso(float v,float L){float w=max(fwidth(v),1e-5);return 1.-smoothstep(0.,1.3,abs(v-L)/w);}
void main(){if(vM.y<uDesde)discard;
 float t=(F(vM.x,vM.y)-uDomZ.x)/(uDomZ.y-uDomZ.x);
 vec3 n=normalize(cross(dFdx(vU),dFdy(vU)));if(n.z<0.)n=-n;float l=max(dot(n,normalize(vec3(.42,-.38,.82))),0.);
 vec3 col=cm(clamp(t,0.,1.))*(.5+.62*l);
 vec2 g=abs(fract(vU.xy*10.+.5)-.5)/max(fwidth(vU.xy*10.),vec2(1e-5));
 col*=1.-.16*(1.-smoothstep(0.,1.1,min(g.x,g.y)));
 col=mix(col,vec3(0.),.5*max(iso(t,.25),max(iso(t,.5),iso(t,.75))));o=vec4(col,1.);}`;

const VS_LOTE = `#version 300 es
in vec3 p;in vec4 c;out vec4 v;void main(){v=c;gl_Position=vec4(p,1.);}`;
const FS_LOTE = `#version 300 es
precision highp float;in vec4 v;out vec4 o;void main(){o=v;}`;

function compilar(gl, vs, fs) {
  const sh = (tipo, src) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
  return p;
}

const coma = (v) => String(v).replace('.', '{,}');

export function crearRender3D(lienzo, { cx: cx0, cy: cy0, S: S0, dominio = DOM_UNIDAD }) {
  let cx = cx0, cy = cy0, S = S0;
  const { gl, W, H } = lienzo;
  const programas = new Map(), loteProg = compilar(gl, VS_LOTE, FS_LOTE);
  const dx = dominio.x, dy = dominio.y, dz = dominio.z;
  const unidad = (p) => [(p[0] - dx[0]) / (dx[1] - dx[0]), (p[1] - dy[0]) / (dy[1] - dy[0]), (p[2] - dz[0]) / (dz[1] - dz[0])];

  // malla del terreno
  const vaoMalla = gl.createVertexArray();
  gl.bindVertexArray(vaoMalla);
  const vs = new Float32Array((MALLA + 1) ** 2 * 2), ix = new Uint32Array(MALLA * MALLA * 6);
  for (let j = 0, o = 0; j <= MALLA; j++) for (let i = 0; i <= MALLA; i++) { vs[o++] = i / MALLA; vs[o++] = j / MALLA; }
  for (let j = 0, o = 0; j < MALLA; j++) for (let i = 0; i < MALLA; i++) {
    const a = j * (MALLA + 1) + i, b = a + 1, c = a + MALLA + 1, d = c + 1;
    ix[o++] = a; ix[o++] = b; ix[o++] = d; ix[o++] = a; ix[o++] = d; ix[o++] = c;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, vs, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ix, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // lote de triángulos
  const vaoLote = gl.createVertexArray();
  gl.bindVertexArray(vaoLote);
  const bfLote = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bfLote);
  const lp = gl.getAttribLocation(loteProg, 'p'), lc = gl.getAttribLocation(loteProg, 'c');
  gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(lc); gl.vertexAttribPointer(lc, 4, gl.FLOAT, false, 28, 12);
  gl.bindVertexArray(null);

  let camara = { yaw: -0.72, pitch: 0.6 }, terrenos = [];
  const camaraValida = (c) => ({ yaw: clamp(c.yaw, -1.45, -0.1), pitch: clamp(c.pitch, 0.2, 1.2) });

  /** Punto en unidades de caja → [x, y, profundidad] en coordenadas lógicas. */
  const proyU = (q) => {
    const cy_ = Math.cos(camara.yaw), sy = Math.sin(camara.yaw), cp = Math.cos(camara.pitch), sp = Math.sin(camara.pitch);
    const a = q[0] - 0.5, b = q[1] - 0.5, c = q[2] - 0.42, X = a * cy_ - b * sy, Y = a * sy + b * cy_;
    const up = c * cp + Y * sp, dp = Y * cp - c * sp, f = 1 / (1 + dp * 0.28);
    return [cx + X * S * f, cy - up * S * f, dp];
  };
  const proyectar = (p) => proyU(unidad(p));

  /** ¿Algún terreno tapa este punto? Se avanza hacia la cámara y se compara alturas. */
  function visible(p) {
    if (!terrenos.length) return true;
    const q = unidad(p), cp = Math.cos(camara.pitch), sp = Math.sin(camara.pitch);
    const vx = -cp * Math.sin(camara.yaw), vy = -cp * Math.cos(camara.yaw);
    for (let s = 0.015; s < 1.5; s += 0.015) {
      const u = q[0] + vx * s, w = q[1] + vy * s, r = q[2] + sp * s;
      if (u < 0 || u > 1 || w < 0 || w > 1) continue;
      for (const t of terrenos) {
        const xm = mix(dx[0], dx[1], u), ym = mix(dy[0], dy[1], w);
        if (ym >= (t.desde ?? dy[0]) && r < (t.f(xm, ym) - dz[0]) / (dz[1] - dz[0]) - 0.004) return false;
      }
    }
    return true;
  }

  function programaTerreno(t) {
    const uniformes = Object.keys(t.uniformes ?? {}), clave = t.glsl + '|' + uniformes.join();
    let e = programas.get(clave);
    if (!e) {
      const decl = uniformes.map((u) => `uniform float ${u};`).join('');
      const p = compilar(gl, vsTerreno(W, H, t.glsl, decl), fsTerreno(t.glsl, decl));
      gl.bindAttribLocation(p, 0, 'q'); gl.linkProgram(p);
      const u = {};
      for (const n of ['uCam', 'uEsc', 'uDom', 'uDomZ', 'uDesde', ...uniformes]) u[n] = gl.getUniformLocation(p, n);
      e = { p, u };
      programas.set(clave, e);
    }
    return e;
  }

  function dibujar(prims, cam = camara) {
    camara = camaraValida(cam);
    cx = cam.cx ?? cx0; cy = cam.cy ?? cy0; S = cam.S ?? S0;
    terrenos = prims.filter((q) => q.tipo === 'terreno');
    gl.viewport(0, 0, lienzo.glCanvas.width, lienzo.glCanvas.height);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    const yc = Math.cos(camara.yaw), ys = Math.sin(camara.yaw), pc = Math.cos(camara.pitch), ps = Math.sin(camara.pitch);
    for (const t of terrenos) {
      const { p, u } = programaTerreno(t);
      gl.useProgram(p); gl.bindVertexArray(vaoMalla);
      gl.uniform4f(u.uCam, yc, ys, pc, ps); gl.uniform3f(u.uEsc, cx, cy, S);
      gl.uniform4f(u.uDom, dx[0], dx[1], dy[0], dy[1]); gl.uniform2f(u.uDomZ, dz[0], dz[1]);
      gl.uniform1f(u.uDesde, t.desde ?? dy[0]);
      for (const [n, v] of Object.entries(t.uniformes ?? {})) gl.uniform1f(u[n], v);
      gl.drawElements(gl.TRIANGLES, ix.length, gl.UNSIGNED_INT, 0);
    }

    const B = [], rotulos = [];
    const vx = (p, c, al, bias) => B.push((p[0] / W) * 2 - 1, 1 - (p[1] / H) * 2, p[2] * 0.5 + bias, c[0] / 255, c[1] / 255, c[2] / 255, al);
    const tri = (p, q, r, c, al, bias = 0) => { vx(p, c, al, bias); vx(q, c, al, bias); vx(r, c, al, bias); };
    const quad = (p, q, r, s, c, al, bias = 0) => { tri(p, q, r, c, al, bias); tri(p, r, s, c, al, bias); };
    const seg = (p0, p1, c, w, al, bias = -0.002) => {
      const ddx = p1[0] - p0[0], ddy = p1[1] - p0[1], L = Math.hypot(ddx, ddy) || 1, ux = ddx / L, uy = ddy / L;
      const nx = (-uy * w) / 2, ny = (ux * w) / 2, ex = (ux * w) / 2, ey = (uy * w) / 2;
      const A = [p0[0] - ex, p0[1] - ey, p0[2]], D = [p1[0] + ex, p1[1] + ey, p1[2]];
      quad([A[0] + nx, A[1] + ny, A[2]], [A[0] - nx, A[1] - ny, A[2]], [D[0] - nx, D[1] - ny, D[2]], [D[0] + nx, D[1] + ny, D[2]], c, al, bias);
    };
    const rectaU = (a, b, c, w, al, k = 12, hueco = false) => {
      for (let i = 0; i < k; i++) {
        if (hueco && i % 2) continue;
        const s = i / k, r = (i + 1) / k, f = (t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
        seg(proyU(f(s)), proyU(f(r)), c, w, al);
      }
    };
    const paredU = (qs, c, al) => { const p = qs.map(proyU); quad(p[0], p[1], p[2], p[3], c, al, 0.001); };

    for (const q of prims) {
      if (q.tipo === 'marco') {
        const a = q.alfa ?? 1, cA = q.paredX ?? AZUL, cB = q.paredY ?? ROSA;
        paredU([[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], cA, 0.055 * a);
        paredU([[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], cB, 0.055 * a);
        paredU([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], GRIS, 0.06 * a);
        for (let i = 0; i <= 10; i++) {
          const u = i / 10, al = 0.26 * a;
          rectaU([u, 0, 0], [u, 1, 0], GRIS, 1, al); rectaU([0, u, 0], [1, u, 0], GRIS, 1, al);
          rectaU([u, 1, 0], [u, 1, 1], cA, 1, al * 0.6); rectaU([0, u, 0], [0, u, 1], cB, 1, al * 0.6);
          rectaU([0, 1, u], [1, 1, u], cA, 1, al * 0.6); rectaU([0, 0, u], [0, 1, u], cB, 1, al * 0.6);
        }
        rectaU([0, 0, 0], [1, 0, 0], GRIS2, 1.7, a); rectaU([1, 0, 0], [1, 1, 0], GRIS2, 1.7, a); rectaU([0, 1, 0], [0, 1, 1], GRIS2, 1.7, a);
        const et = q.etiquetas ?? {};
        for (const u of [0, 0.5, 1]) {
          const px = proyU([u, -0.055, 0]), py = proyU([1.055, u, 0]), pz = proyU([0, 1, u]);
          const vz = mix(dz[0], dz[1], u), mz = [dx[0], dy[1], vz];
          rotulos.push({ clave: `tx${u}`, x: px[0], y: px[1] + 6, tex: coma(mix(dx[0], dx[1], u)), tam: 15, color: GRIS2, alfa: a });
          rotulos.push({ clave: `ty${u}`, x: py[0], y: py[1] + 6, tex: coma(mix(dy[0], dy[1], u)), tam: 15, color: GRIS2, alfa: a });
          rotulos.push({ clave: `tz${u}`, x: pz[0] - 12, y: pz[1], tex: coma(vz), tam: 15, color: GRIS2, ancla: 'r', alfa: a * (visible(mz) ? 1 : 0.22) });
        }
        if (et.x) { const p = proyU([0.74, -0.11, 0]); rotulos.push({ clave: 'ex', x: p[0], y: p[1] + 6, tex: et.x, tam: 23, alfa: a }); }
        if (et.y) { const p = proyU([1.11, 0.74, 0]); rotulos.push({ clave: 'ey', x: p[0], y: p[1] + 6, tex: et.y, tam: 23, alfa: a }); }
        if (et.z) { const p = proyU([0, 1, 1.08]); rotulos.push({ clave: 'ez', x: p[0], y: p[1], tex: et.z, tam: 17, color: GRIS2, alfa: a }); }
      } else if (q.tipo === 'poligono') {
        const p = q.puntos.map(proyectar);
        for (let i = 1; i + 1 < p.length; i++) tri(p[0], p[i], p[i + 1], q.color ?? GRIS, q.alfa ?? 1);
      } else if (q.tipo === 'linea') {
        const k = q.discontinua ? (q.discontinua === true ? 11 : q.discontinua) : 12;
        rectaU(unidad(q.de), unidad(q.a), q.color ?? GRIS2, q.ancho ?? 2, q.alfa ?? 1, k, !!q.discontinua);
      } else if (q.tipo === 'curva') {
        const p = q.puntos.map(proyectar), c = q.color ?? GRIS2;
        for (let i = 0; i + 1 < p.length; i++) {
          if (q.brillo) seg(p[i], p[i + 1], c, (q.ancho ?? 3) * 2.4, 0.12 * (q.alfa ?? 1));
          seg(p[i], p[i + 1], c, q.ancho ?? 3, q.alfa ?? 1);
        }
      } else if (q.tipo === 'punto') {
        const p = proyectar(q.p), r = q.radio ?? 6, c = q.color ?? [255, 255, 255], a = q.alfa ?? 1;
        for (const [rr, aa] of [[r * 2.1, 0.2 * a], [r, a]]) {
          for (let i = 0; i < 22; i++) {
            const an = (i / 22) * 6.2832, bn = ((i + 1) / 22) * 6.2832;
            tri(p, [p[0] + rr * Math.cos(an), p[1] + rr * Math.sin(an), p[2]], [p[0] + rr * Math.cos(bn), p[1] + rr * Math.sin(bn), p[2]], c, aa, -0.004);
          }
        }
      } else if (q.tipo === 'rotulo') {
        const p = proyectar(q.p);
        rotulos.push({ clave: q.clave, x: p[0] + (q.dx ?? 0), y: p[1] + (q.dy ?? 0), tex: q.tex, tam: q.tam, color: q.color, ancla: q.ancla,
          alfa: (q.alfa ?? 1) * (q.siempre || visible(q.p) ? 1 : 0.22) });
      }
    }
    const datos = new Float32Array(B);
    gl.useProgram(loteProg); gl.bindVertexArray(vaoLote); gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.bindBuffer(gl.ARRAY_BUFFER, bfLote); gl.bufferData(gl.ARRAY_BUFFER, datos, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, datos.length / 7);
    gl.bindVertexArray(null);
    lienzo.rotular(rotulos);
  }

  return { dibujar, proyectar, visible, camaraValida, camara: () => camara };
}
