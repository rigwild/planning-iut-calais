import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

import { DATABASE_PATH } from '../config'
import { toKebabCase } from './utils'

class Database {
  private db: lowdb.LowdbSync<{ classes: {} }> & { set: (...args: any) => any }

  constructor() {
    const adapter = new FileSync(DATABASE_PATH, { defaultValue: { classes: {} } })
    this.db = <lowdb.LowdbSync<{ classes: {} }> & { set: (...args: any) => any }>lowdb(adapter)
  }

  setScreenshot(className: string, weeks: { screenPath: string, screenDate: Date }[]) {
    const classId = toKebabCase(className)
    this.db.set(`classes.${classId}`, {
      class: className,
      weeks: {
        1: weeks[0],
        2: weeks[1],
        3: weeks[2],
        4: weeks[3]
      }
    }).write()
  }
}

export default new Database()
