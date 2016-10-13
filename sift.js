'use strict'

const gcoinrpc = require('gcoind-rpc')
const MongoClient = require('mongodb').MongoClient
const S = require('string')

const mongodbUrl = 'mongodb://localhost:27017/ach'
const collectionName = 'tx'

function arrayUnique(array) {
  let a = array.concat()
  for(let i = 0; i < a.length; ++i) {
    for(let j = i + 1; j < a.length; ++j) {
      if(a[i] === a[j])
        a.splice(j--, 1)
    }
  }
  return a;
}

let pbankList
let rbankList

MongoClient.connect(mongodbUrl, (err, db) => {
  const collection = db.collection(collectionName)

  collection.distinct('P_PBANK', (error, docs) => {
    if (!error) {
      // console.log(docs)
      console.log(docs.length)
      pbankList = docs
      collection.distinct('P_RBANK', (error, docs) => {
        if (!error) {
          // console.log(docs)
          console.log(docs.length)
          rbankList = docs
          let uniqueBankList = arrayUnique(pbankList.concat(rbankList))
          console.log(uniqueBankList.length)
        }
        else {
          console.log(error)
        }
        db.close()
      })
    }
    else {
      console.log(error)
    }
    db.close()
  })
})