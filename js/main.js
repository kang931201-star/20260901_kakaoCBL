/* ============================================================
   랭킹전 이벤트 페이지 — main.js
   1. SEASON      시즌 D-day / 게이지 (날짜 기준 자동 전환)
   2. ACCORDION   유의사항 열고 닫기
   3. BENEFIT     EVENT 03 혜택 카드 골드 강조 이동
   4. HOWTO TABS  참여 방법 PC방/개인PC 탭 전환
   5. PROGRESS    상단 스크롤 진행바
   6. REVEAL      스크롤 등장 애니메이션
   7. PARALLAX    KV 커서 반응(깊이 층)
   8. SILK        KV 배경 WebGL 셰이더
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 시즌 정의 (여기만 수정하면 전체 반영) ---------- */
  var SEASONS = [
    { name: "시즌 9",  from: new Date(2026, 8, 1),  to: new Date(2026, 8, 30, 23, 59, 59) },
    { name: "시즌 10", from: new Date(2026, 9, 1),  to: new Date(2026, 9, 31, 23, 59, 59) }
  ];
  function currentSeason() {
    var now = new Date();
    for (var i = 0; i < SEASONS.length; i++) if (now <= SEASONS[i].to) return SEASONS[i];
    return SEASONS[SEASONS.length - 1];
  }
  var pad = function (n) { return String(n).padStart(2, "0"); };

  /* ---------- 1. SEASON ---------- */
  (function initSeason() {
    var box = document.querySelector("[data-season]");
    if (!box) return;
    var q = function (k) { return box.querySelector("[data-season-" + k + "]"); };
    var md = function (d) { return pad(d.getMonth() + 1) + "." + pad(d.getDate()); };
    var days = function (a, b) { return Math.max(0, Math.ceil((b - a) / 86400000)); };

    var now = new Date(), s = currentSeason();
    var before = now < s.from, ended = now > s.to;

    q("label").textContent = s.name + (before ? " 시작 예정" : ended ? " 종료" : " 진행 중");
    q("dday").textContent = ended ? "종료" : "D-" + days(now, before ? s.from : s.to);
    q("from").textContent = md(s.from);
    q("to").textContent = md(s.to);

    var pct = before ? 0 : Math.min(100, ((now - s.from) / (s.to - s.from)) * 100);
    requestAnimationFrame(function () { q("bar").style.width = (ended ? 100 : pct) + "%"; });

    if (before || ended) {
      var dot = q("dot");
      dot.style.background = "#9C8A6A";
      dot.style.boxShadow = "none";
      dot.style.animation = "none";
    }
  })();

  /* ---------- 2. ACCORDION ---------- */
  (function initAccordion() {
    var btns = document.querySelectorAll("[data-acc]");
    Array.prototype.forEach.call(btns, function (btn) {
      var panel = document.getElementById(btn.getAttribute("data-acc"));
      if (!panel) return;
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        panel.hidden = open;
        btn.querySelector(".acc__arrow").textContent = open ? "▾" : "▴";
      });
    });
  })();

  /* ---------- 3. BENEFIT (EVENT 03) ---------- */
  (function initBenefit() {
    var cards = document.querySelectorAll("[data-benefit]");
    if (!cards.length) return;
    var setActive = function (card) {
      Array.prototype.forEach.call(cards, function (c) {
        c.classList.toggle("is-active", c === card);
      });
    };
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener("mouseenter", function () { setActive(card); });
      card.addEventListener("focusin", function () { setActive(card); });
    });
  })();

  /* ---------- 4. HOWTO TABS (참여 방법) ---------- */
  (function initHowtoTabs() {
    var tabs = document.querySelectorAll("[data-howto-tab]");
    var panels = document.querySelectorAll("[data-howto-panel]");
    if (!tabs.length || !panels.length) return;
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-howto-tab");
        Array.prototype.forEach.call(tabs, function (t) {
          var active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", String(active));
        });
        Array.prototype.forEach.call(panels, function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-howto-panel") === key);
        });
      });
    });
  })();

  /* ---------- 5. PROGRESS + 6. REVEAL ---------- */
  var bar = document.getElementById("progress");
  function progress() {
    if (!bar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0) * 1 + "%";
  }

  var pending = [];
  (function prepareReveal() {
    if (reduced) return;
    var targets = [];
    Array.prototype.forEach.call(document.querySelectorAll("section"), function (sec) {
      if (sec.id === "hero") return;
      // 배경 데코(aria-hidden)는 제외 — opacity가 덮어써지면 배경이 뒤집힌다
      var wrap = Array.prototype.filter.call(sec.children, function (c) {
        return c.getAttribute("aria-hidden") !== "true";
      })[0];
      if (!wrap) return;
      Array.prototype.forEach.call(wrap.children, function (c) {
        if (c.getAttribute("aria-hidden") !== "true") targets.push(c);
      });
    });
    targets.forEach(function (el, i) {
      el.style.opacity = "0";
      el.style.transform = "translateY(22px)";
      el.style.transitionDelay = ((i % 4) * 70) + "ms";
      el.style.transition = "opacity .7s cubic-bezier(.22,.7,.3,1), transform .7s cubic-bezier(.22,.7,.3,1)";
    });
    pending = targets.slice();
  })();

  var tick = null;
  function show(el) { el.style.opacity = "1"; el.style.transform = "none"; }
  function sweep() {
    if (!pending.length) { if (tick) clearInterval(tick); return; }
    var h = window.innerHeight * 0.94;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < h) { show(el); return false; }
      return true;
    });
  }

  window.addEventListener("scroll", function () { sweep(); progress(); }, { passive: true });
  window.addEventListener("resize", function () { sweep(); progress(); });
  tick = setInterval(sweep, 300);
  sweep(); progress();
  // 안전장치: 20초 뒤 남은 요소 무조건 노출
  setTimeout(function () { pending.forEach(show); pending = []; if (tick) clearInterval(tick); }, 20000);

  if (reduced) return;

  /* ---------- 7. PARALLAX (KV 커서 반응) ---------- */
  (function initParallax() {
    var hero = document.getElementById("hero");
    if (!hero) return;
    var ribbons = Array.prototype.slice.call(document.querySelectorAll("[data-ribbon]"));
    var depth = Array.prototype.slice.call(document.querySelectorAll("[data-kv-depth]"));
    var trophy = document.getElementById("kvTrophy");
    if (trophy) depth.push(trophy);
    if (!ribbons.length && !depth.length) return;

    ribbons.concat(depth).forEach(function (el) {
      el.style.transition = "translate .65s cubic-bezier(.22,.7,.3,1)";
    });

    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      ribbons.forEach(function (el, i) {
        var d = i === 0 ? 1 : -1;
        el.style.translate = (nx * 26 * d) + "px " + (ny * 17 * d) + "px";
      });
      depth.forEach(function (el) {
        var k = parseFloat(el.getAttribute("data-kv-depth") || ".45");
        el.style.translate = (nx * 15 * k) + "px " + (ny * 9 * k) + "px";
      });
    });
    hero.addEventListener("mouseleave", function () {
      ribbons.concat(depth).forEach(function (el) { el.style.translate = ""; });
    });
  })();

  /* ---------- 8. SILK (KV 배경 WebGL) ---------- */
  (function initSilk() {
    var cv = document.getElementById("silk");
    if (!cv) return;
    var gl = cv.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) { cv.style.display = "none"; return; }

    var vs = "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}";
    var fs = [
      "precision mediump float;varying vec2 vUv;",
      "uniform float uTime;uniform vec3 uColor;uniform float uSpeed,uScale,uRotation,uNoise;",
      "float rnd(vec2 uv){return fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453);}",
      "vec2 rot(vec2 uv,float a){float c=cos(a),s=sin(a);uv-=0.5;uv=vec2(uv.x*c-uv.y*s,uv.x*s+uv.y*c);return uv+0.5;}",
      "void main(){",
      " vec2 uv=rot(vUv,uRotation)*uScale;",
      " float t=uSpeed*uTime;",
      " uv.y-=0.03*sin(8.0*uv.x-t);",
      " float pat=0.6+0.4*sin(5.0*(uv.x+uv.y+cos(3.0*uv.x+5.0*uv.y)-0.02*t)+sin(20.0*(uv.x+uv.y+0.1*t)));",
      " vec3 c=uColor*pat-rnd(gl_FragCoord.xy)/15.0*uNoise;",
      " gl_FragColor=vec4(max(c,0.0),1.0);",
      "}"
    ].join("\n");

    function mk(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.style.display = "none"; return; }
    gl.useProgram(pr);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uT = gl.getUniformLocation(pr, "uTime");
    // 톤/속도 조절 지점
    gl.uniform3f(gl.getUniformLocation(pr, "uColor"), 0.20, 0.19, 0.18); // 블랙 톤
    gl.uniform1f(gl.getUniformLocation(pr, "uSpeed"), 0.8);
    gl.uniform1f(gl.getUniformLocation(pr, "uScale"), 1.1);
    gl.uniform1f(gl.getUniformLocation(pr, "uRotation"), 0.15);
    gl.uniform1f(gl.getUniformLocation(pr, "uNoise"), 1.4);

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      var w = Math.max(1, Math.round(cv.clientWidth * dpr));
      var h = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    }
    window.addEventListener("resize", resize);

    var t0 = performance.now();
    (function loop() {
      resize();
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(loop);
    })();
  })();
})();
