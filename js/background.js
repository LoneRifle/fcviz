//Add webRequest listeners that will fire from urls anchored with #fcviz
//Manipulate the header so that we can embed the data.
//chrome.webRequest doesn't seem to take to kindly to anchored urls,
//so filter them manually here.
chrome.webRequest.onHeadersReceived.addListener(
  ({url, responseHeaders}) => {
    if (url.endsWith("#fcviz")) {
      responseHeaders.forEach((d) => {
        if (d.name === "Content-Disposition") {
          d.value = d.value.replace("attachment","inline")
        } else if (d.name === "Content-Type") {
          d.value = "application/pdf"
        }
        return d
      })
    }
    return { responseHeaders }
  },
  { urls: ["https://www.fundingcircle.com/loans/*/documents/*"] },
  ["blocking", "responseHeaders"]
)

chrome.webRequest.onBeforeRequest.addListener(
  () => ({ cancel: true }),
  { urls: [
    "https://wa.fundingcircle.com/dc.min.js",
    "https://d2ondqc76inyu3.cloudfront.net/shared_assets/js/shared_assets.js",
  ] },
  ["blocking"]
)