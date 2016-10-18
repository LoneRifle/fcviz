/**
 * FCViz 
 * Payload script for my loan parts grid. 
 * Provides a callback to programmatically load up all loan parts
 */
 
function loadAllLoanParts() {
  if ($("#mlprender").length == 0) {
    $("#wrapper").before($(document.createElement("div")).attr("id", "mlprender").attr("class", "fade"));
  }
  var filterValueOnFail = $("#mlpfilter option[selected]").attr("value");
  loadLoanPartsStartingFromPage(1, undefined, filterValueOnFail, replaceTable);
}

function loadLoanPartsStartingFromPage(page, myLoanParts, filterValueOnFail, onLoad) {
   $.ajax("/my-account/myloanpager?mlpfilter_value=all&page="+page)
    .fail(payload => { 
      //Set the value back to the original on failure
      console.log(payload); 
      $.ajax("/my-account/myloanpager?mlpfilter_value="+filterValueOnFail); 
    })
    .done(payload => {
      $("#mlprender").html(payload);
      var isLast = $("#mlprender .pagination li").eq(-3).children("span").length == 1;
      if (myLoanParts == undefined) {
        myLoanParts = extractLoanPartTable();
      } else {
        var rows = extractLoanPartRows();
        myLoanParts.find("tbody").append(rows);
      }
      $("#mlprender").html("");
      if (isLast) {
        $("#mlprender").detach();
        onLoad(myLoanParts);
      } else {
        loadLoanPartsStartingFromPage(page + 1, myLoanParts, filterValueOnFail, onLoad);
      }
    });
 }

function extractLoanPartTable() {
  var dataTable = $("#mlprender .brand");
  dataTable.find("tbody tr").last().detach();
  return dataTable;
} 
 
function extractLoanPartRows() {
  var dataRows = $("#mlprender .brand tbody tr");
  dataRows.detach();
  return dataRows.slice(0, dataRows.length - 1);
}

function replaceTable(myLoanParts) {
  $("#all_lends table.brand").detach();
  $("#all_lends").append(myLoanParts);
  $("#all_lends table.brand tbody td:nth-child(3)").each((i,d) => $(d).html($(d).html().replace("--","").trim()));
  $("#all_lends table.brand th").each((i,d) => $(d).html($(d).find("a").html()));
  $("#all_lends table.brand").DataTable();
}

