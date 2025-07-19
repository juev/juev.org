// Simple lightbox functionality without external dependencies
document.addEventListener('DOMContentLoaded', function() {
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.style.cssText = `
        display: none;
        position: fixed;
        z-index: 9999;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.8);
        cursor: pointer;
    `;

    const lightboxImg = document.createElement('img');
    lightboxImg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 90%;
        max-height: 90%;
        border-radius: 4px;
    `;

    lightbox.appendChild(lightboxImg);
    document.body.appendChild(lightbox);

    // Add lightbox functionality to image links
    const links = document.getElementsByTagName('a');
    for(let i = 0; i < links.length; i++) {
        if (links[i].href.match(/(gif|png|jpg|jpeg)$/i)) {
            links[i].addEventListener('click', function(e) {
                e.preventDefault();
                lightboxImg.src = this.href;
                lightbox.style.display = 'block';
            });
        }
    }

    // Close lightbox on click
    lightbox.addEventListener('click', function() {
        this.style.display = 'none';
    });

    // Close lightbox on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox.style.display === 'block') {
            lightbox.style.display = 'none';
        }
    });
});
