(function () {
  if (window.highlighter) {
    return;
  }
  window.highlighter = true;

  let stringList = new Map();
  stringList.set("firefox", "firefox");
  stringList.set("google", "google");
  stringList.set("microsoft", "microsoft");
  stringList.set("iframe", "iframe");
  
  window.fillStringList = function(strArr) {
    stringList.clear();
    for (var i = 0; i < strArr.length; i++) {
      stringList.set(strArr[i], strArr[i]);
    }
  }

  window.markText = function(node) {
    if(node.tagName == "IFRAME") {
      return markText(node.contentDocument.documentElement);
    }
    if (node.placeholder || node.nodeType === Node.TEXT_NODE || node.tagName == "SELECT") {
      var marker_size = window.highlight_marker && window.highlight_marker.size?  window.highlight_marker.size : '2';
      var marker_color = window.highlight_marker && window.highlight_marker.color?  window.highlight_marker.color : 'red';
      var match_full = window.highlight_marker && window.highlight_marker.matchFullStr? window.highlight_marker.matchFullStr : false;
      for (let [key, val] of stringList) {
        var str = key.toLowerCase();
        if (node.placeholder) {
          var origStr = node.placeholder.trim().toLowerCase();
          var status = match_full? (origStr == str) : origStr.includes(str);
          if(status && !node.value) {
            node.style.border = marker_size + "px solid " + marker_color;
          }          
        }
        if (node.tagName == "SELECT") {
          for (let child of node.children) {
            var origStr = child.textContent.trim().toLowerCase();
            var status = match_full? (origStr == str) : origStr.includes(str);
            if (status) {
              child.parentNode.style.border = marker_size + "px solid " + marker_color;
              child.style.color = marker_color;
            }
          }
        }
        else if (str) {
          var origStr = node.textContent.trim().toLowerCase();
          var status = match_full? (origStr == str) : origStr.includes(str);
          if(status) {
            node.parentNode.style.border = marker_size + "px solid " + marker_color;
          }
        } 
      }
    }
    else {
      for (let i = 0; i < node.childNodes.length; i++) {
        markText(node.childNodes[i]);
      }
    }
  }

  // Now monitor the DOM for additions and substitute emoji into new nodes.
  // @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // This DOM change was new nodes being added. Run our substitution
        // algorithm on each newly added node.
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const newNode = mutation.addedNodes[i];
          markText(newNode);
        }
      }
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();