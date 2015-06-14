/**
 * FCViz 
 * injector script adapted from
 * http://stackoverflow.com/questions/9263671/google-chome-application-shortcut-how-to-auto-load-javascript/9310273#9310273
 */

 
function load(resources) {
  loadAtTarget(resources, (document.head||document.documentElement));
}

function loadAtTarget(resources, targetNode) {
  resources.css.forEach(function (css){
    var s = document.createElement('link');
    s.href = chrome.extension.getURL(css);
    s.onload = function() {
        this.parentNode.removeChild(this);
    };
    targetNode.appendChild(s);   
   });
 
  var load = chainLoad(resources.js, targetNode);

  load();
}

function chainLoad(resources, targetNode) {
  return inject(targetNode, resources[0], resources.length > 1? chainLoad(resources.slice(1), targetNode) : null);
}

function inject(targetNode, resource, onload) {
  return function() {
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(resource);
    s.onload = onload;
    targetNode.appendChild(s);
  };
}