
d3.csv("data/hospitalised_injuries_all.csv", d => ({
    dataset: d.dataset,
    year: +d.year,
    category: d.category,
    value: +d.Hospitalisations
})).then(data => {
    const rows = data.filter(d => d.dataset === "national_roaduser");
    const container = d3.select("#line-chart");

    if (!rows.length) {
        container.text("No data available.");
        return;
    }

    const width = 960;
    const height = 440;
    const margin = { top: 20, right: 235, bottom: 55, left: 65 };

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const years = [...new Set(rows.map(d => d.year))].sort(d3.ascending);
    const categories = [...new Set(rows.map(d => d.category))].sort();

    const grouped = categories.map(category => ({
        category,
        values: years.map(year => ({
            year,
            value: d3.sum(
                rows.filter(d => d.category === category && d.year === year),
                d => d.value
            )
        }))
    }));

    const x = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(rows, d => d.value) * 1.12])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeTableau10.concat(d3.schemeSet3));

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d"))
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat(""))
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y)
            .ticks(6)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat(""))
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(8));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    grouped.forEach((series, i) => {
        svg.append("path")
            .datum(series.values)
            .attr("class", "line")
            .attr("stroke", color(series.category))
            .attr("d", line);

        svg.selectAll(`.point-${i}`)
            .data(series.values)
            .enter()
            .append("circle")
            .attr("class", "line-point")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 2.5)
            .attr("fill", color(series.category));
    });

    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20},${margin.top + 5})`);

    grouped.forEach((series, i) => {
        const item = legend.append("g")
            .attr("transform", `translate(0,${i * 29})`);

        item.append("line")
            .attr("x1", 0).attr("x2", 18)
            .attr("y1", 5).attr("y2", 5)
            .attr("stroke", color(series.category))
            .attr("stroke-width", 3);

        item.append("text")
            .attr("class", "legend-label")
            .attr("x", 25).attr("y", 9)
            .text(series.category);
    });

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", (margin.left + width - margin.right) / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height - margin.bottom + margin.top) / 2)
        .attr("y", 17)
        .attr("text-anchor", "middle")
        .text("Hospitalisations");
}).catch(error => {
    console.error("Error loading line chart data:", error);
    d3.select("#line-chart").text("Unable to load chart data.");
});
