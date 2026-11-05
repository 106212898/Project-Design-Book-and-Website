/* Tabs: show one page of charts at a time so the dashboard fits the screen without scrolling. */
(() => {
    const tabs = [...document.querySelectorAll('.tab')];
    const pages = [...document.querySelectorAll('.page')];
    const filters = [...document.querySelectorAll('.filter')];
    // On small or short screens every page is stacked and the page scrolls normally.
    const compact = window.matchMedia('(max-width: 900px), (max-height: 600px)');
    let current = 'overview';

    function show(name) {
        current = name;
        tabs.forEach(tab => {
            const on = tab.dataset.page === name;
            tab.classList.toggle('active', on);
            tab.setAttribute('aria-selected', on);
            tab.tabIndex = on ? 0 : -1;
        });
        pages.forEach(page => {
            const on = page.dataset.page === name;
            page.classList.toggle('active', on);
            page.inert = !on && !compact.matches;
        });
        // Dim the filters that do not affect the current page
        filters.forEach(filter => {
            const on = compact.matches || filter.dataset.pages.split(' ').includes(name);
            filter.classList.toggle('off', !on);
            filter.inert = !on;
        });
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => show(tab.dataset.page));
        tab.addEventListener('keydown', event => {
            const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!step) return;
            const next = tabs[(i + step + tabs.length) % tabs.length];
            next.focus();
            show(next.dataset.page);
        });
    });

    compact.addEventListener('change', () => show(current));
    show(current);
})();