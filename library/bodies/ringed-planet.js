// A ringed planet and its distant companion; placement motion belongs to the engine.
export function buildRingedPlanet(THREE,noise){
  const planetGroup=new THREE.Group();
  const planetMaterial=new THREE.ShaderMaterial({vertexShader:`varying vec3 vNormal,vPosition;void main(){vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vNormal,vPosition;${noise}
    void main(){vec3 n=normalize(vNormal);float light=dot(n,normalize(vec3(-.8,.5,1.)));float f=fbm(vPosition*2.4);float bands=sin(vPosition.y*22.+f*8.)*.5+.5;
    vec3 base=mix(vec3(.18,.28,.31),vec3(.48,.58,.56),f*.6+bands*.22);
    float baseLight=.16+pow(max(light,0.),1.5)*.84;
    vec3 col=base*baseLight;float rim=pow(1.-max(n.z,0.),3.0)*(smoothstep(-.4,.7,light)*.6+.4);
    col+=vec3(.32,.62,.74)*rim*.75;gl_FragColor=vec4(col,1.);}`
  });
  const planet=new THREE.Mesh(new THREE.SphereGeometry(3.3,72,48),planetMaterial);planetGroup.add(planet);
  const rings=new THREE.Mesh(new THREE.RingGeometry(4.05,6.1,160),new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,
    vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vPosition;void main(){float r=length(vPosition.xy);float bands=.45+.23*sin(r*77.)+.15*sin(r*161.);float edge=smoothstep(4.05,4.22,r)*(1.-smoothstep(5.7,6.1,r));float gap=.25+.75*smoothstep(.005,.025,abs(r-5.15));gl_FragColor=vec4(vec3(.55,.66,.68),edge*bands*gap*.62);}`
  }));rings.rotation.x=1.14;rings.rotation.y=.15;rings.rotation.z=-.3;planetGroup.rotation.z=-.32;planetGroup.add(rings);
  planetGroup.position.set(10,5,-22);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(.55,32,20),planetMaterial);moon.position.set(-13,-2,-35);

  return {planetGroup,planet,moon};
}
