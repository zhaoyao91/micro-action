const {json, send} = require('micro')
const fetch = require('node-fetch')
const url = require('url')

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

  async route(req, res, handlers) {
    const {cmd, input} = await json(req)
    const handler = findHandler(cmd, handlers)

    if (!handler) {
      return await module.exports.defaultRequestHandler(req, res)
    }
    else {
      return await runHandler(handler, input, res)
    }
  },

  ok, fail,

  callAtHttpLevel, callAtActionLevel, callOnOk,
}

function findHandler (cmd, handlers) {
  for (let key in handlers) {
    if (handlers.hasOwnProperty(key)) {
      if (compareCmds(cmd, key)) return handlers[key]
    }
  }
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
    await module.exports.defaultErrorHandler(err)
  }
}

function callAtHttpLevel (url, cmd, input) {
  return fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({cmd, input})
  })
}

async function callAtActionLevel (url, cmd, input) {
  const res = await callAtHttpLevel(url, cmd, input)
  const body = await res.json()
  if (!res.ok) throw new Error(`failed to request ${url}: ${JSON.stringify(body)}`)
  else return body
}

async function callOnOk (url, cmd, input) {
  const body = await callAtActionLevel(url, cmd, input)
  if (!body.ok) throw new Error(`failed to request ${url}: ${JSON.stringify(body)}`)
  else return body.output
}

function compareCmds (cmd1, cmd2) {
  cmd1 = uniformCmd(cmd1)
  cmd2 = uniformCmd(cmd2)

  return cmd1 === cmd2
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
