const {send} = require('micro')
const {fail} = require('./handler_result')

async function errorHandler (err, res, input) {
  send(res, 200, fail(undefined, undefined, err).toObject())
}

async function errorLogger (err) {
  console.error(err)
}

function defaultRequestHandler (req, res) {
  send(res, 501, 'Not Implemented')
}

module.exports = {
  errorLogger,
  errorHandler,
  defaultRequestHandler,
}