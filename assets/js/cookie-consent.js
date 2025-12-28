(function() {
    // 1. GTM Setup
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}

    function initConsent() {
        const banner = document.getElementById('cookie-consent-popup');
        const acceptBtn = document.getElementById('cookie-accept');
        const rejectBtn = document.getElementById('cookie-reject');
        
        const currentConsent = localStorage.getItem('cookieConsent');

        // Show banner if no choice exists
        if (!currentConsent) {
            banner.style.display = 'block';
        }

        // Button Logic
        acceptBtn.onclick = function() {
            localStorage.setItem('cookieConsent', 'granted');
            gtag('consent', 'update', { 'analytics_storage': 'granted', 'ad_storage': 'granted' });
            banner.style.display = 'none';
            window.dataLayer.push({'event': 'consent_updated'});
        };

        rejectBtn.onclick = function() {
            localStorage.setItem('cookieConsent', 'denied');
            gtag('consent', 'update', { 'analytics_storage': 'denied', 'ad_storage': 'denied' });
            banner.style.display = 'none';
            window.dataLayer.push({'event': 'consent_updated'});
        };
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConsent);
    } else {
        initConsent();
    }
})();
