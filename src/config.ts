import path from 'path'
import dotenvSafe from 'dotenv-safe'

// Load environment configuration
dotenvSafe.config({
  path: path.resolve(__dirname, '..', '.env'),
  example: path.resolve(__dirname, '..', '.env.example')
})

export const {
  SERVER_PORT,
  isVPS,
  PLANNING_LINK_IUT,
  PLANNING_LINK_ULCO,
  PLANNING_LINK_ULCO_L3_APP,
  PLANNING_LINK_ULCO_M1_I2L,
  PLANNING_LINK_ULCO_M2_I2L,
  SCREENSHOT_SERVICE_CRONTIME,
  DATABASE_CLEAR_SERVICE_CRONTIME
} = <{ [key: string]: string }>process.env

export const SCREENSHOT_DIR_PATH = path.resolve(__dirname, '..', 'screenshots')
export const DATABASE_PATH = path.resolve(__dirname, '..', 'db.json')
