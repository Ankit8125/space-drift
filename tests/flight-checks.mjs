import assert from 'node:assert/strict';
import {createFlight,validFlightSave} from '../src/flight.js';
import {nearbyObjects,sectorObject,WORLD_VISIBLE_LIMIT,solidBounds} from '../src/universe.js';

const original=createFlight();
const saved=original.snapshot();assert.ok(validFlightSave(saved));
for(const throttle of [0,.5,3]){
  const restored=createFlight(0,{...saved,mode:'manual',throttle});
  assert.deepEqual(restored.position,original.position);
  assert.deepEqual(restored.orientation,original.orientation);
  assert.equal(restored.mode,'cruise','Old manual saves must resume on autopilot');
  assert.equal(restored.throttle,1);assert.equal(restored.speed,5.5);
  restored.step(10);assert.ok(Math.abs(restored.distance-55)<1e-8);
  assert.equal(restored.snapshot().throttle,1);assert.equal(restored.snapshot().mode,'cruise');
}
const slow=createFlight(),fast=createFlight();
for(let i=0;i<600;i++)slow.step(1/60);
for(let i=0;i<300;i++)fast.step(1/30);
assert.ok(Math.hypot(...slow.position.map((v,i)=>v-fast.position[i]))<.01);
const before=fast.snapshot();fast.step(0);assert.deepEqual(fast.snapshot(),before,'Paused redraw must not move the craft');
fast.step(3600);assert.equal(fast.speed,5.5);assert.ok(Math.abs(Math.hypot(...fast.orientation)-1)<1e-12);
assert.ok(!validFlightSave({...saved,orientation:[0,0,0,0]}));
assert.ok(!validFlightSave({...saved,position:[Infinity,0,0]}));
const detour=createFlight(),obstacle={position:[0,0,-150],radius:35};
for(let i=0;i<1800;i++){
  detour.step(1/30,[obstacle]);
  assert.ok(Math.hypot(...detour.position.map((v,j)=>v-obstacle.position[j]))>=42-1e-8);
}
assert.ok(detour.position[2]<-200,'Autopilot must pass a body without waiting for user steering');
assert.ok(Math.abs(detour.distance-330)<.1,'A detour must preserve the 1x cruise pace');

for(const point of [[0,0,0],[2000,3000,5000],[-2000,-3000,-5000],[1e8,-1e8,1e8]]){
  const objects=nearbyObjects(point,123);
  assert.ok(objects.length>0&&objects.length<=WORLD_VISIBLE_LIMIT);
  assert.deepEqual(objects,nearbyObjects(point,123),'Returning to the same coordinates must reproduce the same objects');
  assert.equal(new Set(objects.map(d=>d.key)).size,objects.length);
  assert.ok(objects.every(d=>d.distance<1000));
}
const launch=sectorObject(0,0,0,123);assert.equal(launch.id,'ocean-world');
assert.deepEqual(launch.position,[launch.x,launch.y,launch.worldZ]);
assert.notDeepEqual(sectorObject(1,0,0,123),sectorObject(-1,0,0,123));
assert.equal(solidBounds(launch,0).length,2,'Moon surfaces also need a boundary');
console.log('Autopilot checks passed: fixed 1x, old save migration, pause, frame rate, long cruise, automatic detours, and spatial streaming.');
