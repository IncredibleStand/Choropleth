// URLs for the required JSON data: education and county data
const educationDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const countyDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

// Select the SVG container for the map and the tooltip for displaying information
const svg = d3.select('#map');
const tooltip = d3.select('#tooltip');

// Define the width and height of the SVG container
const width = 960;
const height = 600;

// Create a color scale using d3.scaleThreshold
// The domain specifies thresholds for grouping data into categories
// The range specifies corresponding colors from the d3.schemeBlues palette
const colorScale = d3.scaleThreshold()
    .domain([7, 14, 21, 28, 35, 42, 49, 56, 63]) // Thresholds for education levels
    .range(d3.schemeBlues[9]); // Array of 9 shades of blue

// Load both education and county data using Promise.all
Promise.all([d3.json(educationDataUrl), d3.json(countyDataUrl)]).then(([educationData, countyData]) => {
    // Extract county features from the TopoJSON county data
    const counties = topojson.feature(countyData, countyData.objects.counties).features;

    // Create a map to link education data by FIPS code
    // The Map object stores (fips -> education data) pairs
    const educationMap = new Map(educationData.map(d => [d.fips, d]));

    // Set the width and height of the SVG container
    svg.attr('width', width)
        .attr('height', height);

    // Bind county data to the SVG and create a path for each county
    svg.selectAll('.county')
        .data(counties) // Bind data to each county path
        .enter()
        .append('path') // Append a new <path> element for each county
        .attr('class', 'county') // Add class for styling
        .attr('d', d3.geoPath()) // Generate the county path using the GeoJSON data
        .attr('data-fips', d => d.id) // Attach FIPS code as a data attribute
        .attr('data-education', d => educationMap.get(d.id)?.bachelorsOrHigher || 0) // Attach education data
        .attr('fill', d => {
            // Determine fill color based on education data, default to 0 if data is missing
            const education = educationMap.get(d.id)?.bachelorsOrHigher || 0;
            return colorScale(education); // Map education level to a color
        })
        .on('mouseover', (event, d) => {
            // Handle mouseover events to display tooltip
            const education = educationMap.get(d.id); // Get education data for the hovered county
            tooltip.style('display', 'block') // Make tooltip visible
                .style('left', event.pageX + 10 + 'px') // Position tooltip horizontally
                .style('top', event.pageY + 8 + 'px') // Position tooltip vertically
                .attr('data-education', education?.bachelorsOrHigher || 0) // Attach education data to tooltip
                .html(`${education?.area_name}, ${education?.state}: ${education?.bachelorsOrHigher || 0}%`); // Display county info
        })
        .on('mouseout', () => {
            // Hide the tooltip on mouseout
            tooltip.style('display', 'none');
        });

    // Add a legend
    const legendWidth = 200;
    const legendHeight = 10;

    const legend = svg.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${width - legendWidth - 150}, ${height - 570})`);

    // Create a gradient for the legend
    const legendScale = d3.scaleLinear()
        .domain([7, 63]) // Corresponding to the education percentage range
        .range([0, legendWidth]);

    // Add color rectangles for the legend
    legend.selectAll('rect')
        .data(d3.range(7, 64, 7)) // Create rectangles for each threshold
        .enter()
        .append('rect')
        .attr('x', d => legendScale(d)) // Position the rectangles based on the scale
        .attr('y', 0)
        .attr('width', legendWidth / 8)
        .attr('height', legendHeight)
        .attr('fill', d => colorScale(d)); // Use the color scale to fill the rectangles

    // Add ticks for the legend
    legend.selectAll('line')
        .data(d3.range(7, 64, 7))
        .enter()
        .append('line')
        .attr('x1', d => legendScale(d) + (legendWidth / 16)) // Start position for the tick
        .attr('x2', d => legendScale(d) + (legendWidth / 16)) // End position for the tick
        .attr('y1', legendHeight) // Position the tick at the bottom of the color rectangle
        .attr('y2', legendHeight + 5) // Extend the tick below the rectangle
        .attr('stroke', 'black') // Color of the tick
        .attr('stroke-width', '1px'); // Width of the tick

    // Add labels for the legend
    legend.selectAll('text')
        .data([7, 14, 21, 28, 35, 42, 49, 56, 63])
        .enter()
        .append('text')
        .attr('x', d => legendScale(d) + (legendWidth / 16)) // Position the text based on the scale
        .attr('y', legendHeight + 15)
        .text(d => `${d}%`)
        .style('text-anchor', 'middle')
        .attr('font-size', '0.7em');


});
