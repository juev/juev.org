Shadowbox.init();
var links = document.getElementsByTagName('a');
for(var i=0;i<links.length;i++)
{
  if (links[i].href.match(/(gif|png|jpg|jpeg)$/))
  {
    links[i].setAttribute('rel', 'shadowbox');
  }
}
function addStyle(styleSource) {
    var style = document.createElement('style');
    style.rel = 'stylesheet';
    document.head.appendChild(style);
    style.textContent = styleSource;
}

try {
    if (localStorage.sourceFonts) {
        // The font is in localStorage, we can load it directly
        addStyle(localStorage.sourceFonts);
    } else {
        // We have to first load the font file asynchronously
        var request = new XMLHttpRequest();
        request.open('GET', '/assets/css/fonts.css', true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // We save the file in localStorage
                localStorage.sourceFonts = request.responseText;

                // ... and load the font
                addStyle(localStorage.sourceFonts);
            }
        };

        request.send();
    }
} catch(ex) {
    // maybe load the font synchronously for woff-capable browsers
    // to avoid blinking on every request when localStorage is not available
}

try {
    if (localStorage.sourceImages) {
        addStyle(localStorage.sourceImages);
    } else {
        var request2 = new XMLHttpRequest();
        request2.open('GET', '/assets/css/images.css', true);
        request2.onload = function() {
            if (request2.status >= 200 && request2.status < 400) {
                localStorage.sourceImages = request2.responseText;
                addStyle(localStorage.sourceImages);
            }
        };
        request2.send();
    }
} catch(ex) {
    // maybe load the font synchronously for woff-capable browsers
    // to avoid blinking on every request when localStorage is not available
}
