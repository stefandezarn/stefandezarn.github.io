document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("cookie-banner");
    const acceptBtn = document.getElementById("accept-cookies");
    const rejectBtn = document.getElementById("reject-cookies");

    // 1. Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");

    if (!consent) {
        banner.style.display = "block";
    } else if (consent === "accepted") {
        loadTrackingScripts();
    }

    // 2. Handle "Accept" click
    acceptBtn.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "accepted");
        banner.style.display = "none";
        loadTrackingScripts(); // Start tracking immediately
    });

    // 3. Handle "Reject" click
    rejectBtn.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "rejected");
        banner.style.display = "none";
        // Do NOT load tracking scripts
    });

    
    }
});
