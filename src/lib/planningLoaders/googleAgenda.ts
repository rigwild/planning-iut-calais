import { Page } from 'puppeteer'

import { delay, screenshot } from '../utils'
import db from '../db'

/**
 * Get the planning
 * @param page Puppeteer page object
 * @param className Full class name
 * @param classId Class identifier
 * @param planningUri Google Agenda URI
 * @returns Main script done
 */
const setup = async (page: Page, className: string, classId: string, planningUri: string) => {
  await page.goto(planningUri)
  await delay(500)

  // Search for the class
  await page.click('#tab-controller-container-week')
  await delay(500)

  console.log('Taking screenshots of the planning...')

  let classScreenshots = []

  // Enhance page style
  await page.addStyleTag({
    content: `
      .chip dl {
        display: flex;
        flex-direction: column
      }
      .cbrd dt {
        padding: 6px;
        text-align: center;
      }
      .chip dd {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        height: 100%;
      }`
  })

  // Screenshot 4 weeks for the current class
  for (let i = 1; i <= 4; i++) {
    await delay(500)

    console.log(`Taking a screenshot of the planning of "${className}", week ${i}...`)
    const screenPath = await screenshot(page, `${classId}-${i}`)
    classScreenshots.push({ screenPath, screenDate: new Date() })
    console.log(`Screenshot saved to ${screenPath}.`)

    // Click on the next week button
    await page.click('#navForward1')
    await delay(1000)
  }
  // Write screenshots to db
  db.setScreenshot(className, classScreenshots)
}

export default setup
