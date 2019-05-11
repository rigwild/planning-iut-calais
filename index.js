'use strict'

const CronJob = require('cron').CronJob
const screenshotPlannings = require('./lib')
const { planningLink, cronTime } = require('./config')

new CronJob(cronTime, () => screenshotPlannings(planningLink, false), null, true, null, null, true)
console.log('Started the cron job.')
