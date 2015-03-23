/**
 * FCViz 
 * Payload script for summary page
 */
 
//Retain a table element in globals so that we can easily reattach 
//whenever the Loan Parts pane gets wiped
window.repayGraph = $(document.createElement("td"))
  .attr("colspan",10)
  .attr("style", "background-color: #f9f9f9; height: 300px")
  .attr("id", "repay_graph");
window.repayGraphContainer = $(document.createElement("tr"))
  .attr("id", "repay_graph_container")
  .attr("style", "display: none")
  .append(window.repayGraph);

window.repayByDate = { dates: [] };
  
//Observe mutations made to table.zebra-striped, so that we can reapply window.fcViz
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
window.fcVizObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    switch(mutation.target.id) {
      case "all_lends":
        //Get rid of the pesky popover divs that get injected into place,
        //but are not needed since one is generated already.
        $("div.popover").detach();
        if ($("#hide_repaid").length == 0) {
          var hideRepaid = $(document.createElement("input"))
            .attr("id", "hide_repaid")
            .attr("type", "checkbox");
          hideRepaid[0].checked = window.repaidHidden;
          var partsControls = $("div#all_lends table.zebra-striped tbody td").last();
          partsControls.children().before(hideRepaid, "Hide Repaid ");          
          $("#hide_repaid").on("change", function(){
            window.repaidHidden = this.checked;
            changeRepaidRowsAndReformat();
          });
          //After installing the checkbox, apply its change method on the table rows.
          changeRepaidRowsAndReformat();        
        }
        if ($("#repay_graph_link").length == 0) {
          var repayGraphLink = $(document.createElement("span")).html("(graph)")
            .attr("id", "repay_graph_link")
            .attr("class", "leftblue");
          var repayCsvLink = $("div#all_lends table.zebra-striped tbody td:first-child a:first-child");
          repayCsvLink.after(" ",repayGraphLink);
          $("div#all_lends table.zebra-striped tbody").append(window.repayGraphContainer);
          repayGraphLink.on("click", function(){            
            if (window.repayGraphContainer.find("svg").length == 0) {
              createRepayGraph(repayCsvLink.attr("href"));
              window.repayGraphContainer.animate({height: "toggle"}, "fast");
            } else {
              var visible = window.repayGraphContainer.is(":visible");
              window.repayGraphContainer.attr("style", visible? "display: none" : null);
            }
          });
        }
        break;
      default:
        break;
    }
  })
});

window.fcVizObserver.observe(document, { childList: true, subtree: true });

function changeRepaidRowsAndReformat() {
  if (window.repaidHidden) {
    $("#all_lends table.brand tbody tr:has(td:contains(Repaid))")
      .attr("style", "display: none");
    $("#all_lends table.brand tbody tr:visible td:first-child")
      .attr("style", "background: white");
    $("#all_lends table.brand tbody tr:visible:even td:first-child")
      .attr("style", "background: #f9f9f9");
    $("#all_lends table.brand tbody tr:visible td:not(:first-child)")
      .attr("style", "text-align:center; background: white");
    $("#all_lends table.brand tbody tr:visible:even td:not(:first-child)")
      .attr("style", "text-align:center; background: #f9f9f9");
  } else {
    $("#all_lends table.brand tbody tr").attr("style", null);
    $("#all_lends table.brand tbody tr td:first-child").attr("style", null);
    $("#all_lends table.brand tbody tr td:not(:first-child)").attr("style", "text-align:center");
  }
}


function createRepayGraph(href) {
  window.repayGraph.html("Loading...<br/><br/><br/><br/><br/><br/>");
  window.initialFunds = +$("#account-menu li:not([class]) span.val").html().substring(1);
  window.finalFunds = initialFunds;    
  d3.csv(href, parseRepayRows, repayGraphCallback);
}

window.parseRepayRows = function (d) {
  var data = {
    date: new Date(d[" Due Date"]),
    rate: +d[" Annualised Rate"],
    interest: +d[" Interest due"],
    fee: +d[" Lender Fee"],
    principal: +d[" Principal due"],
    risk: d[" Risk"].trim(),
    status: d[" Status"].trim(),
    id: +d["Loan Part ID"],
    name: d[" Borrower"].trim()
  };  
  
  if (!repayByDate[data.date]) {
    repayByDate.dates.push(data.date);
    repayByDate[data.date] = [];
  }
  repayByDate[data.date].push(data);
  finalFunds += data.principal + data.interest - data.fee;
  
  return data;
}

window.repayGraphCallback = function (error, data) {
  window.repay = data;  
  repayByDate.dates.sort(function(a,b){ return a - b });
  window.repayGraph.html("");
  
  var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = window.repayGraph.width() - margin.left - margin.right,
    height = window.repayGraph.height() - margin.top - margin.bottom;
    
  var x = d3.time.scale()
    .range([0, width])
    .domain([new Date(), d3.max(data, function(d){ return d.date })]);
    
  var y = d3.scale.linear()
    .range([0, height])
    .domain([0, finalFunds]);
    
  var chart = d3.select("#repay_graph svg")
    .attr("width", window.repayGraph.width())
    .attr("height", window.repayGraph.height());
  
  console.log(data);
}