# Micro Action

Help define actions for [micro](https://github.com/zeit/micro).

## Action Protocol

Action protocol is based on HTTP.

### Request

- method: POST
- headers: {'Content-Type': 'application/json'}
- body: {cmd: String, input: Any}

`cmd` is the identifier of the action to be called.

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

## Usage

Install the package:

```bash
npm i -S micro-action
```

Import the utils:

```ecmascript 6
const {route, ok, fail} = require('micro-aciton')
```

Define actions in your micro handler:

```ecmascript 6
module.exports = async (req, res) => {
  await route(req, res, {
    // {cmd: 'ok1', input: {name: 'Bob', age: 20}}
    // =>
    // {ok: true, code: undefined, output: 'Bob'}
    'ok1'(input) {
      return `hello ${input.name}`
    },
    
    // {cmd: 'ok2', input: {name: 'Bob', age: 20}}
    // =>
    // {ok: true, code: 'ok-2', output: {input: {name: 'Bob', age: 20}} 
    'ok2'(input) {
      return ok('ok-2', {input})
    },
    
    // {cmd: 'fail1', input: {name: 'Bob', age: 20}}
    // =>
    // {ok: false, code: 'fail-1', output: {input: {name: 'Bob', age: 20}} 
    'fail1'(input) {
      return fail('fail-1', {input})
    },
    
    // {cmd: 'error1', input: {name: 'Bob', age: 20}}
    // =>
    // {ok: false, code: undefined, error: {name: 'Error', message: 'some error}} 
    'error1'(input) {
      throw new Error('some error')
    },
    
    // {cmd: 'error2', input: {name: 'Bob', age: 20}}
    // =>
    // {ok: false, code: 'error-2', output: {input: {name: 'Bob', age: 20}, error: {name: 'Error', message: 'error again'}} 
    'error2'(input) {
      return fail('error-2', {input}, new Error('error again'))
    }
  })
}
```

Generally, if you manually return `fail`, you should always set the code since you *know* this failure case.

## APIs

#### route

- **route** - async func(req, res, handlers)
- **handlers** - {cmd: handler}
- **handler** - async func(input) => any

If `handler` returns neither `ok` nor `fail`, the returned-value will be put into `ok.output`.

If `handler` throws an error, it will be put into `fail.error`.

#### ok

- **ok** - func([code], [output]) => HandlerResult

#### fail

- **fail** - func(code, [output], [err]) => HandlerResult 

## License

MIT