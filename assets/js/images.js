// Enhanced image loading with Intersection Observer
(function() {
    'use strict';

    // Check for browser support
    if (!('IntersectionObserver' in window)) {
        // Fallback for older browsers
        loadAllImages();
        return;
    }

    // Image loading optimization
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        // Start loading when image is 50px away from viewport
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    function loadImage(img) {
        // Add loading class
        img.classList.add('loading');
        
        const imageLoaded = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            img.style.opacity = '1';
            img.removeEventListener('load', imageLoaded);
            img.removeEventListener('error', imageError);
        };

        const imageError = () => {
            img.classList.remove('loading');
            img.classList.add('error');
            console.warn('Failed to load image:', img.src);
            img.removeEventListener('load', imageLoaded);
            img.removeEventListener('error', imageError);
        };

        img.addEventListener('load', imageLoaded);
        img.addEventListener('error', imageError);

        // Trigger loading if not already loaded
        if (img.complete) {
            imageLoaded();
        }
    }

    function loadAllImages() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.loading = 'eager';
            loadImage(img);
        });
    }

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

    // Initialize image loading
    function initImageLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        images.forEach(img => {
            // Always ensure transition is set
            img.style.transition = 'opacity 0.3s ease';
            
            // Check if image is already loaded (common for cached/external images)
            if (img.complete && (img.naturalHeight !== 0 || img.src.startsWith('https:'))) {
                // Image is loaded or is external - show immediately
                img.style.opacity = '1';
                img.classList.add('loaded');
            } else {
                // Only hide images that aren't loaded yet
                img.style.opacity = '0';
                imageObserver.observe(img);
            }
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

    // Image zoom functionality
    function initImageZoom() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && e.target.closest('.image-figure, .image-container')) {
                const img = e.target;
                if (img.naturalWidth > img.clientWidth) {
                    toggleImageZoom(img);
                }
            }
        });
    }

    function toggleImageZoom(img) {
        if (img.classList.contains('zoomed')) {
            img.classList.remove('zoomed');
            img.style.cursor = 'zoom-in';
        } else {
            img.classList.add('zoomed');
            img.style.cursor = 'zoom-out';
        }
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
        initImageLoading();
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