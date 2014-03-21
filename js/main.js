
// Data
var GRAPH_DATA = "http://aggredash.herokuapp.com/api/mofo/2014";
var TOTALS_DATA = "http://aggredash.herokuapp.com/api/mofo/2014/latest";

// Graph settings
var Y_SCALE_MAX_DEFAULT = 12500;
var TARGET = 10000,
  TARGET_25_percent = Math.round(TARGET * 0.25),
  TARGET_50_percent = Math.round(TARGET * 0.5),
  TARGET_75_percent = Math.round(TARGET * 0.75);

var margin = {top: 20, right: 20, bottom: 45, left: 50};
  margin.vertical = margin.top + margin.bottom;
  margin.horizontal = margin.left + margin.right;

var width = 700 - margin.horizontal,
    height = 340 - margin.vertical;

var VIEWBOX = "0 0 " + (width + margin.horizontal) + " " + (height + margin.vertical);

var TICK_VALUES = [TARGET_25_percent, TARGET_50_percent, TARGET_75_percent, TARGET, Y_SCALE_MAX_DEFAULT]

// CONTAINER
d3.select("#chart")
  .attr("width", width + margin.horizontal)
  .attr("height", height + margin.vertical)
  .attr("viewBox", VIEWBOX) // this is used for SVG proportional resizing

// Build the graph
function draw(data) {
  var now = new Date();

  // SCALE
  var y_scale_max = Y_SCALE_MAX_DEFAULT;
  var contributor_extent = d3.extent(data, function (d) { return d.totalactive });
  if (contributor_extent[1] > y_scale_max) {
    y_scale_max = contributor_extent[1];
  }

  var y_scale = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_max]);

  var time_extent = d3.extent(data, function (d) { return new Date(d.wkcommencing) });
  var x_scale = d3.time.scale()
    .domain(time_extent)
    .range([margin.left, margin.left + width]);

  // REFERENCE LINES
  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_25_percent))
    .attr("y2", y_scale(TARGET_25_percent))
    .attr("class", "target milestone");

  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_50_percent))
    .attr("y2", y_scale(TARGET_50_percent))
    .attr("class", "target milestone");

  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_75_percent))
    .attr("y2", y_scale(TARGET_75_percent))
    .attr("class", "target milestone");

  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET))
    .attr("y2", y_scale(TARGET))
    .style("stroke-dasharray", ("3, 3"))
    .attr("class", "target goal");

  // NEW CONTRIBUTORS
  // Bars
  var barWidth = width / data.length;
  d3.select("#chart")
    .selectAll("g")
    .data(data.filter(function (d) { return (d.new > 0) }))
    .enter()
    .append("rect")
      .attr("class", "new-contributors")
      .attr("x", margin.left)
      .attr("y",          function (d) { return y_scale(d.new); })
      .attr("height",     function (d) { return height+margin.top - y_scale(d.new); })
      .attr("width", barWidth - 1)
      .attr("transform",  function(d, i) { return "translate(" + i * barWidth + ",0)"; });

  // ACTIVE CONTRIBUTORS
  // Line
  var line = d3.svg.line()
    .x(function (d) { return x_scale(new Date(d.wkcommencing)) })
    .y(function (d) { return y_scale(d.totalactive) });

  d3.select("#chart")
    .append("path")
    .datum(data.filter(function (d) {
        return (d.totalactive > 0) && (new Date(d.wkcommencing) < now);
      })
    )
    .attr("class", "line active-contributors")
    .attr("d", line);

  // Points
  d3.select("#chart")
    .selectAll("points")
    .data(data.filter(function (d) { return (d.totalactive > 0) }))
    .enter()
    .append("circle")
    .attr("class", function (d) {
      if (new Date(d.wkcommencing) > now) {
        return "active-contributors future-date";
      } else {
        return "active-contributors";
      }
    });

  d3.select("#chart").selectAll(".active-contributors")
    .attr("cx", function (d) { return x_scale(new Date(d.wkcommencing)) })
    .attr("cy", function (d) { return y_scale(d.totalactive) })
    .attr("r", function (d) {
      if (new Date(d.wkcommencing) > now) {
        return 1.0;
      } else {
        return 2.0;
      }
    });


  // AXIS
  var x_axis  = d3.svg.axis()
                .scale(x_scale)
                .ticks(d3.time.months, 1)
                .tickFormat(function (d) {
                  var format_month = d3.time.format('%b'); // short name month e.g. Feb
                  var format_year = d3.time.format('%Y');
                  var label = format_month(d);//.toUpperCase();
                  if (label === "Jan") {
                    label = format_year(d);
                  }
                  return label;
                });
  d3.select("#chart")
  .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height + margin.top) + ")")
    .call(x_axis)
  .selectAll("text") // rotate text
    .attr("y", 0)
    .attr("x", 0)
    .attr("dy", ".35em")
    .attr("transform", "rotate(270) translate(-35,0)")
    .style("text-anchor", "start");

  var y_axis = d3.svg.axis()
                .scale(y_scale)
                .orient("left")
                .tickValues(TICK_VALUES);
  d3.select("#chart")
  .append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ", 0 )")
  .call(y_axis);

}

// Draw the D3 chart
//d3.json("dummy.json", draw);
d3.json(GRAPH_DATA, draw);

// Make the chart responsive
var chart = $("#chart"),
    aspect = chart.width() / chart.height(),
    container = chart.parent();

function resize_chart () {
  var targetWidth = container.width();
  chart.attr("width", targetWidth);
  chart.attr("height", Math.round(targetWidth / aspect));
}

$(window).on("resize", function() {
    resize_chart();
}).trigger("resize");


// Latest counts (seperate from the weekly data in the graph)
function display_latest (data) {

  // Get the total
  d3.select("#active-total")
    .data([data])
    .text(function (d) {
      //return d;
      return d.total.total_active;
    });

  // Get the buckets
  d3.select("#buckets").selectAll("h4")
    .each(function (d, i) {
      var bucket = d3.select(this);
      var id = bucket.attr("id");
      var bucketLabel = id.replace("bucket-","");
      var bucketCount = 0;
      data.buckets.forEach(function (element, index, array) {
        if (element.bucket && (element.bucket === bucketLabel)) {
          if (element.total_active) {
            bucketCount = element.total_active;
          }
        }
      })
      bucket.text(bucketCount);
    });
}

d3.json(TOTALS_DATA, display_latest);
