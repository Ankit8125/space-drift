import {scheduleStudyPhrase,STUDY_PHRASE_SECONDS,STUDY_OUTPUT_GAIN} from './soundscape.js';

// All sound is created after a user gesture. Suspension also freezes the score clock.
export function createAudio(){
  let ctx,master,output,available=true,timer=null,nextPhrase=0,origin=0,speaker=null;
  function wanted(){return timer!==null;}
  function schedule(){
    if(!ctx||ctx.state!=='running')return;
    // Queue beyond background timer throttling; the audio clock keeps playing.
    while(origin+nextPhrase*STUDY_PHRASE_SECONDS<ctx.currentTime+180){
      scheduleStudyPhrase(ctx,master,nextPhrase,origin+nextPhrase*STUDY_PHRASE_SECONDS);
      nextPhrase++;
    }
  }
  function hold(){
    if(!wanted())return;
    if(ctx?.state==='suspended')ctx.resume().catch(()=>{});
    if(speaker?.paused)speaker.play().catch(()=>{});
    schedule();
  }
  async function start(){
    try{
      if(!ctx){
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        ctx=new AudioContext();master=ctx.createGain();master.gain.value=0;
        const highpass=ctx.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=65;
        const lowpass=ctx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=1700;lowpass.Q.value=.4;
        output=ctx.createDynamicsCompressor();output.threshold.value=-10;output.knee.value=12;output.ratio.value=6;output.attack.value=.01;output.release.value=.35;
        master.connect(highpass).connect(lowpass).connect(output);
        // HTML media keeps playing in background tabs; AudioContext destination does not.
        try{
          const stream=ctx.createMediaStreamDestination();
          output.connect(stream);
          speaker=new Audio();
          speaker.srcObject=stream.stream;
          speaker.playsInline=true;
          speaker.setAttribute('aria-hidden','true');
          speaker.style.cssText='position:absolute;width:0;height:0;opacity:0;pointer-events:none';
          document.body.appendChild(speaker);
        }catch{output.connect(ctx.destination);speaker=null;}
        ctx.addEventListener('statechange',hold);
        // Very faint filtered cabin air, with tapered loop boundaries to avoid clicks.
        const length=ctx.sampleRate*8,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
        let brown=0;
        for(let i=0;i<length;i++){brown=(brown+(Math.random()*2-1)*.012)/1.018;const taper=Math.min(1,i/(ctx.sampleRate*.5),(length-1-i)/(ctx.sampleRate*.5));data[i]=brown*taper;}
        const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
        const airFilter=ctx.createBiquadFilter();airFilter.type='lowpass';airFilter.frequency.value=280;
        const airLevel=ctx.createGain();airLevel.gain.value=.035;
        source.connect(airFilter).connect(airLevel).connect(master);source.start();
        origin=ctx.currentTime+.15;
      }
      await ctx.resume();
      if(speaker){
        try{await speaker.play();}
        catch{output.connect(ctx.destination);speaker.remove();speaker=null;}
      }
      schedule();
      if(timer===null)timer=setInterval(hold,500);
    }catch{available=false;}
  }
  function setVolume(value){
    if(!ctx||!master)return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*STUDY_OUTPUT_GAIN,ctx.currentTime,1.2);
  }
  async function suspend(){
    if(timer!==null){clearInterval(timer);timer=null;}
    try{speaker?.pause();}catch{}
    if(ctx?.state==='running')await ctx.suspend();
  }
  return {start,setVolume,suspend,get available(){return available;},get state(){return ctx?.state??'not-started';}};
}
