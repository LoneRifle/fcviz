/**
 * FCViz 
 * requests injector script adapted from
 * http://stackoverflow.com/questions/9263671/google-chome-application-shortcut-how-to-auto-load-javascript/9310273#9310273
 */

var s = document.createElement('link');

s.href = chrome.extension.getURL("css/fcviz.css");
s.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);

var load = chainLoad(["js/d3.min.js", "js/loanauction.js", "js/requests.js"]);

load();

function chainLoad(resources) {
  return inject(resources[0], resources.length > 1? chainLoad(resources.slice(1)) : null);
}

function inject(resource, onload) {
  return function() {
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(resource);
    s.onload = onload;
    (document.head||document.documentElement).appendChild(s);
  };
}
