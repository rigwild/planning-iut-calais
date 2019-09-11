import fs from 'fs-extra'
import path from 'path'
import express from 'express'

import { SERVER_PORT, SCREENSHOT_DIR_PATH, DATABASE_PATH } from './config'

export default () => {
  const app = express()

  // Serve screenshots
  app.use('/screenshots', express.static(SCREENSHOT_DIR_PATH))

  // Serve classes data
  app.get('/classes', async (req, res) => {
    res.set('Content-Type', 'application/json')

    const exists = await fs.pathExists(DATABASE_PATH)
    if (!exists) return res.json({ classes: {} })

    const { classes } = JSON.parse(await fs.promises.readFile(DATABASE_PATH, 'utf-8'))
    res.json({ classes })
  })

  // Serve application
  app.use('/', express.static(path.resolve(__dirname, '..', 'public')))

  // Start the server
  app.listen(SERVER_PORT, () => console.log(`Server is listening on http://localhost:${SERVER_PORT}`))
}
