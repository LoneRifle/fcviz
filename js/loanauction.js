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

  //Clone the table and hide it so that we can make it useful to createChart
  var table = tableOrig.clone()[0];
  table.id = "bids_summary_data";
  table.style.visibility = "hidden";  

  var header = jQuery(table).find("th");
  //Trim the header text to ensure that createChart can find them
  header.each(function(){ $(this).text( $(this).text().trim()); });
  //Remove the status header
  header.last().remove();
    
  var rows = jQuery(table).find("tbody");

  //Trim all bid-groups from the table
  //TODO: iterate through the bid-groups and note information about the user's bid.
  //Interpolate that on the chart.
  var bidGroups = rows.find(".sub-accepted, .sub-group").remove();

  //Remove the column of the table since it containing the status of the bids at that rate
  //Capture the rate found in the first element (because FC may mangle the rate 
  //when including user bids), then trim the last element
  var rateRegexp = /\d+\.\d%/;
  var rates = [];
  var amounts = [];
  rows.children().filter(":not(.sub-accepted, .sub-group)").each(function(){
    rates.push(+$(this).attr("data-annualised_rate"));
    amounts.push(+$(this).attr("data-amount"));
  });
  
  rows.children().each(function(){
    $(this).find(".status").remove();
    var f = $(this).find("td").first();
    f.text( rateRegexp.exec(f.text())[0] );
    var l = $(this).find("td").last();
    l.text( l.text().trim() );
  });

  var rowCount = rows.children().size();
  
  //Create a div to hold the chart and related controls
  var chartDiv = document.createElement("div");
  chartDiv.id = "bids_summary_chart";
  jQuery(chartDiv).width($("#bids_summary").width() * 0.95);
  
  var chartControlDiv = document.createElement("div");
  chartControlDiv.id = "bids_summary_chart_control";
  chartControlDiv.appendChild(document.createTextNode("Bar | Pie | None"));
  chartControlDiv.appendChild(chartDiv);

  tableOrig.before(chartControlDiv);
  $("#bids_summary").append(table);

  //Generate the chart based on the data found in table
  createChart(rowCount > 35? 'bar' : 'column', '#'+table.id, 'Amount', {
    "targetDiv": '#'+chartDiv.id,
    "showTable": true,
    "labels": "Rate",
    "addComma": true,
    "prefix": "£"
  });
}
