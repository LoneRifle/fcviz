# DISCLAIMER
Not endorsed nor supported by Funding Circle. FCViz adds third-party enhancements to the Funding Circle platform which may lose compatibility over time.

Code made available under MIT license.
This means author accepts NO responsibility for any consequences to any actions taken by Funding Circle users on the Funding Circle platform while using FCViz.

# FCViz
Chrome extension that provides extra visualisations for Funding Circle pages.

## Bar charts for bid summary tab
Plots bid rate against amount bid, with line chart tracking cumulative loan fill percentage.
Tooltip shows user bids where relevant
![Top: original site, Bottom: site with fcviz enabled](http://lonerifle.github.io/fcviz/fcviz.png)

Focus only on rates where there are user bids by clicking a toggle to fade other rates into the background

![Show my bids](http://lonerifle.github.io/fcviz/showmybids.png)

Bid table now also available in a separate drawer to keep both table and chart in same view

![Bid drawer](http://lonerifle.github.io/fcviz/bidtray.png)

## Scatter plot for all bids tab
Plots bid rate against time at 30 min intervals, with bid amount expressed as size of plot point.
Clicking on a plot point will show a pie chart showing amounts bid at that rate by each user.
![Top: original site, Bottom: site with fcviz enabled](http://lonerifle.github.io/fcviz/fcviz-all.png)

Fixed rate bids are represented as a bar chart with cumulative line
![Fixed rate all bids](http://lonerifle.github.io/fcviz/fixedrate-all.png)

## Loan requests page improvements
Loan requests now have a link that reveals a summary using information from the auction page, including bid summary chart.
![Top: original site, Bottom: site with fcviz enabled](http://lonerifle.github.io/fcviz/fcviz-requests.png)

Loan requests filter can now filter on multiple risk bands
![Multiple risk bands](http://lonerifle.github.io/fcviz/multiband.png)

Auction icons can now be clicked on, adding total active and rejected bids by user to the Amounts column for Watchlist and Loan Requests pages.
Tooltips on mousing over auction icon will then show the full list of bids.
![Bid peeking](http://lonerifle.github.io/fcviz/bidpeek.png)

## Hide repaid loans in summary page
Hide loans or loan parts using a new checkbox near the top right of My Loan Parts section.
![Top: original site, Bottom: site with fcviz enabled](http://lonerifle.github.io/fcviz/fcviz-hiderepaid.png)

## See repayment schedule as timeseries graph
Repayment schedule now viewable as chart showing payments over time, either on a per-week or per-day basis. 
Includes ability to zoom into particular sections of the repayment schedule.
Show or hide chart components by clicking on the labels.
Mousing over the chart points or bars will display a tooltip showing principal and interest paid, fees to FC, 
and running total. 
![Repayment chart](http://lonerifle.github.io/fcviz/fcviz-repay.png)

## Cleaner financial summary page for property loans
Investor report now directly embedded in the Financial Summary tab, with option to download as well. 
All irrelevant sections also removed leaving only investor report and outstanding loans.
![Property](http://lonerifle.github.io/fcviz/property.png)
![Property](http://lonerifle.github.io/fcviz/property-secondary.png)

## Repayment info and Term Sheet
Information in the repayments tab is now populated using the page usually found in the secondary market.
The repayment schedule for the loan is now under a new tab - Term Sheet.
![New repayments tab](http://lonerifle.github.io/fcviz/newrepayments.png)
![Term sheet](http://lonerifle.github.io/fcviz/termsheet.png)

## Premium shortcuts
The premium selector is now flanked by two buttons.
The left one is an empty circle and will clear any premiums made in the selector. 
The right one is a filled circle and will apply the loan part premium to all other selected loan parts, dropping those whose rate falls below the minimum as a result of the premium.
![Premium shortcuts](http://lonerifle.github.io/fcviz/sell-my-loans.png)

##Premium Safety Catch
When the user is selling individual parts, FCViz will check the loan parts to be sold if all or none of them have a premium applied. If there are some with premium and others at par or discount, FCViz will prompt the user for confirmation that this is what he or she really wants to do.
![Premium safety catch](http://lonerifle.github.io/fcviz/safetycatch.png)

## Improved loan parts filter controls
Both regular and advanced loan part filters are now presented in the same section.
Advanced filters are still hidden by default, but occupy less of the page.
![Loan parts before and after](http://lonerifle.github.io/fcviz/markets.jpg)

## Repayment peeking in Secondary Markets
Loan part entries now have an icon which will display repayment information on mouseover
![Repayment peeking](http://lonerifle.github.io/fcviz/repaymentpeek.jpg)