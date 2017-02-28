/**
 * FCViz 
 * Payload script for loan part pages
 */
 
//Tag all advanced controls
$(".advanced-filters li").attr("advanced", true);

//Hide risk band checkboxes and use labels for selection
$(".risk-bands li").each(function() { 
  $(this).attr("active", $(this).find("input[type=checkbox]").is(":checked"));
});
$(".risk-bands li label").click(function() {
  $(this).parent().attr("active", $(this).parent().attr("active") === "false")
});

//Rework the layout of the first form
rearrangeKeywordPriceControls();

//Move sector and region filters
$(".loan-part-filters .form").append($("[class*=filter-business-]").detach());
$(".filter-business-sector").removeClass("m1-m3").addClass("m1-m2");
$(".filter-business-region").removeClass("m4-m5").addClass("m3");

makeExposureSelector();

rearrangeCheckboxes();

recreateShowHideAdvancedLinks();

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
window.fcVizObserver = (predicate, callback) =>
  new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0 && predicate(mutation)) {
        callback(mutation.addedNodes[0]);
      }
    })
  });


var isFinancialSummaryPage = mutation => mutation.addedNodes[0].id === "financial-summary";
window.fcVizObserver(isFinancialSummaryPage, triggerPropertyLayoutForSecondaryMarket)
  .observe(document, { childList: true, subtree: true });
  
var tooltip = $(document.createElement("div"))
    .attr("class", "tooltip")      
    .css("background-color", "#F2F2F2")
    .css("position", "absolute")    
    .css("opacity", 0);

$("body").append(tooltip);
  
var isLoanPartTable = mutation => $(mutation.addedNodes[0]).hasClass("loan-parts") ||
  $(mutation.addedNodes[0]).find("table").hasClass("loan-parts");
var addRepaymentInfoToLoanPartEntries = loanPartTable => {
  var loanPartRepayEntries = $(loanPartTable).find("td.repayments");
  loanPartRepayEntries.each((i, el) => {
    var url = $(el).parent().find("a").attr("href") + "?section=repayments";
    var icon = $(document.createElement("img"))
      .attr("src", "https://d2ondqc76inyu3.cloudfront.net/images/help/help_grey.png")
      .on("mouseover", e => {
        tooltip.html("Loading from " + url + "...")
          .css("left", (e.pageX + 28) + "px")     
          .css("top", (e.pageY) + "px")
          .animate({"opacity": 0.9}, {"duration": 200});
        $.get(url, function(response){
          var section = $(response).find("section")
            .css("width", "100%")
            .css("height", "100%")
            .css("margin-right", 0).detach();
          section
            .find("li").each((i, el) => {
              $(el).css("margin-left", "36px");
            })
            .find("p").each((i, el) =>{
              $(el).html(" " + $(el).prev("h4").html() + " " + $(el).html())
                .css("margin-left", "18px");
              $(el).prev("h4").detach();
            });
          tooltip.html(section);
          tooltip.find("img").detach();
        });
      })      
      .on("mouseout", e => tooltip.animate({"opacity": 0}, {"duration": 500}));    
    $(el).append(icon);
  });
};
window.fcVizObserver(isLoanPartTable, addRepaymentInfoToLoanPartEntries)
  .observe(document, { childList: true, subtree: true });
  
var markAuctionAsVisitedOnClick = loanPartTable => {
  $(loanPartTable).find("a")
                  .on("click", e => {
                    var currentUrl = window.location.href;
                    window.history.replaceState({}, "", $(e.target).attr("href"));
                    window.history.replaceState({}, "", currentUrl);
                  });
};
window.fcVizObserver(isLoanPartTable, markAuctionAsVisitedOnClick)
  .observe(document, { childList: true, subtree: true });

  
addRepaymentInfoToLoanPartEntries($("table.loan-parts"));
markAuctionAsVisitedOnClick($("table.loan-parts"));
  
  
function rearrangeKeywordPriceControls() {
  var keywordPriceContainer = $(document.createElement("li"));
  keywordPriceContainer.addClass("m1-m3");
  $(".loan-part-filters .m1-m2").before(keywordPriceContainer);
  
  var targets = [
    ["keywords", "loan-part", "m1-m2", "m1"], 
    ["price", "loan-part", "m3", "m2"], 
    ["premium", "advanced", "m6-m8", "m3"]
  ];
  
  $(targets).each(function(index,args){
    var target = $("." + args[1] + "-filters ." + args[2]).detach();
    target.removeClass(args[2]).addClass(args[0]);
    keywordPriceContainer.append(target);
  });  
}

function rearrangeCheckboxes() {
  var guarantees = $(".advanced-filters .m4-m5").detach().removeClass("m4-m5").addClass("m5-m6");
  guarantees.find("label.group").html("Guarantees/Security");
  $(".loan-part-filters .form").append(guarantees);
  
  $("#loan_part_paginator_asset_secured").before($("#loan_part_paginator_personal_guarantee").parent().detach());
  
  var excludeFunded = $("#exclude-funded-filter").children().detach();
  $("#exclude-funded-filter").append(document.createElement("p"));
  $("#exclude-funded-filter p").append(excludeFunded);
  $("#exclude-funded-filter").append(
    $("#loan_part_paginator_show_watched_loans").parent().attr("advanced",true).detach());
}

function makeExposureSelector() {
  var exposure = $(".advanced-filters .m1-m3").detach().removeClass("m1-m3")
    .addClass("m4 my-exposure");
  exposure.find("label.group").html("My Exposure");
  $(".loan-part-filters .form").append(exposure);
  $("label[for*=show_loans_funded]").html("Yes");
  $("label[for*=exclude_loans_funded]").html("No");
  
  var bothContainer = $(document.createElement("p"));
  var bothInput = $(document.createElement("input")).attr("type","checkbox");
  var bothLabel = $(document.createElement("label"))
    .addClass("check-radio").attr("for","both_loans_funded").html("Both");
  bothContainer.append(bothInput).append(bothLabel);
  
  exposure.append(bothContainer);
  
  //Set label conditions based on state of checkboxes
  var bothCondition = true;
  $("label[for*=show_loans_funded], label[for*=exclude_loans_funded]").each(function() { 
    var isChecked = $(this).prev("input[type=checkbox]").is(":checked");
    $(this).attr("active", isChecked);
    bothCondition = bothCondition && !isChecked;
  });
  
  bothLabel.attr("active", bothCondition);
  bothInput.prop("checked", bothCondition);
  
  //Wire the click handlers for the labels to change cosmetic state
  $("label[for*=loans_funded]").click(function() {
    $("label[for*=loans_funded]").each(function() { 
      $(this).attr("active", false);
      $(this).prev("input[type=checkbox]").prop("checked", false);
    });
    $(this).attr("active", $(this).attr("active") === "false");
    if ($(this).attr("for") === bothLabel.attr("for")) {
      fc.secondaryMarket.submitFilters();
    }
  });
  
}

function recreateShowHideAdvancedLinks() {
  var displayStateHref = $(".hidden").attr("href");
  if (displayStateHref === "#show-advanced-filters") {
    $("[advanced=true]").show();
  } else {
    $("[advanced=true]").hide();
  }

  $("[href=#show-advanced-filters]").removeClass("icon").click(function() {
    $("[advanced=true]").show();
  });

  $("[href=#hide-advanced-filters]").removeClass("down-icon").click(function() {
    $("[advanced=true]").hide();
  });

  $(".advanced-filters").detach();
}