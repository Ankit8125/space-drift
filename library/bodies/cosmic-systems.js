import {seeded} from '../../src/noise.js';
import {makeHalo,makeBodyResult,bodyVertex} from './materials.js';
import {buildGalaxy} from './galaxy.js';

// Actual 3D dust and stars give these structures depth from either side.
function systemParticles(THREE,positions,colors,pointSize,opacity){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  return new THREE.Points(geometry,new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{uSize:{value:pointSize},uOpacity:{value:opacity}},
    vertexShader:'uniform float uSize;varying vec3 vColor;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(uSize*500./max(1.,-p.z),1.,5.);}',
    fragmentShader:'uniform float uOpacity;varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;float glow=exp(-r*r*5.)*(1.-smoothstep(.7,1.,r));gl_FragColor=vec4(vColor,glow*uOpacity);}'
  }));
}

export function buildNursery(THREE,noise,d){
  const group=new THREE.Group(),tilt=new THREE.Group(),r=d.radius,random=seeded(d.seed);
  group.add(tilt);tilt.rotation.set(.48+(d.seed%11)*.025,0,.3);
  const starRadius=r*.065;
  tilt.add(new THREE.Mesh(new THREE.SphereGeometry(starRadius,32,24),new THREE.MeshBasicMaterial({color:0xffe4bc})));
  tilt.add(makeHalo(THREE,'#ffe0ab',r*.8,1.3));
  const dustUniforms={uTime:{value:0},uSeed:{value:d.seed%997},uColor:{value:new THREE.Color(d.color)}};
  const diskMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:dustUniforms,
    vertexShader:'varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`${noise} varying vec3 vLocal;uniform float uTime,uSeed;uniform vec3 uColor;
    void main(){float r=length(vLocal.xy);float a=atan(vLocal.y,vLocal.x);float grain=fbm(vec3(vLocal.xy*19.,uSeed));
      float bands=.7+.3*sin(r*72.+grain*1.5);float gaps=1.-.91*exp(-pow((r-.43)/.028,2.));
      gaps*=1.-.88*exp(-pow((r-.68)/.037,2.));gaps*=1.-.7*exp(-pow((r-.84)/.016,2.));
      float spiral=.78+.22*sin(a*2.-r*13.+uTime*.002);float edge=smoothstep(.09,.15,r)*(1.-smoothstep(.87,1.,r));
      float density=(.33+.48*grain)*bands*gaps*edge*spiral;
      vec3 tint=mix(vec3(.28,.32,.39),uColor,exp(-r*1.2));tint+=vec3(.8,.36,.11)*exp(-r*8.);
      gl_FragColor=vec4(tint*(.7+grain*.7),density*.78);}`});
  const diskRadius=d.kind===1?r*.34:r;
  // Three shallow dust sheets plus a flared particle layer preserve an edge-on silhouette.
  const diskGeometry=new THREE.RingGeometry(.09,1,160,12);
  for(const layer of [-1,0,1]){
    const disk=new THREE.Mesh(diskGeometry,diskMaterial);disk.rotation.x=-Math.PI/2;
    disk.scale.setScalar(diskRadius);disk.position.y=layer*diskRadius*.017;tilt.add(disk);
  }
  const dust=[],dustColors=[];
  for(let i=0;i<2000;i++){
    const q=.13+random()*.85,a=random()*Math.PI*2;
    if(Math.abs(q-.43)<.025||Math.abs(q-.68)<.033||Math.abs(q-.84)<.014)continue;
    dust.push(Math.cos(a)*q*diskRadius,(random()-.5)*diskRadius*(.025+q*q*.09),Math.sin(a)*q*diskRadius);
    const light=.3+random()*.5;dustColors.push(light,light*.72,light*.49);
  }
  tilt.add(systemParticles(THREE,dust,dustColors,.8,.34));
  if(d.kind===1){
    const jetPositions=[],jetColors=[];
    for(const sign of [-1,1]){
      const jet=new THREE.Mesh(new THREE.CylinderGeometry(r*.07,r*.008,r*1.25,24,1,true),new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:bodyVertex,
        fragmentShader:'varying vec3 vP,vN,vWorld;void main(){float rim=1.-abs(dot(normalize(vN),normalize(cameraPosition-vWorld)));gl_FragColor=vec4(.48,.69,.83,.045+.06*rim);}'
      }));jet.position.y=sign*r*.72;if(sign<0)jet.rotation.z=Math.PI;tilt.add(jet);
      for(let knot=0;knot<4;knot++){
        const reach=r*(.33+knot*.3),width=r*(.055+knot*.029),profile=[];
        for(let i=0;i<=24;i++){const u=i/24;profile.push(new THREE.Vector2(width*u,-width*u*u*1.9));}
        const shell=new THREE.Mesh(new THREE.LatheGeometry(profile,64),new THREE.ShaderMaterial({
          transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
          uniforms:{uColor:{value:new THREE.Color(knot%2?'#b4cddd':'#dfa07b')},uSeed:{value:knot+d.seed%997}},vertexShader:bodyVertex,
          fragmentShader:`${noise} varying vec3 vP,vN,vWorld;uniform vec3 uColor;uniform float uSeed;
          void main(){float texture=fbm(vP*1.7+uSeed);float limb=pow(1.-abs(dot(normalize(vN),normalize(cameraPosition-vWorld))),1.7);gl_FragColor=vec4(uColor,(.035+limb*.3)*(.4+texture*.8));}`
        }));shell.position.y=sign*reach;if(sign<0)shell.rotation.z=Math.PI;tilt.add(shell);
      }
      for(let i=0;i<900;i++){
        const u=random(),angle=random()*Math.PI*2,width=r*(.007+u*.05)*Math.sqrt(random());
        jetPositions.push(Math.cos(angle)*width,sign*r*(.12+u*1.25),Math.sin(angle)*width);
        const light=.45+random()*.4;jetColors.push(light*.75,light*.83,light);
      }
    }
    tilt.add(systemParticles(THREE,jetPositions,jetColors,.7,.35));
  }
  return makeBodyResult(group,t=>{dustUniforms.uTime.value=t;});
}

export function buildGalaxyAssembly(THREE,noise,d){
  const group=new THREE.Group(),random=seeded(d.seed),parts=[];
  function member(radius,kind,position,rotation,particles){
    const galaxy=buildGalaxy(THREE,noise,{...d,radius,kind,particles,seed:Math.floor(random()*4294967295),color:kind===2?'#e0c39a':'#91b8df'});
    galaxy.group.position.set(...position);galaxy.group.rotation.set(...rotation);group.add(galaxy.group);parts.push(galaxy);
  }
  if(d.kind===0){
    member(d.radius*.43,0,[-d.radius*.28,0,0],[.65,.2,.2],3600);
    member(d.radius*.29,1,[d.radius*.35,d.radius*.16,-d.radius*.12],[1.15,.4,-.5],2600);
    const tails=[],colors=[];
    for(let i=0;i<3400;i++){
      const arm=i%2,u=random(),angle=u*2.8+(arm?Math.PI:0),radius=d.radius*(.28+u*.83);
      const scatter=(.025+u*.018)*d.radius;
      tails.push(Math.cos(angle)*radius+(random()-.5)*scatter,(Math.sin(u*3.+arm)*.17+(random()-.5)*.035)*d.radius,Math.sin(angle)*radius*.52+(random()-.5)*scatter);
      const light=.38+random()*.55;colors.push(light*.8,light*.85,light);
    }
    group.add(systemParticles(THREE,tails,colors,.8,.5));
    const envelope=makeHalo(THREE,'#819bb7',d.radius*2.7,.16);group.add(envelope);
  }else{
    member(d.radius*.21,2,[0,0,0],[.7,0,.15],1600);
    // A golden-angle distribution prevents accidental stacks of satellite galaxies.
    for(let i=0;i<13;i++){
      const angle=i*2.399963,radial=d.radius*Math.sqrt((i+1)/14);
      member(d.radius*(.055+random()*.06),i%3?2:0,
        [Math.cos(angle)*radial,Math.sin(angle)*radial*.7,(random()-.5)*d.radius*1.2],
        [random()*Math.PI,random()*Math.PI,random()*Math.PI],450);
    }
    group.add(makeHalo(THREE,'#a7b4c4',d.radius*2.8,.15));
  }
  return makeBodyResult(group,t=>{for(const part of parts)part.update(t);});
}
