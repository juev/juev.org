(function () {
  'use strict';

  // Copies every footnote next to its first reference as a margin note.
  // CSS shows the notes only on wide screens; there the list at the bottom
  // is hidden once every footnote has its note. Narrow screens and readers
  // without JavaScript keep the footnotes at the bottom of the post.
  function initSidenotes() {
    var post = document.querySelector('.post');
    var footnotes = post && post.querySelector('.footnotes');
    if (!footnotes) return;

    var items = footnotes.querySelectorAll('li[id^="fn:"]');
    var placed = {};

    post.querySelectorAll('sup > a.footnote-ref').forEach(function (ref) {
      var id = decodeURIComponent(ref.getAttribute('href').slice(1));
      if (placed[id]) return;
      if (ref.closest('.footnotes')) return;

      var item = document.getElementById(id);
      if (!item) return;

      var note = buildNote(ref.textContent, item);
      if (!note) return;
      // A float cannot leave a table cell or a code block: the note goes
      // right before the block and lines up with its top
      var block = ref.closest('table, pre');
      if (block) {
        block.before(note);
      } else {
        ref.parentNode.after(note);
      }
      placed[id] = true;
    });

    var all = Array.prototype.every.call(items, function (item) {
      return placed[item.id];
    });
    if (all) post.classList.add('has-sidenotes');
  }

  // Returns null for a footnote with lists, code or other blocks: those
  // stay in the list at the bottom.
  function buildNote(number, item) {
    var blocks = item.children;
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].tagName !== 'P') return null;
    }

    var note = document.createElement('span');
    note.className = 'sidenote';
    note.setAttribute('role', 'note');

    var num = document.createElement('span');
    num.className = 'sidenote-number';
    num.textContent = number;
    note.appendChild(num);

    // Paragraphs become block spans: a <p> cannot sit inside the <p>
    // that holds the reference.
    item.querySelectorAll(':scope > p').forEach(function (p) {
      var para = document.createElement('span');
      para.className = 'sidenote-para';
      para.innerHTML = p.innerHTML;
      para.querySelectorAll('.footnote-backref').forEach(function (a) { a.remove(); });
      para.innerHTML = para.innerHTML.replace(/(\s|&nbsp;)+$/, '');
      note.appendChild(para);
    });

    return note;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidenotes);
  } else {
    initSidenotes();
  }
})();
