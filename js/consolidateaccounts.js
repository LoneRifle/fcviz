window.triggerConsolidateAccountsWidgets = function (id) {
  var investorReportLink = $("a.blueText:contains(Investor )");
  //If there is an investor report, this is likely to be a property loan. return early.
  if (investorReportLink.length > 0) {
    return;
  }
  
  window.accountsByLoanId = { ids:[] };  
  window.thisLoanId = getLoanIdFromUrl(window.location.href);
  
  addAccounts(thisLoanId, $("#financial_summary").parent());
  
  console.log(window.accountsByLoanId);
}

function addAccounts(loanId, financials) {
  var loanAccounts = financials.find("#financial_summary table.brand:nth-child(2) tr td:not(:first-child)");
  var loanDates = financials.find("#financial_summary table.brand:nth-child(2) tr th:not(:first-child)");
  window.accountsByLoanId[loanId] = $(makeLoanData(loanAccounts, loanDates)).attr("loanid", loanId);
  window.accountsByLoanId.ids.push(loanId);
  return window.accountsByLoanId[loanId];
}

function makeLoanData(accounts, dates) {
  return $.merge($.merge(accounts.slice(0,3), dates), accounts.slice(3));
}

function getLoanIdFromUrl(url) {
  return url.match("\\d+")[0];
}
