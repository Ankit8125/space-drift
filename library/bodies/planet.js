import {bodyVertex,makeBodyResult} from './materials.js';

export function buildPlanet(THREE,noise,definition){
  const group=new THREE.Group(),r=definition.radius;
  const material=new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(definition.color)},uKind:{value:definition.kind},uSeed:{value:definition.seed%1000},uDark:{value:definition.dark?.12:1}},vertexShader:bodyVertex,
    fragmentShader:`${noise} varying vec3 vP,vN,vWorld;uniform vec3 uColor;uniform float uKind,uSeed,uDark;
    void main(){vec3 p=normalize(vP);vec3 n=normalize(vN);vec3 light=normalize(vec3(-.8,.45,1.));float day=dot(n,light);float f=fbm(p*3.+uSeed);float detail=fbm(p*32.+uSeed);
    vec3 col=uColor;float spec=0.;
    if(uKind<.5){float land=smoothstep(.46,.52,f);float ice=smoothstep(.82,.97,abs(p.y)+f*.1);vec3 ground=mix(vec3(.055,.10,.035),vec3(.31,.26,.12),smoothstep(.48,.72,f));col=mix(vec3(.012,.07,.13),ground,land);col=mix(col,vec3(.8,.86,.9),ice);float clouds=smoothstep(.53,.68,fbm(p*9.+vec3(30.,uSeed,4.)));col=mix(col,vec3(.85,.88,.9),clouds*.92);vec3 h=normalize(light+normalize(cameraPosition-vWorld));spec=pow(max(dot(n,h),0.),65.)*(1.-land)*.6;}
    else if(uKind<1.5){float craters=pow(abs(noise3(p*65.)-.5)*2.,3.);col*=.45+f*.8+detail*.35-craters*.18;}
    else if(uKind<2.5){float bands=sin(p.y*55.+fbm(p*8.)*8.);float storm=fbm(p*18.+vec3(f*3.,0.,0.));col*=.58+.17*bands+storm*.58;}
    else if(uKind<3.5){float cracks=pow(1.-abs(sin(f*47.+p.x*13.)),18.);col*=.6+detail*.5;col=mix(col,vec3(.18,.12,.1),cracks*.6);}
    else{float lava=pow(smoothstep(.5,.74,detail),2.);col=vec3(.025,.02,.018)+vec3(1.,.17,.012)*lava;}
    float nightAmbient=.08+.035*smoothstep(-1.,.3,day);
    float lighting=nightAmbient+pow(max(day,0.),.85)*.92*uDark;
    col*=lighting;
    if(uKind>3.5)col+=vec3(1.,.09,.002)*pow(smoothstep(.55,.73,detail),3.)*.8;
    col+=vec3(.7,.82,.9)*spec*max(day,0.);gl_FragColor=vec4(col,1.);}`});
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(r,80,56),material);group.add(sphere);
  if(definition.kind===0||definition.kind===2){
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(r*1.023,64,40),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:bodyVertex,
      fragmentShader:`varying vec3 vP,vN,vWorld;void main(){vec3 n=normalize(vN);float rim=pow(1.-abs(dot(n,normalize(cameraPosition-vWorld))),3.2);float sun=smoothstep(-.4,.8,dot(n,normalize(vec3(-.8,.45,1.))));float glow=rim*(sun*.68+.32);gl_FragColor=vec4(vec3(.22,.54,.96),glow*.85);}`}));group.add(atmosphere);
  }
  if(definition.rings){
    const rings=new THREE.Mesh(new THREE.RingGeometry(r*1.28,r*2.05,160),new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,
      uniforms:{uR:{value:r}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec3 vP;uniform float uR;void main(){float r=length(vP.xy)/uR;float b=.42+.13*sin(r*240.)+.1*sin(r*530.);float gap=smoothstep(.008,.024,abs(r-1.69));float edge=smoothstep(1.28,1.36,r)*(1.-smoothstep(1.94,2.05,r));float shadow=1.-.83*(1.-smoothstep(.15,.28,abs(vP.x/uR)))*step(0.,vP.y);gl_FragColor=vec4(vec3(.55,.49,.40)*shadow,b*gap*edge);}`}));
    rings.rotation.set(1.07,.2,-.3);group.add(rings);
  }
  if(definition.moon){const moon=new THREE.Mesh(new THREE.SphereGeometry(r*.16,28,20),new THREE.MeshStandardMaterial({color:0xb2b2ad,roughness:.85}));moon.position.set(-r*1.1,r*1.25,r*.6);group.add(moon);}
  return makeBodyResult(group,t=>{sphere.rotation.y=t*.008;});
}
