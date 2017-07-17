const {ok, fail} = require('./lib/handler_result')
const route = require('./lib/route')

module.exports = {
  route,
  ok, fail,
}
