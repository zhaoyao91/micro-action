require('babel-polyfill')
require('babel-register')

const micro = require('micro')
const test = require('ava')
const listen = require('test-listen')
const fetch = require('node-fetch')
const {route, ok, fail} = require('./index')
const os = require('os')

test('ping pong', async t => {
  const service = micro(route({
    'ping~': () => 'pong~'
  }))

  const url = await listen(service)
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({cmd: 'ping~'})
  })
  const body = await res.json()

  t.deepEqual(body, {
    ok: true,
    output: 'pong~'
  })
})

test('basic route', async t => {
  const service = micro(route({
    'add': ({a, b}) => a + b,
    'sub': async ({a, b}) => await Promise.resolve(a - b)
  }))

  const url = await listen(service)

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'add', input: {a: 1, b: 2}})
    })
    const body = await res.json()
    const sum = body.output
    t.is(sum, 3)
  }

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'sub', input: {a: 1, b: 2}})
    })
    const body = await res.json()
    const diff = body.output
    t.is(diff, -1)
  }
})

test('ok and fail', async t => {
  const service = micro(route({
    'ok': () => ok('yes', 'you win'),
    'fail': () => fail('no', 'you lose')
  }))

  const url = await listen(service)

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'ok'})
    })
    const body = await res.json()
    t.deepEqual(body, {ok: true, code: 'yes', output: 'you win'})
  }

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'fail'})
    })
    const body = await res.json()
    t.deepEqual(body, {ok: false, code: 'no', output: 'you lose'})
  }
})

test('error handling', async t => {
  const service = micro(route({
    'failWithError': () => fail('fail-with-error', {details: 'why'}, new Error('fail with error')),
    'throwError': () => {throw new Error('throw error')}
  }, {
    errorLogger: (err) => {/*do not show error in tests*/}
  }))

  const url = await listen(service)

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'failWithError'})
    })
    const body = await res.json()
    t.deepEqual(body, {
      ok: false,
      code: 'fail-with-error',
      output: {details: 'why'},
      error: {name: 'Error', message: 'fail with error'}
    })
  }

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'throwError'})
    })
    const body = await res.json()
    t.deepEqual(body, {
      ok: false,
      error: {name: 'Error', message: 'throw error'}
    })
  }
})

test('cmd pattern', async t => {
  const service = micro(route({
    'get/user?admin&by=id': ({id}) => ({name: 'Bob', id})
  }))

  const url = await listen(service)

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'get/user?admin&by=id', input: {id: 1}})
    })
    const body = await res.json()
    t.deepEqual(body, {ok: true, output: {id: 1, name: 'Bob'}})
  }

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'get/user?by=id&admin', input: {id: 2}})
    })
    const body = await res.json()
    t.deepEqual(body, {ok: true, output: {id: 2, name: 'Bob'}})
  }
})

test('not implemented', async t => {
  const service = micro(route())
  const url = await listen(service)

  const res = await fetch(url, {
    method: 'PUT',
    body: {cmd: 'ping'}
  })

  t.is(res.status, 501)
})

test('unmatched cmd', async t => {
  const service = micro(route())
  const url = await listen(service)

  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({cmd: 'undefinedCmd', input: {hello: 'world'}})
    })
    const body = await res.json()
    t.deepEqual(body, {
      ok: false,
      code: 'unmatched-cmd',
      output: {cmd: 'undefinedCmd', input: {hello: 'world'}}
    })
  }
})
