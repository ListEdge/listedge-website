/* 36 Draper Street — orbit hero
   Two real render views (street elevation ↔ rear residence) with a 3D swing
   between them. Every home is a live hotspot in both views: hover for details,
   click to open that unit's floor plan. Drag horizontally or use the arrows
   to rotate. Add ?hotspots=1 to the URL to see hotspot outlines. */

(function () {
  "use strict";

  var UNITS = {
    1: { cfg: "2 bed · 2 bath · 1 carpark", price: "$545,000", status: "Available", uo: false },
    2: { cfg: "2 bed · 2 bath · 1 carpark", price: "$530,000", status: "Available", uo: false },
    3: { cfg: "2 bed · 2 bath · 1 carpark", price: "$530,000", status: "Available", uo: false },
    4: { cfg: "2 bed · 2 bath · 1 carpark", price: "$530,000", status: "Available", uo: false },
    5: { cfg: "3 bed · 2 bath · 1 carpark", price: "$625,000", status: "Under offer", uo: true },
  };

  /* Hotspots in render coordinates (1600 × 893).
     STREET view: Unit 1 nearest the corner, receding along the driveway to Unit 5.
     REAR view: Unit 5 (gable end + single-storey wing) in the foreground,
     the backs of Units 4 → 1 receding to the left. */
  var VIEWS = [
    {
      key: "street",
      label: "Street elevation",
      srcAttr: "render",
      polys: {
        1: [[623, 228], [637, 216], [651, 198], [665, 184], [679, 177], [693, 165], [707, 160], [721, 150], [735, 144], [749, 134], [763, 125], [770, 121], [776, 109], [800, 101], [824, 102], [848, 106], [872, 111], [896, 116], [920, 121], [944, 126], [968, 131], [992, 136], [1016, 141], [1040, 146], [1064, 151], [1088, 155], [1112, 160], [1136, 165], [1160, 170], [1184, 174], [1208, 179], [1232, 184], [1256, 188], [1280, 193], [1296, 195], [1320, 200], [1330, 310], [1345, 470], [1352, 652], [770, 633], [768, 629], [763, 628], [749, 626], [735, 624], [721, 621], [707, 619], [693, 616], [679, 614], [665, 612], [651, 609], [637, 607], [623, 604]],
        2: [[494, 295], [508, 288], [522, 279], [536, 272], [550, 266], [564, 251], [578, 241], [592, 237], [606, 234], [620, 231], [623, 228], [623, 604], [620, 604], [606, 601], [592, 599], [578, 596], [564, 594], [550, 592], [536, 589], [522, 587], [508, 584], [494, 582]],
        3: [[437, 328], [451, 327], [465, 315], [479, 305], [493, 295], [494, 295], [494, 582], [493, 582], [479, 579], [465, 577], [451, 575], [437, 572]],
        4: [[371, 369], [385, 362], [399, 354], [413, 345], [427, 337], [437, 328], [437, 572], [427, 570], [413, 568], [399, 566], [385, 563], [371, 561]],
        5: [[340, 391], [354, 381], [368, 371], [371, 369], [371, 561], [368, 560], [354, 558], [340, 555]],
      },
    },
    {
      key: "rear",
      label: "Rear residence",
      srcAttr: "renderRear",
      polys: {
        5: [[468, 223], [482, 212], [496, 200], [510, 191], [524, 181], [538, 176], [552, 170], [566, 152], [580, 142], [594, 140], [598, 143], [602, 149], [612, 142], [622, 127], [632, 126], [642, 114], [652, 114], [662, 120], [672, 125], [682, 131], [692, 137], [702, 143], [712, 149], [722, 155], [732, 160], [742, 167], [752, 172], [762, 180], [772, 184], [782, 190], [792, 197], [802, 201], [812, 207], [822, 215], [832, 219], [842, 226], [852, 232], [862, 236], [872, 243], [882, 248], [892, 253], [896, 255], [898, 318], [1128, 314], [1172, 360], [1164, 703], [718, 712], [700, 562], [640, 548], [598, 560], [582, 556], [566, 553], [550, 550], [534, 546], [518, 543], [502, 539], [486, 536], [470, 533], [468, 532]],
        4: [[355, 293], [369, 284], [383, 277], [397, 266], [411, 256], [425, 249], [439, 241], [453, 231], [467, 223], [468, 223], [468, 531], [467, 531], [453, 529], [439, 495], [425, 495], [411, 521], [397, 517], [383, 514], [369, 510], [355, 509]],
        3: [[294, 332], [308, 325], [322, 315], [336, 308], [350, 297], [355, 293], [355, 509], [350, 507], [336, 504], [322, 500], [308, 498], [294, 495]],
        2: [[247, 368], [261, 354], [275, 345], [289, 339], [294, 332], [294, 495], [289, 493], [275, 492], [261, 488], [247, 485]],
        1: [[214, 376], [228, 372], [242, 368], [247, 368], [247, 485], [242, 483], [228, 481], [214, 478]],
      },
    },
  ];

  var VBW = 1600, VBH = 893;
  var mount = document.getElementById("hero-media");
  var tip = document.getElementById("unit-tip");
  if (!mount || !tip) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var debug = /[?&]hotspots=1/.test(location.search);
  var NS = "http://www.w3.org/2000/svg";

  var stage = document.createElement("div");
  stage.className = "hero-stage";
  mount.appendChild(stage);

  var current = 0;
  var animating = false;
  var pulsed = {};
  var lastDragEnd = 0;

  var isCoarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var revealedEl = null;   // on touch: the hotspot currently showing its tooltip, awaiting a confirming tap

  /* ---------- build both views ---------- */
  VIEWS.forEach(function (view, vi) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + VBW + " " + VBH);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.classList.add("hero-svg");
    if (vi !== 0) svg.classList.add("v-hidden");

    var img = document.createElementNS(NS, "image");
    img.setAttribute("href", mount.dataset[view.srcAttr]);
    img.setAttribute("width", VBW);
    img.setAttribute("height", VBH);
    img.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.appendChild(img);
    if (vi === 0) {
      img.addEventListener("error", function () { mount.classList.add("no-render"); });
      img.addEventListener("load", function () { pulseView(0); });
    }

    view.polyEls = {};
    Object.keys(view.polys).forEach(function (idStr) {
      var id = Number(idStr), u = UNITS[id];
      var p = document.createElementNS(NS, "polygon");
      p.setAttribute("points", view.polys[id].map(function (pt) { return pt.join(","); }).join(" "));
      p.classList.add("unit-hotspot");
      if (debug) p.classList.add("debug");
      p.setAttribute("tabindex", vi === 0 ? "0" : "-1");
      p.setAttribute("role", "link");
      p.setAttribute("aria-label", "Unit " + id + " — " + u.cfg + " — " + u.price + " — " + u.status);
      svg.appendChild(p);
      view.polyEls[id] = p;

      function activate(cx, cy) {
        p.classList.add("hot");
        var rect = mount.getBoundingClientRect();
        tip.innerHTML =
          '<div class="u">Unit ' + id + "</div>" +
          '<div class="n">' + u.price + "</div>" +
          '<div class="d">' + u.cfg + "</div>" +
          '<div class="s' + (u.uo ? " uo" : "") + '">' + u.status.toUpperCase() + "</div>" +
          (isCoarse ? '<div class="tap-more">Tap again for floor plan</div>' : "");
        tip.classList.add("show");
        if (cx != null) {
          tip.style.left = (cx - rect.left) + "px";
          tip.style.top = (cy - rect.top) + "px";
        } else {
          var pts = view.polys[id], sx = 0, sy = 0;
          pts.forEach(function (pt) { sx += pt[0]; sy += pt[1]; });
          sx /= pts.length; sy /= pts.length;
          var s = Math.max(rect.width / VBW, rect.height / VBH);
          var ox = (rect.width - VBW * s) / 2, oy = (rect.height - VBH * s) / 2;
          tip.style.left = (sx * s + ox) + "px";
          tip.style.top = (sy * s + oy) + "px";
        }
      }
      function deactivate() {
        p.classList.remove("hot");
        tip.classList.remove("show");
        if (revealedEl === p) revealedEl = null;
      }

      if (isCoarse) {
        // Touch: first tap reveals the tooltip; a second tap on the same
        // home confirms navigation. Tapping elsewhere dismisses it.
        p.addEventListener("click", function (e) {
          if (Date.now() - lastDragEnd < 250) return;
          if (revealedEl !== p) {
            e.preventDefault();
            if (revealedEl) revealedEl.dispatchEvent(new Event("__dismiss"));
            activate(e.clientX, e.clientY);
            revealedEl = p;
            return;
          }
          window.location.href = "floor-plans.html#unit-" + id;
        });
        p.addEventListener("__dismiss", deactivate);
      } else {
        p.addEventListener("pointerenter", function (e) { activate(e.clientX, e.clientY); });
        p.addEventListener("pointermove", function (e) { activate(e.clientX, e.clientY); });
        p.addEventListener("pointerleave", deactivate);
        p.addEventListener("click", function () {
          if (Date.now() - lastDragEnd < 250) return;
          window.location.href = "floor-plans.html#unit-" + id;
        });
      }
      p.addEventListener("focus", function () { activate(null, null); });
      p.addEventListener("blur", deactivate);
      p.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = "floor-plans.html#unit-" + id;
        }
      });
    });

    stage.appendChild(svg);
    view.svg = svg;
  });

  // Touch: tapping the background (not a hotspot) dismisses whatever is revealed.
  if (isCoarse) {
    mount.addEventListener("click", function (e) {
      if (revealedEl && e.target !== revealedEl) {
        revealedEl.dispatchEvent(new Event("__dismiss"));
      }
    });
  }

  function pulseView(vi) {
    if (reduced || debug || pulsed[vi]) return;
    pulsed[vi] = true;
    var ids = Object.keys(VIEWS[vi].polyEls);
    ids.sort(function (a, b) { return a - b; });
    ids.forEach(function (id, i) {
      setTimeout(function () {
        var el = VIEWS[vi].polyEls[id];
        el.classList.add("pulse");
        setTimeout(function () { el.classList.remove("pulse"); }, 480);
      }, 800 + i * 280);
    });
  }

  /* ---------- orbit controls ---------- */
  var label = document.getElementById("orbit-label");
  var dots = document.querySelectorAll(".orbit-dots i");
  function syncControls() {
    if (label) label.textContent = VIEWS[current].label;
    dots.forEach(function (d, i) { d.classList.toggle("on", i === current); });
    VIEWS.forEach(function (v, vi) {
      Object.keys(v.polyEls).forEach(function (id) {
        v.polyEls[id].setAttribute("tabindex", vi === current ? "0" : "-1");
      });
    });
  }

  function swing(dir) {
    if (animating) return;
    var next = (current + (dir > 0 ? 1 : VIEWS.length - 1)) % VIEWS.length;
    if (next === current) return;
    animating = true;
    tip.classList.remove("show");
    if (revealedEl) { revealedEl.classList.remove("hot"); revealedEl = null; }

    var out = VIEWS[current].svg, inc = VIEWS[next].svg;

    if (reduced) {
      out.classList.add("v-hidden");
      inc.classList.remove("v-hidden");
      current = next; animating = false; syncControls(); pulseView(next);
      return;
    }

    inc.classList.remove("v-hidden");
    inc.style.transition = "none";
    inc.style.transform = "rotateY(" + (dir * 20) + "deg) translateX(" + (dir * 7) + "%) scale(1.05)";
    inc.style.opacity = "0";
    void inc.getBoundingClientRect(); // reflow

    var ease = "transform 0.68s cubic-bezier(0.24,0.8,0.26,1), opacity 0.55s ease";
    out.style.transition = ease;
    inc.style.transition = ease;
    out.style.transform = "rotateY(" + (-dir * 20) + "deg) translateX(" + (-dir * 7) + "%) scale(1.05)";
    out.style.opacity = "0";
    inc.style.transform = "none";
    inc.style.opacity = "1";

    setTimeout(function () {
      out.classList.add("v-hidden");
      out.style.transition = "none";
      out.style.transform = "none";
      out.style.opacity = "";
      current = next; animating = false;
      syncControls(); pulseView(next);
    }, 700);
  }

  var prevBtn = document.getElementById("orbit-prev");
  var nextBtn = document.getElementById("orbit-next");
  if (prevBtn) prevBtn.addEventListener("click", function () { swing(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { swing(1); });

  /* ---------- drag to rotate + parallax ---------- */
  var px = 0, py = 0;          // parallax targets
  var dragX = null, dragDelta = 0;

  function applyStage() {
    var deg = dragX == null ? 0 : Math.max(-9, Math.min(9, dragDelta * 0.035));
    stage.style.transform = "rotateY(" + deg + "deg) scale(1.06) translate(" + px + "px," + py + "px)";
  }

  var hero = mount.closest(".hero");
  if (!reduced) {
    hero.addEventListener("pointermove", function (e) {
      var r = mount.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * -14;
      py = ((e.clientY - r.top) / r.height - 0.5) * -8;
      if (dragX != null) dragDelta = e.clientX - dragX;
      requestAnimationFrame(applyStage);
    });
  }

  mount.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    dragX = e.clientX; dragDelta = 0;
  });
  window.addEventListener("pointerup", function () {
    if (dragX == null) return;
    var d = dragDelta;
    dragX = null; dragDelta = 0;
    requestAnimationFrame(applyStage);
    if (Math.abs(d) > 70) {
      lastDragEnd = Date.now();
      swing(d < 0 ? 1 : -1);   // drag left → rotate to the next view
    } else if (Math.abs(d) > 8) {
      lastDragEnd = Date.now();
    }
  });

  syncControls();
})();
