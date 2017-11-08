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
  var headers = `
  <tr>
    <th class="text_center" width="5%">ID</th>
    <th class="text_center" width="15%">Loan title</th>
    <th class="text_center" width="5%">Risk</th>
    <th class="text_center" width="5%">Exposure</th>
    <th class="text_center" width="5%">Days late</th>
    <th class="text_center" width="65%">Comment</th>
  </tr>`;
  var table = $(document.createElement('table'))
    .attr('class', 'brand')
    .html(`<thead>${headers}</thead><tfoot>${headers}</tfoot>`);
  return table;
}

function parseCommentsData(data) {
  const items = data && data.items.map(payload => {
    const details = payload._embedded;
    const lastComment = details && details.comments.items[0];
    let risk = details && details.business.risk_band || 'rbr';
    if (payload.defaulted) {
      risk = risk ? risk + '&#9760;' : '&#9760;';
    }
    return {
      id: payload.auction_id,
      title: {
        title: payload.title,
        display_id: payload.display_id
      },
      risk,
      exposure: details && details.exposure.amount_cents / 100,
      lastCommentDate: lastComment && lastComment.created_at,
      lateRepayments: details.late_repayments,
      payload,
    };
  });
  console.log(items);
  return items;
}1

function renderComments (payload) {
  const details = payload._embedded;
  const comments = (details.comments.items || [])
    .map((c, i) => `
      <p ${i > 0 ? 'style="display:none"' : ''} id="${payload.auction_id}-${i}">
        <strong>${c.created_at}</strong><br/>
        <span style="text-align:justify;">${c.body}</span>
      </p>`
    )
    .join('\n');
  const commentsDiv = `<div id="comments-${payload.auction_id}">${comments}</div>`
  const showAll = '<span style="position: absolute;right: 20px;" class="see_more">Show all</span>'
  return showAll + commentsDiv;
}

function configureComments(myLoanPartsBase) {
  var dataTable = myLoanPartsBase.DataTable({
    ajax: {
      url: '/lenders/summary/comments.json',
      dataSrc: parseCommentsData
    },
    dom: '<"top"f>tp<"bottom"il>',
    order: [ [5,'desc'] ],
    rowId: "id",
    createdRow: function (row, data, index) {
      if (data.risk === 'rbr') {
        $(row).addClass('warning');
      }
    },
    columnDefs:[
      { targets: 1, render: data => `<a href="/loans/${data.display_id}/auction">${data.title}</a>` },
      { targets: 4, render: data => data.items.map(i => i.days_late).join(', ') || '0' },
      { targets: 5, render: renderComments },
    ],
    columns:[
      { "data": "id" },
      { "data": "title" },
      { "data": "risk" },
      { "data": "exposure" },
      { "data": "lateRepayments" },
      { "data": "payload" },
    ],
    initComplete: function() {
      addSearchBox(this.api(), [1,2,4,5]);
    }
  });
  // Add event listener for opening and closing details
  $(".dataTables_wrapper tbody").on('click', 'td span.see_more', function () {
    $(this).next('div').children('p:not(:first-child)').toggle();
  });
  
  $('.dataTables_wrapper tbody')

  myLoanPartsBase.show();
  return dataTable;
}

