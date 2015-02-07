/**
 * FCViz 
 * Payload script for loan auction pages
 */
 
window.fcViz = function (e) {
  targetUrl = $(e.target).attr('href');
  switch(targetUrl) {
    case "#bids-summary":
      if ($("#bids_summary_chart_control").length == 0) {
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
    if(mutation.addedNodes.length > 0 && mutation.addedNodes[0].id == "bids_summary" && $("#bids_summary_chart_control").length == 0) {
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
  var table = $("#bids_summary").find("table");
  var chartControlDiv = document.createElement("div");
  chartControlDiv.id = "bids_summary_chart_control";
  table.before(chartControlDiv);
    
  var data = makeDataFrom(table);
  var cumData = makeCumulative(data);
    
  makeBidSummaryChart(data, cumData);
}

function makeCumulative(data) {
  var cumData = [];
  cumData.push({ name: data[0].name, value: data[0].name === "Rej"? 0 : data[0].value});
  for (i=1;i<data.length;++i) {
    cumData.push({ name: data[i].name, value: data[i].value + cumData[i-1].value});
  }
  
  var total = +document.getElementById("amount").innerHTML.replace("£","").replace(",","");
  cumData.forEach(function(d){ d.value = d.value/total * 100; });
  return cumData;  
}

function makeDataFrom(table) {
  var rows = table.find("tbody");

  //TODO: iterate through the bid-groups and note information about the user's bid.
  //Interpolate that on the chart.

  var data = [];
  
  rows.children().filter(":not(.sub-accepted, .sub-group)").each(function(){
    data.push({ 
      name: +$(this).attr("data-annualised_rate"),
      value: +$(this).attr("data-amount")
    });
  });
  
  if (data.length > 1 && data[0].name === data[1].name) {
    data[0].name = "Rej";
  }
  return data;
}

function makeBidSummaryChart(data, cumData) {
  var margin = {top: 20, right: 30, bottom: 30, left: 30},
  width = $("#bids_summary").width() * 0.95 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);
      
  var cumY = d3.scale.linear()
      .range([height, 0]);
      
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  if (data.length > 30) {
    //Hide every other tick on the x-axis.
    //Do this by inspecting the 3rd element,
    //inferring if it is even or odd, and 
    //hiding the tick if it is the other.
    var labels = [];
    data.forEach(function(d){ labels.push(d.name)});
    xAxis.tickFormat(function(d){ return labels.indexOf(d) % 2? "" : d; });
  }
      
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(function(d){ return d3.formatPrefix(d, 3).scale(d); });

  var cumYAxis = d3.svg.axis()
      .scale(cumY)
      .orient("right");
      
  var chart = d3.select("#bids_summary_chart_control").append("svg")
      .attr("id", "bids_summary_viz")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);
  cumY.domain([0, 100]);
  
  chart.append("g")      
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  chart.append("g")
    .attr("class", "y axis")
    .call(yAxis)    
  .append("text")
    .attr("transform", "translate(10,-20)")
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("(£'000)");
  
  chart.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(cumYAxis)
  .append("text")
    .attr("transform", "translate(15,-20)")
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("%");
  
  var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);
  
  chart.selectAll("rect")
    .data(data)
  .enter().append("rect")
    .attr("class", "fcviz")
    .attr("x", function(d) { return x(d.name+""); })
    .attr("y", function(d) { return y(d.value); })
    .attr("height", function(d) { return height - y(d.value); })
    .attr("width", x.rangeBand())
    .on("mouseover", function(d){ 
      div.transition()        
        .duration(200)      
        .style("opacity", .9);      
      div.html("£"+d.value+" @ "+d.name+"%")  
        .style("left", (d3.event.pageX) + "px")     
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function(d){ 
      div.transition()        
        .duration(500)      
        .style("opacity", 0);    
    });
  
  var line = d3.svg.line()
    .x(function(d) { return x(d.name); })
    .y(function(d) { return cumY(d.value); });
  
  chart.append("path")
    .datum(cumData)
    .attr("class", "cum")
    .attr("transform", "translate(" + x.rangeBand()/2 + ",0)")
    .attr("d", line)
    .attr("opacity", 0.5)
    .on("mouseover", function(d){ this.setAttribute("opacity", 1.0); })
    .on("mouseout", function(d){ this.setAttribute("opacity", 0.5); });
      
  //Render the first bar in the chart semi-transparent if the rate is rejected
  if (data[0].name === "Rej") {
    chart.select("rect").style("opacity", 0.5);
  }
}