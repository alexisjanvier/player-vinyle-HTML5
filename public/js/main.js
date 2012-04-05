var turntablePlayerEngine = function () {};

turntablePlayerEngine.prototype = {

	/**
	 * Customizable parameters
	 * @type {Object}
	 */
	options: {
		enable: true, // Load on init
		animateDelay : 2000, // Delay for the animations of the arm and the disc
		debugMode : false, // Show log infos
		autoPlay : false, // Play at start
		mainId: 'player', // Dom ID to use to build the player
		playlistLocation: '/data/playlist.json', // Uri of the playlist in json format
		buttonLabels: { // Customize the labels of the buttons
			play: 'POWER ON',
			pause: 'POWER OFF'
		},
		easing: { // Easing customization
			start: '<',
			pause: 'cubic-bezier(.81, .79, .57, 1.01)',
			stop: 'cubic-bezier(.81, .79, .57, 1.01)'
		},
		infos: ["duration", "timer"], // Choices : duration, current, timer, position
		logMethodNames: ["log", "debug", "warn", "info"], // Log informations in the console
		theme: 'default', // The name of the theme
		themes : { // The list of the available themes with their settings
			default: {
				class: 'default',
				armSrc: 'img/vinyl-arm-200-314.png',
				// positions and radius
				paperX: 2,
				paperY: 2,
				armX: 230,
				armY: -90,
				armW: 63,
				armH: 314,
				armStart: 22,
				armEnd: 45,
				discX: 125,
				discY: 125,
				discR: 115,
				discFW: 140,
				discBgR: 117,
				discFgR: 55,
				discAxisR: 3,
				// colors
				discBg: '#000',
				discFurrows: '#111',
				discFg: '#666',
				discTitle: '#eee',
				discAxis: '#000',
				armBg: '#999',
				armFg: '#000',
				armNeedleBg: '#999',
				armNeedleFg: 'transparent'
			}
		},
		useTransitions: true,
		transitions: {
			start: {
				src: {
					mp3: '/audio/start.mp3',
					ogg: '/audio/start.ogg'
				}
			},
			stop: {
				src: {
					mp3: '/audio/stop.mp3',
					ogg: '/audio/stop.ogg'
				}
			}
		}
	},

	/**
	 * Reserved parameters which will be overriden
	 */
	_wrapper: null,
	_player: null,
	_playlist: null,
	_playlistIndex: 0,
	_buttons: {},
	_playPause: null,
	_playerPaused: null,
	_infos: {},
	_infosInit: null,
	_disc: null,
	_discTitle: null,
	_arm: null,
	_armFt: null,
	_armFtCallback: null,
	_armInPlace: null,
	_discRotation: 0,
	_armRotation: 0,
	_logMethods: [],
	_tracks: [],
	_rpm: 45,
	_rpmTransition: 3,
	_transitionID: null,
	_inTransition: null,
	_playerTransition: {},

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
		}
	},

	/**
	 * Override options with given ones
	 */
	setOptions : function (options) {
		if (options != {}) {
			for ( var i in options )
				this.options[i] = options[i];
		}
	},

	/**
	 * Disable/enable the console outputs according to the debugMode option
	 * @param  {Mixed} s the debugMode value
	 */
	loadLogger : function (s) {
		if (!window.console) window.console = {};
		var
			s = s || this.options.debugMode || false,
			methods = this.options.logMethodNames || ["log", "debug", "warn", "info"]
		;

		if (!s || s == 'false' || s == 0)
			this.options.debugMode = false;
		else if (s || s == 'true' || s == 1)
			this.options.debugMode = true;

		for (var i = 0; i < methods.length; i++) {
			if (!this.options.debugMode) {
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
	 * @return {Object}           The DOM node element
	 */
	toggleClass : function (element, className, operation) {
		if (!operation)
			return;

		if (typeof(element) == 'object' && element.length) {
			for (var el in element){
				this.toggleClass(element[el], className);
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
	 * @return {String}             The text response of the XHR
	 */
	getResponseXHR : function (httpRequest) {
		var self = this;
		try {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200) {
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
	getTrackTitle : function (i) {
		var
			i = i || this._playlistIndex,
			track = this._tracks[i]
		;

		return this.formatTrackTitle(track);
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
	 * @return {String}              The path of the arc string
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
	 * @return {String}              The path of the furrows
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
			uri = uri || this.options.playlistLocation,
			req = this.createXHR()
		;
		req.open("GET", uri, false);
		req.onreadystatechange = function () {
			var tracks = eval(self.getResponseXHR(req));
			if (typeof(tracks) == 'object' && tracks.length) {
				self._tracks = tracks;
				self.options.enable = true;
				self.load();
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
		if (!this._tracks.length && this.options.enable) {
			this.options.enable = false;
			this.getPlaylist();
		}

		return this.options.enable;
	},

	/**
	 * Get the turntable wrapper
	 * @return {Object} The DOM node element
	 */
	getWrapper : function () {
		if (!this._wrapper) {
			var 
				id = this.options.mainId,
				wrapper = document.getElementById(id)
			;
			if (!wrapper) {
				wrapper = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
				document.body.appendChild(wrapper);
			}
			this._wrapper = wrapper;
			this.toggleClass(this._wrapper, this.options.themes[this.options.theme].class, 'add');
		}

		return this._wrapper;
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
			this._wrapper = this.getWrapper();

			if (this.options.debugMode) {
				this._wrapper.appendChild(audio);
				audio.controls = 'controls';
			}
			audio.preload = 'metadata';
			audio.id = 'turntable-player';
			this._player = audio;
			this.loadTrack(this._playlistIndex);

			audio.addEventListener('loadedmetadata', function (event) {
				self.playerLoadedMetaData(event);
			}, false);
			audio.addEventListener('loadeddata', function (event) {
				self.playerLoadedData(event);
			}, false);
			audio.addEventListener('timeupdate', function (event) {
				self.playerTimeUpdated(event);
			}, false);
			audio.addEventListener('ended', function (event) {
				self.playerEnded(event);
			}, false);
		}
	},

	/**
	 * Init the audio transitions
	 * @return {[type]} [description]
	 */
	initTransitions : function () {
		if (this.options.useTransitions) {
			var
				start = document.createElementNS('http://www.w3.org/1999/xhtml', 'audio'),
				stop = document.createElementNS('http://www.w3.org/1999/xhtml', 'audio')
			;

			this._playerTransition.start = this.loadTransitionTracks(start, 'start');
			this._playerTransition.stop = this.loadTransitionTracks(stop, 'stop');
		}
	},

	/**
	 * Init the track informations
	 */
	initInfos : function () {
		if (this.options.infos.length && !this._infosInit) {
			var 
				infos = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
				a = {
					duration: 'Duration:', 
					current: 'Past time:', 
					timer: 'Time left:',
					position: 'Position:'
				}
			;

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

			this.toggleClass(infos, 'infos', 'add');
			this._wrapper.appendChild(infos);
			this._infosInit = true;
		}
	},

	/**
	 * Init the remote control
	 */
	initRemote : function () {
		if (!this._playPause) {
			var
				self = this,
				remote = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
				button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
			;

			remote.setAttribute('class', 'remote');

			this.toggleClass(button, 'playPauseButton', 'add');
			if (this.options.autoPlay) {
				button.innerHTML = this.options.buttonLabels.pause;
				button.data = true;
			}
			else {
				button.innerHTML = this.options.buttonLabels.play;
				button.data = false;
			}
			button.addEventListener('click', function (event) {
				self.playPauseButtonClicked(event);
			}, false);

			remote.appendChild(button);
			this._wrapper.appendChild(remote);

			this._playPause = button;
		}
	},

	/**
	 * Init the playlist
	 */
	initPlaylist : function () {
		if (!this._playlist) {
			var
				self = this,
				playlist = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
			;

			this.resetRemote();
			playlist.setAttribute('class', 'playlist');

			for (var i = 0; i < this._tracks.length; i++) {
				var
					button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
				;
				this.toggleClass(button, 'playlistButton', 'add');
				if (i == this._playlistIndex)
					this.toggleClass(button, 'active', 'add');
				button.innerHTML = this.getTrackTitle(i);
				button.data = i;
				playlist.appendChild(button);
				button.addEventListener('click', function (event) {
					self.playlistButtonClicked(event);
				}, false);

				this._buttons[i] = button;
			}

			this._playlist = playlist;
			this._wrapper.appendChild(playlist);
			console.info('Playlist ok.');
		}
	},

	/**
	 * Init the turntable disc
	 */
	initTurntable : function () {
		if (!this._disc) {
			var
				self = this,
				turntable = this.getWrapper(),
				paper = Raphael(
					turntable,
					turntable.offsetWidth, 
					turntable.offsetHeight),
				defs = document.getElementsByTagName('defs')[0],
				discShadow = paper
					.circle(
						this.options.themes[this.options.theme].discX,
						this.options.themes[this.options.theme].discY,
						this.options.themes[this.options.theme].discBgR + 10)
					.attr({
						'stroke': this.options.themes[this.options.theme].discBg,
						'fill': this.options.themes[this.options.theme].discBg,
						'opacity': .5 })
				discBg = paper
					.circle(
						this.options.themes[this.options.theme].discX,
						this.options.themes[this.options.theme].discY,
						this.options.themes[this.options.theme].discBgR)
					.attr('fill', this.options.themes[this.options.theme].discBg),
				disc = paper
					.path(this.getFurrowsPath(
						this.options.themes[this.options.theme].discX,
						this.options.themes[this.options.theme].discY,
						this.options.themes[this.options.theme].discFW,
						this.options.themes[this.options.theme].discR))
					.attr({ 
						'fill': this.options.themes[this.options.theme].discBg, 
						'stroke': this.options.themes[this.options.theme].discFurrows }),
				discFg = paper
					.circle(
						this.options.themes[this.options.theme].discX,
						this.options.themes[this.options.theme].discY,
						this.options.themes[this.options.theme].discFgR)
					.attr('fill', this.options.themes[this.options.theme].discFg),
					bbox = disc.getBBox(),
				discTitle = paper
					.text(
						bbox.x + bbox.width / 2,
						bbox.y + bbox.height / 2,
						this.getTrackTitleLineBreak())
					.attr({
						'fill': this.options.themes[this.options.theme].discTitle,
						'height': this.options.themes[this.options.theme].discFgR * 1.25,
						'width': this.options.themes[this.options.theme].discFgR * 1.25 }),
				discAxis = paper
					.circle(
						this.options.themes[this.options.theme].discX,
						this.options.themes[this.options.theme].discY,
						this.options.themes[this.options.theme].discAxisR)
					.attr('fill', this.options.themes[this.options.theme].discAxis),
				arm = paper
					.image(
						this.options.themes[this.options.theme].armSrc,
						this.options.themes[this.options.theme].armX,
						this.options.themes[this.options.theme].armY,
						this.options.themes[this.options.theme].armW,
						this.options.themes[this.options.theme].armH),
				ftCallback = function(ft, events) {
					console.info('FT events : ' + events + ' & arm rotation : ' + ft.attrs.rotate + 'deg.');
					self._armRotation = ft.attrs.rotate;
					if (events.indexOf('rotate') != -1) {
						self.pause();
						self.stopTransitionTracks();
					}
					else if (
						events.indexOf('rotate end') != -1
						&& ft.attrs.rotate > self.options.themes[self.options.theme].armStart
						&& ft.attrs.rotate < self.options.themes[self.options.theme].armEnd
					) {
						var
							percent = (ft.attrs.rotate - self.options.themes[self.options.theme].armStart) * 100 / (self.options.themes[self.options.theme].armEnd - self.options.themes[self.options.theme].armStart),
							currentTime = self._player.duration * percent / 100
						;
						self._player.currentTime = currentTime;
						self.start({ force: true });
						console.info('Player track is at ' + Math.floor(percent, 10) + '%.');
					}
					else if (events.indexOf('rotate end') != -1) {
						self.stop();
					}
				},
				ft = paper.freeTransform(
					arm,
					{
						attrs: {
							fill: this.options.themes[this.options.theme].armNeedleBg,
							stroke: this.options.themes[this.options.theme].armNeedleFg,
							opacity: 0
						},
						animate: false,
						delay: this.options.animateDelay,
						distance: .95,
						size: 20,
						drag: false,
						scale: false,
						rotateRange: [0, this.options.themes[this.options.theme].armEnd]
					},
					ftCallback
				)
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

			this._armFt = ft;
			this._armFtCallback = ftCallback;
			this._arm = arm;
			this._disc = disc;
			this._discTitle = discTitle;
		}
	},

	/**
	 * Enable the remote control
	 * @param  {String} s The message, mostly the name of the function calling this one
	 */
	enableRemote : function (s) {
		var s = s || '-';
		if (this._playPause)
			this._playPause.disabled = false;
		for (var button in this._buttons) {
			this._buttons[button].disabled = false;
		}
		console.info('Remote enabled (' + s + ').');
	},

	/**
	 * Disable the remote control
	 * @param  {String} s The message, mostly the name of the function calling this one
	 */
	disableRemote : function (s) {
		var s = s || '-';
		if (this._playPause)
			this._playPause.disabled = true;
		for (var button in this._buttons) {
			this._buttons[button].disabled = true;
		}
		console.info('Remote disabled (' + s + ').');
	},

	/**
	 * Reset the remote control by removing the buttons, mostly called on re-init
	 */
	resetRemote : function () {
		for (var button in this._buttons)
			delete this._buttons[button];

		console.info('Remote reset.');
	},

	/**
	 * Update the disc informations such as the title of the track
	 */
	updateDiscInfos : function () {
		if (this._discTitle)
			this._discTitle.attr('text', this.getTrackTitleLineBreak());
		
		console.info('Disc infos updated.');
	},

	/**
	 * Update the disc informations such as the duration of the track
	 */
	updateTrackInfos : function () {
		if (this.options.infos.indexOf('duration') != -1)
			this._infos['duration'].innerHTML = this.formatTime({
				mins: Math.floor(this._player.duration / 60, 10),
				secs: Math.floor(this._player.duration % 60 , 10)
			});

		console.info('Track infos updated.');
	},

	/**
	 * Update the disc informations such as the position of the track
	 */
	updateInfos : function () {
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
	},

	/**
	 * Update the disc arm according to the current position of the track
	 */
	updateDiscNeedlePosition : function () {
		if (this._armInPlace && this._playerPaused == false) {
			var
				rem = parseInt(this._player.duration - this._player.currentTime, 10),
				pos = (this._player.currentTime / this._player.duration) * 100,
				deg = pos * (this.options.themes[this.options.theme].armEnd - this.options.themes[this.options.theme].armStart) / 100
			;
			this._armFt.attrs.rotate = this.options.themes[this.options.theme].armStart + deg;
			this._armFt.apply();
			console.info('Arm rotation : ' + deg + 'deg.');
		}
	},

	/**
	 * Switch on the turntable
	 * @param  {Object} options Settings
	 */
	start : function (options) {
		console.info('START');
		var o = options || {};

		if (this._armInPlace != true && this._armRotation == 0) {
			this.startDiscTransitionRotation({ 
				easing: this.options.easing.start,
				transition: 'start'
			});
			var self = this;
			this.disableRemote('start');
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = this.options.themes[this.options.theme].armStart;
			this._armFt.apply(function (ft) {
				ft.setOpts({ animate: false }, self._armFtCallback);
				self.startTrack({ 
					startDiscTrackRotation: true,
					enableRemote: true 
				});
			});
			this._armInPlace = true;
			console.info('Arm rotation : ' + this.options.themes[this.options.theme].armStart + 'deg.');
		}
		else if (o.force)
			this.startTrack({ 
				force: true,
				startDiscTrackRotation: true
			});
		else if (this._playerPaused == true)
			this.startTrack();
		else
			this.startTrack({ startDiscTrackRotation: true });

		this.updateDiscInfos();
		this._playPause.innerHTML = this.options.buttonLabels.pause;
		this.toggleClass(this._playPause, 'active', 'add');
	},

	/**
	 * Pause the audio player
	 * @return {[type]} [description]
	 */
	pause : function () {
		console.info('PAUSE');
		if (this._playerPaused != true) {
			this._player.pause();
			this._playerPaused = true;
		}
	},

	/**
	 * Switch off the turntable
	 * @param  {Object} options Settings
	 */
	stop : function (options) {
		console.info('STOP');
		var 
			self = this,
			o = options || {};
		;
		o.transition = 'stop';

		this.stopTransitionTracks();

		if (this._player.currentTime) {
			this._player.pause();
			this._player.currentTime = 0;
		}

		if (this._playerPaused != true || this._inTransition) {
			this.startDiscTransitionRotation({ 
				easing: this.options.easing.stop,
				withTransition: o.force ? false : true,
				transition: 'stop'
			});
		}

		if (o.force && this._transitionID != undefined) {
			window.clearTimeout(this._transitionID);
			this._transitionID = null;
		}

		if (o.force || !this.options.useTransitions) {
			if (this._armFt) {
				this.disableRemote('stop');
				this._armFt.setOpts({ animate: true }, this._armFtCallback);
				this._armFt.attrs.rotate = 0;
				this._armFt.apply(function (ft) {
					ft.setOpts({ animate: false }, self._armFtCallback);
					o.enableRemote = true;
					self.stopTrackTransition(o);
				});
			}
			else {
				this.stopTrackTransition(o);
			}
		}
		else if (this._playerPaused != true) {
			this.startTransitionTrack(o);
		}
		
		if (this._playerPaused != true) {
			this._playerPaused = true;
		}
	},

	/**
	 * Switch OFF an then ON the turntable
	 */
	restart : function () {
		console.info('RESTART');
		this.stop({ withStart: true });
	},

	/**
	 * Load the track according to his index in the playlist
	 * @param  {Number} i The index of the track in the playlist
	 */
	loadTrack : function (i) {
		if (this._tracks.length) {
			var
				i = i || 0,
				track = this._tracks[i]
			;

			if (this._playerPaused == true || this._playerPaused == null)
				this.stop({ force: true });

			if (this._player.canPlayType('audio/mpeg') && track.src.mp3)
				this._player.src = track.src.mp3;
			else if (this._player.canPlayType('audio/ogg') && track.src.ogg)
				this._player.src = track.src.ogg;
			else if (typeof(option.src) == 'string')
				this._player.src = track.src;
			else
				console.error('Cannot load the track source.')
			this._player.load();
			this._playlistIndex = i;

			this.disableRemote('loadTrack');

			for (var button in this._buttons) {
				if (button == i)
					this.toggleClass(this._buttons[button], 'active', 'add');
				else
					this.toggleClass(this._buttons[button], 'active', 'remove');
			}

			console.info('Track #' + i + ' ok.');
		}
		else
			console.info('No track in the playlist.');
	},

	/**
	 * Start the audio track or the start transition
	 * @param  {Object} options Settings
	 */
	startTrack: function (options) {
		var o = options || {};

		o.transition = 'start';

		if (o.force || !this.options.useTransitions) {
			this._player.play();
			this._playerPaused = false;
			this._armInPlace = true;

			if (o.startDiscTrackRotation)
				this.startDiscTrackRotation();

			if (o.enableRemote && !this.options.useTransitions)
				this.enableRemote('start');
		}
		else {
			this.startTransitionTrack(o);
		}
	},

	/**
	 * Function called once the playlist is played and the animation finished
	 * @param  {Object} options Settings
	 */
	stopTrackTransition : function (options) {
		var o = options || {};

		this._armInPlace = false;
		this._armRotation = 0;

		if (o.enableRemote) {
			this.enableRemote('stop');
		}

		if (this._playPause && !o.withStart) {
			this._playPause.innerHTML = this.options.buttonLabels.play;
			this.toggleClass(this._playPause, 'active', 'remove');
		}

		if (o.withStart)
			this.start();
	},

	/**
	 * Load the transition played when the playlist starts and/or stops
	 * @param  {Object} element    The DOM node element
	 * @param  {String} transition The transition type
	 * @return {Object} The DOM node element
	 */
	loadTransitionTracks : function (element, transition) {
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

		element.addEventListener('ended', function (event) {
			self.playerEnded(event);
		}, false);

		element.id = 'turntable-player-transition-' + transition;
		element.preload = 'metadata';

		if (element.canPlayType('audio/mpeg') && option.src.mp3)
			element.src = option.src.mp3;
		else if (element.canPlayType('audio/ogg') && option.src.ogg)
			element.src = option.src.ogg;
		else if (typeof(option.src) == 'string')
			element.src = option.src;
		else
			console.error('Cannot load the track transition source of "' + transition + '".');

		element.load();

		console.info('Transition "' + transition + '" ok.')

		return element;
	},

	/**
	 * Update the duration time of the transitions
	 * @param  {Object} element    The DOM node element
	 */
	updateTransitionTrack : function (element) {
		var transition;

		if (element.id == 'turntable-player-transition-start')
			transition = 'start';
		else if (element.id == 'turntable-player-transition-stop')
			transition = 'stop';
		else if (element.id == 'turntable-player-transition-between')
			transition = 'between';

		this.options.transitions[transition].duration = element.duration * 1000;
		console.info('Transition "' + transition + '" event: loadedMetaData.');
	},

	/**
	 * Play the transition according to his name
 	 * @param  {Object} options Settings
	 */
	startTransitionTrack: function (options) {
		var 
			self = this,
			o = options || {},
			transition = o.transition || 'transition'
		;
		o.force = true;

		this.stopTransitionTracks();

		if (o.enableRemote)
			this.enableRemote(transition);

		if (this.options.useTransitions && this._playerTransition[transition]) {
			console.info('Playing transition "' + transition + '".');
			this._inTransition = true;
			this._playerTransition[transition].play();
			this._transitionID = window.setTimeout(function () {
				if (transition == 'start')
					self.startTrack(o);
				else if (transition == 'stop')
					self.stop(o);
			}, this.options.transitions[transition].duration);
		}
		else if (this._playerTransition[transition]) {
			if (transition == 'start')
				self.startTrack(o);
			else if (transition == 'stop')
				self.stop(o);
		}
	},

	/**
	 * Stop all the transitions
	 */
	stopTransitionTracks : function () {
		for (var t in this._playerTransition) {
			this._playerTransition[t].pause();
			this._playerTransition[t].currentTime = 0;
		}
	},

	/**
	 * Start the rotation of the disc according to the track
	 */
	startDiscTrackRotation : function () {
		this.stopDiscRotation();

		var
			self = this,
			rem = this._player.duration - this._player.currentTime,
			deg = parseInt(this._rpm * 360 * rem / 60) + this._discRotation,
			ms = parseInt(rem * 1000)
		;

		this._disc.animate({ transform: 'r' +	deg}, ms, 'linear', function () {
			self.updateDiscRotationIndex(this);
		});
		this._discTitle.animate({ transform: 'r' +	deg}, ms, 'linear');

		console.info('Rotation : ' + deg + 'deg for ' + ms + 'ms.');
	},

	/**
	 * Start the rotation of the disc according to the transition
 	 * @param  {Object} options Settings
	 */
	startDiscTransitionRotation : function (options) {
		if (this._disc && (
			this._inTransition
			|| (this._armRotation != 0 && this._discRotation != 0)
			|| (this._armInPlace != true && this._armRotation == 0)
		)) {		
			this.stopDiscRotation();

			var
				self = this,
				o = options || {},
				easing = o.easing || 'linear'
			;
			if (o.withTransition == undefined || !this.options.useTransitions)
			  o.withTransition = this.options.useTransitions;

			var
				delay = o.withTransition 
					? this.options.animateDelay + this.options.transitions[o.transition].duration
					: this.options.animateDelay,
				rem = delay / 1000,
				deg = parseInt(this._rpm * 360 * rem / 60) + this._discRotation,
				ms = parseInt(delay)
			;

			this._disc.animate({ transform: 'r' +	deg}, ms, easing, function () {
				self.updateDiscRotationIndex(this);
			});
			this._discTitle.animate({ transform: 'r' +	deg}, ms, easing);

			console.info('Transition : ' + deg + 'deg for ' + ms + 'ms with easing ' + easing + '.');
		}
	},

	/**
	 * Stop all the disc rotations
	 */
	stopDiscRotation : function () {
		if (this._disc)
			this.updateDiscRotationIndex(this._disc.stop());
		if (this._discTitle)
			this._discTitle.stop();
	},

	/**
	 * Get and update the index of the disc rotation
	 * @param  {Object} element The DOM node element
	 */
	updateDiscRotationIndex : function (element) {
		if (element) {
			var 
				t = element.transform(),
				rIndex = t[0] && t[0].indexOf('r') != -1 ? t[0].indexOf('r') : null,
				r = rIndex != null ? t[0][rIndex + 1] : null
			;

			if (r) {
				this._discRotation = parseInt(r);
				console.info('Disc rotation index is now : ' + this._discRotation + 'deg.')
			}
		}
	},

	/**
	 * Event 'loadeddata' called on media elements
	 */
	playerLoadedData : function (event) {
		console.info('Audio player "' + event.target.id + '" event: loadedData.');

		if (event.target.id == 'turntable-player') {
			this.enableRemote('playerLoaded');
			this.updateTrackInfos();
			this.updateInfos();

			if (this._playerPaused && this.options.autoPlay)
				this.start();
			else if (!this._playerPaused)
				this.restart();
		}
	},

	/**
	 * Event 'loadedmetadata' called on media elements
	 */
	playerLoadedMetaData : function (event) {
		console.info('Audio player "' + event.target.id + '" event: loadedMetaData.');

		if (event.target.id == 'turntable-player') {
			this.updateTrackInfos();
			this.updateInfos();
			if (this._playerPaused == true)
				this.updateDiscInfos();
		}
		else {
			var 
				r = /turntable-player-transition/i,
				s = event.target.id
			;
			if (r.test(s))
				this.updateTransitionTrack(event.target);
		}
	},

	/**
	 * Event 'ended' called on media elements
	 */
	playerEnded : function (event) {
		if (event.target.id == 'turntable-player') {
			console.info('Player event: ended.');
			this.stop();
		}
		else {
			var 
				r = /turntable-player-transition/i,
				s = event.target.id
			;
			if (r.test(s))
				this._inTransition = false;
		}
	},

	/**
	 * Event 'timeupdated' called on media elements
	 */
	playerTimeUpdated : function (event) {
		if (event.target.id == 'turntable-player') {
			this.updateDiscNeedlePosition();
			this.updateInfos();
		}
	},

	/**
	 * Event 'click' called on the play/pause button
	 */
	playPauseButtonClicked : function (event) {
		if (this._playerPaused == true && !this._inTransition)
			this.start();
		else
			this.stop({ force: true });
	},

	/**
	 * Event 'click' called on the playlist tracks
	 */
	playlistButtonClicked : function (event) {
		if (event.target.data)
			this.loadTrack(event.target.data);
	}
};
