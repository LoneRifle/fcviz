/**
 * FCViz 
 * Payload script for loan requests page
 */
 
//We don't need this mutation observer since we are in the requests page
window.fcVizObserver.disconnect();
 
var prependLinkToCell = function(){$(this).before(
  $(document.createElement("span")).attr("class","see_more").before("[").html("+").after("] ")
)};
 
$("#watch_form").find("a.mediumText").each(prependLinkToCell);

$(".see_more").on("click", function(){
  $(this).html($(this).html() === "+"? "-" : "+");
  var tr = $(this).closest("tr");
  if (tr.next().attr("class") !== "filler") {
    createPreviewUnder(tr);
    tr.next().next().animate({height: "toggle"}, "fast");
  } else {
    tr.next().next().attr("style", "display: "+($(this).html() === "+"? "none" : "table-row"));
  }
});

function createPreviewUnder(row) {
  //Create a junk element that is hidden from the user
  //so that we can somehow give the illusion of maintaining
  //the table row background colors.
  var filler = $(document.createElement("tr"))
    .attr("class", "filler")
    .attr("id", "filler-"+row.attr("id"));
  filler.attr("style", "display: none;");
  
  var id = "preview-"+row.attr("id");
  
  var tdLeft = $(document.createElement("td"))
    .attr("colspan", 2)
    .attr("id", id+"-pane-left")
    .html("Loading...");
  
  var tdRight = $(document.createElement("td"))
    .attr("colspan", 7)
    .attr("id", id+"-pane-right");
  
  var href = row.find("a.mediumText").attr("href");
  
  var total = +row.find("td").eq(3).html().replace("£","").replace(",","");
  
  $.get(href, window.populatePreview.bind(window, tdLeft, tdRight, id, total)).fail(function(jqXHR, textStatus, errorThrown) {
    $(tdLeft).html("Failed to retrieve "+href+", chart render aborted: "+errorThrown);
  });
  
  var preview = $(document.createElement("tr"))
    .attr("class", "preview")
    .attr("id", id);
    
  preview.append(tdLeft, tdRight);
  preview.attr("style", "display: none;");
  row.after(filler,preview);
}

window.summaryVizDimensions = {
  height: 65,
  width: 300,
  margin: {top: 2, right: 10, bottom: 10, left: 10}
};

window.populatePreview = function (previewPaneLeft, previewPaneRight, id, total, data){
  previewPaneLeft.html("");
  var detailsStartIndex = data.indexOf("<div class='span5'>\n<h3>");
  var dd = $(document.createElement("span"))
    .html(data.substring(detailsStartIndex, data.indexOf("</div>", detailsStartIndex)))
    .find("dd");
  var info = [];
  info = info.concat(dd.first(), dd.eq(dd.length - 2), dd.last());
  var title = [];
  $(info).each(function(){title.push($(this).html().trim())});
  indicateMoreThan = /more than/.test(title[2])? ">" : "";
  var previewDetails = $(document.createElement("span"))
    .attr("id", id+"-details")
    .append(title[0]).append(document.createElement("br"))
    .append(title[1] + ", " + indicateMoreThan + (/\d+/.exec(title[2])[0]) + " years");
  previewPaneLeft.append(previewDetails);
  
  var dataTableStartIndex = data.indexOf("<table class='brand'>");
  previewPaneLeft.append(data.substring(dataTableStartIndex, data.indexOf("</table>", dataTableStartIndex)) + "</table>");
  previewPaneLeft.find("table").attr("style", "display: none");
  
  window.renderBidSummaryCharts(total, "#"+previewPaneLeft.attr("id"), id+"-bids");
  $("#"+id).find("svg").find("g.tick").attr("style", "display: none;");
  $("#"+id).find("svg").find("g").find("text").attr("style", "display: none;");
  previewPaneLeft.find("table").detach();  
  
  if (title[1] === "Limited Company") {
    var chartGenStart = data.indexOf("if (have_chart_data)");
    var chartGenString = data.substring(chartGenStart, data.indexOf("loaded", chartGenStart));
    previewPaneRight.append(
      $(document.createElement("span")).attr("id", id+"-credit-history-chart"),
      $(document.createElement("span")).attr("id", id+"-relative-score-chart")
    );
    chartGenString = chartGenString.replace("credit-history-chart",id+"-credit-history-chart");
    chartGenString = chartGenString.replace("relative-score-chart",id+"-relative-score-chart");
    chartGenString = chartGenString.replace(/width: 440/g,"width: 275");
    chartGenString = chartGenString.replace(/height: 320/g,"height: 160");
    var have_chart_data = true;
    eval(chartGenString);
    var text = previewPaneRight.find("text");
    d3.selectAll(text).style("font-family","myriad-pro,Helvetica,sans-serif");
  } 
}