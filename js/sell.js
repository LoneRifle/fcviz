/**
 * FCViz 
 * Payload script for the individual loan iframe within the Sell page
 */
var app = angular.element(document.querySelector("div"));
var $scope = app.scope();
var SellableLoanParts = app.injector().get("SellableLoanParts");
 
$scope.findLoanPartFrom = function (event) {
  var loanPartId = +event.srcElement.parentElement.parentElement.children[0].innerHTML;
  var loanPart = null;
  $scope.loanParts.forEach(function(l){
    if (loanPartId === l.id) {
      loanPart = l;
    }
  });
  return loanPart;
}

$scope.clearSaleInfo = function (loanPart) {  
  loanPart.markup = "0.0";
  loanPart.buyer_rate = loanPart.default_buyer_rate;
  loanPart.sale_price = loanPart.default_sale_price;
  loanPart.sellable = true;
  $scope.totals = SellableLoanParts.toBeSoldTotals($scope.loanPartsToBeSold);
}
 
$scope.updateSaleInfoAll = function (loanPart) {  

  function removeFromArray(arr, e) {
    var index = arr.indexOf(e);
    if (index != -1) {
      arr.splice(index, 1);
    } 
  }
  
  function makeDroppedText(dropped) {
    var msg = "The following loan parts were deselected because\n" +
              "the premium of " + premium + "% is too high,\n" + 
              "making the buyer rate below " + minBuyerRate + "%:\n\n";
    angular.forEach(dropped, function(d){
      msg += d.id + " " + d.loan_title + ": " + d.buyer_rate + "%\n";
    });
    return msg;
  }
  
  var dropped = [], toQuery = [], minBuyerRate = 0, premium = loanPart.markup;
  var callback = function (thisPart, response){
    thisPart.sale_price = response.data.sale_price;
    thisPart.buyer_rate = response.data.buyer_rate;
    thisPart.markup = premium;
    if (minBuyerRate < response.data.meta.min_buyer_rate) {
      minBuyerRate = response.data.meta.min_buyer_rate;
    }
    if (thisPart.buyer_rate < minBuyerRate) {
      thisPart.sell = false;
      thisPart.sellable = false;
      removeFromArray($scope.loanPartsToBeSold, thisPart);
      dropped.push(thisPart);
    }
    
    removeFromArray(toQuery, thisPart);
    if (toQuery.length == 0) {
      $scope.totals = SellableLoanParts.toBeSoldTotals($scope.loanPartsToBeSold);
      if (dropped.length > 0) {
        window.alert(makeDroppedText(dropped));
      }
    }
  };
  
  angular.forEach($scope.loanParts, function(thisPart){
    if ($scope.loanPartsToBeSold.indexOf(thisPart) != -1 && thisPart.id !== loanPart.id) {
      toQuery.push(thisPart);
      SellableLoanParts.getSaleInfo(thisPart.id, premium).then(callback.bind(this, thisPart));
    }
  });
}

var $compile = app.injector().get("$compile");

var addButtons = function() {
var markups = document.querySelectorAll("select.markup");
  Array.prototype.slice.call(markups).forEach(function(markup){
    //Grab the loan part id, coercing it into an int, and look it up.
    var updateSaleInfoAll = "updateSaleInfoAll(findLoanPartFrom($event))";
    var clearSaleInfo = "clearSaleInfo(findLoanPartFrom($event))";
    angular.element(markup.parentElement)
      .prepend($compile("<span class='markup_all' ng-click='"+clearSaleInfo+"'>○ </span> ")($scope))
      .append($compile("<span class='markup_all' ng-click='"+updateSaleInfoAll+"'> ●</span>")($scope));
  });
};

addButtons();