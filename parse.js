'use strict'
const csv = require('csv-parser')
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient
const moment = require('moment');

const stream = fs.createReadStream('../txdata_1050601_1050603.csv')
const mongodbUrl = 'mongodb://localhost:27017/ach'

var collection
var filter
var db

var txList = []
var count = 0

function parseTaiwanYearToCE(dateString) {
  return (parseInt(dateString) + 1911 * 10000).toString()
}

var createNewEntries = function(db, entries, callback) {

    // Get the collection and bulk api artefacts
    var collection = db.collection('tx'),          
        bulk = collection.initializeOrderedBulkOp(), // Initialize the Ordered Batch
        counter = 0;    

    // Execute the forEach method, triggers for each entry in the array
    entries.forEach(function(obj) {         

        bulk.insert(obj);           
        counter++;

        if (counter % 1000 == 0 ) {
            // Execute the operation
            console.log(`counter is: ${counter}`)
            bulk.execute(function(err, result) {  
                // re-initialise batch operation           
                bulk = collection.initializeOrderedBulkOp();
                callback();
            });
        }
    });             

    if (counter % 1000 != 0 ){
        bulk.execute(function(err, result) {
            // do something with result 
            callback();             
        }); 
    } 
};


stream
  .pipe(csv())
  .on('data', (data) => {
    // console.log(parseTaiwanYearToCE(data.P_TDATE))
    data.P_TDATE = moment(parseTaiwanYearToCE(data.P_TDATE)).format()
    data.P_PDATE = moment(parseTaiwanYearToCE(data.P_PDATE)).format()
    txList.push(data)
    // count += 1
    // if (txList.length % 50000 == 0) {
    //   console.log(`txList length is: ${txList.length}`)
    //   collection.insertMany(txList, (error, result) => {
    //     if (!error) {
    //       txList.splice(0, txList.length)
    //       console.log(`count: ${count} insertMany!`)
    //       // console.log(`result: ${JSON.stringify(result)}`)
    //     } 
    //     else {
    //       console.log('error!')
    //       console.log(error)
    //     }
    //   })
    // }
  })
  .on('end', () => {
    console.log(`Read csv is done, txList length is ${txList.length}`)
    
    MongoClient.connect(mongodbUrl, (err, database) => {
      db = database
      collection = db.collection('tx')
      collection.insertMany(txList, (error, result) => {
        if (!error) {
          // txList.splice(0, txList.length)
          // console.log(`count: ${count} insertMany!`)
          // console.log(`result: ${JSON.stringify(result)}`)
          db.close()
        } 
        else {
          console.log('error!')
          console.log(error)
        }
      })
      // createNewEntries(database, txList, function() {
      //   database.close()
      // })
    })
  })



