(function () {
  'use strict';

  // The header button flips between light and dark and remembers the pick
  // in localStorage; until the first click the theme follows the system
  // setting. The inline script in <head> applies a saved pick before paint.
  function initTheme() {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;

    var root = document.documentElement;
    var media = window.matchMedia('(prefers-color-scheme: dark)');

    function current() {
      return root.dataset.theme || (media.matches ? 'dark' : 'light');
    }

    function updateLabel() {
      button.setAttribute('aria-label', current() === 'dark'
        ? 'Включить светлую тему'
        : 'Включить тёмную тему');
    }

    button.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        // Storage may be blocked; the pick then lasts until the page closes
      }
      updateLabel();
    });

    media.addEventListener('change', updateLabel);
    updateLabel();
    button.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
