/**
 * FCViz 
 * Seed script for loan auction pages
 */
 
var tableDiv = document.getElementById("bids_summary");
var tableOrig = tableDiv.firstElementChild;

//Clone the table and hide it so that we can make it useful to createChart
var table = tableOrig.cloneNode(true);
table.id = "bids_summary_data";
var header = table.getElementsByTagName("thead")[0].children[0];
//Remove the status header
header.removeChild(header.lastElementChild);
//Trim the header text to ensure that createChart can find them
header.firstElementChild.textContent = header.firstElementChild.textContent.trim();
header.lastElementChild.textContent = header.lastElementChild.textContent.trim();

var rows = table.getElementsByTagName("tbody")[0];

//Trim all bid-groups from the table
var bidGroups = rows.getElementsByClassName("sub-accepted sub-group");
for (var i = 0; i < bidGroups.length; ++i) {
  rows.removeChild(bidGroups[i]);
}

var data = rows.children;
//Remove the third column of the table since it only contains the liveness of the bids at that rate
for (var i = 0; i < data.length; ++i) {
  data[i].removeChild(data[i].getElementsByClassName("status")[0]);
  data[i].firstElementChild.textContent = data[i].firstElementChild.textContent.trim();
  data[i].lastElementChild.textContent = data[i].lastElementChild.textContent.trim();
}

table.style.visibility = "hidden";

//Create a div to hold the chart and related controls
var chartDiv = document.createElement("div");
chartDiv.id = "bids_summary_chart";

var chartControlDiv = document.createElement("div");
chartControlDiv.id = "bids_summary_chart_control";
chartControlDiv.appendChild(document.createTextNode("Bar | Pie | None"));
chartControlDiv.appendChild(chartDiv);

tableDiv.insertBefore(chartControlDiv,tableOrig);
tableDiv.appendChild(table);

//Generate the chart based on the data found in table
createChart('bar', '#'+table.id, 'Amount', {
  "targetDiv": '#'+chartDiv.id,
  "showTable": true,
  "labels": "Rate",
  "addComma": true,
  "prefix": "£"
});