
d3.csv("data/hospitalised_injuries_all.csv", d => ({
    dataset: d.dataset,
    year: +d.year,
    category: d.category,
    value: +d.Hospitalisations
})).then(data => {
    const rows = data.filter(d =>
        d.dataset === "national_age" &&
        d.year === 2021 &&
        d.category !== "Missing"
    );

    const container = d3.select("#age-chart");

    if (!rows.length) {
        container.text("No data available.");
        return;
    }

    const width = 650;
    const height = 420;
    const margin = { top: 25, right: 20, bottom: 65, left: 65 };

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const ageOrder = [
        "0-7", "8-16", "17-25", "26-39",
        "40-64", "65-74", "75+"
    ];

    rows.sort((a, b) =>
        ageOrder.indexOf(a.category) - ageOrder.indexOf(b.category)
    );

    const x = d3.scaleBand()
        .domain(rows.map(d => d.category))
        .range([margin.left, width - margin.right])
        .padding(0.25);

    const y = d3.scaleLinear()
        .domain([0, d3.max(rows, d => d.value) * 1.15])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat(""))
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat(""))
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")));

    svg.selectAll(".bar")
        .data(rows)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.category))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", "#3b82f6");

    svg.selectAll(".value-label")
        .data(rows)
        .enter()
        .append("text")
        .attr("x", d => x(d.category) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 7)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .text(d => d3.format(",")(d.value));

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", (margin.left + width - margin.right) / 2)
        .attr("y", height - 12)
        .attr("text-anchor", "middle")
        .text("Age Group");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height - margin.bottom + margin.top) / 2)
        .attr("y", 17)
        .attr("text-anchor", "middle")
        .text("Hospitalisations");
}).catch(error => {
    console.error("Error loading age chart data:", error);
    d3.select("#age-chart").text("Unable to load chart data.");
});
