window.triggerConsolidateAccountsWidgets = function (id) {
  var investorReportLink = $("a.blueText:contains(Investor )");
  //If there is an investor report, this is likely to be a property loan. return early.
  if (investorReportLink.length > 0) {
    return;
  }
  
  var originalLoanAccounts = $("table.brand:nth-child(2) tr td:not(:first-child)");
  var originalLoanDates = $("table.brand:nth-child(2) tr th:not(:first-child)");
  window.originalLoanData = makeLoanData(originalLoanAccounts, originalLoanDates);
  

  
  console.log(originalLoanData);
}

function makeLoanData(accounts, dates) {
  var loanData = { dates:[] };
  
  var loanRawData = $.merge($.merge(accounts.slice(0,3), dates), accounts.slice(3));
  console.log(loanRawData);
  
  dates.each(function(i, d){
    var dateStr = $(d).html().trim();
    loanData.dates.unshift(dateStr);
    
  });
  return loanData;
}