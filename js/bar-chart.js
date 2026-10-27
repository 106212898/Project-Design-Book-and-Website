
d3.csv("data/hospitalised_injuries_all.csv", d => ({
    dataset: d.dataset,
    year: +d.year,
    category: d.category,
    value: +d.Hospitalisations
})).then(data => {
    const rows = data.filter(d =>
        d.dataset === "national_roaduser" && d.year === 2021
    );

    const container = d3.select("#bar-chart");

    if (!rows.length) {
        container.text("No data available.");
        return;
    }

    const width = 650;
    const height = 530;
    const margin = { top: 15, right: 65, bottom: 45, left: 195 };

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    rows.sort((a, b) => d3.descending(a.value, b.value));

    const x = d3.scaleLinear()
        .domain([0, d3.max(rows, d => d.value) * 1.15])
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(rows.map(d => d.category))
        .range([margin.top, height - margin.bottom])
        .padding(0.22);

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5)
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat(""))
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",")));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(rows)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", margin.left)
        .attr("y", d => y(d.category))
        .attr("width", d => x(d.value) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", "#0d9488");

    svg.selectAll(".bar-label")
        .data(rows)
        .enter()
        .append("text")
        .attr("x", d => x(d.value) + 6)
        .attr("y", d => y(d.category) + y.bandwidth() / 2 + 4)
        .attr("fill", "#334155")
        .attr("font-size", 11)
        .text(d => d3.format(",")(d.value));

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", (margin.left + width - margin.right) / 2)
        .attr("y", height - 7)
        .attr("text-anchor", "middle")
        .text("Hospitalisations");
}).catch(error => {
    console.error("Error loading bar chart data:", error);
    d3.select("#bar-chart").text("Unable to load chart data.");
});
