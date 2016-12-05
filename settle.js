'use strict';

const astarMongo = require('./astarMongo');
const moment = require('moment');
const Bank = require('./bank');
const _ = require('lodash');
const co = require('co');

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

const getPreviousDateString = function getPreviousDateString(currentDateString) {
  const acDateString = `${(parseInt(currentDateString.substring(0, 4), 10) + 1911).toString()}${currentDateString.substring(4, 8)}`;
  const previousDate = moment(acDateString, 'YYYYMMDD').add(-1, 'd');
  const previousDateString = `${'0'.concat((parseInt(previousDate.format('YYYY'), 10) - 1911).toString())}${previousDate.format('MMDD')}`;
  console.log(`in func ${previousDateString}`);
  return previousDateString;
};

const findPreviousDateWithTx = function findPreviousDate(db, collectionName, currentDateString) {
  return co(function* __() {
    let previousDateString = getPreviousDateString(currentDateString);
    let isFound = false;
    const dateWithTxList = yield db.collection(collectionName).distinct('P_TDATE');
    while (!isFound) {
      if (_.indexOf(dateWithTxList, previousDateString) > -1) {
        isFound = true;
      } else {
        previousDateString = getPreviousDateString(previousDateString);
      }
    }
    return previousDateString;
  });
};

// astarMongo.connect((astarError, astarDb) => {
//   if (!astarError) {
//     co(function* __() {
//       const answer = yield findPreviousDateWithTx(astarDb, '06Txs', '01050620');
//       console.log(answer);
//       astarDb.close();
//     });
//   }
// });

astarMongo.connect((astarError, astarDb) => {
  if (!astarError) {
    co(function* __() {
      const filter = { $or: [{ P_TDATE: currentDay }, { P_TDATE: previousDay, P_TYPE: 'N' }] };
      console.log(`filter:${JSON.stringify(filter, null, 4)}`);
      const txs = yield astarDb.collection('transactions').find(filter).toArray();
      console.log(`txs length: ${txs.length}`);
      console.log('txxxxxxxxs!');
      const bankManager = Bank.getManager();
      if (txs.length) {
        for (const tx of txs) {
          console.log(tx.P_PBANK);
          const bank = bankManager.getBankByID(tx.P_PBANK.substring(0, 3));
          const bank2 = bankManager.getBankByID(tx.P_RBANK.substring(0, 3));
          // console.log(`bank:${JSON.stringify(bank, null, 4)}`);
          // console.log(`bank2:${JSON.stringify(bank2, null, 4)}`);
          const rawTx = yield bank.sendTo(bank2, parseFloat(tx.P_AMT) / 100000000, 2, 'wow');
          console.log(rawTx);
        }
      }
    });
  }
});
// astarMongo.connect((err, db) => {
//   const collection = db.collection('tx');
//   collection.find({
//     $or: [{ P_TDATE: currentDay }, { P_TDATE: previousDay, P_TYPE: 'N' }],
//   }).toArray((error, docs) => {
//     if (err) {
//       console.error(`error: ${error}`);
//     } else {
//       let bankList = {};
//       let proposer;
//       let receiver;
//       let amount;
//       for (const tx of docs) {
//         proposer = tx.P_PBANK.substring(0, 3);
//         receiver = tx.P_RBANK.substring(0, 3);
//         amount = parseFloat(tx.P_AMT);
//
//         bankList = initBankInBankList(proposer, bankList);
//         bankList = initBankInBankList(receiver, bankList);
//
//         if (tx.P_TDATE === previousDay) {
//           if (tx.P_TYPE === 'N' && tx.P_TXTYPE === 'SD') {
//             bankList[proposer].sd += amount;
//             bankList[receiver].sd -= amount;
//           }
//         } else if (tx.P_TDATE === currentDay) {
//           if (tx.P_TXTYPE === 'SC') {
//             bankList[proposer].sc -= amount;
//             bankList[receiver].sc += amount;
//           } else if (tx.P_TYPE === 'R' && tx.P_TXTYPE === 'SD') {
//             bankList[proposer].sd += amount;
//             bankList[receiver].sd -= amount;
//           }
//         }
//       }
//
//       for (const bankKey of _.keys(bankList)) {
//         bankList[bankKey].net = bankList[bankKey].sc + bankList[bankKey].sd;
//       }
//
//       console.log(bankList);
//       console.log(docs.length);
//       db.close();
//     }
//   });
// });
