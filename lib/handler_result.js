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

module.exports = {
  HandlerResult,
  Ok,
  Fail,
  ok,
  fail,
}