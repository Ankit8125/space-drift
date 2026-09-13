import assert from 'node:assert/strict';
import {createFlight,validFlightSave} from '../src/flight.js';
import {nearbyObjects,sectorObject,WORLD_VISIBLE_LIMIT,solidBounds} from '../src/universe.js';
import {encounters} from '../library/catalog.js';

const original=createFlight();
const saved=original.snapshot();assert.ok(validFlightSave(saved));
const turned=createFlight();turned.steer(1,0);turned.step(4.1);
assert.ok(turned.forward[2]>.99,'Dragging must allow a full turn back through the world');
turned.release();const turnPosition=turned.position;turned.step(2);
assert.ok(turned.position[2]>turnPosition[2]+10,'Release must continue along the new heading');
assert.equal(turned.speed,5.5);assert.equal(turned.throttle,1);
const climb=createFlight();climb.steer(0,1);climb.step(2.1);
assert.ok(climb.forward[1]>.99,'Dragging upward must climb');
climb.step(4);assert.ok(climb.forward[1]<-.98,'Pitch must allow a complete loop');
climb.release();const resumed=createFlight(0,climb.snapshot());
assert.deepEqual(resumed.position,climb.position);assert.deepEqual(resumed.orientation,climb.orientation);
const drag60=createFlight(),drag30=createFlight();drag60.steer(.6,.3);drag30.steer(.6,.3);
for(let i=0;i<600;i++)drag60.step(1/60);
for(let i=0;i<300;i++)drag30.step(1/30);
assert.ok(Math.hypot(...drag60.position.map((v,i)=>v-drag30.position[i]))<.15);
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
const openingIds=[];
for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<3;z++)openingIds.push(sectorObject(x,y,z,123).id);
assert.equal(new Set(openingIds).size,encounters.length,'The familiar opening world must not displace a catalogue type');
// Each region in all eight octants gets the entire catalogue, including new systems.
for(const seed of [0,123,4294967295])for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){
  const ids=[];
  for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<3;z++)ids.push(sectorObject(sx*12+x,sy*12+y,sz*9+z,seed).id);
  assert.equal(ids.length,encounters.length);assert.equal(new Set(ids).size,encounters.length,'Every spatial block must contain all celestial types equally');
}
assert.deepEqual(launch.position,[launch.x,launch.y,launch.worldZ]);
assert.notDeepEqual(sectorObject(1,0,0,123),sectorObject(-1,0,0,123));
assert.equal(solidBounds(launch,0).length,2,'Moon surfaces also need a boundary');
const nursery=encounters.find(e=>e.id==='protoplanetary-disk');
assert.equal(solidBounds({...nursery,position:[0,0,0]},0)[0].radius,nursery.radius*.065,'Only the central star is solid, not the entire dust disk');
console.log('Autopilot checks passed: fixed 1x, old save migration, pause, frame rate, long cruise, automatic detours, and spatial streaming.');
