'use strict'

const CronJob = require('cron').CronJob
const screenshotPlannings = require('./lib')
const server = require('./server')
const { cronTime } = require('./config')

const argv = process.argv.slice(2)

if (argv.includes('--service')) {
  // Start the screenshotting service
  new CronJob(cronTime, () => screenshotPlannings(argv.includes('--no-headless')).catch(console.error), null, true, null, null, true)
  console.log('Started the cron job.')
}

if (argv.includes('--server')) {
  // Start the server
  server()
}
