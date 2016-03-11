function addMultiCheckToAngularModule(module) {
  module.directive("input", function($compile){
    return {
      restrict: 'E',
      link: function(scope, el, attrs) {
        if (el.attr("type") === 'checkbox') {
          el.attr("multi-check", "");
          el.bind('click', function(event) {
            var chkboxes = Array.prototype.slice.call(document.querySelectorAll("[multi-check]"));
            var last = window.lastChecked;
            if (last && event.shiftKey) {
                var start = chkboxes.indexOf(event.target),
                    end = chkboxes.indexOf(last),
                    checked = last.checked;

                angular.forEach(chkboxes.slice(Math.min(start, end), Math.max(start, end) + 1), function(box) {
                    var model = angular.element(box).data('$ngModelController');
                    model.$setViewValue(checked);
                    model.$render();
                });
            }
            window.lastChecked = event.target;
          });
        }
      }
    }
  });

}

function addMultiCheckHint() {
  var hint = angular.element(document.createElement("div"));
  hint.html("When shortcuts enabled, hold shift and check two checkboxes to check everything between them.");
  angular.element(document.querySelector("p"))
    .append(hint);
}