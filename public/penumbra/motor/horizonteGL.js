// El render del agujero negro. Cada píxel lee la órbita real de su rayo de luz, integrada una vez por ángulo en nucleo/lutRayos.js, en el plano que le corresponde.
// Sin atajos en la física: curvatura de la luz, disco de Novikov-Thorne, Doppler, corrimiento gravitatorio y cuerpo negro. La materia es la única licencia: detalle turbulento y temperaturas en lo visible.
import { cromaCuerpoNegro } from '../nucleo/horizonte.js';
import { DEL_FILAS, EPS_FILAS, LUT_H, LUT_LADO, LUT_W, PHI_MAX, POT_COL, construirLUT } from '../nucleo/lutRayos.js';
const VS = `#version 300 es
out vec2 uv;void main(){vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const L0_V = Math.log(EPS_FILAS / (1 + DEL_FILAS)), L1_V = Math.log((1 + EPS_FILAS) / DEL_FILAS);
const RAYOS = `#version 300 es
precision highp float;
#define PI_ 3.14159265
#define EPS_F ${EPS_FILAS.toExponential()}
#define DEL_F ${DEL_FILAS.toExponential()}
#define L0_ ${L0_V.toFixed(7)}
#define L1_ ${L1_V.toFixed(7)}
#define LADO_ ${LUT_LADO}
#define COLS_ ${LUT_W}
#define PHI_ ${PHI_MAX.toFixed(1)}
#define POT_ ${POT_COL.toFixed(2)}
in vec2 uv;out vec4 o;
uniform vec3 uC;uniform mat3 uBase;uniform float uFov,uAsp,uT,uTmax,uVsal;uniform samplerCube uCielo;uniform sampler2D uRuido,uCuerpo;
uniform float uROut,uPsiC;uniform vec4 uFaro[4],uFaroC[4];uniform highp sampler2D uLut,uLutFin;
// la tabla de rayos: ver nucleo/lutRayos.js, que es la réplica exacta de estas tres funciones
int fI;float fA;
void fila(float psi){int lado=psi<uPsiC?0:1;float s=lado==0?1.-psi/uPsiC:(psi-uPsiC)/(PI_-uPsiC);s=clamp(s,0.,1.);float x=(log((s+EPS_F)/(1.-s+DEL_F))-L0_)/(L1_-L0_);float y=clamp(x,0.,.999999)*float(LADO_-1);float i=floor(y);fI=lado*LADO_+int(i);fA=y-i;}
vec4 leeFin(){return mix(texelFetch(uLutFin,ivec2(0,fI),0),texelFetch(uLutFin,ivec2(0,fI+1),0),fA);}
vec2 leeUV(float ph){float c=min(float(COLS_)-1.001,pow(ph/PHI_,1./POT_)*float(COLS_-1)),j=floor(c),bb=c-j;int J=int(j);vec2 a=mix(texelFetch(uLut,ivec2(J,fI),0).rg,texelFetch(uLut,ivec2(J+1,fI),0).rg,bb),d=mix(texelFetch(uLut,ivec2(J,fI+1),0).rg,texelFetch(uLut,ivec2(J+1,fI+1),0).rg,bb);return mix(a,d,fA);}
const float PI=3.14159265;
float flujo(float r){float x=2.*r;if(x<=6.)return 0.;float s=sqrt(x),s3=1.7320508,s6=2.4494897;return (1./((x-3.)*x*x*s))*(s-s6+.5*s3*log((s+s3)*(s6-s3)/((s-s3)*(s6+s3))));}
const float FMAX=1.145895e-4;
vec3 cuerpo(float T){float a=clamp((log(max(T,500.))-log(500.))/(log(100000.)-log(500.)),0.,1.);return texture(uCuerpo,vec2(a,.5)).rgb;}
float oc(vec2 p,float lod){return textureLod(uRuido,p,lod).r;}
/** Materia arrastrada por su órbita: filamentos muy estirados a lo largo del giro, porque cada radio gira a distinta velocidad.
 Dos fases se relevan, para que la espiral no se enrolle sin fin. */
float materia(float r,float th,float t){
 float P=26.,om=sqrt(.5)*pow(r,-1.5),lr=log(r),tot=0.;
 for(int k=0;k<2;k++){float f=fract(t/P+float(k)*.5),w=1.-abs(f*2.-1.),d=th-om*(f-.5)*P;
  // k enteros: el ruido es periódico en el ángulo, sin costura
  vec2 a=vec2(d/(2.*PI),lr);float n=oc(a*vec2(2.,1.1)+float(k)*.31,0.)*.42+oc(a*vec2(4.,3.3)+.17,0.)*.27+oc(a*vec2(9.,8.)+.53,0.)*.18+oc(a*vec2(19.,24.)+.71,0.)*.1+oc(a*vec2(37.,67.),0.)*.08;
  tot+=w*n;}
 return tot;}
void main(){
 vec2 pn=(uv*2.-1.)*vec2(uAsp,1.)*tan(uFov*.5);vec3 d=normalize(uBase*vec3(pn.x,pn.y,-1.));
 float r0=length(uC);vec3 e1=uC/r0;float cp=dot(d,e1);vec3 tg=d-cp*e1;float sp=length(tg);vec3 e2=sp>1e-5?tg/sp:vec3(0.,0.,1.);vec3 nor=cross(e1,e2);
 float u=1./r0,fs=sqrt(max(1.-u,1e-6)),b=r0*sp/fs;
 // el plano de la órbita corta al disco cada media vuelta
 float fc=atan(-e1.z,e2.z);if(fc<0.)fc+=PI;
 vec3 suma=vec3(0.);float trans=1.;float gObs=1./fs;float vz=nor.z;
 float psi=acos(clamp(cp,-1.,1.));fila(psi);
 vec4 fin=leeFin();float fiFin=fin.x;
 // los faros: cada rayo mira cuánto se acerca a ellos a lo largo de TODA su trayectoria curva, así que también se ven sus imágenes dobladas por la gravedad
 float dM[4]=float[4](1e9,1e9,1e9,1e9),tM[4]=float[4](1.,1.,1.,1.),fN[4]=float[4](0.,0.,0.,0.);bool ac[4];bool hay=false;for(int i=0;i<4;i++){ac[i]=uFaroC[i].a>0.&&abs(dot(uFaro[i].xyz,nor))<uFaro[i].w*5.5;hay=hay||ac[i];}
 if(hay){vec3 A=uC;float n=20.,fA=0.;for(int k=1;k<=20;k++){float fB=min(fiFin,14.)*pow(float(k)/n,1.6);vec2 q=leeUV(fB);vec3 B=(cos(fB)*e1+sin(fB)*e2)/max(q.x,1e-4),AB=B-A;float l2=max(dot(AB,AB),1e-8);for(int i=0;i<4;i++)if(ac[i]){vec3 w=uFaro[i].xyz-A;float t=clamp(dot(w,AB)/l2,0.,1.),dd=length(w-AB*t);if(dd<dM[i]){dM[i]=dd;fN[i]=fB;}}A=B;fA=fB;}}
 // muy cerca, las imágenes de orden alto son más finas que un píxel: solo darían puntitos sueltos
 float tope=mix(4.76,14.,smoothstep(3.,8.,r0));
 for(int cruce=0;cruce<5&&fc<fiFin&&fc<tope&&trans>.002;cruce++){
  vec2 q=leeUV(fc);float uc=q.x,vc=q.y,r=1./max(uc,1e-5);
  if(r>3.&&r<uROut){
    vec3 rad=cos(fc)*e1+sin(fc)*e2;vec3 p=r*rad;float th=atan(p.y,p.x);
    // el grosor aparente: cuanto más rasante cruza el rayo, más materia atraviesa
    vec3 dirR=(-vc/(uc*uc))*rad+r*(-sin(fc)*e1+cos(fc)*e2);float mu=max(abs(normalize(dirR).z),.035);
    float om=sqrt(.5)*pow(r,-1.5),F=flujo(r)/FMAX,g=sqrt(max(1.-1.5/r,1e-5))/(1.+om*b*vz)*gObs;
    float bor=smoothstep(uROut,uROut*.55,r)*smoothstep(3.,3.25,r);
    float ma=materia(r,th,uT),dens=smoothstep(.3,.68,ma);
    float tau=(.22+1.05*dens)*bor;float al=1.-exp(-tau/mu);
    float T=uTmax*pow(max(F,1e-5),.25)*(.9+.2*dens)*g;
    float I=F*g*g*g*g*(.5+1.1*dens*dens);
    suma+=trans*al*I*cuerpo(T)*uVsal;
    trans*=1.-al;
    for(int i=0;i<4;i++)if(ac[i]&&fN[i]>fc)tM[i]=trans;
  }
  fc+=PI;
 }
 for(int i=0;i<4;i++)if(ac[i]){float q=dM[i]/uFaro[i].w,q2=q*q;suma+=tM[i]*uFaroC[i].rgb*uFaroC[i].a*(exp(-q2)*16.+exp(-q2*.3)*.55);}
 if(fin.z>.5){float a=fin.y;vec3 dirS=cos(a)*e1+sin(a)*e2;suma+=trans*texture(uCielo,dirS).rgb;}
 o=vec4(suma,1.);}`.replaceAll('uOutRad()', 'uROut');
const CIELO = `#version 300 es
precision highp float;
in vec2 uv;out vec4 o;uniform mat3 uCara;uniform sampler2D uCuerpo,uRuido;
float h1(vec3 p){p=fract(p*vec3(.1031,.11369,.13787));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}
vec3 h3(vec3 p){return vec3(h1(p),h1(p+17.),h1(p+41.));}
vec3 cuerpo(float T){float a=clamp((log(T)-log(500.))/(log(100000.)-log(500.)),0.,1.);return texture(uCuerpo,vec2(a,.5)).rgb;}
float fb(vec3 d){vec2 a=vec2(atan(d.y,d.x)/6.2831853,d.z*.5);float s=0.,w=.5;for(int i=0;i<6;i++){s+=w*(texture(uRuido,a*vec2(4.,2.)*pow(2.,float(i))).r);w*=.5;}return s;}
vec3 capa(vec3 d,float esc,float dens,float brillo){vec3 c=vec3(0.),g=d*esc,id=floor(g);
 for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec3 n=id+vec3(i,j,k),r=h3(n);if(r.x>dens)continue;vec3 ce=normalize(n+h3(n+3.));float ang=acos(clamp(dot(d,ce),-1.,1.));float mag=pow(h1(n+7.),6.);float T=2800.+pow(h1(n+11.),2.2)*26000.;float R=.00052+.0013*mag;c+=cuerpo(T)*(brillo*(.25+7.*mag))*exp(-ang*ang/(R*R));}
 return c;}
void main(){vec3 d=normalize(uCara*vec3(uv*2.-1.,1.));
 // la Vía Láctea: una banda de polvo y luz, inclinada
 vec3 eje=normalize(vec3(.32,.42,.85));float lat=dot(d,eje);float n1=fb(d*1.),n2=fb(d.zxy*1.7+.3);float banda=exp(-lat*lat*22.)*(.22+1.3*smoothstep(.34,.72,n1));float polvo=smoothstep(.42,.66,n2)*exp(-lat*lat*44.);
 vec3 c=vec3(.0007,.0009,.0016)+(vec3(.038,.032,.027)+vec3(.016,.01,.005)*n1)*banda*(1.-.86*polvo);
 c+=capa(d,60.,.1,.09)+capa(d,150.,.1,.022)+capa(d,340.,.1,.006)*(1.+banda*4.);
 o=vec4(c,1.);}`;
const BAJA = `#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uT;uniform vec2 uPx;uniform float uUmbral;
void main(){vec3 s=vec3(0.);s+=texture(uT,uv).rgb*4.;for(int i=0;i<4;i++){vec2 a=vec2(i<2?-1.:1.,(i==0||i==2)?-1.:1.);s+=texture(uT,uv+a*uPx).rgb;}s/=8.;float l=max(s.r,max(s.g,s.b));o=vec4(s*(uUmbral>0.?smoothstep(uUmbral*.7,uUmbral*1.4,l):1.),1.);}`;
const SUBE = `#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uT;uniform vec2 uPx;uniform float uPeso;
void main(){vec3 s=vec3(0.);for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){s+=texture(uT,uv+vec2(i,j)*uPx*1.2).rgb*(i==0&&j==0?4.:(i==0||j==0?2.:1.));}o=vec4(s/16.*uPeso,1.);}`;
const FINAL = `#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform sampler2D uEsc,uBri;uniform float uExpo,uT;uniform vec2 uPx;
vec3 aces(vec3 x){const mat3 a=mat3(.59719,.076,.0284,.35458,.90834,.13383,.04823,.01566,.83777),b=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);x=a*x;x=(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081);return clamp(b*x,0.,1.);}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 c=texture(uEsc,uv).rgb;c+=texture(uBri,uv).rgb*.42;vec2 q=uv-.5;c*=1.-.42*smoothstep(.3,.95,length(q*vec2(1.,1.1))*1.2);c=aces(c*uExpo);c=pow(c,vec3(1./2.2));c+=(h(uv*vec2(1733.,977.)+fract(uT))-.5)/150.;o=vec4(c,1.);}`;
function prog(gl, f) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, f]]) { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); gl.attachShader(p, x); }
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); } return { p, u };
}
const SIN_FAROS = new Float32Array(16);
export function crearHorizonte(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'high-performance' }); if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Hace falta WebGL2 con color flotante');
  gl.getExtension('OES_texture_float_linear');
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const pR = prog(gl, RAYOS), pC = prog(gl, CIELO), pB = prog(gl, BAJA), pS = prog(gl, SUBE), pF = prog(gl, FINAL);
  const tex2 = (w, h, ifmt, fmt, tipo, datos, filtro = gl.LINEAR, rep = gl.REPEAT) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, tipo, datos); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, rep); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, rep); return t; };
  // cuerpo negro: tabla de la ley de Planck
  const N = 256, cb = new Float32Array(N * 4); for (let i = 0; i < N; i++) { const T = Math.exp(Math.log(500) + (i / (N - 1)) * (Math.log(100000) - Math.log(500))), c = cromaCuerpoNegro(T); cb.set([c[0], c[1], c[2], 1], i * 4); }
  const tCuerpo = tex2(N, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT, cb, gl.LINEAR, gl.CLAMP_TO_EDGE);
  // ruido periódico suave
  const R = 1024, ru = new Float32Array(R * R); { let s = 12345; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; for (const per of [8, 16, 32, 64, 128, 256]) { const g = new Float32Array(per * per).map(rnd), am = 8 / per; for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const fx = x / R * per, fy = y / R * per, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, a = tx * tx * (3 - 2 * tx), c = ty * ty * (3 - 2 * ty), v = (1 - c) * ((1 - a) * g[iy * per + ix] + a * g[iy * per + (ix + 1) % per]) + c * ((1 - a) * g[((iy + 1) % per) * per + ix] + a * g[((iy + 1) % per) * per + (ix + 1) % per]); ru[y * R + x] += v * am / 1.97; } } }
  const tRuido = tex2(R, R, gl.R32F, gl.RED, gl.FLOAT, ru, gl.LINEAR);
  const t2 = (P, nom, un, t) => { gl.activeTexture(gl.TEXTURE0 + un); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(P.u[nom], un); };
  // el cielo, horneado en un cubo
  const CC = 2048, tCielo = gl.createTexture(); gl.bindTexture(gl.TEXTURE_CUBE_MAP, tCielo); gl.texStorage2D(gl.TEXTURE_CUBE_MAP, 1, gl.RGBA16F, CC, CC); gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.useProgram(pC.p); t2(pC, 'uCuerpo', 0, tCuerpo); t2(pC, 'uRuido', 1, tRuido); gl.viewport(0, 0, CC, CC); gl.disable(gl.DEPTH_TEST);
  const caras = [[0, 0, -1, 0, -1, 0, 1, 0, 0], [0, 0, 1, 0, -1, 0, -1, 0, 0], [1, 0, 0, 0, 0, 1, 0, 1, 0], [1, 0, 0, 0, 0, -1, 0, -1, 0], [1, 0, 0, 0, -1, 0, 0, 0, 1], [-1, 0, 0, 0, -1, 0, 0, 0, -1]];
  caras.forEach((m, i) => { gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, tCielo, 0); gl.uniformMatrix3fv(pC.u.uCara, false, m); gl.drawArrays(gl.TRIANGLES, 0, 3); });
  // la tabla: dos texturas, que se rehacen solo cuando cambia el radio de quien mira
  const texDatos = (w, h, ifmt, fmt) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, ifmt, w, h); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const tLut = texDatos(LUT_W, LUT_H, gl.RG32F), tLutFin = texDatos(1, LUT_H, gl.RGBA32F); let lut = null;
  let tLutHecha = 0;
  /** Rehacerla cuesta unos ms: al caer deprisa se tolera un error mínimo de radio, y al frenar se ajusta del todo. */
  const ponerLut = (r0) => { const dif = lut ? Math.abs(r0 - lut.r0) : 1, ahora = performance.now(); if (lut && dif <= 1e-6) return; if (lut && dif <= 4e-3 * Math.max(r0 - 1, 0.02) && ahora - tLutHecha < 150) return; tLutHecha = ahora; lut = construirLUT(r0, lut ?? undefined); gl.bindTexture(gl.TEXTURE_2D, tLut); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, LUT_W, LUT_H, gl.RG, gl.FLOAT, lut.uv); gl.bindTexture(gl.TEXTURE_2D, tLutFin); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1, LUT_H, gl.RGBA, gl.FLOAT, lut.fin); };
  let esc, cadena = [];
  const rt = (w, h) => { const t = tex2(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR, gl.CLAMP_TO_EDGE), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
  function ajustar() {
    const W = canvas.width, H = canvas.height; if (esc && esc.w === W && esc.h === H) return; esc = rt(W, H); cadena = []; let w = W >> 1, h = H >> 1; for (let i = 0; i < 7 && w > 4 && h > 4; i++) { cadena.push({ a: rt(w, h), b: rt(w, h) }); w >>= 1; h >>= 1; }
  }
  return {
    gl,
    dibujar({ C, base, fov, t, expo = 0.62, tMax = 4300, rOut = 15, brillo = 1, faros = SIN_FAROS, farosC = SIN_FAROS }) {
      ajustar(); const W = canvas.width, H = canvas.height; ponerLut(Math.hypot(C[0], C[1], C[2]));
      gl.bindFramebuffer(gl.FRAMEBUFFER, esc.f); gl.viewport(0, 0, W, H); gl.useProgram(pR.p); gl.uniform3fv(pR.u.uC, C); gl.uniformMatrix3fv(pR.u.uBase, false, base); gl.uniform1f(pR.u.uFov, fov); gl.uniform1f(pR.u.uAsp, W / H); gl.uniform1f(pR.u.uT, t); gl.uniform1f(pR.u.uTmax, tMax); gl.uniform1f(pR.u.uVsal, brillo); gl.uniform1f(pR.u.uROut, rOut); gl.uniform4fv(pR.u['uFaro[0]'], faros); gl.uniform4fv(pR.u['uFaroC[0]'], farosC);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, tCielo); gl.uniform1i(pR.u.uCielo, 0); t2(pR, 'uRuido', 1, tRuido); t2(pR, 'uCuerpo', 2, tCuerpo); t2(pR, 'uLut', 3, tLut); t2(pR, 'uLutFin', 4, tLutFin); gl.uniform1f(pR.u.uPsiC, lut.psiC); gl.drawArrays(gl.TRIANGLES, 0, 3);
      // resplandor de lente, en muchas escalas
      gl.useProgram(pB.p); let src = esc; cadena.forEach((c, i) => { gl.bindFramebuffer(gl.FRAMEBUFFER, c.a.f); gl.viewport(0, 0, c.a.w, c.a.h); t2(pB, 'uT', 0, src.t); gl.uniform2f(pB.u.uPx, 1 / src.w, 1 / src.h); gl.uniform1f(pB.u.uUmbral, i === 0 ? 0.9 : 0); gl.drawArrays(gl.TRIANGLES, 0, 3); src = c.a; });
      gl.useProgram(pS.p); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); for (let i = cadena.length - 1; i > 0; i--) { const d = cadena[i - 1].a; gl.bindFramebuffer(gl.FRAMEBUFFER, d.f); gl.viewport(0, 0, d.w, d.h); t2(pS, 'uT', 0, cadena[i].a.t); gl.uniform2f(pS.u.uPx, 1 / cadena[i].a.w, 1 / cadena[i].a.h); gl.uniform1f(pS.u.uPeso, 0.72); gl.drawArrays(gl.TRIANGLES, 0, 3); } gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(pF.p); t2(pF, 'uEsc', 0, esc.t); t2(pF, 'uBri', 1, cadena[0].a.t); gl.uniform1f(pF.u.uExpo, expo); gl.uniform1f(pF.u.uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
