import puppeteer from 'puppeteer'

import iutPlanningLoader from './planningLoaders/iut'
import ulcoL3InfoFiPlanningLoader from './planningLoaders/ulcoL3InfoFi'
import ulcoL3InfoAppPlanningLoader from './planningLoaders/ulcoL3InfoApp'
import { isVPS } from '../config'
import { delay } from './utils'

/**
 * Get the planning
 * @param {Boolean} [visible=false] Should the browser be visible
 * @returns {Promise<void>} Main script done
 */
const setup = async (visible = false) => {
  console.log(`${new Date().toLocaleString()} - The screenshotting service process is starting...`)

  const browser = await puppeteer.launch({
    headless: !visible,
    args: isVPS ? ['--no-sandbox'] : undefined
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.exposeFunction('delay', delay)

    console.log(`${new Date().toLocaleString()} - Screenshotting the plannings of IUT Calais...\n`)
    await iutPlanningLoader(page)

    console.log(`${new Date().toLocaleString()} - Screenshotting the planning of ULCO Licence 3 Informatique FI...\n`)
    await ulcoL3InfoFiPlanningLoader(page)

    console.log(`${new Date().toLocaleString()} - Screenshotting the planning of ULCO Licence 3 Informatique APP...\n`)
    await ulcoL3InfoAppPlanningLoader(page)

    console.log(`${new Date().toLocaleString()} - The screenshotting service process finished.\n`)
  }
  catch (err) {
    throw err
  }
  finally {
    console.log('Closing the browser...')
    await browser.close()
  }
}

export default setup
