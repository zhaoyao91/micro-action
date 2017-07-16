const {json} = require('micro')
const {prepareHandlers, getHandler, runHandler} = require('./handler_helpers')
const builtinHandlers = require('./builtin_handlers')
const defaultOptions = require('./default_options')

function route (handlers, options) {
  const {errorHandler, errorLogger, otherRequestHandler, unmatchedCmdHandler} = {
    ...defaultOptions,
    ...options,
  }
  const preparedHandlers = prepareHandlers(builtinHandlers, handlers)
  const run = runHandler({errorHandler, errorLogger})
  return async function route (req, res) {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
      const body = await json(req)
      if (typeof body === 'object' && !Array.isArray(body) && body !== null) {
        const {cmd, input} = body
        const handler = getHandler(preparedHandlers, cmd)
        if (handler) return await run(handler, input, res)
        else return await unmatchedCmdHandler(cmd, input)
      }
    }
    return await otherRequestHandler(req, res)
  }
}

module.exports = route
