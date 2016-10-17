const GcoinRpc = require('gcoind-rpc');
const co = require('co');

const slice = function slice(arr, start, end) {
  return Array.prototype.slice.call(arr, start, end);
};

class GcoinPresenter {
  constructor(config) {
    this.rpc = new GcoinRpc(config);
    this.extendsRpcToGcoinPresenter();
  }

  extendsRpcToGcoinPresenter() {
    const rpcSpec = [
      'decodeLicenseInfo',
      'encodeLicenseInfo',
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
}

module.exports = GcoinPresenter;
