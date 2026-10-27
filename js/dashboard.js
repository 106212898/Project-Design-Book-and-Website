/* Shared data, controls and accessible interactions for the five D3 charts. */
const Dashboard = (() => {
    const renderers = new Map();
    let data = [], year, latestYear;
    const hidden = new Set();
    let selectedState = null;
    const format = d3.format(',');
    const tip = d3.select('body').append('div').attr('class', 'chart-tooltip').attr('role', 'tooltip').attr('id', 'chart-tooltip').attr('hidden', true);
    const api = { sort: 'value', register(name, render) { renderers.set(name, render); }, interactions };
    function dismiss() { tip.attr('hidden', true); }
    function show(event, text) {
        tip.text(text).attr('hidden', null);
        const rect = event.currentTarget.getBoundingClientRect();
        const px = Number.isFinite(event.clientX) ? event.clientX : rect.left + rect.width / 2;
        const py = Number.isFinite(event.clientY) ? event.clientY : rect.top;
        const box = tip.node().getBoundingClientRect();
        tip.style('left', `${Math.max(8, Math.min(px + 12, window.innerWidth - box.width - 8))}px`)
            .style('top', `${Math.max(8, Math.min(py + 12, window.innerHeight - box.height - 8))}px`);
    }
    function bindDetails(marks, describe) {
        marks.attr('tabindex', 0).attr('aria-describedby', 'chart-tooltip')
            .attr('aria-label', d => describe(d)).classed('interactive-mark', true)
            .on('pointerenter.details pointermove.details focus.details click.details', function(event, d) { show(event, describe(d)); })
            .on('pointerleave.details blur.details', dismiss)
            .on('keydown.details', event => { if (event.key === 'Escape') dismiss(); });
    }
    function button(item, label, action) {
        item.attr('tabindex', 0).attr('role', 'button').attr('aria-label', label).classed('interactive-legend', true)
            .on('click', action).on('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); }
            });
        // A visible, generous click target for each SVG legend row.
        const bounds = item.node().getBBox();
        item.insert('rect', ':first-child').attr('x', bounds.x - 4).attr('y', bounds.y - 6)
            .attr('width', bounds.width + 8).attr('height', Math.max(26, bounds.height + 12)).attr('fill', 'transparent');
    }
    function interactions(name, container) {
        const svg = container.select('svg');
        svg.attr('role', 'group').attr('aria-label', container.node().closest('section').querySelector('h2').textContent);
        if (name === 'bar' || name === 'age') {
            bindDetails(svg.selectAll('.bar'), d => `${d.category} · ${year}: ${format(d.value)} hospitalisations`);
        } else if (name === 'donut') {
            const slices = svg.selectAll('path');
            const total = d3.sum(slices.data(), d => d.data.value);
            bindDetails(slices, d => `${d.data.category} · ${year}: ${format(d.data.value)} hospitalisations (${(d.data.value / total * 100).toFixed(1)}%)`);
        } else if (name === 'line') {
            bindDetails(svg.selectAll('.line-point'), d => `${d.category} · ${d.year}: ${format(d.value)} hospitalisations`);
            const lines = svg.selectAll('.line');
            const legends = svg.selectAll('g').filter(function() { return d3.select(this).select(':scope > .legend-label').size() > 0; });
            function update() {
                lines.style('display', values => hidden.has(values[0].category) ? 'none' : null);
                svg.selectAll('.line-point').style('display', d => hidden.has(d.category) ? 'none' : null);
                legends.attr('aria-pressed', function() { return !hidden.has(d3.select(this).select('.legend-label').text()); })
                    .style('opacity', function() { return hidden.has(d3.select(this).select('.legend-label').text()) ? 0.4 : 1; });
            }
            legends.each(function() {
                const item = d3.select(this), category = item.select('.legend-label').text();
                button(item, `Show or hide ${category}`, () => {
                    if (hidden.has(category)) hidden.delete(category); else hidden.add(category);
                    dismiss(); update();
                });
            });
            update();
        } else if (name === 'state') {
            const areas = svg.selectAll('.area');
            const legends = svg.selectAll('g').filter(function() { return d3.select(this).select(':scope > .legend-label').size() > 0; });
            const years = areas.datum().map(d => d.data.year);
            const x = d3.scaleLinear().domain(d3.extent(years)).range([75, 930]);
            areas.classed('interactive-mark', true).on('pointermove click', function(event, layer) {
                const [px] = d3.pointer(event, svg.node());
                const nearest = d3.least(layer, d => Math.abs(d.data.year - x.invert(px)));
                show(event, `${layer.key} · ${nearest.data.year}: ${format(nearest[1] - nearest[0])} hospitalisations`);
            }).on('pointerleave', dismiss);
            function highlight() {
                areas.style('opacity', d => !selectedState || d.key === selectedState ? 1 : 0.18);
                legends.attr('aria-pressed', function() { return d3.select(this).select('.legend-label').text() === selectedState; });
            }
            legends.each(function() {
                const item = d3.select(this), state = item.select('.legend-label').text();
                button(item, `Highlight ${state}`, () => { selectedState = selectedState === state ? null : state; highlight(); });
            });
            // Keyboard and touch users can inspect exact state values using the controls below.
            const inspector = container.append('div').attr('class', 'state-inspector');
            inspector.append('label').attr('for', 'state-detail-year').text('Inspect state values for ');
            const select = inspector.append('select').attr('id', 'state-detail-year');
            select.selectAll('option').data(years).join('option').attr('value', d => d).text(d => d);
            select.property('value', year);
            const details = inspector.append('p').attr('aria-live', 'polite');
            function inspect() { const chosen = +select.property('value'); details.text(areas.data().map(layer => { const d = layer.find(d => d.data.year === chosen); return `${layer.key}: ${format(d[1] - d[0])}`; }).join(' · ')); }
            select.on('change', inspect); inspect(); highlight();
        }
    }
    function render(names = [...renderers.keys()]) {
        dismiss();
        names.forEach(name => renderers.get(name)(data, year));
        d3.selectAll('.selected-year').text(year);
        d3.select('#dashboard-status').text(`Comparison year: ${year}. Trend charts show all available years.`);
    }
    document.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
    window.addEventListener('scroll', dismiss, true);
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            data = await d3.csv('Data/hospitalised_injuries_all.csv', d => ({ dataset: d.dataset, year: +d.year, category: d.category, value: d.Hospitalisations.trim() === '' ? NaN : +d.Hospitalisations }));
            data = data.filter(d => Number.isFinite(d.year) && Number.isFinite(d.value));
            const years = [...new Set(data.filter(d => d.dataset === 'national_roaduser').map(d => d.year))].sort(d3.ascending);
            if (!years.length) throw new Error('No chart data');
            year = latestYear = d3.max(years);
            d3.select('#year-select').selectAll('option').data(years).join('option').attr('value', d => d).text(d => d);
            d3.select('#year-select').property('disabled', false).property('value', year).on('change', function() { year = +this.value; render(['bar', 'donut', 'age']); });
            d3.select('#sort-select').on('change', function() { api.sort = this.value; render(['bar']); });
            d3.select('#reset-controls').on('click', () => {
                year = latestYear; api.sort = 'value'; hidden.clear(); selectedState = null;
                d3.select('#year-select').property('value', year); d3.select('#sort-select').property('value', 'value'); render();
            });
            render();
        } catch (error) {
            console.error(error);
            d3.select('#dashboard-status').text('Unable to load the dashboard. Serve this folder through a web server and check that Data/hospitalised_injuries_all.csv is available.');
        }
    });
    return api;
})();
