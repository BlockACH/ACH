const GcoinRpc = require('gcoind-rpc');
const co = require('co');

class GcoinPresenter {
  constructor(config) {
    this.rpc = new GcoinRpc(config);
    this.extendsRpcToGcoinPresenter();
  }

  extendsRpcToGcoinPresenter() {
    const rpcSpec = [
      'getInfo',
      'mint',
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

  getAddressBalance(address) {
    const self = this;
    return co(function* _() {
      const utxos = yield self.callRpc('gettxoutaddress', address);
      const balance = {};
      utxos.forEach((utxo) => {
        const currentBalance = balance[utxo.color] || 0;
        balance[utxo.color] = currentBalance + utxo.value;
      });
      return balance;
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
