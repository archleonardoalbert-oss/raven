// El paisaje de la portada, en WebGL2: montañas con sombras de borde suave, niebla en los valles, un camino que fluye y faros en las cimas.
// El sentido del color es el del curso: azul y turquesa para lo que aún está por explorar, oro solo para lo que dominas.
import { CAPAS } from './mapaRed.js';
import { ANCHO_CIMA, BASE, OCTAVAS, SIGMA, campoMapa, DOMINIO, DOMINIO_CERCA } from './alturaMapa.js';

const ESCZ = 0.46, CAPAS_N = CAPAS.length;

import { LUNA_D, LUNA_L, LUNA_R, hornearLuna } from './lunaGL.js';

const CIELO = `
uniform float uAlba,uConLuna,uHaloLuna;
vec3 cielo(vec3 v,vec3 sol){
 float e=max(v.z,0.),s=max(dot(v,sol),0.);
 vec3 c=mix(vec3(.0048,.011,.027),vec3(.0008,.0018,.006),smoothstep(0.,.14,e));
 c+=vec3(.10,.17,.27)*exp(-e*30.)*.07;
 float sl=max(dot(v,vec3(${LUNA_D[0]},${LUNA_D[1]},${LUNA_D[2]})),0.);
 c+=vec3(.42,.52,.70)*pow(sl,40.)*.07*uConLuna*uHaloLuna;
 c+=vec3(.62,.72,1.)*(pow(sl,180.)*.1+pow(sl,1100.)*.1)*(1.-uAlba)*uConLuna*uHaloLuna;
 if(uAlba>0.){
  // el sol asoma justo sobre el horizonte; la luz del suelo viene algo más alta, para que haya relieve
  vec3 so=normalize(vec3(sol.xy,sol.z*.36));float sa=max(dot(v,so),0.);
  vec3 d=mix(vec3(.46,.17,.085),vec3(.2,.105,.19),smoothstep(0.,.022,e));
  d=mix(d,vec3(.052,.08,.2),smoothstep(.016,.06,e));d=mix(d,vec3(.008,.02,.07),smoothstep(.05,.2,e));
  d+=vec3(1.,.5,.22)*pow(sa,18.)*.16*exp(-e*5.)+vec3(1.,.66,.36)*pow(sa,220.)*.42+vec3(1.,.86,.62)*pow(sa,2500.)*1.4;
  d+=mix(vec3(1.,.62,.34),vec3(1.,.94,.82),smoothstep(-.02,.1,so.z))*smoothstep(.99968,.99992,sa)*5.;
  d+=vec3(.82,.9,1.)*0.;
  c=mix(c,d,uAlba);
 }
 return c;}`;

// La altura se lee siempre de una textura: la del mapa hecho o, mientras nace, la que se recalcula una vez por cuadro.
const ALTURA = `
uniform sampler2D uCerca,uLejos;
vec4 campo(vec2 p){vec2 u=(p+.1)/1.2;if(u.x>.004&&u.y>.004&&u.x<.996&&u.y<.996)return texture(uCerca,u);return texture(uLejos,(p+1.)/3.);}
float alt(vec2 p){return campo(p).r*${ESCZ.toFixed(2)};}`;

const VS_TERRENO = `#version 300 es
precision highp float;precision highp sampler2D;
in vec2 q;uniform mat4 uVP;uniform vec4 uMalla;
${ALTURA}
out vec3 vP;
void main(){vec2 p=uMalla.xy+q*uMalla.zw;vP=vec3(p,alt(p));gl_Position=uVP*vec4(vP,1.);}`;

const FS_TERRENO = `#version 300 es
precision highp float;precision highp sampler2D;
in vec3 vP;uniform sampler2D uRuido,uLuzC,uLuzL;uniform vec3 uCam,uSol;uniform float uT,uMat,uCaja,uBarrido,uEsLejos;uniform vec4 uFoco;
out vec4 o;
${ALTURA}
${CIELO}
float iso(float v,float paso){float x=v/paso,w=max(fwidth(x),1e-4);return 1.-smoothstep(0.,1.4,abs(fract(x-.5)-.5)/w);}
vec3 escala(float v){vec3 a=vec3(.102,.212,.463),b=vec3(.227,.698,.675),c=vec3(.957,.827,.271);return v<.5?mix(a,b,v*2.):mix(b,c,(v-.5)*2.);}
void main(){
 vec2 p=vP.xy;float z=vP.z;
 // el mapa cercano tapa al lejano; el solape evita rendijas
 if(uEsLejos>.5&&p.x>-.085&&p.y>-.085&&p.x<1.085&&p.y<1.085)discard;
 // mientras nace, solo existe el cuadrado de la función
 float caja=uCaja*1.7;if(p.x<-caja||p.y<-caja||p.x>1.+caja||p.y>1.+caja)discard;
 if(uMat<.01&&p.y>uBarrido)discard;
 float hn=z/${ESCZ.toFixed(2)};
 vec3 v=normalize(uCam-vP);float dist=length(uCam-vP);
 float e=mix(.0016,.0062,smoothstep(.9,2.6,dist));vec3 n=normalize(vec3(alt(p-vec2(e,0.))-alt(p+vec2(e,0.)),alt(p-vec2(0.,e))-alt(p+vec2(0.,e)),2.*e));
 // detalle fino: tres escalas de roca, que se apagan con la distancia para no centellear
 float deta=exp(-dist*.42);
 vec3 g1=texture(uRuido,p*5.).rgb-.5,g2=texture(uRuido,p*23.).rgb-.5,g3=texture(uRuido,p*97.).rgb-.5;
 vec3 nd=normalize(n+vec3(g1.xy*.14+g2.xy*.2*deta+g3.xy*.26*deta,0.));
 float grieta=smoothstep(.0,.09,abs(g2.b))*.55+smoothstep(.0,.05,abs(g3.g))*.45;
 float dom=campo(p).g;
 vec3 c;
 // la sombra y la oclusión ya están calculadas en una textura: no dependen de la cámara
 vec2 lu=(p+.1)/1.2;vec2 lm=(lu.x>.004&&lu.y>.004&&lu.x<.996&&lu.y<.996)?texture(uLuzC,lu).rg:texture(uLuzL,(p+1.)/3.).rg;
 float luz=lm.r,oc=lm.g;
 float dif=max(dot(nd,uSol),0.),pendiente=1.-n.z;
 vec3 roca=mix(vec3(.018,.044,.092),vec3(.085,.25,.30),smoothstep(.08,.72,hn));
 roca=mix(roca,vec3(.016,.030,.062),smoothstep(.12,.55,pendiente)*.6);
 roca*=(.74+.62*g1.b+.5*g2.b*deta)*(.62+.5*grieta);
 vec3 oro=vec3(.86,.60,.13);
 roca=mix(roca,oro*(.62+.62*g1.b)*(.75+.5*smoothstep(.25,.75,hn))*(.7+.4*grieta),dom*.92);
 roca=mix(roca,mix(vec3(.13,.115,.15),vec3(.40,.33,.30),smoothstep(.1,.72,hn))*(.78+.5*g1.b+.4*g2.b*deta)*(.66+.46*grieta),uAlba*(1.-dom*.8));
 vec3 lunar=mix(vec3(.72,.88,1.)*2.9,vec3(1.,.70,.47)*4.2,uAlba),ambiente=mix(vec3(.04,.08,.16)*(.45+.55*nd.z)+vec3(.016,.034,.07)*max(dot(nd,v),0.),vec3(.20,.20,.34)*(.55+.45*nd.z)+vec3(.05,.05,.09)*max(dot(nd,v),0.),uAlba);
 c=roca*(lunar*dif*luz+ambiente*oc*1.7+vec3(.16,.10,.024)*dom*(.4+.6*oc));
 c+=mix(vec3(.26,.40,.62),vec3(1.,.62,.42),uAlba)*pow(1.-max(dot(n,v),0.),4.)*.12*oc;
 float cerca=exp(-dot(p-uFoco.xy,p-uFoco.xy)/.028)*uFoco.w;
 float dentro=smoothstep(-.02,.06,p.x)*smoothstep(1.02,.94,p.x)*smoothstep(-.02,.06,p.y)*smoothstep(1.02,.94,p.y);
 float linea=iso(hn,.07)*smoothstep(.1,.16,hn);
 c+=mix(vec3(.16,.50,.54),vec3(1.,.74,.26),dom)*linea*(.05*dentro+.36*cerca+.1*dom*dentro)*exp(-dist*.5);
 c+=mix(vec3(.05,.16,.22),vec3(.42,.28,.05),dom)*cerca*.55*(.35+dif);
 vec2 w=p*2.1+vec2(uT*.006,-uT*.004);float n1=texture(uRuido,w).r,n2=texture(uRuido,w*2.3-vec2(uT*.009,0.)).g,bruma=smoothstep(.34,.72,n1*.65+n2*.35);
 float valle=smoothstep(.13,.05,hn)*bruma;
 c=mix(c,mix(vec3(.05,.10,.19),vec3(.86,.54,.46),uAlba)*(.3+.7*luz),valle*mix(.5,.62,uAlba));
 vec3 h=mix(cielo(-v,uSol),mix(vec3(.34,.16,.13),vec3(.13,.08,.135),smoothstep(-.004,-.11,-v.z)),uAlba);
 float r=length(p-.5),nieb=1.-exp(-pow(max(dist-mix(1.9,2.3,uAlba),0.)*mix(.55,.42,uAlba),1.6));
 nieb=max(nieb,smoothstep(.95,1.28,r))*uMat;
 if(nieb>.992)discard;
 c=mix(c,h,clamp(nieb,0.,1.));
 // la función desnuda: su color es su valor, y sobre ella la rejilla de x e y y las curvas de nivel
 if(uMat<.999){
  vec2 gr=abs(fract(p*20.+.5)-.5)/max(fwidth(p*20.),vec2(1e-5));float rej=1.-smoothstep(0.,1.1,min(gr.x,gr.y));
  vec2 gm=abs(fract(p*4.+.5)-.5)/max(fwidth(p*4.),vec2(1e-5));float rejM=1.-smoothstep(0.,1.3,min(gm.x,gm.y));
  float lum=.32+.8*max(dot(n,normalize(vec3(.45,-.5,.75))),0.);
  vec3 f=pow(escala(clamp((hn-.04)/.5,0.,1.)),vec3(2.2))*lum*1.5;
  f=mix(f,vec3(.8),rej*.1+rejM*.26);f=mix(f,vec3(.02,.03,.06),iso(hn,.05)*smoothstep(.07,.1,hn)*.6);
  float borde=max(max(-p.x,p.x-1.),max(-p.y,p.y-1.));
  if(uMat<.01&&borde>.0)discard;
  c=mix(f,c,uMat);
 }
 o=vec4(c,1.);}`;

// El terreno se calcula en la GPU, de una vez: es la misma fórmula que alturaMapa.js, píxel a píxel, pero en milésimas en vez de segundos.
const FS_HORNEAR = `#version 300 es
precision highp float;precision highp int;
in vec2 u;uniform vec4 uReg[8];uniform vec4 uDom;out vec4 o;
float h2(int i,int j){uint h=uint(i)*374761393u+uint(j)*668265263u;h=(h^(h>>13))*1274126177u;h=h^(h>>16);return float(h)/4294967295.;}
float valor(vec2 p){vec2 f=floor(p),d=p-f;ivec2 q=ivec2(f);d=d*d*(3.-2.*d);float a=h2(q.x,q.y),b=h2(q.x+1,q.y),c=h2(q.x,q.y+1),e=h2(q.x+1,q.y+1);return a+(b-a)*d.x+(c-a)*d.y+(a-b-c+e)*d.x*d.y;}
void main(){
 vec2 p=uDom.xy+(u-.5/uDom.z)*uDom.z/(uDom.z-1.)*uDom.w;
 float s=0.,dos=0.,a=.5,f=7.,peso=1.;vec2 P=p;
 for(int k=0;k<${OCTAVAS};k++){float n=1.-abs(2.*valor(vec2(P.x*f+11.3*float(k),P.y*f-7.1*float(k)))-1.),v=n*n*peso;s+=v*a;peso=min(1.,v*2.2);a*=.5;f*=2.03;if(k==1)dos=s;P=vec2(P.x*.86-P.y*.5,P.x*.5+P.y*.86);}
 float m=0.,ce=0.,dom=0.;
 for(int i=0;i<8;i++){vec2 d=p-uReg[i].xy;float d2=dot(d,d);m+=uReg[i].z*exp(-d2/${(2 * SIGMA * SIGMA).toFixed(6)});ce=max(ce,exp(-d2/${(2 * ANCHO_CIMA * ANCHO_CIMA).toFixed(7)}));dom=max(dom,uReg[i].w*exp(-d2/${(2 * (SIGMA * 1.7) ** 2).toFixed(6)}));}
 float r=length(p-.5),l=clamp((r-.7)/.5,0.,1.);l=l*l*(3.-2.*l);
 o=vec4(clamp(${BASE.toFixed(3)}+m+l*(.08+.5*s)+(1.-ce)*s*(.04+.5*min(1.,m*2.)),0.,1.),min(1.,dom),dos,s);}`;

// Mientras nace: los mismos términos, con cada campana a su altura de ese instante; la roca ya está calculada.
const FS_NACER = `#version 300 es
precision highp float;precision highp sampler2D;
in vec2 u;uniform sampler2D uFuente;uniform vec4 uReg[8];uniform vec4 uDom;uniform float uBase,uRoca2,uRoca5,uFondo;out vec4 o;
void main(){
 vec4 t=texture(uFuente,u);vec2 p=uDom.xy+u*uDom.w;
 float m=0.,ce=0.;
 for(int i=0;i<8;i++){vec2 d=p-uReg[i].xy;float d2=dot(d,d);m+=uReg[i].z*exp(-d2/${(2 * SIGMA * SIGMA).toFixed(6)});ce=max(ce,exp(-d2/${(2 * ANCHO_CIMA * ANCHO_CIMA).toFixed(7)}));}
 float c=mix(t.b*uRoca2,t.a,uRoca5),r=length(p-.5),l=clamp((r-.7)/.5,0.,1.);l=l*l*(3.-2.*l);
 o=vec4(clamp(${BASE.toFixed(3)}*uBase+m+l*(.08+.5*t.a)*uFondo+(1.-ce)*c*(.04+.5*min(1.,m*2.)),0.,1.),t.g,t.b,t.a);}`;

// La penumbra, una sola vez y guardada: para cada punto del suelo, cuánta luz le llega y cuánto lo tapan sus vecinos.
const FS_LUZ = `#version 300 es
precision highp float;precision highp sampler2D;
in vec2 u;uniform vec3 uSol;uniform vec4 uDom;uniform float uPasos;out vec4 o;
${ALTURA}
void main(){
 vec2 p=uDom.xy+u*uDom.w;float z=alt(p),e=.0022;
 vec3 n=normalize(vec3(alt(p-vec2(e,0.))-alt(p+vec2(e,0.)),alt(p-vec2(0.,e))-alt(p+vec2(0.,e)),2.*e));
 float luz=1.;{vec3 r=vec3(p,z)+vec3(n.xy*.003,.0022);float t=.006;for(int i=0;i<int(uPasos);i++){vec3 s=r+uSol*t;float d=s.z-alt(s.xy);luz=min(luz,7.5*d/t);if(luz<.001)break;t+=clamp(d*.7,.0045,.05);if(t>1.1)break;}luz=clamp(luz,0.,1.);luz=luz*luz*(3.-2.*luz);}
 float oc=0.;for(int i=0;i<6;i++){float a=float(i)*1.047+.6;vec2 di=vec2(cos(a),sin(a));oc+=max(alt(p+di*.022)-z,0.)+.6*max(alt(p+di*.06)-z,0.);}
 o=vec4(luz,exp(-oc*4.2),0.,1.);}`;

const VS_PANTALLA = `#version 300 es
out vec2 u;void main(){vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);u=p*.5+.5;gl_Position=vec4(p,.9999,1.);}`;

const FS_CIELO = `#version 300 es
precision highp float;
in vec2 u;uniform mat4 uIVP;uniform vec3 uCam,uSol;uniform sampler2D uRuido,uLuna;uniform float uT,uCielo,uNebula,uEclipse,uEclipseK;out vec4 o;
${CIELO}
float h21(vec2 p){p=fract(p*vec2(233.34,851.73));p+=dot(p,p+23.45);return fract(p.x*p.y);}
void main(){
 vec4 a=uIVP*vec4(u*2.-1.,1.,1.);vec3 v=normalize(a.xyz/a.w-uCam);
 vec3 c=cielo(v,uSol);
 vec2 g=vec2(atan(v.y,v.x)*92.,v.z*92.),id=floor(g),f=fract(g)-.5;float h=h21(id);
 float e=step(.9,h)*smoothstep(.05+.09*pow(h21(id+3.),3.),.0,length(f+vec2(h21(id+7.),h21(id+9.))*.7-.35));
 c+=vec3(.82,.90,1.)*e*(.6+.3*sin(uT*.5+h*80.))*smoothstep(.015,.2,v.z)*.9*(1.-uAlba);
 // la luna: relieve horneado, con su luz rasante y un eclipse que la cruza muy despacio
 vec3 luna=vec3(${LUNA_D[0]},${LUNA_D[1]},${LUNA_D[2]});float R=${LUNA_R};
 vec3 lx=normalize(cross(luna,vec3(0.,0.,1.))),ly=cross(lx,luna);vec2 qL=vec2(dot(v-luna,lx),dot(v-luna,ly))/R;
 vec2 qx=dFdx(qL),qy=dFdy(qL);
 float lq=length(qL);
 if(lq<1.12&&dot(v,luna)>0.&&uConLuna>.5&&uAlba<.5){
  vec2 uvL=qL*.5+.5;vec4 tl=textureGrad(uLuna,uvL,qx*.5,qy*.5);
  float zm=fwidth(lq),disco=1.-smoothstep(1.-max(zm*1.5,.0015),1.,lq),zL=sqrt(max(1.-lq*lq,.0005));
  vec3 n0=vec3(qL,zL);
  // al acercarse, aún más grano: el que no cabe en la textura
  float micro=smoothstep(.0028,.0009,zm);vec2 gm=vec2(0.);
  if(micro>.001){float am=.2;vec2 pq=qL*14.;for(int i=0;i<5;i++){vec2 ii=floor(pq),ff=fract(pq);ff=ff*ff*(3.-2.*ff);float a0=h21(ii),b0=h21(ii+vec2(1,0)),c0=h21(ii+vec2(0,1)),d0=h21(ii+vec2(1,1));gm+=am*vec2((b0-a0)*(1.-ff.y)+(d0-c0)*ff.y,(c0-a0)*(1.-ff.x)+(d0-b0)*ff.x);pq=mat2(1.7,1.1,-1.1,1.7)*pq+3.1;am*=.72;}}
  vec2 pendiente=tl.xy*.62+gm*micro;
  vec3 N=normalize(n0-vec3(pendiente,0.)*(.55+.45*zL));
  vec3 Ll=vec3(${LUNA_L[0]},${LUNA_L[1]},${LUNA_L[2]});
  float lam=max(dot(N,Ll),0.),mu=max(N.z,.05),ls=2.*lam/(lam+mu+.001);        // la Luna refleja así: Lommel-Seeliger, de ahí que parezca plana de frente
  float al=tl.z*(1.+gm.x*.5*micro);
  float luz=mix(1.,tl.w,.68);
  vec2 cSombra=vec2(.86,.2);float pen=smoothstep(.56,1.42,length(qL-cSombra));
  float termina=smoothstep(-.04,.16,dot(n0,Ll));
  vec3 solar=vec3(1.,.965,.9)*al*ls*luz*1.32;
  // la cara eclipsada no es negra: recibe la luz roja que cruza la atmósfera de la Tierra
  vec3 rojo=vec3(.2,.052,.03)*pow(al,.62)*(.42+.8*max(dot(N,normalize(vec3(.1,-.15,1.))),0.));
  vec3 tenue=vec3(.018,.024,.04)*al*(.5+.5*zL);
  vec3 cL=mix(rojo+tenue,solar*termina+tenue,pen);
  c=mix(c,cL,disco*(1.-min(1.,uAlba*7.)));
 }
 if(uAlba>0.&&v.z<.03){
  float az=atan(v.y,v.x);vec3 m=c;
  for(int k=0;k<4;k++){float fk=float(k);
   float cima=.01-.03*fk+.034*(texture(uRuido,vec2(az*(1.9+.8*fk),.13+fk*.31)).r-.5)*2.+.009*(texture(uRuido,vec2(az*(9.+3.*fk),.71+fk*.17)).g-.5)*2.;
   vec3 col=mix(vec3(.42,.2,.17),vec3(.135,.08,.135),pow((fk+1.)/4.,.8));
   m=mix(m,col,smoothstep(cima+.0012,cima-.0012,v.z));}
  c=mix(c,m,uAlba);
 }
 if(uEclipse>0.){
  // el eclipse: la Luna nueva, un disco negro que se desliza sobre el sol, y al final su corona
  vec3 so2=normalize(vec3(uSol.xy,uSol.z*.36)),ex=normalize(cross(so2,vec3(0.,0.,1.))),ey=cross(ex,so2);vec2 q=vec2(dot(v,ex),dot(v,ey));float dso=dot(v,so2),RL=.0262;
  vec2 oc=vec2(-.13,-.05)*(1.-uEclipse);float dl=length(q-oc),zw=fwidth(dl),tot=smoothstep(.93,1.,uEclipse),ds=length(q);
  c*=mix(1.,.05,smoothstep(.76,1.,uEclipse));
  if(dso>0.&&tot>0.){float an=atan(q.y,q.x),n=texture(uRuido,vec2(an*.55,.2)).r*.6+texture(uRuido,vec2(an*2.1,.6)).g*.4,x=max(ds/RL-1.,0.);c+=vec3(1.,.93,.78)*tot*(2.6*exp(-x*9.)+.8*(.35+n*1.2)*exp(-x*2.6))*uEclipseK;}
  float di=smoothstep(.93,.985,uEclipse)*(1.-smoothstep(.985,1.,uEclipse));vec2 pd=RL*vec2(.75,.66);c+=vec3(1.,.95,.85)*di*(22.*exp(-pow(length(q-pd)/.005,2.))+1.3*exp(-length(q-pd)/.03))*uEclipseK;
  c=mix(c,vec3(0.),(1.-smoothstep(RL-max(zw,.00025),RL,dl))*step(0.,dso)*smoothstep(.42,.6,uEclipse)); // la Luna nueva no se ve hasta que empieza a morder el sol
  // su borde se enciende: un anillo fino de luz doblada, la firma de lo que hay detrás
  c+=vec3(1.,.8,.48)*exp(-pow((dl-RL)/.0011,2.))*smoothstep(.42,.6,uEclipse)*step(0.,dso)*1.5*uEclipseK;
 }
 vec3 ne=vec3(0.);
 if(uNebula>0.){
  // el fondo del viaje: nebulosas muy tenues, que dan profundidad sin dejar ver dónde estás
  vec2 w1=v.yz*1.6+v.x*.7,w2=v.xz*1.2+v.y*.9;float n1=texture(uRuido,w1*.13).r*.55+texture(uRuido,w1*.41).g*.3+texture(uRuido,w1*1.13).b*.15,n2=texture(uRuido,w2*.11+.4).g*.6+texture(uRuido,w2*.37).r*.4;
  ne=(vec3(.02,.038,.1)*smoothstep(.36,.66,n1)+vec3(.075,.022,.07)*smoothstep(.42,.68,n2)*smoothstep(.32,.6,n1))*uNebula;
 }
 o=vec4(c*uCielo+ne,1.);}`;

const VS_CAMINO = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec4 a;uniform mat4 uVP;uniform float uZ;
${ALTURA}
out vec2 w;
void main(){vec2 p=a.xy;w=vec2(a.z,a.w);gl_Position=uVP*vec4(p,alt(p)+uZ,1.);}`;

const FS_CAMINO = `#version 300 es
precision highp float;
in vec2 w;uniform float uT,uHecho,uFuerza,uAparece;uniform vec2 uCometa;out vec4 o;
void main(){
 float d=abs(w.y),u=w.x,hecho=step(u,uHecho);
 if(u>uAparece)discard;
 float nucleo=smoothstep(.34,.12,d),halo=exp(-d*d*5.);
 float pulso=pow(.5+.5*sin(u*70.-uT*1.1),7.);
 vec3 oro=vec3(1.,.74,.24),frio=vec3(.62,.80,.95);
 float trazos=smoothstep(.34,.42,abs(fract(u*46.)-.5));
 vec3 c=mix(frio*(nucleo*1.1*trazos+halo*.07),oro*(nucleo*(1.+1.6*pulso)+halo*(.16+.34*pulso)),hecho);
 float col=u-uCometa.x,cabeza=exp(-col*col*9000.)*uCometa.y,estela=step(col,0.)*exp(col*26.)*uCometa.y;
 c+=vec3(1.,.86,.5)*(nucleo*(9.*cabeza+1.6*estela)+halo*(3.4*cabeza+.42*estela));
 o=vec4(c*uFuerza,0.);}`;

const VS_FARO = `#version 300 es
precision highp float;
in vec2 q;in vec3 iP;in vec3 iD;uniform mat4 uVP;uniform vec2 uRes;uniform float uHaz;
out vec2 v;out vec3 d;
void main(){vec4 c=uVP*vec4(iP,1.);d=iD;v=q;float g=iD.x,act=iD.y;
 vec2 tam=uHaz>.5?vec2(6.+5.*g+5.*act,(34.+96.*g+44.*act)):vec2(24.+20.*g+30.*act);
 vec2 base=uHaz>.5?vec2(q.x,(q.y+1.)):q;
 c.xy+=base*tam/uRes*2.*c.w;c.z-=.002*c.w;gl_Position=c;}`;

// La red: neuronas que brillan según su activación, y aristas por las que viajan señales.
const POS_RED = `
uniform float uOrden,uBaja,uSube2;
vec3 posRed(vec3 ca,vec3 or,vec3 fi){return mix(mix(ca,or,uOrden),fi,uBaja);}`;
const VS_NEURONA = `#version 300 es
precision highp float;
in vec2 q;in vec3 aC,aO,aF;in vec3 aD;uniform mat4 uVP,uVPa;uniform vec2 uRes;uniform float uHaz,uLejos,uEstela;
${POS_RED}
out vec2 v;out vec3 d;out float prof,ali,azar;
void main(){vec3 w=posRed(aC,aO,aF);vec4 c=uVP*vec4(w,1.),pa=uVPa*vec4(w,1.);d=aD;v=q;prof=c.w;azar=fract(sin(float(gl_InstanceID)*12.9898)*43758.5453);
 float esP=step(1.5,aD.y),ta=clamp(mix(.021+.012*aD.x+(aD.z>=0.?.012:0.),.008+.012*aD.x*(.5+azar),esP)/max(c.w,.02),mix(.0048+.0088*uLejos,.0026,esP),.19),R=ta*2.4;
 // estela: la luz se alarga en la dirección en que se mueve por la pantalla, como en una exposición de cine
 vec2 asp=vec2(uRes.y/uRes.x,1.),sd=(c.w>.02&&pa.w>.02)?(c.xy/c.w-pa.xy/pa.w)/asp:vec2(0.);float L=min(length(sd),.2)*uEstela;vec2 dirS=length(sd)>1e-5?normalize(sd):vec2(1.,0.);
 ali=R/(R+L*.5);
 vec2 ofs=q*R+dirS*dot(q,dirS)*L*.5;
 c.xy+=ofs*asp*c.w;c.z=min(c.z,c.w*.999);gl_Position=c;}`;
const FS_NEURONA = `#version 300 es
precision highp float;
in vec2 v;in vec3 d;in float prof,ali,azar;uniform float uT,uOla,uOro,uVuelo,uTotal,uFuerza,uPolvo,uLejos;out vec4 o;
float sg(float x){return 1./(1.+exp(-x));}
void main(){
 float r=length(v),a=d.x,capa=d.y,ru=d.z;
 float esPolvo=step(1.5,capa);
 // la ola hacia delante: cada capa se enciende al llegarle la señal, con su activación de verdad
 float frente=fract(uT*.34),dx=capa-frente*1.3+.15,ola=exp(-dx*dx*70.)*uOla;
 float brillo=(.22+.78*a)*(1.-.5*uOla)+ola*(.8+2.*a);
 float visitada=ru>=0.?smoothstep(ru-.05,ru+.05,uVuelo):0.;
 float dispara=ru>=0.?exp(-pow((uVuelo-ru)*2.6,2.))*(1.-uLejos):0.;
 vec3 frio=mix(vec3(.32,.56,.95),vec3(.66,.92,1.),a),oro=vec3(1.,.72,.24);
 // cada estrella tiene su temperatura, como las de verdad
 frio=mix(frio,mix(vec3(1.,.82,.66),vec3(.72,.82,1.),azar),.35*(1.-uOla));
 vec3 col=mix(frio,oro,max(uOro*step(0.,ru),visitada*.8));
 float titila=1.+.13*sin(uT*(1.2+azar*2.3)+azar*40.);
 float nuc=exp(-r*r*62.),hal=exp(-r*r*11.)*(1.-smoothstep(.74,1.,r));
 // destellos de difracción, finos y largos, como los de un buen objetivo
 vec2 w=mat2(.92,.39,-.39,.92)*v;float spike=(exp(-abs(w.y)*90.)*exp(-abs(w.x)*5.)+exp(-abs(w.x)*90.)*exp(-abs(w.y)*5.))*(1.-smoothstep(.8,1.,r));
 // de cerca, la estrella deja ver lo que es: la curva que calcula, con su valor sobre ella
 float cerca=(ru>=0.?1.:.6)*smoothstep(.7,.25,prof)*(1.-esPolvo);
 float curva=0.;
 if(cerca>.002){float xx=v.x/.44,gy=v.y/.44*.5+.5,yy=sg(xx*6.),ln=exp(-pow((gy-yy)*46.,2.))*smoothstep(1.,.72,abs(xx));float x0=(a*2.-1.)*.7,y0=sg(x0*6.);curva=(ln*.42+exp(-(pow(xx-x0,2.)+pow(gy-y0,2.))*700.)*1.7)*cerca;}
 float an=atan(v.y,v.x),aro=smoothstep(.016,.0,abs(r-.58))*step(fract((an/6.2832+.5)-uT*.04),a)*(ru>=0.?1.:.0)*smoothstep(1.6,.5,prof);
 vec3 s=col*(nuc*(1.3+1.7*brillo+3.2*dispara)+hal*(.05+.24*brillo+.55*dispara+.3*uOro*step(0.,ru))+spike*(.14+.34*brillo+.8*dispara)*(.5+.5*smoothstep(1.5,.3,prof))+aro*(.7+1.1*dispara)+curva*(1.+dispara))*titila;
 // en el vuelo, lo lejano se apaga: desde dentro no se puede ver la forma del conjunto
 float lejos=mix(exp(-max(prof-1.5,0.)*.9),1.,uLejos);
 if(esPolvo>.5)s=mix(vec3(.72,.84,1.),mix(vec3(1.,.93,.8),vec3(1.,.74,.56),azar),a)*(nuc*(.85+1.7*a)+hal*.1+spike*.08*a)*titila;
 float pegado=smoothstep(.012,.075,prof);
 o=vec4(s*ali*pegado*uFuerza*mix(lejos,uPolvo*exp(-max(prof-6.,0.)*.09),esPolvo),0.);}`;
const VS_ARISTA = `#version 300 es
precision highp float;
in vec2 q;in vec3 aC0,aO0,aF0,aC1,aO1,aF1;in vec3 aE;uniform mat4 uVP;uniform vec2 uRes;
${POS_RED}
out vec2 v;out vec3 e;out float prof;
void main(){
 vec4 a=uVP*vec4(posRed(aC0,aO0,aF0),1.),b=uVP*vec4(posRed(aC1,aO1,aF1),1.);
 e=aE;v=vec2((q.x+1.)*.5,q.y);prof=mix(a.w,b.w,v.x);
 if(a.w<.03||b.w<.03){gl_Position=vec4(2.,2.,2.,1.);return;}
 vec2 pa=a.xy/a.w,pb=b.xy/b.w,dir=normalize((pb-pa)*uRes+1e-5),nor=vec2(-dir.y,dir.x)/uRes*2.;
 float ancho=(1.+1.5*abs(aE.x)+(aE.z>=0.?1.5:0.)+(aE.z<-1.5?1.:0.))*1.9;
 vec4 p=mix(a,b,v.x);p.xy+=nor*q.y*ancho*p.w;gl_Position=p;}`;
const FS_ARISTA = `#version 300 es
precision highp float;
in vec2 v;in vec3 e;in float prof;uniform float uT,uAristas,uOla,uOro,uVuelo,uTotal,uFuerza,uHilos,uLejos;out vec4 o;
void main(){
 float w=e.x,cap=e.y,ru=e.z,t=v.x,d=abs(v.y);
 float linea=exp(-d*d*5.);
 if(ru<-1.5){
  // los hilos bajan uno tras otro, cada uno con su gota de luz, hasta su montaña
  float pr=clamp(uHilos*1.6-cap*.6,0.,1.);
  float h=smoothstep(t-.012,t+.012,pr),c0=exp(-pow((t-pr)*22.,2.))*step(.001,pr)*step(pr,.999);
  o=vec4(vec3(1.,.74,.28)*linea*(h*.75+c0*9.)*uFuerza,0.);return;}
 vec3 c=w>=0.?vec3(.34,.66,.95):vec3(.86,.42,.62);
 float frente=(t-uT*(.34+.16*abs(w))+cap*5.7),pulso=pow(.5+.5*sin(frente*9.42),46.)*(.3+.75*uOla);
 float cerca2=mix(exp(-max(prof-1.,0.)*1.05),1.,uLejos),junto=smoothstep(.05,.42,prof);
 float a=(.011+.04*abs(w))*uAristas*(1.-.55*uOro)*cerca2*junto;
 vec3 s=c*a+mix(c,vec3(1.,.9,.72),.3)*pulso*abs(w)*.55*uAristas*(1.-.4*uOro)*cerca2*junto;
 if(ru>=0.){
  float prog=clamp(uVuelo-ru,0.,1.),hecho=smoothstep(t-.02,t+.02,prog);
  float enc=max(hecho,uOro);
  float viaje=exp(-pow((t-prog)*11.,2.))*step(.001,prog)*step(prog,.999);
  s+=vec3(1.,.72,.26)*(enc*(.55+1.3*uOro)+viaje*7.)*junto;
 }
 o=vec4(s*linea*uFuerza,0.);}`;
const FS_OSCURO = `#version 300 es
precision highp float;uniform float uK;out vec4 o;void main(){o=vec4(0.,0.,0.,uK);}`;

const FS_FARO = `#version 300 es
precision highp float;
in vec2 v;in vec3 d;uniform float uHaz,uT;out vec4 o;
void main(){float g=d.x,act=d.y,sig=d.z;
 vec3 oro=vec3(1.,.74,.26),frio=vec3(.62,.84,1.);vec3 col=mix(frio,oro,smoothstep(.0,.25,g)*.9+sig*.9);
 if(uHaz>.5){float y=(v.y+1.)*.5,a=exp(-v.x*v.x*14.)*pow(1.-y,2.4)*smoothstep(0.,.02,y);o=vec4(col*a*(.24+.55*g+.5*act+.6*sig),0.);return;}
 float r=length(v),puls=sig*(.5+.5*sin(uT*1.7));
 float nuc=smoothstep(.13,.03,r),hal=exp(-r*r*7.)*(1.-smoothstep(.8,1.,r));
 o=vec4(col*(nuc*(1.4+act+g*.6)+hal*(.18+.36*act+.3*g+.4*puls)),0.);}`;

const FS_BRILLO = `#version 300 es
precision highp float;
in vec2 u;uniform sampler2D uTex;uniform vec2 uDir;uniform float uCorte;out vec4 o;
void main(){vec3 c=vec3(0.);float pesos[5]=float[](.227,.195,.122,.054,.016);
 for(int i=-4;i<=4;i++){vec3 s=texture(uTex,u+uDir*float(i)).rgb;c+=max(s-uCorte,0.)*pesos[abs(i)];}
 o=vec4(c,1.);}`;

const FS_FINAL = `#version 300 es
precision highp float;
in vec2 u;uniform sampler2D uTex,uBri;uniform float uExpo,uT,uCine;uniform vec2 uPx;uniform vec4 uDisco;out vec4 o;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
 // bajar de resolución con cuatro muestras, y afilar: todo el detalle que cabe en cada píxel de pantalla
 vec3 c0=texture(uTex,u).rgb,cr=texture(uTex,u+uPx*vec2(1.,0.)).rgb,cl=texture(uTex,u-uPx*vec2(1.,0.)).rgb,cu=texture(uTex,u+uPx*vec2(0.,1.)).rgb,cd=texture(uTex,u-uPx*vec2(0.,1.)).rgb;
 vec3 c=c0+(c0-(cr+cl+cu+cd)*.25)*.85;c=max(c,vec3(0.));
 float mb=1.;if(uDisco.w>0.){mb=smoothstep(uDisco.z*.9,uDisco.z*1.02,length((u-uDisco.xy)*vec2(uDisco.w,1.)));} // el resplandor del sol no puede cruzar la Luna, que está delante
 c+=texture(uBri,u).rgb*.55*mb;
 vec2 q=u-vec2(mix(.46,.5,uCine),.5);c*=1.-.62*smoothstep(mix(.34,.42,uCine),.95,length(q*vec2(1.,1.15)));
 c=aces(c*1.05*uExpo);c=pow(c,vec3(1./2.2));
 c+=(h(u*vec2(1731.,977.)+fract(uT))-.5)/mix(120.,70.,uCine);
 o=vec4(c,1.);}`;

// ------------------------------------------------------------------- matrices
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const pt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mult = (a, b) => { const r = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; } return r; };
export function inversa(m) {
  const A = Array.from({ length: 4 }, (_, i) => [m[i], m[i + 4], m[i + 8], m[i + 12], i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0, i === 3 ? 1 : 0]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let f = c + 1; f < 4; f++) if (Math.abs(A[f][c]) > Math.abs(A[p][c])) p = f;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c];
    for (let k = 0; k < 8; k++) A[c][k] /= d;
    for (let f = 0; f < 4; f++) if (f !== c) { const x = A[f][c]; for (let k = 0; k < 8; k++) A[f][k] -= x * A[c][k]; }
  }
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[j * 4 + i] = A[i][j + 4];
  return r;
}

/** Cámara orbital que mira a `objetivo`. `corrimiento` desplaza la imagen en horizontal: deja sitio al panel. */
export function camaraMapa({ yaw, pitch, dist, objetivo, aspecto, corrimiento = 0, alzado = 0 }) {
  const ojo = [objetivo[0] + dist * Math.cos(pitch) * Math.sin(yaw), objetivo[1] - dist * Math.cos(pitch) * Math.cos(yaw), objetivo[2] + dist * Math.sin(pitch)];
  const f = norm(sub(objetivo, ojo)), s = norm(cruz(f, [0, 0, 1])), up = cruz(s, f);
  const V = new Float32Array([s[0], up[0], -f[0], 0, s[1], up[1], -f[1], 0, s[2], up[2], -f[2], 0, -pt(s, ojo), -pt(up, ojo), pt(f, ojo), 1]);
  const fy = 1 / Math.tan((38 * Math.PI) / 360), near = 0.04, far = 20;
  const P = new Float32Array([fy / aspecto, 0, 0, 0, 0, fy, 0, 0, corrimiento, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
  P[8] = -corrimiento; P[9] = -alzado;
  return { ojo, vp: mult(P, V) };
}
/** Cámara libre: desde un punto, mirando a otro. Para volar. */
export function camaraLibre({ ojo, mira, aspecto, fov = 58, alabeo = 0, corrimiento = 0, alzado = 0 }) {
  const f = norm(sub(mira, ojo)), s0 = norm(cruz(f, [0, 0, 1])), u0 = cruz(s0, f), c = Math.cos(alabeo), n = Math.sin(alabeo);
  const s = [s0[0] * c + u0[0] * n, s0[1] * c + u0[1] * n, s0[2] * c + u0[2] * n], up = cruz(s, f);
  const V = new Float32Array([s[0], up[0], -f[0], 0, s[1], up[1], -f[1], 0, s[2], up[2], -f[2], 0, -pt(s, ojo), -pt(up, ojo), pt(f, ojo), 1]);
  const fy = 1 / Math.tan((fov * Math.PI) / 360), near = 0.02, far = 30;
  const P = new Float32Array([fy / aspecto, 0, 0, 0, 0, fy, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
  P[8] = -corrimiento; P[9] = -alzado;
  return { ojo, vp: mult(P, V) };
}
export function proyectar(vp, [x, y, z]) {
  const X = vp[0] * x + vp[4] * y + vp[8] * z + vp[12], Y = vp[1] * x + vp[5] * y + vp[9] * z + vp[13], W = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
  return [(X / W + 1) / 2, (1 - Y / W) / 2];
}

function programa(gl, vs, fs) {
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
  const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
  return { p, u };
}

function texturaRuido(gl) {
  const N = 256, d = new Uint8Array(N * N * 4), cap = (x, y, f, k) => { // ruido periódico suave, por capas
    let s = 0, a = 0.5;
    for (let o = 0; o < 4; o++) { const F = f << o, i = Math.floor(x * F), j = Math.floor(y * F), u = x * F - i, v = y * F - j, U = u * u * (3 - 2 * u), V = v * v * (3 - 2 * v); const r = (p, q) => { const P = ((p % F) + F) % F, Q = ((q % F) + F) % F; let h = (Math.imul(P + k * 57, 73856093) ^ Math.imul(Q + o * 131, 19349663)) | 0; h = Math.imul(h ^ (h >>> 15), 2654435761); return ((h ^ (h >>> 13)) >>> 0) / 4294967295; }; s += a * (r(i, j) * (1 - U) * (1 - V) + r(i + 1, j) * U * (1 - V) + r(i, j + 1) * (1 - U) * V + r(i + 1, j + 1) * U * V); a *= 0.5; }
    return s / 0.9375;
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = i / N, y = j / N; d[(j * N + i) * 4] = cap(x, y, 8, 1) * 255; d[(j * N + i) * 4 + 1] = cap(x, y, 16, 2) * 255; d[(j * N + i) * 4 + 2] = cap(x, y, 32, 3) * 255; d[(j * N + i) * 4 + 3] = 255; }
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return t;
}

export function crearPaisaje(canvas, { software = false, luna = true } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  const hdr = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
  const pT = programa(gl, VS_TERRENO, FS_TERRENO), pC = programa(gl, VS_PANTALLA, FS_CIELO), pR = programa(gl, VS_CAMINO, FS_CAMINO), pF = programa(gl, VS_FARO, FS_FARO), pB = programa(gl, VS_PANTALLA, FS_BRILLO), pS = programa(gl, VS_PANTALLA, FS_FINAL);
  const ruido = texturaRuido(gl), texCerca = gl.createTexture(), texLejos = gl.createTexture(), vacioVAO = gl.createVertexArray();
  const anis = gl.getExtension('EXT_texture_filter_anisotropic');
  if (anis) { gl.bindTexture(gl.TEXTURE_2D, ruido); gl.texParameterf(gl.TEXTURE_2D, anis.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(anis.MAX_TEXTURE_MAX_ANISOTROPY_EXT))); }

  const qT = gl.getAttribLocation(pT.p, 'q');
  /** Una malla regular de n×n cuadrados, en [0, 1]². */
  function crearMalla(n) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const v = new Float32Array((n + 1) * (n + 1) * 2), idx = new Uint32Array(n * n * 6);
    for (let j = 0, k = 0; j <= n; j++) for (let i = 0; i <= n; i++) { v[k++] = i / n; v[k++] = j / n; }
    for (let j = 0, k = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c; }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(qT); gl.vertexAttribPointer(qT, 2, gl.FLOAT, false, 0, 0);
    return { vao, cuantos: idx.length };
  }
  const mallaCerca = crearMalla(740), mallaLejos = crearMalla(320);

  // los faros: un cuadrado, repetido en cada cima
  const vaoF = gl.createVertexArray(); gl.bindVertexArray(vaoF);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const qF = gl.getAttribLocation(pF.p, 'q'); gl.enableVertexAttribArray(qF); gl.vertexAttribPointer(qF, 2, gl.FLOAT, false, 0, 0);
  const bufF = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufF);
  const iP = gl.getAttribLocation(pF.p, 'iP'), iD = gl.getAttribLocation(pF.p, 'iD');
  gl.enableVertexAttribArray(iP); gl.vertexAttribPointer(iP, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribDivisor(iP, 1);
  gl.enableVertexAttribArray(iD); gl.vertexAttribPointer(iD, 3, gl.FLOAT, false, 24, 12); gl.vertexAttribDivisor(iD, 1);

  const vaoR = gl.createVertexArray(); let nCamino = 0;
  function fijarCamino(puntos, largo) {
    // cinta sobre el suelo: cada punto da dos vértices, a los lados de la dirección del camino
    const n = puntos.length, d = new Float32Array(n * 2 * 4);
    for (let i = 0; i < n; i++) {
      const a = puntos[Math.max(0, i - 1)], b = puntos[Math.min(n - 1, i + 1)], t = norm([b[0] - a[0], b[1] - a[1], 0]), u = i / (n - 1);
      for (const [k, s] of [[0, -1], [1, 1]]) d.set([puntos[i][0] - t[1] * s * largo, puntos[i][1] + t[0] * s * largo, u, s], (i * 2 + k) * 4);
    }
    gl.bindVertexArray(vaoR);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pR.p, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 4, gl.FLOAT, false, 0, 0);
    nCamino = n * 2;
  }
  const pH = hdr ? programa(gl, VS_PANTALLA, FS_HORNEAR) : null, fbH = gl.createFramebuffer();
  const pN = hdr ? programa(gl, VS_PANTALLA, FS_NACER) : null, pL = programa(gl, VS_PANTALLA, FS_LUZ);
  const N_NACE = 1024, N_NACE_L = 384, N_LUZ = software ? 768 : 1536, N_LUZ_L = 512, PASOS = software ? 14 : 28;
  let texNaceC = null, texNaceL = null, huellaNace = '', usarNace = false;
  const nuevaLuz = (N) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, N, N, 0, gl.RG, gl.UNSIGNED_BYTE, null); for (const [k, w] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, w); return t; };
  let luzC = nuevaLuz(N_LUZ), luzCaux = nuevaLuz(N_LUZ), luzL = nuevaLuz(N_LUZ_L), luzLaux = nuevaLuz(N_LUZ_L);
  let trozo = -1;
  const BANDAS = 24;
  /** La penumbra de un trozo del mapa, sobre la textura de reserva. Sin trozo, todo de golpe. */
  function pasadaLuz(tex, N, a, b, sol, fila0 = 0, filas = N) {
    gl.useProgram(pL.p); gl.bindVertexArray(vacioVAO); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbH); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, N, N); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, fila0, N, filas);
    gl.uniform3fv(pL.u.uSol, sol); gl.uniform4f(pL.u.uDom, a, a, 0, b - a); gl.uniform1f(pL.u.uPasos, PASOS);
    t2(pL.u.uCerca, 6, texCerca); t2(pL.u.uLejos, 7, texLejos);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function hornearLuz(sol) {
    pasadaLuz(luzC, N_LUZ, DOMINIO_CERCA[0], DOMINIO_CERCA[1], sol);
    pasadaLuz(luzL, N_LUZ_L, DOMINIO[0], DOMINIO[1], sol);
    trozo = -1;
  }
  /** La luz se mueve muy despacio: se rehace por bandas, repartida entre muchos cuadros, y se cambia de golpe al acabar. Devuelve true al cambiar. */
  function avanzarLuz(sol) {
    if (trozo < 0) trozo = 0;
    const f0 = Math.floor((trozo * N_LUZ) / BANDAS), f1 = Math.floor(((trozo + 1) * N_LUZ) / BANDAS);
    pasadaLuz(luzCaux, N_LUZ, DOMINIO_CERCA[0], DOMINIO_CERCA[1], sol, f0, f1 - f0);
    if (++trozo < BANDAS) return false;
    pasadaLuz(luzLaux, N_LUZ_L, DOMINIO[0], DOMINIO[1], sol);
    [luzC, luzCaux] = [luzCaux, luzC]; [luzL, luzLaux] = [luzLaux, luzL];
    trozo = -1;
    return true;
  }
  /** Mientras nace: la altura de este instante, una vez por cuadro y solo si ha cambiado. Todo lo demás la lee de aquí. */
  function hornearNace(gu, regs) {
    if (!pN) return;
    const k = `${gu.base}|${gu.roca2}|${gu.roca5}|${gu.caja}|${gu.s.join()}`;
    usarNace = true;
    if (k === huellaNace) return;
    huellaNace = k;
    if (!texNaceC) { texNaceC = gl.createTexture(); prepararTex(texNaceC, N_NACE, null); texNaceL = gl.createTexture(); prepararTex(texNaceL, N_NACE_L, null); }
    gl.useProgram(pN.p); gl.bindVertexArray(vacioVAO); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.uniform4fv(pN.u['uReg[0]'], regs); gl.uniform1f(pN.u.uBase, gu.base); gl.uniform1f(pN.u.uRoca2, gu.roca2); gl.uniform1f(pN.u.uRoca5, gu.roca5); gl.uniform1f(pN.u.uFondo, gu.caja);
    const pases = [[texNaceC, N_NACE, DOMINIO_CERCA, texCerca]];
    if (gu.caja > 0) pases.push([texNaceL, N_NACE_L, DOMINIO, texLejos]);
    for (const [t, N, [a, b], fuente] of pases) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbH); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.viewport(0, 0, N, N); gl.uniform4f(pN.u.uDom, a, a, 0, b - a); t2(pN.u.uFuente, 5, fuente); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  const terminarNace = () => { usarNace = false; for (const t of [texNaceC, texNaceL]) if (t) gl.deleteTexture(t); texNaceC = texNaceL = null; huellaNace = ''; };
  const N_CERCA = 1280, N_LEJOS = 512;
  const prepararTex = (t, N, datos) => {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, N, N, 0, gl.RGBA, gl.FLOAT, datos);
    for (const [k, w] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, w);
  };
  /** `regs`: por región, x, y, altura a y grado. Si la GPU no puede escribir en coma flotante, lo calcula JS, con menos resolución. */
  function fijarCampo(regs, regiones, grados) {
    if (!pH) { prepararTex(texCerca, 512, campoMapa(regiones, grados, 512, DOMINIO_CERCA)); prepararTex(texLejos, 256, campoMapa(regiones, grados, 256, DOMINIO)); return; }
    gl.useProgram(pH.p); gl.bindVertexArray(vacioVAO); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.uniform4fv(pH.u['uReg[0]'], regs);
    for (const [t, N, [a, b]] of [[texCerca, N_CERCA, DOMINIO_CERCA], [texLejos, N_LEJOS, DOMINIO]]) {
      prepararTex(t, N, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbH); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.viewport(0, 0, N, N); gl.uniform4f(pH.u.uDom, a, a, N, b - a); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  /** Lee lo horneado en un punto del mapa cercano: sirve para comprobar que la GPU y JS calculan lo mismo. */
  function leerCampo(x, y) {
    const [a, b] = DOMINIO_CERCA, i = Math.round(((x - a) / (b - a)) * (N_CERCA - 1)), j = Math.round(((y - a) / (b - a)) * (N_CERCA - 1)), d = new Float32Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbH); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texCerca, 0);
    gl.readPixels(i, j, 1, 1, gl.RGBA, gl.FLOAT, d); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { valor: Array.from(d), x: a + (i * (b - a)) / (N_CERCA - 1), y: a + (j * (b - a)) / (N_CERCA - 1) };
  }

  // destinos de dibujo: la escena, en alto rango si se puede, y dos capas a un cuarto para el resplandor
  const crearDestino = (w, h, conProfundidad) => {
    const t = gl.createTexture(), fb = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.FLOAT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const [k, x] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, x);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    let rb = null;
    if (conProfundidad) { rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb); }
    return { t, fb, rb, w, h, borrar() { gl.deleteTexture(t); gl.deleteFramebuffer(fb); if (rb) gl.deleteRenderbuffer(rb); } };
  };
  let esc = null, base = null, b1 = null, b2 = null, baseValida = false;
  /** El lienzo, a los píxeles de la pantalla; la escena, con más: lo que sobra se convierte en nitidez al bajar. */
  function ajustar(cw, ch, w, h) {
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    if (esc && esc.w === w && esc.h === h) return;
    for (const x of [esc, base, b1, b2]) x?.borrar();
    baseValida = false;
    esc = crearDestino(w, h, true); base = crearDestino(w, h, true); b1 = crearDestino(w >> 2 || 1, h >> 2 || 1, false); b2 = crearDestino(w >> 2 || 1, h >> 2 || 1, false);
  }
  const usarAltura = (P) => { t2(P.u.uCerca, 6, usarNace ? texNaceC : texCerca); t2(P.u.uLejos, 7, usarNace && texNaceL ? texNaceL : texLejos); };
  // Sin HDR no se puede hornear: se dibuja la versión sin relieve (ver FS_CIELO, uConLuna)
  const texLuna = luna && hdr ? hornearLuna(gl, vacioVAO, { tam: software ? 512 : 2048 }) : null;
  const t2 = (u, unidad, tex) => { gl.activeTexture(gl.TEXTURE0 + unidad); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u, unidad); };

  // --- la red del cruce
  let redGL = null;
  const pO = programa(gl, VS_PANTALLA, FS_OSCURO);
  let pN2 = null, pA2 = null;
  /** Prepara las neuronas y las aristas una sola vez: todo lo que se mueve se calcula en la GPU, con tres posiciones por punto. */
  function fijarRed(red) {
    pN2 = programa(gl, VS_NEURONA, FS_NEURONA); pA2 = programa(gl, VS_ARISTA, FS_ARISTA);
    const cuad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cuad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const atr = (P, nombre, n, paso, ofs) => { const l = gl.getAttribLocation(P.p, nombre); if (l < 0) return; gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, paso, ofs); gl.vertexAttribDivisor(l, 1); };
    const L = CAPAS_N - 1;
    const vaoN = gl.createVertexArray(); gl.bindVertexArray(vaoN);
    gl.bindBuffer(gl.ARRAY_BUFFER, cuad); { const l = gl.getAttribLocation(pN2.p, 'q'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); }
    const dN = new Float32Array([...red.nodos.flatMap((n) => [...n.caos, ...n.orden, ...n.fin, n.activ, n.capa / L, n.ruta]), ...red.polvo.flatMap((n) => [...n.caos, ...n.caos, ...n.caos, n.activ * 0.5, 2, -1])]);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, dN, gl.STATIC_DRAW);
    atr(pN2, 'aC', 3, 48, 0); atr(pN2, 'aO', 3, 48, 12); atr(pN2, 'aF', 3, 48, 24); atr(pN2, 'aD', 3, 48, 36);
    const vaoA = gl.createVertexArray(); gl.bindVertexArray(vaoA);
    gl.bindBuffer(gl.ARRAY_BUFFER, cuad); { const l = gl.getAttribLocation(pA2.p, 'q'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); }
    const dA = new Float32Array(red.aristas.flatMap((e) => { const a = red.nodos[e.a], b = red.nodos[e.b], esRuta = a.ruta >= 0 && b.ruta === a.ruta + 1; return [...a.caos, ...a.orden, ...a.fin, ...b.caos, ...b.orden, ...b.fin, e.w, a.capa / L, esRuta ? a.ruta : -1]; }).concat(red.ruta.map((i) => red.nodos[i]).filter((n) => n.cima).flatMap((n, k, L0) => [...n.orden, ...n.orden, ...n.orden, ...n.cima, ...n.cima, ...n.cima, 1, k / Math.max(L0.length - 1, 1), -2])));
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, dA, gl.STATIC_DRAW);
    const P = 84; [['aC0', 0], ['aO0', 12], ['aF0', 24], ['aC1', 36], ['aO1', 48], ['aF1', 60], ['aE', 72]].forEach(([n, o]) => atr(pA2, n, 3, P, o));
    redGL = { vaoN, vaoA, nN: red.nodos.length + red.polvo.length, nA: red.aristas.length + red.ruta.filter((i) => red.nodos[i].cima).length, total: L };
  }
  function dibujarRed(e, vp) {
    const r = e.red, comun = (P) => { gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, vp); gl.uniform2f(P.u.uRes, esc.w, esc.h); gl.uniform1f(P.u.uOrden, r.orden); gl.uniform1f(P.u.uBaja, r.baja); gl.uniform1f(P.u.uT, e.t); gl.uniform1f(P.u.uOla, r.ola); gl.uniform1f(P.u.uOro, r.oro); gl.uniform1f(P.u.uVuelo, r.vuelo); gl.uniform1f(P.u.uTotal, redGL.total); gl.uniform1f(P.u.uFuerza, r.fuerza); gl.uniform1f(P.u.uLejos, r.lejos ?? 1); };
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    comun(pA2); gl.uniform1f(pA2.u.uAristas, r.aristas); gl.uniform1f(pA2.u.uHilos, r.hilos ?? 0); gl.bindVertexArray(redGL.vaoA); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, redGL.nA);
    comun(pN2); gl.uniform1f(pN2.u.uHaz, 0); gl.uniform1f(pN2.u.uPolvo, r.polvo ?? 1); gl.uniformMatrix4fv(pN2.u.uVPa, false, r.vpPrevio ?? vp); gl.uniform1f(pN2.u.uEstela, r.estela ?? 1); gl.bindVertexArray(redGL.vaoN); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, redGL.nN);
  }

  /** e: { vp, ojo, sol, sube, t, expo, foco:[x,y,_,fuerza], hecho, aparece, faros:Float32Array(n×6), pasos } */
  function dibujar(e) {
    const { vp, ojo, sol } = e;
    // el fondo (cielo y terreno) se guarda aparte: si nada lo ha movido, se reutiliza, y solo se redibuja lo que brilla encima
    if (e.rehacer !== false || !baseValida) {
      baseValida = true;
      gl.bindFramebuffer(gl.FRAMEBUFFER, base.fb); gl.viewport(0, 0, base.w, base.h);
      gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
      gl.depthMask(true); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST); gl.useProgram(pC.p); gl.bindVertexArray(vacioVAO);
      gl.uniformMatrix4fv(pC.u.uIVP, false, inversa(vp)); gl.uniform3fv(pC.u.uCam, ojo); gl.uniform3fv(pC.u.uSol, e.solCielo ?? sol); gl.uniform1f(pC.u.uT, e.t); gl.uniform1f(pC.u.uCielo, e.cielo ?? e.nace?.cielo ?? 1); gl.uniform1f(pC.u.uAlba, e.alba ?? 0); gl.uniform1f(pC.u.uNebula, e.nebula ?? 0); gl.uniform1f(pC.u.uEclipse, e.eclipse ?? 0); gl.uniform1f(pC.u.uEclipseK, e.eclipseK ?? 1); gl.uniform1f(pC.u.uConLuna, texLuna ? 1 : 0); gl.uniform1f(pC.u.uHaloLuna, e.haloLuna ?? 1); t2(pC.u.uRuido, 1, ruido); t2(pC.u.uLuna, 4, texLuna ?? ruido);
      if ((e.nace?.cielo ?? 1) > 0 || e.nebula > 0) gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (e.sinTerreno) { gl.depthMask(true); }
      if (!e.sinTerreno) {
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.useProgram(pT.p);
      gl.uniform1f(pT.u.uAlba, e.alba ?? 0);
      gl.uniformMatrix4fv(pT.u.uVP, false, vp); gl.uniform3fv(pT.u.uCam, ojo); gl.uniform3fv(pT.u.uSol, sol); gl.uniform1f(pT.u.uT, e.t); gl.uniform4fv(pT.u.uFoco, e.foco);
      gl.uniform1f(pT.u.uMat, e.nace?.mat ?? 1); gl.uniform1f(pT.u.uCaja, e.nace?.caja ?? 1); gl.uniform1f(pT.u.uBarrido, e.nace ? -0.02 + 1.04 * e.nace.plano : 9);
      t2(pT.u.uRuido, 1, ruido); t2(pT.u.uLuzC, 2, luzC); t2(pT.u.uLuzL, 3, luzL); usarAltura(pT);
      gl.bindVertexArray(mallaCerca.vao); gl.uniform4f(pT.u.uMalla, -0.1, -0.1, 1.2, 1.2); gl.uniform1f(pT.u.uEsLejos, 0); gl.drawElements(gl.TRIANGLES, mallaCerca.cuantos, gl.UNSIGNED_INT, 0);
      if ((e.nace?.caja ?? 1) > 0) { gl.bindVertexArray(mallaLejos.vao); gl.uniform4f(pT.u.uMalla, -1, -1, 3, 3); gl.uniform1f(pT.u.uEsLejos, 1); gl.drawElements(gl.TRIANGLES, mallaLejos.cuantos, gl.UNSIGNED_INT, 0); }
      }
    }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, base.fb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, esc.fb);
    gl.blitFramebuffer(0, 0, base.w, base.h, 0, 0, esc.w, esc.h, gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, esc.fb); gl.viewport(0, 0, esc.w, esc.h);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // en el cruce, el paisaje aparece poco a poco desde lo negro
    if (e.red && e.red.fondo < 1) {
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ZERO, gl.SRC_ALPHA); gl.depthMask(false);
      gl.useProgram(pO.p); gl.bindVertexArray(vacioVAO); gl.uniform1f(pO.u.uK, e.red.fondo); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST);
    }
    // camino: encendido sobre el suelo y, muy tenue, a través de las montañas
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    if (nCamino && e.aparece > 0) {
      gl.useProgram(pR.p); gl.bindVertexArray(vaoR);
      gl.uniformMatrix4fv(pR.u.uVP, false, vp); gl.uniform1f(pR.u.uZ, 0.0085); gl.uniform1f(pR.u.uT, e.t); gl.uniform1f(pR.u.uHecho, e.hecho); gl.uniform1f(pR.u.uAparece, e.aparece); gl.uniform2fv(pR.u.uCometa, e.cometa ?? [0, 0]); usarAltura(pR);
      gl.uniform1f(pR.u.uFuerza, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, nCamino);
      gl.disable(gl.DEPTH_TEST); gl.uniform1f(pR.u.uFuerza, 0.1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, nCamino); gl.enable(gl.DEPTH_TEST);
    }
    // faros
    gl.useProgram(pF.p); gl.bindVertexArray(vaoF);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufF); gl.bufferData(gl.ARRAY_BUFFER, e.faros, gl.DYNAMIC_DRAW);
    gl.uniformMatrix4fv(pF.u.uVP, false, vp); gl.uniform2f(pF.u.uRes, canvas.clientWidth || esc.w, canvas.clientHeight || esc.h); gl.uniform1f(pF.u.uT, e.t);
    const n = e.faros.length / 6;
    gl.disable(gl.DEPTH_TEST);
    if ((e.nace?.camino ?? 1) > 0) {
      gl.uniform1f(pF.u.uHaz, 1); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
      gl.uniform1f(pF.u.uHaz, 0); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    }
    if (e.red && redGL) dibujarRed(e, vp);
    gl.disable(gl.BLEND); gl.depthMask(true);
    // resplandor
    gl.useProgram(pB.p); gl.bindVertexArray(vacioVAO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b1.fb); gl.viewport(0, 0, b1.w, b1.h); t2(pB.u.uTex, 0, esc.t); gl.uniform2f(pB.u.uDir, 2 / b1.w, 0); gl.uniform1f(pB.u.uCorte, hdr ? 1.05 : 0.8); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b2.fb); t2(pB.u.uTex, 0, b1.t); gl.uniform2f(pB.u.uDir, 0, 2 / b1.h); gl.uniform1f(pB.u.uCorte, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // final
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(pS.p); t2(pS.u.uTex, 0, esc.t); t2(pS.u.uBri, 1, b2.t); gl.uniform1f(pS.u.uExpo, e.expo); gl.uniform1f(pS.u.uCine, e.red ? 1 - (e.alba ?? 0) : 0); gl.uniform4fv(pS.u.uDisco, e.disco ?? [0, 0, 0, 0]); gl.uniform1f(pS.u.uT, e.t); gl.uniform2f(pS.u.uPx, 1 / canvas.width, 1 / canvas.height);
    gl.disable(gl.DEPTH_TEST); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return { gl, ajustar, dibujar, fijarCampo, fijarCamino, leerCampo, hornearLuz, avanzarLuz, hornearNace, terminarNace, fijarRed };
}
