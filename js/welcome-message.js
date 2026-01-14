/**
 * Welcome Message Handler
 * Displays a personalized welcome message if ?p= query parameter is present
 * Security: Limits input to 12 characters and escapes HTML
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        const welcomeElement = document.getElementById('welcome-message');
        
        if (!welcomeElement) {
            return; // Element not found, exit early
        }
        
        // Get query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const nameParam = urlParams.get('p');
        
        if (!nameParam) {
            return; // No ?p= parameter, exit early
        }
        
        // Security: Sanitize input
        // 1. Limit to 12 characters
        // 2. Remove any HTML tags
        // 3. Escape special characters
        let sanitizedName = nameParam.trim();
        
        // Limit to 12 characters
        if (sanitizedName.length > 12) {
            sanitizedName = sanitizedName.substring(0, 12);
        }
        
        // Remove HTML tags and escape special characters
        const tempDiv = document.createElement('div');
        tempDiv.textContent = sanitizedName;
        sanitizedName = tempDiv.innerHTML;
        
        // Only allow alphanumeric, spaces, and common punctuation
        sanitizedName = sanitizedName.replace(/[^a-zA-Z0-9\s\-_.,!?]/g, '');
        
        if (sanitizedName.length === 0) {
            return; // No valid characters after sanitization
        }
        
        // Display welcome message with name wrapped in span for styling
        welcomeElement.innerHTML = 'Welcome, <span class="welcome-name">' + sanitizedName + '</span> to something stellar 💫';
        welcomeElement.style.display = 'block';
    });
})();

