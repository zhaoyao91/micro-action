const os = require('os')

module.exports = {
  'ping': () => 'pong',
  'info': () => ({
    timeString: new Date(),
    time: (new Date()).getTime(),
    pid: process.pid,
    hostname: os.hostname(),
    ips: getIPs(),
  })
}

// copy from https://stackoverflow.com/a/10756441/3371998
function getIPs () {
  const interfaces = os.networkInterfaces()
  const addresses = []
  for (let k in interfaces) {
    for (let k2 in interfaces[k]) {
      const address = interfaces[k][k2]
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address)
      }
    }
  }
  return addresses
}