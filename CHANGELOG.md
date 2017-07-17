### 4.0.0

- remove built-in handlers. use [micro-base-apis](https://github.com/zhaoyao91/micro-base-apis) instead.
- add warning for duplicate cmd patterns.
- split out callers and protocol.

### 3.0.0

- add tests.
- now `route` is an high order function which returns a micro request handler.
- allow pass in options.
- optimize the error identifying and handling logic.
- support cmd pattern.
- add built-in handlers