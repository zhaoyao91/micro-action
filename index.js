const {json, send} = require('micro')
const fetch = require('node-fetch')
const url = require('url')
const os = require('os')

module.exports = {
  async defaultRequestHandler(req, res) {
    send(res, 501, 'Not Implemented')
  },

  async defaultErrorLogger(err) {
    console.error(err)
  },

  async defaultErrorHandler(err, {input, res}) {
    send(res, 200, fail(undefined, undefined, err).toObject())
  },

  route(...args) {
    if (args.length <= 1) {
      // this can cache prepared handlers
      const handlers = prepareHandlers(args[0])
      return (req, res) => route(req, res, handlers)
    }
    else {
      const [req, res, handlers] = args
      return route(req, res, prepareHandlers(handlers))
    }
  },

  ok, fail,

  callForResponse, callForBody, callForOk,

  /**
   * @deprecated
   */
  callAtHttpLevel: callForResponse,

  /**
   * @deprecated
   */
  callAtActionLevel: callForBody,

  /**
   * @deprecated
   */
  callOnOk: callForOk,
}

async function route (req, res, handlers) {
  if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
    const body = await json(req)
    if (typeof body !== 'string' && !Array.isArray(body) && body !== null) {
      const {cmd, input} = body
      const handler = handlers[uniformCmd(cmd)]
      if (handler) {
        return await runHandler(handler, input, res)
      }
    }
  }
  return await module.exports.defaultRequestHandler(req, res)
}

const defaultHandlers = {
  'ping': () => 'pong',
  'info': () => ({
    timeString: new Date(),
    time: (new Date()).getTime(),
    pid: process.pid,
    hostname: os.hostname(),
    ips: getIPs(),
  })
}

// copy from https://stackoverflow.com/a/10756441/3371998
function getIPs () {
  const interfaces = os.networkInterfaces()
  const addresses = []
  for (let k in interfaces) {
    for (let k2 in interfaces[k]) {
      const address = interfaces[k][k2]
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address)
      }
    }
  }
  return addresses
}

function prepareHandlers (handlers) {
  handlers = {
    ...defaultHandlers,
    ...handlers,
  }
  const preparedHandlers = {}
  for (let key in handlers) {
    if (handlers.hasOwnProperty(key)) {
      preparedHandlers[uniformCmd(key)] = handlers[key]
    }
  }
  return preparedHandlers
}

class HandlerResult {
  constructor (ok, code, output) {
    this.ok = ok
    this.code = code
    this.output = output
  }

  toObject () {
    return Object.assign({}, this)
  }
}

class Ok extends HandlerResult {
  constructor (code, output) {
    super(true, code, output)
  }
}

class Fail extends HandlerResult {
  constructor (code, output, error) {
    super(false, code, output)
    if (error !== undefined) {
      this.error = error
    }
  }

  toObject () {
    const obj = super.toObject()
    if (obj.error !== undefined) {
      obj.error = parseError(obj.error)
    }
    return obj
  }
}

function parseError (err) {
  if (typeof err === 'object' && !Array.isArray(err) && err !== null && err !== undefined) {
    return {
      name: err.name,
      message: err.message,
      ...err,
    }
  }
  else return err
}

function ok (code, output) {
  return new Ok(code, output)
}

function fail (code, output, error) {
  return new Fail(code, output, error)
}

async function runHandler (handler, input, res) {
  try {
    let result = await handler(input)
    if (!(result instanceof HandlerResult)) {
      result = ok(undefined, result)
    }
    if (result.error !== undefined) {
      await module.exports.defaultErrorLogger(result.error)
    }
    send(res, 200, result.toObject())
  }
  catch (err) {
    await module.exports.defaultErrorLogger(err)
    await module.exports.defaultErrorHandler(err, {input, res})
  }
}

function callForResponse (url, cmd, input) {
  return fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
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

function sortQuery (query) {
  if (!query) return query
  else return query.split('&').sort().join('&')
}

function uniformCmd (cmd) {
  const {pathname, query: originalQuery} = url.parse(cmd)
  const query = sortQuery(originalQuery)

  if (!query) return pathname
  else return `${pathname}?${query}`
}
