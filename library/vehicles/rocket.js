// Rocket-local +Y is the nose. The engine owns the vehicle's heading and banking.
export function buildRocket(THREE){
  const rocket=new THREE.Group();
  const ceramic=new THREE.MeshStandardMaterial({color:0xd5d9d8,roughness:.36,metalness:.35});
  const titanium=new THREE.MeshStandardMaterial({color:0x84929c,roughness:.29,metalness:.78});
  const graphite=new THREE.MeshStandardMaterial({color:0x1b2631,roughness:.5,metalness:.5});
  const nozzleMaterial=new THREE.MeshStandardMaterial({color:0x515d67,roughness:.35,metalness:.82,side:THREE.DoubleSide});
  const glass=new THREE.MeshStandardMaterial({color:0x123248,roughness:.16,metalness:.75,emissive:0x061522,emissiveIntensity:.25});
  function part(geometry,material,y){const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;rocket.add(mesh);return mesh;}

  part(new THREE.CylinderGeometry(.33,.38,2.28,48),ceramic,-.02);
  const noseProfile=[];
  for(let i=0;i<=28;i++){const t=i/28;noseProfile.push(new THREE.Vector2(.33*Math.cos(t*Math.PI/2),t*.96));}
  part(new THREE.LatheGeometry(noseProfile,48),ceramic,1.12);
  part(new THREE.CylinderGeometry(.381,.31,.28,48),graphite,-1.30);
  // Narrow stage joints and service panels keep the silhouette clean.
  for(const [y,r] of [[-.83,.369],[.13,.349],[1.1,.334]])part(new THREE.CylinderGeometry(r,r,.028,48),titanium,y);
  part(new THREE.CylinderGeometry(.356,.356,.13,48),graphite,-.12);
  for(const side of [-1,1]){
    const panel=part(new THREE.BoxGeometry(.012,.7,.095),titanium,-.44);panel.position.set(side*.359,-.44,.02);
  }
  // Recessed observation windows on the dorsal surface.
  for(const y of [.43,.80]){
    const bezel=part(new THREE.SphereGeometry(.132,24,16),titanium,y);bezel.position.z=.316;bezel.scale.set(.83,1,.18);
    const window=part(new THREE.SphereGeometry(.105,24,16),glass,y);window.position.z=.338;window.scale.set(.83,1,.13);
  }
  // Four swept stabilizers, with dark heat-resistant trailing edges.
  for(let i=0;i<4;i++){
    const shape=new THREE.Shape();shape.moveTo(.34,-.54);shape.lineTo(.77,-1.23);shape.lineTo(.73,-1.53);shape.lineTo(.34,-1.17);shape.closePath();
    const fin=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.009,bevelThickness:.008}),ceramic);
    fin.rotation.y=i*Math.PI/2+Math.PI/4;rocket.add(fin);
    const tip=new THREE.Mesh(new THREE.BoxGeometry(.09,.18,.049),graphite);tip.position.set(.724,-1.32,.023);fin.add(tip);
  }

  const plumeMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){float t=vUv.y;float x=vUv.x-.5;float width=.025+.12*t;float core=exp(-pow(x/width,2.)*2.);float fade=pow(t,1.7)*(1.-smoothstep(.94,1.,t));float diamonds=.9+.1*cos(t*38.+uTime*2.);vec3 c=mix(vec3(.15,.38,.8),vec3(.72,.91,1.),t*t);gl_FragColor=vec4(c,core*fade*diamonds*.7);}`});
  const plumeGeometry=new THREE.PlaneGeometry(.65,2.15);
  const engineProfile=[[.065,.10],[.066,.015],[.085,-.095],[.125,-.22],[.145,-.29]].map(([r,y])=>new THREE.Vector2(r,y));
  const engineGeometry=new THREE.LatheGeometry(engineProfile,32);
  let plume;
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3,engine=new THREE.Group();engine.position.set(Math.cos(a)*.19,-1.47,Math.sin(a)*.19);
    engine.add(new THREE.Mesh(engineGeometry,nozzleMaterial));
    const throat=new THREE.Mesh(new THREE.CircleGeometry(.058,24),new THREE.MeshBasicMaterial({color:0x63849a}));throat.rotation.x=Math.PI/2;throat.position.y=.018;engine.add(throat);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(.145,.009,8,32),titanium);lip.rotation.x=Math.PI/2;lip.position.y=-.29;engine.add(lip);
    for(let j=0;j<2;j++){
      const exhaust=new THREE.Mesh(plumeGeometry,plumeMaterial);exhaust.position.y=-1.335;exhaust.rotation.y=j*Math.PI/2;engine.add(exhaust);plume??=exhaust;
    }
    rocket.add(engine);
  }
  const engineLight=new THREE.PointLight(0x8bc0ff,1.6,4.5);engineLight.position.y=-1.85;rocket.add(engineLight);
  const hullLight=new THREE.PointLight(0xb2d6ff,.9,3.5);hullLight.position.set(0,.3,1.2);rocket.add(hullLight);
  return {rocket,plume};
}
