import assert from 'node:assert/strict';
import {encounterAt,activeLegs,cameraPose,flightPath,FLIGHT_SPEED,LEG_SECONDS} from '../src/journey.js';
import {encounters} from '../library/catalog.js';

assert.equal(new Set(encounters.map(e=>e.id)).size,encounters.length,'Encounter IDs must be unique');
for(const required of ['sun','neutron-star','magnetar','stellar-black-hole','supermassive-black-hole','spiral-galaxy'])assert.ok(encounters.some(e=>e.id===required));
for(const seed of [0,123,4294967295]){
  for(const cycle of [0,1,25,10000]){
    const seen=new Set();
    for(let i=0;i<encounters.length;i++){
      const index=cycle*encounters.length+i,e=encounterAt(index,seed);
      seen.add(e.id);assert.deepEqual(e,encounterAt(index,seed),'Reload must reproduce a given encounter');
      if(!['galaxy','cloud','field'].includes(e.family))assert.ok(Math.abs(e.x)-14>e.radius+5,'The whole curved flight corridor must clear each compact or solid primary body');
      assert.ok(encounterAt(index+1,seed).worldZ<e.worldZ,'All encounters lie forward along the route');
    }
    assert.equal(seen.size,encounters.length,'Every complete cycle must contain the full catalogue');
  }
}
for(const time of [0,84.999,85,99999,1e9]){
  const legs=activeLegs(time);assert.ok(legs.length<=4);assert.ok(legs.every(i=>i>=0));
  const i=Math.floor(time/LEG_SECONDS),object=encounterAt(i,123);
  const relativeBefore=object.worldZ+time*FLIGHT_SPEED;
  assert.ok(object.worldZ+(time+1)*FLIGHT_SPEED>relativeBefore,'Scenery must pass toward and behind the camera');
}
for(let t=0;t<1200;t+=.25){
  const a=cameraPose(t),b=cameraPose(t+.01);
  assert.ok(Math.hypot(...a.map((v,i)=>b[i]-v))<.025,'Director must never cut abruptly');
}
assert.deepEqual(cameraPose(50),cameraPose(150),'Camera must hold its framing between transitions');
let left=false,right=false;
for(let t=0;t<1200;t+=.2){
  const path=flightPath(t),next=flightPath(t+.001);
  left||=path.vx<-.2;right||=path.vx>.2;
  assert.ok(Math.abs(path.x)<=14&&Math.abs(path.y)<=.65,'Course must stay in its safe corridor');
  assert.ok(path.forward[2]<-.98,'The rocket must keep making forward progress');
  assert.ok(Math.abs((next.x-path.x)/.001-path.vx)<.001,'Heading must follow actual lateral travel');
  assert.ok(Math.abs(next.bank-path.bank)<.001,'Banking must not snap');
}
assert.ok(left&&right,'The journey must turn both left and right');
console.log(`Journey checks passed: ${encounters.length} types, deterministic infinite cycles, bounded streaming, curved-route clearance, forward travel, and smooth camera transitions.`);
