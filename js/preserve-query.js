/**
 * Preserve query string parameters when navigating between pages
 */
(function() {
	'use strict';

	// Get current query string (without the '?')
	function getQueryString() {
		const queryString = window.location.search;
		return queryString ? queryString.substring(1) : '';
	}

	// Check if URL is internal (same origin)
	function isInternalLink(url) {
		try {
			const linkUrl = new URL(url, window.location.origin);
			return linkUrl.origin === window.location.origin;
		} catch (e) {
			// If URL parsing fails, check if it's a relative path
			return url && !url.startsWith('http') && !url.startsWith('//') && !url.startsWith('mailto:') && !url.startsWith('tel:');
		}
	}

	// Merge query strings (preserve existing params, add new ones)
	function mergeQueryStrings(existing, newParams) {
		if (!newParams) return existing;
		if (!existing) return newParams;

		const existingParams = new URLSearchParams(existing);
		const newParamsObj = new URLSearchParams(newParams);

		// Merge: existing params take precedence, then add new ones
		for (const [key, value] of newParamsObj.entries()) {
			if (!existingParams.has(key)) {
				existingParams.append(key, value);
			}
		}

		return existingParams.toString();
	}

	// Add query string to a URL
	function addQueryToUrl(url, queryString) {
		if (!queryString) return url;

		try {
			const urlObj = new URL(url, window.location.origin);
			const existingParams = urlObj.search.substring(1);
			const mergedParams = mergeQueryStrings(existingParams, queryString);
			
			if (mergedParams) {
				urlObj.search = mergedParams;
			}
			
			// Return relative URL if original was relative
			if (!url.startsWith('http') && !url.startsWith('//')) {
				return urlObj.pathname + (mergedParams ? '?' + mergedParams : '') + urlObj.hash;
			}
			
			return urlObj.toString();
		} catch (e) {
			// Fallback for relative URLs
			const separator = url.includes('?') ? '&' : '?';
			return url + separator + queryString;
		}
	}

	// Preserve query string on link clicks
	function preserveQueryOnClick(e) {
		const link = e.currentTarget;
		const href = link.getAttribute('href');

		// Skip if no href, external links, anchors, or special protocols
		if (!href || 
			href.startsWith('#') || 
			href.startsWith('mailto:') || 
			href.startsWith('tel:') ||
			link.hasAttribute('target') && link.getAttribute('target') === '_blank') {
			return;
		}

		// Only process internal links
		if (!isInternalLink(href)) {
			return;
		}

		const currentQuery = getQueryString();
		
		// If there's a query string to preserve
		if (currentQuery) {
			const newUrl = addQueryToUrl(href, currentQuery);
			
			// Update the href attribute
			link.setAttribute('href', newUrl);
		}
	}

	// Initialize when DOM is ready
	function init() {
		const currentQuery = getQueryString();
		
		// If no query string, nothing to preserve
		if (!currentQuery) {
			return;
		}

		// Find all internal links and attach listeners
		const links = document.querySelectorAll('a[href]');
		
		links.forEach(function(link) {
			const href = link.getAttribute('href');
			
			// Skip external links, anchors, and special protocols
			if (!href || 
				href.startsWith('#') || 
				href.startsWith('mailto:') || 
				href.startsWith('tel:') ||
				(link.hasAttribute('target') && link.getAttribute('target') === '_blank')) {
				return;
			}

			// Only process internal links
			if (isInternalLink(href)) {
				// Add query string to href immediately
				const newUrl = addQueryToUrl(href, currentQuery);
				if (newUrl !== href) {
					link.setAttribute('href', newUrl);
				}
			}
		});
	}

	// Run on DOMContentLoaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		// DOM already loaded
		init();
	}
})();

