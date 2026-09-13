import {FLIGHT_SPEED,flightPath} from './journey.js';

// Double-precision world position; a unit quaternion avoids pitch limits and gimbal lock.
export function flightMultiply(a,b){
  const [x,y,z,w]=a,[u,v,s,t]=b;
  return [w*u+x*t+y*s-z*v,w*v-x*s+y*t+z*u,w*s+x*v-y*u+z*t,w*t-x*u-y*v-z*s];
}
export function flightRotate(q,v){
  const [x,y,z,w]=q,[a,b,c]=v;
  const tx=2*(y*c-z*b),ty=2*(z*a-x*c),tz=2*(x*b-y*a);
  return [a+w*tx+y*tz-z*ty,b+w*ty+z*tx-x*tz,c+w*tz+x*ty-y*tx];
}
function flightUnit(q){const n=Math.hypot(...q);return q.map(v=>v/n);}
function flightHeading(forward){return flightUnit([forward[1],-forward[0],0,1-forward[2]]);}
export function validFlightSave(saved){
  const array=(value,length,limit)=>Array.isArray(value)&&value.length===length&&value.every(v=>Number.isFinite(v)&&Math.abs(v)<=limit);
  return saved?.version===2&&array(saved.position,3,1e10)&&array(saved.orientation,4,1)&&Math.hypot(...saved.orientation)>.5&&['manual','cruise'].includes(saved.mode)&&Number.isFinite(saved.throttle)&&saved.throttle>=0&&saved.throttle<=3;
}
export function createFlight(savedTime=0,saved){
  const oldRoute=flightPath(savedTime),restore=validFlightSave(saved);
  let position=restore?[...saved.position]:[oldRoute.x,oldRoute.y,-savedTime*FLIGHT_SPEED];
  let orientation=restore?flightUnit(saved.orientation):savedTime>0?flightHeading(oldRoute.forward):[0,0,0,1];
  let distance=0;
  let rate=[0,0,0],cruiseAge=0,blocked=false;
  let steering=null;
  function steer(yaw,pitch){steering=[Math.max(-1,Math.min(1,pitch)),Math.max(-1,Math.min(1,-yaw)),0];}
  function release(){steering=null;rate=[0,0,0];}
  function step(dt,obstacles=[]){
    // Bounded integration also keeps collision checks reliable after a long review step.
    let remaining=dt;blocked=false;
    while(remaining>1e-8){
      const h=Math.min(remaining,1/30);remaining-=h;cruiseAge+=h;
      const controls=steering?steering.map(v=>v*.8):[.0012*Math.cos(cruiseAge*.024),.0035*Math.cos(cruiseAge*.035),0];
      // Start a gentle detour well before a solid body reaches the ship.
      const inverse=[-orientation[0],-orientation[1],-orientation[2],orientation[3]];
      for(const body of steering?[]:obstacles){
        const local=flightRotate(inverse,body.position.map((v,i)=>v-position[i]));
        const ahead=-local[2],lateral=Math.hypot(local[0],local[1]),clearance=body.radius+35;
        if(ahead>0&&ahead<clearance+180&&lateral<clearance){
          const strength=.08*(1-lateral/clearance)*Math.min(1,(clearance+180-ahead)/80);
          const side=lateral>1?local[0]/lateral:1,vertical=lateral>1?local[1]/lateral:0;
          controls[1]+=side*strength;controls[0]-=vertical*strength;
        }
      }
      rate=rate.map((r,i)=>r+(controls[i]-r)*(1-Math.exp(-h*7)));
      const angular=Math.hypot(...rate);
      if(angular>1e-9){const s=Math.sin(angular*h/2)/angular;orientation=flightUnit(flightMultiply(orientation,[rate[0]*s,rate[1]*s,rate[2]*s,Math.cos(angular*h/2)]));}
      const forward=flightRotate(orientation,[0,0,-1]);
      const next=position.map((v,i)=>v+forward[i]*FLIGHT_SPEED*h);
      // A soft surface boundary permits skimming and turning away without flying through planets.
      for(const body of obstacles){
        const delta=next.map((v,i)=>v-body.position[i]),r=body.radius+7,length=Math.hypot(...delta);
        if(length<r){const normal=length>1e-6?delta.map(v=>v/length):[0,1,0];for(let i=0;i<3;i++)next[i]=body.position[i]+normal[i]*r;blocked=true;}
      }
      distance+=Math.hypot(...next.map((v,i)=>v-position[i]));position=next;
    }
  }
  return {step,steer,release,
    get throttle(){return 1;},get mode(){return 'cruise';},
    get position(){return [...position];},get orientation(){return [...orientation];},
    get forward(){return flightRotate(orientation,[0,0,-1]);},get speed(){return FLIGHT_SPEED;},get distance(){return distance;},get blocked(){return blocked;},
    snapshot(){return {version:2,position:[...position],orientation:[...orientation],mode:'cruise',throttle:1};}
  };
}
