import { Page, BoundingBox } from 'puppeteer'

import { getCurrentWeekNumber, getClassesListAde, toKebabCase, delay, selectWeekAde, screenshot, expandClassesAde } from '../utils'
import db from '../db'
import { PLANNING_LINK_IUT } from '../../config'

/**
 * Screenshot every classes
 * @param page The Puppeteer page object
 * @returns List of available classes
 */
const screenClasses = async (page: Page) => {
  // Screen size
  const viewport = {
    x: page.viewport().width,
    y: page.viewport().height
  }

  // Click on a week so the weeks buttons get the 'aria-pressed' attribute
  await page.mouse.click(370, viewport.y - 30)

  // Calculate current week number
  const currentWeek = getCurrentWeekNumber()

  // Get the list of classes
  const classes = await getClassesListAde(page)
  console.log('List of classes: ', JSON.stringify(classes) || null, '\n')

  // Get future screenshot bounding box
  const planningEle = await page.$('.x-panel-body-noheader.x-panel-body-noborder')
  if (!planningEle) return
  const boundingBox = <BoundingBox>await planningEle.boundingBox()

  const planningEleClip = {
    x: boundingBox.x,
    y: boundingBox.y,
    width: Math.min(boundingBox.width, viewport.x) - 463,
    height: Math.min(boundingBox.height, viewport.y) - 110
  }

  // Offset between each class
  const classOffset = 23
  // This records the position of the cursor of the currently selected class
  let classMousePosition = { x: 200, y: 130 }

  // Screenshot each class
  for (const aClass of classes) {
    // Generate an id for the current class
    const classId = toKebabCase(aClass)
    let classScreenshots = []

    // Select the class
    await page.mouse.click(classMousePosition.x, classMousePosition.y)
    await delay(3000)

    // Screenshot 4 weeks for the current class
    for (let i = 1; i <= 4; i++) {
      // Click on the current loop's week
      await selectWeekAde(page, currentWeek - 1 + i)
      await delay(3000)

      // Enhance page style
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('*')).forEach(ele => ((<HTMLElement>ele).style.fontFamily = 'Helvetica, Arial, sans-serif')))

      console.log(`Taking a screenshot of the planning of "${aClass}", week ${i}...`)
      const screenPath = await screenshot(page, `${classId}-${i}`, planningEleClip)
      classScreenshots.push({ screenPath, screenDate: new Date() })
      console.log(`Screenshot saved to ${screenPath}.`)
    }
    // Write screenshots to db
    db.setScreenshot(aClass, classScreenshots)

    // Clear class screenshots
    classScreenshots = []
    // Move the mouse to prepare the next class selection
    classMousePosition.y += classOffset
  }
}

/**
 * Get the planning
 * @param page Puppeteer page object
 * @returns Main script done
 */
const setup = async (page: Page) => {
  await page.goto(PLANNING_LINK_IUT)

  // Click on "Ouvrir"
  await delay(500)
  await page.mouse.click(963, 683)

  // Wait for page to finish loading
  await page.waitFor(() => document.querySelector('div[id=\'Direct Planning Tree_-1\'] > div > img:nth-child(1)'))

  console.log('Expanding classes...')
  await expandClassesAde(page)
  console.log('Classes expanded.')

  console.log('Taking screenshots of the planning...')
  await screenClasses(page)
}

export default setup
