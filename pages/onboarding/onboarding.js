// onboarding.js - Onboarding controller for Net Profit for eBay Sellers.
// Extracted from inline <script> for MV3 CSP compliance
// (script-src 'self' forbids inline <script>). See onboarding.html for the
// visual flow.
//
// Vanilla JS, no dependencies. Drives the 6-page flow (next/back/skip/
// keyboard), mirrors page-3 toggles into chrome.storage.local under
// "enp_prefs" so the user's choices in onboarding are live the moment they
// reload the sell form or Seller Hub (no separate save step), and writes
// "ebay_net_profit_seenOnboarding" = true on finish or skip so the SW stops
// surfacing the onboarding tab.
//
// Page 2 demo (the profit badge) - wires the price slider to the badge so
// the user sees the profit number move red -> amber -> green as they drag.
// Uses a simplified fee model for demo purposes only (the real engine lives
// in src/fees/engine.ts). Per SPEC three-hard-rules: the SHIPPED engine
// never uses flat-rate math, but the onboarding demo is allowed to be a
// simplified sample for UX illustration (clearly labeled in copy).
(function(){
  var PREFS_KEY = 'enp_prefs';
  var SEEN_KEY = 'ebay_net_profit_seenOnboarding';

  var DEFAULTS = {
    version: 1,
    defaultCost: 0,
    defaultShipping: 0,
    storeTier: 'none',
    internationalFee: false,
    showProfitColumn: true
  };

  var TOTAL = 6, i = 0;
  var steps = [].slice.call(document.querySelectorAll('.step'));
  var rail = document.getElementById('rail'),
      back = document.getElementById('back'),
      next = document.getElementById('next'),
      stepno = document.getElementById('stepno');

  for (var d = 0; d < TOTAL; d++) {
    var dot = document.createElement('span');
    dot.className = 'dot';
    rail.appendChild(dot);
  }
  var dots = [].slice.call(rail.children);

  function render() {
    steps.forEach(function(s, n) { s.classList.toggle('on', n === i); });
    dots.forEach(function(dt, n) {
      dt.className = 'dot' + (n < i ? ' done' : n === i ? ' now' : '');
    });
    back.style.visibility = i === 0 ? 'hidden' : 'visible';
    stepno.textContent = (i + 1) + ' of ' + TOTAL;
    if (i === TOTAL - 1) {
      next.textContent = 'Start selling';
    } else if (i === TOTAL - 2) {
      next.textContent = 'Sounds good';
    } else if (i === 4) {
      next.textContent = 'Maybe later';
    } else {
      next.textContent = 'Show me how';
    }
    /* Run the page-2 demo on entry so the user sees the badge move. */
    if (i === 1) setTimeout(runPage2Demo, 350);
  }

  function go(n) {
    i = Math.max(0, Math.min(TOTAL - 1, n));
    render();
  }

  function finish() {
    try {
      chrome.storage && chrome.storage.local &&
        chrome.storage.local.set({ 'ebay_net_profit_seenOnboarding': true });
    } catch (e) {}
    try {
      if (chrome.tabs && chrome.tabs.getCurrent) {
        chrome.tabs.getCurrent(function(t) {
          if (t && t.id != null) {
            chrome.tabs.remove(t.id);
          } else {
            window.close();
          }
        });
      } else {
        window.close();
      }
    } catch (e) {
      window.close();
    }
  }

  next.addEventListener('click', function() {
    if (i === TOTAL - 1) {
      finish();
    } else {
      go(i + 1);
    }
  });
  back.addEventListener('click', function() { go(i - 1); });
  document.getElementById('skip').addEventListener('click', finish);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'A' &&
          document.activeElement.tagName !== 'BUTTON') {
        next.click();
      }
    }
    if (e.key === 'ArrowLeft') back.click();
  });

  /* ----------------------------------------------------------------------
   * Page-1 and page-2 demo - price slider drives a live profit badge.
   * Simplified fee model for demo purposes only (clearly labeled in copy).
   * The shipped engine lives in src/fees/engine.ts and matches SPEC exactly.
   * -------------------------------------------------------------------- */
  function computeProfit(price, cost, shipping, rate, perOrder, intlOn) {
    var safePrice = Math.max(0, price);
    var intlFee = intlOn ? safePrice * 0.0165 : 0;
    var fee = safePrice * rate + perOrder + intlFee;
    var profit = safePrice - cost - shipping - fee;
    var margin = safePrice > 0 ? profit / safePrice : 0;
    return { profit: profit, margin: margin };
  }

  function formatMoney(n) {
    var sign = n < 0 ? '-' : '+';
    var abs = Math.abs(n);
    return sign + '$' + abs.toFixed(2);
  }

  function paintBadge(badgeEl, amtEl, mgnEl, result) {
    var cls = 'pdemo-badge ';
    if (result.profit <= 0) cls += 'neg';
    else if (result.margin < 0.10) cls += 'neg';
    else if (result.margin < 0.25) cls += 'amber';
    else cls += 'pos';
    badgeEl.className = cls;
    var label = result.profit > 0 ? ' profit' : (result.profit < 0 ? ' loss' : ' break-even');
    amtEl.textContent = formatMoney(result.profit) + label;
    var pct = Math.round(result.margin * 1000) / 10;
    mgnEl.textContent = pct.toFixed(1) + '% margin';
  }

  function wireSlider(sliderId, valId, badgeId, amtId, mgnId, cost, shipping, rate, perOrder, intlOn) {
    var slider = document.getElementById(sliderId);
    if (!slider) return;
    var valEl = document.getElementById(valId);
    var badgeEl = document.getElementById(badgeId);
    var amtEl = document.getElementById(amtId);
    var mgnEl = document.getElementById(mgnId);
    function update() {
      var price = parseFloat(slider.value) || 0;
      valEl.textContent = '$' + price.toFixed(2);
      var result = computeProfit(price, cost, shipping, rate, perOrder, intlOn);
      paintBadge(badgeEl, amtEl, mgnEl, result);
    }
    slider.addEventListener('input', update);
    update();
  }

  function runPage2Demo() {
    /* Page 2 slider: cost $15.00, shipping $5.50, standard 13.25%, per-order
       tier at this price band ($0.30 if <= $10, else $0.40), intl off.
       paintBadge recomputes on every drag. */
    var slider = document.getElementById('d2');
    if (!slider) return;
    wireSlider('d2', 'd2v', 'd2badge', 'd2amt', 'd2mgn', 15.00, 5.50, 0.1325,
      parseFloat(slider.value) <= 10 ? 0.30 : 0.40, false);
  }

  /* Page 1 slider - initial paint only (static demo, not interactive on
     page 1 - the user will see the live interaction on page 2). */
  (function page1Initial() {
    var slider = document.getElementById('d1');
    if (!slider) return;
    wireSlider('d1', 'd1v', 'd1badge', 'd1amt', 'd1mgn', 28.00, 8.95, 0.10, 0.40, false);
  })();

  /* ----------------------------------------------------------------------
   * Page-3 toggles - wire to chrome.storage.local so choices persist live.
   * Mirrors music-only-web-player pattern.
   * -------------------------------------------------------------------- */
  function wireOnboardingToggles() {
    /* Store tier segmented control. */
    var tierBtns = document.querySelectorAll('#onboardingToggles .tierseg button[data-tier]');
    if (tierBtns.length) {
      /* Read initial from storage, fall back to DEFAULTS. */
      try {
        chrome.storage.local.get(PREFS_KEY, function(obj) {
          var stored = obj && obj[PREFS_KEY];
          var prefs = Object.assign({}, DEFAULTS, stored || {});
          tierBtns.forEach(function(btn) {
            var tier = btn.getAttribute('data-tier');
            btn.setAttribute('aria-checked', tier === prefs.storeTier ? 'true' : 'false');
          });
        });
      } catch (e) {
        /* Storage unavailable - HTML default (No Store) stands. */
      }
      /* On click, update aria-checked + write back. */
      tierBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          tierBtns.forEach(function(b) {
            b.setAttribute('aria-checked', 'false');
          });
          btn.setAttribute('aria-checked', 'true');
          var tier = btn.getAttribute('data-tier');
          writePref('storeTier', tier);
          flashSaved();
        });
      });
    }

    /* International fee checkbox. */
    var intlInput = document.querySelector('#onboardingToggles input[data-prefs-key="internationalFee"]');
    if (intlInput) {
      try {
        chrome.storage.local.get(PREFS_KEY, function(obj) {
          var stored = obj && obj[PREFS_KEY];
          var prefs = Object.assign({}, DEFAULTS, stored || {});
          intlInput.checked = !!prefs.internationalFee;
        });
      } catch (e) {}
      intlInput.addEventListener('change', function() {
        writePref('internationalFee', !!intlInput.checked);
        flashSaved();
      });
    }
  }

  function writePref(key, value) {
    try {
      chrome.storage.local.get(PREFS_KEY, function(obj) {
        var stored = obj && obj[PREFS_KEY];
        var prefs = Object.assign({}, DEFAULTS, stored || {});
        prefs[key] = value;
        var update = {};
        update[PREFS_KEY] = prefs;
        chrome.storage.local.set(update);
      });
    } catch (e) {
      /* Silent - onboarding never blocks the user on storage errors. */
    }
  }

  function flashSaved() {
    var row = document.getElementById('savedRow');
    if (!row) return;
    row.classList.add('show');
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(function() {
      row.classList.remove('show');
    }, 2200);
  }

  wireOnboardingToggles();
  render();
})();
