'use strict'

const path = require('path')

module.exports = {
  serverPort: 8080,
  screenshotDir: path.resolve(__dirname, 'screenshots'),
  dbPath: path.resolve(__dirname, 'db.json'),
  planningLink: '',
  cronTime: '0 */4 * * *', // Every 4 hours
  isVPS: false
}
