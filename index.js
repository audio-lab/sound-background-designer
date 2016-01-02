/**
 * @module  sound-background-designer
 */


var AudioElement = require('./lib/audio-element');
var extend = require('xtend/mutable');
var inherits = require('inherits');
var css = require('mucss/css');
var Draggable = require('draggy');
var Resizable = require('resizable');


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

	//by click on the constructor - add new element
	self.audioElementsEl.addEventListener('dblclick', function (e) {
		var f = (e.offsetX/self.audioElementsEl.offsetWidth)*20000;

		self.createAudioElement(f);
	});


	//create formant editor

	//create waveform viewer

	//create spectrum viewer

	//create spirallogram viewer

}


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

	//save audioElement on the element
	audioElementEl.audioElement = audioElement;

	//place audioEl so to reflect the frequency
	var ratio = audioElement.frequency / audioElement.maxFrequency;
	css(audioElementEl, {
		// left: ratio * self.audioElementsEl.offsetWidth,
		// width:
	});

	//make audioElement draggable
	var draggable = new Draggable(audioElementEl, {
		within: self.audioElementsEl,
		threshold: 0
	});

	//freqs range of audio element
	var fRange = (audioElement.maxFrequency - audioElement.minFrequency);

	//set position acc to the frequency
	draggable.move(ratio * self.audioElementsEl.offsetWidth, 0);

	//update frequency on draggable being dragged
	draggable.on('drag', function (e) {
		var x = draggable.getCoords()[0];
		var f = fRange * x / self.audioElementsEl.offsetWidth;

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

	resizable.on('resize', function () {
		var w = audioElementEl.offsetWidth;
		var ratio = w / self.audioElementsEl.offsetWidth;
		var qRange = ratio * fRange;

		audioElement.setQuality(qRange);
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