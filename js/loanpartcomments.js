/**
 * FCViz 
 * Payload script for loan part comments grid
 * Provides a callback to programmatically load up all loan parts
 */

function loadLoanPartComments() {
  var table = initCommentsTable();
  table.hide();
  return [table, configureComments];
}

function initCommentsTable() {
  var table = $(document.createElement('table'))
    .attr('class', 'brand')
    .html(`
    <thead>
      <tr>
        <th class="text_center" width="5%">Loan ID</th>
        <th class="text_center" width="20%">Loan title</th>
        <th class="text_center" width="5%">Risk</th>
        <th class="text_center" width="10%">Exposure</th>
        <th class="text_center" width="10%">Date of last comment</th>
        <th class="text_center" width="50%">Comment</th>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <th class="text_center" width="5%">Loan ID</th>
        <th class="text_center" width="15%">Loan title</th>
        <th class="text_center" width="5%">Risk</th>
        <th class="text_center" width="5%">Exposure</th>
        <th class="text_center" width="15%">Date of last comment</th>
        <th class="text_center" width="55%">Comment</th>
      </tr>
    </tfoot>
    `);
  return table;
}

function parseComments(data) {
  const items = data && data.items.map(d => {
    const details = d._embedded;
    const lastComment = details && details.comments.items[0];
    return {
      id: d.auction_id,
      title: {
        title: d.title,
        display_id: d.display_id
      },
      risk: details && details.business.risk_band,
      exposure: details && details.exposure.amount_cents / 100,
      lastCommentDate: lastComment.created_at,
      lastCommentText: lastComment.body,
      payload: d,
    };
  });
  console.log(items);
  return items;
}

function configureComments(myLoanPartsBase) {
  var dataTable = myLoanPartsBase.DataTable({
    ajax: {
      url: '/lenders/summary/comments.json',
      dataSrc: parseComments
    },
    dom: '<"top"f>tp<"bottom"il>',
    order: [ [4,'desc'] ],
    rowId: "id",
    columnDefs:[
      {
        "targets": [6],
        "visible": false,
        "searchable": true
      },
      {
        "targets": 1,
        "render": function (data, type, full, meta) {
          return '<a href="/loans/' + data.display_id + '/auction">' + data.title + '</a>';
        }
      }
    ],
    columns:[
      { "data": "id" },
      { "data": "title" },
      { "data": "risk" },
      { "data": "exposure" },
      { "data": "lastCommentDate", "type": "date-yyyy-mm-dd" },
      { "data": "lastCommentText" },
      { "data": "payload" },
    ],
    initComplete: function() {
      addSearchBox(this.api(), [1,2,4,5]);
    }
  });
  myLoanPartsBase.show();
  return dataTable;
}

