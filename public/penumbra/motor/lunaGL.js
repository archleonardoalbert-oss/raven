// La Luna, horneada una sola vez en GPU: relieve de cráteres a nueve escalas, mares, rayos de eyección y sombras propias.
// El cielo solo la consulta como textura; así, el detalle no cuesta nada al dibujar cada cuadro.
export const LUNA_R = 0.044; // radio aparente, en radianes
export const LUNA_KZ = 0.085; // su altura en el cielo, respecto a la del sol
export const LUNA_DAZ = -0.1; // lo que se aparta del sol en azimut: queda libre, entre el título y el panel
// la Luna está quieta en el cielo: no sigue la lenta respiración de la luz del terreno
const azL = 1.24 + LUNA_DAZ, elL = 0.26, lL = Math.hypot(Math.cos(elL), Math.sin(elL) * LUNA_KZ);
export const LUNA_D = [Math.cos(azL) * Math.cos(elL) / lL, Math.sin(azL) * Math.cos(elL) / lL, (Math.sin(elL) * LUNA_KZ) / lL];
export const LUNA_L = [-0.72, 0.3, 0.626]; // de dónde le llega la luz, en su propio plano

const VS = `#version 300 es
out vec2 u;void main(){vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);u=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

// paso 1: altura (r) y albedo (g). Cada capa son craterés sobre una rejilla en proyección estereográfica, que conserva los círculos.
const FS_ALTURA = `#version 300 es
precision highp float;
in vec2 u;out vec4 o;
float h12(vec2 p){vec3 a=fract(vec3(p.xyx)*.1031);a+=dot(a,a.yzx+33.33);return fract((a.x+a.y)*a.z);}
vec2 h22(vec2 p){vec3 a=fract(vec3(p.xyx)*vec3(.1031,.103,.0973));a+=dot(a,a.yzx+33.33);return fract((a.xx+a.yz)*a.zy);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p,int n){float s=0.,a=.5;for(int i=0;i<n;i++){s+=a*vn(p);p=mat2(1.6,1.2,-1.2,1.6)*p+7.3;a*=.5;}return s;}
float cuenca(vec2 q,vec2 c,vec2 r,float borde){vec2 d=(q-c)/r;return smoothstep(1.+borde,1.-borde,length(d)+(fbm(q*4.3+c*9.,4)-.5)*1.05+(fbm(q*17.+c*3.,4)-.5)*.3);}
float mares(vec2 q){float m=0.;
 m=max(m,cuenca(q,vec2(-.27,.47),vec2(.37,.33),.1));   // lluvias
 m=max(m,cuenca(q,vec2(.19,.43),vec2(.2,.18),.09));    // serenidad
 m=max(m,cuenca(q,vec2(.43,.13),vec2(.24,.19),.13));   // tranquilidad
 m=max(m,cuenca(q,vec2(.76,.29),vec2(.1,.13),.08));    // crisis
 m=max(m,cuenca(q,vec2(-.68,.2),vec2(.27,.58),.2));    // tormentas
 m=max(m,cuenca(q,vec2(-.2,-.33),vec2(.25,.2),.16));   // nubes
 m=max(m,cuenca(q,vec2(-.53,-.4),vec2(.12,.12),.09));  // humedad
 m=max(m,cuenca(q,vec2(.68,-.07),vec2(.14,.2),.14));   // fecundidad
 m=max(m,cuenca(q,vec2(.5,-.27),vec2(.09,.09),.1));    // néctar
 m=max(m,cuenca(q,vec2(.03,.78),vec2(.5,.075),.34));  // frío
 return m;}
void capa(vec2 s,float fr,float sem,float dens,float amar,float mar,inout float h,inout float al){
 vec2 g=s*fr,id=floor(g);float pes=mix(1.,amar,mar);
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 c=id+vec2(i,j);if(h12(c*1.37+sem)>dens*pes)continue;
  vec2 ce=c+.15+.7*h22(c+sem);float rr=.14+.42*pow(h12(c+sem*3.1),2.2),d=length(g-ce)/rr;
  if(d>2.7||d*rr>1.14)continue;
  float cubre=smoothstep(1.14,.92,d*rr);
  float H=rr/fr,edad=h12(c*3.1+sem*.7),fresco=smoothstep(.8,1.,edad),gas=.2+.8*edad*edad;
  if(fr>90.)gas*=.55;
  float a=atan(g.y-ce.y,g.x-ce.x),ond=1.+.09*(vn(vec2(a*3.+c.x,c.y))-.5)*2.;d*=ond;
  // la historia del terreno se borra dentro de un cráter nuevo
  float dentro=smoothstep(1.02,.86,d);h=mix(h,h*(1.-.55*gas),dentro);
  if(d<1.)h-=H*.34*gas*(1.-d*d*d);
  h+=H*.1*gas*exp(-pow((d-1.)/.13,2.));
  if(d>1.)h+=H*.018*gas*cubre*exp(-(d-1.)*2.6)*(.7+.5*vn(vec2(a*14.,c.y+d*5.)));
  if(fr<26.&&d<.3)h+=H*.13*gas*smoothstep(.3,.04,d);                       // pico central
  if(fr<15.&&d<1.&&d>.62)h+=H*.018*gas*sin(d*52.+vn(vec2(a*6.,c.x))*5.);    // paredes en terrazas
  al+=fresco*(.11*exp(-pow((d-1.)/.28,2.))+.06*smoothstep(1.,.3,d))-(1.-edad)*.02*smoothstep(1.2,.5,d);
 }}
void joven(vec2 q,vec2 c,float r,float fuerza,float rayos,float sem,inout float h,inout float al){
 vec2 e=q-c;float l=length(e),d=l/r,a=atan(e.y,e.x);
 float nd=d*(1.+.05*(vn(vec2(a*4.,sem))-.5));
 h=mix(h,h*.3,smoothstep(1.05,.85,nd));
 if(nd<1.)h-=r*.3*(1.-nd*nd*nd);
 h+=r*.11*exp(-pow((nd-1.)/.14,2.));
 if(nd>1.)h+=r*.05*exp(-(nd-1.)*2.2)*(.5+vn(vec2(a*20.,d*6.+sem)));
 if(nd<.3)h+=r*.16*smoothstep(.3,.03,nd);
 if(nd<1.&&nd>.55)h+=r*.022*sin(nd*44.+vn(vec2(a*5.,sem))*6.);
 al+=fuerza*(.34*exp(-pow((nd-1.)/.45,2.))+.1*smoothstep(1.,.2,nd));
 if(rayos>0.&&d>.8){
  float t=pow(vn(vec2(a*7.+sem,sem*2.)),3.)*pow(vn(vec2(a*23.+sem*3.,3.)),1.6)*4.5*(.55+.9*vn(vec2(a*60.,d*1.6+sem)));
  al+=rayos*t*exp(-(d-.8)*rayos*.0+-(d-.8)/(5.5+7.*vn(vec2(a*5.,sem+4.))))*smoothstep(.8,1.3,d)*.5;
 }}
void main(){
 vec2 q=u*2.-1.;float r2=dot(q,q);
 if(r2>1.08){o=vec4(0.);return;}
 float z=sqrt(max(1.-r2,.0004));vec2 s=q/(1.+z);
 float mar=mares(q),h=-.012*mar+.0045*(fbm(s*5.,5)-.5)*(1.-mar);
 float al=mix(.55+.2*(fbm(s*9.,6)-.5),.27+.12*(fbm(s*11.+3.,6)-.5),mar);
 capa(s,4.,1.3,.42,.08,mar,h,al);capa(s,7.,2.9,.46,.12,mar,h,al);capa(s,12.,4.7,.46,.22,mar,h,al);
 capa(s,20.,6.1,.44,.3,mar,h,al);capa(s,34.,8.3,.42,.4,mar,h,al);capa(s,58.,9.7,.38,.5,mar,h,al);
 capa(s,100.,11.9,.34,.6,mar,h,al);capa(s,170.,13.3,.3,.7,mar,h,al);capa(s,290.,17.1,.26,.8,mar,h,al);
 // arrugas de los mares
 h+=mar*.0011*abs(fbm(s*38.,4)-.5)*2.;h+=(.00012+.00026*(1.-mar))*(fbm(s*300.,3)-.5);
 // los cráteres jóvenes que dan su cara a la Luna, con sus rayos
 joven(q,vec2(-.11,-.71),.055,1.,1.,1.,h,al);
 joven(q,vec2(-.335,.165),.05,.9,.62,2.,h,al);
 joven(q,vec2(-.6,.14),.024,.9,.42,3.,h,al);
 joven(q,vec2(-.68,.4),.022,1.2,.3,4.,h,al);
 joven(q,vec2(.6,.48),.03,.5,.12,5.,h,al);
 joven(q,vec2(.28,-.46),.04,.25,.0,6.,h,al);
 joven(q,vec2(-.05,-.2),.046,.12,.0,7.,h,al);
 joven(q,vec2(-.32,-.55),.05,.1,.0,8.,h,al);
 o=vec4(h,clamp(al,.05,1.25),0.,1.);}`;

// paso 2: pendientes y sombras propias, marchando hacia la luz sobre la altura
const FS_RELIEVE = `#version 300 es
precision highp float;
in vec2 u;uniform sampler2D uH;uniform vec3 uL;uniform float uTx;out vec4 o;
const float K=5.;
float H(vec2 p){return texture(uH,p).r*K;}
void main(){
 vec2 e=vec2(uTx,0.);
 float a=texture(uH,u).g,h0=H(u);
 float dq=2.*uTx*2.;
 vec2 d=vec2(H(u+e.xy)-H(u-e.xy),H(u+e.yx)-H(u-e.yx))/dq;
 // sombra suave: lo más alto que hay de camino a la luz
 vec2 lxy=normalize(uL.xy);float tg=uL.z/length(uL.xy),luz=1.,t=uTx*2.;
 for(int i=0;i<34;i++){
  vec2 p=u+lxy*t*.5;
  float sobre=h0+t*tg-H(p);
  luz=min(luz,clamp(.5+sobre/(.28*t+uTx*2.),0.,1.));
  if(luz<.002)break;
  t*=1.17;
 }
 o=vec4(clamp(d*.5,-8.,8.),a,luz);}`;

function programa(gl, fs) {
  const p = gl.createProgram();
  for (const [tipo, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`luna: ${gl.getShaderInfoLog(s)}`); gl.attachShader(p, s); }
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`luna: ${gl.getProgramInfoLog(p)}`);
  return p;
}

/** Hornea por losetas, soltando la GPU entre una y otra para no congelar la pantalla. Devuelve la textura final. */
export function hornearLuna(gl, vao, { tam = 2048, losetas = 8 } = {}) {
  const fbo = gl.createFramebuffer(), tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1 + Math.floor(Math.log2(tam)), gl.RGBA16F, tam, tam); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const tH = tex(), tF = tex(), pA = programa(gl, FS_ALTURA), pR = programa(gl, FS_RELIEVE);
  const pasar = (p, destino, antes) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, destino, 0);
    gl.viewport(0, 0, tam, tam); gl.useProgram(p); antes?.(); gl.bindVertexArray(vao); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.enable(gl.SCISSOR_TEST);
    const l = Math.ceil(tam / losetas);
    for (let j = 0; j < losetas; j++) for (let i = 0; i < losetas; i++) { gl.scissor(i * l, j * l, l, l); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.flush(); }
    gl.disable(gl.SCISSOR_TEST);
  };
  pasar(pA, tH);
  gl.bindTexture(gl.TEXTURE_2D, tH); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  pasar(pR, tF, () => { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tH); gl.uniform1i(gl.getUniformLocation(pR, 'uH'), 0); gl.uniform3fv(gl.getUniformLocation(pR, 'uL'), LUNA_L); gl.uniform1f(gl.getUniformLocation(pR, 'uTx'), 1 / tam); });
  gl.bindTexture(gl.TEXTURE_2D, tF); gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fbo); gl.deleteTexture(tH); gl.deleteProgram(pA); gl.deleteProgram(pR);
  return tF;
}
