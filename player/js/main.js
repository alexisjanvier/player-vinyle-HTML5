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
	_debugMode : true,
	_autoPlay : false,
	_mainId: 'player',
	_logMethodNames: ["log", "debug", "warn", "info"],
	_colors: {
		discBg: '#000',
		discFurrows: '#333',
		discFg: '#666',
		armBg: '#000',
		armFg: '#000',
		armNeedleBg: '#999',
		armNeedleFg: '#999'
	},

	// parameters which will be overriden
	_main: null,
	_player: null,
	_playlist: null,
	_playlistIndex: 0,
	_playPause: null,
	_range: {},
	_infos: {},
	_disc: null,
	_arm: null,
	_armInPlace: null,
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

	initPlayer : function () {
		var 
			that = this,
			audio = document.createElementNS('http://www.w3.org/1999/xhtml', 'audio')
		;
		this._main = document.getElementById(this._mainId);

		if (this._debugMode)
			audio.controls = true;
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

	formatTime : function (t) {
		return t.mins + ':' + (t.secs > 9 ? t.secs : '0' + t.secs);
	},

	formatTrackTitle : function (t) {
		return t.artist + ' - ' + t.title;
	},

	initRemote : function () {
		var
			that = this,
			remote = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
			button = document.createElementNS('http://www.w3.org/1999/xhtml', 'button'),
			range = document.createElementNS('http://www.w3.org/1999/xhtml', 'input')
		;

		if (this._autoPlay) {
			button.innerHTML = 'pause';
			button.data = true;
		}
		else {
			button.innerHTML = 'start';
			button.data = false;
		}
		button.addEventListener('click', function (event) { 
			that.playPauseButtonClicked(event);
		}, false);
		
		range.type = 'range';
		range.step = 'any';
		range.value = 0;
		range.min = 0;
		range.max = 100;
		range.addEventListener('click', function (event) { 
			that.rangeClicked(event);
		}, false);

		remote.appendChild(button);
		remote.appendChild(range);
		this._main.appendChild(remote);

		this._playPause = button;
		this._range = range;
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

	// events
	playerLoaded : function (event) {
		if (this._range != undefined) {
			this._range.value = 0;
		  this._range.min = 0;
		  this._range.max = this._player.duration;
		}
		this.updateTrackInfos();
		this.updateInfos();

		if (this._autoPlay)
			this._player.play();
		else {
			this._player.pause();
			if (this._armFt) {
				this._armFt.attrs.rotate = 0;
				this._armFt.apply();
			}
		}
		console.log('Player track ok.');
	},

	playerPlayed : function (event) {
		if (this._armInPlace != true) {
			this._armFt.attrs.rotate = 28;
			this._armFt.apply();
			this._armInPlace = true;
		}
		var 
			roundPerMinute = 45,
			rem = this._player.duration - this._player.currentTime,
		  deg = parseInt(roundPerMinute * 360 * rem / 60)
		  ms = parseInt(rem * 1000)
	  ;

		this._playPause.innerHTML = 'pause';
		this._disc.animate({ transform: 'r' +  deg}, ms, '<>');

		console.log('Transform rotation : ' + deg + '° for ' + ms + 'ms.');
		console.log('Player playing.');
	},

	playerPaused : function (event) {
		this._playPause.innerHTML = 'play';
		this._disc.stop();
		console.log('Player pausing.');
	},

	playerEnded : function (event) {
		this._playPause.innerHTML = 'play';
		this._disc.stop();
		console.log('Player ended.');
	},

	playerTimeUpdated : function (event) {
		if (this._armInPlace == true) {
			var 
				rem = parseInt(this._player.duration - this._player.currentTime, 10),
			  pos = (this._player.currentTime / this._player.duration) * 100,
			  deg = pos * (90 - 28) / 100
		  ;
			this._armFt.attrs.rotate = 28 + deg;
			this._armFt.apply();
			//console.log(deg, 28 + deg);
		}
		this._range.value = this._player.currentTime;
		this.updateInfos();
	},

	playlistButtonClicked : function (event) {
		this.loadTrack(event.target.data);
	},

	rangeClicked : function (event) {
		this._player.currentTime = this._range.value;
	},

	playPauseButtonClicked : function (event) {
		if (this._player.paused == true)
			this._player.play();
		else
			this._player.pause();
	},


	// Turntable
	arcString : function(startX, startY, endX, endY, radius1, radius2, angle, largeArcFlag) {
	  // opts 4 and 5 are:
	  // large-arc-flag: 0 for smaller arc
	  // sweep-flag: 1 for clockwise

	  largeArcFlag = largeArcFlag || 0;
	  var arcSVG = [radius1, radius2, angle, largeArcFlag, 1, endX, endY].join(' ');
	  return startX + ' ' + startY + " a " + arcSVG;
	},

	initTurntableDisc : function (centerX, centerY, spacing, maxRadius) {
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

	initTurntable : function () {
		var 
			that = this,
			id = 'turntable',
			w = document.getElementById(id).offsetWidth,
			h = document.getElementById(id).offsetHeight,
			turntable = document.getElementById(id),
			paper = Raphael(turntable, 0, 0, w - 2, h - 2),
			rect = paper
				.rect(250, 20, 1, 200)
				.attr('fill', this._colors.armBg)
				.attr('stroke', this._colors.armFg)
				.attr('x', 250)
				.attr('y', 20),
			ft = paper.freeTransform(
				rect, 
				{ 
					attrs: { fill: this._colors.armNeedleBg, stroke: this._colors.armNeedleFg },
					distance: 1,
					drag: false,
					scale: false,
					rotateRange: [0, 90]
				}, 
				function(ft, events) {
	        console.log(events);
	        console.log(ft.attrs);
	        if (events.indexOf('rotate') != -1) {
	        	that._armInPlace = false;
	        	that._player.pause();
	        }
	        else if ( 
	        	events.indexOf('rotate end') != -1
	        	&& ft.attrs.rotate > 28 && ft.attrs.rotate < 90
        	) {
	        	var 
	        		percent = (ft.attrs.rotate - 28) * 100 / (90 - 28),
	        		currentTime = that._player.duration * percent / 100
        		;	
	        	that._player.currentTime = currentTime;
	        	that._player.play();
	        	console.log('Player track is at ' + Math.floor(percent, 10) + '%.');
	        }
	    	}
    	),
    	discBg = paper
    		.circle(125, 125, 115)
				.attr('fill', this._colors.discBg),
    	disc = paper
    		.path(this.initTurntableDisc(125, 125, 130, 115))
    		.attr({ fill: this._colors.discBg, stroke: this._colors.discFurrows }),
    	discFg = paper
    		.circle(125, 125, 25)
				.attr('fill', this._colors.discFg)
    ;

    this._armFt = ft;
    this._arm = rect;
    this._disc = disc;
	}

};

script.init();
window.addEventListener('load', function () {
	script.initOnDomReady();
}, false);
// jQuery(document).ready(function () {
// 	script.initOnDomReady();
// });