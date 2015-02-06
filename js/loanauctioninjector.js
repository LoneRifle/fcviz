/**
 * FCViz 
 * loanauction injector script adapted from
 * http://stackoverflow.com/questions/9263671/google-chome-application-shortcut-how-to-auto-load-javascript/9310273#9310273
 */

var s = document.createElement('link');

s.href = chrome.extension.getURL("css/fcviz.css");
s.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);
 

var scripts = [
  "js/d3.min.js",
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