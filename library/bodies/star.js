import {bodyVertex,makeHalo,makeBodyResult,makeRadiationJet} from './materials.js';

export function buildStar(THREE,noise,d){
  const group=new THREE.Group(),r=d.radius,compact=d.family==='compact';
  const uniforms={uColor:{value:new THREE.Color(d.color)},uTime:{value:0},uDim:{value:d.dim?.24:1}};
  const material=new THREE.ShaderMaterial({uniforms,vertexShader:bodyVertex,
    fragmentShader:`${noise} varying vec3 vP,vN,vWorld;uniform vec3 uColor;uniform float uTime,uDim;
    void main(){vec3 p=normalize(vP);float n=fbm(p*12.+vec3(uTime*.024));float granules=noise3(p*140.+n*3.);float spots=smoothstep(.68,.78,fbm(p*7.+uTime*.004));float limb=pow(max(dot(normalize(vN),normalize(cameraPosition-vWorld)),0.),.32);vec3 col=uColor*(.68+granules*.4+n*.35)*(1.-spots*.75)*(.25+.75*limb)*uDim;gl_FragColor=vec4(col,1.);}`});
  const star=new THREE.Mesh(new THREE.SphereGeometry(r,64,48),material);group.add(star);
  group.add(makeHalo(THREE,d.color,r*(d.wind?9:7),d.dim?.4:1.35));
  const corona=new THREE.Mesh(new THREE.SphereGeometry(r*1.04,48,32),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,uniforms,vertexShader:bodyVertex,
    fragmentShader:`varying vec3 vP,vN,vWorld;uniform vec3 uColor;void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(cameraPosition-vWorld))),2.5);gl_FragColor=vec4(uColor,rim*.8);}`}));group.add(corona);
  const spin=new THREE.Group();group.add(spin);spin.rotation.z=.55;
  if(d.jets||d.magnetic){
    for(const sign of [-1,1]){
      spin.add(makeRadiationJet(THREE,d.color,r,r*10,sign));
    }
  }
  if(d.magnetic){
    // Faint illustrative magnetospheric emission arcs, not literal visible field lines.
    for(let i=0;i<7;i++){
      const points=[];for(let j=0;j<=96;j++){const a=j/96*Math.PI;const radius=r*(1+3.2*Math.sin(a)**2);points.push(new THREE.Vector3(radius*Math.sin(a),radius*Math.cos(a),0));}
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x668ddd,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false}));line.rotation.y=i*Math.PI*2/7;spin.add(line);
    }
  }
  let companion;
  if(d.binary){companion=new THREE.Mesh(new THREE.SphereGeometry(r*.68,40,28),material);companion.add(makeHalo(THREE,'#bbd7ff',r*5,.8));group.add(companion);}
  return makeBodyResult(group,t=>{uniforms.uTime.value=t;star.rotation.y=t*(compact?.035:.008);spin.rotation.y=t*.22;if(companion)companion.position.set(Math.cos(t*.009)*r*2.8,Math.sin(t*.009)*r*.7,Math.sin(t*.009)*r*1.5);});
}
