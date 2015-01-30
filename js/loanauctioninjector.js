/**
 * FCViz 
 * loanauction injector script adapted from
 * http://stackoverflow.com/questions/9263671/google-chome-application-shortcut-how-to-auto-load-javascript/9310273#9310273
 */
 
var scripts = [
  "table-to-svg/js/d3.min.js",
  "table-to-svg/js/tableToSVG.js",
  "js/loanauction.js"
];

scripts.forEach(function (entry) {
  var s = document.createElement('script');

  s.src = chrome.extension.getURL(entry);
  s.onload = function() {
      this.parentNode.removeChild(this);
  };
  (document.head||document.documentElement).appendChild(s);
});