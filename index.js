/**
 * @module  sound-background-designer
 */


var AudioElement = require('./lib/audio-element');
var extend = require('xtend/mutable');
var inherits = require('inherits');
var css = require('mucss/css');
var Draggable = require('draggy');
var Resizable = require('resizable');
var Slidy = require('../slidy');
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

	//set pallet a multiple slider
	self.slidy = new Slidy(self.audioElementsEl, {
		click: false,
		point: true,
		pickers: null,
		min: 0,
		max: 1,
		step: 0.0005,
		orientation: 'horizontal'
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
	audioElementEl.setAttribute('title', 'Shift frequency');

	//save audioElement on the element
	audioElementEl.audioElement = audioElement;

	//keep attr for rendering
	audioElementEl.setAttribute('frequency', audioElement.frequency.toFixed(0) + 'hz');


	//add slidy picker
	var resizable = Resizable(audioElementEl, {
		handles: ['e', 'w']
	});
	resizable.handles.e.setAttribute('title', 'Change uncertainty');
	resizable.handles.w.setAttribute('title', 'Change uncertainty');

	resizable.on('resize', function () {
		// var w = audioElementEl.offsetWidth;
		// var left = draggable.getCoords()[0];

		// var range = audioElementEl.offsetWidth - 20;

		// var fLeft = w2f(left - range/2, self.audioElementsEl.offsetWidth);
		// var fRight = w2f(left + range/2, self.audioElementsEl.offsetWidth);

		// audioElement.setRange(fRight - fLeft);
	});

	self.slidy.addPicker(audioElementEl, {
		value: f2w(audioElement.frequency, 1),
		change: function (value) {
			var f = w2f(value, 1);
			audioElementEl.setAttribute('frequency', f.toFixed(0) + 'hz');
			audioElement.frequency = f || 0;
			audioElement.regenerate();
		}
	});
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