

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

function convertToSpan(e) {
  var advanced = e.attr("advanced");
  var span = e.replaceWith("<span>"+e.html()+"</span>").attr("advanced", advanced);
  return span;
}
