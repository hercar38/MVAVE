//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('MVAVE', 'SMK25', 'Herve')

// create objects representing the hardware's MIDI ports
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
    
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

var knobs = []
var faders = []
var buttons = []

var numChannels = 8

for(var channelIndex = 0; channelIndex < numChannels; ++channelIndex) {
    // create control element representing your hardware's surface
    if(channelIndex < 4) {
        var knob = deviceDriver.mSurface.makeKnob(channelIndex, 0, 1, 2)}
    else{
        var knob = deviceDriver.mSurface.makeKnob(channelIndex-4, 1, 1, 2)}

    // bind midi ports to surface elements
    knob.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput).setOutputPort(midiOutput)
    .bindToControlChange (0, 20 + channelIndex)

    knobs.push(knob)
}

function makeTransport(x, y) {
    var transport = {}

    var w = 2
    var h = 2

    var currX = x

    function bindMidiCC(button, chn, num) {
        button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToControlChange(chn, num)
    }

    transport.btnStop = surface.makeButton(currX, y, w, h)
    bindMidiCC(transport.btnStop, 0, 94)
    currX = currX + w

    transport.btnStart = surface.makeButton(currX, y, w, h)
    bindMidiCC(transport.btnStart, 0, 93)
    currX = currX + w

    transport.btnRecord = surface.makeButton(currX, y, w, h)
    bindMidiCC(transport.btnRecord, 0, 95)
    currX = currX + w

    return transport
}

function makeSurfaceElements() {
    var surfaceElements = {}
    surfaceElements.transport = makeTransport(1, 7)
    return surfaceElements
}

var surfaceElements = makeSurfaceElements()

function makeTransportDisplayFeedback(button, ledID, colorID) {
	button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
		midiOutput.sendMidi(context, [ 0xbf, ledID, colorID * newValue ])
	}
}


//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// create at least one mapping page
//var page = deviceDriver.mMapping.makePage('Example Mixer Page')
var page = deviceDriver.mMapping.makePage('Default')

// create host accessing objects
var hostSelectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel

for(var channelIndex = 0; channelIndex < numChannels; ++channelIndex) {

    var knobSurfaceValue = knobs[channelIndex].mSurfaceValue;

    // bind surface elements to host accessing object values
    // page.makeValueBinding(knobSurfaceValue, hostSelectedTrackChannel.mValue.mVolume)
    page.makeValueBinding(knobSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(channelIndex).mLevel)
}
