import path from 'path'
import fs from 'fs-extra'
import { Page, BoundingBox } from 'puppeteer'

import { SCREENSHOT_DIR_PATH } from '../config'

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

/**
 * Convert any string to kebab-case.
 * Removes accents, multiples whitespaces and symbols to one "-" and converts to lower case.
 * Removes any leading and leading "-".
 *
 * @param str string to convert
 * @author rigwild <contact@asauvage.fr>
 * @see https://gist.github.com/rigwild/3e4d30bd269535b7508926c8beaeef90
 */
export const toKebabCase = (str: string) => str
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/\s+]/gi, '-')
  .replace(/\-+/g, '-')
  .replace(/^\-|\-$/g, '')
  .toLowerCase()

/**
 * Get the current week's number
 * @returns Week number
 */
export const getCurrentWeekNumber = () => {
  let date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

/**
 * Screenshot the page
 * @param page The Puppeteer page object
 * @param fileNameNoExt File name of the saved screenshot, without extension
 * @param clip Crop configuration of the screenshot
 * @returns URI path to the screenshot
 */
export const screenshot = async (page: Page, fileNameNoExt: string, clip: BoundingBox) => {
  const fileName = `${fileNameNoExt}.png`
  const screenPath = path.resolve(SCREENSHOT_DIR_PATH, fileName)
  await fs.ensureFile(screenPath)
  await page.screenshot({
    path: screenPath,
    type: 'png',
    fullPage: clip ? undefined : true,
    clip
  })
  return `/${path.basename(SCREENSHOT_DIR_PATH)}/${fileName}`
}

/**
 * Expand all classes in the EDT
 * ADE Planning only
 * @param page The Puppeteer page object
 * @returns Screenshot is saved
 */
export const expandClassesAde = async (page: Page) => page.evaluate(async () => {
  let expandable
  while ((expandable = Array.from(document.querySelectorAll('img[style$=\'-66px 0px;\']'))).length > 0) {
    expandable.forEach(ele => (<HTMLElement>ele).click())
    await (<Window & { delay: (timeout: number) => {} }>(<unknown>window)).delay(500)
  }
})

/**
 * Get a list of all available classes
 * ADE Planning only
 * @param page The Puppeteer page object
 * @returns List of available classes
 */
export const getClassesListAde = (page: Page) => page.evaluate(() => Array.from(document.querySelectorAll('.x-tree3-node-text')).map(x => (<HTMLElement>x).innerText))

/**
 * Render a week's planning by selecting it.
 * ADE Planning only
 * @param page The Puppeteer page object
 * @param weekNumber The week number to show
 * @returns Week should be selected
 */
export const selectWeekAde = (page: Page, weekNumber: number) => page.evaluate((_weekNumber) => {
  const week = Array.from(document.querySelectorAll<HTMLElement>('table[role="presentation"] > tbody > tr:nth-child(2) > td.x-btn-mc > em > button[aria-pressed]'))
    .filter(x => x.innerText.match(/S(.*?)\s/))
    .map(x => ({
      ele: x,
      week: parseInt(((<HTMLElement>x).innerText.match(/S(.*?)\s/) || [])[1], 10)
    }))
    .slice(0, 52)
    .find(x => x.week === _weekNumber)
  if (week) week.ele.click()
}, weekNumber)


/**
 * Wait for page to finish loading.
 * ADE Planning only
 * @param page Puppeteer page object
 * @returns page finished loading
 */
export const waitLoadingAde = (page: Page) => page.waitFor(() => document.querySelector('div[id=\'Direct Planning Tree_-1\'] > div > img:nth-child(1)'))
