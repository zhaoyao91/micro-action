const {send} = require('micro')
const {fail} = require('./handler_result')

async function errorHandler (err, res, input) {
  send(res, 200, fail(undefined, undefined, err).toObject())
}

async function errorLogger (err) {
  console.error(err)
}

function otherRequestHandler (req, res) {
  send(res, 501, 'Not Implemented')
}

function unmatchedCmdHandler (cmd, input) {
  return fail('unmatched-cmd', {cmd, input})
}

module.exports = {
  errorLogger,
  errorHandler,
  otherRequestHandler,
  unmatchedCmdHandler,
}