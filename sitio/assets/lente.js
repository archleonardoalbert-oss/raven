// Lente gravitatoria del agujero negro central, dentro de la propia escena de la galaxia (un solo motor).
// Es el trazado de rayos de El Horizonte (Penumbra): cada píxel lee la órbita real de su rayo en la métrica de
// Schwarzschild (tabla de nucleo/lutRayos.js), con disco de Novikov-Thorne, Doppler, corrimiento gravitatorio y
// cuerpo negro. La diferencia: el cielo no es un cubo inventado sino la galaxia que se ve, así que la lente
// deforma las estrellas reales y nunca hay que cambiar de motor.
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { cromaCuerpoNegro } from './penumbra/horizonte.js';
import { DEL_FILAS, EPS_FILAS, LUT_H, LUT_LADO, LUT_W, PHI_MAX, POT_COL, construirLUT } from './penumbra/lutRayos.js';

const L0_V = Math.log(EPS_FILAS / (1 + DEL_FILAS)), L1_V = Math.log((1 + EPS_FILAS) / DEL_FILAS);
const FRAG = `
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
in vec2 vUv;out vec4 o;
uniform sampler2D tDiffuse;uniform mat3 uB2G;uniform float uExpo;uniform float uDisco;uniform float uMezcla;
uniform vec3 uC;uniform mat3 uBase;uniform float uFov,uAsp,uT,uTmax,uVsal;uniform samplerCube uCielo;uniform sampler2D uRuido,uCuerpo;
uniform float uROut,uPsiC;uniform vec4 uFaro[4],uFaroC[4];uniform highp sampler2D uLut,uLutFin;
// la tabla de rayos: ver nucleo/lutRayos.js, que es la réplica exacta de estas tres funciones
int fI;float fA;
void fila(float psi){int lado=psi<uPsiC?0:1;float s=lado==0?1.-psi/uPsiC:(psi-uPsiC)/(PI_-uPsiC);s=clamp(s,0.,1.);float x=(log((s+EPS_F)/(1.-s+DEL_F))-L0_)/(L1_-L0_);float y=clamp(x,0.,.999999)*float(LADO_-1);float i=floor(y);fI=lado*LADO_+int(i);fA=y-i;}
vec4 leeFin(){return mix(texelFetch(uLutFin,ivec2(0,fI),0),texelFetch(uLutFin,ivec2(0,fI+1),0),fA);}
vec2 leeUV(float ph){float c=min(float(COLS_)-1.001,pow(ph/PHI_,1./POT_)*float(COLS_-1)),j=floor(c),bb=c-j;int J=int(j);vec2 a=mix(texelFetch(uLut,ivec2(J,fI),0).rg,texelFetch(uLut,ivec2(J+1,fI),0).rg,bb),d=mix(texelFetch(uLut,ivec2(J,fI+1),0).rg,texelFetch(uLut,ivec2(J+1,fI+1),0).rg,bb);return mix(a,d,fA);}
const float PI=3.14159265;
vec3 aces(vec3 x){const mat3 a=mat3(.59719,.076,.0284,.35458,.90834,.13383,.04823,.01566,.83777),b=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);x=a*x;x=(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081);return clamp(b*x,0.,1.);}
// el fondo es la galaxia real: la imagen en pantalla si el rayo sale por dentro del encuadre, y si no el
// mapa cúbico capturado desde la cámara (los rayos muy curvados ven lo que está detrás o a los lados)
vec3 fondo(vec3 dS){float z=-dot(dS,uBase[2]);float tf=tan(uFov*.5);vec2 s=vec2(dot(dS,uBase[0])/(z*tf*uAsp),dot(dS,uBase[1])/(z*tf));
 float w=z>0.?1.-smoothstep(.9,1.,max(abs(s.x),abs(s.y))):0.;vec3 cubo=texture(uCielo,uB2G*dS).rgb;if(w<=0.)return cubo;return mix(cubo,texture(tDiffuse,s*.5+.5).rgb,w);}
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
void lente(){
 vec2 pn=(vUv*2.-1.)*vec2(uAsp,1.)*tan(uFov*.5);vec3 d=normalize(uBase*vec3(pn.x,pn.y,-1.));
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
 vec3 bg=vec3(0.);if(fin.z>.5){float a=fin.y;vec3 dirS=cos(a)*e1+sin(a)*e2;bg=trans*fondo(dirS);}
 // el disco se revela como en El Horizonte (ACES); el fondo ya viene en la escala de la galaxia
 o=vec4(bg+pow(aces(suma*uExpo*uDisco),vec3(2.2)),1.);}
// la lente entra poco a poco (uMezcla de 0 a 1 al acercarse): al encenderse, la imagen es idéntica a la de sin lente;
// encendida de golpe, el núcleo de la galaxia crecía de repente al pasar las 100 unidades
void main(){lente();o.rgb=mix(texture(tDiffuse,vUv).rgb,o.rgb,uMezcla);}`;
const VERT = `in vec3 position; in vec2 uv; out vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function crearLente(renderer, { cubo = 512 } = {}) {
  // cuerpo negro (ley de Planck) y ruido periódico, idénticos a los de El Horizonte
  const N = 256, cb = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { const T = Math.exp(Math.log(500) + (i / (N - 1)) * (Math.log(100000) - Math.log(500))), c = cromaCuerpoNegro(T); cb.set([c[0], c[1], c[2], 1], i * 4); }
  const tCuerpo = new THREE.DataTexture(cb, N, 1, THREE.RGBAFormat, THREE.FloatType); tCuerpo.minFilter = tCuerpo.magFilter = THREE.LinearFilter; tCuerpo.needsUpdate = true;
  const R = 1024, ru = new Float32Array(R * R); { let s = 12345; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; for (const per of [8, 16, 32, 64, 128, 256]) { const g = new Float32Array(per * per).map(rnd), am = 8 / per; for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const fx = x / R * per, fy = y / R * per, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, a = tx * tx * (3 - 2 * tx), c = ty * ty * (3 - 2 * ty), v = (1 - c) * ((1 - a) * g[iy * per + ix] + a * g[iy * per + (ix + 1) % per]) + c * ((1 - a) * g[((iy + 1) % per) * per + ix] + a * g[((iy + 1) % per) * per + (ix + 1) % per]); ru[y * R + x] += v * am / 1.97; } } }
  
  const tRuido = new THREE.DataTexture(ru, R, R, THREE.RedFormat, THREE.FloatType);
  tRuido.wrapS = tRuido.wrapT = THREE.RepeatWrapping; tRuido.minFilter = tRuido.magFilter = THREE.LinearFilter; tRuido.needsUpdate = true;
  const tLut = new THREE.DataTexture(new Float32Array(LUT_W * LUT_H * 2), LUT_W, LUT_H, THREE.RGFormat, THREE.FloatType);
  const tLutFin = new THREE.DataTexture(new Float32Array(LUT_H * 4), 1, LUT_H, THREE.RGBAFormat, THREE.FloatType);
  for (const t of [tLut, tLutFin]) { t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; }

  // el cielo que ve la lente: la galaxia, capturada en un cubo desde la posición de la cámara
  const rtCubo = new THREE.WebGLCubeRenderTarget(cubo, { type: THREE.HalfFloatType });
  const camCubo = new THREE.CubeCamera(0.05, 3000, rtCubo);

  const faros = Array.from({ length: 4 }, () => new THREE.Vector4()), farosC = Array.from({ length: 4 }, () => new THREE.Vector4());
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: 'precision highp float;\n' + FRAG,
    uniforms: {
      tDiffuse: { value: null }, uCielo: { value: rtCubo.texture }, uRuido: { value: tRuido }, uCuerpo: { value: tCuerpo },
      uLut: { value: tLut }, uLutFin: { value: tLutFin }, uPsiC: { value: 0 },
      uC: { value: new THREE.Vector3() }, uBase: { value: new THREE.Matrix3() }, uB2G: { value: new THREE.Matrix3() },
      uFov: { value: 1 }, uAsp: { value: 1 }, uT: { value: 0 }, uTmax: { value: 4000 }, uVsal: { value: 1 }, uROut: { value: 15 },
      uExpo: { value: 0.62 }, uDisco: { value: 0 }, uMezcla: { value: 1 }, uFaro: { value: faros }, uFaroC: { value: farosC },
    },
    depthTest: false, depthWrite: false,
  });
  material.uniforms.uFaro.value = faros; material.uniforms.uFaroC.value = farosC;
  const pase = new ShaderPass(material);

  let lut = null, hecha = 0;
  function ponerLut(r0) {
    const dif = lut ? Math.abs(r0 - lut.r0) : 1, ahora = performance.now();
    if (lut && dif <= 1e-6) return;
    if (lut && dif <= 4e-3 * Math.max(r0 - 1, 0.02) && ahora - hecha < 150) return;
    hecha = ahora; lut = construirLUT(r0, lut ?? undefined);
    tLut.image.data.set(lut.uv); tLut.needsUpdate = true;
    tLutFin.image.data.set(lut.fin); tLutFin.needsUpdate = true;
    material.uniforms.uPsiC.value = lut.psiC;
  }
  return { pase, camCubo, material, faros, farosC, ponerLut };
}
