// Image enhancements: error placeholder, zoom, lightbox for linked images.
// Lazy loading is left to the browser (loading="lazy"); images are not hidden
// until loaded, so a large PNG is drawn as it arrives.
(function() {
    'use strict';

    // WebP support detection
    function supportsWebP() {
        return new Promise(resolve => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    // Error handling for broken images
    function handleImageErrors() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                const img = e.target;
                img.style.display = 'none';
                
                // Try to show alt text or placeholder
                const figure = img.closest('figure');
                if (figure && !figure.querySelector('.image-error')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'image-error';
                    errorDiv.textContent = img.alt || 'Изображение не загрузилось';
                    errorDiv.style.cssText = `
                        padding: 20px;
                        background: #f5f5f5;
                        border: 1px dashed #ccc;
                        color: #666;
                        text-align: center;
                        font-style: italic;
                    `;
                    figure.insertBefore(errorDiv, img);
                }
            }
        }, true);
    }

    // Image zoom: a copy of the image in a popover over the whole viewport.
    // Any click on it closes it, Esc too. Closing does not depend on the click
    // reaching the image itself: in Safari it did not, and the zoomed image stuck.
    function initImageZoom() {
        if (!HTMLElement.prototype.hasOwnProperty('popover')) {
            return;
        }

        const viewer = document.createElement('div');
        viewer.className = 'image-zoom';
        viewer.popover = 'auto';
        const full = document.createElement('img');
        full.decoding = 'async';
        viewer.appendChild(full);
        document.body.appendChild(viewer);

        viewer.addEventListener('click', () => viewer.hidePopover());

        document.addEventListener('click', (e) => {
            const img = e.target;
            // Images inside a link open through initImageLinks
            if (img.tagName !== 'IMG' || !img.closest('.image-figure, .image-container') || img.closest('a')) {
                return;
            }
            if (img.naturalWidth > img.clientWidth) {
                full.src = img.currentSrc || img.src;
                full.alt = img.alt;
                viewer.showPopover();
            }
        });
    }

    // Handle image links (preview images that link to full size)
    function initImageLinks() {
        const imageLinks = document.querySelectorAll('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".gif"], a[href*=".webp"]');
        
        imageLinks.forEach(link => {
            const img = link.querySelector('img');
            if (img) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Create lightbox overlay
                    const overlay = document.createElement('div');
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        z-index: 999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: zoom-out;
                    `;
                    
                    // Create full-size image
                    const fullImg = document.createElement('img');
                    fullImg.src = link.href;
                    fullImg.alt = img.alt || '';
                    fullImg.loading = 'eager';
                    fullImg.style.cssText = `
                        max-width: 90vw;
                        max-height: 90vh;
                        background: white;
                        padding: 12px;
                        border-radius: 16px;
                        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.5);
                        cursor: zoom-out;
                    `;
                    fullImg.classList.add('zoomed');
                    
                    overlay.appendChild(fullImg);
                    document.body.appendChild(overlay);
                    
                    // Prevent body scroll
                    document.body.style.overflow = 'hidden';
                    
                    // Close lightbox function
                    const closeLightbox = function() {
                        document.body.removeChild(overlay);
                        document.body.style.overflow = '';
                    };
                    
                    // Click to close
                    overlay.addEventListener('click', closeLightbox);
                    
                    // Close on escape
                    const escapeHandler = function(e) {
                        if (e.key === 'Escape') {
                            closeLightbox();
                            document.removeEventListener('keydown', escapeHandler);
                        }
                    };
                    document.addEventListener('keydown', escapeHandler);
                });
            }
        });
    }

    // Performance monitoring
    function monitorImagePerformance() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.initiatorType === 'img' && entry.transferSize > 100000) {
                        console.info(`Large image detected: ${entry.name} (${Math.round(entry.transferSize / 1024)}KB)`);
                    }
                });
            });
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    // Initialize everything when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        handleImageErrors();
        initImageZoom();
        initImageLinks();
        monitorImagePerformance();
        
        // Check WebP support and log result
        supportsWebP().then(supported => {
            if (!supported) {
                console.info('WebP not supported, falling back to JPEG');
            }
        });
    }

})(); 