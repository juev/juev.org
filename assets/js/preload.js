// Safe page preloading with Speculation Rules API fallback
(function() {
  'use strict';

  // Wait for DOM to be ready to avoid blocking critical rendering
  function initPreloading() {
    try {
      // Check for Speculation Rules API support
      if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
        // Modern browsers with Speculation Rules support
        const speculationScript = document.createElement('script');
        speculationScript.type = 'speculationrules';
        speculationScript.textContent = JSON.stringify({
          "prefetch": [{ 
            "where": { "href_matches": "/*" }, 
            "eagerness": "conservative" 
          }]
        });
        
        // Add script safely with error handling
        try {
          document.head.appendChild(speculationScript);
        } catch (e) {
          console.warn('Failed to add speculation rules script:', e);
        }
      } else {
        // Fallback for older browsers
        initFallbackPreloading();
      }
    } catch (error) {
      console.warn('Preloading initialization failed:', error);
    }
  }

  function initFallbackPreloading() {
    const preloadedUrls = new Set();
    let isAttaching = false;
    
    function handlePointerEnter(event) {
      const href = this.href;
      if (!href || preloadedUrls.has(href)) return;
      
      // Only preload internal links
      try {
        const url = new URL(href, location.origin);
        if (url.origin !== location.origin) return;
      } catch (e) {
        return;
      }
      
      preloadedUrls.add(href);
      
      try {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'prefetch';
        link.as = 'document';
        
        // Add error handling for the link
        link.onerror = function() {
          preloadedUrls.delete(href);
        };
        
        document.head.appendChild(link);
      } catch (error) {
        preloadedUrls.delete(href);
        console.warn('Failed to create prefetch link:', error);
      }
    }
    
    function attachListeners() {
      if (isAttaching) return;
      isAttaching = true;
      
      try {
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + location.origin + '"]');
        internalLinks.forEach(link => {
          if (!link.dataset.preloadAttached && link.href) {
            link.addEventListener('pointerenter', handlePointerEnter, { passive: true });
            link.dataset.preloadAttached = 'true';
          }
        });
      } catch (error) {
        console.warn('Failed to attach preload listeners:', error);
      } finally {
        isAttaching = false;
      }
    }
    
    // Initial setup with delay
    requestIdleCallback ? requestIdleCallback(attachListeners) : setTimeout(attachListeners, 100);
    
    // Handle dynamic content with throttling
    if (typeof MutationObserver !== 'undefined') {
      let timeoutId;
      const observer = new MutationObserver(function(mutations) {
        if (timeoutId) return;
        
        let shouldReattach = false;
        for (let mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
              if (node.nodeType === 1 && (node.tagName === 'A' || node.querySelector && node.querySelector('a'))) {
                shouldReattach = true;
                break;
              }
            }
            if (shouldReattach) break;
          }
        }
        
        if (shouldReattach) {
          timeoutId = setTimeout(() => {
            attachListeners();
            timeoutId = null;
          }, 150);
        }
      });
      
      try {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      } catch (error) {
        console.warn('Failed to set up mutation observer:', error);
      }
    }
  }

  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreloading, { once: true });
  } else {
    // Use requestIdleCallback for better performance
    if (window.requestIdleCallback) {
      requestIdleCallback(initPreloading);
    } else {
      setTimeout(initPreloading, 0);
    }
  }
})();