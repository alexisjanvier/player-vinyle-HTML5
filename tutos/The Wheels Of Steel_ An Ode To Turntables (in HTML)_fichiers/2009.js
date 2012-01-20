(function(){
	if (self.location != top.location) {
	  var r = document.referrer;
	  if (!r.match(/google\.com/i) && !r.match(/yahoo\.com/i)) {
		top.location = self.location;
	  }	
	};
})();

var Y = {
 // shortcuts
 A: YAHOO.util.Anim,
 D: YAHOO.util.Dom,
 E: YAHOO.util.Event,
 UE: YAHOO.util.Easing,
 CA: YAHOO.util.ColorAnim,
 BG: YAHOO.util.BgPosAnim
}

// Content Manager - reused from 2004 edition onward

var nAV = navigator.appVersion.toLowerCase();
var nUA = navigator.userAgent.toLowerCase();
var nP = navigator.platform.toLowerCase();
var isIE = nAV.match(/msie/i);
var isOldIE = nAV.match(/msie [5,6]/i);
var isNewerIE = (isIE && !isOldIE);
var isSafari = nUA.match(/safari/i);

// vintage Arkanoid data
var lN = [];
var lnOffset = 0;

_uacct = "UA-3081630-1";

var _re = null;
var _IS_DEV = (!document.domain.match(/schillmania.com/i));

if (!_IS_DEV && typeof urchinTracker != 'undefined') {
  try {
    urchinTracker();
  } catch(e) {
    // oh well
  }
}

function $(sID) { return document.getElementById(sID); }

function removeChildNodes(o) {
  // remove children from bottom up
  var nodes = o.childNodes;
  if (!nodes || !o) {
    return false;
  }
  for (var i=nodes.length-1; i>=0; i--) {
    o.removeChild(nodes[i]);
  }
}

function counterLoad() {
  runCounter();
}

function counterReadyState() {
  if (this.readyState == 'loaded' || this.readyState == 'complete') runCounter();
}

function runCounter() {
  if (_re) {
    _re.onload = null;
    _re.onreadystatechange = null;
  }
  if (typeof urchinTracker != 'undefined') urchinTracker();
  setTimeout(function(){if (typeof window.re_ != 'undefined') {window.re_('47064-bd3p5901pd');}},500);
}

function doCounter() {
  if (_IS_DEV) return false;
  if (APP_XHTML && isSafari) {
    // can't get this crap working. Throws "undefined value, line 249" error when served as application/xhtml+xml to Safari 3.
    // return false;
  }
  try {
    _re = document.createElement('script');
    _re.onload = counterLoad;
    _re.onreadystatechange = counterReadyState;
    _re.onReadyStateChange = counterReadyState;
    _re.src = 'http://include.reinvigorate.net/re_.js';
    document.getElementsByTagName('head')[0].appendChild(_re);
  } catch(e) {
    // oh well
  }
  // if (isSafari) setTimeout(runCounter,1500);
}

function getXHR() {
  var xhr = null;
  if (typeof window.XMLHttpRequest != 'undefined') {
    try {
      xhr = new XMLHttpRequest();
    } catch(e) {
      // d'oh
    }
  }
  if (!xhr) {
    try {
      xhr = new ActiveXObject('Msxml2.XMLHTTP');
    } catch(e) {
      try {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
      } catch(E) {
        xhr = null;
      }
    }
  }
  return xhr;
}

function ContentManager() {
  var self = this;
  this.xmlhttp = getXHR();
  this.oLast = null;
  this.url = null;

  this.readystatechangeHandler = function() {
    if (self.xmlhttp.readyState == 4) {
      if (self.onloadHandler) {
        self.onloadHandler();
      }
    }
  }

  this.load = function(url) {

    url = (url.href||url.toString());
    self.url = url;
    if (url.indexOf('.xml')>=0 || (url.indexOf('webpad')>=0) || (url.indexOf('theme=')!=-1)) return true;
    if (url.indexOf('react/contact')+1 && APP_XHTML) return true; // script here will fail otherwise
    if (url.indexOf('?')!=-1) return true;
    if (url.indexOf('#')>=0) {
      return false;
    }
    if (url.match(/what-i-did/i) || url.match(/yahoo-photos-frontend/i)) {
      // special case, uses SM2 + video - needs full page load
      return true;
    }
    // haaaack
    url = url.replace('../','');
    // url = url.replace('schillmania-dev/','');
    if (self.xmlhttp) {
      try {
        target = $('entry-content');
        url = url.toString();
        if (APP_XHTML||(window.location.href.indexOf('test')>=0)) {
          file = '?xml=true&r='+parseInt(Math.random()*1048576);
        } else {
          file = 'content.html';
        }
        self.xmlhttp.open('GET',url+file,true);
        self.xmlhttp.onreadystatechange = self.readystatechangeHandler;
        self.xmlhttp.setRequestHeader('Content-Type', 'text/xml');
        self.xmlhttp.send(null); // xmlDoc
      } catch(e) {
        // something blew up - d'oh!
        // console.log('contentManager.load(): error @ '+e.lineNumber+','+e.message);
        return true;
      }
    } else {
      // no XMLHTTP support.
      return true;
    }
    return false;
  }

  this.onloadHandler = function() {
    // if (soundManager) soundManager.play('b4');
    var _title = null;
    c = $('entry-content');
    if (APP_XHTML==true && self.xmlhttp.responseXML) { // safety net: ensure valid XML response.. otherwise, try dirty innerHTML method (may fail)
      removeChildNodes(c);
      c.appendChild(document.importNode(self.xmlhttp.responseXML.documentElement.getElementsByTagName('div')[0],true));
      // _title = self.getInnerText(self.xmlhttp.responseXML.documentElement.getElementsByTagName('h1')[0]);
    } else {
      // Internet explorer etc. get to do it the non-standards way
      try {
        var sData = self.xmlhttp.responseText;
        c.innerHTML = '';
        c.innerHTML = sData;
      } catch(e) {
        window.location = self.url;
        return false;
      }
    }
    try {
      if (_title) document.title = _title+ ' - Schillmania.com';
    } catch(e) {
      // oh well
    }
    runCounter();
  }

  this.getInnerText = function(o) {
    if (o.nodeType == 3 || o.nodeType == 4) return o.data;
    var sText = [];
    for (var i=0; i<o.childNodes.length; i++) {
      sText[sText.length] = self.getInnerText(o.childNodes[i]);
    }
    return sText.join('');
  }

  this.assignHandlers = function() {
    // intercept onclick and load via XMLHTTP where supported
    var o = $('nav-list');
    o.onclick = function(e) {
      var oEl = e?e.target:event.srcElement;
      if (oEl.nodeName.toLowerCase() == 'a') return self.clickHandler.apply(oEl);
    }
  }

  this.lastNavItem = null;

  this.clickHandler = function() {
    var o = this;
    if (o.href.indexOf('#'+o._class)==-1) {
      o.parentNode.className = 'selected';
      if (self.lastSelected && self.lastSelected != o.parentNode) {
        self.lastSelected.className = '';
      }
      self.lastSelected = o.parentNode;
    }
    try {
      // ensure focus..
      o.focus();
    } catch(e) {
      // just in case
    }
    if (o.toString().indexOf('#')==-1) {
      try {
        document.title = self.getInnerText(this.parentNode)+' - Schillmania.com';
      } catch(e) {
        // oh well
      }
    }
    return self.load(o);
  }

}

var contentManager = new ContentManager();

/*!
   SoundManager 2: Javascript Sound for the Web
   --------------------------------------------
   http://schillmania.com/projects/soundmanager2/

   Copyright (c) 2008, Scott Schiller. All rights reserved.
   Code licensed under the BSD License:
   http://schillmania.com/projects/soundmanager2/license.txt

   V2.94a.20090206
*/

var soundManager = null;

function SoundManager(smURL,smID) {
 
  this.flashVersion = 8;           // version of flash to require, either 8 or 9. Some API features require Flash 9.
  this.debugMode = true;           // enable debugging output (div#soundmanager-debug, OR console if available + configured)
  this.useConsole = true;          // use firebug/safari console.log()-type debug console if available
  this.consoleOnly = false;        // if console is being used, do not create/write to #soundmanager-debug
  this.waitForWindowLoad = false;  // force SM2 to wait for window.onload() before trying to call soundManager.onload()
  this.nullURL = 'null.mp3';       // path to "null" (empty) MP3 file, used to unload sounds (Flash 8 only)
  this.allowPolling = true;        // allow flash to poll for status update (required for "while playing", peak, sound spectrum functions to work.)
  this.useMovieStar = false;	   // enable support for Flash 9.0r115+ (codename "MovieStar") MPEG4 audio + video formats (AAC, M4V, FLV, MOV etc.)
  this.bgColor = '#ffffff';	   	   // movie (.swf) background color, useful if showing on-screen for video etc.
  this.useHighPerformance = false; // position:fixed flash movie gives increased js/flash speed
  this.flashLoadTimeout = 750;     // ms to wait for flash movie to load before failing (0 = infinity)

  this.defaultOptions = {
    'autoLoad': false,             // enable automatic loading (otherwise .load() will be called on demand with .play(), the latter being nicer on bandwidth - if you want to .load yourself, you also can)
    'stream': true,                // allows playing before entire file has loaded (recommended)
    'autoPlay': false,             // enable playing of file as soon as possible (much faster if "stream" is true)
    'onid3': null,                 // callback function for "ID3 data is added/available"
    'onload': null,                // callback function for "load finished"
    'whileloading': null,          // callback function for "download progress update" (X of Y bytes received)
    'onplay': null,                // callback for "play" start
    'onpause': null,               // callback for "pause"
    'onresume': null,              // callback for "resume" (pause toggle)
    'whileplaying': null,          // callback during play (position update)
    'onstop': null,                // callback for "user stop"
    'onfinish': null,              // callback function for "sound finished playing"
    'onbeforefinish': null,        // callback for "before sound finished playing (at [time])"
    'onbeforefinishtime': 5000,    // offset (milliseconds) before end of sound to trigger beforefinish (eg. 1000 msec = 1 second)
    'onbeforefinishcomplete':null, // function to call when said sound finishes playing
    'onjustbeforefinish':null,     // callback for [n] msec before end of current sound
    'onjustbeforefinishtime':200,  // [n] - if not using, set to 0 (or null handler) and event will not fire.
    'multiShot': true,             // let sounds "restart" or layer on top of each other when played multiple times, rather than one-shot/one at a time
    'position': null,              // offset (milliseconds) to seek to within loaded sound data.
    'pan': 0,                      // "pan" settings, left-to-right, -100 to 100
    'volume': 100                  // self-explanatory. 0-100, the latter being the max.
  };

  this.flash9Options = {           // flash 9-only options, merged into defaultOptions if flash 9 is being used
    'onbufferchange': null,	   	   // callback for "isBuffering" property change
    'isMovieStar': null,	       // "MovieStar" MPEG4 audio/video mode. Null (default) = auto detect MP4, AAC etc. based on URL. true = force on, ignore URL
    'usePeakData': false,          // enable left/right channel peak (level) data
    'useWaveformData': false,      // enable sound spectrum (raw waveform data) - WARNING: CPU-INTENSIVE: may set CPUs on fire.
    'useEQData': false             // enable sound EQ (frequency spectrum data) - WARNING: Also CPU-intensive.
  };

  this.movieStarOptions = {        // flash 9.0r115+ MPEG4 audio/video options, merged into defaultOptions if flash 9 + movieStar mode is enabled
    'onmetadata': null,		   	   // callback for when video width/height etc. are received
    'useVideo': false		   	   // if loading movieStar content, whether to show video
  };

  // jslint global declarations
  /*global sm2Debugger, alert, console, document, navigator, setTimeout, window */

  var SMSound = null; // defined later

  var _s = this;
  this.version = null;
  this.versionNumber = 'V2.94a.20090206';
  this.movieURL = null;
  this.url = null;
  this.altURL = null;
  this.swfLoaded = false;
  this.enabled = false;
  this.o = null;
  this.id = (smID||'sm2movie');
  this.oMC = null;
  this.sounds = {};
  this.soundIDs = [];
  this.muted = false;
  this.wmode = null;
  this.isIE = (navigator.userAgent.match(/MSIE/i));
  this.isSafari = (navigator.userAgent.match(/safari/i));
  this.isGecko = (navigator.userAgent.match(/gecko/i));
  this.debugID = 'soundmanager-debug';
  this._debugOpen = true;
  this._didAppend = false;
  this._appendSuccess = false;
  this._didInit = false;
  this._disabled = false;
  this._windowLoaded = false;
  this._hasConsole = (typeof console != 'undefined' && typeof console.log != 'undefined');
  this._debugLevels = ['log','info','warn','error'];
  this._defaultFlashVersion = 8;
  this._oRemoved = null;
  this._oRemovedHTML = null;

  var _$ = function(sID) {
    return document.getElementById(sID);
  };

  this.filePatterns = {
	flash8: /\.mp3(\?.*)?$/i,
	flash9: /\.mp3(\?.*)?$/i
  };

  this.netStreamTypes = ['aac','flv','mov','mp4','m4v','f4v','m4a','mp4v','3gp','3g2']; // Flash v9.0r115+ "moviestar" formats
  this.netStreamPattern = new RegExp('\\.('+this.netStreamTypes.join('|')+')(\\?.*)?$','i');

  this.filePattern = null;
  this.features = {
	buffering: false,
    peakData: false,
    waveformData: false,
    eqData: false,
    movieStar: false
  };

  this.sandbox = {
    'type': null,
    'types': {
      'remote': 'remote (domain-based) rules',
      'localWithFile': 'local with file access (no internet access)',
      'localWithNetwork': 'local with network (internet access only, no local access)',
      'localTrusted': 'local, trusted (local + internet access)'
    },
    'description': null,
    'noRemote': null,
    'noLocal': null
  };

  this._setVersionInfo = function() {
    if (_s.flashVersion != 8 && _s.flashVersion != 9) {
      alert('soundManager.flashVersion must be 8 or 9. "'+_s.flashVersion+'" is invalid. Reverting to '+_s._defaultFlashVersion+'.');
      _s.flashVersion = _s._defaultFlashVersion;
    }
    _s.version = _s.versionNumber+(_s.flashVersion==9?' (AS3/Flash 9)':' (AS2/Flash 8)');
    // set up default options
	if (_s.flashVersion > 8) {
	  _s.defaultOptions = _s._mergeObjects(_s.defaultOptions,_s.flash9Options);
	  _s.features.buffering = true;
	}
    if (_s.flashVersion > 8 && _s.useMovieStar) {
      // flash 9+ support for movieStar formats as well as MP3
      _s.defaultOptions = _s._mergeObjects(_s.defaultOptions,_s.movieStarOptions);
      _s.filePatterns.flash9 = new RegExp('\\.(mp3|'+_s.netStreamTypes.join('|')+')(\\?.*)?$','i');
      _s.features.movieStar = true;
    } else {
      _s.useMovieStar = false;
      _s.features.movieStar = false;
    }
    _s.filePattern = _s.filePatterns[(_s.flashVersion!=8?'flash9':'flash8')];
    _s.movieURL = (_s.flashVersion==8?'soundmanager2.swf':'soundmanager2_flash9.swf');
    _s.features.peakData = _s.features.waveformData = _s.features.eqData = (_s.flashVersion==9);
  };

  this._overHTTP = (document.location?document.location.protocol.match(/http/i):null);
  this._waitingforEI = false;
  this._initPending = false;
  this._tryInitOnFocus = (this.isSafari && typeof document.hasFocus == 'undefined');
  this._isFocused = (typeof document.hasFocus != 'undefined'?document.hasFocus():null);
  this._okToDisable = !this._tryInitOnFocus;

  this.useAltURL = !this._overHTTP; // use altURL if not "online"

  var flashCPLink = 'http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html';

  // --- public methods ---
  
  this.supported = function() {
    return (_s._didInit && !_s._disabled);
  };

  this.getMovie = function(smID) {
    return _s.isIE?window[smID]:(_s.isSafari?_$(smID)||document[smID]:_$(smID));
  };

  this.loadFromXML = function(sXmlUrl) {
    try {
      _s.o._loadFromXML(sXmlUrl);
    } catch(e) {
      _s._failSafely();
      return true;
    }
  };

  this.createSound = function(oOptions) {
    if (!_s._didInit) {
	  throw new Error('soundManager.createSound(): Not loaded yet - wait for soundManager.onload() before calling sound-related methods');
	}
    if (arguments.length == 2) {
      // function overloading in JS! :) ..assume simple createSound(id,url) use case
      oOptions = {'id':arguments[0],'url':arguments[1]};
    }
    var thisOptions = _s._mergeObjects(oOptions); // inherit SM2 defaults
    var _tO = thisOptions; // alias
    _s._wD('soundManager.createSound(): '+_tO.id+' ('+_tO.url+')',1);
    if (_s._idCheck(_tO.id,true)) {
      _s._wD('soundManager.createSound(): '+_tO.id+' exists',1);
      return _s.sounds[_tO.id];
    }
    if (_s.flashVersion > 8 && _s.useMovieStar) {
	  if (_tO.isMovieStar === null) {
	    _tO.isMovieStar = (_tO.url.match(_s.netStreamPattern)?true:false);
	  }
	  if (_tO.isMovieStar) {
	    _s._wD('soundManager.createSound(): using MovieStar handling');
	  }
	  if (_tO.isMovieStar && (_tO.usePeakData || _tO.useWaveformData || _tO.useEQData)) {
	    _s._wD('Warning: peak/waveform/eqData features unsupported for non-MP3 formats');
	    _tO.usePeakData = false;
		_tO.useWaveformData = false;
		_tO.useEQData = false;
	  }
    }
    _s.sounds[_tO.id] = new SMSound(_tO);
    _s.soundIDs[_s.soundIDs.length] = _tO.id;
    // AS2:
    if (_s.flashVersion == 8) {
      _s.o._createSound(_tO.id,_tO.onjustbeforefinishtime);
    } else {
      _s.o._createSound(_tO.id,_tO.url,_tO.onjustbeforefinishtime,_tO.usePeakData,_tO.useWaveformData,_tO.useEQData,_tO.isMovieStar,(_tO.isMovieStar?_tO.useVideo:false));
    }
    if (_tO.autoLoad || _tO.autoPlay) {
      // TODO: does removing timeout here cause problems?
        if (_s.sounds[_tO.id]) {
          _s.sounds[_tO.id].load(_tO);
        }
    }
    if (_tO.autoPlay) {
	  _s.sounds[_tO.id].play();
	}
    return _s.sounds[_tO.id];
  };

  this.createVideo = function(oOptions) {
    if (arguments.length==2) {
      oOptions = {'id':arguments[0],'url':arguments[1]};
    }
    if (_s.flashVersion >= 9) {
      oOptions.isMovieStar = true;
      oOptions.useVideo = true;
    } else {
      _s._wD('soundManager.createVideo(): flash 9 required for video. Exiting.',2);
      return false;
    }
    if (!_s.useMovieStar) {
      _s._wD('soundManager.createVideo(): MovieStar mode not enabled. Exiting.',2);
    }
    return _s.createSound(oOptions);
  };

  this.destroySound = function(sID,bFromSound) {
    // explicitly destroy a sound before normal page unload, etc.
    if (!_s._idCheck(sID)) {
      return false;
    }
    for (var i=0; i<_s.soundIDs.length; i++) {
      if (_s.soundIDs[i] == sID) {
	    _s.soundIDs.splice(i,1);
        continue;
      }
    }
    // conservative option: avoid crash with ze flash 8
    // calling destroySound() within a sound onload() might crash firefox, certain flavours of winXP + flash 8??
    // if (_s.flashVersion != 8) {
      _s.sounds[sID].unload();
    // }
    if (!bFromSound) {
      // ignore if being called from SMSound instance
      _s.sounds[sID].destruct();
    }
    delete _s.sounds[sID];
  };

  this.destroyVideo = this.destroySound;

  this.load = function(sID,oOptions) {
    if (!_s._idCheck(sID)) {
      return false;
    }
    _s.sounds[sID].load(oOptions);
  };

  this.unload = function(sID) {
    if (!_s._idCheck(sID)) {
      return false;
    }
    _s.sounds[sID].unload();
  };

  this.play = function(sID,oOptions) {
    if (!_s._idCheck(sID)) {
      if (typeof oOptions != 'Object') {
		oOptions = {url:oOptions}; // overloading use case: play('mySound','/path/to/some.mp3');
	  }
      if (oOptions && oOptions.url) {
        // overloading use case, creation + playing of sound: .play('someID',{url:'/path/to.mp3'});
        _s._wD('soundController.play(): attempting to create "'+sID+'"',1);
        oOptions.id = sID;
        _s.createSound(oOptions);
      } else {
        return false;
      }
    }
    _s.sounds[sID].play(oOptions);
  };

  this.start = this.play; // just for convenience

  this.setPosition = function(sID,nMsecOffset) {
    if (!_s._idCheck(sID)) {
      return false;
    }
    _s.sounds[sID].setPosition(nMsecOffset);
  };

  this.stop = function(sID) {
    if (!_s._idCheck(sID)) {
	  return false;
	}
    _s._wD('soundManager.stop('+sID+')',1);
    _s.sounds[sID].stop(); 
  };

  this.stopAll = function() {
    _s._wD('soundManager.stopAll()',1);
    for (var oSound in _s.sounds) {
      if (_s.sounds[oSound] instanceof SMSound) {
		_s.sounds[oSound].stop(); // apply only to sound objects
	  }
    }
  };

  this.pause = function(sID) {
    if (!_s._idCheck(sID)) {
	  return false;
	}
    _s.sounds[sID].pause();
  };

  this.pauseAll = function() {
    for (var i=_s.soundIDs.length; i--;) {
      _s.sounds[_s.soundIDs[i]].pause();
    }
  };

  this.resume = function(sID) {
    if (!_s._idCheck(sID)) {
	  return false;
	}
    _s.sounds[sID].resume();
  };

  this.resumeAll = function() {
    for (var i=_s.soundIDs.length; i--;) {
      _s.sounds[_s.soundIDs[i]].resume();
    }
  };

  this.togglePause = function(sID) {
    if (!_s._idCheck(sID)) {
	  return false;
	}
    _s.sounds[sID].togglePause();
  };

  this.setPan = function(sID,nPan) {
    if (!_s._idCheck(sID)) {
	  return false;
	}
    _s.sounds[sID].setPan(nPan);
  };

  this.setVolume = function(sID,nVol) {
    if (!_s._idCheck(sID)) {
	  return false;
	}
    _s.sounds[sID].setVolume(nVol);
  };

  this.mute = function(sID) {
	if (typeof sID != 'string') {
	  sID = null;
	}
    if (!sID) {
      _s._wD('soundManager.mute(): Muting all sounds');
      for (var i=_s.soundIDs.length; i--;) {
        _s.sounds[_s.soundIDs[i]].mute();
      }
      _s.muted = true;
    } else {
      if (!_s._idCheck(sID)) {
	    return false;
	  }
      _s._wD('soundManager.mute(): Muting "'+sID+'"');
      _s.sounds[sID].mute();
    }
  };

  this.muteAll = function() {
    _s.mute();
  };

  this.unmute = function(sID) {
    if (typeof sID != 'string') {
	  sID = null;
	}
    if (!sID) {
      _s._wD('soundManager.unmute(): Unmuting all sounds');
      for (var i=_s.soundIDs.length; i--;) {
        _s.sounds[_s.soundIDs[i]].unmute();
      }
      _s.muted = false;
    } else {
      if (!_s._idCheck(sID)) {
		return false;
	  }
      _s._wD('soundManager.unmute(): Unmuting "'+sID+'"');
      _s.sounds[sID].unmute();
    }
  };

  this.unmuteAll = function() {
    _s.unmute();
  };

  this.getMemoryUse = function() {
    if (_s.flashVersion == 8) {
      // not supported in Flash 8
      return 0;
    }
    if (_s.o) {
      return parseInt(_s.o._getMemoryUse(),10);
    }
  };

  this.setPolling = function(bPolling) {
    if (!_s.o || !_s.allowPolling) {
	  return false;
	}
    _s.o._setPolling(bPolling);
  };

  this.disable = function(bNoDisable) {
    // destroy all functions
    if (typeof bNoDisable == 'undefined') {
      bNoDisable = false;
    }
    if (_s._disabled) {
	  return false;
    }
    _s._disabled = true;
    _s._wD('soundManager.disable(): Shutting down',1);
    for (var i=_s.soundIDs.length; i--;) {
      _s._disableObject(_s.sounds[_s.soundIDs[i]]);
    }
    _s.initComplete(bNoDisable); // fire "complete", despite fail
    // _s._disableObject(_s); // taken out to allow reboot()
  };

  this.canPlayURL = function(sURL) {
    return (sURL?(sURL.match(_s.filePattern)?true:false):null);	
  };

  this.getSoundById = function(sID,suppressDebug) {
    if (!sID) {
	  throw new Error('SoundManager.getSoundById(): sID is null/undefined');
	}
    var result = _s.sounds[sID];
    if (!result && !suppressDebug) {
      _s._wD('"'+sID+'" is an invalid sound ID.',2);
      // soundManager._wD('trace: '+arguments.callee.caller);
    }
    return result;
  };

  this.onload = function() {
    // window.onload() equivalent for SM2, ready to create sounds etc.
    // this is a stub - you can override this in your own external script, eg. soundManager.onload = function() {}
    soundManager._wD('<em>Warning</em>: soundManager.onload() is undefined.',2);
  };

  this.onerror = function() {
    // stub for user handler, called when SM2 fails to load/init
  };

  // --- "private" methods ---

  this._idCheck = this.getSoundById;

  var _doNothing = function() {
    return false;
  };
  _doNothing._protected = true;

  this._disableObject = function(o) {
    for (var oProp in o) {
      if (typeof o[oProp] == 'function' && typeof o[oProp]._protected == 'undefined') {
		o[oProp] = _doNothing;
	  }
    }
    oProp = null;
  };

  this._failSafely = function(bNoDisable) {
    // general failure exception handler
    if (typeof bNoDisable == 'undefined') {
      bNoDisable = false;
    }
    if (!_s._disabled || bNoDisable) {
      _s._wD('soundManager: Failed to initialise.',2);
      _s.disable(bNoDisable);
    }
  };
  
  this._normalizeMovieURL = function(smURL) {
    var urlParams = null;
    if (smURL) {
      if (smURL.match(/\.swf(\?.*)?$/i)) {
        urlParams = smURL.substr(smURL.toLowerCase().lastIndexOf('.swf?')+4);
        if (urlParams) {
          return smURL; // assume user knows what they're doing
        }
      } else if (smURL.lastIndexOf('/') != smURL.length-1) {
        smURL = smURL+'/';
      }
    }
    return(smURL && smURL.lastIndexOf('/')!=-1?smURL.substr(0,smURL.lastIndexOf('/')+1):'./')+_s.movieURL;
  };

  this._getDocument = function() {
    return (document.body?document.body:(document.documentElement?document.documentElement:document.getElementsByTagName('div')[0]));
  };

  this._getDocument._protected = true;

  this._createMovie = function(smID,smURL) {
    if (_s._didAppend && _s._appendSuccess) {
	  return false; // ignore if already succeeded
	}
    if (window.location.href.indexOf('debug=1')+1) {
	  _s.debugMode = true; // allow force of debug mode via URL
	}
    _s._didAppend = true;
	
    // safety check for legacy (change to Flash 9 URL)
    _s._setVersionInfo();
    var remoteURL = (smURL?smURL:_s.url);
    var localURL = (_s.altURL?_s.altURL:remoteURL);
    _s.url = _s._normalizeMovieURL(_s._overHTTP?remoteURL:localURL);
    smURL = _s.url;

    var specialCase = null;

    if (_s.useHighPerformance && _s.useMovieStar) {
      specialCase = 'Note: disabling highPerformance, not applicable with movieStar mode on';
      _s.useHighPerformance = false;
    }

    _s.wmode = (_s.useHighPerformance && !_s.useMovieStar?'transparent':''); // wmode=opaque seems to break firefox/windows.

    var oEmbed = {
      name: smID,
      id: smID,
      src: smURL,
      width: '100%',
      height: '100%',
      quality: 'high',
      allowScriptAccess: 'always',
      bgcolor: _s.bgColor,
      pluginspage: 'http://www.macromedia.com/go/getflashplayer',
      type: 'application/x-shockwave-flash',
      wmode: _s.wmode
    };

    var oObject = {
      id: smID,
      data: smURL,
      type: 'application/x-shockwave-flash',
      width: '100%',
      height: '100%',
      wmode: _s.wmode
    };

    var oMovie = null;
    var tmp = null;

    if (_s.isIE) {
      // IE is "special".
      oMovie = document.createElement('div');
      var movieHTML = '<object id="'+smID+'" data="'+smURL+'" type="application/x-shockwave-flash" width="100%" height="100%"><param name="movie" value="'+smURL+'" /><param name="AllowScriptAccess" value="always" /><param name="quality" value="high" />'+(_s.useHighPerformance && !_s.useMovieStar?'<param name="wmode" value="'+_s.wmode+'" /> ':'')+'<param name="bgcolor" value="'+_s.bgColor+'" /><!-- --></object>';
    } else {
      oMovie = document.createElement('embed');
      for (tmp in oEmbed) {
	    if (oEmbed.hasOwnProperty(tmp)) {
          oMovie.setAttribute(tmp,oEmbed[tmp]);
	    }
      }
    }

    var oD = document.createElement('div');
    oD.id = _s.debugID+'-toggle';
    var oToggle = {
      position: 'fixed',
      bottom: '0px',
      right: '0px',
      width: '1.2em',
      height: '1.2em',
      lineHeight: '1.2em',
      margin: '2px',
      textAlign: 'center',
      border: '1px solid #999',
      cursor: 'pointer',
      background: '#fff',
      color: '#333',
      zIndex: 10001
    };

    oD.appendChild(document.createTextNode('-'));
    oD.onclick = _s._toggleDebug;
    oD.title = 'Toggle SM2 debug console';

    if (navigator.userAgent.match(/msie 6/i)) {
      oD.style.position = 'absolute';
      oD.style.cursor = 'hand';
    }

    for (tmp in oToggle) {
 	if (oToggle.hasOwnProperty(tmp)) {
          oD.style[tmp] = oToggle[tmp];
	}
    }

    var appXHTML = 'soundManager._createMovie(): appendChild/innerHTML set failed. May be app/xhtml+xml DOM-related.';

    var oTarget = _s._getDocument();

    if (oTarget) {
       
      _s.oMC = _$('sm2-container')?_$('sm2-container'):document.createElement('div');

      if (!_s.oMC.id) {
        _s.oMC.id = 'sm2-container';
        _s.oMC.className = 'movieContainer';
        // "hide" flash movie
        var s = null;
        var oEl = null;
        if (_s.useHighPerformance) {
          s = {
 	    	position: 'fixed',
		    width: '8px',
            height: '8px', // must be at least 6px for flash to run fast. odd? yes.
            bottom: '0px',
            left: '0px'
	    // zIndex:-1 // sit behind everything else - potentially dangerous/buggy?
          };
        } else {
          s = {
            position: 'absolute',
	    width: '1px',
            height: '1px',
            top: '-999px',
            left: '-999px'
          };
        }
        var x = null;
        for (x in s) {
		  if (s.hasOwnProperty(x)) {
            _s.oMC.style[x] = s[x];
		  }
        }
        try {
		  if (!_s.isIE) {
    	    _s.oMC.appendChild(oMovie);
		  }
          oTarget.appendChild(_s.oMC);
		  if (_s.isIE) {
			oEl = _s.oMC.appendChild(document.createElement('div'));
			oEl.className = 'sm2-object-box';
			oEl.innerHTML = movieHTML;
          }
          _s._appendSuccess = true;
        } catch(e) {
          throw new Error(appXHTML);
        }
      } else {
        // it's already in the document.
        _s.oMC.appendChild(oMovie);
		if (_s.isIE) {
		  oEl = _s.oMC.appendChild(document.createElement('div'));
		  oEl.className = 'sm2-object-box';
		  oEl.innerHTML = movieHTML;
        }
        _s._appendSuccess = true;
      }

      if (!_$(_s.debugID) && ((!_s._hasConsole||!_s.useConsole)||(_s.useConsole && _s._hasConsole && !_s.consoleOnly))) {
        var oDebug = document.createElement('div');
        oDebug.id = _s.debugID;
        oDebug.style.display = (_s.debugMode?'block':'none');
        if (_s.debugMode && !_$(oD.id)) {
          try {
            oTarget.appendChild(oD);
          } catch(e2) {
            throw new Error(appXHTML);
          }
          oTarget.appendChild(oDebug);
        }
      }
      oTarget = null;
    }

    if (specialCase) {
      _s._wD(specialCase);
    }

    _s._wD('-- SoundManager 2 '+_s.version+(_s.useMovieStar?', MovieStar mode':'')+(_s.useHighPerformance?', high performance mode':'')+' --',1);
    _s._wD('soundManager._createMovie(): Trying to load '+smURL+(!_s._overHTTP && _s.altURL?' (alternate URL)':''),1);
  };

  // aliased to this._wD()
  this._writeDebug = function(sText,sType,bTimestamp) {
    if (!_s.debugMode) {
	  return false;
	}
    if (typeof bTimestamp != 'undefined' && bTimestamp) {
      sText = sText + ' | '+new Date().getTime();
    }
    if (_s._hasConsole && _s.useConsole) {
      var sMethod = _s._debugLevels[sType];
      if (typeof console[sMethod] != 'undefined') {
	    console[sMethod](sText);
      } else {
        console.log(sText);
      }
      if (_s.useConsoleOnly) {
	return true;
      }
    }
    var sDID = 'soundmanager-debug';
    try {
      var o = _$(sDID);
      if (!o) {
		return false;
	  }
      var oItem = document.createElement('div');
      if (++_s._wdCount%2===0) {
	    oItem.className = 'sm2-alt';
      }
      // sText = sText.replace(/\n/g,'<br />');
      if (typeof sType == 'undefined') {
        sType = 0;
      } else {
        sType = parseInt(sType,10);
      }
      oItem.appendChild(document.createTextNode(sText));
      if (sType) {
        if (sType >= 2) {
		  oItem.style.fontWeight = 'bold';
		}
        if (sType == 3) {
		  oItem.style.color = '#ff3333';
		}
      }
      // o.appendChild(oItem); // top-to-bottom
      o.insertBefore(oItem,o.firstChild); // bottom-to-top
    } catch(e) {
      // oh well
    }
    o = null;
  };
  this._writeDebug._protected = true;
  this._wdCount = 0;
  this._wdCount._protected = true;
  this._wD = this._writeDebug;

  this._wDAlert = function(sText) { alert(sText); };

  if (window.location.href.indexOf('debug=alert')+1 && _s.debugMode) {
    _s._wD = _s._wDAlert;
  }

  this._toggleDebug = function() {
    var o = _$(_s.debugID);
    var oT = _$(_s.debugID+'-toggle');
    if (!o) {
	  return false;
	}
    if (_s._debugOpen) {
      // minimize
      oT.innerHTML = '+';
      o.style.display = 'none';
    } else {
      oT.innerHTML = '-';
      o.style.display = 'block';
    }
    _s._debugOpen = !_s._debugOpen;
  };

  this._toggleDebug._protected = true;

  this._debug = function() {
    _s._wD('--- soundManager._debug(): Current sound objects ---',1);
    for (var i=0,j=_s.soundIDs.length; i<j; i++) {
      _s.sounds[_s.soundIDs[i]]._debug();
    }
  };

  this._debugTS = function(sEventType,bSuccess,sMessage) {
    // troubleshooter debug hooks
    if (typeof sm2Debugger != 'undefined') {
	  try {
	    sm2Debugger.handleEvent(sEventType,bSuccess,sMessage);
	  } catch(e) {
	    // oh well	
	  }
    }
  };

  this._debugTS._protected = true;

  this._mergeObjects = function(oMain,oAdd) {
    // non-destructive merge
    var o1 = {}; // clone o1
    for (var i in oMain) {
	  if (oMain.hasOwnProperty(i)) {
        o1[i] = oMain[i];
	  }
    }
    var o2 = (typeof oAdd == 'undefined'?_s.defaultOptions:oAdd);
    for (var o in o2) {
      if (o2.hasOwnProperty(o) && typeof o1[o] == 'undefined') {
		o1[o] = o2[o];
	  }
    }
    return o1;
  };

  this.createMovie = function(sURL) {
    if (sURL) {
      _s.url = sURL;
    }
    _s._initMovie();
  };

  this.go = this.createMovie; // nice alias

  this._initMovie = function() {
    // attempt to get, or create, movie
    if (_s.o) {
	  return false; // may already exist
    }
    _s.o = _s.getMovie(_s.id); // (inline markup)
    if (!_s.o) {
      if (!_s.oRemoved) {
        // try to create
        _s._createMovie(_s.id,_s.url);
      } else {
        // try to re-append removed movie after reboot()
        if (!_s.isIE) {
          _s.oMC.appendChild(_s.oRemoved);
        } else {
          _s.oMC.innerHTML = _s.oRemovedHTML;
        }
        _s.oRemoved = null;
        _s._didAppend = true;
      }
      _s.o = _s.getMovie(_s.id);
    }
    if (_s.o) {
      _s._wD('soundManager._initMovie(): Got '+_s.o.nodeName+' element ('+(_s._didAppend?'created via JS':'static HTML')+')',1);
      if (_s.flashLoadTimeout>0) {
        _s._wD('soundManager._initMovie(): Waiting for ExternalInterface call from Flash..');
      }
    }
  };

  this.waitForExternalInterface = function() {
    if (_s._waitingForEI) {
	  return false;
	}
    _s._waitingForEI = true;
    if (_s._tryInitOnFocus && !_s._isFocused) {
      _s._wD('soundManager: Special case: Waiting for focus-related event..');
      return false;
    }
    if (_s.flashLoadTimeout>0) {
      if (!_s._didInit) {
        _s._wD('soundManager: Getting impatient, still waiting for Flash.. ;)');
      }
      setTimeout(function() {
        if (!_s._didInit) {
          _s._wD('soundManager: No Flash response within reasonable time after document load.\nPossible causes: Flash version under '+_s.flashVersion+', no support, flash blocked or JS-Flash security error.',2);
          if (!_s._overHTTP) {
          _s._wD('soundManager: Loading this page from local/network file system (not over HTTP?) Flash security likely restricting JS-Flash access. Consider adding current URL to "trusted locations" in the Flash player security settings manager at '+flashCPLink+', or simply serve this content over HTTP.',2);
        }
        _s._debugTS('flashtojs',false,': Timed out'+(_s._overHTTP)?' (Check flash security)':' (No plugin/missing SWF?)');
      }
      // if still not initialized and no other options, give up
      if (!_s._didInit && _s._okToDisable) {
	_s._failSafely(true); // don't disable, for reboot()
      }
    },_s.flashLoadTimeout);
    } else if (!_s.didInit) {
      _s._wD('soundManager: Waiting indefinitely for Flash...');
    }
  };

  this.handleFocus = function() {
    if (_s._isFocused || !_s._tryInitOnFocus) {
	  return true;
	}
    _s._okToDisable = true;
    _s._isFocused = true;
    _s._wD('soundManager.handleFocus()');
    if (_s._tryInitOnFocus) {
      // giant Safari 3.1 hack - assume window in focus if mouse is moving, since document.hasFocus() not currently implemented.
      window.removeEventListener('mousemove',_s.handleFocus,false);
    }
    // allow init to restart
    _s._waitingForEI = false;
    setTimeout(_s.waitForExternalInterface,500);
    // detach event
    if (window.removeEventListener) {
      window.removeEventListener('focus',_s.handleFocus,false);
    } else if (window.detachEvent) {
      window.detachEvent('onfocus',_s.handleFocus);
    }
  };

  this.initComplete = function(bNoDisable) {
    if (_s._didInit) {
	  return false;
	}
    _s._didInit = true;
    _s._wD('-- SoundManager 2 '+(_s._disabled?'failed to load':'loaded')+' ('+(_s._disabled?'security/load error':'OK')+') --',1);
    if (_s._disabled || bNoDisable) {
      _s._wD('soundManager.initComplete(): calling soundManager.onerror()',1);
      _s._debugTS('onload',false);
      _s.onerror.apply(window);
      return false;
    } else {
	  _s._debugTS('onload',true);
    }
    if (_s.waitForWindowLoad && !_s._windowLoaded) {
      _s._wD('soundManager: Waiting for window.onload()');
      if (window.addEventListener) {
        window.addEventListener('load',_s.initUserOnload,false);
      } else if (window.attachEvent) {
        window.attachEvent('onload',_s.initUserOnload);
      }
      return false;
    } else {
      if (_s.waitForWindowLoad && _s._windowLoaded) {
        _s._wD('soundManager: Document already loaded');
      }
      _s.initUserOnload();
    }
  };

  this.initUserOnload = function() {
    _s._wD('soundManager.initComplete(): calling soundManager.onload()',1);
    // call user-defined "onload", scoped to window
    _s.onload.apply(window);
    _s._wD('soundManager.onload() complete',1);
  };

  this.init = function() {
    _s._wD('-- soundManager.init() --');
    // called after onload()
    _s._initMovie();
    if (_s._didInit) {
      _s._wD('soundManager.init(): Already called?');
      return false;
    }
    // event cleanup
    if (window.removeEventListener) {
      window.removeEventListener('load',_s.beginDelayedInit,false);
    } else if (window.detachEvent) {
      window.detachEvent('onload',_s.beginDelayedInit);
    }
    try {
      _s._wD('Attempting to call Flash from JS..');
      _s.o._externalInterfaceTest(false); // attempt to talk to Flash
      // _s._wD('Flash ExternalInterface call (JS-Flash) OK',1);
      if (!_s.allowPolling) {
	    _s._wD('Polling (whileloading/whileplaying support) is disabled.',1);
	  }
      _s.setPolling(true);
	  if (!_s.debugMode) {
		_s.o._disableDebug();
	  }
      _s.enabled = true;
      _s._debugTS('jstoflash',true);
    } catch(e) {
	  _s._debugTS('jstoflash',false);
      _s._failSafely(true); // don't disable, for reboot()
      _s.initComplete();
      return false;
    }
    _s.initComplete();
  };

  this.beginDelayedInit = function() {
    _s._wD('soundManager.beginDelayedInit()');
    _s._windowLoaded = true;
    setTimeout(_s.waitForExternalInterface,500);
    setTimeout(_s.beginInit,20);
  };

  this.beginInit = function() {
    if (_s._initPending) {
	  return false;
	}
    _s.createMovie(); // ensure creation if not already done
    _s._initMovie();
    _s._initPending = true;
    return true;
  };

  this.domContentLoaded = function() {
    _s._wD('soundManager.domContentLoaded()');
    if (document.removeEventListener) {
	  document.removeEventListener('DOMContentLoaded',_s.domContentLoaded,false);
	}
    _s.go();
  };

  this._externalInterfaceOK = function() {
    // callback from flash for confirming that movie loaded, EI is working etc.
    if (_s.swfLoaded) {
	  return false;
	}
    _s._wD('soundManager._externalInterfaceOK()');
    _s._debugTS('swf',true);
    _s._debugTS('flashtojs',true);
    _s.swfLoaded = true;
    _s._tryInitOnFocus = false;
    if (_s.isIE) {
      // IE needs a timeout OR delay until window.onload - may need TODO: investigating
      setTimeout(_s.init,100);
    } else {
      _s.init();
    }
  };

  this._setSandboxType = function(sandboxType) {
    var sb = _s.sandbox;
    sb.type = sandboxType;
    sb.description = sb.types[(typeof sb.types[sandboxType] != 'undefined'?sandboxType:'unknown')];
    _s._wD('Flash security sandbox type: '+sb.type);
    if (sb.type == 'localWithFile') {
      sb.noRemote = true;
      sb.noLocal = false;
      _s._wD('Flash security note: Network/internet URLs will not load due to security restrictions. Access can be configured via Flash Player Global Security Settings Page: http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html',2);
    } else if (sb.type == 'localWithNetwork') {
      sb.noRemote = false;
      sb.noLocal = true;
    } else if (sb.type == 'localTrusted') {
      sb.noRemote = false;
      sb.noLocal = false;
    }
  };

  this.reboot = function() {
    // attempt to reset and init SM2
    _s._wD('soundManager.reboot()');
    if (_s.soundIDs.length) {
      _s._wD('Destroying '+_s.soundIDs.length+' SMSound objects...');
    }
    for (var i=_s.soundIDs.length; i--;) {
      _s.sounds[_s.soundIDs[i]].destruct();
    }
    // trash ze flash
    try {
      if (_s.isIE) {
        _s.oRemovedHTML = _s.o.innerHTML;
      }
      _s.oRemoved = _s.o.parentNode.removeChild(_s.o);
      _s._wD('Flash movie removed.');
    } catch(e) {
      // uh-oh.
      _s._wD('Warning: Failed to remove flash movie.',2);
    }
    _s.enabled = false;
    _s._didInit = false;
    _s._waitingForEI = false;
    _s._initPending = false;
    _s._didInit = false;
    _s._didAppend = false;
    _s._appendSuccess = false;
    _s._didInit = false;
    _s._disabled = false;
    _s._waitingforEI = true;
    _s.swfLoaded = false;
    _s.soundIDs = {};
    _s.sounds = [];
    _s.o = null;
    _s._wD('soundManager: Rebooting...');
    window.setTimeout(function() {
      soundManager.beginDelayedInit();
    },20);
  };

  this.destruct = function() {
    _s._wD('soundManager.destruct()');
    _s.disable(true);
  };
  
  // SMSound (sound object)
  
  SMSound = function(oOptions) {
  var _t = this;
  this.sID = oOptions.id;
  this.url = oOptions.url;
  this.options = _s._mergeObjects(oOptions);
  this.instanceOptions = this.options; // per-play-instance-specific options
  this._iO = this.instanceOptions; // short alias

  // assign property defaults (volume, pan etc.)
  this.pan = this.options.pan;
  this.volume = this.options.volume;

  this._debug = function() {
    if (_s.debugMode) {
    var stuff = null;
    var msg = [];
    var sF = null;
    var sfBracket = null;
    var maxLength = 64; // # of characters of function code to show before truncating
    for (stuff in _t.options) {
      if (_t.options[stuff] !== null) {
        if (_t.options[stuff] instanceof Function) {
	      // handle functions specially
	      sF = _t.options[stuff].toString();
	      sF = sF.replace(/\s\s+/g,' '); // normalize spaces
	      sfBracket = sF.indexOf('{');
	      msg[msg.length] = ' '+stuff+': {'+sF.substr(sfBracket+1,(Math.min(Math.max(sF.indexOf('\n')-1,maxLength),maxLength))).replace(/\n/g,'')+'... }';
	    } else {
	      msg[msg.length] = ' '+stuff+': '+_t.options[stuff];
	    }
      }
    }
    _s._wD('SMSound() merged options: {\n'+msg.join(', \n')+'\n}');
    }
  };

  this._debug();

  this.id3 = {
   /* 
    Name/value pairs set via Flash when available - see reference for names:
    http://livedocs.macromedia.com/flash/8/main/wwhelp/wwhimpl/common/html/wwhelp.htm?context=LiveDocs_Parts&file=00001567.html
    (eg., this.id3.songname or this.id3['songname'])
   */
  };

  this.resetProperties = function(bLoaded) {
    _t.bytesLoaded = null;
    _t.bytesTotal = null;
    _t.position = null;
    _t.duration = null;
    _t.durationEstimate = null;
    _t.loaded = false;
    _t.playState = 0;
    _t.paused = false;
    _t.readyState = 0; // 0 = uninitialised, 1 = loading, 2 = failed/error, 3 = loaded/success
    _t.muted = false;
    _t.didBeforeFinish = false;
    _t.didJustBeforeFinish = false;
    _t.isBuffering = false;
    _t.instanceOptions = {};
    _t.instanceCount = 0;
    _t.peakData = {
      left: 0,
      right: 0
    };
    _t.waveformData = [];
    _t.eqData = [];
  };

  _t.resetProperties();

  // --- public methods ---

  this.load = function(oOptions) {
    if (typeof oOptions != 'undefined') {
      _t._iO = _s._mergeObjects(oOptions);
      _t.instanceOptions = _t._iO;
    } else {
      oOptions = _t.options;
      _t._iO = oOptions;
      _t.instanceOptions = _t._iO;
    } 
    if (typeof _t._iO.url == 'undefined') {
      _t._iO.url = _t.url;
    }
    _s._wD('soundManager.load(): '+_t._iO.url,1);
    if (_t._iO.url == _t.url && _t.readyState !== 0 && _t.readyState != 2) {
      _s._wD('soundManager.load(): current URL already assigned.',1);
      return false;
    }
    _t.loaded = false;
    _t.readyState = 1;
    _t.playState = 0; // (oOptions.autoPlay?1:0); // if autoPlay, assume "playing" is true (no way to detect when it actually starts in Flash unless onPlay is watched?)
    try {
      if (_s.flashVersion==8) {
        _s.o._load(_t.sID,_t._iO.url,_t._iO.stream,_t._iO.autoPlay,(_t._iO.whileloading?1:0));
      } else {
        _s.o._load(_t.sID,_t._iO.url,_t._iO.stream?true:false,_t._iO.autoPlay?true:false); // ,(_tO.whileloading?true:false)
        if (_t._iO.isMovieStar && _t._iO.autoLoad && !_t._iO.autoPlay) {
          // special case: MPEG4 content must start playing to load, then pause to prevent playing.
          _t.pause();
        }
      }
    } catch(e) {
      _s._wD('SMSound.load(): Exception: JS-Flash communication failed, or JS error.',2);
      _s._debugTS('onload',false);
      _s.onerror();
      _s.disable();
    }

  };

  this.unload = function() {
    // Flash 8/AS2 can't "close" a stream - fake it by loading an empty MP3
    // Flash 9/AS3: Close stream, preventing further load
    if (_t.readyState !== 0) {
      _s._wD('SMSound.unload(): "'+_t.sID+'"');
      if (_t.readyState != 2) { // reset if not error
        _t.setPosition(0,true); // reset current sound positioning
      }
      _s.o._unload(_t.sID,_s.nullURL);
      // reset load/status flags
      _t.resetProperties();
    }
  };

  this.destruct = function() {
    // kill sound within Flash
    _s._wD('SMSound.destruct(): "'+_t.sID+'"');
    _s.o._destroySound(_t.sID);
    _s.destroySound(_t.sID,true); // ensure deletion from controller
  };

  this.play = function(oOptions) {
    if (!oOptions) {
	  oOptions = {};
    }
    _t._iO = _s._mergeObjects(oOptions,_t._iO);
    _t._iO = _s._mergeObjects(_t._iO,_t.options);
    _t.instanceOptions = _t._iO;
    if (_t.playState == 1) {
      var allowMulti = _t._iO.multiShot;
      if (!allowMulti) {
        _s._wD('SMSound.play(): "'+_t.sID+'" already playing (one-shot)',1);
        return false;
      } else {
        _s._wD('SMSound.play(): "'+_t.sID+'" already playing (multi-shot)',1);
      }
    }
    if (!_t.loaded) {
      if (_t.readyState === 0) {
        _s._wD('SMSound.play(): Attempting to load "'+_t.sID+'"',1);
        // try to get this sound playing ASAP
        _t._iO.stream = true;
        _t._iO.autoPlay = true;
        // TODO: need to investigate when false, double-playing
        // if (typeof oOptions.autoPlay=='undefined') _tO.autoPlay = true; // only set autoPlay if unspecified here
        _t.load(_t._iO); // try to get this sound playing ASAP
      } else if (_t.readyState == 2) {
        _s._wD('SMSound.play(): Could not load "'+_t.sID+'" - exiting',2);
        return false;
      } else {
        _s._wD('SMSound.play(): "'+_t.sID+'" is loading - attempting to play..',1);
      }
    } else {
      _s._wD('SMSound.play(): "'+_t.sID+'"');
    }
    if (_t.paused) {
      _t.resume();
    } else {
      _t.playState = 1;
      if (!_t.instanceCount || _s.flashVersion == 9) {
		_t.instanceCount++;
	  }
      _t.position = (typeof _t._iO.position != 'undefined' && !isNaN(_t._iO.position)?_t._iO.position:0);
      if (_t._iO.onplay) {
		_t._iO.onplay.apply(_t);
	  }
      _t.setVolume(_t._iO.volume,true); // restrict volume to instance options only
      _t.setPan(_t._iO.pan,true);
      _s.o._start(_t.sID,_t._iO.loop||1,(_s.flashVersion==9?_t.position:_t.position/1000));
    }
  };

  this.start = this.play; // just for convenience

  this.stop = function(bAll) {
    if (_t.playState == 1) {
      _t.playState = 0;
      _t.paused = false;
      // if (_s.defaultOptions.onstop) _s.defaultOptions.onstop.apply(_s);
      if (_t._iO.onstop) {
		_t._iO.onstop.apply(_t);
	  }
      _s.o._stop(_t.sID,bAll);
      _t.instanceCount = 0;
      _t._iO = {};
      // _t.instanceOptions = _t._iO;
    }
  };

  this.setPosition = function(nMsecOffset,bNoDebug) {
    if (typeof nMsecOffset == 'undefined') {
      nMsecOffset = 0;
    }
    var offset = Math.min(_t.duration,Math.max(nMsecOffset,0)); // position >= 0 and <= current available (loaded) duration
    _t._iO.position = offset;
    if (!bNoDebug) {
      _s._wD('SMSound.setPosition('+nMsecOffset+')'+(nMsecOffset != offset?', corrected value: '+offset:''));
    }
    _s.o._setPosition(_t.sID,(_s.flashVersion==9?_t._iO.position:_t._iO.position/1000),(_t.paused||!_t.playState)); // if paused or not playing, will not resume (by playing)
  };

  this.pause = function() {
    if (_t.paused || _t.playState === 0) {
	  return false;
	}
    _s._wD('SMSound.pause()');
    _t.paused = true;
    _s.o._pause(_t.sID);
    if (_t._iO.onpause) {
	  _t._iO.onpause.apply(_t);
	}
  };

  this.resume = function() {
    if (!_t.paused || _t.playState === 0) {
	  return false;
	}
    _s._wD('SMSound.resume()');
    _t.paused = false;
    _s.o._pause(_t.sID); // flash method is toggle-based (pause/resume)
    if (_t._iO.onresume) {
	  _t._iO.onresume.apply(_t);
	}
  };

  this.togglePause = function() {
    _s._wD('SMSound.togglePause()');
    if (!_t.playState) {
      _t.play({position:(_s.flashVersion==9?_t.position:_t.position/1000)});
      return false;
    }
    if (_t.paused) {
      _t.resume();
    } else {
      _t.pause();
    }
  };

  this.setPan = function(nPan,bInstanceOnly) {
    if (typeof nPan == 'undefined') {
      nPan = 0;
    }
    if (typeof bInstanceOnly == 'undefined') {
      bInstanceOnly = false;
    }
    _s.o._setPan(_t.sID,nPan);
    _t._iO.pan = nPan;
    if (!bInstanceOnly) {
      _t.pan = nPan;
    }
  };

  this.setVolume = function(nVol,bInstanceOnly) {
    if (typeof nVol == 'undefined') {
      nVol = 100;
    }
    if (typeof bInstanceOnly == 'undefined') {
      bInstanceOnly = false;
    }
    _s.o._setVolume(_t.sID,(_s.muted&&!_t.muted)||_t.muted?0:nVol);
    _t._iO.volume = nVol;
    if (!bInstanceOnly) {
      _t.volume = nVol;
    }
  };

  this.mute = function() {
    _t.muted = true;
    _s.o._setVolume(_t.sID,0);
  };

  this.unmute = function() {
    _t.muted = false;
    var hasIO = typeof _t._iO.volume != 'undefined';
    _s.o._setVolume(_t.sID,hasIO?_t._iO.volume:_t.options.volume);
  };

  // --- "private" methods called by Flash ---

  this._whileloading = function(nBytesLoaded,nBytesTotal,nDuration) {
    if (!_t._iO.isMovieStar) {
      _t.bytesLoaded = nBytesLoaded;
      _t.bytesTotal = nBytesTotal;
      _t.duration = Math.floor(nDuration);
      _t.durationEstimate = parseInt((_t.bytesTotal/_t.bytesLoaded)*_t.duration,10); // estimate total time (will only be accurate with CBR MP3s.)
      if (_t.readyState != 3 && _t._iO.whileloading) {
	_t._iO.whileloading.apply(_t);
      }
    } else {
      _t.bytesLoaded = nBytesLoaded;
      _t.bytesTotal = nBytesTotal;
      _t.duration = Math.floor(nDuration);
      _t.durationEstimate = _t.duration;
      if (_t.readyState != 3 && _t._iO.whileloading) {
	_t._iO.whileloading.apply(_t);
      }
    }
  };

  this._onid3 = function(oID3PropNames,oID3Data) {
    // oID3PropNames: string array (names)
    // ID3Data: string array (data)
    _s._wD('SMSound._onid3(): "'+this.sID+'" ID3 data received.');
    var oData = [];
    for (var i=0,j=oID3PropNames.length; i<j; i++) {
      oData[oID3PropNames[i]] = oID3Data[i];
      // _s._wD(oID3PropNames[i]+': '+oID3Data[i]);
    }
    _t.id3 = _s._mergeObjects(_t.id3,oData);
    if (_t._iO.onid3) {
      _t._iO.onid3.apply(_t);
    }
  };

  this._whileplaying = function(nPosition,oPeakData,oWaveformData,oEQData) {
    if (isNaN(nPosition) || nPosition === null) {
      return false; // Flash may return NaN at times
    }
    _t.position = nPosition;
	if (_t._iO.usePeakData && typeof oPeakData != 'undefined' && oPeakData) {
	  _t.peakData = {
	   left: oPeakData.leftPeak,
	   right: oPeakData.rightPeak
	  };
	}
	if (_t._iO.useWaveformData && typeof oWaveformData != 'undefined' && oWaveformData) {
	  _t.waveformData = oWaveformData;
	  /*
	  _t.spectrumData = {
	   left: oSpectrumData.left.split(','),
	   right: oSpectrumData.right.split(',')
	  }
	  */
	}
	if (_t._iO.useEQData && typeof oEQData != 'undefined' && oEQData) {
	  _t.eqData = oEQData;
	}
    if (_t.playState == 1) {
      if (_t._iO.whileplaying) {
	_t._iO.whileplaying.apply(_t); // flash may call after actual finish
      }
      if (_t.loaded && _t._iO.onbeforefinish && _t._iO.onbeforefinishtime && !_t.didBeforeFinish && _t.duration-_t.position <= _t._iO.onbeforefinishtime) {
        _s._wD('duration-position &lt;= onbeforefinishtime: '+_t.duration+' - '+_t.position+' &lt= '+_t._iO.onbeforefinishtime+' ('+(_t.duration-_t.position)+')');
        _t._onbeforefinish();
      }
    }
  };

  this._onload = function(bSuccess) {
    bSuccess = (bSuccess==1?true:false);
    _s._wD('SMSound._onload(): "'+_t.sID+'"'+(bSuccess?' loaded.':' failed to load? - '+_t.url),(bSuccess?1:2));
    if (!bSuccess) {
      if (_s.sandbox.noRemote === true) {
        _s._wD('SMSound._onload(): Reminder: Flash security is denying network/internet access',1);
      }
      if (_s.sandbox.noLocal === true) {
        _s._wD('SMSound._onload(): Reminder: Flash security is denying local access',1);
      }
    }
    _t.loaded = bSuccess;
    _t.readyState = bSuccess?3:2;
    if (_t._iO.onload) {
      _t._iO.onload.apply(_t);
    }
  };

  this._onbeforefinish = function() {
    if (!_t.didBeforeFinish) {
      _t.didBeforeFinish = true;
      if (_t._iO.onbeforefinish) {
        _s._wD('SMSound._onbeforefinish(): "'+_t.sID+'"');
        _t._iO.onbeforefinish.apply(_t);
      }
    }
  };

  this._onjustbeforefinish = function(msOffset) {
    // msOffset: "end of sound" delay actual value (eg. 200 msec, value at event fire time was 187)
    if (!_t.didJustBeforeFinish) {
      _t.didJustBeforeFinish = true;
      if (_t._iO.onjustbeforefinish) {
        _s._wD('SMSound._onjustbeforefinish(): "'+_t.sID+'"');
        _t._iO.onjustbeforefinish.apply(_t);
      }
    }
  };

  this._onfinish = function() {
    // sound has finished playing

    // TODO: calling user-defined onfinish() should happen after setPosition(0)
    // OR: onfinish() and then setPosition(0) is bad.

    if (_t._iO.onbeforefinishcomplete) {
      _t._iO.onbeforefinishcomplete.apply(_t);
    }
    // reset some state items
    _t.didBeforeFinish = false;
    _t.didJustBeforeFinish = false;
    if (_t.instanceCount) {
      _t.instanceCount--;
      if (!_t.instanceCount) {
        // reset instance options
        // _t.setPosition(0);
        _t.playState = 0;
        _t.paused = false;
        _t.instanceCount = 0;
        _t.instanceOptions = {};
        if (_t._iO.onfinish) {
          _s._wD('SMSound._onfinish(): "'+_t.sID+'"');
          _t._iO.onfinish.apply(_t);
        }
      }
    } else {
      // _t.setPosition(0);
    }
  };

  this._onmetadata = function(oMetaData) {
    // movieStar mode only
    _s._wD('SMSound.onmetadata()');
    // Contains a subset of metadata. Note that files may have their own unique metadata.
    // http://livedocs.adobe.com/flash/9.0/main/wwhelp/wwhimpl/common/html/wwhelp.htm?context=LiveDocs_Parts&file=00000267.html
    if (!oMetaData.width && !oMetaData.height) {
	  _s._wD('No width/height given, assuming defaults');
	  oMetaData.width = 320;
	  oMetaData.height = 240;
    }
    _t.metadata = oMetaData; // potentially-large object from flash
    _t.width = oMetaData.width;
    _t.height = oMetaData.height;
    if (_t._iO.onmetadata) {
      _s._wD('SMSound._onmetadata(): "'+_t.sID+'"');
      _t._iO.onmetadata.apply(_t);
    }
    _s._wD('SMSound.onmetadata() complete');
  };

  this._onbufferchange = function(bIsBuffering) {
    if (bIsBuffering == _t.isBuffering) {
      // ignore initial "false" default, if matching
      return false;
    }
    _t.isBuffering = (bIsBuffering==1?true:false);
    if (_t._iO.onbufferchange) {
      _s._wD('SMSound._onbufferchange(): '+bIsBuffering);
      _t._iO.onbufferchange.apply(_t);
    }
  };

  }; // SMSound()

  // register a few event handlers
  if (window.addEventListener) {
    window.addEventListener('focus',_s.handleFocus,false);
    window.addEventListener('load',_s.beginDelayedInit,false);
    window.addEventListener('unload',_s.destruct,false);
    if (_s._tryInitOnFocus) {
      window.addEventListener('mousemove',_s.handleFocus,false); // massive Safari focus hack
    }
  } else if (window.attachEvent) {
    window.attachEvent('onfocus',_s.handleFocus);
    window.attachEvent('onload',_s.beginDelayedInit);
    window.attachEvent('unload',_s.destruct);
  } else {
    // no add/attachevent support - safe to assume no JS -> Flash either.
    _s._debugTS('onload',false);
    soundManager.onerror();
    soundManager.disable();
  }

  if (document.addEventListener) {
	document.addEventListener('DOMContentLoaded',_s.domContentLoaded,false);
  }

} // SoundManager()

soundManager = new SoundManager();

soundManager.url = '/2009/';
soundManager.flashVersion = 9;
soundManager.useMovieStar = true;
soundManager.debugMode = (window.location.href.match(/debug/i));
soundManager.onload = function() {}

function playMovie(oLink,sURL,thumbURL,e) {
  var isIE6 = navigator.userAgent.match(/msie 6/i);
  if (soundManager._disabled || isIE6) {
	// No SM2 support - OR, IE 6 just doesn't render video nicely (fluid min/max-width type scale, anyway)
	if (isIE6) {
      // IE 6 doesn't seem to follow the link despite return true, either. WTF.
	  window.location.href = sURL;
	}
    return true;	
  }
  var sID = 'theMovie';
  try {
	if (!thumbURL) {
	  // assume JPG thumbnail URL matches movie URL
	  thumbURL = sURL.replace(/(mov|flv|mp4)/i,'jpg');
	}
	if (thumbURL) {
	  $('videoThumb').src = thumbURL;
	  // alert($('videoThumb').src);
	}
    var oImg = oLink.getElementsByTagName('img');
    $('sm2-container').style.background = '#000';
    if (oImg.length) {
	  // thumbnail - hide, but keep the element there to retain video scale
	  oImg[0].style.visibility = 'hidden';
    }
    if ($('videoLink')) {
	  $('videoLink').style.visibility = 'hidden';
	}
	if (soundManager.sounds[sID]) {
	  soundManager.destroySound(sID);	
	}
    soundManager.createVideo(sID,sURL);
    soundManager.play(sID,{
	  onmetadata:function() {
		// show movie overtop of image
		$('sm2movie').style.marginLeft = '0px';
	  }
    });
    if (typeof e.stopPropagation != 'undefined') {
	  e.stopPropagation();
    } else {
	  e.cancelBubble = true;
    }
    return false;
  } catch(e) {
    // oh well
    if (window.location.href.match(/debug/i)) {
	  alert('video error: '+e.toString());
	}
    return true;
  }
}

/*

  SoundManager 2 Demo: Play MP3 links "in-place"
  ----------------------------------------------

  http://schillmania.com/projects/soundmanager2/

  A simple demo making MP3s playable "inline"
  and easily styled/customizable via CSS.

  Requires SoundManager 2 Javascript API.

*/

function InlinePlayer() {
  var self = this;
  var pl = this;
  var sm = soundManager; // soundManager instance
  this.excludeClass = 'inline-exclude'; // CSS class for ignoring MP3 links
  this.links = [];
  this.sounds = [];
  this.soundsByURL = [];
  this.indexByURL = [];
  this.lastSound = null;
  this.soundCount = 0;
  var isIE = (navigator.userAgent.match(/msie/i));

  this.config = {
    playNext: false, // stop after one sound, or play through list until end
	autoPlay: false  // start playing the first sound right away
  }

  this.css = {
    // CSS class names appended to link during various states
    sDefault: 'sm2_link', // default state
    sLoading: 'sm2_loading',
    sPlaying: 'sm2_playing',
    sPaused: 'sm2_paused'
  }

  this.addEventHandler = function(o,evtName,evtHandler) {
    typeof(attachEvent)=='undefined'?o.addEventListener(evtName,evtHandler,false):o.attachEvent('on'+evtName,evtHandler);
  }

  this.removeEventHandler = function(o,evtName,evtHandler) {
    typeof(attachEvent)=='undefined'?o.removeEventListener(evtName,evtHandler,false):o.detachEvent('on'+evtName,evtHandler);
  }

  this.classContains = function(o,cStr) {
	return (typeof(o.className)!='undefined'?o.className.match(new RegExp('(\\s|^)'+cStr+'(\\s|$)')):false);
  }

  this.addClass = function(o,cStr) {
    if (!o || !cStr || self.classContains(o,cStr)) return false;
    o.className = (o.className?o.className+' ':'')+cStr;
  }

  this.removeClass = function(o,cStr) {
    if (!o || !cStr || !self.classContains(o,cStr)) return false;
    o.className = o.className.replace(new RegExp('( '+cStr+')|('+cStr+')','g'),'');
  }

  this.getSoundByURL = function(sURL) {
    return (typeof self.soundsByURL[sURL] != 'undefined'?self.soundsByURL[sURL]:null);
  }

  this.events = {

    // handlers for sound events as they're started/stopped/played

    play: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = pl.css.sPlaying;
      pl.addClass(this._data.oLink,this._data.className);
    },

    stop: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = '';
    },

    pause: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = pl.css.sPaused;
      pl.addClass(this._data.oLink,this._data.className);
    },

    resume: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = pl.css.sPlaying;
      pl.addClass(this._data.oLink,this._data.className);      
    },

    finish: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = '';
      if (pl.config.playNext) {
        var nextLink = (pl.indexByURL[this._data.oLink.href]+1);
        if (nextLink<pl.links.length) {
          pl.handleClick({'target':pl.links[nextLink]});
        }
      }
    }

  }

  this.stopEvent = function(e) {
   if (typeof e != 'undefined' && typeof e.preventDefault != 'undefined') {
      e.preventDefault();
    } else if (typeof event != 'undefined' && typeof event.returnValue != 'undefined') {
      event.returnValue = false;
    }
    return false;
  }

  this.getTheDamnLink = (isIE)?function(e) {
    // I really didn't want to have to do this.
    return (e && e.target?e.target:window.event.srcElement);
  }:function(e) {
    return e.target;
  }

  this.handleClick = function(e) {
    // a sound link was clicked
    var o = self.getTheDamnLink(e);
    var sURL = o.getAttribute('href');
    if (!o.href || !o.href.match(/\.mp3(\\?.*)$/i) || self.classContains(o,self.excludeClass)) {
      if (isIE && o.onclick) {
        return false; // IE will run this handler before .onclick(), everyone else is cool?
      }
      return true; // pass-thru for non-MP3/non-links
    }
    sm._writeDebug('handleClick()');
    var soundURL = (o.href);
    var thisSound = self.getSoundByURL(soundURL);
    if (thisSound) {
      // already exists
      if (thisSound == self.lastSound) {
        // and was playing (or paused)
        thisSound.togglePause();
      } else {
        // different sound
        thisSound.togglePause(); // start playing current
        sm._writeDebug('sound different than last sound: '+self.lastSound.sID);
        if (self.lastSound) self.stopSound(self.lastSound);
      }
    } else {
      // create sound
      thisSound = sm.createSound({
       id:'inlineMP3Sound'+(self.soundCount++),
       url:soundURL,
       onplay:self.events.play,
       onstop:self.events.stop,
       onpause:self.events.pause,
       onresume:self.events.resume,
       onfinish:self.events.finish
      });
      // tack on some custom data
      thisSound._data = {
        oLink: o, // DOM node for reference within SM2 object event handlers
        className: self.css.sPlaying
      };
      self.soundsByURL[soundURL] = thisSound;
      self.sounds.push(thisSound);
      if (self.lastSound) self.stopSound(self.lastSound);
      thisSound.play();
      // stop last sound
    }

    self.lastSound = thisSound; // reference for next call

    if (typeof e != 'undefined' && typeof e.preventDefault != 'undefined') {
      e.preventDefault();
    } else {
      event.returnValue = false;
    }
    return false;
  }

  this.stopSound = function(oSound) {
    soundManager.stop(oSound.sID);
    soundManager.unload(oSound.sID);
  }

  this.init = function() {
    sm._writeDebug('inlinePlayer.init()');
    var oLinks = document.getElementsByTagName('a');
    // grab all links, look for .mp3
    var foundItems = 0;
    for (var i=0; i<oLinks.length; i++) {
      if (oLinks[i].href.match(/\.mp3/i) && !self.classContains(oLinks[i],self.excludeClass)) {
        self.addClass(oLinks[i],self.css.sDefault); // add default CSS decoration
        self.links[foundItems] = (oLinks[i]);
        self.indexByURL[oLinks[i].href] = foundItems; // hack for indexing
        foundItems++;
      }
    }
    if (foundItems>0) {
      self.addEventHandler(document,'click',self.handleClick);
	  if (self.config.autoPlay) {
	    self.handleClick({target:self.links[0],preventDefault:function(){}});
	  }
    }
    sm._writeDebug('inlinePlayer.init(): Found '+foundItems+' relevant items.');
  }

  this.init();

}

var inlinePlayer = null;

soundManager.onload = function() {
  // soundManager.createSound() etc. may now be called
  inlinePlayer = new InlinePlayer();
  soundManager.createSound({
    id: 'beep',
    url: '/audio/b6.mp3',
    volume: 10,
    autoLoad: (!soundManager.isIE?true:false),
	multiShot: true
  });
  if (!soundManager.isIE) {
    $('right').onmouseover = function(e) {
      // so dirty.
      var o = (e.target?e.target:e.srcElement);
      if (o.tagName && o.tagName.toLowerCase() == 'a' || (o.parentNode && o.parentNode.tagName.toLowerCase() == 'a') || (o.className && Y.D.hasClass(o,'noisy'))) {
		soundManager.play('beep');	
      }
    }
  }
  // a little humour, why not.
  var extraSounds = [
   'http://freshly-ground.com/data/audio/binaural/Mak.mp3',
   '/audio/chicken0.mp3',
   '/audio/chicken1.mp3',
   '/audio/chicken2.mp3',
   '/audio/chicken3.mp3',
   '/audio/chicken4.mp3',
   '/audio/chicken5.mp3'
  ];
  extraSounds.on = false;
  var clickCount = 0;
 /*
  document.oncontextmenu = function(e) {
	if (!extraSounds.on) {
	  extraSounds.on = true;
	  for (var i=0; i<extraSounds.length; i++) {
	    soundManager.createSound({
		  id:'ex'+i,
		  url:extraSounds[i],
		  volume:i==0?100:50,
		  autoLoad:true
		});
	  }
	}
    if (Math.random() >= 0.75 || (clickCount == 0 && Math.random() > 0.5)) {
      soundManager.play('ex'+parseInt(Math.random()*extraSounds.length));
    }
    clickCount++;
  }
  */
  // 04.01.09
  function aprilFools(override) {
    var d = new Date();
    if (!isOldIE && ((d.getMonth() == 3 && d.getDate() == 1) || window.location.href.toString().match(/\?chicken/i) || override == true)) {
	  window.chickenRoot = '/common/chicken/';
	  loadScript('/common/chicken/chicken.js?rnd='+Math.random()*1048576,function() {
	    getTheChicken();
	  });
    }
  }
  setTimeout(aprilFools,2000);
  // Is some poor soul coming from Digg via the toolbar? Let's give them a hard time.
  // (PS: I <3 Digg, but I think the toolbar is a bit much.)
  if (window.location.href.match(/diggtoolbar/i) || (window.location != top.location && document.referrer && document.referrer.match(/digg.com/i))) {
    // ah-ha!
    if (isOldIE) {
	  return false;
    }
    var oC = document.createElement('img');
    var o = document.createElement('div');
    var imgSrc = '2009/image/rubber-chicken-vs-digg.png?rnd='+parseInt(Math.random()*1048576);
    o.style.position = 'fixed';
    o.style.opacity = 0.5;
    o.style.background = '#000';
    o.style.left = '0px';
    o.style.top = '0px';
    o.style.width = '100%';
    o.style.height = '100%';
	o.style.zIndex = 999;
    oC.src = imgSrc;
    oC.style.position = 'fixed';
    oC.style.left = parseInt(Math.random()*50)+'%';
    oC.style.top = '0px';
    oC.style.zIndex = 1000;
    o.onclick = oC.onclick = function() {
	  o.style.display = 'none';
	  oC.style.display = 'none';
      aprilFools(true);
    }
    oC.onload = oC.oncomplete = function() {
	  try {
		  var s = soundManager.createSound({
			id: 'toolbar',
			url: extraSounds[Math.max(1,parseInt(Math.random()*extraSounds.length))],
			onload: function() {
			  var oPage = $('body');
			  oPage.insertBefore(o,oPage.firstChild);
			  oPage.insertBefore(oC,oPage.firstChild);
			  this.play();
			}
	 	  });
		  setTimeout(function(){s.load()},Math.random()*5000);
	  } catch(e) {
	    // oh well	
	  }
      this.onload = this.oncomplete = function() {}
    }
  }
  if (!isOldIE && new Date().getMonth() == 11) {
    // happy holidays.
    loadScript('/2009/christmaslights.js',function() {
	  smashInit();
	});
  }
}

var FLICKR = {
 json: null,
 data: null
}

window.jsonFlickrFeed = function(oJSON) {
  FLICKR.json = oJSON;
  doFlickrStuff();
}

var sFlickr = null;

function getFlickrStuff() {
  sFlickr = document.createElement('script');
  sFlickr.src = 'http://api.flickr.com/services/feeds/photos_public.gne?id=12289718@N00&lang=en-us&format=json';
  document.getElementsByTagName('head')[0].appendChild(sFlickr);
}

function doFlickrStuff() {
  var data = FLICKR.json;
  var item = null;
  var photo = null;
  var oFrag = document.createElement('ul');
  oFrag.className = 'thumbs';
  var oItem = null;
  var i = 0;
  var limit = 4;
  var oTmpl = document.createElement('li');
  oTmpl.innerHTML = '<a href="#"><img src="2007/image/white-15.png" alt="" /></a>';
  for (item in data.items) {
    if (i++<limit) {
      oItem = oTmpl.cloneNode(true);
      oItem.id = '';
      oItem.childNodes[0].href = data.items[item].link;
      oItem.childNodes[0].title = data.items[item].title;
      oItem.childNodes[0].childNodes[0].style.background = 'transparent url('+data.items[item].media.m.replace('_m','_s')+') 50% 50% no-repeat';
      oFrag.appendChild(oItem);
    }
  }
  var oC = document.createElement('div');
  oC.className = 'clear';
  oFrag.appendChild(oC);
  $('flickr-stub').appendChild(oFrag);
}

function getArkanoidStuff() {
  // http://www.schillmania.com/arkanoid/leveldata/user/last_five.js
  var xhr = getXHR();
  if (!xhr) return false;
  function loadHandler() {
    if (!xhr) return false;
    if (xhr.readyState == 4) {
      try {
        eval(xhr.responseText);
      } catch(e) {
        // oh well
      }
      doArkanoidStuff();
    }
  }
  xhr.open('GET','/arkanoid/leveldata/user/last_five.js?rnd='+Math.random(),true);
  xhr.onreadystatechange = loadHandler;
  xhr.setRequestHeader('Content-Type','text/javascript');
  xhr.send(null);
}

function doArkanoidStuff() {
  var nLevels = 6;
  var nOffset = lnOffset+5-nLevels;
  if (nOffset<0) {
    // Y.D.getElementsByClassName('arkanoid','div',$('col2-content'))[0].style.display = 'none';
    return false; // something broke - bail.
  }
  var oItem = null;
  var oFrag = document.createElement('ul');
  oFrag.className = 'thumbs';
  var oTmpl = document.createElement('li');
  oTmpl.innerHTML = '<a href="#"><img src="2007/image/white-15.png" alt="" /></a>';
  for (var i=nOffset; i<nOffset+nLevels; i++) {
    oItem = oTmpl.cloneNode(true);
    oItem.id = '';
    oItem.childNodes[0].href = ('http://www.schillmania.com/arkanoid/#level'+(i+1));
    oItem.childNodes[0].childNodes[0].src = ('http://www.schillmania.com/arkanoid/preview.php?level='+i+'.png');
    oFrag.appendChild(oItem);
/*
    oItem.childNodes[0].childNodes[0].style.width = '48px';
    oItem.childNodes[0].childNodes[0].style.height = '40px';
*/
  }
  var oC = document.createElement('div');
  oC.className = 'clear';
  oFrag.appendChild(oC);
  $('arkanoid-stub').appendChild(oFrag);
}

function LastFM() {
  var self = this;
  this.xmlhttp = getXHR();

  // http://sedition.com/perl/javascript-fy.html
  function fisherYates(myArray) {
    var i = myArray.length;
    if (i==0) return false;
    var j,tempi,tempj;
    while (--i) {
      j = Math.floor(Math.random()*(i+1));
      tempi = myArray[i];
      tempj = myArray[j];
      myArray[i] = tempj;
      myArray[j] = tempi;
    }
  }

  this.readystatechangeHandler = function() {
    if (self.xmlhttp.readyState == 4) {
      if (self.onloadHandler) {
        self.onloadHandler();
      }
    }
  }

  this.onloadHandler = function() {
    try {
      var xml = self.xmlhttp.responseXML.documentElement;
      self.parseTopArtistsList(xml);
    } catch(e) {
      // oh well
      if (typeof console != 'undefined' && typeof console.log != 'undefined') console.log('LastFM.onloadHandler(): Warning: invalid XML or parse error');
      // Y.D.getElementsByClassName('lastfm','div',$('col2-content'))[0].style.display = 'none';
      return false;
    }
  }

  this.load = function() {
    if (!self.xmlhttp) return false;
    self.xmlhttp.open('GET',urlRoot+'content/lastfm/top-artists-v2/',true);
    self.xmlhttp.onreadystatechange = self.readystatechangeHandler;
    self.xmlhttp.setRequestHeader('Content-Type','text/xml');
    self.xmlhttp.send(null);
  }

  this.parseTopArtistsList = function(xml) {
    var items = xml.getElementsByTagName('artist');
    var data = [];
    var oFrag = document.createElement('ul');
    oFrag.className = 'thumbs';
    var oItem = null;

    for (var i=0; i<items.length; i++) {
      data[i] = {
        name: items[i].getElementsByTagName('name')[0].childNodes[0].data.replace('&','&amp;'),
        thumb: items[i].getElementsByTagName('image')[1].childNodes[0].data,
        playcount: items[i].getElementsByTagName('playcount')[0].childNodes[0].data
      }
    }

    // fisherYates(data);

    var limit = Math.min(5,items.length);
    var oTmplArtist = document.createElement('li');
    oTmplArtist.className = 'top-artist';
    oTmplArtist.innerHTML = '<img src="image/none.gif" style="width:48px;height:48px" alt="" class="noisy" /><span class="playcount">%playcount</span><span class="opt"> - </span><span class="artist">%artist</span>';
    for (var i=0; i<limit; i++) {
      oItem = oTmplArtist.cloneNode(true);
      oItem.id = '';
      oItem.getElementsByTagName('img')[0].style.background = 'transparent url('+data[i].thumb+') no-repeat 50% 50%';
      oItem.getElementsByTagName('img')[0].title =  data[i].name;
      oItem.innerHTML = (oItem.innerHTML.replace('%playcount',data[i].playcount).replace('%artist',data[i].name));
      oFrag.appendChild(oItem);
    }
    $('lastfm-stub').appendChild(oFrag);
  }


  this.parseTopTracksList = function(xml) {
    var tracks = xml.getElementsByTagName('track');
    var data = [];
    var oFrag = document.createElement('ul');
    oFrag.className = 'list';
    var oTmplTrack = document.createDocumentFragment();
    oTmplTrack.innerHTML = '<li><span class="track">%track</span><span class="opt"> - </span><span class="artist">%artist</span></li>';
    var oItem = null;

    for (var i=0; i<tracks.length; i++) {
      data[i] = {
        track: tracks[i].getElementsByTagName('name')[0].childNodes[0].data.replace('&','&amp;'),
        artist: tracks[i].getElementsByTagName('artist')[0].childNodes[0].data
      }
    }

    // fisherYates(data);

    var limit = Math.min(20,tracks.length);
    for (var i=0; i<limit; i++) {
      oItem =oTmplTrack.cloneNode(true);
      oItem.id = '';
      // oItem.innerHTML = (oItem.innerHTML.replace('%track',tracks[i].getElementsByTagName('name')[0].childNodes[0].data).replace('%artist',tracks[i].getElementsByTagName('artist')[0].childNodes[0].data));
      oItem.innerHTML = (oItem.innerHTML.replace('%track',data[i].track).replace('%artist',data[i].artist));
      oFrag.appendChild(oItem);
    }
    $('lastfm-stub').appendChild(oFrag);
  }
  
}

var lastFM = new LastFM();

function loadScript(sURL,onLoad) {
  try {
  var loadScriptHandler = function() {
    var rs = this.readyState;
    if (rs == 'loaded' || rs == 'complete') {
      this.onreadystatechange = null;
      this.onload = null;
      if (onLoad) {
        window.setTimeout(onLoad,20);
      }
    }
  }
  function scriptOnload() {
    this.onreadystatechange = null;
    this.onload = null;
    window.setTimeout(onLoad,20);
  }
  var oS = document.createElement('script');
  oS.type = 'text/javascript';
  if (onLoad) {
    oS.onreadystatechange = loadScriptHandler;
    oS.onload = scriptOnload;
  }
  oS.src = sURL;
  document.getElementsByTagName('head')[0].appendChild(oS);
  } catch(e) {
    // oh well
  }
}

function preInit() {
  try {
    if (window.location.href.match(/schillmania.com\/$/) && nUA.match(/(firefox|webkit|opera)/i)) {
      document.body.className = 'tilt';
    }
  } catch(e) {
  }
  if (nUA.match(/webkit/i)) {
	var oHTML = document.getElementsByTagName('html')[0];
    if (nUA.match(/Version\/3/i)) {
      oHTML.className = 'isSafari isSafari3';
    } else {
	  oHTML.className = 'isSafari';
	}
  }
  // $('theme-archive').appendChild($('site-archives'));
  if (navigator.userAgent.match(/msie/i)) {
    try {
      $('theme-archive').style.zoom = 1;
    } catch(e) {
      // oh well
    }
  }
  doCounter();
  var animTime = 2;
  var oDTs = $('nav-list').getElementsByTagName('dt');
  var oWedge = document.createElement('div');
  oWedge.className = 'r-wedge';
  for (var i=oDTs.length; i--;) {
    oDTs[i].appendChild(oWedge.cloneNode(true));
  }

  if (soundManager.isOldIE) {
	return false;
  }

  var oEl = $('logo').getElementsByTagName('a')[0];
  oEl.style.background = '#111 url(/2009/image/header-jaggies.png) repeat-x 0px 0px';
  // var oA = new YAHOO.util.ColorAnim(oEl,{backgroundColor:{from:'#000',to:'#FFF'}},animTime,YAHOO.util.Easing.easeBothStrong);
  var oElA = new YAHOO.util.BgPosAnim(oEl,{backgroundPosition:{from:[-5,oEl.offsetHeight],to:[parseInt(Math.random()*32*plusMinus()),-23],unit:['px','px']}},animTime,YAHOO.util.Easing.easeBothStrong);
  var oElA2 = new YAHOO.util.ColorAnim(oEl,{color:{from:'#fff',to:'#000'}},animTime,YAHOO.util.Easing.easeBothStrong);
  oElA.onComplete.subscribe(function(){this.getEl().style.backgroundColor='#fff'});
  oElA.animate();
  oElA2.animate();

  function plusMinus() {
    return Math.random()>0.5?1:-1;	
  }

  if (window.location.pathname == '/') {
	// don't animate everything unless on homepage

  function animItem(oEl) {
	oEl.style.background = '#fff url(/2009/image/header-jaggies-black.png) repeat-x 0px '+oEl.offsetHeight+'px';
    oEl.style.color = '#000';
    oA.push(new YAHOO.util.BgPosAnim(oEl,{backgroundPosition:{from:[0,oEl.offsetHeight],to:[parseInt(Math.random()*32*plusMinus()),-23],unit:['px','px']}},animTime,YAHOO.util.Easing.easeBothStrong));
    oA[oA.length-1].onComplete.subscribe(function(){this.getEl().style.backgroundImage='none';this.getEl().style.backgroundColor='#000'});
    oA2.push(new YAHOO.util.ColorAnim(oEl,{color:{from:'#000',to:'#fff'}},animTime,YAHOO.util.Easing.easeBothStrong));
    oA2[oA2.length-1].onComplete.subscribe(function(){if (this && this.style) this.style.color='auto'});
    oA[oA.length-1].animate();
    oA2[oA2.length-1].animate();
  }

  var oEls = $('entry-content').getElementsByTagName('h1');
  var oA = [];
  var oA2 = [];
  for (i=0, j=oEls.length; i<j; i++) {
	animItem(oEls[i]);
  }

  var oEls2 = $('right').getElementsByTagName('h2');
  for (var j=0, k=oEls2.length; j<k; j++) {
	animItem(oEls2[j]);
  }

  }

  if (!isIE || (isIE && !isOldIE)) {
    getArkanoidStuff();
    getFlickrStuff();
    lastFM.load();
  } else {
    $('external').style.display = 'none';	
  }

}

/*
window.onload = function() {
  // document.body.className = 'dark';
  contentManager.assignHandlers();
  doCounter();
  window.onload = null;
}
*/
