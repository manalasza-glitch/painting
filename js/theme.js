/* User-selectable light/dark theme. */
(function () {
    const STORAGE_KEY = 'PAINTING_THEME';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';

    function normalizeTheme(theme) {
        return theme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
    }

    function getTheme() {
        return normalizeTheme(document.documentElement.getAttribute('data-theme'));
    }

    function updateThemeControls(theme) {
        const nextTheme = theme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
        const nextLabel = nextTheme === LIGHT_THEME ? 'โหมดสว่าง' : 'โหมดมืด';

        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.setAttribute('aria-label', `เปลี่ยนเป็น${nextLabel}`);
            button.setAttribute('title', `เปลี่ยนเป็น${nextLabel}`);
            const label = button.querySelector('.theme-toggle-label');
            if (label) label.textContent = nextLabel;
        });
    }

    function refreshChartTheme() {
        // Chart.js keeps its text colors in canvas options, so refresh those
        // colors when the user switches theme without rebuilding the charts.
        if (typeof Chart === 'undefined' || !Chart.instances) return;

        const textColor = getTheme() === LIGHT_THEME ? '#475569' : '#94a3b8';
        const titleColor = getTheme() === LIGHT_THEME ? '#334155' : '#cbd5e1';
        const instances = Object.values(Chart.instances);

        instances.forEach(chart => {
            if (!chart || !chart.options) return;
            const options = chart.options;
            if (options.plugins && options.plugins.legend && options.plugins.legend.labels) {
                options.plugins.legend.labels.color = textColor;
            }
            if (options.plugins && options.plugins.tooltip) {
                options.plugins.tooltip.titleColor = titleColor;
                options.plugins.tooltip.bodyColor = titleColor;
                options.plugins.tooltip.backgroundColor = getTheme() === LIGHT_THEME ? '#ffffff' : '#0f172a';
                options.plugins.tooltip.borderColor = getTheme() === LIGHT_THEME ? '#d5e2ee' : 'rgba(56, 189, 248, 0.35)';
                options.plugins.tooltip.borderWidth = 1;
            }
            if (options.scales) {
                Object.values(options.scales).forEach(scale => {
                    if (!scale) return;
                    if (scale.ticks) scale.ticks.color = textColor;
                    if (scale.title) scale.title.color = titleColor;
                    if (scale.grid) scale.grid.color = getTheme() === LIGHT_THEME
                        ? 'rgba(100, 116, 139, 0.16)'
                        : 'rgba(148, 163, 184, 0.12)';
                });
            }
            chart.update('none');
        });
    }

    function setTheme(theme, persist = true) {
        const normalizedTheme = normalizeTheme(theme);
        document.documentElement.setAttribute('data-theme', normalizedTheme);
        document.documentElement.style.colorScheme = normalizedTheme;

        if (persist) {
            try {
                localStorage.setItem(STORAGE_KEY, normalizedTheme);
            } catch (error) {
                // Private browsing or disabled storage should not break theme switching.
            }
        }

        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', normalizedTheme === LIGHT_THEME ? '#f3f7fb' : '#0c2340');
        }

        updateThemeControls(normalizedTheme);
        refreshChartTheme();
        window.dispatchEvent(new CustomEvent('painting-theme-change', {
            detail: { theme: normalizedTheme }
        }));
    }

    function readSavedTheme() {
        try {
            return normalizeTheme(localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return getTheme();
        }
    }

    window.PaintingTheme = {
        getTheme,
        setTheme,
        toggle: () => setTheme(getTheme() === LIGHT_THEME ? DARK_THEME : LIGHT_THEME)
    };

    setTheme(readSavedTheme(), false);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTheme(getTheme(), false), { once: true });
    } else {
        setTheme(getTheme(), false);
    }
}());
