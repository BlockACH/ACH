'use strict';

const csv = require('csv-parser');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const stream = fs.createReadStream('../data/ach/txdata_bc_10506_TDES_20161005111019.csv');
const mongodbUrl = 'mongodb://ach.csie.org:27017/ach';
const sleep = time => new Promise(resolve => setTimeout(resolve, time));

let collection;
let db;
let count = 0;

const collectionName = '06Txs';
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

let txList = [];
MongoClient.connect(mongodbUrl, (err, database) => {
  db = database;
  collection = db.collection(collectionName);
  stream
    .pipe(csv(achCsvHeader))
    .on('data', (data) => {
      txList.push(data);
      count += 1;

      if (txList.length % 100000 === 0) {
        stream.pause();
        console.log(txList.length);
        collection.insertMany(txList, (error, result) => {
          if (error) {
            console.log(`error: ${error}`);
          } else {
            console.log(`result: ${JSON.stringify(result.result.n, null, 4)}`);
            txList = [];
            stream.resume();
          }
        });
      }
    })
    .on('end', () => {
      sleep(5000).then(() => {
        if (txList.length > 0) {
          collection.insertMany(txList, (error, result) => {
            if (error) {
              console.log(`error: ${error}`);
            } else {
              console.log(`result: ${JSON.stringify(result.result.n, null, 4)}`);
              db.close();
            }
          });
        }
        console.log(`Read csv is done, count is ${count}`);
      });
    });
});
