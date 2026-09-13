import {scheduleStudyPhrase,STUDY_PHRASE_SECONDS,STUDY_OUTPUT_GAIN} from './soundscape.js';

// All sound is created after a user gesture. Suspension also freezes the score clock.
export function createAudio(){
  let ctx,master,available=true,timer=null,nextPhrase=0,origin=0;
  function schedule(){
    if(!ctx||ctx.state!=='running')return;
    while(origin+nextPhrase*STUDY_PHRASE_SECONDS<ctx.currentTime+1.5){
      scheduleStudyPhrase(ctx,master,nextPhrase,origin+nextPhrase*STUDY_PHRASE_SECONDS);
      nextPhrase++;
    }
  }
  async function start(){
    try{
      if(!ctx){
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        ctx=new AudioContext();master=ctx.createGain();master.gain.value=0;
        const highpass=ctx.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=65;
        const lowpass=ctx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=1700;lowpass.Q.value=.4;
        const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.01;limiter.release.value=.35;
        master.connect(highpass).connect(lowpass).connect(limiter).connect(ctx.destination);
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
      schedule();
      if(timer===null)timer=setInterval(schedule,500);
    }catch{available=false;}
  }
  function setVolume(value){
    if(!ctx||!master)return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(Math.max(0,Math.min(1,value))*STUDY_OUTPUT_GAIN,ctx.currentTime,1.2);
  }
  async function suspend(){
    if(timer!==null){clearInterval(timer);timer=null;}
    if(ctx?.state==='running')await ctx.suspend();
  }
  return {start,setVolume,suspend,get available(){return available;},get state(){return ctx?.state??'not-started';}};
}
