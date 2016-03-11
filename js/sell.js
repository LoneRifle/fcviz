/**
 * FCViz 
 * Payload script for the individual loan iframe within the Sell page
 */

window.lastChecked = null;
 
var sellLoanParts = angular.module("SellLoanParts")
  .directive("markup", function($compile){
    return {
      restrict: 'C',
      link: function(scope, markup, attrs) {
        //Grab the loan part id, coercing it into an int, and look it up.
        var updateSaleInfoAll = "updateSaleInfoAll(findLoanPartFrom($event))";
        var clearSaleInfo = "clearSaleInfo(findLoanPartFrom($event))";
        markup.parent()
          .prepend($compile("<span class='markup_all' ng-click='"+clearSaleInfo+"'>○ </span> ")(scope))
          .append($compile("<span class='markup_all' ng-click='"+updateSaleInfoAll+"'> ●</span>")(scope));        
      }
    }
  });

addMultiCheckToAngularModule(sellLoanParts);
  
resumeBootstrapAndInjectEnableShortcuts();

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

//Wrap the Sell Loan Parts click handler with our own, inspecting
//the loan parts to ensure that everything is either at a premium, or 
var confirmSell = $scope.open;

$scope.open = function () {
  var hasPremium = false;
  var atParOrDiscount = [];
  angular.forEach($scope.loanPartsToBeSold, function(thisPart){
    if (+thisPart.markup > 0) {
      hasPremium = true;
    } else {
      atParOrDiscount.push(thisPart);
    }
  });
  
  var makeMessageFor = function (atParOrDiscount) {
    var msg = "You are selling some parts at a premium, and some at par or discount.\nDo you want to sell these without premium?\n";
    angular.forEach(atParOrDiscount, function(d){
      msg += d.id + " " + d.loan_title + ": " + d.markup + "%\n";
    });
    return msg;
  }
  
  var hasDifferentMarkups = hasPremium && atParOrDiscount.length > 0;
  if (!hasDifferentMarkups || (hasDifferentMarkups && confirm(makeMessageFor(atParOrDiscount)))) {
    confirmSell();
  }
}
