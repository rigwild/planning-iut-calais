'use strict'

const path = require('path')
const fs = require('fs-extra')
const puppeteer = require('puppeteer')
const db = require('./db')
const { screenshotDir, planningLink, isVPS } = require('../config')

const delay = ms => new Promise(res => setTimeout(res, ms))

/**
 * Convert any string to kebab-case.
 * Removes accents, multiples whitespaces and symbols to one "-" and converts to lower case.
 * Removes any leading and leading "-".
 *
 * @param {string} str string to convert
 * @returns {string} string in kebab-case
 * @author rigwild <contact@asauvage.fr>
 * @see https://gist.github.com/rigwild/3e4d30bd269535b7508926c8beaeef90
 */
const toKebabCase = str => str
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/\s+]/gi, '-')
  .replace(/\-+/g, '-')
  .replace(/^\-|\-$/g, '')
  .toLowerCase()

/**
 * Calculate the time an operation took to execute
 * @param {any} timeObj time object
 * @returns {number} time in ms
 */
const getDuration = timeObj => Math.round((timeObj[0] * 1e9 + timeObj[1]) * 1e-6)

/**
 * Get the current week's number
 * @returns {number} week number
 */
const getCurrentWeekNumber = () => {
  let date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}


/**
 * Screenshot the page
 * @param {Object} page The Puppeteer page object
 * @param {String} fileNameNoExt File name of the saved screenshot, without extension
 * @param {String} clip Crop configuration of the screenshot
 * @returns {Promise<String>} Path to the screenshot
 */
const screenshot = async (page, fileNameNoExt, clip) => {
  const fileName = `${fileNameNoExt}.png`
  const screenPath = path.resolve(screenshotDir, fileName)
  await fs.ensureFile(screenPath)
  await page.screenshot({
    path: screenPath,
    type: 'png',
    fullPage: clip ? undefined : true,
    clip
  })
  return `/${path.basename(screenshotDir)}/${fileName}`
}

/**
 * Expand all classes in the EDT
 * @param {Object} page The Puppeteer page object
 * @returns {Promise<void>} Screenshot is saved
 */
const expandClasses = async page => page.evaluate(async () => {
  let expandable
  while ((expandable = Array.from(document.querySelectorAll('img[style$=\'-66px 0px;\']'))).length > 0) {
    expandable.forEach(ele => ele.click())
    await window.delay(500)
  }
})

/**
 * Get a list of all available classes
 * @param {Object} page The Puppeteer page object
 * @returns {Promise<String[]>} List of available classes
 */
const getClassesList = page => page.evaluate(() => Array.from(document.querySelectorAll('.x-tree3-node-text')).map(x => x.innerText))

/**
 * Render a week's planning by selecting it
 * @param {Object} page The Puppeteer page object
 * @param {number} weekNumber The week number to show
 * @returns {Promise<void>} Week should be selected
 */
const selectWeek = (page, weekNumber) => page.evaluate((_weekNumber) => {
  Array.from(document.querySelectorAll('table[role="presentation"] > tbody > tr:nth-child(2) > td.x-btn-mc > em > button[aria-pressed]'))
    .filter(x => x.innerText.match(/S(.*?)\s/))
    .map(x => ({
      ele: x,
      week: parseInt(x.innerText.match(/S(.*?)\s/)[1], 10)
    }))
    .slice(0, 52)
    .find(x => x.week === _weekNumber)
    .ele.click()
}, weekNumber)

/**
 * Screenshot every classes
 * @param {Object} page The Puppeteer page object
 * @returns {Promise<void>} List of available classes
 */
const screenClasses = async page => {
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
  const classes = await getClassesList(page)
  console.log('List of classes: ', JSON.stringify(classes) || null, '\n')

  // Get future screenshot bounding box
  const planningEle = await page.$('.x-panel-body-noheader.x-panel-body-noborder')
  const boundingBox = await planningEle.boundingBox()
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
      await selectWeek(page, currentWeek - 1 + i)
      await delay(3000)

      // Enhance page style
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('*')).forEach(ele => (ele.style.fontFamily = 'Helvetica, Arial, sans-serif')))

      console.log(`Taking a screenshot of the planning of "${aClass}", week ${i}...`)
      const screenPath = await screenshot(page, `${classId}-${i}`, planningEleClip)
      classScreenshots.push({ screenPath, screenDate: new Date() })
      console.log(`Screenshot saved to ${screenPath}.`)
    }
    // Write screenshots to db
    db.set(`classes.${classId}`, {
      class: aClass,
      weeks: classScreenshots.reduce((acc, x, i) => {
        acc[i + 1] = x
        return acc
      }, {})
    }).write()

    // Clear class screenshots
    classScreenshots = []
    // Move the mouse to prepare the next class selection
    classMousePosition.y += classOffset
  }
}

/**
 * Get the planning
 * @param {Boolean} [visible=false] Should the browser be visible
 * @returns {Promise<void>} Main script done
 */
const setup = async (visible = false) => {
  console.log(`${new Date().toLocaleString()} - The screenshotting service process is starting...`)
  const fullStartTime = process.hrtime()

  const browser = await puppeteer.launch({
    headless: !visible,
    args: isVPS ? ['--no-sandbox'] : undefined
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.exposeFunction('delay', delay)

    await page.goto(planningLink)

    // Click on "Ouvrir"
    await delay(500)
    await page.mouse.click(963, 683)

    // Wait for page to finish loading
    await page.waitFor(() => document.querySelector('div[id=\'Direct Planning Tree_-1\'] > div > img:nth-child(1)'))

    console.log('\nExpanding classes...')
    await expandClasses(page)
    console.log('Classes expanded.')

    console.log('\nTaking screenshots of the planning...')
    await screenClasses(page)

    const fullEndTime = process.hrtime(fullStartTime)
    console.log(`${new Date().toLocaleString()} - The screenshotting service process finished. It took ${getDuration(fullEndTime)} ms\n`)
  }
  catch (err) {
    throw err
  }
  finally {
    console.log('Closing the browser...')
    await browser.close()
  }
}

module.exports = setup
