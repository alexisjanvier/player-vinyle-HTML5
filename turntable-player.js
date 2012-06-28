String.prototype.ucfirst = function()
{
	return this.charAt(0).toUpperCase() + this.substr(1);
}

var turntablePlayerEngine = function () {};

turntablePlayerEngine.prototype = {

	/**
	 * Customizable parameters
	 * @type {Object}
	 */
	options: {
		enable: true,
		mode: 'automatic',

		debug : false,
		logMethodNames: ["log", "debug", "warn", "info"],

		paths: {
			audio: 'audio/',
			music: 'music/',
			playlists: 'playlists/',
			themes: ''
		},

		ids: {
			player: 'player',
			remote: 'remote',
			infos: 'infos',
			cover: 'cover',
			audioplayer: 'turntable-player',
			nextbutton: 'next',
			powerbutton: 'power',
			powerbuttonon: 'power-on',
			powerbuttonoff: 'power-off',
		},

		rpm: 45,
		animateDelay: 2000,
		autoStop: 600000,
		endTransitionDuration: 0,
		buttonLabels: {
			powerON: 'I',
			powerOFF: 'O',
			next: '&#x27F3;'
		},
		easing: {
			start: '<',
			pause: 'cubic-bezier(.81, .79, .57, 1.01)',
			stop: 'cubic-bezier(.81, .79, .57, 1.01)'
		},
		forceDateInUri : true,
		playlistLocation: 'playlist.json',
		infos: ["duration", "timer"],
		panels: {
			'cover': true,
			'infos': false,
			'playlist': false
		},

		useTransitions: true,
		useCssAnimations: true,
		useShadow: true,

		theme: 'wood',
		themes : {
			wood: {
				cssClass: 'default wood',
				dim: { w: 454, h: 255 },
				arm: {
					src: 'default/arm-200-314.png',
					turnable: true,
					area: {
						start: 19,
						from: 21,
						to: 41,
						end: 46
					},
					dim: {
						w: 65,
						h: 334
					},
					needle: {
						fill: '#000',
						stroke: 'transparent'
					},
					pos: {
						x: 230,
						y: -120
					}
				},
				disc: {
					fill: '#000',
					stroke: '#111',
					turnable: true,
					pos: {
						x: 125,
						y: 125
					},
					dim: {
						w: 235,
						h: 235
					},
					shadow: {
						r: 125,
						opacity: 0,
						fill: '#000',
						stroke: '#111'
					},
					furrows: {
						r: 113,
						size: 160,
						fill: '#000',
						stroke: '#111'
					},
					start: {
						r: 117,
					},
					end: {
						r: 60,
					},
					cover: {
						r: 45,
						fill: '#666',
						stroke: 'transparent',
						turnable: true,
						pos: {
							x: 80,
							y: 80
						},
						dim: {
							w: 90,
							h: 90
						}
					},
					title: {
						r: 45,
						fill: '#fff',
						stroke: '#666',
						turnable: true
					},
					axis: {
						r: 3,
						fill: '#000',
						stroke: '#000'
					}
				}
			},
			alu: {
				cssClass: 'default alu',
				dim: { w: 454, h: 255 },
				arm: {
					src: 'default/arm-200-314.png',
					turnable: true,
					area: {
						start: 19,
						from: 21,
						to: 41,
						end: 46
					},
					dim: {
						w: 65,
						h: 334
					},
					needle: {
						fill: '#000',
						stroke: 'transparent'
					},
					pos: {
						x: 230,
						y: -120
					}
				},
				disc: {
					fill: '#000',
					stroke: '#111',
					turnable: true,
					pos: {
						x: 125,
						y: 125
					},
					dim: {
						w: 235,
						h: 235
					},
					shadow: {
						r: 125,
						opacity: 0,
						fill: '#000',
						stroke: '#111'
					},
					furrows: {
						r: 115,
						size: 160,
						fill: '#000',
						stroke: '#151515'
					},
					start: {
						r: 117,
					},
					end: {
						r: 60,
					},
					cover: {
						r: 45,
						fill: '#666',
						stroke: 'transparent',
						turnable: false
					},
					title: {
						r: 45,
						fill: '#fff',
						stroke: '#666',
						turnable: true
					},
					axis: {
						r: 3,
						fill: '#000',
						stroke: '#000'
					}
				}
			}
		},
		transitions: {
			start: {
				loop: false,
				src: {
					mp3: 'start.mp3',
					ogg: 'start.ogg'
				}
			},
			stop: {
				loop: false,
				src: {
					mp3: 'stop2.mp3',
					ogg: 'stop2.ogg'
				}
			},
			drag: {
				loop: false,
				src: {
					mp3: 'drag.mp3',
					ogg: 'drag.ogg'
				},
				random: 5 // random of 1/5
			}
		}
	},

	/**
	 * Reserved parameters which will be overriden
	 */
	_arm: null,
	_armFt: null,
	_armFtCallback: null,
	_cover: null,
	_currentTheme: null,
	_disc: null,
	_discTitle: null,
	_mainWrapper: null,
	_nextButton: null,
	_player: null,
	_playlist: null,
	_wrapper: null,

	_cssAnimation: {},
	_infos: {},
	_playerTransitions: {},
	_playlistButtons: {},
	_playlistInfos: {},
	_powerButtons: {},

	_logMethods: [],
	_tracks: [],

	_armInPlace: false,
	_infosInit: false,
	_inRotation: false,
	_inTransition: false,
	_needRestart: false,
	_playerInit: false,
	_playerPaused: true,

	_armRotation: 0,
	_discRotation: 0,
	_playlistIndex: 0,

	/**
	 * Init the turntable
	 * @param  {Object} options Settings
	 */
	init : function (options) {
		this.setOptions(options);
		this.loadLogger();
		console.info('Init!');
		this.load();
	},

	/**
	 * Loads the turntable elements
	 */
	load : function () {
		console.info('Load!');
		if (this.check()) {
			this.initPlayer();
			this.initTransitions();
			this.initRemote();
			this.initPlaylist();
			this.initInfos();
			this.initTurntable();
			this.initCover();
			this.browserCompat();
		}
	},

	/**
	 * Override options with given ones
	 */
	setOptions : function (options) {
		if (typeof options == 'object' && options.length == undefined) {
			if (options.theme)
				this._currentTheme = this.options.theme;

			for ( var i in options ) {
				if (typeof options[i] == 'object' && options[i].length == undefined)
					for ( var j in options[i] )
						this.options[i][j] = options[i][j];
				else
					this.options[i] = options[i];
			}
		}

		this.updateInterface();
		this.loadLogger();
	},

	/**
	 * Disable/enable the console outputs according to the debug option
	 */
	loadLogger : function () {
		if (!window.console) window.console = {};
		var
			s = this.options.debug || false,
			methods = this.options.logMethodNames || ["log", "debug", "warn", "info"]
		;

		if (!s || s == 'false' || s == 0)
			this.options.debug = false;
		else if (s || s == 'true' || s == 1)
			this.options.debug = true;

		for (var i = 0; i < methods.length; i++) {
			if (!this.options.debug) {
				if (this._logMethods[methods[i]] == undefined)
					this._logMethods[methods[i]] = console[methods[i]];
				console[methods[i]] = function () {};
			}
			else if (this._logMethods[methods[i]] != undefined) {
				console[methods[i]] = this._logMethods[methods[i]];
			}
		}
	},

	/**
	 * Lets
	 * @param  {Object} element   The DOM node element
	 * @param  {String} className The class to toggle
	 * @param  {String  operation The operation status
	 * @return {Object}		   The DOM node element
	 */
	toggleClass : function (element, className, operation) {
		if (!operation)
			return;

		if (typeof(element) == 'object' && element.length) {
			for (var el in element) {
				this.toggleClass(element[el], className, operation);
			}
			return;
		}
		else if (className.split(' ').length > 1) {
			var classNames = className.split(' ');
			for (var c in classNames) {
				this.toggleClass(element, classNames[c], operation);
			}
			return;
		}

		var
			naturalClassName = element.getAttribute('class') ? element.getAttribute('class') : '',
			naturalClassNames = naturalClassName.split(' '),
			classIndex = naturalClassNames.indexOf(className)
		;

		if (classIndex > 0 && operation == 'remove')
			delete naturalClassNames[classIndex];
		else if (classIndex < 1 && operation == 'add')
			naturalClassNames.push(className);

		element.setAttribute('class', naturalClassNames.join(' '));

		return element;
	},

	/**
	 * Fix browsers compatibilities
	 */
	browserCompat : function () {
		if (this.isiOS()) {
			this.fixiOSlabels();
			this.disableTouchMove();
		}
	},

  /**
   * Check the compatible event name. Especially for touch events.
   */
  getEventCompatibilityName: function (eventName) {
	if (this.isiOS() && eventName == 'mouseleave')
	  eventName = 'touchend';
	else if (this.isiOS() && eventName == 'mousemove')
	  eventName = 'touchmove';

	return eventName;
  },

	/**
	 * Detect iOS
	 * @return {Boolean} iOS detection
	 */
	isiOS : function () {
		if (
			(navigator.userAgent.indexOf('iPhone') != -1)
			|| (navigator.userAgent.indexOf('iPod') != -1)
			|| (navigator.userAgent.indexOf('iPad') != -1)
		)
			return true;
		return false;
	},

	/**
	 * Fix iOS labels which FOR attributes are not linked to the INPUT
	 */
	fixiOSlabels : function () {
		function fix() {
			var
				labels = document.getElementsByTagName('label'),
				target_id,
				el;
			for (var i = 0; labels[i]; i++) {
				if (labels[i].getAttribute('for')) {
					labels[i].onclick = labelClick;
				}
			}
		};

		function labelClick() {
			var el = document.getElementById(this.getAttribute('for'));
			if (['radio', 'checkbox'].indexOf(el.getAttribute('type')) != -1) {
				el.setAttribute('selected', !el.getAttribute('selected'));
			}
			else {
				el.focus();
			}
		};

		return {
			fix: fix()
		}
	},

	/**
	 * Disable touch move event
	 */
	disableTouchMove : function () {
		document.ontouchmove = function (event) {
			return event.preventDefault();
		}
	},

	/**
	 * Enable touch move event
	 */
	enableTouchMove : function () {
		document.ontouchmove = function (event) {
			return event;
		}
	},

	/**
	 * Create a XHR object
	 * @return {Object} The XHR just created
	 */
	createXHR : function ()
	{
		var request = false;
		try {
			request = new ActiveXObject('Msxml2.XMLHTTP');
		}
		catch (err2) {
			try {
				request = new ActiveXObject('Microsoft.XMLHTTP');
			}
			catch (err3) {
				try {
					request = new XMLHttpRequest();
				}
				catch (err1)
				{
					request = false;
				}
			}
		}

		return request;
	},

	/**
	 * Get the response of the XHR
	 * @param  {Object} httpRequest The XHR object
	 * @return {String}			 The text response of the XHR
	 */
	getResponseXHR : function (httpRequest) {
		var self = this;
		try {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200 || httpRequest.status === 0) {
					return(httpRequest.responseText);
				} else {
					console.error('There was a problem with the request.');
				}
			}
		}
		catch( e ) {
			console.error('Caught Exception: ' + e.description);
		}
	},

	/**
	 * Get a random number according to the min and max numbers
	 * @param  {Number} min Minimum
	 * @param  {Number} max Maximum
	 * @return {Number}	 Random number result
	 */
	getRandomArbitrary : function (min, max)
	{
	  return Math.random() * (max - min) + min;
	},

	/**
	 * Get the rotation status, in degrees, of a DOM element
	 * @param  {Object} element The element to measure
	 * @return {Number}		 The rotation in degrees
	 */
	getRotationDegrees : function (element) {
		// get the computed style object for the element
		var style = window.getComputedStyle(element, null);
		// this string will be in the form 'matrix(a, b, c, d, tx, ty)'
		var transformString =
			style['-webkit-transform']
			|| style['WebkitTransform']
			|| style['-moz-transform']
			|| style['MozTransform']
			|| style['-ms-transform']
			|| style['MsTransform']
			|| style['-o-transform']
			|| style['OTransform']
			|| style['transform']
		;
		if (!transformString || transformString == 'none')
			return 0;
		var splits = transformString.split(',');
		// parse the string to get a and b
		var a = parseFloat(splits[0].substr(7));
		var b = parseFloat(splits[1]);
		// doing atan2 on b, a will give you the angle in radians
		var rad = Math.atan2(b, a);
		var deg = 180 * rad / Math.PI;
		// instead of having values from -180 to 180, get 0 to 360
		if (deg < 0) deg += 360;

		return deg;
	},

	/**
	 * Format the time of the track
	 * @param  {Object} t The time informations
	 * @return {String}   The formatted time
	 */
	formatTime : function (t) {
		return t.mins + ':' + (t.secs > 9 ? t.secs : '0' + t.secs);
	},

	/**
	 * Format the title of the track
	 * @param  {Object} t The track object
	 * @return {String}   The formatted title
	 */
	formatTrackTitle : function (t) {
		return t.artist + ' - ' + t.title;
	},

	/**
	 * Retrieve the track title according to his index in the playlist
	 * @param  {Number} i The index of the track in the playlist
	 * @see formatTrackTitle()
	 */
	getTrackTitle : function (index) {
		var
			i = typeof index == 'number' ? index : this._playlistIndex,
			track = this._tracks[i]
		;

		return this.formatTrackTitle(track);
	},

	/**
	 * Format the title of the track with dashes
	 * @see getTrackTitle()
	 * @return {String} The title of the track
	 */
	getTrackTitleDashed : function () {
		return this.getTrackTitle() + ' - ';
	},

	/**
	 * Format the title of the track with linebreaks instead of dashes
	 * @see getTrackTitle()
	 * @return {String} The title of the track
	 */
	getTrackTitleLineBreak : function () {
		return this.getTrackTitle().replace(' - ', '\n \n');
	},

	/**
	 * Create an arc string as a path for a SVG element
	 * @return {String}			  The path of the arc string
	 */
	arcString : function(startX, startY, endX, endY, radius1, radius2, angle, largeArcFlag) {
		// opts 4 and 5 are:
		// large-arc-flag: 0 for smaller arc
		// sweep-flag: 1 for clockwise

		largeArcFlag = largeArcFlag || 0;
		var arcSVG = [radius1, radius2, angle, largeArcFlag, 1, endX, endY].join(' ');
		return startX + ' ' + startY + " a " + arcSVG;
	},

	/**
	 * Create the furrows of the disc as a path for a SVG element
	 * @return {String}			  The path of the furrows
	 */
	getFurrowsPath : function (centerX, centerY, spacing, maxRadius) {
		var
			paselftributes = ['M', centerX, centerY],
			angle = 0,
			startX = centerX,
			startY = centerY
		;

		for (var radius = 0; radius < maxRadius; radius++) {
			angle += spacing;
			var endX = centerX + radius * Math.cos(angle * Math.PI / 180);
			var endY = centerY + radius * Math.sin(angle * Math.PI / 180);

			paselftributes.push(this.arcString(startX, startY, endX - startX, endY - startY, radius, radius, 0));
			startX = endX;
			startY = endY;
		}

		return paselftributes.join(' ');
	},

	/**
	 * Get a playlist thanks to his uri
	 * @param  {String} uri The uri of the playlist
	 */
	getPlaylist : function (uri) {
		var
			self = this,
			uri = uri || (this.options.paths.playlists + this.options.playlistLocation),
			req = this.createXHR()
		;

		if (this.options.forceDateInUri) {
			var
				r = /\?/i,
				now = new Date(),
				y = now.getFullYear(),
				m = now.getMonth(),
				d = now.getDate(),
				h = now.getHours(),
				i = now.getMinutes(),
				ymd = y + '-' + m + '-' + d + '-' + h + '-' + i
			;

			if (r.test(uri))
				uri += ('&' + ymd);
			else
				uri += ('?' + ymd);
		}

		req.open("GET", uri, false);
		req.onreadystatechange = function () {
			var
				response = eval(self.getResponseXHR(req))
			;
			if (typeof(response) == 'object' && response.length) {
				var
					playlist = response[0]
				;
				if (typeof(playlist) == 'object'
					&& typeof(playlist.tracks) == 'object' && playlist.tracks.length
				) {
					self._playlistInfos.title = playlist.title;
					self._playlistInfos.artist = playlist.artist;
					self._tracks = playlist.tracks;
					self.options.enable = true;
					self.load();
				}
				else {
					console.error('No well formatted playlist.');
				}
			}
		};
		req.send(null);
	},

	/**
	 * Load a new playlist thanks to his uri
	 * @param  {String} uri The uri of the playlist
	 */
	newPlaylist : function (uri) {
		this.getPlaylist(uri);
	},

	/**
	 * Check if the turntable can be loaded
	 * @return {Boolean} The status of the check
	 */
	check : function () {
		this._wrapper;
		if (!this._tracks.length && this.options.enable) {
			this.options.enable = false;
			this.getPlaylist();
		}

		return this.options.enable;
	},

	/**
	 * Update the interface with the selected panels
	 */
	updateInterface: function () {
		if (!this._mainWrapper)
			this.loadWrapper();
		var wrapper = this._mainWrapper;

		if (this._currentTheme != this.options.theme) {
			this.toggleClass(wrapper, this.options.themes[this._currentTheme].cssClass, 'remove');
			this._currentTheme = null;
		}
		this.toggleClass(wrapper, this.options.themes[this.options.theme].cssClass, 'add');

		this.toggleClass(wrapper, 'with-infos',
			this.options.panels.infos ? 'add' : 'remove'
		);
		if (this.options.panels.infos)
			this.initInfos();

		this.toggleClass(wrapper, 'with-playlist',
			this.options.panels.playlist ? 'add' : 'remove'
		);
		if (this.options.panels.playlist)
			this.initPlaylist();

		this.toggleClass(wrapper, 'with-cover',
			this.options.panels.cover ? 'add' : 'remove'
		);
		if (this.options.panels.cover && this._tracks.length)
			this.initCover();

		this.toggleClass(wrapper, 'with-shadow',
			this.options.useShadow ? 'add' : 'remove'
		);
	},

	/**
	 * Load the turntable wrapper
	 * @return {Object} The DOM node element
	 */
	loadWrapper : function () {
		if (!this._wrapper) {
			var
				id = this.options.ids.player,
				wrapper = document.getElementById(id),
				bg = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			;
			if (!wrapper) {
				wrapper = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
				wrapper.id = id;
				document.body.appendChild(wrapper);
			}
			this.toggleClass(bg, 'bg', 'add');
			wrapper.appendChild(bg);

			this._currentTheme = this.options.theme;
			this._wrapper = bg;
			this._mainWrapper = wrapper;
		}

		return this._wrapper;
	},

	/**
	 * Get the remote node
	 * @return {Object} The DOM node element
	 */
	getRemote : function () {
		if (!this._remote) {
			var
				id = this.options.ids.remote,
				remote = document.getElementById(id)
			;
			if (!remote) {
				remote = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
				remote.id = id;
				this._wrapper.appendChild(remote);
			}
			this._remote = remote;
			this.toggleClass(this._remote, 'remote', 'add');
		}

		return this._remote;
	},

	/**
	 * Init the audio player
	 */
	initPlayer : function () {
		if (!this._player) {
			var
				self = this,
				audio = document.createElementNS('http://www.w3.org/1999/xhtml', 'audio')
			;

			if (this.options.debug) {
				this._wrapper.appendChild(audio);
				audio.controls = 'controls';
			}
			audio.preload = 'metadata';
			audio.id = this.options.ids.audioplayer;
			this._player = audio;
			this.loadTrack(this._playlistIndex);

			this._player.addEventListener('loadedmetadata', function (event) {
				self.playerLoadedMetaData(event);
			}, false);
			this._player.addEventListener('loadeddata', function (event) {
				self.playerLoadedData(event);
			}, false);
			this._player.addEventListener('timeupdate', function (event) {
				self.playerTimeUpdated(event);
			}, false);
			this._player.addEventListener('ended', function (event) {
				self.playerEnded(event);
			}, false);
		}
	},

	/**
	 * Init the audio transitions
	 * @return {[type]} [description]
	 */
	initTransitions : function () {
		if (this.options.useTransitions && !this._playerTransitions.start) {

			this._playerTransitions.start = this.loadTransition(
				document.createElementNS('http://www.w3.org/1999/xhtml', 'audio'),
				'start'
			);
			this._playerTransitions.stop = this.loadTransition(
				document.createElementNS('http://www.w3.org/1999/xhtml', 'audio'),
				'stop'
			);
			this._playerTransitions.drag = this.loadTransition(
				document.createElementNS('http://www.w3.org/1999/xhtml', 'audio'),
				'drag'
			);
		}
	},

	/**
	 * Init the track informations
	 */
	initInfos : function () {
		if (this.options.panels.infos && this.options.infos.length) {
			var
				infos,
				a = {
					duration: 'Duration:',
					current: 'Past time:',
					timer: 'Time left:',
					position: 'Position:'
				}
			;

			infos = document.getElementById(this.options.ids.infos);
			if (!infos) {
				infos = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
				infos.id = this.options.ids.infos;
				this.toggleClass(infos, 'infos', 'add');
				this._wrapper.appendChild(infos);
			}

			infos.innerHTML = '';

			for (var i in a) {
				if (this.options.infos.indexOf(i) != -1) {
					var
						p = document.createElementNS('http://www.w3.org/1999/xhtml', 'p'),
						s = document.createElementNS('http://www.w3.org/1999/xhtml', 'span')
					;
					p.innerHTML = a[i];
					s.innerHTML = '-';
					p.appendChild(s);
					infos.appendChild(p);
					this._infos[i] = s;
				}
			}

			this._infosInit = true;
			this.updateTrackInfos();
			this.updateInfos();
		}
	},

	/**
	 * Init the remote control
	 */
	initRemote : function () {
		this.initPowerButton();
		this.initNextButton();
		this.browserCompat();
	},

	/**
	 * Add the power button in the remote panel
	 */
	initPowerButton : function () {
		if (!this._powerButtons.inputON) {
			var
				self = this,
				button = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
				inputON = document.createElementNS('http://www.w3.org/1999/xhtml', 'input'),
				labelON = document.createElementNS('http://www.w3.org/1999/xhtml', 'label'),
				inputOFF = document.createElementNS('http://www.w3.org/1999/xhtml', 'input'),
				labelOFF = document.createElementNS('http://www.w3.org/1999/xhtml', 'label')
			;

			button.id = this.options.ids.powerbutton;
			this.toggleClass(button, 'power button', 'add');

			inputON.id = this.options.ids.powerbuttonon;
			inputON.name = 'power';
			inputON.type = 'radio';
			inputOFF.id = this.options.ids.powerbuttonoff;
			inputOFF.name = 'power';
			inputOFF.type = 'radio';
			inputOFF.checked = true;

			labelON.htmlFor = inputON.id;
			labelON.innerHTML = this.options.buttonLabels.powerON;
			labelOFF.htmlFor = inputOFF.id;
			labelOFF.innerHTML = this.options.buttonLabels.powerOFF;

			button.appendChild(inputOFF);
			button.appendChild(labelOFF);
			button.appendChild(inputON);
			button.appendChild(labelON);
			this.getRemote().appendChild(button);

			this._powerButtons.inputON = inputON;
			this._powerButtons.labelON = labelON;
			this._powerButtons.inputOFF = inputOFF;
			this._powerButtons.labelOFF = labelOFF;

			inputON.addEventListener('click', function (event) {
				self.powerButtonClicked(event);
			}, false);
			inputOFF.addEventListener('click', function (event) {
				self.powerButtonClicked(event);
			}, false);
		}
	},

	/**
	 * Add the next button in the remote panel
	 */
	initNextButton : function () {
		if (!this._nextButton) {
			var
				self = this,
				button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
			;

			button.id = this.options.ids.nextbutton;
			this.toggleClass(button, 'next button', 'add');
			button.innerHTML = this.options.buttonLabels.next;

			button.addEventListener('click', function (event) {
				self.nextButtonClicked(event);
			}, false);

			this.getRemote().appendChild(button);

			this._nextButton = button;
		}
	},

	/**
	 * Init the playlist
	 */
	initPlaylist : function () {
		if (this.options.panels.playlist) {
			var
				self = this
			;
			if (!this._playlist) {
				var playlist = document.getElementById(this.options.ids.playlist);
				if (!playlist) {
					playlist = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
					this.toggleClass(playlist, 'playlist', 'add');
				}
				this._playlist = playlist;
				this._wrapper.appendChild(this._playlist);
			}
			this.resetRemote();

			for (var i = 0; i < this._tracks.length; i++) {
				if (!this._playlistButtons[i]) {
					var
						button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
					;
					this.toggleClass(button, 'playlistButton', 'add');
					if (i == this._playlistIndex && this._powerON)
						this.toggleClass(button, 'active', 'add');
					button.innerHTML = this.getTrackTitle(i);
					button.data = i;
					this._playlist.appendChild(button);
					button.addEventListener('click', function (event) {
						self.playlistButtonClicked(event);
					}, false);

					this._playlistButtons[i] = button;
				}
			}

			console.info('Playlist ok.');
		}
	},

	/**
	 * Init the cover panel
	 */
	initCover : function () {
		if (this.options.panels.cover) {

		 if (!this._cover) {
				var
					self = this,
					cover = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
				;
				this.toggleClass(cover, 'cover', 'add');
				this._mainWrapper.appendChild(cover);

				this._cover = cover;

				this._cover.addEventListener('click', function (event) {
					var r = /active/i;
					self.toggleClass(self._cover, 'active', r.test(self._cover.className) ? 'remove' : 'add');
				}, false);
			}
			else
				this.toggleClass(this._cover, 'active', 'remove');

			this.updateCoverInfos();
		}
	},

	/**
	 * Init the turntable disc
	 */
	initTurntable : function () {
		if (!this._disc) {
			this.checkCssAnimations();

			if (this.options.useCssAnimations)
				this.initTurntableDisc();
			else
				this.initTurntableDiscUsingSVG();

			this.initTurntableArm();
		}
	},

	/**
	 * Init the turntable disc with CANVAS
	 */
	initTurntableDisc : function () {
		var
			self = this,
			turntable = this._wrapper,
			theme = this.options.themes[this.options.theme],
			disc = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'),
			discTitle = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
		;

		// DISC
		this.toggleClass(disc, 'disc', 'add');
		disc.width = theme.disc.pos.x * 2;
		disc.height = theme.disc.pos.x * 2;
		var discCtx = disc.getContext('2d');

		// start
		discCtx.strokeStyle = theme.disc.fill;
		discCtx.beginPath();
		discCtx.arc(
			theme.disc.pos.x,
			theme.disc.pos.y,
			theme.disc.start.r,
			0,
			2 * Math.PI,
			false
		);
		discCtx.fill();

		// furrows bg
		discCtx.fillStyle = theme.disc.stroke;
		discCtx.beginPath();
		discCtx.arc(
			theme.disc.pos.x,
			theme.disc.pos.y,
			theme.disc.furrows.r,
			0,
			2 * Math.PI,
			false
		);
		discCtx.fill();

		// furrows fg
		var length = theme.disc.furrows.r - theme.disc.end.r;
		for (var i = theme.disc.furrows.r; i > theme.disc.end.r; i--) {
			if (i%2)
				discCtx.fillStyle = theme.disc.fill;
			  else
				discCtx.fillStyle = theme.disc.stroke;

				discCtx.beginPath();
				discCtx.arc(
					theme.disc.pos.x,
					theme.disc.pos.y,
					i,
					0,
					2 * Math.PI,
					false
				);

	  		discCtx.fill();
		}

		// end
		discCtx.fillStyle = theme.disc.fill;
		discCtx.beginPath();
		discCtx.arc(
			theme.disc.pos.x,
			theme.disc.pos.y,
			theme.disc.end.r,
			0,
			2 * Math.PI,
			false
		);
		discCtx.fill();

		// cover
		discCtx.fillStyle = theme.disc.cover.fill;
		discCtx.beginPath();
		discCtx.arc(
			theme.disc.pos.x,
			theme.disc.pos.y,
			theme.disc.cover.r,
			0,
			2 * Math.PI,
			false
		);
		discCtx.fill();

		// axis
		discCtx.fillStyle = theme.disc.axis.fill;
		discCtx.beginPath();
		discCtx.arc(
			theme.disc.pos.x,
			theme.disc.pos.y,
			theme.disc.axis.r,
			0,
			2 * Math.PI,
			false
		);
		discCtx.fill();

		turntable.appendChild(disc);
		this._disc = disc;

		// TITLE
		turntable.appendChild(discTitle);
		this._discTitle = discTitle;
		this.toggleClass(discTitle, 'discTitle', 'add');
		discTitle.width = theme.disc.pos.x * 2;
		discTitle.height = theme.disc.pos.x * 2;
	},

	/**
	 * Draw the title of the current track on the disc
	 */
	drawTitleAlongDisc : function () {
		var
			theme = this.options.themes[this.options.theme],
			discTitleCtx = this._discTitle.getContext('2d'),
			text = this.getTrackTitleDashed(),
			angle = Math.PI * 2,
			radius = 35
		;
		discTitleCtx.font = "bold 8px sans-serif";
		discTitleCtx.fillStyle = "#eee";
		discTitleCtx.clearRect(0, 0, this._discTitle.width, this._discTitle.height);
		discTitleCtx.save();
		discTitleCtx.translate(theme.disc.pos.x, theme.disc.pos.y);
		discTitleCtx.rotate(-1 * angle / 2);
		discTitleCtx.rotate(-1 * (angle / text.length) / 2);
		for (var n = 0; n < text.length; n++) {
			discTitleCtx.rotate(angle / text.length);
			discTitleCtx.save();
			discTitleCtx.translate(0, -1 * radius);
			var char = text[n];
			discTitleCtx.fillText(char, 0, 0);
			discTitleCtx.restore();
		}
		discTitleCtx.restore();
	},

	/**
	 * Init the turntable disc with SVG
	 */
	initTurntableDiscUsingSVG : function () {
		var
			self = this,
			theme = this.options.themes[this.options.theme],
			paper = Raphael(
				this._wrapper,
				theme.dim.w,
				theme.dim.h),
			defs = document.getElementsByTagName('defs')[0],
			discShadow = paper
				.circle(
					theme.disc.pos.x,
					theme.disc.pos.y,
					theme.disc.shadow.r)
				.attr({
					'stroke': theme.disc.shadow.stroke,
					'fill': theme.disc.shadow.fill,
					'opacity': theme.disc.shadow.opacity }),
			discStart = paper
				.circle(
					theme.disc.pos.x,
					theme.disc.pos.y,
					theme.disc.start.r)
				.attr('fill', theme.disc.fill),
			disc = paper
				.path(this.getFurrowsPath(
					theme.disc.pos.x,
					theme.disc.pos.y,
					theme.disc.furrows.size,
					theme.disc.furrows.r))
				.attr({
					'fill': theme.disc.furrows.fill,
					'stroke': theme.disc.furrows.stroke }),
			discEnd = paper
				.circle(
					theme.disc.pos.x,
					theme.disc.pos.y,
					theme.disc.end.r)
				.attr('fill', theme.disc.fill),
			discCover = theme.disc.cover.src
				? paper.image(
					this.options.paths.themes + theme.disc.cover.src,
					theme.disc.cover.pos.x,
					theme.disc.cover.pos.y,
					theme.disc.cover.dim.w,
					theme.disc.cover.dim.h)
				: paper.circle(
					theme.disc.pos.x,
					theme.disc.pos.y,
					theme.disc.cover.r)
					.attr({
						'fill': theme.disc.cover.fill,
						'stroke': theme.disc.cover.stroke
					}),
			bbox = disc.getBBox(),
			discTitle = paper
				.text(
					bbox.x + bbox.width / 2,
					bbox.y + bbox.height / 2,
					this.getTrackTitleLineBreak())
				.attr({
					'fill': theme.disc.title.fill,
					'height': theme.disc.title.r * 1.25,
					'width': theme.disc.title.r * 1.25 }),
			discAxis = paper
				.circle(
					theme.disc.pos.x,
					theme.disc.pos.y,
					theme.disc.axis.r)
				.attr('fill', theme.disc.axis.fill)
		;

		var
			gaussFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter"),
			feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur")
		;
		gaussFilter.setAttribute("id", "blur");
		defs.appendChild(gaussFilter);
		feGaussianBlur.setAttribute("in","SourceGraphic");
		feGaussianBlur.setAttribute("stdDeviation",6);
		gaussFilter.appendChild(feGaussianBlur);
		discShadow.node.setAttribute("filter", "url(#blur)");

		if (!this._paper)
			this._paper = paper;

		this._disc = disc;
		this._discCover = discCover;
		this._discTitle = discTitle;
	},

	/**
	 * Init the turntable arm
	 */
	initTurntableArm : function () {
		var
			self = this,
			theme = this.options.themes[this.options.theme],
			paper = this._paper || Raphael(
				this._wrapper,
				theme.dim.w,
				theme.dim.h),
			arm = theme.arm.src
				? paper.image(
					this.options.paths.themes + theme.arm.src,
					theme.arm.pos.x,
					theme.arm.pos.y,
					theme.arm.dim.w,
					theme.arm.dim.h)
				: paper.rect(
					theme.arm.pos.x,
					theme.arm.pos.y,
					theme.arm.dim.w,
					theme.arm.dim.h)
					.attr({
						'fill': theme.arm.fill,
						'stroke': theme.arm.stroke
					}),
			ftCallback = function(ft, events) {
				// console.info('FT events : ', events);
				self._armRotation = ft.attrs.rotate;
				if (events.indexOf('rotate start') != -1) {
					self.pause();
					self.pauseTransitions();
					self.playTransition({
						transition: 'drag',
						useTransitions: false
					});
				}
				else if (
					events.indexOf('rotate end') != -1
					&& ft.attrs.rotate >= self.options.themes[self.options.theme].arm.area.start
					&& ft.attrs.rotate <= self.options.themes[self.options.theme].arm.area.end
				) {
					self.updatePlayerPosition();
					self.playDiscArea(true);
				}
				else if (events.indexOf('rotate end') != -1 && ft.attrs.rotate != 0) {
					self.placeTheArmOffTheDisc();
				}
				else if (events.indexOf('animate end') != -1 && ft.attrs.rotate == 0) {
					ft.setOpts({ animate: false }, self._armFtCallback);
					self._armInPlace = false;
					self.end(true);

					if (self._needRestart) {
						self.updateTrackInfos();
						self.updateInfos();
						self.updateDiscInfos();
						self.powerON();
						self._needRestart = false;
					}
				}
				else if (events.indexOf('animate end') != -1) {
					ft.setOpts({ animate: false }, self._armFtCallback);
					self._armInPlace = true;
					if (self.getArmArea() != 'undefined') {
						self.play();
					}
					else
						self.enableRemote('start');
				}
			},
			ft = paper.freeTransform(
				arm,
				{
					attrs: {
						cursor: 'pointer',
						fill: theme.arm.needle.fill,
						stroke: theme.arm.needle.stroke,
						opacity: 0
					},
					animate: false,
					delay: this.options.animateDelay,
					distance: .95,
					size: 20,
					drag: false,
					scale: false,
					rotateRange: [0, theme.arm.area.end]
				},
				ftCallback
			)
		;

		this._armFt = ft;
		this._armFtCallback = ftCallback;
		this._arm = arm;
	},

	/**
	 * Enable the remote control
	 * @param  {String} s The message, mostly the name of the function calling this one
	 */
	enableRemote : function (s) {
		var s = s || '-';

		for (var button in this._powerButtons)
			this._powerButtons[button].disabled = false;

		for (var button in this._playlistButtons)
			this._playlistButtons[button].disabled = false;

		if (this._nextButton)
			this._nextButton.disabled = false;

		console.info('Remote enabled (' + s + ').');
	},

	/**
	 * Disable the remote control
	 * @param  {String} s The message, mostly the name of the function calling this one
	 */
	disableRemote : function (s) {
		var s = s || '-';

		for (var button in this._powerButtons)
			this._powerButtons[button].disabled = true;

		for (var button in this._playlistButtons)
			this._playlistButtons[button].disabled = true;

		if (this._nextButton)
			this._nextButton.disabled = true;

		console.info('Remote disabled (' + s + ').');
	},

	/**
	 * Reset the remote control by removing the buttons, mostly called on re-init
	 */
	resetRemote : function () {
		for (var button in this._playlistButtons) {
			this._playlist.removeChild(this._playlistButtons[button]);
			delete this._playlistButtons[button];
		}

		console.info('Remote reset.');
	},

	/**
	 * Update the disc informations such as the title of the track
	 */
	updateDiscInfos : function () {
		if (this._discTitle) {
			if (this.options.useCssAnimations)
				this.drawTitleAlongDisc();
			else
				this._discTitle.attr('text', this.getTrackTitleLineBreak());
		}

		console.info('Disc infos updated.');
	},

	/**
	 * Update the cover with title, artist and tracks names
	 */
	updateCoverInfos : function () {
		this._cover.innerHTML = '';

		if (this._playlistInfos.artist) {
			this.loadCoverLegend({
				label: this._playlistInfos.artist,
				cssClass: 'artist'
			});
		}

		if (this._playlistInfos.title) {
			this.loadCoverLegend({
				label: this._playlistInfos.title,
				cssClass: 'title'
			});
		}

		var parentNode = document.createElementNS('http://www.w3.org/1999/xhtml', 'ul');

		for (var i = 0; i < this._tracks.length; i++) {
			var track = document.createElementNS('http://www.w3.org/1999/xhtml', 'li');

			if (this._tracks[i].artist)
				this.loadCoverLegend({
					label: this._tracks[i].artist,
					cssClass: 'track-artist',
					parentNode: track,
					tag: 'strong'
				});
			if (this._tracks[i].title)
				this.loadCoverLegend({
					label: this._tracks[i].title,
					cssClass: 'track-title',
					parentNode: track,
					tag: 'span'
				});
			if (this._tracks[i].duration)
				this.loadCoverLegend({
					label: this._tracks[i].duration,
					cssClass: 'track-duration',
					parentNode: track,
					tag: 'span'
				});

			this.toggleClass(track, 'track', 'add');
			parentNode.appendChild(track);
		}

		this.toggleClass(parentNode, 'legend tracks', 'add');
		this._cover.appendChild(parentNode);

		console.info('Cover infos updated.');
	},

	/**
	 * Add the legend to the cover
	 * @param  {Object} options Settings
	 */
	loadCoverLegend : function (options) {
		var
			o = options || {},
			tag = o.tag || 'div'
			element = document.createElementNS('http://www.w3.org/1999/xhtml', tag)
		;

		element.innerHTML = o.label;
		this.toggleClass(element, 'legend ' + o.cssClass, 'add');
		if (o.parentNode)
			o.parentNode.appendChild(element);
		else
			this._cover.appendChild(element);
	},

	/**
	 * Update the disc informations such as the duration of the track
	 */
	updateTrackInfos : function () {
		if (this._player && this.options.panels.infos && this.options.infos.indexOf('duration') != -1) {
			this._infos['duration'].innerHTML = this.formatTime({
				mins: Math.floor(this._player.duration / 60, 10),
				secs: Math.floor(this._player.duration % 60 , 10)
			});

			console.info('Track infos updated.');
		}
	},

	/**
	 * Update the disc informations such as the position of the track
	 */
	updateInfos : function () {
		if (this._player && this.options.panels.infos && !isNaN(this._player.duration)) {
			var
				rem = parseInt(this._player.duration - this._player.currentTime, 10),
				pos = (this._player.currentTime / this._player.duration) * 100,
				mins = Math.floor(rem / 60, 10),
				secs = rem - mins * 60
			;

			if (this.options.infos.indexOf('position') != -1)
				this._infos['position'].innerHTML = Math.floor(pos, 10) + '%';

			if (this.options.infos.indexOf('current') != -1)
				this._infos['current'].innerHTML = this.formatTime({
					mins: Math.floor(this._player.currentTime / 60, 10),
					secs: Math.floor(this._player.currentTime % 60 , 10)
				});

			if (this.options.infos.indexOf('timer') != -1)
				this._infos['timer'].innerHTML = '-' + this.formatTime({
					mins: mins,
					secs: secs
				});
		}
	},

	/**
	 * Update the disc arm according to the current position of the track
	 * @param {Object} options Settings
	 */
	updateDiscNeedlePosition : function (options) {
		var o = options || {};
		if (o.element && !isNaN(o.element.duration) && !isNaN(o.element.currentTime)
			&& this.options.themes[this.options.theme].arm.turnable && (
				(o.name == 'track' && !this._playerPaused)
				|| (o.name == 'start' && this._inTransition)
				|| (o.name == 'end' && this._inTransition)
		)) {
			var from, to;
			if (o.name == 'track') {
				from = this.options.themes[this.options.theme].arm.area.from;
				to = this.options.themes[this.options.theme].arm.area.to;
			}
			else if (o.name == 'start') {
				from = this.options.themes[this.options.theme].arm.area.start;
				to = this.options.themes[this.options.theme].arm.area.from;
			}
			else if (o.name == 'end') {
				from = this.options.themes[this.options.theme].arm.area.to;
				to = this.options.themes[this.options.theme].arm.area.end;
			}

			var
				rem = parseInt(o.element.duration - o.element.currentTime, 10),
				pos = (o.element.currentTime / o.element.duration) * 100,
				deg = pos * (to - from) / 100,
				rotation = from + deg,
				random = rotation + this.getRandomArbitrary(-0.1, 0.15)
			;
			this._armFt.attrs.rotate = random;
			this._armFt.apply();
			console.info('Arm rotation "' + o.name + '" : ' + rotation + ' (' + random + ') deg.');
		}
	},
	/**
	 * Update the track current position according to the current position of the disc arm
	 */
	updatePlayerPosition : function () {
		var
			percent = (this._armRotation - this.options.themes[this.options.theme].arm.area.from) * 100 / (this.options.themes[this.options.theme].arm.area.to - this.options.themes[this.options.theme].arm.area.from),
			currentTime = this._player.duration * percent / 100
		;

		if (currentTime < 0) {
			percent = 0;
			currentTime = 0;
		}

		this._player.currentTime = currentTime;

		console.info('Player track is at ' + Math.floor(percent, 10) + '%.');
	},

	/**
	 * Get the name of the area where the arm is placed
	 * @return {String} The name of the area
	 */
	getArmArea : function () {
		var area;

		if (
			this._armRotation >= this.options.themes[this.options.theme].arm.area.from
			&& this._armRotation <= this.options.themes[this.options.theme].arm.area.to
		)
			area = 'track';
		else if (
			this._armRotation >= this.options.themes[this.options.theme].arm.area.start
			&& this._armRotation <= this.options.themes[this.options.theme].arm.area.from
		)
			area = 'start';
		else if (
			this._armRotation >= this.options.themes[this.options.theme].arm.area.to
			&& this._armRotation <= this.options.themes[this.options.theme].arm.area.end
		)
			area = 'end';
		else if (this._armRotation == 0)
			area = 'stop';

		console.info('The arm is at the position : "' + area + '".')
		return area;
	},

	/**
	 * Place the arm on the disc in order to be ready to play
	 */
	placeTheArmOnTheDisc : function () {
		this.disableRemote('start');

		if (this._armFt) {
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = this.options.themes[this.options.theme].arm.area.start;
			this._armFt.apply();
		}
		else {
			this._armInPlace = true;
			this.play();
			this.enableRemote('start');
		}
	},

	/**
	 * Place the arm off the disc in order to be powered off
	 */
	placeTheArmOffTheDisc : function () {
		if (this._armRotation != 0) {
			this.disableRemote('stop');

			if (this._armFt) {
				this._armFt.setOpts({ animate: true }, this._armFtCallback);
				this._armFt.attrs.rotate = 0;
				this._armFt.apply();
			}
			else {
				this._armInPlace = false;
				this.end(true);
			}
		}
	},

	/**
	 * Switch on the turntable
	 */
	powerON : function () {
		console.info('POWER ON');

		if (this._playerInit == false)
			this.loadTrack(this._playlistIndex);

		this.switchOnTheButton();

		if (this.options.mode == 'automatic')
			this.startAuto();
		else
			this.startManual();
	},

	/**
	 * Switch off the turntable
	 */
	powerOFF : function () {
		console.info('POWER OFF');

		this.switchOffTheButton();

		if (this.options.mode == 'automatic')
			this.stopAuto();
		else
			this.stopManual();
	},

	/**
	 * Switch on the play/pause button
	 */
	switchOnTheButton : function () {
		this._powerON = true;

		if (this.options.panels.playlist)
			this.toggleClass(this._playlistButtons[this._playlistIndex], 'active', 'add');

		this.toggleClass(document.getElementById('power'), 'active', 'add');
		document.getElementById('power-on').checked = true;
	},

	/**
	 * Switch off the play/pause button
	 */
	switchOffTheButton : function () {
		this._powerON = false;

		if (this.options.panels.playlist)
			this.toggleClass(this._playlistButtons[this._playlistIndex], 'active', 'remove');

		this.toggleClass(document.getElementById('power'), 'active', 'remove');
		document.getElementById('power-off').checked = true;
	},

	/**
	 * Start the manual turntable
	 */
	startManual : function () {
		console.info('START MANUAL');

		this.playDiscArea(true);

		this.startDiscRotation({
			easing: 'linear',
			transition: 'manualstart'
		});

	},

	/**
	 * Stop the manual turntable
	 */
	stopManual : function () {
		console.info('STOP MANUAL');

		this.startDiscRotation({
			easing: this.options.easing.stop,
			transition: 'stop',
			withTransition: false
		});

		if (this._playerPaused == false)
			this.pause();
		else if (this._inTransition)
			this.pauseTransitions();
	},

	/**
	 * Start the automatic turntable
	 */
	startAuto : function () {
		console.info('START AUTO');

		this.placeTheArmOnTheDisc();

		this.startDiscRotation({
			easing: this.options.easing.start,
			transition: 'start'
		});

	},

	/**
	 * Stop the automatic turntable
	 */
	stopAuto : function () {
		console.info('STOP AUTO');

		this.end(true);
	},

	/**
	 * Play the audio track or transition according to the arm position
	 * @param  {Boolean} avoidTransition Avoid use of transition or not
	 */
	playDiscArea : function (avoidTransition) {
		console.info("DRAGGED'N'DROPPED");

		var area = this.getArmArea();

		if (
			this._powerON
			|| this.options.mode == 'semiautomatic'
			|| (this.options.mode == 'automatic' && !this._powerON)
		) {
			this.switchOnTheButton();

			if (area == 'track') {
				this.play(avoidTransition);
			}
			else if (area == 'start') {
				this.play();
			}
			else if (area == 'end') {
				this.end();
			}
		}
	},

	/**
	 * Play the audio track or the start transition
	 * @param  {Boolean} avoidTransition Avoid use of transitions or not
	 */
	play : function (avoidTransition) {
		console.info('PLAY');

		if (!avoidTransition)
			avoidTransition = false;

		this.pauseTransitions();
		this.updateTrackInfos();
		this.updateInfos();

		if (avoidTransition || !this.options.useTransitions) {
			this.playTrack();
		}
		else {
			this.playTransition({ transition: 'start'});
		}
	},

	/**
	 * Play the track
	 */
	playTrack : function () {
		if (this._powerON || (this.options.mode == 'automatic' && !this._powerON)) {
			this._player.play();
			this._playerPaused = false;
			this._armInPlace = true;

			this.switchOnTheButton();
			this.startDiscRotation({ transition: 'track' });

			if (!this.options.useTransitions)
				this.enableRemote('start');
		}
	},

	/**
	 * Switch to the next track
	 */
	next: function () {
		console.info('NEXT');

		var next = this._tracks[this._playlistIndex + 1] != undefined
			? this._playlistIndex + 1
			: 0;

		this.loadTrack(next);
	},

	/**
	 * Stop the audio track and/or play the stop transition
	 * @param  {Boolean} avoidTransition Avoid use of transition or not
	 */
	end : function (avoidTransition) {
		console.info('END');

		if (!avoidTransition)
			avoidTransition = false

		var o = {};
		o.transition = 'stop';
		this.pauseTransitions();

		if (this._player.currentTime) {
			this.pause();
			this._player.currentTime = 0;
		}

		if (this.options.mode != 'manual')
			this.startDiscRotation({
				easing: this.options.easing.stop,
				withTransition: avoidTransition ? false : this.options.useTransitions,
				transition: avoidTransition || this.options.mode == 'automatic' ? 'stop' : 'manualstop'
			});

		if (avoidTransition || !this.options.useTransitions) {
			if (this.options.mode == 'automatic' && this._armRotation != 0)
				this.placeTheArmOffTheDisc();

			this.enableRemote('stop');

			if (!this._needRestart && this.options.mode != 'manual')
				this.switchOffTheButton();
		}
		else {
			if (this.options.mode != 'automatic' && this.options.endTransitionDuration)
				o.duration = this.options.endTransitionDuration;
			this.playTransition(o);
		}
	},

	/**
	 * Pause the audio player
	 */
	pause : function () {
		console.info('PAUSE');

		if (this._playerPaused != true) {
			this._player.pause();
			this._playerPaused = true;
		}
	},

	/**
	 * Stop and start the turntable
	 */
	restart : function () {
		console.info('RESTART');

		this._needRestart = true;
		this.end(true);
	},

	/**
	 * Add the source to the audio element
	 * @param {Object} element The audio element
	 * @param {Mixed} src	 The source(s) as string or object
	 */
	addSrcToAudio : function (element, src, type) {
		while (element.firstChild) {
		  element.removeChild(element.firstChild);
		}

		var
			path = this.options.paths[type],
			r = /http/i
		;

		if (typeof(src) == 'string') {
			source.src = r.test(src) ? src : path + src;
		}
		else {
			var source = document.createElementNS('http://www.w3.org/1999/xhtml', 'source');

			if (element.canPlayType('audio/mpeg') && src.mp3) {
				source.src = r.test(src.mp3) ? src.mp3 : path + src.mp3;
				source.type = 'audio/mpeg';
			}
			else if (element.canPlayType('audio/ogg') && src.ogg) {
				source.src = r.test(src.ogg) ? src.ogg : path + src.ogg;
				source.type = 'audio/ogg';
			}

			element.appendChild(source);
		}
	},

	/**
	 * Load the track according to his index in the playlist
	 * @param  {Number} i The index of the track in the playlist
	 */
	loadTrack : function (index) {
		if (this._tracks.length) {
			var
				i = typeof index == 'number' ? index : 0,
				track = this._tracks[i]
			;

			this.addSrcToAudio(this._player, track.src, 'music');

			this._player.load();
			this._playlistIndex = i;

			this.disableRemote('loadTrack');

			for (var button in this._playlistButtons) {
				if (button == i && this._powerON)
					this.toggleClass(this._playlistButtons[button], 'active', 'add');
				else if (button != i)
					this.toggleClass(this._playlistButtons[button], 'active', 'remove');
			}

			console.info('Track #' + i + ' ok.');
		}
		else
			console.info('No track in the playlist.');
	},

	/**
	 * Load the transition played when the playlist starts and/or stops
	 * @param  {Object} element	The DOM node element
	 * @param  {String} transition The transition type
	 * @return {Object} The DOM node element
	 */
	loadTransition : function (element, transition) {
		if (!element || !transition) {
			console.error('No transition track to load.')
			return;
		}

		var
			self = this,
			option = this.options.transitions[transition]
		;

		if (option.duration == undefined) {
			this.options.transitions[transition].duration = 0;
			element.addEventListener('loadedmetadata', function (event) {
				self.playerLoadedMetaData(event);
			}, false);
		}

		element.addEventListener('timeupdate', function (event) {
			self.playerTimeUpdated(event);
		}, false);
		element.addEventListener('ended', function (event) {
			self.playerEnded(event);
		}, false);

		element.id = 'turntable-player-transition-' + transition;
		element.preload = 'metadata';
		if (option.loop != false)
			element.loop = 'loop';

		this.addSrcToAudio(element, option.src, 'audio');

		element.load();

		console.info('Transition "' + transition + '" ok.')

		return element;
	},

	/**
	 * Update the duration time of the transitions
	 * @param  {Object} element	The DOM node element
	 */
	updateTransition : function (element) {
		var transition;

		if (element.id == 'turntable-player-transition-start')
			transition = 'start';
		else if (element.id == 'turntable-player-transition-stop')
			transition = 'stop';
		else if (element.id == 'turntable-player-transition-between')
			transition = 'between';
		else if (element.id == 'turntable-player-transition-drag')
			transition = 'drag';

		this.options.transitions[transition].duration = element.duration * 1000;
	},

	/**
	 * Play the transition according to his name
 	 * @param  {Object} options Settings
	 */
	playTransition: function (options) {
		var
			self = this,
			o = options || {},
			transition = o.transition || 'transition'
			useTransitions = o.useTransitions != undefined
				? o.useTransitions
				: this.options.useTransitions
		;

		this.pauseTransitions();

		this.enableRemote(transition);

		if (useTransitions == true && this._playerTransitions[transition]) {
			console.info('Playing transition "' + transition + '".');

			var duration = o.duration != undefined ? o.duration : this.options.transitions[transition].duration;

			this._inTransition = true;
			this._playerTransitions[transition].currentTime = 0;
			this._playerTransitions[transition].play();
		}
		else if (this._playerTransitions[transition]) {
			if (transition == 'start')
				self.play(true);
			else if (transition == 'stop')
				self.end(true);
			else if (this._powerON) {
				var pos = this.getArmArea();
				if (pos != 'stop' && pos != undefined){
					console.info('Playing transition "' + transition + '".');
					this._playerTransitions[transition].currentTime = 0;
					if (!this.options.transitions[transition].random
						|| this.getRandomArbitrary(0, this.options.transitions[transition].random) <= 1
					)
						this._playerTransitions[transition].play();
				}
			}
		}
	},

	/**
	 * Pause all the transitions
	 */
	pauseTransitions : function () {
		for (var t in this._playerTransitions) {
			this._playerTransitions[t].pause();
		}
		this._inTransition = false;
	},

	/**
	 * Stop all the transitions
	 */
	stopTransitions : function () {
		for (var t in this._playerTransitions) {
			this._playerTransitions[t].pause();
			this._playerTransitions[t].currentTime = 0;
		}
	},

	/**
	 * Check if the css animation can be done on this browser
	 * @return {[type]} [description]
	 */
	checkCssAnimations : function () {
		if (this.options.useCssAnimations) {
			var
				animation = false,
				animationstring = 'animation',
				animationPlayState = 'animationPlayState',
				domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
				keyframeprefix = '',
				pfx  = '',
				turntable = this._wrapper
			;

			this._cssAnimation.animationstring = animationstring;
			this._cssAnimation.animationPlayState = animationPlayState;
			this._cssAnimation.keyframeprefix = keyframeprefix;
			this._cssAnimation.pfx = pfx;

			if (turntable.style.animationName)
				animation = true;

			if (animation === false) {
				for ( var i = 0; i < domPrefixes.length; i++ ) {
					if (turntable.style[ domPrefixes[i] + 'AnimationName' ] !== undefined) {
						pfx = domPrefixes[ i ];
						keyframeprefix = '-' + pfx.toLowerCase() + '-';

						this._cssAnimation.animationstring = pfx + animationstring.ucfirst();
						this._cssAnimation.animationPlayState = pfx + animationPlayState.ucfirst();
						this._cssAnimation.keyframeprefix = keyframeprefix;
						this._cssAnimation.pfx = pfx;

						animation = true;

						break;
					}
				}
			}

			if (animation === false)
				this.options.useCssAnimations = false;
		}

		return this.options.useCssAnimations;
	},

	/**
	 * Calculate the full duration of rotation of the disc
	 * @return {Number} The duration
	 */
	calculatePlayRemainingTime : function () {
		var
			area = this.getArmArea(),
			time = 0
		;

		// first animation
		if (area == 'stop' || area == 'undefined')
			time += (this.options.animateDelay / 1000);

		// start transition
		if (area != 'track' || area != 'end')
			time += (this._playerTransitions['start'].duration - this._playerTransitions['start'].currentTime);

		// track
		if (area != 'end')
			time += (this._player.duration - this._player.currentTime);

		// stop transition
		time += (this._playerTransitions['stop'].duration - this._playerTransitions['stop'].currentTime);

		// last animation
		time += (this.options.animateDelay / 1000);

		return time;
	},

	/**
	 * Start the rotation of the disc according to the settings
	 */
	startDiscRotation : function (options) {
		var
			self = this,
			o = options || {},
			easing = o.easing || 'linear',
			name = o.transition || 'none',
			time = o.duration || 0
		;

		if (o.withTransition == undefined || !this.options.useTransitions)
		  o.withTransition = this.options.useTransitions;

		if (name == 'track')
			time = this._player.duration - this._player.currentTime;
		else if (name == 'manualstart' || name == 'manualstop')
			time = this.options.autoStop / 1000;
		else if (o.withTransition)
			time = this.options.animateDelay + this.options.transitions[name].duration / 1000
		else
			time = this.options.animateDelay / 1000;

		var
			deg = parseInt(this.options.rpm * 360 * time / 60) + this._discRotation,
			s = time + 1
		;

		if (this.options.useCssAnimations)
			this.startDiscRotationUsingCSS(deg, s);
		else
			this.startDiscRotationUsingSVG(deg, s);

		this._inRotation = true;

		console.info('Rotation "' + name + '": ' + deg + 'deg for ' + s + 's.');
	},

	/**
	 * Start the rotation of the disc using CSS
	 */
	startDiscRotationUsingCSS: function (deg, s) {
		s = Math.round(s * 100) / 100;

		this._cssAnimation.rotationIteration = 360;

		var
			anim = 'rotate' + deg + ' ' + s + 's linear forwards',
			keyframes =
				'@' + this._cssAnimation.keyframeprefix + 'keyframes rotate' + deg + ' {'
				+ 'from {' + this._cssAnimation.keyframeprefix + 'transform: rotate(' + this._discRotation + 'deg) }'
				+ 'to {' + this._cssAnimation.keyframeprefix + 'transform: rotate(' + deg + 'deg) }'
				+ '}'
		;

		if (document.styleSheets && document.styleSheets.length)
			document.styleSheets[0].insertRule(keyframes, 0);
		else {
			var st = document.createElement('style');
			st.innerHTML = keyframes;
			document.getElementsByTagName('head')[0].appendChild(st);
		}

		if (this._disc && this.options.themes[this.options.theme].disc.turnable) {
			this._disc.style[this._cssAnimation.animationPlayState] = 'running';
			this._disc.style[this._cssAnimation.animationstring] = anim;
		}

		if (this._discTitle && this.options.themes[this.options.theme].disc.title.turnable) {
			this._discTitle.style[this._cssAnimation.animationPlayState] = 'running';
			this._discTitle.style[this._cssAnimation.animationstring] = anim;
		}
	},

	/**
	 * Start the rotation of the disc using SVG
	 */
	startDiscRotationUsingSVG: function (deg, s) {
		var ms = parseInt(s * 1000);

		if (this._disc && this.options.themes[this.options.theme].disc.turnable)
			this._disc.animate({ transform: 'r' +	deg}, ms, 'linear', function () {
				self.updateDiscRotationIndex(this);
			});

		if (this._discTitle && this.options.themes[this.options.theme].disc.title.turnable)
			this._discTitle.animate({ transform: 'r' +	deg}, ms, 'linear');

		if (this._discCover && this.options.themes[this.options.theme].disc.cover.turnable)
			this._discCover.animate({ transform: 'r' +	deg}, ms, 'linear');

	},

	/**
	 * Stop all the disc rotations
	 */
	stopDiscRotation : function () {
		if (this.options.useCssAnimations)
			stopDiscRotationUsingCSS();
		else
			stopDiscRotationUsingSVG();

		this._inRotation = false;
	},

	/**
	 * Stop all the disc rotations using CSS
	 */
	stopDiscRotationUsingCSS : function () {
		if (this._disc && this.options.themes[this.options.theme].disc.turnable)
			this._disc.style[this._cssAnimation.animationPlayState] = 'paused';

		if (this._discTitle && this.options.themes[this.options.theme].disc.title.turnable)
			this._discTitle.style[this._cssAnimation.animationPlayState] = 'paused';

		this.updateDiscRotationIndex(this._disc);
	},

	/**
	 * Stop all the disc rotations using SVG
	 */
	stopDiscRotationUsingSVG : function () {
		if (this._disc && this.options.themes[this.options.theme].disc.turnable)
			this.updateDiscRotationIndex(this._disc.stop());

		if (this._discTitle && this.options.themes[this.options.theme].disc.title.turnable)
			this._discTitle.stop();

		if (this._discCover && this.options.themes[this.options.theme].disc.cover.turnable)
			this._discCover.stop();
	},

	/**
	 * Get and update the index of the disc rotation
	 * @param  {Object} element The DOM node element
	 */
	updateDiscRotationIndex : function (element) {
		if (element && this._inRotation) {
			if (this.options.useCssAnimations)
				updateDiscRotationIndexUsingCSS(element);
			else
				updateDiscRotationIndexUsingSVG(element);
		}
	},

	/**
	 * Get and update the index of the disc rotation using CSS
	 * @see updateDiscRotationIndex
	 */
	updateDiscRotationIndexUsingCSS : function (element) {
		this._discRotation = parseInt(this.getRotationDegrees(this._disc));
		console.info('Disc rotation index is now : ' + this._discRotation + 'deg.');
	},

	/**
	 * Get and update the index of the disc rotation using SVG
	 * @see updateDiscRotationIndex
	 */
	updateDiscRotationIndexUsingSVG : function (element) {
		var
			t = element.transform(),
			rIndex = t[0] && t[0].indexOf('r') != -1 ? t[0].indexOf('r') : null,
			r = rIndex != null ? t[0][rIndex + 1] : null
		;

		if (r) {
			this._discRotation = parseInt(r);
			console.info('Disc rotation index is now : ' + this._discRotation + 'deg.')
		}
	},

	/**
	 * Event 'loadeddata' called on media elements
	 */
	playerLoadedData : function (event) {
		console.info('Audio player "' + event.target.id + '" event: loadedData.');

		if (event.target.id == 'turntable-player') {
			this.enableRemote('playerLoaded');

			if (this.options.mode != 'automatic') {
				this.updateTrackInfos();
				this.updateInfos();
				this.updatePlayerPosition();
			}

			if (this.options.mode == 'automatic' && (!this._playerPaused || this._inTransition))
				this.restart();
		}
	},

	/**
	 * Event 'loadedmetadata' called on media elements
	 */
	playerLoadedMetaData : function (event) {
		console.info('Audio player "' + event.target.id + '" event: loadedMetaData.');

		if (event.target.id == 'turntable-player') {
			this._playerInit = true;

			if (this.options.mode != 'automatic') {
				this.updateTrackInfos();
				this.updateInfos();
			}

			if (this.options.mode != 'automatic'
				|| (this.options.mode == 'automatic' && this._playerPaused && !this._inTransition)
			)
				this.updateDiscInfos();
		}
		else {
			var
				r = /turntable-player-transition/i,
				s = event.target.id
			;
			if (r.test(s))
				this.updateTransition(event.target);
		}
	},

	/**
	 * Event 'ended' called on media elements
	 */
	playerEnded : function (event) {
		if (event.target.id == 'turntable-player' && !this._playerPaused) {
			console.info('Player event: ended.');
			this.end();
		}
		else {
			var
				r = /turntable-player-transition/i,
				s = event.target.id
			;
			if (r.test(s)) {
				this._inTransition = false;
				if (event.target.id == 'turntable-player-transition-start')
					this.play(true);
				else if (event.target.id == 'turntable-player-transition-stop')
					this.end(true);
			}
		}
	},

	/**
	 * Event 'timeupdated' called on media elements
	 */
	playerTimeUpdated : function (event) {
		if (event.target.id == 'turntable-player') {
			this.updateDiscNeedlePosition({
				name: 'track',
				element: this._player
			});
			this.updateInfos();
		}
		else if (this._playerPaused && this._inTransition) {
			if (event.target.id == 'turntable-player-transition-start') {
				this.updateDiscNeedlePosition({
					name: 'start',
					element: this._playerTransitions.start
				});
			}
			else if (event.target.id == 'turntable-player-transition-stop') {
				this.updateDiscNeedlePosition({
					name: 'end',
					element: this._playerTransitions.stop
				});
			}
		}
	},

	/**
	 * Event 'click' called on the power button
	 */
	powerButtonClicked : function (event) {
		if (this._powerON && event.target.id == 'power-off')
			this.powerOFF();
		else if (!this._powerON && event.target.id == 'power-on')
			this.powerON();
	},

	/**
	 * Event 'click' called on the next button
	 */
	nextButtonClicked : function (event) {
		if (!this._powerON || this.options.mode == 'automatic')
			this.next();
	},

	/**
	 * Event 'click' called on the playlist tracks
	 */
	playlistButtonClicked : function (event) {
		if (event.target.data != undefined && this._powerON && (
			this.options.mode == 'automatic'
			|| (this._playerPaused && !this._inTransition)
		))
			this.loadTrack(event.target.data);
	}
};
