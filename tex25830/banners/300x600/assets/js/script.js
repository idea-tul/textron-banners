/* global gsap */

// Broadcast Events shim
// ====================================================================================================
(function () {
  if (typeof window.CustomEvent === "function") {
    return false;
  }

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(
      event,
      params.bubbles,
      params.cancelable,
      params.detail
    );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
})();

// Timeline
// ====================================================================================================
var timeline = (function MasterTimeline() {
  var tl;
  var win = window;

  function doClickTag() {
    window.open(window.clickTag);
  }

  function initTimeline() {
    document.querySelector("#ad .banner").style.display = "block";
    document.getElementById("ad").addEventListener("click", doClickTag);
    createTimeline();
  }

  function createTimeline() {
    // Check if elements exist
    var sun = document.querySelector(".sun");
    var bird = document.querySelector(".bird");
    var brightIdea = document.querySelector(".bright-idea");
    var solarIncluded = document.querySelector(".solar-included");
    var logo = document.querySelector(".logo");

    tl = gsap.timeline({
      delay: 0.25,
      onStart: updateStart,
      onComplete: updateComplete,
      onUpdate: updateStats,
    });

    // ---------------------------------------------------------------------------
    // Single timeline with labeled timing
    tl.add("start")
      // Set initial positions
      .set(".bg", { "z-index": 1 })
      .set(".sun", { scale: 0, transformOrigin: "center center" })
      .set(".bird", { x: -300 })
      .set(".bright-idea", { y: 100, autoAlpha: 0 })
      .set(".solar-included", { y: 100, autoAlpha: 0 })
      .set(".logo", { scale: 0, opacity: 0, y: 50 })

      // Sun scales in
      .from(
        ".sun",
        {
          duration: 1.2,
          scale: 3.5,
          ease: "back.out(1.4)",
        },
        "start"
      )

      // Bird slides in from left
      .from(
        ".bird",
        {
          duration: 0.8,
          x: -300,
          ease: "power2.out",
        },
        "start+=0.5"
      )

      // Bright idea slides up and fades in
      .from(
        ".bright-idea",
        {
          duration: 0.8,
          y: 100,
          autoAlpha: 0,
          ease: "power2.out",
        },
        "start+=1.0"
      )

      // Solar included slides up and fades in
      .from(
        ".solar-included",
        {
          duration: 0.8,
          y: 100,
          autoAlpha: 0,
          ease: "power2.out",
        },
        "start+=1.4"
      )

      // Logo pops in
      .to(
        ".logo",
        { duration: 0.8, scale: 1, opacity: 1, y: 0, ease: "back.out(1.7)" },
        "start+=1.8"
      );

    // ---------------------------------------------------------------------------
  }

  function updateStart() {
    var start = new CustomEvent("start", {
      detail: { hasStarted: true },
    });
    win.dispatchEvent(start);
  }

  function updateComplete() {
    var complete = new CustomEvent("complete", {
      detail: { hasStopped: true },
    });
    win.dispatchEvent(complete);
  }

  function updateStats() {
    var statistics = new CustomEvent("stats", {
      detail: {
        totalTime: tl.totalTime(),
        totalProgress: tl.totalProgress(),
        totalDuration: tl.totalDuration(),
      },
    });
    win.dispatchEvent(statistics);
  }

  function getTimeline() {
    return tl;
  }

  return {
    init: initTimeline,
    get: getTimeline,
  };
})();

// Banner Init
// ====================================================================================================
// Wait for GSAP to load before initializing
function initBanner() {
  if (typeof gsap !== "undefined") {
    timeline.init();
  } else {
    setTimeout(initBanner, 50);
  }
}

// Start initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBanner);
} else {
  initBanner();
}
