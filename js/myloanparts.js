/**
 * FCViz 
 * Payload script for my loan parts grid
 */

// This will help DataTables magic detect the "yyyy-mm-dd" format; Unshift
// so that it's the first data type (so it takes priority over existing)
jQuery.fn.dataTableExt.aTypes.unshift(
    function (sData) {
        "use strict"; //let's avoid tom-foolery in this function
        if (/^\d{4}-\d{2}-\d{2}/i.test(sData)) {
            return 'date-yyyy-mm-dd';
        }
        return null;
    }
);

var compareDateStrings = (a, b) => {
  var dateA = Date.parse(a.trim() || "9999-12-31");
  var dateB = Date.parse(b.trim() || "9999-12-31");
  return (dateA < dateB) ? -1 : ((dateA > dateB) ? 1 : 0);
}

// define the sorts
jQuery.fn.dataTableExt.oSort['date-yyyy-mm-dd-asc'] = compareDateStrings; 
jQuery.fn.dataTableExt.oSort['date-yyyy-mm-dd-desc'] = (a, b) => compareDateStrings(b, a);

function createNamedLoanPartsButton(name, generateTable) {
  var btn = $(document.createElement('button'))
    .attr('id', 'loan-parts-' + name + '-tab')
    .attr('data-toggleable', true)
    .attr('class', 'btn')
    .text(name[0].toUpperCase() + name.substring(1));
  btn.click(e =>{
    $('button.active').removeClass('active');
    $('div.active').removeClass('active');

    btn.addClass('active');
    var div = $('#loan-part-' + name);
    div.addClass('active');
    if (!div.html()) {
      div.append($(document.createElement('div')).attr('class', 'loan-parts-table__filter-wrapper'));
      div.append(generateTable());
    }
  });
  return btn;
}

function createNamedLoanPartsPanel(name) {
  var div = $(document.createElement('div'))
    .attr('id', 'loan-part-' + name)
    .attr('data-toggleable', true)
    .attr('class', 'loan-parts-table-wrapper');
  
  return div;
}

$('#loan-parts-tab').after(
  createNamedLoanPartsButton('advanced', loadAdvancedLoanParts),
  createNamedLoanPartsButton('comments', loadLoanPartComments)
);
$('#loan-part-list').after(
  createNamedLoanPartsPanel('advanced'),
  createNamedLoanPartsPanel('comments')
);
