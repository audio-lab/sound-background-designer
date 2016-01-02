/**
 * @module  sound-background-designer
 */


var AudioElement = require('./lib/audio-element');
var extend = require('xtend/mutable');
var inherits = require('inherits');
var css = require('mucss/css');
var Draggable = require('draggy');
var Resizable = require('resizable');
var registry = require('./lib/registry');


module.exports = Designer;



/**
 * Audio designer app
 */
function Designer (options) {
	var self = this;

	extend(self, options);

	//ensure element
	if (!self.element) self.element = document.createElement('div');
	self.element.classList.add('sound-background-designer');

	//init list of audioElements
	self.audioElements = [];

	//create DOM layout
	self.createDOM();

	//create first formant
	self.createAudioElement();
}


/**
 * Create DOM elements
 */
Designer.prototype.createDOM = function () {
	var self = this;

	//create audioElements container
	self.audioElementsEl = document.createElement('div');
	self.audioElementsEl.className = 'audio-elements';
	self.element.appendChild(self.audioElementsEl);
	self.audioElementsEl.setAttribute('title', 'Append new frequency');

	//by click on the constructor - add new element
	self.audioElementsEl.addEventListener('dblclick', function (e) {
		var f = w2f(e.offsetX, self.audioElementsEl.offsetWidth);

		self.createAudioElement(f);
	});


	//create formant editor

	//create waveform viewer

	//create spectrum viewer

	//create spirallogram viewer

}


/**
 * Update history to accord to the settings
 */
Designer.prototype.save = function () {
	//serialize it css-like
	//#a1 { source: saw, gain: n, quality: 0.1, frequency: n, detune: n, filter: ...}
	//#a2 { source: url(#a1),  }
};


/**
 * Load settings from passed url
 */
Designer.prototype.load = function (url) {
	//parse it css-like
};


/**
 * Create audioElement, add it to the table
 */
Designer.prototype.createAudioElement = function (f) {
	var self = this;

	var audioElement = new AudioElement({
		frequency: f || 440
	});

	self.audioElements.push(audioElement);

	//create DOM representation
	var audioElementEl = document.createElement('div');
	audioElementEl.classList.add('audio-element');
	self.audioElementsEl.appendChild(audioElementEl);
	audioElementEl.setAttribute('title', 'Shift frequency');

	//save audioElement on the element
	audioElementEl.audioElement = audioElement;
	audioElementEl.setAttribute('frequency', audioElement.frequency.toFixed(0) + 'hz');

	//make audioElement draggable
	var draggable = new Draggable(audioElementEl, {
		within: self.audioElementsEl,
		threshold: 0,
		css3: false,
		pin: [audioElementEl.offsetWidth / 2,0,audioElementEl.offsetWidth / 2, audioElementEl.offsetHeight ]
	});

	//set position acc to the frequency
	draggable.move(f2w(audioElement.frequency, self.audioElementsEl.offsetWidth), 0);

	//update frequency on draggable being dragged
	draggable.on('drag', function (e) {
		var x = draggable.getCoords()[0];
		var f = w2f(x, self.audioElementsEl.offsetWidth);

		audioElementEl.setAttribute('frequency', f.toFixed(0) + 'hz');

		//regenerate frequency
		//TODO: use logarithms here
		audioElement.frequency = f || 1;

		audioElement.regenerate();
	});


	//make thumbler resizable
	var resizable = new Resizable(audioElementEl, {
		// within: 'parent',
		handles: ['e', 'w']
	});
	resizable.handles.e.setAttribute('title', 'Change uncertainty');
	resizable.handles.w.setAttribute('title', 'Change uncertainty');

	resizable.on('resize', function () {
		var w = audioElementEl.offsetWidth;
		var left = draggable.getCoords()[0];

		var range = audioElementEl.offsetWidth - 20;

		var fLeft = w2f(left - range/2, self.audioElementsEl.offsetWidth);
		var fRight = w2f(left + range/2, self.audioElementsEl.offsetWidth);

		audioElement.setRange(fRight - fLeft);

		//set draggable pin
		draggable.pin = [audioElementEl.offsetWidth / 2,0,audioElementEl.offsetWidth / 2, audioElementEl.offsetHeight ];
	})

	//TODO: implement this using slidy - enhance and finish slidy
	//cover spirals etc, also debug with draggables
	// var mixerTrack = Slidy(mixerTrackEl, {
	// 	min: audioElement.minFrequency,
	// 	max: audioElement.maxFrequency,
	// 	value: audioElement.frequency,
	// 	orientation: 'horizontal',
	// 	picker: q('.mixer-thumb', mixerTrackEl)
	// });
}


var maxF = 20000, minF = 20;
var decades = Math.round(lg(maxF/minF));
var decadeOffset = lg(minF/10);


/** 10 log */
function lg (a) {
	return Math.log(a) / Math.log(10);
}


/** Map frequency to an x coord */
function f2w (f, w) {
	var decadeW = w / decades;
	return decadeW * (lg(f) - 1 - decadeOffset);
};


/** Map x coord to a frequency */
function w2f (x, w) {
	var decadeW = w / decades;
	return Math.pow(10, x/decadeW + 1 + decadeOffset);
};