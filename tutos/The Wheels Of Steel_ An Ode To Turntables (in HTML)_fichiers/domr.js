//
/*
 
 */

/*
 * Copyright 2010 Boltnet Inc.
 */

(function(prime) {
  var adminUrl = "https://bo.lt/app/domr";
  var jsonpCallbackCount = 1;

  var console;
  if (typeof window.console == 'undefined' || typeof window.console.log == 'undefined'
    || typeof window.console.error == 'undefined' || typeof window.console.warn == 'undefined'
    || typeof window.console.dir == 'undefined') {
    console = {
      log : function() {
      },
      error : function() {
      },
      warn : function() {
      },
      info : function() {
      },
      dir : function() {
      }
    }
  } else {
    console = window.console;
  }

  var isIE = function() {
    return /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent);
  };

  if (isIE()) {
    var script = document.createElement("script");
    script.type = "text/vbscript";
    script.src = "https://bo.lt/app/asset/domr/converter.vbscript?p=6e29bd059fdbe417456dc23c527c7f514b0a78d5";
    document.body.appendChild(script);
  }

  var toCharacterEncodedUTF8 = function(value) {
    var result = "";
    for ( var i = 0; i < value.length; i++) {
      var code = value.charCodeAt(i);
      if (code < 0x80) {
        result += String.fromCharCode(code & 0x7f);
      } else if (code < 0x0800) {
        result += String.fromCharCode(code >> 6 & 0x1f | 0xc0, code & 0x3f | 0x80);
      } else if (code < 0x010000) {
        result += String.fromCharCode(code >> 12 & 0x0f | 0xe0, code >> 6 & 0x3f | 0x80, code & 0x3f | 0x80);
      } else {
        result += String.fromCharCode(code >> 18 & 0x07 | 0xf0, code >> 12 & 0x3f | 0x80, code >> 6 & 0x3f | 0x80,
          code & 0x3f | 0x80);
      }
    }
    return result;
  }

  var AdminUrlBuilder = function(adminBaseUrl, sessionId) {

    this.getUrl = function(path, parameters) {
      var url = adminBaseUrl + "/" + path + ";sessionid=" + sessionId;
      if (parameters) {
        url = url + "?" + parameters;
      }
      return url;
    }

  };

  var DomBuilder = function(allNodes) {
    var removeChildId = function(parentNode, id) {
      var node = parentNode.firstChild;
      while (node) {
        if (node.id && node.id == id) {
          parentNode.removeChild(node);
          break;
        }
        if (node.nodeType == 1) {
          removeChildId(node, id);
        }

        if (node == parentNode.lastChild) {
          break;
        }
        node = node.nextSibling;
      }
    };

    this.removeDescendantId = function(id) {
      removeChildId(allNodes, id);
    };

    this.removeDescendantIds = function(ids) {
      for ( var id in ids) {
        removeChildId(allNodes, id);
      }
    };

    this.toHtml = function() {
      return allNodes.innerHTML;
    };
  };

  var DynamicNodeDetector = function() {
    this.onDetect = function(dynamicIds) {
    };

    var allIds = function(parentNode, ids) {
      var node = parentNode.firstChild;
      while (node) {
        if (node.id) {
          ids[node.id] = node.id;
        }
        if (node.nodeType == 1) {
          allIds(node, ids);
        }

        if (node == parentNode.lastChild) {
          break;
        }
        node = node.nextSibling;
      }

      return ids;
    };

    this.detect = function() {
      var url = document.location.href;
      var asset = new AssetFetcher(true).getAsset(url);

      var iframe = document.createElement("iframe");
      iframe.style.display = "none";

      var self = this;
      iframe.onload = function() {
        // assigning innerhtml: scripts ignored, head ignored
        iframe.contentDocument.body.innerHTML = asset.getContent();

        var ids = allIds(document.body, new Object());

        var dynamicIds = new Object();
        for ( var id in ids) {
          if (!iframe.contentDocument.getElementById(id)) {
            dynamicIds[id] = id;
          }
        }

        self.onDetect(dynamicIds);
        window.setTimeout(function() {
          // removing in the onload causes the browser to twirl
            document.body.removeChild(iframe);
          }, 50);
      };

      iframe.src = "data:text/html;base64,PGh0bWw+PGJvZHk+WDwvYm9keT48L2h0bWw+Cg==";
      document.body.appendChild(iframe);
    };
  };

  var Jsonp = function() {
    var jsonpCallbackCount = 0;

    this._timeout = function(url) {
      console.warn("Domr jsonp request to '" + url + "' timedout");
    };

    this._cancel = function(callbackName, script, timer) {
      window.clearTimeout(timer);
      document.getElementsByTagName("head")[0].removeChild(script);
      window[callbackName] = undefined;
      try {
        delete window[callbackName];
      } catch (e) {
        // ignore
      }
    };

    this.get = function(url, receive) {
      var callbackName = "m4_jsonp_" + new Date().getTime() + "_"
          + jsonpCallbackCount++;

      var requestUrl = url + (url.indexOf("?") == -1 ? '?' : '&') + "callback=" + callbackName;

      var script = document.createElement("script");
      script.src = requestUrl;

      var self = this;
      var timer = window.setTimeout(function() {
        self._cancel(callbackName, script, timer);
        self._timeout(url);
      }, 5000);

      var callback = function(data) {
        self._cancel(callbackName, script, timer);
        if ( receive ) {
          receive(data);
        }
      };

      window[callbackName] = callback;
      document.getElementsByTagName("head")[0].appendChild(script);
    };
  };

  var Asset = function(url, content, contentType) {
    this.getUrl = function() {
      return url;
    };

    this.getContent = function() {
      return content;
    };

    // the mimetype or encoding of the asset or null if unknown
    this.getContentType = function() {
      return contentType;
    };
  };

  // isRoot - boolean to indicate if it's the root asset in which case we may need to unwrap the
  //          XMLHttpRequest object if this is a bolt of a bolt to prevent our AJAX header from being added
  var AssetFetcher = function(isRoot) {
    var lastStatus = -5

    var isFileRequest = function(url) {
      return url.indexOf("file:") == 0
        || (/^[a-zA-Z]+:/.exec(url) == null && document.location.href.indexOf("file:") == 0);
    };

    // params
    //   url - to fetch
    //   defaultContentType - optional, mimeType to use if not in response.
    this.getAsset = function(url, defaultContentType) {
      var request;

      lastStatus = -4;

      if (isRoot && window._ActiveXObject) {
        request = new _ActiveXObject("Microsoft.XMLHTTP");
      } else if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
      } else if (window.ActiveXObject) {
        request = new ActiveXObject("Microsoft.XMLHTTP");
      } else {
        console.error("Domr error unable to create XMLHttp object");
        lastStatus = -1;
        return null;
      }

      try {
        if (isRoot && request._open) {
          request._open('GET', url, false);
        } else {
          request.open('GET', url, false);
        }
      } catch (error) {
        console.log("Domr problem opening", url, error);
        lastStatus = -1;
        return null;
      }

      if (request.overrideMimeType) {
        request.overrideMimeType('text/plain; charset=x-user-defined');
      } else if (request.setRequestHeader) {
        request.setRequestHeader('Accept-Charset', 'x-user-defined');
      } else {
        console.error("Domr error unable to override character set");
        lastStatus = -2
      }

      try {
        if (isRoot && request._send) {
          request._send(null);
        } else {
          request.send(null);
        }
        lastStatus = request.status;
        if (isFileRequest(url)) {
          lastStatus = 200;
        }
      } catch (error) {
        if (isFileRequest(url)) {
          lastStatus = 404;
        } else {
          lastStatus = -1;
        }
      }

      if (lastStatus != 200) {
        console.log("Domr got status code ", request.status, " fetching ", url);
        return null;
      }

      var contentType = request.getResponseHeader('Content-Type');
      if (contentType) {
        if (contentType.toLowerCase().indexOf("text/") != -1 && contentType.toLowerCase().indexOf("charset") == -1) {
          contentType = contentType + "; charset=utf-8"
        }
      } else if (defaultContentType) {
        contentType = defaultContentType;
      }

      if (isIE()) {
        var data = M4Domr_BinaryToArray(request.responseBody);
        return new Asset(url, data.toArray(), contentType);
      } else {
        return new Asset(url, request.responseText, contentType);
      }
    };

    // Http status code, or < 0 for software errors
    this.getLastStatus = function() {
      return lastStatus;
    };
  };

  var AssetLoader = function(rootAssetFetcher) {
    var nonRootFetcher = new AssetFetcher(false);
    var rootAsset = null;
    var lastStatus = -3;

    this.snapshot = function() {
      rootAsset = rootAssetFetcher.getAsset();
      return this;
    };

    this.get = function(url) {
      if (document.location.href == url) {
        if (!rootAsset) {
          this.snapshot();
        }
        lastStatus = rootAssetFetcher.getLastStatus();
        return rootAsset;
      } else {
        var asset = nonRootFetcher.getAsset(url);
        lastStatus = nonRootFetcher.getLastStatus();
        return asset;
      }
    };

    this.getLastStatus = function() {
      return lastStatus;
    };
  };

  var RequestBasedRootAssetFetcher = function() {
    var url = document.location.href;
    var rootFetcher = new AssetFetcher(true);

    this.getAsset = function() {
      return rootFetcher.getAsset(url, "text/html");
    };

    this.getLastStatus = function() {
      return rootFetcher.getLastStatus();
    };
  };

  var DynamicDomBasedRootAssetFetcher = function(dynamicIds) {
    this.getAsset = function() {
      var domBuilder = new DomBuilder(document.documentElement.cloneNode(true));
      domBuilder.removeDescendantIds(dynamicIds);

      var content = "<html>" + toCharacterEncodedUTF8(domBuilder.toHtml()) + "</html>";
      content = content.replace(/<script[^>]+src=[^>]+\.lt[^>]+domr.js[^>]+>[^>]+script>/ig, "");
      content = content.replace(/<script[^>]+src=[^>]+\.lt[^>]+on-load[^>]+>[^>]+script>/ig, "");
      content = content.replace(/<div[^>]+_firebugConsole[^>]+>[^>]+div>/ig, "");
      content = content.replace(/<STYLE[^<]*\.firebug[^<]*<\/STYLE>/ig, "");

      return new Asset(document.location.href, content, "text/html; charset=utf-8");
    };

    this.getLastStatus = function() {
      return 200;
    };
  };

  // check on command line with
  // echo "ENCODED_STRING" | tr '_-' '/+' | base64 -d
  var Base64 = function() {
    var encodeTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";

    this.encode = function(data) {
      var result = "";

      var i = 0;
      do {
        var char1 = data.charCodeAt(i++)
        var char2 = data.charCodeAt(i++)
        var char3 = data.charCodeAt(i++)
        // console.log("char ", char1.toString(16), char2.toString(16),
        // char3.toString(16));

        var encode1 = ((char1 & 0xff) >> 2) & 0x3f;
        var encode2 = (((char1 & 0x03) << 4) | ((char2 & 0xff) >> 4)) & 0x3f;
        var encode3 = (((char2 & 0x0f) << 2) | ((char3 & 0xff) >> 6)) & 0x3f;
        var encode4 = char3 & 0x3f;
        // console.log("encode ", encode1.toString(16), encode2.toString(16),
        // encode3.toString(16), encode4.toString(16));

        if (isNaN(char2)) {
          encode3 = 64
          encode4 = 64;
        } else if (isNaN(char3)) {
          encode4 = 64;
        }

        result = result + encodeTable.charAt(encode1) + encodeTable.charAt(encode2) + encodeTable.charAt(encode3)
            + encodeTable.charAt(encode4);
        // console.log("result ", encodeTable.charAt(encode1),
        // encodeTable.charAt(encode2),
        // encodeTable.charAt(encode3), encodeTable.charAt(encode4));

      } while (i < data.length);

      return result;
    };
  };

  /**
   * Supports sending 0 or more requests of data to our servers for 'loadId'
   */
  var DataSender = function(loadId, adminUrlBuilder) {
    var self = this;
    var sequence = 0;

    // place holder, intended to be overwritten
    this.onSend = function(loadId, sequence, dataUrl) {
      console.log("Domr fragment fetching ", loadId, sequence, dataUrl);
    };

    // place holder, intended to be overwritten
    this.onSent = function(loadId, sequence, dataUrl, success) {
      console.log("Domr fragment fetched ", success, loadId, sequence, dataUrl);
    };

    this.send = function(parameters) {
      var loaded = false;
      var currentSequence = sequence++;

      var image = document.createElement("img");
      image.style.visibility = "hidden";

      var url = adminUrlBuilder.getUrl("asset", "id=" + loadId + "&count=" + currentSequence);

      for (var parameter in parameters) {
        url = url + "&" + parameter + "=" + parameters[parameter];
      }

      var timer = window.setTimeout(function() {
        document.body.removeChild(image);
        self.onSent(loadId, currentSequence, url, false);
        loaded = false;
      }, 5000);

      image.onload = function() {
        window.clearTimeout(timer);
        self.onSent(loadId, currentSequence, url, true);

        if (loaded) {
          document.body.removeChild(image);
          loaded = false;
        }
      };

      this.onSend(loadId, currentSequence, url);
      image.src = url;
      if (!loaded) {
        // IE loads the asset before it is attached to the document
        document.body.appendChild(image);
        loaded = true;
      }

      //console.log("Domr fragment sent", url);
    };
  };

  var FragmentedAssetSender = function(id, asset, adminUrlBuilder) {
    var self = this;
    var allFragmentsOk = true;
    var dataSender = new DataSender(id, adminUrlBuilder);
    var base64 = new Base64();
    var SEND_STATE = { START: 0, DATA: 1, INFO: 2, DONE: 3 };

    // urls have 2k limit, reserve 100 bytes for non data portion of url,
    // base64 works best on 3 byte blocks
    var maxFragmentLength = Math.floor((2 * 1024 - 100) / 3) * 3;
    var start = 0;
    var state = SEND_STATE.START;

    var fragmentsSent = 0;
    var totalFragmentCount = Math.ceil(asset.getContent().length / maxFragmentLength) + 1;

    dataSender.onSend = function(id, sequence, url) {
    };

    dataSender.onSent = function(id, sequence, url, success) {
      self.onFragmentSent(id, url, success);

      if (!success) {
        allFragmentsOk = false;
      }

      fragmentsSent++;;
      if (fragmentsSent == totalFragmentCount) {
        self.onSent(id, asset.getUrl(), allFragmentsOk);
      }
    };

    var getParameters = function() {
      var result = null;

      if (state == SEND_STATE.START || state == SEND_STATE.DATA) {
        var end = start + maxFragmentLength;
        if (end >= asset.getContent().length) {
          end = asset.getContent().length;
        }

        var fragment = base64.encode(asset.getContent().substring(start, end));

        result = {
          'data' : fragment
        };
        start = end;

        state = SEND_STATE.DATA;
        if (start >= asset.getContent().length) {
          state = SEND_STATE.INFO;
        }
      } else if (state == SEND_STATE.INFO) {
        if (asset.getContentType()) {
          result = {
            'contentType' : encodeURIComponent(asset.getContentType()),
            'complete' : 'true'
          };
        } else {
          result = {
            'complete' : 'true'
          };
        }
        state = SEND_STATE.DONE;
      } else {
        result = null;
      }

      return result;
    };

    // place holder, intended to be overwritten
    this.onSend = function(id, url) {
      console.log("Domr sending asset ", id, url);
    };

    // place holder, intended to be overwritten
    this.onSent = function(id, url, success) {
      console.log("Domr sent asset ", success, id, url);
    };

    // place holder, intended to be overwritten
    this.onFragmentSent = function(id, dataUrl, success) {
    }

    this.sendNext = function() {
      if (state == SEND_STATE.SEND) {
        this.onSend(id, asset.getUrl());
      }

      var parameters = getParameters();
      if (parameters != null) {
        dataSender.send(parameters);
      }
    };

    this.getId = function() {
      return id;
    }

    this.getUrl = function() {
      return asset.getUrl();
    }

    this.getProgress = function() {
      return Math.floor(fragmentsSent * 100 / totalFragmentCount);
    }

    this.isOk = function() {
      return allFragmentsOk;
    }

    this.isSent = function() {
      return state == SEND_STATE.DONE;
    };
  };

  var FailedAssetSender = function(id, url, errorCode, adminUrlBuilder) {
    var self = this;
    var dataSender = new DataSender(id, adminUrlBuilder);
    var sent = false;

    dataSender.onSend = function(id, dataUrl) {
      self.onSend(id, url);
    };

    dataSender.onSent = function(id, dataUrl, success) {
      self.onFragmentSent(id, dataUrl, success);

      sent = true;
      self.onSent(id, url, success);
    };

    // place holder, intended to be overwritten
    this.onSend = function(id, url) {
      console.log("Domr sending failed for asset ", id, url);
    };

    // place holder, intended to be overwritten
    this.onSent = function(id, url, success) {
      console.log("Domr sent failed for asset ", success, id, url);
    };

    // place holder, intended to be overwritten
    this.onFragmentSent = function(id, dataUrl, success) {
    }

    this.sendNext = function() {
      if (!sent) {
        dataSender.send({
          'error' : errorCode,
          'complete' : 'true'
        });
        sent = true;
      }
    };

    this.getId = function() {
      return id;
    }

    this.getUrl = function() {
      return url;
    }

    // returns progress as a percentage (degenerate in this FailedAssetSender case)
    this.getProgress = function() {
      if (sent) {
        return 100;
      } else {
        return 0;
      }
    }

    this.isOk = function() {
      return false;
    }

    this.isSent = function() {
      return sent;
    };
  };

  var AssetSender = function(assetLoader, adminUrlBuilder) {
    var self = this;
    var maxParallelRequests = 30;
    var batchIntervalMilliseconds = 50;
    var requestCount = 0;

    var allSenders = new Object();
    var unsentSenders = new Array();
    var batchTimer = null;


    // Sending assets in batches
    //   - improves the responsiveness of the application (e.g. close button works)
    //   - avoids the chance that large assets cause the browser to complain about javascript running to much
    //   - reduces the chance of getting messages a long way out of order at the server
    // Limiting the number of outstanding requests
    //   - reduces the chance of getting assets way out of order on our servers
    var batchSender = function() {
      while(requestCount < maxParallelRequests) {
        if (unsentSenders.length == 0) {
          return;
        }
        var sender = unsentSenders[0];

        requestCount++;
        sender.sendNext();
        if (sender.isSent()) {
          unsentSenders.shift();
        }
      }
    };

    // place holder, intended to be overwritten
    // @param sender { getId(); getUrl(); getProgress(); isOk(); isSent() }
    this.onSend = function(sender) {
      console.log("Domr sending asset ", sender);
    };

    // place holder, intended to be overwritten
    // @param sender { getId(); getUrl(); getProgress(); isOk(); isSent() }
    this.onSent = function(sender) {
      console.log("Domr sent asset ", sender);
    };

    var onSent = function(id, url, success) {
      self.onSent(allSenders[id]);
      delete allSenders[id];
    };

    var onFragmentSent = function(id, fragmentUrl) {
      requestCount--;
    };

    /**
     * Sends the asset at 'url' using the id 'id'
     */
    this.send = function(id, url) {
      var asset = assetLoader.get(url);
      var sender;
      if (asset == null) {
        console.warn("Domr got error " + assetLoader.getLastStatus() + " fetching url " + url);
        sender = new FailedAssetSender(id, url, assetLoader.getLastStatus(), adminUrlBuilder);
        sender.onStart = self.onStart;
        sender.onSent = onSent;
        sender.onFragmentSent = onFragmentSent;
      } else {
        console.info("Domr loaded url " + url);
        sender = new FragmentedAssetSender(id, asset, adminUrlBuilder)
        sender.onStart = self.onStart;
        sender.onSent = onSent;
        sender.onFragmentSent = onFragmentSent;
      }

      allSenders[id] = sender;
      self.onSend(sender);
      unsentSenders.push(sender);
      if (batchTimer == null) {
        batchTimer = setInterval(batchSender, batchIntervalMilliseconds);
      }
    }

    this.cancel = function() {
      if (batchTimer != null) {
        clearTimeout(batchTimer);
      }

      if (requestCount != 0) {
        console.warn("Non zero outstanding request count");
      }
      for (var id in allSenders) {
        console.warn("Domr senders incomplete", allSenders);
        break;
      }
      if (unsentSenders.length != 0) {
        console.warn("Domr unsent senders", unsentSenders);
      }
    }
  };

  var Controller = function(assetLoader, adminUrlBuilder) {
    var self = this;
    var jsonp = new Jsonp();
    var pollingTimer = null;
    var pollingInterval = 500; // milliseconds
    var maxDeadPollCount = 5 * 60 * 1000 / pollingInterval; // 5 minutes
    var pollCount = 0;
    var cloner = "unspecified";
    var batchTimer = null;
    var maxParallelAssets = 5;
    var assets = new Object();
    var assetSender = new AssetSender(assetLoader, adminUrlBuilder);
    var sentAssets = new Object();
    var sendingCount = 0;

    assetSender.onSend = function(sender) {
      self.onFetch(sender);
    };
    assetSender.onSent = function(sender) {
      pollCount = 0;
      sendingCount--;
      self.onFetched(sender);
    };

    // place holder, intended to be overwritten
    this.onStart = function() {
      console.log("Domr start")
    };

    // place holder, intended to be overwritten
    this.onSuccess = function(bolt) {
      console.log("Domr clone complete bolt: " + bolt.url);
    };

    // for interface definition, intended to be overridden
    this.onError = function(message) {
      console.log("Domr experienced problems: " + message);
    };

    // place holder, intended to be overwritten
    this.onFetch = function(sender) {
      console.log("Domr fetching: " + sender);
    };

    // place holder, intended to be overwritten
    this.onFetched = function(sender) {
      console.log("Domr fetched: " + sender);
    };

    this._fetchAssets = function(fetch) {
      for (var id in fetch) {
        assets[id] = fetch[id];
      }

      // Don't fetch all the assets in one go
      //  - improves the responsiveness of the application,
      //  - allows other timers and events to happen (e.g. close)
      //  - allows us to send data to our servers as we load assets
      if (batchTimer == null) {
        batchTimer = setInterval(
          function() {
            for (var id in assets) {
              if (sendingCount >= maxParallelAssets) {
                break;
              }

              assetSender.send(id, assets[id]);
              sentAssets[id] = assets[id];
              delete assets[id];

              sendingCount++;
            }
          },
        200);
      }
    };

    this._load = function(data) {
      console.log("Domr polling servers", data);

      if ("error" in data) {
        console.log("Domr server sent error: ", data.error);
        this.cancel();
        this.onError(data.error);
        return;
      }

      if ("fetch" in data) {
        console.log("Domr server sent fetch", data.fetch);
        this._fetchAssets(data.fetch);
        return;
      }

      if ("bolt" in data) {
        console.log("Domr server sent bolted", data.bolt.url);
        this.cancel();
        this.onSuccess(data.bolt, data.user, data.accounts);
        return;
      }
    };

    this._poll = function() {
      if (pollCount++ > maxDeadPollCount) {
        console.error("Domr clone taking too long - aborting")
        this.onError("Domr clone taking too long - aborting")
        this.cancel();
        return;
      }

      var self = this;
      jsonp.get(adminUrlBuilder.getUrl("load", "cloner=" + encodeURIComponent(cloner)), function(data) {
        self._load(data)
      });
    };

    // Do not display anything on the page, before calling this method
    this.clonePage = function() {
      this.onStart();

      var self = this;
      jsonp.get(adminUrlBuilder.getUrl("copy", "url=" + encodeURIComponent(document.location)), function(data) {
        if ("error" in data) {
          self.onError(data.error);
          return;
        }

        cloner = data.cloner;

        self._poll();

        pollingTimer = window.setInterval(function() {
          self._poll();
        }, pollingInterval);
      });
    };

    this.cancel = function() {
      console.log("Domr controller cancelled. sendingCount:", sendingCount);

      if (pollingTimer != null) {
        window.clearTimeout(pollingTimer)
      }
      if (batchTimer != null) {
        clearTimeout(batchTimer);
      }

      assetSender.cancel();
      if (assets.length > 0) {
        console.warn("Domr unsent assets", assets);
      }
    };

    this.dump = function() {
      console.log("Dumped to server");

      jsonp.get(adminUrlBuilder.getUrl("dump", "cloner=" + encodeURIComponent(cloner)));

      jsonp.get(adminUrlBuilder.getUrl("log", "message=Client Side Outstanding Assets"));
      var count = 0;
      for (var id in assets) {
        count++;
        jsonp.get(adminUrlBuilder.getUrl("log", "message=  " + encodeURIComponent(assets[id])));
      }
      if (count == 0) {
        jsonp.get(adminUrlBuilder.getUrl("log", "message=  no outstanding assets"));
      }

      jsonp.get(adminUrlBuilder.getUrl("log", "message=Client Side Sent Assets"));
      var count = 0;
      for (var id in sentAssets) {
        count++;
        jsonp.get(adminUrlBuilder.getUrl("log", "message=  " + encodeURIComponent(sentAssets[id])));
      }
      if (count == 0) {
        jsonp.get(adminUrlBuilder.getUrl("log", "message=  no assets sent"));
      }
    }
  };

  var Panel = function() {
    var base_id = "m4-domr";
    var id = base_id;
    var logo_id = base_id + "-logo"
    var message_id = base_id + "-message";
    var close_id = base_id + "-close";

    var node = document.createElement("div");
    node.id = id;
    node.innerHTML = "<div style=\"background-image: url('https://bo.lt/app/asset/domr/domr-background.png?p=6e29bd059fdbe417456dc23c527c7f514b0a78d5'); min-width: 1024px; height: 61px; width: 100%; position:fixed; left: 0px; top: 0px; z-index: 2000000000; font: 20px Helvetica Neue, Helvetica, Arial, Sans-serif;text-align: left; color: #666\">"
      + "<div style=\"width: 900px;\">"
      + "<a href=\"https://bo.lt/app/\">"
      + "<img id=\""
      + logo_id
      + "\" style=\"border: 0\" src=\"https://bo.lt/app/asset/domr/bolt-logo.png?p=6e29bd059fdbe417456dc23c527c7f514b0a78d5\" style=\"display:inline-block; padding-left: 20px; width: 92px; height: 72px; \"/>"
      + "</a>"
      + "<div id=\""
      + message_id
      + "\" style=\"vertical-align: top; width: 1780px; position: absolute; left: 100px; top: 20px; display: inline-block; font-size: 18px;\"></div>"
      + "</div>"
      + "<div id=\""
      + close_id
      + "\" style=\"position:absolute;right:0;top:0;display: inline-block; background: url('https://bo.lt/app/asset/domr/button-close.png?p=6e29bd059fdbe417456dc23c527c7f514b0a78d5') no-repeat; width: 21px; height: 21px; margin-right: 20px; margin-top: 20px\"></div>"
      + "</div>";

    var attached = false;
    var message = "";

    var update = function() {
      if (attached) {
        document.getElementById(message_id).innerHTML = message;
      }
    };

    this.getBaseId = function() {
      return base_id;
    }

    // place holder, intended to be overwritten
    this.onDebug = function() {
      console.log("no debug")
    };

    // place holder, intended to be overwritten
    this.onClose = function() {
    };

    this.show = function() {
      document.body.appendChild(node);

      var self = this;
      document.getElementById(close_id).onclick = function() {
        self.close();
      }

      document.getElementById(logo_id).onclick = function(event) {
        if(event.shiftKey) {
          self.onDebug();
          return false;
        }
        return true;
      }

      attached = true;
      update();
      return this;
    };

    this.close = function() {
      document.getElementById(close_id).onclick = null;
      document.body.removeChild(node);
      this.onClose();
    };

    this.setMessage = function(htmlMessage) {
      message = htmlMessage;
      update();
      return this;
    };
  };

  var BoltedPanel = function(panel, adminUrlBuilder) {

    var release = function() {
      var node = document.getElementById(panel.getBaseId() + "-bolt-rename");
      if (node) {
        node.onclick = null;
      }
      node = document.getElementById(panel.getBaseId() + "-bolt-rename-form");
      if (node) {
        node.onsubmit = null;
      }
    };

    this.renameBolt = function(bolt) {
      var self = this;
      var path = document.getElementById(panel.getBaseId() + "-bolt-rename-form").path.value;
      var jsonp = new Jsonp();
      jsonp.get(
        adminUrlBuilder.getUrl("rename", "boltSlug=" + bolt.slug + "&path=" + path),
        function(data) {
          if ("bolt" in data) {
            self.put(data.bolt, data.user, data.accounts);
          } else if ("pathTaken" in data) {
            var message_text_id = panel.getBaseId() + "-message-text";
            document.getElementById(message_text_id).style.display = "none";
            document.getElementById(panel.getBaseId() + '-bolt-url').style.display = "none";
            document.getElementById(panel.getBaseId() + '-bolt-rename-form').style.display = "none";
            document.getElementById(panel.getBaseId() + '-bolt-rename-save').style.display = "none";
            document.getElementById(panel.getBaseId() + '-bolt-rename-cancel').style.display = "none";

            document.getElementById(panel.getBaseId() + "-bolt-rename-taken").style.display = "inline-block";

            document.getElementById(panel.getBaseId() + "-bolt-rename-merge-form").onsubmit = function() {
              jsonp.get(
                adminUrlBuilder.getUrl("merge", "boltSlug=" + bolt.slug + "&path=" + path),
                  function(data) {
                    if ("bolt" in data) {
                      self.put(data.bolt, data.user, data.accounts);
                    } else if ("error" in data) {
                      document.getElementById(panel.getBaseId() + "-bolt-rename-error").innerHTML = data.error;
                    } else {
                      document.getElementById(panel.getBaseId() + "-bolt-rename-error").innerHTML = "Merge failed";
                    }
                }
              );

              return false;
            }

            document.getElementById(panel.getBaseId() + "-bolt-rename-replace-form").onsubmit = function() {
              jsonp.get(
                adminUrlBuilder.getUrl("replace", "boltSlug=" + bolt.slug + "&path=" + path),
                  function(data) {
                    if ("bolt" in data) {
                      self.put(data.bolt, data.user, data.accounts);
                    } else if ("error" in data) {
                      document.getElementById(panel.getBaseId() + "-bolt-rename-taken").style.display = "none";
                      document.getElementById(panel.getBaseId() + "-bolt-rename-error").innerHTML = data.error;
                    } else {
                      document.getElementById(panel.getBaseId() + "-bolt-rename-taken").style.display = "none";
                      document.getElementById(panel.getBaseId() + "-bolt-rename-error").innerHTML = "Replace failed";
                    }
                  }
              );
              return false;
            };

          } else if ("error" in data) {
            document.getElementById(panel.getBaseId() + "-bolt-rename-taken").style.display = "none";
            document.getElementById(panel.getBaseId() + "-bolt-rename-error").innerHTML = data.error;
          } else {
            document.getElementById(panel.getBaseId() + "-bolt-rename-taken").style.display = "none";
            document.getElementById(panel.getBaseId() + "-bolt-rename-error").innerHTML = "Rename failed";
          }
        });

      return false;
    }

    this.put = function(bolt, user, accounts) {
      release();

      var message_text_id = panel.getBaseId() + "-message-text";
      var bolt_url_id = panel.getBaseId() + "-bolt-url";
      var messageHtml = '<div id="' + message_text_id + '" style="vertical-align: top; display: inline-block; padding-right: 10px; line-height: 30px;">Page loaded at </div>'
        + '<a id="' + bolt_url_id + '"href="'
        + bolt.url
        + '" title="' + bolt.url
        + '" target="_blank" style="line-height: 30px; color: #666; vertical-align: top;text-decoration:none;">'
        + 'http://'
        + bolt.domain + '/<span id="' + panel.getBaseId() + '-bolt-slug" style="vertical-align: top;color:#950B0C; font-weight: bold;">' + bolt.path + '</span>'
        + '</a>';

      if (accounts.length > 1) {
        messageHtml += '<form id="' + panel.getBaseId() + '-bolt-move-form" style="display:none;vertical-align:top;line-height:30px;">';
        var select_account_id = panel.getBaseId() + "-select-account";
        messageHtml += '<select id="' + select_account_id + '" name="account" style="font-size: 18px;background: none;line-height:30px;vertical-align: top;">';

        for ( var i = 0; i < accounts.length; i++) {
          var selected = '';
          if (accounts[i].selected) {
            selected = ' selected="1"';
          }
          messageHtml += '<option value="' + accounts[i].slug + '" ' + selected + '>' + accounts[i].domain + '/' + bolt.path + '</option>';
        }
        messageHtml += '</select>'

        messageHtml += ''
          + '<button style="dislay:inline-block;border-top:1px solid #BABABA;border-right:1px solid #A9A9A9;border-bottom:1px solid #8D8D8D;border-left:1px solid #A9A9A9;'
          + ' padding:0 7px 1px;margin-left:10px;cursor:pointer;height:28px;vertical-align:top;color:#FFF;'
          + '-webkit-border-top-right-radius: 3px;-webkit-border-bottom-right-radius:3px;-moz-border-radius-topright:3px;-moz-border-radius-bottomright:3px;border-top-right-radius:3px;'
          + 'border-bottom-right-radius:3px;background:#8D8D8D;background:-webkit-gradient(linear, left bottom, left top, color-stop(0, rgb(141, 141, 141)), color-stop(1, rgb(186, 186, 186)));'
          + 'background:-moz-linear-gradient(center bottom, rgb(141, 141, 141) 0%, rgb(186, 186, 186) 100%);'
          + '-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorStr=#BABABA,EndColorStr=#8D8D8D)";font-size: 14px;'
          + '">Apply</button>'
          + '<span id="' + panel.getBaseId() + '-bolt-move-cancel" style="color:#666;cursor:pointer;font-size:14px;margin-left:10px">Cancel</span>'
          + '<span id="' + panel.getBaseId() + '-bolt-move-error" style="color: #950B0C;font-size: 14px;margin-left:10px;"></span>'
          + '</form>';
      }

      if (accounts.length > 1) {
        messageHtml += '<span id="' + panel.getBaseId() + '-bolt-move" style="display:inline-block; vertical-align: top; margin-left: 20px; cursor: pointer; font-size: 14px;line-height:30px;">Move</span>';
      }

      if (!(user.isAnonymous || user.isRecognized)) {
        messageHtml += '<form id="' + panel.getBaseId() + '-bolt-rename-form" style="display:none;vertical-align:top;line-height:30px;background: #F7F7F7;height: 26px;'
          + 'border-top: 1px solid #BDBDBD;border-right: 1px solid #E1E1E1;border-bottom: 1px solid #E5E5E5;border-left: 1px solid #E1E1E1;-webkit-border-radius: 3px;-moz-border-radius: 3px;border-radius: 3px;">'
          + '<input id="' + panel.getBaseId() + '-bolt-rename-form-input"'
          + '" type="text" autcomplete="off" value="'
          + bolt.path
          + '" name="path" style="font-weight: bold;font-size:18px;vertical-align:top;width:200px;color:#C51818;background-color: #F7F7F7;margin:0;line-height:24px;border:none;padding: 2px 5px;font-size:16px;" />'
          + '</form>'
          + '<button id="' +  panel.getBaseId() + '-bolt-rename-save"'
          + ' style="margin:0;display:none;border-top:1px solid #BABABA;border-right:1px solid #A9A9A9;border-bottom:1px solid #8D8D8D;border-left:1px solid #A9A9A9;font-family: Helvetica Neue, Helvetica, Arial, Sans-serif;font-size: 14px;'
          + 'position:relative;left:-3px;padding:0 7px 0;cursor:pointer;height:28px;vertical-align:top;color:#FFF;background-color: #F7F7F7;'
          + '-webkit-border-top-right-radius: 3px;-webkit-border-bottom-right-radius:3px;-moz-border-radius-topright:3px;-moz-border-radius-bottomright:3px;border-top-right-radius:3px;'
          + 'border-bottom-right-radius:3px;background:#8D8D8D;background:-webkit-gradient(linear, left bottom, left top, color-stop(0, rgb(141, 141, 141)), color-stop(1, rgb(186, 186, 186)));'
          + 'background:-moz-linear-gradient(center bottom, rgb(141, 141, 141) 0%, rgb(186, 186, 186) 100%);'
          //+ '-ms-filter: \"progid:DXImageTransform.Microsoft.gradient(startColorStr=#BABABA,EndColorStr=#8D8D8D);\"'
          + '">Save</button>'
          + '<span id="' + panel.getBaseId() + '-bolt-rename-cancel" style="display: none;color:#666;cursor:pointer;font-size:14px;margin-left:10px; line-height: 30px;">Cancel</span>'
          + '<span id="' + panel.getBaseId() + '-bolt-rename-error" style="color: red;"></span>'

          + '<div id="' + panel.getBaseId() + '-bolt-rename-taken" style="display:none;vertical-align:top;">'
          + 'A bolt with that name already exists. What do you want to do? '
          + '<form id="' + panel.getBaseId() + '-bolt-rename-merge-form" style="display:inline-block;vertical-align:top;margin-left: 10px;">'
          + '<button style="dislay:inline-block;border-top:1px solid #BABABA;border-right:1px solid #A9A9A9;border-bottom:1px solid #8D8D8D;border-left:1px solid #A9A9A9;'
          + ' padding:0 7px 1px;cursor:pointer;height:28px;vertical-align:top;color:#FFF;'
          + '-webkit-border-top-right-radius: 3px;-webkit-border-bottom-right-radius:3px;-moz-border-radius-topright:3px;-moz-border-radius-bottomright:3px;border-top-right-radius:3px;'
          + 'border-bottom-right-radius:3px;background:#8D8D8D;background:-webkit-gradient(linear, left bottom, left top, color-stop(0, rgb(141, 141, 141)), color-stop(1, rgb(186, 186, 186)));'
          + 'background:-moz-linear-gradient(center bottom, rgb(141, 141, 141) 0%, rgb(186, 186, 186) 100%);'
          + '-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorStr=#BABABA,EndColorStr=#8D8D8D)";font-size:14px;'
          + '" value="merge">Merge</button>'
          + '</form>'
          + '<form id="' + panel.getBaseId() + '-bolt-rename-replace-form" style="display:inline-block;vertical-align:top;margin-left: 10px;">'
          + '<button style="dislay:inline-block;border-top:1px solid #BABABA;border-right:1px solid #A9A9A9;border-bottom:1px solid #8D8D8D;border-left:1px solid #A9A9A9;'
          + ' padding:0 7px 1px;cursor:pointer;height:28px;vertical-align:top;color:#FFF;'
          + '-webkit-border-top-right-radius: 3px;-webkit-border-bottom-right-radius:3px;-moz-border-radius-topright:3px;-moz-border-radius-bottomright:3px;border-top-right-radius:3px;'
          + 'border-bottom-right-radius:3px;background:#8D8D8D;background:-webkit-gradient(linear, left bottom, left top, color-stop(0, rgb(141, 141, 141)), color-stop(1, rgb(186, 186, 186)));'
          + 'background:-moz-linear-gradient(center bottom, rgb(141, 141, 141) 0%, rgb(186, 186, 186) 100%);'
          + '-ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorStr=#BABABA,EndColorStr=#8D8D8D)";font-size: 14px;'
          + '" value="replace">Replace</button>'
          + '</form>'
          + '<a href="#" id="' + panel.getBaseId() + '-bolt-rename-conflict-cancel" style="font-size:14px;color:#666;margin-left:10px;text-decoration:none;">Choose another name</a>'
          + '</div>'
          + '<span id="' + panel.getBaseId() + '-bolt-rename" style="display:inline-block; vertical-align: top; margin-left: 14px; cursor: pointer; font-size:14px;line-height:30px;">Rename</span>';
      }
      ;

      messageHtml += '<div style="vertical-align:top;overflow:hidden;line-height:30px;height: 24px;padding-top: 2px;display:inline-block;"><object style="display: inline-block; padding-left: 20px" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"'
        + 'width="110"'
        + 'height="14"'
        + 'id="' + panel.getBaseId() + '-bolt-clippy">'
        + '<param name="movie" value="https://bo.lt/app/asset/clippy.swf?p=6e29bd059fdbe417456dc23c527c7f514b0a78d5"/>'
        + '<param name="allowScriptAccess" value="always"/>'
        + '<param name="quality" value="high"/>'
        + '<param name="scale" value="noscale"/>'
        + '<param name="FlashVars" value="text='
        + bolt.url
        + '">'
        + '<param name="bgcolor" value="#fff">'
        + '<param name="wmode" value="transparent"/>'
        + '<embed src="https://bo.lt/app/asset/clippy.swf?p=6e29bd059fdbe417456dc23c527c7f514b0a78d5"'
        + 'wmode="transparent"'
        + 'width="62"'
        + 'height="24"'
        + 'name="clippy"'
        + 'quality="high"'
        + 'allowScriptAccess="always"'
        + 'type="application/x-shockwave-flash"'
        + 'pluginspage="http://www.macromedia.com/go/getflashplayer"'
        + 'FlashVars="text='
        + bolt.url
        + '"'
        + 'bgcolor="#fff"/>'
        + '</object></div>';

      panel.setMessage(messageHtml);

      var node = document.getElementById(panel.getBaseId() + "-bolt-rename");
      if (node) {
        node.onclick = function() {
          document.getElementById(panel.getBaseId() + "-bolt-slug").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-rename").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-clippy").style.display = "none";
          var node = document.getElementById(panel.getBaseId() + "-bolt-move");
          if (node != null) {
            node.style.display = "none";
          }

          document.getElementById(panel.getBaseId() + "-bolt-rename-form").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename-save").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename-cancel").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename-form-input").value = document.getElementById(panel.getBaseId() + "-bolt-slug").innerHTML;
          return false;
        };
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-rename-cancel");
      if (node) {
        node.onclick = function() {
          document.getElementById(panel.getBaseId() + "-bolt-rename-form").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-rename-save").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-rename-cancel").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-slug").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-clippy").style.display = "inline-block";
          var node = document.getElementById(panel.getBaseId() + "-bolt-move");
          if (node != null) {
            node.style.display = "inline-block";
          }
          return false;
        };

        node.onmouseover = function() {
          this.style.color = '#BC0000';
          this.style.textDecoration = 'underline';
          return false;
        };

        node.onmouseout = function() {
          this.style.color = '#666';
          this.style.textDecoration = 'none';
          return false;
        };
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-rename-save");
      if (node) {
        var self = this;
        node.onclick = function() {
          return self.renameBolt(bolt);
        };

        node.onmouseover = function() {
          this.style.background = '#D2D2D2';
          this.style.background = '-webkit-gradient(linear, left bottom, left top, color-stop(0, rgb(178, 178, 178)), color-stop(1, rgb(210, 210, 210)))';
          this.style.background = '-moz-linear-gradient(center bottom, rgb(178, 178, 178) 0%, rgb(210, 210, 210) 100%)';
          //this.style['-ms-filter']= 'progid:DXImageTransform.Microsoft.gradient(startColorStr=#b2b2b2,EndColorStr=#d2d2d2)';
        };

        node.onmouseout = function() {
          this.style.background = '#8D8D8D';
          this.style.background = '-webkit-gradient(linear, left bottom, left top, color-stop(0, rgb(141, 141, 141)), color-stop(1, rgb(186, 186, 186)))';
          this.style.background = '-moz-linear-gradient(center bottom, rgb(141, 141, 141) 0%, rgb(186, 186, 186) 100%)';
          //this.style['-ms-filter']= 'progid:DXImageTransform.Microsoft.gradient(startColorStr=#BABABA,EndColorStr=#8D8D8D)';
        };
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-rename-form");
      if (node) {
        var self = this;
        node.onsubmit = function() {
          return self.renameBolt(bolt);
        }
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-rename-conflict-cancel");
      if (node) {
        node.onclick = function() {
          document.getElementById(panel.getBaseId() + "-bolt-rename-taken").style.display = "none";
          document.getElementById(panel.getBaseId() + "-message-text").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-message-text").innerHTML = "Page loaded at";
          document.getElementById(panel.getBaseId() + "-bolt-url").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename-form").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename-save").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename-cancel").style.display = "inline-block";
          return false;
        }
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-move");
      if (node) {
        node.onclick = function() {
          document.getElementById(panel.getBaseId() + "-message-text").innerHTML = "Select account:";
          document.getElementById(panel.getBaseId() + "-bolt-url").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-move").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-clippy").style.display = "none";
          document.getElementById(panel.getBaseId() + "-bolt-move-form").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename").style.display = "none";
          return false;
        };
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-move-cancel");
      if (node) {
        node.onclick = function() {
          document.getElementById(panel.getBaseId() + "-bolt-move-form").style.display = "none";
          document.getElementById(panel.getBaseId() + "-message-text").innerHTML = "Page loaded at";
          document.getElementById(panel.getBaseId() + "-bolt-url").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-move").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-clippy").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-rename").style.display = "inline-block";
          document.getElementById(panel.getBaseId() + "-bolt-move-error").innerHTML = "";
          return false;
        }

        node.onmouseover = function() {
          this.style.color = '#BC0000';
          this.style.textDecoration = 'underline';
          return false;
        };

        node.onmouseout = function() {
          this.style.color = '#666';
          this.style.textDecoration = 'none';
          return false;
        };
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-move-form");
      if (node) {
        var self = this;
        node.onsubmit = function() {
          var accountSlug = document.getElementById(panel.getBaseId() + "-bolt-move-form").account.value;
          var jsonp = new Jsonp()

          jsonp.get(adminUrlBuilder.getUrl("move", "boltSlug=" + bolt.slug + "&accountSlug=" + accountSlug),
            function(data) {
              if ("bolt" in data) {
                self.put(data.bolt, data.user, data.accounts);
              } else if ("error" in data) {
                document.getElementById(panel.getBaseId() + "-bolt-move-error").innerHTML = data.error;
              } else {
                document.getElementById(panel.getBaseId() + "-bolt-move-error").innerHTML = "Move failed";
              }
            }
          );

          return false;
        }
      }

      node = document.getElementById(panel.getBaseId() + "-bolt-url");
      if (node) {
        node.onmouseover = function() {
          this.style.textDecoration = 'underline';
          this.style.color = '#950B0C';
        }
        node.onmouseout = function() {
          this.style.textDecoration = 'none';
          this.style.color = '#666';
        }
      }
    };
  };

  var CloningMessage = function(panel) {
    var self = this;
    var maxLength = 100;
    var current = 0;
    var timer = null;
    var senders = new Array();

    var put = function(sender) {
      if (sender == null) {
        panel.setMessage("Cloning...");
        return;
      }

      var url = sender.getUrl();
      if (url.length > maxLength) {
        url = "..." + url.substring(url.length - maxLength, url.length)
      }

      var progress = sender.getProgress();
      if (progress > 0) {
        panel.setMessage('Cloning...  <span style="font-size: 18px">' + url + ' ('
          + sender.getProgress() + '%)</span>');
      } else {
        panel.setMessage('Cloning...  <span style="font-size: 18px">' + url + '</span>');
      }
    }

    var displayNext = function() {
      var sender = null;

      for (var i = 0; i < senders.length; i++) {
        if (!senders[i].isSent()) {
          sender = senders[i];
          break;
        }
      }

      if (sender == null) {
        if (current >= senders.length) {
          current = 0;
        }
        if (senders.length > 0) {
          sender = senders[current];
        }
        current++;
      }

      put(sender);
    };

    var stopDisplay = function() {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
      senders = new Array();
    }

    this.sending = function(sender) {
      senders.push(sender);
    }

    // @param getAssetStatuses should return an array of AssetStatus { getUrl(); getProgress(); }
    this.start = function() {
      displayNext();
      timer = setInterval(function() {
        displayNext();
      }, 100);
    };

    this.stop = function() {
      stopDisplay();
      panel.setMessage("");
    };

    this.cancel = function() {
      stopDisplay();
    }
  }

  var Domr = function(globalName) {
    var busy = false;
    var assetLoader = new AssetLoader(new RequestBasedRootAssetFetcher());
    var sessionId = "";

    // place holder, intended to be overwritten
    this.onBusy = function() {
      console.log("Domr busy");
    };

    // place holder, intended to be overwritten
    this.onLoad = function() {
      console.log("sessionid", sessionId);
    };

    // place holder, intended to be overwritten
    this.unlock = function() {
      busy = false;
    };

    this.getAssetLoader = function() {
      return assetLoader;
    };

    this.setAssetLoader = function(loader) {
      assetLoader = loader;
    };

    this.getAdminUrlBuilder = function() {
      return new AdminUrlBuilder("https://bo.lt/app/domr", sessionId);
    };

    this.getSessionId = function() {
      return sessionId;
    };

    this._loadSessionId = function(id, retry) {
      var jsonp = new Jsonp()

      var self = this;
      // Assume we will hit every server in the cluster inside retry requests.
      jsonp.get("https://bo.lt/app/domr/session?id=" + id, function(data) {
        if ("sessionId" in data) {
          sessionId = data.sessionId;
          self.onLoad(self);
        }
        if ("retry" in data) {
          if (retry > 10) {
            alert("Unable to setup connection with BOLT")
            console.error("Unable to determine jsessionid");
          } else {
            self._loadSessionId(id, retry + 1);
          }
        }
        if ("error" in data) {
          alert("Error seting up connection with BOLT")
          console.error(data.error);
        }
      });
    };

    this.lockAndLoad = function() {
      if (busy) {
        this.onBusy();
        return;
      }
      busy = true;

      var id = new Date().getTime() + Math.floor(Math.random() * 9999);

      var self = this;
      if (!sessionId) {
        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.onload = function() {
          console.log("self", self);
          self._loadSessionId(id, 0);

          window.setTimeout(function() {
            // removing in the onload causes the browser to twirl
            document.body.removeChild(iframe);
          }, 50);
        }

        iframe.src = "https://bo.lt/app/domr/initialize?id=" + id;
        document.body.appendChild(iframe);
      } else {
        self.onLoad(self);
      }
    };
  };

  if (document.contentType && document.contentType != "text/html") {
    alert("The BO.LT Bookmarklet can only clone html pages");
    return
  }

  if (!window.__m4_domr) {
    window.__m4_domr = new Domr("__m4_domr")
  }
  var domr = window.__m4_domr;

  console.log("*Domr*");

  domr.onBusy = function() {
    alert("The BO.LT Bookmarklet is already running on this page.");
  };

  domr.onLoad = function(domr) {
    if (prime == "1") {
      console.log("Domr prime");

      var detector = new DynamicNodeDetector();
      detector.onDetect = function(dynamicIds) {
        dynamicIds["__m4_domr_script_clone"] = "__m4_domr_script_clone";

        domr.setAssetLoader(new AssetLoader(new DynamicDomBasedRootAssetFetcher(dynamicIds)));

        console.log("Domr primed");
        var panel = new Panel().setMessage("Primed.");
        panel.onClose = function() {
          domr.unlock();
        };
        panel.show();
        var timer = window.setTimeout(function() {
          panel.close();
        }, 2000);
      }
      detector.detect();
    } else {
      console.log("Domr clone");

      var panel = new Panel();
      var cloningMessage = new CloningMessage(panel);
      var controller = new Controller(domr.getAssetLoader().snapshot(), domr.getAdminUrlBuilder());

      controller.onStart = function() {
        panel.show();
        cloningMessage.start(function() {
          return controller.getAssetStatuses();
        });
      };

      controller.onSuccess = function(bolt, user, accounts) {
        cloningMessage.stop();
        new BoltedPanel(panel, domr.getAdminUrlBuilder()).put(bolt, user, accounts);
        return false;
      };

      controller.onError = function(message) {
        cloningMessage.stop();
        panel.setMessage("Error: " + message);
      };

      controller.onFetch = function(sender) {
        console.log("Domr fetching: " + sender.getUrl());
        cloningMessage.sending(sender);
      }

      controller.onFetched = function(sender) {
        if (sender.isOk()) {
          console.log("Domr fetched: " + sender.getUrl());
        } else {
          console.log("Domr unable to fetch: " + sender.getUrl());
        }
      }

      panel.onDebug = function() {
        controller.dump();
      }

      panel.onClose = function() {
        console.log("Domr close");
        domr.unlock();
        cloningMessage.cancel();
        controller.cancel();
      };

      controller.clonePage();
    }
  };

  domr.lockAndLoad();

})("");
