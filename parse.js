'use strict';

const csv = require('csv-parser');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const stream = fs.createReadStream('../txdata_1050601_1050603.csv');
const mongodbUrl = 'mongodb://localhost:27017/ach';

let collection;
let db;

const txList = [];

stream
  .pipe(csv())
  .on('data', (data) => {
    txList.push(data);
  })
  .on('end', () => {
    console.log(`Read csv is done, txList length is ${txList.length}`);

    MongoClient.connect(mongodbUrl, (err, database) => {
      db = database;
      collection = db.collection('tx');
      collection.insertMany(txList, (error, result) => {
        if (error) {
          console.log(`error: ${error}`);
        } else {
          console.log(`result: ${result}`);
          db.close();
        }
      });
    });
  });
