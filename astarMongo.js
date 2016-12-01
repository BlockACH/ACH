'use strict';

const MongoClient = require('mongodb').MongoClient;
const config = require('./config.json');

module.exports = {
  connect: function astarMongoConnect(callback) {
    MongoClient.connect(config.mongodbUrl, (err, db) => {
      callback(err, db);
    });
  },
};
