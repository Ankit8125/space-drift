// Shared shader vocabulary for original, procedural celestial materials.
export const bodyVertex = `varying vec3 vP; varying vec3 vN; varying vec3 vWorld;
void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

export function makeHalo(THREE,color,size,strength=1){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uColor:{value:new THREE.Color(color)},uStrength:{value:strength}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform vec3 uColor;uniform float uStrength;void main(){float d=length(vUv-.5)*2.;float a=exp(-d*d*8.)*.27+exp(-d*9.)*.5;a*=1.-smoothstep(.6,1.,d);gl_FragColor=vec4(uColor,a*uStrength);}`});
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(size,size),material);
  halo.userData.billboard=true;return halo;
}

export function makeBodyResult(group,update=()=>{}){
  return {group,update,dispose(){
    const geometries=new Set(),materials=new Set();
    group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))materials.add(m);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }};
}

export function makeRadiationJet(THREE,color,radius,length,sign){
  const group=new THREE.Group();
  const geometry=new THREE.PlaneGeometry(radius*3,length);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uColor:{value:new THREE.Color(color)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform vec3 uColor;void main(){float t=vUv.y;float width=.014+t*.16;float beam=exp(-pow((vUv.x-.5)/width,2.)*2.);float a=beam*pow(1.-t,1.5)*smoothstep(0.,.08,t);gl_FragColor=vec4(uColor,a*.17);}`});
  const first=new THREE.Mesh(geometry,material),second=new THREE.Mesh(geometry,material);second.rotation.y=Math.PI/2;group.add(first,second);
  group.position.y=sign*(radius+length*.5);if(sign<0)group.rotation.z=Math.PI;
  return group;
}
