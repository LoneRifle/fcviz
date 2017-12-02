/**
 * FCViz 
 * Payload script for summary page - portfolio summary graph
 */
 
// Portfolio Summary Rendering ------------------------------------------------
function calculateNewTotals() {
  return $('.portfolio-component.clicked')
    .map((i, e) => +$(e).html())
    .toArray()
    .reduce((x, y) => x + y, 0)
    .toFixed(2)
}

function renderEarningsGraph(data) {
  $('#my-loan-parts').before(
    $(document.createElement('div'))
      .attr('class', 'row')
      .append(
        $(document.createElement('div'))
          .attr('id', 'portfolio_summary')
          .attr('class', 'span16 white border pad')
      )
  );
  $('#portfolio_summary').append(
    $(document.createElement('h3')).html('Portfolio Summary').css('margin-bottom', 0)
  );

  const margin = +$('#portfolio_summary').css('padding').replace('px','');
  const width = +$('#portfolio_summary').css('width').replace('px','') - (margin * 3);
  const height = 250;

  var chart = d3.select('#portfolio_summary')
    .append('svg')
      .attr('id', 'portfolio_summary_graph')
      .attr('width', width)
      .attr('height', height + margin * 4);

  const clearSelectedTotals = $(document.createElement('span'))
    .html('clear')
    .attr('class', 'select-portfolio-totals')
    .click(event => {
      $('.portfolio-component').toArray()
        .filter(textEl => $(textEl).attr('class').endsWith(' clicked'))
        .forEach(textEl => $(textEl).attr('class', $(textEl).attr('class').replace(' clicked', '')))
      $('#selected-totals').html(calculateNewTotals())
    })

  const selectSlice = (t, startIndex, endIndex) => $(document.createElement('span'))
    .html(t)
    .attr('class', 'select-portfolio-totals')
    .click(event => {
      $('.portfolio-component').toArray().slice(startIndex, endIndex)
        .filter(textEl => !$(textEl).attr('class').endsWith(' clicked'))
        .forEach(textEl => $(textEl).attr('class', $(textEl).attr('class') + ' clicked', ''))
      $('#selected-totals').html(calculateNewTotals())
    })

  const selectEarnings = selectSlice('earnings', 1, 5)
  const selectLosses = selectSlice('losses', 6, 8)
  const selectNetEarnings = selectSlice('net-earnings', 1, 8)

  const totalsSelectors = $(document.createElement('div'))
    .css('text-align', 'center')
    .append(selectEarnings, ' ', selectLosses, ' ', selectNetEarnings)
    
  const selectedTotals = $(document.createElement('div'))
    .css('text-align', 'center')
    .html('Selected Totals: ')
    .append($(document.createElement('span')).attr('id', 'selected-totals').html('0.00'))
    .append(' ', clearSelectedTotals)

  const summaryHeadline = $(document.createElement('h4')).html('Yields - ').css('text-align', 'center');
  summaryHeadline.append(' Gross: ', $(window.headlineYields).eq(0).children());
  summaryHeadline.append(', after fees and bad debts - ');
  summaryHeadline.append(' Annualised: ', $(window.headlineYields).eq(1).children());
  summaryHeadline.append(' Estimated Fully Diversified: ', $(window.headlineYields).eq(2).children());

  $('#portfolio_summary').append(totalsSelectors, selectedTotals, summaryHeadline);

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width - margin * 3], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom');
      
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .tickFormat(d => d3.formatPrefix(d / 100000, 3).scale(d / 100000));

  const labels = [
    'deposits', 
    'sales', 'purchases', 'promotions',
    // 'depositsAndLegacyItems',
    'interest',
    // 'pvBeforeDefaultsAndFees',
    'fees',
    // 'pvBeforeDefaults',
    'defaults', 'recoveries',
    // 'pv',
    'lent', 'bid', 'available', 'accrued'
  ];
  const portfolioLabels = ['lent', 'bid', 'available'];
  const displayLabels = labels.filter(l => !portfolioLabels.includes(l))
  displayLabels.splice(-1, 0, 'portfolio')
  x.domain(displayLabels);
  y.domain([0, data.pvBeforeDefaultsAndFees]);

  chart.append("g")      
    .attr("class", "x axis")
    .attr("transform", `translate(${margin * 3},${height + margin * 0.5})`)
    .call(xAxis);

  chart.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${margin * 3},${margin * 0.5})`)
    .call(yAxis)    
  .append("text")
    .attr("transform", "translate(10,-20)")
    .attr("dy", ".71em")
    .style("text-anchor", "end");

  const incrementalItems = [
    'sales', 'purchases', 'promotions',
    'interest',
    'fees',
    'defaults', 'recoveries',
    'lent', 'bid'
  ]
  
  const nonIncrementalItems = labels.filter(l => !incrementalItems.includes(l));

  const incrementalY = d => {
    var labelIndex = labels.indexOf(d[0]);
    var y = Math.max(d[1], 0);
    while (incrementalItems.includes(labels[labelIndex])) {
      --labelIndex;
      y += data[labels[labelIndex]];
    }
    return y;
  };

  chart.selectAll("rect")
    .data(Object.entries(data).filter(([label]) => labels.includes(label)))
  .enter().append("rect")
    .attr("x", ([label]) => { return x(portfolioLabels.includes(label) ? 'portfolio' : label) + 3 * margin; })
    .attr("y", function(d) { 
      return margin * 0.5 + y(incrementalItems.includes(d[0]) ? incrementalY(d) : d[1]);
    })
    .attr("height", function(d) { 
      return height - y(Math.abs(d[1]))
    })
    .attr("width", x.rangeBand())
    .attr("class", ([label, value]) => {
      if (label.startsWith('deposits') || label.startsWith('pv')) {
        return 'fcviz';
      } else if (portfolioLabels.includes(label) || label === 'fees') {
        return label;
      } else if (value > 0) {
        return 'gain';
      } else if (value < 0) {
        return 'loss';
      } else {
        return undefined;
      }
    })

  // put new text elements under the existing ones indicating values
  $('#portfolio_summary .x .tick text').each((index, e) => {
    const label = $(e).html()
    const y = +$(e).attr('y')
    const earningsDataStrings = window.earningsDataStrings
    const values = label === 'portfolio' ? ['lent', 'available'].map(l => Math.abs(earningsDataStrings[l])) : [earningsDataStrings[label]]
    const textEls = values.map((v, i) => {
      const textEl = $(e).clone()
      return textEl
        .attr('class', 'portfolio-component')
        .click(event => {
          const textClass = textEl.attr('class')
          if (textClass.endsWith(' clicked')) {
            textEl.attr('class', textClass.replace(' clicked', ''))
          } else {
            textEl.attr('class', textClass + ' clicked')
          }
          $('#selected-totals').html(calculateNewTotals())
        })
        .attr('y', 8 + (i + 1) * y * 2)
        .html(v)
    })
    $(e).after(textEls)
  })

}

function getAllTimeEarningsStrings() {
  const [interest, sales, purchases, promotions, fees, defaults, recoveries] = Array.from(
    $('#earnings_summary td.currency').map((i, e) => $(e).html().replace(/[+£,]/g, '').trim())
  );
  return {interest, sales, purchases, promotions, fees: '-' + fees, defaults, recoveries};
}

function getHeadlineYields() {
  return $('#returns_summary .currency h2');
}

window.earningsDataStrings = getAllTimeEarningsStrings();

window.earningsDataCents = Object.assign.apply(
  null, 
  Object.entries(window.earningsDataStrings)
    .map(([key, value]) => {
      const o = {}
      o[key] = parseFloat(value) * 100
      return o
    })
);

window.headlineYields = getHeadlineYields();

const getSummaryNumbersThenRenderGraph = async () => {
  await window.waitForLogin
  let payload
  try {
    payload = await $.getJSON('https://www.fundingcircle.com/lenders/summary.json')
  } catch (err) {
    console.error(err)
    throw err
  }
  if (payload) {
    const portfolio_numbers = payload._embedded.financial_totals;
    const pv = portfolio_numbers.total_cents;
    const portfolioNumbers = {
      pv,
      bid: -portfolio_numbers.bidding_cents,
      lent: -portfolio_numbers.lending_cents,
      available: portfolio_numbers.balance_cents,
      accrued: portfolio_numbers.accrued_interest_cents
    };

    const calculatePVs = (pv, {defaults, recoveries, fees, interest, promotions, purchases, sales}) => {
      const pvBeforeDefaults = pv - defaults - recoveries;
      const pvBeforeDefaultsAndFees = pvBeforeDefaults - fees;
      const depositsAndLegacyItems = pvBeforeDefaultsAndFees - interest;
      const deposits = depositsAndLegacyItems - promotions - purchases - sales;
      return { pvBeforeDefaults, pvBeforeDefaultsAndFees, depositsAndLegacyItems, deposits}
    };

    Object.assign(window.earningsDataCents, portfolioNumbers, calculatePVs(pv, window.earningsDataCents));
    for (const key of ['lent', 'bid', 'available', 'deposits', 'accrued']) {
      window.earningsDataStrings[key] = (window.earningsDataCents[key] / 100).toFixed(2)
    }
    renderEarningsGraph(window.earningsDataCents);
  }
}

getSummaryNumbersThenRenderGraph();

// Detach the now-useless widgets
$("iframe#funds_summary").parent().parent().detach();
