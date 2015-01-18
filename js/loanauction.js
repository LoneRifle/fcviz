/**
 * FCViz 
 * Seed script for loan auction pages
 */
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
  rows.children().each(function(){
    $(this).find(".status").remove();
    var f = $(this).find("td").first();
    f.text( rateRegexp.exec(f.text())[0] );
    var l = $(this).find("td").last();
    l.text( l.text().trim() );
  });

  //Create a div to hold the chart and related controls
  var chartDiv = document.createElement("div");
  chartDiv.id = "bids_summary_chart";

  var chartControlDiv = document.createElement("div");
  chartControlDiv.id = "bids_summary_chart_control";
  chartControlDiv.appendChild(document.createTextNode("Bar | Pie | None"));
  chartControlDiv.appendChild(chartDiv);

  tableOrig.before(chartControlDiv);
  $("#bids_summary").append(table);

  //Generate the chart based on the data found in table
  createChart('bar', '#'+table.id, 'Amount', {
    "targetDiv": '#'+chartDiv.id,
    "showTable": true,
    "labels": "Rate",
    "addComma": true,
    "prefix": "£"
  });
}