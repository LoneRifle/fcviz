/**
 * FCViz
 * Payload script for summary page
 */

const recentLoanCommentsIframe = $('#recent-loan-comments')
window.recentLoanCommentsDiv = recentLoanCommentsIframe.prev().clone()
recentLoanCommentsDiv.attr('id', 'loan-parts-comments-section')
recentLoanCommentsDiv.attr('class', 'row loan-comments')
recentLoanCommentsDiv.find('h3').html('Recent Loan Comments')
recentLoanCommentsDiv.find('p').last().detach()
recentLoanCommentsDiv.find('div.portfolio_wrapper').detach()
recentLoanCommentsDiv.find('div.span12').css('width', '912px')

const commentDetailsDiv = $(document.createElement('div'))

recentLoanCommentsDiv.find('p')
  .html('Loading...')
  .after(commentDetailsDiv)

recentLoanCommentsIframe.after(recentLoanCommentsDiv)

const makeCommentEntries = entries => entries.map(e => {
  const {body, created_at: date} = e
  const entryDiv = $(document.createElement('div')).append(
    $(document.createElement('time')).html(date),
    $(document.createElement('p')).html(body),
  )
  return entryDiv
})

const makeComment = comment => {
  const auctionLink = $(document.createElement('a'))
    .attr('href', `https://www.fundingcircle.com/loans/${comment.display_id}/auction`)
    .html(comment.title)
  const daysLate = Math.max.apply(null, comment._embedded.late_repayments.items.map(d => d.days_late).concat(0))
  const lateOrDefault = comment.defaulted_at ? `defaulted ${comment.defaulted_at.split('T')[0]}` : `${daysLate} days late`
  const exposure = (comment._embedded.exposure.amount_cents / 100).toFixed(2)
  const riskBand = $(document.createElement('span'))
    .attr('class', 'loan-comment-risk-band')
    .html(
      comment._embedded.business.risk_band ||
      `Downgraded (No risk band -
        <a href="https://support.fundingcircle.com/entries/22555151--What-does-it-mean-if-a-loan-has-no-risk-band-">
          More info</a>)`
    )
  const header = $(document.createElement('div'))
    .attr('class', 'loan-comment-header')
    .append(auctionLink, ` (${comment.auction_id}) — ${lateOrDefault}, exposure £${exposure}`, riskBand)

  const moreText = $(document.createElement('span')).html('Show')
  const lessText = $(document.createElement('span')).html('Hide').hide()
  const commentEntries = makeCommentEntries(comment._embedded.comments.items)
  const historicalCommentEntries = $(commentEntries.slice(1)).each((i, e) => $(e).hide())

  const body  = $(document.createElement('div'))
    .attr('class', comment._embedded.business.risk_band ? 'loan-comment-body' : 'loan-comment-body warning')
    .append(commentEntries)

  if (commentEntries.length > 1) {
    const toggleLink = $(document.createElement('a'))
      .on('click', () => {
        moreText.toggle()
        lessText.toggle()
        historicalCommentEntries.each((i, e) => $(e).slideToggle('fast'))
      })
      .append(moreText, lessText, ' history')
    body.append(toggleLink)
  }

  const commentDiv = $(document.createElement('div'))
    .attr('class', 'loan-comment')
    .append(header, body)

  return commentDiv
}

const populateLoanCommentDetails = comments => {
  window.comments = comments
  const downgradeCount = comments.items.filter(p => !p._embedded.business.risk_band).length
  const defaultCount = comments.items.filter(p => p.defaulted).length
  recentLoanCommentsDiv.find('p').html(`
    There are comments for ${comments.items.length} loans you are currently exposed to.
    ${downgradeCount} ${downgradeCount === 1 ? 'is' : 'are'} downgraded.
    ${defaultCount} ${defaultCount === 1 ? 'has' : 'have'} defaulted.
  `)

  const moreText = $(document.createElement('span')).html('More')
  const lessText = $(document.createElement('span')).html('Less').hide()
  const commentsContainer = $(document.createElement('div'))
    .attr('class', 'loan-comment-holder')
    .append(comments.items.map(makeComment))
    .hide()
  const toggleLink = $(document.createElement('a'))
    .on('click', () => {
      moreText.toggle()
      lessText.toggle()
      commentsContainer.slideToggle('fast')
    })
    .append(moreText, lessText, ' details')
  commentDetailsDiv.append(toggleLink, commentsContainer)
}

$("iframe").detach()

window.waitForLogin
  .then(() => $.getJSON('/lenders/summary/comments.json'))
  .then(populateLoanCommentDetails)
  .catch(err => {
    recentLoanCommentsDiv.find('p').html('There was a problem fetching your loan comments. Please refresh the page.')
    commentDetailsDiv.html(`${err.status} ${err.statusText} ${err.responseText}`)
  })
