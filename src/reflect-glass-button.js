(function (global) {
  var DRAG_THRESHOLD = 6;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function detectBrowserEngine(doc) {
    var documentRef = doc || document;
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

    documentRef.documentElement.dataset.browserEngine =
      brandMatch || uaMatch ? "chromium" : "default";
  }

  function attach(target, options) {
    if (!target) {
      return null;
    }

    var settings = options || {};
    var anchor =
      settings.anchor ||
      (settings.anchorSelector
        ? document.querySelector(settings.anchorSelector)
        : document.querySelector(".reflect-glass-anchor"));

    if (!anchor) {
      return null;
    }

    var threshold =
      typeof settings.dragThreshold === "number"
        ? settings.dragThreshold
        : DRAG_THRESHOLD;

    var initialized = false;
    var offset = { x: 0, y: 0 };
    var bounds = { minX: 12, maxX: 12, minY: 12, maxY: 12 };
    var dragState = null;
    var suppressClick = false;

    target.setAttribute("draggable", "false");

    function applyOffset() {
      target.style.setProperty("--drag-x", offset.x + "px");
      target.style.setProperty("--drag-y", offset.y + "px");
    }

    function measure() {
      var margin = 12;
      bounds = {
        minX: margin,
        maxX: Math.max(margin, window.innerWidth - target.offsetWidth - margin),
        minY: margin,
        maxY: Math.max(margin, window.innerHeight - target.offsetHeight - margin),
      };

      if (!initialized) {
        var rect = anchor.getBoundingClientRect();
        offset.x = clamp(rect.right - target.offsetWidth - 6, bounds.minX, bounds.maxX);
        offset.y = clamp(
          rect.top + rect.height / 2 - target.offsetHeight / 2,
          bounds.minY,
          bounds.maxY
        );
        initialized = true;
      } else {
        offset.x = clamp(offset.x, bounds.minX, bounds.maxX);
        offset.y = clamp(offset.y, bounds.minY, bounds.maxY);
      }

      applyOffset();
    }

    target.addEventListener("pointerdown", function (event) {
      if (event.button !== 0 && event.pointerType !== "touch") {
        return;
      }

      dragState = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
        dragged: false,
      };
      suppressClick = false;
      target.classList.add("dragging");
      target.setPointerCapture(event.pointerId);
    });

    function handlePointerMove(event) {
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      var deltaX = event.clientX - dragState.startClientX;
      var deltaY = event.clientY - dragState.startClientY;

      if (!dragState.dragged && Math.hypot(deltaX, deltaY) >= threshold) {
        dragState.dragged = true;
        suppressClick = true;
      }

      offset.x = clamp(dragState.startOffsetX + deltaX, bounds.minX, bounds.maxX);
      offset.y = clamp(dragState.startOffsetY + deltaY, bounds.minY, bounds.maxY);
      applyOffset();
    }

    function finishDrag(event) {
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      dragState = null;
      target.classList.remove("dragging");

      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
    }

    target.addEventListener("pointermove", handlePointerMove);
    target.addEventListener("pointerup", finishDrag);
    target.addEventListener("pointercancel", finishDrag);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    target.addEventListener("click", function (event) {
      if (!suppressClick) {
        return;
      }

      event.preventDefault();
      suppressClick = false;
    });

    window.addEventListener("resize", measure);
    measure();

    return {
      measure: measure,
      destroy: function () {
        window.removeEventListener("resize", measure);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", finishDrag);
        window.removeEventListener("pointercancel", finishDrag);
      },
    };
  }

  function init(options) {
    detectBrowserEngine();

    var selector = options && options.selector
      ? options.selector
      : "[data-reflect-glass]";

    var elements = Array.prototype.slice.call(document.querySelectorAll(selector));
    return elements
      .map(function (element) {
        return attach(element, options);
      })
      .filter(Boolean);
  }

  global.ReflectGlassButton = {
    init: init,
    attach: attach,
    detectBrowserEngine: detectBrowserEngine,
  };
})(window);
