(function () {
  'use strict';

  // The header button cycles system → light → dark → system. A light or dark
  // pick is kept in localStorage; "system" removes it, and the theme follows
  // the system setting again. The inline script in <head> applies a saved
  // pick before paint.
  var NEXT = { system: 'light', light: 'dark', dark: 'system' };
  var LABELS = {
    system: 'Тема как в системе. Включить светлую',
    light: 'Светлая тема. Включить тёмную',
    dark: 'Тёмная тема. Вернуть тему системы'
  };

  function initTheme() {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;

    var root = document.documentElement;

    function current() {
      return root.dataset.theme || 'system';
    }

    function update() {
      var mode = current();
      button.dataset.mode = mode;
      button.setAttribute('aria-label', LABELS[mode]);
      button.title = LABELS[mode];
    }

    button.addEventListener('click', function () {
      var next = NEXT[current()];
      try {
        if (next === 'system') {
          localStorage.removeItem('theme');
        } else {
          localStorage.setItem('theme', next);
        }
      } catch (e) {
        // Storage may be blocked; the pick then lasts until the page closes
      }
      if (next === 'system') {
        delete root.dataset.theme;
      } else {
        root.dataset.theme = next;
      }
      update();
    });

    update();
    button.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
