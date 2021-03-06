/**
 * FCViz 
 * Payload script for advanced loan parts grid
 * Provides a callback to programmatically load up all loan parts
 */

function loadAdvancedLoanParts() {
  var table = initAdvancedTable();
  table.hide();
  var configureTable = t => $.ajax('https://www.fundingcircle.com/investors/historical_loan_parts.csv?disable_pagination=true')
   .fail(payload => console.error(payload))
   .done(payload => {
     var dataTable = configureAdvanced(t);
     parseAdvanced(payload, dataTable);
     dataTable.draw(false);
     t.show();
     addLinksToAdvancedLoanParts(dataTable);
   });
  return [table, configureTable];
}

function addLinksToAdvancedLoanParts(dataTable, page = 1) {
  $.ajax('https://www.fundingcircle.com/investors/loan_parts_summaries.html?page=' + page)
   .fail(payload => console.error(payload))
   .done(payload => {
     $(payload).find('tbody tr').each(extractLink.bind(this, dataTable));
     dataTable.draw(false);
     if ($(payload).find('.last').length > 0) {
       addLinksToAdvancedLoanParts(dataTable, page + 1);
     }
   });
}

function extractLink(dataTable, index, row) {
  var loanId = $(row).find('td:first-child').html().trim();
  var title = $(row).find('a');
  var tableRow = dataTable.row("#" + loanId);
  if (tableRow.data() !== undefined) {
    var data = tableRow.data();
    data.title = {
      title: data.title,
      href: title.attr('href'),
    };
    tableRow.invalidate();
  }
}

function initAdvancedTable() {
  var table = $(document.createElement('table'))
    .attr('class', 'brand')
    .html(`
    <thead>
      <tr>
        <th class="text_center" width="5%"></th>
        <th class="text_center" width="5%">Loan ID</th>
        <th class="text_center" width="20%">Loan title</th>
        <th class="text_center" width="10%">Sector</th>
        <th class="text_center" width="5%">Part count</th>
        <th class="text_center" width="3%">Risk</th>
        <th class="text_center" width="5%">Repayments left</th>
        <th class="text_center" width="18%">Principal remaining</th>
        <th class="text_center" width="5%">Rate</th>
        <th class="text_center" width="12%">Next payment</th>
        <th class="text_center" width="10%">Status</th>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <th class="text_center" width="5%"></th>
        <th class="text_center" width="5%">Loan ID</th>
        <th class="text_center" width="20%">Loan title</th>
        <th class="text_center" width="10%">Sector</th>
        <th class="text_center" width="5%">Part count</th>
        <th class="text_center" width="3%">Risk</th>
        <th class="text_center" width="5%">Repayments left</th>
        <th class="text_center" width="18%">Principal remaining</th>
        <th class="text_center" width="5%">Rate</th>
        <th class="text_center" width="12%">Next payment</th>
        <th class="text_center" width="10%">Status</th>
      </tr>
    </tfoot>
    `);
  return table;
}

function parseAdvanced(payload, dataTable) {
  var rows = payload.split(/\n/).slice(1, -1);
  var json = rows.map(extractLoanPartData);
  json.forEach(mergeInto(dataTable))
}

function extractLoanPartData(row, i) {
  var cols = row.split(/,/);
  var title = cols[1];
  return { 
    id: cols[3],
    title: title,
    sector: cols[2],
    partCount: 1,
    risk: cols[4].trim(),
    repayments: cols[5],
    principal: cols[6],
    rate: cols[7],
    date: cols[8],
    status: cols[9],
    parts: [{
      id: cols[0],
      principal: cols[6],
      rate: cols[7],
    }],
    partIds: [cols[0]]
  };
}

function mergeInto(myLoanParts) {
  return d => {
    var row = myLoanParts.row("#" + d.id);
    if (row.data() == undefined) {
      myLoanParts.row.add(d);
    } else {
      var data = row.data();
      var dataRate = +(data.rate.substring(0, data.rate.length - 1));
      var dRate = +(d.rate.substring(0, d.rate.length - 1));      
      var aggRate = (data.repayments == 0 ?
        (dataRate * data.parts.length + dRate)/(data.parts.length + 1) :
        (dataRate * (+data.principal) + dRate * (+d.principal))/((+data.principal) + (+d.principal))
      ); 
      data.rate = aggRate.toFixed(1) + "%";  
      data.partCount += d.partCount;
      data.parts = data.parts.concat(d.parts);
      data.principal = ((+data.principal) + (+d.principal)).toFixed(2);
      data.partIds = data.partIds.concat(d.partIds);
      row.invalidate();
    }
  }
}

function configureAdvanced(myLoanPartsBase) {
  var dataTable = myLoanPartsBase.DataTable({ 
    order: [ [9,'asc'] ],
    rowId: "id",
    dom: '<"top"f>tp<"bottom"il>',
    columnDefs:[
      {
        "targets": [ 11 ],
        "visible": false,
        "searchable": true
      },
      {
        "targets": 2,
        "render": function (data, type, full, meta) {
          return data.href ? '<a href="' + data.href + '">' + data.title + '</a>' : data;
        }
      }
    ],
    columns:[
      {
          "className":      'details-control',
          "orderable":      false,
          "data":           null,
          "defaultContent": ''
      },
      { "data": "id" },
      { "data": "title" },
      { "data": "sector" },
      { "data": "partCount" },
      { "data": "risk" },
      { "data": "repayments" },
      { "data": "principal" },
      { "data": "rate" },
      { "data": "date", "type": "date-yyyy-mm-dd" },
      { "data": "status" },
      { "data": "partIds" },
    ],
    initComplete: function() {
      addSearchBox(this.api(), [2,3,5,9,10]);
    }
  });
  // Add event listener for opening and closing details
  $(".dataTables_wrapper tbody").on('click', 'td.details-control', function () {
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

function addSearchBox(dataTable, ids) {
  dataTable.columns(ids).every(function() {
    var column = this;
    $('<input type="text" placeholder="" />')
      .css("width", "100%")
      .appendTo( $(column.footer()).empty() )
      .on( 'keyup change', function () {
        if ( column.search() !== this.value ) {
          column.search( this.value ).draw();
        }
      });
  });
}

function renderPartsForLoan(parts) {
    var table = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
        '<tr>'+
            '<th>Part ID</th>'+
            '<th>Rate</th>'+
            '<th>Part Principal</th>'+
        '</tr>';
    parts.forEach(part => table += ''+
        '<tr>'+
            '<td>'+part.id+'</td>'+
            '<td>'+part.rate+'</td>'+
            '<td>'+part.principal+'</td>'+
        '</tr>');
        
    table += '</table>';
    return table;
}
