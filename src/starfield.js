import {noise,seeded} from './noise.js';

export function createStarfield(THREE,scene,seed){
  const rng=seeded(seed^81293);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1900,40,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    uniforms:{uSeed:{value:seed%1000}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`${noise} varying vec3 vP;uniform float uSeed;
    void main(){
      vec3 p=normalize(vP);
      vec3 c=mix(vec3(.014,.020,.038),vec3(.024,.032,.052),p.y*.5+.5);
      float belt=p.y*.86+p.x*.42+.12;
      float n=fbm(p*4.2+uSeed);
      float detail=fbm(p*18.+n*2.);
      float band=exp(-pow((belt+n*.18)*3.6,2.));
      float n2=fbm(p*2.8+vec3(uSeed,4.2,1.7));
      float nebula=smoothstep(.30,.78,n2)*.42;
      vec3 nebCol=mix(vec3(.035,.055,.098),vec3(.078,.046,.092),n2);
      c+=nebCol*nebula;
      vec3 bandCol=mix(vec3(.068,.092,.148),vec3(.152,.122,.110),n);
      c+=bandCol*pow(n,1.2)*band*1.4;
      float dust=smoothstep(.38,.68,detail);
      c*=1.-dust*band*.42;
      c+=vec3(.042,.062,.098)*pow(detail,2.4)*band;
      gl_FragColor=vec4(c,1.);
    }`}));scene.add(sky);
  const count=7200,pos=new Float32Array(count*3),col=new Float32Array(count*3),sizes=new Float32Array(count);
  for(let i=0;i<count;i++){
    const a=rng()*Math.PI*2,z=rng()*2-1,r=Math.sqrt(1-z*z),distance=1600;
    pos.set([Math.cos(a)*r*distance,z*distance,Math.sin(a)*r*distance],i*3);
    const warm=rng()>.72,b=.52+rng()*.48;col.set(warm?[b,b*.88,b*.7]:[b*.78,b*.88,b],i*3);sizes[i]=rng()>.98?3.2:.65+rng()*1.35;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setAttribute('color',new THREE.BufferAttribute(col,3));geometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,
    uniforms:{uRatio:{value:1}},vertexShader:'attribute float size;varying vec3 vColor;uniform float uRatio;void main(){vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*uRatio;}',
    fragmentShader:'varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vColor,1.-smoothstep(0.,1.,d));}'});
  scene.add(new THREE.Points(geometry,material));
  const nearCount=340,near=new Float32Array(nearCount*3),origins=[];
  for(let i=0;i<nearCount;i++){origins.push([rng()*1000,rng()*1000,rng()*1000]);}
  const nearGeo=new THREE.BufferGeometry();nearGeo.setAttribute('position',new THREE.BufferAttribute(near,3));
  const dust=new THREE.Points(nearGeo,new THREE.PointsMaterial({color:0xa4c6e8,size:.32,transparent:true,opacity:.65,depthWrite:false}));scene.add(dust);
  return {update(position,ratio){material.uniforms.uRatio.value=ratio;for(let i=0;i<nearCount;i++){const p=origins[i];for(let axis=0;axis<3;axis++)near[i*3+axis]=((p[axis]-position[axis]+500)%1000+1000)%1000-500;}nearGeo.attributes.position.needsUpdate=true;},count:count+nearCount};
}
