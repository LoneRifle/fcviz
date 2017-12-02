/**
 * FCViz 
 * Payload script for summary page
 */

const recentLoanCommentsIframe = $('#recent-loan-comments')
window.recentLoanCommentsDiv = recentLoanCommentsIframe.prev().clone()
recentLoanCommentsDiv.attr('class', 'row loan-comments')
recentLoanCommentsDiv.find('h3').html('Recent Loan Comments')
recentLoanCommentsDiv.find('p').last().detach()

const commentDetailsDiv = $(document.createElement('div'))

recentLoanCommentsDiv.find('p')
  .html('Loading...')
  .after(commentDetailsDiv)

recentLoanCommentsIframe.after(recentLoanCommentsDiv)

const makeComment = comment => {
  const header = $(document.createElement('div'))
    .attr('class', 'loan-comment-header')
    .append(comment.title)
  const commentDiv = $(document.createElement('div'))
    .attr('class', 'loan-comment')
    .append(header)
    
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

window.waitForLogin
  .then(() => $.getJSON('/lenders/summary/comments.json'))
  .then(populateLoanCommentDetails)
  .catch(err => {
    recentLoanCommentsDiv.find('p').html('There was a problem fetching your loan comments. Please refresh the page.')
    commentDetailsDiv.html(`${err.status} ${err.statusText} ${err.responseText}`)
  })
