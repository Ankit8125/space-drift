import {noise} from './noise.js';
import {bodies} from '../library/index.js';
import {nearbyObjects,solidBounds,WORLD_RESOURCE_LIMIT} from './universe.js';

export function createScenery(THREE,scene,seed){
  const loaded=new Map();
  let nearest=null,lastQuery=null,queryAge=Infinity,wanted=[];
  function load(definition,initial){
    const build=bodies[definition.family];
    if(!build)throw new Error(`Unknown encounter family: ${definition.family}`);
    const result=build(THREE,noise,definition);
    const billboards=[],fades=[],seenMaterials=new Set();
    result.group.traverse(o=>{
      if(o.userData.billboard)billboards.push(o);
      if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(!seenMaterials.has(m)){
        seenMaterials.add(m);
        if(m.isShaderMaterial){m.uniforms.uFade={value:1};m.fragmentShader='uniform float uFade;\n'+m.fragmentShader.replace(/}\s*$/,'gl_FragColor.a *= uFade; if(gl_FragColor.a<0.001)discard; }');}
        fades.push({material:m,opacity:m.opacity});m.transparent=true;
      }
    });
    scene.add(result.group);loaded.set(definition.key,{...result,definition,billboards,fades,fade:initial?1:0});
  }
  function remove(key,entry){scene.remove(entry.group);entry.dispose();loaded.delete(key);}
  const inverse=new THREE.Quaternion();
  return {
    update(time,camera,position,dt=0){
      queryAge+=dt;
      if(!lastQuery||queryAge>.45||Math.hypot(...position.map((v,i)=>v-lastQuery[i]))>30){
        wanted=nearbyObjects(position,seed);nearest=wanted[0]||null;queryAge=0;lastQuery=[...position];
      }
      const keys=new Set(wanted.map(d=>d.key)),initial=loaded.size===0;
      for(const [key,entry]of loaded){
        if(!keys.has(key)){entry.fade=Math.max(0,entry.fade-dt*.65);if(entry.fade===0)remove(key,entry);}
      }
      for(const d of wanted)if(!loaded.has(d.key)){
        if(loaded.size>=WORLD_RESOURCE_LIMIT){const old=[...loaded].filter(([key])=>!keys.has(key)).sort((a,b)=>a[1].fade-b[1].fade)[0];if(old)remove(...old);}
        load(d,initial);
      }
      for(const [key,entry]of loaded){
        const d=entry.definition;
        entry.group.position.set(...d.position.map((v,i)=>v-position[i]));entry.update(time);
        entry.group.updateMatrixWorld(true);
        for(const billboard of entry.billboards){billboard.parent.getWorldQuaternion(inverse).invert();billboard.quaternion.copy(inverse).multiply(camera.quaternion);}
        if(keys.has(key))entry.fade=Math.min(1,entry.fade+dt*.4);
        const distance=entry.group.position.length();
        const fade=entry.fade*(1-THREE.MathUtils.smoothstep(distance,720,1000));
        for(const f of entry.fades){if(f.material.isShaderMaterial)f.material.uniforms.uFade.value=fade;else f.material.opacity=f.opacity*fade;}
      }
    },
    current(){return nearest;},
    obstacles(time){return [...loaded.values()].flatMap(e=>solidBounds(e.definition,time));},
    get count(){return loaded.size;},
    get ids(){return [...loaded.values()].map(e=>e.definition.id);},
    get locations(){return [...loaded.values()].map(e=>({key:e.definition.key,id:e.definition.id,position:e.definition.position,relative:e.group.position.toArray()}));}
  };
}
