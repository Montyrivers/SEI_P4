import React from 'react'
import Tone from 'tone'
import AmpEnvOsc from './synth/AmpEnvOsc'
import Filter from './synth/Filter'
import MidiStatus from './synth/MidiStatus'
import Options from './synth/Options'
import Preset from './synth/Preset'
import Visualizer from './synth/Visualizer'
import Volume from './synth/Volume'


export default class Instrument extends React.Component {
  constructor() {
    //instantiating components imported from Tone.js library npm dependency.
    const synth = new Tone.PolySynth(16, Tone.Synth);
    //Synth object parameters are initialized using the .set Tone library method.
    synth.set({
      "oscillator": {
        "type": "pwm",
        "modulationFrequency": 1,
      },
      "envelope": {
        "attack": 0.001,
        "decay": 5,
        "sustain": 0.1,
        "release": 0.3,
      },
    })
    const filter = new Tone.Filter();
    const volume = new Tone.Gain();

    super()
    //Tone components are stored in state.
    this.state = {
      volume: '',
      synthSnapshot: {
        "oscillator": {
          "type": "pwm",
          "modulationFrequency": 1,
        },
        "envelope": {
          "attack": 0.001,
          "decay": 5,
          "sustain": 0.1,
          "release": 0.3,
        }
      },
      filterSnapshot: {
        "type": 'lowpass',
        "frequency": 350,
        "Q": 1,
      },
      synth: synth,
      filter: filter,
      volume: volume,
      notes: [],

      isMono: true,
      monoPoly: undefined,
    }
  }

  tempSave = () => {
    this.setState({
      savedSynth: this.state.synth
    })
    console.log(this.state.savedSynth)
  }

  tempOverwrite = () => {
    this.setState({
      snapshot: this.state.savedSynth
    })
    console.log(this.state.snapshot)
  }

  tempLoad = () => {
    this.setState({
      synth: this.state.snapshot
    });
    console.log(this.state.synth)
  }

  monoPoly = (e) => {
    if (this.state.isMono) {
      this.setState({
        isMono: false,
        monoPoly: null
      })
    } else if (!this.state.isMono) {
      this.setState({
        isMono: true,
        monoPoly: undefined,
      })
    }
  }

  handleVolumeKnobChange = (val) => {
    const vol = val / 127 * .8
    this.state.volume.gain.value = vol
  }

  handleFilterKnobChange = (val) => { //so like.  I can probably just avoid adding information to state and just push the entire object and alter it in state directly.
    this.setState(prevState => ({
      filterSnapshot: {
        ...prevState.filterSnapshot,
        frequency: val,
      }
    }))
    this.state.filter.set({
      "frequency": val,
    })
    console.log(this.state.filterSnapshot)
  }
  handleFilterChange = (e) => {
    const { target: { name, value } } = e
    this.setState(prevState => ({
      filterSnapshot: {
        ...prevState.filterSnapshot,
        [name]: [value],
      }
    }))
    this.state.filter.set({
      "Q": value,
    })
    console.log(this.state.filterSnapshot)
  }
  handleFilterType = (str) => {
    const filter = str
    this.setState(prevState => ({
      filterSnapshot: {
        ...prevState.filterSnapshot,
        "type": filter
      }
    }))
    this.state.filter.set({
      "type": filter,
    })
    console.log(this.state.filter.type)
    console.log(this.state.filterSnapshot)
  }


  handleOscTypeChange = (str) => {
    const osc = str
    this.state.synth.set({
      "oscillator": {
        "type": osc,
      }
    })
    console.log(this.state.synth)
  }

  handleOscModChange = (val) => {
    this.state.synth.set({
      "oscillator": {
        "modulationFrequency": val,
      }
    })
  }

  handleAmpEnvChange = (e) => {
    const { target: { name, value } } = e
    this.state.synth.voices.map(voice => {
      voice.envelope[name] = Math.round([value] / 10) + .001
    })
    console.log(name, Math.round(value) / 10 + .01)
  }


  loadSound = (e) => {
    let AudioContextFunc = window.AudioContext || window.webkitAudioContext; //storing webMIDI backend callback in an object.
    let audioContext = new AudioContextFunc(); //instantiating webMIDI object to accept device input as a promise
    if (navigator.requestMIDIAccess) { //provides for compatibility check for platform and browser-- google chrome on a mac or pc is really your best bet, here.
      console.log('MIDI supported');
    } else {
      console.log('MIDI not supported')
    };

    const onMIDISuccess = (midiAccess) => { //if successful, will store detected input devices as an object, returning port, manufacturer, device name, device id.
      console.log(midiAccess);
      //midi inputs/outputs stored in variable in case you connect multiple devices.
      let inputs = midiAccess.inputs;
      let outputs = midiAccess.outputs;
      for (let input of midiAccess.inputs.values()) {
        //capture of midi messages is called here.
        input.onmidimessage = getMIDIMessage;
      }
    }

    const onMIDIFailure = () => { // if navigator.requestMidiAccess fails, it will log an error.
      console.log('Could not access midi devices.')
    }

    const getMIDIMessage = (message) => { //callback function that logs input lines.
      // console.log(message.data);

      //received midi messages are destructured and stored in variables to collect message type, range --and if applicable, a velocity value.
      let command = message.data[0];
      let note = message.data[1];
      let velocity = (message.data.length > 2) ? message.data[2] : 0

      //array of notes in chromatic order to be indexed according to incoming midi note number 1-127.
      let notArray = ["A-2", "A#-2", "B-2", "C-1", "C#-1", "D-1", "D#-1", "E-1", "F-1", "F#-1", "G0", "A-1", "A#-1", "B-1", "C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0", "C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1", "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2", "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5", "C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6", "C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7", "A7", "B7", "C8", "A8", "A#8", "B8", "C9", "C#9", "D9", "D#9", "E9", "F9", "F#9", "G9", "G#9", "A9", "A#9", "B9", "C10", "C#10", "D10", "D#10", "E10", "F10", "F#10", "G10", "G#10", "A10", "A#10", "B10", "C11", "C#11", "D11", "D#11", "E11", "F11", "F#11", "G11", "G#11",]



      switch (command) {

        case 128:  //noteOff
          this.state.synth.triggerRelease([notArray[note + 2]])



          break
        case 144: //noteOn
          const veloc = velocity * .01


          this.state.synth.triggerAttack([notArray[note + 2]], this.state.monoPoly, veloc) //can toggle between poly and mono by swapping second undefined argument for null respectively
          if (velocity > 0) {
          }
          break;
        case 176: // CC#11 - Expression Pedal
          let exp = velocity / 127 * 500.0
          if (note === 11) {
            this.state.synth.voices.map(voice => {
              voice.oscillator.modulationFrequency.value = exp
            });

          }
        case 176: // CC#7 - Volume
          let lev = velocity / 127 * 0.8

          if (note === 7) {

            this.state.volume.gain.value = lev
          }
        case 176: // CC#1 - modulation wheel 
          let val = velocity / 127 * 14800 + 200;
          if (note === 1) {
            this.state.filter.frequency.value = val
          }
        // There's no break here because sustain and modulation share the same message id, however the cc# is stored in the destructured key stored in the note parameter.

        case 176: // CC#64 - sustain pedal assigned to amp envelope release param

          let sus = velocity / 127 * 4.0 + 0.01
          if (note === 64 && velocity === 0) {

            this.state.synth.voices.map(voice => {
              voice.envelope.release = 0.01
            });
          }
          else if (note === 64) {

            this.state.synth.voices.forEach(voice => {
              voice.envelope.release = sus
            });
          }
          break;
        case 224: //pitch bend
          this.state.synth.voices.map(voice => {
            // voice.oscillator.frequency.value += velocity
            voice.oscillator.detune.value = velocity * 2.95
          });
          break;

      }
    }
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }

  componentDidMount() { //joins instantiated Tone objects, loadSound initializes midi Promise object and other functions that translate incoming midi hardware messages on component render.
    this.state.synth.connect(this.state.filter);
    this.state.filter.connect(this.state.volume);
    this.state.volume.toMaster();
    this.state.filter.frequency.value = 200; // 200 - 15000
    this.state.volume.gain.value = 0.8; // 0-0.8
    this.loadSound()
    console.log(this.state.synth)
  }








  render() {
    return (
      <div className="components" >
        <h4>Instrument</h4>
        <AmpEnvOsc
          handleEnv={this.handleAmpEnvChange}
          handleMod={this.handleOscModChange}
          handleOsc={this.handleOscTypeChange} />
        <Filter
          handleType={this.handleFilterType}
          handleKnob={this.handleFilterKnobChange}
          handleChange={this.handleFilterChange} />
        <MidiStatus />
        <Options
          monoPoly={this.monoPoly}
        />
        <Preset tempLoad={this.tempLoad} tempOverwrite={this.tempOverwrite} tempSave={this.tempSave} />
        <Visualizer />
        <Volume handleVolume={this.handleVolumeKnobChange} />
        {/* <button onClick={() => this.state.synth.triggerAttackRelease("C4")}>I'M A BUTTON</button> */}

      </div>
    )
  }
}




