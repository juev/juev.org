const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('TOC tracking follows viewport positions and updates after resize', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../../assets/js/toc.js'),
    'utf8',
  );
  const frames = [];
  const listeners = new Map();

  function makeLink(id) {
    const attributes = new Map([['href', `#${id}`]]);
    const classes = new Set();
    return {
      classList: {
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); },
        contains(name) { return classes.has(name); },
      },
      getAttribute(name) { return attributes.get(name) ?? null; },
      setAttribute(name, value) { attributes.set(name, value); },
      removeAttribute(name) { attributes.delete(name); },
      active() { return classes.has('active'); },
      current() { return attributes.get('aria-current') ?? null; },
    };
  }

  const links = [makeLink('first'), makeLink('second')];
  const headings = new Map([
    ['first', { offsetTop: 10, rect: 500, getBoundingClientRect() { return { top: this.rect }; } }],
    ['second', { offsetTop: 20, rect: 900, getBoundingClientRect() { return { top: this.rect }; } }],
  ]);
  const toc = { querySelectorAll: () => links };
  const document = {
    readyState: 'complete',
    getElementById(id) { return id === 'post-toc' ? toc : headings.get(id) ?? null; },
  };
  const window = {
    scrollY: 0,
    addEventListener(name, callback) {
      const callbacks = listeners.get(name) ?? [];
      callbacks.push(callback);
      listeners.set(name, callbacks);
    },
  };

  vm.runInNewContext(source, {
    document,
    window,
    decodeURIComponent,
    requestAnimationFrame(callback) { frames.push(callback); },
  });

  function dispatch(name) {
    for (const callback of listeners.get(name) ?? []) callback();
    while (frames.length) frames.shift()();
  }

  function expectActive(index) {
    links.forEach((link, i) => {
      assert.equal(link.active(), i === index);
      assert.equal(link.current(), i === index ? 'location' : null);
    });
  }

  // offsetTop is relative to a positioned wrapper, while both sections are
  // still below the viewport threshold at the document's initial scroll.
  expectActive(-1);

  window.scrollY = 850;
  headings.get('first').rect = -350;
  headings.get('second').rect = 50;
  dispatch('scroll');
  expectActive(1);

  headings.get('first').rect = 80;
  headings.get('second').rect = 500;
  window.scrollY = 420;
  dispatch('scroll');
  expectActive(-1);

  headings.get('first').rect = 20;
  headings.get('second').rect = 120;
  dispatch('resize');
  expectActive(0);
});
