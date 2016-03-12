window.triggerConsolidateAccountsWidgets = function (id) {
  var investorReportLink = $("a.blueText:contains(Investor )");
  //If there is an investor report, this is likely to be a property loan. return early.
  if (investorReportLink.length > 0) {
    return;
  }
  
  window.originalLoanAccounts = $("table.brand:nth-child(2) tr td:not(:first-child)");
  window.originalLoanDates = $("table.brand:nth-child(2) tr th:not(:first-child)");
  console.log(originalLoanAccounts);
}