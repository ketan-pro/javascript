(function () {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.injector) {
    return;
  }
  window.injector = true;

  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "markAll") {
      fillStringList(message.data);
      markText(document.body);
    }
  });

})();