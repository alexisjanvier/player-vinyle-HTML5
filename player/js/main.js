var script = {

	// parameters
	tracks : [
		// "/mp3/KingKrule/01%2036N63.mp3",
		// "/mp3/KingKrule/02%20Bleak%20Bake.mp3",
		// "/mp3/KingKrule/03%20Portrait%20in%20Black%20and%20Blue.mp3",
		// "/mp3/KingKrule/04%20Lead%20Existence.mp3",
		// "/mp3/KingKrule/05%20The%20Noose%20of%20Jah%20City.mp3",
		{
			artist: "Tool",
			title: "Vicarious",
			src: "/ogg/Tool%20-%2010.000%20Days/Tool%20-%2001%20-%20Vicarious.ogg"
		},
		{
			artist: "Tool",
			title: "Jambi",
			src: "/ogg/Tool%20-%2010.000%20Days/Tool%20-%2002%20-%20Jambi.ogg"
		},
		{
			artist: "Tool",
			title: "Wings For Marie (Pt 1)",
			src: "/ogg/Tool%20-%2010.000%20Days/Tool%20-%2003%20-%20Wings%20For%20Marie%20%28Pt%201%29.ogg"
		}
	],
	_animateDelay : 2000,
	_debugMode : true,
	_autoPlay : false,
	_mainId: 'player',
	_turntableId: 'turntable',
	_playlistIndex: 0,
	_buttonLabels: {
		play: 'play',
		pause: 'pause'
	},
	_logMethodNames: ["log", "debug", "warn", "info"],
	_theme: 'default',
	_themes : {
		default: { 
			armSrc: 'img/vinyl-arm-200-314.png', 
			// positions and radius
			armX: 230, 
			armY: -40, 
			armW: 63, 
			armH: 314,
			armStart: 22, 
			armEnd: 55,
			discX: 125, 
			discY: 175, 
			discR: 115,
			discFW: 130,
			discBgR: 115,
			discFgR: 25,
			discAxisR: 3,
			// colors
			discBg: '#000',
			discFurrows: '#333',
			discFg: '#666',
			discAxis: '#000',
			armBg: '#999',
			armFg: '#000',
			armNeedleBg: '#999',
			armNeedleFg: 'transparent'
		}
	},

	// reserved parameters which will be overriden
	_main: null,
	_player: null,
	_playlist: null,
	_playPause: null,
	_playerPaused: null,
	_infos: {},
	_disc: null,
	_arm: null,
	_armFt: null,
	_armFtCallback: null,
	_armInPlace: null,
	_armRotation: 0,
	_logMethods: [],

	// functions
	init : function () {
		this.loadLogger();
		console.log('Init!');
		this.initPlayer();
		this.initRemote();
		this.initPlaylist();
		this.initInfos();
	},

	initOnDomReady : function () {
		console.log('DOM ready!');
		this.initTurntable();
	},

	loadLogger : function (s) {
    if (!window.console) window.console = {};
    var 
			s = s || this._debugMode || false,
    	methods = this._logMethodNames || ["log", "debug", "warn", "info"]
  	;

  	if (!s || s == 'false' || s == 0)
  		this._debugMode = false;
  	else if (s || s == 'true' || s == 1)
  		this._debugMode = true;

    for (var i = 0; i < methods.length; i++) {
			if (!this._debugMode) {
				if (this._logMethods[methods[i]] == undefined)
	        this._logMethods[methods[i]] = console[methods[i]];
        console[methods[i]] = function () {};
      }
      else if (this._logMethods[methods[i]] != undefined) {
        console[methods[i]] = this._logMethods[methods[i]];
	    }
		}
	},

	formatTime : function (t) {
		return t.mins + ':' + (t.secs > 9 ? t.secs : '0' + t.secs);
	},

	formatTrackTitle : function (t) {
		return t.artist + ' - ' + t.title;
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

	initPlayer : function () {
		var 
			that = this,
			audio = document.createElementNS('http://www.w3.org/1999/xhtml', 'audio')
		;
		this._main = document.getElementById(this._mainId);

		// if (this._debugMode)
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
	},

	initInfos : function () {
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
	},

	initRemote : function () {
		var
			that = this,
			remote = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
			button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
		;

		if (this._autoPlay) {
			button.innerHTML = this._buttonLabels.pause;
			button.data = true;
		}
		else {
			button.innerHTML = this._buttonLabels.play;
			button.data = false;
		}
		button.addEventListener('click', function (event) { 
			that.playPauseButtonClicked(event);
		}, false);

		remote.appendChild(button);
		this._main.appendChild(remote);

		this._playPause = button;
	},

	initPlaylist : function () {
		var 
			that = this,
			playlist = document.createElementNS('http://www.w3.org/1999/xhtml', 'div')
		;

		for (var i = 0; i < this.tracks.length; i++) {
			var 
				button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button')
			;
			button.innerHTML = i + 1;
			button.data = i;
			playlist.appendChild(button);
			button.addEventListener('click', function (event) { 
				that.playlistButtonClicked(event);
			}, false);
		}

		this._playlist = playlist;
		this._main.appendChild(playlist);
		console.log('Playlist ok.');
	},

	initTurntable : function () {
		var 
			that = this,
			id = this._turntableId,
			w = document.getElementById(id).offsetWidth,
			h = document.getElementById(id).offsetHeight,
			turntable = document.getElementById(id),
			paper = Raphael(turntable, 0, 0, w - 2, h - 2),
    	discBg = paper
    		.circle(
    			this._themes[this._theme].discX, 
    			this._themes[this._theme].discY, 
    			this._themes[this._theme].discR)
				.attr('fill', this._themes[this._theme].discBg),
    	disc = paper
    		.path(this.getFurrowsPath(
    			this._themes[this._theme].discX, 
    			this._themes[this._theme].discY, 
    			this._themes[this._theme].discFW, 
    			this._themes[this._theme].discR))
    		.attr({ fill: this._themes[this._theme].discBg, stroke: this._themes[this._theme].discFurrows }),
    	discFg = paper
    		.circle(
    			this._themes[this._theme].discX, 
    			this._themes[this._theme].discY, 
    			this._themes[this._theme].discFgR)
				.attr('fill', this._themes[this._theme].discFg),
    	discAxis = paper
    		.circle(
    			this._themes[this._theme].discX, 
    			this._themes[this._theme].discY, 
    			this._themes[this._theme].discAxisR)
				.attr('fill', this._themes[this._theme].discAxis),
			arm = paper
				.image(
					this._themes[this._theme].armSrc, 
					this._themes[this._theme].armX, 
					this._themes[this._theme].armY, 
					this._themes[this._theme].armW, 
					this._themes[this._theme].armH),
			ftCallback = function(ft, events) {
        console.log('FT events : ' + events + '.');
				that._armRotation = ft.attrs.rotate;
        console.log('Arm rotation : ' + ft.attrs.rotate + '°.');
        if (events.indexOf('rotate') != -1) {
			  	// that._armInPlace = false;
        	that.pause();	
        }
        else if ( 
        	events.indexOf('rotate end') != -1
        	&& ft.attrs.rotate > that._themes[that._theme].armStart 
        	&& ft.attrs.rotate < that._themes[that._theme].armEnd
      	) {
        	var 
        		percent = (ft.attrs.rotate - that._themes[that._theme].armStart) * 100 / (that._themes[that._theme].armEnd - that._themes[that._theme].armStart),
        		currentTime = that._player.duration * percent / 100
      		;	
        	that._player.currentTime = currentTime;
        	that.start();
        	console.log('Player track is at ' + Math.floor(percent, 10) + '%.');
        }
        else if (events.indexOf('rotate end') != -1) {
        	that.stop();
        }
    	},
			ft = paper.freeTransform(
				arm, 
				{
					attrs: { 
						fill: this._themes[this._theme].armNeedleBg, 
						stroke: this._themes[this._theme].armNeedleFg,
						opacity: 0 
					},
					animate: false,
					distance: .95,
					size: 20,
					drag: false,
					scale: false,
					rotateRange: [0, this._themes[this._theme].armEnd]
				}, 
				ftCallback
    	)
    ;

    this._armFt = ft;
    this._armFtCallback = ftCallback;
    this._arm = arm;
    this._disc = disc;
	},

	updateTrackInfos : function () {
		var 
			i = this._playlistIndex,
			track = this.tracks[i]
		;

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

	loadTrack : function (i) {
		var 
			i = i || 0,
			track = this.tracks[i]
		;
		this._player.src = track.src;
		this._player.load();
		this._playlistIndex = i;

		console.log('Track #' + i + ' ok.');
	},

	start : function () {
		if (this._armInPlace != true && this._armRotation == 0) {
			var that = this;
			this._armFt.setOpts({ animate: true }, this._armFtCallback);
			this._armFt.attrs.rotate = this._themes[this._theme].armStart;
			this._armFt.apply(function (ft) {
				ft.setOpts({ animate: false }, that._armFtCallback);
				that._player.play();
		  	that._playerPaused = false;
			});
			this._armInPlace = true;
      console.log('Arm rotation : ' + this._themes[this._theme].armStart + '°.');
		}
		else {
			this._armInPlace = true;
			this._player.play();
	  	this._playerPaused = false;
		}

		var 
			roundPerMinute = 45,
			rem = this._player.duration - this._player.currentTime + (this._animateDelay / 1000),
		  deg = parseInt(roundPerMinute * 360 * rem / 60)
		  ms = parseInt(rem * 1000)
	  ;

		this._playPause.innerHTML = this._buttonLabels.pause;
		this._disc.animate({ transform: 'r' +  deg}, ms, 'linear');

		console.log('Transform rotation : ' + deg + '° for ' + ms + 'ms.');
	},

	pause : function () {
		this._playPause.innerHTML = this._buttonLabels.play;
		if (this._disc)
			this._disc.stop();
  	this._player.pause();
  	this._playerPaused = true;
	},

	stop : function () {
		var that = this;

		this._playPause.innerHTML = this._buttonLabels.play;
		this._disc.stop();
  	this._playerPaused = true;

		this._armFt.setOpts({ animate: true }, this._armFtCallback);
		this._armFt.attrs.rotate = 0;
		this._armFt.apply(function (ft) {
			ft.setOpts({ animate: false }, that._armFtCallback);
			that._armInPlace = false;
			that._armRotation = 0;
		});
	},

	// events
	playerLoaded : function (event) {
		this.updateTrackInfos();
		this.updateInfos();

		if (this._autoPlay)
			this.start();
		else {
			this.stop();
		}
		console.log('Player event : loaded.');
	},

	playPauseButtonClicked : function (event) {
		if (this._playerPaused == true)
			this.start();
		else
			this.pause();
	},

	playerPlayed : function (event) {
		console.log('Player event : play.');
		this.start();
	},

	playerPaused : function (event) {
		console.log('Player event : pause.');
		this.pause();
	},

	playerEnded : function (event) {
		console.log('Player event : ended.');
		this.stop();
	},

	playerTimeUpdated : function (event) {
		if (this._armInPlace) {
			var 
				rem = parseInt(this._player.duration - this._player.currentTime, 10),
			  pos = (this._player.currentTime / this._player.duration) * 100,
			  deg = pos * (this._themes[this._theme].armEnd - this._themes[this._theme].armStart) / 100
		  ;
			this._armFt.attrs.rotate = this._themes[this._theme].armStart + deg;
			this._armFt.apply();
		}
		this.updateInfos();
	},

	playlistButtonClicked : function (event) {
		this.loadTrack(event.target.data);
		if (this._disc)
			this._disc.stop();

		this._playPause.innerHTML = this._buttonLabels.play;
	}
};

script.init();
window.addEventListener('load', function () {
	script.initOnDomReady();
}, false);