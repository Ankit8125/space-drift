import assert from 'node:assert/strict';
import {createFlight,flightRotate,validFlightSave} from '../src/flight.js';
import {nearbyObjects,sectorObject,WORLD_VISIBLE_LIMIT,solidBounds} from '../src/universe.js';

function pilot(){const f=createFlight();f.setMode('manual');return f;}
const a=pilot();a.input.yaw=1;a.step(4.1);a.clear();
assert.ok(a.forward[2]>.99,'A half turn must face back through the world');
const before=a.position;a.step(2);
assert.ok(a.position[2]>before[2]+10,'Turned ship must travel back along world Z');
const heading=a.forward;a.step(2);assert.deepEqual(a.forward,heading,'Release must retain the new heading');

const vertical=pilot();vertical.input.pitch=1;vertical.step(2.1);
assert.ok(vertical.forward[1]>.99,'The ship must climb without a pitch clamp');
vertical.step(4);assert.ok(vertical.forward[1]<-.98,'The ship must loop over and dive');
vertical.step(20);assert.ok(Math.abs(Math.hypot(...vertical.orientation)-1)<1e-12);

const roll=pilot();roll.input.roll=1;roll.step(4.1);
assert.ok(flightRotate(roll.orientation,[0,1,0])[1]<-.99,'Roll must work beyond 180 degrees');
assert.ok(Math.abs(roll.forward[2]+1)<1e-12,'Rolling must not change the nose direction');

const slow=pilot(),fast=pilot();slow.input.yaw=fast.input.yaw=.6;slow.input.pitch=fast.input.pitch=.3;
for(let i=0;i<600;i++)slow.step(1/60);
for(let i=0;i<300;i++)fast.step(1/30);
assert.ok(Math.hypot(...slow.position.map((v,i)=>v-fast.position[i]))<.15,'Steering should not depend on frame rate');
const stationary=pilot();stationary.throttle=0;stationary.step(8);const start=stationary.position;stationary.input.yaw=1;stationary.step(4);
assert.ok(Math.hypot(...stationary.position.map((v,i)=>v-start[i]))<.001,'Zero throttle should allow turning in place');

const collision=pilot();const obstacle={position:[0,0,-40],radius:10};collision.step(12,[obstacle]);
assert.ok(collision.blocked);assert.ok(Math.hypot(...collision.position.map((v,i)=>v-obstacle.position[i]))>=17-1e-8,'Ship must remain outside solid surfaces');
collision.input.yaw=1;collision.step(4.1,[obstacle]);collision.clear();collision.step(5,[obstacle]);
assert.ok(collision.position[2]>-10,'Pilot must be able to turn away after reaching a surface');

const saved=a.snapshot();assert.ok(validFlightSave(saved));
const restored=createFlight(0,JSON.parse(JSON.stringify(saved)));
assert.deepEqual(restored.position,a.position);assert.deepEqual(restored.orientation,a.orientation);
const oldPosition=restored.position,oldOrientation=restored.orientation;restored.setMode('cruise');
assert.deepEqual(restored.position,oldPosition);assert.deepEqual(restored.orientation,oldOrientation,'Autopilot must never teleport or reorient the craft');
assert.ok(!validFlightSave({...saved,orientation:[0,0,0,0]}));
assert.ok(!validFlightSave({...saved,position:[Infinity,0,0]}));

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
console.log('3D flight checks passed: reverse travel, vertical loops, roll, coast, throttle, frame rate, surface boundaries, save/restore, and deterministic spatial streaming.');
