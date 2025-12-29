(function() {
    // 1. Ensure GTM functions are available
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}

    // 2. IMMEDIATE UPDATE: Check storage before the DOM even loads
    const currentConsent = localStorage.getItem('cookieConsent');
    
    if (currentConsent) {
        gtag('consent', 'update', {
            'analytics_storage': currentConsent
        });
        
    }

    // 3. UI Logic for the Banner
    function initConsent() {
        const banner = document.getElementById('cookie-consent-popup');
        const acceptBtn = document.getElementById('cookie-accept');
        const rejectBtn = document.getElementById('cookie-reject');

        // Only show banner if the user hasn't made a choice yet
        if (!currentConsent) {
            banner.style.display = 'block';
        }

        // Button Logic
        acceptBtn.onclick = function() {
            localStorage.setItem('cookieConsent', 'granted');
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
            banner.style.display = 'none';
        };

        rejectBtn.onclick = function() {
            localStorage.setItem('cookieConsent', 'denied');
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
            banner.style.display = 'none';
        };
    }

    // Run UI logic when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConsent);
    } else {
        initConsent();
    }
})();
