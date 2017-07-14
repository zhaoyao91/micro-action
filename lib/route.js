const {json} = require('micro')
const {prepareHandlers, getHandler, runHandler} = require('./handler_helpers')
const builtinHandlers = require('./builtin_handlers')
const defaultOptions = require('./default_options')

function route (handlers, options) {
  const {errorHandler, errorLogger, defaultRequestHandler} = {
    ...defaultOptions,
    ...options,
  }
  const preparedHandlers = prepareHandlers(builtinHandlers, handlers)
  const run = runHandler({errorHandler, errorLogger})
  return async function route (req, res) {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
      const body = await json(req)
      if (typeof body !== 'string' && !Array.isArray(body) && body !== null) {
        const {cmd, input} = body
        const handler = getHandler(preparedHandlers, cmd)
        if (handler) {
          return await run(handler, input, res)
        }
      }
    }
    return await defaultRequestHandler(req, res)
  }
}

module.exports = route
