
d3.csv("data/hospitalised_injuries_all.csv", d => ({
    dataset: d.dataset,
    year: +d.year,
    category: d.category,
    value: +d.Hospitalisations
})).then(data => {
    const rows = data.filter(d =>
        d.dataset === "national_sex" && d.year === 2021
    );

    const container = d3.select("#donut-chart");

    if (!rows.length) {
        container.text("No data available.");
        return;
    }

    const width = 500;
    const height = 390;
    const radius = 125;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const color = d3.scaleOrdinal()
        .domain(rows.map(d => d.category))
        .range(["#0d9488", "#3b82f6", "#f59e0b"]);

    const total = d3.sum(rows, d => d.value);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(radius * 0.62)
        .outerRadius(radius);

    const chart = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2 - 10})`);

    chart.selectAll("path")
        .data(pie(rows))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 3);

    chart.append("text")
        .attr("class", "center-number")
        .attr("text-anchor", "middle")
        .attr("dy", "-2px")
        .text(d3.format(",")(total));

    chart.append("text")
        .attr("class", "center-label")
        .attr("text-anchor", "middle")
        .attr("dy", "18px")
        .text("Total");

    const legend = svg.append("g")
        .attr("transform", `translate(20,${height - 60})`);

    rows.forEach((d, i) => {
        const x = i === 0 ? 0 : i === 1 ? 155 : 300;

        legend.append("rect")
            .attr("x", x)
            .attr("y", 0)
            .attr("width", 10)
            .attr("height", 10)
            .attr("rx", 2)
            .attr("fill", color(d.category));

        legend.append("text")
            .attr("class", "legend-label")
            .attr("x", x + 15)
            .attr("y", 9)
            .text(
                d.category === "intersex or indeterminate or missing"
                    ? "Other / missing"
                    : d.category
            );
    });

    const labels = chart.selectAll(".slice-label")
        .data(pie(rows))
        .enter()
        .append("text")
        .attr("class", "slice-label")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .text(d => `${(d.data.value / total * 100).toFixed(1)}%`);
}).catch(error => {
    console.error("Error loading donut chart data:", error);
    d3.select("#donut-chart").text("Unable to load chart data.");
});
