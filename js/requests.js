/**
 * FCViz 
 * Payload script for loan requests page
 */
 
//We don't need this mutation observer since we are in the requests page
window.fcVizObserver.disconnect();
 
var prependLinkToCell = function(){$(this).before(
  $(document.createElement("a")).html("+").attr("class","seemore").attr("style", "cursor: pointer")
)};
 
$("#watch_form").find("a.mediumText").each(prependLinkToCell);

$(".seemore").before("[").after("] ");
