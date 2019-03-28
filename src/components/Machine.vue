<template>
  <div id="mainMachine">
    <div id="title">
      TR-101
      <span class="smaller">A synth drum machine</span>
    </div>
    <div id="controls">
      <machine-button color="#B7C6D8" :pressed="playing" @click="pausePlay">Play</machine-button>
      <machine-button @click="randomizeSteps">Random steps</machine-button>
      <machine-button @click="randomizeDrums">Random Drums</machine-button>
      <machine-button @click="clearSteps">Clear all</machine-button>
      <span class="knobLabel">Tempo</span>
      <knob v-model="tempo" min="60" max="220" style="position: relative; top: 31px;"/>
    </div>
    <led v-for="(step,i) in stepCount" :key="`stepCount-${i}`" :active="i==currentStep"></led>
    <div id="knobTitles">
      <li class="knobLabel">Gain</li>
      <li class="knobLabel">Pitch</li>
      <li class="knobLabel">Length</li>
      <li class="knobLabel">Env</li>
      <li class="knobLabel">Noise</li>
      <li class="knobLabel">Mute</li>
    </div>
    <div v-for="(inst,i) in instrumentCount" :key="i">
      <step-button
        v-for="(step,j) in stepCount"
        :key="`instrumentCount-${j}`"
        :value="pattern[i][j].active"
        :highlight="currentStep==j"
        @input="val => pattern[i][j].active = val"
      ></step-button>
      <knob v-model="instruments[i].gain" min="0" max="0.9" ></knob>
      <knob v-model="instruments[i].freq" min="60" max="8800" ></knob>
      <knob v-model="instruments[i].decay" min="0.05" max="0.9" ></knob>
      <knob v-model="instruments[i].endPitch" min="0.01" max="1" ></knob>
      <knob v-model="instruments[i].sineNoiseMix" min="0.01" max="1" ></knob>
      <machine-button
        color="#D8BCB7"
        :pressed="mutes[i]"
        style="float: right;"
        @click="mutes[i] = !mutes[i]">m</machine-button>
    </div>
    <span class="knobLabel">Presets:</span>
    <machine-button
      v-for="(preset,k) in presets"
      :key="`presets-${k}`"
      color="#D8BCB7"
      @click="loadPreset(preset)">{{ preset.name }}</machine-button>
  </div>
</template>

<script>
import _ from 'lodash'
import StepButton from './StepButton.vue'
import Knob from './Knob.vue'
import Led from './Led.vue'
import MachineButton from './MachineButton.vue'
import presets from '../presets'

let audioContext;

if(window.AudioContext) {
  audioContext = new AudioContext()
} else {
  // eslint-disable-next-line no-undef, new-cap
  audioContext = new webkitAudioContext()
}

const bufferSize = 2 * audioContext.sampleRate;
const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
const output = noiseBuffer.getChannelData(0);

for (let i = 0; i < bufferSize; i+=1) {
  output[i] = Math.random() * 2 - 1;
}

export default {
  name: 'Machine',
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
      mutes: [],
      playing: true,
      tempo: 120,
      audioTime: undefined,
      presets
    }
  },
  computed: {
    instrumentCount(){
      return this.instruments.length
    }
  },
  mounted () {
    this.loadPreset(this.presets[0])
    if (!window.AudioContext) this.playing = false // Safari fix
  },
  created (){

    // Add some instruments

    for (let i=0; i<4; i+=1){
      this.instruments.push({
        freq: 100,
        gain: 0.2,
        decay: 0.01,
        endPitch: 0.01,
        sineNoiseMix: 0.01
      })
      this.mutes.push(false)
      this.randomizeDrums()
    }

    // Create empty patterns

    for(let i = 0; i<this.instrumentCount; i+=1){
      this.pattern.push([])
      for(let j=0; j<this.stepCount; j+=1){
        this.pattern[i].push({active: false})
      }
    }

    this.updateAudioTime()
  },
  methods:{
    pausePlay(){
      this.playing = !this.playing
      audioContext.createOscillator().start(0,0,0.1)
    },
    loadPreset(preset){
      const loadedPreset = _.cloneDeep(preset)
      this.pattern = loadedPreset.pattern;
      this.tempo = loadedPreset.tempo;
      this.instruments = loadedPreset.instruments
      for(let i = 0; i < this.mutes.length; i += 1){
        this.mutes[i] = false
      }
    },
    randomizeSteps(){
      for (let i = 0; i < this.pattern.length; i += 1){
        for (let j = 0; j < this.pattern[i].length; j += 1){
          this.pattern[i][j].active = (Math.random()>0.5)
        }
      }
    },
    randomizeDrums(){
      for (const inst of this.instruments){
        inst.freq = Math.random()*3000+100
        inst.decay = Math.random()*0.8+0.01
        inst.endPitch = Math.random()*0.8+0.01
        inst.sineNoiseMix = Math.random()*1+0.01
      }
    },
    clearSteps(){
      for (let i = 0; i < this.pattern.length; i += 1){
        for (let j = 0; j < this.pattern[i].length; j += 1){
          this.pattern[i][j].active = false
        }
      }
      for(let i = 0; i < this.mutes.length; i += 1){
        this.mutes[i] = false
      }
    },
    scheduleNote(instrument,startTime){
      const osc = audioContext.createOscillator()
      const mainGainNode = audioContext.createGain()
      const whiteNoise = audioContext.createBufferSource();

      const oscVol = audioContext.createGain()
      osc.connect(oscVol)
      oscVol.gain.setValueAtTime((1-instrument.sineNoiseMix)*2, startTime)
      oscVol.connect(mainGainNode)
      mainGainNode.connect(audioContext.destination)
      osc.start(startTime)
      osc.stop(startTime+instrument.decay)
      osc.frequency.setValueAtTime(instrument.freq, startTime)
      osc.frequency.exponentialRampToValueAtTime(instrument.freq*instrument.endPitch, startTime+instrument.decay)

      const noiseVol = audioContext.createGain()
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.connect(noiseVol);
      noiseVol.gain.setValueAtTime(instrument.sineNoiseMix*2, startTime)
      noiseVol.connect(mainGainNode)
      whiteNoise.start(startTime);
      whiteNoise.stop(startTime+instrument.decay)
      mainGainNode.gain.setValueAtTime(instrument.gain, startTime)
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
        for (const inst in this.pattern){
          if(!this.mutes[inst]){
            for (const step in this.pattern[inst]){
              if (this.pattern[inst][step].active){
                const schedule = this.getSchedule(step, this.audioTime)
                if (schedule > 0 && schedule-this.audioTime<LOOK_AHEAD && schedule>this.lastScheduledTime){
                  this.scheduleNote(this.instruments[inst], schedule)
                }
              }
            }
          }
        }

        this.lastScheduledTime = this.audioTime+LOOK_AHEAD
      }
      requestAnimationFrame(this.updateAudioTime)
    }
  }
}
</script>

<style scoped>
  #title{
    font-size: 30px;
    color: #555;
    font-weight: bold;
  }

  #title .smaller{
    font-size: 12px;
    font-weight: normal;
  }

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
