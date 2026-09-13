import {makeHalo,makeBodyResult} from './materials.js';

export function buildNebula(THREE,noise,d){
  const group=new THREE.Group();
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{uTime:{value:0},uSeed:{value:d.seed%1000},uKind:{value:d.kind},uColor:{value:new THREE.Color(d.color)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`${noise} varying vec2 vUv;uniform float uTime,uSeed,uKind;uniform vec3 uColor;
    void main(){vec2 uv=(vUv-.5)*2.;vec3 color=vec3(0.);float alpha=0.;
      for(int i=0;i<16;i++){float z=-1.+float(i)/8.;vec3 p=vec3(uv,z);float r=length(p);float edge=1.-smoothstep(.6,1.1,r);float n=noise3(p*4.+uSeed);float detail=noise3(p*13.+n*3.);float density=smoothstep(.36,.8,n*.65+detail*.35)*edge*.2;
        if(uKind>2.5){float shell=exp(-pow((r-.62)/.14,2.));density*=shell*2.3;}
        vec3 c=mix(uColor,vec3(.26,.46,.62),smoothstep(.25,.75,detail))*(.55+n*.7);
        if(uKind>1.5&&uKind<2.5){c=vec3(.006,.008,.014);density*=3.;}
        color+=(1.-alpha)*density*c;alpha+=(1.-alpha)*density;
      }
      gl_FragColor=vec4(color/max(alpha,.001),alpha);}`});
  const cloud=new THREE.Mesh(new THREE.PlaneGeometry(d.radius*3.2,d.radius*3.2),material);cloud.userData.billboard=true;group.add(cloud);
  if(d.kind===3||d.kind===4){group.add(makeHalo(THREE,'#d7e7ff',d.radius*.15,2));}
  return makeBodyResult(group,t=>{material.uniforms.uTime.value=t;});
}
