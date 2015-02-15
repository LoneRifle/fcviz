/**
 * FCViz 
 * Payload script for loan auction pages
 */

window.renderBidSummaryCharts = function (targetUrl, id) {  
  var table = $(targetUrl).find("table");
  placeChartDivBefore(table, id);
  var data = makeSummaryDataFrom(table);
  var cumData = makeSummaryCumulative(data);
  var bidGroups = findBidGroups(table);
    
  makeBidSummaryChart(id, data, cumData, bidGroups);
}

window.renderAllBidCharts = function (targetUrl, id) {
  if (window.renderBusy) {
    return;
  }
  window.renderBusy = true;
  var paginatorTop = $(targetUrl).find("#paginator_top");
  placeChartDivBefore(paginatorTop, id);
  
  var progress = document.createElement("div");
  progress.id = id+"_progress";
  $("#"+id).append(progress);
  
  var page = 1;
  var pageData = [];
  var href = $("li.last").first().find("a").attr("href");
  var last = +href.substring(href.indexOf("=")+1);
  var live = $("#bid_form").length > 0;
  var urlPrefix = live? "auction/" : "";
  $(progress).html("Retrieving and parsing page "+page+"/"+last);
  $.get( urlPrefix + "bids?page=" + page, window.getAllBidPage.bind(window, pageData, id, page, live, last)).fail(function(jqXHR, textStatus, errorThrown) {
    $(progress).html("Failed to retrieve page "+page+", chart render aborted: "+textStatus);
  });
}

window.getAllBidPage = function(pageData, id, page, live, last, d) {  
  
  var data = d;
  if (live) {
    data = $(document.createElement("table")).html(d).find("tr.live");
  }
  pageData = jQuery.merge(pageData, data);
  if (page === last) {
    window.completeAllBidRender(pageData, live, id);
    return;
  }
  var nextPage = page + 1;
  var urlPrefix = live? "auction/" : "";
  $("#"+id+"_progress").html("Retrieving and parsing page "+nextPage+"/"+last);
  $.get( urlPrefix + "bids?page=" + nextPage, window.getAllBidPage.bind(window, pageData, id, nextPage, live, last)).fail(function(jqXHR, textStatus, errorThrown) {
    $("#"+id+"_progress").html("Failed to retrieve page "+nextPage+", chart render aborted: "+textStatus);
  });
}

window.completeAllBidRender = function(pageData, live, id) {
  var table = $("#"+id).parent().find("table");
  var data = makeAllDataFrom(pageData, live);
  $("#"+id+"_progress").html("Place pointer over each point for more details. Click to keep details on screen");
  makeAllBidsChart(id, data);
  window.renderBusy = false;
}

window.fcViz = function (e) {
  var targetUrl = $(e.target).attr('href');
  var id = null;
  var renderer = null;
  switch(targetUrl) {
    case "#bids-summary":
      id = "bids_summary_chart_control";
      renderer = renderBidSummaryCharts;
      break;
    case "#bids-all":
      id = "bids_all_chart_control";
      renderer = renderAllBidCharts;
      break;
    default:
      break;
  }
  if (id != null && renderer != null) {
    render(targetUrl, id, renderer);
  }
} 

$('.tabs').tabs().bind('change', function (e) {  
  var targetUrl = $(e.target).attr('href');
  if (targetUrl !== "#bids-all") {
    window.fcViz(e);
  }
});
window.summaryVizWidth = $("div.active").filter(".tab-pane").width();

//Observe mutations made to #bids-summary, so that we can reapply window.fcViz
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if(mutation.addedNodes.length > 0) {
      var el = jQuery(document.createElement("a"));
      switch(mutation.addedNodes[0].id) {
        case "bids_summary":
          window.fcViz({ target: el.attr("href", "#bids-summary") });
          break;
        case "loan_offers":
          window.fcViz({ target: el.attr("href", "#bids-all") });
          break;
        default:
          break;
      }
    }
  })
});

observer.observe(document, { childList: true, subtree: true });

var activeId = $("div.active").filter("div.tab-pane").attr("id");
var el = jQuery(document.createElement("a")).attr("href", "#"+activeId);
if (activeId !== "bids-all") {
  window.fcViz({target: el});
}

function render(targetUrl, id, renderer) {
  if ($("#"+id).length == 0) {
    renderer(targetUrl, id);
  }
}

function placeChartDivBefore(el, chart) {
  var chartControlDiv = document.createElement("div");
  chartControlDiv.id = chart;
  el.before(chartControlDiv);
}

function findBidGroups(table) {
  var bidGroups = {};
  
  table.find("tr.accepted[data-my-bids=1]").each(function(){
    var key = $(this).attr("data-annualised_rate");
    var bidGroup = $(this).nextUntil(":not(.sub-accepted, .sub-group)").clone();
    bidGroup.each(function(){ 
      $(this).children().last().detach();
      $(this).children().attr("class","tooltip").first().attr("style", null);
    });
    bidGroups[key] = bidGroup;
  });
  return bidGroups;
}

function makeSummaryCumulative(data) {
  var cumData = [];
  cumData.push({ name: data[0].name, value: data[0].name === "Rej"? 0 : data[0].value});
  for (i=1;i<data.length;++i) {
    cumData.push({ name: data[i].name, value: data[i].value + cumData[i-1].value});
  }
  
  var total = +document.getElementById("amount").innerHTML.replace("£","").replace(",","");
  cumData.forEach(function(d){ d.value = d.value/total * 100; });
  return cumData;  
}

function makeSummaryDataFrom(table) {
  var rows = table.find("tbody");
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

function makeBidSummaryChart(id, data, cumData, bidGroups) {
  var margin = {top: 20, right: 30, bottom: 30, left: 30},
  width = window.summaryVizWidth * 0.95 - margin.left - margin.right,
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
    var labelInterval = $("#bid_form").length > 0? 4 : 2;
    var labels = [];
    data.forEach(function(d){ labels.push(d.name)});
    xAxis.tickFormat(function(d){ return labels.indexOf(d) % labelInterval? "" : d; });
  }
      
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(function(d){ return d3.formatPrefix(d, 3).scale(d); });

  var cumYAxis = d3.svg.axis()
      .scale(cumY)
      .orient("right");
      
  var chart = d3.select("#"+id).append("svg")
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
  
  var commaSeparator = d3.format(",d");
  
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
      var bidGroupSuffix = "";
      if (bidGroups[d.name]) {
        bidGroupSuffix += "<table class=tooltip>";
        bidGroups[d.name].each(function(){ bidGroupSuffix += "<tr class=sub-group>"+$(this).html()+"</tr>"; });
        bidGroupSuffix += "</table>";
      }
      div.html("£"+commaSeparator(d.value)+" @ "+d.name+"%"+bidGroupSuffix)  
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
    .on("mouseover", function(d){ $(this).attr("opacity", 1.0); })
    .on("mouseout", function(d){ $(this).attr("opacity", 0.5); });
      
  //Render the first bar in the chart semi-transparent if the rate is rejected
  if (data[0].name === "Rej") {
    chart.select("rect").style("opacity", 0.5);
  }
}

function makeAllDataFrom(pageData, live) {
  var data = { keys:[] };
  
  var parseHTML = function (i,d) {
    var bid = {
      bid_time: +$(this).attr("data-created_at"),
      annualised_rate: +$(this).attr("data-annualised_rate"),
      lender_display_name: $(this).children().filter(".text").last().html().trim(),
      bid_amount: +$(this).attr("data-amount"),
      rank: +$(this).children().filter(".text").first().html()
    }
    pushBidTo(data, bid);
  }
  
  var parseJSON = function(i,d) {
    var status = d.status;
    if (status !== "rejected") {
      d.rank = i+1;
      d.bid_time = Date.parse(d.bid_time);
      pushBidTo(data, d);
    }
  }
  jQuery(pageData).each(live? parseHTML : parseJSON);
  return data;
}

window.largeInvestors = ["British Business Bank", "Business Finance Partnership"];

function pushBidTo(data, d) {  
  if (window.largeInvestors.indexOf(d.lender_display_name) !== -1) {
    return;
  }
  var roughTime = new Date(d.bid_time);
  roughTime.setMilliseconds(0);
  roughTime.setSeconds(0);
  roughTime.setMinutes(roughTime.getMinutes() < 30?  0 : 30);
  
  roughTime = roughTime.getTime();
  var key = [roughTime,d.annualised_rate];  
  if (!data[key]) {
    data.keys.push(key);
    data[key] = {
      total: 0,
      keys:[]
    };
  }  
  var rateAtTime = data[key];
  rateAtTime.total += d.bid_amount;
  if (!rateAtTime[d.lender_display_name]) {
    rateAtTime.keys.push(d.lender_display_name);
    rateAtTime[d.lender_display_name] = {
      total: 0,
      bids:[]
    }
  }
  rateAtTime[d.lender_display_name].total += d.bid_amount;
  rateAtTime[d.lender_display_name].bids.push(d);
}

function makeAllBidsChart(id, dataBlob) {
  var margin = {top: 20, right: 30, bottom: 30, left: 35},
    width = window.summaryVizWidth * 0.95 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;
  
  var data = dataBlob.keys;
  data.sort(function(a,b){ return dataBlob[b].total - dataBlob[a].total; })
  var total = +document.getElementById("amount").innerHTML.replace("£","").replace(",","");
  
  //Take x-domain (bid time) to be 6 hours either side of the real domain.
  var x = d3.scale.linear()
    .domain([
      d3.min(data, function(d) { return d[0]; }) - 6 * 60 * 60 * 1000, 
      d3.max(data, function(d) { return d[0]; }) + 6 * 60 * 60 * 1000
    ]).range([ 0, width ]);
  
  //Take y-domain (rate) to be 0.1 either side of the real domain.
  var y = d3.scale.linear()
    .domain([d3.min(data, function(d) { return d[1]; }) - 0.5, d3.max(data, function(d) { return d[1]; }) + 0.1])
    .range([ height, 0 ]);
    
  var chart = d3.select("#"+id)
    .append('svg')
    .attr("id", "bids_all_viz")
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom);

  var main = chart.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', width)
    .attr('height', height);
        
    // draw the x axis
  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .tickFormat(function(d){ 
      var date = new Date(d);
      return d3.time.format("%d/%m %H:%M")(date); 
    });

  main.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .attr('class', 'x axis date')
    .call(xAxis);

    // draw the y axis
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

  main.append('g')
    .attr('transform', 'translate(0,0)')
    .attr("class", "y axis")
    .call(yAxis);

  var g = main.append("g"); 
  
  g.selectAll("scatter-dots")
    .data(data)
    .enter().append("circle")
      .attr("cx", function (d,i) { return x(d[0]); } )
      .attr("cy", function (d) { return y(d[1]); } )
      .attr("r", function(d){ return Math.log(1 + dataBlob[d].total/total) * 1000; })
      .attr("style", function(d,i){ return "z-index: "+i; })
      .attr("class", "inactive")
      .on("mouseover", function(d){ 
        if ($(this).attr("class") !== "clicked"){ 
          $(this).attr("class", "active"); 
        }
      })
      .on("click", function(d){ 
        $("circle.clicked").attr("class", "inactive");
        $(this).attr("class", "clicked"); 
      })
      .on("mouseout", function(d){ 
        if ($(this).attr("class") !== "clicked"){ 
          $(this).attr("class", "inactive"); 
        } 
      });
}