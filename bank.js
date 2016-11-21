/* eslint no-use-before-define: ["error", { "classes": false }]*/
const GcoinPresenter = require('./blockchain/gcoinPresenter');
const gcoinLib = require('gcoinjs-lib');
const bigi = require('bigi');
const co = require('co');

const config = require('./config.json');

const gcoin = new GcoinPresenter(config.gcoin);

class BankManager {
  constructor() {
    this.bankList = config.bankList;
    this.bankCache = {};
  }

  getBankByID(bankID) {
    // EA0 is a shared bank account for all the other unlisted banks.
    const targetBankID = this.bankList.includes(bankID) ? bankID : 'EA0';
    if (!(targetBankID in this.bankCache)) {
      this.bankCache[targetBankID] = new Bank(targetBankID);
    }
    return this.bankCache[targetBankID];
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
