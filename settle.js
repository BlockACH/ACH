'use strict';

const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

const mongodbUrl = 'mongodb://140.112.29.42:27017/ach';


let collection;
let db;

const currentDay = '01050603';
const previousDay = '01050602';

const initBankInBankList = function initBankInBankList(bank, bankList) {
  const updatedBankList = bankList;
  if (!(bank in updatedBankList)) {
    updatedBankList[bank] = {
      sc: 0.0,
      sd: 0.0,
      net: 0.0,
    };
  }
  return updatedBankList;
};

MongoClient.connect(mongodbUrl, (err, database) => {
  db = database;
  collection = db.collection('tx');
  collection.find({
    $or: [{ P_TDATE: currentDay }, { P_TDATE: previousDay, P_TYPE: 'N' }],
  }).toArray((error, docs) => {
    if (err) {
      console.error(`error: ${error}`);
    } else {
      let bankList = {};
      let proposer;
      let receiver;
      let amount;
      for (const tx of docs) {
        proposer = tx.P_PBANK.substring(0, 3);
        receiver = tx.P_RBANK.substring(0, 3);
        amount = parseFloat(tx.P_AMT);

        bankList = initBankInBankList(proposer, bankList);
        bankList = initBankInBankList(receiver, bankList);

        if (tx.P_TDATE === previousDay) {
          if (tx.P_TYPE === 'N' && tx.P_TXTYPE === 'SD') {
            bankList[proposer].sd += amount;
            bankList[receiver].sd -= amount;
          }
        } else if (tx.P_TDATE === currentDay) {
          if (tx.P_TXTYPE === 'SC') {
            bankList[proposer].sc -= amount;
            bankList[receiver].sc += amount;
          } else if (tx.P_TYPE === 'R' && tx.P_TXTYPE === 'SD') {
            bankList[proposer].sd += amount;
            bankList[receiver].sd -= amount;
          }
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
