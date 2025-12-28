// 1. Define the gtag function for GTM
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("cookie-banner");
    const acceptBtn = document.getElementById("accept-cookies");
    const rejectBtn = document.getElementById("reject-cookies");

    // Check localStorage for existing choice
    const consentChoice = localStorage.getItem("cookieConsent");

    // 2. If no choice has been made, show the banner
    if (!consentChoice) {
        banner.style.display = "block";
    }

    // 3. Handle Accept
    acceptBtn.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "granted");
        banner.style.display = "none";
        
        // Update GTM Consent Mode
        gtag('consent', 'update', {
            'ad_storage': 'granted',
            'analytics_storage': 'granted'
        });
        dataLayer.push({'event': 'consent_updated'});
    });

    // 4. Handle Reject
    rejectBtn.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "denied");
        banner.style.display = "none";
        
        // Update GTM Consent Mode
        gtag('consent', 'update', {
            'ad_storage': 'denied',
            'analytics_storage': 'denied'
        });
        dataLayer.push({'event': 'consent_updated'});
    });
});
