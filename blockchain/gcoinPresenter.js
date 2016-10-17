const GcoinRpc = require('gcoind-rpc');
const co = require('co');

const slice = function slice(arr, start, end) {
  return Array.prototype.slice.call(arr, start, end);
};

class GcoinPresenter {
  constructor(config) {
    this.rpc = new GcoinRpc(config);
    for (const method of Object.keys(GcoinRpc.callspec)) {
      this[method] = GcoinPresenter.createGeneralRpcFunction(method);
      this[method.toLowerCase()] = GcoinPresenter.createGeneralRpcFunction(method);
    }
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

  getAddressBalance(address, callback) {
    const self = this;
    co(function* _() {
      const utxos = yield self.callRpc('gettxoutaddress', address);
      const balance = {};
      utxos.forEach((utxo) => {
        const currentBalance = balance[utxo.color] || 0;
        balance[utxo.color] = currentBalance + utxo.value;
      });

      if (typeof callback === 'function') {
        callback(null, balance);
      }
    }).catch((err) => {
      if (typeof callback === 'function') {
        callback(err);
      }
    });
  }

  static createGeneralRpcFunction(methodName) {
    return function rpc(...args) {
      const self = this;
      const callback = slice(args, args.length - 1)[0];
      const rpcArgs = slice(args, 0, args.length - 1);
      rpcArgs.unshift(methodName);
      co(function* _() {
        const result = yield self.callRpc(...rpcArgs);
        if (typeof callback === 'function') {
          callback(null, result);
        }
      }).catch((err) => {
        if (typeof callback === 'function') {
          callback(err);
        }
      });
    };
  }
}

module.exports = GcoinPresenter;
