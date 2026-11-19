// Header border on scroll, film link, and the hero race: the same five screenshots go into one chat,
// once with macOS alone (capture, switch, paste, switch back) and once with ShotBasket (capture five, switch, ⌘V).
(function () {
  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var film = document.querySelector('.film video');
  document.querySelectorAll('[data-play-film]').forEach(function (a) {
    a.addEventListener('click', function () { if (film) { film.muted = false; film.play().catch(function () {}); } });
  });

  var race = document.querySelector('.race');
  if (!race) return;
  var S = JSON.parse(race.getAttribute('data-strings'));
  var replay = document.querySelector('.replay');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TICK = 720, timer = null;

  // Exact step lists for five screenshots: 5 + 9 + 5 = 19 without ShotBasket, 5 + 1 + 1 = 7 with it.
  function plan(side) {
    var steps = [], i;
    if (side === 'mac') {
      for (i = 0; i < 5; i++) {
        steps.push({ cap: i }, { sw: 'chat' }, { paste: [i] });
        if (i < 4) steps.push({ sw: 'src' });
      }
    } else {
      for (i = 0; i < 5; i++) steps.push({ cap: i });
      steps.push({ sw: 'chat' }, { paste: [0, 1, 2, 3, 4] });
    }
    return steps;
  }

  var lanes = [].map.call(race.querySelectorAll('.lane'), function (el) {
    var side = el.getAttribute('data-side');
    return {
      el: el, side: side, steps: plan(side), at: 0, sent: 0,
      src: el.querySelector('.src'), chat: el.querySelector('.chat'), app: el.querySelector('[data-app]'),
      regs: el.querySelectorAll('.rg'), atts: el.querySelector('.atts'), hud: el.querySelector('.hud'),
      badge: el.querySelector('.bk i'), count: el.querySelector('.cnt b'), cnt: el.querySelector('.cnt'),
      sentEl: el.querySelector('.prog b'), dots: el.querySelectorAll('.dots i')
    };
  });

  function front(l, which) {
    l.src.classList.toggle('front', which === 'src');
    l.chat.classList.toggle('front', which === 'chat');
    l.app.textContent = (which === 'src' ? l.src : l.chat).querySelector('.tb span').textContent;
  }
  function key(l, text) {
    if (reduce) return;
    l.hud.textContent = text; l.hud.classList.add('on');
    clearTimeout(l.hudTimer); l.hudTimer = setTimeout(function () { l.hud.classList.remove('on'); }, TICK * 0.7);
  }
  function badge(l, n) {
    if (!l.badge) return;
    l.badge.textContent = n; l.badge.classList.toggle('on', n > 0);
    l.badge.classList.remove('pop'); void l.badge.offsetWidth; if (n > 0 && !reduce) l.badge.classList.add('pop');
  }
  function run(l, s) {
    if (s.cap !== undefined) {
      key(l, '⌘⇧4'); var r = l.regs[s.cap];
      r.classList.remove('snap'); void r.offsetWidth; if (!reduce) r.classList.add('snap');
      if (l.side === 'sb') badge(l, s.cap + 1);
    } else if (s.sw) {
      key(l, '⌘⇥'); front(l, s.sw);
    } else if (s.paste) {
      key(l, '⌘V');
      s.paste.forEach(function (i, k) {
        var a = document.createElement('span'); a.className = 'att a' + (i + 1);
        a.style.animationDelay = (reduce ? 0 : k * 70) + 'ms'; l.atts.appendChild(a);
      });
      l.sent += s.paste.length; badge(l, 0);
      l.sentEl.textContent = l.sent;
      for (var d = 0; d < l.dots.length; d++) l.dots[d].classList.toggle('on', d < l.sent);
    }
    l.at++; l.count.textContent = l.at;
    if (l.at === l.steps.length) { l.el.classList.add('done'); l.cnt.setAttribute('data-done', S.done); }
  }
  function reset() {
    clearInterval(timer);
    lanes.forEach(function (l) {
      l.at = 0; l.sent = 0; l.atts.textContent = ''; l.count.textContent = '0'; l.sentEl.textContent = '0';
      l.el.classList.remove('done'); front(l, 'src'); badge(l, 0);
      [].forEach.call(l.dots, function (d) { d.classList.remove('on'); });
      [].forEach.call(l.regs, function (r) { r.classList.remove('snap'); });
    });
  }
  function play() {
    reset(); if (replay) replay.hidden = true;
    if (reduce) { lanes.forEach(function (l) { l.steps.forEach(function (s) { run(l, s); }); }); if (replay) replay.hidden = true; return; }
    timer = setInterval(function () {
      var busy = false;
      lanes.forEach(function (l) { if (l.at < l.steps.length) { run(l, l.steps[l.at]); busy = true; } });
      if (!busy) { clearInterval(timer); if (replay) replay.hidden = false; }
    }, TICK);
  }
  if (replay) replay.addEventListener('click', play);

  reset();
  if (!('IntersectionObserver' in window)) { play(); return; }
  var seen = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { seen.disconnect(); setTimeout(play, 400); }
  }, { threshold: 0.45 });
  seen.observe(race);
})();
