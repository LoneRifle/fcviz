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
      var rows = extractLoanPartData();
      if (myLoanParts == undefined) {
        myLoanParts = initLoanPartsTable();
      }
      rows.forEach(merge(myLoanParts));
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

function initLoanPartsTable() {
  var myLoanPartsBase = extractLoanPartTable();
  embedLoanPartTable(myLoanPartsBase);
  window.myLoanPartsTable = $(".dataTables_wrapper");
  myLoanParts = configure(myLoanPartsBase);
  window.myLoanParts = myLoanParts;
  return myLoanParts;
}
 
function extractLoanPartTable() {
  var myLoanParts = $("#mlprender .brand");
  myLoanParts.find("th").each((i,d) => $(d).html($(d).find("a").html()));
  myLoanParts.find("th:contains(Seller)").detach();
  myLoanParts.find("tr").prepend($(document.createElement("th")));
  return myLoanParts;
}

function embedLoanPartTable(myLoanParts) {
  $("#all_lends table.brand").detach();
  $("#all_lends").append(myLoanParts);
}

function extractLoanPartData() {
  var dataRows = $("#mlprender .brand tbody tr").detach();
  return dataRows.slice(0, dataRows.length - 1).get().map((cell, i) => { 
    var title = $(cell).children("td").eq(1).html();
    return {
      id: / - (\d+)/.exec(title)[1],
      title: title,
      risk: $(cell).children("td").eq(2).html().replace("--","").trim(),
      repayments: $(cell).children("td").eq(3).html().trim(),
      principal: $(cell).children("td").eq(4).html(),
      rate: $(cell).children("td").eq(5).html(),
      date: $(cell).children("td").eq(6).html(),
      status: $(cell).children("td").eq(8).find("span").text().trim(),
      parts: [{
        id: $(cell).children("td").eq(0).html().trim(),
        principal: $(cell).children("td").eq(4).html(),
        rate: $(cell).children("td").eq(5).html(),
        seller: $(cell).children("td").eq(7).html().trim(),
      }]
    }; 
  });
}

function merge(myLoanParts) {
  return d => {
    var row = myLoanParts.row("#" + d.id);
    if (row.data() == undefined) {
      myLoanParts.row.add(d);
    } else {
      var data = row.data();
      data.rate = "" + (data.repayments == 0 ?
        ((+data.rate) * data.parts.length + (+d.rate))/(data.parts.length + 1) :
        ((+data.rate) * (+data.principal) + (+d.rate) * (+d.principal))/((+data.principal) + (+d.principal))
      );  
      data.parts = data.parts.concat(d.parts);
      data.principal = "" + ((+data.principal) + (+d.principal));
    }
  }
}

function configure(myLoanPartsBase) {
  var dataTable = myLoanPartsBase.DataTable({ 
    order: [ [8,'asc'], [7,'asc'] ],
    rowId: "id",
    columns:[
      {
          "className":      'details-control',
          "orderable":      false,
          "data":           null,
          "defaultContent": ''
      },
      { "data": "id" },
      { "data": "title" },
      { "data": "risk" },
      { "data": "repayments" },
      { "data": "principal" },
      { "data": "rate" },
      { "data": "date" },
      { "data": "status" },
    ]
  });
  // Add event listener for opening and closing details
  $("#all_lends table.brand tbody").on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = dataTable.row( tr );
 
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child( renderPartsForLoan(row.data().parts) ).show();
            tr.addClass('shown');
        }
    } );
  return dataTable;
}

function renderPartsForLoan(parts) {
    var table = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
        '<tr>'+
            '<th>Part ID</th>'+
            '<th>Rate</th>'+
            '<th>Part Principal</th>'+
            '<th>Seller</th>'+
        '</tr>';
    parts.forEach(part => table += ''+
        '<tr>'+
            '<td>'+part.id+'</td>'+
            '<td>'+part.rate+'</td>'+
            '<td>'+part.principal+'</td>'+
            '<td>'+part.seller+'</td>'+
        '</tr>');
        
    table += '</table>';
    return table;
}
