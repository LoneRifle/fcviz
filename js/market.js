$(".risk-bands li").each(function() { 
  $(this).attr("active", $(this).find("input[type=checkbox]").is(":checked"));
});
$(".risk-bands li label").click(function() {
  $(this).parent().attr("active", $(this).parent().attr("active") === "false")
});