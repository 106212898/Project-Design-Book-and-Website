Dashboard.register("state", (data, selectedYear) => {
    const rows = data.filter(d => d.dataset === "state");
    const container = d3.select("#state-chart");

    container.selectAll("*").remove();

    if (!rows.length) {
        container.text("No data available.");
        return;
    }

    const width = 960;
    const height = 520;

    const margin = {
        top: 25,
        right: 30,
        bottom: 110,
        left: 75
    };

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const years = [...new Set(rows.map(d => d.year))]
        .sort(d3.ascending);

    const states = [...new Set(rows.map(d => d.category))]
        .sort();

    const yearlyData = years.map(year => {
        const record = { year };

        states.forEach(state => {
            record[state] = d3.sum(
                rows.filter(d =>
                    d.year === year && d.category === state
                ),
                d => d.value
            );
        });

        return record;
    });

    const color = d3.scaleOrdinal()
        .domain(states)
        .range(d3.schemeTableau10);

    const stackedData = d3.stack()
        .keys(states)(yearlyData);

    const x = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([
            0,
            d3.max(stackedData, layer =>
                d3.max(layer, d => d[1])
            )
        ])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Horizontal grid lines
    svg.append("g")
        .attr("class", "grid")
        .attr("transform",
            `translate(${margin.left},0)`)
        .call(
            d3.axisLeft(y)
                .ticks(6)
                .tickSize(-(width - margin.left - margin.right))
                .tickFormat("")
        )
        .call(g => g.select(".domain").remove());

    // X-axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform",
            `translate(0,${height - margin.bottom})`)
        .call(
            d3.axisBottom(x)
                .tickFormat(d3.format("d"))
                .ticks(8)
        );

    // Y-axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(
            d3.axisLeft(y)
                .ticks(6)
                .tickFormat(d3.format(","))
        );

    // Stacked areas
    const area = d3.area()
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    svg.selectAll(".area")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", d => color(d.key))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.5);

    // Axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", (margin.left + width - margin.right) / 2)
        .attr("y", height - margin.bottom + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(margin.top + height - margin.bottom) / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .text("Hospitalisations");

    // Legend in two rows below the chart
    const legend = svg.append("g")
        .attr("transform",
            `translate(${margin.left},${height - 38})`);

    states.forEach((state, i) => {
        const column = i % 4;
        const row = Math.floor(i / 4);

        const item = legend.append("g")
            .attr("transform",
                `translate(${column * 215},${row * 23})`);

        item.append("rect")
            .attr("width", 13)
            .attr("height", 13)
            .attr("rx", 3)
            .attr("fill", color(state));

        item.append("text")
            .attr("class", "legend-label")
            .attr("x", 20)
            .attr("y", 11)
            .text(state);
    });

    Dashboard.interactions("state", container);
});
