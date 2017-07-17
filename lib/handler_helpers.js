const {send} = require('micro')
const url = require('url')
const {HandlerResult, ok} = require('./handler_result')

function prepareHandlers (...handlers) {
  handlers = Object.assign({}, ...handlers)
  const preparedHandlers = {}
  for (let key in handlers) {
    if (handlers.hasOwnProperty(key)) {
      const cmdPattern = uniformCmd(key)
      if (preparedHandlers[cmdPattern]) {
        console.warn(`duplicate cmd patterns: ${cmdPattern}`)
      }
      preparedHandlers[cmdPattern] = handlers[key]
    }
  }
  return preparedHandlers
}

function getHandler (preparedHandlers, cmd) {
  return preparedHandlers[uniformCmd(cmd)]
}

function runHandler ({errorLogger, errorHandler}) {
  return async function (handler, input, res) {
    try {
      let result = await handler(input)
      if (!(result instanceof HandlerResult)) {
        result = ok(undefined, result)
      }
      if (result.error !== undefined) {
        await errorLogger(result.error)
      }
      send(res, 200, result.toObject())
    }
    catch (err) {
      await errorLogger(err)
      await errorHandler(err, res, input)
    }
  }
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

module.exports = {
  prepareHandlers,
  getHandler,
  runHandler,
}