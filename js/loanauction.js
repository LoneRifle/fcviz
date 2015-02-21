/**
 * FCViz 
 * Payload script for loan auction pages
 */

window.formatTimestamp = d3.time.format("%d/%m %H:%M");
window.commaSeparator = d3.format(",d");

window.renderBidSummaryCharts = function (total, targetUrl, id) {  
  var table = $(targetUrl).find("table");
  placeChartDivBefore(table, id);
  var data = makeSummaryDataFrom(table);
  var cumData = makeSummaryCumulative(data, total);
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
  $("#"+id).attr("style", "position: relative");
  
  var progress = document.createElement("div");
  progress.id = id+"_progress";
  $("#"+id).append(progress);
  
  var live = $("#bid_form").length > 0;
  
  var details = document.createElement("div");
  details.id = "bid_block_infobox";
  $(details).attr("class", live? "bid_block_details_live" : "bid_block_details");
  $(".bids").parent().attr("style", "position: relative");
  $(".bids").after(details);
  
  var page = 1;
  var pageData = [];
  var href = $("li.last").first().find("a").attr("href");
  var last = href? +href.substring(href.indexOf("=")+1) : 1;
  var urlPrefix = live? "auction/" : "";
  $(progress).html("Retrieving and parsing page "+page+"/"+last);
  $.get( urlPrefix + "bids?page=" + page, window.getAllBidPage.bind(window, pageData, id, page, live, last)).fail(function(jqXHR, textStatus, errorThrown) {
    $(progress).html("Failed to retrieve page "+page+", chart render aborted: "+errorThrown);
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
    $("#"+id+"_progress").html("Failed to retrieve page "+nextPage+", chart render aborted: "+errorThrown);
  });
}

window.completeAllBidRender = function(pageData, live, id) {
  var table = $("#"+id).parent().find("table");
  var data = makeAllDataFrom(pageData, live);
  $("#"+id+"_progress").html("Place pointer over each point for more details. Click to keep on screen");
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
      var total = +document.getElementById("amount").innerHTML.replace("£","").replace(",","");
      renderer = window.renderBidSummaryCharts.bind(window,total);
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
window.fcVizObserver = new MutationObserver(function(mutations) {
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

window.fcVizObserver.observe(document, { childList: true, subtree: true });

var activeId = $("div.active").filter("div.tab-pane").attr("id");
var el = jQuery(document.createElement("a")).attr("href", "#"+activeId);
if (activeId !== "bids-all" && activeId != undefined) {
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

function makeSummaryCumulative(data, total) {
  var cumData = [];
  cumData.push({ name: data[0].name, value: data[0].name === "Rej"? 0 : data[0].value});
  for (i=1;i<data.length;++i) {
    cumData.push({ name: data[i].name, value: data[i].value + cumData[i-1].value});
  }
  
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
  
  var gmtOffset = 0;  
  var parseHTML = function (i,d) {
    if (gmtOffset == 0) {
      var roughTime = new Date(+$(this).attr("data-created_at"));
      roughTime.setMilliseconds(0);
      roughTime.setSeconds(0);
      var displayTime = new Date($(this).find(".date").html());
      gmtOffset = roughTime.getTime() - displayTime.getTime();
    }
    var bid = {
      bid_time: +$(this).attr("data-created_at") - gmtOffset,
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
    width = window.summaryVizWidth - margin.left - margin.right,
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
      return window.formatTimestamp(date); 
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
          window.clickedKeyInfoBox = $("#bid_block_infobox").children();
          populateBidBox(d, dataBlob, 0.8);
        }
      })
      .on("click", function(d){ 
        $("circle.clicked").attr("class", "inactive");
        $(this).attr("class", "clicked"); 
        window.clickedKey = d;      
        window.infoBoxActiveSlice = null;
        window.infoBoxActiveData = null;
        populateBidBox(d, dataBlob, 1.0);
      })
      .on("mouseout", function(d){ 
        if ($(this).attr("class") !== "clicked"){ 
          $(this).attr("class", "inactive"); 
          if (window.clickedKey) {
            $("#bid_block_infobox").children().detach();
            $("#bid_block_infobox").append(clickedKeyInfoBox);
          } else {
            $("#bid_block_infobox").html("");
          }
        } 
      });
}

function populateBidBox(key, dataBlob, opacity) {
  var data = dataBlob[key];
  var time = [key[0], key[0] + 29 * 60000];
  var h5 = $(document.createElement("h5")).attr("style", "line-height: 20px").html(
    window.formatTimestamp(new Date(time[0])) + " - " +
    d3.time.format("%H:%M")(new Date(time[1])) + 
    ": £" + commaSeparator(data.total) + "@" + key[1] + "%, " + data.keys.length + " users"
  );
  
  var headers = ["#", "Lender", "Amount", "Time"];
  var thead = $(document.createElement("thead"));
  $(headers).each(function(i,d){
    thead.append($(document.createElement("th")).html(d));
  });
  
  var tbody = $(document.createElement("tbody"));
  var userAmounts = [];
  var bids = [];  
  $(data.keys).each(function(i,key){
    var userBids = data[key];
    userAmounts.push([key, userBids.total]);
    $(userBids.bids).each(function (i,bid){
      bids.push([bid.rank, bid.lender_display_name, bid.bid_amount, bid.bid_time]);
    });
  });
    
  bids.sort(function(a,b){
    return a[3] - b[3];
  });
  
  $(bids).each(function(i,bid){
    var tr = $(document.createElement("tr"));
    bid[3] = d3.time.format("%X.%L")(new Date(bid[3]));
    $(bid).each(function(i,d){ tr.append($(document.createElement("td")).html(d)); })
    tbody.append(tr);
  });
  
  var table = $(document.createElement("table")).attr("class", "brand").attr("id", "bid_box_table");  
  table.append(thead).append(tbody);
  
  var tableHeight = $("#bid_block_infobox").height() - 20;
  var pieDimension = tableHeight;
  var tableWidth = $("#bid_block_infobox").width() - pieDimension;
  var tableBox = $(document.createElement("div")).attr("class", "scroll-box")
    .attr("style","position: absolute; top: 20px; left: "+tableHeight+"px; height: "+tableHeight+"px; width: "+tableWidth+"px;").append(table);
  
  var close = document.createElement("span");
  $(close).html("<a>X</a>")
    .attr("style", "cursor: pointer; text-decoration: none;")
    .on("click", function(){ 
      window.clickedKey = null;
      $("circle.clicked").attr("class", "inactive");
      $("#bid_block_infobox").children().detach(); 
      $("#bid_block_infobox").attr("style", null);
      document.body.style.cursor = "default";
    });
  
  $("#bid_block_infobox").children().detach();
  $("#bid_block_infobox").append(h5);
  $("#bid_block_infobox").append(close);
  makeBidBoxPieChart(userAmounts,commaSeparator(data.total),key[1],pieDimension);
  $("#bid_block_infobox").append(tableBox);  
  if (opacity == 1.0) {
    $("#bid_block_infobox").attr("style", "background: rgba(255, 255, 255, 1.0)");
  } else {
    $("#bid_block_infobox").attr("style", "opacity: "+opacity);
  }
  
}

function makeBidBoxPieChart(userAmounts, total, rate, pieDimension) {
  var pieBox = $(document.createElement("div"))
    .attr("class", "bid_box_pie").attr("id", "bid_box_pie")
    .attr("style", "height: "+pieDimension+"px; width: "+pieDimension+"px;");  
  
  $("#bid_block_infobox").append(pieBox);  
  
  var radius = pieDimension / 2;
  
  var outerRadius = radius - 2, innerRadius = 30;
  
  var arc = d3.svg.arc()
    .outerRadius(radius - 2)
    .innerRadius(30);
  
  var pie = d3.layout.pie()
    .sort(function(a,b){ return d3.ascending(a[0].toUpperCase(), b[0].toUpperCase()) })
    .value(function(d) { return d[1]; });
  
  var svg = d3.select("#bid_box_pie").append("svg")
    .attr("width", pieDimension)
    .attr("height", pieDimension)
  .append("g")
    .attr("transform", "translate(" + pieDimension / 2 + "," + pieDimension / 2 + ")");
  
  var text = svg.append("text")
    .style("text-anchor", "middle")
    .text("£"+total);
  
  var rateText = svg.append("text")
    .attr("transform", "translate(0,15)")
    .style("text-anchor", "middle")
    .text("@ "+rate+"%");  
  
  var close = svg.append("text").attr("transform", "translate(35,-40)").text("x")
    .style("cursor", "pointer")
    .style("display", "none")
    .on("click", function(d){ 
      window.infoBoxActiveSlice = null;
      window.infoBoxActiveData = null;
      close.style("display", "none");    
      $("g.arc").find("path").each(function(d){d3.select(this).style("opacity",null)});
      text.text("£"+total);
      $("#bid_block_infobox").find("tr").attr("style", null);
    });
  
  var g = svg.selectAll(".arc")
    .data(pie(userAmounts))
    .enter().append("g")
    .attr("class", "arc")
    .style("stroke", "#fff");
    
  g.append("path")
    .attr("d", arc)
    .style("fill", function(d) { 
      if (!window.userToColor[d.data[0]]) {
        window.userToColor[d.data[0]] = window.randomColor();
      }
      return window.userToColor[d.data[0]]; 
    })
    .on("mouseover", function(d) {
      text.text("£"+commaSeparator(d.data[1]));
      var self = this;
      d3.select(this).style("opacity",null);
      $("g.arc").find("path")
        .filter(function(){ return this != self  && this != window.infoBoxActiveSlice })
        .each(function(d){d3.select(this).style("opacity","0.5")});
      $("#bid_block_infobox").find("tr").attr("style", null).filter(function(){ 
        return $(this).children().eq(1).html() !== d.data[0] 
      }).attr("style","display: none");
    })
    .on("click", function(d) {
      d3.select(window.infoBoxActiveSlice).style("opacity","0.5");
      window.infoBoxActiveSlice = this;
      window.infoBoxActiveData = d;
      close.style("display",null);
    })
    .on("mouseout", function(d) {
      if (window.infoBoxActiveSlice == null) {
        $("g.arc").find("path").each(function(d){d3.select(this).style("opacity",null)});
        text.text("£"+total);
        $("#bid_block_infobox").find("tr").attr("style", null);
      } else {
        d3.select(this).style("opacity","0.5");
        d3.select(window.infoBoxActiveSlice).style("opacity",null);
        $("#bid_block_infobox").find("tr").attr("style", null).filter(function(){ 
          return $(this).children().eq(1).html() !== window.infoBoxActiveData.data[0] 
        }).attr("style","display: none");
        text.text("£"+commaSeparator(window.infoBoxActiveData.data[1]));
      }
    });
  
  g.append("text")
    .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
    .attr("dy", ".35em");  
}

window.userToColor = {};

/**
 * Derived from http://bl.ocks.org/jdarling/06019d16cb5fd6795edf , 
 * algorithm from http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
 */
window.randomColor = (function(){
  var golden_ratio_conjugate = 0.618033988749895;
  var h = Math.random();

  var hslToRgb = function (h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
  };
  
  return function(){
    h += golden_ratio_conjugate;
    h %= 1;
    return hslToRgb(h, 0.5, 0.60);
  };
})();
