const fetch = require('node-fetch')

function callForResponse (url, cmd, input) {
  return fetch(url, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({cmd, input})
  })
}

async function callForBody (url, cmd, input) {
  const res = await callForResponse(url, cmd, input)
  if (!res.ok) {
    throw new Error(`failed to request ${url}: ${await res.text()}`)
  }
  else if (res.headers.get('content-type') !== 'application/json') {
    throw new Error(`invalid body received from ${url}: ${await res.text()}`)
  }
  else {
    const body = await res.json()
    if (typeof body === 'string' || Array.isArray(body) || body === null) {
      throw new Error(`invalid body received from ${url}: ${body}`)
    }
    return body
  }
}

async function callForOk (url, cmd, input) {
  const body = await callForBody(url, cmd, input)
  if (!body.ok) throw new Error(`failed to request ${url}: ${JSON.stringify(body)}`)
  else return body.output
}

module.exports = {
  callForResponse,
  callForBody,
  callForOk,
}