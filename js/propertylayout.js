window.triggerPropertyLayout = function (id) {
  var investorReportLink = $("a.blueText:contains(Investor Report)");
  var otherLinks = $("a.blueText:not(:contains(Investor Report))");
  //Property loans usually have one hyperlink labelled as Investor Report
  if (investorReportLink.length > 0) {
    var reportHeading = $("#financial_summary .top_margin h2").first();
    reportHeading.html("Investor Report ");
    reportHeading.next().detach();
    var href = investorReportLink.attr("href");
    var investorReport = $(document.createElement("iframe"))
      .attr("src", href + "#fcviz")
      .attr("style", "width: 100%; height: 450px")
    investorReportLink.detach().html("Download");
    reportHeading.append(investorReportLink," ",otherLinks).after(investorReport);
    investorReport.append($(document.createElement("p")).html("It appears that your browser somehow does not support iframes"));
    //Cleanup unwanted divs
    $("#financial_summary div.row h2").first().parent("div").detach();
    var payPerf = $("#financial_summary .top_margin h2").last();
    payPerf.next().detach();
    payPerf.detach();
  }
}