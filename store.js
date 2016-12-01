'use strict';

const csv = require('csv-parser');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const stream = fs.createReadStream('../data/ach/txdata_bc_10508_TDES_20161005111019.csv');
const mongodbUrl = 'mongodb://ach.csie.org:27017/ach';

let collection;
let db;
let count = 0;

const collectionName = 'achTxs';
const achCsvHeader = [
  'P_TDATE',
  'P_SCHD',
  'P_TYPE',
  'P_SEQ',
  'P_PBANK',
  'P_CID',
  'P_TTIME',
  'P_TXTYPE',
  'P_TXID',
  'P_PCLNO',
  'P_RBANK',
  'P_RCLNO',
  'P_AMT',
  'P_RCODE',
  'P_PID',
  'P_SID',
  'P_PDATE',
  'P_PSEQ',
  'P_PSCHD',
  'P_CNO',
  'P_NOTE',
  'P_FILLER',
  'P_STAT',
  'IS_DELEGATE',
  'IMP_OPBK_ID',
]

// let slot = 0
let txList = [];
MongoClient.connect(mongodbUrl, (err, database) => {
  db = database;
  collection = db.collection(collectionName);
  stream
    .pipe(csv(achCsvHeader))
    .on('data', (data) => {
      txList.push(data);
      count += 1;

      if (txList.length % 500000 === 0) {
        stream.pause();
        console.log(txList.length);
        collection.insertMany(txList, (error, result) => {
          if (error) {
            console.log(`error: ${error}`);
          } else {
            console.log(`result: ${result}`);
            txList = [];
            stream.resume();
          }
        });
      }
    })
    .on('end', () => {
      collection.insertMany(txList, (error, result) => {
        if (error) {
          console.log(`error: ${error}`);
        } else {
          console.log(`result: ${result}`);
          db.close();
        }
      });
      console.log(`Read csv is done, count is ${count}`);
    });
});

