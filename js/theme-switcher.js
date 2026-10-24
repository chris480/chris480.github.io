// Display settings (gear in the nav): theme + background motion.
// The choice lives on <html data-theme / data-motion>; header.html applies the saved value before paint.
(function() {
    'use strict';

    var THEMES = ['light', 'dark', 'linotype', 'mecha', '8bit'];
    var THEME_COLORS = { light: '#F7F8FA', dark: '#070A12', linotype: '#ECE7DC', mecha: '#060C12', '8bit': '#0D0E24' };
    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function store(key, value) {
        try {
            if (value === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, value);
            }
        } catch (e) {}
    }

    function updateThemeColor() {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        var theme = root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');
        meta.setAttribute('content', THEME_COLORS[theme]);
    }

    function setTheme(value) {
        if (THEMES.indexOf(value) !== -1) {
            root.setAttribute('data-theme', value);
            store('site-theme', value);
        } else {
            root.removeAttribute('data-theme');
            store('site-theme', null);
        }
        updateThemeColor();
    }

    function setMotion(on) {
        if (on) {
            root.removeAttribute('data-motion');
            store('site-motion', null);
        } else {
            root.setAttribute('data-motion', 'off');
            store('site-motion', 'off');
        }
    }

    function init() {
        var switcher = document.querySelector('.theme-switcher');
        updateThemeColor();
        darkQuery.addEventListener('change', updateThemeColor);
        if (!switcher) return;

        var toggle = switcher.querySelector('.theme-toggle');
        var panel = switcher.querySelector('.theme-panel');
        var radios = switcher.querySelectorAll('input[name="site-theme"]');
        var motion = switcher.querySelector('input[name="site-motion"]');
        var motionNote = switcher.querySelector('.theme-motion-note');

        var current = root.getAttribute('data-theme') || 'auto';
        Array.prototype.forEach.call(radios, function(radio) {
            radio.checked = radio.value === current;
            radio.addEventListener('change', function() {
                if (radio.checked) setTheme(radio.value);
            });
        });

        // The OS setting wins: the switch shows "off" and is locked while reduced motion is on
        function syncMotion() {
            var systemReduced = reduceMotion.matches;
            motion.disabled = systemReduced;
            motion.checked = !systemReduced && root.getAttribute('data-motion') !== 'off';
            motionNote.hidden = !systemReduced;
        }
        syncMotion();
        reduceMotion.addEventListener('change', syncMotion);
        motion.addEventListener('change', function() {
            setMotion(motion.checked);
        });

        function open() {
            panel.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
            var checked = panel.querySelector('input[name="site-theme"]:checked');
            if (checked) checked.focus();
        }
        function close(returnFocus) {
            if (panel.hidden) return;
            panel.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
            if (returnFocus) toggle.focus();
        }

        toggle.addEventListener('click', function() {
            if (panel.hidden) {
                open();
            } else {
                close(false);
            }
        });
        switcher.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') close(true);
        });
        document.addEventListener('click', function(e) {
            if (!switcher.contains(e.target)) close(false);
        });
        switcher.addEventListener('focusout', function(e) {
            if (e.relatedTarget && !switcher.contains(e.relatedTarget)) close(false);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
