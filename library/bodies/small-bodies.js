import {seeded} from '../../src/noise.js';
import {makeHalo,makeBodyResult} from './materials.js';

export function buildSmallBodies(THREE,noise,d){
  const group=new THREE.Group(),rng=seeded(d.seed);
  const geometry=new THREE.IcosahedronGeometry(1,1),material=new THREE.MeshStandardMaterial({color:0x817a70,roughness:1,flatShading:true});
  const count=d.kind===1?1:110,rocks=new THREE.InstancedMesh(geometry,material,count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const a=rng()*Math.PI*2,r=(.15+rng())*d.radius;dummy.position.set(count===1?0:Math.cos(a)*r,count===1?0:(rng()-.5)*d.radius*.6,count===1?0:Math.sin(a)*r);dummy.rotation.set(rng()*6,rng()*6,rng()*6);const s=count===1?4:1+rng()*3;dummy.scale.set(s,s*(.6+rng()*.7),s*(.6+rng()*.7));dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}group.add(rocks);
  if(d.kind===1){
    group.add(makeHalo(THREE,'#b3d5d5',35,.65));
    const tail=new THREE.Mesh(new THREE.PlaneGeometry(65,190),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 vUv;void main(){float t=vUv.y;float x=vUv.x-.5;float dust=exp(-pow((x-.18*(1.-t)*(1.-t))/(.025+(1.-t)*.24),2.)*2.)*pow(t,1.8);float ion=exp(-pow(x/.015,2.))*pow(t,.7);gl_FragColor=vec4(mix(vec3(.35,.6,1.),vec3(.78,.7,.52),dust),dust*.24+ion*.25);}`}));tail.position.set(0,-95,0);group.add(tail);group.rotation.z=-.85;
  }
  return makeBodyResult(group,t=>{rocks.rotation.y=t*.012;});
}
