# Micro Action

Tools to help build [Micro-Action][micro-action-protocol] server using [Zeit Micro][micro].

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
const fetch = require('node-fetch')

const res = await fetch('http://server-path', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({cmd: 'add', input: {a: 1, b: 2}})
})
const body = await res.json()
const sum = body.output // sum=3

const res = await fetch('http://server-path', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({cmd: 'add?async', input: {a: 2, b: 3}})
})
const body = await res.json()
const sum = body.output // sum=5
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
const fetch = require('node-fetch')

const res = await fetch('http://server-path', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({cmd: 'magicNumber', input: 4})
})
const body = await res.json() // body1={ok: true, code:'even', output:2}

const res = await fetch('http://server-path', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({cmd: 'magicNumber', input: 5})
})
const body = await res.json() // body={ok: true, code:'odd', output:10}
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
const fetch = require('node-fetch')

const res = await fetch('http://server-path', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({cmd: 'divide', input: {a: 1, b: 2}})
})
const body = await res.json() // body={ok: true, output: 0.5}

const res = await fetch('http://server-path', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({cmd: 'divide', input: {a: 1, b: 0}})
})
const body = await res.json() // body={ok: false, code:'zero-denominator', output: {msg: 'b cannot be 0'}}
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
const fetch = require('node-fetch')

const res = await fetch('http://server-path', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({cmd: 'parse/jsonString', input: '{invalidJsonString'})
})
const body = await res.json() // body1={ok: false, error: {name: 'SyntaxError', message: 'Unexpected token i in JSON at position 1'}}
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

## Related Projects

- [micro-action-protocol][micro-action-protocol]
- [micro-action-callers][micro-action-callers]

## License

ISC

[micro-request-handler]: https://github.com/zeit/micro#microfn
[micro]: https://github.com/zeit/micro
[micro-action-protocol]: https://github.com/zhaoyao91/micro-action-protocol
[micro-action-callers]: https://github.com/zhaoyao91/micro-action-callers