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
      for (let [key, val] of stringList) {
        var str = key.toLowerCase();
        if (node.placeholder) {
          if(node.placeholder.toLowerCase().includes(str) && !node.value) {
            node.style.border = "4px solid red";
          }          
        }
        if (node.tagName == "SELECT") {
          for (let child of node.children) {
            if (child.textContent.toLowerCase().includes(str)) {
              child.parentNode.style.border = "2px solid red";
              child.style.color = "red";
            }
          }
        }
        else if (str && node.textContent.toLowerCase().includes(str)) {
          //node.parentNode.style.background = "yellow";
          node.parentNode.style.border = "4px solid red";
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