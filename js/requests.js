/**
 * FCViz 
 * Payload script for loan requests page
 */
 
//We don't need this mutation observer since we are in the requests page
window.fcVizObserver.disconnect();

window.myBids = {};

var prependLinkToCell = function(){  
  var img = $(document.createElement("img"))
    .attr("src", "/images/icons/blue_plus.png")
    .attr("id", "plus");
  $(this).before(
    $(document.createElement("span")).attr("class","see_more").append(img, " ")
  )
};
 
$("a.mediumText").each(prependLinkToCell);

$(".see_more").on("click", function(){
  var isPlus = $(this).find("img#plus").length == 1;
  var sign = isPlus? "minus" : "plus";
  var img = $(document.createElement("img"))
    .attr("src", "/images/icons/blue_"+sign+".png")
    .attr("id", sign );
  $(this).children().detach();
  $(this).append(img, " ");
  var tr = $(this).closest("tr");
  if (tr.next().attr("class") !== "filler") {
    createPreviewUnder(tr);
    tr.next().next().animate({height: "toggle"}, "fast");
  } else {
    tr.next().next().attr("style", "display: "+(isPlus? "table-row" : "none"));
  }
});

var div = d3.select("body").append("div")   
  .attr("class", "tooltip")               
  .style("opacity", 0);

var auctionOnClick = function() {
  var href = $(this).parent().find("a").attr("href") + "/my_bids";
  var id = /\d+/.exec(href)[0];
  if (!myBids[id]) {
    var amt = $(this).parent().parent().find("td:nth-child(4)");
    $.get(href, addBidToAmount.bind(amt,id)).fail(function(jqXHR, textStatus, errorThrown) {
      console.log("Failed to retrieve "+href+", not showing bids: "+errorThrown);
    });
  }
};
  
$("img[src='/images/auction-hammer.png']")
  .on("click", function(){
    auctionOnClick.call(this);
    $(this).off("click");
  })
  .on("mouseover", function(e){ 
    var href = $(this).parent().find("a").attr("href") + "/my_bids";
    var id = /\d+/.exec(href)[0];
    $("div.tooltip").animate({ opacity: .9 }, 100)
      .attr("style", "left:"+ (e.pageX) + "px; top:"+ (e.pageY - 28) + "px")
      .html(myBids[id]? myBids[id] : "Click to show my bids");
   })
  .on("mouseout", function(d){ 
    $("div.tooltip").animate({ opacity: 0 }, 100);    
  });

if ($("img[src='/images/auction-hammer.png']").length > 0) {
  $("a:contains('Loan Title')").after(" ",
    $(document.createElement("img"))
      .attr("src","/images/auction-hammer.png")
      .on("click", function(){
        $("td img[src='/images/auction-hammer.png']").each(auctionOnClick);
        $(this).off("click");
      })
      .on("mouseover", function(e){ 
        $("div.tooltip").animate({ opacity: .9 }, 100)
          .attr("style", "left:"+ (e.pageX) + "px; top:"+ (e.pageY - 28) + "px")
          .html("Click to show all my bids");
      })
      .on("mouseout", function(d){ 
        $("div.tooltip").animate({ opacity: 0 }, 100);    
      })
  );
}
  
function createPreviewUnder(row) {
  //Create a junk element that is hidden from the user
  //so that we can somehow give the illusion of maintaining
  //the table row background colors.
  var filler = $(document.createElement("tr"))
    .attr("class", "filler")
    .attr("id", "filler-"+row.attr("id"));
  filler.attr("style", "display: none;");
  
  var id = row.attr("id");
  if (!id) {
    id = /\d+/.exec(row.find("span.greyText").html())[0];
    row.attr("id",id);
  }
  
  var computeWidth = function (cell) {
    var width = cell.width();
    cell.attr("style", "width:"+width+"px");
    width += (+/\d+/.exec(cell.css("padding-left"))[0]) + (+/\d+/.exec(cell.css("padding-right"))[0]);
    return width;
  }
  
  var width = row.width();
  width -= computeWidth(row.children().first());
  width -= computeWidth(row.children().first().next());
  width -= 7; //padding from the right pane cell
  
  window.summaryVizDimensions.width = row.width() - width - 20;
  
  var tdLeft = $(document.createElement("td"))
    .attr("colspan", 2)
    .attr("id", "preview-"+id+"-pane-left")
    .html("Loading...");
  
  var tdRight = $(document.createElement("td"))
    .attr("colspan", 7)
    .attr("class", "scroll-box")
    .attr("style", "position: absolute; width: "+width+"px; height: 250px; padding: 0px 0px 0px 7px")
    .attr("id", "preview-"+id+"-pane-right");
  
  var href = row.find("a.mediumText").attr("href");
  
  var totalStr = row.find("td").eq(3).html().replace("£","").replace(",","");  
  var total = +/\d+/.exec(totalStr)[0];
  
  $.get(href, window.populatePreview.bind(window, tdLeft, tdRight, id, total)).fail(function(jqXHR, textStatus, errorThrown) {
    $(tdLeft).html("Failed to retrieve "+href+", chart render aborted: "+errorThrown);
  });
  
  var preview = $(document.createElement("tr"))
    .attr("class", "preview")
    .attr("id", "preview-"+id);
    
  preview.append(tdLeft, tdRight);
  preview.attr("style", "display: none;");
  row.after(filler,preview);
}

window.summaryVizDimensions = {
  height: 65,
  width: 300,
  margin: {top: 2, right: 10, bottom: 10, left: 10}
};

window.populatePreview = function (previewPaneLeft, previewPaneRight, origId, total, data){
  var id = "preview-"+origId;
  previewPaneLeft.html("");
  var detailsStartIndex = data.indexOf("<div class='span5'>\n<h3>");
  var dd = $(document.createElement("span"))
    .html(data.substring(detailsStartIndex, data.indexOf("</div>", detailsStartIndex)))
    .find("dd");
  var info = [];
  info = info.concat(dd.first(), dd.eq(dd.length - 2), dd.last());
  var title = [];
  $(info).each(function(){title.push($(this).html().trim())});
  indicateMoreThan = /more than/.test(title[2])? ">" : "";
  var previewDetails = $(document.createElement("span"))
    .attr("id", id+"-details")
    .append(title[0]).append(document.createElement("br"))
    .append(title[1] + ", " + indicateMoreThan + (/\d+/.exec(title[2])[0]) + " years");
  previewPaneLeft.append(previewDetails);
  
  if ($("#"+origId).html().indexOf("Fixed Rate") == -1) {
    var dataTableStartIndex = data.indexOf("<table class='brand'>");
    previewPaneLeft.append(data.substring(dataTableStartIndex, data.indexOf("</table>", dataTableStartIndex)) + "</table>");
    previewPaneLeft.find("table").attr("style", "display: none");
  
    window.renderBidSummaryCharts(total, "#"+previewPaneLeft.attr("id"), id+"-bids");
    $("#"+id).find("svg").find("g.tick").attr("style", "display: none;");
    $("#"+id).find("svg").find("g").find("text").attr("style", "display: none;");
    previewPaneLeft.find("table").detach(); 
  } else {
    var propDetailsStartIndex = data.indexOf("<div class='span3'>\n<h3>");
    var propLoanDetails = $(document.createElement("span"))
      .html(data.substring(propDetailsStartIndex, data.indexOf("</div>", propDetailsStartIndex)))
      .find("dl");
    propLoanDetails.children().slice(0,8).detach();
    propLoanDetails.find("sup").detach();
    previewPaneLeft.append(propLoanDetails);
  }
  
  if ($("#"+origId).html().indexOf("Property Development") == -1) {
    if (title[1] === "Limited Company") {
      var chartGenStart = data.indexOf("if (have_chart_data)");
      var chartGenString = data.substring(chartGenStart, data.indexOf("loaded", chartGenStart));
      previewPaneRight.append(
        $(document.createElement("span")).attr("id", id+"-credit-history-chart"),
        $(document.createElement("span")).attr("id", id+"-relative-score-chart")
      );
      var chartWidth = 0.48 * previewPaneRight.width();
      chartGenString = chartGenString.replace("credit-history-chart",id+"-credit-history-chart");
      chartGenString = chartGenString.replace("relative-score-chart",id+"-relative-score-chart");
      chartGenString = chartGenString.replace(/width: 440/g,"width: "+chartWidth);
      chartGenString = chartGenString.replace(/height: 320/g,"height: 160");
      var have_chart_data = true;
      eval(chartGenString);
      var text = previewPaneRight.find("text");
      d3.selectAll(text).style("font-family","myriad-pro,Helvetica,sans-serif");
    } else {
      var nonLimitedTable = data.substring(
        data.indexOf("<table id='non-limited-history'>"), data.indexOf("<div id='non-limited-history-info'>")
      );
      previewPaneRight.append(nonLimitedTable);
      previewPaneRight.find("#non-limited-history").attr("style","margin-bottom: 0px; width:200px; float: right;");
      previewPaneRight.find("#non-limited-history").find("th.history-label").html("Date");
    }
  } 
  var profileIndex = data.indexOf("<div class='span8'>");
  var profile = data.substring(
    data.indexOf("<div class='span8'>"), data.indexOf("</div>", profileIndex)
  ) + "</div>";
  previewPaneRight.append(profile);
  previewPaneRight.find(".span8").attr("style", "float: none;");
  previewPaneRight.find("h3").attr("style","text-align: left; font-size: 14px");
  previewPaneRight.find("p").attr("style","line-height: auto; font-size: 14px");
}

window.addBidToAmount = function (id, data) {
  $("div.tooltip").html(data);
  var totalExposure = 0, totalRejects = 0;
  var bids = $("div.scroll-box").css("height","auto").find("tr").each(function(){
    $(this).find("td:nth-child(2)").detach();
    $(this).find("th:nth-child(2)").detach();
    var bid = +$(this).attr("data-amount");
    if ($(this).attr("data-status") === "live") {
      totalExposure += bid;
    } else {
      totalRejects += bid;
    }
  });
  var bidTable = $("div.scroll-box");
  window.myBids[id] = bidTable;
  $(this).html($(this).html() + "<br/><span class=live-bid>£" + window.commaSeparator(totalExposure)+"</span>");
  if (totalRejects > 0) {
    $(this).html($(this).html() + "<br/><span class=rejected-bid>£" + window.commaSeparator(totalRejects)+"</span>");
  }
}