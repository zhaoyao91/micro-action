const micro = require('micro')
const test = require('ava')
const listen = require('test-listen')
const fetch = require('node-fetch')
const {route, ok, fail, callForResponse, callForBody, callForOk} = require('./index')
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

  const sum = await callForOk(url, 'add', {a: 1, b: 2})
  t.is(sum, 3)

  const diff = await callForOk(url, 'sub', {a: 1, b: 2})
  t.is(diff, -1)
})

test('ok and fail', async t => {
  const service = micro(route({
    'ok': () => ok('yes', 'you win'),
    'fail': () => fail('no', 'you lose')
  }))

  const url = await listen(service)

  const okBody = await callForBody(url, 'ok')
  t.deepEqual(okBody, {ok: true, code: 'yes', output: 'you win'})

  const failBody = await callForBody(url, 'fail')
  t.deepEqual(failBody, {ok: false, code: 'no', output: 'you lose'})
})

test('error handling', async t => {
  const service = micro(route({
    'failWithError': () => fail('fail-with-error', {details: 'why'}, new Error('fail with error')),
    'throwError': () => {throw new Error('throw error')}
  }))

  const url = await listen(service)

  const body1 = await callForBody(url, 'failWithError')
  t.deepEqual(body1, {
    ok: false,
    code: 'fail-with-error',
    output: {details: 'why'},
    error: {name: 'Error', message: 'fail with error'}
  })

  const body2 = await callForBody(url, 'throwError')
  t.deepEqual(body2, {
    ok: false,
    error: {name: 'Error', message: 'throw error'}
  })
})

test('cmd pattern', async t => {
  const service = micro(route({
    'get/user?admin&by=id': ({id}) => ({name: 'Bob', id})
  }))

  const url = await listen(service)

  const user1 = await callForOk(url, 'get/user?admin&by=id', {id: 1})
  t.deepEqual(user1, {id: 1, name: 'Bob'})

  const user2 = await callForOk(url, 'get/user?by=id&admin', {id: 2})
  t.deepEqual(user2, {id: 2, name: 'Bob'})
})

test('ping api', async t => {
  const service = micro(route())

  const url = await listen(service)

  const pong = await callForOk(url, 'ping')
  t.is(pong, 'pong')
})

test('info api', async t => {
  const service = micro(route())

  const url = await listen(service)

  const info = await callForOk(url, 'info')
  t.is(info.pid, process.pid)
  t.is(info.hostname, os.hostname())
})