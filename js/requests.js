/**
 * FCViz 
 * Payload script for loan requests page
 */
 
//We don't need this mutation observer since we are in the requests page
window.fcVizObserver.disconnect();
 
var prependLinkToCell = function(){$(this).before(
  $(document.createElement("a")).attr("class","see_more")
    .attr("style", "cursor: pointer").before("[").html("+").after("] ")
)};
 
$("#watch_form").find("a.mediumText").each(prependLinkToCell);

$(".see_more").on("click", function(){
  $(this).html($(this).html() === "+"? "-" : "+");
  switch($(this).html()) {
    case "-":
      console.log("open");
      break;
    case "+":
      console.log("closed");
      break;
  }
});
