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
  }
  tr.next().next().animate({height: "toggle"}, "slow");
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
  
  var td = $(document.createElement("td"))
    .attr("colspan", 9)
    .attr("id", id)
    .html("Loading...");
  
  var href = row.find("a.mediumText").attr("href");
  
  var total = +row.find("td").eq(3).html().replace("£","").replace(",","");
  
  $.get(href, window.populatePreview.bind(window, id, total)).fail(function(jqXHR, textStatus, errorThrown) {
    $(td).html("Failed to retrieve "+href+", chart render aborted: "+errorThrown);
  });
  
  var preview = $(document.createElement("tr"))
    .attr("class", "preview");

  preview.append(td);
  preview.attr("style", "display: none;");
  row.after(filler,preview);
}

window.summaryVizDimensions = {
  height: 65,
  width: 300,
  margin: {top: 2, right: 10, bottom: 10, left: 10}
};

window.populatePreview = function (id, total, data){
  $("#"+id).html("");
  var detailsStartIndex = data.indexOf("<div class='span5'>\n<h3>");
  var dl = $(document.createElement("span"))
    .html(data.substring(detailsStartIndex, data.indexOf("</div>", detailsStartIndex)))
    .find("dl").attr("style", "display: initial;");
  dl.children().attr("style", "font-size: 14px;").slice(2,6).detach();
  var title = [];
  dl.find("dd").each(function(){title.push($(this).html().trim())});
  indicateMoreThan = /more than/.test(title[2])? ">" : "";
  title[2] = indicateMoreThan + (/\d+/.exec(title[2])[0]);
  var previewDetails = $(document.createElement("span"))
    .attr("id", id+"-details")
    .append(title[0]).append(document.createElement("br")).append(title[1] + ", " + title[2] + " years");
  $("#"+id).append(previewDetails);
  
  var dataTableStartIndex = data.indexOf("<table class='brand'>");
  var previewBidsId = id+"-bids";
  var previewBids = $(document.createElement("span"))
    .attr("id", previewBidsId)
    .attr("style", "width: 300px")
    .html(data.substring(dataTableStartIndex, data.indexOf("</table>", dataTableStartIndex)) + "</table>" );
  previewBids.find("table").attr("style", "display: none");
  $("#"+id).append(previewBids);

  window.renderBidSummaryCharts(total, "#"+id, previewBidsId);
  $("#"+id).find("svg").find("g.tick").attr("style", "display: none;");
  $("#"+id).find("svg").find("g").find("text").attr("style", "display: none;");
  previewBids.find("table").detach();  
}