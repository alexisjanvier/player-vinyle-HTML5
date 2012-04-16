var turntablePlayerEngine = function () {};

turntablePlayerEngine.prototype = {

	/**
	 * Customizable parameters
	 * @type {Object}
	 */
	options: {
		paths: { // The path to needed folders
			audio: 'audio/',
			music: 'music/',
			playlists: 'playlists/',
			themes: ''
		},

		animateDelay : 2000, // Delay for the animations of the arm and the disc
		autoPlay : false, // Automatic turntable
		autoStop: 60000, // Duration in ms when the turntable auto-shutdowns when it turns with no track in manual mode
		endTransitionDuration: 0, // Duration in ms of the repetition of the end transition in manual mode
		buttonLabels: { // Customize the labels of the buttons
			powerON: 'I',
			powerOFF: 'O',
			next: '&#x27F3;'
		},
		easing: { // Easing customization
			start: '<',
			pause: 'cubic-bezier(.81, .79, .57, 1.01)',
			stop: 'cubic-bezier(.81, .79, .57, 1.01)'
		},
		enable: true, // Load on init
		debugMode : false, // Show log infos
		forceDateInUri : true, // Force the request to retrieve an updated playlist
		playerId: 'player', // Dom ID to use to build the player, if not found, the element will be created
		remoteId: 'remote', // Dom ID to use to build the remote, if not found, the element will be created
		playlistLocation: 'playlist.json', // Uri of the playlist in json format
		infos: ["duration", "timer"], // Choices : duration, current, timer, position
		logMethodNames: ["log", "debug", "warn", "info"], // Log informations in the console
		theme: 'wood', // The name of the theme
		useCover: true, // Display the cover panel
		useInfos: false, // Display the informations panel
		usePlaylist: false, // Display the playlist panel
		useTransitions: true, // Use the audio transitions

		themes : { // The list of the available themes with their settings
			wood: {
				cssClass: 'default wood',
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
				src: {
					mp3: 'start.mp3',
					ogg: 'start.ogg'
				}
			},
			stop: {
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
				}
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
	_disc: null,
	_discTitle: null,
	_nextButton: null,
	_player: null,
	_playlist: null,
	_transitionID: null,
	_wrapper: null,
	
	_powerButtons: {},
	_playlistButtons: {},
	_playlistInfos: {},
	_infos: {},
	_playerTransitions: {},

	_logMethods: [],
	_tracks: [],

	_armInPlace: false,
	_infosInit: false,
	_inRotation: false,
	_inTransition: false,
	_playerPaused: true,

	_armRotation: 0,
	_discRotation: 0,
	_playlistIndex: 0,
	_rpm: 45,
	_rpmTransition: 3,

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
	 * @return {Number}     Random number result
	 */
	getRandomArbitrary : function (min, max)  
	{  
	  return Math.random() * (max - min) + min;
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
				id = this.options.playerId,
				wrapper = document.getElementById(id)
			;
			if (!wrapper) {
				wrapper = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
				wrapper.id = id;
				document.body.appendChild(wrapper);
			}
			this._wrapper = wrapper;
			this.toggleClass(this._wrapper, this.options.themes[this.options.theme].cssClass, 'add');
			if (this.options.useInfos || this.options.usePlaylist)
				this.toggleClass(this._wrapper, 'with-infos', 'add');
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
				id = this.options.remoteId,
				remote = document.getElementById(id)
			;
			if (!remote) {
				remote = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
				remote.id = id;
				this.getWrapper().appendChild(remote);
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
		if (this.options.useInfos && this.options.infos.length && !this._infosInit) {
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
		this.initPowerButton();
		this.initNextButton();
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

			button.id = 'remote';
			button.id = 'power';
			this.toggleClass(button, 'power button', 'add');

			inputON.id = 'power-on';
			inputON.name = 'power';
			inputON.type = 'radio';
			inputOFF.id = 'power-off';
			inputOFF.name = 'power';
			inputOFF.type = 'radio';
			inputOFF.checked = true;

			labelON.htmlFor = inputON.id;
			labelON.innerHTML = this.options.buttonLabels.powerON;
			labelOFF.htmlFor = inputOFF.id;
			labelOFF.innerHTML = this.options.buttonLabels.powerOFF;

			inputON.addEventListener('click', function (event) {
				self.powerButtonClicked(event);
			}, false);
			inputOFF.addEventListener('click', function (event) {
				self.powerButtonClicked(event);
			}, false);

			button.appendChild(inputOFF);
			button.appendChild(labelOFF);
			button.appendChild(inputON);
			button.appendChild(labelON);
			this.getRemote().appendChild(button);

			this._powerButtons.inputON = inputON;
			this._powerButtons.labelON = labelON;
			this._powerButtons.inputOFF = inputOFF;
			this._powerButtons.labelOFF = labelOFF;
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

			button.id = 'next';
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
		if (this.options.usePlaylist && !this._playlist) {
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
				if (i == this._playlistIndex && this._powerON)
					this.toggleClass(button, 'active', 'add');
				button.innerHTML = this.getTrackTitle(i);
				button.data = i;
				playlist.appendChild(button);
				button.addEventListener('click', function (event) {
					self.playlistButtonClicked(event);
				}, false);

				this._playlistButtons[i] = button;
			}

			this._playlist = playlist;
			this._wrapper.appendChild(playlist);
			console.info('Playlist ok.');
		}
	},

	initCover : function () {
		if (this.options.useCover && !this._cover) {
			var 
				cover = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
			;
			this.toggleClass(cover, 'cover', 'add');
			this.getWrapper().appendChild(cover);

			this._cover = cover;

			this.updateCoverInfos();
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
				theme = this.options.themes[this.options.theme],
				paper = Raphael(
					turntable,
					turntable.offsetWidth, 
					turntable.offsetHeight),
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
					.attr('fill', theme.disc.axis.fill),
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
					console.info('FT events : ' + events + ' & arm rotation : ' + ft.attrs.rotate + 'deg.');
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
						self.playDiscArea({ force: true });
					}
					else if (events.indexOf('rotate end') != -1) {
						self.placeTheArmOffTheDisc();
					}
				},
				ft = paper.freeTransform(
					arm,
					{
						attrs: {
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
			this._discCover = discCover;
			this._discTitle = discTitle;
		}
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

		console.info('Remote disabled (' + s + ').');
	},

	/**
	 * Reset the remote control by removing the buttons, mostly called on re-init
	 */
	resetRemote : function () {
		for (var button in this._playlistButtons)
			delete this._playlistButtons[button];

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
	 * Update the cover with title, artist and tracks names
	 */
	updateCoverInfos : function () {
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
		if (this.options.useInfos && this.options.infos.indexOf('duration') != -1) {
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
		if (this.options.useInfos) {
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
		if (o.element && this.options.themes[this.options.theme].arm.turnable && (
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
	 * @param  {Object} options Settings
	 */
	placeTheArmOnTheDisc : function (options) {
		var 
			self = this,
			o = options || {}
		;

		this.disableRemote('start');
		o.enableRemote = true;

		if (this._armFt) {
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = this.options.themes[this.options.theme].arm.area.start;
			this._armFt.apply(function (ft) {
				console.info('Arm rotation : ' + ft.attrs.rotate + 'deg.');
				ft.setOpts({ animate: false }, self._armFtCallback);
				self._armInPlace = true;
				if (o.force) {
					delete o.force;
					self.play(o);
				}
				else
					this.enableRemote('start');
			});
		}
		else {
			this._armInPlace = true;
			this.play(o);
		}
	},

	/**
	 * Place the arm off the disc in order to be powered off
	 * @param  {Object} options Settings
	 */
	placeTheArmOffTheDisc : function (options) {
		var 
			self = this,
			o = options || {}
		;

		this.disableRemote('stop');
		o.enableRemote = true;

		if (this._armFt) {
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = 0;
			this._armFt.apply(function (ft) {
				console.info('Arm rotation : ' + ft.attrs.rotate + 'deg.');
				ft.setOpts({ animate: false }, self._armFtCallback);
				self._armInPlace = false;
				self._armRotation = ft.attrs.rotate;
				if (o.force) {
					delete o.force;
					self.end(o);
				}
				else
					self.enableRemote('stop');
			});
		}
		else {
			this._armInPlace = true;
			if (o.force) {
				delete o.force;
				self.end(o);
			}
			else
				self.enableRemote('stop');
		}
	},

	/**
	 * Switch on the turntable
	 */
	powerON : function () {
		console.info('POWER ON');

		this.switchOnTheButton();

		if (this.options.autoPlay)
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

		if (this.options.autoPlay)
			this.stopAuto();
		else
			this.stopManual();
	},

	/**
	 * Switch on the play/pause button
	 */
	switchOnTheButton : function () {
		this._powerON = true;

		if (this.options.usePlaylist)
			this.toggleClass(this._playlistButtons[this._playlistIndex], 'active', 'add');

		this.toggleClass(document.getElementById('power'), 'active', 'add');
		document.getElementById('power-on').checked = true;
	},

	/**
	 * Switch off the play/pause button
	 */
	switchOffTheButton : function () {
		this._powerON = false;

		if (this.options.usePlaylist)
			this.toggleClass(this._playlistButtons[this._playlistIndex], 'active', 'remove');

		this.toggleClass(document.getElementById('power'), 'active', 'remove');
		document.getElementById('power-off').checked = true;
	},

	/**
	 * Start the manual turntable
	 */
	startManual : function () {
		console.info('START MANUAL');

		this.startDiscRotation({ 
			easing: 'linear',
			transition: 'manualstart'
		});

		this.playDiscArea({ force: true });
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

		var self = this;

		this.startDiscRotation({ 
			easing: this.options.easing.start,
			transition: 'start'
		});

		this.placeTheArmOnTheDisc({
			force: true,
			transition: 'start'
		});
	},

	/**
	 * Stop the automatic turntable
	 */
	stopAuto : function () {
		console.info('STOP AUTO');
		
		var self = this;

		this.end({
			force: this.getArmArea() != 'end' ? true : false,
			transition: 'stop'
		});
	},

	/**
	 * Play the audio track or transition according to the arm position
	 * @param  {Object} options Settings
	 */
	playDiscArea : function (options) {
		console.info("DRAGGED'N'DROPPED");

		var area = this.getArmArea();

		if (this._powerON || (this.options.autoPlay && !this._powerON)) {
			this.switchOnTheButton();

			if (area == 'track') {
				this.play(options);
			}
			else if (area == 'start') {
				delete options.force;
				this.play(options);
			}
			else if (area == 'end') {
				delete options.force;
				this.end(options);
			}
		}
	},

	/**
	 * Play the audio track or the start transition
	 * @param  {Object} options Settings
	 */
	play : function (options) {
		console.info('PLAY');

		var o = options || {};

		o.transition = 'start';
		this.pauseTransitions();
		this.updateTrackInfos();
		this.updateInfos();

		if (o.force || !this.options.useTransitions) {
			if (this._powerON || (this.options.autoPlay && !this._powerON)) {
				this._player.play();
				this._playerPaused = false;
				this._armInPlace = true;

				this.switchOnTheButton();
				this.startDiscRotation({ transition: 'track' });

				if (o.enableRemote && !this.options.useTransitions)
					this.enableRemote('start');
			}
		}
		else {
			this.playTransition(o);
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
	 * @param  {Object} options Settings
	 */
	end : function (options) {
		console.info('END');

		var o = options || {};

		o.transition = 'stop';
		this.pauseTransitions();

		if (this._player.currentTime) {
			this.pause();
			this._player.currentTime = 0;
		}

		if (this._transitionID != undefined) {
			window.clearTimeout(this._transitionID);
			this._transitionID = null;
		}

		this.startDiscRotation({
			easing: this.options.easing.stop,
			withTransition: o.force ? !o.force : this.options.useTransitions,
			transition: o.force || this.options.autoPlay ? 'stop' : 'manualstop'
		});

		if (o.force || !this.options.useTransitions) {
			if (this.options.autoPlay)
				this.placeTheArmOffTheDisc({
					transition: 'stop'
				});

			if (o.enableRemote && !this.options.useTransitions)
				this.enableRemote('stop');

			if (o.withStart && this.options.autoPlay) {
				var self = this;
				this._transitionID = window.setTimeout(function () {
					self.updateTrackInfos();
					self.updateInfos();
					self.updateDiscInfos();
					self.powerON();
				}, parseInt(this._transitionTimer));
			}
			else
				this.switchOffTheButton();
		}
		else {
			if (!this.options.autoPlay && this.options.endTransitionDuration)
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

		this.end({ 
			force: true,
			withStart: true 
		});
	},

	/**
	 * Add the source to the audio element
	 * @param {Object} element The audio element
	 * @param {Mixed} src     The source(s) as string or object
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
	loadTrack : function (i) {
		if (this._tracks.length) {
			var
				i = i || 0,
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
	 * @param  {Object} element    The DOM node element
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
	 * @param  {Object} element    The DOM node element
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
		console.info('Transition "' + transition + '" event: loadedMetaData.');
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
		o.force = true;

		this.pauseTransitions();

		if (o.enableRemote)
			this.enableRemote(transition);

		if (useTransitions == true && this._playerTransitions[transition]) {
			console.info('Playing transition "' + transition + '".');

			var duration = o.duration || this.options.transitions[transition].duration;
			
			this._inTransition = true;
			this._playerTransitions[transition].currentTime = 0;
			this._playerTransitions[transition].play();
			this._transitionID = window.setTimeout(function () {
				if (transition == 'start')
					self.play(o);
				else if (transition == 'stop')
					self.end(o);
			}, parseInt(duration));
		}
		else if (this._playerTransitions[transition]) {
			if (transition == 'start')
				self.play(o);
			else if (transition == 'stop')
				self.end(o);
			else {
				var pos = this.getArmArea();
				if (pos != 'stop' && pos != undefined){
					this._playerTransitions[transition].currentTime = 0;
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
	 * Start the rotation of the disc according to the settings
	 */
	startDiscRotation : function (options) {
		this.stopDiscRotation();

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
			time = parseInt(this.options.autoStop) / 1000;
		else if (o.withTransition)
			time = parseInt(this.options.animateDelay + this.options.transitions[o.transition].duration) / 1000
		else
			time = this.options.animateDelay / 1000;	

		this._transitionTimer = time * 1000;

		var
			deg = parseInt(this._rpm * 360 * time / 60) + this._discRotation,
			ms = parseInt(time * 1000)
		;

		if (this._disc && this.options.themes[this.options.theme].disc.turnable)
			this._disc.animate({ transform: 'r' +	deg}, ms, 'linear', function () {
				self.updateDiscRotationIndex(this);
			});
		if (this.options.themes[this.options.theme].disc.title.turnable)
			this._discTitle.animate({ transform: 'r' +	deg}, ms, 'linear');
		if (this.options.themes[this.options.theme].disc.cover.turnable)
			this._discCover.animate({ transform: 'r' +	deg}, ms, 'linear');

		this._inRotation = true;

		console.info('Rotation "' + name + '": ' + deg + 'deg for ' + ms + 'ms.');
	},

	/**
	 * Stop all the disc rotations
	 */
	stopDiscRotation : function () {
		if (this._disc && this.options.themes[this.options.theme].disc.turnable)
			this.updateDiscRotationIndex(this._disc.stop());
		if (this._discTitle && this.options.themes[this.options.theme].disc.title.turnable)
			this._discTitle.stop();
		if (this._discCover && this.options.themes[this.options.theme].disc.cover.turnable)
			this._discCover.stop();

		this._inRotation = false;
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

			if (!this.options.autoPlay) {
				this.updateTrackInfos();
				this.updateInfos();
				this.updatePlayerPosition();
			}		

			if (this.options.autoPlay && (!this._playerPaused || this._inTransition))
				this.restart();
		}
	},

	/**
	 * Event 'loadedmetadata' called on media elements
	 */
	playerLoadedMetaData : function (event) {
		console.info('Audio player "' + event.target.id + '" event: loadedMetaData.');

		if (event.target.id == 'turntable-player') {
			if (!this.options.autoPlay){
				this.updateTrackInfos();
				this.updateInfos();
			}

			if (this._playerPaused == true)
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
			if (r.test(s))
				this._inTransition = false;
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
		if (!this._powerON)
			this.next();
	},

	/**
	 * Event 'click' called on the playlist tracks
	 */
	playlistButtonClicked : function (event) {
		if (event.target.data != undefined && this._powerON && (
			this.options.autoPlay
			|| (this._playerPaused && !this._inTransition)
		))
			this.loadTrack(event.target.data);
	}
};
