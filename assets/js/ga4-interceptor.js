(function() {
    // 1. Create the UI Display
    const logger = document.createElement('div');
    logger.id = 'ga4-logger';
    logger.style = "position:fixed; bottom:20px; right:20px; width:350px; height:250px; background:rgba(0,0,0,0.85); color:#00ff00; overflow-y:auto; z-index:10000; font-family:monospace; padding:15px; font-size:11px; border-radius:8px; border:1px solid #444; box-shadow: 0 4px 15px rgba(0,0,0,0.5);";
    logger.innerHTML = "<div style='border-bottom:1px solid #444; margin-bottom:10px; padding-bottom:5px; font-weight:bold;'>📡 GA4 Live Interceptor</div>";
    document.body.appendChild(logger);

    function logToScreen(url, data) {
        // Look for the GA4 collection endpoint
        if (url.includes("measurement.stefandezarn.com/g/collect")) {
            const params = new URLSearchParams(data || url.split('?')[1]);
            const eventName = params.get('en') || "unknown_event";
            const time = new Date().toLocaleTimeString().split(' ')[0];
            
            const entry = document.createElement('div');
            entry.style = "margin-bottom: 8px; border-left: 2px solid #00ff00; padding-left: 8px;";
            entry.innerHTML = `<span style="color:#888;">[${time}]</span> EVENT: <b style="color:#fff;">${eventName}</b>`;
            
            // Optional: Show specific parameters if they exist
            if (params.get('ep.item_name')) {
                entry.innerHTML += `<br><span style="color:#aaa; padding-left:10px;">└ Item: ${params.get('ep.item_name')}</span>`;
            }

            logger.appendChild(entry);
            logger.scrollTop = logger.scrollHeight;
        }
    }

    // 2. Intercept Fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = args[0];
        const options = args[1];
        logToScreen(url, options?.body);
        return originalFetch(...args);
    };

    // 3. Intercept sendBeacon
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
        logToScreen(url, data);
        return originalSendBeacon.apply(this, arguments);
    };
})();
