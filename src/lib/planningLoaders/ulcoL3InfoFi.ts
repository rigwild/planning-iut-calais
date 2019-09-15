import { Page, BoundingBox } from 'puppeteer'

import { getCurrentWeekNumber, delay, selectWeekAde, screenshot } from '../utils'
import db from '../db'
import { PLANNING_LINK_ULCO } from '../../config'

const rawClassName = 'LICENCE 3 STS INFORMATIQUE/INFORMATIQUE A CALAIS'
const className = 'LICENCE 3 INFO FI - ULCO'
const classId = 'ulco-l3-info-fi'

/**
 * Screenshot the class
 * @param page The Puppeteer page object
 * @returns Class was screenshotted
 */
const screenClass = async (page: Page) => {
  // Screen size
  const viewport = {
    x: page.viewport().width,
    y: page.viewport().height
  }

  // Click on a week so the weeks buttons get the 'aria-pressed' attribute
  await page.mouse.click(370, viewport.y - 30)
  await delay(1000)

  // Calculate current week number
  const currentWeek = getCurrentWeekNumber()

  // Get future screenshot bounding box
  const planningEle = await page.$('.x-panel-body-noheader.x-panel-body-noborder')
  if (!planningEle) return
  const boundingBox = <BoundingBox>await planningEle.boundingBox()

  const planningEleClip = {
    x: boundingBox.x,
    y: boundingBox.y,
    width: Math.min(boundingBox.width, viewport.x) - 463 + 230,
    height: Math.min(boundingBox.height, viewport.y) - 110
  }

  let classScreenshots = []

  // Enhance page style
  await page.addStyleTag({ content: '* { font-family: Helvetica, Arial, sans-serif !important; }' })

  // Screenshot 4 weeks for the current class
  for (let i = 1; i <= 4; i++) {
    // Click on the current loop's week
    await selectWeekAde(page, currentWeek - 1 + i)
    await delay(3000)

    console.log(`Taking a screenshot of the planning of "${className}", week ${i}...`)
    const screenPath = await screenshot(page, `${classId}-${i}`, planningEleClip)
    classScreenshots.push({ screenPath, screenDate: new Date() })
    console.log(`Screenshot saved to ${screenPath}.`)
  }
  // Write screenshots to db
  db.setScreenshot(className, classScreenshots)
}

/**
 * Get the planning
 * @param page Puppeteer page object
 * @returns Main script done
 */
const setup = async (page: Page) => {
  await page.goto(PLANNING_LINK_ULCO)
  await page.waitFor(() => document.querySelector('div[id=\'Direct Planning Tree_-1\'] > div > img:nth-child(1)'))

  // Search for the class
  await page.mouse.click(80, 50)
  await page.keyboard.type(rawClassName)
  await page.keyboard.press('Enter')

  // Wait for page to finish loading
  await delay(5000)

  console.log('Taking screenshots of the planning...')
  await screenClass(page)
}

export default setup
