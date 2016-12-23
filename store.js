'use strict';

const csv = require('csv-parser');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const stream = fs.createReadStream('../data/ach/txdata_bc_10508_TDES_20161005111019.csv');
const mongodbUrl = 'mongodb://ach.csie.org:27017/ach';

let collection;
let db;
let count = 0;

const collectionName = 'transactions';
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
];

MongoClient.connect(mongodbUrl, (err, database) => {
  db = database;
  collection = db.collection(collectionName);
  stream
    .pipe(csv(achCsvHeader))
    .on('data', (data) => {
      count += 1;
      if (count % 20000 === 0) {
        console.log(`count:${count}`);
      }
      collection.insert(data, (error, result) => {
        if (error) {
          console.error(`error:${error}`);
        } else {
          console.log(result.length);
        }
      });
    })
    .on('end', () => {
      console.log(`Read csv is done, count is ${count}`);
    });
});
