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
    if ($("#mlpfilter").val() === "all") {
      $("#all_lends table.brand tbody tr td:nth-child(2)").attr("style", null);
    }
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
    repayByDate[data.date] = {
      parts: [],
      principal: 0,
      interest: 0,
      fee: 0
    };
  }
  repayByDate[data.date].parts.push(data);
  repayByDate[data.date].principal += data.principal;
  repayByDate[data.date].interest += data.interest;
  repayByDate[data.date].fee += data.fee;
  finalFunds += data.principal + data.interest - data.fee;
  
  return data;
}

window.repayGraphCallback = function (error, data) {
  window.repay = data;  
  window.repayByDate.dates.sort(function(a,b){ return a - b });
  window.repayGraph.html("");
    
  var df = d3.time.format("%Y-%m-%d");
  var principal = ['principal',0], interest = ['interest',0], fee = ['fee',0], 
    total = [+$("ul.user-nav li span.val").first().html().substring(1)];
  var dates = ['date', df(new Date())];
  
  var principalWeek = ['principal',0], interestWeek = ['interest',0], feeWeek = ['fee',0], 
    totalWeek = [+$("ul.user-nav li span.val").first().html().substring(1)];
  var datesWeek = ['date', df(new Date())];
  var prinRunTot = 0, intRunTot = 0, feeRunTot = 0;
  var endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 7);
  
  window.repayByDate.dates.forEach(function (d,i) {
    interest.push(d3.round(window.repayByDate[d].interest,2));
    principal.push(d3.round(window.repayByDate[d].principal,2));
    fee.push(d3.round(-window.repayByDate[d].fee,2));
    total.push(d3.round(total[i] + principal[i+2] + interest[i+2] + fee[i+2],2));
    dates.push(df(d));
    
    //TODO: aggregate by week ending Sunday
    if (d - endOfWeek > 24 * 60 * 60 * 1000) {      
      interestWeek.push(d3.round(intRunTot,2));
      principalWeek.push(d3.round(prinRunTot,2));
      feeWeek.push(d3.round(-feeRunTot,2));
      totalWeek.push(d3.round(totalWeek[totalWeek.length - 1] + prinRunTot + intRunTot - feeRunTot,2));
      datesWeek.push(df(endOfWeek));
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      intRunTot = window.repayByDate[d].interest; 
      prinRunTot = window.repayByDate[d].principal; 
      feeRunTot = window.repayByDate[d].fee;
    } else {
      intRunTot += window.repayByDate[d].interest;
      prinRunTot += window.repayByDate[d].principal;
      feeRunTot += window.repayByDate[d].fee;
    }
  });  
  
  //Clean up the remaining totals that may still be there        
  interestWeek.push(d3.round(intRunTot,2));
  principalWeek.push(d3.round(prinRunTot,2));
  feeWeek.push(d3.round(-feeRunTot,2));
  totalWeek.push(d3.round(totalWeek[totalWeek.length - 1] + prinRunTot + intRunTot - feeRunTot,2));
  datesWeek.push(df(endOfWeek));
  
  
  total = ['total'].concat(total);
  totalWeek = ['total'].concat(totalWeek);
  
  var 
    width = window.repayGraph.width() * 0.8,
    height = window.repayGraph.height();
  
  var chartArgs = {
    bindto: '#'+window.repayGraph[0].id,
    size: { width: width, height: height },
    data: {
      x: 'date',
      columns: [datesWeek, principalWeek, interestWeek, feeWeek, totalWeek],
      types: { principal: 'bar', interest: 'bar', fee: 'bar' },      
      order: 'asc',
      groups: [[principal[0],interest[0],fee[0]]],
      axes: { principal: 'y', interest: 'y', fee: 'y', total: 'y2'},
      colors: { principal: '#772d72', interest: '#77C738', fee: '#c7eefe', total: '#0fb3ca' }
    },
    axis: {
      x: { type: 'timeseries', tick: {format: '%d %b'} },
      y2: { show: true }
    },
    subchart: { show: true },
    grid: {
      y: {lines: [{value:0}]}
    }
  };
  
  c3.generate(chartArgs);
}