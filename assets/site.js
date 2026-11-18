// Header border on scroll, film link, and the hero demo: capture regions into the basket, ⌘V pastes them as separate files.
(function () {
  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var film = document.querySelector('.film video');
  document.querySelectorAll('[data-play-film]').forEach(function (a) {
    a.addEventListener('click', function () { if (film) { film.muted = false; film.play().catch(function () {}); } });
  });

  var desk = document.querySelector('.desk');
  if (!desk) return;
  var S = JSON.parse(desk.getAttribute('data-strings'));
  var regs = desk.querySelectorAll('[data-reg]');
  var badge = desk.querySelector('.badge'), tray = desk.querySelector('.basket');
  var sel = desk.querySelector('.sel'), selLabel = sel.querySelector('span');
  var card = desk.querySelector('.pcard'), cardText = card.querySelector('b'), cardThumb = card.querySelector('.pthumb');
  var atts = desk.querySelector('.atts');
  var hint = document.querySelector('.hint'), status = document.querySelector('.status');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var basket = [], busy = false, auto = !reduce, timers = [], inView = false;
  if (window.matchMedia('(hover: none)').matches) hint.textContent = S.hint_touch;

  function say(msg) { if (!auto) status.textContent = msg; }
  function rel(el) { var d = desk.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - d.left, y: r.top - d.top, w: r.width, h: r.height }; }
  function copyOf(reg, scale) {
    var c = reg.cloneNode(true);
    c.removeAttribute('data-reg'); c.classList.remove('flash');
    c.style.width = reg.offsetWidth + 'px'; c.style.height = reg.offsetHeight + 'px';
    if (scale) c.style.transform = 'scale(' + scale + ')';
    return c;
  }
  function cover(reg, w, h) { return copyOf(reg, Math.max(w / reg.offsetWidth, h / reg.offsetHeight)); }
  function tween(ms, step, done) {
    if (reduce || !ms) { step(1); done(); return; }
    var t0 = null;
    function f(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / ms); step(1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(f); else done(); }
    requestAnimationFrame(f);
  }
  function setBadge() {
    if (basket.length) badge.textContent = basket.length;
    badge.classList.toggle('on', basket.length > 0);
  }

  function capture() {
    if (busy) return;
    if (basket.length >= regs.length) { say(S.s_full); return; }
    if (!basket.length && atts.children.length) atts.innerHTML = '';
    busy = true;
    var i = basket.length, reg = regs[i], r = rel(reg), pad = 4;
    var x0 = r.x - pad, y0 = r.y - pad, w = r.w + pad * 2, h = r.h + pad * 2;
    sel.style.display = 'block';
    tween(420, function (p) {
      sel.style.left = x0 + 'px'; sel.style.top = y0 + 'px';
      sel.style.width = (w * p) + 'px'; sel.style.height = (h * p) + 'px';
      selLabel.textContent = p < .08 ? '' : Math.round(w * p * 2) + ' × ' + Math.round(h * p * 2);
    }, function () {
      reg.classList.remove('flash'); void reg.offsetWidth; reg.classList.add('flash');
      setTimeout(function () { sel.style.display = 'none'; land(i, reg, r); }, reduce ? 0 : 180);
    });
  }
  function land(i, reg, r) {
    function done() {
      basket.push(i); setBadge();
      tray.classList.remove('bump'); void tray.offsetWidth; tray.classList.add('bump');
      cardText.textContent = S.card.replace('{n}', basket.length);
      cardThumb.innerHTML = ''; cardThumb.appendChild(cover(reg, 46, 30));
      card.classList.add('on');
      say(basket.length === regs.length ? S.s_full : S.s_captured.replace('{n}', basket.length));
      busy = false;
    }
    if (reduce || !Element.prototype.animate) { done(); return; }
    var fly = document.createElement('div'), t = rel(tray);
    fly.className = 'fly';
    fly.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px';
    fly.appendChild(copyOf(reg));
    desk.appendChild(fly);
    var k = 22 / r.w, dx = t.x + t.w / 2 - r.x - 11, dy = t.y + t.h / 2 - r.y - (r.h * k) / 2;
    var anim = fly.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + dx * .55 + 'px,' + (dy * .55 - 30) + 'px) scale(' + (.5 + k / 2) + ')', opacity: 1, offset: .55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')', opacity: .2 }], { duration: 700, easing: 'cubic-bezier(.45,0,.25,1)' });
    anim.onfinish = function () { fly.remove(); done(); };
  }
  function paste() {
    if (busy) return false;
    if (!basket.length) { say(S.s_empty); return false; }
    var n = basket.length;
    atts.innerHTML = '';
    basket.forEach(function (i, k) {
      setTimeout(function () {
        var f = document.createElement('figure'), box = document.createElement('div'), cap = document.createElement('figcaption');
        f.className = 'att'; box.className = 'att-img'; cap.textContent = (k + 1) + '.png';
        box.appendChild(cover(regs[i], 92, 62)); f.appendChild(box); f.appendChild(cap); atts.appendChild(f);
      }, reduce ? 0 : k * 140);
    });
    basket = []; setBadge(); card.classList.remove('on');
    say(S.s_pasted.replace('{n}', n));
    return true;
  }
  function reset() { basket = []; setBadge(); atts.innerHTML = ''; card.classList.remove('on'); say(''); }

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function takeOver() { if (auto) { auto = false; clearTimers(); } }
  function runAuto() {
    if (!auto || !inView) return;
    var t = 0;
    [[700, reset], [600, capture], [1500, capture], [1500, capture], [1400, paste], [3600, null]].forEach(function (s) {
      t += s[0]; if (s[1]) timers.push(setTimeout(function () { if (auto) s[1](); }, t));
    });
    timers.push(setTimeout(runAuto, t));
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (!auto) return;
      clearTimers();
      if (inView) runAuto();
    }, { threshold: 0.35 }).observe(desk);
  } else { inView = true; auto = false; }

  document.querySelectorAll('[data-act]').forEach(function (b) {
    b.addEventListener('click', function () {
      var wasAuto = auto; takeOver();
      if (wasAuto && busy) return;
      var a = b.getAttribute('data-act');
      if (a === 'capture') capture(); else if (a === 'paste') paste(); else reset();
    });
  });
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (!inView || (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)))) return;
    var k = (e.key || '').toLowerCase();
    if (k === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) { takeOver(); capture(); e.preventDefault(); }
    else if (k === 'v' && (e.metaKey || e.ctrlKey) && !e.altKey) {
      takeOver();
      if (basket.length) { e.preventDefault(); paste(); } else say(S.s_empty);
    }
  });
})();
