import {encounters} from '../library/catalog.js';
import {encounterAt,LEG_DISTANCE} from './journey.js';
import {seeded} from './noise.js';

export const SECTOR_SIZE=LEG_DISTANCE;
export const WORLD_VISIBLE_LIMIT=10;
export const WORLD_RESOURCE_LIMIT=20;
const sectorOrders=new Map();
// Shuffle the full catalogue once per spatial block, using the same rule on all axes.
// At 48 types, each 4 x 4 x 3 block contains every type exactly once.
function sectorType(x,y,z,seed){
  const depth=Math.ceil(encounters.length/16),bx=Math.floor(x/4),by=Math.floor(y/4),bz=Math.floor(z/depth);
  const key=`${seed}:${bx},${by},${bz}`;
  let order=sectorOrders.get(key);
  if(!order){
    const rng=seeded((seed^Math.imul(bx+173,73856093)^Math.imul(by+419,19349663)^Math.imul(bz+823,83492791))>>>0);
    order=Array.from({length:16*depth},(_,i)=>i%encounters.length);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    if(bx===0&&by===0&&bz===0){const ocean=order.indexOf(0);[order[0],order[ocean]]=[order[ocean],order[0]];}
    if(sectorOrders.size>=96)sectorOrders.delete(sectorOrders.keys().next().value);
    sectorOrders.set(key,order);
  }
  return encounters[order[(x-bx*4)+4*(y-by*4)+16*(z-bz*depth)]];
}
export function sectorObject(x,y,z,seed){
  const key=`${x},${y},${z}`;
  if(x===0&&y===0&&z===0){
    const d=encounterAt(0,seed);
    return {...d,key,position:[d.x,d.y,d.worldZ]};
  }
  const hash=(seed^Math.imul(x+173,73856093)^Math.imul(y+419,19349663)^Math.imul(z+823,83492791))>>>0;
  const rng=seeded(hash),type=sectorType(x,y,z,seed);
  return {...type,key,index:key,seed:hash,position:[(x+(rng()-.5)*.3)*SECTOR_SIZE,(y+(rng()-.5)*.3)*SECTOR_SIZE,z*SECTOR_SIZE-185+(rng()-.5)*SECTOR_SIZE*.25]};
}
export function nearbyObjects(position,seed){
  const center=[Math.round(position[0]/SECTOR_SIZE),Math.round(position[1]/SECTOR_SIZE),Math.round((position[2]+185)/SECTOR_SIZE)],candidates=[];
  for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++){
    const d=sectorObject(center[0]+x,center[1]+y,center[2]+z,seed);
    const distance=Math.hypot(...d.position.map((v,i)=>v-position[i]));
    if(distance<1000)candidates.push({...d,distance});
  }
  return candidates.sort((a,b)=>a.distance-b.distance||a.key.localeCompare(b.key)).slice(0,WORLD_VISIBLE_LIMIT);
}
export function solidBounds(definition,time){
  const d=definition,center=d.position;
  if(d.family==='nursery')return [{position:center,radius:d.radius*.065}];
  if(!['planet','star','compact','blackhole'].includes(d.family))return [];
  const bounds=[{position:center,radius:d.radius}];
  if(d.moon)bounds.push({position:center.map((v,i)=>v+[-1.1,1.25,.6][i]*d.radius),radius:d.radius*.16});
  if(d.binary)bounds.push({position:center.map((v,i)=>v+[Math.cos(time*.009)*2.8,Math.sin(time*.009)*.7,Math.sin(time*.009)*1.5][i]*d.radius),radius:d.radius*.68});
  return bounds;
}
