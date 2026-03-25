(function () {
  'use strict';

  function initTOC() {
    var toc = document.getElementById('post-toc');
    if (!toc) return;

    var links = toc.querySelectorAll('a');
    if (links.length === 0) return;

    var headings = [];
    links.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      var el = document.getElementById(id);
      if (el) headings.push({ id: id, el: el, link: link });
    });

    if (headings.length === 0) return;

    var current = null;

    function onScroll() {
      var scrollY = window.scrollY + 60;
      var active = null;

      for (var i = headings.length - 1; i >= 0; i--) {
        if (headings[i].el.offsetTop <= scrollY) {
          active = headings[i];
          break;
        }
      }

      if (active === current) return;
      current = active;

      links.forEach(function (l) { l.classList.remove('active'); });
      if (active) active.link.classList.add('active');
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTOC);
  } else {
    initTOC();
  }
})();
