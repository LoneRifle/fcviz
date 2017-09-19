/**
 * FCViz 
 * Payload script for loan part comments grid
 * Provides a callback to programmatically load up all loan parts
 */

function loadLoanPartComments() {
  var div = $(document.createElement('div'))

  $.getJSON('/lenders/summary/comments.json')
   .fail(payload => console.error(payload))
   .done(data => {
     console.log(data.items);
     div.append(
       '<br/><br/>' + 
       JSON.stringify(data.items, null, 2)
         .replace(/\n/g, "<br/>")
         .replace(/\s/g, '&nbsp;')
     );
   });

  return div;
}
