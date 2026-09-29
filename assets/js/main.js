(function () {
  "use strict";

  var CONFIG = {
    themeStorageKey: "solar-theme",
    calculator: {
      pricePerUnit: 4.2,
      unitsPerKwpPerMonth: 120,
      dayTimeUsageRatio: 0.7,
      monthsPerYear: 12
    }
  };

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function initTheme() {
    var toggle = document.getElementById("themeToggle");
    var stored = null;

    try {
      stored = localStorage.getItem(CONFIG.themeStorageKey);
    } catch (error) {
      stored = null;
    }

    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }

    if (!toggle) return;

    function currentTheme() {
      var attr = root.getAttribute("data-theme");
      if (attr === "light" || attr === "dark") return attr;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function syncLabel() {
      toggle.setAttribute("aria-label", currentTheme() === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด");
    }

    syncLabel();

    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      syncLabel();

      try {
        localStorage.setItem(CONFIG.themeStorageKey, next);
      } catch (error) {}
    });
  }

  function initHeader() {
    var header = document.getElementById("siteHeader");
    var toTop = document.getElementById("toTop");

    function onScroll() {
      var y = window.scrollY;

      if (header) header.classList.toggle("is-stuck", y > 8);
      if (toTop) {
        toTop.hidden = false;
        toTop.classList.toggle("is-visible", y > 600);
      }
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");

    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("is-locked", open && window.innerWidth <= 900);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    each(nav.querySelectorAll("a"), function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    var groups = document.querySelectorAll("[data-reveal-group]");

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      each(items, function (el) { el.classList.add("is-visible"); });
      return;
    }

    each(groups, function (group) {
      each(group.querySelectorAll("[data-reveal]"), function (el, index) {
        el.style.setProperty("--reveal-delay", Math.min(index, 6) * 80 + "ms");
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    each(items, function (el) { observer.observe(el); });
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");

    if (!counters.length) return;

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      each(counters, function (el) { el.textContent = formatNumber(+el.dataset.count); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    each(counters, function (el) { observer.observe(el); });

    function animate(el) {
      var target = +el.dataset.count;
      var duration = 1400;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatNumber(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }
  }

  function formatNumber(value) {
    return Number(value).toLocaleString("th-TH");
  }

  function initCalculator() {
    var input = document.getElementById("bill");
    var billOut = document.getElementById("billOut");
    var outKw = document.getElementById("outKw");
    var outSave = document.getElementById("outSave");

    if (!input) return;

    var c = CONFIG.calculator;

    function update() {
      var bill = +input.value;
      var kw = Math.max(1, Math.round((bill / c.pricePerUnit * c.dayTimeUsageRatio / c.unitsPerKwpPerMonth) * 2) / 2);
      var save = kw * c.unitsPerKwpPerMonth * c.pricePerUnit * c.monthsPerYear;

      billOut.textContent = formatNumber(bill);
      outKw.textContent = kw + " kWp";
      outSave.textContent = formatNumber(save) + " บาท";
    }

    input.addEventListener("input", update);
    update();
  }

  function initActiveLink() {
    var links = document.querySelectorAll(".nav__link");
    var sections = [];

    each(links, function (link) {
      var id = link.getAttribute("href");
      if (!id || id === "#" || id === "#top") return;
      var section = document.querySelector(id);
      if (section) sections.push({ link: link, section: section });
    });

    if (!sections.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        each(links, function (link) { link.classList.remove("is-active"); });
        var match = sections.filter(function (item) { return item.section === entry.target; })[0];
        if (match) match.link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    each(sections, function (item) { observer.observe(item.section); });
  }

  function initHeroVideo() {
    var video = document.querySelector(".hero__media");
    if (!video) return;

    if (prefersReducedMotion.matches) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    var play = video.play();

    if (play && typeof play.catch === "function") {
      play.catch(function () {
        video.removeAttribute("autoplay");
        video.setAttribute("poster", video.poster);
      });
    }

    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var resumed = video.play();
          if (resumed && typeof resumed.catch === "function") resumed.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(video);
  }

  function initYear() {
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function init() {
    initTheme();
    initHeader();
    initNav();
    initReveal();
    initCounters();
    initCalculator();
    initActiveLink();
    initHeroVideo();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
