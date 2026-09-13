import * as THREE from 'three';
import {vehicles} from '../library/index.js';
import {createStarfield} from './starfield.js';
import {createScenery} from './scenery.js';
import {cameraPose,flightPath,FLIGHT_SPEED,LEG_SECONDS} from './journey.js';

export function createSpace(canvas,seed,savedTime=0){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setClearColor(0x02040a);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(48,1,.1,2400);
  let width=1,height=1,time=savedTime,journey=0,lastManual=-Infinity,manualPose=null;
  const aim={x:0,y:0},view={x:0,y:0},zoom={target:16,current:16};
  const stars=createStarfield(THREE,scene,seed);
  const scenery=createScenery(THREE,scene,seed);
  const {rocket,plume}=vehicles.rocket(THREE);
  const anchor=new THREE.Group();anchor.add(rocket);scene.add(anchor);
  rocket.rotation.set(-Math.PI/2,0,0);rocket.scale.setScalar(.92);
  scene.add(new THREE.HemisphereLight(0xb5d4ed,0x0a101a,.65));
  const sunlight=new THREE.DirectionalLight(0xffefd5,3.2);sunlight.position.set(-80,45,100);scene.add(sunlight);
  const fill=new THREE.DirectionalLight(0x668cbb,.8);fill.position.set(35,-10,-20);scene.add(fill);
  const desired=new THREE.Vector3(),look=new THREE.Vector3();
  const forwardAxis=new THREE.Vector3(0,0,-1),heading=new THREE.Vector3(),roll=new THREE.Quaternion();
  let rendered=false;

  function resize(){
    width=canvas.clientWidth;height=canvas.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(2100000/(width*height))));
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width<700?62:48;camera.updateProjectionMatrix();rendered=false;
  }
  function render(dt=0,started=false){
    time+=dt;
    const route=flightPath(time);
    journey=THREE.MathUtils.damp(journey,started?1:0,.5,dt);
    view.x=THREE.MathUtils.damp(view.x,aim.x,2,dt);view.y=THREE.MathUtils.damp(view.y,aim.y,2,dt);
    zoom.current=THREE.MathUtils.damp(zoom.current,zoom.target,3,dt);
    let pose=cameraPose(time);
    if(manualPose){
      const release=THREE.MathUtils.smoothstep(time-lastManual,75,100);
      pose=manualPose.map((v,i)=>v+(pose[i]-v)*release);
      if(release===1)manualPose=null;
    }
    const mobile=width<700;
    desired.set(pose[0]*(mobile?.62:1)+view.x-route.vx*2.6,pose[1]+view.y,pose[2]*zoom.current/16);
    // The welcome frame is the same physical scene, framed a little wider.
    desired.x-=1*(1-journey);
    desired.z+=mobile?4:0;
    if(!rendered)camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-dt*1.8));
    look.set(view.x*.25+route.vx*6,1+view.y*.3+route.vy*6,-48);
    camera.lookAt(look);
    anchor.position.set(0,-1.3,0);
    heading.fromArray(route.forward);
    anchor.quaternion.setFromUnitVectors(forwardAxis,heading);
    anchor.quaternion.multiply(roll.setFromAxisAngle(forwardAxis,route.bank));
    // The nose follows the path tangent; exhaust stays attached in vehicle space.
    plume.material.uniforms.uTime.value=time;
    stars.update(time*FLIGHT_SPEED,renderer.getPixelRatio(),route);
    scenery.update(time,camera,route);
    renderer.render(scene,camera);rendered=true;
  }
  resize();render();
  return {
    resize,render,aim,zoom,
    manualCamera(){manualPose=cameraPose(time);lastManual=time;},
    get time(){return time;},
    get encounter(){return scenery.current(time);},
    get stats(){const route=flightPath(time);return {drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,stars:stars.count,activeEncounters:scenery.count,encounters:scenery.ids,leg:Math.floor(time/LEG_SECONDS),distance:time*FLIGHT_SPEED,camera:camera.position.toArray(),forward:route.forward,course:[route.x,route.y,-time*FLIGHT_SPEED],bank:route.bank};}
  };
}
