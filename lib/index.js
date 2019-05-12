'use strict'

const path = require('path')
const fs = require('fs-extra')
const puppeteer = require('puppeteer')
const db = require('./db')
const { screenshotDir, planningLink } = require('../config')

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

// Calculate the time an operation took to execute
const getDuration = timeObj => Math.round((timeObj[0] * 1e9 + timeObj[1]) * 1e-6)

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
 * Screenshot every classes
 * @param {Object} page The Puppeteer page object
 * @returns {Promise<void>} List of available classes
 */
const screenClasses = async page => {
  // Click on first class to focus it
  page.mouse.click(100, 130)
  await delay(3000)

  // Get the list of classes
  const classes = await getClassesList(page)
  console.log('List of classes: ', JSON.stringify(classes) || null, '\n')

  const planningEle = await page.$('.x-panel-body-noheader.x-panel-body-noborder')
  const boundingBox = await planningEle.boundingBox()
  const planningEleClip = {
    x: boundingBox.x,
    y: boundingBox.y,
    width: Math.min(boundingBox.width, page.viewport().width) - 463,
    height: Math.min(boundingBox.height, page.viewport().height) - 110
  }

  // Screenshot each class
  for (const aClass of classes) {
    const classId = toKebabCase(aClass)
    // Enhance page style
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('*')).forEach(ele => (ele.style.fontFamily = 'Helvetica, Arial, sans-serif')))

    console.log(`Taking a screenshot of the planning of "${aClass}"...`)
    const screenPath = await screenshot(page, classId, planningEleClip)
    db.set(`classes.${classId}`, { class: aClass, screenPath, screenDate: new Date() }).write()
    console.log(`Screenshot saved to ${screenPath}.`)

    await delay(100)
    await page.keyboard.press('ArrowDown')
    await delay(3000)
  }
}

/**
 * Get the planning
 * @param {Boolean} [visible=false] Should the browser be visible
 * @returns {Promise<void>} Main script done
 */
const setup = async (visible = false) => {
  console.log(`${new Date().toJSON()} - The screenshotting service process is starting...`)
  const fullStartTime = process.hrtime()

  const browser = await puppeteer.launch({ headless: !visible })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.exposeFunction('delay', delay)

  await page.goto(planningLink)
  // Wait for page to finish loading
  await page.waitFor(() => document.querySelector('div[id=\'Direct Planning Tree_-1\'] > div > img:nth-child(1)'))

  console.log('\nExpanding classes...')
  await expandClasses(page)
  console.log('Classes expanded.')

  console.log('\nTaking screenshots of the planning...')
  await screenClasses(page)

  const fullEndTime = process.hrtime(fullStartTime)
  console.log(`The screenshotting service process finished. It took ${getDuration(fullEndTime)} ms\n`)

  console.log('Closing the browser...')
  await browser.close()
}

module.exports = setup
