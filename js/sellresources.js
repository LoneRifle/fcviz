//Defer the bootstrap process at the sell page so that we have a window to load in our own angular stuff.
window.name="NG_DEFER_BOOTSTRAP!"+window.name;

loadAtTarget({css:["css/fcviz.css"], js:["js/sell.js"]},document.body)
