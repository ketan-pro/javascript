let stringList = new Map();
stringList.set("FireFox", "FireFox");
stringList.set("apple", "apple");
stringList.set("Window", "Window");

function markText(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    let content = node.textContent;

    for (let [key, val] of stringList) {
      if(content.toLowerCase().includes(key.toLowerCase())) {
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