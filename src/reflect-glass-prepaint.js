(function (global) {
  function detectBrowserEngine(doc) {
    var documentRef = doc || document;
    var root = documentRef.documentElement;
    var brands = navigator.userAgentData && Array.isArray(navigator.userAgentData.brands)
      ? navigator.userAgentData.brands
      : [];
    var brandMatch = brands.some(function (item) {
      return /Chromium|Google Chrome|Microsoft Edge|Opera/i.test(item.brand);
    });
    var ua = navigator.userAgent || "";
    var isIOS = /\b(iPad|iPhone|iPod)\b/.test(ua);
    var uaMatch =
      !isIOS &&
      /\b(?:Chromium|Chrome|Edg|OPR|SamsungBrowser)\//.test(ua) &&
      !/\b(?:Firefox|FxiOS)\//.test(ua);
    var engine = brandMatch || uaMatch ? "chromium" : "default";

    root.dataset.browserEngine = engine;
    root.classList.toggle("browser-chromium", engine === "chromium");
    return engine;
  }

  global.ReflectGlassPrepaint = {
    detectBrowserEngine: detectBrowserEngine,
  };

  if (typeof document !== "undefined") {
    detectBrowserEngine(document);
  }
})(window);
