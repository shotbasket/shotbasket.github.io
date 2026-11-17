// Header border on scroll, film sound toggle, tour arrows, step counters.
(function () {
  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Film: starts muted (browsers only autoplay muted). The button restarts it with sound.
  var film = document.querySelector('.mac video');
  var sound = document.querySelector('.sound');
  if (film && sound) {
    var on = sound.getAttribute('data-on'), off = sound.getAttribute('data-off');
    sound.addEventListener('click', function () {
      if (film.muted) { film.muted = false; film.currentTime = 0; film.play().catch(function () {}); sound.textContent = off; }
      else { film.muted = true; sound.textContent = on; }
    });
    document.querySelectorAll('[data-play-film]').forEach(function (a) {
      a.addEventListener('click', function () { if (film.muted) sound.click(); });
    });
  }

  // Tour: arrows and "3 / 7" counter follow the scroll position.
  var track = document.querySelector('.track');
  if (track) {
    var slides = track.querySelectorAll('.slide');
    var prev = document.querySelector('[data-tour="prev"]'), next = document.querySelector('[data-tour="next"]');
    var out = document.querySelector('.tour-nav output');
    function index() {
      var best = 0, dist = Infinity, left = track.getBoundingClientRect().left;
      slides.forEach(function (s, i) { var d = Math.abs(s.getBoundingClientRect().left - left - parseFloat(getComputedStyle(track).scrollPaddingLeft || 0)); if (d < dist) { dist = d; best = i; } });
      return best;
    }
    function update() {
      var i = index();
      if (out) out.textContent = (i + 1) + ' / ' + slides.length;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    }
    function go(step) { var i = Math.min(slides.length - 1, Math.max(0, index() + step)); slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }); }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    update();
  }

  // Step counters show their final value at rest and count up once when they come into view.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var counters = document.querySelectorAll('[data-count]');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target.firstChild, end = parseInt(e.target.getAttribute('data-count'), 10), t0 = null;
        function tick(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 900); el.nodeValue = String(Math.round(end * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { io.observe(c); });
  }
})();
