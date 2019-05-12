'use strict'

const { serverPort, screenshotDir, dbPath } = require('./config')
const express = require('express')
const fs = require('fs-extra')

module.exports = () => {
  const app = express()

  // Serve screenshots
  app.use('/screenshots', express.static(screenshotDir))

  // Serve classes data
  app.get('/classes', async (req, res) => {
    res.set('Content-Type', 'application/json')

    const exists = await fs.pathExists(dbPath)
    if (!exists) return res.json({ classes: {} })

    const { classes } = require(dbPath)
    res.json({ classes })
  })

  // Serve application
  app.use('/', express.static('./public'))

  // Start the server
  app.listen(serverPort, () => console.log(`Server is listening on http://localhost:${serverPort}`))
}
