/**
 * FCViz 
 * Payload script for summary page
 */
 
var hideRepaid = $(document.createElement("input"))
  .attr("id", "hide_repaid")
  .attr("type", "checkbox");

//Observe mutations made to table.zebra-striped, so that we can reapply window.fcViz
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
window.fcVizObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    switch(mutation.target.id) {
      case "all_lends":
        if ($("#hide_repaid").length == 0) {
          var partsControls = $("div#all_lends table.zebra-striped tbody td").last();
          partsControls.children().before(hideRepaid, "Hide Repaid ");
        }
        break;
      default:
        break;
    }
  })
});

window.fcVizObserver.observe(document, { childList: true, subtree: true });