import * as THREE from 'three';
import {vehicles} from '../library/index.js';
import {createStarfield} from './starfield.js';
import {createScenery} from './scenery.js';
import {cameraPose,LEG_SECONDS} from './journey.js';
import {createFlight} from './flight.js';

export function createSpace(canvas,seed,savedTime=0,savedFlight){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setClearColor(0x070e1c);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1,.1,2400);
  let width=1,height=1,time=savedTime,journey=0,cockpit=false,rendered=false;
  const zoom={target:16,current:16},flight=createFlight(savedTime,savedFlight);
  const stars=createStarfield(THREE,scene,seed),scenery=createScenery(THREE,scene,seed);
  const {rocket,plume}=vehicles.rocket(THREE);
  const anchor=new THREE.Group();anchor.add(rocket);scene.add(anchor);
  rocket.rotation.set(-Math.PI/2,0,0);rocket.scale.setScalar(.92);
  scene.add(new THREE.HemisphereLight(0xc2e2ff,0x152233,1.1));
  const sunlight=new THREE.DirectionalLight(0xfff4e2,3.6);sunlight.position.set(-80,45,100);scene.add(sunlight);
  const fill=new THREE.DirectionalLight(0x7ba4d6,1.4);fill.position.set(40,-10,-20);scene.add(fill);
  const backRim=new THREE.DirectionalLight(0x8bb6ff,1.0);backRim.position.set(0,30,-120);scene.add(backRim);
  const desired=new THREE.Vector3(),look=new THREE.Vector3(),up=new THREE.Vector3(),boomDirection=new THREE.Vector3(),viewRotation=new THREE.Quaternion();
  const cameraOffset=new THREE.Vector3(-7.2,4.2,19),targetOffset=new THREE.Vector3();
  function resize(){
    width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(2100000/(width*height))));
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width<700?62:48;camera.updateProjectionMatrix();rendered=false;
  }
  function render(dt=0,started=false){
    const obstacles=scenery.obstacles(time);
    flight.step(dt,obstacles);time+=dt;
    const position=flight.position;
    journey=THREE.MathUtils.damp(journey,started?1:0,.5,dt);
    zoom.current=THREE.MathUtils.damp(zoom.current,zoom.target,3,dt);
    anchor.quaternion.fromArray(flight.orientation);
    // Keep the ship at the render origin; translate the persistent world around it.
    anchor.position.set(0,0,0);anchor.visible=!cockpit;
    viewRotation.copy(anchor.quaternion);
    const pose=flight.mode==='cruise'?cameraPose(time):[0,3.2,18];
    targetOffset.set(pose[0]*(width<700?.62:1)-(1-journey),pose[1],pose[2]*zoom.current/16+(width<700?4:0));
    cameraOffset.lerp(targetOffset,rendered?1-Math.exp(-dt*2):1);
    if(cockpit){desired.set(0,.4,-5);look.set(0,.4,-50);}else{desired.copy(cameraOffset);look.set(0,.6,-32);}
    desired.applyQuaternion(viewRotation);look.applyQuaternion(viewRotation);
    // Shorten the chase boom if a solid world lies between it and the ship.
    const boomLength=desired.length(),direction=boomDirection.copy(desired).normalize();
    let clearLength=boomLength;
    for(const body of obstacles){
      const center=body.position.map((v,i)=>v-position[i]),along=direction.x*center[0]+direction.y*center[1]+direction.z*center[2];
      const discriminant=along*along-(center.reduce((sum,v)=>sum+v*v,0)-(body.radius+2)**2);
      if(discriminant>=0){const hit=along-Math.sqrt(discriminant);if(hit>0)clearLength=Math.min(clearLength,Math.max(.5,hit-1));}
    }
    desired.multiplyScalar(clearLength/boomLength);if(clearLength<6)anchor.visible=false;
    // Rotate the chase camera with the craft so a full loop or roll never hits a world-up pole.
    camera.position.copy(desired);up.set(0,1,0).applyQuaternion(viewRotation);camera.up.copy(up);camera.lookAt(look);
    plume.material.uniforms.uTime.value=time;
    stars.update(position,renderer.getPixelRatio());scenery.update(time,camera,position,dt);
    renderer.render(scene,camera);rendered=true;
  }
  resize();render();
  return {
    resize,render,zoom,flight,
    toggleView(){cockpit=!cockpit;return cockpit;},
    get time(){return time;},get encounter(){return scenery.current();},
    get stats(){return {drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,stars:stars.count,activeEncounters:scenery.count,encounters:scenery.ids,objects:scenery.locations,leg:Math.floor(time/LEG_SECONDS),distance:flight.distance,camera:camera.position.toArray(),forward:flight.forward,course:flight.position,orientation:flight.orientation,mode:flight.mode,speed:flight.speed,throttle:flight.throttle,blocked:flight.blocked,cockpit};}
  };
}
