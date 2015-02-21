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
  
  var td = $(document.createElement("td"))
    .attr("colspan", 9)
    .html("Loading...");
  
  var preview = $(document.createElement("tr"))
    .attr("class", "preview")
    .attr("id", "preview-"+row.attr("id"));

  preview.append(td);
  preview.attr("style", "display: none;");
  row.after(filler,preview);
}