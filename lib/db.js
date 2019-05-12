'use strict'

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { dbPath } = require('../config')

const adapter = new FileSync(dbPath)
const db = low(adapter)

db.defaults({ screenshots: {} }).write()

module.exports = db
