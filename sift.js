'use strict'

const gcoinrpc = require('gcoind-rpc')
const MongoClient = require('mongodb').MongoClient
const S = require('string')

const mongodbUrl = 'mongodb://localhost:27017/ach'
const collectionName = 'tx'


MongoClient.connect(mongodbUrl, (err, db) => {
  const collection = db.collection(collectionName)

  collection.distinct('P_PBANK', (error, docs) => {
    if (!error) {
      console.log(docs)
      console.log(docs.length)
      db.close()
    }
    else {
      console.log(error)
      db.close()
    }
  })
})