//Defer the bootstrap process at the sell page so that we have a window to load in our own angular stuff.
window.name="NG_DEFER_BOOTSTRAP!"+window.name;

function resumeBootstrapAndInjectEnableShortcuts() {
  if (angular.resumeBootstrap) {
    angular.resumeBootstrap();
  }
  
  const indexOfQueryParam = window.location.href.indexOf('?query=');
  if (indexOfQueryParam != -1){
    const queryTerms = unescape(window.location.href.substring(indexOfQueryParam + 7));
    angular.element(document.querySelector("input")).val(queryTerms);
    history.replaceState( {} , null, window.location.href.substring(0, indexOfQueryParam) );
  }
  
  //Add a link that reloads the page, so that we can pick up the buttons
  var reload = angular.element(document.createElement("span"));
  reload
    .attr("class","repay_change_data")
    .html("Enable Shortcuts")
    .on("click", function() {
      const queryText = angular.element(document.querySelector("input")).val();
      if (queryText) {
        window.location.replace(window.location.href + '?query=' + queryText);
      } else {
        window.location.reload();
      }
    });
    
  angular.element(document.querySelector("p"))
    .append("&nbsp;").append(reload);
}