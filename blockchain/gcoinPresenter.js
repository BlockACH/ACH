const GcoinRpc = require('gcoind-rpc');
const gcoinLib = require('gcoinjs-lib');
const decimal = require('decimal');
const co = require('co');

class GcoinException {
  constructor(message) {
    this.message = message;
    this.name = 'GcoinException';
  }
}

class GcoinPresenter {
  constructor(config) {
    this.rpc = new GcoinRpc(config);
    this.extendsRpcToGcoinPresenter();
  }

  static countBalance(utxos) {
    const balance = {};
    utxos.forEach((utxo) => {
      const currentBalance = balance[utxo.color] || 0;
      balance[utxo.color] = currentBalance + utxo.value;
    });
    return balance;
  }

  static selectInput(utxos, amount, color, exceptInputs = []) {
    if (!utxos) {
      throw new GcoinException('Not valid utxos!');
    }

    const inputs = [];
    let count = 0;
    utxos.sort((x, y) => x.value - y.value);
    utxos.forEach((utxo) => {
      if (utxo.color === color && count < amount && !(exceptInputs.includes(utxo))) {
        inputs.push(utxo);
        count += utxo.value;
      }
    });

    if (count >= amount) {
      return inputs;
    }
    return [];
  }

  extendsRpcToGcoinPresenter() {
    const rpcSpec = [
      'getInfo',
      'mint',
      'gettxoutaddress',
      'sendrawtransaction',
    ];

    for (const method of rpcSpec) {
      this[method] = this.createGeneralRpcFunction(method);
      this[method.toLowerCase()] = this[method];
    }
  }

  createGeneralRpcFunction(methodName) {
    const self = this;
    return co.wrap(function* _(...args) {
      const rpcArgs = args;
      rpcArgs.unshift(methodName);
      const result = yield self.callRpc(...rpcArgs);
      return result;
    });
  }

  callRpc(methodName, ...args) {
    return new Promise((resolve, reject) => {
      // add callback function for rpc call
      args.push((err, ret) => {
        if (err) {
          reject(err);
        } else {
          resolve(ret.result);
        }
      });
      this.rpc[methodName](...args);
    });
  }

  createRawTx(keyPair, addressTo, amount, color, comment = '', type = 0) {
    const self = this;
    return co(function* _() {
      const feeColor = 1;
      const addressFrom = keyPair.getAddress();
      const utxos = yield self.callRpc('gettxoutaddress', addressFrom);
      const inputs = GcoinPresenter.selectInput(utxos, amount, color);
      const txBuilder = new gcoinLib.TransactionBuilder(null, type);

      if (inputs.length === 0) {
        throw new GcoinException('Not Enough Balance!');
      }
      inputs.forEach((input) => {
        txBuilder.addInput(input.txid, input.vout, 0xffffffff, input.scriptPubKey);
      });

      let feeInputs = [];
      if (color !== feeColor || GcoinPresenter.countBalance(inputs)[1] - amount < 1) {
        feeInputs = GcoinPresenter.selectInput(utxos, 1, 1, inputs);
      }
      feeInputs.forEach((input) => {
        txBuilder.addInput(input.txid, input.vout, 0xffffffff, input.scriptPubKey);
      });

      txBuilder.addOutput(
        addressTo,
        decimal(amount).mul(100000000).toNumber(),
        color
      );
      if (comment !== '') {
        const dataScript = gcoinLib.script.nullDataOutput(new Buffer(comment));
        txBuilder.addOutput(dataScript, 0, 0);
      }

      const inputBalance = GcoinPresenter.countBalance(inputs.concat(feeInputs));
      Object.keys(inputBalance).forEach((key) => {
        let changeAmount = inputBalance[key];
        if (key === color.toString()) {
          changeAmount -= amount;
        }
        if (key === feeColor.toString()) {
          changeAmount -= 1;
        }
        txBuilder.addOutput(
          addressFrom,
          decimal(changeAmount).mul(100000000).toNumber(),
          parseInt(key, 10)
        );
      });

      txBuilder.inputs.forEach((input, idx) => {
        txBuilder.sign(idx, keyPair);
      });
      return txBuilder.build().toHex();
    }).catch((err) => {
      console.log(err);
    });
  }

  getAddressBalance(address) {
    const self = this;
    return co(function* _() {
      const utxos = yield self.callRpc('gettxoutaddress', address);
      return GcoinPresenter.countBalance(utxos);
    });
  }

  getNewAddress() {
    const self = this;
    return co(function* _() {
      yield self.callRpc('keypoolrefill');
      return yield self.callRpc('getnewaddress');
    });
  }

  createLicense(address, color, name) {
    const self = this;
    const license = {
      name,
      version: 1,
      description: 'testing',
      issuer: 'Gcoin',
      divisibility: true,
      fee_type: 'fixed',
      fee_rate: 0.0,
      upper_limit: 0,
      fee_collector: 'none',
      mint_schedule: 'free',
      member_control: false,
      metadata_link: 'http://g-coin.org',
      metadata_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    };

    return co(function* _() {
      const licenseHex = yield self.callRpc('encodeLicenseInfo', license);
      return yield self.callRpc('sendLicenseToAddress', address, color, licenseHex);
    }).then((txId) => {
      self.mint(1, 0);
      return txId;
    });
  }
}

module.exports = GcoinPresenter;
