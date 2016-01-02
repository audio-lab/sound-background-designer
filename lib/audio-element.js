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
	self.source = table.sin(self.minFrequency * self.context.sampleRate);


	//buffer to be mixed
	//it is formed repeatedly
	//to accord to the style params
	self.buffer = ctx.createBuffer(self.channels, self.bufferDuration * self.context.sampleRate, self.context.sampleRate);

	//create buffer source
	self.node = ctx.createBufferSource();
	self.node.buffer = self.buffer;
	self.node.loop = true;

	//create oscillator source
	self.oscillator = ctx.createOscillator();
	self.oscillator.frequency.value = self.frequency;
	self.oscillator.connect(self.context.destination);
	self.oscillator.start();

	//connect source to destination
	// self.node.connect(self.context.destination);
	self.node.start();

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
	self.node.loop = self.repeat;

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
	self.node.loopStart = 0;

	//FIXME: there seems to be some bad sine cutting or something - high components are hearable. Seems we need to provide more qualitative sinewave

	//fill the buffer with the sine of the needed frequency
	//TODO: to implement quality, we need to pick source at randomized positions
	var freqRatio = self.source.length / samplesPerPeriod;
	var data1 = self.node.buffer.getChannelData(0);
	var data2 = self.node.buffer.getChannelData(1);


	//number of steps before end
	var endingSteps = 1;

	var range2 = self.fRange / 2 || 0;

	//fill stochastically the main body of buffer
	var i = 0, l = samplesPerPeriod * (periodsPerLength - endingSteps), n = 0;
	for (;;) {
		data1[i] = self.source[~~n % self.source.length];
		data2[i] = data1[i];

		//for the final of the wave, we should align n so to avoid jumps in loop
		if (i > l) {
			l += samplesPerPeriod * endingSteps;
			break;
		}

		//n is separate from the i, as it shows the randomish pick step
		//strangely, randoming by the uniq 2-freq noise is the same as by gaussian.
		n += freqRatio + (Math.random() > 0.5 ? -range2 : range2);
		// n += freqRatio + random(0, range2);
		// n += freqRatio + (i % 8 >= 4 ? range2 : -range2);

		i++;
	}

	//FIXME: this end-wave detection is shitty on grooves
	//final half-wave should exactly finish at zero
	//so wait for zero-crossing and finish loop
	/*for (var isPositive = data1[i] > 0; i < l; i++) {
		data1[i] = self.source[~~n % self.source.length];
		data2[i] = data1[i];
		n += freqRatio + random(0, 100);
		//if changed sign - set to 0, set loopEnd, quit
		if ( isPositive ? data1[i] < 0 : data1[i] > 0 ) {
			data1[i] = 0; data2[i] = 0;
			self.node.loopEnd = (i - 1) / self.node.buffer.sampleRate;
			break;
		}
	}*/

	//FIXME: we should recalculate buffer length needed for frequency, as it is detuned now
	self.node.loopEnd = (i - 1) / self.node.buffer.sampleRate;


	//update the playback rate
	self.node.playbackRate = self.scale;

	//meditate
	self.meditate = true;
	setTimeout(function () {
		self.meditate = false;
	});

	return self;
};