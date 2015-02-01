/**
 * FCViz 
 * Payload script for loan auction pages
 */
 
window.fcViz = function (e) {
  targetUrl = $(e.target).attr('href');
  switch(targetUrl) {
    case "#bids-summary":
      if ($("#bids_summary_chart").length == 0) {
        renderBidSummaryCharts();
      }
      break;
    default:
      break;
  }
} 

$('.tabs').tabs().bind('change', window.fcViz);

//Observe mutations made to #bids-summary, so that we can reapply window.fcViz
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if(mutation.addedNodes.length > 0 && mutation.addedNodes[0].id == "bids_summary") {
      renderBidSummaryCharts();
    }
  })
});

observer.observe(document, { childList: true, subtree: true });

var bidSummaryTab = $("#bids-summary")[0];

if (bidSummaryTab.attributes["class"].value.indexOf("active") != -1) {  
  renderBidSummaryCharts();
}

function renderBidSummaryCharts() {
  var tableOrig = $("#bids_summary").find("table");
    
  var rows = jQuery(tableOrig).find("tbody");

  //TODO: iterate through the bid-groups and note information about the user's bid.
  //Interpolate that on the chart.

  //Capture the rate and amount found in the first element 
  //(because FC may mangle the rate when including user bids)
  var rateRegexp = /\d+\.\d%/;
  var data = [];
  rows.children().filter(":not(.sub-accepted, .sub-group)").each(function(){
    data.push({ 
      name: +$(this).attr("data-annualised_rate"),
      value: +$(this).attr("data-amount")
    });
  });
  
  if (data.length > 1) {
    data[0].name = "Rej";
  }
  
  var rowCount = rows.children().size();
    
  var chartControlDiv = document.createElement("div");
  chartControlDiv.id = "bids_summary_chart_control";

  tableOrig.before(chartControlDiv);
    
  var margin = {top: 20, right: 30, bottom: 30, left: 30},
    width = $("#bids_summary").width() * 0.95 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(function(d){ return d3.formatPrefix(d, 3).scale(d); });

  var chart = d3.select("#bids_summary_chart_control").append("svg")
      .attr("id", "bids_summary_viz")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);
  
  chart.append("g")      
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  chart.append("g")
    .call(yAxis)
  .append("text")
    .attr("transform", "translate(10,-15)")
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("(£'000)");
  
  chart.selectAll("rect")
    .data(data)
  .enter().append("rect")
    .style("fill", "#772d72")
    .attr("x", function(d) { return x(d.name+""); })
    .attr("y", function(d) { return y(d.value); })
    .attr("height", function(d) { return height - y(d.value); })
    .attr("width", x.rangeBand());
  
  chart.selectAll("path")
    .attr("stroke-width", 1)
    .attr("width", 1)
    .attr("shape-rendering", crispEdges);
}
