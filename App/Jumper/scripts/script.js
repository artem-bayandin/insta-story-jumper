const Diagnostics = require('Diagnostics')
const Patches = require('Patches')
const Reactive = require('Reactive')
const Scene = require('Scene')



const log = (message) => Diagnostics.log(message)

const findMe = (identifier) => Scene.root.findFirst(identifier, null)

const subscribeToPatchPulse = (identifier, func) => {
    return Patches.outputs.getPulse(identifier).then(pulse => pulse.subscribe(func))
}

const subscribeToPatchBoolean = (identifier, func) => {
    return Patches.outputs.getBoolean(identifier).then(boolSignal => boolSignal.monitor({fireOnInitialValue: true}).subscribe(func))
}

const subscribeToPatchScalar = (identifier, func) => {
    return Patches.outputs.getScalar(identifier).then(scalarSignal => scalarSignal.monitor({fireOnInitialValue: true}).subscribe(func))
}

const sendBooleanToPatch = (identifier, value) => Patches.inputs.setBoolean(identifier, !!value)

const sendScalarToPatch = (identifier, value) => Patches.inputs.setScalar(identifier, +value)

const sendPulseToPatch = (identifier) => Patches.inputs.setPulse(identifier, Reactive.once())



// common properties
const initialSpeed = 100
const maxSpeed = 30

let playing = false
let speedMultiplier = 0
let speedStep = 9
let level = 0

// set playing
const setPlaying = (value) => {
    playing = !!value
    sendBooleanToPatch('doPlay', playing)
}
const resetAnimation = () => sendPulseToPatch('resetAnimation')

// set speed
const setSpeed = (value) => {
    if (speedMultiplier !== value && value >= maxSpeed) {
        speedMultiplier = value
        sendScalarToPatch('speedMultiplier', speedMultiplier)
    }
}

const setLevel = (value) => {
    const newLevel = Math.floor(value / 4)
    if (newLevel !== level) {
        level = newLevel
        setSpeed(speedMultiplier - speedStep)
        if (level > 0) {
            sendPulseToPatch('levelUp')
        }
    }
}

const showPlayer = (value) => {
    findMe('player').then(obj => obj.hidden = !value)
}

// subscribe to dinoDied
const dinoDied = () => {
    // log(`dino died`)
    setPlaying(false)
    showPlayer(false)
    resetAnimation()
}
subscribeToPatchPulse('dinoDied', dinoDied)

// subscribe to tap
const tapped = () => {
    // log(`tapped`)
    if (!playing) {
        resetAnimation()
        setSpeed(initialSpeed)
        setLevel(0)
        showPlayer(true)
        setPlaying(!playing)
    }
}
subscribeToPatchPulse('tapped', tapped)

// subscribe to score change
const scoreChanged = (options) => {
    setLevel(options.newValue)
    findMe('txt-score').then(obj => obj.text = options.newValue.toString())
}
subscribeToPatchScalar('score', scoreChanged)

showPlayer(true)