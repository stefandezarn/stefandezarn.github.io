/*
 * Find the imperfections.
 * The mark is cut into pieces; every piece carries one flaw.
 * Remove the flaws and you remove the mark.
 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var dataLayer = (window.dataLayer = window.dataLayer || []);

  var IMPERFECTIONS = [
    ['(not set)', 'A dimension with nowhere to go.'],
    ['(other)', 'Your rows exceeded the cardinality limit.'],
    ['Data thresholds applied', 'Some data was withheld to protect user privacy.'],
    ['Sampled', 'This report is based on 8.3% of available data.'],
    ['Self-referral', 'Your payment gateway is now your top traffic source.'],
    ['Modeled conversions', 'Consent mode filled in the blanks for you.'],
    ['14-month retention', 'Last year quietly expired.'],
    ['Processing delay', 'Data may take up to 48 hours to appear.'],
    ['Unassigned', 'Session default channel group: Unassigned.'],
    ['Duplicate purchase', 'Same transaction_id, counted twice.'],
    ['Bot traffic', 'A data center in Ashburn really likes your site.'],
    ['(direct) / (none)', 'Nobody knows where they came from.']
  ];

  var SHRUGS = [
    'No anomalies detected.',
    'Looks fine to me.',
    'Within expected range.',
    'Working as intended.',
    'Nothing to see here. Probably.'
  ];

  // Three shapes: a dot, a medium bar, a tall bar.
  var SHAPES = [
    { id: 'dot', fill: 'url(#gDot)', el: ['circle', { cx: 120, cy: 310, r: 30 }],
      x: 90, w: 60, top: 280, bottom: 340, bands: 1, split: true },
    { id: 'mid', fill: 'url(#gMid)', el: ['rect', { x: 170, y: 160, width: 60, height: 180, rx: 30 }],
      x: 170, w: 60, top: 160, bottom: 340, bands: 4 },
    { id: 'tall', fill: 'url(#gTall)', el: ['rect', { x: 250, y: 60, width: 60, height: 280, rx: 30 }],
      x: 250, w: 60, top: 60, bottom: 340, bands: 6 }
  ];

  var piecesEl = document.getElementById('pieces');
  var defsEl = document.getElementById('defs');
  var svg = document.getElementById('mark');
  var counterEl = document.getElementById('counter');
  var captionEl = document.getElementById('caption');
  var promptEl = document.getElementById('prompt');
  var endEl = document.getElementById('end');

  var pieces, found, misclicks, startedAt, idleTimer, captionAt, run = 0;

  function el(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- flaw drawings (all subtle; opacity does the rest) ----------
  var DRAW = {
    crack: function (g, x, y) {
      g.appendChild(el('path', {
        d: 'M' + (x - 6) + ' ' + (y - 5) + ' l3 3 l-1.5 3 l4 1.5 l1 3.5 l2.5 1',
        fill: 'none', stroke: 'rgba(90,35,0,.85)', 'stroke-width': .7, 'stroke-linecap': 'round'
      }));
    },
    pixel: function (g, x, y) {
      g.appendChild(el('rect', { x: x - 2, y: y - 2, width: 3.5, height: 3.5, fill: 'rgba(255,255,255,.55)' }));
      g.appendChild(el('rect', { x: x + 1.5, y: y + 1.5, width: 3.5, height: 3.5, fill: 'rgba(120,50,0,.35)' }));
    },
    speck: function (g, x, y) {
      [[0, 0, 1], [3.5, 2, .7], [-2, 3.5, .8]].forEach(function (p) {
        g.appendChild(el('circle', { cx: x + p[0], cy: y + p[1], r: p[2], fill: 'rgba(60,25,0,.85)' }));
      });
    },
    scratch: function (g, x, y) {
      g.appendChild(el('line', {
        x1: x - 9, y1: y + 5, x2: x + 9, y2: y - 4,
        stroke: 'rgba(255,255,255,.8)', 'stroke-width': .6, 'stroke-linecap': 'round'
      }));
    },
    band: function (g, x, y, s) {
      g.appendChild(el('rect', { x: s.x + 1, y: y - .8, width: s.w - 2, height: 1.6, fill: 'rgba(255,255,255,.45)' }));
    },
    misalign: function (g, x, y) {
      // the piece itself is shifted (see setVisibility); this is the seam it leaves
      g.appendChild(el('line', {
        x1: x - 8, y1: y, x2: x + 8, y2: y,
        stroke: 'rgba(90,35,0,.5)', 'stroke-width': .5
      }));
    }
  };

  function build() {
    run++;
    piecesEl.textContent = '';
    Array.prototype.slice.call(defsEl.querySelectorAll('clipPath')).forEach(function (c) { c.remove(); });
    pieces = [];
    found = 0;
    misclicks = 0;
    startedAt = Date.now();

    var labels = shuffle(IMPERFECTIONS.slice());
    var slots = [];

    SHAPES.forEach(function (s) {
      if (s.split) {
        // dot: left and right halves
        slots.push({ s: s, cx: [s.x - 2, s.x + s.w / 2 + .6], cy: [s.top - 2, s.bottom + 2],
                     fx: s.x + 17, fy: 312, end: true });
        slots.push({ s: s, cx: [s.x + s.w / 2 - .6, s.x + s.w + 2], cy: [s.top - 2, s.bottom + 2],
                     fx: s.x + 42, fy: 305, end: true });
        return;
      }
      var h = (s.bottom - s.top) / s.bands;
      for (var i = 0; i < s.bands; i++) {
        var y0 = s.top + i * h, y1 = y0 + h;
        var first = i === 0, last = i === s.bands - 1;
        slots.push({
          s: s,
          cx: [s.x - 4, s.x + s.w + 4],
          cy: [first ? y0 - 4 : y0 - .6, last ? y1 + 4 : y1 + .6],
          fx: s.x + s.w / 2 + rand(-11, 11),
          fy: first ? y1 - h * .35 : last ? y0 + h * .35 : (y0 + y1) / 2 + rand(-h * .2, h * .2),
          end: first || last
        });
      }
    });

    // Assign flaw types. Bands only fit in a bar's straight middle section.
    var types = shuffle(['crack', 'pixel', 'speck', 'scratch', 'misalign', 'crack', 'pixel', 'speck', 'scratch']);
    var bandsLeft = 3;

    slots.forEach(function (slot, i) {
      var type = (!slot.end && bandsLeft > 0 && Math.random() < .5) ? (bandsLeft--, 'band') : (types.pop() || 'speck');
      if (type === 'band' && slot.s.split) type = 'speck';

      var clipId = 'c' + run + '_' + i;
      var clip = el('clipPath', { id: clipId });
      clip.appendChild(el('rect', {
        x: slot.cx[0], y: slot.cy[0], width: slot.cx[1] - slot.cx[0], height: slot.cy[1] - slot.cy[0]
      }));
      defsEl.appendChild(clip);

      var g = el('g', { 'class': 'piece' });
      var body = el('g', { 'clip-path': 'url(#' + clipId + ')' });
      var shapeAttrs = Object.assign({ fill: slot.s.fill }, slot.s.el[1]);
      body.appendChild(el(slot.s.el[0], shapeAttrs));
      g.appendChild(body);

      var hit = el('circle', {
        'class': 'hit', cx: slot.fx, cy: slot.fy, r: 13,
        tabindex: 0, role: 'button', 'aria-label': 'Imperfection'
      });
      var flaw = el('g', { 'class': 'flaw' });
      DRAW[type](flaw, slot.fx, slot.fy, slot.s);
      g.appendChild(hit);
      g.appendChild(flaw);
      piecesEl.appendChild(g);

      var p = { g: g, body: body, flaw: flaw, hit: hit, type: type, label: labels[i], gone: false };
      pieces.push(p);
      hit.addEventListener('click', function (e) { e.stopPropagation(); remove(p); });
      hit.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(p); }
      });
    });

    setVisibility();
    updateCounter();
    captionEl.textContent = '';
    promptEl.style.opacity = 1;
    counterEl.style.opacity = 1;
    endEl.classList.remove('show');
    endEl.setAttribute('aria-hidden', 'true');
    resetIdle();
  }

  // Flaws start faint and get easier to see as you go.
  function setVisibility() {
    var v = found / pieces.length;
    pieces.forEach(function (p) {
      if (p.gone) return;
      p.flaw.style.opacity = (0.3 + 0.7 * Math.pow(v, .8)).toFixed(2);
      if (p.type === 'misalign') {
        p.body.setAttribute('transform', 'translate(' + (1 + 2 * v).toFixed(2) + ' 0)');
      }
    });
  }

  function updateCounter() {
    var left = pieces.length - found;
    counterEl.textContent = found === 0
      ? pieces.length + ' imperfections detected'
      : left + ' remaining';
  }

  function say(label, sub) {
    captionEl.textContent = '';
    if (label) {
      var l = document.createElement('div');
      l.className = 'label mono';
      l.textContent = label;
      captionEl.appendChild(l);
    }
    if (sub) {
      var s = document.createElement('div');
      s.className = 'sub';
      s.textContent = sub;
      captionEl.appendChild(s);
    }
  }

  function remove(p) {
    if (p.gone) return;
    p.gone = true;
    found++;
    var left = pieces.length - found;

    var fall = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '' :
      'translate(' + rand(-18, 18).toFixed(1) + 'px,' + rand(70, 130).toFixed(1) + 'px) rotate(' + rand(-14, 14).toFixed(1) + 'deg)';
    p.g.classList.add('gone');
    p.g.style.transform = fall;
    p.hit.setAttribute('tabindex', '-1');

    say(p.label[0], p.label[1]);
    captionAt = Date.now();
    promptEl.style.opacity = 0;
    updateCounter();
    setVisibility();
    resetIdle();

    dataLayer.push({
      event: 'imperfection_removed',
      imperfection_name: p.label[0],
      imperfections_remaining: left
    });

    if (left === 0) finish();
  }

  function finish() {
    clearTimeout(idleTimer);
    var secs = Math.round((Date.now() - startedAt) / 1000);
    var thisRun = run;
    setTimeout(function () {
      if (thisRun !== run) return;
      captionEl.style.opacity = 0;
      counterEl.style.opacity = 0;
    }, 1400);
    setTimeout(function () {
      if (thisRun !== run) return;
      captionEl.textContent = '';
      captionEl.style.opacity = 1;
      endEl.classList.add('show');
      endEl.setAttribute('aria-hidden', 'false');
    }, 2400);
    dataLayer.push({ event: 'logo_cleared', time_to_clear_sec: secs, misclicks: misclicks });
  }

  // A click that isn't on a flaw.
  svg.addEventListener('click', function () {
    if (found === pieces.length) return;
    misclicks++;
    if (captionAt && Date.now() - captionAt < 1800) return;
    say(null, SHRUGS[misclicks % SHRUGS.length]);
  });

  // After a while with nothing found, nudge one flaw.
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      var left = pieces.filter(function (p) { return !p.gone; });
      if (!left.length) return;
      var p = left[Math.floor(Math.random() * left.length)];
      p.flaw.classList.remove('hint');
      void p.flaw.getBBox();
      p.flaw.classList.add('hint');
      resetIdle();
    }, 15000);
  }

  document.getElementById('reprocess').addEventListener('click', function () {
    dataLayer.push({ event: 'data_reprocessed' });
    build();
  });

  build();
})();
