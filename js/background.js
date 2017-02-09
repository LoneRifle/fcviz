//Add webRequest listeners that will fire from urls anchored with #fcviz
//Manipulate the header so that we can embed the data.
//chrome.webRequest doesn't seem to take to kindly to anchored urls,
//so filter them manually here.
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    if (details.url.endsWith("#fcviz")) {
      details.responseHeaders.forEach(function(d){
        if (d.name === "Content-Disposition") {
          d.value = d.value.replace("attachment","inline");
        } else if (d.name === "Content-Type") {
          d.value = "application/pdf";
        }
        return d;
      });
      console.log(details.responseHeaders);
    }
    return {
      responseHeaders: details.responseHeaders
    };
  },
  { urls: ["https://www.fundingcircle.com/loans/*/documents/*"] },
  ["blocking", "responseHeaders"]
);