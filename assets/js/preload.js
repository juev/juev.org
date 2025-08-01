// Speculation Rules API with progressive enhancement fallback
(function() {
  'use strict';

  // Check for Speculation Rules API support
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    // Modern browsers with Speculation Rules support
    const speculationScript = document.createElement('script');
    speculationScript.type = 'speculationrules';
    speculationScript.textContent = JSON.stringify({
      "prerender": [{ 
        "where": { "href_matches": "/*" }, 
        "eagerness": "moderate" 
      }],
      "prefetch": [{ 
        "where": { "href_matches": "/*" }, 
        "eagerness": "moderate" 
      }]
    });
    document.head.appendChild(speculationScript);
  } else {
    // Fallback for older browsers
    const preloadedUrls = new Set();
    
    function handlePointerEnter() {
      if (preloadedUrls.has(this.href)) return;
      
      preloadedUrls.add(this.href);
      
      const link = document.createElement('link');
      link.href = this.href;
      
      // Use prefetch if supported, otherwise preload
      if (link.relList.supports('prefetch')) {
        link.rel = 'prefetch';
        link.as = 'document';
      } else {
        link.rel = 'preload';
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    }
    
    // Apply to internal links only
    function attachListeners() {
      const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + location.origin + '"]');
      internalLinks.forEach(link => {
        if (!link.dataset.preloadAttached) {
          link.addEventListener('pointerenter', handlePointerEnter, { passive: true });
          link.dataset.preloadAttached = 'true';
        }
      });
    }
    
    // Initial setup
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachListeners);
    } else {
      attachListeners();
    }
    
    // Handle dynamic content
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        let shouldReattach = false;
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
              if (node.nodeType === 1 && (node.tagName === 'A' || node.querySelector('a'))) {
                shouldReattach = true;
                break;
              }
            }
          }
        });
        if (shouldReattach) {
          attachListeners();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
})();