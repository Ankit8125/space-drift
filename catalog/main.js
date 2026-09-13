import * as THREE from 'three';
import {encounters} from '../library/catalog.js';
import {bodies} from '../library/index.js';
import {noise} from '../src/noise.js';

const grid=document.querySelector('#catalog');
const count=document.querySelector('#visible-count');
const cards=[];

const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(320,256,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
scene.add(new THREE.AmbientLight(0x9bb8c0,1.6));
const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(-4,5,8);scene.add(light);
const camera=new THREE.PerspectiveCamera(34,320/256,.1,1000);camera.position.set(0,0,260);

function familyLabel(family){
  return {planet:'Planet',star:'Star',compact:'Stellar remnant',cloud:'Nebula',galaxy:'Galaxy',blackhole:'Black hole',field:'Small body'}[family]||family;
}

for(const definition of encounters){
  const card=document.createElement('article');
  card.className='object-card';
  card.dataset.family=definition.family;
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=512;canvas.setAttribute('aria-label',`${definition.name} preview`);
  const info=document.createElement('div');info.className='object-info';
  info.innerHTML=`<p class="object-family">${familyLabel(definition.family)}</p><h2 class="object-name">${definition.name}</h2><p class="object-chapter">${definition.chapter}</p>`;
  card.append(canvas,info);grid.append(card);
  const definitionForPreview={...definition,seed:definition.id.split('').reduce((sum,char)=>sum+char.charCodeAt(0),0)};
  const body=bodies[definition.family](THREE,noise,definitionForPreview);
  const scale=58/Math.max(definition.radius,1);
  body.group.scale.setScalar(scale);
  body.group.position.set(0,0,0);
  scene.add(body.group);
  cards.push({card,canvas,body,ctx:canvas.getContext('2d'),phase:cards.length*.37});
  scene.remove(body.group);
}

function drawCard(item,time){
  scene.add(item.body.group);
  item.body.update(time+item.phase);
  renderer.setRenderTarget(null);
  renderer.render(scene,camera);
  item.ctx.clearRect(0,0,item.canvas.width,item.canvas.height);
  item.ctx.drawImage(renderer.domElement,0,0,item.canvas.width,item.canvas.height);
  scene.remove(item.body.group);
}

function render(time){
  for(const item of cards){if(!item.card.hidden)drawCard(item,time*.001);}
  requestAnimationFrame(render);
}

document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(option=>option.classList.toggle('active',option===button));
  const family=button.dataset.family;
  let visible=0;
  for(const item of cards){const show=family==='all'||item.card.dataset.family===family;item.card.hidden=!show;if(show)visible++;}
  count.textContent=visible;
}));

requestAnimationFrame(render);