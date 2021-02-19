import fs from 'fs-extra'
import path from 'path'
import { CronJob } from 'cron'

import screenshotPlannings from './lib'
import server from './server'
import { DATABASE_CLEAR_SERVICE_CRONTIME, SCREENSHOT_SERVICE_CRONTIME } from './config'

const argv = process.argv.slice(2)

// Start the screenshotting service
if (argv.includes('--service')) {
  new CronJob(
    SCREENSHOT_SERVICE_CRONTIME,
    () => screenshotPlannings(argv.includes('--no-headless')).catch(console.error),
    undefined,
    true,
    undefined,
    undefined,
    true
  )
  new CronJob(
    DATABASE_CLEAR_SERVICE_CRONTIME,
    async () => {
      const screenshotsDir = path.resolve(__dirname, '..', 'screenshots')
      const dbPath = path.resolve(__dirname, '..', 'db.json')
      await fs.remove(screenshotsDir)
      await fs.mkdir(screenshotsDir)
      await fs.remove(dbPath)
    },
    undefined,
    true
  )
  console.log('Started the cron job.')
}

// Start the server
if (argv.includes('--server')) server()
