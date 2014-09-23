(function() {
  var crimes = {
    "assault": "estimated-aggravated-assault-rate",
    "burglary": "estimated-burglary-rate",
    "rape": "estimated-forcible-rape-rate",
    "larceny": "estimated-larceny-theft-rate",
    "vehicle-theft": "estimated-motor-vehicle-theft-rate",
    "murder": "estimated-murder-rate",
    "property-crime": "estimated-property-crime-rate",
    "robbery": "estimated-robbery-rate",
    "violent-crime": "estimated-violent-crime-rate"
  };
  var list = [];
  for ( c in crimes ) {
    list.push(c);
  }
  var selected = window.location.hash.replace("#", "") || "burglary";

  // Add a drop-down to select other crime types.
  var select = d3.select("#crime-type")
      .append("select").selectAll("option")
      .data(list)
    .enter().append("option")
      .attr("value", function(d) { return d; })
      .text(function(d) { return toTitleCase(d); });
  d3.select("option[value=" + selected + "]")
    .attr("selected", true);
  d3.select("select").on("change", function() {
    update(this.value);
    window.location.hash = "#" + this.value;
  });
  
  var rates, states, legend, classes = 7;
  var width = 960,
      height = 640;
  var quantize; 
  var tip = d3.select("#tip");

  var projection = d3.geo.albersUsa()
      .scale(1250)
      .translate([width / 2, (height-70) / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height);

  var defs = svg.append("defs");

  // Original source:  http://bl.ocks.org/mbostock/4136647
  defs.append("filter")
      .attr("id", "blur")
    .append("feGaussianBlur")
      .attr("stdDeviation", 3);

  queue()
    .defer(d3.json, "usa/us-states.json")
    .defer(d3.csv, "data/" + crimes[selected] + ".csv")
    .await(show);

  function show(error, us, data) {
    var features = topojson.feature(us, us.objects.states).features;
    rates = data;

    // Calculate the domain of the data.
    var flat = flatten(data);
    var extent = d3.extent(flat);
    // console.log("extent", extent);
    var range = d3.range(classes);
    // Scale to map values to classes.
    quantize = d3.scale.quantize()
      .domain(extent)
      .range(range.map(function(i) { return "q" + i + "-" + classes; }));

    svg.append("use")
        .attr("class", "land-glow")
        .attr("xlink:href", "#land");

    svg.append("use")
        .attr("class", "land-fill")
        .attr("xlink:href", "#land");

    // State shapes. Start on data[0], which is 1960.
    states = svg.selectAll("path")
        .data(features)
      .enter().append("path")
        .attr("class", function(d) { return quantize(data[0][d.properties.name]); })
        .attr("data-stat", function(d) { return data[0][d.properties.name]; })
        .attr("d", path);
    // Show info on mouse over.
    states.on("mouseenter", function(e) {
      // Firefox doesn't implement dataset on svg elements:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=921834
      var stat = this.getAttribute("data-stat");
      var info = e.properties.name + ": " + stat;
      var rect = this.getBoundingClientRect();
      var style = { 
        "display": "block", 
        "left": rect.left + "px",
        "top": (rect.top - 30) + document.body.scrollTop + "px"
      };
      tip.style(style)
        .text(e.properties.name + ": " + d3.round(stat) + " per 100k people.")
    });
    // Hide info on mouse out.
    states.on("mouseleave", function(e) {
      // console.log(e.properties.name + " out.");
      tip.style({ "display": "none" });
    });

    // State boundaries, gray.
    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) {
          return a !== b; 
        }))
        .attr("class", "state-boundary")
        .attr("d", path);

    // US borders
    defs.append("path")
        .datum(topojson.feature(us, us.objects.nation))
        .attr("id", "land")
        .attr("d", path);

    // Add the legend
    draw();
  }

  // Set up slider
  d3.select("#weee").on("input", function(e) {
    var index = parseInt(this.value);
    d3.select("#year").text(index + 1960);
    change(index);
  });

  function update(next) {
    d3.csv("data/" + crimes[next] + ".csv", draw);
  }

  function draw(error, data) {
    if ( data ) {
      rates = data;

      // Calculate the domain of the data.
      var flat = flatten(rates);
      var extent = d3.extent(flat);
      // console.log("extent", extent);
      var range = d3.range(classes);
      // Scale to map values to classes.
      quantize = d3.scale.quantize()
        .domain(extent)
        .range(range.map(function(i) { return "q" + i + "-" + classes; }));

      var index = parseInt(d3.select("#year").text()) - 1960;
      states.attr("class", function(d) { return quantize(rates[index][d.properties.name]); })
        .attr("data-stat", function(d) { return rates[index][d.properties.name]; });
    }

    // Create or update the legend
    if ( legend ) {
      legend.remove();
    }
    var swatches = ["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#99000d"];
    var breaks = d3.range(classes).map(function(i) {
      return quantize.invertExtent("q" + i + "-" + classes);
    });
    var factor = (breaks[breaks.length - 1][1] < 100 ) ? 0 : -1
    var labels = [d3.round(breaks[0][0], factor)];
    breaks.forEach(function(b) {
      labels.push(d3.round(b[1], factor));
    });
    // console.log("labels", labels);
    var xScale = d3.scale.ordinal()
        .domain(labels)
        .range([0, 100, 200, 300, 400, 500, 600, 700]);
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("top")
        .ticks(8);
    var h = 20;
    var w = 100;
    legend = svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(130, 610)")
        .call(xAxis);
    d3.range(classes).forEach(function(d) {
      legend.append("rect")
        .attr({ 
          "x": d * 100, 
          "y": 0, 
          "width": w, 
          "height": h,
          "fill": swatches[d]
        });
    });
  }

  function flatten(data) {
    var flat = [];
    for ( var i = 0, il = data.length; i < il; i++ ) {
      for ( prop in data[i] ) {
        // Skip "Year" properties.
        if ( prop === "Year" ) {
          continue;
        }
        flat.push(parseFloat(data[i][prop]));
      }
    }
    return flat;
  }

  function change(index) {
    d3.select("#year").text(rates[index].Year);
    states.attr("class", function(d) { return quantize(rates[index][d.properties.name]); })
      .attr("data-stat", function(d) { return rates[index][d.properties.name]; });
  }

  // Modified version of http://stackoverflow.com/a/196991/1934
  function toTitleCase(str) {
    return str.replace("-", " ").replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
})();