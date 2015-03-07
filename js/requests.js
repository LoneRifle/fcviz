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
  
  var id = row.attr("id");
  
  var tdLeft = $(document.createElement("td"))
    .attr("colspan", 2)
    .attr("id", "preview-"+id+"-pane-left")
    .html("Loading...");
  
  var tdRight = $(document.createElement("td"))
    .attr("colspan", 7)
    .attr("class", "scroll-box")
    .attr("style", "position: absolute; width: 607px; height: 250px; padding: 0px 0px 0px 7px")
    .attr("id", "preview-"+id+"-pane-right");
  
  var href = row.find("a.mediumText").attr("href");
  
  var total = +row.find("td").eq(3).html().replace("£","").replace(",","");
  
  $.get(href, window.populatePreview.bind(window, tdLeft, tdRight, id, total)).fail(function(jqXHR, textStatus, errorThrown) {
    $(tdLeft).html("Failed to retrieve "+href+", chart render aborted: "+errorThrown);
  });
  
  var preview = $(document.createElement("tr"))
    .attr("class", "preview")
    .attr("id", "preview-"+id);
    
  preview.append(tdLeft, tdRight);
  preview.attr("style", "display: none;");
  row.after(filler,preview);
}

window.summaryVizDimensions = {
  height: 65,
  width: 300,
  margin: {top: 2, right: 10, bottom: 10, left: 10}
};

window.populatePreview = function (previewPaneLeft, previewPaneRight, origId, total, data){
  var id = "preview-"+origId;
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
  
  if ($("#"+origId).html().indexOf("Fixed Rate") == -1) {
    var dataTableStartIndex = data.indexOf("<table class='brand'>");
    previewPaneLeft.append(data.substring(dataTableStartIndex, data.indexOf("</table>", dataTableStartIndex)) + "</table>");
    previewPaneLeft.find("table").attr("style", "display: none");
  
    window.renderBidSummaryCharts(total, "#"+previewPaneLeft.attr("id"), id+"-bids");
    $("#"+id).find("svg").find("g.tick").attr("style", "display: none;");
    $("#"+id).find("svg").find("g").find("text").attr("style", "display: none;");
    previewPaneLeft.find("table").detach(); 
  } else {
    var propDetailsStartIndex = data.indexOf("<div class='span3'>\n<h3>");
    var propLoanDetails = $(document.createElement("span"))
      .html(data.substring(propDetailsStartIndex, data.indexOf("</div>", propDetailsStartIndex)))
      .find("dl");
    propLoanDetails.children().slice(0,8).detach();
    propLoanDetails.find("sup").detach();
    previewPaneLeft.append(propLoanDetails);
  }
  
  if ($("#"+origId).html().indexOf("Property Development") == -1) {
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
    } else {
      var nonLimitedTable = data.substring(
        data.indexOf("<table id='non-limited-history'>"), data.indexOf("<div id='non-limited-history-info'>")
      );
      previewPaneRight.append(nonLimitedTable);
      previewPaneRight.find("#non-limited-history").attr("style","margin-bottom: 0px; width:200px; float: right;");
      previewPaneRight.find("#non-limited-history").find("th.history-label").html("Date");
    }
  } 
  var profileIndex = data.indexOf("<div class='span8'>");
  var profile = data.substring(
    data.indexOf("<div class='span8'>"), data.indexOf("</div>", profileIndex)
  ) + "</div>";
  previewPaneRight.append(profile);
  previewPaneRight.find(".span8").attr("style", "float: none;");
  previewPaneRight.find("h3").attr("style","text-align: left; font-size: 14px");
  previewPaneRight.find("p").attr("style","line-height: auto; font-size: 14px");
}