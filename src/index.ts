import { CronJob } from 'cron'

import screenshotPlannings from './lib'
import server from './server'
import { SCREENSHOT_SERVICE_CRONTIME } from './config'

const argv = process.argv.slice(2)

// Start the screenshotting service
if (argv.includes('--service')) {
  new CronJob(SCREENSHOT_SERVICE_CRONTIME, () => screenshotPlannings(argv.includes('--no-headless')).catch(console.error), undefined, true, undefined, undefined, true)
  console.log('Started the cron job.')
}

// Start the server
if (argv.includes('--server')) server()
