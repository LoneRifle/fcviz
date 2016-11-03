/**
 * FCViz 
 * Payload script for my loan parts grid. 
 * Provides a callback to programmatically load up all loan parts
 */
 
function loadAllLoanParts() {
  if (window.myLoanPartsTable == undefined) {
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
      var rows = extractLoanPartData();
      if (myLoanParts == undefined) {
        var myLoanPartsBase = extractLoanPartTable();
        embedLoanPartTable(myLoanPartsBase);
        myLoanParts = configure(myLoanPartsBase);
        window.myLoanPartsTable = $(".dataTables_wrapper");
      }
      rows.forEach((d,i) => { 
        myLoanParts.row.add(d)
      });
      myLoanParts.draw(false);
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
  var myLoanParts = $("#mlprender .brand");
  myLoanParts.find("th").each((i,d) => $(d).html($(d).find("a").html()));
  return myLoanParts;
}

function embedLoanPartTable(myLoanParts) {
  $("#all_lends table.brand").detach();
  $("#all_lends").append(myLoanParts);
}

function extractLoanPartData() {
  var dataRows = $("#mlprender .brand tbody tr").detach();
  return dataRows.slice(0, dataRows.length - 1).get().map((cell, i) => { 
    return {
      id: $(cell).children("td").eq(0).html().trim(),
      title: $(cell).children("td").eq(1).html(),
      risk: $(cell).children("td").eq(2).html().replace("--","").trim(),
      repayments: $(cell).children("td").eq(3).html().trim(),
      principal: $(cell).children("td").eq(4).html(),
      rate: $(cell).children("td").eq(5).html(),
      date: $(cell).children("td").eq(6).html(),
      seller: $(cell).children("td").eq(7).html().trim(),
      status: $(cell).children("td").eq(8).find("span").text().trim(),
    }; 
  });
}

function configure(myLoanPartsBase) {
  return myLoanPartsBase.DataTable({ 
    order: [ [8,'asc'], [6,'asc'] ],
    columns:[
      { "data": "id" },
      { "data": "title" },
      { "data": "risk" },
      { "data": "repayments" },
      { "data": "principal" },
      { "data": "rate" },
      { "data": "date" },
      { "data": "seller" },
      { "data": "status" },
    ]
  });
}
