/**
 * FCViz 
 * Payload script for summary page - a 
 */

window.waitForLogin = (async () => {
  let payload
  while (!payload) {
    try {
      payload = await $.getJSON('https://www.fundingcircle.com/auth/login')
        .then(() => true)
    } catch (err) {
      if (err.status === 404) {
        // Probably the usual FC failure to 
        // receive the auth tokens in time, wait a little longer
        console.log('Waiting 500ms for login')
        await setTimeout(() => {}, 500)
      } else {
        console.error(err)
        throw err
      }
    }
  }
  return payload
})()
