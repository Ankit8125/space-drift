import {createSpace} from './space.js';
import {createAudio} from './audio.js';

const $=id=>document.getElementById(id);
const icons={play:'<path d="m7 4 12 8-12 8Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',sound:'<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',muted:'<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="m16 9 6 6m0-6-6 6"/>',focus:'<path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3"/>',fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'};
function icon(id,name){$(id).innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;}
let stored={};try{stored=JSON.parse(localStorage.getItem('drift-v1'))||{};}catch{}
const valid=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const urlSeed=new URLSearchParams(location.search).get('seed');
const reviewMode=new URLSearchParams(location.search).get('review')==='1';
const reviewTime=Number(new URLSearchParams(location.search).get('at')||0);
const seed=urlSeed!==null&&/^\d+$/.test(urlSeed)?Number(urlSeed)>>>0:valid(stored.seed,0,4294967295)?stored.seed:crypto.getRandomValues(new Uint32Array(1))[0];
let volume=valid(stored.volume,0,1)?stored.volume:.28,muted=stored.muted===true,started=false,paused=false,focused=false,raf=0,last=0,idleTimer,statusTimer;
const audio=createAudio(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let world;
function notify(message){clearTimeout(statusTimer);$('status').textContent=message;statusTimer=setTimeout(()=>$('status').textContent='',4500);}
function save(){if(!world||reviewMode)return;try{localStorage.setItem('drift-v1',JSON.stringify({seed,volume,muted,time:world.time,flight:world.flight.snapshot()}));}catch{}}
function soundUI(){icon('sound',muted||volume===0?'muted':'sound');$('sound').setAttribute('aria-label',muted?'Unmute sound':'Mute sound');$('sound').setAttribute('aria-pressed',String(muted));const v=muted?0:Math.round(volume*100);$('volume').value=String(v);$('volume').style.setProperty('--vol',`${v}%`);audio.setVolume(muted?0:volume);}
function pauseUI(){icon('pause',paused?'play':'pause');$('pause').setAttribute('aria-label',paused?'Resume journey':'Pause journey');$('pause').title=paused?'Resume journey (Space)':'Pause journey (Space)';document.body.classList.toggle('paused',paused);}
let shownLeg=-1;
function updateLocation(){if(!world)return;const encounter=world.encounter;if(!encounter||encounter.key===shownLeg)return;shownLeg=encounter.key;$('region-name').textContent=encounter.chapter.toUpperCase();$('region-detail').textContent=encounter.name;}
function frame(now){raf=0;if(!started||paused||document.hidden)return;if(now-last>=1000/30){const dt=Math.min((now-last)/1000,.1);last=now;applySteering();world.render(dt,true);updateLocation();$('flight-feedback').textContent=world.flight.blocked?'Surface boundary · turn to fly around':world.flight.mode==='manual'?'Free flight · your course, any direction':'Autopilot · settle in and drift';}raf=requestAnimationFrame(frame);}
async function sync(){cancelAnimationFrame(raf);raf=0;if(started&&!paused&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);await audio.start();audio.setVolume(muted?0:volume);if(paused||document.hidden)await audio.suspend();}else await audio.suspend();}
function wake(){document.body.classList.remove('idle');clearTimeout(idleTimer);if(started)idleTimer=setTimeout(()=>document.body.classList.add('idle'),4500);}
function togglePause(){if(!started)return;paused=!paused;clearSteering();pauseUI();sync();save();notify(paused?'Journey paused. Take your time.':'Drifting again.');wake();}
function toggleSound(){muted=!muted;soundUI();save();wake();}
function toggleFocus(){focused=!focused;document.body.classList.toggle('focus-mode',focused);$('restore').hidden=!focused;if(focused)$('restore').focus();else $('focus').focus();wake();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable in this browser.');}}

icon('focus','focus');icon('fullscreen','fullscreen');soundUI();pauseUI();
$('begin').addEventListener('click',async()=>{
  if(started)return;started=true;paused=reducedMotion.matches;document.body.classList.add('started');$('intro').inert=true;$('controls').hidden=false;$('flight-deck').hidden=false;$('space').focus();pauseUI();flightUI();await sync();
  if(!audio.available){notify('Audio is unavailable. You can still enjoy the journey.');$('sound').disabled=true;$('volume').disabled=true;}
  if(paused)notify('Reduced motion is on. Press play when you’re ready.');wake();save();
  setTimeout(()=>$('intro').hidden=true,1600);
});
$('pause').addEventListener('click',togglePause);$('sound').addEventListener('click',toggleSound);
$('volume').addEventListener('input',e=>{volume=Number(e.target.value)/100;muted=false;soundUI();save();});
$('focus').addEventListener('click',toggleFocus);$('restore').addEventListener('click',toggleFocus);$('fullscreen').addEventListener('click',fullscreen);
$('about-open').addEventListener('click',()=>{clearSteering();$('about').showModal();});$('about-close').addEventListener('click',()=>$('about').close());
$('about').addEventListener('click',e=>{if(e.target===$('about')){const r=$('about').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('about').close();}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
document.addEventListener('visibilitychange',()=>{clearSteering();save();sync();});window.addEventListener('blur',clearSteering);window.addEventListener('pagehide',save);setInterval(()=>{if(started&&!paused&&!document.hidden)save();},15000);
reducedMotion.addEventListener('change',e=>{if(e.matches&&started&&!paused)togglePause();});
window.addEventListener('resize',()=>{world?.resize();if(!started||paused)world?.render(0,started);});
document.addEventListener('pointermove',wake,{passive:true});document.addEventListener('pointerdown',wake,{passive:true});document.addEventListener('focusin',wake);
const heldKeys=new Set(),flightKeys=new Set(['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyX']);
let steeringPointer=null,touchYaw=0,touchPitch=0,touchRoll=0;
function clearSteering(){heldKeys.clear();steeringPointer=null;touchYaw=0;touchPitch=0;touchRoll=0;world?.flight.clear();$('steering-stick').style.transform='translate(-50%, -50%)';$('steering-pad').classList.remove('engaged');}
function flightUI(){if(!world)return;const manual=world.flight.mode==='manual';document.body.classList.toggle('manual-flight',manual);$('pilot').textContent=manual?'Autopilot':'Take control';$('pilot').setAttribute('aria-label',manual?'Enable autopilot':'Take control of spaceship');$('flight-feedback').textContent=manual?'Free flight · your course, any direction':'Autopilot · settle in and drift';$('speed').value=String(Math.round(world.flight.throttle*100));$('speed-value').textContent=`${world.flight.throttle.toFixed(1)}×`;}
function takeControl(){if(world.flight.mode==='manual')return;world.flight.setMode('manual');flightUI();notify('You have control. WASD / arrows to steer, Q / E to roll.');}
function togglePilot(){if(!started)return;clearSteering();world.flight.setMode(world.flight.mode==='manual'?'cruise':'manual');flightUI();save();wake();notify(world.flight.mode==='manual'?'Free flight. Turn, climb, dive, or fly back.':'Autopilot will continue from your current position and heading.');}
function applySteering(){if(!world)return;const key=(...codes)=>codes.some(code=>heldKeys.has(code));Object.assign(world.flight.input,{yaw:Math.max(-1,Math.min(1,Number(key('KeyD','ArrowRight'))-Number(key('KeyA','ArrowLeft'))+touchYaw)),pitch:Math.max(-1,Math.min(1,Number(key('KeyW','ArrowUp'))-Number(key('KeyS','ArrowDown'))+touchPitch)),roll:Number(key('KeyE'))-Number(key('KeyQ'))+touchRoll,boost:key('ShiftLeft','ShiftRight'),brake:key('KeyX')});}
function toggleView(){if(!world)return;const cockpit=world.toggleView();$('camera-view').textContent=cockpit?'Chase view':'Pilot view';$('camera-view').setAttribute('aria-label',cockpit?'Switch to chase camera':'Switch to pilot camera');if(paused)world.render(0,started);wake();}
$('pilot').addEventListener('click',togglePilot);$('camera-view').addEventListener('click',toggleView);
$('speed').addEventListener('input',e=>{world.flight.throttle=Number(e.target.value)/100;$('speed-value').textContent=`${world.flight.throttle.toFixed(1)}×`;save();wake();});
for(const [id,direction] of [['roll-left',-1],['roll-right',1]]){
  $(id).addEventListener('pointerdown',e=>{if(paused)return;e.preventDefault();takeControl();touchRoll=direction;$(id).setPointerCapture(e.pointerId);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])$(id).addEventListener(event,()=>touchRoll=0);
}
document.addEventListener('keydown',e=>{
  if($('about').open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;
  if(!started)return;
  if(flightKeys.has(e.code)){e.preventDefault();if(paused)return;takeControl();heldKeys.add(e.code);wake();return;}
  if(e.repeat)return;
  if(e.code==='Space'){if(['BUTTON','A'].includes(e.target.tagName))return;e.preventDefault();togglePause();}else if(e.key.toLowerCase()==='m')toggleSound();else if(e.key.toLowerCase()==='h'||(e.key==='Escape'&&focused))toggleFocus();else if(e.key.toLowerCase()==='f')fullscreen();else if(e.key.toLowerCase()==='p')togglePilot();else if(e.key.toLowerCase()==='c')toggleView();wake();
});
document.addEventListener('keyup',e=>heldKeys.delete(e.code));
for(const surface of [$('space'),$('steering-pad')]){
  surface.addEventListener('pointerdown',e=>{if(!started||paused||steeringPointer||e.button!==0)return;e.preventDefault();takeControl();surface.focus();steeringPointer={id:e.pointerId,x:e.clientX,y:e.clientY};surface.setPointerCapture(e.pointerId);$('steering-pad').classList.add('engaged');});
  surface.addEventListener('pointermove',e=>{if(!steeringPointer||e.pointerId!==steeringPointer.id)return;const x=(e.clientX-steeringPointer.x)/75,y=(steeringPointer.y-e.clientY)/75,m=Math.max(1,Math.hypot(x,y));touchYaw=x/m;touchPitch=y/m;$('steering-stick').style.transform=`translate(calc(-50% + ${touchYaw*32}px), calc(-50% - ${touchPitch*32}px))`;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(event,e=>{if(steeringPointer?.id===e.pointerId){steeringPointer=null;touchYaw=touchPitch=0;$('steering-stick').style.transform='translate(-50%, -50%)';$('steering-pad').classList.remove('engaged');save();}});
}
$('space').addEventListener('wheel',e=>{if(!started||!world)return;e.preventDefault();world.zoom.target=Math.max(8,Math.min(30,world.zoom.target+e.deltaY*.01));},{passive:false});
$('space').addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;pauseUI();sync();$('status').textContent='The graphics connection was interrupted. Reload to resume your journey.';});

try{world=createSpace($('space'),seed,reviewMode&&valid(reviewTime,0,1e9)?reviewTime:urlSeed===null&&valid(stored.time,0,1e9)?stored.time:0,urlSeed===null&&!reviewMode?stored.flight:null);updateLocation();flightUI();$('begin').disabled=false;$('begin-label').textContent='Begin your journey';}
catch(error){console.error(error);$('begin-label').textContent='Space could not load';$('status').textContent='Drift needs WebGL. Enable hardware acceleration in your browser, then reload.';}
// Read-only diagnostics for smoke checks, without exposing mutable scene internals.
window.__drift={get state(){return {started,paused,muted,volume,seed,time:world?.time,audio:audio.state,...world?.stats};}};
// Explicit development URLs can step a paused scene to check an entire long route.
// This is absent on normal URLs and never writes review progress to storage.
if(reviewMode)window.__drift.advance=seconds=>{if(started&&!paused)throw new Error('Pause before stepping');if(!valid(seconds,0,600))throw new Error('Review steps must be 0–600 seconds');world.render(seconds,started);updateLocation();return window.__drift.state;};
