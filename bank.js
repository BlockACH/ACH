/* eslint no-use-before-define: ["error", { "classes": false }]*/
const GcoinPresenter = require('./blockchain/gcoinPresenter');
const gcoinLib = require('gcoinjs-lib');
const bigi = require('bigi');
const co = require('co');

const config = require('./config.json');

const gcoin = new GcoinPresenter(config.gcoin);

const BANK_LIST = [
  '6AB', 'A28', '46E', 'DD3', '822', 'CCC', '219',
  '18C', '170', 'B63', '62F', '5E0', '666', '519',
  'BA4', '5BD', '682', 'E07', 'B31', '0B1', 'FCB',
  'B89', '101', 'EDB', 'E75', '75D', 'A0D', '22D',
  'AB5', 'A1D', 'F73', 'C45', '481', '49A', 'EE0',
  '269', '7BA', '48C', 'E0C', 'CE3', '8DA', '552',
  '1F6', 'B30', '6D4', 'FB4', '4AD', '940', '838',
  'E15', 'F8E', '717', 'C72', '882', 'EA0',
];

class BankManager {
  constructor() {
    this.bankList = BANK_LIST;
  }

  getBankByID(bankID) {
    if (this.bankList.includes(bankID)) {
      return new Bank(bankID);
    }
    return new Bank('EA0');
  }
}

class Bank {
  constructor(id) {
    this.id = id;
    this.keyPair = this.getKeyPair();
  }

  getAddress() {
    return this.keyPair.getAddress();
  }

  getKeyPair() {
    const hash = gcoinLib.crypto.sha256(this.id);
    const d = bigi.fromBuffer(hash);
    return new gcoinLib.ECPair(d);
  }

  sendTo(bank, amount, color, comment) {
    const self = this;
    return co(function* _() {
      // currently only type 5 support OP_RETURN
      const type = (typeof comment === 'undefined') ? 0 : 5;
      const rawTx = yield gcoin.createRawTx(
        self.keyPair,
        bank.getAddress(),
        amount,
        color,
        comment,
        type
      );
      return yield gcoin.sendrawtransaction(rawTx);
    });
  }

  static getManager() {
    return new BankManager();
  }
}

module.exports = Bank;
