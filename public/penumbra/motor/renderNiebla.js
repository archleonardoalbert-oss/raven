// La niebla: dos conjuntos en el plano calculados por píxel en la GPU, con isolíneas antialias y dithering.
const VS = `#version 300 es
in vec2 q;void main(){gl_Position=vec4(q,0.,1.);}`;
const FS = `#version 300 es
precision highp float;precision highp int;
uniform vec2 uRes,uTam,uA,uB;uniform float uRA,uRB,uK,uEnt,uWB,uWO,uMix,uIso;uniform int uPrev,uCur;uniform vec3 uCA,uCB;out vec4 o;
float bell(vec2 p,vec2 c,float r){if(r<=0.)return 0.;float d=dot(p-c,p-c)/(r*r);return 1./(1.+pow(max(d,1e-7),uK));}
float op(int m,float a,float b){if(m==1)return min(a,b);if(m==2)return max(a,b);if(m==3)return 1.-a;return 0.;}
float iso(float v,float L,float pw){float w=max(fwidth(v),1e-5);return 1.-smoothstep(0.,pw,abs(v-L)/w);}
vec3 screen(vec3 a,vec3 b){return 1.-(1.-a)*(1.-b);}
void main(){vec2 f=gl_FragCoord.xy/uRes;vec2 p=vec2(f.x,1.-f.y)*uTam;float a=bell(p,uA,uRA),b=bell(p,uB,uRB);
 vec3 cO=vec3(.957,.827,.271);
 vec3 col=screen(a*uCA*.86*uWB,b*uCB*.86*uWB)*uEnt;
 float v=mix(op(uPrev,a,b),op(uCur,a,b),uMix);col=screen(col,v*cO*uWO*uEnt);
 if(uIso>.5){
  float lA=iso(a,.5,1.3)*.95+(iso(a,.25,1.)+iso(a,.75,1.))*.4,lB=iso(b,.5,1.3)*.95+(iso(b,.25,1.)+iso(b,.75,1.))*.4;
  if(uRA>0.)col=mix(col,uCA*1.1,clamp(lA,0.,1.)*uWB*uEnt);if(uRB>0.)col=mix(col,uCB*1.1,clamp(lB,0.,1.)*uWB*uEnt);
  if(uWO>.01){float l=iso(v,.5,1.3)*.9+(iso(v,.25,1.)+iso(v,.75,1.))*.55;col=mix(col,vec3(1.,.97,.82),clamp(l,0.,1.)*uWO*uEnt*.8);}
 }
 float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));col+=(n-.5)/255.;o=vec4(col,1.);}`;

const OP = { ambos: 0, min: 1, max: 2, neg: 3 };

export function crearRenderNiebla(lienzo) {
  const { gl, W, H } = lienzo;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(x)); return x; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(p, 0, 'q'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const U = {};
  for (const n of ['uRes', 'uTam', 'uA', 'uB', 'uRA', 'uRB', 'uK', 'uEnt', 'uWB', 'uWO', 'uMix', 'uIso', 'uPrev', 'uCur', 'uCA', 'uCB']) U[n] = gl.getUniformLocation(p, n);

  return {
    /** operacion y previa: 'ambos' | 'min' | 'max' | 'neg'; mezcla en [0, 1] entre previa y operacion. */
    dibujar({ nubes, k, operacion = 'ambos', previa = 'ambos', mezcla = 1, entrada = 1, isolineas = true }) {
      const [A, B = { x: 0, y: 0, r: 0, color: [0, 0, 0] }] = nubes;
      const pesoO = (m) => (m === 'ambos' ? 0 : 1), wO = pesoO(previa) + (pesoO(operacion) - pesoO(previa)) * mezcla;
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.viewport(0, 0, lienzo.glCanvas.width, lienzo.glCanvas.height);
      gl.useProgram(p); gl.bindVertexArray(vao);
      gl.uniform2f(U.uRes, lienzo.glCanvas.width, lienzo.glCanvas.height); gl.uniform2f(U.uTam, W, H);
      gl.uniform2f(U.uA, A.x, A.y); gl.uniform2f(U.uB, B.x, B.y); gl.uniform1f(U.uRA, A.r); gl.uniform1f(U.uRB, B.r);
      gl.uniform1f(U.uK, k); gl.uniform1f(U.uEnt, entrada); gl.uniform1f(U.uWB, 1 + (0.14 - 1) * wO); gl.uniform1f(U.uWO, wO);
      gl.uniform1f(U.uMix, mezcla); gl.uniform1f(U.uIso, isolineas ? 1 : 0);
      gl.uniform1i(U.uPrev, OP[previa === 'ambos' ? operacion : previa]); gl.uniform1i(U.uCur, OP[operacion === 'ambos' ? previa : operacion]);
      gl.uniform3f(U.uCA, A.color[0] / 255, A.color[1] / 255, A.color[2] / 255);
      gl.uniform3f(U.uCB, B.color[0] / 255, B.color[1] / 255, B.color[2] / 255);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
  };
}
