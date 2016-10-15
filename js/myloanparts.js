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
  loadLoanPartsStartingFromPage(1, [], filterValueOnFail, console.log);
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
      myLoanParts = myLoanParts.concat(extractLoanPartData());
      var isLast = $("#mlprender .pagination li").eq(-3).children("span").length == 1;
      $("#mlprender").html("");
      if (isLast) {
        $("#mlprender").detach();
        onLoad(myLoanParts);
      } else {
        loadLoanPartsStartingFromPage(page + 1, myLoanParts, filterValueOnFail, onLoad);
      }
    });
 }
 
function extractLoanPartData() {
  var dataRows = $("#mlprender .brand tbody tr");
  dataRows = dataRows.slice(0, dataRows.length - 1);
  return dataRows.map((i, cell) => { 
    return { 
      id: parseInt($(cell).children("td").eq(0).html()),
      title: $(cell).children("td").eq(1).children(),
      risk: $(cell).children("td").eq(2).html().replace("--","").trim(),
      repaymentsLeft: parseInt($(cell).children("td").eq(3).html()),
      principal: $(cell).children("td").eq(4).html(),
      rate: $(cell).children("td").eq(5).html(),
      date: $(cell).children("td").eq(6).html(),
      seller: $(cell).children("td").eq(7).html().trim(),
      status: $(cell).children("td").eq(8).children(),
    }; 
  }).get();
}
 