var turntablePlayerEngine = function () {};

turntablePlayerEngine.prototype = {

	// parameters
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
		logMethodNames: ["log", "debug", "warn", "info"]
	},

	// reserved parameters which will be overriden
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

	// functions
	init : function (options) {
		this.setOptions(options);
		this.loadLogger();
		console.info('Init!');
		this.load();
	},

	load : function () {
		console.info('Load!');
		if (this.check()) {
			this.initPlayer();
			this.initRemote();
			this.initPlaylist();
			this.initInfos();
			this.initTurntable();
		}
	},

	setOptions : function (options) {
		if (options != {}) {
			for ( var i in options )
				this.options[i] = options[i];
		}
	},

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
	},

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

	getResponseXHR : function (httpRequest) {
		var that = this;
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

	formatTime : function (t) {
		return t.mins + ':' + (t.secs > 9 ? t.secs : '0' + t.secs);
	},

	formatTrackTitle : function (t) {
		return t.artist + ' - ' + t.title;
	},

	getTrackTitle : function (i) {
		var
			i = i || this._playlistIndex,
			track = this._tracks[i]
		;

		return this.formatTrackTitle(track);
	},

	getTrackTitleLineBreak : function () {
		return this.getTrackTitle().replace(' - ', '\n \n');
	},

	arcString : function(startX, startY, endX, endY, radius1, radius2, angle, largeArcFlag) {
		// opts 4 and 5 are:
		// large-arc-flag: 0 for smaller arc
		// sweep-flag: 1 for clockwise

		largeArcFlag = largeArcFlag || 0;
		var arcSVG = [radius1, radius2, angle, largeArcFlag, 1, endX, endY].join(' ');
		return startX + ' ' + startY + " a " + arcSVG;
	},

	getFurrowsPath : function (centerX, centerY, spacing, maxRadius) {
		var
			pathAttributes = ['M', centerX, centerY],
			angle = 0,
			startX = centerX,
			startY = centerY
		;

		for (var radius = 0; radius < maxRadius; radius++) {
			angle += spacing;
			var endX = centerX + radius * Math.cos(angle * Math.PI / 180);
			var endY = centerY + radius * Math.sin(angle * Math.PI / 180);

			pathAttributes.push(this.arcString(startX, startY, endX - startX, endY - startY, radius, radius, 0));
			startX = endX;
			startY = endY;
		}

		return pathAttributes.join(' ');
	},

	getPlaylist : function (uri) {
		var
			that = this,
			uri = uri || this.options.playlistLocation,
			req = this.createXHR()
		;
		req.open("GET", uri, false);
		req.onreadystatechange = function () {
			var tracks = eval(that.getResponseXHR(req));
			if (typeof(tracks) == 'object' && tracks.length) {
				that._tracks = tracks;
				that.options.enable = true;
				that.load();
			}
		};
		req.send(null);
	},

	check : function () {
		if (!this._tracks.length && this.options.enable) {
			this.options.enable = false;
			this.getPlaylist();
		}

		return this.options.enable;
	},

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

	initPlayer : function () {
		if (!this._player) {
			var
				that = this,
				audio = document.createElementNS('http://www.w3.org/1999/xhtml', 'audio')
			;
			this._wrapper = this.getWrapper();

			if (this.options.debugMode) {
				this._wrapper.appendChild(audio);
				audio.controls = 'controls';
			}
			audio.preload = 'metadata';
			this._player = audio;
			this.loadTrack(this._playlistIndex);

			audio.addEventListener('loadedmetadata', function (event) {
				that.playerLoadedMetaData(event);
			}, false);
			audio.addEventListener('loadeddata', function (event) {
				that.playerLoadedData(event);
			}, false);
			audio.addEventListener('timeupdate', function (event) {
				that.playerTimeUpdated(event);
			}, false);
			audio.addEventListener('play', function (event) {
				that.playerPlayed(event);
			}, false);
			audio.addEventListener('pause', function (event) {
				that.playerPaused(event);
			}, false);
			audio.addEventListener('ended', function (event) {
				that.playerEnded(event);
			}, false);
		}
	},

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

	initRemote : function () {
		if (!this._playPause) {
			var
				that = this,
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
				that.playPauseButtonClicked(event);
			}, false);

			remote.appendChild(button);
			this._wrapper.appendChild(remote);

			this._playPause = button;
		}
	},

	initPlaylist : function () {
		if (!this._playlist) {
			var
				that = this,
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
					that.playlistButtonClicked(event);
				}, false);

				this._buttons[i] = button;
			}

			this._playlist = playlist;
			this._wrapper.appendChild(playlist);
			console.info('Playlist ok.');
		}
	},

	initTurntable : function () {
		if (!this._disc) {
			var
				that = this,
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
					that._armRotation = ft.attrs.rotate;
					if (events.indexOf('rotate') != -1) {
						that.pause();
					}
					else if (
						events.indexOf('rotate end') != -1
						&& ft.attrs.rotate > that.options.themes[that.options.theme].armStart
						&& ft.attrs.rotate < that.options.themes[that.options.theme].armEnd
					) {
						var
							percent = (ft.attrs.rotate - that.options.themes[that.options.theme].armStart) * 100 / (that.options.themes[that.options.theme].armEnd - that.options.themes[that.options.theme].armStart),
							currentTime = that._player.duration * percent / 100
						;
						that._player.currentTime = currentTime;
						that.start();
						console.info('Player track is at ' + Math.floor(percent, 10) + '%.');
					}
					else if (events.indexOf('rotate end') != -1) {
						that.stop();
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

	resetRemote : function () {
		for (var button in this._buttons)
			delete this._buttons[button];

		console.info('Remote reset.');
	},

	newPlaylist : function (uri) {
		this.getPlaylist(uri);
	},

	updateDiscInfos : function () {
		if (this._discTitle)
			this._discTitle.attr('text', this.getTrackTitleLineBreak());
		
		console.info('Disc infos updated.');
	},

	updateTrackInfos : function () {
		if (this.options.infos.indexOf('duration') != -1)
			this._infos['duration'].innerHTML = this.formatTime({
				mins: Math.floor(this._player.duration / 60, 10),
				secs: Math.floor(this._player.duration % 60 , 10)
			});

		console.info('Track infos updated.');
	},

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

		//console.info('Infos updated.');
	},

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

	disableRemote : function (s) {
		var s = s || '-';
		if (this._playPause)
			this._playPause.disabled = true;
		for (var button in this._buttons) {
			this._buttons[button].disabled = true;
		}
		console.info('Remote disabled (' + s + ').');
	},

	enableRemote : function (s) {
		var s = s || '-';
		if (this._playPause)
			this._playPause.disabled = false;
		for (var button in this._buttons) {
			this._buttons[button].disabled = false;
		}
		console.info('Remote enabled (' + s + ').');
	},

	loadTrack : function (i) {
		if (this._tracks.length) {
			var
				i = i || 0,
				track = this._tracks[i]
			;

			if (this._playerPaused == true || this._playerPaused == null)
				this.stop();

			if (this._player.canPlayType('audio/mpeg') && track.src.mp3)
				this._player.src = track.src.mp3;
			else if (this._player.canPlayType('audio/ogg') && track.src.ogg)
				this._player.src = track.src.ogg;
			else
				this._player.src = track.src;
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

	startDiscRotation : function () {
		this.stopDiscRotation();

		var
			that = this,
			rem = this._player.duration - this._player.currentTime,
			deg = parseInt(this._rpm * 360 * rem / 60) + this._discRotation,
			ms = parseInt(rem * 1000)
		;

		this._disc.animate({ transform: 'r' +	deg}, ms, 'linear', function () {
			that.updateDiscRotationIndex(this);
		});
		this._discTitle.animate({ transform: 'r' +	deg}, ms, 'linear');

		console.info('Rotation : ' + deg + 'deg for ' + ms + 'ms.');
	},

	stopDiscRotation : function () {
		if (this._disc)
			this.updateDiscRotationIndex(this._disc.stop());
		if (this._discTitle)
			this._discTitle.stop();
	},

	startDiscRotationTransition : function (easing) {
		if (this._disc && (
			(this._armRotation != 0 && this._discRotation != 0)
			|| (this._armInPlace != true && this._armRotation == 0)
		)) {		
			this.stopDiscRotation();

			var
				that = this,
				easing = easing || 'linear',
				rem = this.options.animateDelay / 1000,
				deg = parseInt(this._rpm * 360 * rem / 60) + this._discRotation,
				ms = parseInt(this.options.animateDelay)
			;

			this._disc.animate({ transform: 'r' +	deg}, ms, easing, function () {
				that.updateDiscRotationIndex(this);
			});
			this._discTitle.animate({ transform: 'r' +	deg}, ms, easing);

			console.info('Transition : ' + deg + 'deg for ' + ms + 'ms with easing ' + easing + '.');
		}
	},

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

	start : function () {
		console.info('START');
		if (this._armInPlace != true && this._armRotation == 0) {
			this.startDiscRotationTransition(this.options.easing.start);
			var that = this;
			this.disableRemote('start');
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = this.options.themes[this.options.theme].armStart;
			this._armFt.apply(function (ft) {
				ft.setOpts({ animate: false }, that._armFtCallback);
				that.startDiscRotation();
				that._player.play();
				that._playerPaused = false;
				that.enableRemote('start');
			});
			this._armInPlace = true;
			console.info('Arm rotation : ' + this.options.themes[this.options.theme].armStart + 'deg.');
		}
		else if (this._playerPaused == true) {
			this._armInPlace = true;
			this._player.play();
			this._playerPaused = false;
			this.startDiscRotation();
		}
		else
			this._player.play();

		this.updateDiscInfos();
		this._playPause.innerHTML = this.options.buttonLabels.pause;
		this.toggleClass(this._playPause, 'active', 'add');
	},

	pause : function () {
		console.info('PAUSE');
		if (this._playerPaused != true) {
			this._player.pause();
			this._playerPaused = true;
		}
	},

	stop : function (withStart) {
		console.info('STOP');
		var 
			that = this,
			withStart = withStart || false;
		;


		if (this._player.currentTime) {
			this._player.pause();
			this._player.currentTime = 0;
		}

		if (this._playerPaused != true) {
			this.startDiscRotationTransition(this.options.easing.stop);
			this._playerPaused = true;
		}

		if (this._armFt) {
			this.disableRemote('stop');
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = 0;
			this._armFt.apply(function (ft) {
				ft.setOpts({ animate: false }, that._armFtCallback);
				that._armInPlace = false;
				that._armRotation = 0;
				that.enableRemote('stop');
				if (that._playPause && !withStart) {
					that._playPause.innerHTML = that.options.buttonLabels.play;
					that.toggleClass(that._playPause, 'active', 'remove');
				}
				if (withStart)
					that.start();
			});
		}
	},

	restart : function () {
		console.info('RESTART');
		this.stop(true);
	},

	// events
	playerLoadedData : function (event) {
		console.info('Player event: loadedData.');

		this.enableRemote('playerLoaded');
		this.updateTrackInfos();
		this.updateInfos();

		if (this.options.autoPlay)
			this.start();
		else if (this._playerPaused == false)
			this.restart();
	},
	playerLoadedMetaData : function (event) {
		console.info('Player event: loadedMetaData.');
		this.updateTrackInfos();
		this.updateInfos();
	},

	playPauseButtonClicked : function (event) {
		if (this._playerPaused == true)
			this.start();
		else
			this.stop();
	},

	playerPlayed : function (event) {
		console.info('Player event: play.');
		// this.start();
	},

	playerPaused : function (event) {
		console.info('Player event: pause.');
		// this.pause();
	},

	playerEnded : function (event) {
		console.info('Player event: ended.');
		this.stop();
	},

	playerTimeUpdated : function (event) {
		this.updateDiscNeedlePosition();
		this.updateInfos();
	},

	playlistButtonClicked : function (event) {
		this.loadTrack(event.target.data);
	}
};
