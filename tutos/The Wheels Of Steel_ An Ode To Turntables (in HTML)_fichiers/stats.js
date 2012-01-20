function __loadScript(sURL,onLoad) {
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
  oS.setAttribute('async', true);
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

function doStats() {
  try {
    if (window.location.href.toString().match(/\/projects\/soundmanager/i)) {
      // SM + SM2
      reinvigorate.track("u8v2l-jvr8058c6n");
    } else {
      reinvigorate.track("47064-bd3p5901pd");
    }
  } catch(err) {}
}

setTimeout(function(){
  if (document.domain.match(/schillmania.com/i)) {
    if (typeof window.reinvigorate === 'undefined') {
     __loadScript('http://include.reinvigorate.net/re_.js', doStats);
    } else {
      doStats();
    }
  }
},100);

// the goog.
(function() {
try {
  window._gaq = window._gaq || [];
  var _gaq = window._gaq;
  _gaq.push(['_setAccount', 'UA-23789290-1']);
  _gaq.push(['_setDomainName', '.schillmania.com']);
  _gaq.push(['_setAllowHash', 'false']);
  _gaq.push(['_trackPageview']);

  var ga = document.createElement('script');
  ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
}catch(e) {
  // d'oh well
}
})();

