/**
 * FCViz 
 * Payload script for loan requests page
 */
 
$("#watch_form").find("a.mediumText").each(function(){$(this).before(
  $(document.createElement("a")).html("+").attr("class","seemore").attr("style", "cursor: pointer")
)});

$(".seemore").before("[").after("] ");

window.fcVizObserver.disconnect();