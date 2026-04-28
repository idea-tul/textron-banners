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
      .set(".wave", { autoAlpha: 1, "z-index": 1 })
      .set(".bg", { "z-index": 1 })
      .set(".camera", { x: -200, autoAlpha: 0 })
      .set(".feeder", { y: 50, autoAlpha: 0 })
      .set(".logo", { scale: 0, autoAlpha: 0, opacity: 0 })
      .set(".f-letter", { opacity: 0 })
      .set(".i-letter", { opacity: 0 })
      .set(".y-letter", { opacity: 0 })
      .set(".underscore", { opacity: 0 })
      .set(".comes", { y: 30, autoAlpha: 0 })
      .set(".with-ai", { y: 30, autoAlpha: 0 })
      .set(".stars", { scale: 0, autoAlpha: 0 })

      // Camera slides in from left
      .to(
        ".camera",
        {
          duration: 0.8,
          x: 0,
          autoAlpha: 1,
          ease: "power2.out",
        },
        "start"
      )

      // Feeder pops in from bottom
      .to(
        ".feeder",
        {
          duration: 0.6,
          y: 0,
          autoAlpha: 1,
          ease: "back.out(1.7)",
        },
        "start+=0.6"
      )

      // Logo pops in
      .to(
        ".logo",
        {
          duration: 0.5,
          scale: 1,
          autoAlpha: 1,
          ease: "back.out(2)",
        },
        "start+=4.2"
      )

      // FIY letters build in one at a time
      .from(
        ".f-letter",
        {
          duration: 0.5,
          opacity: 0,
          ease: "power2.easeIn",
        },
        "start+=1.0"
      )
      .from(
        ".y-letter",
        {
          duration: 0.5,
          opacity: 0,
          ease: "power3.easeIn",
        },
        "start+=1.5"
      )
      .from(
        ".i-letter",
        {
          duration: 0.5,
          opacity: 0,
          ease: "power3.easeIn",
        },
        "start+=2.0"
      )

      // Underscore appears
      .from(
        ".underscore",
        {
          duration: 0.5,
          opacity: 0,
          ease: "power3.easeIn",
        },
        "start+=2.5"
      )

      // COMES slides in from bottom with slight bounce
      .to(
        ".comes",
        {
          duration: 0.5,
          y: 0,
          autoAlpha: 1,
          ease: "back.out(1.5)",
        },
        "start+=3.0"
      )

      // WITH AI slides in from bottom with slight bounce
      .to(
        ".with-ai",
        {
          duration: 0.5,
          y: 0,
          autoAlpha: 1,
          ease: "back.out(1.5)",
        },
        "start+=3.5"
      )

      // Stars/twinkles pop in
      .to(
        ".stars",
        {
          duration: 1,
          scale: 1,
          autoAlpha: 1,
          ease: "back.out(2)",
        },
        "start+=1.5"
      )

      // Stars twinkle effect (repeating scale animation)
      .to(
        ".stars",
        {
          duration: 0.5,
          scale: 1.3,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
        },
        "start+=2.3"
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
