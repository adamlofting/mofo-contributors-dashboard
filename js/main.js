
// check parameters to customise this by team:
var team = $.url().param("team");
var validTeams = ['webmaker', 'openbadges', 'sciencelab', 'opennews', 'appmaker', 'hive'];

if (team && ($.inArray(team, validTeams) > -1)) {
  var GRAPH_DATA = "http://aggredash.herokuapp.com/api/" + team + "/2014";
  var TOTALS_DATA = "http://aggredash.herokuapp.com/api/" + team + "/2014/latest";
  var TARGET;
  var TITLE;
  if (team === 'webmaker') {
    TARGET = 10000;
    TITLE = 'Webmaker';
  } else if (team === 'openbadges') {
    TARGET = 3000;
    TITLE = 'Open Badges';
  } else if (team === 'sciencelab') {
    TARGET = 750;
    TITLE = 'Science Lab';
  } else if (team === 'appmaker') {
    TARGET = 500;
    TITLE = 'Appmaker';
  } else if (team === 'opennews') {
    TARGET = 500;
    TITLE = 'OpenNews';
  } else if (team === 'hive') {
    TARGET = 750;
    TITLE = 'Hive';
  }
} else {
  // default Mofo view
  var GRAPH_DATA = "http://aggredash.herokuapp.com/api/mofo/2014";
  var TOTALS_DATA = "http://aggredash.herokuapp.com/api/mofo/2014/latest";
  var TARGET = 10000;
  var TITLE = 'All Mozilla Foundation';
}

$('#teamName').text(TITLE);

// Graph settings
var Y_SCALE_MAX_DEFAULT = TARGET * 1.25;
var TARGET_25_percent = Math.round(TARGET * 0.25),
    TARGET_50_percent = Math.round(TARGET * 0.5),
    TARGET_75_percent = Math.round(TARGET * 0.75);

var margin = {top: 20, right: 20, bottom: 45, left: 50};
  margin.vertical = margin.top + margin.bottom;
  margin.horizontal = margin.left + margin.right;

var width = 900 - margin.horizontal,
    height = 450 - margin.vertical;

var VIEWBOX = "0 0 " + (width + margin.horizontal) + " " + (height + margin.vertical);

var TICK_VALUES = [TARGET_25_percent, TARGET_50_percent, TARGET_75_percent, TARGET, Y_SCALE_MAX_DEFAULT];

var SHOW_FUTURE_LAG = false;

// CONTAINER
d3.select("#chart")
  .attr("width", width + margin.horizontal)
  .attr("height", height + margin.vertical)
  .attr("viewBox", VIEWBOX); // this is used for SVG proportional resizing

// Build the graph
function draw(data) {
  var now = new Date();

  // SCALE
  var y_scale_max = Y_SCALE_MAX_DEFAULT;
  var contributor_extent = d3.extent(data, function (d) { return d.totalactive; });
  if (contributor_extent[1] > y_scale_max) {
    y_scale_max = contributor_extent[1];
  }

  var y_scale = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_max]);

  var time_extent = d3.extent(data, function (d) { return new Date(d.wkcommencing); });
  var x_scale = d3.time.scale()
    .domain(time_extent)
    .range([margin.left, margin.left + width]);

  // TOOL TIP
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([35, 0])
  .html(function(d) {
    return "<span style='color:#FFF;'>" + $.number(d.totalactive) + "</span> Active<br /><span style='color:#FFCD36;'>" + $.number(d.new) + "</span> New";
  });

  d3.select("#chart").call(tip);

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

  // Bars
  var barWidth = width / data.length;
  var halfBar = (barWidth / 2) - 1;

  // HOVER BARS
  d3.select("#chart")
    .selectAll("g")
    .data(data)
    .enter()
    .append("rect")
      .attr("class", function (d) {
        if (new Date(d.wkcommencing) > now) {
          if (SHOW_FUTURE_LAG) {
            return "info-area future-date";
          } else {
            return "hide";
          }
        } else {
          return "info-area";
        }
      })
      .attr("y",          function (d) { return margin.top; })
      .attr("height",     function (d) { return height; })
      .attr("width", barWidth - 1)
      .on("mouseover", function(d, i) {
        d3.select(this).style("opacity", 0.1);
        tip.show(d);
        })
      .on("mouseout", function(d, i) {
        d3.select(this).style("opacity", 0);
        tip.hide(d);
      });

  // Position these elements on the X axis using their date value
  d3.select("#chart").selectAll(".info-area")
    .attr("x", function (d) { return x_scale(new Date(d.wkcommencing)); });

  // NEW CONTRIBUTORS
  d3.select("#chart")
    .selectAll("g")
    .data(data.filter(function (d) { return (d.new > 0); }))
    .enter()
    .append("rect")
      .attr("class", function (d) {
        if (new Date(d.wkcommencing) > now) {
          if (SHOW_FUTURE_LAG) {
            return "new-contributors future-date";
          } else {
            return "hide";
          }
        } else {
          return "new-contributors";
        }
      })
      .attr("y",          function (d) { return y_scale(d.new); })
      .attr("height",     function (d) { return height+margin.top - y_scale(d.new); })
      .attr("width", barWidth - 1);

  // Position these elements on the X axis using their date value
  d3.select("#chart").selectAll(".new-contributors")
    .attr("x", function (d) { return x_scale(new Date(d.wkcommencing)); });

  // ACTIVE CONTRIBUTORS
  // Line
  var line = d3.svg.line()
    .x(function (d) { return x_scale(new Date(d.wkcommencing)) + halfBar; })
    .y(function (d) { return y_scale(d.totalactive); });

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
    .data(data.filter(function (d) { return (d.totalactive > 0); }))
    .enter()
    .append("circle")
    .attr("class", function (d) {
      if (new Date(d.wkcommencing) > now) {
        if (SHOW_FUTURE_LAG) {
          return "active-contributors future-date";
        }
      } else {
        return "active-contributors";
      }
    });

  d3.select("#chart").selectAll(".active-contributors")
    .attr("cx", function (d) { return x_scale(new Date(d.wkcommencing)) + halfBar; })
    .attr("cy", function (d) { return y_scale(d.totalactive); })
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
      return $.number(d.total.total_active);
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
      });
      bucket.text($.number(bucketCount));
    });
}

d3.json(TOTALS_DATA, display_latest);
