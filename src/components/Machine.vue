<template>
  <div id="mainMachine">
    <div id="controls">
      <machine-button @click="pausePlay" :pressed="playing">Play</machine-button>
      <machine-button @click="randomizeSteps">Random steps</machine-button> 
      <machine-button @click="randomizeDrums">Random Drums</machine-button> 
      <machine-button @click="clearSteps">Clear all</machine-button>
      <span class="knobLabel">Tempo</span>
      <knob min="60" max="220" v-model="tempo" style="position: relative; top: 31px;"/>
    </div>
    <led v-for="(step,i) in stepCount" :key="i" :active="i==currentStep" />
    <div id="knobTitles">
        <li class="knobLabel">Gain</li>
        <li class="knobLabel">Pitch</li>
        <li class="knobLabel">Length</li>
        <li class="knobLabel">Env</li>
        <li class="knobLabel">Noise</li>
    </div>
    <div v-for="(inst,i) in instrumentCount" :key="i">
      <step-button 
        v-for="(step,j) in stepCount" 
        :key="j" 
        :value="pattern[i][j].active" 
        @input="val => pattern[i][j].active = val" 
        :highlight="currentStep==j" />
      <knob min="0" max="0.9"
      v-model="instruments[i].gain" />
      <knob min="60" max="8800"
      v-model="instruments[i].freq" />
      <knob min="0.05" max="0.9"
      v-model="instruments[i].decay" />
      <knob min="0.01" max="1"
      v-model="instruments[i].endPitch" />
      <knob min="0.01" max="1"
      v-model="instruments[i].sineNoiseMix" />
    </div>
    <span class="knobLabel">Presets:</span>
    <machine-button v-for="(preset,i) in presets" :key="i" @click="loadPreset(preset)">{{ preset.name }} </machine-button>
  </div>
</template>

<script>
import StepButton from './StepButton'
import Knob from './Knob'
import Led from './Led'
import MachineButton from './MachineButton'
import _ from 'lodash'
import presets from '../presets'

let audioContext = new AudioContext()

let bufferSize = 2 * audioContext.sampleRate,
    noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
    output = noiseBuffer.getChannelData(0);
for (var i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
}


export default {
  name: 'machine',
  components: { StepButton, Knob, Led, MachineButton},
  data () {
    return {
      pattern: [],
      stepCount: 16,
      instruments: [],
      currentStep: 0,
      secondsPerStep: 0,
      lastScheduledTime: 0,
      nextStepTime: 0,
      playing: true,
      tempo: 120,
      audioTime: undefined,
      presets: presets.presets
    }
  },
  computed: {
    instrumentCount(){
      return this.instruments.length
    }
  },
  methods:{
    pausePlay(){
      this.playing = !this.playing
    },
    loadPreset(preset){
      let loadedPreset = _.cloneDeep(preset)
      this.pattern = loadedPreset.pattern,
      this.tempo = loadedPreset.tempo,
      this.instruments = loadedPreset.instruments
    },
    randomizeSteps(){
      for (let inst in this.pattern){
        for (let step in this.pattern[inst]){
          this.pattern[inst][step].active = (Math.random()>0.5)
        }
      }
    },
    randomizeDrums(){
      for (let inst of this.instruments){
        inst.freq = Math.random()*3000+100
        inst.decay = Math.random()*0.8+0.01
        inst.endPitch = Math.random()*0.8+0.01
        inst.sineNoiseMix = Math.random()*1+0.01
      }
    },    
    clearSteps(){
       for (let inst in this.pattern){
        for (let step in this.pattern[inst]){
          this.pattern[inst][step].active = false
        }
      }     
    },
    scheduleNote(instrument,startTime){
      let osc = audioContext.createOscillator()
      let mainGainNode = audioContext.createGain()
      let whiteNoise = audioContext.createBufferSource();

      let oscVol = audioContext.createGain()
      osc.connect(oscVol)
      oscVol.gain.value = (1-instrument.sineNoiseMix)*2
      oscVol.connect(mainGainNode)
      mainGainNode.connect(audioContext.destination)
      osc.start(startTime)
      osc.stop(startTime+instrument.decay)
      osc.frequency.value = instrument.freq
      osc.frequency.exponentialRampToValueAtTime(instrument.freq*instrument.endPitch, startTime+instrument.decay)

      let noiseVol = audioContext.createGain()
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.connect(noiseVol);
      noiseVol.gain.value = instrument.sineNoiseMix*2
      noiseVol.connect(mainGainNode)
      whiteNoise.start(startTime);
      whiteNoise.stop(startTime+instrument.decay)
      mainGainNode.gain.value = instrument.gain
      mainGainNode.gain.exponentialRampToValueAtTime(0.01, startTime+instrument.decay)


    },
    getSchedule(step,currentTime){
      let stepTime = step * this.secondsPerStep + ( currentTime - currentTime % (this.secondsPerStep * this.stepCount))
      if (stepTime<currentTime) { // skip to the next pattern if it's already too late
        stepTime += this.secondsPerStep * this.stepCount
      }
      return stepTime
    },
    updateAudioTime(){
      if(this.playing){
        const LOOK_AHEAD = 0.1
        this.secondsPerStep = 60/this.tempo/4
        this.audioTime = audioContext.currentTime
        this.currentStep = Math.floor(this.audioTime/this.secondsPerStep % this.stepCount)
        for (let inst in this.pattern){
          for (let step in this.pattern[inst]){
            if (this.pattern[inst][step].active){
              let schedule = this.getSchedule(step, this.audioTime)
              if (schedule > 0 && schedule-this.audioTime<LOOK_AHEAD && schedule>this.lastScheduledTime){
                this.scheduleNote(this.instruments[inst], schedule)
              }
            }
          }
        }

        this.lastScheduledTime = this.audioTime+LOOK_AHEAD
      }
      requestAnimationFrame(this.updateAudioTime)
    }
  },
  created (){

    // Add some instruments

    for (let i=0; i<4; i++){
      this.instruments.push({
        freq: 100,
        gain: 0.2,
        decay: 0.01,
        endPitch: 0.01,
        sineNoiseMix: 0.01
      })
      this.randomizeDrums()
    }

    // Create empty patterns

    for(let i=0; i<this.instrumentCount; i++){
      this.pattern.push([])
      for(let j=0; j<this.stepCount; j++){
        this.pattern[i].push({active: false})
      }
    }

 

    this.updateAudioTime()
  }
}
</script>

<style scoped>

  #mainMachine{
    margin: 0 auto;
    margin-top: 50px;
  }
  #knobTitles{
    display: inline-block;
    margin-left: 6px;
  }

  #controls{
    text-align: left;
  }

  .knobLabel{
    display: inline-block;
    font-size: 12px;
    margin: 0px 7px;
    color: #666;
  }
</style>
