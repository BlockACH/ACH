/*jshint esversion: 6 */
/*jslint node: true */
'use strict';
import co from 'co';
//const co = require('co');

function BlockchainController(rpc) {
  if (checkRpcObject(rpc)) {
    this.rpc = rpc;
  } else {
    throw new Error('invalid rpc object!');
  }
}

function checkRpcObject(rpc) {
  const rpcMethods = ['getinfo', 'gettxoutaddress'];

  rpcMethods.forEach(function(method) {
    if (typeof(rpc[method]) != 'function') {
      return false;
    }
  });

  return true;
}

var slice = function(arr, start, end) {
  return Array.prototype.slice.call(arr, start, end);
};

BlockchainController.prototype.callRpc = function(methodName) {
  const self = this;
  var args = slice(arguments, 1);
  return new Promise(function(resolve, reject) {
    // add callback function for rpc call
    args.push(function(err, ret) {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(ret.result);
      }
    });
    self.rpc[methodName].apply(self.rpc, args);
  });
};


BlockchainController.prototype.getAddressBalance = function(address, callback) {
  const self = this;
  co(function*() {
    let utxos = yield self.callRpc('gettxoutaddress', address);
    let balance = {};
    for (let i = 0; i < utxos.length; i++) {
      let currentBalance = balance[utxos[i].color] || 0;
      balance[utxos[i].color] = currentBalance + utxos[i].value;
    }
    if (typeof(callback) == 'function') {
      callback(null, balance);
    }
  }).catch(function(err) {
    if (typeof(callback) == 'function') {
      callback(err);
    }
  });
};



var RPC = require('gcoind-rpc');
const config = {
  protocol: 'http',
  user: 'gcoin',
  pass: 'abc123',
  host: 'oss1.diqi.us',
  port: '1126',
};

var rpc = new RPC(config);
var bc = new BlockchainController(rpc);
var count = 0;

function cb(err, ret) {
  console.log(count);
  count++;
  if (err) {
    console.log(err);
  } else {
    console.log(ret);
  }
}

function gogo(address) {
  return new Promise(function(resolve, reject) {
    // add callback function for rpc call
    bc.getAddressBalance(address, function(err, ret) {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(ret);
      }
    });
  });
}

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

// for (let j = 0; j < 500; j++) {
//   bc.getAddressBalance('13nf9WjwBWY5LY8yxVfmuDPtpowNgPTqNW', cb);
// }

co(function*() {
  for (let i = 0; i < 100; i++) {
    let balance = yield gogo('13nf9WjwBWY5LY8yxVfmuDPtpowNgPTqNW');
    count++;
    console.log(count);
    console.log(':)', balance);
  }
}).catch(function(err) {
  console.log(err);
});