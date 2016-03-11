//Defer the bootstrap process at the sell page so that we have a window to load in our own angular stuff.
window.name="NG_DEFER_BOOTSTRAP!"+window.name;

function resumeBootstrapAndInjectEnableShortcuts() {
  if (angular.resumeBootstrap) {
    angular.resumeBootstrap();
  }

  //Add a link that reloads the page, so that we can pick up the buttons
  var reload = angular.element(document.createElement("span"));
  reload.attr("class","repay_change_data")
    .html("Enable Shortcuts")
    .on("click", function(){location.reload();});
  angular.element(document.querySelector("p"))
    .append("&nbsp;").append(reload);
}