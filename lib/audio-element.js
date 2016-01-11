/**
 * AudioElement (Formant, or pulse - whatever).
 * An element, producing sound.
 * Hope will use in audio-css.
 * Takes buffer, provides source and a set of modifiers.
 * Exaclty as audio-css does.
 *
 * Source types:
 * - buffer source
 * - oscillator
 * - any other node
 *
 * Modifiers:
 * - filter
 * 	- ...
 * - gain
 * - quality
 * - convolver
 * 	- ...
 *
 * Layout:
 * - playbackRate
 * - shift
 * - repeat
 * - gap/pause
 *
 * @module  audio-element
 */

var ctx = require('audio-context');
var AudioBuffer = require('audio-buffer');
var extend = require('xtend/mutable');
var table = require('audio-table');
var random = require('distributions-normal-random/lib/number');


module.exports = AudioElement;


/**
 * @constructor
 */
function AudioElement (options) {
	var self = this;

	//init all audioprocessor options
	extend(self, options);

	//create source
	// self.source = self.createSource(self.source);

	//default untouched source
	self._source = table.sin(self.minFrequency * self.context.sampleRate);


	//buffer to be mixed
	//it is formed repeatedly
	//to accord to the style params
	self.buffer = ctx.createBuffer(self.channels, self.bufferDuration * self.context.sampleRate, self.context.sampleRate);

	//create buffer source
	self.source = ctx.createBufferSource();
	self.source.buffer = self.buffer;
	self.source.loop = true;
	self.source.start();

	//create oscillator source
	self.oscillator = ctx.createOscillator();
	self.oscillator.frequency.value = self.frequency;
	self.oscillator.start();

	//connect source to destination

	//keeps the most actual rendered buffer (scriptProcessorNode)
	self.outBuffer;
	var lastData = [0, 0];

	//create processor, saving actual buffer
	var bufSize = 256*4;
	self.processor = ctx.createScriptProcessor(bufSize, 2, 2);
	self.processor.onaudioprocess = function (e) {
		var input = e.inputBuffer;
		var output = e.outputBuffer;

		//formant implementor
		var value, step, scale = 1, weight;
		var prevValue = 0;
		var range = 0;
		for (var channel = 0; channel < input.numberOfChannels; channel++) {
			var iData = input.getChannelData(channel);
			var oData = output.getChannelData(channel);
			for (var i = 0, n = 0; i < oData.length; i++) {
				step = 1 + (Math.random()*range - range/2);

				//step is scaled randomly
				n = n + step;

				//weight is a measure between left and right
				weight = step % 1;

				//once we get n - we need to interpolate it
				//FIXME: here we have to save out-of-bounds data
				var left = iData[Math.floor(n)];
				var right = iData[Math.ceil(n)];

				//FIXME: there might need some more careful interpolation, nonlinear
				oData[i] = left * (1-weight) + right * weight;
			}
		}

		self.outBuffer = e.outputBuffer;
	};

	//simple gain
	self.gain = ctx.createGain();
	self.gain.gain.value = 0.02;

	self.oscillator.connect(self.gain);
	self.gain.connect(self.processor);
	self.processor.connect(self.context.destination);


	//init buffer
	//NOTE: the interval of regenerate is reasonable to be >= bufferDuration * N
	//or it will be computationally stupid
	//but now just avoid it
	//TODO: create gentle regenerating (on two buffers maybe, like scriptProcessor?)
	self.regenerate();
	self.regenerateInterval = setInterval(function () {
		// self.regenerate();
	}, 1000 * self.regenerateRatio * self.bufferDuration);
}


/**
 * Max duration of an active buffer.
 * Affects how recognizable is repeating of that.
 */
AudioElement.prototype.bufferDuration = 1;

/**
 * How much times to repeat the generated buffer.
 * For sines is not necessary at all
 * For pure formants is also
 * Actually it is not necessary to regenerate good repeated waves at all
 */
AudioElement.prototype.regenerateRatio = 2;


//frequency limits
AudioElement.prototype.minFrequency = 1;
AudioElement.prototype.maxFrequency = 20000;


/**
 * Default context
 */
AudioElement.prototype.context = ctx;


/**
 * Properties.
 * A real values for audio-css declarations
 */
extend(AudioElement.prototype, {
	//number of channels
	channels: 2,

	//may be need to regulate speed of playing
	// sampleRate: ?,

	//1s by default
	//note that duration does not necessary stretch buffer content
	//FIXME: engage this, possibly it should show how many periods of the freq it should contain
	duration: 1,

	//audio buffer with source file
	source: null,

	//quality param of the sounding pulse
	//1 - perfectly stable, 0 - perfectly noisy
	quality: 1,

	//whether should we repeat this node
	repeat: true,

	//how often to repeat the signal contained in the buffer
	frequency: 440,

	//volume of the signal
	gain: 1,

	//playback rate
	scale: 1
});


/**
 * Temp method to get quality from the frequency range
 */
AudioElement.prototype.setRange = function (range) {
	var self = this;

	self.fRange = range;

	self.regenerate();
};


/**
 * Generate a new chunk for a buffer.
 * It should not be called too often, as it is expensive.
 * Only when the pattern became too obvious
 */
//TODO: this thingy should be done in worker, in main thread it creates glitches
AudioElement.prototype.regenerate = function () {
	var self = this;

	//throttle too often updating
	if (self.meditate) return;

	//set repeat
	self.source.loop = self.repeat;

	//check frequency - sometimes it is bullshitty
	if (self.frequency == null || self.frequency < 0) self.frequency = 0;


	//update osc frequency (if quality is big)
	self.oscillator.frequency.value = self.frequency;


	//get the duration of one period of self frequency, in samples
	var samplesPerPeriod = self.context.sampleRate / self.frequency;
	var periodsPerLength = self.quality === 1 ? Math.floor(self.frequency * self.buffer.duration) : Math.floor(self.frequency * self.buffer.duration);

	//beware
	if (periodsPerLength < 1) throw Error('periodsPerLength is too small, idk why');


	//set start/end so to repeat short(er) wave
	self.source.loopStart = 0;

	self.source.loopEnd = (i - 1) / self.source.buffer.sampleRate;


	//update the playback rate
	self.source.playbackRate = self.scale;

	//meditate
	self.meditate = true;
	setTimeout(function () {
		self.meditate = false;
	});

	return self;
};