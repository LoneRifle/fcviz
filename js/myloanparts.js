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
   $.ajax("/my-account/myloanpager?mlpfilter_value=all&mlp_order_by=id")
    .fail(payload => { 
      //Set the value back to the original on failure
      console.log(payload); 
      $.ajax("/my-account/myloanpager?mlpfilter_value="+filterValueOnFail); 
    })
    .done(payload => {
      loadLoanPartsStartingFromPage(1, undefined, filterValueOnFail, d => console.log("Done"));
    });
}

function loadLoanPartsStartingFromPage(page, myLoanParts, filterValueOnFail, onLoad) {
   var orderClause = myLoanParts == undefined? "&mlp_order_by=status" : "";
   $.ajax("/my-account/myloanpager?mlpfilter_value=all" + orderClause + "&page="+page)
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
        var rows = extractLoanPartData();
        rows.forEach((d,i) => { 
          myLoanParts.row.add(d)
        });
        myLoanParts.draw(false);
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
  dataTable.find("tbody tr td:last-child").each((i,cell) => {
    $(cell).html($(cell).find("span").text().trim())
  });  
  return enhanceAndEmbedDataTable(dataTable);
} 

function enhanceAndEmbedDataTable(myLoanParts) {
  $("#all_lends table.brand").detach();
  $("#all_lends").append(myLoanParts);
  $("#all_lends table.brand tbody td:nth-child(3)").each((i,d) => $(d).html($(d).html().replace("--","").trim()));
  $("#all_lends table.brand th").each((i,d) => $(d).html($(d).find("a").html()));
  return $("#all_lends table.brand").DataTable({ order: [ [8,'asc'], [6,'asc'] ] });
}

function extractLoanPartData() {
  var dataRows = $("#mlprender .brand tbody tr");
  return dataRows.slice(0, dataRows.length - 1).get().map((cell, i) => { 
    return [
      $(cell).children("td").eq(0).html().trim(),
      $(cell).children("td").eq(1).html(),
      $(cell).children("td").eq(2).html().replace("--","").trim(),
      $(cell).children("td").eq(3).html().trim(),
      $(cell).children("td").eq(4).html(),
      $(cell).children("td").eq(5).html(),
      $(cell).children("td").eq(6).html(),
      $(cell).children("td").eq(7).html().trim(),
      $(cell).children("td").eq(8).find("span").text().trim(),
    ]; 
  });
}
