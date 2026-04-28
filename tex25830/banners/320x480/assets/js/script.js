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
    document.querySelector("#clickthrough-button").onclick = doClickTag;
    tl = createTimeline();
    updateStart();
  }

  function createTimeline() {
    var mainTl = gsap.timeline({ paused: false, onComplete: updateComplete });

    // Set initial positions and create timeline with label
    mainTl
      .addLabel("start")
      .set(".bg", { "z-index": 1 })
      .set(".bird", { x: -200 })
      .set(".feeder", { x: 100, autoAlpha: 0 })
      .set(".birds-are-cool", { y: 50, autoAlpha: 0 })
      .set(".shipping-is-not", { y: 50, autoAlpha: 0 })
      .set(".logo", { scale: 0, opacity: 0 })
      // Shapes wiggle effect - small subtle movement
      .to(
        ".shape-1",
        {
          duration: 4,
          rotation: 2,
          y: -3,
          scale: 1.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        },
        "start"
      )
      .to(
        ".shape-2",
        {
          duration: 4,
          rotation: 2,
          y: -3,
          scale: 1.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        },
        "start"
      )
      .to(
        ".shape-3",
        {
          duration: 4,
          rotation: 2,
          y: -3,
          scale: 1.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        },
        "start"
      )
      .to(
        ".shape-4",
        {
          duration: 4.5,
          rotation: -2,
          x: 3,
          scale: 1.15,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        },
        "start"
      )
      .to(
        ".shape-5",
        {
          duration: 3.5,
          rotation: 3,
          x: -2,
          y: 2,
          scale: 1.25,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        },
        "start"
      )
      // Bird slides in from left
      .from(
        ".bird",
        {
          duration: 0.8,
          x: -200,
          ease: "back.out(1.7)",
        },
        "start+=0.6"
      )
      // Feeder pops in from right
      .from(
        ".feeder",
        {
          duration: 0.8,
          x: 100,
          autoAlpha: 0,
          ease: "back.out(1.7)",
        },
        "start+=.6"
      )
      // Birds are cool slides up
      .from(
        ".birds-are-cool",
        {
          duration: 0.6,
          y: 50,
          autoAlpha: 0,
          ease: "power2.out",
        },
        "start+=1.4"
      )
      // Shipping is not slides up
      .from(
        ".shipping-is-not",
        {
          duration: 0.6,
          y: 50,
          autoAlpha: 0,
          ease: "power2.out",
        },
        "start+=1.6"
      )
      // Logo pops in with bounce
      .from(
        ".logo",
        {
          duration: 0.6,
          scale: 0,
          opacity: 0,
          ease: "back.out(2)",
        },
        "start+=1.8"
      );

    return mainTl;
  }

  function updateStart() {
    var hasStarted = true;
    win.dispatchEvent(
      new CustomEvent("start", { detail: { hasStarted: hasStarted } })
    );
  }

  function updateComplete() {
    var hasStopped = true;
    win.dispatchEvent(
      new CustomEvent("complete", { detail: { hasStopped: hasStopped } })
    );
  }

  function updateStats() {
    var totalTime = tl.time();
    var totalDuration = tl.duration();
    var totalProgress = tl.progress();
    win.dispatchEvent(
      new CustomEvent("stats", {
        detail: {
          totalTime: totalTime,
          totalDuration: totalDuration,
          totalProgress: totalProgress,
        },
      })
    );
  }

  function getTimeline() {
    return tl;
  }

  return {
    init: initTimeline,
    get: getTimeline,
  };
})();

// DOM Ready (Cross-Browser)
// ====================================================================================================
(function (funcName, baseObj) {
  "use strict";
  funcName = funcName || "documentReady";
  baseObj = baseObj || window;
  var readyList = [];
  var readyFired = false;
  var readyEventHandlersInstalled = false;

  function ready() {
    if (!readyFired) {
      readyFired = true;
      for (var i = 0; i < readyList.length; i++) {
        readyList[i].fn.call(window, readyList[i].ctx);
      }
      readyList = [];
    }
  }

  function readyStateChange() {
    if (document.readyState === "complete") {
      ready();
    }
  }

  baseObj[funcName] = function (callback, context) {
    if (readyFired) {
      setTimeout(function () {
        callback(context);
      }, 1);
      return;
    } else {
      readyList.push({ fn: callback, ctx: context });
    }

    if (document.readyState === "complete") {
      setTimeout(ready, 1);
    } else if (!readyEventHandlersInstalled) {
      if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", ready, false);
        window.addEventListener("load", ready, false);
      } else {
        document.attachEvent("onreadystatechange", readyStateChange);
        window.attachEvent("onload", ready);
      }
      readyEventHandlersInstalled = true;
    }
  };
})("documentReady", window);

// Wait for GSAP to load before initializing
function initBanner() {
  if (typeof gsap !== "undefined") {
    document.querySelector(".banner").style.display = "block";
    timeline.init();
    setInterval(timeline.get().updateStats, 33);
  } else {
    setTimeout(initBanner, 50);
  }
}

window.documentReady(initBanner);
