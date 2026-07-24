/* 36 Draper Street — shared behaviour */
(function () {
  "use strict";

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- graceful image fallbacks ---------- */
  document.querySelectorAll("[data-ph] img").forEach(function (img) {
    function markMissing() { img.closest(".ph").classList.add("missing"); }
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener("error", markMissing);
  });

  /* ---------- floor plan tabs ---------- */
  var tabs = document.querySelectorAll(".unit-tab");
  var panels = document.querySelectorAll(".plan-panel");
  function activateUnit(id, scroll) {
    tabs.forEach(function (t) { t.classList.toggle("active", t.dataset.unit === id); });
    panels.forEach(function (p) { p.classList.toggle("active", p.id === "unit-" + id); });
    if (scroll) {
      var panelTop = document.querySelector(".unit-tabs");
      if (panelTop) panelTop.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }
  if (tabs.length) {
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        activateUnit(t.dataset.unit, false);
        history.replaceState(null, "", "#unit-" + t.dataset.unit);
      });
    });
    var hash = (location.hash || "").replace("#unit-", "");
    if (hash && document.getElementById("unit-" + hash)) activateUnit(hash, true);
    else activateUnit("1", false);
  }

  /* ---------- gallery filters + lightbox ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var figures = Array.prototype.slice.call(document.querySelectorAll(".grid-gallery figure"));
  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      filterBtns.forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      var f = b.dataset.filter;
      figures.forEach(function (fig) {
        fig.style.display = (f === "all" || fig.dataset.cat === f) ? "" : "none";
      });
    });
  });

  var lb = document.getElementById("lightbox");
  if (lb && figures.length) {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");
    var current = 0;

    function visibleFigures() {
      return figures.filter(function (f) { return f.style.display !== "none" && !f.querySelector(".ph").classList.contains("missing"); });
    }
    function openAt(fig) {
      var vis = visibleFigures();
      current = vis.indexOf(fig);
      if (current < 0) return;
      show(vis);
    }
    function show(vis) {
      var fig = vis[current];
      var img = fig.querySelector("img");
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = (fig.querySelector("figcaption") || {}).textContent || "";
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("open");
      document.body.style.overflow = "";
    }
    function step(d) {
      var vis = visibleFigures();
      current = (current + d + vis.length) % vis.length;
      show(vis);
    }

    figures.forEach(function (fig) {
      fig.querySelector(".ph").addEventListener("click", function () { openAt(fig); });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- contact form (Formspree) ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var status = document.getElementById("form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";

      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        status.textContent = "The enquiry form isn't connected yet — call 027 345 3219 or email harsh@klyne.nz instead.";
        status.classList.add("err");
        return;
      }
      if (form.querySelector('[name="_gotcha"]').value) return; // honeypot

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "Sending…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            status.textContent = "Thanks — your enquiry is on its way. Harsh will come back to you shortly.";
            status.classList.add("ok");
          } else {
            throw new Error("bad status");
          }
        })
        .catch(function () {
          status.textContent = "That didn't send. Please call 027 345 3219 or email harsh@klyne.nz.";
          status.classList.add("err");
        })
        .finally(function () {
          btn.disabled = false;
          btn.innerHTML = 'Send enquiry <span class="chev">›</span>';
        });
    });
  }
})();
