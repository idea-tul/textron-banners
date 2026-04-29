/* global gsap */
(function () {
  if (typeof window.CustomEvent === "function") return;
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
})();

var timeline = (function MasterTimeline() {
  var tl;
  var win = window;

  function doClickTag() { window.open(window.clickTag); }

  function initTimeline() {
    document.querySelector("#clickthrough-button").onclick = doClickTag;
    tl = createTimeline();
    win.dispatchEvent(new CustomEvent("start", { detail: { hasStarted: true } }));
  }

  function createTimeline() {
    var mainTl = gsap.timeline({
      paused: false,
      onComplete: function () {
        win.dispatchEvent(new CustomEvent("complete", { detail: { hasStopped: true } }));
      },
    });

    mainTl
      .set(".bg", { autoAlpha: 0, scale: 1.05 })
      .set(".image1, .image2", { autoAlpha: 0 })
      .set(".footer-bg, .cta-bar", { autoAlpha: 0, y: 20 })
      .set(".logo, .logo1, .logo2, .cta, .separator", { autoAlpha: 0, y: 10 })
      .set(".headline", { autoAlpha: 0, y: 20 })
      .addLabel("start")
      .to(".bg", { duration: 1.2, autoAlpha: 1, scale: 1, ease: "power2.out" }, "start")
      .to(".image1, .image2", { duration: 0.6, autoAlpha: 1, ease: "power2.out" }, "start+=0.2")
      .to(".footer-bg, .cta-bar", { duration: 0.5, autoAlpha: 1, y: 0, ease: "power2.out" }, "start+=0.4")
      .to(".logo, .logo1, .logo2, .separator", { duration: 0.5, autoAlpha: 1, y: 0, ease: "power2.out" }, "start+=0.6")
      .to(".cta", { duration: 0.5, autoAlpha: 1, y: 0, ease: "power2.out" }, "start+=0.7")
      .to(".headline", { duration: 0.7, autoAlpha: 1, y: 0, ease: "power2.out" }, "start+=0.5");

    return mainTl;
  }

  function getTimeline() { return tl; }
  return { init: initTimeline, get: getTimeline };
})();

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
    if (document.readyState === "complete") ready();
  }
  baseObj[funcName] = function (callback, context) {
    if (readyFired) {
      setTimeout(function () { callback(context); }, 1);
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

function initBanner() {
  if (typeof gsap !== "undefined") {
    document.querySelector(".banner").style.display = "block";
    timeline.init();
  } else {
    setTimeout(initBanner, 50);
  }
}

window.documentReady(initBanner);
