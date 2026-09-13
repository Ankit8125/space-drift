import {seeded} from './noise.js';
import {encounters} from '../library/catalog.js';

export const LEG_SECONDS = 85;
export const FLIGHT_SPEED = 5.5;
export const LEG_DISTANCE = LEG_SECONDS * FLIGHT_SPEED;

// A bounded, smooth course through the clear corridor between encounters.
// Position, velocity and curvature share one analytic path, including on resume.
export function flightPath(time){
  const x=10*Math.sin(time*.045)+4*Math.sin(time*.085);
  const y=.65*Math.sin(time*.026);
  const vx=.45*Math.cos(time*.045)+.34*Math.cos(time*.085);
  const vy=.0169*Math.cos(time*.026);
  const ax=-.02025*Math.sin(time*.045)-.0289*Math.sin(time*.085);
  const speed=Math.hypot(vx,vy,FLIGHT_SPEED);
  return {x,y,vx,vy,bank:-ax*3,forward:[vx/speed,vy/speed,-FLIGHT_SPEED/speed]};
}

// Addressable infinite route. No growing itinerary and no huge GPU coordinates.
export function encounterAt(index,seed){
  const cycle=Math.floor(index/encounters.length);
  const offset=((index%encounters.length)+encounters.length)%encounters.length;
  const order=encounters.map((_,i)=>i);
  if(cycle>0){
    const shuffle=seeded((seed^Math.imul(cycle,2654435761))>>>0);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(shuffle()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  }
  const rng=seeded((seed^Math.imul(index+1,1597334677))>>>0);
  const type=encounters[order[offset]];
  const side=index===0?1:(rng()>.5?1:-1);
  const diffuse=['galaxy','cloud','field','nursery','assembly'].includes(type.family);
  return {...type,index,seed:Math.floor(rng()*4294967295),x:side*(diffuse?type.radius*.45+25:type.radius*1.65+20),y:(index===0?.35:(rng()-.35)*.9)*type.radius,worldZ:-(index*LEG_DISTANCE+185)};
}

// Long holds, then a 22-second eased move. No jump cuts or continuous orbiting.
export function cameraPose(time){
  const shots=[[-6.2,4.2,19],[5.5,3.8,21],[-6,2.8,20],[1,5,22],[5,2.5,21]];
  const period=190,shot=Math.floor(time/period),phase=time%period;
  const to=shots[shot%shots.length],from=shots[(shot-1+shots.length)%shots.length];
  let blend=shot===0?1:Math.min(1,phase/22);blend=blend*blend*(3-2*blend);
  return from.map((v,i)=>v+(to[i]-v)*blend);
}

export function activeLegs(time){
  const current=Math.floor(time/LEG_SECONDS);
  return [current-1,current,current+1,current+2].filter(i=>i>=0);
}
