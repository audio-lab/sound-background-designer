/**
 * AudioElement (Formant, or pulse - whatever).
 * An element, producing sound.
 * Hope will use in audio-css.
 * Takes buffer, provides source and a set of modifiers.
 * Exaclty as audio-css does.
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

	extend(self, options);

	//default untouched source
	self.source = table.sin(self.minFrequency * self.context.sampleRate);


	//buffer to be mixed
	//it is formed repeatedly
	//to accord to the style params
	self.buffer = ctx.createBuffer(self.channels, self.context.sampleRate, self.context.sampleRate);

	//create buffer source
	self.node = ctx.createBufferSource();
	self.node.buffer = self.buffer;
	self.node.loop = true;


	//connect source to destination
	self.node.connect(self.context.destination);
	self.node.start();


	//init buffer
	self.update();

	//create updating props interval
	self.updateInterval = setInterval(function () {
		self.update();
	}, 20);
}


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

	//TODO: replace with quality metric
	_freqRange: 0,

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
AudioElement.prototype.setQuality = function (range) {
	var self = this;

	self._freqRange = range;
};


/**
 * Generate a new chunk for a buffer
 * throttled
 */
AudioElement.prototype.update = function () {
	var self = this;

	//set repeat
	self.node.loop = self.repeat;

	//get the duration of one-period of self frequency, in samples
	var samplesNumber = self.context.sampleRate / self.frequency;

	//set start/end so to repeat short(er) wave
	//FIXME: calculate the loopEnd
	self.node.loopStart = 0;
	self.node.loopEnd = samplesNumber / self.context.sampleRate;

	//fill the buffer with the sine of the needed frequency
	//TODO: to implement quality, we need to pick source at randomized positions
	var freqRatio = self.source.length / samplesNumber;
	for (var i = 0, l = samplesNumber; i < l; i++) {
		var data1 = self.node.buffer.getChannelData(0);
		var data2 = self.node.buffer.getChannelData(1);

		data1[i] = self.source[~~(i * freqRatio + random(0,self._freqRange))];
		data2[i] = data1[i];
	}

	//update the playback rate
	self.node.playbackRate = self.scale;

	return self;
};