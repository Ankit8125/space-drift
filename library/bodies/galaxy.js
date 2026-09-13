import {seeded} from '../../src/noise.js';
import {makeHalo,makeBodyResult} from './materials.js';

export function buildGalaxy(THREE,noise,d){
  const group=new THREE.Group(),random=seeded(d.seed),count=d.particles??(d.kind===3?1700:6500);
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count);
  const tint=new THREE.Color(d.color);
  for(let i=0;i<count;i++){
    let r=Math.pow(random(),.68)*d.radius,a=random()*Math.PI*2,y=(random()-.5)*d.radius*.065;
    const core=i<count*.22;
    if(d.kind===0||d.kind===1){a=(i%4)*Math.PI/2+r/d.radius*5.4+(random()-.5)*.65;if(core){r*=.25;y*=3;}}
    if(d.kind===2||d.kind===3){r=Math.pow(random(),1.6)*d.radius;y=(random()-.5)*r*1.5;}
    if(d.kind===4){a+=Math.sin(r*.3);y*=6;r*=.65+.35*Math.sin(a*3.);}
    if(d.kind===5&&core){r*=.25;y*=4;}
    let x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(d.kind===1&&core){x*=3;z*=.4;}
    positions.set([x,y,z],i*3);
    const b=.35+random()*.7;colors.set(core?[b,b*.82,b*.6]:[tint.r*b,tint.g*b,tint.b*b],i*3);sizes[i]=.6+random()*1.5;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
  const points=new THREE.Points(geometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    vertexShader:`attribute float size;varying vec3 vColor;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*420./-p.z,1.,5.);}`,
    fragmentShader:`varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vColor,exp(-d*d*4.)*.65);}`}));
  group.add(points);group.rotation.set(.65,0,.35);
  if(d.kind!==3){
    const disk=new THREE.Mesh(new THREE.PlaneGeometry(d.radius*2.3,d.radius*2.3),new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{uKind:{value:d.kind},uColor:{value:tint}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`${noise} varying vec2 vUv;uniform float uKind;uniform vec3 uColor;
      void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float a=atan(p.y,p.x);float grain=fbm(vec3(p*17.,4.));float arms=pow(.5+.5*cos(a*4.-r*20.+grain*2.),3.);float core=exp(-r*14.);float density=(arms*.48+.12)*exp(-r*3.5)*(1.-smoothstep(.65,1.,r));if(uKind==2.||uKind==5.)density=exp(-r*5.)*.65;if(uKind==4.)density*=grain*3.;vec3 c=mix(uColor,vec3(1.,.79,.48),exp(-r*8.));gl_FragColor=vec4(c,(density*(.6+grain*.7)+core*.65)*.72);}`}));disk.rotation.x=-Math.PI/2;group.add(disk);
  }
  if(d.kind!==3&&d.kind!==4){const glow=makeHalo(THREE,'#dfcba5',d.radius*1.15,.45);group.add(glow);}
  return makeBodyResult(group,t=>{points.rotation.y=t*.0006;});
}
