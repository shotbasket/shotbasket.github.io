// Header border on scroll, the looping clips, and the hero race: the same five screenshots go into one chat,
// once with macOS alone (capture, switch, paste, switch back) and once with ShotBasket (capture five, switch, ⌘V).
(function () {
  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // "Watch the film" scrolls to the film and plays it with sound.
  var film = document.querySelector('.film video');
  document.querySelectorAll('[data-play-film]').forEach(function (a) {
    a.addEventListener('click', function () { if (film) { film.muted = false; film.play().catch(function () {}); } });
  });

  // Clips behave like GIFs: they play only while on screen, and not at all with Reduce Motion (the poster stays).
  var clips = document.querySelectorAll('video.clip, video.tile');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still && 'IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.preload = 'auto'; e.target.play().catch(function () {}); } else { e.target.pause(); }
      });
    }, { threshold: 0.35 });
    clips.forEach(function (v) { seen.observe(v); });
  }

  var race = document.querySelector('.race');
  if (!race) return;
  var S = JSON.parse(race.getAttribute('data-strings'));
  var replay = document.querySelector('.replay');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TICK = 820, timer = null;

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
      screens: el.querySelector('.screens'), sel: el.querySelector('.sel'), pages: el.querySelectorAll('.scr'), atts: el.querySelector('.atts'), keys: el.querySelector('.keys'), sw: el.querySelector('.switcher'),
      badge: el.querySelector('.bk i'), count: el.querySelector('.cnt b'), cnt: el.querySelector('.cnt'),
      sentEl: el.querySelector('.prog b'), dots: el.querySelectorAll('.dots i'), party: el.querySelector('.party'), finish: el.querySelector('.finish')
    };
  });

  function front(l, which) {
    var win = which === 'src' ? l.src : l.chat;
    l.src.classList.toggle('front', which === 'src');
    l.chat.classList.toggle('front', which === 'chat');
    win.classList.remove('raise'); void win.offsetWidth; if (!reduce) win.classList.add('raise');
    l.app.textContent = win.querySelector('.tb span').textContent;
  }
  // The keys as they are on a Mac keyboard, pressed one after another.
  var MOD = { ctrl: ['⌃', 'control'], cmd: ['⌘', 'command'], shift: ['⇧', 'shift'], tab: ['⇥', 'tab'] };
  function key(l, list) {
    if (reduce) return;
    l.keys.innerHTML = list.map(function (k) {
      var m = MOD[k];
      return m ? '<kbd class="k mod"><b>' + m[0] + '</b><small>' + m[1] + '</small></kbd>' : '<kbd class="k">' + k + '</kbd>';
    }).join('');
    l.keys.classList.remove('on'); void l.keys.offsetWidth; l.keys.classList.add('on');
    clearTimeout(l.keyTimer); l.keyTimer = setTimeout(function () { l.keys.classList.remove('on'); }, TICK * 0.85);
  }
  // ⌘Tab: the app switcher appears with the other app selected, then that window comes to the front.
  function switchTo(l, which) {
    if (reduce) { front(l, which); return; }
    l.sw.className = 'switcher on to-' + which;
    clearTimeout(l.swTimer); clearTimeout(l.frontTimer);
    l.frontTimer = setTimeout(function () { front(l, which); }, TICK * 0.42);
    l.swTimer = setTimeout(function () { l.sw.classList.remove('on'); }, TICK * 0.6);
  }
  function badge(l, n) {
    if (!l.badge) return;
    l.badge.textContent = n; l.badge.classList.toggle('on', n > 0);
    l.badge.classList.remove('pop'); void l.badge.offsetWidth; if (n > 0 && !reduce) l.badge.classList.add('pop');
  }
  // The onboarding shows screen i; earlier screens slide out to the left.
  function page(l, i) {
    for (var k = 0; k < l.pages.length; k++) {
      l.pages[k].classList.toggle('cur', k === i); l.pages[k].classList.toggle('past', k < i);
    }
  }
  function flash(l) { l.screens.classList.remove('snap'); void l.screens.offsetWidth; if (!reduce) l.screens.classList.add('snap'); }
  function run(l, s) {
    if (s.cap !== undefined) {
      // A different screen each time (Next was clicked); ⌘⇧4 and a selection dragged over it. macOS alone needs Control
      // too, or the screenshot goes to the desktop instead of the clipboard.
      page(l, s.cap); key(l, l.side === 'mac' ? ['ctrl', 'cmd', 'shift', '4'] : ['cmd', 'shift', '4']);
      if (reduce) flash(l);
      else {
        setTimeout(function () { l.sel.classList.remove('drag'); void l.sel.offsetWidth; l.sel.classList.add('drag'); }, s.cap === 0 ? 60 : TICK * 0.22);
        setTimeout(function () { flash(l); }, s.cap === 0 ? TICK * 0.55 : TICK * 0.72);
      }
      if (l.side === 'sb') badge(l, s.cap + 1);
    } else if (s.sw) {
      key(l, ['cmd', 'tab']); switchTo(l, s.sw);
    } else if (s.paste) {
      key(l, ['cmd', 'V']);
      s.paste.forEach(function (i, k) {
        var a = document.createElement('span'); a.className = 'att a' + (i + 1);
        a.style.animationDelay = (reduce ? 0 : k * 70) + 'ms'; l.atts.appendChild(a);
      });
      l.sent += s.paste.length; badge(l, 0);
      l.sentEl.textContent = l.sent;
      for (var d = 0; d < l.dots.length; d++) l.dots[d].classList.toggle('on', d < l.sent);
    }
    l.at++; l.count.textContent = l.at;
    if (l.at === l.steps.length) {
      // The result on the screen itself: a big card, and confetti for ShotBasket.
      var sb = l.side === 'sb';
      l.finish.innerHTML = '<b>' + (sb ? '🎉' : '😮‍💨') + '</b><strong>' + (sb ? S.done : S.done_mac) + '</strong><span>' + l.at + ' ' + S.steps + '</span>';
      l.el.classList.add('done');
      if (sb && !reduce) celebrate(l);
    }
  }
  // Confetti over the ShotBasket desk when its five are in.
  var COLORS = ['#3D5BFF', '#8B3CF0', '#FF6B5A', '#FFB547', '#39B36A', '#4FC3F7'];
  function celebrate(l) {
    l.party.textContent = '';
    for (var i = 0; i < 46; i++) {
      var c = document.createElement('i');
      c.style.left = (8 + (i * 37) % 84) + '%';
      c.style.background = COLORS[i % COLORS.length];
      c.style.setProperty('--dx', ((i * 53) % 21 - 10) + 'cqw');
      c.style.setProperty('--r', ((i * 97) % 720 - 360) + 'deg');
      c.style.animationDelay = ((i * 29) % 260) + 'ms';
      if (i % 3 === 0) c.style.borderRadius = '50%';
      l.party.appendChild(c);
    }
    l.party.classList.remove('on'); void l.party.offsetWidth; l.party.classList.add('on');
  }
  function reset() {
    clearInterval(timer);
    lanes.forEach(function (l) {
      l.at = 0; l.sent = 0; l.party.classList.remove('on'); l.party.textContent = ''; l.finish.textContent = ''; l.atts.textContent = ''; l.count.textContent = '0'; l.sentEl.textContent = '0';
      l.el.classList.remove('done'); front(l, 'src'); badge(l, 0); l.sw.classList.remove('on'); l.keys.classList.remove('on');
      [].forEach.call(l.dots, function (d) { d.classList.remove('on'); });
      page(l, 0); l.screens.classList.remove('snap'); l.sel.classList.remove('drag');
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
