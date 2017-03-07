/**
 * FCViz 
 * Payload script for loan requests page
 */

window.myBids = {};

window.sections = {};

enrichLoanRequests();

window.currentParams = location.href;

window.history.replaceState({ params : location.href }, document.title, location.href);
window.sections[location.href] = {section: $("section"), bands: $("select#loan_request_filter_credit_band").val()};

function enrichLoanRequests() {
  var prependLinkToCell = function(){  
    var img = $(document.createElement("img"))
      .attr("src", "/images/icons/blue_plus.png")
      .attr("id", "plus");
    $(this).before(
      $(document.createElement("span")).attr("class","see_more").append(img, " ")
    )
  };
   
  $("a[href*='/loans']:not(:has(img))").each(prependLinkToCell);

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
    
  $("img[src*='/images/auction-hammer.png']")
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
  
  var makeMultiBandFilter = function(creditBandFilter) {  
    var creditOptions = creditBandFilter.find("option");
    creditBandFilter.attr("multiple","multiple").chosen()
      .on("change", function(e, params){
        //Hint - 0 is the number code for All
        var values = $(this).val();
        if (params.deselected && values == null) {
          $(this).val("0");
          $(this).trigger("chosen:updated");        
        } else if (params.selected && (
          +params.selected == 0 || values.length == creditOptions.length - 1
        )) {          
          $(this).val("0");
          $(this).trigger("chosen:updated");
        } else if (params.selected) {
          var val = +params.selected;
          var zeroPos = values.indexOf("0");
          if (zeroPos != -1) {
            values.splice(zeroPos,1);
          }
          $(this).val(values);
          $(this).trigger("chosen:updated");
        }
      });
    $("#loan_request_filter_credit_band_chosen").css(
      "width",$("#loan_request_filter_region").css("width")
    );
  };
  
  var onFilterSuccess = function( url, origParams, band, bands, bandResponses, data ) {
    bandResponses.keySet.push(band);
    bandResponses[band] = data;
    if (bandResponses.keySet.length == bands.length) {
      var sectionRaw = bandResponses[bands[0]];
      var tempSpan = $(document.createElement("span"));
      tempSpan.html(sectionRaw);
      var section = tempSpan.find("section").detach();
      if (bands.length > 1) {
        $(section).find("tr").last().detach();
      }
      var otherBands = bands.slice();
      otherBands.splice(0,1);
      $(otherBands).each(function (i, b){
        tempSpan.html(bandResponses[b]);
        var tr = tempSpan.find("section tbody tr").detach();
        if (i < otherBands.length - 1) {
          tr.splice(-1);
        }
        section.find("tbody").append(tr);
      });
      if ($("select#loan_request_filter_credit_band").val()[0] === "0") {
        section.find("tfoot strong").first().html(section.find("tbody tr").length);
      }
      
      var parent = $("section").parent();
      $("section").detach();
      parent.append(section);
      enrichLoanRequests();
      window.sections[origParams] = {section: $("section"), bands: bands};
      window.history.pushState({ params : origParams }, document.title, url);
      window.currentParams = origParams;
      //select the creditBandFilter again, and populate with the correct values
      $("select#loan_request_filter_credit_band").val(bands).trigger("chosen:updated")
      var isFxOff = $.fx.off;
      $.fx.off = true;
      showhidefilters();
      $.fx.off = isFxOff;
    }
  };

  makeMultiBandFilter($("select#loan_request_filter_credit_band"));
  
  $("form[id!=watch_form]").submit(function(){
    $("button[value=Filter]").after(" <span class=pulser>Loading...</span>");    
    var url = $(this).attr('action');
    var origParams = $(this).serialize();
    var creditBandFilter = $("select#loan_request_filter_credit_band");
    var bands = creditBandFilter.val().slice();
    var bandResponses = { keySet: [] };
    var form = $(this);
    $(bands).each(function (i, band) {
      creditBandFilter.val(band);
      var params = form.serialize();
      $.ajax({
        url     : url,
        type    : form.attr('method'),
        dataType: 'html',
        data    : params,
        success : onFilterSuccess.bind(this, url, origParams, band, bands, bandResponses),
        error   : function( xhr, err ) {
          console.log(xhr);
          alert(err + ", unable to filter. Please reload the loan requests page");     
        }
      }); 
    });
    return false;
  });
  
  $("form[id=watch_form]").submit(function(){
    $("span#watch-status").detach();
    $("button[value='Update watchlist']").before("<span id=watch-status class=pulser>Updating...&nbsp;&nbsp;</span> ");    
    var url = $(this).attr('action');
    var form = $(this);
    var params = form.serialize();
    $.ajax({
      url     : url,
      type    : form.attr('method'),
      dataType: 'html',
      data    : params,
      success : function( data ) {
        $("span#watch-status").removeAttr("class").html("Done.&nbsp;&nbsp;").animate({ opacity: 0 }, 2000);
      },
      error   : function( xhr, err ) {
        console.log(xhr);
        $("span#watch-status").removeAttr("class").html("Failure: "+err);     
      }
    }); 
    return false;
  });
  
    
  window.onpopstate = function(e){
    if(e.state && window.sections[e.state.params]){        
      var parent = $("section").parent();
      $("section").detach();
      parent.append(window.sections[e.state.params].section);
      var creditBandFilter = $("select#loan_request_filter_credit_band");
      creditBandFilter.val(window.sections[e.state.params].bands);
      creditBandFilter.trigger("chosen:updated");
      $(".pulser").detach();
      if ($("select#loan_request_filter_credit_band").val().length == 1) {
        //Fire a request to FC so that if the user decides to click
        //on the paginator the backend is correctly loaded with data.
        var form = $("form[id!=watch_form]");
        $.ajax({
          url     : "https://www.fundingcircle.com/lend/loan-requests/",
          type    : form.attr('method'),
          dataType: 'html',
          data    : form.serialize(),
          success : function( data ) {
            //Do nothing
          },
          error   : function( xhr, err ) {
            //Do nothing
          }
        }); 
      }
    }
  };
  
  $(window).on("beforeunload", function (e) {
    var message = window.sections[window.currentParams].bands.length <= 1? undefined :
      "You are reloading a page that has results across more than one risk band, " +
      "and will hence only get back only results for one of the risk bands.\n" +
      "If you want to reload the results for the risk bands, use the Filter button.";
    return message;             
  });  
} 

function createPreviewUnder(row) {
  //Create a junk element that is hidden from the user
  //so that we can somehow give the illusion of maintaining
  //the table row background colors.
  var filler = $(document.createElement("tr"))
    .attr("class", "filler")
    .attr("id", "filler-"+row.attr("id"));
  filler.attr("style", "display: none;");
  
  var id = row.attr("id") || row.children().first().attr("id");
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
  
  var href = row.find("a").first().attr("href");
  
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
  
  var propDetailsStartIndex = data.indexOf("<div class='span3'>\n<h3>");
  var propLoanDetails = $(document.createElement("span"))
    .html(data.substring(propDetailsStartIndex, data.indexOf("</div>", propDetailsStartIndex)))
    .find("dl");
  if (data.indexOf("Loan to value ratio") != -1) {
    propLoanDetails.children().slice(0,6).detach();
  }
  propLoanDetails.find("sup").detach();
  previewPaneLeft.append(propLoanDetails);
  
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