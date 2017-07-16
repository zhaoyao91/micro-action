# Micro Action

Definition an tools help build simple action server with [Zeit Micro](https://github.com/zeit/micro).

## Introduction

Design a good http api is hard, but write an action is much easier.

This package defined a pretty simple protocol - **micro-action** - which is based on http and helps you focus on application 
logic instead of tons of http stuff.

This package also offers many utils which can dramatically simplify your work to define and invoke such actions.

Moreover, **micro-action** does not make any isolated island. Since it's based on http protocol, any outside user can 
safely treat a micro-action service as a http service and use any http lib to communicate with it.

NOTE: this package is intended to be used with [Zeit Micro](https://github.com/zeit/micro), which is a light and pretty
node.js http library.

## Usage

### Install package

```bash
npm i -S micro-action
```

### Basic usage

```ecmascript 6
// server.js
const {route} = require('micro-action')

module.exports = route({
  'add': ({a, b}) => a + b,
  'add?async': async ({a, b}) => await Promise.resolve(a + b)
})
```

```ecmascript 6
// client.js
const {callForOk} = require('micro-action')

const sum1 = await callForOk('http://server/path', 'add', {a:1, b:2})
// sum=3

const sum2 = await = callForOk('http://server/path', 'add?async', {a:2, b:3})
// sum=5
```

### Ok with code

If you have multiple possible success cases, use code to distinguish them.

```ecmascript 6
// server.js
const {route, ok, fail} = require('micro-action')

module.exports = {
  'magicNumber': (number) => {
    if (number % 2 === 0) return ok('even', number / 2)
    else return ok('odd', number * 2)
  },
}
```

```ecmascript 6
// client.js
const {callForBody} = require('micro-action')

const body1 = await callForBody('http://server/path', 'add', 4)
// body1={ok: true, code:'even', output:2}

const body2 = await = callForBody('http://server/path', 'add?async', 5)
//body2={ok: true, code:'odd', output:10}
```

### Fail with code

You should always give a code for known failure cases.

The output is optional and can be used for further details of this failure case.

```ecmascript 6
// server.js
const {route, ok, fail} = require('micro-action')

module.exports = {
  'divide': ({a, b}) => {
    if (b === 0) return fail('zero-denominator', {msg: 'b cannot be 0'})
    else return a / b
  },
}
```

```ecmascript 6
// client.js
const {callForBody} = require('micro-action')

const body1 = await callForBody('http://server/path', 'divide', {a:1, b:2})
// body1={ok: true, output: 0.5}

const body2 = await = callForBody('http://server/path', 'divide', {a:1, b:0})
//body2={ok: false, code:'zero-denominator', output: {msg: 'b cannot be 0'}}
```

### Uncatched error

You can ignore if you don't care the unknown errors. It will be caught and properly composed into response.
 
```ecmascript 6
// server.js
const {route, ok, fail} = require('micro-action')

module.exports = {
  'parse/jsonString': (json) => {
    return JSON.parse(json)
  },
}
```

```ecmascript 6
// client.js
const {callForBody} = require('micro-action')

const body = await callForBody('http://server/path', 'parse/jsonString', '{invalidJsonString')
// body1={ok: false, error: {name: 'SyntaxError', message: 'Unexpected token i in JSON at position 1'}}
```

### Call via raw http lib

You can use any http library to call micro-action service.

```ecmascript 6
// server.js
const {route} = require('micro-action')

module.exports = route({
  'hello': () => 'world'
})
```

```ecmascript 6
// client.js
const fetch = require('node-fetch')

const res = await fetch('http://server/path', 'hello')
const body = await res.json()
// body={ok: true, output: 'world'}
```

### Built-in handlers

There are some useful built-in handlers.

```ecmascript 6
// server.js
const {route} = require('micro-action')

module.exports = route()
```

```ecmascript 6
// client.js
const {callForOk} = require('micro-action')

const body1 = await callForOk('http://server/path', 'ping')
// body1='pong'

const body2 = await callForOk('http://server/path', 'info')
// body2={pid, hostname, ips, time, timeString}
```

## APIs

#### route

func(handlers, options) => [microRequestHandler][[micro-request-handler]]

- handlers - object, key is cmd pattern, value is the handler.
- handler - async func(input) => any | handlerResult
- options
  - errorLogger - async func(err)
  - errorHandler - async func(err, res, input) => any | handlerResult
  - otherRequestHandler - [microRequestHandler][[micro-request-handler]]
  - unmatchedCmdHandler - async func(cmd, input) => any | handlerResult

#### ok

async func(code, output) => handlerResult

#### fail

async func(code, output, err) => handlerResult

#### callForResponse

async func(url, cmd, input) => [fetchResponse][fetch-response]

#### callForBody

async func(url, cmd, input) => body

`body` is the payload of the http response. Possible fields are:

- ok - boolean, indicates whether the it is a success or failure response.
- code - string, used to distinguish response cases
- output - the payload of this response
- error - if it is a failure response, it may include an error object which contains information about what's happened 
to help debug.

## Micro Action Protocol

Micro Action Protocol is based on HTTP.

### Request

- method: POST
- headers: {'Content-Type': 'application/json'}
- body: {cmd: String, input: Any}

Any params or args should be put into `input`.

### Response

- headers: {'Content-Type': 'application/json'}
- body: {ok: Boolean, code: Any, output: Any, error: Any}
 
If action succeeds, `ok=true`, else (fails or throws) `ok=false`.
 
`code` is used to help identify the cases of this response.
 
`output` is the result data carried in the response.
 
`error` may be included to help caller reason about the problem.
 
- if `ok=true, code=undefined`, this is the only possible ok response.
- if `ok=true`, `output` is the result data.
- if `ok=false, code=undefined`, this is a non-ok response with unknown error.
- if `ok=false`, `output` can be used to complement `code` to provide further details.
- if `ok=false`, `error` may be included to help the **developer** reason about what happened, but it should not be 
used to branch application logic since the content is arbitrary.

### Cmd Pattern

`cmd` is the conjunction of handler definition and invocations.

When you call `route` function and pass in a map of handlers, the key of each handler becomes its cmd pattern.

When you request a service with a `cmd`, it will be used to match predefined handlers.
 
The cmd pattern is simply a relative url string like `find/user?by=id`.
The path part is used to define the action and subject.
And the query pairs are just tags used to refine the action definition.

The query pairs are order-insensitive so if you have a cmd pattern `find/user?by=id&fields=all`,
both `find/user?by=id&fields=all` and `find/user?fields=all&by=id` will match it.

Common cmd patterns are like these:

- create
- create/user
- get/user
- get/user?by=id
- get/users?sortBy=name&sortBy=createdAt

Note: `/get/user` and `get/user` are different.

## License

ISC

[micro-request-handler]: https://github.com/zeit/micro#microfn
[fetch-response]: https://github.com/bitinn/node-fetch#class-response