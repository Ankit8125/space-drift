import {noise} from './noise.js';
import {bodies} from '../library/index.js';
import {encounterAt,activeLegs,FLIGHT_SPEED,LEG_SECONDS} from './journey.js';

export function createScenery(THREE,scene,seed){
  const loaded=new Map();
  function load(index){
    const definition=encounterAt(index,seed),build=bodies[definition.family];
    if(!build)throw new Error(`Unknown encounter family: ${definition.family}`);
    const result=build(THREE,noise,definition);
    const billboards=[],fades=[],seenMaterials=new Set();
    result.group.traverse(o=>{
      if(o.userData.billboard)billboards.push(o);
      if(o.material&&!seenMaterials.has(o.material)){
        const m=o.material;
        seenMaterials.add(m);
        if(m.isShaderMaterial){m.uniforms.uFade={value:1};m.fragmentShader='uniform float uFade;\n'+m.fragmentShader.replace(/}\s*$/,'gl_FragColor.a *= uFade; if(gl_FragColor.a<0.001)discard; }');}
        fades.push({material:m,opacity:m.opacity});m.transparent=true;
      }
    });
    scene.add(result.group);loaded.set(index,{...result,definition,billboards,fades});
  }
  const inverse=new THREE.Quaternion();
  return {
    update(time,camera,route){
      const wanted=activeLegs(time);
      for(const [index,entry]of loaded)if(!wanted.includes(index)){scene.remove(entry.group);entry.dispose();loaded.delete(index);}
      for(const index of wanted)if(!loaded.has(index))load(index);
      for(const entry of loaded.values()){
        const d=entry.definition,z=d.worldZ+time*FLIGHT_SPEED;
        entry.group.position.set(d.x-route.x,d.y-route.y,z);entry.update(time);
        entry.group.updateMatrixWorld(true);
        for(const billboard of entry.billboards){billboard.parent.getWorldQuaternion(inverse).invert();billboard.quaternion.copy(inverse).multiply(camera.quaternion);}
        const fade=THREE.MathUtils.smoothstep(z,-1150,-880)*(1.-THREE.MathUtils.smoothstep(z,100,230));
        for(const f of entry.fades){if(f.material.isShaderMaterial)f.material.uniforms.uFade.value=fade;else f.material.opacity=f.opacity*fade;}
      }
    },
    current(time){return encounterAt(Math.floor(time/LEG_SECONDS),seed);},
    get count(){return loaded.size;},
    get ids(){return [...loaded.values()].map(e=>e.definition.id);}
  };
}
