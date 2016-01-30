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

//Move advanced checkboxes
rearrangeCheckboxes();

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
  guarantees.find("label.group").html("Guarantees/Security")
  $(".loan-part-filters .form").append(guarantees);
  
  $("#loan_part_paginator_asset_secured").before($("#loan_part_paginator_personal_guarantee").parent().detach());
  
  var excludeFunded = $("#exclude-funded-filter").children().detach();
  $("#exclude-funded-filter").append(document.createElement("p"));
  $("#exclude-funded-filter p").append(excludeFunded);
  $("#exclude-funded-filter").append($("#loan_part_paginator_show_watched_loans").parent().detach());
  
}
