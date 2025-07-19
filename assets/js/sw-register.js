// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registered successfully:', registration.scope);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available, refresh
                            if (confirm('Доступна новая версия сайта. Обновить?')) {
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    });
    
    // Online/offline status indicator
    function updateOnlineStatus() {
        const indicator = document.getElementById('connection-status');
        if (indicator) {
            if (navigator.onLine) {
                indicator.style.display = 'none';
            } else {
                indicator.style.display = 'block';
            }
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('load', updateOnlineStatus);
} 