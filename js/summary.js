/**
 * FCViz 
 * Payload script for summary page
 */
 
//Get rid of the pesky popover divs that get injected into place,
//but are not needed since one is generated already.
 $("div.popover").detach();
 
//Observe mutations made to table.zebra-striped, so that we can reapply window.fcViz
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
window.fcVizObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    switch(mutation.target.id) {
      case "all_lends":
        if ($("#hide_repaid").length == 0) {
          var hideRepaid = $(document.createElement("input"))
            .attr("id", "hide_repaid")
            .attr("type", "checkbox");
          hideRepaid[0].checked = window.repaidHidden;
          var partsControls = $("div#all_lends table.zebra-striped tbody td").last();
          partsControls.children().before(hideRepaid, "Hide Repaid ");
        }
        $("#hide_repaid").on("change", function(){
          window.repaidHidden = this.checked;
          $("#all_lends table.brand tbody tr:has(td:contains(Repaid))")
            .attr("style", window.repaidHidden? "display: none" : null);
        });
        //After installing the checkbox, apply its change method on the table rows.
        $("#all_lends table.brand tbody tr:has(td:contains(Repaid))")
          .attr("style", window.repaidHidden? "display: none" : null);
        break;
      default:
        break;
    }
  })
});

window.fcVizObserver.observe(document, { childList: true, subtree: true });
