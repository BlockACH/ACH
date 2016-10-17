'use strict';

// const gcoinrpc = require('gcoind-rpc');
// console.log('hi');
// const S = require('string');
const MongoClient = require('mongodb').MongoClient;
// const moment = require('moment');

const mongodbUrl = 'mongodb://localhost:27017/ach';
const collectionName = 'tx';
const todayString = '2016-06-02T00:00:00+08:00';
const yesterdayString = '2016-06-01T00:00:00+08:00';

let pbankSet;
let rbankSet;

function findUniqueBankList() {
  MongoClient.connect(mongodbUrl, (error, db) => {
    const collection = db.collection(collectionName);

    collection.distinct('P_PBANK', (err, docs) => {
      if (!err) {
        pbankSet = new Set(docs);
        collection.distinct('P_RBANK', (e, r) => {
          if (!e) {
            rbankSet = new Set(r);
            const uniqueBankList = Array.from(new Set([...rbankSet, ...pbankSet]));
            console.log(uniqueBankList);
            console.log(uniqueBankList.length);
          } else {
            console.log(e);
          }
          db.close();
        });
      } else {
        console.log(err);
        db.close();
      }
    });
  });
}

function getOriginalTxByRTxs(rTxs) {
  MongoClient.connect(mongodbUrl, (error, db) => {
    const collection = db.collection(collectionName);
    const oTxSet = new Set();
    for (let i = 0; i < rTxs.length; i += 1) {
      const filter = {
        P_TDATE: rTxs[i].P_PDATE,
        P_SEQ: rTxs[i].P_PSEQ,
        P_SCHD: rTxs[i].P_PSCHD,
        P_PBANK: rTxs[i].P_RBANK,
      };
      collection.find(filter).toArray((err, docs) => {
        let tx;
        for (tx of docs) {
          oTxSet.add(tx);
        }
        console.log(`oTxSet size is: ${oTxSet.size}`);
        console.log(docs.length);
        if (docs.length > 1) {
          console.log(docs);
        }
        // if (i === rTxs.length - 1) {
        //   console.log(`Original Tx amount is: ${oTxSet.size}`);
        // }
      });
    }
  });
}

function getTxsByStartDate(dateString) {
  MongoClient.connect(mongodbUrl, (error, db) => {
    const collection = db.collection(collectionName);
    const filter = { P_TDATE: dateString };
    collection.find(filter).toArray((err, docs) => {
      if (err) {
        console.error(err);
      } else {
        console.log(docs);
        console.log(docs.length);
      }
      db.close();
    });
  });
}

function getRTxsByStartDate(dateString) {
  MongoClient.connect(mongodbUrl, (error, db) => {
    const collection = db.collection(collectionName);
    const filter = { P_TDATE: dateString, P_TYPE: 'R' };
    collection.find(filter).toArray((err, docs) => {
      if (err) {
        console.error(err);
      } else {
        console.log(docs);
        getOriginalTxByRTxs(docs);
        console.log(`R Tx amount is: ${docs.length}`);
      }
      db.close();
    });
  });
}


// findUniqueBankList();
getRTxsByStartDate(todayString);
// getTxsByStartDate('2016-06-02T00:00:00+08:00');
