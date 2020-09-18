import puppeteer from 'puppeteer'

import iutPlanningLoader from './planningLoaders/iut'
import ulcoL3InfoFiPlanningLoader from './planningLoaders/ulcoL3InfoFi'
import googleAgenda from './planningLoaders/googleAgenda'

import { isVPS, PLANNING_LINK_ULCO_M1_I2L, PLANNING_LINK_ULCO_M2_I2L, PLANNING_LINK_ULCO_L3_APP } from '../config'
import { delay } from './utils'

/**
 * Get the planning
 * @param visible Should the browser be visible
 * @returns Main script done
 */
const setup = async (visible: boolean = false): Promise<void> => {
  console.log(`${new Date().toLocaleString()} - The screenshotting service process is starting...`)

  const browser = await puppeteer.launch({
    headless: !visible,
    args: isVPS ? ['--no-sandbox', '--disable-setuid-sandbox'] : undefined,
    executablePath: process.env.WSL_DISTRO_NAME ? 'chrome.exe' : undefined
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
    await googleAgenda(page, 'L3 APP', 'ulco-l3-info-app', PLANNING_LINK_ULCO_L3_APP)

    console.log(`${new Date().toLocaleString()} - Screenshotting the planning of ULCO Master 1 I2L...\n`)
    await googleAgenda(page, 'M1 I2L', 'ulco-m1-i2l', PLANNING_LINK_ULCO_M1_I2L)

    console.log(`${new Date().toLocaleString()} - Screenshotting the planning of ULCO Master 2 I2L...\n`)
    await googleAgenda(page, 'M2 I2L', 'ulco-m2-i2l', PLANNING_LINK_ULCO_M2_I2L)

    console.log(`${new Date().toLocaleString()} - The screenshotting service process finished.\n`)
  } catch (err) {
    throw err
  } finally {
    console.log('Closing the browser...')
    await browser.close()
  }
}

export default setup
