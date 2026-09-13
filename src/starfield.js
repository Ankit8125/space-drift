import {noise,seeded} from './noise.js';

export function createStarfield(THREE,scene,seed){
  const rng=seeded(seed^81293);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1900,40,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    uniforms:{uSeed:{value:seed%1000}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`${noise} varying vec3 vP;uniform float uSeed;
    void main(){vec3 p=normalize(vP);float belt=p.y*.86+p.x*.42+.12;float n=fbm(p*5.+uSeed);float detail=fbm(p*23.+n*2.);float band=exp(-pow((belt+n*.17)*5.,2.));float dust=smoothstep(.4,.66,detail);vec3 c=vec3(.002,.004,.009);c+=mix(vec3(.043,.052,.082),vec3(.105,.095,.092),n)*pow(n,1.4)*band;c*=1.-dust*band*.76;c+=vec3(.025,.033,.047)*pow(detail,3.)*band;gl_FragColor=vec4(c,1.);}`}));scene.add(sky);
  const count=7200,pos=new Float32Array(count*3),col=new Float32Array(count*3),sizes=new Float32Array(count);
  for(let i=0;i<count;i++){
    const a=rng()*Math.PI*2,z=rng()*2-1,r=Math.sqrt(1-z*z),distance=1600;
    pos.set([Math.cos(a)*r*distance,z*distance,Math.sin(a)*r*distance],i*3);
    const warm=rng()>.72,b=.35+rng()*.6;col.set(warm?[b,b*.84,b*.65]:[b*.74,b*.85,b],i*3);sizes[i]=rng()>.985?2.7:.45+rng()*1.1;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setAttribute('color',new THREE.BufferAttribute(col,3));geometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,
    uniforms:{uRatio:{value:1}},vertexShader:'attribute float size;varying vec3 vColor;uniform float uRatio;void main(){vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*uRatio;}',
    fragmentShader:'varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vColor,1.-smoothstep(0.,1.,d));}'});
  scene.add(new THREE.Points(geometry,material));
  const nearCount=340,near=new Float32Array(nearCount*3),origins=[];
  for(let i=0;i<nearCount;i++){origins.push({x:(rng()-.5)*600,y:(rng()-.5)*400,z:rng()*1400});}
  const nearGeo=new THREE.BufferGeometry();nearGeo.setAttribute('position',new THREE.BufferAttribute(near,3));
  const dust=new THREE.Points(nearGeo,new THREE.PointsMaterial({color:0x82929e,size:.18,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);
  return {update(distance,ratio,route){material.uniforms.uRatio.value=ratio;for(let i=0;i<nearCount;i++){const p=origins[i];near.set([p.x-route.x,p.y-route.y,((p.z+distance)%1400)-1300],i*3);}nearGeo.attributes.position.needsUpdate=true;},count:count+nearCount};
}
