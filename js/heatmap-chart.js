Dashboard.register("heatmap", (data) => {
    const rows = data.filter(d => d.dataset === "state");
    const container = d3.select("#heatmap-chart");

    container.selectAll("*").remove();

    if (!rows.length) {
        container.text("No data available.");
        return;
    }

    const width = 700;
    const margin = { top: 30, right: 20, bottom: 20, left: 60 };

    const years = [...new Set(rows.map(d => d.year))].sort(d3.ascending);
    const states = [...new Set(rows.map(d => d.category))].sort();

    const cellHeight = 50;
    const height = margin.top + margin.bottom + states.length * cellHeight;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    // One cell per state and year
    const cells = states.flatMap(state => years.map(year => ({
        state,
        year,
        value: d3.sum(rows.filter(d => d.category === state && d.year === year), d => d.value)
    })));

    // Each state is scaled against its own peak, so small states stay readable
    const peak = new Map(states.map(s => [s, d3.max(cells.filter(c => c.state === s), c => c.value)]));
    const color = d3.scaleSequential(d3.interpolateRgb("#f1f0e2", "#0a3f2c")).domain([0, 1]);
    const shade = d => color(d.value / peak.get(d.state));

    const x = d3.scaleBand().domain(years).range([margin.left, width - margin.right]).padding(0);
    const y = d3.scaleBand().domain(states).range([margin.top, height - margin.bottom]).padding(0);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).tickSize(0))
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove());

    svg.selectAll(".heat-cell")
        .data(cells)
        .enter()
        .append("rect")
        .attr("class", "heat-cell")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.state))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", shade);

    svg.selectAll(".heat-value")
        .data(cells)
        .enter()
        .append("text")
        .attr("class", "heat-value")
        .attr("x", d => x(d.year) + x.bandwidth() / 2)
        .attr("y", d => y(d.state) + y.bandwidth() / 2 + 4)
        .attr("text-anchor", "middle")
        .style("fill", d => d.value / peak.get(d.state) > 0.62 ? "#ffffff" : "#1f2933")
        .text(d => d3.format(",")(d.value));

    Dashboard.interactions("heatmap", container);
});