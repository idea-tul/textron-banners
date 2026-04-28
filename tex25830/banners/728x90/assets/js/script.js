/* global TimelineMax, Power4, EB, EBG */

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

    // Check if GSAP is loaded
    if (typeof gsap === "undefined") {
      console.error("GSAP is not loaded!");
      return;
    }

    // Check if elements exist
    const elements = [
      ".bird",
      ".phone-container",
      ".phone-screen",
      ".logo",
      ".new-bird",
      ".who-dis",
      ".hd-bar",
    ];
    elements.forEach((selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        console.error(`Element not found: ${selector}`);
      } else {
      }
    });

    createTimeline();
  }

  function createTimeline() {
    tl = gsap.timeline({
      delay: 0.25,
      onStart: updateStart,
      onComplete: updateComplete,
      onUpdate: updateStats,
    });
    // ---------------------------------------------------------------------------

    // Set initial positions for elements that will animate in
    tl.set(".bird", { x: 0, opacity: 0 })
      .set(".bg", { "z-index": 1 })
      .set(".phone-container", { y: 150, opacity: 0 })
      .set(".phone-screen", { y: 0, opacity: 1 })
      .set(".phone-screen-2", { y: 0, opacity: 1 })
      .set(".logo", { scale: 0, opacity: 0 })
      .set(".new-bird", { x: 0, opacity: 0 })
      .set(".who-dis", { x: 0, opacity: 0 })
      .set(".hd-bar", { x: 0, opacity: 0 });

    // Animation sequence
    tl.addLabel("start")
      // Bird slides in from left
      .from(
        ".bird",
        { duration: 0.8, x: -200, opacity: 1, ease: "power3.out" },
        "start"
      )

      // Phone slides in from bottom
      .to(
        ".phone-container",
        { duration: 0.8, y: 0, opacity: 1, ease: "power3.out" },
        "start+=0.3"
      )

      // Phone screen scrolling effect (continuous throughout animation)

      .to(
        ".phone-screen-2",
        {
          duration: 5,
          delay: 2,
          repeatDelay: 2,
          y: "-55%",
          ease: "linear",
          repeat: -1,
        },
        "start+=0.8"
      )

      // Logo pops in
      .to(
        ".logo",
        { duration: 0.8, scale: 1, opacity: 1, ease: "back.out(1.7)" },
        "start+=1"
      )

      // NEW BIRD slides in from behind (right to left)
      .from(
        ".new-bird",
        { duration: 1, y: 200, opacity: 1, ease: "power3.out" },
        "start+=1.4"
      )

      // WHO DIS slides in from behind (right to left)
      .from(
        ".who-dis",
        { duration: 1, y: -200, opacity: 1, ease: "power3.out" },
        "start+=1.4"
      )

      // HD bar slides in from behind bird (right to left)
      .from(
        ".hd-bar",
        { duration: 1, x: -200, opacity: 1, ease: "power3.out" },
        "start+=2.4"
      );

    // ---------------------------------------------------------------------------

    // DEBUG:
    // tl.play('start'); // start playing at label:start
    // tl.pause('start'); // pause the timeline at label:start
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
