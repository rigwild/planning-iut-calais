'use strict'

const { serverPort, screenshotDir, dbPath } = require('./config')
const express = require('express')
const fs = require('fs-extra')

module.exports = () => {
  const app = express()

  // Serve screenshots
  app.use('/screenshots', express.static(screenshotDir))

  // Serve screenshots data
  app.get('/screenshotsData', async (req, res) => {
    res.set('Content-Type', 'application/json')

    const exists = await fs.pathExists(dbPath)
    if (!exists) return res.json({ screenshots: {} })

    const { screenshots } = require(dbPath)
    res.json({ screenshots })
  })

  // Serve application
  app.use('/', express.static('./public'))

  // Start the server
  app.listen(serverPort, () => console.log(`Server is listening on http://localhost:${serverPort}`))
}
