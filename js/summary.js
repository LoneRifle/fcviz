/**
 * FCViz 
 * Payload script for summary page
 */

// Earnings Graph Rendering ------------------------------------------------

function renderEarningsGraph(data) {
  $('#my_lending').prepend(
    $(document.createElement('div'))
      .attr('class', 'row')
      .append(
        $(document.createElement('div'))
          .attr('id', 'portfolio_summary')
          .attr('class', 'span16 white border pad')
      )
  );
  $('#portfolio_summary').append(
    $(document.createElement('h3')).html('Portfolio Summary').css('margin-bottom', 0)
  );

  const margin = +$('#portfolio_summary').css('padding').replace('px','');
  const width = +$('#portfolio_summary').css('width').replace('px','') - (margin * 2);
  const height = 300;

  var chart = d3.select('#portfolio_summary')
    .append('svg')
      .attr('id', 'portfolio_summary_graph')
      .attr('width', width)
      .attr('height', height + margin * 2);

  const summaryHeadline = $(document.createElement('h4')).html('Yields - ').css('text-align', 'center');
  summaryHeadline.append(' Gross: ', $(window.headlineYields).eq(0).children());
  summaryHeadline.append(', after fees and bad debts - ');
  summaryHeadline.append(' Annualised: ', $(window.headlineYields).eq(1).children());
  summaryHeadline.append(' Estimated Fully Diversified: ', $(window.headlineYields).eq(2).children());

  $('#portfolio_summary').append(summaryHeadline);

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width - margin * 3], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom');
      
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .tickFormat(d => d3.formatPrefix(d, 3).scale(d));

  const labels = [
    'deposits', 
    'sales', 'purchases', 'promotions',
    // 'depositsAndLegacyItems',
    'interest',
    // 'pvBeforeDefaultsAndFees',
    'fees',
    // 'pvBeforeDefaults',
    'defaults', 'recoveries',
    // 'pv',
    'lent', 'bid', 'available', 'accrued'
  ];
  const portfolioLabels = ['lent', 'bid', 'available'];
  const displayLabels = labels.filter(l => !portfolioLabels.includes(l))
  displayLabels.splice(-1, 0, 'portfolio')
  x.domain(displayLabels);
  y.domain([0, data.pvBeforeDefaultsAndFees]);

  chart.append("g")      
    .attr("class", "x axis")
    .attr("transform", `translate(${margin * 2},${height + margin * 0.5})`)
    .call(xAxis);

  chart.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${margin * 2},${margin * 0.5})`)
    .call(yAxis)    
  .append("text")
    .attr("transform", "translate(10,-20)")
    .attr("dy", ".71em")
    .style("text-anchor", "end");

  const incrementalItems = [
    'sales', 'purchases', 'promotions',
    'interest',
    'fees',
    'defaults', 'recoveries',
    'lent', 'bid'
  ]
  
  const nonIncrementalItems = labels.filter(l => !incrementalItems.includes(l));

  const incrementalY = d => {
    var labelIndex = labels.indexOf(d[0]);
    var y = Math.max(d[1], 0);
    while (incrementalItems.includes(labels[labelIndex])) {
      --labelIndex;
      y += data[labels[labelIndex]];
    }
    return y;
  };

  chart.selectAll("rect")
    .data(Object.entries(data).filter(([label]) => labels.includes(label)))
  .enter().append("rect")
    .attr("x", ([label]) => { return x(portfolioLabels.includes(label) ? 'portfolio' : label) + 2 * margin; })
    .attr("y", function(d) { 
      return margin * 0.5 + y(incrementalItems.includes(d[0]) ? incrementalY(d) : d[1]);
    })
    .attr("height", function(d) { 
      return height - y(Math.abs(d[1]))
    })
    .attr("width", x.rangeBand())
    .attr("class", ([label, value]) => {
      if (label.startsWith('deposits') || label.startsWith('pv')) {
        return 'fcviz';
      } else if (portfolioLabels.includes(label) || label === 'fees') {
        return label;
      } else if (value > 0) {
        return 'gain';
      } else if (value < 0) {
        return 'loss';
      } else {
        return undefined;
      }
    })
}

function getAllTimeEarningsCents() {
  const [interest, sales, purchases, promotions, fees, defaults, recoveries] = Array.from(
    $('#earnings_summary td.currency').map((i, e) => +(parseFloat($(e).html().replace('£', '')) * 100).toFixed(0))
  );
  return {interest, sales, purchases, promotions, fees: -fees, defaults, recoveries};
}

function getHeadlineYields() {
  return $('#returns_summary .currency h2');
}

window.earningsDataCents = getAllTimeEarningsCents();

window.headlineYields = getHeadlineYields();

const getSummaryNumbersThenRenderGraph = async () => {
  let payload;
  while (!payload) {
    try {
      payload = await $.getJSON('https://www.fundingcircle.com/lenders/summary.json')
    } catch (err) {
      console.error(err);
      if (err.status === 404) {
        // Probably the usual FC failure to 
        // receive the auth tokens in time, wait a little longer
        await setTimeout(() => {}, 500);
      } else {
        throw err;
      }
    }
  }
  if (payload) {
    const portfolio_numbers = payload._embedded.financial_totals;
    const pv = portfolio_numbers.total_cents;
    const portfolioNumbers = {
      pv,
      bid: -portfolio_numbers.bidding_cents,
      lent: -portfolio_numbers.lending_cents,
      available: portfolio_numbers.balance_cents,
      accrued: portfolio_numbers.accrued_interest_cents
    };

    const calculatePVs = (pv, {defaults, recoveries, fees, interest, promotions, purchases, sales}) => {
      const pvBeforeDefaults = pv - defaults - recoveries;
      const pvBeforeDefaultsAndFees = pvBeforeDefaults - fees;
      const depositsAndLegacyItems = pvBeforeDefaultsAndFees - interest;
      const deposits = depositsAndLegacyItems - promotions - purchases - sales;
      return { pvBeforeDefaults, pvBeforeDefaultsAndFees, depositsAndLegacyItems, deposits}
    };

    Object.assign(window.earningsDataCents, portfolioNumbers, calculatePVs(pv, window.earningsDataCents));
    renderEarningsGraph(window.earningsDataCents);
  }
}

// getSummaryNumbersThenRenderGraph();

// Detach the now-useless widgets
// $("iframe#funds_summary").parent().parent().detach();

// Repayment Graph Rendering -----------------------------------------------

window.repayByDate = { dates: [] };

df = d3.time.format("%Y-%m-%d");

window.initialFunds = +$(".header__user-funds").text().split("£")[1];

principal = ['principal',0], interest = ['interest',0], fee = ['fee',0], total = [initialFunds];
dates = ['date', df(new Date())];

principalWeek = ['principal',0], interestWeek = ['interest',0], feeWeek = ['fee',0], totalWeek = [initialFunds];
datesWeek = ['date', df(new Date())];
  
repayChart = null;
  
//Retain a table element in globals so that we can easily reattach 
//whenever the Loan Parts pane gets wiped
window.repayGraph = $(document.createElement("td"))
  .attr("colspan",10)
  .attr("style", "background-color: #f9f9f9; height: 300px")
  .attr("id", "repay_graph");
window.repayGraphContainer = $(document.createElement("tr"))
  .attr("id", "repay_graph_container")
  .attr("style", "display: none")
  .append(window.repayGraph);
$(".all_lends_wrapper table.brand:first-child() tbody").append(window.repayGraphContainer);

var repayGraphLink = $(document.createElement("span")).html("(graph)")
  .attr("id", "repay_graph_link")
  .attr("class", "leftblue");
var repayCsvLink = $("a:contains('Download repayment schedule')");
repayCsvLink.after(" ",repayGraphLink);
repayGraphLink.on("click", function(){            
  if (window.repayGraphContainer.find("svg").length == 0) {
    createRepayGraph(repayCsvLink.attr("href"));
  }
  window.repayGraphContainer.toggle("fast");
});

function changeRepaidRowsAndReformat() {
  if (window.repaidHidden) {
    $("#all_lends table.brand tbody tr:has(td:contains(Repaid))")
      .css("display", "none");
    $("#all_lends table.brand tbody tr:visible td:first-child")
      .css("background", "white");
    $("#all_lends table.brand tbody tr:visible:even td:first-child")
      .css("background", "#f9f9f9");
    $("#all_lends table.brand tbody tr:visible td:not(:first-child)")
      .css("background", "white");
    $("#all_lends table.brand tbody tr:visible:even td:not(:first-child)")
      .css("background", "#f9f9f9");
  } else {
    $("#all_lends table.brand tbody tr").attr("style", null);
    $("#all_lends table.brand tbody tr td:first-child").attr("style", null);
    $("#all_lends table.brand tbody tr td:not(:first-child)").attr("style", "text-align:center");
    if ($("#mlpfilter").val() === "all") {
      $("#all_lends table.brand tbody tr td:nth-child(2)").attr("style", null);
    }
  }
}


function createRepayGraph(href) {
  window.repayGraph.html("Loading...<br/><br/><br/><br/><br/><br/>");
  window.finalFunds = initialFunds;    
  d3.csv(href, parseRepayRows, repayGraphCallback);
}

window.parseRepayRows = function (d) {
  var dueDate = new Date(d["due_date"]);
  dueDate.setHours(0);
  var data = {
    date: new Date(dueDate),
    rate: +d["annualised_rate"],
    interest: +d["pay_interest"],
    fee: +d["lender_fee"],
    principal: +d["pay_principal"],
    risk: d["credit_band"].trim(),
    status: d["status"].trim(),
    id: +d["loan_part_id"],
    name: d["borrower"].trim()
  };  
  
  if (!repayByDate[data.date]) {
    repayByDate.dates.push(data.date);
    repayByDate[data.date] = {
      parts: [],
      principal: 0,
      interest: 0,
      fee: 0
    };
  }
  repayByDate[data.date].parts.push(data);
  repayByDate[data.date].principal += data.principal;
  repayByDate[data.date].interest += data.interest;
  repayByDate[data.date].fee += data.fee;
  finalFunds += data.principal + data.interest - data.fee;
  
  return data;
}

window.repayGraphCallback = function (error, data) {
  window.repay = data;  
  window.repayByDate.dates.sort(function(a,b){ return a - b });
  window.repayGraph.html("");
    
  var prinRunTot = 0, intRunTot = 0, feeRunTot = 0;
  var endOfWeek = new Date(df(new Date()));
  endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 7);
  endOfWeek.setHours(0);
  
  var totalsByWeek = { dates: [] };
  
  window.repayByDate.dates.forEach(function (d,i) {
    interest.push(d3.round(window.repayByDate[d].interest,2));
    principal.push(d3.round(window.repayByDate[d].principal,2));
    fee.push(d3.round(-window.repayByDate[d].fee,2));
    total.push(d3.round(total[i] + principal[i+2] + interest[i+2] + fee[i+2],2));
    dates.push(df(d));
    
    //aggregate by week ending Sunday
    var endOfWeek = new Date(d);
    if (endOfWeek.getDay() > 0) {
      endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 7);
    }
    
    if (!totalsByWeek[endOfWeek]) {
      totalsByWeek.dates.push(endOfWeek);
      totalsByWeek[endOfWeek] = {
        principal: 0,
        interest: 0,
        fee: 0
      };
    }
    totalsByWeek[endOfWeek].principal += window.repayByDate[d].principal;
    totalsByWeek[endOfWeek].interest += window.repayByDate[d].interest;
    totalsByWeek[endOfWeek].fee += window.repayByDate[d].fee;
  });  
  
  //Clean up the remaining totals that may still be there  
  totalsByWeek.dates.forEach( function(endOfWeek) {  
    interestWeek.push(d3.round(totalsByWeek[endOfWeek].interest,2));
    principalWeek.push(d3.round(totalsByWeek[endOfWeek].principal,2));
    feeWeek.push(d3.round(-totalsByWeek[endOfWeek].fee,2));
    totalWeek.push(d3.round(totalWeek[totalWeek.length - 1] + totalsByWeek[endOfWeek].principal + totalsByWeek[endOfWeek].interest - totalsByWeek[endOfWeek].fee,2));
    datesWeek.push(df(endOfWeek));
  });
  
  total = ['total'].concat(total);
  totalWeek = ['total'].concat(totalWeek);
  
  var 
    width = window.repayGraph.width() * 0.8,
    height = window.repayGraph.height();
  
  var chartArgs = {
    bindto: '#'+window.repayGraph[0].id,
    size: { width: width, height: height },
    data: {
      x: 'date',
      columns: [datesWeek, principalWeek, interestWeek, feeWeek, totalWeek],
      types: { principal: 'bar', interest: 'bar', fee: 'bar' },      
      order: 'asc',
      groups: [[principal[0],interest[0],fee[0]]],
      axes: { principal: 'y', interest: 'y', fee: 'y', total: 'y2'},
      colors: { principal: '#772d72', interest: '#77C738', fee: '#c7eefe', total: '#0fb3ca' },
      onclick: window.listParts
    },
    axis: {
      x: { type: 'timeseries', tick: {format: '%d %b'} },
      y2: { show: true }
    },
    tooltip: {
      format: {
        title: d3.time.format('%d %b %Y')
      }
    },
    subchart: { show: true },
    grid: {
      y: {lines: [{value:0}]}
    }
  };
  
  repayChart = c3.generate(chartArgs);
  var details = buildRepayDetails();
  $(".c3-tooltip-container").after(details);
  $("#repay_by_day").on("click", activateAndLoad("#repay_by_week", principal, interest, fee, total, dates));
  $("#repay_by_week").on("click", activateAndLoad("#repay_by_day", principalWeek, interestWeek, feeWeek, totalWeek, datesWeek));
  
  var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);
}

function buildRepayDetails() {
  var details = $(document.createElement("div"))
    .attr("class", "repay_details").html(
      "Data: <span id='repay_by_week' class='repay_current_data'>Weekly</span> |" +
      " <span id='repay_by_day' class='repay_change_data'>Daily</span>"
    );
  details.append($(document.createElement("div")).attr("id", "parts_list").attr("class", "scroll-box"));
  return details;
}

function activateAndLoad(repayId, principal, interest, fee, total, dates) {
  return function(){
    if ($(this).attr("class") === "repay_change_data") {
      $(this).attr("class", "repay_current_data");
      $(repayId).attr("class", "repay_change_data");
      $("#parts_list").children().detach();
      repayChart.load({ 
        unload: true,
        columns: [ principal, interest, fee, total, dates ]
      });
    }
  };
}

window.listParts = function (data, element) {
  var isWeekly = $(".repay_current_data").attr("id") === "repay_by_week";
  var date = data.x;
  var parts = [];
  if (isWeekly) {
    for (var i = 0; i < 7; ++i) {
      var d = new Date(date);
      d.setDate(date.getDate() - i);
      var repayEntry = repayByDate[d];
      if (repayEntry != null) {
        parts = repayEntry.parts.concat(parts);
      }
    }
  } else {
    parts = repayByDate[date].parts;
  }
  $("#parts_list").children().detach();
  var partsTable = $(document.createElement("table"))
    .html("<tr><th>Title</th><th>Date</th><th>Prin</th><th>Int</th><th>Fee</th></tr>");
    
  var df = d3.time.format("%d %b");
  
  var div = $("div.tooltip");
  
  parts.forEach(function(d,i){
     var tooltip = $(document.createElement("a"))
       .attr("data-content", d.name)
       .html('<img src="/assets/help/help_grey.png" alt="?">')
       .on("mouseover", function(e){ 
         div.animate({ opacity: .9 }, 100);   
        div.html($(this).attr("data-content"))  
         .attr("style", "left:"+ (e.pageX) + "px; top:"+ (e.pageY - 28) + "px");
       })
       .on("mouseout", function(d){ 
         div.animate({ opacity: 0 }, 100);    
       });
      
      
    var tr = $(document.createElement("tr"))
      .append($(document.createElement("td")).append(tooltip))
      .append($(document.createElement("td")).html(df(d.date)))
      .append($(document.createElement("td")).html(d.principal))
      .append($(document.createElement("td")).html(d.interest))
      .append($(document.createElement("td")).html(d.fee))
    partsTable.append(tr);
  });
  $("#parts_list").append(partsTable);
  console.log(parts);
}
