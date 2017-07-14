const {ok, fail} = require('./lib/handler_result')
const {callForResponse, callForBody, callForOk} = require('./lib/callers')
const route = require('./lib/route')

module.exports = {
  route,

  ok, fail,

  callForResponse, callForBody, callForOk,
}
