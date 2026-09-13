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
function save(){if(!world||reviewMode)return;try{localStorage.setItem('drift-v1',JSON.stringify({seed,volume,muted,time:world.time}));}catch{}}
function soundUI(){icon('sound',muted||volume===0?'muted':'sound');$('sound').setAttribute('aria-label',muted?'Unmute sound':'Mute sound');$('sound').setAttribute('aria-pressed',String(muted));$('volume').value=String(Math.round(volume*100));audio.setVolume(muted?0:volume);}
function pauseUI(){icon('pause',paused?'play':'pause');$('pause').setAttribute('aria-label',paused?'Resume journey':'Pause journey');$('pause').title=paused?'Resume journey (Space)':'Pause journey (Space)';document.body.classList.toggle('paused',paused);}
let shownLeg=-1;
function updateLocation(){if(!world)return;const encounter=world.encounter;if(encounter.index===shownLeg)return;shownLeg=encounter.index;$('region-name').textContent=encounter.chapter.toUpperCase();$('region-detail').textContent=encounter.name;}
function frame(now){raf=0;if(!started||paused||document.hidden)return;if(now-last>=1000/30){const dt=Math.min((now-last)/1000,.1);last=now;world.render(dt,true);updateLocation();}raf=requestAnimationFrame(frame);}
async function sync(){cancelAnimationFrame(raf);raf=0;if(started&&!paused&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);await audio.start();audio.setVolume(muted?0:volume);if(paused||document.hidden)await audio.suspend();}else await audio.suspend();}
function wake(){document.body.classList.remove('idle');clearTimeout(idleTimer);if(started)idleTimer=setTimeout(()=>document.body.classList.add('idle'),4500);}
function togglePause(){if(!started)return;paused=!paused;pauseUI();sync();save();notify(paused?'Journey paused. Take your time.':'Drifting again.');wake();}
function toggleSound(){muted=!muted;soundUI();save();wake();}
function toggleFocus(){focused=!focused;document.body.classList.toggle('focus-mode',focused);$('restore').hidden=!focused;if(focused)$('restore').focus();else $('focus').focus();wake();}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable in this browser.');}}

icon('focus','focus');icon('fullscreen','fullscreen');soundUI();pauseUI();
$('begin').addEventListener('click',async()=>{
  if(started)return;started=true;paused=reducedMotion.matches;document.body.classList.add('started');$('intro').inert=true;$('controls').hidden=false;$('space').focus();pauseUI();await sync();
  if(!audio.available){notify('Audio is unavailable. You can still enjoy the journey.');$('sound').disabled=true;$('volume').disabled=true;}
  if(paused)notify('Reduced motion is on. Press play when you’re ready.');wake();save();
  setTimeout(()=>$('intro').hidden=true,1600);
});
$('pause').addEventListener('click',togglePause);$('sound').addEventListener('click',toggleSound);
$('volume').addEventListener('input',e=>{volume=Number(e.target.value)/100;muted=false;soundUI();save();});
$('focus').addEventListener('click',toggleFocus);$('restore').addEventListener('click',toggleFocus);$('fullscreen').addEventListener('click',fullscreen);
$('about-open').addEventListener('click',()=>$('about').showModal());$('about-close').addEventListener('click',()=>$('about').close());
$('about').addEventListener('click',e=>{if(e.target===$('about')){const r=$('about').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('about').close();}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
document.addEventListener('visibilitychange',()=>{save();sync();});window.addEventListener('pagehide',save);setInterval(()=>{if(started&&!paused&&!document.hidden)save();},15000);
reducedMotion.addEventListener('change',e=>{if(e.matches&&started&&!paused)togglePause();});
window.addEventListener('resize',()=>{world?.resize();if(!started||paused)world?.render(0,started);});
document.addEventListener('pointermove',wake,{passive:true});document.addEventListener('pointerdown',wake,{passive:true});document.addEventListener('focusin',wake);
document.addEventListener('keydown',e=>{
  if($('about').open||e.target.tagName==='INPUT')return;
  if(!started)return;
  if(e.code==='Space'){if(['BUTTON','A'].includes(e.target.tagName))return;e.preventDefault();togglePause();}else if(e.key.toLowerCase()==='m')toggleSound();else if(e.key.toLowerCase()==='h'||(e.key==='Escape'&&focused))toggleFocus();else if(e.key.toLowerCase()==='f')fullscreen();
  else if(e.key.startsWith('Arrow')){e.preventDefault();world.manualCamera();world.aim.x= Math.max(-7,Math.min(7,world.aim.x+(e.key==='ArrowRight'?.5:e.key==='ArrowLeft'?-.5:0)));world.aim.y=Math.max(-4,Math.min(4,world.aim.y+(e.key==='ArrowUp'?.4:e.key==='ArrowDown'?-.4:0)));}wake();
});
let pointer=null;
$('space').addEventListener('pointerdown',e=>{if(!started)return;world.manualCamera();pointer={x:e.clientX,y:e.clientY};$('space').setPointerCapture(e.pointerId);});
$('space').addEventListener('pointermove',e=>{if(!pointer||!world)return;world.aim.x=Math.max(-7,Math.min(7,world.aim.x-(e.clientX-pointer.x)*.018));world.aim.y=Math.max(-4,Math.min(4,world.aim.y+(e.clientY-pointer.y)*.018));pointer={x:e.clientX,y:e.clientY};});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('space').addEventListener(event,()=>pointer=null);
$('space').addEventListener('wheel',e=>{if(!started||!world)return;e.preventDefault();world.manualCamera();world.zoom.target=Math.max(10,Math.min(24,world.zoom.target+e.deltaY*.01));},{passive:false});
$('space').addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;pauseUI();sync();$('status').textContent='The graphics connection was interrupted. Reload to resume your journey.';});

try{world=createSpace($('space'),seed,reviewMode&&valid(reviewTime,0,1e9)?reviewTime:urlSeed===null&&valid(stored.time,0,1e9)?stored.time:0);updateLocation();$('begin').disabled=false;$('begin-label').textContent='Begin your journey';}
catch(error){console.error(error);$('begin-label').textContent='Space could not load';$('status').textContent='Drift needs WebGL. Enable hardware acceleration in your browser, then reload.';}
// Read-only diagnostics for smoke checks, without exposing mutable scene internals.
window.__drift={get state(){return {started,paused,muted,volume,seed,time:world?.time,audio:audio.state,...world?.stats};}};
// Explicit development URLs can step a paused scene to check an entire long route.
// This is absent on normal URLs and never writes review progress to storage.
if(reviewMode)window.__drift.advance=seconds=>{if(started&&!paused)throw new Error('Pause before stepping');if(!valid(seconds,0,1e7))throw new Error('Invalid review step');world.render(seconds,started);updateLocation();return window.__drift.state;};
