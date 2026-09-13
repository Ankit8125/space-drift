import {makeBodyResult,makeRadiationJet} from './materials.js';

export function buildBlackHole(THREE,noise,d){
  const group=new THREE.Group();
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:true,
    uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(d.color)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`${noise} varying vec2 vUv;uniform float uTime;uniform vec3 uColor;
    void main(){vec2 p=(vUv-.5)*2.;p.y+=.015;float radius=length(p);float shadow=.205;
      float diskR=length(vec2(p.x,p.y*5.2));float angle=atan(p.y*5.2,p.x);
      float turbulence=noise3(vec3(diskR*39.,angle*6.+uTime*.07,1.));
      float disk=exp(-abs(p.y)*22.)*smoothstep(.235,.32,diskR)*(1.-smoothstep(.63,.98,diskR));
      disk*=.5+.5*turbulence;float doppler=1.+p.x*.85;
      float photon=exp(-pow((radius-.223)/.012,2.));
      float arcR=length(vec2(p.x,p.y*.88));float arc=exp(-pow((arcR-.31)/.043,2.))*smoothstep(-.07,.06,p.y);
      arc*=.55+.45*noise3(vec3(atan(p.y,p.x)*13.+uTime*.03,radius*80.,4.));
      float underside=exp(-pow((length(vec2(p.x,p.y*1.3))-.252)/.012,2.))*(1.-smoothstep(-.02,.04,p.y));
      float glow=exp(-pow((radius-.29)/.25,2.))*.11;
      float value=(disk*1.7+arc*.85+photon*.7+underside*.3)*doppler;
      vec3 col=mix(uColor,uColor*.65+vec3(.35),clamp(value,0.,1.))*value+uColor*glow;
      float mask=1.-smoothstep(shadow-.004,shadow+.004,radius);col*=1.-mask;
      float alpha=max(mask,clamp(value+glow,0.,1.));alpha*=1.-smoothstep(.85,1.,radius);
      if(alpha<.003)discard;gl_FragColor=vec4(col,alpha);}`});
  const disk=new THREE.Mesh(new THREE.PlaneGeometry(d.radius*7,d.radius*7),material);disk.userData.billboard=true;group.add(disk);
  if(d.jets){
    for(const sign of [-1,1]){
      group.add(makeRadiationJet(THREE,'#aecfff',d.radius,d.radius*8,sign));
    }
  }
  return makeBodyResult(group,t=>{material.uniforms.uTime.value=t;});
}
