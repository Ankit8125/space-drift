// A slow, beatless study score. Phrases overlap gently; no percussion or sharp bells.
export const STUDY_PHRASE_SECONDS = 36;
// Full volume should be clearly audible; low slider settings remain gentle.
export const STUDY_OUTPUT_GAIN = 8;
const studyChords = [
  [130.813,196,246.942,293.665], // Cmaj9
  [110,164.814,196,246.942],    // Am9
  [130.813,174.614,220,329.628],// Fmaj7 / C
  [146.832,196,220,261.626],    // Gsus / D
];

export function scheduleStudyPhrase(ctx,destination,index,start){
  const chord=studyChords[index%studyChords.length];
  for(let voice=0;voice<chord.length;voice++){
    const envelope=ctx.createGain();
    envelope.gain.setValueAtTime(0,start);
    envelope.gain.linearRampToValueAtTime(.010,start+(index===0?2.5:10));
    envelope.gain.setValueAtTime(.010,start+29);
    envelope.gain.linearRampToValueAtTime(0,start+46);
    const pan=ctx.createStereoPanner();pan.pan.value=(voice-1.5)*.18;
    envelope.connect(pan).connect(destination);
    const oscillators=[-2,2].map(detune=>{
      const oscillator=ctx.createOscillator();oscillator.type='sine';oscillator.frequency.value=chord[voice];oscillator.detune.value=detune;
      oscillator.connect(envelope);oscillator.start(start);oscillator.stop(start+47);return oscillator;
    });
    let ended=0;for(const oscillator of oscillators)oscillator.onended=()=>{oscillator.disconnect();if(++ended===2){envelope.disconnect();pan.disconnect();}};
  }
  // Soft, low-register felt-key suggestions, separated by generous silence.
  for(let note=0;note<2;note++){
    const at=start+12+note*15;
    const oscillator=ctx.createOscillator(),envelope=ctx.createGain(),filter=ctx.createBiquadFilter();
    oscillator.type='triangle';oscillator.frequency.value=chord[(index+note+1)%4]*2;
    filter.type='lowpass';filter.frequency.value=850;filter.Q.value=.3;
    envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.018,at+.09);
    envelope.gain.exponentialRampToValueAtTime(.0001,at+5.5);envelope.gain.linearRampToValueAtTime(0,at+7);
    oscillator.connect(filter).connect(envelope).connect(destination);
    oscillator.start(at);oscillator.stop(at+7.1);
    oscillator.onended=()=>{oscillator.disconnect();filter.disconnect();envelope.disconnect();};
  }
}
