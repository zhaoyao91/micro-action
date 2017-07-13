const {json, send} = require('micro')

module.exports = {
  async defaultHandler(req, res) {
    send(res, 501, 'Not Implemented')
  },

  async route(req, res, handlers) {
    const {cmd, input} = await json(req)
    const handler = handlers[cmd]

    if (!handler) {
      return await module.exports.defaultHandler(req, res)
    }
    else {
      return await runHandler(handler, input, res)
    }
  },

  ok, fail,
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
  let result
  try {
    result = await handler(input)
    if (!(result instanceof HandlerResult)) {
      result = ok(undefined, result)
    }
    send(res, 200, result.toObject())
  }
  catch (err) {
    result = fail(undefined, undefined, err)
    send(res, 200, result.toObject())
  }
  if (result.error !== undefined) {
    console.error(result.error)
  }
}