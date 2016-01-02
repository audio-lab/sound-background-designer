require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"audio-buffer":4,"audio-context":5,"audio-table":6,"distributions-normal-random/lib/number":13,"xtend/mutable":88}],2:[function(require,module,exports){
'use strict'

/**
 * Expose `arrayFlatten`.
 */
module.exports = flatten
module.exports.from = flattenFrom
module.exports.depth = flattenDepth
module.exports.fromDepth = flattenFromDepth

/**
 * Flatten an array.
 *
 * @param  {Array} array
 * @return {Array}
 */
function flatten (array) {
  if (!Array.isArray(array)) {
    throw new TypeError('Expected value to be an array')
  }

  return flattenFrom(array)
}

/**
 * Flatten an array-like structure.
 *
 * @param  {Array} array
 * @return {Array}
 */
function flattenFrom (array) {
  return flattenDown(array, [], Infinity)
}

/**
 * Flatten an array-like structure with depth.
 *
 * @param  {Array}  array
 * @param  {number} depth
 * @return {Array}
 */
function flattenDepth (array, depth) {
  if (!Array.isArray(array)) {
    throw new TypeError('Expected value to be an array')
  }

  return flattenFromDepth(array, depth)
}

/**
 * Flatten an array-like structure with depth.
 *
 * @param  {Array}  array
 * @param  {number} depth
 * @return {Array}
 */
function flattenFromDepth (array, depth) {
  if (typeof depth !== 'number') {
    throw new TypeError('Expected the depth to be a number')
  }

  return flattenDownDepth(array, [], depth)
}

/**
 * Flatten an array indefinitely.
 *
 * @param  {Array} array
 * @param  {Array} result
 * @return {Array}
 */
function flattenDown (array, result) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (Array.isArray(value)) {
      flattenDown(value, result)
    } else {
      result.push(value)
    }
  }

  return result
}

/**
 * Flatten an array with depth.
 *
 * @param  {Array}  array
 * @param  {Array}  result
 * @param  {number} depth
 * @return {Array}
 */
function flattenDownDepth (array, result, depth) {
  depth--

  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (depth > -1 && Array.isArray(value)) {
      flattenDownDepth(value, result, depth)
    } else {
      result.push(value)
    }
  }

  return result
}

},{}],3:[function(require,module,exports){
/*!
 * arrayify-compact <https://github.com/jonschlinkert/arrayify-compact>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var flatten = require('array-flatten');

module.exports = function(arr) {
  return flatten(!Array.isArray(arr) ? [arr] : arr)
    .filter(Boolean);
};

},{"array-flatten":2}],4:[function(require,module,exports){
/**
 * AudioBuffer class
 *
 * @module audio-buffer/buffer
 */


var isBuffer = require('is-buffer');
var b2ab = require('buffer-to-arraybuffer');
var isBrowser = require('is-browser');
var isAudioBuffer = require('is-audio-buffer');
var context = require('audio-context');


/**
 * @constructor
 *
 * @param {∀} data Any collection-like object
 */
function AudioBuffer (channels, data, sampleRate) {
	if (!(this instanceof AudioBuffer)) return new AudioBuffer(channels, data, sampleRate);

	//if one argument only - it is surely data or length
	//having new AudioBuffer(2) does not make sense as 2 - number of channels
	if (data == null) {
		data = channels;
		channels = null;
	}
	//audioCtx.createBuffer() - complacent arguments
	else {
		if (sampleRate != null) this.sampleRate = sampleRate;
		if (channels != null) this.numberOfChannels = channels;
	}


	//if number = create new array (spec's case - suppose that most widespread)
	if (typeof data === 'number') {
		this.data = [];
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			this.data.push(new AudioBuffer.FloatArray(data));
		}
	}
	//if other audio buffer passed - create fast clone of it
	//if WAA AudioBuffer - get buffer’s data (it is bounded)
	else if (isAudioBuffer(data)) {
		this.data = [];
		if (channels == null) this.numberOfChannels = data.numberOfChannels;
		if (sampleRate == null) this.sampleRate = data.sampleRate;

		//copy channel's data
		for (var i = 0, l = data.numberOfChannels; i < l; i++) {
			this.data.push(data.getChannelData(i).slice());
		}
	}
	//TypedArray, Buffer, DataView etc, or ArrayBuffer
	//NOTE: node 4.x+ detects Buffer as ArrayBuffer view
	else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer || isBuffer(data)) {
		this.data = [];
		if (isBuffer(data)) {
			data = b2ab(data);
		}
		if (!(data instanceof AudioBuffer.FloatArray)) {
			data = new AudioBuffer.FloatArray(data.buffer || data);
		}
		var len = data.length / this.numberOfChannels;
		for (var i = 0; i < this.numberOfChannels; i++ ) {
			//NOTE: we could’ve done subarray here to create a reference, but...
			//it will not be compatible with the WAA buffer - it cannot be a reference
			this.data.push(data.slice(i* len, i * len + len));
		}
	}
	//if array - parse channeled data
	else if (Array.isArray(data)) {
		this.data = [];
		//if separated data passed already
		if (data[0] instanceof Object) {
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				this.data.push(new AudioBuffer.FloatArray(data[i]));
			}
		}
		//plain array passed
		else {
			var len = Math.floor(data.length / this.numberOfChannels);
			for (var i = 0; i < this.numberOfChannels; i++ ) {
				var channelData = data.slice(i * len, i * len + len);
				//force channel data be numeric
				if (channelData[0] == null) channelData = len;
				this.data.push(new AudioBuffer.FloatArray(channelData));
			}
		}
	}
	//if ndarray, typedarray or other data-holder passed - redirect plain databuffer
	else if (data.data || data.buffer) {
		return new AudioBuffer(this.numberOfChannels, data.data || data.buffer, this.sampleRate);
	}
	//if none passed (radical weird case), or no type detected
	else {
		//it’d be strange use-case
		throw Error('Failed to create buffer: check provided arguments');
	}


	//set up params
	this.length = this.data[0].length;
	this.duration = this.length / this.sampleRate;


	//for browser - just return WAA buffer
	if (AudioBuffer.isWAA) {
		//create WAA buffer
		var audioBuffer = AudioBuffer.context.createBuffer(this.numberOfChannels, this.length, this.sampleRate);

		//fill channels
		for (var i = 0; i < this.numberOfChannels; i++) {
			audioBuffer.getChannelData(i).set(this.getChannelData(i));
		}

		return audioBuffer;
	}
};


/**
 * Default params
 */
AudioBuffer.prototype.numberOfChannels = 2;
AudioBuffer.prototype.sampleRate = 44100;


/** Type of storage to use */
AudioBuffer.FloatArray = Float32Array;


/** Set context, though can be redefined */
AudioBuffer.context = context;


/** Whether WebAudioBuffer should be created */
AudioBuffer.isWAA = isBrowser && context.createBuffer;


/**
 * Return data associated with the channel.
 *
 * @return {Array} Array containing the data
 */
AudioBuffer.prototype.getChannelData = function (channel) {
	//FIXME: ponder on this, whether we really need that rigorous check, it may affect performance
	if (channel > this.numberOfChannels || channel < 0 || channel == null) throw Error('Cannot getChannelData: channel number (' + channel + ') exceeds number of channels (' + this.numberOfChannels + ')');
	return this.data[channel];
};


/**
 * Place data to the destination buffer, starting from the position
 */
AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
	var data = this.data[channelNumber];
	if (startInChannel == null) startInChannel = 0;
	for (var i = startInChannel, j = 0; i < data.length && j < destination.length; i++, j++) {
		destination[j] = data[i];
	}
};


/**
 * Place data from the source to the channel, starting (in self) from the position
 * Clone of WAAudioBuffer
 */
AudioBuffer.prototype.copyToChannel = function (source, channelNumber, startInChannel) {
	var data = this.data[channelNumber];

	if (!startInChannel) startInChannel = 0;

	for (var i = startInChannel, j = 0; i < this.length && j < source.length; i++, j++) {
		data[i] = source[j];
	}
};


module.exports = AudioBuffer;
},{"audio-context":5,"buffer-to-arraybuffer":8,"is-audio-buffer":30,"is-browser":31,"is-buffer":32}],5:[function(require,module,exports){
var window = require('global/window');

var Context = window.AudioContext || window.webkitAudioContext;
if (Context) module.exports = new Context;

},{"global/window":23}],6:[function(require,module,exports){
/**
 * @module  audio-table
 */


module.exports = {
	sin: sin,
	cos: cos,
	saw: saw,
	triangle: triangle,
	square: square,
	delta: delta,
	pulse: pulse,
	noise: noise,
	// wave: require('./wave')
	// scale: require('./scale')
	fill: fill
};


var pi2 = Math.PI * 2;


function noise (arg) {
	return fill(arg, function (val) {
		return Math.random() * 2 - 1;
	})
};


function triangle (arg, scale) {
	if (scale == null) scale = 0.5;

	return fill(arg, function (val, i, data) {
		var l = data.length;
		var l2 = l / 2;
		var l2scale = l2 * scale;

		if (i < l2scale) return i / l2scale;
		if (i < l - l2scale) return 1 - (i - l2scale) * 2 / (l - l2);
		return 1 - (i - l - l2scale) / (l - l - l2scale);
	});
};


function cos (arg, wavenumber) {
	if (wavenumber == null) wavenumber = 1;

	return fill(arg, function(val, i, data) {
		return Math.cos(Math.PI * 2 * wavenumber * i / data.length)
	});
};


function sin (arg, wavenumber) {
	if (wavenumber == null) wavenumber = 1;

	return fill(arg, function(val, i, data) {
		return Math.sin(Math.PI * 2 * wavenumber * i / data.length)
	});
};


function delta (arg) {
	return fill(arg, function(val, i, data) {
		return i === 0 ? 1 : 0;
	});
};


function pulse (arg, weight) {
	if (weight == null) weight = 0;

	return fill(arg, function(val, i, data) {
		return i < Math.max(data.length * weight, 1) ? 1 : -1;
	});
}


function square (arg) {
	return pulse(arg, 0.5);
};


function saw (arg) {
	return fill(arg, function(val, i, data) {
		return 1 - 2 * i / (data.length - 1);
	});
};


/**
 * Fill passed array or create array and fill with the function
 * From the start/end positions
 */
function fill (arg, fn, start, end) {
	var table = getList(arg);

	if (start == null) start = 0;
	else if (start < 0) start += table.length;
	if (end == null) end = table.length;
	else if (end < 0) end += table.length;

	for (var i = start; i < end; i++) {
		table[i] = fn(table[i], i, table);
	}

	return table;
};


function getList (arg) {
	if (!arg) throw Error('Cannot create undefined wavetable. Please, pass the number or Array')
	if (arg.length != null) return arg;
	else return new Float32Array(arg)
};
},{}],7:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],8:[function(require,module,exports){
(function (Buffer){
(function(root) {
  var isArrayBufferSupported = (new Buffer(0)).buffer instanceof ArrayBuffer;

  var bufferToArrayBuffer = isArrayBufferSupported ? bufferToArrayBufferSlice : bufferToArrayBufferCycle;

  function bufferToArrayBufferSlice(buffer) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  function bufferToArrayBufferCycle(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
    }
    return ab;
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = bufferToArrayBuffer;
    }
    exports.bufferToArrayBuffer = bufferToArrayBuffer;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() {
      return bufferToArrayBuffer;
    });
  } else {
    root.bufferToArrayBuffer = bufferToArrayBuffer;
  }
})(this);

}).call(this,require("buffer").Buffer)

},{"buffer":9}],9:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":7,"ieee754":26,"isarray":10}],10:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],11:[function(require,module,exports){
/**
 * Define stateful property on an object
 */
module.exports = defineState;

var State = require('st8');


/**
 * Define stateful property on a target
 *
 * @param {object} target Any object
 * @param {string} property Property name
 * @param {object} descriptor State descriptor
 *
 * @return {object} target
 */
function defineState (target, property, descriptor, isFn) {
	//define accessor on a target
	if (isFn) {
		target[property] = function () {
			if (arguments.length) {
				return state.set(arguments[0]);
			}
			else {
				return state.get();
			}
		};
	}

	//define setter/getter on a target
	else {
		Object.defineProperty(target, property, {
			set: function (value) {
				return state.set(value);
			},
			get: function () {
				return state.get();
			}
		});
	}

	//define state controller
	var state = new State(descriptor, target);

	return target;
}
},{"st8":87}],12:[function(require,module,exports){
'use strict';

// FUNCTIONS //

var ln = Math.log;


// NORMAL TAIL //

/**
* FUNCTION dRanNormalTail( dMin, iNegative, rand )
*	Transform the tail of the normal distribution to
*	the unit interval and then use rejection technique
*	to generate standar normal variable.
*	Reference:
*		Marsaclia, G. (1964). Generating a Variable from the Tail
*		of the Normal Distribution. Technometrics, 6(1),
*		101–102. doi:10.1080/00401706.1964.10490150
*
* @param {Number} dMin - start value of the right tail
* @param {Boolean} iNegative - boolean indicating which side to evaluate
* @returns {Number} standard normal variable
*/
function dRanNormalTail( dMin, iNegative, rand ) {
	var x, y;
	do {
		x = ln( rand() ) / dMin;
		y = ln( rand() );
	} while ( -2 * y < x * x );
	return iNegative ? x - dMin : dMin - x;
} // end FUNCTION dRanNormalTail()


// EXPORTS //

module.exports = dRanNormalTail;

},{}],13:[function(require,module,exports){
'use strict';

// MODULES //

var dRanNormalTail = require( './dRanNormalTail.js' );


// FUNCTIONS //

var abs = Math.abs,
	exp = Math.exp,
	log = Math.log,
	pow = Math.pow,
	sqrt = Math.sqrt;


// CONSTANTS //

var TWO_P_32 = pow( 2, 32);


// GENERATE NORMAL RANDOM NUMBERS //

/**
* FUNCTION random( mu, sigma[, rand] )
*	Generates a random draw from a normal distribution
*	with parameters `mu` and `sigma`. Implementation
*	of the "Improved Ziggurat Method" by J. Doornik.
*	Reference:
*		Doornik, J. a. (2005).
*		An Improved Ziggurat Method to Generate Normal Random Samples.
*
* @param {Number} mu - mean parameter
* @param {Number} sigma - standard deviation
* @param {Function} [rand=Math.random] - random number generator
* @returns {Number} random draw from the specified distribution
*/
function random( mu, sigma, rand ) {

	if ( !rand ) {
		rand = Math.random;
	}

	var ZIGNOR_C = 128,/* number of blocks */
 		ZIGNOR_R = 3.442619855899, /* start of the right tail *
		/* (R * phi(R) + Pr(X>=R)) * sqrt(2\pi) */
		ZIGNOR_V = 9.91256303526217e-3,
		/* s_adZigX holds coordinates, such that each rectangle has
			same area; s_adZigR holds s_adZigX[i + 1] / s_adZigX[i] */
		s_adZigX = new Array( ZIGNOR_C + 1 ),
		s_adZigR = new Array( ZIGNOR_C ),
		i, f;

	f = exp( -0.5 * ZIGNOR_R * ZIGNOR_R );
	s_adZigX[0] = ZIGNOR_V / f; /* [0] is bottom block: V / f(R) */
	s_adZigX[1] = ZIGNOR_R;
	s_adZigX[ZIGNOR_C] = 0;
	for ( i = 2; i < ZIGNOR_C; i++ ) {
		s_adZigX[i] = sqrt( -2 * log( ZIGNOR_V / s_adZigX[i - 1] + f ) );
		f = exp( -0.5 * s_adZigX[i] * s_adZigX[i] );
	}
	for ( i = 0; i < ZIGNOR_C; i++ ) {
		s_adZigR[i] = s_adZigX[i + 1] / s_adZigX[i];
	}
	var x, u, f0, f1;
	for (;;) {
		u = 2 * rand() - 1;
		i = TWO_P_32 * rand() & 0x7F;
		/* first try the rectangular boxes */
		if ( abs(u) < s_adZigR[i] ) {
			return mu + sigma * u * s_adZigX[i];
		}
		/* bottom box: sample from the tail */
		if ( i === 0 ) {
			return mu + sigma * dRanNormalTail( ZIGNOR_R, u < 0, rand );
		}
		/* is this a sample from the wedges? */
		x = u * s_adZigX[i];
		f0 = exp( -0.5 * ( s_adZigX[i] * s_adZigX[i] - x * x ) );
		f1 = exp( -0.5 * ( s_adZigX[i+1] * s_adZigX[i+1] - x * x ) );
		if ( f1 + rand() * (f0 - f1) < 1.0 ) {
			return mu + sigma * x;
		}
	}
} // end FUNCTION random()


// EXPORTS //

module.exports = random;

},{"./dRanNormalTail.js":12}],14:[function(require,module,exports){
/**
 * Simple draggable component
 *
 * @module draggy
 */


//work with css
var css = require('mucss/css');
var parseCSSValue = require('mucss/parse-value');
var selection = require('mucss/selection');
var offsets = require('mucss/offset');
var getTranslate = require('mucss/translate');
var intersect = require('intersects');

//events
var on = require('emmy/on');
var off = require('emmy/off');
var emit = require('emmy/emit');
var Emitter = require('events');
var getClientX = require('get-client-xy').x;
var getClientY = require('get-client-xy').y;

//utils
var isArray = require('is-array');
var isNumber = require('mutype/is-number');
var isString = require('mutype/is-string');
var isFn = require('is-function');
var defineState = require('define-state');
var extend = require('xtend/mutable');
var round = require('mumath/round');
var between = require('mumath/between');
var loop = require('mumath/loop');
var getUid = require('get-uid');
var q = require('queried');


var win = window, doc = document, root = doc.documentElement;


/**
 * Draggable controllers associated with elements.
 *
 * Storing them on elements is
 * - leak-prone,
 * - pollutes element’s namespace,
 * - requires some artificial key to store,
 * - unable to retrieve controller easily.
 *
 * That is why weakmap.
 */
var draggableCache = Draggable.cache = new WeakMap;



/**
 * Make an element draggable.
 *
 * @constructor
 *
 * @param {HTMLElement} target An element whether in/out of DOM
 * @param {Object} options An draggable options
 *
 * @return {HTMLElement} Target element
 */
function Draggable(target, options) {
	if (!(this instanceof Draggable)) {
		return new Draggable(target, options);
	}

	var self = this;

	//get unique id for instance
	//needed to track event binders
	self.id = getUid();
	self._ns = '.draggy_' + self.id;

	//save element passed
	self.element = target;

	draggableCache.set(target, self);

	//define mode of drag
	defineState(self, 'css3', self.css3);
	self.css3 = true;

	//define state behaviour
	defineState(self, 'state', self.state);

	//define axis behaviour
	defineState(self, 'axis', self.axis);
	self.axis = null;

	//preset handles
	self.currentHandles = [];

	//take over options
	extend(self, options);

	//define handle
	if (!self.handle) {
		self.handle = self.element;
	}

	//setup droppable
	if (self.droppable) {
		self.initDroppable();
	}

	//try to calc out basic limits
	self.update();

	//go to initial state
	self.state = 'idle';
}


/** Inherit draggable from Emitter */
var proto = Draggable.prototype = Object.create(Emitter.prototype);


/** Init droppable "plugin" */
proto.initDroppable = function () {
	var self = this;

	on(self, 'dragstart', function () {
		var self = this;
		self.dropTargets = q.all(self.droppable);
	});

	on(self, 'drag', function () {
		var self = this;

		if (!self.dropTargets) {
			return;
		}

		var selfRect = offsets(self.element);

		self.dropTargets.forEach(function (dropTarget) {
			var targetRect = offsets(dropTarget);

			if (intersect(selfRect, targetRect, self.droppableTolerance)) {
				if (self.droppableClass) {
					dropTarget.classList.add(self.droppableClass);
				}
				if (!self.dropTarget) {
					self.dropTarget = dropTarget;

					emit(self, 'dragover', dropTarget);
					emit(dropTarget, 'dragover', self);
				}
			}
			else {
				if (self.dropTarget) {
					emit(self, 'dragout', dropTarget);
					emit(dropTarget, 'dragout', self);

					self.dropTarget = null;
				}
				if (self.droppableClass) {
					dropTarget.classList.remove(self.droppableClass);
				}
			}
		});
	});

	on(self, 'dragend', function () {
		var self = this;

		//emit drop, if any
		if (self.dropTarget) {
			emit(self.dropTarget, 'drop', self);
			emit(self, 'drop', self.dropTarget);
			self.dropTarget.classList.remove(self.droppableClass);
			self.dropTarget = null;
		}
	});
};


/**
 * Draggable behaviour
 * @enum {string}
 * @default is 'idle'
 */
proto.state = {
	//idle
	_: {
		before: function () {
			var self = this;

			self.element.classList.add('draggy-idle');

			//emit drag evts on element
			emit(self.element, 'idle', null, true);
			self.emit('idle');

			on(doc, 'mousedown' + self._ns + ' touchstart' + self._ns, function (e) {
				//ignore non-draggy events
				if (!e.draggies) {
					return;
				}

				//ignore dragstart for not registered draggies
				if (e.draggies.indexOf(self) < 0) {
					return;
				}

				//if target is focused - ignore drag
				if (doc.activeElement === e.target) {
					return;
				}

				// e.preventDefault();

				//multitouch has multiple starts
				self.setTouch(e);

				//update movement params
				self.update(e);

				//go to threshold state
				self.state = 'threshold';
			});
		},
		after: function () {
			var self = this;

			self.element.classList.remove('draggy-idle');

			off(doc, self._ns);

			//set up tracking
			if (self.release) {
				self._trackingInterval = setInterval(function (e) {
					var now = Date.now();
					var elapsed = now - self.timestamp;

					//get delta movement since the last track
					var dX = self.prevX - self.frame[0];
					var dY = self.prevY - self.frame[1];
					self.frame[0] = self.prevX;
					self.frame[1] = self.prevY;

					var delta = Math.sqrt(dX * dX + dY * dY);

					//get speed as average of prev and current (prevent div by zero)
					var v = Math.min(self.velocity * delta / (1 + elapsed), self.maxSpeed);
					self.speed = 0.8 * v + 0.2 * self.speed;

					//get new angle as a last diff
					//NOTE: vector average isn’t the same as speed scalar average
					self.angle = Math.atan2(dY, dX);

					self.emit('track');

					return self;
				}, self.framerate);
			}
		}
	},

	threshold: {
		before: function () {
			var self = this;

			//ignore threshold state, if threshold is none
			if (isZeroArray(self.threshold)) {
				self.state = 'drag';
				return;
			}

			self.element.classList.add('draggy-threshold');

			//emit drag evts on element
			self.emit('threshold');
			emit(self.element, 'threshold');

			//listen to doc movement
			on(doc, 'touchmove' + self._ns + ' mousemove' + self._ns, function (e) {
				e.preventDefault();

				//compare movement to the threshold
				var clientX = getClientX(e, self.touchIdx);
				var clientY = getClientY(e, self.touchIdx);
				var difX = self.prevMouseX - clientX;
				var difY = self.prevMouseY - clientY;

				if (difX < self.threshold[0] || difX > self.threshold[2] || difY < self.threshold[1] || difY > self.threshold[3]) {
					self.update(e);
					self.state = 'drag';
				}
			});
			on(doc, 'mouseup' + self._ns + ' touchend' + self._ns + '', function (e) {
				e.preventDefault();

				//forget touches
				self.resetTouch();

				self.state = 'idle';
			});
		},

		after: function () {
			var self = this;

			self.element.classList.remove('draggy-threshold');

			off(doc, self._ns);
		}
	},

	drag: {
		before: function () {
			var self = this;

			//reduce dragging clutter
			selection.disable(root);

			self.element.classList.add('draggy-drag');

			//emit drag evts on element
			self.emit('dragstart');
			emit(self.element, 'dragstart', null, true);

			//emit drag events on self
			self.emit('drag');
			emit(self.element, 'drag', null, true);

			//stop drag on leave
			on(doc, 'touchend' + self._ns + ' mouseup' + self._ns + ' mouseleave' + self._ns, function (e) {
				e.preventDefault();

				//forget touches - dragend is called once
				self.resetTouch();

				//manage release movement
				if (self.speed > 1) {
					self.state = 'release';
				}

				else {
					self.state = 'idle';
				}
			});

			//move via transform
			on(doc, 'touchmove' + self._ns + ' mousemove' + self._ns, function (e) {
				self.drag(e);
			});
		},

		after: function () {
			var self = this;

			//enable document interactivity
			selection.enable(root);

			self.element.classList.remove('draggy-drag');

			//emit dragend on element, this
			self.emit('dragend');
			emit(self.element, 'dragend', null, true);

			//unbind drag events
			off(doc, self._ns);

			clearInterval(self._trackingInterval);
		}
	},

	release: {
		before: function () {
			var self = this;

			self.element.classList.add('draggy-release');

			//enter animation mode
			clearTimeout(self._animateTimeout);

			//set proper transition
			css(self.element, {
				'transition': (self.releaseDuration) + 'ms ease-out ' + (self.css3 ? 'transform' : 'position')
			});

			//plan leaving anim mode
			self._animateTimeout = setTimeout(function () {
				self.state = 'idle';
			}, self.releaseDuration);


			//calc target point & animate to it
			self.move(
				self.prevX + self.speed * Math.cos(self.angle),
				self.prevY + self.speed * Math.sin(self.angle)
			);

			self.speed = 0;
			self.emit('track');
		},

		after: function () {
			var self = this;

			self.element.classList.remove('draggy-release');

			css(this.element, {
				'transition': null
			});
		}
	},

	destroy: function () {
		var self = this;
	}
};


/** Drag handler. Needed to provide drag movement emulation via API */
proto.drag = function (e) {
	var self = this;

	e.preventDefault();

	var mouseX = getClientX(e, self.touchIdx),
		mouseY = getClientY(e, self.touchIdx);

	//calc mouse movement diff
	var diffMouseX = mouseX - self.prevMouseX,
		diffMouseY = mouseY - self.prevMouseY;

	//absolute mouse coordinate
	var mouseAbsX = mouseX + win.pageXOffset,
		mouseAbsY = mouseY + win.pageYOffset;

	//calc sniper offset, if any
	if (e.ctrlKey || e.metaKey) {
		self.sniperOffsetX += diffMouseX * self.sniperSlowdown;
		self.sniperOffsetY += diffMouseY * self.sniperSlowdown;
	}

	//calc movement x and y
	//take absolute placing as it is the only reliable way (2x proved)
	var x = (mouseAbsX - self.initOffsetX) - self.innerOffsetX - self.sniperOffsetX,
		y = (mouseAbsY - self.initOffsetY) - self.innerOffsetY - self.sniperOffsetY;

	//move element
	self.move(x, y);

	//save prevClientXY for calculating diff
	self.prevMouseX = mouseX;
	self.prevMouseY = mouseY;

	//emit drag
	self.emit('drag');
	emit(self.element, 'drag', null, true);
};


/** Current number of draggable touches */
var touches = 0;


/** Manage touches */
proto.setTouch = function (e) {
	if (!e.touches || this.isTouched()) return this;

	//current touch index
	this.touchIdx = touches;
	touches++;

	return this;
};
proto.resetTouch = function () {
	touches = 0;
	this.touchIdx = null;

	return this;
};
proto.isTouched = function () {
	return this.touchIdx !== null;
};


/** Index to fetch touch number from event */
proto.touchIdx = null;


/**
 * Update movement limits.
 * Refresh self.withinOffsets and self.limits.
 */
proto.update = function (e) {
	var self = this;

	//update handles
	self.currentHandles.forEach(function (handle) {
		off(handle, self._ns);
	});

	var cancelEls = q.all(self.cancel);

	self.currentHandles = q.all(self.handle);

	self.currentHandles.forEach(function (handle) {
		on(handle, 'mousedown' + self._ns + ' touchstart' + self._ns, function (e) {
			//mark event as belonging to the draggy
			if (!e.draggies) {
				e.draggies = [];
			}
			//ignore draggies containing other draggies
			if (e.draggies.some(function (draggy) {
				return self.element.contains(draggy.element);
			})) {
				return;
			}
			//ignore events happened within cancelEls
			if (cancelEls.some(function (cancelEl) {
				return cancelEl.contains(e.target);
			})) {
				return;
			}

			//register draggy
			e.draggies.push(self);
		});
	});


	//initial translation offsets
	var initXY = self.getCoords();

	//calc initial coords
	self.prevX = initXY[0];
	self.prevY = initXY[1];

	//container rect might be outside the vp, so calc absolute offsets
	//zero-position offsets, with translation(0,0)
	var selfOffsets = offsets(self.element);
	self.initOffsetX = selfOffsets.left - self.prevX;
	self.initOffsetY = selfOffsets.top - self.prevY;
	self.offsets = selfOffsets;

	//handle parent case
	var within = self.within;
	if (self.within === 'parent') {
		within = self.element.parentNode;
	}
	within = within || doc;

	//absolute offsets of a container
	var withinOffsets = offsets(within);
	self.withinOffsets = withinOffsets;


	//calculate movement limits - pin width might be wider than constraints
	self.overflowX = self.pin.width - withinOffsets.width;
	self.overflowY = self.pin.height - withinOffsets.height;
	self.limits = {
		left: withinOffsets.left - self.initOffsetX - self.pin[0] - (self.overflowX < 0 ? 0 : self.overflowX),
		top: withinOffsets.top - self.initOffsetY - self.pin[1] - (self.overflowY < 0 ? 0 : self.overflowY),
		right: self.overflowX > 0 ? 0 : withinOffsets.right - self.initOffsetX - self.pin[2],
		bottom: self.overflowY > 0 ? 0 : withinOffsets.bottom - self.initOffsetY - self.pin[3]
	};

	//preset inner offsets
	self.innerOffsetX = self.pin[0];
	self.innerOffsetY = self.pin[1];

	var selfClientRect = self.element.getBoundingClientRect();

	//if event passed - update acc to event
	if (e) {
		//take last mouse position from the event
		self.prevMouseX = getClientX(e, self.touchIdx);
		self.prevMouseY = getClientY(e, self.touchIdx);

		//if mouse is within the element - take offset normally as rel displacement
		self.innerOffsetX = -selfClientRect.left + getClientX(e, self.touchIdx);
		self.innerOffsetY = -selfClientRect.top + getClientY(e, self.touchIdx);
	}
	//if no event - suppose pin-centered event
	else {
		//take mouse position & inner offset as center of pin
		var pinX = (self.pin[0] + self.pin[2] ) * 0.5;
		var pinY = (self.pin[1] + self.pin[3] ) * 0.5;
		self.prevMouseX = selfClientRect.left + pinX;
		self.prevMouseY = selfClientRect.top + pinY;
		self.innerOffsetX = pinX;
		self.innerOffsetY = pinY;
	}

	//set initial kinetic props
	self.speed = 0;
	self.amplitude = 0;
	self.angle = 0;
	self.timestamp = +new Date();
	self.frame = [self.prevX, self.prevY];

	//set sniper offset
	self.sniperOffsetX = 0;
	self.sniperOffsetY = 0;
};


/**
 * Way of placement:
 * - position === false (slower but more precise and cross-browser)
 * - translate3d === true (faster but may cause blurs on linux systems)
 */
proto.css3 = {
	_: function () {
		css(this.element, 'position', 'absolute');
		this.getCoords = function () {
			// return [this.element.offsetLeft, this.element.offsetTop];
			return [parseCSSValue(css(this.element,'left')), parseCSSValue(css(this.element, 'top'))];
		};

		this.setCoords = function (x, y) {
			css(this.element, {
				left: x,
				top: y
			});

			//save prev coords to use as a start point next time
			this.prevX = x;
			this.prevY = y;
		};
	},

	//undefined placing is treated as translate3d
	true: function () {
		this.getCoords  = function () {
			return getTranslate(this.element) || [0,0];
		};

		this.setCoords = function (x, y) {
			x = round(x, this.precision);
			y = round(y, this.precision);

			css(this.element, 'transform', ['translate3d(', x, 'px,', y, 'px, 0)'].join(''));

			//save prev coords to use as a start point next time
			this.prevX = x;
			this.prevY = y;
		};
	}
};


/**
 * Restricting container
 * @type {Element|object}
 * @default doc.documentElement
 */
proto.within = doc;


/** Handle to drag */
proto.handle;


Object.defineProperties(proto, {
	/**
	 * Which area of draggable should not be outside the restriction area.
	 * @type {(Array|number)}
	 * @default [0,0,this.element.offsetWidth, this.element.offsetHeight]
	 */
	pin: {
		set: function (value) {
			if (isArray(value)) {
				if (value.length === 2) {
					this._pin = [value[0], value[1], value[0], value[1]];
				} else if (value.length === 4) {
					this._pin = value;
				}
			}

			else if (isNumber(value)) {
				this._pin = [value, value, value, value];
			}

			else {
				this._pin = value;
			}

			//calc pin params
			this._pin.width = this._pin[2] - this._pin[0];
			this._pin.height = this._pin[3] - this._pin[1];
		},

		get: function () {
			if (this._pin) return this._pin;

			//returning autocalculated pin, if private pin is none
			var pin = [0,0, this.offsets.width, this.offsets.height];
			pin.width = this.offsets.width;
			pin.height = this.offsets.height;
			return pin;
		}
	},

	/** Avoid initial mousemove */
	threshold: {
		set: function (val) {
			if (isNumber(val)) {
				this._threshold = [-val*0.5, -val*0.5, val*0.5, val*0.5];
			} else if (val.length === 2) {
				//Array(w,h)
				this._threshold = [-val[0]*0.5, -val[1]*0.5, val[0]*0.5, val[1]*0.5];
			} else if (val.length === 4) {
				//Array(x1,y1,x2,y2)
				this._threshold = val;
			} else if (isFn(val)) {
				//custom val funciton
				this._threshold = val();
			} else {
				this._threshold = [0,0,0,0];
			}
		},

		get: function () {
			return this._threshold || [0,0,0,0];
		}
	}
});



/**
 * For how long to release movement
 *
 * @type {(number|false)}
 * @default false
 * @todo
 */
proto.release = false;
proto.releaseDuration = 500;
proto.velocity = 1000;
proto.maxSpeed = 250;
proto.framerate = 50;


/** To what extent round position */
proto.precision = 1;


/** Droppable params */
proto.droppable = null;
proto.droppableTolerance = 0.5;
proto.droppableClass = null;


/** Slow down movement by pressing ctrl/cmd */
proto.sniper = true;


/** How much to slow sniper drag */
proto.sniperSlowdown = .85;


/**
 * Restrict movement by axis
 *
 * @default undefined
 * @enum {string}
 */
proto.axis = {
	_: function () {
		this.move = function (x, y) {
			var limits = this.limits;

			if (this.repeat) {
				var w = (limits.right - limits.left);
				var h = (limits.bottom - limits.top);
				var oX = - this.initOffsetX + this.withinOffsets.left - this.pin[0] - Math.max(0, this.overflowX);
				var oY = - this.initOffsetY + this.withinOffsets.top - this.pin[1] - Math.max(0, this.overflowY);
				if (this.repeat === 'x') {
					x = loop(x - oX, w) + oX;
				}
				else if (this.repeat === 'y') {
					y = loop(y - oY, h) + oY;
				}
				else {
					x = loop(x - oX, w) + oX;
					y = loop(y - oY, h) + oY;
				}
			}

			x = between(x, limits.left, limits.right);
			y = between(y, limits.top, limits.bottom);

			this.setCoords(x, y);
		};
	},
	x: function () {
		this.move = function (x, y) {
			var limits = this.limits;

			if (this.repeat) {
				var w = (limits.right - limits.left);
				var oX = - this.initOffsetX + this.withinOffsets.left - this.pin[0] - Math.max(0, this.overflowX);
				x = loop(x - oX, w) + oX;
			} else {
				x = between(x, limits.left, limits.right);
			}

			this.setCoords(x, this.prevY);
		};
	},
	y: function () {
		this.move = function (x, y) {
			var limits = this.limits;

			if (this.repeat) {
				var h = (limits.bottom - limits.top);
				var oY = - this.initOffsetY + this.withinOffsets.top - this.pin[1] - Math.max(0, this.overflowY);
				y = loop(y - oY, h) + oY;
			} else {
				y = between(y, limits.top, limits.bottom);
			}

			this.setCoords(this.prevX, y);
		};
	}
};


/** Repeat movement by one of axises */
proto.repeat = false;


/** Check whether arr is filled with zeros */
function isZeroArray(arr) {
	if (!arr[0] && !arr[1] && !arr[2] && !arr[3]) return true;
}



/** Clean all memory-related things */
proto.destroy = function () {
	var self = this;

	self.currentHandles.forEach(function (handle) {
		off(handle, self._ns);
	});

	self.state = 'destroy';

	clearTimeout(self._animateTimeout);

	off(doc, self._ns);
	off(self.element, self._ns);


	self.element = null;
	self.within = null;
};



module.exports = Draggable;
},{"define-state":11,"emmy/emit":15,"emmy/off":17,"emmy/on":18,"events":19,"get-client-xy":20,"get-uid":22,"intersects":28,"is-array":29,"is-function":33,"mucss/css":37,"mucss/offset":42,"mucss/parse-value":44,"mucss/selection":48,"mucss/translate":49,"mumath/between":50,"mumath/loop":51,"mumath/round":53,"mutype/is-number":65,"mutype/is-string":70,"queried":74,"xtend/mutable":88}],15:[function(require,module,exports){
/**
 * @module emmy/emit
 */
var icicle = require('icicle');
var slice = require('sliced');
var isString = require('mutype/is-string');
var isNode = require('mutype/is-node');
var isEvent = require('mutype/is-event');
var listeners = require('./listeners');


/**
 * A simple wrapper to handle stringy/plain events
 */
module.exports = function(target, evt){
	if (!target) return;

	var args = arguments;
	if (isString(evt)) {
		args = slice(arguments, 2);
		evt.split(/\s+/).forEach(function(evt){
			evt = evt.split('.')[0];

			emit.apply(this, [target, evt].concat(args));
		});
	} else {
		return emit.apply(this, args);
	}
};


/** detect env */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;


/**
 * Emit an event, optionally with data or bubbling
 * Accept only single elements/events
 *
 * @param {string} eventName An event name, e. g. 'click'
 * @param {*} data Any data to pass to event.details (DOM) or event.data (elsewhere)
 * @param {bool} bubbles Whether to trigger bubbling event (DOM)
 *
 *
 * @return {target} a target
 */
function emit(target, eventName, data, bubbles){
	var emitMethod, evt = eventName;

	//Create proper event for DOM objects
	if (isNode(target) || target === win) {
		//NOTE: this doesnot bubble on off-DOM elements

		if (isEvent(eventName)) {
			evt = eventName;
		} else {
			//IE9-compliant constructor
			evt = doc.createEvent('CustomEvent');
			evt.initCustomEvent(eventName, bubbles, true, data);

			//a modern constructor would be:
			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })
		}

		emitMethod = target.dispatchEvent;
	}

	//create event for jQuery object
	else if ($ && target instanceof $) {
		//TODO: decide how to pass data
		evt = $.Event( eventName, data );
		evt.detail = data;

		//FIXME: reference case where triggerHandler needed (something with multiple calls)
		emitMethod = bubbles ? targte.trigger : target.triggerHandler;
	}

	//detect target events
	else {
		//emit - default
		//trigger - jquery
		//dispatchEvent - DOM
		//raise - node-state
		//fire - ???
		emitMethod = target['dispatchEvent'] || target['emit'] || target['trigger'] || target['fire'] || target['raise'];
	}


	var args = slice(arguments, 2);


	//use locks to avoid self-recursion on objects wrapping this method
	if (emitMethod) {
		if (icicle.freeze(target, 'emit' + eventName)) {
			//use target event system, if possible
			emitMethod.apply(target, [evt].concat(args));
			icicle.unfreeze(target, 'emit' + eventName);

			return target;
		}

		//if event was frozen - probably it is emitter instance
		//so perform normal callback
	}


	//fall back to default event system
	var evtCallbacks = listeners(target, evt);

	//copy callbacks to fire because list can be changed by some callback (like `off`)
	var fireList = slice(evtCallbacks);
	for (var i = 0; i < fireList.length; i++ ) {
		fireList[i] && fireList[i].apply(target, args);
	}

	return target;
}
},{"./listeners":16,"icicle":25,"mutype/is-event":62,"mutype/is-node":64,"mutype/is-string":70,"sliced":85}],16:[function(require,module,exports){
/**
 * A storage of per-target callbacks.
 * WeakMap is the most safe solution.
 *
 * @module emmy/listeners
 */


/**
 * Property name to provide on targets.
 *
 * Can’t use global WeakMap -
 * it is impossible to provide singleton global cache of callbacks for targets
 * not polluting global scope. So it is better to pollute target scope than the global.
 *
 * Otherwise, each emmy instance will create it’s own cache, which leads to mess.
 *
 * Also can’t use `._events` property on targets, as it is done in `events` module,
 * because it is incompatible. Emmy targets universal events wrapper, not the native implementation.
 *
 */
//FIXME: new npm forces flat modules structure, so weakmaps are better providing that there’s the one emmy across the project.
var cbPropName = '_callbacks';


/**
 * Get listeners for the target/evt (optionally).
 *
 * @param {object} target a target object
 * @param {string}? evt an evt name, if undefined - return object with events
 *
 * @return {(object|array)} List/set of listeners
 */
function listeners(target, evt, tags){
	var cbs = target[cbPropName];
	var result;

	if (!evt) {
		result = cbs || {};

		//filter cbs by tags
		if (tags) {
			var filteredResult = {};
			for (var evt in result) {
				filteredResult[evt] = result[evt].filter(function (cb) {
					return hasTags(cb, tags);
				});
			}
			result = filteredResult;
		}

		return result;
	}

	if (!cbs || !cbs[evt]) {
		return [];
	}

	result = cbs[evt];

	//if there are evt namespaces specified - filter callbacks
	if (tags && tags.length) {
		result = result.filter(function (cb) {
			return hasTags(cb, tags);
		});
	}

	return result;
}


/**
 * Remove listener, if any
 */
listeners.remove = function(target, evt, cb, tags){
	//get callbacks for the evt
	var evtCallbacks = target[cbPropName];
	if (!evtCallbacks || !evtCallbacks[evt]) return false;

	var callbacks = evtCallbacks[evt];

	//if tags are passed - make sure callback has some tags before removing
	if (tags && tags.length && !hasTags(cb, tags)) return false;

	//remove specific handler
	for (var i = 0; i < callbacks.length; i++) {
		//once method has original callback in .cb
		if (callbacks[i] === cb || callbacks[i].fn === cb) {
			callbacks.splice(i, 1);
			break;
		}
	}
};


/**
 * Add a new listener
 */
listeners.add = function(target, evt, cb, tags){
	if (!cb) return;

	var targetCallbacks = target[cbPropName];

	//ensure set of callbacks for the target exists
	if (!targetCallbacks) {
		targetCallbacks = {};
		Object.defineProperty(target, cbPropName, {
			value: targetCallbacks
		});
	}

	//save a new callback
	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(cb);

	//save ns for a callback, if any
	if (tags && tags.length) {
		cb._ns = tags;
	}
};


/** Detect whether an cb has at least one tag from the list */
function hasTags(cb, tags){
	if (cb._ns) {
		//if cb is tagged with a ns and includes one of the ns passed - keep it
		for (var i = tags.length; i--;){
			if (cb._ns.indexOf(tags[i]) >= 0) return true;
		}
	}
}


module.exports = listeners;
},{}],17:[function(require,module,exports){
/**
 * @module emmy/off
 */
module.exports = off;

var icicle = require('icicle');
var slice = require('sliced');
var listeners = require('./listeners');
var isArray = require('mutype/is-array');


/**
 * Remove listener[s] from the target
 *
 * @param {[type]} evt [description]
 * @param {Function} fn [description]
 *
 * @return {[type]} [description]
 */
function off(target, evt, fn) {
	if (!target) return target;

	var callbacks, i;

	//unbind all listeners if no fn specified
	if (fn === undefined) {
		var args = slice(arguments, 1);

		//try to use target removeAll method, if any
		var allOff = target['removeAll'] || target['removeAllListeners'];

		//call target removeAll
		if (allOff) {
			allOff.apply(target, args);
		}


		//then forget own callbacks, if any

		//unbind all evts
		if (!evt) {
			callbacks = listeners(target);
			for (evt in callbacks) {
				off(target, evt);
			}
		}
		//unbind all callbacks for an evt
		else {
			evt = '' + evt;

			//invoke method for each space-separated event from a list
			evt.split(/\s+/).forEach(function (evt) {
				var evtParts = evt.split('.');
				evt = evtParts.shift();
				callbacks = listeners(target, evt, evtParts);

				//returned array of callbacks (as event is defined)
				if (evt) {
					var obj = {};
					obj[evt] = callbacks;
					callbacks = obj;
				}

				//for each group of callbacks - unbind all
				for (var evtName in callbacks) {
					slice(callbacks[evtName]).forEach(function (cb) {
						off(target, evtName, cb);
					});
				}
			});
		}

		return target;
	}


	//target events (string notation to advanced_optimizations)
	var offMethod = target['removeEventListener'] || target['removeListener'] || target['detachEvent'] || target['off'];

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function (evt) {
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target `off`, if possible
		if (offMethod) {
			//avoid self-recursion from the outside
			if (icicle.freeze(target, 'off' + evt)) {
				offMethod.call(target, evt, fn);
				icicle.unfreeze(target, 'off' + evt);
			}

			//if it’s frozen - ignore call
			else {
				return target;
			}
		}

		if (fn.closedCall) fn.closedCall = false;

		//forget callback
		listeners.remove(target, evt, fn, evtParts);
	});


	return target;
}
},{"./listeners":16,"icicle":25,"mutype/is-array":58,"sliced":85}],18:[function(require,module,exports){
/**
 * @module emmy/on
 */


var icicle = require('icicle');
var listeners = require('./listeners');
var isObject = require('mutype/is-object');

module.exports = on;


/**
 * Bind fn to a target.
 *
 * @param {*} targte A single target to bind evt
 * @param {string} evt An event name
 * @param {Function} fn A callback
 * @param {Function}? condition An optional filtering fn for a callback
 *                              which accepts an event and returns callback
 *
 * @return {object} A target
 */
function on(target, evt, fn){
	if (!target) return target;

	//consider object of events
	if (isObject(evt)) {
		for(var evtName in evt) {
			on(target, evtName, evt[evtName]);
		}
		return target;
	}

	//get target `on` method, if any
	//prefer native-like method name
	//user may occasionally expose `on` to the global, in case of browserify
	//but it is unlikely one would replace native `addEventListener`
	var onMethod =  target['addEventListener'] || target['addListener'] || target['attachEvent'] || target['on'];

	var cb = fn;

	evt = '' + evt;

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function(evt){
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target event system, if possible
		if (onMethod) {
			//avoid self-recursions
			//if it’s frozen - ignore call
			if (icicle.freeze(target, 'on' + evt)){
				onMethod.call(target, evt, cb);
				icicle.unfreeze(target, 'on' + evt);
			}
			else {
				return target;
			}
		}

		//save the callback anyway
		listeners.add(target, evt, cb, evtParts);
	});

	return target;
}


/**
 * Wrap an fn with condition passing
 */
on.wrap = function(target, evt, fn, condition){
	var cb = function() {
		if (condition.apply(target, arguments)) {
			return fn.apply(target, arguments);
		}
	};

	cb.fn = fn;

	return cb;
};
},{"./listeners":16,"icicle":25,"mutype/is-object":66}],19:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],20:[function(require,module,exports){
/**
 * Get clientY/clientY from an event.
 * If index is passed, treat it as index of global touches, not the targetTouches.
 * Global touches include target touches.
 *
 * @module get-client-xy
 *
 * @param {Event} e Event raised, like mousemove
 *
 * @return {number} Coordinate relative to the screen
 */
function getClientY (e, idx) {
	// touch event
	if (e.touches) {
		if (arguments.length > 1) {
			return findTouch(e.touches, idx).clientY
		}
		else {
			return e.targetTouches[0].clientY;
		}
	}

	// mouse event
	return e.clientY;
}
function getClientX (e, idx) {
	// touch event
	if (e.touches) {
		if (arguments.length > idx) {
			return findTouch(e.touches, idx).clientX;
		}
		else {
			return e.targetTouches[0].clientX;
		}
	}

	// mouse event
	return e.clientX;
}

function getClientXY (e, idx) {
	return [getClientX.apply(this, arguments), getClientY.apply(this, arguments)];
}

function findTouch (touchList, idx) {
	for (var i = 0; i < touchList.length; i++) {
		if (touchList[i].identifier === idx) {
			return touchList[i];
		}
	}
}


getClientXY.x = getClientX;
getClientXY.y = getClientY;
getClientXY.findTouch = findTouch;

module.exports = getClientXY;
},{}],21:[function(require,module,exports){
/**
 * @module  get-doc
 */

var hasDom = require('has-dom');

module.exports = hasDom() ? document : null;
},{"has-dom":24}],22:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],23:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],24:[function(require,module,exports){
'use strict';
module.exports = function () {
	return typeof window !== 'undefined'
		&& typeof document !== 'undefined'
		&& typeof document.createElement === 'function';
};

},{}],25:[function(require,module,exports){
/**
 * @module Icicle
 */
module.exports = {
	freeze: lock,
	unfreeze: unlock,
	isFrozen: isLocked
};


/** Set of targets  */
var lockCache = new WeakMap;


/**
 * Set flag on target with the name passed
 *
 * @return {bool} Whether lock succeeded
 */
function lock(target, name){
	var locks = lockCache.get(target);
	if (locks && locks[name]) return false;

	//create lock set for a target, if none
	if (!locks) {
		locks = {};
		lockCache.set(target, locks);
	}

	//set a new lock
	locks[name] = true;

	//return success
	return true;
}


/**
 * Unset flag on the target with the name passed.
 *
 * Note that if to return new value from the lock/unlock,
 * then unlock will always return false and lock will always return true,
 * which is useless for the user, though maybe intuitive.
 *
 * @param {*} target Any object
 * @param {string} name A flag name
 *
 * @return {bool} Whether unlock failed.
 */
function unlock(target, name){
	var locks = lockCache.get(target);
	if (!locks || !locks[name]) return false;

	locks[name] = null;

	return true;
}


/**
 * Return whether flag is set
 *
 * @param {*} target Any object to associate lock with
 * @param {string} name A flag name
 *
 * @return {Boolean} Whether locked or not
 */
function isLocked(target, name){
	var locks = lockCache.get(target);
	return (locks && locks[name]);
}
},{}],26:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],27:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],28:[function(require,module,exports){
/** @module  intersects */
module.exports = intersects;


var min = Math.min, max = Math.max;


/**
 * Main intersection detector.
 *
 * @param {Rectangle} a Target
 * @param {Rectangle} b Container
 *
 * @return {bool} Whether target is within the container
 */
function intersects (a, b, tolerance){
	//ignore definite disintersection
	if (a.right < b.left || a.left > b.right) return false;
	if (a.bottom < b.top || a.top > b.bottom) return false;

	//intersection values
	var iX = min(a.right - max(b.left, a.left), b.right - max(a.left, b.left));
	var iY = min(a.bottom - max(b.top, a.top), b.bottom - max(a.top, b.top));
	var iSquare = iX * iY;

	var bSquare = (b.bottom - b.top) * (b.right - b.left);
	var aSquare = (a.bottom - a.top) * (a.right - a.left);

	//measure square overlap relative to the min square
	var targetSquare = min(aSquare, bSquare);


	//minimal overlap ratio
	tolerance = tolerance !== undefined ? tolerance : 0.5;

	if (iSquare / targetSquare > tolerance) {
		return true;
	}

	return false;
}
},{}],29:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],30:[function(require,module,exports){
/**
 * @module  is-audio-buffer
 */

module.exports = function isAudioBuffer (buffer) {
	//the guess is duck-typing
	return buffer != null
	&& buffer.sampleRate != null //swims like AudioBuffer
	&& typeof buffer.getChannelData === 'function' //quacks like AudioBuffer
};
},{}],31:[function(require,module,exports){
module.exports = true;
},{}],32:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],33:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],34:[function(require,module,exports){
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var isObject = require('isobject');

function isObjectObject(o) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = function isPlainObject(o) {
  var ctor,prot;
  
  if (isObjectObject(o) === false) return false;
  
  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;
  
  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;
  
  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }
  
  // Most likely a plain Object
  return true;
};

},{"isobject":35}],35:[function(require,module,exports){
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

module.exports = function isObject(val) {
  return val != null && typeof val === 'object'
    && !Array.isArray(val);
};

},{}],36:[function(require,module,exports){
/**
 * Parse element’s borders
 *
 * @module mucss/borders
 */

var Rect = require('./rect');
var parse = require('./parse-value');

/**
 * Return border widths of an element
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.borderLeftWidth),
		parse(style.borderTopWidth),
		parse(style.borderRightWidth),
		parse(style.borderBottomWidth)
	);
};
},{"./parse-value":44,"./rect":46}],37:[function(require,module,exports){
/**
 * Get or set element’s style, prefix-agnostic.
 *
 * @module  mucss/css
 */
var fakeStyle = require('./fake-element').style;
var prefix = require('./prefix').lowercase;


/**
 * Apply styles to an element.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */
module.exports = function(el, obj){
	if (!el || !obj) return;

	var name, value;

	//return value, if string passed
	if (typeof obj === 'string') {
		name = obj;

		//return value, if no value passed
		if (arguments.length < 3) {
			return el.style[prefixize(name)];
		}

		//set style, if value passed
		value = arguments[2] || '';
		obj = {};
		obj[name] = value;
	}

	for (name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
};


/**
 * Return prefixized prop name, if needed.
 *
 * @param    {string}   name   A property name.
 * @return   {string}   Prefixed property name.
 */
function prefixize(name){
	var uName = name[0].toUpperCase() + name.slice(1);
	if (fakeStyle[name] !== undefined) return name;
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return '';
}

},{"./fake-element":38,"./prefix":45}],38:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],39:[function(require,module,exports){
/**
 * Window scrollbar detector.
 *
 * @module mucss/has-scroll
 */

//TODO: detect any element scroll, not only the window
exports.x = function () {
	return window.innerHeight > document.documentElement.clientHeight;
};
exports.y = function () {
	return window.innerWidth > document.documentElement.clientWidth;
};
},{}],40:[function(require,module,exports){
/**
 * Detect whether element is placed to fixed container or is fixed itself.
 *
 * @module mucss/is-fixed
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */
module.exports = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === window) return true;

	//unlike the doc
	if (el === document) return false;

	while (parentEl) {
		if (getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
};
},{}],41:[function(require,module,exports){
/**
 * Get margins of an element.
 * @module mucss/margins
 */

var parse = require('./parse-value');
var Rect = require('./rect');

/**
 * Return margins of an element.
 *
 * @param    {Element}   el   An element which to calc margins.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.marginLeft),
		parse(style.marginTop),
		parse(style.marginRight),
		parse(style.marginBottom)
	);
};

},{"./parse-value":44,"./rect":46}],42:[function(require,module,exports){
/**
 * Calculate absolute offsets of an element, relative to the document.
 *
 * @module mucss/offsets
 *
 */
var win = window;
var doc = document;
var Rect = require('./rect');
var hasScroll = require('./has-scroll');
var scrollbar = require('./scrollbar');
var isFixedEl = require('./is-fixed');
var getTranslate = require('./translate');


/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element|window}   el   A target. Pass window to calculate viewport offsets
 * @return   {Object}   Offsets object with trbl.
 */
module.exports = offsets;

function offsets (el) {
	if (!el) throw Error('Bad argument');

	//calc client rect
	var cRect, result;

	//return vp offsets
	if (el === win) {
		result = Rect(
			win.pageXOffset,
			win.pageYOffset
		);

		result.width = win.innerWidth - (hasScroll.y() ? scrollbar : 0),
		result.height = win.innerHeight - (hasScroll.x() ? scrollbar : 0)
		result.right = result.left + result.width;
		result.bottom = result.top + result.height;

		return result;
	}

	//return absolute offsets if document requested
	else if (el === doc) {
		var res = offsets(doc.documentElement);
		res.bottom = Math.max(window.innerHeight, res.bottom);
		res.right = Math.max(window.innerWidth, res.right);
		if (hasScroll.y(doc.documentElement)) res.right -= scrollbar;
		if (hasScroll.x(doc.documentElement)) res.bottom -= scrollbar;
		return res;
	}

	//FIXME: why not every element has getBoundingClientRect method?
	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = Rect(
			el.clientLeft,
			el.clientTop
		);
	}

	//whether element is or is in fixed
	var isFixed = isFixedEl(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	result = Rect(
		cRect.left + xOffset,
		cRect.top + yOffset,
		cRect.left + xOffset + el.offsetWidth,
		cRect.top + yOffset + el.offsetHeight
	);

	return result;
};
},{"./has-scroll":39,"./is-fixed":40,"./rect":46,"./scrollbar":47,"./translate":49}],43:[function(require,module,exports){
/**
 * Caclulate paddings of an element.
 * @module  mucss/paddings
 */


var Rect = require('./rect');
var parse = require('./parse-value');


/**
 * Return paddings of an element.
 *
 * @param    {Element}   el   An element to calc paddings.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return Rect(
		parse(style.paddingLeft),
		parse(style.paddingTop),
		parse(style.paddingRight),
		parse(style.paddingBottom)
	);
};
},{"./parse-value":44,"./rect":46}],44:[function(require,module,exports){
/**
 * Returns parsed css value.
 *
 * @module mucss/parse-value
 *
 * @param {string} str A string containing css units value
 *
 * @return {number} Parsed number value
 */
module.exports = function (str){
	str += '';
	return parseFloat(str.slice(0,-2)) || 0;
};

//FIXME: add parsing units
},{}],45:[function(require,module,exports){
/**
 * Vendor prefixes
 * Method of http://davidwalsh.name/vendor-prefix
 * @module mucss/prefix
 */

var styles = getComputedStyle(document.documentElement, '');

var pre = (Array.prototype.slice.call(styles)
	.join('')
	.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
)[1];

var dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

module.exports = {
	dom: dom,
	lowercase: pre,
	css: '-' + pre + '-',
	js: pre[0].toUpperCase() + pre.substr(1)
};
},{}],46:[function(require,module,exports){
/**
 * Simple rect constructor.
 * It is just faster and smaller than constructing an object.
 *
 * @module mucss/rect
 *
 * @param {number} l left
 * @param {number} t top
 * @param {number} r right
 * @param {number} b bottom
 *
 * @return {Rect} A rectangle object
 */
module.exports = function Rect (l,t,r,b) {
	if (!(this instanceof Rect)) return new Rect(l,t,r,b);

	this.left=l||0;
	this.top=t||0;
	this.right=r||0;
	this.bottom=b||0;
	this.width=Math.abs(this.right - this.left);
	this.height=Math.abs(this.bottom - this.top);
};
},{}],47:[function(require,module,exports){
/**
 * Calculate scrollbar width.
 *
 * @module mucss/scrollbar
 */

// Create the measurement node
var scrollDiv = document.createElement("div");

var style = scrollDiv.style;

style.width = '100px';
style.height = '100px';
style.overflow = 'scroll';
style.position = 'absolute';
style.top = '-9999px';

document.documentElement.appendChild(scrollDiv);

// the scrollbar width
module.exports = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete fake DIV
document.documentElement.removeChild(scrollDiv);
},{}],48:[function(require,module,exports){
/**
 * Enable/disable selectability of an element
 * @module mucss/selection
 */
var css = require('./css');


/**
 * Disable or Enable any selection possibilities for an element.
 *
 * @param    {Element}   el   Target to make unselectable.
 */
exports.disable = function(el){
	css(el, {
		'user-select': 'none',
		'user-drag': 'none',
		'touch-callout': 'none'
	});
	el.setAttribute('unselectable', 'on');
	el.addEventListener('selectstart', pd);
};
exports.enable = function(el){
	css(el, {
		'user-select': null,
		'user-drag': null,
		'touch-callout': null
	});
	el.removeAttribute('unselectable');
	el.removeEventListener('selectstart', pd);
};


/** Prevent you know what. */
function pd(e){
	e.preventDefault();
}
},{"./css":37}],49:[function(require,module,exports){
/**
 * Parse translate3d
 *
 * @module mucss/translate
 */

var css = require('./css');
var parseValue = require('./parse-value');

module.exports = function (el) {
	var translateStr = css(el, 'transform');

	//find translate token, retrieve comma-enclosed values
	//translate3d(1px, 2px, 2) → 1px, 2px, 2
	//FIXME: handle nested calcs
	var match = /translate(?:3d)?\s*\(([^\)]*)\)/.exec(translateStr);

	if (!match) return [0, 0];
	var values = match[1].split(/\s*,\s*/);

	//parse values
	//FIXME: nested values are not necessarily pixels
	return values.map(function (value) {
		return parseValue(value);
	});
};
},{"./css":37,"./parse-value":44}],50:[function(require,module,exports){
/**
 * Clamper.
 * Detects proper clamp min/max.
 *
 * @param {number} a Current value to cut off
 * @param {number} min One side limit
 * @param {number} max Other side limit
 *
 * @return {number} Clamped value
 */

module.exports = require('./wrap')(function(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
});
},{"./wrap":54}],51:[function(require,module,exports){
/**
 * @module  mumath/loop
 *
 * Looping function for any framesize
 */

module.exports = require('./wrap')(function (value, left, right) {
	//detect single-arg case, like mod-loop
	if (right === undefined) {
		right = left;
		left = 0;
	}

	//swap frame order
	if (left > right) {
		var tmp = right;
		right = left;
		left = tmp;
	}

	var frame = right - left;

	value = ((value + left) % frame) - left;
	if (value < left) value += frame;
	if (value > right) value -= frame;

	return value;
});
},{"./wrap":54}],52:[function(require,module,exports){
/**
 * @module  mumath/precision
 *
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

module.exports = require('./wrap')(function(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
});
},{"./wrap":54}],53:[function(require,module,exports){
/**
 * Precision round
 *
 * @param {number} value
 * @param {number} step Minimal discrete to round
 *
 * @return {number}
 *
 * @example
 * toPrecision(213.34, 1) == 213
 * toPrecision(213.34, .1) == 213.3
 * toPrecision(213.34, 10) == 210
 */
var precision = require('./precision');

module.exports = require('./wrap')(function(value, step) {
	if (step === 0) return value;
	if (!step) return Math.round(value);
	step = parseFloat(step);
	value = Math.round(value / step) * step;
	return parseFloat(value.toFixed(precision(step)));
});
},{"./precision":52,"./wrap":54}],54:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function(a){
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else if (typeof a === 'object') {
			var result = {}, slice;
			for (var i in a){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = typeof args[j] === 'object' ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}],55:[function(require,module,exports){
//speedy implementation of `in`
//NOTE: `!target[propName]` 2-3 orders faster than `!(propName in target)`
module.exports = function(a, b){
	if (!a) return false;

	//NOTE: this causes getter fire
	if (a[b]) return true;

	//FIXME: why in is better than hasOwnProperty? Something with prototypes. Show a case.
	return b in a;
	// return a.hasOwnProperty(b);
}

},{}],56:[function(require,module,exports){
/**
* Trivial types checkers.
* Because there’re no common lib for that ( lodash_ is a fatguy)
*/
//TODO: make main use as `is.array(target)`
//TODO: separate by libs, included per-file

module.exports = {
	has: require('./has'),
	isObject: require('./is-object'),
	isFn: require('./is-fn'),
	isString: require('./is-string'),
	isNumber: require('./is-number'),
	isBoolean: require('./is-bool'),
	isPlain: require('./is-plain'),
	isArray: require('./is-array'),
	isArrayLike: require('./is-array-like'),
	isElement: require('./is-element'),
	isPrivateName: require('./is-private-name'),
	isRegExp: require('./is-regex'),
	isEmpty: require('./is-empty')
};

},{"./has":55,"./is-array":58,"./is-array-like":57,"./is-bool":59,"./is-element":60,"./is-empty":61,"./is-fn":63,"./is-number":65,"./is-object":66,"./is-plain":67,"./is-private-name":68,"./is-regex":69,"./is-string":70}],57:[function(require,module,exports){
var isString = require('./is-string');
var isArray = require('./is-array');
var isFn = require('./is-fn');

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
module.exports = function (a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && (typeof window != 'undefined' ? a != window : true) && !isFn(a) && typeof a.length === 'number');
}
},{"./is-array":58,"./is-fn":63,"./is-string":70}],58:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],59:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'boolean' || a instanceof Boolean;
}
},{}],60:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof HTMLElement;
};
},{}],61:[function(require,module,exports){
module.exports = function(a){
	if (!a) return true;
	for (var k in a) {
		return false;
	}
	return true;
}
},{}],62:[function(require,module,exports){
module.exports = function(target){
	return typeof Event !== 'undefined' && target instanceof Event;
};
},{}],63:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],64:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof Node;
};
},{}],65:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'number' || a instanceof Number;
}
},{}],66:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(o){
	// return obj === Object(obj);
	return !!o && typeof o === 'object' && o.constructor === Object;
};

},{}],67:[function(require,module,exports){
var isString = require('./is-string'),
	isNumber = require('./is-number'),
	isBool = require('./is-bool');

module.exports = function isPlain(a){
	return !a || isString(a) || isNumber(a) || isBool(a);
};
},{"./is-bool":59,"./is-number":65,"./is-string":70}],68:[function(require,module,exports){
module.exports = function(n){
	return n[0] === '_' && n.length > 1;
}

},{}],69:[function(require,module,exports){
module.exports = function(target){
	return target instanceof RegExp;
}
},{}],70:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],71:[function(require,module,exports){
/**
 * @module parenthesis
 */
module.exports = {
	parse: require('./parse'),
	stringify: require('./stringify')
};
},{"./parse":72,"./stringify":73}],72:[function(require,module,exports){
/**
 * @module  parenthesis/parse
 *
 * Parse a string with parenthesis.
 *
 * @param {string} str A string with parenthesis
 *
 * @return {Array} A list with parsed parens, where 0 is initial string.
 */

//TODO: implement sequential parser of this algorithm, compare performance.
module.exports = function(str, bracket){
	//pretend non-string parsed per-se
	if (typeof str !== 'string') return [str];

	var res = [], prevStr;

	bracket = bracket || '()';

	//create parenthesis regex
	var pRE = new RegExp(['\\', bracket[0], '[^\\', bracket[0], '\\', bracket[1], ']*\\', bracket[1]].join(''));

	function replaceToken(token, idx, str){
		//save token to res
		var refId = res.push(token.slice(1,-1));

		return '\\' + refId;
	}

	//replace paren tokens till there’s none
	while (str != prevStr) {
		prevStr = str;
		str = str.replace(pRE, replaceToken);
	}

	//save resulting str
	res.unshift(str);

	return res;
};
},{}],73:[function(require,module,exports){
/**
 * @module parenthesis/stringify
 *
 * Stringify an array/object with parenthesis references
 *
 * @param {Array|Object} arr An array or object where 0 is initial string
 *                           and every other key/value is reference id/value to replace
 *
 * @return {string} A string with inserted regex references
 */

//FIXME: circular references causes recursions here
//TODO: there’s possible a recursive version of this algorithm, so test it & compare
module.exports = function (str, refs, bracket){
	var prevStr;

	//pretend bad string stringified with no parentheses
	if (!str) return '';

	if (typeof str !== 'string') {
		bracket = refs;
		refs = str;
		str = refs[0];
	}

	bracket = bracket || '()';

	function replaceRef(token, idx, str){
		return bracket[0] + refs[token.slice(1)] + bracket[1];
	}

	while (str != prevStr) {
		prevStr = str;
		str = str.replace(/\\[0-9]+/, replaceRef);
	}

	return str;
};
},{}],74:[function(require,module,exports){
/**
 * @module  queried
 */


var doc = require('get-doc');
var q = require('./lib/');


/**
 * Detect unsupported css4 features, polyfill them
 */

//detect `:scope`
try {
	doc.querySelector(':scope');
}
catch (e) {
	q.registerFilter('scope', require('./lib/pseudos/scope'));
}


//detect `:has`
try {
	doc.querySelector(':has');
}
catch (e) {
	q.registerFilter('has', require('./lib/pseudos/has'));

	//polyfilled :has requires artificial :not to make `:not(:has(...))`.
	q.registerFilter('not', require('./lib/pseudos/not'));
}


//detect `:root`
try {
	doc.querySelector(':root');
}
catch (e) {
	q.registerFilter('root', require('./lib/pseudos/root'));
}


//detect `:matches`
try {
	doc.querySelector(':matches');
}
catch (e) {
	q.registerFilter('matches', require('./lib/pseudos/matches'));
}


/** Helper methods */
q.matches = require('./lib/pseudos/matches');


module.exports = q;
},{"./lib/":75,"./lib/pseudos/has":76,"./lib/pseudos/matches":77,"./lib/pseudos/not":78,"./lib/pseudos/root":79,"./lib/pseudos/scope":80,"get-doc":21}],75:[function(require,module,exports){
/**
 * @module queried/lib/index
 */


var slice = require('sliced');
var unique = require('array-unique');
var getUid = require('get-uid');
var paren = require('parenthesis');
var isString = require('mutype/is-string');
var isArray = require('mutype/is-array');
var isArrayLike = require('mutype/is-array-like');
var arrayify = require('arrayify-compact');
var doc = require('get-doc');


/**
 * Query wrapper - main method to query elements.
 */
function queryMultiple(selector, el) {
	//ignore bad selector
	if (!selector) return [];

	//return elements passed as a selector unchanged (cover params case)
	if (!isString(selector)) {
		if (isArray(selector)) {
			return unique(arrayify(selector.map(function (sel) {
				return queryMultiple(sel, el);
			})));
		} else {
			return [selector];
		}
	}

	//catch polyfillable first `:scope` selector - just erase it, works just fine
	if (pseudos.scope) {
		selector = selector.replace(/^\s*:scope/, '');
	}

	//ignore non-queryable containers
	if (!el) {
		el = [querySingle.document];
	}

	//treat passed list
	else if (isArrayLike(el)) {
		el = arrayify(el);
	}

	//if element isn’t a node - make it q.document
	else if (!el.querySelector) {
		el = [querySingle.document];
	}

	//make any ok element a list
	else {
		el = [el];
	}

	return qPseudos(el, selector);
}


/** Query single element - no way better than return first of multiple selector */
function querySingle(selector, el){
	return queryMultiple(selector, el)[0];
}


/**
 * Return query result based off target list.
 * Parse and apply polyfilled pseudos
 */
function qPseudos(list, selector) {
	//ignore empty selector
	selector = selector.trim();
	if (!selector) return list;

	// console.group(selector);

	//scopify immediate children selector
	if (selector[0] === '>') {
		if (!pseudos.scope) {
			//scope as the first element in selector scopifies current element just ok
			selector = ':scope' + selector;
		}
		else {
			var id = getUid();
			list.forEach(function(el){el.setAttribute('__scoped', id);});
			selector = '[__scoped="' + id + '"]' + selector;
		}
	}

	var pseudo, pseudoFn, pseudoParam, pseudoParamId;

	//catch pseudo
	var parts = paren.parse(selector);
	var match = parts[0].match(pseudoRE);

	//if pseudo found
	if (match) {
		//grab pseudo details
		pseudo = match[1];
		pseudoParamId = match[2];

		if (pseudoParamId) {
			pseudoParam = paren.stringify(parts[pseudoParamId.slice(1)], parts);
		}

		//pre-select elements before pseudo
		var preSelector = paren.stringify(parts[0].slice(0, match.index), parts);

		//fix for query-relative
		if (!preSelector && !mappers[pseudo]) preSelector = '*';
		if (preSelector) list = qList(list, preSelector);


		//apply pseudo filter/mapper on the list
		pseudoFn = function(el) {return pseudos[pseudo](el, pseudoParam); };
		if (filters[pseudo]) {
			list = list.filter(pseudoFn);
		}
		else if (mappers[pseudo]) {
			list = unique(arrayify(list.map(pseudoFn)));
		}

		//shorten selector
		selector = parts[0].slice(match.index + match[0].length);

		// console.groupEnd();

		//query once again
		return qPseudos(list, paren.stringify(selector, parts));
	}

	//just query list
	else {
		// console.groupEnd();
		return qList(list, selector);
	}
}


/** Apply selector on a list of elements, no polyfilled pseudos */
function qList(list, selector){
	return unique(arrayify(list.map(function(el){
		return slice(el.querySelectorAll(selector));
	})));
}


/** Registered pseudos */
var pseudos = {};
var filters = {};
var mappers = {};


/** Regexp to grab pseudos with params */
var pseudoRE;


/**
 * Append a new filtering (classic) pseudo
 *
 * @param {string} name Pseudo name
 * @param {Function} filter A filtering function
 */
function registerFilter(name, filter, incSelf){
	if (pseudos[name]) return;

	//save pseudo filter
	pseudos[name] = filter;
	pseudos[name].includeSelf = incSelf;
	filters[name] = true;

	regenerateRegExp();
}


/**
 * Append a new mapping (relative-like) pseudo
 *
 * @param {string} name pseudo name
 * @param {Function} mapper map function
 */
function registerMapper(name, mapper, incSelf){
	if (pseudos[name]) return;

	pseudos[name] = mapper;
	pseudos[name].includeSelf = incSelf;
	mappers[name] = true;

	regenerateRegExp();
}


/** Update regexp catching pseudos */
function regenerateRegExp(){
	pseudoRE = new RegExp('::?(' + Object.keys(pseudos).join('|') + ')(\\\\[0-9]+)?');
}



/** Exports */
querySingle.all = queryMultiple;
querySingle.registerFilter = registerFilter;
querySingle.registerMapper = registerMapper;

/** Default document representative to use for DOM */
querySingle.document = doc;


module.exports = querySingle;
},{"array-unique":81,"arrayify-compact":3,"get-doc":21,"get-uid":22,"mutype/is-array":58,"mutype/is-array-like":57,"mutype/is-string":70,"parenthesis":71,"sliced":82}],76:[function(require,module,exports){
var q = require('..');

function has(el, subSelector){
	return !!q(subSelector, el);
}

module.exports = has;
},{"..":75}],77:[function(require,module,exports){
/** :matches pseudo */

var q = require('..');

function matches(el, selector){
	if (!el.parentNode) {
		var fragment = q.document.createDocumentFragment();
		fragment.appendChild(el);
	}

	return q.all(selector, el.parentNode).indexOf(el) > -1;
}

module.exports = matches;
},{"..":75}],78:[function(require,module,exports){
var matches = require('./matches');

function not(el, selector){
	return !matches(el, selector);
}

module.exports = not;
},{"./matches":77}],79:[function(require,module,exports){
var q = require('..');

module.exports = function root(el){
	return el === q.document.documentElement;
};
},{"..":75}],80:[function(require,module,exports){
/**
 * :scope pseudo
 * Return element if it has `scoped` attribute.
 *
 * @link http://dev.w3.org/csswg/selectors-4/#the-scope-pseudo
 */

module.exports = function scope(el){
	return el.hasAttribute('scoped');
};
},{}],81:[function(require,module,exports){
/*!
 * array-unique <https://github.com/jonschlinkert/array-unique>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }

  var len = arr.length;
  var i = -1;

  while (i++ < len) {
    var j = i + 1;

    for (; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j--, 1);
      }
    }
  }
  return arr;
};

},{}],82:[function(require,module,exports){
module.exports = exports = require('./lib/sliced');

},{"./lib/sliced":83}],83:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],84:[function(require,module,exports){
var Draggable = require('draggy');
var emit = require('emmy/emit');
var on = require('emmy/on');
var isArray = require('mutype/is-array');
var isString = require('mutype/is-string');
var isObject = require('mutype/is-object');
var extend = require('xtend/mutable');
var inherit = require('inherits');
var Emitter = require('events');
var between = require('mumath/between');
var splitKeys = require('split-keys');
var css = require('mucss/css');
var paddings = require('mucss/padding');
var borders = require('mucss/border');
var margins = require('mucss/margin');
var offsets = require('mucss/offset');
var parseCSSValue = require('mucss/parse-value');


var doc = document, win = window, root = doc.documentElement;


/**
 * Make an element resizable.
 *
 * Note that we don’t need a container option
 * as arbitrary container is emulatable via fake resizable.
 *
 * @constructor
 */
function Resizable (el, options) {
	var self = this;

	if (!(self instanceof Resizable)) {
		return new Resizable(el, options);
	}

	self.element = el;

	extend(self, options);

	self.createHandles();

	//bind event, if any
	if (self.resize) {
		self.on('resize', self.resize);
	}
}

inherit(Resizable, Emitter);


var proto = Resizable.prototype;


/** Create handles according to options */
proto.createHandles = function () {
	var self = this;

	//init handles
	var handles;

	//parse value
	if (isArray(self.handles)) {
		handles = {};
		for (var i = self.handles.length; i--;){
			handles[self.handles[i]] = null;
		}
	}
	else if (isString(self.handles)) {
		handles = {};
		var arr = self.handles.match(/([swne]+)/g);
		for (var i = arr.length; i--;){
			handles[arr[i]] = null;
		}
	}
	else if (isObject(self.handles)) {
		handles = self.handles;
	}
	//default set of handles depends on position.
	else {
		var position = getComputedStyle(self.element).position;
		var display = getComputedStyle(self.element).display;
		//if display is inline-like - provide only three handles
		//it is position: static or display: inline
		if (/inline/.test(display) || /static/.test(position)){
			handles = {
				s: null,
				se: null,
				e: null
			};

			//ensure position is not static
			css(self.element, 'position', 'relative');
		}
		//else - all handles
		else {
			handles = {
				s: null,
				se: null,
				e: null,
				ne: null,
				n: null,
				nw: null,
				w: null,
				sw: null
			};
		}
	}

	//create proper number of handles
	var handle;
	for (var direction in handles) {
		handles[direction] = self.createHandle(handles[direction], direction);
	}

	//save handles elements
	self.handles = handles;
}


/** Create handle for the direction */
proto.createHandle = function(handle, direction){
	var self = this;

	var el = self.element;

	//make handle element
	if (!handle) {
		handle = document.createElement('div');
		handle.classList.add('resizable-handle');
	}

	//insert handle to the element
	self.element.appendChild(handle);

	//save direction
	handle.direction = direction;

	//make handle draggable
	var draggy = new Draggable(handle, {
		within: self.within,
		// css3: false,
		threshold: self.threshold,
		axis: /^[ns]$/.test(direction) ? 'y' : /^[we]$/.test(direction) ? 'x' : 'both'
	});

	draggy.on('dragstart', function (e) {
		self.m = margins(el);
		self.b = borders(el);
		self.p = paddings(el);

		//parse initial offsets
		var s = getComputedStyle(el);
		self.offsets = [parseCSSValue(s.left), parseCSSValue(s.top)];

		//fix top-left position
		css(el, {
			left: self.offsets[0],
			top: self.offsets[1]
		});

		//recalc border-box
		if (getComputedStyle(el).boxSizing === 'border-box') {
			self.p.top = 0;
			self.p.bottom = 0;
			self.p.left = 0;
			self.p.right = 0;
			self.b.top = 0;
			self.b.bottom = 0;
			self.b.left = 0;
			self.b.right = 0;
		}

		//save initial size
		self.size = [el.offsetWidth - self.b.left - self.b.right - self.p.left - self.p.right, el.offsetHeight - self.b.top - self.b.bottom - self.p.top - self.p.bottom];

		//calc limits (max height/width)
		if (self.within) {
			var po = offsets(self.within);
			var o = offsets(el);
			self.limits = [
				o.left - po.left + self.size[0],
				o.top - po.top + self.size[1],
				po.right - o.right + self.size[0],
				po.bottom - o.bottom + self.size[1]];
		} else {
			self.limits = [9999, 9999, 9999, 9999];
		}


		//preset mouse cursor
		css(root, {
			'cursor': direction + '-resize'
		});

		//clear cursors
		for (var h in self.handles){
			css(self.handles[h], 'cursor', null);
		}
	});

	draggy.on('drag', function(e){
		var coords = draggy.getCoords();

		//change width/height properly
		switch (direction) {
			case 'se':
			case 's':
			case 'e':
				css(el, {
					width: between(self.size[0] + coords[0], 0, self.limits[2]),
					height: between(self.size[1] + coords[1], 0, self.limits[3])
				});
				break;
			case 'nw':
			case 'n':
			case 'w':
				css(el, {
					width: between(self.size[0] - coords[0], 0, self.limits[0]),
					height: between(self.size[1] - coords[1], 0, self.limits[1])
				});

				// //subtract t/l on changed size
				var difX = self.size[0] + self.b.left + self.b.right + self.p.left + self.p.right - el.offsetWidth;
				var difY = self.size[1] + self.b.top + self.b.bottom + self.p.top + self.p.bottom - el.offsetHeight;

				css(el, {
					left: self.offsets[0] + difX,
					top: self.offsets[1] + difY
				});
				break;
			case 'ne':
				css(el, {
					width: between(self.size[0] + coords[0], 0, self.limits[2]),
					height: between(self.size[1] - coords[1], 0, self.limits[1])
				});

				//subtract t/l on changed size
				var difY = self.size[1] + self.b.top + self.b.bottom + self.p.top + self.p.bottom - el.offsetHeight;

				css(el, {
					top: self.offsets[1] + difY
				});
				break;
			case 'sw':
				css(el, {
					width: between(self.size[0] - coords[0], 0, self.limits[0]),
					height: between(self.size[1] + coords[1], 0, self.limits[3])
				});

				//subtract t/l on changed size
				var difX = self.size[0] + self.b.left + self.b.right + self.p.left + self.p.right - el.offsetWidth;

				css(el, {
					left: self.offsets[0] + difX
				});
				break;
		};

		//trigger callbacks
		emit(self, 'resize');
		emit(el, 'resize');

		draggy.setCoords(0,0);
	});

	draggy.on('dragend', function(){
		//clear cursor & pointer-events
		css(root, {
			'cursor': null
		});

		//get back cursors
		for (var h in self.handles){
			css(self.handles[h], 'cursor', self.handles[h].direction + '-resize');
		}
	});

	//append styles
	css(handle, handleStyles[direction]);
	css(handle, 'cursor', direction + '-resize');

	//append proper class
	handle.classList.add('resizable-handle-' + direction);

	return handle;
};


/** deconstructor - removes any memory bindings */
proto.destroy = function () {
	//remove all handles
	for (var hName in this.handles){
		this.element.removeChild(this.handles[hName]);
		this.handles[hName].draggable.destroy();
	}


	//remove references
	this.element = null;
};


var w = 10;


/** Threshold size */
proto.threshold = w;


/** Styles for handles */
var handleStyles = splitKeys({
	'e,w,n,s,nw,ne,sw,se': {
		'position': 'absolute'
	},
	'e,w': {
		'top, bottom':0,
		'width': w
	},
	'e': {
		'left': 'auto',
		'right': -w/2
	},
	'w': {
		'right': 'auto',
		'left': -w/2
	},
	's': {
		'top': 'auto',
		'bottom': -w/2
	},
	'n': {
		'bottom': 'auto',
		'top': -w/2
	},
	'n,s': {
		'left, right': 0,
		'height': w
	},
	'nw,ne,sw,se': {
		'width': w,
		'height': w,
		'z-index': 1
	},
	'nw': {
		'top, left': -w/2,
		'bottom, right': 'auto'
	},
	'ne': {
		'top, right': -w/2,
		'bottom, left': 'auto'
	},
	'sw': {
		'bottom, left': -w/2,
		'top, right': 'auto'
	},
	'se': {
		'bottom, right': -w/2,
		'top, left': 'auto'
	}
}, true);



/**
 * @module resizable
 */
module.exports = Resizable;
},{"draggy":14,"emmy/emit":15,"emmy/on":18,"events":19,"inherits":27,"mucss/border":36,"mucss/css":37,"mucss/margin":41,"mucss/offset":42,"mucss/padding":43,"mucss/parse-value":44,"mumath/between":50,"mutype/is-array":58,"mutype/is-object":66,"mutype/is-string":70,"split-keys":86,"xtend/mutable":88}],85:[function(require,module,exports){
arguments[4][83][0].apply(exports,arguments)
},{"dup":83}],86:[function(require,module,exports){
var type = require('mutype');
var extend = require('xtend/mutable');

module.exports = splitKeys;


/**
 * Disentangle listed keys
 *
 * @param {Object} obj An object with key including listed declarations
 * @example {'a,b,c': 1}
 *
 * @param {boolean} deep Whether to flatten nested objects
 *
 * @todo Think to provide such method on object prototype
 *
 * @return {oblect} Source set passed {@link set}
 */
function splitKeys(obj, deep, separator){
	//swap args, if needed
	if ((deep || separator) && (type.isBoolean(separator) || type.isString(deep) || type.isRegExp(deep))) {
		var tmp = deep;
		deep = separator;
		separator = tmp;
	}

	//ensure separator
	separator = separator === undefined ? splitKeys.separator : separator;

	var list, value;

	for(var keys in obj){
		value = obj[keys];

		if (deep && type.isObject(value)) splitKeys(value, deep, separator);

		list = keys.split(separator);

		if (list.length > 1){
			delete obj[keys];
			list.forEach(setKey);
		}
	}

	function setKey(key){
		//if existing key - extend, if possible
		//FIXME: obj[key] might be not an object, but function, for example
		if (value !== obj[key] && type.isObject(value) && type.isObject(obj[key])) {
			obj[key] = extend({}, obj[key], value);
		}
		//or replace
		else {
			obj[key] = value;
		}
	}

	return obj;
}


/** default separator */
splitKeys.separator = /\s?,\s?/;
},{"mutype":56,"xtend/mutable":88}],87:[function(require,module,exports){
/**
 * @module  st8
 *
 * Micro state machine.
 */


var Emitter = require('events');
var isFn = require('is-function');
var isObject = require('is-plain-object');


/** Defaults */

State.options = {
	leaveCallback: 'after',
	enterCallback: 'before',
	changeCallback: 'change',
	remainderState: '_'
};


/**
 * Create a new state controller based on states passed
 *
 * @constructor
 *
 * @param {object} settings Initial states
 */

function State(states, context){
	//ignore existing state
	if (states instanceof State) return states;

	//ensure new state instance is created
	if (!(this instanceof State)) return new State(states);

	//save states object
	this.states = states || {};

	//save context
	this.context = context || this;

	//initedFlag
	this.isInit = false;
}


/** Inherit State from Emitter */

var proto = State.prototype = Object.create(Emitter.prototype);


/**
 * Go to a state
 *
 * @param {*} value Any new state to enter
 */

proto.set = function (value) {
	var oldValue = this.state, states = this.states;
	// console.group('set', value, oldValue);

	//leave old state
	var oldStateName = states[oldValue] !== undefined ? oldValue : State.options.remainderState;
	var oldState = states[oldStateName];

	var leaveResult, leaveFlag = State.options.leaveCallback + oldStateName;

	if (this.isInit) {
		if (isObject(oldState)) {
			if (!this[leaveFlag]) {
				this[leaveFlag] = true;

				//if oldstate has after method - call it
				leaveResult = getValue(oldState, State.options.leaveCallback, this.context);

				//ignore changing if leave result is falsy
				if (leaveResult === false) {
					this[leaveFlag] = false;
					// console.groupEnd();
					return false;
				}

				//redirect, if returned anything
				else if (leaveResult !== undefined && leaveResult !== value) {
					this.set(leaveResult);
					this[leaveFlag] = false;
					// console.groupEnd();
					return false;
				}

				this[leaveFlag] = false;

				//ignore redirect
				if (this.state !== oldValue) {
					return;
				}
			}

		}

		//ignore not changed value
		if (value === oldValue) return false;
	}
	else {
		this.isInit = true;
	}


	//set current value
	this.state = value;


	//try to enter new state
	var newStateName = states[value] !== undefined ? value : State.options.remainderState;
	var newState = states[newStateName];
	var enterFlag = State.options.enterCallback + newStateName;
	var enterResult;

	if (!this[enterFlag]) {
		this[enterFlag] = true;

		if (isObject(newState)) {
			enterResult = getValue(newState, State.options.enterCallback, this.context);
		} else {
			enterResult = getValue(states, newStateName, this.context);
		}

		//ignore entering falsy state
		if (enterResult === false) {
			this.set(oldValue);
			this[enterFlag] = false;
			// console.groupEnd();
			return false;
		}

		//redirect if returned anything but current state
		else if (enterResult !== undefined && enterResult !== value) {
			this.set(enterResult);
			this[enterFlag] = false;
			// console.groupEnd();
			return false;
		}

		this[enterFlag] = false;
	}



	//notify change
	if (value !== oldValue)	{
		this.emit(State.options.changeCallback, value, oldValue);
	}


	// console.groupEnd();

	//return context to chain calls
	return this.context;
};


/** Get current state */

proto.get = function(){
	return this.state;
};


/** Return value or fn result */
function getValue(holder, meth, ctx){
	if (isFn(holder[meth])) {
		return holder[meth].call(ctx);
	}

	return holder[meth];
}


module.exports = State;
},{"events":19,"is-function":33,"is-plain-object":34}],88:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],"sound-designer":[function(require,module,exports){
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

	//create formant editor

	//create waveform viewer

	//create spectrum viewer

	//create spirallogram viewer
}


/**
 * Create audioElement, add it to the table
 */
Designer.prototype.createAudioElement = function () {
	var self = this;

	var audioElement = new AudioElement();

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
},{"./lib/audio-element":1,"draggy":14,"inherits":27,"mucss/css":37,"resizable":84,"xtend/mutable":88}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXVkaW8tZWxlbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9hcnJheS1mbGF0dGVuL2FycmF5LWZsYXR0ZW4uanMiLCJub2RlX21vZHVsZXMvYXJyYXlpZnktY29tcGFjdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hdWRpby1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYXVkaW8tY29udGV4dC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hdWRpby10YWJsZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXItdG8tYXJyYXlidWZmZXIvYnVmZmVyLXRvLWFycmF5YnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVmaW5lLXN0YXRlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Rpc3RyaWJ1dGlvbnMtbm9ybWFsLXJhbmRvbS9saWIvZFJhbk5vcm1hbFRhaWwuanMiLCJub2RlX21vZHVsZXMvZGlzdHJpYnV0aW9ucy1ub3JtYWwtcmFuZG9tL2xpYi9udW1iZXIuanMiLCJub2RlX21vZHVsZXMvZHJhZ2d5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VtbXkvZW1pdC5qcyIsIm5vZGVfbW9kdWxlcy9lbW15L2xpc3RlbmVycy5qcyIsIm5vZGVfbW9kdWxlcy9lbW15L29mZi5qcyIsIm5vZGVfbW9kdWxlcy9lbW15L29uLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvZ2V0LWNsaWVudC14eS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nZXQtZG9jL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dldC11aWQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xvYmFsL3dpbmRvdy5qcyIsIm5vZGVfbW9kdWxlcy9oYXMtZG9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ljaWNsZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvaW50ZXJzZWN0cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1hcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1hdWRpby1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXMtYnJvd3Nlci9jbGllbnQuanMiLCJub2RlX21vZHVsZXMvaXMtYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzLWZ1bmN0aW9uL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzLXBsYWluLW9iamVjdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1wbGFpbi1vYmplY3Qvbm9kZV9tb2R1bGVzL2lzb2JqZWN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL2JvcmRlci5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9jc3MuanMiLCJub2RlX21vZHVsZXMvbXVjc3MvZmFrZS1lbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL2hhcy1zY3JvbGwuanMiLCJub2RlX21vZHVsZXMvbXVjc3MvaXMtZml4ZWQuanMiLCJub2RlX21vZHVsZXMvbXVjc3MvbWFyZ2luLmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL29mZnNldC5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9wYWRkaW5nLmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL3BhcnNlLXZhbHVlLmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL3ByZWZpeC5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9yZWN0LmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL3Njcm9sbGJhci5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9zZWxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvbXVjc3MvdHJhbnNsYXRlLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9iZXR3ZWVuLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9sb29wLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9wcmVjaXNpb24uanMiLCJub2RlX21vZHVsZXMvbXVtYXRoL3JvdW5kLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC93cmFwLmpzIiwibm9kZV9tb2R1bGVzL211dHlwZS9oYXMuanMiLCJub2RlX21vZHVsZXMvbXV0eXBlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL211dHlwZS9pcy1hcnJheS1saWtlLmpzIiwibm9kZV9tb2R1bGVzL211dHlwZS9pcy1hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9tdXR5cGUvaXMtYm9vbC5qcyIsIm5vZGVfbW9kdWxlcy9tdXR5cGUvaXMtZWxlbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9tdXR5cGUvaXMtZW1wdHkuanMiLCJub2RlX21vZHVsZXMvbXV0eXBlL2lzLWV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL211dHlwZS9pcy1mbi5qcyIsIm5vZGVfbW9kdWxlcy9tdXR5cGUvaXMtbm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9tdXR5cGUvaXMtbnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL211dHlwZS9pcy1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvbXV0eXBlL2lzLXBsYWluLmpzIiwibm9kZV9tb2R1bGVzL211dHlwZS9pcy1wcml2YXRlLW5hbWUuanMiLCJub2RlX21vZHVsZXMvbXV0eXBlL2lzLXJlZ2V4LmpzIiwibm9kZV9tb2R1bGVzL211dHlwZS9pcy1zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvcGFyZW50aGVzaXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGFyZW50aGVzaXMvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvcGFyZW50aGVzaXMvc3RyaW5naWZ5LmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9saWIvcHNldWRvcy9oYXMuanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9saWIvcHNldWRvcy9tYXRjaGVzLmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvbGliL3BzZXVkb3Mvbm90LmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvbGliL3BzZXVkb3Mvcm9vdC5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL2xpYi9wc2V1ZG9zL3Njb3BlLmpzIiwibm9kZV9tb2R1bGVzL3F1ZXJpZWQvbm9kZV9tb2R1bGVzL2FycmF5LXVuaXF1ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyaWVkL25vZGVfbW9kdWxlcy9zbGljZWQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcXVlcmllZC9ub2RlX21vZHVsZXMvc2xpY2VkL2xpYi9zbGljZWQuanMiLCJub2RlX21vZHVsZXMvcmVzaXphYmxlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NwbGl0LWtleXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3Q4L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3h0ZW5kL211dGFibGUuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5MUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXHJcbiAqIEF1ZGlvRWxlbWVudCAoRm9ybWFudCwgb3IgcHVsc2UgLSB3aGF0ZXZlcikuXHJcbiAqIEFuIGVsZW1lbnQsIHByb2R1Y2luZyBzb3VuZC5cclxuICogSG9wZSB3aWxsIHVzZSBpbiBhdWRpby1jc3MuXHJcbiAqIFRha2VzIGJ1ZmZlciwgcHJvdmlkZXMgc291cmNlIGFuZCBhIHNldCBvZiBtb2RpZmllcnMuXHJcbiAqIEV4YWNsdHkgYXMgYXVkaW8tY3NzIGRvZXMuXHJcbiAqXHJcbiAqIEBtb2R1bGUgIGF1ZGlvLWVsZW1lbnRcclxuICovXHJcblxyXG52YXIgY3R4ID0gcmVxdWlyZSgnYXVkaW8tY29udGV4dCcpO1xyXG52YXIgQXVkaW9CdWZmZXIgPSByZXF1aXJlKCdhdWRpby1idWZmZXInKTtcclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kL211dGFibGUnKTtcclxudmFyIHRhYmxlID0gcmVxdWlyZSgnYXVkaW8tdGFibGUnKTtcclxudmFyIHJhbmRvbSA9IHJlcXVpcmUoJ2Rpc3RyaWJ1dGlvbnMtbm9ybWFsLXJhbmRvbS9saWIvbnVtYmVyJyk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb0VsZW1lbnQ7XHJcblxyXG5cclxuLyoqXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gQXVkaW9FbGVtZW50IChvcHRpb25zKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRleHRlbmQoc2VsZiwgb3B0aW9ucyk7XHJcblxyXG5cdC8vZGVmYXVsdCB1bnRvdWNoZWQgc291cmNlXHJcblx0c2VsZi5zb3VyY2UgPSB0YWJsZS5zaW4oc2VsZi5taW5GcmVxdWVuY3kgKiBzZWxmLmNvbnRleHQuc2FtcGxlUmF0ZSk7XHJcblxyXG5cclxuXHQvL2J1ZmZlciB0byBiZSBtaXhlZFxyXG5cdC8vaXQgaXMgZm9ybWVkIHJlcGVhdGVkbHlcclxuXHQvL3RvIGFjY29yZCB0byB0aGUgc3R5bGUgcGFyYW1zXHJcblx0c2VsZi5idWZmZXIgPSBjdHguY3JlYXRlQnVmZmVyKHNlbGYuY2hhbm5lbHMsIHNlbGYuY29udGV4dC5zYW1wbGVSYXRlLCBzZWxmLmNvbnRleHQuc2FtcGxlUmF0ZSk7XHJcblxyXG5cdC8vY3JlYXRlIGJ1ZmZlciBzb3VyY2VcclxuXHRzZWxmLm5vZGUgPSBjdHguY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcblx0c2VsZi5ub2RlLmJ1ZmZlciA9IHNlbGYuYnVmZmVyO1xyXG5cdHNlbGYubm9kZS5sb29wID0gdHJ1ZTtcclxuXHJcblxyXG5cdC8vY29ubmVjdCBzb3VyY2UgdG8gZGVzdGluYXRpb25cclxuXHRzZWxmLm5vZGUuY29ubmVjdChzZWxmLmNvbnRleHQuZGVzdGluYXRpb24pO1xyXG5cdHNlbGYubm9kZS5zdGFydCgpO1xyXG5cclxuXHJcblx0Ly9pbml0IGJ1ZmZlclxyXG5cdHNlbGYudXBkYXRlKCk7XHJcblxyXG5cdC8vY3JlYXRlIHVwZGF0aW5nIHByb3BzIGludGVydmFsXHJcblx0c2VsZi51cGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcclxuXHRcdHNlbGYudXBkYXRlKCk7XHJcblx0fSwgMjApO1xyXG59XHJcblxyXG5cclxuLy9mcmVxdWVuY3kgbGltaXRzXHJcbkF1ZGlvRWxlbWVudC5wcm90b3R5cGUubWluRnJlcXVlbmN5ID0gMTtcclxuQXVkaW9FbGVtZW50LnByb3RvdHlwZS5tYXhGcmVxdWVuY3kgPSAyMDAwMDtcclxuXHJcblxyXG4vKipcclxuICogRGVmYXVsdCBjb250ZXh0XHJcbiAqL1xyXG5BdWRpb0VsZW1lbnQucHJvdG90eXBlLmNvbnRleHQgPSBjdHg7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByb3BlcnRpZXMuXHJcbiAqIEEgcmVhbCB2YWx1ZXMgZm9yIGF1ZGlvLWNzcyBkZWNsYXJhdGlvbnNcclxuICovXHJcbmV4dGVuZChBdWRpb0VsZW1lbnQucHJvdG90eXBlLCB7XHJcblx0Ly9udW1iZXIgb2YgY2hhbm5lbHNcclxuXHRjaGFubmVsczogMixcclxuXHJcblx0Ly9tYXkgYmUgbmVlZCB0byByZWd1bGF0ZSBzcGVlZCBvZiBwbGF5aW5nXHJcblx0Ly8gc2FtcGxlUmF0ZTogPyxcclxuXHJcblx0Ly8xcyBieSBkZWZhdWx0XHJcblx0Ly9ub3RlIHRoYXQgZHVyYXRpb24gZG9lcyBub3QgbmVjZXNzYXJ5IHN0cmV0Y2ggYnVmZmVyIGNvbnRlbnRcclxuXHQvL0ZJWE1FOiBlbmdhZ2UgdGhpcywgcG9zc2libHkgaXQgc2hvdWxkIHNob3cgaG93IG1hbnkgcGVyaW9kcyBvZiB0aGUgZnJlcSBpdCBzaG91bGQgY29udGFpblxyXG5cdGR1cmF0aW9uOiAxLFxyXG5cclxuXHQvL2F1ZGlvIGJ1ZmZlciB3aXRoIHNvdXJjZSBmaWxlXHJcblx0c291cmNlOiBudWxsLFxyXG5cclxuXHQvL3F1YWxpdHkgcGFyYW0gb2YgdGhlIHNvdW5kaW5nIHB1bHNlXHJcblx0Ly8xIC0gcGVyZmVjdGx5IHN0YWJsZSwgMCAtIHBlcmZlY3RseSBub2lzeVxyXG5cdHF1YWxpdHk6IDEsXHJcblxyXG5cdC8vVE9ETzogcmVwbGFjZSB3aXRoIHF1YWxpdHkgbWV0cmljXHJcblx0X2ZyZXFSYW5nZTogMCxcclxuXHJcblx0Ly93aGV0aGVyIHNob3VsZCB3ZSByZXBlYXQgdGhpcyBub2RlXHJcblx0cmVwZWF0OiB0cnVlLFxyXG5cclxuXHQvL2hvdyBvZnRlbiB0byByZXBlYXQgdGhlIHNpZ25hbCBjb250YWluZWQgaW4gdGhlIGJ1ZmZlclxyXG5cdGZyZXF1ZW5jeTogNDQwLFxyXG5cclxuXHQvL3ZvbHVtZSBvZiB0aGUgc2lnbmFsXHJcblx0Z2FpbjogMSxcclxuXHJcblx0Ly9wbGF5YmFjayByYXRlXHJcblx0c2NhbGU6IDFcclxufSk7XHJcblxyXG5cclxuLyoqXHJcbiAqIFRlbXAgbWV0aG9kIHRvIGdldCBxdWFsaXR5IGZyb20gdGhlIGZyZXF1ZW5jeSByYW5nZVxyXG4gKi9cclxuQXVkaW9FbGVtZW50LnByb3RvdHlwZS5zZXRRdWFsaXR5ID0gZnVuY3Rpb24gKHJhbmdlKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRzZWxmLl9mcmVxUmFuZ2UgPSByYW5nZTtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogR2VuZXJhdGUgYSBuZXcgY2h1bmsgZm9yIGEgYnVmZmVyXHJcbiAqIHRocm90dGxlZFxyXG4gKi9cclxuQXVkaW9FbGVtZW50LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHQvL3NldCByZXBlYXRcclxuXHRzZWxmLm5vZGUubG9vcCA9IHNlbGYucmVwZWF0O1xyXG5cclxuXHQvL2dldCB0aGUgZHVyYXRpb24gb2Ygb25lLXBlcmlvZCBvZiBzZWxmIGZyZXF1ZW5jeSwgaW4gc2FtcGxlc1xyXG5cdHZhciBzYW1wbGVzTnVtYmVyID0gc2VsZi5jb250ZXh0LnNhbXBsZVJhdGUgLyBzZWxmLmZyZXF1ZW5jeTtcclxuXHJcblx0Ly9zZXQgc3RhcnQvZW5kIHNvIHRvIHJlcGVhdCBzaG9ydChlcikgd2F2ZVxyXG5cdC8vRklYTUU6IGNhbGN1bGF0ZSB0aGUgbG9vcEVuZFxyXG5cdHNlbGYubm9kZS5sb29wU3RhcnQgPSAwO1xyXG5cdHNlbGYubm9kZS5sb29wRW5kID0gc2FtcGxlc051bWJlciAvIHNlbGYuY29udGV4dC5zYW1wbGVSYXRlO1xyXG5cclxuXHQvL2ZpbGwgdGhlIGJ1ZmZlciB3aXRoIHRoZSBzaW5lIG9mIHRoZSBuZWVkZWQgZnJlcXVlbmN5XHJcblx0Ly9UT0RPOiB0byBpbXBsZW1lbnQgcXVhbGl0eSwgd2UgbmVlZCB0byBwaWNrIHNvdXJjZSBhdCByYW5kb21pemVkIHBvc2l0aW9uc1xyXG5cdHZhciBmcmVxUmF0aW8gPSBzZWxmLnNvdXJjZS5sZW5ndGggLyBzYW1wbGVzTnVtYmVyO1xyXG5cdGZvciAodmFyIGkgPSAwLCBsID0gc2FtcGxlc051bWJlcjsgaSA8IGw7IGkrKykge1xyXG5cdFx0dmFyIGRhdGExID0gc2VsZi5ub2RlLmJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuXHRcdHZhciBkYXRhMiA9IHNlbGYubm9kZS5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoMSk7XHJcblxyXG5cdFx0ZGF0YTFbaV0gPSBzZWxmLnNvdXJjZVt+fihpICogZnJlcVJhdGlvICsgcmFuZG9tKDAsc2VsZi5fZnJlcVJhbmdlKSldO1xyXG5cdFx0ZGF0YTJbaV0gPSBkYXRhMVtpXTtcclxuXHR9XHJcblxyXG5cdC8vdXBkYXRlIHRoZSBwbGF5YmFjayByYXRlXHJcblx0c2VsZi5ub2RlLnBsYXliYWNrUmF0ZSA9IHNlbGYuc2NhbGU7XHJcblxyXG5cdHJldHVybiBzZWxmO1xyXG59OyIsIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIEV4cG9zZSBgYXJyYXlGbGF0dGVuYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmbGF0dGVuXG5tb2R1bGUuZXhwb3J0cy5mcm9tID0gZmxhdHRlbkZyb21cbm1vZHVsZS5leHBvcnRzLmRlcHRoID0gZmxhdHRlbkRlcHRoXG5tb2R1bGUuZXhwb3J0cy5mcm9tRGVwdGggPSBmbGF0dGVuRnJvbURlcHRoXG5cbi8qKlxuICogRmxhdHRlbiBhbiBhcnJheS5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gYXJyYXlcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5mdW5jdGlvbiBmbGF0dGVuIChhcnJheSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgdmFsdWUgdG8gYmUgYW4gYXJyYXknKVxuICB9XG5cbiAgcmV0dXJuIGZsYXR0ZW5Gcm9tKGFycmF5KVxufVxuXG4vKipcbiAqIEZsYXR0ZW4gYW4gYXJyYXktbGlrZSBzdHJ1Y3R1cmUuXG4gKlxuICogQHBhcmFtICB7QXJyYXl9IGFycmF5XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gZmxhdHRlbkZyb20gKGFycmF5KSB7XG4gIHJldHVybiBmbGF0dGVuRG93bihhcnJheSwgW10sIEluZmluaXR5KVxufVxuXG4vKipcbiAqIEZsYXR0ZW4gYW4gYXJyYXktbGlrZSBzdHJ1Y3R1cmUgd2l0aCBkZXB0aC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIGFycmF5XG4gKiBAcGFyYW0gIHtudW1iZXJ9IGRlcHRoXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gZmxhdHRlbkRlcHRoIChhcnJheSwgZGVwdGgpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIGFuIGFycmF5JylcbiAgfVxuXG4gIHJldHVybiBmbGF0dGVuRnJvbURlcHRoKGFycmF5LCBkZXB0aClcbn1cblxuLyoqXG4gKiBGbGF0dGVuIGFuIGFycmF5LWxpa2Ugc3RydWN0dXJlIHdpdGggZGVwdGguXG4gKlxuICogQHBhcmFtICB7QXJyYXl9ICBhcnJheVxuICogQHBhcmFtICB7bnVtYmVyfSBkZXB0aFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIGZsYXR0ZW5Gcm9tRGVwdGggKGFycmF5LCBkZXB0aCkge1xuICBpZiAodHlwZW9mIGRlcHRoICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIHRoZSBkZXB0aCB0byBiZSBhIG51bWJlcicpXG4gIH1cblxuICByZXR1cm4gZmxhdHRlbkRvd25EZXB0aChhcnJheSwgW10sIGRlcHRoKVxufVxuXG4vKipcbiAqIEZsYXR0ZW4gYW4gYXJyYXkgaW5kZWZpbml0ZWx5LlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSBhcnJheVxuICogQHBhcmFtICB7QXJyYXl9IHJlc3VsdFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIGZsYXR0ZW5Eb3duIChhcnJheSwgcmVzdWx0KSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpXVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBmbGF0dGVuRG93bih2YWx1ZSwgcmVzdWx0KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucHVzaCh2YWx1ZSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogRmxhdHRlbiBhbiBhcnJheSB3aXRoIGRlcHRoLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgYXJyYXlcbiAqIEBwYXJhbSAge0FycmF5fSAgcmVzdWx0XG4gKiBAcGFyYW0gIHtudW1iZXJ9IGRlcHRoXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gZmxhdHRlbkRvd25EZXB0aCAoYXJyYXksIHJlc3VsdCwgZGVwdGgpIHtcbiAgZGVwdGgtLVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdmFsdWUgPSBhcnJheVtpXVxuXG4gICAgaWYgKGRlcHRoID4gLTEgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGZsYXR0ZW5Eb3duRGVwdGgodmFsdWUsIHJlc3VsdCwgZGVwdGgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cbiIsIi8qIVxuICogYXJyYXlpZnktY29tcGFjdCA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvYXJyYXlpZnktY29tcGFjdD5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgSm9uIFNjaGxpbmtlcnQsIGNvbnRyaWJ1dG9ycy5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZVxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGZsYXR0ZW4gPSByZXF1aXJlKCdhcnJheS1mbGF0dGVuJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiBmbGF0dGVuKCFBcnJheS5pc0FycmF5KGFycikgPyBbYXJyXSA6IGFycilcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xufTtcbiIsIi8qKlxyXG4gKiBBdWRpb0J1ZmZlciBjbGFzc1xyXG4gKlxyXG4gKiBAbW9kdWxlIGF1ZGlvLWJ1ZmZlci9idWZmZXJcclxuICovXHJcblxyXG5cclxudmFyIGlzQnVmZmVyID0gcmVxdWlyZSgnaXMtYnVmZmVyJyk7XHJcbnZhciBiMmFiID0gcmVxdWlyZSgnYnVmZmVyLXRvLWFycmF5YnVmZmVyJyk7XHJcbnZhciBpc0Jyb3dzZXIgPSByZXF1aXJlKCdpcy1icm93c2VyJyk7XHJcbnZhciBpc0F1ZGlvQnVmZmVyID0gcmVxdWlyZSgnaXMtYXVkaW8tYnVmZmVyJyk7XHJcbnZhciBjb250ZXh0ID0gcmVxdWlyZSgnYXVkaW8tY29udGV4dCcpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICpcclxuICogQHBhcmFtIHviiIB9IGRhdGEgQW55IGNvbGxlY3Rpb24tbGlrZSBvYmplY3RcclxuICovXHJcbmZ1bmN0aW9uIEF1ZGlvQnVmZmVyIChjaGFubmVscywgZGF0YSwgc2FtcGxlUmF0ZSkge1xyXG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBBdWRpb0J1ZmZlcikpIHJldHVybiBuZXcgQXVkaW9CdWZmZXIoY2hhbm5lbHMsIGRhdGEsIHNhbXBsZVJhdGUpO1xyXG5cclxuXHQvL2lmIG9uZSBhcmd1bWVudCBvbmx5IC0gaXQgaXMgc3VyZWx5IGRhdGEgb3IgbGVuZ3RoXHJcblx0Ly9oYXZpbmcgbmV3IEF1ZGlvQnVmZmVyKDIpIGRvZXMgbm90IG1ha2Ugc2Vuc2UgYXMgMiAtIG51bWJlciBvZiBjaGFubmVsc1xyXG5cdGlmIChkYXRhID09IG51bGwpIHtcclxuXHRcdGRhdGEgPSBjaGFubmVscztcclxuXHRcdGNoYW5uZWxzID0gbnVsbDtcclxuXHR9XHJcblx0Ly9hdWRpb0N0eC5jcmVhdGVCdWZmZXIoKSAtIGNvbXBsYWNlbnQgYXJndW1lbnRzXHJcblx0ZWxzZSB7XHJcblx0XHRpZiAoc2FtcGxlUmF0ZSAhPSBudWxsKSB0aGlzLnNhbXBsZVJhdGUgPSBzYW1wbGVSYXRlO1xyXG5cdFx0aWYgKGNoYW5uZWxzICE9IG51bGwpIHRoaXMubnVtYmVyT2ZDaGFubmVscyA9IGNoYW5uZWxzO1xyXG5cdH1cclxuXHJcblxyXG5cdC8vaWYgbnVtYmVyID0gY3JlYXRlIG5ldyBhcnJheSAoc3BlYydzIGNhc2UgLSBzdXBwb3NlIHRoYXQgbW9zdCB3aWRlc3ByZWFkKVxyXG5cdGlmICh0eXBlb2YgZGF0YSA9PT0gJ251bWJlcicpIHtcclxuXHRcdHRoaXMuZGF0YSA9IFtdO1xyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bWJlck9mQ2hhbm5lbHM7IGkrKyApIHtcclxuXHRcdFx0dGhpcy5kYXRhLnB1c2gobmV3IEF1ZGlvQnVmZmVyLkZsb2F0QXJyYXkoZGF0YSkpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvL2lmIG90aGVyIGF1ZGlvIGJ1ZmZlciBwYXNzZWQgLSBjcmVhdGUgZmFzdCBjbG9uZSBvZiBpdFxyXG5cdC8vaWYgV0FBIEF1ZGlvQnVmZmVyIC0gZ2V0IGJ1ZmZlcuKAmXMgZGF0YSAoaXQgaXMgYm91bmRlZClcclxuXHRlbHNlIGlmIChpc0F1ZGlvQnVmZmVyKGRhdGEpKSB7XHJcblx0XHR0aGlzLmRhdGEgPSBbXTtcclxuXHRcdGlmIChjaGFubmVscyA9PSBudWxsKSB0aGlzLm51bWJlck9mQ2hhbm5lbHMgPSBkYXRhLm51bWJlck9mQ2hhbm5lbHM7XHJcblx0XHRpZiAoc2FtcGxlUmF0ZSA9PSBudWxsKSB0aGlzLnNhbXBsZVJhdGUgPSBkYXRhLnNhbXBsZVJhdGU7XHJcblxyXG5cdFx0Ly9jb3B5IGNoYW5uZWwncyBkYXRhXHJcblx0XHRmb3IgKHZhciBpID0gMCwgbCA9IGRhdGEubnVtYmVyT2ZDaGFubmVsczsgaSA8IGw7IGkrKykge1xyXG5cdFx0XHR0aGlzLmRhdGEucHVzaChkYXRhLmdldENoYW5uZWxEYXRhKGkpLnNsaWNlKCkpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvL1R5cGVkQXJyYXksIEJ1ZmZlciwgRGF0YVZpZXcgZXRjLCBvciBBcnJheUJ1ZmZlclxyXG5cdC8vTk9URTogbm9kZSA0LngrIGRldGVjdHMgQnVmZmVyIGFzIEFycmF5QnVmZmVyIHZpZXdcclxuXHRlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkgfHwgZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGlzQnVmZmVyKGRhdGEpKSB7XHJcblx0XHR0aGlzLmRhdGEgPSBbXTtcclxuXHRcdGlmIChpc0J1ZmZlcihkYXRhKSkge1xyXG5cdFx0XHRkYXRhID0gYjJhYihkYXRhKTtcclxuXHRcdH1cclxuXHRcdGlmICghKGRhdGEgaW5zdGFuY2VvZiBBdWRpb0J1ZmZlci5GbG9hdEFycmF5KSkge1xyXG5cdFx0XHRkYXRhID0gbmV3IEF1ZGlvQnVmZmVyLkZsb2F0QXJyYXkoZGF0YS5idWZmZXIgfHwgZGF0YSk7XHJcblx0XHR9XHJcblx0XHR2YXIgbGVuID0gZGF0YS5sZW5ndGggLyB0aGlzLm51bWJlck9mQ2hhbm5lbHM7XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtYmVyT2ZDaGFubmVsczsgaSsrICkge1xyXG5cdFx0XHQvL05PVEU6IHdlIGNvdWxk4oCZdmUgZG9uZSBzdWJhcnJheSBoZXJlIHRvIGNyZWF0ZSBhIHJlZmVyZW5jZSwgYnV0Li4uXHJcblx0XHRcdC8vaXQgd2lsbCBub3QgYmUgY29tcGF0aWJsZSB3aXRoIHRoZSBXQUEgYnVmZmVyIC0gaXQgY2Fubm90IGJlIGEgcmVmZXJlbmNlXHJcblx0XHRcdHRoaXMuZGF0YS5wdXNoKGRhdGEuc2xpY2UoaSogbGVuLCBpICogbGVuICsgbGVuKSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vaWYgYXJyYXkgLSBwYXJzZSBjaGFubmVsZWQgZGF0YVxyXG5cdGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcclxuXHRcdHRoaXMuZGF0YSA9IFtdO1xyXG5cdFx0Ly9pZiBzZXBhcmF0ZWQgZGF0YSBwYXNzZWQgYWxyZWFkeVxyXG5cdFx0aWYgKGRhdGFbMF0gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bWJlck9mQ2hhbm5lbHM7IGkrKyApIHtcclxuXHRcdFx0XHR0aGlzLmRhdGEucHVzaChuZXcgQXVkaW9CdWZmZXIuRmxvYXRBcnJheShkYXRhW2ldKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8vcGxhaW4gYXJyYXkgcGFzc2VkXHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFyIGxlbiA9IE1hdGguZmxvb3IoZGF0YS5sZW5ndGggLyB0aGlzLm51bWJlck9mQ2hhbm5lbHMpO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtYmVyT2ZDaGFubmVsczsgaSsrICkge1xyXG5cdFx0XHRcdHZhciBjaGFubmVsRGF0YSA9IGRhdGEuc2xpY2UoaSAqIGxlbiwgaSAqIGxlbiArIGxlbik7XHJcblx0XHRcdFx0Ly9mb3JjZSBjaGFubmVsIGRhdGEgYmUgbnVtZXJpY1xyXG5cdFx0XHRcdGlmIChjaGFubmVsRGF0YVswXSA9PSBudWxsKSBjaGFubmVsRGF0YSA9IGxlbjtcclxuXHRcdFx0XHR0aGlzLmRhdGEucHVzaChuZXcgQXVkaW9CdWZmZXIuRmxvYXRBcnJheShjaGFubmVsRGF0YSkpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vaWYgbmRhcnJheSwgdHlwZWRhcnJheSBvciBvdGhlciBkYXRhLWhvbGRlciBwYXNzZWQgLSByZWRpcmVjdCBwbGFpbiBkYXRhYnVmZmVyXHJcblx0ZWxzZSBpZiAoZGF0YS5kYXRhIHx8IGRhdGEuYnVmZmVyKSB7XHJcblx0XHRyZXR1cm4gbmV3IEF1ZGlvQnVmZmVyKHRoaXMubnVtYmVyT2ZDaGFubmVscywgZGF0YS5kYXRhIHx8IGRhdGEuYnVmZmVyLCB0aGlzLnNhbXBsZVJhdGUpO1xyXG5cdH1cclxuXHQvL2lmIG5vbmUgcGFzc2VkIChyYWRpY2FsIHdlaXJkIGNhc2UpLCBvciBubyB0eXBlIGRldGVjdGVkXHJcblx0ZWxzZSB7XHJcblx0XHQvL2l04oCZZCBiZSBzdHJhbmdlIHVzZS1jYXNlXHJcblx0XHR0aHJvdyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBidWZmZXI6IGNoZWNrIHByb3ZpZGVkIGFyZ3VtZW50cycpO1xyXG5cdH1cclxuXHJcblxyXG5cdC8vc2V0IHVwIHBhcmFtc1xyXG5cdHRoaXMubGVuZ3RoID0gdGhpcy5kYXRhWzBdLmxlbmd0aDtcclxuXHR0aGlzLmR1cmF0aW9uID0gdGhpcy5sZW5ndGggLyB0aGlzLnNhbXBsZVJhdGU7XHJcblxyXG5cclxuXHQvL2ZvciBicm93c2VyIC0ganVzdCByZXR1cm4gV0FBIGJ1ZmZlclxyXG5cdGlmIChBdWRpb0J1ZmZlci5pc1dBQSkge1xyXG5cdFx0Ly9jcmVhdGUgV0FBIGJ1ZmZlclxyXG5cdFx0dmFyIGF1ZGlvQnVmZmVyID0gQXVkaW9CdWZmZXIuY29udGV4dC5jcmVhdGVCdWZmZXIodGhpcy5udW1iZXJPZkNoYW5uZWxzLCB0aGlzLmxlbmd0aCwgdGhpcy5zYW1wbGVSYXRlKTtcclxuXHJcblx0XHQvL2ZpbGwgY2hhbm5lbHNcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuXHRcdFx0YXVkaW9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSkuc2V0KHRoaXMuZ2V0Q2hhbm5lbERhdGEoaSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBhdWRpb0J1ZmZlcjtcclxuXHR9XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHQgcGFyYW1zXHJcbiAqL1xyXG5BdWRpb0J1ZmZlci5wcm90b3R5cGUubnVtYmVyT2ZDaGFubmVscyA9IDI7XHJcbkF1ZGlvQnVmZmVyLnByb3RvdHlwZS5zYW1wbGVSYXRlID0gNDQxMDA7XHJcblxyXG5cclxuLyoqIFR5cGUgb2Ygc3RvcmFnZSB0byB1c2UgKi9cclxuQXVkaW9CdWZmZXIuRmxvYXRBcnJheSA9IEZsb2F0MzJBcnJheTtcclxuXHJcblxyXG4vKiogU2V0IGNvbnRleHQsIHRob3VnaCBjYW4gYmUgcmVkZWZpbmVkICovXHJcbkF1ZGlvQnVmZmVyLmNvbnRleHQgPSBjb250ZXh0O1xyXG5cclxuXHJcbi8qKiBXaGV0aGVyIFdlYkF1ZGlvQnVmZmVyIHNob3VsZCBiZSBjcmVhdGVkICovXHJcbkF1ZGlvQnVmZmVyLmlzV0FBID0gaXNCcm93c2VyICYmIGNvbnRleHQuY3JlYXRlQnVmZmVyO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGNoYW5uZWwuXHJcbiAqXHJcbiAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBjb250YWluaW5nIHRoZSBkYXRhXHJcbiAqL1xyXG5BdWRpb0J1ZmZlci5wcm90b3R5cGUuZ2V0Q2hhbm5lbERhdGEgPSBmdW5jdGlvbiAoY2hhbm5lbCkge1xyXG5cdC8vRklYTUU6IHBvbmRlciBvbiB0aGlzLCB3aGV0aGVyIHdlIHJlYWxseSBuZWVkIHRoYXQgcmlnb3JvdXMgY2hlY2ssIGl0IG1heSBhZmZlY3QgcGVyZm9ybWFuY2VcclxuXHRpZiAoY2hhbm5lbCA+IHRoaXMubnVtYmVyT2ZDaGFubmVscyB8fCBjaGFubmVsIDwgMCB8fCBjaGFubmVsID09IG51bGwpIHRocm93IEVycm9yKCdDYW5ub3QgZ2V0Q2hhbm5lbERhdGE6IGNoYW5uZWwgbnVtYmVyICgnICsgY2hhbm5lbCArICcpIGV4Y2VlZHMgbnVtYmVyIG9mIGNoYW5uZWxzICgnICsgdGhpcy5udW1iZXJPZkNoYW5uZWxzICsgJyknKTtcclxuXHRyZXR1cm4gdGhpcy5kYXRhW2NoYW5uZWxdO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQbGFjZSBkYXRhIHRvIHRoZSBkZXN0aW5hdGlvbiBidWZmZXIsIHN0YXJ0aW5nIGZyb20gdGhlIHBvc2l0aW9uXHJcbiAqL1xyXG5BdWRpb0J1ZmZlci5wcm90b3R5cGUuY29weUZyb21DaGFubmVsID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uLCBjaGFubmVsTnVtYmVyLCBzdGFydEluQ2hhbm5lbCkge1xyXG5cdHZhciBkYXRhID0gdGhpcy5kYXRhW2NoYW5uZWxOdW1iZXJdO1xyXG5cdGlmIChzdGFydEluQ2hhbm5lbCA9PSBudWxsKSBzdGFydEluQ2hhbm5lbCA9IDA7XHJcblx0Zm9yICh2YXIgaSA9IHN0YXJ0SW5DaGFubmVsLCBqID0gMDsgaSA8IGRhdGEubGVuZ3RoICYmIGogPCBkZXN0aW5hdGlvbi5sZW5ndGg7IGkrKywgaisrKSB7XHJcblx0XHRkZXN0aW5hdGlvbltqXSA9IGRhdGFbaV07XHJcblx0fVxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBQbGFjZSBkYXRhIGZyb20gdGhlIHNvdXJjZSB0byB0aGUgY2hhbm5lbCwgc3RhcnRpbmcgKGluIHNlbGYpIGZyb20gdGhlIHBvc2l0aW9uXHJcbiAqIENsb25lIG9mIFdBQXVkaW9CdWZmZXJcclxuICovXHJcbkF1ZGlvQnVmZmVyLnByb3RvdHlwZS5jb3B5VG9DaGFubmVsID0gZnVuY3Rpb24gKHNvdXJjZSwgY2hhbm5lbE51bWJlciwgc3RhcnRJbkNoYW5uZWwpIHtcclxuXHR2YXIgZGF0YSA9IHRoaXMuZGF0YVtjaGFubmVsTnVtYmVyXTtcclxuXHJcblx0aWYgKCFzdGFydEluQ2hhbm5lbCkgc3RhcnRJbkNoYW5uZWwgPSAwO1xyXG5cclxuXHRmb3IgKHZhciBpID0gc3RhcnRJbkNoYW5uZWwsIGogPSAwOyBpIDwgdGhpcy5sZW5ndGggJiYgaiA8IHNvdXJjZS5sZW5ndGg7IGkrKywgaisrKSB7XHJcblx0XHRkYXRhW2ldID0gc291cmNlW2pdO1xyXG5cdH1cclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvQnVmZmVyOyIsInZhciB3aW5kb3cgPSByZXF1aXJlKCdnbG9iYWwvd2luZG93Jyk7XG5cbnZhciBDb250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuaWYgKENvbnRleHQpIG1vZHVsZS5leHBvcnRzID0gbmV3IENvbnRleHQ7XG4iLCIvKipcclxuICogQG1vZHVsZSAgYXVkaW8tdGFibGVcclxuICovXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblx0c2luOiBzaW4sXHJcblx0Y29zOiBjb3MsXHJcblx0c2F3OiBzYXcsXHJcblx0dHJpYW5nbGU6IHRyaWFuZ2xlLFxyXG5cdHNxdWFyZTogc3F1YXJlLFxyXG5cdGRlbHRhOiBkZWx0YSxcclxuXHRwdWxzZTogcHVsc2UsXHJcblx0bm9pc2U6IG5vaXNlLFxyXG5cdC8vIHdhdmU6IHJlcXVpcmUoJy4vd2F2ZScpXHJcblx0Ly8gc2NhbGU6IHJlcXVpcmUoJy4vc2NhbGUnKVxyXG5cdGZpbGw6IGZpbGxcclxufTtcclxuXHJcblxyXG52YXIgcGkyID0gTWF0aC5QSSAqIDI7XHJcblxyXG5cclxuZnVuY3Rpb24gbm9pc2UgKGFyZykge1xyXG5cdHJldHVybiBmaWxsKGFyZywgZnVuY3Rpb24gKHZhbCkge1xyXG5cdFx0cmV0dXJuIE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcclxuXHR9KVxyXG59O1xyXG5cclxuXHJcbmZ1bmN0aW9uIHRyaWFuZ2xlIChhcmcsIHNjYWxlKSB7XHJcblx0aWYgKHNjYWxlID09IG51bGwpIHNjYWxlID0gMC41O1xyXG5cclxuXHRyZXR1cm4gZmlsbChhcmcsIGZ1bmN0aW9uICh2YWwsIGksIGRhdGEpIHtcclxuXHRcdHZhciBsID0gZGF0YS5sZW5ndGg7XHJcblx0XHR2YXIgbDIgPSBsIC8gMjtcclxuXHRcdHZhciBsMnNjYWxlID0gbDIgKiBzY2FsZTtcclxuXHJcblx0XHRpZiAoaSA8IGwyc2NhbGUpIHJldHVybiBpIC8gbDJzY2FsZTtcclxuXHRcdGlmIChpIDwgbCAtIGwyc2NhbGUpIHJldHVybiAxIC0gKGkgLSBsMnNjYWxlKSAqIDIgLyAobCAtIGwyKTtcclxuXHRcdHJldHVybiAxIC0gKGkgLSBsIC0gbDJzY2FsZSkgLyAobCAtIGwgLSBsMnNjYWxlKTtcclxuXHR9KTtcclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBjb3MgKGFyZywgd2F2ZW51bWJlcikge1xyXG5cdGlmICh3YXZlbnVtYmVyID09IG51bGwpIHdhdmVudW1iZXIgPSAxO1xyXG5cclxuXHRyZXR1cm4gZmlsbChhcmcsIGZ1bmN0aW9uKHZhbCwgaSwgZGF0YSkge1xyXG5cdFx0cmV0dXJuIE1hdGguY29zKE1hdGguUEkgKiAyICogd2F2ZW51bWJlciAqIGkgLyBkYXRhLmxlbmd0aClcclxuXHR9KTtcclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBzaW4gKGFyZywgd2F2ZW51bWJlcikge1xyXG5cdGlmICh3YXZlbnVtYmVyID09IG51bGwpIHdhdmVudW1iZXIgPSAxO1xyXG5cclxuXHRyZXR1cm4gZmlsbChhcmcsIGZ1bmN0aW9uKHZhbCwgaSwgZGF0YSkge1xyXG5cdFx0cmV0dXJuIE1hdGguc2luKE1hdGguUEkgKiAyICogd2F2ZW51bWJlciAqIGkgLyBkYXRhLmxlbmd0aClcclxuXHR9KTtcclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBkZWx0YSAoYXJnKSB7XHJcblx0cmV0dXJuIGZpbGwoYXJnLCBmdW5jdGlvbih2YWwsIGksIGRhdGEpIHtcclxuXHRcdHJldHVybiBpID09PSAwID8gMSA6IDA7XHJcblx0fSk7XHJcbn07XHJcblxyXG5cclxuZnVuY3Rpb24gcHVsc2UgKGFyZywgd2VpZ2h0KSB7XHJcblx0aWYgKHdlaWdodCA9PSBudWxsKSB3ZWlnaHQgPSAwO1xyXG5cclxuXHRyZXR1cm4gZmlsbChhcmcsIGZ1bmN0aW9uKHZhbCwgaSwgZGF0YSkge1xyXG5cdFx0cmV0dXJuIGkgPCBNYXRoLm1heChkYXRhLmxlbmd0aCAqIHdlaWdodCwgMSkgPyAxIDogLTE7XHJcblx0fSk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBzcXVhcmUgKGFyZykge1xyXG5cdHJldHVybiBwdWxzZShhcmcsIDAuNSk7XHJcbn07XHJcblxyXG5cclxuZnVuY3Rpb24gc2F3IChhcmcpIHtcclxuXHRyZXR1cm4gZmlsbChhcmcsIGZ1bmN0aW9uKHZhbCwgaSwgZGF0YSkge1xyXG5cdFx0cmV0dXJuIDEgLSAyICogaSAvIChkYXRhLmxlbmd0aCAtIDEpO1xyXG5cdH0pO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGaWxsIHBhc3NlZCBhcnJheSBvciBjcmVhdGUgYXJyYXkgYW5kIGZpbGwgd2l0aCB0aGUgZnVuY3Rpb25cclxuICogRnJvbSB0aGUgc3RhcnQvZW5kIHBvc2l0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gZmlsbCAoYXJnLCBmbiwgc3RhcnQsIGVuZCkge1xyXG5cdHZhciB0YWJsZSA9IGdldExpc3QoYXJnKTtcclxuXHJcblx0aWYgKHN0YXJ0ID09IG51bGwpIHN0YXJ0ID0gMDtcclxuXHRlbHNlIGlmIChzdGFydCA8IDApIHN0YXJ0ICs9IHRhYmxlLmxlbmd0aDtcclxuXHRpZiAoZW5kID09IG51bGwpIGVuZCA9IHRhYmxlLmxlbmd0aDtcclxuXHRlbHNlIGlmIChlbmQgPCAwKSBlbmQgKz0gdGFibGUubGVuZ3RoO1xyXG5cclxuXHRmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xyXG5cdFx0dGFibGVbaV0gPSBmbih0YWJsZVtpXSwgaSwgdGFibGUpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRhYmxlO1xyXG59O1xyXG5cclxuXHJcbmZ1bmN0aW9uIGdldExpc3QgKGFyZykge1xyXG5cdGlmICghYXJnKSB0aHJvdyBFcnJvcignQ2Fubm90IGNyZWF0ZSB1bmRlZmluZWQgd2F2ZXRhYmxlLiBQbGVhc2UsIHBhc3MgdGhlIG51bWJlciBvciBBcnJheScpXHJcblx0aWYgKGFyZy5sZW5ndGggIT0gbnVsbCkgcmV0dXJuIGFyZztcclxuXHRlbHNlIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGFyZylcclxufTsiLCJ2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXHR2YXIgUExVU19VUkxfU0FGRSA9ICctJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSF9VUkxfU0FGRSA9ICdfJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMgfHxcblx0XHQgICAgY29kZSA9PT0gUExVU19VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0ggfHxcblx0XHQgICAgY29kZSA9PT0gU0xBU0hfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcbiIsIihmdW5jdGlvbihyb290KSB7XG4gIHZhciBpc0FycmF5QnVmZmVyU3VwcG9ydGVkID0gKG5ldyBCdWZmZXIoMCkpLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyO1xuXG4gIHZhciBidWZmZXJUb0FycmF5QnVmZmVyID0gaXNBcnJheUJ1ZmZlclN1cHBvcnRlZCA/IGJ1ZmZlclRvQXJyYXlCdWZmZXJTbGljZSA6IGJ1ZmZlclRvQXJyYXlCdWZmZXJDeWNsZTtcblxuICBmdW5jdGlvbiBidWZmZXJUb0FycmF5QnVmZmVyU2xpY2UoYnVmZmVyKSB7XG4gICAgcmV0dXJuIGJ1ZmZlci5idWZmZXIuc2xpY2UoYnVmZmVyLmJ5dGVPZmZzZXQsIGJ1ZmZlci5ieXRlT2Zmc2V0ICsgYnVmZmVyLmJ5dGVMZW5ndGgpO1xuICB9XG5cbiAgZnVuY3Rpb24gYnVmZmVyVG9BcnJheUJ1ZmZlckN5Y2xlKGJ1ZmZlcikge1xuICAgIHZhciBhYiA9IG5ldyBBcnJheUJ1ZmZlcihidWZmZXIubGVuZ3RoKTtcbiAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGFiKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1ZmZlci5sZW5ndGg7ICsraSkge1xuICAgICAgdmlld1tpXSA9IGJ1ZmZlcltpXTtcbiAgICB9XG4gICAgcmV0dXJuIGFiO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gYnVmZmVyVG9BcnJheUJ1ZmZlcjtcbiAgICB9XG4gICAgZXhwb3J0cy5idWZmZXJUb0FycmF5QnVmZmVyID0gYnVmZmVyVG9BcnJheUJ1ZmZlcjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGJ1ZmZlclRvQXJyYXlCdWZmZXI7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5idWZmZXJUb0FycmF5QnVmZmVyID0gYnVmZmVyVG9BcnJheUJ1ZmZlcjtcbiAgfVxufSkodGhpcyk7XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbnZhciByb290UGFyZW50ID0ge31cblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBTYWZhcmkgNS03IGxhY2tzIHN1cHBvcnQgZm9yIGNoYW5naW5nIHRoZSBgT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvcmAgcHJvcGVydHlcbiAqICAgICBvbiBvYmplY3RzLlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVCAhPT0gdW5kZWZpbmVkXG4gID8gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgOiB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgZnVuY3Rpb24gQmFyICgpIHt9XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICBhcnIuY29uc3RydWN0b3IgPSBCYXJcbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICBhcnIuY29uc3RydWN0b3IgPT09IEJhciAmJiAvLyBjb25zdHJ1Y3RvciBjYW4gYmUgc2V0XG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5mdW5jdGlvbiBrTWF4TGVuZ3RoICgpIHtcbiAgcmV0dXJuIEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gICAgPyAweDdmZmZmZmZmXG4gICAgOiAweDNmZmZmZmZmXG59XG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKGFyZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIC8vIEF2b2lkIGdvaW5nIHRocm91Z2ggYW4gQXJndW1lbnRzQWRhcHRvclRyYW1wb2xpbmUgaW4gdGhlIGNvbW1vbiBjYXNlLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgcmV0dXJuIG5ldyBCdWZmZXIoYXJnLCBhcmd1bWVudHNbMV0pXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoYXJnKVxuICB9XG5cbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXMubGVuZ3RoID0gMFxuICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkXG4gIH1cblxuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIGZyb21OdW1iZXIodGhpcywgYXJnKVxuICB9XG5cbiAgLy8gU2xpZ2h0bHkgbGVzcyBjb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodGhpcywgYXJnLCBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6ICd1dGY4JylcbiAgfVxuXG4gIC8vIFVudXN1YWwuXG4gIHJldHVybiBmcm9tT2JqZWN0KHRoaXMsIGFyZylcbn1cblxuZnVuY3Rpb24gZnJvbU51bWJlciAodGhhdCwgbGVuZ3RoKSB7XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGggPCAwID8gMCA6IGNoZWNrZWQobGVuZ3RoKSB8IDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGF0W2ldID0gMFxuICAgIH1cbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nICh0aGF0LCBzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykgZW5jb2RpbmcgPSAndXRmOCdcblxuICAvLyBBc3N1bXB0aW9uOiBieXRlTGVuZ3RoKCkgcmV0dXJuIHZhbHVlIGlzIGFsd2F5cyA8IGtNYXhMZW5ndGguXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIHRoYXQud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqZWN0KSkgcmV0dXJuIGZyb21CdWZmZXIodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChpc0FycmF5KG9iamVjdCkpIHJldHVybiBmcm9tQXJyYXkodGhhdCwgb2JqZWN0KVxuXG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ211c3Qgc3RhcnQgd2l0aCBudW1iZXIsIGJ1ZmZlciwgYXJyYXkgb3Igc3RyaW5nJylcbiAgfVxuXG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKG9iamVjdC5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21UeXBlZEFycmF5KHRoYXQsIG9iamVjdClcbiAgICB9XG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHRoYXQsIG9iamVjdClcbiAgICB9XG4gIH1cblxuICBpZiAob2JqZWN0Lmxlbmd0aCkgcmV0dXJuIGZyb21BcnJheUxpa2UodGhhdCwgb2JqZWN0KVxuXG4gIHJldHVybiBmcm9tSnNvbk9iamVjdCh0aGF0LCBvYmplY3QpXG59XG5cbmZ1bmN0aW9uIGZyb21CdWZmZXIgKHRoYXQsIGJ1ZmZlcikge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChidWZmZXIubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgYnVmZmVyLmNvcHkodGhhdCwgMCwgMCwgbGVuZ3RoKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEdXBsaWNhdGUgb2YgZnJvbUFycmF5KCkgdG8ga2VlcCBmcm9tQXJyYXkoKSBtb25vbW9ycGhpYy5cbmZ1bmN0aW9uIGZyb21UeXBlZEFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICAvLyBUcnVuY2F0aW5nIHRoZSBlbGVtZW50cyBpcyBwcm9iYWJseSBub3Qgd2hhdCBwZW9wbGUgZXhwZWN0IGZyb20gdHlwZWRcbiAgLy8gYXJyYXlzIHdpdGggQllURVNfUEVSX0VMRU1FTlQgPiAxIGJ1dCBpdCdzIGNvbXBhdGlibGUgd2l0aCB0aGUgYmVoYXZpb3JcbiAgLy8gb2YgdGhlIG9sZCBCdWZmZXIgY29uc3RydWN0b3IuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKHRoYXQsIGFycmF5KSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGFycmF5LmJ5dGVMZW5ndGhcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdCA9IGZyb21UeXBlZEFycmF5KHRoYXQsIG5ldyBVaW50OEFycmF5KGFycmF5KSlcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRGVzZXJpYWxpemUgeyB0eXBlOiAnQnVmZmVyJywgZGF0YTogWzEsMiwzLC4uLl0gfSBpbnRvIGEgQnVmZmVyIG9iamVjdC5cbi8vIFJldHVybnMgYSB6ZXJvLWxlbmd0aCBidWZmZXIgZm9yIGlucHV0cyB0aGF0IGRvbid0IGNvbmZvcm0gdG8gdGhlIHNwZWMuXG5mdW5jdGlvbiBmcm9tSnNvbk9iamVjdCAodGhhdCwgb2JqZWN0KSB7XG4gIHZhciBhcnJheVxuICB2YXIgbGVuZ3RoID0gMFxuXG4gIGlmIChvYmplY3QudHlwZSA9PT0gJ0J1ZmZlcicgJiYgaXNBcnJheShvYmplY3QuZGF0YSkpIHtcbiAgICBhcnJheSA9IG9iamVjdC5kYXRhXG4gICAgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB9XG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICBCdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG4gIEJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG59IGVsc2Uge1xuICAvLyBwcmUtc2V0IGZvciB2YWx1ZXMgdGhhdCBtYXkgZXhpc3QgaW4gdGhlIGZ1dHVyZVxuICBCdWZmZXIucHJvdG90eXBlLmxlbmd0aCA9IHVuZGVmaW5lZFxuICBCdWZmZXIucHJvdG90eXBlLnBhcmVudCA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZSAodGhhdCwgbGVuZ3RoKSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgICB0aGF0Ll9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdC5sZW5ndGggPSBsZW5ndGhcbiAgICB0aGF0Ll9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBmcm9tUG9vbCA9IGxlbmd0aCAhPT0gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplID4+PiAxXG4gIGlmIChmcm9tUG9vbCkgdGhhdC5wYXJlbnQgPSByb290UGFyZW50XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IGtNYXhMZW5ndGhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0ga01heExlbmd0aCgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgoKS50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2xvd0J1ZmZlcikpIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcbiAgZGVsZXRlIGJ1Zi5wYXJlbnRcbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgdmFyIGkgPSAwXG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSBicmVha1xuXG4gICAgKytpXG4gIH1cblxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdsaXN0IGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycy4nKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykgc3RyaW5nID0gJycgKyBzdHJpbmdcblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAobGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIC8vIERlcHJlY2F0ZWRcbiAgICAgIGNhc2UgJ3Jhdyc6XG4gICAgICBjYXNlICdyYXdzJzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICBzdGFydCA9IHN0YXJ0IHwgMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPT09IEluZmluaXR5ID8gdGhpcy5sZW5ndGggOiBlbmQgfCAwXG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcbiAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKGVuZCA8PSBzdGFydCkgcmV0dXJuICcnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCB8IDBcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLm1hdGNoKC8uezJ9L2cpLmpvaW4oJyAnKVxuICAgIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiAwXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICBieXRlT2Zmc2V0ID4+PSAwXG5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVybiAtMVxuXG4gIC8vIE5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gTWF0aC5tYXgodGhpcy5sZW5ndGggKyBieXRlT2Zmc2V0LCAwKVxuXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSByZXR1cm4gLTEgLy8gc3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcgYWx3YXlzIGZhaWxzXG4gICAgcmV0dXJuIFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgfVxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgfVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgWyB2YWwgXSwgYnl0ZU9mZnNldClcbiAgfVxuXG4gIGZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yICh2YXIgaSA9IDA7IGJ5dGVPZmZzZXQgKyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyW2J5dGVPZmZzZXQgKyBpXSA9PT0gdmFsW2ZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4XSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbC5sZW5ndGgpIHJldHVybiBieXRlT2Zmc2V0ICsgZm91bmRJbmRleFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuLy8gYGdldGAgaXMgZGVwcmVjYXRlZFxuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgaXMgZGVwcmVjYXRlZFxuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAoaXNOYU4ocGFyc2VkKSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggfCAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgLy8gbGVnYWN5IHdyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKSAtIHJlbW92ZSBpbiB2MC4xM1xuICB9IGVsc2Uge1xuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aCB8IDBcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignYXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IEJ1ZmZlci5fYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgaWYgKG5ld0J1Zi5sZW5ndGgpIG5ld0J1Zi5wYXJlbnQgPSB0aGlzLnBhcmVudCB8fCB0aGlzXG5cbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdidWZmZXIgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpLCAwKVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpLCAwKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG4gIHZhciBpXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2UgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gYXNjZW5kaW5nIGNvcHkgZnJvbSBzdGFydFxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0Ll9zZXQodGhpcy5zdWJhcnJheShzdGFydCwgc3RhcnQgKyBsZW4pLCB0YXJnZXRTdGFydClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGlmIChlbmQgPCBzdGFydCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCA8IHN0YXJ0JylcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gdXRmOFRvQnl0ZXModmFsdWUudG9TdHJpbmcoKSlcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gdG9BcnJheUJ1ZmZlciAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gX2F1Z21lbnQgKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IHNldCBtZXRob2QgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWRcbiAgYXJyLmdldCA9IEJQLmdldFxuICBhcnIuc2V0ID0gQlAuc2V0XG5cbiAgYXJyLndyaXRlID0gQlAud3JpdGVcbiAgYXJyLnRvU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvTG9jYWxlU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvSlNPTiA9IEJQLnRvSlNPTlxuICBhcnIuZXF1YWxzID0gQlAuZXF1YWxzXG4gIGFyci5jb21wYXJlID0gQlAuY29tcGFyZVxuICBhcnIuaW5kZXhPZiA9IEJQLmluZGV4T2ZcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludExFID0gQlAucmVhZFVJbnRMRVxuICBhcnIucmVhZFVJbnRCRSA9IEJQLnJlYWRVSW50QkVcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50TEUgPSBCUC5yZWFkSW50TEVcbiAgYXJyLnJlYWRJbnRCRSA9IEJQLnJlYWRJbnRCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnRMRSA9IEJQLndyaXRlVUludExFXG4gIGFyci53cml0ZVVJbnRCRSA9IEJQLndyaXRlVUludEJFXG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnRMRSA9IEJQLndyaXRlSW50TEVcbiAgYXJyLndyaXRlSW50QkUgPSBCUC53cml0ZUludEJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0cmluZ3RyaW0oc3RyKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG4iLCJ2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIi8qKlxyXG4gKiBEZWZpbmUgc3RhdGVmdWwgcHJvcGVydHkgb24gYW4gb2JqZWN0XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmluZVN0YXRlO1xyXG5cclxudmFyIFN0YXRlID0gcmVxdWlyZSgnc3Q4Jyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmluZSBzdGF0ZWZ1bCBwcm9wZXJ0eSBvbiBhIHRhcmdldFxyXG4gKlxyXG4gKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IEFueSBvYmplY3RcclxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IFByb3BlcnR5IG5hbWVcclxuICogQHBhcmFtIHtvYmplY3R9IGRlc2NyaXB0b3IgU3RhdGUgZGVzY3JpcHRvclxyXG4gKlxyXG4gKiBAcmV0dXJuIHtvYmplY3R9IHRhcmdldFxyXG4gKi9cclxuZnVuY3Rpb24gZGVmaW5lU3RhdGUgKHRhcmdldCwgcHJvcGVydHksIGRlc2NyaXB0b3IsIGlzRm4pIHtcclxuXHQvL2RlZmluZSBhY2Nlc3NvciBvbiBhIHRhcmdldFxyXG5cdGlmIChpc0ZuKSB7XHJcblx0XHR0YXJnZXRbcHJvcGVydHldID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xyXG5cdFx0XHRcdHJldHVybiBzdGF0ZS5zZXQoYXJndW1lbnRzWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gc3RhdGUuZ2V0KCk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblx0fVxyXG5cclxuXHQvL2RlZmluZSBzZXR0ZXIvZ2V0dGVyIG9uIGEgdGFyZ2V0XHJcblx0ZWxzZSB7XHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eSwge1xyXG5cdFx0XHRzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRcdHJldHVybiBzdGF0ZS5zZXQodmFsdWUpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRnZXQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRyZXR1cm4gc3RhdGUuZ2V0KCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly9kZWZpbmUgc3RhdGUgY29udHJvbGxlclxyXG5cdHZhciBzdGF0ZSA9IG5ldyBTdGF0ZShkZXNjcmlwdG9yLCB0YXJnZXQpO1xyXG5cclxuXHRyZXR1cm4gdGFyZ2V0O1xyXG59IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBGVU5DVElPTlMgLy9cblxudmFyIGxuID0gTWF0aC5sb2c7XG5cblxuLy8gTk9STUFMIFRBSUwgLy9cblxuLyoqXG4qIEZVTkNUSU9OIGRSYW5Ob3JtYWxUYWlsKCBkTWluLCBpTmVnYXRpdmUsIHJhbmQgKVxuKlx0VHJhbnNmb3JtIHRoZSB0YWlsIG9mIHRoZSBub3JtYWwgZGlzdHJpYnV0aW9uIHRvXG4qXHR0aGUgdW5pdCBpbnRlcnZhbCBhbmQgdGhlbiB1c2UgcmVqZWN0aW9uIHRlY2huaXF1ZVxuKlx0dG8gZ2VuZXJhdGUgc3RhbmRhciBub3JtYWwgdmFyaWFibGUuXG4qXHRSZWZlcmVuY2U6XG4qXHRcdE1hcnNhY2xpYSwgRy4gKDE5NjQpLiBHZW5lcmF0aW5nIGEgVmFyaWFibGUgZnJvbSB0aGUgVGFpbFxuKlx0XHRvZiB0aGUgTm9ybWFsIERpc3RyaWJ1dGlvbi4gVGVjaG5vbWV0cmljcywgNigxKSxcbipcdFx0MTAx4oCTMTAyLiBkb2k6MTAuMTA4MC8wMDQwMTcwNi4xOTY0LjEwNDkwMTUwXG4qXG4qIEBwYXJhbSB7TnVtYmVyfSBkTWluIC0gc3RhcnQgdmFsdWUgb2YgdGhlIHJpZ2h0IHRhaWxcbiogQHBhcmFtIHtCb29sZWFufSBpTmVnYXRpdmUgLSBib29sZWFuIGluZGljYXRpbmcgd2hpY2ggc2lkZSB0byBldmFsdWF0ZVxuKiBAcmV0dXJucyB7TnVtYmVyfSBzdGFuZGFyZCBub3JtYWwgdmFyaWFibGVcbiovXG5mdW5jdGlvbiBkUmFuTm9ybWFsVGFpbCggZE1pbiwgaU5lZ2F0aXZlLCByYW5kICkge1xuXHR2YXIgeCwgeTtcblx0ZG8ge1xuXHRcdHggPSBsbiggcmFuZCgpICkgLyBkTWluO1xuXHRcdHkgPSBsbiggcmFuZCgpICk7XG5cdH0gd2hpbGUgKCAtMiAqIHkgPCB4ICogeCApO1xuXHRyZXR1cm4gaU5lZ2F0aXZlID8geCAtIGRNaW4gOiBkTWluIC0geDtcbn0gLy8gZW5kIEZVTkNUSU9OIGRSYW5Ob3JtYWxUYWlsKClcblxuXG4vLyBFWFBPUlRTIC8vXG5cbm1vZHVsZS5leHBvcnRzID0gZFJhbk5vcm1hbFRhaWw7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIE1PRFVMRVMgLy9cblxudmFyIGRSYW5Ob3JtYWxUYWlsID0gcmVxdWlyZSggJy4vZFJhbk5vcm1hbFRhaWwuanMnICk7XG5cblxuLy8gRlVOQ1RJT05TIC8vXG5cbnZhciBhYnMgPSBNYXRoLmFicyxcblx0ZXhwID0gTWF0aC5leHAsXG5cdGxvZyA9IE1hdGgubG9nLFxuXHRwb3cgPSBNYXRoLnBvdyxcblx0c3FydCA9IE1hdGguc3FydDtcblxuXG4vLyBDT05TVEFOVFMgLy9cblxudmFyIFRXT19QXzMyID0gcG93KCAyLCAzMik7XG5cblxuLy8gR0VORVJBVEUgTk9STUFMIFJBTkRPTSBOVU1CRVJTIC8vXG5cbi8qKlxuKiBGVU5DVElPTiByYW5kb20oIG11LCBzaWdtYVssIHJhbmRdIClcbipcdEdlbmVyYXRlcyBhIHJhbmRvbSBkcmF3IGZyb20gYSBub3JtYWwgZGlzdHJpYnV0aW9uXG4qXHR3aXRoIHBhcmFtZXRlcnMgYG11YCBhbmQgYHNpZ21hYC4gSW1wbGVtZW50YXRpb25cbipcdG9mIHRoZSBcIkltcHJvdmVkIFppZ2d1cmF0IE1ldGhvZFwiIGJ5IEouIERvb3JuaWsuXG4qXHRSZWZlcmVuY2U6XG4qXHRcdERvb3JuaWssIEouIGEuICgyMDA1KS5cbipcdFx0QW4gSW1wcm92ZWQgWmlnZ3VyYXQgTWV0aG9kIHRvIEdlbmVyYXRlIE5vcm1hbCBSYW5kb20gU2FtcGxlcy5cbipcbiogQHBhcmFtIHtOdW1iZXJ9IG11IC0gbWVhbiBwYXJhbWV0ZXJcbiogQHBhcmFtIHtOdW1iZXJ9IHNpZ21hIC0gc3RhbmRhcmQgZGV2aWF0aW9uXG4qIEBwYXJhbSB7RnVuY3Rpb259IFtyYW5kPU1hdGgucmFuZG9tXSAtIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yXG4qIEByZXR1cm5zIHtOdW1iZXJ9IHJhbmRvbSBkcmF3IGZyb20gdGhlIHNwZWNpZmllZCBkaXN0cmlidXRpb25cbiovXG5mdW5jdGlvbiByYW5kb20oIG11LCBzaWdtYSwgcmFuZCApIHtcblxuXHRpZiAoICFyYW5kICkge1xuXHRcdHJhbmQgPSBNYXRoLnJhbmRvbTtcblx0fVxuXG5cdHZhciBaSUdOT1JfQyA9IDEyOCwvKiBudW1iZXIgb2YgYmxvY2tzICovXG4gXHRcdFpJR05PUl9SID0gMy40NDI2MTk4NTU4OTksIC8qIHN0YXJ0IG9mIHRoZSByaWdodCB0YWlsICpcblx0XHQvKiAoUiAqIHBoaShSKSArIFByKFg+PVIpKSAqIHNxcnQoMlxccGkpICovXG5cdFx0WklHTk9SX1YgPSA5LjkxMjU2MzAzNTI2MjE3ZS0zLFxuXHRcdC8qIHNfYWRaaWdYIGhvbGRzIGNvb3JkaW5hdGVzLCBzdWNoIHRoYXQgZWFjaCByZWN0YW5nbGUgaGFzXG5cdFx0XHRzYW1lIGFyZWE7IHNfYWRaaWdSIGhvbGRzIHNfYWRaaWdYW2kgKyAxXSAvIHNfYWRaaWdYW2ldICovXG5cdFx0c19hZFppZ1ggPSBuZXcgQXJyYXkoIFpJR05PUl9DICsgMSApLFxuXHRcdHNfYWRaaWdSID0gbmV3IEFycmF5KCBaSUdOT1JfQyApLFxuXHRcdGksIGY7XG5cblx0ZiA9IGV4cCggLTAuNSAqIFpJR05PUl9SICogWklHTk9SX1IgKTtcblx0c19hZFppZ1hbMF0gPSBaSUdOT1JfViAvIGY7IC8qIFswXSBpcyBib3R0b20gYmxvY2s6IFYgLyBmKFIpICovXG5cdHNfYWRaaWdYWzFdID0gWklHTk9SX1I7XG5cdHNfYWRaaWdYW1pJR05PUl9DXSA9IDA7XG5cdGZvciAoIGkgPSAyOyBpIDwgWklHTk9SX0M7IGkrKyApIHtcblx0XHRzX2FkWmlnWFtpXSA9IHNxcnQoIC0yICogbG9nKCBaSUdOT1JfViAvIHNfYWRaaWdYW2kgLSAxXSArIGYgKSApO1xuXHRcdGYgPSBleHAoIC0wLjUgKiBzX2FkWmlnWFtpXSAqIHNfYWRaaWdYW2ldICk7XG5cdH1cblx0Zm9yICggaSA9IDA7IGkgPCBaSUdOT1JfQzsgaSsrICkge1xuXHRcdHNfYWRaaWdSW2ldID0gc19hZFppZ1hbaSArIDFdIC8gc19hZFppZ1hbaV07XG5cdH1cblx0dmFyIHgsIHUsIGYwLCBmMTtcblx0Zm9yICg7Oykge1xuXHRcdHUgPSAyICogcmFuZCgpIC0gMTtcblx0XHRpID0gVFdPX1BfMzIgKiByYW5kKCkgJiAweDdGO1xuXHRcdC8qIGZpcnN0IHRyeSB0aGUgcmVjdGFuZ3VsYXIgYm94ZXMgKi9cblx0XHRpZiAoIGFicyh1KSA8IHNfYWRaaWdSW2ldICkge1xuXHRcdFx0cmV0dXJuIG11ICsgc2lnbWEgKiB1ICogc19hZFppZ1hbaV07XG5cdFx0fVxuXHRcdC8qIGJvdHRvbSBib3g6IHNhbXBsZSBmcm9tIHRoZSB0YWlsICovXG5cdFx0aWYgKCBpID09PSAwICkge1xuXHRcdFx0cmV0dXJuIG11ICsgc2lnbWEgKiBkUmFuTm9ybWFsVGFpbCggWklHTk9SX1IsIHUgPCAwLCByYW5kICk7XG5cdFx0fVxuXHRcdC8qIGlzIHRoaXMgYSBzYW1wbGUgZnJvbSB0aGUgd2VkZ2VzPyAqL1xuXHRcdHggPSB1ICogc19hZFppZ1hbaV07XG5cdFx0ZjAgPSBleHAoIC0wLjUgKiAoIHNfYWRaaWdYW2ldICogc19hZFppZ1hbaV0gLSB4ICogeCApICk7XG5cdFx0ZjEgPSBleHAoIC0wLjUgKiAoIHNfYWRaaWdYW2krMV0gKiBzX2FkWmlnWFtpKzFdIC0geCAqIHggKSApO1xuXHRcdGlmICggZjEgKyByYW5kKCkgKiAoZjAgLSBmMSkgPCAxLjAgKSB7XG5cdFx0XHRyZXR1cm4gbXUgKyBzaWdtYSAqIHg7XG5cdFx0fVxuXHR9XG59IC8vIGVuZCBGVU5DVElPTiByYW5kb20oKVxuXG5cbi8vIEVYUE9SVFMgLy9cblxubW9kdWxlLmV4cG9ydHMgPSByYW5kb207XG4iLCIvKipcbiAqIFNpbXBsZSBkcmFnZ2FibGUgY29tcG9uZW50XG4gKlxuICogQG1vZHVsZSBkcmFnZ3lcbiAqL1xuXG5cbi8vd29yayB3aXRoIGNzc1xudmFyIGNzcyA9IHJlcXVpcmUoJ211Y3NzL2NzcycpO1xudmFyIHBhcnNlQ1NTVmFsdWUgPSByZXF1aXJlKCdtdWNzcy9wYXJzZS12YWx1ZScpO1xudmFyIHNlbGVjdGlvbiA9IHJlcXVpcmUoJ211Y3NzL3NlbGVjdGlvbicpO1xudmFyIG9mZnNldHMgPSByZXF1aXJlKCdtdWNzcy9vZmZzZXQnKTtcbnZhciBnZXRUcmFuc2xhdGUgPSByZXF1aXJlKCdtdWNzcy90cmFuc2xhdGUnKTtcbnZhciBpbnRlcnNlY3QgPSByZXF1aXJlKCdpbnRlcnNlY3RzJyk7XG5cbi8vZXZlbnRzXG52YXIgb24gPSByZXF1aXJlKCdlbW15L29uJyk7XG52YXIgb2ZmID0gcmVxdWlyZSgnZW1teS9vZmYnKTtcbnZhciBlbWl0ID0gcmVxdWlyZSgnZW1teS9lbWl0Jyk7XG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIGdldENsaWVudFggPSByZXF1aXJlKCdnZXQtY2xpZW50LXh5JykueDtcbnZhciBnZXRDbGllbnRZID0gcmVxdWlyZSgnZ2V0LWNsaWVudC14eScpLnk7XG5cbi8vdXRpbHNcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXMtYXJyYXknKTtcbnZhciBpc051bWJlciA9IHJlcXVpcmUoJ211dHlwZS9pcy1udW1iZXInKTtcbnZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ211dHlwZS9pcy1zdHJpbmcnKTtcbnZhciBpc0ZuID0gcmVxdWlyZSgnaXMtZnVuY3Rpb24nKTtcbnZhciBkZWZpbmVTdGF0ZSA9IHJlcXVpcmUoJ2RlZmluZS1zdGF0ZScpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kL211dGFibGUnKTtcbnZhciByb3VuZCA9IHJlcXVpcmUoJ211bWF0aC9yb3VuZCcpO1xudmFyIGJldHdlZW4gPSByZXF1aXJlKCdtdW1hdGgvYmV0d2VlbicpO1xudmFyIGxvb3AgPSByZXF1aXJlKCdtdW1hdGgvbG9vcCcpO1xudmFyIGdldFVpZCA9IHJlcXVpcmUoJ2dldC11aWQnKTtcbnZhciBxID0gcmVxdWlyZSgncXVlcmllZCcpO1xuXG5cbnZhciB3aW4gPSB3aW5kb3csIGRvYyA9IGRvY3VtZW50LCByb290ID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblxuXG4vKipcbiAqIERyYWdnYWJsZSBjb250cm9sbGVycyBhc3NvY2lhdGVkIHdpdGggZWxlbWVudHMuXG4gKlxuICogU3RvcmluZyB0aGVtIG9uIGVsZW1lbnRzIGlzXG4gKiAtIGxlYWstcHJvbmUsXG4gKiAtIHBvbGx1dGVzIGVsZW1lbnTigJlzIG5hbWVzcGFjZSxcbiAqIC0gcmVxdWlyZXMgc29tZSBhcnRpZmljaWFsIGtleSB0byBzdG9yZSxcbiAqIC0gdW5hYmxlIHRvIHJldHJpZXZlIGNvbnRyb2xsZXIgZWFzaWx5LlxuICpcbiAqIFRoYXQgaXMgd2h5IHdlYWttYXAuXG4gKi9cbnZhciBkcmFnZ2FibGVDYWNoZSA9IERyYWdnYWJsZS5jYWNoZSA9IG5ldyBXZWFrTWFwO1xuXG5cblxuLyoqXG4gKiBNYWtlIGFuIGVsZW1lbnQgZHJhZ2dhYmxlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCBBbiBlbGVtZW50IHdoZXRoZXIgaW4vb3V0IG9mIERPTVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgQW4gZHJhZ2dhYmxlIG9wdGlvbnNcbiAqXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gVGFyZ2V0IGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gRHJhZ2dhYmxlKHRhcmdldCwgb3B0aW9ucykge1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgRHJhZ2dhYmxlKSkge1xuXHRcdHJldHVybiBuZXcgRHJhZ2dhYmxlKHRhcmdldCwgb3B0aW9ucyk7XG5cdH1cblxuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly9nZXQgdW5pcXVlIGlkIGZvciBpbnN0YW5jZVxuXHQvL25lZWRlZCB0byB0cmFjayBldmVudCBiaW5kZXJzXG5cdHNlbGYuaWQgPSBnZXRVaWQoKTtcblx0c2VsZi5fbnMgPSAnLmRyYWdneV8nICsgc2VsZi5pZDtcblxuXHQvL3NhdmUgZWxlbWVudCBwYXNzZWRcblx0c2VsZi5lbGVtZW50ID0gdGFyZ2V0O1xuXG5cdGRyYWdnYWJsZUNhY2hlLnNldCh0YXJnZXQsIHNlbGYpO1xuXG5cdC8vZGVmaW5lIG1vZGUgb2YgZHJhZ1xuXHRkZWZpbmVTdGF0ZShzZWxmLCAnY3NzMycsIHNlbGYuY3NzMyk7XG5cdHNlbGYuY3NzMyA9IHRydWU7XG5cblx0Ly9kZWZpbmUgc3RhdGUgYmVoYXZpb3VyXG5cdGRlZmluZVN0YXRlKHNlbGYsICdzdGF0ZScsIHNlbGYuc3RhdGUpO1xuXG5cdC8vZGVmaW5lIGF4aXMgYmVoYXZpb3VyXG5cdGRlZmluZVN0YXRlKHNlbGYsICdheGlzJywgc2VsZi5heGlzKTtcblx0c2VsZi5heGlzID0gbnVsbDtcblxuXHQvL3ByZXNldCBoYW5kbGVzXG5cdHNlbGYuY3VycmVudEhhbmRsZXMgPSBbXTtcblxuXHQvL3Rha2Ugb3ZlciBvcHRpb25zXG5cdGV4dGVuZChzZWxmLCBvcHRpb25zKTtcblxuXHQvL2RlZmluZSBoYW5kbGVcblx0aWYgKCFzZWxmLmhhbmRsZSkge1xuXHRcdHNlbGYuaGFuZGxlID0gc2VsZi5lbGVtZW50O1xuXHR9XG5cblx0Ly9zZXR1cCBkcm9wcGFibGVcblx0aWYgKHNlbGYuZHJvcHBhYmxlKSB7XG5cdFx0c2VsZi5pbml0RHJvcHBhYmxlKCk7XG5cdH1cblxuXHQvL3RyeSB0byBjYWxjIG91dCBiYXNpYyBsaW1pdHNcblx0c2VsZi51cGRhdGUoKTtcblxuXHQvL2dvIHRvIGluaXRpYWwgc3RhdGVcblx0c2VsZi5zdGF0ZSA9ICdpZGxlJztcbn1cblxuXG4vKiogSW5oZXJpdCBkcmFnZ2FibGUgZnJvbSBFbWl0dGVyICovXG52YXIgcHJvdG8gPSBEcmFnZ2FibGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFbWl0dGVyLnByb3RvdHlwZSk7XG5cblxuLyoqIEluaXQgZHJvcHBhYmxlIFwicGx1Z2luXCIgKi9cbnByb3RvLmluaXREcm9wcGFibGUgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRvbihzZWxmLCAnZHJhZ3N0YXJ0JywgZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRzZWxmLmRyb3BUYXJnZXRzID0gcS5hbGwoc2VsZi5kcm9wcGFibGUpO1xuXHR9KTtcblxuXHRvbihzZWxmLCAnZHJhZycsIGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRpZiAoIXNlbGYuZHJvcFRhcmdldHMpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc2VsZlJlY3QgPSBvZmZzZXRzKHNlbGYuZWxlbWVudCk7XG5cblx0XHRzZWxmLmRyb3BUYXJnZXRzLmZvckVhY2goZnVuY3Rpb24gKGRyb3BUYXJnZXQpIHtcblx0XHRcdHZhciB0YXJnZXRSZWN0ID0gb2Zmc2V0cyhkcm9wVGFyZ2V0KTtcblxuXHRcdFx0aWYgKGludGVyc2VjdChzZWxmUmVjdCwgdGFyZ2V0UmVjdCwgc2VsZi5kcm9wcGFibGVUb2xlcmFuY2UpKSB7XG5cdFx0XHRcdGlmIChzZWxmLmRyb3BwYWJsZUNsYXNzKSB7XG5cdFx0XHRcdFx0ZHJvcFRhcmdldC5jbGFzc0xpc3QuYWRkKHNlbGYuZHJvcHBhYmxlQ2xhc3MpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghc2VsZi5kcm9wVGFyZ2V0KSB7XG5cdFx0XHRcdFx0c2VsZi5kcm9wVGFyZ2V0ID0gZHJvcFRhcmdldDtcblxuXHRcdFx0XHRcdGVtaXQoc2VsZiwgJ2RyYWdvdmVyJywgZHJvcFRhcmdldCk7XG5cdFx0XHRcdFx0ZW1pdChkcm9wVGFyZ2V0LCAnZHJhZ292ZXInLCBzZWxmKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmIChzZWxmLmRyb3BUYXJnZXQpIHtcblx0XHRcdFx0XHRlbWl0KHNlbGYsICdkcmFnb3V0JywgZHJvcFRhcmdldCk7XG5cdFx0XHRcdFx0ZW1pdChkcm9wVGFyZ2V0LCAnZHJhZ291dCcsIHNlbGYpO1xuXG5cdFx0XHRcdFx0c2VsZi5kcm9wVGFyZ2V0ID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoc2VsZi5kcm9wcGFibGVDbGFzcykge1xuXHRcdFx0XHRcdGRyb3BUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZShzZWxmLmRyb3BwYWJsZUNsYXNzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHRvbihzZWxmLCAnZHJhZ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHQvL2VtaXQgZHJvcCwgaWYgYW55XG5cdFx0aWYgKHNlbGYuZHJvcFRhcmdldCkge1xuXHRcdFx0ZW1pdChzZWxmLmRyb3BUYXJnZXQsICdkcm9wJywgc2VsZik7XG5cdFx0XHRlbWl0KHNlbGYsICdkcm9wJywgc2VsZi5kcm9wVGFyZ2V0KTtcblx0XHRcdHNlbGYuZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKHNlbGYuZHJvcHBhYmxlQ2xhc3MpO1xuXHRcdFx0c2VsZi5kcm9wVGFyZ2V0ID0gbnVsbDtcblx0XHR9XG5cdH0pO1xufTtcblxuXG4vKipcbiAqIERyYWdnYWJsZSBiZWhhdmlvdXJcbiAqIEBlbnVtIHtzdHJpbmd9XG4gKiBAZGVmYXVsdCBpcyAnaWRsZSdcbiAqL1xucHJvdG8uc3RhdGUgPSB7XG5cdC8vaWRsZVxuXHRfOiB7XG5cdFx0YmVmb3JlOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdHNlbGYuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdkcmFnZ3ktaWRsZScpO1xuXG5cdFx0XHQvL2VtaXQgZHJhZyBldnRzIG9uIGVsZW1lbnRcblx0XHRcdGVtaXQoc2VsZi5lbGVtZW50LCAnaWRsZScsIG51bGwsIHRydWUpO1xuXHRcdFx0c2VsZi5lbWl0KCdpZGxlJyk7XG5cblx0XHRcdG9uKGRvYywgJ21vdXNlZG93bicgKyBzZWxmLl9ucyArICcgdG91Y2hzdGFydCcgKyBzZWxmLl9ucywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0Ly9pZ25vcmUgbm9uLWRyYWdneSBldmVudHNcblx0XHRcdFx0aWYgKCFlLmRyYWdnaWVzKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9pZ25vcmUgZHJhZ3N0YXJ0IGZvciBub3QgcmVnaXN0ZXJlZCBkcmFnZ2llc1xuXHRcdFx0XHRpZiAoZS5kcmFnZ2llcy5pbmRleE9mKHNlbGYpIDwgMCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vaWYgdGFyZ2V0IGlzIGZvY3VzZWQgLSBpZ25vcmUgZHJhZ1xuXHRcdFx0XHRpZiAoZG9jLmFjdGl2ZUVsZW1lbnQgPT09IGUudGFyZ2V0KSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRcdC8vbXVsdGl0b3VjaCBoYXMgbXVsdGlwbGUgc3RhcnRzXG5cdFx0XHRcdHNlbGYuc2V0VG91Y2goZSk7XG5cblx0XHRcdFx0Ly91cGRhdGUgbW92ZW1lbnQgcGFyYW1zXG5cdFx0XHRcdHNlbGYudXBkYXRlKGUpO1xuXG5cdFx0XHRcdC8vZ28gdG8gdGhyZXNob2xkIHN0YXRlXG5cdFx0XHRcdHNlbGYuc3RhdGUgPSAndGhyZXNob2xkJztcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0YWZ0ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0c2VsZi5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWdneS1pZGxlJyk7XG5cblx0XHRcdG9mZihkb2MsIHNlbGYuX25zKTtcblxuXHRcdFx0Ly9zZXQgdXAgdHJhY2tpbmdcblx0XHRcdGlmIChzZWxmLnJlbGVhc2UpIHtcblx0XHRcdFx0c2VsZi5fdHJhY2tpbmdJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdFx0dmFyIG5vdyA9IERhdGUubm93KCk7XG5cdFx0XHRcdFx0dmFyIGVsYXBzZWQgPSBub3cgLSBzZWxmLnRpbWVzdGFtcDtcblxuXHRcdFx0XHRcdC8vZ2V0IGRlbHRhIG1vdmVtZW50IHNpbmNlIHRoZSBsYXN0IHRyYWNrXG5cdFx0XHRcdFx0dmFyIGRYID0gc2VsZi5wcmV2WCAtIHNlbGYuZnJhbWVbMF07XG5cdFx0XHRcdFx0dmFyIGRZID0gc2VsZi5wcmV2WSAtIHNlbGYuZnJhbWVbMV07XG5cdFx0XHRcdFx0c2VsZi5mcmFtZVswXSA9IHNlbGYucHJldlg7XG5cdFx0XHRcdFx0c2VsZi5mcmFtZVsxXSA9IHNlbGYucHJldlk7XG5cblx0XHRcdFx0XHR2YXIgZGVsdGEgPSBNYXRoLnNxcnQoZFggKiBkWCArIGRZICogZFkpO1xuXG5cdFx0XHRcdFx0Ly9nZXQgc3BlZWQgYXMgYXZlcmFnZSBvZiBwcmV2IGFuZCBjdXJyZW50IChwcmV2ZW50IGRpdiBieSB6ZXJvKVxuXHRcdFx0XHRcdHZhciB2ID0gTWF0aC5taW4oc2VsZi52ZWxvY2l0eSAqIGRlbHRhIC8gKDEgKyBlbGFwc2VkKSwgc2VsZi5tYXhTcGVlZCk7XG5cdFx0XHRcdFx0c2VsZi5zcGVlZCA9IDAuOCAqIHYgKyAwLjIgKiBzZWxmLnNwZWVkO1xuXG5cdFx0XHRcdFx0Ly9nZXQgbmV3IGFuZ2xlIGFzIGEgbGFzdCBkaWZmXG5cdFx0XHRcdFx0Ly9OT1RFOiB2ZWN0b3IgYXZlcmFnZSBpc27igJl0IHRoZSBzYW1lIGFzIHNwZWVkIHNjYWxhciBhdmVyYWdlXG5cdFx0XHRcdFx0c2VsZi5hbmdsZSA9IE1hdGguYXRhbjIoZFksIGRYKTtcblxuXHRcdFx0XHRcdHNlbGYuZW1pdCgndHJhY2snKTtcblxuXHRcdFx0XHRcdHJldHVybiBzZWxmO1xuXHRcdFx0XHR9LCBzZWxmLmZyYW1lcmF0ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdHRocmVzaG9sZDoge1xuXHRcdGJlZm9yZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0XHQvL2lnbm9yZSB0aHJlc2hvbGQgc3RhdGUsIGlmIHRocmVzaG9sZCBpcyBub25lXG5cdFx0XHRpZiAoaXNaZXJvQXJyYXkoc2VsZi50aHJlc2hvbGQpKSB7XG5cdFx0XHRcdHNlbGYuc3RhdGUgPSAnZHJhZyc7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0c2VsZi5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2RyYWdneS10aHJlc2hvbGQnKTtcblxuXHRcdFx0Ly9lbWl0IGRyYWcgZXZ0cyBvbiBlbGVtZW50XG5cdFx0XHRzZWxmLmVtaXQoJ3RocmVzaG9sZCcpO1xuXHRcdFx0ZW1pdChzZWxmLmVsZW1lbnQsICd0aHJlc2hvbGQnKTtcblxuXHRcdFx0Ly9saXN0ZW4gdG8gZG9jIG1vdmVtZW50XG5cdFx0XHRvbihkb2MsICd0b3VjaG1vdmUnICsgc2VsZi5fbnMgKyAnIG1vdXNlbW92ZScgKyBzZWxmLl9ucywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRcdC8vY29tcGFyZSBtb3ZlbWVudCB0byB0aGUgdGhyZXNob2xkXG5cdFx0XHRcdHZhciBjbGllbnRYID0gZ2V0Q2xpZW50WChlLCBzZWxmLnRvdWNoSWR4KTtcblx0XHRcdFx0dmFyIGNsaWVudFkgPSBnZXRDbGllbnRZKGUsIHNlbGYudG91Y2hJZHgpO1xuXHRcdFx0XHR2YXIgZGlmWCA9IHNlbGYucHJldk1vdXNlWCAtIGNsaWVudFg7XG5cdFx0XHRcdHZhciBkaWZZID0gc2VsZi5wcmV2TW91c2VZIC0gY2xpZW50WTtcblxuXHRcdFx0XHRpZiAoZGlmWCA8IHNlbGYudGhyZXNob2xkWzBdIHx8IGRpZlggPiBzZWxmLnRocmVzaG9sZFsyXSB8fCBkaWZZIDwgc2VsZi50aHJlc2hvbGRbMV0gfHwgZGlmWSA+IHNlbGYudGhyZXNob2xkWzNdKSB7XG5cdFx0XHRcdFx0c2VsZi51cGRhdGUoZSk7XG5cdFx0XHRcdFx0c2VsZi5zdGF0ZSA9ICdkcmFnJztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRvbihkb2MsICdtb3VzZXVwJyArIHNlbGYuX25zICsgJyB0b3VjaGVuZCcgKyBzZWxmLl9ucyArICcnLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdFx0Ly9mb3JnZXQgdG91Y2hlc1xuXHRcdFx0XHRzZWxmLnJlc2V0VG91Y2goKTtcblxuXHRcdFx0XHRzZWxmLnN0YXRlID0gJ2lkbGUnO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGFmdGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdHNlbGYuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ3ktdGhyZXNob2xkJyk7XG5cblx0XHRcdG9mZihkb2MsIHNlbGYuX25zKTtcblx0XHR9XG5cdH0sXG5cblx0ZHJhZzoge1xuXHRcdGJlZm9yZTogZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0XHQvL3JlZHVjZSBkcmFnZ2luZyBjbHV0dGVyXG5cdFx0XHRzZWxlY3Rpb24uZGlzYWJsZShyb290KTtcblxuXHRcdFx0c2VsZi5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2RyYWdneS1kcmFnJyk7XG5cblx0XHRcdC8vZW1pdCBkcmFnIGV2dHMgb24gZWxlbWVudFxuXHRcdFx0c2VsZi5lbWl0KCdkcmFnc3RhcnQnKTtcblx0XHRcdGVtaXQoc2VsZi5lbGVtZW50LCAnZHJhZ3N0YXJ0JywgbnVsbCwgdHJ1ZSk7XG5cblx0XHRcdC8vZW1pdCBkcmFnIGV2ZW50cyBvbiBzZWxmXG5cdFx0XHRzZWxmLmVtaXQoJ2RyYWcnKTtcblx0XHRcdGVtaXQoc2VsZi5lbGVtZW50LCAnZHJhZycsIG51bGwsIHRydWUpO1xuXG5cdFx0XHQvL3N0b3AgZHJhZyBvbiBsZWF2ZVxuXHRcdFx0b24oZG9jLCAndG91Y2hlbmQnICsgc2VsZi5fbnMgKyAnIG1vdXNldXAnICsgc2VsZi5fbnMgKyAnIG1vdXNlbGVhdmUnICsgc2VsZi5fbnMsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0XHQvL2ZvcmdldCB0b3VjaGVzIC0gZHJhZ2VuZCBpcyBjYWxsZWQgb25jZVxuXHRcdFx0XHRzZWxmLnJlc2V0VG91Y2goKTtcblxuXHRcdFx0XHQvL21hbmFnZSByZWxlYXNlIG1vdmVtZW50XG5cdFx0XHRcdGlmIChzZWxmLnNwZWVkID4gMSkge1xuXHRcdFx0XHRcdHNlbGYuc3RhdGUgPSAncmVsZWFzZSc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzZWxmLnN0YXRlID0gJ2lkbGUnO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly9tb3ZlIHZpYSB0cmFuc2Zvcm1cblx0XHRcdG9uKGRvYywgJ3RvdWNobW92ZScgKyBzZWxmLl9ucyArICcgbW91c2Vtb3ZlJyArIHNlbGYuX25zLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRzZWxmLmRyYWcoZSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0YWZ0ZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0Ly9lbmFibGUgZG9jdW1lbnQgaW50ZXJhY3Rpdml0eVxuXHRcdFx0c2VsZWN0aW9uLmVuYWJsZShyb290KTtcblxuXHRcdFx0c2VsZi5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWdneS1kcmFnJyk7XG5cblx0XHRcdC8vZW1pdCBkcmFnZW5kIG9uIGVsZW1lbnQsIHRoaXNcblx0XHRcdHNlbGYuZW1pdCgnZHJhZ2VuZCcpO1xuXHRcdFx0ZW1pdChzZWxmLmVsZW1lbnQsICdkcmFnZW5kJywgbnVsbCwgdHJ1ZSk7XG5cblx0XHRcdC8vdW5iaW5kIGRyYWcgZXZlbnRzXG5cdFx0XHRvZmYoZG9jLCBzZWxmLl9ucyk7XG5cblx0XHRcdGNsZWFySW50ZXJ2YWwoc2VsZi5fdHJhY2tpbmdJbnRlcnZhbCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbGVhc2U6IHtcblx0XHRiZWZvcmU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0c2VsZi5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2RyYWdneS1yZWxlYXNlJyk7XG5cblx0XHRcdC8vZW50ZXIgYW5pbWF0aW9uIG1vZGVcblx0XHRcdGNsZWFyVGltZW91dChzZWxmLl9hbmltYXRlVGltZW91dCk7XG5cblx0XHRcdC8vc2V0IHByb3BlciB0cmFuc2l0aW9uXG5cdFx0XHRjc3Moc2VsZi5lbGVtZW50LCB7XG5cdFx0XHRcdCd0cmFuc2l0aW9uJzogKHNlbGYucmVsZWFzZUR1cmF0aW9uKSArICdtcyBlYXNlLW91dCAnICsgKHNlbGYuY3NzMyA/ICd0cmFuc2Zvcm0nIDogJ3Bvc2l0aW9uJylcblx0XHRcdH0pO1xuXG5cdFx0XHQvL3BsYW4gbGVhdmluZyBhbmltIG1vZGVcblx0XHRcdHNlbGYuX2FuaW1hdGVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHNlbGYuc3RhdGUgPSAnaWRsZSc7XG5cdFx0XHR9LCBzZWxmLnJlbGVhc2VEdXJhdGlvbik7XG5cblxuXHRcdFx0Ly9jYWxjIHRhcmdldCBwb2ludCAmIGFuaW1hdGUgdG8gaXRcblx0XHRcdHNlbGYubW92ZShcblx0XHRcdFx0c2VsZi5wcmV2WCArIHNlbGYuc3BlZWQgKiBNYXRoLmNvcyhzZWxmLmFuZ2xlKSxcblx0XHRcdFx0c2VsZi5wcmV2WSArIHNlbGYuc3BlZWQgKiBNYXRoLnNpbihzZWxmLmFuZ2xlKVxuXHRcdFx0KTtcblxuXHRcdFx0c2VsZi5zcGVlZCA9IDA7XG5cdFx0XHRzZWxmLmVtaXQoJ3RyYWNrJyk7XG5cdFx0fSxcblxuXHRcdGFmdGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdHNlbGYuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ3ktcmVsZWFzZScpO1xuXG5cdFx0XHRjc3ModGhpcy5lbGVtZW50LCB7XG5cdFx0XHRcdCd0cmFuc2l0aW9uJzogbnVsbFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LFxuXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdH1cbn07XG5cblxuLyoqIERyYWcgaGFuZGxlci4gTmVlZGVkIHRvIHByb3ZpZGUgZHJhZyBtb3ZlbWVudCBlbXVsYXRpb24gdmlhIEFQSSAqL1xucHJvdG8uZHJhZyA9IGZ1bmN0aW9uIChlKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0dmFyIG1vdXNlWCA9IGdldENsaWVudFgoZSwgc2VsZi50b3VjaElkeCksXG5cdFx0bW91c2VZID0gZ2V0Q2xpZW50WShlLCBzZWxmLnRvdWNoSWR4KTtcblxuXHQvL2NhbGMgbW91c2UgbW92ZW1lbnQgZGlmZlxuXHR2YXIgZGlmZk1vdXNlWCA9IG1vdXNlWCAtIHNlbGYucHJldk1vdXNlWCxcblx0XHRkaWZmTW91c2VZID0gbW91c2VZIC0gc2VsZi5wcmV2TW91c2VZO1xuXG5cdC8vYWJzb2x1dGUgbW91c2UgY29vcmRpbmF0ZVxuXHR2YXIgbW91c2VBYnNYID0gbW91c2VYICsgd2luLnBhZ2VYT2Zmc2V0LFxuXHRcdG1vdXNlQWJzWSA9IG1vdXNlWSArIHdpbi5wYWdlWU9mZnNldDtcblxuXHQvL2NhbGMgc25pcGVyIG9mZnNldCwgaWYgYW55XG5cdGlmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5KSB7XG5cdFx0c2VsZi5zbmlwZXJPZmZzZXRYICs9IGRpZmZNb3VzZVggKiBzZWxmLnNuaXBlclNsb3dkb3duO1xuXHRcdHNlbGYuc25pcGVyT2Zmc2V0WSArPSBkaWZmTW91c2VZICogc2VsZi5zbmlwZXJTbG93ZG93bjtcblx0fVxuXG5cdC8vY2FsYyBtb3ZlbWVudCB4IGFuZCB5XG5cdC8vdGFrZSBhYnNvbHV0ZSBwbGFjaW5nIGFzIGl0IGlzIHRoZSBvbmx5IHJlbGlhYmxlIHdheSAoMnggcHJvdmVkKVxuXHR2YXIgeCA9IChtb3VzZUFic1ggLSBzZWxmLmluaXRPZmZzZXRYKSAtIHNlbGYuaW5uZXJPZmZzZXRYIC0gc2VsZi5zbmlwZXJPZmZzZXRYLFxuXHRcdHkgPSAobW91c2VBYnNZIC0gc2VsZi5pbml0T2Zmc2V0WSkgLSBzZWxmLmlubmVyT2Zmc2V0WSAtIHNlbGYuc25pcGVyT2Zmc2V0WTtcblxuXHQvL21vdmUgZWxlbWVudFxuXHRzZWxmLm1vdmUoeCwgeSk7XG5cblx0Ly9zYXZlIHByZXZDbGllbnRYWSBmb3IgY2FsY3VsYXRpbmcgZGlmZlxuXHRzZWxmLnByZXZNb3VzZVggPSBtb3VzZVg7XG5cdHNlbGYucHJldk1vdXNlWSA9IG1vdXNlWTtcblxuXHQvL2VtaXQgZHJhZ1xuXHRzZWxmLmVtaXQoJ2RyYWcnKTtcblx0ZW1pdChzZWxmLmVsZW1lbnQsICdkcmFnJywgbnVsbCwgdHJ1ZSk7XG59O1xuXG5cbi8qKiBDdXJyZW50IG51bWJlciBvZiBkcmFnZ2FibGUgdG91Y2hlcyAqL1xudmFyIHRvdWNoZXMgPSAwO1xuXG5cbi8qKiBNYW5hZ2UgdG91Y2hlcyAqL1xucHJvdG8uc2V0VG91Y2ggPSBmdW5jdGlvbiAoZSkge1xuXHRpZiAoIWUudG91Y2hlcyB8fCB0aGlzLmlzVG91Y2hlZCgpKSByZXR1cm4gdGhpcztcblxuXHQvL2N1cnJlbnQgdG91Y2ggaW5kZXhcblx0dGhpcy50b3VjaElkeCA9IHRvdWNoZXM7XG5cdHRvdWNoZXMrKztcblxuXHRyZXR1cm4gdGhpcztcbn07XG5wcm90by5yZXNldFRvdWNoID0gZnVuY3Rpb24gKCkge1xuXHR0b3VjaGVzID0gMDtcblx0dGhpcy50b3VjaElkeCA9IG51bGw7XG5cblx0cmV0dXJuIHRoaXM7XG59O1xucHJvdG8uaXNUb3VjaGVkID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy50b3VjaElkeCAhPT0gbnVsbDtcbn07XG5cblxuLyoqIEluZGV4IHRvIGZldGNoIHRvdWNoIG51bWJlciBmcm9tIGV2ZW50ICovXG5wcm90by50b3VjaElkeCA9IG51bGw7XG5cblxuLyoqXG4gKiBVcGRhdGUgbW92ZW1lbnQgbGltaXRzLlxuICogUmVmcmVzaCBzZWxmLndpdGhpbk9mZnNldHMgYW5kIHNlbGYubGltaXRzLlxuICovXG5wcm90by51cGRhdGUgPSBmdW5jdGlvbiAoZSkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly91cGRhdGUgaGFuZGxlc1xuXHRzZWxmLmN1cnJlbnRIYW5kbGVzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZSkge1xuXHRcdG9mZihoYW5kbGUsIHNlbGYuX25zKTtcblx0fSk7XG5cblx0dmFyIGNhbmNlbEVscyA9IHEuYWxsKHNlbGYuY2FuY2VsKTtcblxuXHRzZWxmLmN1cnJlbnRIYW5kbGVzID0gcS5hbGwoc2VsZi5oYW5kbGUpO1xuXG5cdHNlbGYuY3VycmVudEhhbmRsZXMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlKSB7XG5cdFx0b24oaGFuZGxlLCAnbW91c2Vkb3duJyArIHNlbGYuX25zICsgJyB0b3VjaHN0YXJ0JyArIHNlbGYuX25zLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0Ly9tYXJrIGV2ZW50IGFzIGJlbG9uZ2luZyB0byB0aGUgZHJhZ2d5XG5cdFx0XHRpZiAoIWUuZHJhZ2dpZXMpIHtcblx0XHRcdFx0ZS5kcmFnZ2llcyA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0Ly9pZ25vcmUgZHJhZ2dpZXMgY29udGFpbmluZyBvdGhlciBkcmFnZ2llc1xuXHRcdFx0aWYgKGUuZHJhZ2dpZXMuc29tZShmdW5jdGlvbiAoZHJhZ2d5KSB7XG5cdFx0XHRcdHJldHVybiBzZWxmLmVsZW1lbnQuY29udGFpbnMoZHJhZ2d5LmVsZW1lbnQpO1xuXHRcdFx0fSkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Ly9pZ25vcmUgZXZlbnRzIGhhcHBlbmVkIHdpdGhpbiBjYW5jZWxFbHNcblx0XHRcdGlmIChjYW5jZWxFbHMuc29tZShmdW5jdGlvbiAoY2FuY2VsRWwpIHtcblx0XHRcdFx0cmV0dXJuIGNhbmNlbEVsLmNvbnRhaW5zKGUudGFyZ2V0KTtcblx0XHRcdH0pKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly9yZWdpc3RlciBkcmFnZ3lcblx0XHRcdGUuZHJhZ2dpZXMucHVzaChzZWxmKTtcblx0XHR9KTtcblx0fSk7XG5cblxuXHQvL2luaXRpYWwgdHJhbnNsYXRpb24gb2Zmc2V0c1xuXHR2YXIgaW5pdFhZID0gc2VsZi5nZXRDb29yZHMoKTtcblxuXHQvL2NhbGMgaW5pdGlhbCBjb29yZHNcblx0c2VsZi5wcmV2WCA9IGluaXRYWVswXTtcblx0c2VsZi5wcmV2WSA9IGluaXRYWVsxXTtcblxuXHQvL2NvbnRhaW5lciByZWN0IG1pZ2h0IGJlIG91dHNpZGUgdGhlIHZwLCBzbyBjYWxjIGFic29sdXRlIG9mZnNldHNcblx0Ly96ZXJvLXBvc2l0aW9uIG9mZnNldHMsIHdpdGggdHJhbnNsYXRpb24oMCwwKVxuXHR2YXIgc2VsZk9mZnNldHMgPSBvZmZzZXRzKHNlbGYuZWxlbWVudCk7XG5cdHNlbGYuaW5pdE9mZnNldFggPSBzZWxmT2Zmc2V0cy5sZWZ0IC0gc2VsZi5wcmV2WDtcblx0c2VsZi5pbml0T2Zmc2V0WSA9IHNlbGZPZmZzZXRzLnRvcCAtIHNlbGYucHJldlk7XG5cdHNlbGYub2Zmc2V0cyA9IHNlbGZPZmZzZXRzO1xuXG5cdC8vaGFuZGxlIHBhcmVudCBjYXNlXG5cdHZhciB3aXRoaW4gPSBzZWxmLndpdGhpbjtcblx0aWYgKHNlbGYud2l0aGluID09PSAncGFyZW50Jykge1xuXHRcdHdpdGhpbiA9IHNlbGYuZWxlbWVudC5wYXJlbnROb2RlO1xuXHR9XG5cdHdpdGhpbiA9IHdpdGhpbiB8fCBkb2M7XG5cblx0Ly9hYnNvbHV0ZSBvZmZzZXRzIG9mIGEgY29udGFpbmVyXG5cdHZhciB3aXRoaW5PZmZzZXRzID0gb2Zmc2V0cyh3aXRoaW4pO1xuXHRzZWxmLndpdGhpbk9mZnNldHMgPSB3aXRoaW5PZmZzZXRzO1xuXG5cblx0Ly9jYWxjdWxhdGUgbW92ZW1lbnQgbGltaXRzIC0gcGluIHdpZHRoIG1pZ2h0IGJlIHdpZGVyIHRoYW4gY29uc3RyYWludHNcblx0c2VsZi5vdmVyZmxvd1ggPSBzZWxmLnBpbi53aWR0aCAtIHdpdGhpbk9mZnNldHMud2lkdGg7XG5cdHNlbGYub3ZlcmZsb3dZID0gc2VsZi5waW4uaGVpZ2h0IC0gd2l0aGluT2Zmc2V0cy5oZWlnaHQ7XG5cdHNlbGYubGltaXRzID0ge1xuXHRcdGxlZnQ6IHdpdGhpbk9mZnNldHMubGVmdCAtIHNlbGYuaW5pdE9mZnNldFggLSBzZWxmLnBpblswXSAtIChzZWxmLm92ZXJmbG93WCA8IDAgPyAwIDogc2VsZi5vdmVyZmxvd1gpLFxuXHRcdHRvcDogd2l0aGluT2Zmc2V0cy50b3AgLSBzZWxmLmluaXRPZmZzZXRZIC0gc2VsZi5waW5bMV0gLSAoc2VsZi5vdmVyZmxvd1kgPCAwID8gMCA6IHNlbGYub3ZlcmZsb3dZKSxcblx0XHRyaWdodDogc2VsZi5vdmVyZmxvd1ggPiAwID8gMCA6IHdpdGhpbk9mZnNldHMucmlnaHQgLSBzZWxmLmluaXRPZmZzZXRYIC0gc2VsZi5waW5bMl0sXG5cdFx0Ym90dG9tOiBzZWxmLm92ZXJmbG93WSA+IDAgPyAwIDogd2l0aGluT2Zmc2V0cy5ib3R0b20gLSBzZWxmLmluaXRPZmZzZXRZIC0gc2VsZi5waW5bM11cblx0fTtcblxuXHQvL3ByZXNldCBpbm5lciBvZmZzZXRzXG5cdHNlbGYuaW5uZXJPZmZzZXRYID0gc2VsZi5waW5bMF07XG5cdHNlbGYuaW5uZXJPZmZzZXRZID0gc2VsZi5waW5bMV07XG5cblx0dmFyIHNlbGZDbGllbnRSZWN0ID0gc2VsZi5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdC8vaWYgZXZlbnQgcGFzc2VkIC0gdXBkYXRlIGFjYyB0byBldmVudFxuXHRpZiAoZSkge1xuXHRcdC8vdGFrZSBsYXN0IG1vdXNlIHBvc2l0aW9uIGZyb20gdGhlIGV2ZW50XG5cdFx0c2VsZi5wcmV2TW91c2VYID0gZ2V0Q2xpZW50WChlLCBzZWxmLnRvdWNoSWR4KTtcblx0XHRzZWxmLnByZXZNb3VzZVkgPSBnZXRDbGllbnRZKGUsIHNlbGYudG91Y2hJZHgpO1xuXG5cdFx0Ly9pZiBtb3VzZSBpcyB3aXRoaW4gdGhlIGVsZW1lbnQgLSB0YWtlIG9mZnNldCBub3JtYWxseSBhcyByZWwgZGlzcGxhY2VtZW50XG5cdFx0c2VsZi5pbm5lck9mZnNldFggPSAtc2VsZkNsaWVudFJlY3QubGVmdCArIGdldENsaWVudFgoZSwgc2VsZi50b3VjaElkeCk7XG5cdFx0c2VsZi5pbm5lck9mZnNldFkgPSAtc2VsZkNsaWVudFJlY3QudG9wICsgZ2V0Q2xpZW50WShlLCBzZWxmLnRvdWNoSWR4KTtcblx0fVxuXHQvL2lmIG5vIGV2ZW50IC0gc3VwcG9zZSBwaW4tY2VudGVyZWQgZXZlbnRcblx0ZWxzZSB7XG5cdFx0Ly90YWtlIG1vdXNlIHBvc2l0aW9uICYgaW5uZXIgb2Zmc2V0IGFzIGNlbnRlciBvZiBwaW5cblx0XHR2YXIgcGluWCA9IChzZWxmLnBpblswXSArIHNlbGYucGluWzJdICkgKiAwLjU7XG5cdFx0dmFyIHBpblkgPSAoc2VsZi5waW5bMV0gKyBzZWxmLnBpblszXSApICogMC41O1xuXHRcdHNlbGYucHJldk1vdXNlWCA9IHNlbGZDbGllbnRSZWN0LmxlZnQgKyBwaW5YO1xuXHRcdHNlbGYucHJldk1vdXNlWSA9IHNlbGZDbGllbnRSZWN0LnRvcCArIHBpblk7XG5cdFx0c2VsZi5pbm5lck9mZnNldFggPSBwaW5YO1xuXHRcdHNlbGYuaW5uZXJPZmZzZXRZID0gcGluWTtcblx0fVxuXG5cdC8vc2V0IGluaXRpYWwga2luZXRpYyBwcm9wc1xuXHRzZWxmLnNwZWVkID0gMDtcblx0c2VsZi5hbXBsaXR1ZGUgPSAwO1xuXHRzZWxmLmFuZ2xlID0gMDtcblx0c2VsZi50aW1lc3RhbXAgPSArbmV3IERhdGUoKTtcblx0c2VsZi5mcmFtZSA9IFtzZWxmLnByZXZYLCBzZWxmLnByZXZZXTtcblxuXHQvL3NldCBzbmlwZXIgb2Zmc2V0XG5cdHNlbGYuc25pcGVyT2Zmc2V0WCA9IDA7XG5cdHNlbGYuc25pcGVyT2Zmc2V0WSA9IDA7XG59O1xuXG5cbi8qKlxuICogV2F5IG9mIHBsYWNlbWVudDpcbiAqIC0gcG9zaXRpb24gPT09IGZhbHNlIChzbG93ZXIgYnV0IG1vcmUgcHJlY2lzZSBhbmQgY3Jvc3MtYnJvd3NlcilcbiAqIC0gdHJhbnNsYXRlM2QgPT09IHRydWUgKGZhc3RlciBidXQgbWF5IGNhdXNlIGJsdXJzIG9uIGxpbnV4IHN5c3RlbXMpXG4gKi9cbnByb3RvLmNzczMgPSB7XG5cdF86IGZ1bmN0aW9uICgpIHtcblx0XHRjc3ModGhpcy5lbGVtZW50LCAncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcblx0XHR0aGlzLmdldENvb3JkcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIHJldHVybiBbdGhpcy5lbGVtZW50Lm9mZnNldExlZnQsIHRoaXMuZWxlbWVudC5vZmZzZXRUb3BdO1xuXHRcdFx0cmV0dXJuIFtwYXJzZUNTU1ZhbHVlKGNzcyh0aGlzLmVsZW1lbnQsJ2xlZnQnKSksIHBhcnNlQ1NTVmFsdWUoY3NzKHRoaXMuZWxlbWVudCwgJ3RvcCcpKV07XG5cdFx0fTtcblxuXHRcdHRoaXMuc2V0Q29vcmRzID0gZnVuY3Rpb24gKHgsIHkpIHtcblx0XHRcdGNzcyh0aGlzLmVsZW1lbnQsIHtcblx0XHRcdFx0bGVmdDogeCxcblx0XHRcdFx0dG9wOiB5XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly9zYXZlIHByZXYgY29vcmRzIHRvIHVzZSBhcyBhIHN0YXJ0IHBvaW50IG5leHQgdGltZVxuXHRcdFx0dGhpcy5wcmV2WCA9IHg7XG5cdFx0XHR0aGlzLnByZXZZID0geTtcblx0XHR9O1xuXHR9LFxuXG5cdC8vdW5kZWZpbmVkIHBsYWNpbmcgaXMgdHJlYXRlZCBhcyB0cmFuc2xhdGUzZFxuXHR0cnVlOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5nZXRDb29yZHMgID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGdldFRyYW5zbGF0ZSh0aGlzLmVsZW1lbnQpIHx8IFswLDBdO1xuXHRcdH07XG5cblx0XHR0aGlzLnNldENvb3JkcyA9IGZ1bmN0aW9uICh4LCB5KSB7XG5cdFx0XHR4ID0gcm91bmQoeCwgdGhpcy5wcmVjaXNpb24pO1xuXHRcdFx0eSA9IHJvdW5kKHksIHRoaXMucHJlY2lzaW9uKTtcblxuXHRcdFx0Y3NzKHRoaXMuZWxlbWVudCwgJ3RyYW5zZm9ybScsIFsndHJhbnNsYXRlM2QoJywgeCwgJ3B4LCcsIHksICdweCwgMCknXS5qb2luKCcnKSk7XG5cblx0XHRcdC8vc2F2ZSBwcmV2IGNvb3JkcyB0byB1c2UgYXMgYSBzdGFydCBwb2ludCBuZXh0IHRpbWVcblx0XHRcdHRoaXMucHJldlggPSB4O1xuXHRcdFx0dGhpcy5wcmV2WSA9IHk7XG5cdFx0fTtcblx0fVxufTtcblxuXG4vKipcbiAqIFJlc3RyaWN0aW5nIGNvbnRhaW5lclxuICogQHR5cGUge0VsZW1lbnR8b2JqZWN0fVxuICogQGRlZmF1bHQgZG9jLmRvY3VtZW50RWxlbWVudFxuICovXG5wcm90by53aXRoaW4gPSBkb2M7XG5cblxuLyoqIEhhbmRsZSB0byBkcmFnICovXG5wcm90by5oYW5kbGU7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMocHJvdG8sIHtcblx0LyoqXG5cdCAqIFdoaWNoIGFyZWEgb2YgZHJhZ2dhYmxlIHNob3VsZCBub3QgYmUgb3V0c2lkZSB0aGUgcmVzdHJpY3Rpb24gYXJlYS5cblx0ICogQHR5cGUgeyhBcnJheXxudW1iZXIpfVxuXHQgKiBAZGVmYXVsdCBbMCwwLHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCwgdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodF1cblx0ICovXG5cdHBpbjoge1xuXHRcdHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0XHRpZiAoaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLmxlbmd0aCA9PT0gMikge1xuXHRcdFx0XHRcdHRoaXMuX3BpbiA9IFt2YWx1ZVswXSwgdmFsdWVbMV0sIHZhbHVlWzBdLCB2YWx1ZVsxXV07XG5cdFx0XHRcdH0gZWxzZSBpZiAodmFsdWUubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRcdFx0dGhpcy5fcGluID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZWxzZSBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XG5cdFx0XHRcdHRoaXMuX3BpbiA9IFt2YWx1ZSwgdmFsdWUsIHZhbHVlLCB2YWx1ZV07XG5cdFx0XHR9XG5cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9waW4gPSB2YWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly9jYWxjIHBpbiBwYXJhbXNcblx0XHRcdHRoaXMuX3Bpbi53aWR0aCA9IHRoaXMuX3BpblsyXSAtIHRoaXMuX3BpblswXTtcblx0XHRcdHRoaXMuX3Bpbi5oZWlnaHQgPSB0aGlzLl9waW5bM10gLSB0aGlzLl9waW5bMV07XG5cdFx0fSxcblxuXHRcdGdldDogZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHRoaXMuX3BpbikgcmV0dXJuIHRoaXMuX3BpbjtcblxuXHRcdFx0Ly9yZXR1cm5pbmcgYXV0b2NhbGN1bGF0ZWQgcGluLCBpZiBwcml2YXRlIHBpbiBpcyBub25lXG5cdFx0XHR2YXIgcGluID0gWzAsMCwgdGhpcy5vZmZzZXRzLndpZHRoLCB0aGlzLm9mZnNldHMuaGVpZ2h0XTtcblx0XHRcdHBpbi53aWR0aCA9IHRoaXMub2Zmc2V0cy53aWR0aDtcblx0XHRcdHBpbi5oZWlnaHQgPSB0aGlzLm9mZnNldHMuaGVpZ2h0O1xuXHRcdFx0cmV0dXJuIHBpbjtcblx0XHR9XG5cdH0sXG5cblx0LyoqIEF2b2lkIGluaXRpYWwgbW91c2Vtb3ZlICovXG5cdHRocmVzaG9sZDoge1xuXHRcdHNldDogZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0aWYgKGlzTnVtYmVyKHZhbCkpIHtcblx0XHRcdFx0dGhpcy5fdGhyZXNob2xkID0gWy12YWwqMC41LCAtdmFsKjAuNSwgdmFsKjAuNSwgdmFsKjAuNV07XG5cdFx0XHR9IGVsc2UgaWYgKHZhbC5sZW5ndGggPT09IDIpIHtcblx0XHRcdFx0Ly9BcnJheSh3LGgpXG5cdFx0XHRcdHRoaXMuX3RocmVzaG9sZCA9IFstdmFsWzBdKjAuNSwgLXZhbFsxXSowLjUsIHZhbFswXSowLjUsIHZhbFsxXSowLjVdO1xuXHRcdFx0fSBlbHNlIGlmICh2YWwubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRcdC8vQXJyYXkoeDEseTEseDIseTIpXG5cdFx0XHRcdHRoaXMuX3RocmVzaG9sZCA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoaXNGbih2YWwpKSB7XG5cdFx0XHRcdC8vY3VzdG9tIHZhbCBmdW5jaXRvblxuXHRcdFx0XHR0aGlzLl90aHJlc2hvbGQgPSB2YWwoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX3RocmVzaG9sZCA9IFswLDAsMCwwXTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Z2V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fdGhyZXNob2xkIHx8IFswLDAsMCwwXTtcblx0XHR9XG5cdH1cbn0pO1xuXG5cblxuLyoqXG4gKiBGb3IgaG93IGxvbmcgdG8gcmVsZWFzZSBtb3ZlbWVudFxuICpcbiAqIEB0eXBlIHsobnVtYmVyfGZhbHNlKX1cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKiBAdG9kb1xuICovXG5wcm90by5yZWxlYXNlID0gZmFsc2U7XG5wcm90by5yZWxlYXNlRHVyYXRpb24gPSA1MDA7XG5wcm90by52ZWxvY2l0eSA9IDEwMDA7XG5wcm90by5tYXhTcGVlZCA9IDI1MDtcbnByb3RvLmZyYW1lcmF0ZSA9IDUwO1xuXG5cbi8qKiBUbyB3aGF0IGV4dGVudCByb3VuZCBwb3NpdGlvbiAqL1xucHJvdG8ucHJlY2lzaW9uID0gMTtcblxuXG4vKiogRHJvcHBhYmxlIHBhcmFtcyAqL1xucHJvdG8uZHJvcHBhYmxlID0gbnVsbDtcbnByb3RvLmRyb3BwYWJsZVRvbGVyYW5jZSA9IDAuNTtcbnByb3RvLmRyb3BwYWJsZUNsYXNzID0gbnVsbDtcblxuXG4vKiogU2xvdyBkb3duIG1vdmVtZW50IGJ5IHByZXNzaW5nIGN0cmwvY21kICovXG5wcm90by5zbmlwZXIgPSB0cnVlO1xuXG5cbi8qKiBIb3cgbXVjaCB0byBzbG93IHNuaXBlciBkcmFnICovXG5wcm90by5zbmlwZXJTbG93ZG93biA9IC44NTtcblxuXG4vKipcbiAqIFJlc3RyaWN0IG1vdmVtZW50IGJ5IGF4aXNcbiAqXG4gKiBAZGVmYXVsdCB1bmRlZmluZWRcbiAqIEBlbnVtIHtzdHJpbmd9XG4gKi9cbnByb3RvLmF4aXMgPSB7XG5cdF86IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLm1vdmUgPSBmdW5jdGlvbiAoeCwgeSkge1xuXHRcdFx0dmFyIGxpbWl0cyA9IHRoaXMubGltaXRzO1xuXG5cdFx0XHRpZiAodGhpcy5yZXBlYXQpIHtcblx0XHRcdFx0dmFyIHcgPSAobGltaXRzLnJpZ2h0IC0gbGltaXRzLmxlZnQpO1xuXHRcdFx0XHR2YXIgaCA9IChsaW1pdHMuYm90dG9tIC0gbGltaXRzLnRvcCk7XG5cdFx0XHRcdHZhciBvWCA9IC0gdGhpcy5pbml0T2Zmc2V0WCArIHRoaXMud2l0aGluT2Zmc2V0cy5sZWZ0IC0gdGhpcy5waW5bMF0gLSBNYXRoLm1heCgwLCB0aGlzLm92ZXJmbG93WCk7XG5cdFx0XHRcdHZhciBvWSA9IC0gdGhpcy5pbml0T2Zmc2V0WSArIHRoaXMud2l0aGluT2Zmc2V0cy50b3AgLSB0aGlzLnBpblsxXSAtIE1hdGgubWF4KDAsIHRoaXMub3ZlcmZsb3dZKTtcblx0XHRcdFx0aWYgKHRoaXMucmVwZWF0ID09PSAneCcpIHtcblx0XHRcdFx0XHR4ID0gbG9vcCh4IC0gb1gsIHcpICsgb1g7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAodGhpcy5yZXBlYXQgPT09ICd5Jykge1xuXHRcdFx0XHRcdHkgPSBsb29wKHkgLSBvWSwgaCkgKyBvWTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHR4ID0gbG9vcCh4IC0gb1gsIHcpICsgb1g7XG5cdFx0XHRcdFx0eSA9IGxvb3AoeSAtIG9ZLCBoKSArIG9ZO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHggPSBiZXR3ZWVuKHgsIGxpbWl0cy5sZWZ0LCBsaW1pdHMucmlnaHQpO1xuXHRcdFx0eSA9IGJldHdlZW4oeSwgbGltaXRzLnRvcCwgbGltaXRzLmJvdHRvbSk7XG5cblx0XHRcdHRoaXMuc2V0Q29vcmRzKHgsIHkpO1xuXHRcdH07XG5cdH0sXG5cdHg6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLm1vdmUgPSBmdW5jdGlvbiAoeCwgeSkge1xuXHRcdFx0dmFyIGxpbWl0cyA9IHRoaXMubGltaXRzO1xuXG5cdFx0XHRpZiAodGhpcy5yZXBlYXQpIHtcblx0XHRcdFx0dmFyIHcgPSAobGltaXRzLnJpZ2h0IC0gbGltaXRzLmxlZnQpO1xuXHRcdFx0XHR2YXIgb1ggPSAtIHRoaXMuaW5pdE9mZnNldFggKyB0aGlzLndpdGhpbk9mZnNldHMubGVmdCAtIHRoaXMucGluWzBdIC0gTWF0aC5tYXgoMCwgdGhpcy5vdmVyZmxvd1gpO1xuXHRcdFx0XHR4ID0gbG9vcCh4IC0gb1gsIHcpICsgb1g7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR4ID0gYmV0d2Vlbih4LCBsaW1pdHMubGVmdCwgbGltaXRzLnJpZ2h0KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zZXRDb29yZHMoeCwgdGhpcy5wcmV2WSk7XG5cdFx0fTtcblx0fSxcblx0eTogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMubW92ZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG5cdFx0XHR2YXIgbGltaXRzID0gdGhpcy5saW1pdHM7XG5cblx0XHRcdGlmICh0aGlzLnJlcGVhdCkge1xuXHRcdFx0XHR2YXIgaCA9IChsaW1pdHMuYm90dG9tIC0gbGltaXRzLnRvcCk7XG5cdFx0XHRcdHZhciBvWSA9IC0gdGhpcy5pbml0T2Zmc2V0WSArIHRoaXMud2l0aGluT2Zmc2V0cy50b3AgLSB0aGlzLnBpblsxXSAtIE1hdGgubWF4KDAsIHRoaXMub3ZlcmZsb3dZKTtcblx0XHRcdFx0eSA9IGxvb3AoeSAtIG9ZLCBoKSArIG9ZO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0eSA9IGJldHdlZW4oeSwgbGltaXRzLnRvcCwgbGltaXRzLmJvdHRvbSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2V0Q29vcmRzKHRoaXMucHJldlgsIHkpO1xuXHRcdH07XG5cdH1cbn07XG5cblxuLyoqIFJlcGVhdCBtb3ZlbWVudCBieSBvbmUgb2YgYXhpc2VzICovXG5wcm90by5yZXBlYXQgPSBmYWxzZTtcblxuXG4vKiogQ2hlY2sgd2hldGhlciBhcnIgaXMgZmlsbGVkIHdpdGggemVyb3MgKi9cbmZ1bmN0aW9uIGlzWmVyb0FycmF5KGFycikge1xuXHRpZiAoIWFyclswXSAmJiAhYXJyWzFdICYmICFhcnJbMl0gJiYgIWFyclszXSkgcmV0dXJuIHRydWU7XG59XG5cblxuXG4vKiogQ2xlYW4gYWxsIG1lbW9yeS1yZWxhdGVkIHRoaW5ncyAqL1xucHJvdG8uZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYuY3VycmVudEhhbmRsZXMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlKSB7XG5cdFx0b2ZmKGhhbmRsZSwgc2VsZi5fbnMpO1xuXHR9KTtcblxuXHRzZWxmLnN0YXRlID0gJ2Rlc3Ryb3knO1xuXG5cdGNsZWFyVGltZW91dChzZWxmLl9hbmltYXRlVGltZW91dCk7XG5cblx0b2ZmKGRvYywgc2VsZi5fbnMpO1xuXHRvZmYoc2VsZi5lbGVtZW50LCBzZWxmLl9ucyk7XG5cblxuXHRzZWxmLmVsZW1lbnQgPSBudWxsO1xuXHRzZWxmLndpdGhpbiA9IG51bGw7XG59O1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnZ2FibGU7IiwiLyoqXHJcbiAqIEBtb2R1bGUgZW1teS9lbWl0XHJcbiAqL1xyXG52YXIgaWNpY2xlID0gcmVxdWlyZSgnaWNpY2xlJyk7XHJcbnZhciBzbGljZSA9IHJlcXVpcmUoJ3NsaWNlZCcpO1xyXG52YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdtdXR5cGUvaXMtc3RyaW5nJyk7XHJcbnZhciBpc05vZGUgPSByZXF1aXJlKCdtdXR5cGUvaXMtbm9kZScpO1xyXG52YXIgaXNFdmVudCA9IHJlcXVpcmUoJ211dHlwZS9pcy1ldmVudCcpO1xyXG52YXIgbGlzdGVuZXJzID0gcmVxdWlyZSgnLi9saXN0ZW5lcnMnKTtcclxuXHJcblxyXG4vKipcclxuICogQSBzaW1wbGUgd3JhcHBlciB0byBoYW5kbGUgc3RyaW5neS9wbGFpbiBldmVudHNcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGFyZ2V0LCBldnQpe1xyXG5cdGlmICghdGFyZ2V0KSByZXR1cm47XHJcblxyXG5cdHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG5cdGlmIChpc1N0cmluZyhldnQpKSB7XHJcblx0XHRhcmdzID0gc2xpY2UoYXJndW1lbnRzLCAyKTtcclxuXHRcdGV2dC5zcGxpdCgvXFxzKy8pLmZvckVhY2goZnVuY3Rpb24oZXZ0KXtcclxuXHRcdFx0ZXZ0ID0gZXZ0LnNwbGl0KCcuJylbMF07XHJcblxyXG5cdFx0XHRlbWl0LmFwcGx5KHRoaXMsIFt0YXJnZXQsIGV2dF0uY29uY2F0KGFyZ3MpKTtcclxuXHRcdH0pO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXR1cm4gZW1pdC5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHR9XHJcbn07XHJcblxyXG5cclxuLyoqIGRldGVjdCBlbnYgKi9cclxudmFyICQgPSB0eXBlb2YgalF1ZXJ5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IGpRdWVyeTtcclxudmFyIGRvYyA9IHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBkb2N1bWVudDtcclxudmFyIHdpbiA9IHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogd2luZG93O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBFbWl0IGFuIGV2ZW50LCBvcHRpb25hbGx5IHdpdGggZGF0YSBvciBidWJibGluZ1xyXG4gKiBBY2NlcHQgb25seSBzaW5nbGUgZWxlbWVudHMvZXZlbnRzXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgQW4gZXZlbnQgbmFtZSwgZS4gZy4gJ2NsaWNrJ1xyXG4gKiBAcGFyYW0geyp9IGRhdGEgQW55IGRhdGEgdG8gcGFzcyB0byBldmVudC5kZXRhaWxzIChET00pIG9yIGV2ZW50LmRhdGEgKGVsc2V3aGVyZSlcclxuICogQHBhcmFtIHtib29sfSBidWJibGVzIFdoZXRoZXIgdG8gdHJpZ2dlciBidWJibGluZyBldmVudCAoRE9NKVxyXG4gKlxyXG4gKlxyXG4gKiBAcmV0dXJuIHt0YXJnZXR9IGEgdGFyZ2V0XHJcbiAqL1xyXG5mdW5jdGlvbiBlbWl0KHRhcmdldCwgZXZlbnROYW1lLCBkYXRhLCBidWJibGVzKXtcclxuXHR2YXIgZW1pdE1ldGhvZCwgZXZ0ID0gZXZlbnROYW1lO1xyXG5cclxuXHQvL0NyZWF0ZSBwcm9wZXIgZXZlbnQgZm9yIERPTSBvYmplY3RzXHJcblx0aWYgKGlzTm9kZSh0YXJnZXQpIHx8IHRhcmdldCA9PT0gd2luKSB7XHJcblx0XHQvL05PVEU6IHRoaXMgZG9lc25vdCBidWJibGUgb24gb2ZmLURPTSBlbGVtZW50c1xyXG5cclxuXHRcdGlmIChpc0V2ZW50KGV2ZW50TmFtZSkpIHtcclxuXHRcdFx0ZXZ0ID0gZXZlbnROYW1lO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Ly9JRTktY29tcGxpYW50IGNvbnN0cnVjdG9yXHJcblx0XHRcdGV2dCA9IGRvYy5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcclxuXHRcdFx0ZXZ0LmluaXRDdXN0b21FdmVudChldmVudE5hbWUsIGJ1YmJsZXMsIHRydWUsIGRhdGEpO1xyXG5cclxuXHRcdFx0Ly9hIG1vZGVybiBjb25zdHJ1Y3RvciB3b3VsZCBiZTpcclxuXHRcdFx0Ly8gdmFyIGV2dCA9IG5ldyBDdXN0b21FdmVudChldmVudE5hbWUsIHsgZGV0YWlsOiBkYXRhLCBidWJibGVzOiBidWJibGVzIH0pXHJcblx0XHR9XHJcblxyXG5cdFx0ZW1pdE1ldGhvZCA9IHRhcmdldC5kaXNwYXRjaEV2ZW50O1xyXG5cdH1cclxuXHJcblx0Ly9jcmVhdGUgZXZlbnQgZm9yIGpRdWVyeSBvYmplY3RcclxuXHRlbHNlIGlmICgkICYmIHRhcmdldCBpbnN0YW5jZW9mICQpIHtcclxuXHRcdC8vVE9ETzogZGVjaWRlIGhvdyB0byBwYXNzIGRhdGFcclxuXHRcdGV2dCA9ICQuRXZlbnQoIGV2ZW50TmFtZSwgZGF0YSApO1xyXG5cdFx0ZXZ0LmRldGFpbCA9IGRhdGE7XHJcblxyXG5cdFx0Ly9GSVhNRTogcmVmZXJlbmNlIGNhc2Ugd2hlcmUgdHJpZ2dlckhhbmRsZXIgbmVlZGVkIChzb21ldGhpbmcgd2l0aCBtdWx0aXBsZSBjYWxscylcclxuXHRcdGVtaXRNZXRob2QgPSBidWJibGVzID8gdGFyZ3RlLnRyaWdnZXIgOiB0YXJnZXQudHJpZ2dlckhhbmRsZXI7XHJcblx0fVxyXG5cclxuXHQvL2RldGVjdCB0YXJnZXQgZXZlbnRzXHJcblx0ZWxzZSB7XHJcblx0XHQvL2VtaXQgLSBkZWZhdWx0XHJcblx0XHQvL3RyaWdnZXIgLSBqcXVlcnlcclxuXHRcdC8vZGlzcGF0Y2hFdmVudCAtIERPTVxyXG5cdFx0Ly9yYWlzZSAtIG5vZGUtc3RhdGVcclxuXHRcdC8vZmlyZSAtID8/P1xyXG5cdFx0ZW1pdE1ldGhvZCA9IHRhcmdldFsnZGlzcGF0Y2hFdmVudCddIHx8IHRhcmdldFsnZW1pdCddIHx8IHRhcmdldFsndHJpZ2dlciddIHx8IHRhcmdldFsnZmlyZSddIHx8IHRhcmdldFsncmFpc2UnXTtcclxuXHR9XHJcblxyXG5cclxuXHR2YXIgYXJncyA9IHNsaWNlKGFyZ3VtZW50cywgMik7XHJcblxyXG5cclxuXHQvL3VzZSBsb2NrcyB0byBhdm9pZCBzZWxmLXJlY3Vyc2lvbiBvbiBvYmplY3RzIHdyYXBwaW5nIHRoaXMgbWV0aG9kXHJcblx0aWYgKGVtaXRNZXRob2QpIHtcclxuXHRcdGlmIChpY2ljbGUuZnJlZXplKHRhcmdldCwgJ2VtaXQnICsgZXZlbnROYW1lKSkge1xyXG5cdFx0XHQvL3VzZSB0YXJnZXQgZXZlbnQgc3lzdGVtLCBpZiBwb3NzaWJsZVxyXG5cdFx0XHRlbWl0TWV0aG9kLmFwcGx5KHRhcmdldCwgW2V2dF0uY29uY2F0KGFyZ3MpKTtcclxuXHRcdFx0aWNpY2xlLnVuZnJlZXplKHRhcmdldCwgJ2VtaXQnICsgZXZlbnROYW1lKTtcclxuXHJcblx0XHRcdHJldHVybiB0YXJnZXQ7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9pZiBldmVudCB3YXMgZnJvemVuIC0gcHJvYmFibHkgaXQgaXMgZW1pdHRlciBpbnN0YW5jZVxyXG5cdFx0Ly9zbyBwZXJmb3JtIG5vcm1hbCBjYWxsYmFja1xyXG5cdH1cclxuXHJcblxyXG5cdC8vZmFsbCBiYWNrIHRvIGRlZmF1bHQgZXZlbnQgc3lzdGVtXHJcblx0dmFyIGV2dENhbGxiYWNrcyA9IGxpc3RlbmVycyh0YXJnZXQsIGV2dCk7XHJcblxyXG5cdC8vY29weSBjYWxsYmFja3MgdG8gZmlyZSBiZWNhdXNlIGxpc3QgY2FuIGJlIGNoYW5nZWQgYnkgc29tZSBjYWxsYmFjayAobGlrZSBgb2ZmYClcclxuXHR2YXIgZmlyZUxpc3QgPSBzbGljZShldnRDYWxsYmFja3MpO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZmlyZUxpc3QubGVuZ3RoOyBpKysgKSB7XHJcblx0XHRmaXJlTGlzdFtpXSAmJiBmaXJlTGlzdFtpXS5hcHBseSh0YXJnZXQsIGFyZ3MpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRhcmdldDtcclxufSIsIi8qKlxyXG4gKiBBIHN0b3JhZ2Ugb2YgcGVyLXRhcmdldCBjYWxsYmFja3MuXHJcbiAqIFdlYWtNYXAgaXMgdGhlIG1vc3Qgc2FmZSBzb2x1dGlvbi5cclxuICpcclxuICogQG1vZHVsZSBlbW15L2xpc3RlbmVyc1xyXG4gKi9cclxuXHJcblxyXG4vKipcclxuICogUHJvcGVydHkgbmFtZSB0byBwcm92aWRlIG9uIHRhcmdldHMuXHJcbiAqXHJcbiAqIENhbuKAmXQgdXNlIGdsb2JhbCBXZWFrTWFwIC1cclxuICogaXQgaXMgaW1wb3NzaWJsZSB0byBwcm92aWRlIHNpbmdsZXRvbiBnbG9iYWwgY2FjaGUgb2YgY2FsbGJhY2tzIGZvciB0YXJnZXRzXHJcbiAqIG5vdCBwb2xsdXRpbmcgZ2xvYmFsIHNjb3BlLiBTbyBpdCBpcyBiZXR0ZXIgdG8gcG9sbHV0ZSB0YXJnZXQgc2NvcGUgdGhhbiB0aGUgZ2xvYmFsLlxyXG4gKlxyXG4gKiBPdGhlcndpc2UsIGVhY2ggZW1teSBpbnN0YW5jZSB3aWxsIGNyZWF0ZSBpdOKAmXMgb3duIGNhY2hlLCB3aGljaCBsZWFkcyB0byBtZXNzLlxyXG4gKlxyXG4gKiBBbHNvIGNhbuKAmXQgdXNlIGAuX2V2ZW50c2AgcHJvcGVydHkgb24gdGFyZ2V0cywgYXMgaXQgaXMgZG9uZSBpbiBgZXZlbnRzYCBtb2R1bGUsXHJcbiAqIGJlY2F1c2UgaXQgaXMgaW5jb21wYXRpYmxlLiBFbW15IHRhcmdldHMgdW5pdmVyc2FsIGV2ZW50cyB3cmFwcGVyLCBub3QgdGhlIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbi5cclxuICpcclxuICovXHJcbi8vRklYTUU6IG5ldyBucG0gZm9yY2VzIGZsYXQgbW9kdWxlcyBzdHJ1Y3R1cmUsIHNvIHdlYWttYXBzIGFyZSBiZXR0ZXIgcHJvdmlkaW5nIHRoYXQgdGhlcmXigJlzIHRoZSBvbmUgZW1teSBhY3Jvc3MgdGhlIHByb2plY3QuXHJcbnZhciBjYlByb3BOYW1lID0gJ19jYWxsYmFja3MnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBHZXQgbGlzdGVuZXJzIGZvciB0aGUgdGFyZ2V0L2V2dCAob3B0aW9uYWxseSkuXHJcbiAqXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgYSB0YXJnZXQgb2JqZWN0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfT8gZXZ0IGFuIGV2dCBuYW1lLCBpZiB1bmRlZmluZWQgLSByZXR1cm4gb2JqZWN0IHdpdGggZXZlbnRzXHJcbiAqXHJcbiAqIEByZXR1cm4geyhvYmplY3R8YXJyYXkpfSBMaXN0L3NldCBvZiBsaXN0ZW5lcnNcclxuICovXHJcbmZ1bmN0aW9uIGxpc3RlbmVycyh0YXJnZXQsIGV2dCwgdGFncyl7XHJcblx0dmFyIGNicyA9IHRhcmdldFtjYlByb3BOYW1lXTtcclxuXHR2YXIgcmVzdWx0O1xyXG5cclxuXHRpZiAoIWV2dCkge1xyXG5cdFx0cmVzdWx0ID0gY2JzIHx8IHt9O1xyXG5cclxuXHRcdC8vZmlsdGVyIGNicyBieSB0YWdzXHJcblx0XHRpZiAodGFncykge1xyXG5cdFx0XHR2YXIgZmlsdGVyZWRSZXN1bHQgPSB7fTtcclxuXHRcdFx0Zm9yICh2YXIgZXZ0IGluIHJlc3VsdCkge1xyXG5cdFx0XHRcdGZpbHRlcmVkUmVzdWx0W2V2dF0gPSByZXN1bHRbZXZ0XS5maWx0ZXIoZnVuY3Rpb24gKGNiKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gaGFzVGFncyhjYiwgdGFncyk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmVzdWx0ID0gZmlsdGVyZWRSZXN1bHQ7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cdGlmICghY2JzIHx8ICFjYnNbZXZ0XSkge1xyXG5cdFx0cmV0dXJuIFtdO1xyXG5cdH1cclxuXHJcblx0cmVzdWx0ID0gY2JzW2V2dF07XHJcblxyXG5cdC8vaWYgdGhlcmUgYXJlIGV2dCBuYW1lc3BhY2VzIHNwZWNpZmllZCAtIGZpbHRlciBjYWxsYmFja3NcclxuXHRpZiAodGFncyAmJiB0YWdzLmxlbmd0aCkge1xyXG5cdFx0cmVzdWx0ID0gcmVzdWx0LmZpbHRlcihmdW5jdGlvbiAoY2IpIHtcclxuXHRcdFx0cmV0dXJuIGhhc1RhZ3MoY2IsIHRhZ3MpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZSBsaXN0ZW5lciwgaWYgYW55XHJcbiAqL1xyXG5saXN0ZW5lcnMucmVtb3ZlID0gZnVuY3Rpb24odGFyZ2V0LCBldnQsIGNiLCB0YWdzKXtcclxuXHQvL2dldCBjYWxsYmFja3MgZm9yIHRoZSBldnRcclxuXHR2YXIgZXZ0Q2FsbGJhY2tzID0gdGFyZ2V0W2NiUHJvcE5hbWVdO1xyXG5cdGlmICghZXZ0Q2FsbGJhY2tzIHx8ICFldnRDYWxsYmFja3NbZXZ0XSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHR2YXIgY2FsbGJhY2tzID0gZXZ0Q2FsbGJhY2tzW2V2dF07XHJcblxyXG5cdC8vaWYgdGFncyBhcmUgcGFzc2VkIC0gbWFrZSBzdXJlIGNhbGxiYWNrIGhhcyBzb21lIHRhZ3MgYmVmb3JlIHJlbW92aW5nXHJcblx0aWYgKHRhZ3MgJiYgdGFncy5sZW5ndGggJiYgIWhhc1RhZ3MoY2IsIHRhZ3MpKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdC8vcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0Ly9vbmNlIG1ldGhvZCBoYXMgb3JpZ2luYWwgY2FsbGJhY2sgaW4gLmNiXHJcblx0XHRpZiAoY2FsbGJhY2tzW2ldID09PSBjYiB8fCBjYWxsYmFja3NbaV0uZm4gPT09IGNiKSB7XHJcblx0XHRcdGNhbGxiYWNrcy5zcGxpY2UoaSwgMSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcblxyXG4vKipcclxuICogQWRkIGEgbmV3IGxpc3RlbmVyXHJcbiAqL1xyXG5saXN0ZW5lcnMuYWRkID0gZnVuY3Rpb24odGFyZ2V0LCBldnQsIGNiLCB0YWdzKXtcclxuXHRpZiAoIWNiKSByZXR1cm47XHJcblxyXG5cdHZhciB0YXJnZXRDYWxsYmFja3MgPSB0YXJnZXRbY2JQcm9wTmFtZV07XHJcblxyXG5cdC8vZW5zdXJlIHNldCBvZiBjYWxsYmFja3MgZm9yIHRoZSB0YXJnZXQgZXhpc3RzXHJcblx0aWYgKCF0YXJnZXRDYWxsYmFja3MpIHtcclxuXHRcdHRhcmdldENhbGxiYWNrcyA9IHt9O1xyXG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY2JQcm9wTmFtZSwge1xyXG5cdFx0XHR2YWx1ZTogdGFyZ2V0Q2FsbGJhY2tzXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vc2F2ZSBhIG5ldyBjYWxsYmFja1xyXG5cdCh0YXJnZXRDYWxsYmFja3NbZXZ0XSA9IHRhcmdldENhbGxiYWNrc1tldnRdIHx8IFtdKS5wdXNoKGNiKTtcclxuXHJcblx0Ly9zYXZlIG5zIGZvciBhIGNhbGxiYWNrLCBpZiBhbnlcclxuXHRpZiAodGFncyAmJiB0YWdzLmxlbmd0aCkge1xyXG5cdFx0Y2IuX25zID0gdGFncztcclxuXHR9XHJcbn07XHJcblxyXG5cclxuLyoqIERldGVjdCB3aGV0aGVyIGFuIGNiIGhhcyBhdCBsZWFzdCBvbmUgdGFnIGZyb20gdGhlIGxpc3QgKi9cclxuZnVuY3Rpb24gaGFzVGFncyhjYiwgdGFncyl7XHJcblx0aWYgKGNiLl9ucykge1xyXG5cdFx0Ly9pZiBjYiBpcyB0YWdnZWQgd2l0aCBhIG5zIGFuZCBpbmNsdWRlcyBvbmUgb2YgdGhlIG5zIHBhc3NlZCAtIGtlZXAgaXRcclxuXHRcdGZvciAodmFyIGkgPSB0YWdzLmxlbmd0aDsgaS0tOyl7XHJcblx0XHRcdGlmIChjYi5fbnMuaW5kZXhPZih0YWdzW2ldKSA+PSAwKSByZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3RlbmVyczsiLCIvKipcclxuICogQG1vZHVsZSBlbW15L29mZlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBvZmY7XHJcblxyXG52YXIgaWNpY2xlID0gcmVxdWlyZSgnaWNpY2xlJyk7XHJcbnZhciBzbGljZSA9IHJlcXVpcmUoJ3NsaWNlZCcpO1xyXG52YXIgbGlzdGVuZXJzID0gcmVxdWlyZSgnLi9saXN0ZW5lcnMnKTtcclxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdtdXR5cGUvaXMtYXJyYXknKTtcclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlIGxpc3RlbmVyW3NdIGZyb20gdGhlIHRhcmdldFxyXG4gKlxyXG4gKiBAcGFyYW0ge1t0eXBlXX0gZXZ0IFtkZXNjcmlwdGlvbl1cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gW2Rlc2NyaXB0aW9uXVxyXG4gKlxyXG4gKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cclxuICovXHJcbmZ1bmN0aW9uIG9mZih0YXJnZXQsIGV2dCwgZm4pIHtcclxuXHRpZiAoIXRhcmdldCkgcmV0dXJuIHRhcmdldDtcclxuXHJcblx0dmFyIGNhbGxiYWNrcywgaTtcclxuXHJcblx0Ly91bmJpbmQgYWxsIGxpc3RlbmVycyBpZiBubyBmbiBzcGVjaWZpZWRcclxuXHRpZiAoZm4gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0dmFyIGFyZ3MgPSBzbGljZShhcmd1bWVudHMsIDEpO1xyXG5cclxuXHRcdC8vdHJ5IHRvIHVzZSB0YXJnZXQgcmVtb3ZlQWxsIG1ldGhvZCwgaWYgYW55XHJcblx0XHR2YXIgYWxsT2ZmID0gdGFyZ2V0WydyZW1vdmVBbGwnXSB8fCB0YXJnZXRbJ3JlbW92ZUFsbExpc3RlbmVycyddO1xyXG5cclxuXHRcdC8vY2FsbCB0YXJnZXQgcmVtb3ZlQWxsXHJcblx0XHRpZiAoYWxsT2ZmKSB7XHJcblx0XHRcdGFsbE9mZi5hcHBseSh0YXJnZXQsIGFyZ3MpO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHQvL3RoZW4gZm9yZ2V0IG93biBjYWxsYmFja3MsIGlmIGFueVxyXG5cclxuXHRcdC8vdW5iaW5kIGFsbCBldnRzXHJcblx0XHRpZiAoIWV2dCkge1xyXG5cdFx0XHRjYWxsYmFja3MgPSBsaXN0ZW5lcnModGFyZ2V0KTtcclxuXHRcdFx0Zm9yIChldnQgaW4gY2FsbGJhY2tzKSB7XHJcblx0XHRcdFx0b2ZmKHRhcmdldCwgZXZ0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly91bmJpbmQgYWxsIGNhbGxiYWNrcyBmb3IgYW4gZXZ0XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZXZ0ID0gJycgKyBldnQ7XHJcblxyXG5cdFx0XHQvL2ludm9rZSBtZXRob2QgZm9yIGVhY2ggc3BhY2Utc2VwYXJhdGVkIGV2ZW50IGZyb20gYSBsaXN0XHJcblx0XHRcdGV2dC5zcGxpdCgvXFxzKy8pLmZvckVhY2goZnVuY3Rpb24gKGV2dCkge1xyXG5cdFx0XHRcdHZhciBldnRQYXJ0cyA9IGV2dC5zcGxpdCgnLicpO1xyXG5cdFx0XHRcdGV2dCA9IGV2dFBhcnRzLnNoaWZ0KCk7XHJcblx0XHRcdFx0Y2FsbGJhY2tzID0gbGlzdGVuZXJzKHRhcmdldCwgZXZ0LCBldnRQYXJ0cyk7XHJcblxyXG5cdFx0XHRcdC8vcmV0dXJuZWQgYXJyYXkgb2YgY2FsbGJhY2tzIChhcyBldmVudCBpcyBkZWZpbmVkKVxyXG5cdFx0XHRcdGlmIChldnQpIHtcclxuXHRcdFx0XHRcdHZhciBvYmogPSB7fTtcclxuXHRcdFx0XHRcdG9ialtldnRdID0gY2FsbGJhY2tzO1xyXG5cdFx0XHRcdFx0Y2FsbGJhY2tzID0gb2JqO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly9mb3IgZWFjaCBncm91cCBvZiBjYWxsYmFja3MgLSB1bmJpbmQgYWxsXHJcblx0XHRcdFx0Zm9yICh2YXIgZXZ0TmFtZSBpbiBjYWxsYmFja3MpIHtcclxuXHRcdFx0XHRcdHNsaWNlKGNhbGxiYWNrc1tldnROYW1lXSkuZm9yRWFjaChmdW5jdGlvbiAoY2IpIHtcclxuXHRcdFx0XHRcdFx0b2ZmKHRhcmdldCwgZXZ0TmFtZSwgY2IpO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGFyZ2V0O1xyXG5cdH1cclxuXHJcblxyXG5cdC8vdGFyZ2V0IGV2ZW50cyAoc3RyaW5nIG5vdGF0aW9uIHRvIGFkdmFuY2VkX29wdGltaXphdGlvbnMpXHJcblx0dmFyIG9mZk1ldGhvZCA9IHRhcmdldFsncmVtb3ZlRXZlbnRMaXN0ZW5lciddIHx8IHRhcmdldFsncmVtb3ZlTGlzdGVuZXInXSB8fCB0YXJnZXRbJ2RldGFjaEV2ZW50J10gfHwgdGFyZ2V0WydvZmYnXTtcclxuXHJcblx0Ly9pbnZva2UgbWV0aG9kIGZvciBlYWNoIHNwYWNlLXNlcGFyYXRlZCBldmVudCBmcm9tIGEgbGlzdFxyXG5cdGV2dC5zcGxpdCgvXFxzKy8pLmZvckVhY2goZnVuY3Rpb24gKGV2dCkge1xyXG5cdFx0dmFyIGV2dFBhcnRzID0gZXZ0LnNwbGl0KCcuJyk7XHJcblx0XHRldnQgPSBldnRQYXJ0cy5zaGlmdCgpO1xyXG5cclxuXHRcdC8vdXNlIHRhcmdldCBgb2ZmYCwgaWYgcG9zc2libGVcclxuXHRcdGlmIChvZmZNZXRob2QpIHtcclxuXHRcdFx0Ly9hdm9pZCBzZWxmLXJlY3Vyc2lvbiBmcm9tIHRoZSBvdXRzaWRlXHJcblx0XHRcdGlmIChpY2ljbGUuZnJlZXplKHRhcmdldCwgJ29mZicgKyBldnQpKSB7XHJcblx0XHRcdFx0b2ZmTWV0aG9kLmNhbGwodGFyZ2V0LCBldnQsIGZuKTtcclxuXHRcdFx0XHRpY2ljbGUudW5mcmVlemUodGFyZ2V0LCAnb2ZmJyArIGV2dCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vaWYgaXTigJlzIGZyb3plbiAtIGlnbm9yZSBjYWxsXHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB0YXJnZXQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZm4uY2xvc2VkQ2FsbCkgZm4uY2xvc2VkQ2FsbCA9IGZhbHNlO1xyXG5cclxuXHRcdC8vZm9yZ2V0IGNhbGxiYWNrXHJcblx0XHRsaXN0ZW5lcnMucmVtb3ZlKHRhcmdldCwgZXZ0LCBmbiwgZXZ0UGFydHMpO1xyXG5cdH0pO1xyXG5cclxuXHJcblx0cmV0dXJuIHRhcmdldDtcclxufSIsIi8qKlxuICogQG1vZHVsZSBlbW15L29uXG4gKi9cblxuXG52YXIgaWNpY2xlID0gcmVxdWlyZSgnaWNpY2xlJyk7XG52YXIgbGlzdGVuZXJzID0gcmVxdWlyZSgnLi9saXN0ZW5lcnMnKTtcbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJ211dHlwZS9pcy1vYmplY3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBvbjtcblxuXG4vKipcbiAqIEJpbmQgZm4gdG8gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHsqfSB0YXJndGUgQSBzaW5nbGUgdGFyZ2V0IHRvIGJpbmQgZXZ0XG4gKiBAcGFyYW0ge3N0cmluZ30gZXZ0IEFuIGV2ZW50IG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEEgY2FsbGJhY2tcbiAqIEBwYXJhbSB7RnVuY3Rpb259PyBjb25kaXRpb24gQW4gb3B0aW9uYWwgZmlsdGVyaW5nIGZuIGZvciBhIGNhbGxiYWNrXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWNoIGFjY2VwdHMgYW4gZXZlbnQgYW5kIHJldHVybnMgY2FsbGJhY2tcbiAqXG4gKiBAcmV0dXJuIHtvYmplY3R9IEEgdGFyZ2V0XG4gKi9cbmZ1bmN0aW9uIG9uKHRhcmdldCwgZXZ0LCBmbil7XG5cdGlmICghdGFyZ2V0KSByZXR1cm4gdGFyZ2V0O1xuXG5cdC8vY29uc2lkZXIgb2JqZWN0IG9mIGV2ZW50c1xuXHRpZiAoaXNPYmplY3QoZXZ0KSkge1xuXHRcdGZvcih2YXIgZXZ0TmFtZSBpbiBldnQpIHtcblx0XHRcdG9uKHRhcmdldCwgZXZ0TmFtZSwgZXZ0W2V2dE5hbWVdKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRhcmdldDtcblx0fVxuXG5cdC8vZ2V0IHRhcmdldCBgb25gIG1ldGhvZCwgaWYgYW55XG5cdC8vcHJlZmVyIG5hdGl2ZS1saWtlIG1ldGhvZCBuYW1lXG5cdC8vdXNlciBtYXkgb2NjYXNpb25hbGx5IGV4cG9zZSBgb25gIHRvIHRoZSBnbG9iYWwsIGluIGNhc2Ugb2YgYnJvd3NlcmlmeVxuXHQvL2J1dCBpdCBpcyB1bmxpa2VseSBvbmUgd291bGQgcmVwbGFjZSBuYXRpdmUgYGFkZEV2ZW50TGlzdGVuZXJgXG5cdHZhciBvbk1ldGhvZCA9ICB0YXJnZXRbJ2FkZEV2ZW50TGlzdGVuZXInXSB8fCB0YXJnZXRbJ2FkZExpc3RlbmVyJ10gfHwgdGFyZ2V0WydhdHRhY2hFdmVudCddIHx8IHRhcmdldFsnb24nXTtcblxuXHR2YXIgY2IgPSBmbjtcblxuXHRldnQgPSAnJyArIGV2dDtcblxuXHQvL2ludm9rZSBtZXRob2QgZm9yIGVhY2ggc3BhY2Utc2VwYXJhdGVkIGV2ZW50IGZyb20gYSBsaXN0XG5cdGV2dC5zcGxpdCgvXFxzKy8pLmZvckVhY2goZnVuY3Rpb24oZXZ0KXtcblx0XHR2YXIgZXZ0UGFydHMgPSBldnQuc3BsaXQoJy4nKTtcblx0XHRldnQgPSBldnRQYXJ0cy5zaGlmdCgpO1xuXG5cdFx0Ly91c2UgdGFyZ2V0IGV2ZW50IHN5c3RlbSwgaWYgcG9zc2libGVcblx0XHRpZiAob25NZXRob2QpIHtcblx0XHRcdC8vYXZvaWQgc2VsZi1yZWN1cnNpb25zXG5cdFx0XHQvL2lmIGl04oCZcyBmcm96ZW4gLSBpZ25vcmUgY2FsbFxuXHRcdFx0aWYgKGljaWNsZS5mcmVlemUodGFyZ2V0LCAnb24nICsgZXZ0KSl7XG5cdFx0XHRcdG9uTWV0aG9kLmNhbGwodGFyZ2V0LCBldnQsIGNiKTtcblx0XHRcdFx0aWNpY2xlLnVuZnJlZXplKHRhcmdldCwgJ29uJyArIGV2dCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRhcmdldDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL3NhdmUgdGhlIGNhbGxiYWNrIGFueXdheVxuXHRcdGxpc3RlbmVycy5hZGQodGFyZ2V0LCBldnQsIGNiLCBldnRQYXJ0cyk7XG5cdH0pO1xuXG5cdHJldHVybiB0YXJnZXQ7XG59XG5cblxuLyoqXG4gKiBXcmFwIGFuIGZuIHdpdGggY29uZGl0aW9uIHBhc3NpbmdcbiAqL1xub24ud3JhcCA9IGZ1bmN0aW9uKHRhcmdldCwgZXZ0LCBmbiwgY29uZGl0aW9uKXtcblx0dmFyIGNiID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKGNvbmRpdGlvbi5hcHBseSh0YXJnZXQsIGFyZ3VtZW50cykpIHtcblx0XHRcdHJldHVybiBmbi5hcHBseSh0YXJnZXQsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9O1xuXG5cdGNiLmZuID0gZm47XG5cblx0cmV0dXJuIGNiO1xufTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcclxuICogR2V0IGNsaWVudFkvY2xpZW50WSBmcm9tIGFuIGV2ZW50LlxyXG4gKiBJZiBpbmRleCBpcyBwYXNzZWQsIHRyZWF0IGl0IGFzIGluZGV4IG9mIGdsb2JhbCB0b3VjaGVzLCBub3QgdGhlIHRhcmdldFRvdWNoZXMuXHJcbiAqIEdsb2JhbCB0b3VjaGVzIGluY2x1ZGUgdGFyZ2V0IHRvdWNoZXMuXHJcbiAqXHJcbiAqIEBtb2R1bGUgZ2V0LWNsaWVudC14eVxyXG4gKlxyXG4gKiBAcGFyYW0ge0V2ZW50fSBlIEV2ZW50IHJhaXNlZCwgbGlrZSBtb3VzZW1vdmVcclxuICpcclxuICogQHJldHVybiB7bnVtYmVyfSBDb29yZGluYXRlIHJlbGF0aXZlIHRvIHRoZSBzY3JlZW5cclxuICovXHJcbmZ1bmN0aW9uIGdldENsaWVudFkgKGUsIGlkeCkge1xyXG5cdC8vIHRvdWNoIGV2ZW50XHJcblx0aWYgKGUudG91Y2hlcykge1xyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcblx0XHRcdHJldHVybiBmaW5kVG91Y2goZS50b3VjaGVzLCBpZHgpLmNsaWVudFlcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZS50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBtb3VzZSBldmVudFxyXG5cdHJldHVybiBlLmNsaWVudFk7XHJcbn1cclxuZnVuY3Rpb24gZ2V0Q2xpZW50WCAoZSwgaWR4KSB7XHJcblx0Ly8gdG91Y2ggZXZlbnRcclxuXHRpZiAoZS50b3VjaGVzKSB7XHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IGlkeCkge1xyXG5cdFx0XHRyZXR1cm4gZmluZFRvdWNoKGUudG91Y2hlcywgaWR4KS5jbGllbnRYO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBlLnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIG1vdXNlIGV2ZW50XHJcblx0cmV0dXJuIGUuY2xpZW50WDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q2xpZW50WFkgKGUsIGlkeCkge1xyXG5cdHJldHVybiBbZ2V0Q2xpZW50WC5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBnZXRDbGllbnRZLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyldO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kVG91Y2ggKHRvdWNoTGlzdCwgaWR4KSB7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaExpc3QubGVuZ3RoOyBpKyspIHtcclxuXHRcdGlmICh0b3VjaExpc3RbaV0uaWRlbnRpZmllciA9PT0gaWR4KSB7XHJcblx0XHRcdHJldHVybiB0b3VjaExpc3RbaV07XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5cclxuZ2V0Q2xpZW50WFkueCA9IGdldENsaWVudFg7XHJcbmdldENsaWVudFhZLnkgPSBnZXRDbGllbnRZO1xyXG5nZXRDbGllbnRYWS5maW5kVG91Y2ggPSBmaW5kVG91Y2g7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdldENsaWVudFhZOyIsIi8qKlxyXG4gKiBAbW9kdWxlICBnZXQtZG9jXHJcbiAqL1xyXG5cclxudmFyIGhhc0RvbSA9IHJlcXVpcmUoJ2hhcy1kb20nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaGFzRG9tKCkgPyBkb2N1bWVudCA6IG51bGw7IiwiLyoqIGdlbmVyYXRlIHVuaXF1ZSBpZCBmb3Igc2VsZWN0b3IgKi9cclxudmFyIGNvdW50ZXIgPSBEYXRlLm5vdygpICUgMWU5O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRVaWQoKXtcclxuXHRyZXR1cm4gKE1hdGgucmFuZG9tKCkgKiAxZTkgPj4+IDApICsgKGNvdW50ZXIrKyk7XHJcbn07IiwiaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZ2xvYmFsO1xufSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHt9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuXHRcdCYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCdcblx0XHQmJiB0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJztcbn07XG4iLCIvKipcclxuICogQG1vZHVsZSBJY2ljbGVcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cdGZyZWV6ZTogbG9jayxcclxuXHR1bmZyZWV6ZTogdW5sb2NrLFxyXG5cdGlzRnJvemVuOiBpc0xvY2tlZFxyXG59O1xyXG5cclxuXHJcbi8qKiBTZXQgb2YgdGFyZ2V0cyAgKi9cclxudmFyIGxvY2tDYWNoZSA9IG5ldyBXZWFrTWFwO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBTZXQgZmxhZyBvbiB0YXJnZXQgd2l0aCB0aGUgbmFtZSBwYXNzZWRcclxuICpcclxuICogQHJldHVybiB7Ym9vbH0gV2hldGhlciBsb2NrIHN1Y2NlZWRlZFxyXG4gKi9cclxuZnVuY3Rpb24gbG9jayh0YXJnZXQsIG5hbWUpe1xyXG5cdHZhciBsb2NrcyA9IGxvY2tDYWNoZS5nZXQodGFyZ2V0KTtcclxuXHRpZiAobG9ja3MgJiYgbG9ja3NbbmFtZV0pIHJldHVybiBmYWxzZTtcclxuXHJcblx0Ly9jcmVhdGUgbG9jayBzZXQgZm9yIGEgdGFyZ2V0LCBpZiBub25lXHJcblx0aWYgKCFsb2Nrcykge1xyXG5cdFx0bG9ja3MgPSB7fTtcclxuXHRcdGxvY2tDYWNoZS5zZXQodGFyZ2V0LCBsb2Nrcyk7XHJcblx0fVxyXG5cclxuXHQvL3NldCBhIG5ldyBsb2NrXHJcblx0bG9ja3NbbmFtZV0gPSB0cnVlO1xyXG5cclxuXHQvL3JldHVybiBzdWNjZXNzXHJcblx0cmV0dXJuIHRydWU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogVW5zZXQgZmxhZyBvbiB0aGUgdGFyZ2V0IHdpdGggdGhlIG5hbWUgcGFzc2VkLlxyXG4gKlxyXG4gKiBOb3RlIHRoYXQgaWYgdG8gcmV0dXJuIG5ldyB2YWx1ZSBmcm9tIHRoZSBsb2NrL3VubG9jayxcclxuICogdGhlbiB1bmxvY2sgd2lsbCBhbHdheXMgcmV0dXJuIGZhbHNlIGFuZCBsb2NrIHdpbGwgYWx3YXlzIHJldHVybiB0cnVlLFxyXG4gKiB3aGljaCBpcyB1c2VsZXNzIGZvciB0aGUgdXNlciwgdGhvdWdoIG1heWJlIGludHVpdGl2ZS5cclxuICpcclxuICogQHBhcmFtIHsqfSB0YXJnZXQgQW55IG9iamVjdFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBBIGZsYWcgbmFtZVxyXG4gKlxyXG4gKiBAcmV0dXJuIHtib29sfSBXaGV0aGVyIHVubG9jayBmYWlsZWQuXHJcbiAqL1xyXG5mdW5jdGlvbiB1bmxvY2sodGFyZ2V0LCBuYW1lKXtcclxuXHR2YXIgbG9ja3MgPSBsb2NrQ2FjaGUuZ2V0KHRhcmdldCk7XHJcblx0aWYgKCFsb2NrcyB8fCAhbG9ja3NbbmFtZV0pIHJldHVybiBmYWxzZTtcclxuXHJcblx0bG9ja3NbbmFtZV0gPSBudWxsO1xyXG5cclxuXHRyZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gd2hldGhlciBmbGFnIGlzIHNldFxyXG4gKlxyXG4gKiBAcGFyYW0geyp9IHRhcmdldCBBbnkgb2JqZWN0IHRvIGFzc29jaWF0ZSBsb2NrIHdpdGhcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgQSBmbGFnIG5hbWVcclxuICpcclxuICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciBsb2NrZWQgb3Igbm90XHJcbiAqL1xyXG5mdW5jdGlvbiBpc0xvY2tlZCh0YXJnZXQsIG5hbWUpe1xyXG5cdHZhciBsb2NrcyA9IGxvY2tDYWNoZS5nZXQodGFyZ2V0KTtcclxuXHRyZXR1cm4gKGxvY2tzICYmIGxvY2tzW25hbWVdKTtcclxufSIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvKiogQG1vZHVsZSAgaW50ZXJzZWN0cyAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGludGVyc2VjdHM7XHJcblxyXG5cclxudmFyIG1pbiA9IE1hdGgubWluLCBtYXggPSBNYXRoLm1heDtcclxuXHJcblxyXG4vKipcclxuICogTWFpbiBpbnRlcnNlY3Rpb24gZGV0ZWN0b3IuXHJcbiAqXHJcbiAqIEBwYXJhbSB7UmVjdGFuZ2xlfSBhIFRhcmdldFxyXG4gKiBAcGFyYW0ge1JlY3RhbmdsZX0gYiBDb250YWluZXJcclxuICpcclxuICogQHJldHVybiB7Ym9vbH0gV2hldGhlciB0YXJnZXQgaXMgd2l0aGluIHRoZSBjb250YWluZXJcclxuICovXHJcbmZ1bmN0aW9uIGludGVyc2VjdHMgKGEsIGIsIHRvbGVyYW5jZSl7XHJcblx0Ly9pZ25vcmUgZGVmaW5pdGUgZGlzaW50ZXJzZWN0aW9uXHJcblx0aWYgKGEucmlnaHQgPCBiLmxlZnQgfHwgYS5sZWZ0ID4gYi5yaWdodCkgcmV0dXJuIGZhbHNlO1xyXG5cdGlmIChhLmJvdHRvbSA8IGIudG9wIHx8IGEudG9wID4gYi5ib3R0b20pIHJldHVybiBmYWxzZTtcclxuXHJcblx0Ly9pbnRlcnNlY3Rpb24gdmFsdWVzXHJcblx0dmFyIGlYID0gbWluKGEucmlnaHQgLSBtYXgoYi5sZWZ0LCBhLmxlZnQpLCBiLnJpZ2h0IC0gbWF4KGEubGVmdCwgYi5sZWZ0KSk7XHJcblx0dmFyIGlZID0gbWluKGEuYm90dG9tIC0gbWF4KGIudG9wLCBhLnRvcCksIGIuYm90dG9tIC0gbWF4KGEudG9wLCBiLnRvcCkpO1xyXG5cdHZhciBpU3F1YXJlID0gaVggKiBpWTtcclxuXHJcblx0dmFyIGJTcXVhcmUgPSAoYi5ib3R0b20gLSBiLnRvcCkgKiAoYi5yaWdodCAtIGIubGVmdCk7XHJcblx0dmFyIGFTcXVhcmUgPSAoYS5ib3R0b20gLSBhLnRvcCkgKiAoYS5yaWdodCAtIGEubGVmdCk7XHJcblxyXG5cdC8vbWVhc3VyZSBzcXVhcmUgb3ZlcmxhcCByZWxhdGl2ZSB0byB0aGUgbWluIHNxdWFyZVxyXG5cdHZhciB0YXJnZXRTcXVhcmUgPSBtaW4oYVNxdWFyZSwgYlNxdWFyZSk7XHJcblxyXG5cclxuXHQvL21pbmltYWwgb3ZlcmxhcCByYXRpb1xyXG5cdHRvbGVyYW5jZSA9IHRvbGVyYW5jZSAhPT0gdW5kZWZpbmVkID8gdG9sZXJhbmNlIDogMC41O1xyXG5cclxuXHRpZiAoaVNxdWFyZSAvIHRhcmdldFNxdWFyZSA+IHRvbGVyYW5jZSkge1xyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZmFsc2U7XHJcbn0iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiIsIi8qKlxyXG4gKiBAbW9kdWxlICBpcy1hdWRpby1idWZmZXJcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXVkaW9CdWZmZXIgKGJ1ZmZlcikge1xyXG5cdC8vdGhlIGd1ZXNzIGlzIGR1Y2stdHlwaW5nXHJcblx0cmV0dXJuIGJ1ZmZlciAhPSBudWxsXHJcblx0JiYgYnVmZmVyLnNhbXBsZVJhdGUgIT0gbnVsbCAvL3N3aW1zIGxpa2UgQXVkaW9CdWZmZXJcclxuXHQmJiB0eXBlb2YgYnVmZmVyLmdldENoYW5uZWxEYXRhID09PSAnZnVuY3Rpb24nIC8vcXVhY2tzIGxpa2UgQXVkaW9CdWZmZXJcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHRydWU7IiwiLyoqXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIEJ1ZmZlclxuICpcbiAqIEF1dGhvcjogICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogTGljZW5zZTogIE1JVFxuICpcbiAqIGBucG0gaW5zdGFsbCBpcy1idWZmZXJgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiAhIShvYmogIT0gbnVsbCAmJlxuICAgIChvYmouX2lzQnVmZmVyIHx8IC8vIEZvciBTYWZhcmkgNS03IChtaXNzaW5nIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IpXG4gICAgICAob2JqLmNvbnN0cnVjdG9yICYmXG4gICAgICB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmXG4gICAgICBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKSlcbiAgICApKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblxuZnVuY3Rpb24gaXNGdW5jdGlvbiAoZm4pIHtcbiAgdmFyIHN0cmluZyA9IHRvU3RyaW5nLmNhbGwoZm4pXG4gIHJldHVybiBzdHJpbmcgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScgfHxcbiAgICAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nICYmIHN0cmluZyAhPT0gJ1tvYmplY3QgUmVnRXhwXScpIHx8XG4gICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgIC8vIElFOCBhbmQgYmVsb3dcbiAgICAgKGZuID09PSB3aW5kb3cuc2V0VGltZW91dCB8fFxuICAgICAgZm4gPT09IHdpbmRvdy5hbGVydCB8fFxuICAgICAgZm4gPT09IHdpbmRvdy5jb25maXJtIHx8XG4gICAgICBmbiA9PT0gd2luZG93LnByb21wdCkpXG59O1xuIiwiLyohXG4gKiBpcy1wbGFpbi1vYmplY3QgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L2lzLXBsYWluLW9iamVjdD5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCdpc29iamVjdCcpO1xuXG5mdW5jdGlvbiBpc09iamVjdE9iamVjdChvKSB7XG4gIHJldHVybiBpc09iamVjdChvKSA9PT0gdHJ1ZVxuICAgICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvKSB7XG4gIHZhciBjdG9yLHByb3Q7XG4gIFxuICBpZiAoaXNPYmplY3RPYmplY3QobykgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7XG4gIFxuICAvLyBJZiBoYXMgbW9kaWZpZWQgY29uc3RydWN0b3JcbiAgY3RvciA9IG8uY29uc3RydWN0b3I7XG4gIGlmICh0eXBlb2YgY3RvciAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuICBcbiAgLy8gSWYgaGFzIG1vZGlmaWVkIHByb3RvdHlwZVxuICBwcm90ID0gY3Rvci5wcm90b3R5cGU7XG4gIGlmIChpc09iamVjdE9iamVjdChwcm90KSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcbiAgXG4gIC8vIElmIGNvbnN0cnVjdG9yIGRvZXMgbm90IGhhdmUgYW4gT2JqZWN0LXNwZWNpZmljIG1ldGhvZFxuICBpZiAocHJvdC5oYXNPd25Qcm9wZXJ0eSgnaXNQcm90b3R5cGVPZicpID09PSBmYWxzZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLy8gTW9zdCBsaWtlbHkgYSBwbGFpbiBPYmplY3RcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLyohXG4gKiBpc29iamVjdCA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvaXNvYmplY3Q+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEpvbiBTY2hsaW5rZXJ0LlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdCh2YWwpIHtcbiAgcmV0dXJuIHZhbCAhPSBudWxsICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnXG4gICAgJiYgIUFycmF5LmlzQXJyYXkodmFsKTtcbn07XG4iLCIvKipcclxuICogUGFyc2UgZWxlbWVudOKAmXMgYm9yZGVyc1xyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL2JvcmRlcnNcclxuICovXHJcblxyXG52YXIgUmVjdCA9IHJlcXVpcmUoJy4vcmVjdCcpO1xyXG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlLXZhbHVlJyk7XHJcblxyXG4vKipcclxuICogUmV0dXJuIGJvcmRlciB3aWR0aHMgb2YgYW4gZWxlbWVudFxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbCl7XHJcblx0aWYgKGVsID09PSB3aW5kb3cpIHJldHVybiBSZWN0KCk7XHJcblxyXG5cdGlmICghKGVsIGluc3RhbmNlb2YgRWxlbWVudCkpIHRocm93IEVycm9yKCdBcmd1bWVudCBpcyBub3QgYW4gZWxlbWVudCcpO1xyXG5cclxuXHR2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XHJcblxyXG5cdHJldHVybiBSZWN0KFxyXG5cdFx0cGFyc2Uoc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSxcclxuXHRcdHBhcnNlKHN0eWxlLmJvcmRlclRvcFdpZHRoKSxcclxuXHRcdHBhcnNlKHN0eWxlLmJvcmRlclJpZ2h0V2lkdGgpLFxyXG5cdFx0cGFyc2Uoc3R5bGUuYm9yZGVyQm90dG9tV2lkdGgpXHJcblx0KTtcclxufTsiLCIvKipcclxuICogR2V0IG9yIHNldCBlbGVtZW504oCZcyBzdHlsZSwgcHJlZml4LWFnbm9zdGljLlxyXG4gKlxyXG4gKiBAbW9kdWxlICBtdWNzcy9jc3NcclxuICovXHJcbnZhciBmYWtlU3R5bGUgPSByZXF1aXJlKCcuL2Zha2UtZWxlbWVudCcpLnN0eWxlO1xyXG52YXIgcHJlZml4ID0gcmVxdWlyZSgnLi9wcmVmaXgnKS5sb3dlcmNhc2U7XHJcblxyXG5cclxuLyoqXHJcbiAqIEFwcGx5IHN0eWxlcyB0byBhbiBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0gICAge0VsZW1lbnR9ICAgZWwgICBBbiBlbGVtZW50IHRvIGFwcGx5IHN0eWxlcy5cclxuICogQHBhcmFtICAgIHtPYmplY3R8c3RyaW5nfSAgIG9iaiAgIFNldCBvZiBzdHlsZSBydWxlcyBvciBzdHJpbmcgdG8gZ2V0IHN0eWxlIHJ1bGUuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsLCBvYmope1xyXG5cdGlmICghZWwgfHwgIW9iaikgcmV0dXJuO1xyXG5cclxuXHR2YXIgbmFtZSwgdmFsdWU7XHJcblxyXG5cdC8vcmV0dXJuIHZhbHVlLCBpZiBzdHJpbmcgcGFzc2VkXHJcblx0aWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XHJcblx0XHRuYW1lID0gb2JqO1xyXG5cclxuXHRcdC8vcmV0dXJuIHZhbHVlLCBpZiBubyB2YWx1ZSBwYXNzZWRcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xyXG5cdFx0XHRyZXR1cm4gZWwuc3R5bGVbcHJlZml4aXplKG5hbWUpXTtcclxuXHRcdH1cclxuXHJcblx0XHQvL3NldCBzdHlsZSwgaWYgdmFsdWUgcGFzc2VkXHJcblx0XHR2YWx1ZSA9IGFyZ3VtZW50c1syXSB8fCAnJztcclxuXHRcdG9iaiA9IHt9O1xyXG5cdFx0b2JqW25hbWVdID0gdmFsdWU7XHJcblx0fVxyXG5cclxuXHRmb3IgKG5hbWUgaW4gb2JqKXtcclxuXHRcdC8vY29udmVydCBudW1iZXJzIHRvIHB4XHJcblx0XHRpZiAodHlwZW9mIG9ialtuYW1lXSA9PT0gJ251bWJlcicgJiYgL2xlZnR8cmlnaHR8Ym90dG9tfHRvcHx3aWR0aHxoZWlnaHQvaS50ZXN0KG5hbWUpKSBvYmpbbmFtZV0gKz0gJ3B4JztcclxuXHJcblx0XHR2YWx1ZSA9IG9ialtuYW1lXSB8fCAnJztcclxuXHJcblx0XHRlbC5zdHlsZVtwcmVmaXhpemUobmFtZSldID0gdmFsdWU7XHJcblx0fVxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gcHJlZml4aXplZCBwcm9wIG5hbWUsIGlmIG5lZWRlZC5cclxuICpcclxuICogQHBhcmFtICAgIHtzdHJpbmd9ICAgbmFtZSAgIEEgcHJvcGVydHkgbmFtZS5cclxuICogQHJldHVybiAgIHtzdHJpbmd9ICAgUHJlZml4ZWQgcHJvcGVydHkgbmFtZS5cclxuICovXHJcbmZ1bmN0aW9uIHByZWZpeGl6ZShuYW1lKXtcclxuXHR2YXIgdU5hbWUgPSBuYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnNsaWNlKDEpO1xyXG5cdGlmIChmYWtlU3R5bGVbbmFtZV0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIG5hbWU7XHJcblx0aWYgKGZha2VTdHlsZVtwcmVmaXggKyB1TmFtZV0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByZWZpeCArIHVOYW1lO1xyXG5cdHJldHVybiAnJztcclxufVxyXG4iLCIvKiogSnVzdCBhIGZha2UgZWxlbWVudCB0byB0ZXN0IHN0eWxlc1xyXG4gKiBAbW9kdWxlIG11Y3NzL2Zha2UtZWxlbWVudFxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IiwiLyoqXHJcbiAqIFdpbmRvdyBzY3JvbGxiYXIgZGV0ZWN0b3IuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvaGFzLXNjcm9sbFxyXG4gKi9cclxuXHJcbi8vVE9ETzogZGV0ZWN0IGFueSBlbGVtZW50IHNjcm9sbCwgbm90IG9ubHkgdGhlIHdpbmRvd1xyXG5leHBvcnRzLnggPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCA+IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbn07XHJcbmV4cG9ydHMueSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gd2luZG93LmlubmVyV2lkdGggPiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbn07IiwiLyoqXHJcbiAqIERldGVjdCB3aGV0aGVyIGVsZW1lbnQgaXMgcGxhY2VkIHRvIGZpeGVkIGNvbnRhaW5lciBvciBpcyBmaXhlZCBpdHNlbGYuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvaXMtZml4ZWRcclxuICpcclxuICogQHBhcmFtIHsoRWxlbWVudHxPYmplY3QpfSBlbCBFbGVtZW50IHRvIGRldGVjdCBmaXhlZG5lc3MuXHJcbiAqXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgZWxlbWVudCBpcyBuZXN0ZWQuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbCkge1xyXG5cdHZhciBwYXJlbnRFbCA9IGVsO1xyXG5cclxuXHQvL3dpbmRvdyBpcyBmaXhlZCwgYnR3XHJcblx0aWYgKGVsID09PSB3aW5kb3cpIHJldHVybiB0cnVlO1xyXG5cclxuXHQvL3VubGlrZSB0aGUgZG9jXHJcblx0aWYgKGVsID09PSBkb2N1bWVudCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHR3aGlsZSAocGFyZW50RWwpIHtcclxuXHRcdGlmIChnZXRDb21wdXRlZFN0eWxlKHBhcmVudEVsKS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJykgcmV0dXJuIHRydWU7XHJcblx0XHRwYXJlbnRFbCA9IHBhcmVudEVsLm9mZnNldFBhcmVudDtcclxuXHR9XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59OyIsIi8qKlxyXG4gKiBHZXQgbWFyZ2lucyBvZiBhbiBlbGVtZW50LlxyXG4gKiBAbW9kdWxlIG11Y3NzL21hcmdpbnNcclxuICovXHJcblxyXG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlLXZhbHVlJyk7XHJcbnZhciBSZWN0ID0gcmVxdWlyZSgnLi9yZWN0Jyk7XHJcblxyXG4vKipcclxuICogUmV0dXJuIG1hcmdpbnMgb2YgYW4gZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtICAgIHtFbGVtZW50fSAgIGVsICAgQW4gZWxlbWVudCB3aGljaCB0byBjYWxjIG1hcmdpbnMuXHJcbiAqIEByZXR1cm4gICB7T2JqZWN0fSAgIFBhZGRpbmdzIG9iamVjdCBge3RvcDpuLCBib3R0b206biwgbGVmdDpuLCByaWdodDpufWAuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsKXtcclxuXHRpZiAoZWwgPT09IHdpbmRvdykgcmV0dXJuIFJlY3QoKTtcclxuXHJcblx0aWYgKCEoZWwgaW5zdGFuY2VvZiBFbGVtZW50KSkgdGhyb3cgRXJyb3IoJ0FyZ3VtZW50IGlzIG5vdCBhbiBlbGVtZW50Jyk7XHJcblxyXG5cdHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKTtcclxuXHJcblx0cmV0dXJuIFJlY3QoXHJcblx0XHRwYXJzZShzdHlsZS5tYXJnaW5MZWZ0KSxcclxuXHRcdHBhcnNlKHN0eWxlLm1hcmdpblRvcCksXHJcblx0XHRwYXJzZShzdHlsZS5tYXJnaW5SaWdodCksXHJcblx0XHRwYXJzZShzdHlsZS5tYXJnaW5Cb3R0b20pXHJcblx0KTtcclxufTtcclxuIiwiLyoqXHJcbiAqIENhbGN1bGF0ZSBhYnNvbHV0ZSBvZmZzZXRzIG9mIGFuIGVsZW1lbnQsIHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudC5cclxuICpcclxuICogQG1vZHVsZSBtdWNzcy9vZmZzZXRzXHJcbiAqXHJcbiAqL1xyXG52YXIgd2luID0gd2luZG93O1xyXG52YXIgZG9jID0gZG9jdW1lbnQ7XHJcbnZhciBSZWN0ID0gcmVxdWlyZSgnLi9yZWN0Jyk7XHJcbnZhciBoYXNTY3JvbGwgPSByZXF1aXJlKCcuL2hhcy1zY3JvbGwnKTtcclxudmFyIHNjcm9sbGJhciA9IHJlcXVpcmUoJy4vc2Nyb2xsYmFyJyk7XHJcbnZhciBpc0ZpeGVkRWwgPSByZXF1aXJlKCcuL2lzLWZpeGVkJyk7XHJcbnZhciBnZXRUcmFuc2xhdGUgPSByZXF1aXJlKCcuL3RyYW5zbGF0ZScpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYWJzb2x1dGUgb2Zmc2V0cyBvZiBhbnkgdGFyZ2V0IHBhc3NlZFxyXG4gKlxyXG4gKiBAcGFyYW0gICAge0VsZW1lbnR8d2luZG93fSAgIGVsICAgQSB0YXJnZXQuIFBhc3Mgd2luZG93IHRvIGNhbGN1bGF0ZSB2aWV3cG9ydCBvZmZzZXRzXHJcbiAqIEByZXR1cm4gICB7T2JqZWN0fSAgIE9mZnNldHMgb2JqZWN0IHdpdGggdHJibC5cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gb2Zmc2V0cztcclxuXHJcbmZ1bmN0aW9uIG9mZnNldHMgKGVsKSB7XHJcblx0aWYgKCFlbCkgdGhyb3cgRXJyb3IoJ0JhZCBhcmd1bWVudCcpO1xyXG5cclxuXHQvL2NhbGMgY2xpZW50IHJlY3RcclxuXHR2YXIgY1JlY3QsIHJlc3VsdDtcclxuXHJcblx0Ly9yZXR1cm4gdnAgb2Zmc2V0c1xyXG5cdGlmIChlbCA9PT0gd2luKSB7XHJcblx0XHRyZXN1bHQgPSBSZWN0KFxyXG5cdFx0XHR3aW4ucGFnZVhPZmZzZXQsXHJcblx0XHRcdHdpbi5wYWdlWU9mZnNldFxyXG5cdFx0KTtcclxuXHJcblx0XHRyZXN1bHQud2lkdGggPSB3aW4uaW5uZXJXaWR0aCAtIChoYXNTY3JvbGwueSgpID8gc2Nyb2xsYmFyIDogMCksXHJcblx0XHRyZXN1bHQuaGVpZ2h0ID0gd2luLmlubmVySGVpZ2h0IC0gKGhhc1Njcm9sbC54KCkgPyBzY3JvbGxiYXIgOiAwKVxyXG5cdFx0cmVzdWx0LnJpZ2h0ID0gcmVzdWx0LmxlZnQgKyByZXN1bHQud2lkdGg7XHJcblx0XHRyZXN1bHQuYm90dG9tID0gcmVzdWx0LnRvcCArIHJlc3VsdC5oZWlnaHQ7XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cdC8vcmV0dXJuIGFic29sdXRlIG9mZnNldHMgaWYgZG9jdW1lbnQgcmVxdWVzdGVkXHJcblx0ZWxzZSBpZiAoZWwgPT09IGRvYykge1xyXG5cdFx0dmFyIHJlcyA9IG9mZnNldHMoZG9jLmRvY3VtZW50RWxlbWVudCk7XHJcblx0XHRyZXMuYm90dG9tID0gTWF0aC5tYXgod2luZG93LmlubmVySGVpZ2h0LCByZXMuYm90dG9tKTtcclxuXHRcdHJlcy5yaWdodCA9IE1hdGgubWF4KHdpbmRvdy5pbm5lcldpZHRoLCByZXMucmlnaHQpO1xyXG5cdFx0aWYgKGhhc1Njcm9sbC55KGRvYy5kb2N1bWVudEVsZW1lbnQpKSByZXMucmlnaHQgLT0gc2Nyb2xsYmFyO1xyXG5cdFx0aWYgKGhhc1Njcm9sbC54KGRvYy5kb2N1bWVudEVsZW1lbnQpKSByZXMuYm90dG9tIC09IHNjcm9sbGJhcjtcclxuXHRcdHJldHVybiByZXM7XHJcblx0fVxyXG5cclxuXHQvL0ZJWE1FOiB3aHkgbm90IGV2ZXJ5IGVsZW1lbnQgaGFzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBtZXRob2Q/XHJcblx0dHJ5IHtcclxuXHRcdGNSZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0fSBjYXRjaCAoZSkge1xyXG5cdFx0Y1JlY3QgPSBSZWN0KFxyXG5cdFx0XHRlbC5jbGllbnRMZWZ0LFxyXG5cdFx0XHRlbC5jbGllbnRUb3BcclxuXHRcdCk7XHJcblx0fVxyXG5cclxuXHQvL3doZXRoZXIgZWxlbWVudCBpcyBvciBpcyBpbiBmaXhlZFxyXG5cdHZhciBpc0ZpeGVkID0gaXNGaXhlZEVsKGVsKTtcclxuXHR2YXIgeE9mZnNldCA9IGlzRml4ZWQgPyAwIDogd2luLnBhZ2VYT2Zmc2V0O1xyXG5cdHZhciB5T2Zmc2V0ID0gaXNGaXhlZCA/IDAgOiB3aW4ucGFnZVlPZmZzZXQ7XHJcblxyXG5cdHJlc3VsdCA9IFJlY3QoXHJcblx0XHRjUmVjdC5sZWZ0ICsgeE9mZnNldCxcclxuXHRcdGNSZWN0LnRvcCArIHlPZmZzZXQsXHJcblx0XHRjUmVjdC5sZWZ0ICsgeE9mZnNldCArIGVsLm9mZnNldFdpZHRoLFxyXG5cdFx0Y1JlY3QudG9wICsgeU9mZnNldCArIGVsLm9mZnNldEhlaWdodFxyXG5cdCk7XHJcblxyXG5cdHJldHVybiByZXN1bHQ7XHJcbn07IiwiLyoqXHJcbiAqIENhY2x1bGF0ZSBwYWRkaW5ncyBvZiBhbiBlbGVtZW50LlxyXG4gKiBAbW9kdWxlICBtdWNzcy9wYWRkaW5nc1xyXG4gKi9cclxuXHJcblxyXG52YXIgUmVjdCA9IHJlcXVpcmUoJy4vcmVjdCcpO1xyXG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlLXZhbHVlJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybiBwYWRkaW5ncyBvZiBhbiBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0gICAge0VsZW1lbnR9ICAgZWwgICBBbiBlbGVtZW50IHRvIGNhbGMgcGFkZGluZ3MuXHJcbiAqIEByZXR1cm4gICB7T2JqZWN0fSAgIFBhZGRpbmdzIG9iamVjdCBge3RvcDpuLCBib3R0b206biwgbGVmdDpuLCByaWdodDpufWAuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsKXtcclxuXHRpZiAoZWwgPT09IHdpbmRvdykgcmV0dXJuIFJlY3QoKTtcclxuXHJcblx0aWYgKCEoZWwgaW5zdGFuY2VvZiBFbGVtZW50KSkgdGhyb3cgRXJyb3IoJ0FyZ3VtZW50IGlzIG5vdCBhbiBlbGVtZW50Jyk7XHJcblxyXG5cdHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKTtcclxuXHJcblx0cmV0dXJuIFJlY3QoXHJcblx0XHRwYXJzZShzdHlsZS5wYWRkaW5nTGVmdCksXHJcblx0XHRwYXJzZShzdHlsZS5wYWRkaW5nVG9wKSxcclxuXHRcdHBhcnNlKHN0eWxlLnBhZGRpbmdSaWdodCksXHJcblx0XHRwYXJzZShzdHlsZS5wYWRkaW5nQm90dG9tKVxyXG5cdCk7XHJcbn07IiwiLyoqXHJcbiAqIFJldHVybnMgcGFyc2VkIGNzcyB2YWx1ZS5cclxuICpcclxuICogQG1vZHVsZSBtdWNzcy9wYXJzZS12YWx1ZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIEEgc3RyaW5nIGNvbnRhaW5pbmcgY3NzIHVuaXRzIHZhbHVlXHJcbiAqXHJcbiAqIEByZXR1cm4ge251bWJlcn0gUGFyc2VkIG51bWJlciB2YWx1ZVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyKXtcclxuXHRzdHIgKz0gJyc7XHJcblx0cmV0dXJuIHBhcnNlRmxvYXQoc3RyLnNsaWNlKDAsLTIpKSB8fCAwO1xyXG59O1xyXG5cclxuLy9GSVhNRTogYWRkIHBhcnNpbmcgdW5pdHMiLCIvKipcclxuICogVmVuZG9yIHByZWZpeGVzXHJcbiAqIE1ldGhvZCBvZiBodHRwOi8vZGF2aWR3YWxzaC5uYW1lL3ZlbmRvci1wcmVmaXhcclxuICogQG1vZHVsZSBtdWNzcy9wcmVmaXhcclxuICovXHJcblxyXG52YXIgc3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICcnKTtcclxuXHJcbnZhciBwcmUgPSAoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoc3R5bGVzKVxyXG5cdC5qb2luKCcnKVxyXG5cdC5tYXRjaCgvLShtb3p8d2Via2l0fG1zKS0vKSB8fCAoc3R5bGVzLk9MaW5rID09PSAnJyAmJiBbJycsICdvJ10pXHJcbilbMV07XHJcblxyXG52YXIgZG9tID0gKCdXZWJLaXR8TW96fE1TfE8nKS5tYXRjaChuZXcgUmVnRXhwKCcoJyArIHByZSArICcpJywgJ2knKSlbMV07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRkb206IGRvbSxcclxuXHRsb3dlcmNhc2U6IHByZSxcclxuXHRjc3M6ICctJyArIHByZSArICctJyxcclxuXHRqczogcHJlWzBdLnRvVXBwZXJDYXNlKCkgKyBwcmUuc3Vic3RyKDEpXHJcbn07IiwiLyoqXHJcbiAqIFNpbXBsZSByZWN0IGNvbnN0cnVjdG9yLlxyXG4gKiBJdCBpcyBqdXN0IGZhc3RlciBhbmQgc21hbGxlciB0aGFuIGNvbnN0cnVjdGluZyBhbiBvYmplY3QuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvcmVjdFxyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcn0gbCBsZWZ0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB0IHRvcFxyXG4gKiBAcGFyYW0ge251bWJlcn0gciByaWdodFxyXG4gKiBAcGFyYW0ge251bWJlcn0gYiBib3R0b21cclxuICpcclxuICogQHJldHVybiB7UmVjdH0gQSByZWN0YW5nbGUgb2JqZWN0XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFJlY3QgKGwsdCxyLGIpIHtcclxuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVjdCkpIHJldHVybiBuZXcgUmVjdChsLHQscixiKTtcclxuXHJcblx0dGhpcy5sZWZ0PWx8fDA7XHJcblx0dGhpcy50b3A9dHx8MDtcclxuXHR0aGlzLnJpZ2h0PXJ8fDA7XHJcblx0dGhpcy5ib3R0b209Ynx8MDtcclxuXHR0aGlzLndpZHRoPU1hdGguYWJzKHRoaXMucmlnaHQgLSB0aGlzLmxlZnQpO1xyXG5cdHRoaXMuaGVpZ2h0PU1hdGguYWJzKHRoaXMuYm90dG9tIC0gdGhpcy50b3ApO1xyXG59OyIsIi8qKlxyXG4gKiBDYWxjdWxhdGUgc2Nyb2xsYmFyIHdpZHRoLlxyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL3Njcm9sbGJhclxyXG4gKi9cclxuXHJcbi8vIENyZWF0ZSB0aGUgbWVhc3VyZW1lbnQgbm9kZVxyXG52YXIgc2Nyb2xsRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHJcbnZhciBzdHlsZSA9IHNjcm9sbERpdi5zdHlsZTtcclxuXHJcbnN0eWxlLndpZHRoID0gJzEwMHB4Jztcclxuc3R5bGUuaGVpZ2h0ID0gJzEwMHB4Jztcclxuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcclxuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG5zdHlsZS50b3AgPSAnLTk5OTlweCc7XHJcblxyXG5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoc2Nyb2xsRGl2KTtcclxuXHJcbi8vIHRoZSBzY3JvbGxiYXIgd2lkdGhcclxubW9kdWxlLmV4cG9ydHMgPSBzY3JvbGxEaXYub2Zmc2V0V2lkdGggLSBzY3JvbGxEaXYuY2xpZW50V2lkdGg7XHJcblxyXG4vLyBEZWxldGUgZmFrZSBESVZcclxuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlbW92ZUNoaWxkKHNjcm9sbERpdik7IiwiLyoqXHJcbiAqIEVuYWJsZS9kaXNhYmxlIHNlbGVjdGFiaWxpdHkgb2YgYW4gZWxlbWVudFxyXG4gKiBAbW9kdWxlIG11Y3NzL3NlbGVjdGlvblxyXG4gKi9cclxudmFyIGNzcyA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIERpc2FibGUgb3IgRW5hYmxlIGFueSBzZWxlY3Rpb24gcG9zc2liaWxpdGllcyBmb3IgYW4gZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtICAgIHtFbGVtZW50fSAgIGVsICAgVGFyZ2V0IHRvIG1ha2UgdW5zZWxlY3RhYmxlLlxyXG4gKi9cclxuZXhwb3J0cy5kaXNhYmxlID0gZnVuY3Rpb24oZWwpe1xyXG5cdGNzcyhlbCwge1xyXG5cdFx0J3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG5cdFx0J3VzZXItZHJhZyc6ICdub25lJyxcclxuXHRcdCd0b3VjaC1jYWxsb3V0JzogJ25vbmUnXHJcblx0fSk7XHJcblx0ZWwuc2V0QXR0cmlidXRlKCd1bnNlbGVjdGFibGUnLCAnb24nKTtcclxuXHRlbC5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIHBkKTtcclxufTtcclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbihlbCl7XHJcblx0Y3NzKGVsLCB7XHJcblx0XHQndXNlci1zZWxlY3QnOiBudWxsLFxyXG5cdFx0J3VzZXItZHJhZyc6IG51bGwsXHJcblx0XHQndG91Y2gtY2FsbG91dCc6IG51bGxcclxuXHR9KTtcclxuXHRlbC5yZW1vdmVBdHRyaWJ1dGUoJ3Vuc2VsZWN0YWJsZScpO1xyXG5cdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgcGQpO1xyXG59O1xyXG5cclxuXHJcbi8qKiBQcmV2ZW50IHlvdSBrbm93IHdoYXQuICovXHJcbmZ1bmN0aW9uIHBkKGUpe1xyXG5cdGUucHJldmVudERlZmF1bHQoKTtcclxufSIsIi8qKlxyXG4gKiBQYXJzZSB0cmFuc2xhdGUzZFxyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL3RyYW5zbGF0ZVxyXG4gKi9cclxuXHJcbnZhciBjc3MgPSByZXF1aXJlKCcuL2NzcycpO1xyXG52YXIgcGFyc2VWYWx1ZSA9IHJlcXVpcmUoJy4vcGFyc2UtdmFsdWUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsKSB7XHJcblx0dmFyIHRyYW5zbGF0ZVN0ciA9IGNzcyhlbCwgJ3RyYW5zZm9ybScpO1xyXG5cclxuXHQvL2ZpbmQgdHJhbnNsYXRlIHRva2VuLCByZXRyaWV2ZSBjb21tYS1lbmNsb3NlZCB2YWx1ZXNcclxuXHQvL3RyYW5zbGF0ZTNkKDFweCwgMnB4LCAyKSDihpIgMXB4LCAycHgsIDJcclxuXHQvL0ZJWE1FOiBoYW5kbGUgbmVzdGVkIGNhbGNzXHJcblx0dmFyIG1hdGNoID0gL3RyYW5zbGF0ZSg/OjNkKT9cXHMqXFwoKFteXFwpXSopXFwpLy5leGVjKHRyYW5zbGF0ZVN0cik7XHJcblxyXG5cdGlmICghbWF0Y2gpIHJldHVybiBbMCwgMF07XHJcblx0dmFyIHZhbHVlcyA9IG1hdGNoWzFdLnNwbGl0KC9cXHMqLFxccyovKTtcclxuXHJcblx0Ly9wYXJzZSB2YWx1ZXNcclxuXHQvL0ZJWE1FOiBuZXN0ZWQgdmFsdWVzIGFyZSBub3QgbmVjZXNzYXJpbHkgcGl4ZWxzXHJcblx0cmV0dXJuIHZhbHVlcy5tYXAoZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRyZXR1cm4gcGFyc2VWYWx1ZSh2YWx1ZSk7XHJcblx0fSk7XHJcbn07IiwiLyoqXHJcbiAqIENsYW1wZXIuXHJcbiAqIERldGVjdHMgcHJvcGVyIGNsYW1wIG1pbi9tYXguXHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBhIEN1cnJlbnQgdmFsdWUgdG8gY3V0IG9mZlxyXG4gKiBAcGFyYW0ge251bWJlcn0gbWluIE9uZSBzaWRlIGxpbWl0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXggT3RoZXIgc2lkZSBsaW1pdFxyXG4gKlxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IENsYW1wZWQgdmFsdWVcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd3JhcCcpKGZ1bmN0aW9uKGEsIG1pbiwgbWF4KXtcclxuXHRyZXR1cm4gbWF4ID4gbWluID8gTWF0aC5tYXgoTWF0aC5taW4oYSxtYXgpLG1pbikgOiBNYXRoLm1heChNYXRoLm1pbihhLG1pbiksbWF4KTtcclxufSk7IiwiLyoqXHJcbiAqIEBtb2R1bGUgIG11bWF0aC9sb29wXHJcbiAqXHJcbiAqIExvb3BpbmcgZnVuY3Rpb24gZm9yIGFueSBmcmFtZXNpemVcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd3JhcCcpKGZ1bmN0aW9uICh2YWx1ZSwgbGVmdCwgcmlnaHQpIHtcclxuXHQvL2RldGVjdCBzaW5nbGUtYXJnIGNhc2UsIGxpa2UgbW9kLWxvb3BcclxuXHRpZiAocmlnaHQgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0cmlnaHQgPSBsZWZ0O1xyXG5cdFx0bGVmdCA9IDA7XHJcblx0fVxyXG5cclxuXHQvL3N3YXAgZnJhbWUgb3JkZXJcclxuXHRpZiAobGVmdCA+IHJpZ2h0KSB7XHJcblx0XHR2YXIgdG1wID0gcmlnaHQ7XHJcblx0XHRyaWdodCA9IGxlZnQ7XHJcblx0XHRsZWZ0ID0gdG1wO1xyXG5cdH1cclxuXHJcblx0dmFyIGZyYW1lID0gcmlnaHQgLSBsZWZ0O1xyXG5cclxuXHR2YWx1ZSA9ICgodmFsdWUgKyBsZWZ0KSAlIGZyYW1lKSAtIGxlZnQ7XHJcblx0aWYgKHZhbHVlIDwgbGVmdCkgdmFsdWUgKz0gZnJhbWU7XHJcblx0aWYgKHZhbHVlID4gcmlnaHQpIHZhbHVlIC09IGZyYW1lO1xyXG5cclxuXHRyZXR1cm4gdmFsdWU7XHJcbn0pOyIsIi8qKlxyXG4gKiBAbW9kdWxlICBtdW1hdGgvcHJlY2lzaW9uXHJcbiAqXHJcbiAqIEdldCBwcmVjaXNpb24gZnJvbSBmbG9hdDpcclxuICpcclxuICogQGV4YW1wbGVcclxuICogMS4xIOKGkiAxLCAxMjM0IOKGkiAwLCAuMTIzNCDihpIgNFxyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcn0gblxyXG4gKlxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IGRlY2ltYXAgcGxhY2VzXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbihuKXtcclxuXHR2YXIgcyA9IG4gKyAnJyxcclxuXHRcdGQgPSBzLmluZGV4T2YoJy4nKSArIDE7XHJcblxyXG5cdHJldHVybiAhZCA/IDAgOiBzLmxlbmd0aCAtIGQ7XHJcbn0pOyIsIi8qKlxyXG4gKiBQcmVjaXNpb24gcm91bmRcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGVwIE1pbmltYWwgZGlzY3JldGUgdG8gcm91bmRcclxuICpcclxuICogQHJldHVybiB7bnVtYmVyfVxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB0b1ByZWNpc2lvbigyMTMuMzQsIDEpID09IDIxM1xyXG4gKiB0b1ByZWNpc2lvbigyMTMuMzQsIC4xKSA9PSAyMTMuM1xyXG4gKiB0b1ByZWNpc2lvbigyMTMuMzQsIDEwKSA9PSAyMTBcclxuICovXHJcbnZhciBwcmVjaXNpb24gPSByZXF1aXJlKCcuL3ByZWNpc2lvbicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbih2YWx1ZSwgc3RlcCkge1xyXG5cdGlmIChzdGVwID09PSAwKSByZXR1cm4gdmFsdWU7XHJcblx0aWYgKCFzdGVwKSByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSk7XHJcblx0c3RlcCA9IHBhcnNlRmxvYXQoc3RlcCk7XHJcblx0dmFsdWUgPSBNYXRoLnJvdW5kKHZhbHVlIC8gc3RlcCkgKiBzdGVwO1xyXG5cdHJldHVybiBwYXJzZUZsb2F0KHZhbHVlLnRvRml4ZWQocHJlY2lzaW9uKHN0ZXApKSk7XHJcbn0pOyIsIi8qKlxyXG4gKiBHZXQgZm4gd3JhcHBlZCB3aXRoIGFycmF5L29iamVjdCBhdHRycyByZWNvZ25pdGlvblxyXG4gKlxyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGFyZ2V0IGZ1bmN0aW9uXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGZuKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24oYSl7XHJcblx0XHR2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuXHRcdGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuXHRcdFx0dmFyIHJlc3VsdCA9IG5ldyBBcnJheShhLmxlbmd0aCksIHNsaWNlO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspe1xyXG5cdFx0XHRcdHNsaWNlID0gW107XHJcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGwgPSBhcmdzLmxlbmd0aCwgdmFsOyBqIDwgbDsgaisrKXtcclxuXHRcdFx0XHRcdHZhbCA9IGFyZ3Nbal0gaW5zdGFuY2VvZiBBcnJheSA/IGFyZ3Nbal1baV0gOiBhcmdzW2pdO1xyXG5cdFx0XHRcdFx0dmFsID0gdmFsO1xyXG5cdFx0XHRcdFx0c2xpY2UucHVzaCh2YWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXN1bHRbaV0gPSBmbi5hcHBseSh0aGlzLCBzbGljZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHR5cGVvZiBhID09PSAnb2JqZWN0Jykge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0ge30sIHNsaWNlO1xyXG5cdFx0XHRmb3IgKHZhciBpIGluIGEpe1xyXG5cdFx0XHRcdHNsaWNlID0gW107XHJcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGwgPSBhcmdzLmxlbmd0aCwgdmFsOyBqIDwgbDsgaisrKXtcclxuXHRcdFx0XHRcdHZhbCA9IHR5cGVvZiBhcmdzW2pdID09PSAnb2JqZWN0JyA/IGFyZ3Nbal1baV0gOiBhcmdzW2pdO1xyXG5cdFx0XHRcdFx0dmFsID0gdmFsO1xyXG5cdFx0XHRcdFx0c2xpY2UucHVzaCh2YWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXN1bHRbaV0gPSBmbi5hcHBseSh0aGlzLCBzbGljZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncyk7XHJcblx0XHR9XHJcblx0fTtcclxufTsiLCIvL3NwZWVkeSBpbXBsZW1lbnRhdGlvbiBvZiBgaW5gXHJcbi8vTk9URTogYCF0YXJnZXRbcHJvcE5hbWVdYCAyLTMgb3JkZXJzIGZhc3RlciB0aGFuIGAhKHByb3BOYW1lIGluIHRhcmdldClgXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYSwgYil7XHJcblx0aWYgKCFhKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdC8vTk9URTogdGhpcyBjYXVzZXMgZ2V0dGVyIGZpcmVcclxuXHRpZiAoYVtiXSkgcmV0dXJuIHRydWU7XHJcblxyXG5cdC8vRklYTUU6IHdoeSBpbiBpcyBiZXR0ZXIgdGhhbiBoYXNPd25Qcm9wZXJ0eT8gU29tZXRoaW5nIHdpdGggcHJvdG90eXBlcy4gU2hvdyBhIGNhc2UuXHJcblx0cmV0dXJuIGIgaW4gYTtcclxuXHQvLyByZXR1cm4gYS5oYXNPd25Qcm9wZXJ0eShiKTtcclxufVxyXG4iLCIvKipcclxuKiBUcml2aWFsIHR5cGVzIGNoZWNrZXJzLlxyXG4qIEJlY2F1c2UgdGhlcmXigJlyZSBubyBjb21tb24gbGliIGZvciB0aGF0ICggbG9kYXNoXyBpcyBhIGZhdGd1eSlcclxuKi9cclxuLy9UT0RPOiBtYWtlIG1haW4gdXNlIGFzIGBpcy5hcnJheSh0YXJnZXQpYFxyXG4vL1RPRE86IHNlcGFyYXRlIGJ5IGxpYnMsIGluY2x1ZGVkIHBlci1maWxlXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRoYXM6IHJlcXVpcmUoJy4vaGFzJyksXHJcblx0aXNPYmplY3Q6IHJlcXVpcmUoJy4vaXMtb2JqZWN0JyksXHJcblx0aXNGbjogcmVxdWlyZSgnLi9pcy1mbicpLFxyXG5cdGlzU3RyaW5nOiByZXF1aXJlKCcuL2lzLXN0cmluZycpLFxyXG5cdGlzTnVtYmVyOiByZXF1aXJlKCcuL2lzLW51bWJlcicpLFxyXG5cdGlzQm9vbGVhbjogcmVxdWlyZSgnLi9pcy1ib29sJyksXHJcblx0aXNQbGFpbjogcmVxdWlyZSgnLi9pcy1wbGFpbicpLFxyXG5cdGlzQXJyYXk6IHJlcXVpcmUoJy4vaXMtYXJyYXknKSxcclxuXHRpc0FycmF5TGlrZTogcmVxdWlyZSgnLi9pcy1hcnJheS1saWtlJyksXHJcblx0aXNFbGVtZW50OiByZXF1aXJlKCcuL2lzLWVsZW1lbnQnKSxcclxuXHRpc1ByaXZhdGVOYW1lOiByZXF1aXJlKCcuL2lzLXByaXZhdGUtbmFtZScpLFxyXG5cdGlzUmVnRXhwOiByZXF1aXJlKCcuL2lzLXJlZ2V4JyksXHJcblx0aXNFbXB0eTogcmVxdWlyZSgnLi9pcy1lbXB0eScpXHJcbn07XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJy4vaXMtc3RyaW5nJyk7XHJcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnLi9pcy1hcnJheScpO1xyXG52YXIgaXNGbiA9IHJlcXVpcmUoJy4vaXMtZm4nKTtcclxuXHJcbi8vRklYTUU6IGFkZCB0ZXN0cyBmcm9tIGh0dHA6Ly9qc2ZpZGRsZS5uZXQva3U5TFMvMS9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYSl7XHJcblx0cmV0dXJuIGlzQXJyYXkoYSkgfHwgKGEgJiYgIWlzU3RyaW5nKGEpICYmICFhLm5vZGVUeXBlICYmICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gYSAhPSB3aW5kb3cgOiB0cnVlKSAmJiAhaXNGbihhKSAmJiB0eXBlb2YgYS5sZW5ndGggPT09ICdudW1iZXInKTtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYSl7XHJcblx0cmV0dXJuIGEgaW5zdGFuY2VvZiBBcnJheTtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYSl7XHJcblx0cmV0dXJuIHR5cGVvZiBhID09PSAnYm9vbGVhbicgfHwgYSBpbnN0YW5jZW9mIEJvb2xlYW47XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRhcmdldCl7XHJcblx0cmV0dXJuIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQ7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhKXtcclxuXHRpZiAoIWEpIHJldHVybiB0cnVlO1xyXG5cdGZvciAodmFyIGsgaW4gYSkge1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHRyZXR1cm4gdHJ1ZTtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGFyZ2V0KXtcclxuXHRyZXR1cm4gdHlwZW9mIEV2ZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0YXJnZXQgaW5zdGFuY2VvZiBFdmVudDtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEpe1xyXG5cdHJldHVybiAhIShhICYmIGEuYXBwbHkpO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQpe1xyXG5cdHJldHVybiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHRhcmdldCBpbnN0YW5jZW9mIE5vZGU7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhKXtcclxuXHRyZXR1cm4gdHlwZW9mIGEgPT09ICdudW1iZXInIHx8IGEgaW5zdGFuY2VvZiBOdW1iZXI7XHJcbn0iLCIvKipcclxuICogQG1vZHVsZSBtdXR5cGUvaXMtb2JqZWN0XHJcbiAqL1xyXG5cclxuLy9UT0RPOiBhZGQgc3Q4IHRlc3RzXHJcblxyXG4vL2lzUGxhaW5PYmplY3QgaW5kZWVkXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obyl7XHJcblx0Ly8gcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XHJcblx0cmV0dXJuICEhbyAmJiB0eXBlb2YgbyA9PT0gJ29iamVjdCcgJiYgby5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0O1xyXG59O1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCcuL2lzLXN0cmluZycpLFxyXG5cdGlzTnVtYmVyID0gcmVxdWlyZSgnLi9pcy1udW1iZXInKSxcclxuXHRpc0Jvb2wgPSByZXF1aXJlKCcuL2lzLWJvb2wnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNQbGFpbihhKXtcclxuXHRyZXR1cm4gIWEgfHwgaXNTdHJpbmcoYSkgfHwgaXNOdW1iZXIoYSkgfHwgaXNCb29sKGEpO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obil7XHJcblx0cmV0dXJuIG5bMF0gPT09ICdfJyAmJiBuLmxlbmd0aCA+IDE7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQpe1xyXG5cdHJldHVybiB0YXJnZXQgaW5zdGFuY2VvZiBSZWdFeHA7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEpe1xyXG5cdHJldHVybiB0eXBlb2YgYSA9PT0gJ3N0cmluZycgfHwgYSBpbnN0YW5jZW9mIFN0cmluZztcclxufSIsIi8qKlxyXG4gKiBAbW9kdWxlIHBhcmVudGhlc2lzXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRwYXJzZTogcmVxdWlyZSgnLi9wYXJzZScpLFxyXG5cdHN0cmluZ2lmeTogcmVxdWlyZSgnLi9zdHJpbmdpZnknKVxyXG59OyIsIi8qKlxyXG4gKiBAbW9kdWxlICBwYXJlbnRoZXNpcy9wYXJzZVxyXG4gKlxyXG4gKiBQYXJzZSBhIHN0cmluZyB3aXRoIHBhcmVudGhlc2lzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIEEgc3RyaW5nIHdpdGggcGFyZW50aGVzaXNcclxuICpcclxuICogQHJldHVybiB7QXJyYXl9IEEgbGlzdCB3aXRoIHBhcnNlZCBwYXJlbnMsIHdoZXJlIDAgaXMgaW5pdGlhbCBzdHJpbmcuXHJcbiAqL1xyXG5cclxuLy9UT0RPOiBpbXBsZW1lbnQgc2VxdWVudGlhbCBwYXJzZXIgb2YgdGhpcyBhbGdvcml0aG0sIGNvbXBhcmUgcGVyZm9ybWFuY2UuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyLCBicmFja2V0KXtcclxuXHQvL3ByZXRlbmQgbm9uLXN0cmluZyBwYXJzZWQgcGVyLXNlXHJcblx0aWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gW3N0cl07XHJcblxyXG5cdHZhciByZXMgPSBbXSwgcHJldlN0cjtcclxuXHJcblx0YnJhY2tldCA9IGJyYWNrZXQgfHwgJygpJztcclxuXHJcblx0Ly9jcmVhdGUgcGFyZW50aGVzaXMgcmVnZXhcclxuXHR2YXIgcFJFID0gbmV3IFJlZ0V4cChbJ1xcXFwnLCBicmFja2V0WzBdLCAnW15cXFxcJywgYnJhY2tldFswXSwgJ1xcXFwnLCBicmFja2V0WzFdLCAnXSpcXFxcJywgYnJhY2tldFsxXV0uam9pbignJykpO1xyXG5cclxuXHRmdW5jdGlvbiByZXBsYWNlVG9rZW4odG9rZW4sIGlkeCwgc3RyKXtcclxuXHRcdC8vc2F2ZSB0b2tlbiB0byByZXNcclxuXHRcdHZhciByZWZJZCA9IHJlcy5wdXNoKHRva2VuLnNsaWNlKDEsLTEpKTtcclxuXHJcblx0XHRyZXR1cm4gJ1xcXFwnICsgcmVmSWQ7XHJcblx0fVxyXG5cclxuXHQvL3JlcGxhY2UgcGFyZW4gdG9rZW5zIHRpbGwgdGhlcmXigJlzIG5vbmVcclxuXHR3aGlsZSAoc3RyICE9IHByZXZTdHIpIHtcclxuXHRcdHByZXZTdHIgPSBzdHI7XHJcblx0XHRzdHIgPSBzdHIucmVwbGFjZShwUkUsIHJlcGxhY2VUb2tlbik7XHJcblx0fVxyXG5cclxuXHQvL3NhdmUgcmVzdWx0aW5nIHN0clxyXG5cdHJlcy51bnNoaWZ0KHN0cik7XHJcblxyXG5cdHJldHVybiByZXM7XHJcbn07IiwiLyoqXHJcbiAqIEBtb2R1bGUgcGFyZW50aGVzaXMvc3RyaW5naWZ5XHJcbiAqXHJcbiAqIFN0cmluZ2lmeSBhbiBhcnJheS9vYmplY3Qgd2l0aCBwYXJlbnRoZXNpcyByZWZlcmVuY2VzXHJcbiAqXHJcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBhcnIgQW4gYXJyYXkgb3Igb2JqZWN0IHdoZXJlIDAgaXMgaW5pdGlhbCBzdHJpbmdcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgZXZlcnkgb3RoZXIga2V5L3ZhbHVlIGlzIHJlZmVyZW5jZSBpZC92YWx1ZSB0byByZXBsYWNlXHJcbiAqXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gQSBzdHJpbmcgd2l0aCBpbnNlcnRlZCByZWdleCByZWZlcmVuY2VzXHJcbiAqL1xyXG5cclxuLy9GSVhNRTogY2lyY3VsYXIgcmVmZXJlbmNlcyBjYXVzZXMgcmVjdXJzaW9ucyBoZXJlXHJcbi8vVE9ETzogdGhlcmXigJlzIHBvc3NpYmxlIGEgcmVjdXJzaXZlIHZlcnNpb24gb2YgdGhpcyBhbGdvcml0aG0sIHNvIHRlc3QgaXQgJiBjb21wYXJlXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0ciwgcmVmcywgYnJhY2tldCl7XHJcblx0dmFyIHByZXZTdHI7XHJcblxyXG5cdC8vcHJldGVuZCBiYWQgc3RyaW5nIHN0cmluZ2lmaWVkIHdpdGggbm8gcGFyZW50aGVzZXNcclxuXHRpZiAoIXN0cikgcmV0dXJuICcnO1xyXG5cclxuXHRpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcclxuXHRcdGJyYWNrZXQgPSByZWZzO1xyXG5cdFx0cmVmcyA9IHN0cjtcclxuXHRcdHN0ciA9IHJlZnNbMF07XHJcblx0fVxyXG5cclxuXHRicmFja2V0ID0gYnJhY2tldCB8fCAnKCknO1xyXG5cclxuXHRmdW5jdGlvbiByZXBsYWNlUmVmKHRva2VuLCBpZHgsIHN0cil7XHJcblx0XHRyZXR1cm4gYnJhY2tldFswXSArIHJlZnNbdG9rZW4uc2xpY2UoMSldICsgYnJhY2tldFsxXTtcclxuXHR9XHJcblxyXG5cdHdoaWxlIChzdHIgIT0gcHJldlN0cikge1xyXG5cdFx0cHJldlN0ciA9IHN0cjtcclxuXHRcdHN0ciA9IHN0ci5yZXBsYWNlKC9cXFxcWzAtOV0rLywgcmVwbGFjZVJlZik7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gc3RyO1xyXG59OyIsIi8qKlxyXG4gKiBAbW9kdWxlICBxdWVyaWVkXHJcbiAqL1xyXG5cclxuXHJcbnZhciBkb2MgPSByZXF1aXJlKCdnZXQtZG9jJyk7XHJcbnZhciBxID0gcmVxdWlyZSgnLi9saWIvJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIERldGVjdCB1bnN1cHBvcnRlZCBjc3M0IGZlYXR1cmVzLCBwb2x5ZmlsbCB0aGVtXHJcbiAqL1xyXG5cclxuLy9kZXRlY3QgYDpzY29wZWBcclxudHJ5IHtcclxuXHRkb2MucXVlcnlTZWxlY3RvcignOnNjb3BlJyk7XHJcbn1cclxuY2F0Y2ggKGUpIHtcclxuXHRxLnJlZ2lzdGVyRmlsdGVyKCdzY29wZScsIHJlcXVpcmUoJy4vbGliL3BzZXVkb3Mvc2NvcGUnKSk7XHJcbn1cclxuXHJcblxyXG4vL2RldGVjdCBgOmhhc2BcclxudHJ5IHtcclxuXHRkb2MucXVlcnlTZWxlY3RvcignOmhhcycpO1xyXG59XHJcbmNhdGNoIChlKSB7XHJcblx0cS5yZWdpc3RlckZpbHRlcignaGFzJywgcmVxdWlyZSgnLi9saWIvcHNldWRvcy9oYXMnKSk7XHJcblxyXG5cdC8vcG9seWZpbGxlZCA6aGFzIHJlcXVpcmVzIGFydGlmaWNpYWwgOm5vdCB0byBtYWtlIGA6bm90KDpoYXMoLi4uKSlgLlxyXG5cdHEucmVnaXN0ZXJGaWx0ZXIoJ25vdCcsIHJlcXVpcmUoJy4vbGliL3BzZXVkb3Mvbm90JykpO1xyXG59XHJcblxyXG5cclxuLy9kZXRlY3QgYDpyb290YFxyXG50cnkge1xyXG5cdGRvYy5xdWVyeVNlbGVjdG9yKCc6cm9vdCcpO1xyXG59XHJcbmNhdGNoIChlKSB7XHJcblx0cS5yZWdpc3RlckZpbHRlcigncm9vdCcsIHJlcXVpcmUoJy4vbGliL3BzZXVkb3Mvcm9vdCcpKTtcclxufVxyXG5cclxuXHJcbi8vZGV0ZWN0IGA6bWF0Y2hlc2BcclxudHJ5IHtcclxuXHRkb2MucXVlcnlTZWxlY3RvcignOm1hdGNoZXMnKTtcclxufVxyXG5jYXRjaCAoZSkge1xyXG5cdHEucmVnaXN0ZXJGaWx0ZXIoJ21hdGNoZXMnLCByZXF1aXJlKCcuL2xpYi9wc2V1ZG9zL21hdGNoZXMnKSk7XHJcbn1cclxuXHJcblxyXG4vKiogSGVscGVyIG1ldGhvZHMgKi9cclxucS5tYXRjaGVzID0gcmVxdWlyZSgnLi9saWIvcHNldWRvcy9tYXRjaGVzJyk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBxOyIsIi8qKlxyXG4gKiBAbW9kdWxlIHF1ZXJpZWQvbGliL2luZGV4XHJcbiAqL1xyXG5cclxuXHJcbnZhciBzbGljZSA9IHJlcXVpcmUoJ3NsaWNlZCcpO1xyXG52YXIgdW5pcXVlID0gcmVxdWlyZSgnYXJyYXktdW5pcXVlJyk7XHJcbnZhciBnZXRVaWQgPSByZXF1aXJlKCdnZXQtdWlkJyk7XHJcbnZhciBwYXJlbiA9IHJlcXVpcmUoJ3BhcmVudGhlc2lzJyk7XHJcbnZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ211dHlwZS9pcy1zdHJpbmcnKTtcclxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdtdXR5cGUvaXMtYXJyYXknKTtcclxudmFyIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnbXV0eXBlL2lzLWFycmF5LWxpa2UnKTtcclxudmFyIGFycmF5aWZ5ID0gcmVxdWlyZSgnYXJyYXlpZnktY29tcGFjdCcpO1xyXG52YXIgZG9jID0gcmVxdWlyZSgnZ2V0LWRvYycpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBRdWVyeSB3cmFwcGVyIC0gbWFpbiBtZXRob2QgdG8gcXVlcnkgZWxlbWVudHMuXHJcbiAqL1xyXG5mdW5jdGlvbiBxdWVyeU11bHRpcGxlKHNlbGVjdG9yLCBlbCkge1xyXG5cdC8vaWdub3JlIGJhZCBzZWxlY3RvclxyXG5cdGlmICghc2VsZWN0b3IpIHJldHVybiBbXTtcclxuXHJcblx0Ly9yZXR1cm4gZWxlbWVudHMgcGFzc2VkIGFzIGEgc2VsZWN0b3IgdW5jaGFuZ2VkIChjb3ZlciBwYXJhbXMgY2FzZSlcclxuXHRpZiAoIWlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG5cdFx0aWYgKGlzQXJyYXkoc2VsZWN0b3IpKSB7XHJcblx0XHRcdHJldHVybiB1bmlxdWUoYXJyYXlpZnkoc2VsZWN0b3IubWFwKGZ1bmN0aW9uIChzZWwpIHtcclxuXHRcdFx0XHRyZXR1cm4gcXVlcnlNdWx0aXBsZShzZWwsIGVsKTtcclxuXHRcdFx0fSkpKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBbc2VsZWN0b3JdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly9jYXRjaCBwb2x5ZmlsbGFibGUgZmlyc3QgYDpzY29wZWAgc2VsZWN0b3IgLSBqdXN0IGVyYXNlIGl0LCB3b3JrcyBqdXN0IGZpbmVcclxuXHRpZiAocHNldWRvcy5zY29wZSkge1xyXG5cdFx0c2VsZWN0b3IgPSBzZWxlY3Rvci5yZXBsYWNlKC9eXFxzKjpzY29wZS8sICcnKTtcclxuXHR9XHJcblxyXG5cdC8vaWdub3JlIG5vbi1xdWVyeWFibGUgY29udGFpbmVyc1xyXG5cdGlmICghZWwpIHtcclxuXHRcdGVsID0gW3F1ZXJ5U2luZ2xlLmRvY3VtZW50XTtcclxuXHR9XHJcblxyXG5cdC8vdHJlYXQgcGFzc2VkIGxpc3RcclxuXHRlbHNlIGlmIChpc0FycmF5TGlrZShlbCkpIHtcclxuXHRcdGVsID0gYXJyYXlpZnkoZWwpO1xyXG5cdH1cclxuXHJcblx0Ly9pZiBlbGVtZW50IGlzbuKAmXQgYSBub2RlIC0gbWFrZSBpdCBxLmRvY3VtZW50XHJcblx0ZWxzZSBpZiAoIWVsLnF1ZXJ5U2VsZWN0b3IpIHtcclxuXHRcdGVsID0gW3F1ZXJ5U2luZ2xlLmRvY3VtZW50XTtcclxuXHR9XHJcblxyXG5cdC8vbWFrZSBhbnkgb2sgZWxlbWVudCBhIGxpc3RcclxuXHRlbHNlIHtcclxuXHRcdGVsID0gW2VsXTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBxUHNldWRvcyhlbCwgc2VsZWN0b3IpO1xyXG59XHJcblxyXG5cclxuLyoqIFF1ZXJ5IHNpbmdsZSBlbGVtZW50IC0gbm8gd2F5IGJldHRlciB0aGFuIHJldHVybiBmaXJzdCBvZiBtdWx0aXBsZSBzZWxlY3RvciAqL1xyXG5mdW5jdGlvbiBxdWVyeVNpbmdsZShzZWxlY3RvciwgZWwpe1xyXG5cdHJldHVybiBxdWVyeU11bHRpcGxlKHNlbGVjdG9yLCBlbClbMF07XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJuIHF1ZXJ5IHJlc3VsdCBiYXNlZCBvZmYgdGFyZ2V0IGxpc3QuXHJcbiAqIFBhcnNlIGFuZCBhcHBseSBwb2x5ZmlsbGVkIHBzZXVkb3NcclxuICovXHJcbmZ1bmN0aW9uIHFQc2V1ZG9zKGxpc3QsIHNlbGVjdG9yKSB7XHJcblx0Ly9pZ25vcmUgZW1wdHkgc2VsZWN0b3JcclxuXHRzZWxlY3RvciA9IHNlbGVjdG9yLnRyaW0oKTtcclxuXHRpZiAoIXNlbGVjdG9yKSByZXR1cm4gbGlzdDtcclxuXHJcblx0Ly8gY29uc29sZS5ncm91cChzZWxlY3Rvcik7XHJcblxyXG5cdC8vc2NvcGlmeSBpbW1lZGlhdGUgY2hpbGRyZW4gc2VsZWN0b3JcclxuXHRpZiAoc2VsZWN0b3JbMF0gPT09ICc+Jykge1xyXG5cdFx0aWYgKCFwc2V1ZG9zLnNjb3BlKSB7XHJcblx0XHRcdC8vc2NvcGUgYXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gc2VsZWN0b3Igc2NvcGlmaWVzIGN1cnJlbnQgZWxlbWVudCBqdXN0IG9rXHJcblx0XHRcdHNlbGVjdG9yID0gJzpzY29wZScgKyBzZWxlY3RvcjtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YXIgaWQgPSBnZXRVaWQoKTtcclxuXHRcdFx0bGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtlbC5zZXRBdHRyaWJ1dGUoJ19fc2NvcGVkJywgaWQpO30pO1xyXG5cdFx0XHRzZWxlY3RvciA9ICdbX19zY29wZWQ9XCInICsgaWQgKyAnXCJdJyArIHNlbGVjdG9yO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIHBzZXVkbywgcHNldWRvRm4sIHBzZXVkb1BhcmFtLCBwc2V1ZG9QYXJhbUlkO1xyXG5cclxuXHQvL2NhdGNoIHBzZXVkb1xyXG5cdHZhciBwYXJ0cyA9IHBhcmVuLnBhcnNlKHNlbGVjdG9yKTtcclxuXHR2YXIgbWF0Y2ggPSBwYXJ0c1swXS5tYXRjaChwc2V1ZG9SRSk7XHJcblxyXG5cdC8vaWYgcHNldWRvIGZvdW5kXHJcblx0aWYgKG1hdGNoKSB7XHJcblx0XHQvL2dyYWIgcHNldWRvIGRldGFpbHNcclxuXHRcdHBzZXVkbyA9IG1hdGNoWzFdO1xyXG5cdFx0cHNldWRvUGFyYW1JZCA9IG1hdGNoWzJdO1xyXG5cclxuXHRcdGlmIChwc2V1ZG9QYXJhbUlkKSB7XHJcblx0XHRcdHBzZXVkb1BhcmFtID0gcGFyZW4uc3RyaW5naWZ5KHBhcnRzW3BzZXVkb1BhcmFtSWQuc2xpY2UoMSldLCBwYXJ0cyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9wcmUtc2VsZWN0IGVsZW1lbnRzIGJlZm9yZSBwc2V1ZG9cclxuXHRcdHZhciBwcmVTZWxlY3RvciA9IHBhcmVuLnN0cmluZ2lmeShwYXJ0c1swXS5zbGljZSgwLCBtYXRjaC5pbmRleCksIHBhcnRzKTtcclxuXHJcblx0XHQvL2ZpeCBmb3IgcXVlcnktcmVsYXRpdmVcclxuXHRcdGlmICghcHJlU2VsZWN0b3IgJiYgIW1hcHBlcnNbcHNldWRvXSkgcHJlU2VsZWN0b3IgPSAnKic7XHJcblx0XHRpZiAocHJlU2VsZWN0b3IpIGxpc3QgPSBxTGlzdChsaXN0LCBwcmVTZWxlY3Rvcik7XHJcblxyXG5cclxuXHRcdC8vYXBwbHkgcHNldWRvIGZpbHRlci9tYXBwZXIgb24gdGhlIGxpc3RcclxuXHRcdHBzZXVkb0ZuID0gZnVuY3Rpb24oZWwpIHtyZXR1cm4gcHNldWRvc1twc2V1ZG9dKGVsLCBwc2V1ZG9QYXJhbSk7IH07XHJcblx0XHRpZiAoZmlsdGVyc1twc2V1ZG9dKSB7XHJcblx0XHRcdGxpc3QgPSBsaXN0LmZpbHRlcihwc2V1ZG9Gbik7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChtYXBwZXJzW3BzZXVkb10pIHtcclxuXHRcdFx0bGlzdCA9IHVuaXF1ZShhcnJheWlmeShsaXN0Lm1hcChwc2V1ZG9GbikpKTtcclxuXHRcdH1cclxuXHJcblx0XHQvL3Nob3J0ZW4gc2VsZWN0b3JcclxuXHRcdHNlbGVjdG9yID0gcGFydHNbMF0uc2xpY2UobWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xyXG5cclxuXHRcdC8vIGNvbnNvbGUuZ3JvdXBFbmQoKTtcclxuXHJcblx0XHQvL3F1ZXJ5IG9uY2UgYWdhaW5cclxuXHRcdHJldHVybiBxUHNldWRvcyhsaXN0LCBwYXJlbi5zdHJpbmdpZnkoc2VsZWN0b3IsIHBhcnRzKSk7XHJcblx0fVxyXG5cclxuXHQvL2p1c3QgcXVlcnkgbGlzdFxyXG5cdGVsc2Uge1xyXG5cdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cdFx0cmV0dXJuIHFMaXN0KGxpc3QsIHNlbGVjdG9yKTtcclxuXHR9XHJcbn1cclxuXHJcblxyXG4vKiogQXBwbHkgc2VsZWN0b3Igb24gYSBsaXN0IG9mIGVsZW1lbnRzLCBubyBwb2x5ZmlsbGVkIHBzZXVkb3MgKi9cclxuZnVuY3Rpb24gcUxpc3QobGlzdCwgc2VsZWN0b3Ipe1xyXG5cdHJldHVybiB1bmlxdWUoYXJyYXlpZnkobGlzdC5tYXAoZnVuY3Rpb24oZWwpe1xyXG5cdFx0cmV0dXJuIHNsaWNlKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcclxuXHR9KSkpO1xyXG59XHJcblxyXG5cclxuLyoqIFJlZ2lzdGVyZWQgcHNldWRvcyAqL1xyXG52YXIgcHNldWRvcyA9IHt9O1xyXG52YXIgZmlsdGVycyA9IHt9O1xyXG52YXIgbWFwcGVycyA9IHt9O1xyXG5cclxuXHJcbi8qKiBSZWdleHAgdG8gZ3JhYiBwc2V1ZG9zIHdpdGggcGFyYW1zICovXHJcbnZhciBwc2V1ZG9SRTtcclxuXHJcblxyXG4vKipcclxuICogQXBwZW5kIGEgbmV3IGZpbHRlcmluZyAoY2xhc3NpYykgcHNldWRvXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFBzZXVkbyBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZpbHRlciBBIGZpbHRlcmluZyBmdW5jdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gcmVnaXN0ZXJGaWx0ZXIobmFtZSwgZmlsdGVyLCBpbmNTZWxmKXtcclxuXHRpZiAocHNldWRvc1tuYW1lXSkgcmV0dXJuO1xyXG5cclxuXHQvL3NhdmUgcHNldWRvIGZpbHRlclxyXG5cdHBzZXVkb3NbbmFtZV0gPSBmaWx0ZXI7XHJcblx0cHNldWRvc1tuYW1lXS5pbmNsdWRlU2VsZiA9IGluY1NlbGY7XHJcblx0ZmlsdGVyc1tuYW1lXSA9IHRydWU7XHJcblxyXG5cdHJlZ2VuZXJhdGVSZWdFeHAoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBBcHBlbmQgYSBuZXcgbWFwcGluZyAocmVsYXRpdmUtbGlrZSkgcHNldWRvXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHBzZXVkbyBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1hcHBlciBtYXAgZnVuY3Rpb25cclxuICovXHJcbmZ1bmN0aW9uIHJlZ2lzdGVyTWFwcGVyKG5hbWUsIG1hcHBlciwgaW5jU2VsZil7XHJcblx0aWYgKHBzZXVkb3NbbmFtZV0pIHJldHVybjtcclxuXHJcblx0cHNldWRvc1tuYW1lXSA9IG1hcHBlcjtcclxuXHRwc2V1ZG9zW25hbWVdLmluY2x1ZGVTZWxmID0gaW5jU2VsZjtcclxuXHRtYXBwZXJzW25hbWVdID0gdHJ1ZTtcclxuXHJcblx0cmVnZW5lcmF0ZVJlZ0V4cCgpO1xyXG59XHJcblxyXG5cclxuLyoqIFVwZGF0ZSByZWdleHAgY2F0Y2hpbmcgcHNldWRvcyAqL1xyXG5mdW5jdGlvbiByZWdlbmVyYXRlUmVnRXhwKCl7XHJcblx0cHNldWRvUkUgPSBuZXcgUmVnRXhwKCc6Oj8oJyArIE9iamVjdC5rZXlzKHBzZXVkb3MpLmpvaW4oJ3wnKSArICcpKFxcXFxcXFxcWzAtOV0rKT8nKTtcclxufVxyXG5cclxuXHJcblxyXG4vKiogRXhwb3J0cyAqL1xyXG5xdWVyeVNpbmdsZS5hbGwgPSBxdWVyeU11bHRpcGxlO1xyXG5xdWVyeVNpbmdsZS5yZWdpc3RlckZpbHRlciA9IHJlZ2lzdGVyRmlsdGVyO1xyXG5xdWVyeVNpbmdsZS5yZWdpc3Rlck1hcHBlciA9IHJlZ2lzdGVyTWFwcGVyO1xyXG5cclxuLyoqIERlZmF1bHQgZG9jdW1lbnQgcmVwcmVzZW50YXRpdmUgdG8gdXNlIGZvciBET00gKi9cclxucXVlcnlTaW5nbGUuZG9jdW1lbnQgPSBkb2M7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBxdWVyeVNpbmdsZTsiLCJ2YXIgcSA9IHJlcXVpcmUoJy4uJyk7XHJcblxyXG5mdW5jdGlvbiBoYXMoZWwsIHN1YlNlbGVjdG9yKXtcclxuXHRyZXR1cm4gISFxKHN1YlNlbGVjdG9yLCBlbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaGFzOyIsIi8qKiA6bWF0Y2hlcyBwc2V1ZG8gKi9cclxuXHJcbnZhciBxID0gcmVxdWlyZSgnLi4nKTtcclxuXHJcbmZ1bmN0aW9uIG1hdGNoZXMoZWwsIHNlbGVjdG9yKXtcclxuXHRpZiAoIWVsLnBhcmVudE5vZGUpIHtcclxuXHRcdHZhciBmcmFnbWVudCA9IHEuZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG5cdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHEuYWxsKHNlbGVjdG9yLCBlbC5wYXJlbnROb2RlKS5pbmRleE9mKGVsKSA+IC0xO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoZXM7IiwidmFyIG1hdGNoZXMgPSByZXF1aXJlKCcuL21hdGNoZXMnKTtcclxuXHJcbmZ1bmN0aW9uIG5vdChlbCwgc2VsZWN0b3Ipe1xyXG5cdHJldHVybiAhbWF0Y2hlcyhlbCwgc2VsZWN0b3IpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5vdDsiLCJ2YXIgcSA9IHJlcXVpcmUoJy4uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJvb3QoZWwpe1xyXG5cdHJldHVybiBlbCA9PT0gcS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcbn07IiwiLyoqXHJcbiAqIDpzY29wZSBwc2V1ZG9cclxuICogUmV0dXJuIGVsZW1lbnQgaWYgaXQgaGFzIGBzY29wZWRgIGF0dHJpYnV0ZS5cclxuICpcclxuICogQGxpbmsgaHR0cDovL2Rldi53My5vcmcvY3Nzd2cvc2VsZWN0b3JzLTQvI3RoZS1zY29wZS1wc2V1ZG9cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNjb3BlKGVsKXtcclxuXHRyZXR1cm4gZWwuaGFzQXR0cmlidXRlKCdzY29wZWQnKTtcclxufTsiLCIvKiFcbiAqIGFycmF5LXVuaXF1ZSA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvYXJyYXktdW5pcXVlPlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNCBKb24gU2NobGlua2VydCwgY29udHJpYnV0b3JzLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB1bmlxdWUoYXJyKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJyYXktdW5pcXVlIGV4cGVjdHMgYW4gYXJyYXkuJyk7XG4gIH1cblxuICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgdmFyIGkgPSAtMTtcblxuICB3aGlsZSAoaSsrIDwgbGVuKSB7XG4gICAgdmFyIGogPSBpICsgMTtcblxuICAgIGZvciAoOyBqIDwgYXJyLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAoYXJyW2ldID09PSBhcnJbal0pIHtcbiAgICAgICAgYXJyLnNwbGljZShqLS0sIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL3NsaWNlZCcpO1xuIiwiXG4vKipcbiAqIEFuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykgYWx0ZXJuYXRpdmVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYXJncyBzb21ldGhpbmcgd2l0aCBhIGxlbmd0aFxuICogQHBhcmFtIHtOdW1iZXJ9IHNsaWNlXG4gKiBAcGFyYW0ge051bWJlcn0gc2xpY2VFbmRcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXJncywgc2xpY2UsIHNsaWNlRW5kKSB7XG4gIHZhciByZXQgPSBbXTtcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuXG4gIGlmICgwID09PSBsZW4pIHJldHVybiByZXQ7XG5cbiAgdmFyIHN0YXJ0ID0gc2xpY2UgPCAwXG4gICAgPyBNYXRoLm1heCgwLCBzbGljZSArIGxlbilcbiAgICA6IHNsaWNlIHx8IDA7XG5cbiAgaWYgKHNsaWNlRW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICBsZW4gPSBzbGljZUVuZCA8IDBcbiAgICAgID8gc2xpY2VFbmQgKyBsZW5cbiAgICAgIDogc2xpY2VFbmRcbiAgfVxuXG4gIHdoaWxlIChsZW4tLSA+IHN0YXJ0KSB7XG4gICAgcmV0W2xlbiAtIHN0YXJ0XSA9IGFyZ3NbbGVuXTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG5cbiIsInZhciBEcmFnZ2FibGUgPSByZXF1aXJlKCdkcmFnZ3knKTtcclxudmFyIGVtaXQgPSByZXF1aXJlKCdlbW15L2VtaXQnKTtcclxudmFyIG9uID0gcmVxdWlyZSgnZW1teS9vbicpO1xyXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ211dHlwZS9pcy1hcnJheScpO1xyXG52YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdtdXR5cGUvaXMtc3RyaW5nJyk7XHJcbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJ211dHlwZS9pcy1vYmplY3QnKTtcclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kL211dGFibGUnKTtcclxudmFyIGluaGVyaXQgPSByZXF1aXJlKCdpbmhlcml0cycpO1xyXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xyXG52YXIgYmV0d2VlbiA9IHJlcXVpcmUoJ211bWF0aC9iZXR3ZWVuJyk7XHJcbnZhciBzcGxpdEtleXMgPSByZXF1aXJlKCdzcGxpdC1rZXlzJyk7XHJcbnZhciBjc3MgPSByZXF1aXJlKCdtdWNzcy9jc3MnKTtcclxudmFyIHBhZGRpbmdzID0gcmVxdWlyZSgnbXVjc3MvcGFkZGluZycpO1xyXG52YXIgYm9yZGVycyA9IHJlcXVpcmUoJ211Y3NzL2JvcmRlcicpO1xyXG52YXIgbWFyZ2lucyA9IHJlcXVpcmUoJ211Y3NzL21hcmdpbicpO1xyXG52YXIgb2Zmc2V0cyA9IHJlcXVpcmUoJ211Y3NzL29mZnNldCcpO1xyXG52YXIgcGFyc2VDU1NWYWx1ZSA9IHJlcXVpcmUoJ211Y3NzL3BhcnNlLXZhbHVlJyk7XHJcblxyXG5cclxudmFyIGRvYyA9IGRvY3VtZW50LCB3aW4gPSB3aW5kb3csIHJvb3QgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBNYWtlIGFuIGVsZW1lbnQgcmVzaXphYmxlLlxyXG4gKlxyXG4gKiBOb3RlIHRoYXQgd2UgZG9u4oCZdCBuZWVkIGEgY29udGFpbmVyIG9wdGlvblxyXG4gKiBhcyBhcmJpdHJhcnkgY29udGFpbmVyIGlzIGVtdWxhdGFibGUgdmlhIGZha2UgcmVzaXphYmxlLlxyXG4gKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFJlc2l6YWJsZSAoZWwsIG9wdGlvbnMpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdGlmICghKHNlbGYgaW5zdGFuY2VvZiBSZXNpemFibGUpKSB7XHJcblx0XHRyZXR1cm4gbmV3IFJlc2l6YWJsZShlbCwgb3B0aW9ucyk7XHJcblx0fVxyXG5cclxuXHRzZWxmLmVsZW1lbnQgPSBlbDtcclxuXHJcblx0ZXh0ZW5kKHNlbGYsIG9wdGlvbnMpO1xyXG5cclxuXHRzZWxmLmNyZWF0ZUhhbmRsZXMoKTtcclxuXHJcblx0Ly9iaW5kIGV2ZW50LCBpZiBhbnlcclxuXHRpZiAoc2VsZi5yZXNpemUpIHtcclxuXHRcdHNlbGYub24oJ3Jlc2l6ZScsIHNlbGYucmVzaXplKTtcclxuXHR9XHJcbn1cclxuXHJcbmluaGVyaXQoUmVzaXphYmxlLCBFbWl0dGVyKTtcclxuXHJcblxyXG52YXIgcHJvdG8gPSBSZXNpemFibGUucHJvdG90eXBlO1xyXG5cclxuXHJcbi8qKiBDcmVhdGUgaGFuZGxlcyBhY2NvcmRpbmcgdG8gb3B0aW9ucyAqL1xyXG5wcm90by5jcmVhdGVIYW5kbGVzID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0Ly9pbml0IGhhbmRsZXNcclxuXHR2YXIgaGFuZGxlcztcclxuXHJcblx0Ly9wYXJzZSB2YWx1ZVxyXG5cdGlmIChpc0FycmF5KHNlbGYuaGFuZGxlcykpIHtcclxuXHRcdGhhbmRsZXMgPSB7fTtcclxuXHRcdGZvciAodmFyIGkgPSBzZWxmLmhhbmRsZXMubGVuZ3RoOyBpLS07KXtcclxuXHRcdFx0aGFuZGxlc1tzZWxmLmhhbmRsZXNbaV1dID0gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblx0ZWxzZSBpZiAoaXNTdHJpbmcoc2VsZi5oYW5kbGVzKSkge1xyXG5cdFx0aGFuZGxlcyA9IHt9O1xyXG5cdFx0dmFyIGFyciA9IHNlbGYuaGFuZGxlcy5tYXRjaCgvKFtzd25lXSspL2cpO1xyXG5cdFx0Zm9yICh2YXIgaSA9IGFyci5sZW5ndGg7IGktLTspe1xyXG5cdFx0XHRoYW5kbGVzW2FycltpXV0gPSBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRlbHNlIGlmIChpc09iamVjdChzZWxmLmhhbmRsZXMpKSB7XHJcblx0XHRoYW5kbGVzID0gc2VsZi5oYW5kbGVzO1xyXG5cdH1cclxuXHQvL2RlZmF1bHQgc2V0IG9mIGhhbmRsZXMgZGVwZW5kcyBvbiBwb3NpdGlvbi5cclxuXHRlbHNlIHtcclxuXHRcdHZhciBwb3NpdGlvbiA9IGdldENvbXB1dGVkU3R5bGUoc2VsZi5lbGVtZW50KS5wb3NpdGlvbjtcclxuXHRcdHZhciBkaXNwbGF5ID0gZ2V0Q29tcHV0ZWRTdHlsZShzZWxmLmVsZW1lbnQpLmRpc3BsYXk7XHJcblx0XHQvL2lmIGRpc3BsYXkgaXMgaW5saW5lLWxpa2UgLSBwcm92aWRlIG9ubHkgdGhyZWUgaGFuZGxlc1xyXG5cdFx0Ly9pdCBpcyBwb3NpdGlvbjogc3RhdGljIG9yIGRpc3BsYXk6IGlubGluZVxyXG5cdFx0aWYgKC9pbmxpbmUvLnRlc3QoZGlzcGxheSkgfHwgL3N0YXRpYy8udGVzdChwb3NpdGlvbikpe1xyXG5cdFx0XHRoYW5kbGVzID0ge1xyXG5cdFx0XHRcdHM6IG51bGwsXHJcblx0XHRcdFx0c2U6IG51bGwsXHJcblx0XHRcdFx0ZTogbnVsbFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0Ly9lbnN1cmUgcG9zaXRpb24gaXMgbm90IHN0YXRpY1xyXG5cdFx0XHRjc3Moc2VsZi5lbGVtZW50LCAncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuXHRcdH1cclxuXHRcdC8vZWxzZSAtIGFsbCBoYW5kbGVzXHJcblx0XHRlbHNlIHtcclxuXHRcdFx0aGFuZGxlcyA9IHtcclxuXHRcdFx0XHRzOiBudWxsLFxyXG5cdFx0XHRcdHNlOiBudWxsLFxyXG5cdFx0XHRcdGU6IG51bGwsXHJcblx0XHRcdFx0bmU6IG51bGwsXHJcblx0XHRcdFx0bjogbnVsbCxcclxuXHRcdFx0XHRudzogbnVsbCxcclxuXHRcdFx0XHR3OiBudWxsLFxyXG5cdFx0XHRcdHN3OiBudWxsXHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvL2NyZWF0ZSBwcm9wZXIgbnVtYmVyIG9mIGhhbmRsZXNcclxuXHR2YXIgaGFuZGxlO1xyXG5cdGZvciAodmFyIGRpcmVjdGlvbiBpbiBoYW5kbGVzKSB7XHJcblx0XHRoYW5kbGVzW2RpcmVjdGlvbl0gPSBzZWxmLmNyZWF0ZUhhbmRsZShoYW5kbGVzW2RpcmVjdGlvbl0sIGRpcmVjdGlvbik7XHJcblx0fVxyXG5cclxuXHQvL3NhdmUgaGFuZGxlcyBlbGVtZW50c1xyXG5cdHNlbGYuaGFuZGxlcyA9IGhhbmRsZXM7XHJcbn1cclxuXHJcblxyXG4vKiogQ3JlYXRlIGhhbmRsZSBmb3IgdGhlIGRpcmVjdGlvbiAqL1xyXG5wcm90by5jcmVhdGVIYW5kbGUgPSBmdW5jdGlvbihoYW5kbGUsIGRpcmVjdGlvbil7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHR2YXIgZWwgPSBzZWxmLmVsZW1lbnQ7XHJcblxyXG5cdC8vbWFrZSBoYW5kbGUgZWxlbWVudFxyXG5cdGlmICghaGFuZGxlKSB7XHJcblx0XHRoYW5kbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdGhhbmRsZS5jbGFzc0xpc3QuYWRkKCdyZXNpemFibGUtaGFuZGxlJyk7XHJcblx0fVxyXG5cclxuXHQvL2luc2VydCBoYW5kbGUgdG8gdGhlIGVsZW1lbnRcclxuXHRzZWxmLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaGFuZGxlKTtcclxuXHJcblx0Ly9zYXZlIGRpcmVjdGlvblxyXG5cdGhhbmRsZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XHJcblxyXG5cdC8vbWFrZSBoYW5kbGUgZHJhZ2dhYmxlXHJcblx0dmFyIGRyYWdneSA9IG5ldyBEcmFnZ2FibGUoaGFuZGxlLCB7XHJcblx0XHR3aXRoaW46IHNlbGYud2l0aGluLFxyXG5cdFx0Ly8gY3NzMzogZmFsc2UsXHJcblx0XHR0aHJlc2hvbGQ6IHNlbGYudGhyZXNob2xkLFxyXG5cdFx0YXhpczogL15bbnNdJC8udGVzdChkaXJlY3Rpb24pID8gJ3knIDogL15bd2VdJC8udGVzdChkaXJlY3Rpb24pID8gJ3gnIDogJ2JvdGgnXHJcblx0fSk7XHJcblxyXG5cdGRyYWdneS5vbignZHJhZ3N0YXJ0JywgZnVuY3Rpb24gKGUpIHtcclxuXHRcdHNlbGYubSA9IG1hcmdpbnMoZWwpO1xyXG5cdFx0c2VsZi5iID0gYm9yZGVycyhlbCk7XHJcblx0XHRzZWxmLnAgPSBwYWRkaW5ncyhlbCk7XHJcblxyXG5cdFx0Ly9wYXJzZSBpbml0aWFsIG9mZnNldHNcclxuXHRcdHZhciBzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XHJcblx0XHRzZWxmLm9mZnNldHMgPSBbcGFyc2VDU1NWYWx1ZShzLmxlZnQpLCBwYXJzZUNTU1ZhbHVlKHMudG9wKV07XHJcblxyXG5cdFx0Ly9maXggdG9wLWxlZnQgcG9zaXRpb25cclxuXHRcdGNzcyhlbCwge1xyXG5cdFx0XHRsZWZ0OiBzZWxmLm9mZnNldHNbMF0sXHJcblx0XHRcdHRvcDogc2VsZi5vZmZzZXRzWzFdXHJcblx0XHR9KTtcclxuXHJcblx0XHQvL3JlY2FsYyBib3JkZXItYm94XHJcblx0XHRpZiAoZ2V0Q29tcHV0ZWRTdHlsZShlbCkuYm94U2l6aW5nID09PSAnYm9yZGVyLWJveCcpIHtcclxuXHRcdFx0c2VsZi5wLnRvcCA9IDA7XHJcblx0XHRcdHNlbGYucC5ib3R0b20gPSAwO1xyXG5cdFx0XHRzZWxmLnAubGVmdCA9IDA7XHJcblx0XHRcdHNlbGYucC5yaWdodCA9IDA7XHJcblx0XHRcdHNlbGYuYi50b3AgPSAwO1xyXG5cdFx0XHRzZWxmLmIuYm90dG9tID0gMDtcclxuXHRcdFx0c2VsZi5iLmxlZnQgPSAwO1xyXG5cdFx0XHRzZWxmLmIucmlnaHQgPSAwO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vc2F2ZSBpbml0aWFsIHNpemVcclxuXHRcdHNlbGYuc2l6ZSA9IFtlbC5vZmZzZXRXaWR0aCAtIHNlbGYuYi5sZWZ0IC0gc2VsZi5iLnJpZ2h0IC0gc2VsZi5wLmxlZnQgLSBzZWxmLnAucmlnaHQsIGVsLm9mZnNldEhlaWdodCAtIHNlbGYuYi50b3AgLSBzZWxmLmIuYm90dG9tIC0gc2VsZi5wLnRvcCAtIHNlbGYucC5ib3R0b21dO1xyXG5cclxuXHRcdC8vY2FsYyBsaW1pdHMgKG1heCBoZWlnaHQvd2lkdGgpXHJcblx0XHRpZiAoc2VsZi53aXRoaW4pIHtcclxuXHRcdFx0dmFyIHBvID0gb2Zmc2V0cyhzZWxmLndpdGhpbik7XHJcblx0XHRcdHZhciBvID0gb2Zmc2V0cyhlbCk7XHJcblx0XHRcdHNlbGYubGltaXRzID0gW1xyXG5cdFx0XHRcdG8ubGVmdCAtIHBvLmxlZnQgKyBzZWxmLnNpemVbMF0sXHJcblx0XHRcdFx0by50b3AgLSBwby50b3AgKyBzZWxmLnNpemVbMV0sXHJcblx0XHRcdFx0cG8ucmlnaHQgLSBvLnJpZ2h0ICsgc2VsZi5zaXplWzBdLFxyXG5cdFx0XHRcdHBvLmJvdHRvbSAtIG8uYm90dG9tICsgc2VsZi5zaXplWzFdXTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHNlbGYubGltaXRzID0gWzk5OTksIDk5OTksIDk5OTksIDk5OTldO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHQvL3ByZXNldCBtb3VzZSBjdXJzb3JcclxuXHRcdGNzcyhyb290LCB7XHJcblx0XHRcdCdjdXJzb3InOiBkaXJlY3Rpb24gKyAnLXJlc2l6ZSdcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vY2xlYXIgY3Vyc29yc1xyXG5cdFx0Zm9yICh2YXIgaCBpbiBzZWxmLmhhbmRsZXMpe1xyXG5cdFx0XHRjc3Moc2VsZi5oYW5kbGVzW2hdLCAnY3Vyc29yJywgbnVsbCk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdGRyYWdneS5vbignZHJhZycsIGZ1bmN0aW9uKGUpe1xyXG5cdFx0dmFyIGNvb3JkcyA9IGRyYWdneS5nZXRDb29yZHMoKTtcclxuXHJcblx0XHQvL2NoYW5nZSB3aWR0aC9oZWlnaHQgcHJvcGVybHlcclxuXHRcdHN3aXRjaCAoZGlyZWN0aW9uKSB7XHJcblx0XHRcdGNhc2UgJ3NlJzpcclxuXHRcdFx0Y2FzZSAncyc6XHJcblx0XHRcdGNhc2UgJ2UnOlxyXG5cdFx0XHRcdGNzcyhlbCwge1xyXG5cdFx0XHRcdFx0d2lkdGg6IGJldHdlZW4oc2VsZi5zaXplWzBdICsgY29vcmRzWzBdLCAwLCBzZWxmLmxpbWl0c1syXSksXHJcblx0XHRcdFx0XHRoZWlnaHQ6IGJldHdlZW4oc2VsZi5zaXplWzFdICsgY29vcmRzWzFdLCAwLCBzZWxmLmxpbWl0c1szXSlcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnbncnOlxyXG5cdFx0XHRjYXNlICduJzpcclxuXHRcdFx0Y2FzZSAndyc6XHJcblx0XHRcdFx0Y3NzKGVsLCB7XHJcblx0XHRcdFx0XHR3aWR0aDogYmV0d2VlbihzZWxmLnNpemVbMF0gLSBjb29yZHNbMF0sIDAsIHNlbGYubGltaXRzWzBdKSxcclxuXHRcdFx0XHRcdGhlaWdodDogYmV0d2VlbihzZWxmLnNpemVbMV0gLSBjb29yZHNbMV0sIDAsIHNlbGYubGltaXRzWzFdKVxyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHQvLyAvL3N1YnRyYWN0IHQvbCBvbiBjaGFuZ2VkIHNpemVcclxuXHRcdFx0XHR2YXIgZGlmWCA9IHNlbGYuc2l6ZVswXSArIHNlbGYuYi5sZWZ0ICsgc2VsZi5iLnJpZ2h0ICsgc2VsZi5wLmxlZnQgKyBzZWxmLnAucmlnaHQgLSBlbC5vZmZzZXRXaWR0aDtcclxuXHRcdFx0XHR2YXIgZGlmWSA9IHNlbGYuc2l6ZVsxXSArIHNlbGYuYi50b3AgKyBzZWxmLmIuYm90dG9tICsgc2VsZi5wLnRvcCArIHNlbGYucC5ib3R0b20gLSBlbC5vZmZzZXRIZWlnaHQ7XHJcblxyXG5cdFx0XHRcdGNzcyhlbCwge1xyXG5cdFx0XHRcdFx0bGVmdDogc2VsZi5vZmZzZXRzWzBdICsgZGlmWCxcclxuXHRcdFx0XHRcdHRvcDogc2VsZi5vZmZzZXRzWzFdICsgZGlmWVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICduZSc6XHJcblx0XHRcdFx0Y3NzKGVsLCB7XHJcblx0XHRcdFx0XHR3aWR0aDogYmV0d2VlbihzZWxmLnNpemVbMF0gKyBjb29yZHNbMF0sIDAsIHNlbGYubGltaXRzWzJdKSxcclxuXHRcdFx0XHRcdGhlaWdodDogYmV0d2VlbihzZWxmLnNpemVbMV0gLSBjb29yZHNbMV0sIDAsIHNlbGYubGltaXRzWzFdKVxyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHQvL3N1YnRyYWN0IHQvbCBvbiBjaGFuZ2VkIHNpemVcclxuXHRcdFx0XHR2YXIgZGlmWSA9IHNlbGYuc2l6ZVsxXSArIHNlbGYuYi50b3AgKyBzZWxmLmIuYm90dG9tICsgc2VsZi5wLnRvcCArIHNlbGYucC5ib3R0b20gLSBlbC5vZmZzZXRIZWlnaHQ7XHJcblxyXG5cdFx0XHRcdGNzcyhlbCwge1xyXG5cdFx0XHRcdFx0dG9wOiBzZWxmLm9mZnNldHNbMV0gKyBkaWZZXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ3N3JzpcclxuXHRcdFx0XHRjc3MoZWwsIHtcclxuXHRcdFx0XHRcdHdpZHRoOiBiZXR3ZWVuKHNlbGYuc2l6ZVswXSAtIGNvb3Jkc1swXSwgMCwgc2VsZi5saW1pdHNbMF0pLFxyXG5cdFx0XHRcdFx0aGVpZ2h0OiBiZXR3ZWVuKHNlbGYuc2l6ZVsxXSArIGNvb3Jkc1sxXSwgMCwgc2VsZi5saW1pdHNbM10pXHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdC8vc3VidHJhY3QgdC9sIG9uIGNoYW5nZWQgc2l6ZVxyXG5cdFx0XHRcdHZhciBkaWZYID0gc2VsZi5zaXplWzBdICsgc2VsZi5iLmxlZnQgKyBzZWxmLmIucmlnaHQgKyBzZWxmLnAubGVmdCArIHNlbGYucC5yaWdodCAtIGVsLm9mZnNldFdpZHRoO1xyXG5cclxuXHRcdFx0XHRjc3MoZWwsIHtcclxuXHRcdFx0XHRcdGxlZnQ6IHNlbGYub2Zmc2V0c1swXSArIGRpZlhcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdH07XHJcblxyXG5cdFx0Ly90cmlnZ2VyIGNhbGxiYWNrc1xyXG5cdFx0ZW1pdChzZWxmLCAncmVzaXplJyk7XHJcblx0XHRlbWl0KGVsLCAncmVzaXplJyk7XHJcblxyXG5cdFx0ZHJhZ2d5LnNldENvb3JkcygwLDApO1xyXG5cdH0pO1xyXG5cclxuXHRkcmFnZ3kub24oJ2RyYWdlbmQnLCBmdW5jdGlvbigpe1xyXG5cdFx0Ly9jbGVhciBjdXJzb3IgJiBwb2ludGVyLWV2ZW50c1xyXG5cdFx0Y3NzKHJvb3QsIHtcclxuXHRcdFx0J2N1cnNvcic6IG51bGxcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vZ2V0IGJhY2sgY3Vyc29yc1xyXG5cdFx0Zm9yICh2YXIgaCBpbiBzZWxmLmhhbmRsZXMpe1xyXG5cdFx0XHRjc3Moc2VsZi5oYW5kbGVzW2hdLCAnY3Vyc29yJywgc2VsZi5oYW5kbGVzW2hdLmRpcmVjdGlvbiArICctcmVzaXplJyk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdC8vYXBwZW5kIHN0eWxlc1xyXG5cdGNzcyhoYW5kbGUsIGhhbmRsZVN0eWxlc1tkaXJlY3Rpb25dKTtcclxuXHRjc3MoaGFuZGxlLCAnY3Vyc29yJywgZGlyZWN0aW9uICsgJy1yZXNpemUnKTtcclxuXHJcblx0Ly9hcHBlbmQgcHJvcGVyIGNsYXNzXHJcblx0aGFuZGxlLmNsYXNzTGlzdC5hZGQoJ3Jlc2l6YWJsZS1oYW5kbGUtJyArIGRpcmVjdGlvbik7XHJcblxyXG5cdHJldHVybiBoYW5kbGU7XHJcbn07XHJcblxyXG5cclxuLyoqIGRlY29uc3RydWN0b3IgLSByZW1vdmVzIGFueSBtZW1vcnkgYmluZGluZ3MgKi9cclxucHJvdG8uZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvL3JlbW92ZSBhbGwgaGFuZGxlc1xyXG5cdGZvciAodmFyIGhOYW1lIGluIHRoaXMuaGFuZGxlcyl7XHJcblx0XHR0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5oYW5kbGVzW2hOYW1lXSk7XHJcblx0XHR0aGlzLmhhbmRsZXNbaE5hbWVdLmRyYWdnYWJsZS5kZXN0cm95KCk7XHJcblx0fVxyXG5cclxuXHJcblx0Ly9yZW1vdmUgcmVmZXJlbmNlc1xyXG5cdHRoaXMuZWxlbWVudCA9IG51bGw7XHJcbn07XHJcblxyXG5cclxudmFyIHcgPSAxMDtcclxuXHJcblxyXG4vKiogVGhyZXNob2xkIHNpemUgKi9cclxucHJvdG8udGhyZXNob2xkID0gdztcclxuXHJcblxyXG4vKiogU3R5bGVzIGZvciBoYW5kbGVzICovXHJcbnZhciBoYW5kbGVTdHlsZXMgPSBzcGxpdEtleXMoe1xyXG5cdCdlLHcsbixzLG53LG5lLHN3LHNlJzoge1xyXG5cdFx0J3Bvc2l0aW9uJzogJ2Fic29sdXRlJ1xyXG5cdH0sXHJcblx0J2Usdyc6IHtcclxuXHRcdCd0b3AsIGJvdHRvbSc6MCxcclxuXHRcdCd3aWR0aCc6IHdcclxuXHR9LFxyXG5cdCdlJzoge1xyXG5cdFx0J2xlZnQnOiAnYXV0bycsXHJcblx0XHQncmlnaHQnOiAtdy8yXHJcblx0fSxcclxuXHQndyc6IHtcclxuXHRcdCdyaWdodCc6ICdhdXRvJyxcclxuXHRcdCdsZWZ0JzogLXcvMlxyXG5cdH0sXHJcblx0J3MnOiB7XHJcblx0XHQndG9wJzogJ2F1dG8nLFxyXG5cdFx0J2JvdHRvbSc6IC13LzJcclxuXHR9LFxyXG5cdCduJzoge1xyXG5cdFx0J2JvdHRvbSc6ICdhdXRvJyxcclxuXHRcdCd0b3AnOiAtdy8yXHJcblx0fSxcclxuXHQnbixzJzoge1xyXG5cdFx0J2xlZnQsIHJpZ2h0JzogMCxcclxuXHRcdCdoZWlnaHQnOiB3XHJcblx0fSxcclxuXHQnbncsbmUsc3csc2UnOiB7XHJcblx0XHQnd2lkdGgnOiB3LFxyXG5cdFx0J2hlaWdodCc6IHcsXHJcblx0XHQnei1pbmRleCc6IDFcclxuXHR9LFxyXG5cdCdudyc6IHtcclxuXHRcdCd0b3AsIGxlZnQnOiAtdy8yLFxyXG5cdFx0J2JvdHRvbSwgcmlnaHQnOiAnYXV0bydcclxuXHR9LFxyXG5cdCduZSc6IHtcclxuXHRcdCd0b3AsIHJpZ2h0JzogLXcvMixcclxuXHRcdCdib3R0b20sIGxlZnQnOiAnYXV0bydcclxuXHR9LFxyXG5cdCdzdyc6IHtcclxuXHRcdCdib3R0b20sIGxlZnQnOiAtdy8yLFxyXG5cdFx0J3RvcCwgcmlnaHQnOiAnYXV0bydcclxuXHR9LFxyXG5cdCdzZSc6IHtcclxuXHRcdCdib3R0b20sIHJpZ2h0JzogLXcvMixcclxuXHRcdCd0b3AsIGxlZnQnOiAnYXV0bydcclxuXHR9XHJcbn0sIHRydWUpO1xyXG5cclxuXHJcblxyXG4vKipcclxuICogQG1vZHVsZSByZXNpemFibGVcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzaXphYmxlOyIsInZhciB0eXBlID0gcmVxdWlyZSgnbXV0eXBlJyk7XHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZC9tdXRhYmxlJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNwbGl0S2V5cztcclxuXHJcblxyXG4vKipcclxuICogRGlzZW50YW5nbGUgbGlzdGVkIGtleXNcclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBBbiBvYmplY3Qgd2l0aCBrZXkgaW5jbHVkaW5nIGxpc3RlZCBkZWNsYXJhdGlvbnNcclxuICogQGV4YW1wbGUgeydhLGIsYyc6IDF9XHJcbiAqXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZGVlcCBXaGV0aGVyIHRvIGZsYXR0ZW4gbmVzdGVkIG9iamVjdHNcclxuICpcclxuICogQHRvZG8gVGhpbmsgdG8gcHJvdmlkZSBzdWNoIG1ldGhvZCBvbiBvYmplY3QgcHJvdG90eXBlXHJcbiAqXHJcbiAqIEByZXR1cm4ge29ibGVjdH0gU291cmNlIHNldCBwYXNzZWQge0BsaW5rIHNldH1cclxuICovXHJcbmZ1bmN0aW9uIHNwbGl0S2V5cyhvYmosIGRlZXAsIHNlcGFyYXRvcil7XHJcblx0Ly9zd2FwIGFyZ3MsIGlmIG5lZWRlZFxyXG5cdGlmICgoZGVlcCB8fCBzZXBhcmF0b3IpICYmICh0eXBlLmlzQm9vbGVhbihzZXBhcmF0b3IpIHx8IHR5cGUuaXNTdHJpbmcoZGVlcCkgfHwgdHlwZS5pc1JlZ0V4cChkZWVwKSkpIHtcclxuXHRcdHZhciB0bXAgPSBkZWVwO1xyXG5cdFx0ZGVlcCA9IHNlcGFyYXRvcjtcclxuXHRcdHNlcGFyYXRvciA9IHRtcDtcclxuXHR9XHJcblxyXG5cdC8vZW5zdXJlIHNlcGFyYXRvclxyXG5cdHNlcGFyYXRvciA9IHNlcGFyYXRvciA9PT0gdW5kZWZpbmVkID8gc3BsaXRLZXlzLnNlcGFyYXRvciA6IHNlcGFyYXRvcjtcclxuXHJcblx0dmFyIGxpc3QsIHZhbHVlO1xyXG5cclxuXHRmb3IodmFyIGtleXMgaW4gb2JqKXtcclxuXHRcdHZhbHVlID0gb2JqW2tleXNdO1xyXG5cclxuXHRcdGlmIChkZWVwICYmIHR5cGUuaXNPYmplY3QodmFsdWUpKSBzcGxpdEtleXModmFsdWUsIGRlZXAsIHNlcGFyYXRvcik7XHJcblxyXG5cdFx0bGlzdCA9IGtleXMuc3BsaXQoc2VwYXJhdG9yKTtcclxuXHJcblx0XHRpZiAobGlzdC5sZW5ndGggPiAxKXtcclxuXHRcdFx0ZGVsZXRlIG9ialtrZXlzXTtcclxuXHRcdFx0bGlzdC5mb3JFYWNoKHNldEtleSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRLZXkoa2V5KXtcclxuXHRcdC8vaWYgZXhpc3Rpbmcga2V5IC0gZXh0ZW5kLCBpZiBwb3NzaWJsZVxyXG5cdFx0Ly9GSVhNRTogb2JqW2tleV0gbWlnaHQgYmUgbm90IGFuIG9iamVjdCwgYnV0IGZ1bmN0aW9uLCBmb3IgZXhhbXBsZVxyXG5cdFx0aWYgKHZhbHVlICE9PSBvYmpba2V5XSAmJiB0eXBlLmlzT2JqZWN0KHZhbHVlKSAmJiB0eXBlLmlzT2JqZWN0KG9ialtrZXldKSkge1xyXG5cdFx0XHRvYmpba2V5XSA9IGV4dGVuZCh7fSwgb2JqW2tleV0sIHZhbHVlKTtcclxuXHRcdH1cclxuXHRcdC8vb3IgcmVwbGFjZVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdG9ialtrZXldID0gdmFsdWU7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gb2JqO1xyXG59XHJcblxyXG5cclxuLyoqIGRlZmF1bHQgc2VwYXJhdG9yICovXHJcbnNwbGl0S2V5cy5zZXBhcmF0b3IgPSAvXFxzPyxcXHM/LzsiLCIvKipcclxuICogQG1vZHVsZSAgc3Q4XHJcbiAqXHJcbiAqIE1pY3JvIHN0YXRlIG1hY2hpbmUuXHJcbiAqL1xyXG5cclxuXHJcbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcbnZhciBpc0ZuID0gcmVxdWlyZSgnaXMtZnVuY3Rpb24nKTtcclxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnaXMtcGxhaW4tb2JqZWN0Jyk7XHJcblxyXG5cclxuLyoqIERlZmF1bHRzICovXHJcblxyXG5TdGF0ZS5vcHRpb25zID0ge1xyXG5cdGxlYXZlQ2FsbGJhY2s6ICdhZnRlcicsXHJcblx0ZW50ZXJDYWxsYmFjazogJ2JlZm9yZScsXHJcblx0Y2hhbmdlQ2FsbGJhY2s6ICdjaGFuZ2UnLFxyXG5cdHJlbWFpbmRlclN0YXRlOiAnXydcclxufTtcclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgbmV3IHN0YXRlIGNvbnRyb2xsZXIgYmFzZWQgb24gc3RhdGVzIHBhc3NlZFxyXG4gKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICpcclxuICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIEluaXRpYWwgc3RhdGVzXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gU3RhdGUoc3RhdGVzLCBjb250ZXh0KXtcclxuXHQvL2lnbm9yZSBleGlzdGluZyBzdGF0ZVxyXG5cdGlmIChzdGF0ZXMgaW5zdGFuY2VvZiBTdGF0ZSkgcmV0dXJuIHN0YXRlcztcclxuXHJcblx0Ly9lbnN1cmUgbmV3IHN0YXRlIGluc3RhbmNlIGlzIGNyZWF0ZWRcclxuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgU3RhdGUpKSByZXR1cm4gbmV3IFN0YXRlKHN0YXRlcyk7XHJcblxyXG5cdC8vc2F2ZSBzdGF0ZXMgb2JqZWN0XHJcblx0dGhpcy5zdGF0ZXMgPSBzdGF0ZXMgfHwge307XHJcblxyXG5cdC8vc2F2ZSBjb250ZXh0XHJcblx0dGhpcy5jb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xyXG5cclxuXHQvL2luaXRlZEZsYWdcclxuXHR0aGlzLmlzSW5pdCA9IGZhbHNlO1xyXG59XHJcblxyXG5cclxuLyoqIEluaGVyaXQgU3RhdGUgZnJvbSBFbWl0dGVyICovXHJcblxyXG52YXIgcHJvdG8gPSBTdGF0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVtaXR0ZXIucHJvdG90eXBlKTtcclxuXHJcblxyXG4vKipcclxuICogR28gdG8gYSBzdGF0ZVxyXG4gKlxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIEFueSBuZXcgc3RhdGUgdG8gZW50ZXJcclxuICovXHJcblxyXG5wcm90by5zZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHR2YXIgb2xkVmFsdWUgPSB0aGlzLnN0YXRlLCBzdGF0ZXMgPSB0aGlzLnN0YXRlcztcclxuXHQvLyBjb25zb2xlLmdyb3VwKCdzZXQnLCB2YWx1ZSwgb2xkVmFsdWUpO1xyXG5cclxuXHQvL2xlYXZlIG9sZCBzdGF0ZVxyXG5cdHZhciBvbGRTdGF0ZU5hbWUgPSBzdGF0ZXNbb2xkVmFsdWVdICE9PSB1bmRlZmluZWQgPyBvbGRWYWx1ZSA6IFN0YXRlLm9wdGlvbnMucmVtYWluZGVyU3RhdGU7XHJcblx0dmFyIG9sZFN0YXRlID0gc3RhdGVzW29sZFN0YXRlTmFtZV07XHJcblxyXG5cdHZhciBsZWF2ZVJlc3VsdCwgbGVhdmVGbGFnID0gU3RhdGUub3B0aW9ucy5sZWF2ZUNhbGxiYWNrICsgb2xkU3RhdGVOYW1lO1xyXG5cclxuXHRpZiAodGhpcy5pc0luaXQpIHtcclxuXHRcdGlmIChpc09iamVjdChvbGRTdGF0ZSkpIHtcclxuXHRcdFx0aWYgKCF0aGlzW2xlYXZlRmxhZ10pIHtcclxuXHRcdFx0XHR0aGlzW2xlYXZlRmxhZ10gPSB0cnVlO1xyXG5cclxuXHRcdFx0XHQvL2lmIG9sZHN0YXRlIGhhcyBhZnRlciBtZXRob2QgLSBjYWxsIGl0XHJcblx0XHRcdFx0bGVhdmVSZXN1bHQgPSBnZXRWYWx1ZShvbGRTdGF0ZSwgU3RhdGUub3B0aW9ucy5sZWF2ZUNhbGxiYWNrLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuXHRcdFx0XHQvL2lnbm9yZSBjaGFuZ2luZyBpZiBsZWF2ZSByZXN1bHQgaXMgZmFsc3lcclxuXHRcdFx0XHRpZiAobGVhdmVSZXN1bHQgPT09IGZhbHNlKSB7XHJcblx0XHRcdFx0XHR0aGlzW2xlYXZlRmxhZ10gPSBmYWxzZTtcclxuXHRcdFx0XHRcdC8vIGNvbnNvbGUuZ3JvdXBFbmQoKTtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vcmVkaXJlY3QsIGlmIHJldHVybmVkIGFueXRoaW5nXHJcblx0XHRcdFx0ZWxzZSBpZiAobGVhdmVSZXN1bHQgIT09IHVuZGVmaW5lZCAmJiBsZWF2ZVJlc3VsdCAhPT0gdmFsdWUpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2V0KGxlYXZlUmVzdWx0KTtcclxuXHRcdFx0XHRcdHRoaXNbbGVhdmVGbGFnXSA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dGhpc1tsZWF2ZUZsYWddID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdC8vaWdub3JlIHJlZGlyZWN0XHJcblx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgIT09IG9sZFZhbHVlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdC8vaWdub3JlIG5vdCBjaGFuZ2VkIHZhbHVlXHJcblx0XHRpZiAodmFsdWUgPT09IG9sZFZhbHVlKSByZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0dGhpcy5pc0luaXQgPSB0cnVlO1xyXG5cdH1cclxuXHJcblxyXG5cdC8vc2V0IGN1cnJlbnQgdmFsdWVcclxuXHR0aGlzLnN0YXRlID0gdmFsdWU7XHJcblxyXG5cclxuXHQvL3RyeSB0byBlbnRlciBuZXcgc3RhdGVcclxuXHR2YXIgbmV3U3RhdGVOYW1lID0gc3RhdGVzW3ZhbHVlXSAhPT0gdW5kZWZpbmVkID8gdmFsdWUgOiBTdGF0ZS5vcHRpb25zLnJlbWFpbmRlclN0YXRlO1xyXG5cdHZhciBuZXdTdGF0ZSA9IHN0YXRlc1tuZXdTdGF0ZU5hbWVdO1xyXG5cdHZhciBlbnRlckZsYWcgPSBTdGF0ZS5vcHRpb25zLmVudGVyQ2FsbGJhY2sgKyBuZXdTdGF0ZU5hbWU7XHJcblx0dmFyIGVudGVyUmVzdWx0O1xyXG5cclxuXHRpZiAoIXRoaXNbZW50ZXJGbGFnXSkge1xyXG5cdFx0dGhpc1tlbnRlckZsYWddID0gdHJ1ZTtcclxuXHJcblx0XHRpZiAoaXNPYmplY3QobmV3U3RhdGUpKSB7XHJcblx0XHRcdGVudGVyUmVzdWx0ID0gZ2V0VmFsdWUobmV3U3RhdGUsIFN0YXRlLm9wdGlvbnMuZW50ZXJDYWxsYmFjaywgdGhpcy5jb250ZXh0KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGVudGVyUmVzdWx0ID0gZ2V0VmFsdWUoc3RhdGVzLCBuZXdTdGF0ZU5hbWUsIHRoaXMuY29udGV4dCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9pZ25vcmUgZW50ZXJpbmcgZmFsc3kgc3RhdGVcclxuXHRcdGlmIChlbnRlclJlc3VsdCA9PT0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5zZXQob2xkVmFsdWUpO1xyXG5cdFx0XHR0aGlzW2VudGVyRmxhZ10gPSBmYWxzZTtcclxuXHRcdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9yZWRpcmVjdCBpZiByZXR1cm5lZCBhbnl0aGluZyBidXQgY3VycmVudCBzdGF0ZVxyXG5cdFx0ZWxzZSBpZiAoZW50ZXJSZXN1bHQgIT09IHVuZGVmaW5lZCAmJiBlbnRlclJlc3VsdCAhPT0gdmFsdWUpIHtcclxuXHRcdFx0dGhpcy5zZXQoZW50ZXJSZXN1bHQpO1xyXG5cdFx0XHR0aGlzW2VudGVyRmxhZ10gPSBmYWxzZTtcclxuXHRcdFx0Ly8gY29uc29sZS5ncm91cEVuZCgpO1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpc1tlbnRlckZsYWddID0gZmFsc2U7XHJcblx0fVxyXG5cclxuXHJcblxyXG5cdC8vbm90aWZ5IGNoYW5nZVxyXG5cdGlmICh2YWx1ZSAhPT0gb2xkVmFsdWUpXHR7XHJcblx0XHR0aGlzLmVtaXQoU3RhdGUub3B0aW9ucy5jaGFuZ2VDYWxsYmFjaywgdmFsdWUsIG9sZFZhbHVlKTtcclxuXHR9XHJcblxyXG5cclxuXHQvLyBjb25zb2xlLmdyb3VwRW5kKCk7XHJcblxyXG5cdC8vcmV0dXJuIGNvbnRleHQgdG8gY2hhaW4gY2FsbHNcclxuXHRyZXR1cm4gdGhpcy5jb250ZXh0O1xyXG59O1xyXG5cclxuXHJcbi8qKiBHZXQgY3VycmVudCBzdGF0ZSAqL1xyXG5cclxucHJvdG8uZ2V0ID0gZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gdGhpcy5zdGF0ZTtcclxufTtcclxuXHJcblxyXG4vKiogUmV0dXJuIHZhbHVlIG9yIGZuIHJlc3VsdCAqL1xyXG5mdW5jdGlvbiBnZXRWYWx1ZShob2xkZXIsIG1ldGgsIGN0eCl7XHJcblx0aWYgKGlzRm4oaG9sZGVyW21ldGhdKSkge1xyXG5cdFx0cmV0dXJuIGhvbGRlclttZXRoXS5jYWxsKGN0eCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gaG9sZGVyW21ldGhdO1xyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZTsiLCJtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZFxuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5mdW5jdGlvbiBleHRlbmQodGFyZ2V0KSB7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXRcbn1cbiIsIi8qKlxyXG4gKiBAbW9kdWxlICBzb3VuZC1iYWNrZ3JvdW5kLWRlc2lnbmVyXHJcbiAqL1xyXG5cclxuXHJcbnZhciBBdWRpb0VsZW1lbnQgPSByZXF1aXJlKCcuL2xpYi9hdWRpby1lbGVtZW50Jyk7XHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCd4dGVuZC9tdXRhYmxlJyk7XHJcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XHJcbnZhciBjc3MgPSByZXF1aXJlKCdtdWNzcy9jc3MnKTtcclxudmFyIERyYWdnYWJsZSA9IHJlcXVpcmUoJ2RyYWdneScpO1xyXG52YXIgUmVzaXphYmxlID0gcmVxdWlyZSgncmVzaXphYmxlJyk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEZXNpZ25lcjtcclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIEF1ZGlvIGRlc2lnbmVyIGFwcFxyXG4gKi9cclxuZnVuY3Rpb24gRGVzaWduZXIgKG9wdGlvbnMpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdGV4dGVuZChzZWxmLCBvcHRpb25zKTtcclxuXHJcblx0Ly9lbnN1cmUgZWxlbWVudFxyXG5cdGlmICghc2VsZi5lbGVtZW50KSBzZWxmLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRzZWxmLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnc291bmQtYmFja2dyb3VuZC1kZXNpZ25lcicpO1xyXG5cclxuXHQvL2luaXQgbGlzdCBvZiBhdWRpb0VsZW1lbnRzXHJcblx0c2VsZi5hdWRpb0VsZW1lbnRzID0gW107XHJcblxyXG5cdC8vY3JlYXRlIERPTSBsYXlvdXRcclxuXHRzZWxmLmNyZWF0ZURPTSgpO1xyXG5cclxuXHQvL2NyZWF0ZSBmaXJzdCBmb3JtYW50XHJcblx0c2VsZi5jcmVhdGVBdWRpb0VsZW1lbnQoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgRE9NIGVsZW1lbnRzXHJcbiAqL1xyXG5EZXNpZ25lci5wcm90b3R5cGUuY3JlYXRlRE9NID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0Ly9jcmVhdGUgYXVkaW9FbGVtZW50cyBjb250YWluZXJcclxuXHRzZWxmLmF1ZGlvRWxlbWVudHNFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdHNlbGYuYXVkaW9FbGVtZW50c0VsLmNsYXNzTmFtZSA9ICdhdWRpby1lbGVtZW50cyc7XHJcblx0c2VsZi5lbGVtZW50LmFwcGVuZENoaWxkKHNlbGYuYXVkaW9FbGVtZW50c0VsKTtcclxuXHJcblx0Ly9jcmVhdGUgZm9ybWFudCBlZGl0b3JcclxuXHJcblx0Ly9jcmVhdGUgd2F2ZWZvcm0gdmlld2VyXHJcblxyXG5cdC8vY3JlYXRlIHNwZWN0cnVtIHZpZXdlclxyXG5cclxuXHQvL2NyZWF0ZSBzcGlyYWxsb2dyYW0gdmlld2VyXHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlIGF1ZGlvRWxlbWVudCwgYWRkIGl0IHRvIHRoZSB0YWJsZVxyXG4gKi9cclxuRGVzaWduZXIucHJvdG90eXBlLmNyZWF0ZUF1ZGlvRWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdHZhciBhdWRpb0VsZW1lbnQgPSBuZXcgQXVkaW9FbGVtZW50KCk7XHJcblxyXG5cdHNlbGYuYXVkaW9FbGVtZW50cy5wdXNoKGF1ZGlvRWxlbWVudCk7XHJcblxyXG5cdC8vY3JlYXRlIERPTSByZXByZXNlbnRhdGlvblxyXG5cdHZhciBhdWRpb0VsZW1lbnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdGF1ZGlvRWxlbWVudEVsLmNsYXNzTGlzdC5hZGQoJ2F1ZGlvLWVsZW1lbnQnKTtcclxuXHRzZWxmLmF1ZGlvRWxlbWVudHNFbC5hcHBlbmRDaGlsZChhdWRpb0VsZW1lbnRFbCk7XHJcblxyXG5cdC8vc2F2ZSBhdWRpb0VsZW1lbnQgb24gdGhlIGVsZW1lbnRcclxuXHRhdWRpb0VsZW1lbnRFbC5hdWRpb0VsZW1lbnQgPSBhdWRpb0VsZW1lbnQ7XHJcblxyXG5cdC8vcGxhY2UgYXVkaW9FbCBzbyB0byByZWZsZWN0IHRoZSBmcmVxdWVuY3lcclxuXHR2YXIgcmF0aW8gPSBhdWRpb0VsZW1lbnQuZnJlcXVlbmN5IC8gYXVkaW9FbGVtZW50Lm1heEZyZXF1ZW5jeTtcclxuXHRjc3MoYXVkaW9FbGVtZW50RWwsIHtcclxuXHRcdC8vIGxlZnQ6IHJhdGlvICogc2VsZi5hdWRpb0VsZW1lbnRzRWwub2Zmc2V0V2lkdGgsXHJcblx0XHQvLyB3aWR0aDpcclxuXHR9KTtcclxuXHJcblx0Ly9tYWtlIGF1ZGlvRWxlbWVudCBkcmFnZ2FibGVcclxuXHR2YXIgZHJhZ2dhYmxlID0gbmV3IERyYWdnYWJsZShhdWRpb0VsZW1lbnRFbCwge1xyXG5cdFx0d2l0aGluOiBzZWxmLmF1ZGlvRWxlbWVudHNFbCxcclxuXHRcdHRocmVzaG9sZDogMFxyXG5cdH0pO1xyXG5cclxuXHQvL2ZyZXFzIHJhbmdlIG9mIGF1ZGlvIGVsZW1lbnRcclxuXHR2YXIgZlJhbmdlID0gKGF1ZGlvRWxlbWVudC5tYXhGcmVxdWVuY3kgLSBhdWRpb0VsZW1lbnQubWluRnJlcXVlbmN5KTtcclxuXHJcblx0Ly9zZXQgcG9zaXRpb24gYWNjIHRvIHRoZSBmcmVxdWVuY3lcclxuXHRkcmFnZ2FibGUubW92ZShyYXRpbyAqIHNlbGYuYXVkaW9FbGVtZW50c0VsLm9mZnNldFdpZHRoLCAwKTtcclxuXHJcblx0Ly91cGRhdGUgZnJlcXVlbmN5IG9uIGRyYWdnYWJsZSBiZWluZyBkcmFnZ2VkXHJcblx0ZHJhZ2dhYmxlLm9uKCdkcmFnJywgZnVuY3Rpb24gKGUpIHtcclxuXHRcdHZhciB4ID0gZHJhZ2dhYmxlLmdldENvb3JkcygpWzBdO1xyXG5cdFx0dmFyIGYgPSBmUmFuZ2UgKiB4IC8gc2VsZi5hdWRpb0VsZW1lbnRzRWwub2Zmc2V0V2lkdGg7XHJcblxyXG5cdFx0Ly9yZWdlbmVyYXRlIGZyZXF1ZW5jeVxyXG5cdFx0Ly9UT0RPOiB1c2UgbG9nYXJpdGhtcyBoZXJlXHJcblx0XHRhdWRpb0VsZW1lbnQuZnJlcXVlbmN5ID0gZiB8fCAxO1xyXG5cdH0pO1xyXG5cclxuXHJcblx0Ly9tYWtlIHRodW1ibGVyIHJlc2l6YWJsZVxyXG5cdHZhciByZXNpemFibGUgPSBuZXcgUmVzaXphYmxlKGF1ZGlvRWxlbWVudEVsLCB7XHJcblx0XHQvLyB3aXRoaW46ICdwYXJlbnQnLFxyXG5cdFx0aGFuZGxlczogWydlJywgJ3cnXVxyXG5cdH0pO1xyXG5cclxuXHRyZXNpemFibGUub24oJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciB3ID0gYXVkaW9FbGVtZW50RWwub2Zmc2V0V2lkdGg7XHJcblx0XHR2YXIgcmF0aW8gPSB3IC8gc2VsZi5hdWRpb0VsZW1lbnRzRWwub2Zmc2V0V2lkdGg7XHJcblx0XHR2YXIgcVJhbmdlID0gcmF0aW8gKiBmUmFuZ2U7XHJcblxyXG5cdFx0YXVkaW9FbGVtZW50LnNldFF1YWxpdHkocVJhbmdlKTtcclxuXHR9KVxyXG5cclxuXHQvL1RPRE86IGltcGxlbWVudCB0aGlzIHVzaW5nIHNsaWR5IC0gZW5oYW5jZSBhbmQgZmluaXNoIHNsaWR5XHJcblx0Ly9jb3ZlciBzcGlyYWxzIGV0YywgYWxzbyBkZWJ1ZyB3aXRoIGRyYWdnYWJsZXNcclxuXHQvLyB2YXIgbWl4ZXJUcmFjayA9IFNsaWR5KG1peGVyVHJhY2tFbCwge1xyXG5cdC8vIFx0bWluOiBhdWRpb0VsZW1lbnQubWluRnJlcXVlbmN5LFxyXG5cdC8vIFx0bWF4OiBhdWRpb0VsZW1lbnQubWF4RnJlcXVlbmN5LFxyXG5cdC8vIFx0dmFsdWU6IGF1ZGlvRWxlbWVudC5mcmVxdWVuY3ksXHJcblx0Ly8gXHRvcmllbnRhdGlvbjogJ2hvcml6b250YWwnLFxyXG5cdC8vIFx0cGlja2VyOiBxKCcubWl4ZXItdGh1bWInLCBtaXhlclRyYWNrRWwpXHJcblx0Ly8gfSk7XHJcbn0iXX0=
