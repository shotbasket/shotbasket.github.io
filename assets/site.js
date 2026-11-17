// Header border once the page scrolls; play the ⌘V demo only while it is on screen.
(function () {
  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var demo = document.querySelector('.demo');
  if (!demo) return;
  if (!('IntersectionObserver' in window)) { demo.classList.add('play'); return; }
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { demo.classList.toggle('play', e.isIntersecting); });
  }, { threshold: 0.25 }).observe(demo);
})();
