var turntablePlayerEngine = function () {};

turntablePlayerEngine.prototype = {

	// parameters
	options: {
		enable: true,
		animateDelay : 2000,
		debugMode : true,
		autoPlay : false,
		mainId: 'player',
		turntableId: 'turntable',
		playlistLocation: '/data/playlist.json',
		buttonLabels: {
			play: 'play',
			pause: 'pause'
		},
		easing: {
			start: '<',
			pause: 'cubic-bezier(.81, .79, .57, 1.01)',
			stop: 'cubic-bezier(.81, .79, .57, 1.01)'
		},
		logMethodNames: ["log", "debug", "warn", "info"],
		theme: 'default',
		themes : {
			default: {
				armSrc: 'img/vinyl-arm-200-314.png',
				// positions and radius
				armX: 230,
				armY: -40,
				armW: 63,
				armH: 314,
				armStart: 22,
				armEnd: 45,
				discX: 125,
				discY: 175,
				discR: 115,
				discFW: 120,
				discBgR: 115,
				discFgR: 55,
				discAxisR: 3,
				// colors
				discBg: '#000',
				discFurrows: '#333',
				discFg: '#666',
				discTitle: '#eee',
				discAxis: '#000',
				armBg: '#999',
				armFg: '#000',
				armNeedleBg: '#999',
				armNeedleFg: 'transparent'
			}
		},

	},

	// reserved parameters which will be overriden
	_main: null,
	_player: null,
	_playlist: null,
	_playlistIndex: 0,
	_buttons: {},
	_playPause: null,
	_playerPaused: null,
	_infos: {},
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
		this.loadLogger();
		this.logInfo('Init!');
		this.setOptions(options);
		this.load();
	},

	load : function () {
		this.logInfo('Load!');
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

	log : function () {
		console.log.apply(this, arguments);
	},

	logInfo : function () {
		console.info.apply(this, arguments);
	},

	logError : function () {
		console.error.apply(this, arguments);
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
	        that.logError('There was a problem with the request.');
	      }
	    }
	  }
	  catch( e ) {
	    that.logError('Caught Exception: ' + e.description);
	  }
	},

	formatTime : function (t) {
		return t.mins + ':' + (t.secs > 9 ? t.secs : '0' + t.secs);
	},

	formatTrackTitle : function (t) {
		return t.artist + ' - ' + t.title;
	},

	getTrackTitle : function () {
		var
			i = this._playlistIndex,
			track = this._tracks[i]
		;

		return this.formatTrackTitle(track).replace(' - ', '\n \n');
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

	initPlayer : function () {
		if (!this._player) {
			var
				that = this,
				audio = document.createElementNS('http://www.w3.org/1999/xhtml', 'audio')
			;
			this._main = document.getElementById(this.options.mainId);

			// if (this.options.debugMode)
				// audio.controls = true;
			this._main.appendChild(audio);
			this._player = audio;
			this.loadTrack(this._playlistIndex);

			audio.addEventListener('loadeddata', function (event) {
				that.playerLoaded(event);
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
		if (!this._infos.title) {
			var
				infos = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
				infosTitle = document.createElementNS('http://www.w3.org/1999/xhtml', 'p')
				infosDuration = document.createElementNS('http://www.w3.org/1999/xhtml', 'p')
				infosCurrentTime = document.createElementNS('http://www.w3.org/1999/xhtml', 'p'),
				infosTimer = document.createElementNS('http://www.w3.org/1999/xhtml', 'p')
				infosPosition = document.createElementNS('http://www.w3.org/1999/xhtml', 'p')
			;

			infosTitle.innerHTML = 'Title : -';
			infosDuration.innerHTML = 'Duration : -';
			infosPosition.innerHTML = 'Position : -';
			infosCurrentTime.innerHTML = 'Current time : -';
			infosTimer.innerHTML = 'Time left : -';

			infos.appendChild(infosTitle);
			infos.appendChild(infosDuration);
			infos.appendChild(infosPosition);
			infos.appendChild(infosCurrentTime);
			infos.appendChild(infosTimer);
			this._main.appendChild(infos);

			this._infos = {
				'title' : infosTitle,
				'duration' : infosDuration,
				'position' : infosPosition,
				'currentTime' : infosCurrentTime,
				'timer' : infosTimer
			};
		}
	},

	initRemote : function () {
		if (!this._buttons.playPause) {
			var
				that = this,
				remote = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
				button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
			;

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
			this._main.appendChild(remote);

			this._buttons.playPause = button;
		}
	},

	initPlaylist : function () {
		if (!this._playlist) {
			var
				that = this,
				playlist = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
			;

			this.resetRemote();

			for (var i = 0; i < this._tracks.length; i++) {
				var
					button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
				;
				button.innerHTML = i + 1;
				button.data = i;
				playlist.appendChild(button);
				button.addEventListener('click', function (event) {
					that.playlistButtonClicked(event);
				}, false);

				this._buttons[i] = button;
			}

			this._playlist = playlist;
			this._main.appendChild(playlist);
			this.logInfo('Playlist ok.');
		}
	},

	initTurntable : function () {
		if (!this._disc) {
			var
				that = this,
				id = this.options.turntableId,
				w = document.getElementById(id).offsetWidth,
				h = document.getElementById(id).offsetHeight,
				turntable = document.getElementById(id),
				paper = Raphael(turntable, 0, 0, w - 2, h - 2),
	    	discBg = paper
	    		.circle(
	    			this.options.themes[this.options.theme].discX,
	    			this.options.themes[this.options.theme].discY,
	    			this.options.themes[this.options.theme].discR)
					.attr('fill', this.options.themes[this.options.theme].discBg),
	    	disc = paper
	    		.path(this.getFurrowsPath(
	    			this.options.themes[this.options.theme].discX,
	    			this.options.themes[this.options.theme].discY,
	    			this.options.themes[this.options.theme].discFW,
	    			this.options.themes[this.options.theme].discR))
	    		.attr({ fill: this.options.themes[this.options.theme].discBg, stroke: this.options.themes[this.options.theme].discFurrows }),
	    	discFg = paper
	    		.circle(
	    			this.options.themes[this.options.theme].discX,
	    			this.options.themes[this.options.theme].discY,
	    			this.options.themes[this.options.theme].discFgR)
					.attr('fill', this.options.themes[this.options.theme].discFg),
					bbox = disc.getBBox(),
				discTitle = paper
					.text(
						bbox.x + bbox.width/2,
						bbox.y + bbox.height/2,
						this.getTrackTitle())
					.attr('fill', this.options.themes[this.options.theme].discTitle)
					.attr('height', this.options.themes[this.options.theme].discFgR * 1.25)
					.attr('width', this.options.themes[this.options.theme].discFgR * 1.25),
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
	        that.logInfo('FT events : ' + events + ' & arm rotation : ' + ft.attrs.rotate + 'deg.');
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
	        	that.logInfo('Player track is at ' + Math.floor(percent, 10) + '%.');
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
						distance: .95,
						size: 20,
						drag: false,
						scale: false,
						rotateRange: [0, this.options.themes[this.options.theme].armEnd]
					},
					ftCallback
	    	)
	    ;

	    this._armFt = ft;
	    this._armFtCallback = ftCallback;
	    this._arm = arm;
	    this._disc = disc;
	    this._discTitle = discTitle;
	  }
	},

	resetRemote : function () {
		for (var button in this._buttons) {
			if (button != 'playPause')
				delete this._buttons[button];
		}
	},

	newPlaylist : function (uri) {
		this.getPlaylist(uri);
	},

	updateTrackInfos : function () {
		var
			i = this._playlistIndex,
			track = this._tracks[i]
		;

		if (this._discTitle)
			this._discTitle.attr('text', this.getTrackTitle());

		if (this._infos['title'] != undefined)
			this._infos['title'].innerHTML = 'Title : '  + this.formatTrackTitle(track);

		if (this._infos['duration'] != undefined)
			this._infos['duration'].innerHTML = 'Duration : '  + this.formatTime({
				mins: Math.floor(this._player.duration / 60, 10),
				secs: Math.floor(this._player.duration % 60 , 10)
			});
	},

	updateInfos : function () {
		var
			rem = parseInt(this._player.duration - this._player.currentTime, 10),
		  pos = (this._player.currentTime / this._player.duration) * 100,
		  mins = Math.floor(rem / 60, 10),
		  secs = rem - mins * 60
	  ;

		if (this._infos['position'] != undefined)
			this._infos['position'].innerHTML = 'Position : '  + Math.floor(pos, 10) + '%';

		if (this._infos['currentTime'] != undefined)
			this._infos['currentTime'].innerHTML = 'Current time : '  + this.formatTime({
				mins: Math.floor(this._player.currentTime / 60, 10),
				secs: Math.floor(this._player.currentTime % 60 , 10)
			});

		if (this._infos['timer'] != undefined)
			this._infos['timer'].innerHTML = 'Time left : -' + this.formatTime({
				mins: mins,
				secs: secs
			});
	},

	updateDiscNeedlePosition : function () {
		if (this._armInPlace) {
			var
				rem = parseInt(this._player.duration - this._player.currentTime, 10),
			  pos = (this._player.currentTime / this._player.duration) * 100,
			  deg = pos * (this.options.themes[this.options.theme].armEnd - this.options.themes[this.options.theme].armStart) / 100
		  ;
			this._armFt.attrs.rotate = this.options.themes[this.options.theme].armStart + deg;
			this._armFt.apply();
		}
	},

	disableRemote : function (s) {
		var s = s || '-';
		for (var button in this._buttons) {
			this._buttons[button].disabled = true;
		}
		this.logInfo('Remote disabled (' + s + ').');
	},

	enableRemote : function (s) {
		var s = s || '-';
		for (var button in this._buttons) {
			this._buttons[button].disabled = false;
		}
		this.logInfo('Remote enabled (' + s + ').');
	},

	loadTrack : function (i) {
		if (this._tracks.length) {
			var
				i = i || 0,
				track = this._tracks[i]
			;
			this.stop();
			this._player.src = track.src;
			this._player.load();
			this._playlistIndex = i;

			this.disableRemote('loadTrack');

			this.logInfo('Track #' + i + ' ok.');
		}
		else
			this.logInfo('No track in the playlist.');
	},

	startDiscRotation : function () {
		var
			that = this,
			rem = this._player.duration - this._player.currentTime,
		  deg = parseInt(this._rpm * 360 * rem / 60) + this._discRotation,
		  ms = parseInt(rem * 1000)
	  ;

		this._buttons.playPause.innerHTML = this.options.buttonLabels.pause;

		this._disc.animate({ transform: 'r' +  deg}, ms, 'linear', function () {
			that.updateDiscRotationIndex(this);
		});
		this._discTitle.animate({ transform: 'r' +  deg}, ms, 'linear');

		this.logInfo('Transform rotation [start] : ' + deg + 'deg for ' + ms + 'ms.');
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
			var
				that = this,
				easing = easing || 'linear',
				rem = this.options.animateDelay / 1000,
			  deg = parseInt(this._rpm * 360 * rem / 60) + this._discRotation,
			  ms = parseInt(this.options.animateDelay)
		  ;

			this._disc.animate({ transform: 'r' +  deg}, ms, easing, function () {
				that.updateDiscRotationIndex(this);
			});
			this._discTitle.animate({ transform: 'r' +  deg}, ms, easing);

			this.logInfo('Transform rotation [stop] : ' + deg + 'deg for ' + ms + 'ms with easing ' + easing + '.');
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
				this.logInfo('Disc rotation index is now : ' + this._discRotation + 'deg.')
			}
		}
	},

	start : function () {
		this.logInfo('START');
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
      this.logInfo('Arm rotation : ' + this.options.themes[this.options.theme].armStart + '°.');
		}
		else if (this._playerPaused == true) {
			this._armInPlace = true;
			this._player.play();
	  	this._playerPaused = false;
	  	this.startDiscRotation();
		}
	},

	pause : function () {
		this.logInfo('PAUSE');
		if (this._playerPaused != true) {
			this._buttons.playPause.innerHTML = this.options.buttonLabels.play;
			this.stopDiscRotation();
			this.startDiscRotationTransition(this.options.easing.pause);
	  	this._player.pause();
	  	this._playerPaused = true;
	  }
	},

	stop : function () {
		this.logInfo('STOP');
		var that = this;

		if (this._buttons.playPause)
			this._buttons.playPause.innerHTML = this.options.buttonLabels.play;
		this.stopDiscRotation();
		this.startDiscRotationTransition(this.options.easing.stop);
  	this._playerPaused = true;

		if (this._armFt) {
			this.disableRemote('stop');
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = 0;
			this._armFt.apply(function (ft) {
				ft.setOpts({ animate: false }, that._armFtCallback);
				that._armInPlace = false;
				that._armRotation = 0;
				that.enableRemote('stop');
			});
		}
	},

	// events
	playerLoaded : function (event) {
		this.logInfo('Player event : loaded.');

		this.enableRemote('playerLoaded');
		this.updateTrackInfos();
		this.updateInfos();

		if (this.options.autoPlay)
			this.start();
	},

	playPauseButtonClicked : function (event) {
		if (this._playerPaused == true)
			this.start();
		else
			this.pause();
	},

	playerPlayed : function (event) {
		this.logInfo('Player event : play.');
		this.start();
	},

	playerPaused : function (event) {
		this.logInfo('Player event : pause.');
		this.pause();
	},

	playerEnded : function (event) {
		this.logInfo('Player event : ended.');
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

var turntablePlayer = new turntablePlayerEngine();

window.addEventListener('load', function () {
	turntablePlayer.init();
}, false);