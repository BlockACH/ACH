'use strict';

const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

const mongodbUrl = 'mongodb://localhost:27017/ach';

let collection;
let db;

MongoClient.connect(mongodbUrl, (err, database) => {
  db = database;
  collection = db.collection('tx');
  collection.find({ P_TDATE: '01050601' }).toArray((error, docs) => {
    if (err) {
      console.error(`error: ${error}`);
    } else {
      const bankList = {};
      let proposer;
      let amount;
      for (const tx of docs) {
        proposer = tx.P_PBANK.substring(0, 3);
        amount = parseFloat(tx.P_AMT.substring(1, 11), 10);
        if (proposer === 'A0D') {
          console.log(`${tx.P_PBANK}, ${tx.P_TYPE}, ${tx.P_TXTYPE}, ${amount}, ${tx.P_AMT}`);
        }
        if (!(proposer in bankList)) {
          bankList[proposer] = { sc: 0.0, sd: 0.0, net: 0.0 };
        }
        if (tx.P_TYPE === 'N' && tx.P_TXTYPE === 'SC') {
          bankList[proposer].sc -= amount;
        } else if (tx.P_TYPE === 'N' && tx.P_TXTYPE === 'SD') {
          bankList[proposer].sd -= amount;
        } else if (tx.P_TYPE === 'R' && tx.P_TXTYPE === 'SC') {
          bankList[proposer].sc += amount;
        } else if (tx.P_TYPE === 'R' && tx.P_TXTYPE === 'SD') {
          bankList[proposer].sd += amount;
        } else {
          console.log('anomally!');
        }
      }
      for (const bankKey of _.keys(bankList)) {
        bankList[bankKey].net = bankList[bankKey].sc + bankList[bankKey].sd;
      }
      console.log(bankList);
      console.log(docs.length);
      db.close();
    }
  });
});
